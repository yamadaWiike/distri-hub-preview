
import SEO from "@/components/seo/SEO";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, MapPin } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/components/ui/use-toast";
import { Database } from "@/integrations/supabase/types";
import type { PostgrestResponse } from '@supabase/supabase-js';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import MapSelector from "@/components/ui/map-selector";
import 'leaflet/dist/leaflet.css';
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/lib/translations";

export default function Profil() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const t = translations[lang];
  const [form, setForm] = useState({
    // Required fields in database
    nama_bisnis: "",
    alamat_lengkap: "",
    kota: "",
    nama_pemilik: "",
    kontak_pemilik: "",
    
    // Optional fields in database
    omzet: "",
    alamat_kantor: "",
    alamat_gudang: "",
    bentuk_usaha: "",
    foto_gudang: "",
    koordinat: "",
    nib: "",
    
    // Additional fields we're adding to the form
    email_pemilik: "", // Match database field
    npwp: "",
    website_perusahaan: "",
    jumlah_karyawan: "",
  });
  
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [mapDialogOpen, setMapDialogOpen] = useState(false);
  const [selectedCoordinates, setSelectedCoordinates] = useState<[number, number] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load profile data from Supabase if user is logged in
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user || !user.id) return;
      
      try {
        setIsLoading(true);
        // Import supabase client
        const { supabase } = await import('@/integrations/supabase/client');
        
        // Fetch profile data
        const { data, error } = await supabase
          .from('distributor_profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle<Database['public']['Tables']['distributor_profiles']['Row']>();
          
        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching profile:', error);
          return;
        }
        
        // If we have data, populate the form
        if (data) {
          setForm({
            nama_bisnis: data.nama_bisnis || "",
            alamat_lengkap: data.alamat_lengkap || "",
            kota: data.kota || "",
            nama_pemilik: data.nama_pemilik || "",
            kontak_pemilik: data.kontak_pemilik || "",
            email_pemilik: data.email_pemilik || user.email || "", // Use from DB or fall back to user email
            omzet: data.omzet || "",
            alamat_kantor: data.alamat_kantor || "",
            alamat_gudang: data.alamat_gudang || "",
            bentuk_usaha: data.bentuk_usaha || "",
            foto_gudang: data.foto_gudang || "",
            koordinat: data.koordinat || "",
            nib: data.nib || "",
            // New fields added to the database
            npwp: data.npwp || "",
            website_perusahaan: data.website_perusahaan || "",
            jumlah_karyawan: data.jumlah_karyawan ? String(data.jumlah_karyawan) : "",
          });
        } else {
          // If no profile data yet but we have user data, prefill what we can
          setForm(prev => ({
            ...prev,
            nama_bisnis: user.namaBisnis || "",
            kota: user.kota || "",
            email_pemilik: user.email || "",
          }));
        }
      } catch (e) {
        console.error("Error loading profile data:", e);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfileData();
  }, [user]);
  
  // Also check localStorage as fallback
  useEffect(() => {
    if (!isLoading) {
      const savedProfile = localStorage.getItem('baskit_profile');
      if (savedProfile) {
        try {
          const parsedProfile = JSON.parse(savedProfile);
          // Only use localStorage data for fields that aren't already populated
          setForm(prev => {
            const updatedForm = { ...prev };
            Object.keys(parsedProfile).forEach(key => {
              // Only update empty fields or fields that aren't in the database schema
              if (!updatedForm[key as keyof typeof updatedForm] || 
                  ['npwp', 'website_perusahaan', 'jumlah_karyawan'].includes(key)) {
                // Use type assertion with specific object type
                (updatedForm as Record<string, string>)[key] = parsedProfile[key];
              }
            });
            return updatedForm;
          });
        } catch (e) {
          console.error("Error loading saved profile:", e);
        }
      }
    }
  }, [isLoading]);

  useEffect(() => {
    if (!user) navigate('/masuk');
  }, [user, navigate]);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value });

  // Detect user location
  const detectUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError(lang === 'id' 
        ? 'Geolokasi tidak didukung oleh browser Anda'
        : 'Geolocation is not supported by your browser'
      );
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setForm(prev => ({
          ...prev,
          koordinat: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
        }));
        setIsLocating(false);
      },
      (error) => {
        setLocationError(
          error.code === 1
            ? (lang === 'id'
                ? 'Izin lokasi ditolak. Silakan izinkan akses lokasi.'
                : 'Location permission denied. Please allow location access.'
              )
            : (lang === 'id'
                ? 'Gagal mendeteksi lokasi Anda. Silakan masukkan koordinat secara manual.'
                : 'Failed to detect your location. Please enter coordinates manually.'
              )
        );
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  }, [lang]);

  // Handle address found from map
  const handleAddressFound = useCallback((address: string) => {
    setForm(prev => ({
      ...prev,
      alamatGudang: address
    }));
  }, []);

  // Handle map location selection
  const handleMapPinSelection = (lat: number, lng: number) => {
    // Update the form with selected coordinates
    setForm(prev => ({
      ...prev,
      koordinat: `${lat.toFixed(6)}, ${lng.toFixed(6)}`
    }));
    
    // Reset the selected coordinates and close the dialog
    setSelectedCoordinates(null);
    setMapDialogOpen(false);
  };
  
  // Initialize selected coordinates when dialog opens
  useEffect(() => {
    if (mapDialogOpen && form.koordinat) {
      try {
        const [lat, lng] = form.koordinat.split(',').map(coord => parseFloat(coord.trim()));
        if (!isNaN(lat) && !isNaN(lng)) {
          setSelectedCoordinates([lat, lng]);
        }
      } catch (error) {
        console.error('Error parsing coordinates:', error);
      }
    }
  }, [mapDialogOpen, form.koordinat]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      toast({ title: "Gagal", description: "Silakan masuk terlebih dahulu", variant: "destructive" });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Save to localStorage as a backup
      localStorage.setItem('baskit_profile', JSON.stringify(form));
      
      // Import supabase client
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Check if profile already exists
      const { data: existingProfile } = await supabase
        .from('distributor_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle<{ id: string }>();
      
      
      // Prepare data
      const profileData = {
        user_id: user.id,
        nama_bisnis: form.nama_bisnis,
        alamat_lengkap: form.alamat_lengkap,
        kota: form.kota,
        nama_pemilik: form.nama_pemilik,
        kontak_pemilik: form.kontak_pemilik,
        email_pemilik: form.email_pemilik,
        omzet: form.omzet || null,
        alamat_kantor: form.alamat_kantor || null,
        alamat_gudang: form.alamat_gudang || null,
        bentuk_usaha: form.bentuk_usaha || null,
        foto_gudang: form.foto_gudang || null,
        koordinat: form.koordinat || null,
        nib: form.nib || null,
        // Include the new fields
        website_perusahaan: form.website_perusahaan || null,
        jumlah_karyawan: form.jumlah_karyawan ? parseInt(form.jumlah_karyawan, 10) : null,
        npwp: form.npwp || null
      };

      let result;
      if (existingProfile) {
        // Update existing profile 
        // Note: @ts-expect-error is used below to bypass TypeScript errors due to 
        // type incompatibility issues with Supabase client. This is a known issue
        // with typing between the client and schema definitions.
        result = await supabase
          .from('distributor_profiles')
          // @ts-expect-error - Bypassing type check for Supabase client compatibility
          .update(profileData)
          .eq('id', existingProfile.id);
      } else {
        // Insert new profile
        // Using the same type bypass approach as above
        result = await supabase
          .from('distributor_profiles')
          // @ts-expect-error - Bypassing type check for Supabase client compatibility
          .insert(profileData);
      }
      
      if (result.error) {
        throw result.error;
      }
      
      setSubmitSuccess(true);
      toast({ 
        title: lang === 'id' ? "Berhasil" : "Success", 
        description: lang === 'id' ? "Profil Anda berhasil disimpan" : "Your profile has been saved successfully" 
      });
      
      // Redirect after a short delay
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({ 
        title: lang === 'id' ? "Gagal" : "Failed", 
        description: lang === 'id' 
          ? "Terjadi kesalahan saat menyimpan profil. Silakan coba lagi."
          : "An error occurred while saving your profile. Please try again.",
        variant: "destructive" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title={lang === 'id' ? "Lengkapi Profil | Baskit Distributor Hub" : "Complete Profile | Baskit Distributor Hub"}
        description={lang === 'id' 
          ? "Lengkapi data untuk proses onboarding dan pembelian."
          : "Complete your data for the onboarding and purchasing process."
        } 
      />
      <Navbar />
      <main className="container max-w-3xl mx-auto py-10">
        <h1 className="text-2xl font-bold mb-6">{lang === 'id' ? "Lengkapi Profil" : "Complete Profile"}</h1>
        <form onSubmit={onSubmit} className="grid sm:grid-cols-2 gap-4">
          {isLoading && (
            <div className="sm:col-span-2 p-4 bg-muted/50 rounded-md text-center">
              <div className="inline-block h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2"></div>
              <span>{lang === 'id' ? "Memuat data profil..." : "Loading profile data..."}</span>
            </div>
          )}
          
          <div className="sm:col-span-2">
            <h2 className="text-lg font-semibold mb-3 pb-2 border-b">{lang === 'id' ? "Informasi Bisnis" : "Business Information"}</h2>
          </div>
          
          <div>
            <label className="text-sm text-muted-foreground">Nama Bisnis / Perusahaan</label>
            <input required className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" value={form.nama_bisnis} onChange={set('nama_bisnis')} />
          </div>
          
          <div>
            <label className="text-sm text-muted-foreground">Bentuk Badan Usaha</label>
            <input placeholder="PT / CV / Perorangan / Lainnya" required className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" value={form.bentuk_usaha} onChange={set('bentuk_usaha')} />
          </div>
          
          <div>
            <label className="text-sm text-muted-foreground">Kota/Kabupaten</label>
            <input required className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" value={form.kota} onChange={set('kota')} placeholder="Kota/Kabupaten" />
          </div>
          
          <div>
            <label className="text-sm text-muted-foreground">Estimasi Omzet Bulanan (IDR) <span className="text-xs font-normal">(Opsional)</span></label>
            <input className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" value={form.omzet} onChange={set('omzet')} placeholder="Contoh: 50000000" />
          </div>
          
          <div>
            <label className="text-sm text-muted-foreground">Jumlah Karyawan <span className="text-xs font-normal">(Opsional)</span></label>
            <input className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" value={form.jumlah_karyawan} onChange={set('jumlah_karyawan')} placeholder="Contoh: 10" />
          </div>
          
          <div className="sm:col-span-2">
            <label className="text-sm text-muted-foreground">Website Perusahaan <span className="text-xs font-normal">(Opsional)</span></label>
            <input className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" value={form.website_perusahaan} onChange={set('website_perusahaan')} placeholder="https://www.perusahaan-anda.com" />
          </div>

          <div className="sm:col-span-2">
            <h2 className="text-lg font-semibold mb-3 mt-2 pb-2 border-b">Kontak Penanggung Jawab</h2>
          </div>
          
          <div>
            <label className="text-sm text-muted-foreground">Nama Pemilik/Penanggung Jawab</label>
            <input required className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" value={form.nama_pemilik} onChange={set('nama_pemilik')} />
          </div>
          
          <div>
            <label className="text-sm text-muted-foreground">Nomor Telepon</label>
            <input required className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" value={form.kontak_pemilik} onChange={set('kontak_pemilik')} placeholder="+62xxx" />
          </div>
          
          <div className="sm:col-span-2">
            <label className="text-sm text-muted-foreground">Email Bisnis</label>
            <input required type="email" className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" value={form.email_pemilik} onChange={set('email_pemilik')} />
          </div>

          <div className="sm:col-span-2">
            <h2 className="text-lg font-semibold mb-3 mt-2 pb-2 border-b">Informasi Lokasi</h2>
          </div>
          
          <div className="sm:col-span-2">
            <label className="text-sm text-muted-foreground">Alamat Lengkap</label>
            <input required className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" value={form.alamat_lengkap} onChange={set('alamat_lengkap')} />
          </div>
          
          <div className="sm:col-span-2">
            <label className="text-sm text-muted-foreground">Alamat Gudang <span className="text-xs font-normal">(Opsional)</span></label>
            <input className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" value={form.alamat_gudang} onChange={set('alamat_gudang')} />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm text-muted-foreground">Koordinat Lokasi</label>
            <div className="mt-1 flex gap-2">
              <input 
                placeholder="-6.2, 106.8" 
                required 
                className="w-full rounded-md border bg-background px-3 py-2 text-sm" 
                value={form.koordinat} 
                onChange={set('koordinat')} 
              />
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={detectUserLocation} 
                disabled={isLocating}
              >
                {isLocating ? 
                  <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div> : 
                  "Deteksi Lokasi"
                }
              </Button>
              <Dialog 
                open={mapDialogOpen} 
                onOpenChange={(open) => {
                  if (open) {
                    // Opening the dialog
                    setMapDialogOpen(true);
                  } else {
                    // Manually closing the dialog (by clicking outside or pressing Escape)
                    // Reset any temporary selected coordinates
                    setSelectedCoordinates(null);
                    setMapDialogOpen(false);
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button type="button" variant="outline" size="sm">
                    <MapPin className="h-4 w-4 mr-2" />
                    Pilih di Peta
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" 
                  onPointerDownOutside={(e) => {
                    // Prevent closing when clicking in search results dropdown
                    if (e.target && (e.target as HTMLElement).closest('.search-results-dropdown')) {
                      e.preventDefault();
                    } else {
                      // Reset any temporary coordinates when closing by clicking outside
                      setSelectedCoordinates(null);
                    }
                  }}>
                  <DialogHeader>
                    <DialogTitle>Pilih Lokasi di Peta</DialogTitle>
                    <DialogDescription>
                      Cari alamat atau klik pada peta untuk menentukan lokasi Anda.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="border rounded-md overflow-hidden h-[400px]">
                    <MapSelector 
                      onLocationSelected={(lat, lng) => {
                        // Just update the selected coordinates temporarily
                        setSelectedCoordinates([lat, lng]);
                      }}
                      onAddressFound={handleAddressFound}
                      initialPosition={form.koordinat} 
                    />
                  </div>
                  
                  <div className="mt-2 text-xs text-muted-foreground flex-grow">
                    <p>Anda dapat:</p>
                    <ul className="list-disc pl-4 mt-1">
                      <li>Mencari alamat dengan mengetik di kolom pencarian</li>
                      <li>Mengklik peta untuk memilih lokasi secara langsung</li>
                      <li>Menggeser roda mouse untuk memperbesar atau memperkecil tampilan peta</li>
                    </ul>
                  </div>
                  
                  <div className="mt-4 pt-3 border-t flex justify-end">
                    <Button 
                      type="button" 
                      variant="default"
                      className="px-4 py-2"
                      onClick={() => {
                        // Save the selected coordinates
                        if (selectedCoordinates) {
                          handleMapPinSelection(selectedCoordinates[0], selectedCoordinates[1]);
                        } else {
                          // Even if no coordinates were selected, close the dialog
                          setMapDialogOpen(false);
                        }
                      }}
                    >
                      Simpan Lokasi
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            {locationError && (
              <Alert variant="destructive" className="mt-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{locationError}</AlertDescription>
              </Alert>
            )}
          </div>
          <div className="sm:col-span-2">
            <h2 className="text-lg font-semibold mb-3 mt-2 pb-2 border-b">Dokumen Legalitas</h2>
          </div>
          
          <div>
            <label className="text-sm text-muted-foreground">NIB (Nomor Induk Berusaha) <span className="text-xs font-normal">(Opsional)</span></label>
            <input className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" value={form.nib} onChange={set('nib')} />
            <p className="text-xs text-muted-foreground mt-1">Jika Anda belum memiliki NIB, Anda dapat mengisinya nanti.</p>
          </div>
          
          <div>
            <label className="text-sm text-muted-foreground">NPWP <span className="text-xs font-normal">(Opsional)</span></label>
            <input className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" value={form.npwp} onChange={set('npwp')} placeholder="XX.XXX.XXX.X-XXX.XXX" />
            <p className="text-xs text-muted-foreground mt-1">NPWP perusahaan atau perorangan.</p>
          </div>
          
          <div className="sm:col-span-2">
            <p className="text-sm text-muted-foreground mt-2">Upload dokumen (Akta Perusahaan, KTP Pemilik, NPWP) akan ditambahkan pada versi berikut.</p>
          </div>
          <div className="sm:col-span-2">
            <Button 
              variant="hero" 
              className="w-full relative" 
              disabled={isSubmitting || submitSuccess}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                  Menyimpan...
                </span>
              ) : submitSuccess ? (
                <span className="flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Profil Tersimpan
                </span>
              ) : (
                'Simpan Profil'
              )}
            </Button>
          </div>
        </form>
        
        {submitSuccess && (
          <div className="mt-4 bg-green-50 border border-green-200 p-4 rounded-md">
            <div className="flex">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Profil tersimpan</h3>
                <p className="mt-1 text-sm text-green-600">Tim Baskit akan melakukan verifikasi data Anda.</p>
                <p className="mt-1 text-sm text-green-600">Mengalihkan ke halaman utama...</p>
              </div>
            </div>
          </div>
        )}
        
        <p className="text-sm text-muted-foreground mt-6">Jika Anda membutuhkan bantuan untuk pembelian, silakan hubungi tim Baskit melalui halaman Hubungi Kami.</p>
      </main>
    </div>
  );
}
