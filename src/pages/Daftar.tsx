import SEO from "@/components/seo/SEO";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/hooks/use-language";
import { translations } from "@/lib/translations";
import { toast } from "@/components/ui/use-toast";
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
    alamatLengkap: "",
    provinsiId: "",
    kota: "",
    namaPemilik: "",
    nomorHpPemilik: "", // Renamed from kontakPemilik
    email: "",
    password: "",
    confirmPassword: "",
  });
  
  const [availableCities, setAvailableCities] = useState<City[]>([]);
  const [passwordError, setPasswordError] = useState("");
  const [currentStep, setCurrentStep] = useState(1);
  const navigate = useNavigate();

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
                  <label className="block text-sm font-medium mb-2">{lang === 'id' ? "Nama Bisnis" : "Business Name"}</label>
                  <input 
                    required 
                    className="w-full rounded-md border bg-background px-4 py-2.5 text-sm" 
                    value={form.namaBisnis} 
                    onChange={set('namaBisnis')} 
                    placeholder={lang === 'id' ? "PT Distributor Sejahtera" : "ABC Distribution Co."}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">{lang === 'id' ? "Alamat Lengkap Bisnis" : "Complete Business Address"}</label>
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
                    <label className="block text-sm font-medium mb-2">{lang === 'id' ? "Provinsi" : "Province"}</label>
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
                    <label className="block text-sm font-medium mb-2">{lang === 'id' ? "Kota/Kabupaten" : "City/Regency"}</label>
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

              <div className="mt-10 flex justify-end">
                <Button 
                  type="button" 
                  variant="hero" 
                  onClick={handleNext}
                  disabled={!validateStep1()}
                  className="px-6"
                >
                  {lang === 'id' ? "Selanjutnya" : "Next"}
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
                  <label className="block text-sm font-medium mb-2">{lang === 'id' ? "Buat Password" : "Create Password"}</label>
                  <input 
                    type="password" 
                    required 
                    className="w-full rounded-md border bg-background px-4 py-2.5 text-sm" 
                    value={form.password} 
                    onChange={(e) => {
                      setForm({ ...form, password: e.target.value });
                      if (form.confirmPassword && e.target.value !== form.confirmPassword) {
                        setPasswordError(lang === 'id' ? "Konfirmasi password tidak cocok" : "Password confirmation doesn't match");
                      } else {
                        setPasswordError("");
                      }
                    }}
                    minLength={6}
                    placeholder="••••••••"
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">{lang === 'id' ? "Minimal 6 karakter" : "Minimum 6 characters"}</p>
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
                  disabled={!!passwordError || form.password !== form.confirmPassword || form.password.length < 6}
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
