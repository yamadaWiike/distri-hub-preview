import SEO from "@/components/seo/SEO";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/hooks/use-language";
import { translations } from "@/lib/translations";
import { toast } from "@/components/ui/use-toast";
import { Upload, X, Loader2 } from "lucide-react";
import { uploadStorePhoto, getImageUrl } from "@/lib/s3-upload";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { provinces, getCitiesByProvince, City } from "@/data/indonesia";

export default function Daftar() {
  const { register } = useAuth();
  const { lang } = useLanguage();
  const t = translations[lang];
  const [form, setForm] = useState({
    namaBisnis: "",
    fotoToko: null as File | null,
    fotoTokoUrl: "", // URL from S3 after upload
    alamatLengkap: "",
    provinsiId: "",
    kota: "",
    namaPemilik: "",
    nomorHpPemilik: "", // Renamed from kontakPemilik
    email: "",
    password: "",
    confirmPassword: "",
    // Additional company information
    emailPerusahaan: "",
    nomorTelpPerusahaan: "",
    namaDirektur: "",
    statusPkp: "Non-PKP" as "PKP" | "Non-PKP",
    npwpNumber: "",
    nibNumber: "",
    // KYB Documents
    ktpFile: null as File | null,
    ktpUrl: "",
    aktaFile: null as File | null,
    aktaUrl: "",
    npwpFile: null as File | null,
    npwpUrl: "",
  });
  
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [ktpPreview, setKtpPreview] = useState<string | null>(null);
  const [aktaPreview, setAktaPreview] = useState<string | null>(null);
  const [npwpPreview, setNpwpPreview] = useState<string | null>(null);
  const [isUploadingKtp, setIsUploadingKtp] = useState(false);
  const [isUploadingAkta, setIsUploadingAkta] = useState(false);
  const [isUploadingNpwp, setIsUploadingNpwp] = useState(false);
  const [availableCities, setAvailableCities] = useState<City[]>([]);
  const [passwordError, setPasswordError] = useState("");
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasLowercase: false,
    hasUppercase: false,
    hasNumber: false,
  });
  const [currentStep, setCurrentStep] = useState(1);
  const navigate = useNavigate();

  const validatePassword = (password: string) => {
    const validation = {
      minLength: password.length >= 8,
      hasLowercase: /[a-z]/.test(password),
      hasUppercase: /[A-Z]/.test(password),
      hasNumber: /[0-9]/.test(password),
    };
    setPasswordValidation(validation);
    return Object.values(validation).every(v => v);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      toast({
        title: lang === 'id' ? "Email Tidak Valid" : "Invalid Email",
        description: lang === 'id' ? "Format email tidak valid" : "Email format is not valid",
        variant: "destructive"
      });
      return;
    }
    
    // Validate password strength
    if (!validatePassword(form.password)) {
      toast({
        title: lang === 'id' ? "Password Tidak Valid" : "Invalid Password",
        description: lang === 'id' ? "Password harus memenuhi semua persyaratan" : "Password must meet all requirements",
        variant: "destructive"
      });
      return;
    }
    
    // Validate password confirmation
    if (form.password !== form.confirmPassword) {
      setPasswordError(lang === 'id' ? "Konfirmasi password tidak cocok" : "Password confirmation doesn't match");
      return;
    }
    
    await register({
      email: form.email,
      password: form.password,
      namaBisnis: form.namaBisnis,
      alamatLengkap: form.alamatLengkap,
      provinsiId: form.provinsiId,
      kota: form.kota,
      namaPemilik: form.namaPemilik,
      kontakPemilik: form.nomorHpPemilik, // Using the renamed field but keeping the API parameter name
      // Additional company information
      emailPerusahaan: form.emailPerusahaan,
      nomorTelpPerusahaan: form.nomorTelpPerusahaan,
      namaDirektur: form.namaDirektur,
      statusPkp: form.statusPkp,
      npwpNumber: form.npwpNumber,
      nibNumber: form.nibNumber,
      // KYB Documents
      storePhotoUrl: form.fotoTokoUrl,
      ktpUrl: form.ktpUrl,
      aktaUrl: form.aktaUrl,
      npwpUrl: form.npwpUrl,
    });
    navigate('/daftar-produk');
  };

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });
  
  const setSelectValue = (k: string) => (value: string) => setForm({ ...form, [k]: value });
  
  // Update available cities when province changes
  useEffect(() => {
    if (form.provinsiId) {
      const citiesList = getCitiesByProvince(form.provinsiId);
      setAvailableCities(citiesList);
      // Reset the city selection when changing province
      setForm(prev => ({ ...prev, kota: "" }));
    }
  }, [form.provinsiId]);

  // Functions to handle step navigation
  const nextStep = () => setCurrentStep(current => Math.min(current + 1, 3));
  const prevStep = () => setCurrentStep(current => Math.max(current - 1, 1));
  
  // Step validation
  const validateStep1 = () => {
    if (!form.namaBisnis.trim()) return false;
    if (!form.fotoToko) return false;
    if (!form.alamatLengkap.trim()) return false;
    if (!form.provinsiId) return false;
    if (!form.kota) return false;
    // KYB Documents validation
    if (!form.ktpFile) return false;
    if (!form.aktaFile) return false;
    if (!form.npwpFile) return false;
    // Additional company information validation
    if (!form.emailPerusahaan.trim()) return false;
    if (!form.nomorTelpPerusahaan.trim()) return false;
    if (!form.namaDirektur.trim()) return false;
    if (!form.npwpNumber.trim()) return false;
    if (!form.nibNumber.trim()) return false;
    return true;
  };
  
  const validateStep2 = () => {
    if (!form.namaPemilik.trim()) return false;
    if (!form.nomorHpPemilik.trim() || form.nomorHpPemilik.length < 10) return false;
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) return false;
    
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      nextStep();
    } else if (currentStep === 2 && validateStep2()) {
      nextStep();
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: lang === 'id' ? "File Tidak Valid" : "Invalid File",
          description: lang === 'id' ? "Hanya file gambar yang diperbolehkan" : "Only image files are allowed",
          variant: "destructive"
        });
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: lang === 'id' ? "File Terlalu Besar" : "File Too Large",
          description: lang === 'id' ? "Ukuran file maksimal 5MB" : "Maximum file size is 5MB",
          variant: "destructive"
        });
        return;
      }
      
      // Upload to S3 or localStorage
      setIsUploadingPhoto(true);
      try {
        const result = await uploadStorePhoto(file);
        
        if (result.success && result.url) {
          // Get the actual URL for preview
          const previewUrl = getImageUrl(result.url);
          
          setForm({ ...form, fotoToko: file, fotoTokoUrl: result.url });
          setPhotoPreview(previewUrl);
          
          toast({
            title: lang === 'id' ? "Foto Berhasil Diunggah" : "Photo Uploaded Successfully",
            description: lang === 'id' ? "Foto toko Anda telah disimpan" : "Your store photo has been saved",
          });
        } else {
          throw new Error(result.error || 'Upload failed');
        }
      } catch (error) {
        console.error('Upload error:', error);
        toast({
          title: lang === 'id' ? "Gagal Mengunggah Foto" : "Failed to Upload Photo",
          description: lang === 'id' ? "Terjadi kesalahan saat mengunggah foto" : "An error occurred while uploading the photo",
          variant: "destructive"
        });
        setPhotoPreview(null);
      } finally {
        setIsUploadingPhoto(false);
      }
    }
  };

  const removePhoto = () => {
    setForm({ ...form, fotoToko: null, fotoTokoUrl: "" });
    setPhotoPreview(null);
  };

  // KYB Document Handlers
  const handleKtpUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: lang === 'id' ? "File Tidak Valid" : "Invalid File",
          description: lang === 'id' ? "Hanya file gambar yang diperbolehkan" : "Only image files are allowed",
          variant: "destructive"
        });
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: lang === 'id' ? "File Terlalu Besar" : "File Too Large",
          description: lang === 'id' ? "Ukuran file maksimal 5MB" : "Maximum file size is 5MB",
          variant: "destructive"
        });
        return;
      }
      
      setIsUploadingKtp(true);
      try {
        const result = await uploadStorePhoto(file, 'ktp');
        if (result.success && result.url) {
          const previewUrl = getImageUrl(result.url);
          setForm({ ...form, ktpFile: file, ktpUrl: result.url });
          setKtpPreview(previewUrl);
          toast({
            title: lang === 'id' ? "KTP Berhasil Diunggah" : "ID Card Uploaded Successfully",
            description: lang === 'id' ? "Foto KTP Anda telah disimpan" : "Your ID card has been saved",
          });
        } else {
          throw new Error(result.error || 'Upload failed');
        }
      } catch (error) {
        console.error('Upload error:', error);
        toast({
          title: lang === 'id' ? "Gagal Mengunggah KTP" : "Failed to Upload ID Card",
          description: lang === 'id' ? "Terjadi kesalahan saat mengunggah KTP" : "An error occurred while uploading the ID card",
          variant: "destructive"
        });
        setKtpPreview(null);
      } finally {
        setIsUploadingKtp(false);
      }
    }
  };

  const handleAktaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        toast({
          title: lang === 'id' ? "File Tidak Valid" : "Invalid File",
          description: lang === 'id' ? "Hanya file gambar atau PDF yang diperbolehkan" : "Only image or PDF files are allowed",
          variant: "destructive"
        });
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: lang === 'id' ? "File Terlalu Besar" : "File Too Large",
          description: lang === 'id' ? "Ukuran file maksimal 10MB" : "Maximum file size is 10MB",
          variant: "destructive"
        });
        return;
      }
      
      setIsUploadingAkta(true);
      try {
        const result = await uploadStorePhoto(file, 'akta');
        if (result.success && result.url) {
          const previewUrl = file.type === 'application/pdf' ? '/pdf-icon.svg' : getImageUrl(result.url);
          setForm({ ...form, aktaFile: file, aktaUrl: result.url });
          setAktaPreview(previewUrl);
          toast({
            title: lang === 'id' ? "Akta Berhasil Diunggah" : "Company Registration Uploaded Successfully",
            description: lang === 'id' ? "Dokumen Akta/NIB Anda telah disimpan" : "Your company registration document has been saved",
          });
        } else {
          throw new Error(result.error || 'Upload failed');
        }
      } catch (error) {
        console.error('Upload error:', error);
        toast({
          title: lang === 'id' ? "Gagal Mengunggah Akta" : "Failed to Upload Document",
          description: lang === 'id' ? "Terjadi kesalahan saat mengunggah dokumen" : "An error occurred while uploading the document",
          variant: "destructive"
        });
        setAktaPreview(null);
      } finally {
        setIsUploadingAkta(false);
      }
    }
  };

  const handleNpwpUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        toast({
          title: lang === 'id' ? "File Tidak Valid" : "Invalid File",
          description: lang === 'id' ? "Hanya file gambar atau PDF yang diperbolehkan" : "Only image or PDF files are allowed",
          variant: "destructive"
        });
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: lang === 'id' ? "File Terlalu Besar" : "File Too Large",
          description: lang === 'id' ? "Ukuran file maksimal 10MB" : "Maximum file size is 10MB",
          variant: "destructive"
        });
        return;
      }
      
      setIsUploadingNpwp(true);
      try {
        const result = await uploadStorePhoto(file, 'npwp');
        if (result.success && result.url) {
          const previewUrl = file.type === 'application/pdf' ? '/pdf-icon.svg' : getImageUrl(result.url);
          setForm({ ...form, npwpFile: file, npwpUrl: result.url });
          setNpwpPreview(previewUrl);
          toast({
            title: lang === 'id' ? "NPWP Berhasil Diunggah" : "Tax ID Uploaded Successfully",
            description: lang === 'id' ? "Dokumen NPWP Anda telah disimpan" : "Your tax ID document has been saved",
          });
        } else {
          throw new Error(result.error || 'Upload failed');
        }
      } catch (error) {
        console.error('Upload error:', error);
        toast({
          title: lang === 'id' ? "Gagal Mengunggah NPWP" : "Failed to Upload Tax ID",
          description: lang === 'id' ? "Terjadi kesalahan saat mengunggah NPWP" : "An error occurred while uploading the tax ID",
          variant: "destructive"
        });
        setNpwpPreview(null);
      } finally {
        setIsUploadingNpwp(false);
      }
    }
  };

  const removeKtp = () => {
    setForm({ ...form, ktpFile: null, ktpUrl: "" });
    setKtpPreview(null);
  };

  const removeAkta = () => {
    setForm({ ...form, aktaFile: null, aktaUrl: "" });
    setAktaPreview(null);
  };

  const removeNpwp = () => {
    setForm({ ...form, npwpFile: null, npwpUrl: "" });
    setNpwpPreview(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title={lang === 'id' ? "Daftar | Baskit Distributor Hub" : "Register | Baskit Distributor Hub"}
        description={lang === 'id' 
          ? "Daftar untuk melihat harga distributor dan akses simulasi penuh."
          : "Register to view distributor prices and full simulation access."
        } 
      />
      <Navbar />
      <main className="container max-w-2xl mx-auto py-12 px-4 sm:px-6">
        <div className="mb-10">
          <h1 className="text-2xl font-bold text-center">{lang === 'id' ? "Pendaftaran Distributor" : "Distributor Registration"}</h1>
          <p className="text-muted-foreground text-center mt-2">
            {lang === 'id' ? "Lengkapi informasi untuk membuat akun distributor baru" : "Complete the information to create a new distributor account"}
          </p>
          
          {/* Progress indicator */}
          <div className="flex items-center justify-between mt-10 mb-8 px-4">
            <div className="flex-1">
              <div className={`h-2 rounded-l-full ${currentStep >= 1 ? "bg-primary" : "bg-gray-200"}`}></div>
            </div>
            <div className="flex items-center justify-center rounded-full w-8 h-8 border-2 border-primary text-sm font-medium bg-background mx-2 z-10">
              {currentStep > 1 ? "✓" : "1"}
            </div>
            <div className="flex-1">
              <div className={`h-2 ${currentStep >= 2 ? "bg-primary" : "bg-gray-200"}`}></div>
            </div>
            <div className="flex items-center justify-center rounded-full w-8 h-8 border-2 border-primary text-sm font-medium bg-background mx-2 z-10">
              {currentStep > 2 ? "✓" : "2"}
            </div>
            <div className="flex-1">
              <div className={`h-2 rounded-r-full ${currentStep >= 3 ? "bg-primary" : "bg-gray-200"}`}></div>
            </div>
            <div className="flex items-center justify-center rounded-full w-8 h-8 border-2 border-primary text-sm font-medium bg-background ml-2 z-10">
              {currentStep > 3 ? "✓" : "3"}
            </div>
          </div>
        </div>

        <form onSubmit={onSubmit} className="bg-card rounded-lg shadow-sm border border-gray-100">
          {/* Step 1: Business Information & KYB */}
          {currentStep === 1 && (
            <div className="p-8">
              <h2 className="text-xl font-semibold mb-2">{lang === 'id' ? "Informasi & Verifikasi Bisnis" : "Business Information & Verification"}</h2>
              <p className="text-sm text-muted-foreground mb-6">
                {lang === 'id' 
                  ? "Lengkapi informasi perusahaan dan upload dokumen verifikasi" 
                  : "Complete company information and upload verification documents"}
              </p>
              
              <div className="space-y-6">
                {/* Basic Business Info */}
                <div>
                  <h3 className="text-base font-semibold mb-4 pb-2 border-b">
                    {lang === 'id' ? "Data Perusahaan" : "Company Data"}
                  </h3>
                  
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {lang === 'id' ? "Nama Bisnis / Perusahaan" : "Business / Company Name"} <span className="text-red-500">*</span>
                      </label>
                      <input 
                        required 
                        className="w-full rounded-md border bg-background px-4 py-2.5 text-sm" 
                        value={form.namaBisnis} 
                        onChange={set('namaBisnis')} 
                        placeholder={lang === 'id' ? "PT Distributor Sejahtera" : "ABC Distribution Co."}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          {lang === 'id' ? "Email Perusahaan" : "Company Email"} <span className="text-red-500">*</span>
                        </label>
                        <input 
                          required 
                          type="email"
                          className="w-full rounded-md border bg-background px-4 py-2.5 text-sm" 
                          value={form.emailPerusahaan} 
                          onChange={set('emailPerusahaan')} 
                          placeholder={lang === 'id' ? "info@perusahaan.com" : "info@company.com"}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          {lang === 'id' ? "Nomor Telp Perusahaan" : "Company Phone Number"} <span className="text-red-500">*</span>
                        </label>
                        <input 
                          required 
                          type="tel"
                          className="w-full rounded-md border bg-background px-4 py-2.5 text-sm" 
                          value={form.nomorTelpPerusahaan} 
                          onChange={set('nomorTelpPerusahaan')} 
                          placeholder={lang === 'id' ? "021-1234567" : "021-1234567"}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {lang === 'id' ? "Nama Direktur" : "Director Name"} <span className="text-red-500">*</span>
                      </label>
                      <input 
                        required 
                        className="w-full rounded-md border bg-background px-4 py-2.5 text-sm" 
                        value={form.namaDirektur} 
                        onChange={set('namaDirektur')} 
                        placeholder={lang === 'id' ? "Nama lengkap direktur" : "Full director name"}
                      />
                    </div>
                  </div>
                </div>

                {/* Business Address */}
                <div>
                  <h3 className="text-base font-semibold mb-4 pb-2 border-b">
                    {lang === 'id' ? "Alamat Bisnis" : "Business Address"}
                  </h3>
                  
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {lang === 'id' ? "Alamat Lengkap" : "Complete Address"} <span className="text-red-500">*</span>
                      </label>
                      <textarea 
                        required 
                        className="w-full rounded-md border bg-background px-4 py-2.5 text-sm min-h-[80px]" 
                        value={form.alamatLengkap} 
                        onChange={(e) => setForm({ ...form, alamatLengkap: e.target.value })}
                        placeholder={lang === 'id' ? "Jl. Pahlawan No. 123, Kel. Sukajadi" : "123 Business St., Prosperity Building"}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          {lang === 'id' ? "Provinsi" : "Province"} <span className="text-red-500">*</span>
                        </label>
                        <Select value={form.provinsiId} onValueChange={setSelectValue('provinsiId')} required>
                          <SelectTrigger className="w-full h-10">
                            <SelectValue placeholder={lang === 'id' ? "Pilih Provinsi" : "Select Province"} />
                          </SelectTrigger>
                          <SelectContent>
                            {provinces.map((province) => (
                              <SelectItem key={province.id} value={province.id}>
                                {province.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          {lang === 'id' ? "Kota/Kabupaten" : "City/Regency"} <span className="text-red-500">*</span>
                        </label>
                        <Select value={form.kota} onValueChange={setSelectValue('kota')} disabled={!form.provinsiId} required>
                          <SelectTrigger className="w-full h-10">
                            <SelectValue placeholder={lang === 'id' ? "Pilih Kota/Kabupaten" : "Select City/Regency"} />
                          </SelectTrigger>
                          <SelectContent>
                            {availableCities.map((city) => (
                              <SelectItem key={city.id} value={city.name}>
                                {city.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Legal Documents & Tax Info */}
                <div>
                  <h3 className="text-base font-semibold mb-4 pb-2 border-b">
                    {lang === 'id' ? "Dokumen & Legalitas" : "Documents & Legality"}
                  </h3>
                  
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          {lang === 'id' ? "NPWP" : "Tax ID (NPWP)"} <span className="text-red-500">*</span>
                        </label>
                        <input 
                          required 
                          className="w-full rounded-md border bg-background px-4 py-2.5 text-sm" 
                          value={form.npwpNumber} 
                          onChange={set('npwpNumber')} 
                          placeholder="XX.XXX.XXX.X-XXX.XXX"
                          maxLength={20}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          {lang === 'id' ? "NIB" : "Business ID (NIB)"} <span className="text-red-500">*</span>
                        </label>
                        <input 
                          required 
                          className="w-full rounded-md border bg-background px-4 py-2.5 text-sm" 
                          value={form.nibNumber} 
                          onChange={set('nibNumber')} 
                          placeholder="XXXXXXXXXXXX"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {lang === 'id' ? "Status PKP" : "PKP Status"} <span className="text-red-500">*</span>
                      </label>
                      <Select 
                        value={form.statusPkp} 
                        onValueChange={(value: "PKP" | "Non-PKP") => setForm({ ...form, statusPkp: value })} 
                        required
                      >
                        <SelectTrigger className="w-full h-10">
                          <SelectValue placeholder={lang === 'id' ? "Pilih Status PKP" : "Select PKP Status"} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PKP">PKP (Pengusaha Kena Pajak)</SelectItem>
                          <SelectItem value="Non-PKP">Non-PKP</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">
                        {lang === 'id' 
                          ? "PKP wajib memungut PPN 11%" 
                          : "PKP must collect 11% VAT"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Document Uploads */}
                <div>
                  <h3 className="text-base font-semibold mb-4 pb-2 border-b">
                    {lang === 'id' ? "Upload Dokumen Verifikasi" : "Upload Verification Documents"}
                  </h3>
                  
                  <div className="space-y-5">
                    {/* Store Photo */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {lang === 'id' ? "Foto Toko / Gudang" : "Store / Warehouse Photo"} <span className="text-red-500">*</span>
                      </label>
                      
                      {!photoPreview ? (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-orange-400 transition-colors">
                          <input
                            type="file"
                            id="photo-upload"
                            className="hidden"
                            accept="image/png,image/jpeg,image/jpg"
                            onChange={handlePhotoUpload}
                            disabled={isUploadingPhoto}
                          />
                          <label htmlFor="photo-upload" className="cursor-pointer">
                            {isUploadingPhoto ? (
                              <Loader2 className="h-5 w-5 text-orange-500 animate-spin mx-auto mb-2" />
                            ) : (
                              <Upload className="h-5 w-5 text-orange-500 mx-auto mb-2" />
                            )}
                            <p className="text-sm text-orange-500 font-medium">
                              {isUploadingPhoto 
                                ? (lang === 'id' ? "Mengunggah..." : "Uploading...") 
                                : (lang === 'id' ? "Klik untuk upload" : "Click to upload")
                              }
                            </p>
                            <p className="text-xs text-gray-400 mt-1">PNG, JPG, JPEG (max. 5MB)</p>
                          </label>
                        </div>
                      ) : (
                        <div className="relative inline-block">
                          <img 
                            src={photoPreview} 
                            alt="Store preview" 
                            className="rounded-lg border border-gray-200 w-48 h-32 object-cover"
                          />
                          <button
                            type="button"
                            onClick={removePhoto}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {lang === 'id' ? "Foto tampak depan toko atau gudang" : "Front view of store or warehouse"}
                      </p>
                    </div>

                    {/* KTP Upload */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {lang === 'id' ? "KTP Direktur / Pemilik" : "Director / Owner ID Card"} <span className="text-red-500">*</span>
                      </label>
                      
                      {!ktpPreview ? (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-orange-400 transition-colors">
                          <input
                            type="file"
                            id="ktp-upload"
                            className="hidden"
                            accept="image/png,image/jpeg,image/jpg"
                            onChange={handleKtpUpload}
                            disabled={isUploadingKtp}
                          />
                          <label htmlFor="ktp-upload" className="cursor-pointer">
                            {isUploadingKtp ? (
                              <Loader2 className="h-5 w-5 text-orange-500 animate-spin mx-auto mb-2" />
                            ) : (
                              <Upload className="h-5 w-5 text-orange-500 mx-auto mb-2" />
                            )}
                            <p className="text-sm text-orange-500 font-medium">
                              {isUploadingKtp 
                                ? (lang === 'id' ? "Mengunggah..." : "Uploading...") 
                                : (lang === 'id' ? "Upload KTP" : "Upload ID Card")
                              }
                            </p>
                            <p className="text-xs text-gray-400 mt-1">PNG, JPG, JPEG (max. 5MB)</p>
                          </label>
                        </div>
                      ) : (
                        <div className="relative inline-block">
                          <img 
                            src={ktpPreview} 
                            alt="KTP preview" 
                            className="rounded-lg border border-gray-200 w-48 h-32 object-cover"
                          />
                          <button
                            type="button"
                            onClick={removeKtp}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Akta/NIB Upload */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {lang === 'id' ? "Akta Pendirian / NIB" : "Company Registration / NIB"} <span className="text-red-500">*</span>
                      </label>
                      
                      {!aktaPreview ? (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-orange-400 transition-colors">
                          <input
                            type="file"
                            id="akta-upload"
                            className="hidden"
                            accept="image/png,image/jpeg,image/jpg,application/pdf"
                            onChange={handleAktaUpload}
                            disabled={isUploadingAkta}
                          />
                          <label htmlFor="akta-upload" className="cursor-pointer">
                            {isUploadingAkta ? (
                              <Loader2 className="h-5 w-5 text-orange-500 animate-spin mx-auto mb-2" />
                            ) : (
                              <Upload className="h-5 w-5 text-orange-500 mx-auto mb-2" />
                            )}
                            <p className="text-sm text-orange-500 font-medium">
                              {isUploadingAkta 
                                ? (lang === 'id' ? "Mengunggah..." : "Uploading...") 
                                : (lang === 'id' ? "Upload Dokumen" : "Upload Document")
                              }
                            </p>
                            <p className="text-xs text-gray-400 mt-1">PNG, JPG, JPEG, PDF (max. 10MB)</p>
                          </label>
                        </div>
                      ) : (
                        <div className="relative inline-block">
                          <img 
                            src={aktaPreview} 
                            alt="Akta preview" 
                            className="rounded-lg border border-gray-200 w-48 h-32 object-cover"
                          />
                          <button
                            type="button"
                            onClick={removeAkta}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* NPWP Upload */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {lang === 'id' ? "Dokumen NPWP" : "Tax ID Document (NPWP)"} <span className="text-red-500">*</span>
                      </label>
                      
                      {!npwpPreview ? (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-orange-400 transition-colors">
                          <input
                            type="file"
                            id="npwp-upload"
                            className="hidden"
                            accept="image/png,image/jpeg,image/jpg,application/pdf"
                            onChange={handleNpwpUpload}
                            disabled={isUploadingNpwp}
                          />
                          <label htmlFor="npwp-upload" className="cursor-pointer">
                            {isUploadingNpwp ? (
                              <Loader2 className="h-5 w-5 text-orange-500 animate-spin mx-auto mb-2" />
                            ) : (
                              <Upload className="h-5 w-5 text-orange-500 mx-auto mb-2" />
                            )}
                            <p className="text-sm text-orange-500 font-medium">
                              {isUploadingNpwp 
                                ? (lang === 'id' ? "Mengunggah..." : "Uploading...") 
                                : (lang === 'id' ? "Upload NPWP" : "Upload Tax ID")
                              }
                            </p>
                            <p className="text-xs text-gray-400 mt-1">PNG, JPG, JPEG, PDF (max. 10MB)</p>
                          </label>
                        </div>
                      ) : (
                        <div className="relative inline-block">
                          <img 
                            src={npwpPreview} 
                            alt="NPWP preview" 
                            className="rounded-lg border border-gray-200 w-48 h-32 object-cover"
                          />
                          <button
                            type="button"
                            onClick={removeNpwp}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-10 flex justify-between">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => navigate(-1)}
                  className="px-6"
                >
                  {lang === 'id' ? "Kembali" : "Back"}
                </Button>
                <Button 
                  type="button" 
                  className="bg-orange-500 hover:bg-orange-600 text-white px-6"
                  onClick={handleNext}
                  disabled={!validateStep1()}
                >
                  {lang === 'id' ? "Selanjutnya →" : "Next →"}
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Owner Information */}
          {currentStep === 2 && (
            <div className="p-8">
              <h2 className="text-xl font-semibold mb-6">{lang === 'id' ? "Informasi Pemilik" : "Owner Information"}</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">{lang === 'id' ? "Nama Pemilik" : "Owner Name"}</label>
                  <input 
                    required 
                    className="w-full rounded-md border bg-background px-4 py-2.5 text-sm" 
                    value={form.namaPemilik} 
                    onChange={set('namaPemilik')}
                    placeholder={lang === 'id' ? "Budi Santoso" : "John Smith"}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">{lang === 'id' ? "Nomor HP Pemilik" : "Owner's Mobile Phone"}</label>
                  <input 
                    required 
                    className="w-full rounded-md border bg-background px-4 py-2.5 text-sm" 
                    value={form.nomorHpPemilik} 
                    onChange={(e) => {
                      const value = e.target.value;
                      if ((/^\d*$/).test(value) && value.length <= 13) {
                        setForm({ ...form, nomorHpPemilik: value });
                      }
                    }}
                    type="tel"
                    placeholder="08123456789"
                    maxLength={13}
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">{lang === 'id' ? "Format: 08XXXXXXXXXX (10-13 digit)" : "Format: 08XXXXXXXXXX (10-13 digits)"}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">{lang === 'id' ? "Email Pemilik" : "Owner Email"}</label>
                  <input 
                    type="email" 
                    required 
                    className="w-full rounded-md border bg-background px-4 py-2.5 text-sm" 
                    value={form.email} 
                    onChange={set('email')}
                    pattern="[^\\s@]+@[^\\s@]+\\.[^\\s@]+" 
                    title={lang === 'id' ? "Masukkan format email yang valid" : "Enter a valid email format"}
                    placeholder="email@example.com"
                  />
                </div>
              </div>

              <div className="mt-10 flex justify-between">
                <Button type="button" variant="outline" onClick={prevStep} className="px-6">
                  {lang === 'id' ? "Kembali" : "Back"}
                </Button>
                <Button 
                  type="button" 
                  variant="hero" 
                  onClick={handleNext}
                  disabled={!validateStep2()}
                  className="px-6"
                >
                  {lang === 'id' ? "Selanjutnya" : "Next"}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Account Security */}
          {currentStep === 3 && (
            <div className="p-8">
              <h2 className="text-xl font-semibold mb-6">{lang === 'id' ? "Keamanan Akun" : "Account Security"}</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">{lang === 'id' ? "Buat Password" : "Create Password"} <span className="text-red-500">*</span></label>
                  <input 
                    type="password" 
                    required 
                    className="w-full rounded-md border bg-background px-4 py-2.5 text-sm" 
                    value={form.password} 
                    onChange={(e) => {
                      const newPassword = e.target.value;
                      setForm({ ...form, password: newPassword });
                      validatePassword(newPassword);
                      if (form.confirmPassword && newPassword !== form.confirmPassword) {
                        setPasswordError(lang === 'id' ? "Konfirmasi password tidak cocok" : "Password confirmation doesn't match");
                      } else {
                        setPasswordError("");
                      }
                    }}
                    placeholder="••••••••"
                  />
                  
                  {/* Password Requirements */}
                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      {lang === 'id' ? "Password harus mengandung:" : "Password must contain:"}
                    </p>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${
                          passwordValidation.minLength ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                        }`}>
                          {passwordValidation.minLength ? '✓' : '○'}
                        </div>
                        <span className={`text-xs ${
                          passwordValidation.minLength ? 'text-green-600' : 'text-muted-foreground'
                        }`}>
                          {lang === 'id' ? 'Minimal 8 karakter' : 'At least 8 characters'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${
                          passwordValidation.hasLowercase ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                        }`}>
                          {passwordValidation.hasLowercase ? '✓' : '○'}
                        </div>
                        <span className={`text-xs ${
                          passwordValidation.hasLowercase ? 'text-green-600' : 'text-muted-foreground'
                        }`}>
                          {lang === 'id' ? 'Huruf kecil (a-z)' : 'Lowercase letter (a-z)'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${
                          passwordValidation.hasUppercase ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                        }`}>
                          {passwordValidation.hasUppercase ? '✓' : '○'}
                        </div>
                        <span className={`text-xs ${
                          passwordValidation.hasUppercase ? 'text-green-600' : 'text-muted-foreground'
                        }`}>
                          {lang === 'id' ? 'Huruf besar (A-Z)' : 'Uppercase letter (A-Z)'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${
                          passwordValidation.hasNumber ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                        }`}>
                          {passwordValidation.hasNumber ? '✓' : '○'}
                        </div>
                        <span className={`text-xs ${
                          passwordValidation.hasNumber ? 'text-green-600' : 'text-muted-foreground'
                        }`}>
                          {lang === 'id' ? 'Angka (0-9)' : 'Number (0-9)'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">{lang === 'id' ? "Konfirmasi Password" : "Confirm Password"}</label>
                  <input 
                    type="password" 
                    required 
                    className={`w-full rounded-md border ${passwordError ? "border-red-500" : "border-input"} bg-background px-4 py-2.5 text-sm`} 
                    value={form.confirmPassword} 
                    onChange={(e) => {
                      setForm({ ...form, confirmPassword: e.target.value });
                      if (form.password !== e.target.value) {
                        setPasswordError(lang === 'id' ? "Konfirmasi password tidak cocok" : "Password confirmation doesn't match");
                      } else {
                        setPasswordError("");
                      }
                    }}
                    placeholder="••••••••"
                  />
                  {passwordError && <p className="text-xs text-red-500 mt-1.5">{passwordError}</p>}
                </div>
                
                <div className="mt-6">
                  <p className="text-sm text-muted-foreground">
                    {lang === 'id' 
                      ? "Dengan mendaftar, Anda menyetujui Syarat & Ketentuan dan Kebijakan Privasi kami."
                      : "By registering, you agree to our Terms & Conditions and Privacy Policy."}
                  </p>
                </div>
              </div>

              <div className="mt-10 flex justify-between">
                <Button type="button" variant="outline" onClick={prevStep} className="px-6">
                  {lang === 'id' ? "Kembali" : "Back"}
                </Button>
                <Button 
                  type="submit" 
                  variant="hero"
                  disabled={
                    !!passwordError || 
                    form.password !== form.confirmPassword || 
                    !passwordValidation.minLength ||
                    !passwordValidation.hasLowercase ||
                    !passwordValidation.hasUppercase ||
                    !passwordValidation.hasNumber
                  }
                  className="px-6"
                >
                  {lang === 'id' ? "Daftar Sekarang" : "Register Now"}
                </Button>
              </div>
            </div>
          )}
        </form>
      </main>
    </div>
  );
}
