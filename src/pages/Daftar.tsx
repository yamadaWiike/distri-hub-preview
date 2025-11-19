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
  });
  
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
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
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-orange-400 transition-colors">
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
                          <div className="mx-auto w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mb-3">
                            <Loader2 className="h-6 w-6 text-orange-500 animate-spin" />
                          </div>
                        ) : (
                          <div className="mx-auto w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mb-3">
                            <Upload className="h-6 w-6 text-orange-500" />
                          </div>
                        )}
                        <p className="text-orange-500 font-medium text-sm mb-1">
                          {isUploadingPhoto 
                            ? (lang === 'id' ? "Mengunggah..." : "Uploading...") 
                            : (lang === 'id' ? "Klik untuk upload" : "Click to upload")
                          }
                        </p>
                        <p className="text-gray-500 text-xs">
                          {lang === 'id' ? "atau drag & drop" : "or drag & drop"}
                        </p>
                        <p className="text-gray-400 text-xs mt-2">
                          PNG, JPG, JPEG (max. 5MB)
                        </p>
                      </label>
                    </div>
                  ) : (
                    <div className="relative inline-block">
                      <img 
                        src={photoPreview} 
                        alt="Store preview" 
                        className="rounded-lg border border-gray-200 w-48 h-48 object-cover"
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
                    {lang === 'id' ? "Upload foto tampak depan atau kilo untuk verifikasi" : "Upload front or kilo photo for verification"}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {lang === 'id' ? "Alamat Lengkap Bisnis" : "Complete Business Address"} <span className="text-red-500">*</span>
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
