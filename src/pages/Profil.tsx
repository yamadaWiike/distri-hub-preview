
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
import { useLanguage } from "@/hooks/use-language";
import { translations } from "@/lib/translations";

// Extended type for distributor profile that includes all possible fields
type ExtendedDistributorProfile = Database['public']['Tables']['distributor_profiles']['Row'] & {
  email_pemilik?: string;
  omzet?: string;
  alamat_kantor?: string;
  alamat_gudang?: string;
  bentuk_usaha?: string;
  foto_gudang?: string;
  koordinat?: string;
  nib?: string;
  npwp?: string;
  website_perusahaan?: string;
  jumlah_karyawan?: number | string;
  // KYB and company fields
  email_perusahaan?: string;
  nomor_telp_perusahaan?: string;
  nama_direktur?: string;
  status_pkp?: string;
  npwp_number?: string;
  nib_number?: string;
};

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
    
    // New KYB and company fields
    email_perusahaan: "",
    nomor_telp_perusahaan: "",
    nama_direktur: "",
    status_pkp: "Non-PKP",
    npwp_number: "",
    nib_number: "",
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
            email_pemilik: (data as ExtendedDistributorProfile).email_pemilik || data.email || user.email || "", // Use from DB or fall back to user email
            omzet: (data as ExtendedDistributorProfile).omzet || "",
            alamat_kantor: (data as ExtendedDistributorProfile).alamat_kantor || "",
            alamat_gudang: (data as ExtendedDistributorProfile).alamat_gudang || "",
            bentuk_usaha: (data as ExtendedDistributorProfile).bentuk_usaha || "",
            foto_gudang: (data as ExtendedDistributorProfile).foto_gudang || "",
            koordinat: (data as ExtendedDistributorProfile).koordinat || "",
            nib: (data as ExtendedDistributorProfile).nib || "",
            // New fields added to the database
            npwp: (data as ExtendedDistributorProfile).npwp || "",
            website_perusahaan: (data as ExtendedDistributorProfile).website_perusahaan || "",
            jumlah_karyawan: (data as ExtendedDistributorProfile).jumlah_karyawan ? String((data as ExtendedDistributorProfile).jumlah_karyawan) : "",
            // KYB and company fields
            email_perusahaan: (data as ExtendedDistributorProfile).email_perusahaan || "",
            nomor_telp_perusahaan: (data as ExtendedDistributorProfile).nomor_telp_perusahaan || "",
            nama_direktur: (data as ExtendedDistributorProfile).nama_direktur || "",
            status_pkp: (data as ExtendedDistributorProfile).status_pkp || "Non-PKP",
            npwp_number: (data as ExtendedDistributorProfile).npwp_number || "",
            nib_number: (data as ExtendedDistributorProfile).nib_number || "",
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
        title={lang === 'id' ? "Profil | Baskit Distributor Hub" : "Profile | Baskit Distributor Hub"}
        description={lang === 'id' 
          ? "Kelola profil dan informasi bisnis Anda."
          : "Manage your profile and business information."
        } 
      />
      <Navbar />
      <main className="container max-w-4xl mx-auto py-8 px-4">
        {/* User Info Header */}
        <div className="bg-card rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-orange-500 flex items-center justify-center text-white text-2xl font-bold mb-3">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <h1 className="text-lg font-semibold">{form.nama_bisnis || user?.email || 'User'}</h1>
            <p className="text-sm text-muted-foreground mb-3">{user?.email}</p>
            <span className="inline-flex px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-xs font-medium mb-4">
              {lang === 'id' ? '⏳ Menunggu Approval' : '⏳ Pending Approval'}
            </span>
            <p className="text-sm text-muted-foreground mb-3">
              {lang === 'id' 
                ? 'Menunggu persetujuan dari pihak Baskit, pastikan untuk mengisi data secara lengkap dan benar' 
                : 'Awaiting approval from Baskit, please ensure all data is complete and accurate'}
            </p>
            <Button 
              type="button"
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-md text-sm font-medium"
            >
              {lang === 'id' ? 'Lengkapi Data Distributor' : 'Complete Distributor Data'}
            </Button>
          </div>
        </div>

        <form onSubmit={onSubmit}>
          {isLoading && (
            <div className="bg-card rounded-lg shadow-sm border p-6 mb-6 text-center">
              <div className="inline-block h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2"></div>
              <span>{lang === 'id' ? "Memuat data profil..." : "Loading profile data..."}</span>
            </div>
          )}

          {/* Informasi Bisnis */}
          <div className="bg-card rounded-lg shadow-sm border mb-4">
            <div className="px-6 py-3 border-b flex items-center justify-between">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                {lang === 'id' ? 'Informasi Bisnis' : 'Business Information'}
              </h2>
              <Button type="button" variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground">
                ✏️ Edit
              </Button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Nama Bisnis</p>
                  <p className="font-medium">{form.nama_bisnis || 'asdasdasd'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Nomor HP</p>
                  <p className="font-medium">{form.kontak_pemilik || 'asdasd123'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground mb-1">Alamat</p>
                  <p className="font-medium">{form.alamat_lengkap || 'asdasd123'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Kota/Kab</p>
                  <p className="font-medium">{form.kota || 'tangerang, banten'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Informasi Pemilik */}
          <div className="bg-card rounded-lg shadow-sm border mb-4">
            <div className="px-6 py-3 border-b flex items-center justify-between">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                {lang === 'id' ? 'Informasi Pemilik' : 'Owner Information'}
              </h2>
              <Button type="button" variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground">
                ✏️ Edit
              </Button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Nama Pemilik</p>
                  <p className="font-medium">{form.nama_pemilik || 'asdasdas'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Nomor HP Pemilik</p>
                  <p className="font-medium">{form.kontak_pemilik || 'asdasd123'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground mb-1">Email</p>
                  <p className="font-medium">{form.email_pemilik || 'test@gmail.com'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Profil Perusahaan */}
          <div className="bg-card rounded-lg shadow-sm border mb-4">
            <div className="px-6 py-3 border-b flex items-center justify-between">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                {lang === 'id' ? 'Profil Perusahaan' : 'Company Profile'}
              </h2>
              <Button type="button" variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground">
                ✏️ Edit
              </Button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Nama Perusahaan</p>
                  <p className="font-medium">{form.nama_bisnis || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Email Perusahaan</p>
                  <p className="font-medium">{form.email_perusahaan || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Nomor Kontak</p>
                  <p className="font-medium">{form.nomor_telp_perusahaan || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Nama Direktur</p>
                  <p className="font-medium">{form.nama_direktur || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Status PKP</p>
                  <p className="font-medium">{form.status_pkp || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Status Kepemilikan</p>
                  <p className="font-medium">{form.bentuk_usaha || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">NPWP</p>
                  <p className="font-medium">{form.npwp_number || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">NIB</p>
                  <p className="font-medium">{form.nib_number || '-'}</p>
                </div>
              </div>

              {/* Dokumen Pendukung */}
              <div className="mt-6">
                <p className="text-sm font-medium mb-3">Dokumen Pendukung</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <div className="flex-shrink-0 w-12 h-12 border rounded flex items-center justify-center bg-gray-50">
                      📄
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">KTP</p>
                      <div className="flex gap-2 mt-1">
                        <button type="button" className="text-xs text-orange-500 hover:text-orange-600">
                          📁 Lihat
                        </button>
                        <button type="button" className="text-xs text-muted-foreground hover:text-foreground">
                          ⬇️ Download
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex-shrink-0 w-12 h-12 border rounded flex items-center justify-center bg-gray-50">
                      📄
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">NIB.pdf</p>
                      <div className="flex gap-2 mt-1">
                        <button type="button" className="text-xs text-orange-500 hover:text-orange-600">
                          📁 Lihat
                        </button>
                        <button type="button" className="text-xs text-muted-foreground hover:text-foreground">
                          ⬇️ Download
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex-shrink-0 w-12 h-12 border rounded flex items-center justify-center bg-gray-50">
                      📄
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">Akta.pdf</p>
                      <div className="flex gap-2 mt-1">
                        <button type="button" className="text-xs text-orange-500 hover:text-orange-600">
                          📁 Lihat
                        </button>
                        <button type="button" className="text-xs text-muted-foreground hover:text-foreground">
                          ⬇️ Download
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex-shrink-0 w-12 h-12 border rounded flex items-center justify-center bg-gray-50">
                      📄
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">NPWP</p>
                      <div className="flex gap-2 mt-1">
                        <button type="button" className="text-xs text-orange-500 hover:text-orange-600">
                          📁 Lihat
                        </button>
                        <button type="button" className="text-xs text-muted-foreground hover:text-foreground">
                          ⬇️ Download
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* PIC & Gudang */}
          <div className="bg-card rounded-lg shadow-sm border mb-4">
            <div className="px-6 py-3 border-b flex items-center justify-between">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                {lang === 'id' ? 'PIC & Gudang' : 'PIC & Warehouse'}
              </h2>
              <Button type="button" variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground">
                ✏️ Edit
              </Button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Nama PIC</p>
                  <p className="font-medium">{form.nama_pemilik || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Nomor Kontak PIC</p>
                  <p className="font-medium">{form.kontak_pemilik || '-'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground mb-1">Email PIC</p>
                  <p className="font-medium">{form.email_pemilik || '-'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground mb-1">Alamat Gudang</p>
                  <p className="font-medium">{form.alamat_gudang || '-'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Pembayaran & Operasional */}
          <div className="bg-card rounded-lg shadow-sm border mb-6">
            <div className="px-6 py-3 border-b flex items-center justify-between">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                {lang === 'id' ? 'Pembayaran & Operasional' : 'Payment & Operational'}
              </h2>
              <Button type="button" variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground">
                ✏️ Edit
              </Button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Nama Sales</p>
                  <p className="font-medium">-</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Nomor Rekening</p>
                  <p className="font-medium">-</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Jumlah Karyawan</p>
                  <p className="font-medium">{form.jumlah_karyawan || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Metode Pengiriman</p>
                  <p className="font-medium">-</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground mb-1">Metode Pembayaran</p>
                  <p className="font-medium">-</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground mb-1">Aplikasi Perusahaan</p>
                  <p className="font-medium">-</p>
                </div>
              </div>
            </div>
          </div>
        </form>

        {submitSuccess && (
          <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex gap-3">
              <svg className="h-5 w-5 text-green-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-green-800">
                  {lang === 'id' ? 'Profil tersimpan' : 'Profile saved'}
                </h3>
                <p className="mt-1 text-sm text-green-600">
                  {lang === 'id' 
                    ? 'Tim Baskit akan melakukan verifikasi data Anda.' 
                    : 'The Baskit team will verify your data.'}
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
