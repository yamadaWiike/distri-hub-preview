// React & Router
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// External Libraries & Icons
import { Upload, X, Loader2, Eye, EyeOff } from "lucide-react";

// UI Components
import SEO from "@/components/seo/SEO";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Hooks
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";

// Utils, Data & API
import { translations } from "@/lib/translations";
import { uploadStorePhoto, getImageUrl } from "@/lib/s3-upload";
import {
  fetchProvinces,
  fetchRegenciesByProvince,
  fetchDistrictsByRegency,
  Province,
  Regency,
  District,
} from "@/data/indonesiaRegions";

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
    provinsiName: "",
    regencyId: "",
    regencyName: "",
    districtId: "",
    districtName: "",
    kota: "", // Keep for backward compatibility
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
  
  // Address data states
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [regencies, setRegencies] = useState<Regency[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [isLoadingProvinces, setIsLoadingProvinces] = useState(false);
  const [isLoadingRegencies, setIsLoadingRegencies] = useState(false);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
  
  const [passwordError, setPasswordError] = useState("");
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasLowercase: false,
    hasUppercase: false,
    hasNumber: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
    
    try {
      await register({
        email: form.email,
        password: form.password,
        namaBisnis: form.namaBisnis,
        alamatLengkap: form.alamatLengkap,
        provinsiId: form.provinsiId,
        provinceName: form.provinsiName,
        regencyId: form.regencyId,
        regencyName: form.regencyName,
        districtId: form.districtId,
        districtName: form.districtName,
        kota: form.regencyName, // Keep for backward compatibility
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
    } catch (error) {
      console.error('Registration error:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('User already registered') || error.message.includes('already been registered')) {
          toast({
            title: lang === 'id' ? "Email Sudah Terdaftar" : "Email Already Registered",
            description: lang === 'id' 
              ? "Email ini sudah terdaftar. Silakan gunakan email lain atau masuk dengan akun yang sudah ada." 
              : "This email is already registered. Please use a different email or sign in with your existing account.",
            variant: "destructive"
          });
        } else if (error.message.includes('Invalid email') || error.message.includes('email')) {
          toast({
            title: lang === 'id' ? "Email Tidak Valid" : "Invalid Email",
            description: lang === 'id' 
              ? "Format email tidak valid. Silakan periksa kembali." 
              : "Invalid email format. Please check and try again.",
            variant: "destructive"
          });
        } else if (error.message.includes('Password') || error.message.includes('password')) {
          toast({
            title: lang === 'id' ? "Password Tidak Valid" : "Invalid Password",
            description: lang === 'id' 
              ? "Password harus minimal 8 karakter dan mengandung kombinasi huruf dan angka." 
              : "Password must be at least 8 characters with letters and numbers.",
            variant: "destructive"
          });
        } else {
          toast({
            title: lang === 'id' ? "Gagal Mendaftar" : "Registration Failed",
            description: lang === 'id' 
              ? "Terjadi kesalahan saat mendaftar. Silakan coba lagi." 
              : "An error occurred during registration. Please try again.",
            variant: "destructive"
          });
        }
      }
      
      setIsSubmitting(false);
    }
  };

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });
  
  const setSelectValue = (k: string) => (value: string) => setForm({ ...form, [k]: value });
  
  // Load provinces on component mount
  useEffect(() => {
    const loadProvinces = async () => {
      setIsLoadingProvinces(true);
      const data = await fetchProvinces();
      setProvinces(data);
      setIsLoadingProvinces(false);
    };
    loadProvinces();
  }, []);

  // Load regencies when province changes
  useEffect(() => {
    const loadRegencies = async () => {
      if (form.provinsiId) {
        setIsLoadingRegencies(true);
        const data = await fetchRegenciesByProvince(form.provinsiId);
        setRegencies(data);
        setIsLoadingRegencies(false);
        // Reset regency and district when province changes
        setForm(prev => ({ 
          ...prev, 
          regencyId: "", 
          regencyName: "",
          districtId: "",
          districtName: "",
          kota: "" 
        }));
        setDistricts([]);
      } else {
        setRegencies([]);
        setDistricts([]);
      }
    };
    loadRegencies();
  }, [form.provinsiId]);

  // Load districts when regency changes
  useEffect(() => {
    const loadDistricts = async () => {
      if (form.regencyId) {
        setIsLoadingDistricts(true);
        const data = await fetchDistrictsByRegency(form.regencyId);
        setDistricts(data);
        setIsLoadingDistricts(false);
        // Reset district when regency changes
        setForm(prev => ({ 
          ...prev, 
          districtId: "",
          districtName: "" 
        }));
      } else {
        setDistricts([]);
      }
    };
    loadDistricts();
  }, [form.regencyId]);

  // Functions to handle step navigation
  const nextStep = () => setCurrentStep(current => Math.min(current + 1, 3));
  const prevStep = () => setCurrentStep(current => Math.max(current - 1, 1));
  
  // Step validation
  const validateStep1 = () => {
    if (!form.namaBisnis.trim()) return false;
    if (!form.fotoToko) return false;
    if (!form.alamatLengkap.trim()) return false;
    if (!form.provinsiId) return false;
    if (!form.regencyId) return false;
    if (!form.districtId) return false;
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
        const result = await uploadStorePhoto(file);
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
        const result = await uploadStorePhoto(file);
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
        const result = await uploadStorePhoto(file);
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
          {/* Step 1: Business Information */}
          {currentStep === 1 && (
            <div className="p-8">
              <h2 className="text-xl font-semibold mb-6">{lang === 'id' ? "Informasi Bisnis" : "Business Information"}</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {lang === 'id' ? "Nama Bisnis" : "Business Name"} <span className="text-red-500">*</span>
                  </label>
                  <input 
                    required 
                    className="w-full rounded-md border bg-background px-4 py-2.5 text-sm" 
                    value={form.namaBisnis} 
                    onChange={set('namaBisnis')} 
                    placeholder={lang === 'id' ? "PT Distributor Sejahtera" : "ABC Distribution Co."}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {lang === 'id' ? "Foto Toko" : "Store Photo"} <span className="text-red-500">*</span>
                  </label>
                  
                  {!photoPreview ? (
                    <div className="border-2 border-dashed border-orange-300 rounded-lg p-8 text-center hover:border-orange-400 transition-colors cursor-pointer">
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
                          <Loader2 className="h-12 w-12 text-orange-500 animate-spin mx-auto mb-3" />
                        ) : (
                          <Upload className="h-12 w-12 text-orange-500 mx-auto mb-3" />
                        )}
                        <p className="text-sm text-orange-500 font-medium mb-1">
                          {isUploadingPhoto 
                            ? (lang === 'id' ? "Mengunggah..." : "Uploading...") 
                            : (lang === 'id' ? "Klik untuk upload" : "Click to upload")
                          }
                        </p>
                        <p className="text-xs text-muted-foreground mb-1">
                          {lang === 'id' ? "atau drag & drop" : "or drag & drop"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          PNG, JPG, JPEG (maks. 5MB)
                        </p>
                      </label>
                    </div>
                  ) : (
                    <div className="relative inline-block">
                      <img 
                        src={photoPreview} 
                        alt="Store preview" 
                        className="rounded-lg border border-gray-200 w-full max-w-xs h-48 object-cover"
                      />
                      <button
                        type="button"
                        onClick={removePhoto}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors shadow-lg"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    {lang === 'id' 
                      ? "Upload foto tampak depan toko untuk verifikasi" 
                      : "Upload front view of store photo for verification"}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {lang === 'id' ? "Alamat Lengkap Bisnis" : "Complete Business Address"} <span className="text-red-500">*</span>
                  </label>
                  <textarea 
                    required 
                    className="w-full rounded-md border bg-background px-4 py-2.5 text-sm min-h-[100px]" 
                    value={form.alamatLengkap} 
                    onChange={(e) => setForm({ ...form, alamatLengkap: e.target.value })}
                    placeholder={lang === 'id' ? "Jl. Pahlawan No. 123, Kel. Sukajadi" : "123 Business St., Prosperity District"}
                  />
                </div>
                
                <div className="grid grid-cols-1 gap-5">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {lang === 'id' ? "Provinsi" : "Province"} <span className="text-red-500">*</span>
                    </label>
                    <Select 
                      value={form.provinsiId} 
                      onValueChange={(value) => {
                        const selectedProvince = provinces.find(p => String(p.id) === String(value));
                        setForm({ 
                          ...form, 
                          provinsiId: value,
                          provinsiName: selectedProvince?.name || ""
                        });
                      }} 
                      required
                      disabled={isLoadingProvinces}
                    >
                      <SelectTrigger className="w-full h-10">
                        <SelectValue placeholder={lang === 'id' ? "Pilih Provinsi" : "Select Province"} />
                      </SelectTrigger>
                      <SelectContent>
                        {provinces.map((province) => (
                          <SelectItem key={province.id} value={String(province.id)}>
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
                    <Select 
                      value={form.regencyId} 
                      onValueChange={(value) => {
                        const selectedRegency = regencies.find(r => String(r.id) === String(value));
                        setForm({ 
                          ...form, 
                          regencyId: value,
                          regencyName: selectedRegency?.name || "",
                          kota: selectedRegency?.name || "" // For backward compatibility
                        });
                      }} 
                      disabled={!form.provinsiId || isLoadingRegencies} 
                      required
                    >
                      <SelectTrigger className="w-full h-10">
                        <SelectValue placeholder={lang === 'id' ? "Pilih Kota/Kabupaten" : "Select City/Regency"} />
                      </SelectTrigger>
                      <SelectContent>
                        {regencies.map((regency) => (
                          <SelectItem key={regency.id} value={String(regency.id)}>
                            {regency.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {lang === 'id' ? "Kecamatan" : "District"} <span className="text-red-500">*</span>
                    </label>
                    <Select 
                      value={form.districtId} 
                      onValueChange={(value) => {
                        const selectedDistrict = districts.find(d => String(d.id) === String(value));
                        setForm({ 
                          ...form, 
                          districtId: value,
                          districtName: selectedDistrict?.name || ""
                        });
                      }} 
                      disabled={!form.regencyId || isLoadingDistricts} 
                      required
                    >
                      <SelectTrigger className="w-full h-10">
                        <SelectValue placeholder={lang === 'id' ? "Pilih Kecamatan" : "Select District"} />
                      </SelectTrigger>
                      <SelectContent>
                        {districts.map((district) => (
                          <SelectItem key={district.id} value={String(district.id)}>
                            {district.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="mt-10 flex justify-between items-center">
                <Button 
                  type="button" 
                  variant="ghost"
                  onClick={() => navigate(-1)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ← {lang === 'id' ? "Kembali" : "Back"}
                </Button>
                <Button 
                  type="button" 
                  className="bg-orange-500 hover:bg-orange-600 text-white px-8"
                  onClick={handleNext}
                  disabled={!validateStep1()}
                >
                  {lang === 'id' ? "Selanjutnya" : "Next"} →
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
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"}
                      required 
                      className="w-full rounded-md border bg-background px-4 py-2.5 pr-12 text-sm" 
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
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  
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
                  <div className="relative">
                    <input 
                      type={showConfirmPassword ? "text" : "password"}
                      required 
                      className={`w-full rounded-md border ${passwordError ? "border-red-500" : "border-input"} bg-background px-4 py-2.5 pr-12 text-sm`} 
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
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
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
