import SEO from "@/components/seo/SEO";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/hooks/use-language";
import { translations } from "@/lib/translations";
import { toast } from "@/components/ui/use-toast";
import { ArrowLeft, MapPin } from "lucide-react";
import MapSelector from "@/components/ui/map-selector";
import 'leaflet/dist/leaflet.css';
import { Database } from "@/integrations/supabase/types";

type ExtendedDistributorProfile = Database['public']['Tables']['distributor_profiles']['Row'] & {
  email_pemilik?: string;
  email_perusahaan?: string;
  nomor_telp_perusahaan?: string;
  nama_direktur?: string;
  status_pkp?: string;
  npwp_number?: string;
  nib_number?: string;
  alamat_gudang?: string;
};

// Indonesian Cities and Regencies
const INDONESIAN_AREAS = [
  // DKI Jakarta
  'Jakarta Pusat', 'Jakarta Utara', 'Jakarta Barat', 'Jakarta Selatan', 'Jakarta Timur', 'Kepulauan Seribu',
  // Jawa Barat
  'Bandung', 'Kota Bandung', 'Bekasi', 'Kota Bekasi', 'Bogor', 'Kota Bogor', 'Cirebon', 'Kota Cirebon', 'Depok',
  'Sukabumi', 'Kota Sukabumi', 'Tasikmalaya', 'Kota Tasikmalaya', 'Banjar', 'Cimahi', 'Garut', 'Indramayu',
  'Karawang', 'Kuningan', 'Majalengka', 'Pangandaran', 'Purwakarta', 'Subang', 'Sumedang', 'Ciamis', 'Cianjur',
  // Jawa Tengah
  'Semarang', 'Surakarta (Solo)', 'Magelang', 'Kota Magelang', 'Salatiga', 'Pekalongan', 'Kota Pekalongan',
  'Tegal', 'Kota Tegal', 'Banyumas', 'Cilacap', 'Purbalingga', 'Banjarnegara', 'Kebumen', 'Purworejo',
  'Wonosobo', 'Boyolali', 'Klaten', 'Sukoharjo', 'Wonogiri', 'Karanganyar', 'Sragen', 'Grobogan',
  'Blora', 'Rembang', 'Pati', 'Kudus', 'Jepara', 'Demak', 'Semarang (Kab.)', 'Temanggung', 'Kendal',
  'Batang', 'Pemalang', 'Brebes',
  // DI Yogyakarta
  'Yogyakarta', 'Sleman', 'Bantul', 'Kulon Progo', 'Gunung Kidul',
  // Jawa Timur
  'Surabaya', 'Malang', 'Kota Malang', 'Kediri', 'Kota Kediri', 'Blitar', 'Kota Blitar', 'Madiun', 'Kota Madiun',
  'Mojokerto', 'Kota Mojokerto', 'Pasuruan', 'Kota Pasuruan', 'Probolinggo', 'Kota Probolinggo', 'Batu',
  'Jember', 'Lumajang', 'Bondowoso', 'Situbondo', 'Banyuwangi', 'Gresik', 'Sidoarjo', 'Bangkalan',
  'Sampang', 'Pamekasan', 'Sumenep', 'Nganjuk', 'Magetan', 'Ngawi', 'Bojonegoro', 'Tuban', 'Lamongan',
  'Jombang', 'Tulungagung', 'Trenggalek', 'Pacitan', 'Ponorogo',
  // Banten
  'Tangerang', 'Kota Tangerang', 'Tangerang Selatan', 'Serang', 'Kota Serang', 'Cilegon', 'Lebak', 'Pandeglang',
  // Bali
  'Denpasar', 'Badung', 'Gianyar', 'Tabanan', 'Klungkung', 'Bangli', 'Karangasem', 'Buleleng', 'Jembrana',
  // Sumatera Utara
  'Medan', 'Binjai', 'Tebing Tinggi', 'Pematang Siantar', 'Tanjung Balai', 'Padang Sidempuan', 'Gunung Sitoli',
  'Deli Serdang', 'Langkat', 'Serdang Bedagai', 'Karo', 'Dairi', 'Toba', 'Samosir', 'Asahan', 'Labuhanbatu',
  'Labuhanbatu Selatan', 'Labuhanbatu Utara', 'Tapanuli Selatan', 'Tapanuli Tengah', 'Tapanuli Utara',
  'Mandailing Natal', 'Nias', 'Nias Selatan', 'Nias Utara', 'Nias Barat', 'Humbang Hasundutan', 'Pakpak Bharat',
  'Padang Lawas', 'Padang Lawas Utara', 'Batu Bara', 'Simalungun',
  // Sumatera Barat
  'Padang', 'Bukittinggi', 'Padang Panjang', 'Payakumbuh', 'Sawahlunto', 'Solok', 'Kota Solok', 'Pariaman',
  'Agam', 'Lima Puluh Kota', 'Pasaman', 'Pasaman Barat', 'Sijunjung', 'Tanah Datar', 'Dharmasraya',
  'Kepulauan Mentawai', 'Pesisir Selatan',
  // Riau
  'Pekanbaru', 'Dumai', 'Bengkalis', 'Indragiri Hilir', 'Indragiri Hulu', 'Kampar', 'Kepulauan Meranti',
  'Kuantan Singingi', 'Pelalawan', 'Rokan Hilir', 'Rokan Hulu', 'Siak',
  // Kepulauan Riau
  'Batam', 'Tanjung Pinang', 'Bintan', 'Karimun', 'Natuna', 'Lingga', 'Kepulauan Anambas',
  // Jambi
  'Jambi', 'Sungai Penuh', 'Batang Hari', 'Bungo', 'Kerinci', 'Merangin', 'Muaro Jambi', 'Sarolangun',
  'Tanjung Jabung Barat', 'Tanjung Jabung Timur', 'Tebo',
  // Sumatera Selatan
  'Palembang', 'Prabumulih', 'Pagar Alam', 'Lubuklinggau', 'Banyuasin', 'Empat Lawang', 'Lahat',
  'Muara Enim', 'Musi Banyuasin', 'Musi Rawas', 'Musi Rawas Utara', 'Ogan Ilir', 'Ogan Komering Ilir',
  'Ogan Komering Ulu', 'Ogan Komering Ulu Selatan', 'Ogan Komering Ulu Timur', 'Penukal Abab Lematang Ilir',
  // Bengkulu
  'Bengkulu', 'Bengkulu Selatan', 'Bengkulu Tengah', 'Bengkulu Utara', 'Kaur', 'Kepahiang', 'Lebong',
  'Mukomuko', 'Rejang Lebong', 'Seluma',
  // Lampung
  'Bandar Lampung', 'Metro', 'Lampung Barat', 'Lampung Selatan', 'Lampung Tengah', 'Lampung Timur',
  'Lampung Utara', 'Mesuji', 'Pesawaran', 'Pesisir Barat', 'Pringsewu', 'Tanggamus', 'Tulang Bawang',
  'Tulang Bawang Barat', 'Way Kanan',
  // Kalimantan Barat
  'Pontianak', 'Singkawang', 'Bengkayang', 'Kapuas Hulu', 'Kayong Utara', 'Ketapang', 'Kubu Raya',
  'Landak', 'Melawi', 'Mempawah', 'Sambas', 'Sanggau', 'Sekadau', 'Sintang',
  // Kalimantan Tengah
  'Palangka Raya', 'Barito Selatan', 'Barito Timur', 'Barito Utara', 'Gunung Mas', 'Kapuas', 'Katingan',
  'Kotawaringin Barat', 'Kotawaringin Timur', 'Lamandau', 'Murung Raya', 'Pulang Pisau', 'Seruyan', 'Sukamara',
  // Kalimantan Selatan
  'Banjarmasin', 'Banjarbaru', 'Balangan', 'Banjar', 'Barito Kuala', 'Hulu Sungai Selatan', 'Hulu Sungai Tengah',
  'Hulu Sungai Utara', 'Kotabaru', 'Tabalong', 'Tanah Bumbu', 'Tanah Laut', 'Tapin',
  // Kalimantan Timur
  'Balikpapan', 'Samarinda', 'Bontang', 'Berau', 'Kutai Barat', 'Kutai Kartanegara', 'Kutai Timur',
  'Mahakam Ulu', 'Paser', 'Penajam Paser Utara',
  // Kalimantan Utara
  'Tarakan', 'Bulungan', 'Malinau', 'Nunukan', 'Tana Tidung',
  // Sulawesi Utara
  'Manado', 'Bitung', 'Tomohon', 'Kotamobagu', 'Bolaang Mongondow', 'Bolaang Mongondow Selatan',
  'Bolaang Mongondow Timur', 'Bolaang Mongondow Utara', 'Kepulauan Sangihe', 'Kepulauan Siau Tagulandang Biaro',
  'Kepulauan Talaud', 'Minahasa', 'Minahasa Selatan', 'Minahasa Tenggara', 'Minahasa Utara',
  // Sulawesi Tengah
  'Palu', 'Banggai', 'Banggai Kepulauan', 'Banggai Laut', 'Buol', 'Donggala', 'Morowali', 'Morowali Utara',
  'Parigi Moutong', 'Poso', 'Sigi', 'Tojo Una-Una', 'Toli-Toli',
  // Sulawesi Selatan
  'Makassar', 'Palopo', 'Parepare', 'Bantaeng', 'Barru', 'Bone', 'Bulukumba', 'Enrekang', 'Gowa',
  'Jeneponto', 'Kepulauan Selayar', 'Luwu', 'Luwu Timur', 'Luwu Utara', 'Maros', 'Pangkajene dan Kepulauan',
  'Pinrang', 'Sidenreng Rappang', 'Sinjai', 'Soppeng', 'Takalar', 'Tana Toraja', 'Toraja Utara', 'Wajo',
  // Sulawesi Tenggara
  'Kendari', 'Bau-Bau', 'Bombana', 'Buton', 'Buton Selatan', 'Buton Tengah', 'Buton Utara', 'Kolaka',
  'Kolaka Timur', 'Kolaka Utara', 'Konawe', 'Konawe Kepulauan', 'Konawe Selatan', 'Konawe Utara', 'Muna',
  'Muna Barat', 'Wakatobi',
  // Gorontalo
  'Gorontalo', 'Boalemo', 'Bone Bolango', 'Gorontalo Utara', 'Pohuwato',
  // Sulawesi Barat
  'Mamuju', 'Majene', 'Mamasa', 'Mamuju Tengah', 'Mamuju Utara', 'Pasangkayu', 'Polewali Mandar',
  // Maluku
  'Ambon', 'Tual', 'Buru', 'Buru Selatan', 'Kepulauan Aru', 'Maluku Barat Daya', 'Maluku Tengah',
  'Maluku Tenggara', 'Maluku Tenggara Barat', 'Seram Bagian Barat', 'Seram Bagian Timur',
  // Maluku Utara
  'Ternate', 'Tidore Kepulauan', 'Halmahera Barat', 'Halmahera Selatan', 'Halmahera Tengah',
  'Halmahera Timur', 'Halmahera Utara', 'Kepulauan Sula', 'Pulau Morotai', 'Pulau Taliabu',
  // Papua
  'Jayapura', 'Asmat', 'Biak Numfor', 'Boven Digoel', 'Deiyai', 'Dogiyai', 'Intan Jaya', 'Jayapura (Kab.)',
  'Jayawijaya', 'Keerom', 'Kepulauan Yapen', 'Lanny Jaya', 'Mamberamo Raya', 'Mamberamo Tengah', 'Mappi',
  'Merauke', 'Mimika', 'Nabire', 'Nduga', 'Paniai', 'Pegunungan Bintang', 'Puncak', 'Puncak Jaya',
  'Sarmi', 'Supiori', 'Tolikara', 'Waropen', 'Yahukimo', 'Yalimo',
  // Papua Barat
  'Sorong', 'Fakfak', 'Kaimana', 'Manokwari', 'Manokwari Selatan', 'Maybrat', 'Pegunungan Arfak',
  'Raja Ampat', 'Sorong Selatan', 'Tambrauw', 'Teluk Bintuni', 'Teluk Wondama',
  // Nusa Tenggara Barat
  'Mataram', 'Bima', 'Kota Bima', 'Dompu', 'Lombok Barat', 'Lombok Tengah', 'Lombok Timur', 'Lombok Utara',
  'Sumbawa', 'Sumbawa Barat',
  // Nusa Tenggara Timur
  'Kupang', 'Alor', 'Belu', 'Ende', 'Flores Timur', 'Kupang (Kab.)', 'Lembata', 'Malaka', 'Manggarai',
  'Manggarai Barat', 'Manggarai Timur', 'Nagekeo', 'Ngada', 'Rote Ndao', 'Sabu Raijua', 'Sikka',
  'Sumba Barat', 'Sumba Barat Daya', 'Sumba Tengah', 'Sumba Timur', 'Timor Tengah Selatan', 'Timor Tengah Utara',
  // Aceh
  'Banda Aceh', 'Langsa', 'Lhokseumawe', 'Sabang', 'Subulussalam', 'Aceh Barat', 'Aceh Barat Daya',
  'Aceh Besar', 'Aceh Jaya', 'Aceh Selatan', 'Aceh Singkil', 'Aceh Tamiang', 'Aceh Tengah', 'Aceh Tenggara',
  'Aceh Timur', 'Aceh Utara', 'Bener Meriah', 'Bireuen', 'Gayo Lues', 'Nagan Raya', 'Pidie', 'Pidie Jaya',
  'Simeulue',
].sort();

export default function LengkapiProfil() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const t = translations[lang];
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  
  const [form, setForm] = useState({
    // Informasi Pemilik
    nama_pemilik: "",
    kontak_pemilik: "",
    email_pemilik: "",
    
    // Informasi PIC
    nama_pic: "",
    posisi_pic: "",
    nomor_kontak_pic: "",
    email_pic: "",
    
    // Lokasi Gudang
    alamat_gudang: "",
    koordinat: "",
    
    // Informasi Perusahaan
    nama_perusahaan: "",
    email_perusahaan: "",
    alamat_perusahaan: "",
    nomor_kontak_perusahaan: "",
    nama_direktur: "",
    status_pkp: "",
    status_kepemilikan: "",
    npwp: "",
    nib: "",
    
    // Upload Dokumen
    npwp_file: null as File | null,
    nib_file: null as File | null,
    ktp_file: null as File | null,
    
    // Step 3: Keterangan Bank
    nama_bank: "",
    nama_pemilik_akun: "",
    nomor_rekening: "",
    
    // Informasi Operasional
    jumlah_karyawan: "",
    jumlah_armada_pengiriman: "",
    area_distribusi: [] as string[],
    aplikasi_penjualan: [] as string[],
    metode_pembayaran: [] as string[],
  });
  
  const [mapDialogOpen, setMapDialogOpen] = useState(false);
  const [selectedCoordinates, setSelectedCoordinates] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [areaSearch, setAreaSearch] = useState("");

  // Debug logging
  useEffect(() => {
    console.log('Current step changed to:', currentStep);
  }, [currentStep]);

  // Load existing profile data
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user || !user.id) {
        navigate('/masuk');
        return;
      }
      
      try {
        setIsLoading(true);
        const { supabase } = await import('@/integrations/supabase/client');
        
        const { data, error } = await supabase
          .from('distributor_profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle<Database['public']['Tables']['distributor_profiles']['Row']>();
          
        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching profile:', error);
          return;
        }
        
        if (data) {
          const extendedData = data as ExtendedDistributorProfile;
          setForm({
            nama_pemilik: data.nama_pemilik || "",
            kontak_pemilik: data.kontak_pemilik || "",
            email_pemilik: extendedData.email_pemilik || user.email || "",
            nama_pic: data.nama_pemilik || "",
            posisi_pic: "",
            nomor_kontak_pic: data.kontak_pemilik || "",
            email_pic: extendedData.email_pemilik || "",
            alamat_gudang: extendedData.alamat_gudang || "",
            koordinat: data.koordinat || "",
            nama_perusahaan: data.nama_bisnis || "",
            email_perusahaan: extendedData.email_perusahaan || "",
            alamat_perusahaan: data.alamat_lengkap || "",
            nomor_kontak_perusahaan: extendedData.nomor_telp_perusahaan || "",
            nama_direktur: extendedData.nama_direktur || "",
            status_pkp: extendedData.status_pkp || "",
            status_kepemilikan: "",
            npwp: extendedData.npwp_number || "",
            nib: extendedData.nib_number || "",
            npwp_file: null,
            nib_file: null,
            ktp_file: null,
            nama_bank: "",
            nama_pemilik_akun: "",
            nomor_rekening: "",
            jumlah_karyawan: "",
            jumlah_armada_pengiriman: "",
            area_distribusi: [],
            aplikasi_penjualan: [],
            metode_pembayaran: [],
          });
          
          // Parse coordinates if available
          if (data.koordinat) {
            try {
              const coords = JSON.parse(data.koordinat);
              if (coords.lat && coords.lng) {
                setSelectedCoordinates([coords.lat, coords.lng]);
              }
            } catch (e) {
              console.error('Error parsing coordinates:', e);
            }
          }
        } else {
          // Prefill with user email if no profile data
          setForm(prev => ({
            ...prev,
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
  }, [user, navigate]);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => 
    setForm({ ...form, [k]: e.target.value });

  const handleFileChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setForm({ ...form, [field]: file });
    }
  };

  const handleNext = () => {
    console.log('=== handleNext called ===');
    console.log('currentStep:', currentStep);
    console.log('Stack trace:', new Error().stack);
    
    // Validate step 1
    if (currentStep === 1) {
      if (!form.nama_pemilik || !form.kontak_pemilik || !form.email_pemilik) {
        toast({
          title: lang === 'id' ? "Data Belum Lengkap" : "Incomplete Data",
          description: lang === 'id' 
            ? "Mohon lengkapi semua field yang wajib diisi" 
            : "Please fill in all required fields",
          variant: "destructive"
        });
        return;
      }
    }
    
    if (currentStep < 3) {
      const nextStep = currentStep + 1;
      console.log('Moving to step:', nextStep);
      setCurrentStep(nextStep);
    } else {
      console.log('Already at step 3, not incrementing');
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('handleSubmit called, currentStep:', currentStep);
    
    // Only allow submission from step 3
    if (currentStep !== 3) {
      console.log('Prevented submission - not on step 3');
      return;
    }
    
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Update profile data
      const { error } = await supabase
        .from('distributor_profiles')
        .update({
          nama_pemilik: form.nama_pemilik,
          kontak_pemilik: form.kontak_pemilik,
          nama_bisnis: form.nama_perusahaan,
          alamat_lengkap: form.alamat_perusahaan,
          // Add other fields as needed
        })
        .eq('user_id', user!.id);
        
      if (error) throw error;
      
      toast({
        title: lang === 'id' ? "Berhasil" : "Success",
        description: lang === 'id' 
          ? "Profil berhasil diperbarui" 
          : "Profile updated successfully",
      });
      
      navigate('/profil');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: lang === 'id' ? "Gagal" : "Failed",
        description: lang === 'id' 
          ? "Terjadi kesalahan saat memperbarui profil" 
          : "An error occurred while updating profile",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container max-w-4xl mx-auto py-8 px-4">
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <div className="inline-block h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600">{lang === 'id' ? "Memuat data..." : "Loading data..."}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO 
        title={lang === 'id' ? "Lengkapi Profil | Baskit" : "Complete Profile | Baskit"}
        description={lang === 'id' 
          ? "Lengkapi profil bisnis Anda"
          : "Complete your business profile"
        } 
      />
      <Navbar />
      
      <main className="container max-w-3xl mx-auto py-8 px-4">
        {/* Back Button */}
        <button
          onClick={() => navigate('/profil')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">{lang === 'id' ? 'Kembali ke Profil' : 'Back to Profile'}</span>
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {lang === 'id' ? 'Lengkapi Profil Bisnis Anda' : 'Complete Your Business Profile'}
          </h1>
          <p className="text-sm text-gray-600">
            {lang === 'id' 
              ? 'Verifikasi data perusahaan untuk aktivasi fitur pemesanan dan invoice berlangganan'
              : 'Verify company data to activate ordering features and subscription invoice'}
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8 px-4">
          {/* Step 1 */}
          <div className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
              currentStep >= 1 ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              1
            </div>
            <span className="text-xs mt-2 text-center">
              {lang === 'id' ? 'Profil Perusahaan' : 'Company Profile'}
            </span>
          </div>

          {/* Connector */}
          <div className={`w-16 h-1 mx-2 transition-colors ${
            currentStep >= 2 ? 'bg-orange-500' : 'bg-gray-200'
          }`}></div>

          {/* Step 2 */}
          <div className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
              currentStep >= 2 ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              2
            </div>
            <span className="text-xs mt-2 text-center">
              {lang === 'id' ? 'Info PIC &' : 'PIC Info &'}
              <br />
              {lang === 'id' ? 'Gudang' : 'Warehouse'}
            </span>
          </div>

          {/* Connector */}
          <div className={`w-16 h-1 mx-2 transition-colors ${
            currentStep >= 3 ? 'bg-orange-500' : 'bg-gray-200'
          }`}></div>

          {/* Step 3 */}
          <div className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
              currentStep >= 3 ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              3
            </div>
            <span className="text-xs mt-2 text-center">
              {lang === 'id' ? 'Informasi' : 'Additional'}
              <br />
              {lang === 'id' ? 'Tambahan' : 'Information'}
            </span>
          </div>
        </div>

        {/* Form Card */}
        <form 
          onSubmit={handleSubmit} 
          noValidate 
          onKeyDown={(e) => {
            // Prevent Enter key from submitting the form unless on step 3
            if (e.key === 'Enter' && currentStep !== 3) {
              e.preventDefault();
              console.log('Enter key prevented on step', currentStep);
            }
          }}
          className="bg-white rounded-lg shadow-sm border"
        >
          {/* Step 1: Profil Perusahaan */}
          {currentStep === 1 && (
            <div className="p-8">
              {/* Informasi Pemilik Section */}
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                {lang === 'id' ? 'Informasi Pemilik' : 'Owner Information'}
              </h2>

              <div className="space-y-5 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {lang === 'id' ? 'Nama Pemilik' : 'Owner Name'} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={form.nama_pemilik}
                      onChange={set('nama_pemilik')}
                      placeholder="Budi Santoso"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {lang === 'id' ? 'Nomor HP Pemilik' : 'Owner Phone Number'} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={form.kontak_pemilik}
                      onChange={set('kontak_pemilik')}
                      placeholder="081234567890"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {lang === 'id' ? 'Format: 08XXXXXXXXXX (10-13 digit)' : 'Format: 08XXXXXXXXXX (10-13 digits)'}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {lang === 'id' ? 'Email Pemilik' : 'Owner Email'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email_pemilik}
                    onChange={set('email_pemilik')}
                    placeholder="budi@majubersama.co.id"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>

              {/* Informasi Perusahaan Section */}
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                {lang === 'id' ? 'Informasi Perusahaan' : 'Company Information'}
              </h2>

              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {lang === 'id' ? 'Nama Perusahaan' : 'Company Name'} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={form.nama_perusahaan}
                      onChange={set('nama_perusahaan')}
                      placeholder="PT Maju Bersama"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {lang === 'id' ? 'Email Perusahaan' : 'Company Email'} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={form.email_perusahaan}
                      onChange={set('email_perusahaan')}
                      placeholder="email@example.com"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {lang === 'id' ? 'Alamat Perusahaan' : 'Company Address'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.alamat_perusahaan}
                    onChange={set('alamat_perusahaan')}
                    placeholder="Jl. Pahlawan No. 123, Kel. Sukajadi"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {lang === 'id' ? 'Nomor Kontak Perusahaan' : 'Company Contact Number'} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={form.nomor_kontak_perusahaan}
                      onChange={set('nomor_kontak_perusahaan')}
                      placeholder="09090"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {lang === 'id' ? 'Nama Direktur' : 'Director Name'}
                    </label>
                    <input
                      type="text"
                      value={form.nama_direktur}
                      onChange={set('nama_direktur')}
                      placeholder={lang === 'id' ? 'Nama Lengkap Direktur' : 'Full Director Name'}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {lang === 'id' ? 'Status PKP' : 'PKP Status'}
                    </label>
                    <select
                      value={form.status_pkp}
                      onChange={set('status_pkp')}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all bg-white appearance-none"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                        backgroundPosition: 'right 0.5rem center',
                        backgroundRepeat: 'no-repeat',
                        backgroundSize: '1.5em 1.5em',
                        paddingRight: '2.5rem'
                      }}
                    >
                      <option value="">{lang === 'id' ? 'Pilih status PKP' : 'Select PKP status'}</option>
                      <option value="PKP">PKP</option>
                      <option value="Non-PKP">Non-PKP</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {lang === 'id' ? 'Status Kepemilikan' : 'Ownership Status'}
                    </label>
                    <select
                      value={form.status_kepemilikan}
                      onChange={set('status_kepemilikan')}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all bg-white appearance-none"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                        backgroundPosition: 'right 0.5rem center',
                        backgroundRepeat: 'no-repeat',
                        backgroundSize: '1.5em 1.5em',
                        paddingRight: '2.5rem'
                      }}
                    >
                      <option value="">{lang === 'id' ? 'Pilih status' : 'Select status'}</option>
                      <option value="Pribadi">{lang === 'id' ? 'Pribadi' : 'Personal'}</option>
                      <option value="Sewa">{lang === 'id' ? 'Sewa' : 'Rent'}</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      NPWP
                    </label>
                    <input
                      type="text"
                      value={form.npwp}
                      onChange={set('npwp')}
                      placeholder="01.234.567.8-901.000"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      NIB
                    </label>
                    <input
                      type="text"
                      value={form.nib}
                      onChange={set('nib')}
                      placeholder="1234567890123"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Upload Dokumen Pendukung */}
                <div className="border-t pt-6 mt-6">
                  <h3 className="text-md font-semibold text-gray-900 mb-1">
                    {lang === 'id' ? 'Upload Dokumen Pendukung' : 'Upload Supporting Documents'}
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* NPWP Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      NPWP
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-orange-400 transition-colors cursor-pointer">
                      <input
                        type="file"
                        id="npwp-upload"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileChange('npwp_file')}
                        className="hidden"
                      />
                      <label htmlFor="npwp-upload" className="cursor-pointer">
                        <div className="text-4xl text-gray-400 mb-2">📤</div>
                        <p className="text-sm font-medium text-gray-700">
                          {form.npwp_file ? form.npwp_file.name : (lang === 'id' ? 'Pilih file' : 'Choose file')}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG</p>
                      </label>
                    </div>
                  </div>

                  {/* NIB Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      NIB
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-orange-400 transition-colors cursor-pointer">
                      <input
                        type="file"
                        id="nib-upload"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileChange('nib_file')}
                        className="hidden"
                      />
                      <label htmlFor="nib-upload" className="cursor-pointer">
                        <div className="text-4xl text-gray-400 mb-2">📤</div>
                        <p className="text-sm font-medium text-gray-700">
                          {form.nib_file ? form.nib_file.name : (lang === 'id' ? 'Pilih file' : 'Choose file')}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG</p>
                      </label>
                    </div>
                  </div>

                  {/* KTP Direktur Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {lang === 'id' ? 'KTP Direktur' : 'Director ID'}
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-orange-400 transition-colors cursor-pointer">
                      <input
                        type="file"
                        id="ktp-upload"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileChange('ktp_file')}
                        className="hidden"
                      />
                      <label htmlFor="ktp-upload" className="cursor-pointer">
                        <div className="text-4xl text-gray-400 mb-2">📤</div>
                        <p className="text-sm font-medium text-gray-700">
                          {form.ktp_file ? form.ktp_file.name : (lang === 'id' ? 'Pilih file' : 'Choose file')}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG</p>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Informasi PIC & Gudang */}
          {currentStep === 2 && (
            <div className="p-8">
              {/* Informasi PIC Section */}
              <h2 className="text-base font-semibold text-gray-900 mb-1">
                {lang === 'id' ? 'Informasi PIC (Person in Charge)' : 'PIC (Person in Charge) Information'}
              </h2>
              <div className="h-px bg-gray-200 mb-6"></div>

              <div className="space-y-4 mb-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-normal text-gray-700 mb-2">
                      {lang === 'id' ? 'Nama PIC' : 'PIC Name'} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={form.nama_pic}
                      onChange={set('nama_pic')}
                      placeholder={lang === 'id' ? 'Nama Lengkap PIC' : 'Full PIC Name'}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-normal text-gray-700 mb-2">
                      {lang === 'id' ? 'Posisi PIC' : 'PIC Position'} <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={form.posisi_pic}
                      onChange={set('posisi_pic')}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all bg-white appearance-none"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                        backgroundPosition: 'right 0.5rem center',
                        backgroundRepeat: 'no-repeat',
                        backgroundSize: '1.5em 1.5em',
                        paddingRight: '2.5rem'
                      }}
                    >
                      <option value="">{lang === 'id' ? 'Pilih posisi PIC' : 'Select PIC position'}</option>
                      <option value="Owner">{lang === 'id' ? 'Pemilik' : 'Owner'}</option>
                      <option value="Manager">{lang === 'id' ? 'Manajer' : 'Manager'}</option>
                      <option value="Staff">{lang === 'id' ? 'Staff' : 'Staff'}</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-normal text-gray-700 mb-2">
                    {lang === 'id' ? 'Nomor Kontak PIC' : 'PIC Contact Number'}
                  </label>
                  <input
                    type="tel"
                    value={form.nomor_kontak_pic}
                    onChange={set('nomor_kontak_pic')}
                    placeholder="09090"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-normal text-gray-700 mb-2">
                    {lang === 'id' ? 'Email PIC' : 'PIC Email'}
                  </label>
                  <input
                    type="email"
                    value={form.email_pic}
                    onChange={set('email_pic')}
                    placeholder="picxx@distrihub.co"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Lokasi Gudang Section */}
              <h2 className="text-base font-semibold text-gray-900 mb-1">
                {lang === 'id' ? 'Lokasi Gudang' : 'Warehouse Location'}
              </h2>
              <div className="h-px bg-gray-200 mb-6"></div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-normal text-gray-700 mb-2">
                    {lang === 'id' ? 'Alamat Gudang' : 'Warehouse Address'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.alamat_gudang}
                    onChange={set('alamat_gudang')}
                    placeholder={lang === 'id' ? 'Jl. Raya Gudang No. 123' : '123 Warehouse St.'}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                  />
                </div>

                {/* Map Section */}
                <div>
                  <label className="block text-sm font-normal text-gray-700 mb-2">
                    {lang === 'id' ? 'Pilih Lokasi di Peta' : 'Select Location on Map'}
                  </label>
                  
                  {mapDialogOpen && (
                    <div className="mb-3 rounded-lg overflow-hidden border border-gray-300" style={{ height: '300px' }}>
                      <MapSelector
                        onLocationSelected={(lat, lng) => {
                          setSelectedCoordinates([lat, lng]);
                          setForm({ ...form, koordinat: JSON.stringify({ lat, lng }) });
                        }}
                        onAddressFound={(address) => {
                          console.log('Address found:', address);
                        }}
                        initialPosition={selectedCoordinates ? `${selectedCoordinates[0]},${selectedCoordinates[1]}` : null}
                      />
                    </div>
                  )}
                  
                  {!mapDialogOpen && selectedCoordinates && (
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-3">
                      <div className="flex items-center gap-2 text-xs text-blue-800">
                        <MapPin className="h-4 w-4" />
                        <span>
                          {lang === 'id' ? 'Lokasi dipilih:' : 'Location selected:'} {selectedCoordinates[0].toFixed(6)}, {selectedCoordinates[1].toFixed(6)}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <button
                    type="button"
                    onClick={() => setMapDialogOpen(!mapDialogOpen)}
                    className="w-full py-2.5 px-4 bg-white border-2 border-orange-400 text-orange-600 rounded-md hover:bg-orange-50 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                  >
                    <MapPin className="h-4 w-4" />
                    {mapDialogOpen 
                      ? (lang === 'id' ? 'Tutup Peta' : 'Close Map')
                      : (lang === 'id' ? 'Gunakan Lokasi Saat Ini' : 'Use Current Location')
                    }
                  </button>
                  
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    {lang === 'id' 
                      ? 'Pilih titik gudang di peta agar pengiriman lebih akurat.'
                      : 'Select warehouse location on map for more accurate delivery.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Informasi Tambahan */}
          {currentStep === 3 && (
            <div className="p-8">
              {/* Alert Info */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-6 flex items-start gap-2">
                <div className="text-yellow-600 mt-0.5">ℹ️</div>
                <div className="flex-1">
                  <p className="text-xs text-yellow-800">
                    {lang === 'id' 
                      ? 'Informasi tambahan ini opsional dan membantu proses verifikasi lebih cepat.'
                      : 'This additional information is optional and helps speed up the verification process.'}
                  </p>
                </div>
              </div>

              {/* Keterangan Bank Section */}
              <h2 className="text-base font-semibold text-gray-900 mb-1">
                {lang === 'id' ? 'Keterangan Bank' : 'Banking Information'}
              </h2>
              <div className="h-px bg-gray-200 mb-6"></div>

              <div className="space-y-4 mb-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-normal text-gray-700 mb-2">
                      {lang === 'id' ? 'Nama Bank' : 'Bank Name'}
                    </label>
                    <select
                      value={form.nama_bank}
                      onChange={set('nama_bank')}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all bg-white appearance-none"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                        backgroundPosition: 'right 0.5rem center',
                        backgroundRepeat: 'no-repeat',
                        backgroundSize: '1.5em 1.5em',
                        paddingRight: '2.5rem'
                      }}
                    >
                      <option value="">{lang === 'id' ? 'Pilih bank' : 'Select bank'}</option>
                      <option value="BCA">BCA</option>
                      <option value="Mandiri">Mandiri</option>
                      <option value="BNI">BNI</option>
                      <option value="BRI">BRI</option>
                      <option value="CIMB Niaga">CIMB Niaga</option>
                      <option value="Permata">Permata</option>
                      <option value="BTN">BTN</option>
                      <option value="Danamon">Danamon</option>
                      <option value="Lainnya">{lang === 'id' ? 'Lainnya' : 'Other'}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-normal text-gray-700 mb-2">
                      {lang === 'id' ? 'Nama Pemilik Akun' : 'Account Owner Name'}
                    </label>
                    <input
                      type="text"
                      value={form.nama_pemilik_akun}
                      onChange={set('nama_pemilik_akun')}
                      placeholder={lang === 'id' ? 'Nama sesuai rekening' : 'Name as per account'}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-normal text-gray-700 mb-2">
                    {lang === 'id' ? 'Nomor Rekening' : 'Account Number'}
                  </label>
                  <input
                    type="text"
                    value={form.nomor_rekening}
                    onChange={set('nomor_rekening')}
                    placeholder="1234567890"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Informasi Operasional Section */}
              <h2 className="text-base font-semibold text-gray-900 mb-1">
                {lang === 'id' ? 'Informasi Operasional' : 'Operational Information'}
              </h2>
              <div className="h-px bg-gray-200 mb-6"></div>

              <div className="space-y-4 mb-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-normal text-gray-700 mb-2">
                      {lang === 'id' ? 'Jumlah Karyawan' : 'Number of Employees'}
                    </label>
                    <input
                      type="text"
                      value={form.jumlah_karyawan}
                      onChange={set('jumlah_karyawan')}
                      placeholder={lang === 'id' ? 'Contoh: 50' : 'Example: 50'}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-normal text-gray-700 mb-2">
                      {lang === 'id' ? 'Jumlah Armada Pengiriman' : 'Delivery Fleet Size'}
                    </label>
                    <input
                      type="text"
                      value={form.jumlah_armada_pengiriman}
                      onChange={set('jumlah_armada_pengiriman')}
                      placeholder={lang === 'id' ? 'Contoh: 10' : 'Example: 10'}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-normal text-gray-700 mb-2">
                    {lang === 'id' ? 'Area Distribusi' : 'Distribution Area'}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={areaSearch}
                      onChange={(e) => setAreaSearch(e.target.value)}
                      placeholder={lang === 'id' ? 'Cari kota/kabupaten...' : 'Search city/regency...'}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                    />
                    {areaSearch && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {INDONESIAN_AREAS
                          .filter(area => area.toLowerCase().includes(areaSearch.toLowerCase()))
                          .slice(0, 50)
                          .map((area) => (
                            <button
                              key={area}
                              type="button"
                              onClick={() => {
                                if (!form.area_distribusi.includes(area)) {
                                  setForm({ ...form, area_distribusi: [...form.area_distribusi, area] });
                                }
                                setAreaSearch("");
                              }}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-orange-50 transition-colors"
                            >
                              {area}
                            </button>
                          ))}
                        {INDONESIAN_AREAS.filter(area => area.toLowerCase().includes(areaSearch.toLowerCase())).length === 0 && (
                          <div className="px-3 py-2 text-sm text-gray-500">
                            {lang === 'id' ? 'Tidak ada hasil' : 'No results'}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Selected Areas Tags */}
                  {form.area_distribusi.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {form.area_distribusi.map((area) => (
                        <div
                          key={area}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 text-orange-700 text-sm rounded-md border border-orange-200"
                        >
                          <span>{area}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setForm({ ...form, area_distribusi: form.area_distribusi.filter(a => a !== area) });
                            }}
                            className="hover:bg-orange-200 rounded-full p-0.5 transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <p className="text-xs text-gray-500 mt-1">
                    {lang === 'id' ? 'Ketik untuk mencari dan pilih kota/kabupaten' : 'Type to search and select cities/regencies'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-normal text-gray-700 mb-2">
                    {lang === 'id' ? 'Aplikasi Penjualan Sales yang Digunakan' : 'Sales Application Used'}
                  </label>
                  <div className="relative">
                    <select
                      onChange={(e) => {
                        const selectedApp = e.target.value;
                        if (selectedApp && !form.aplikasi_penjualan.includes(selectedApp)) {
                          setForm({ ...form, aplikasi_penjualan: [...form.aplikasi_penjualan, selectedApp] });
                        }
                        e.target.value = ""; // Reset dropdown
                      }}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all bg-white appearance-none"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                        backgroundPosition: 'right 0.5rem center',
                        backgroundRepeat: 'no-repeat',
                        backgroundSize: '1.5em 1.5em',
                        paddingRight: '2.5rem'
                      }}
                    >
                      <option value="">{lang === 'id' ? 'Pilih aplikasi...' : 'Select application...'}</option>
                      {[
                        'Zahir Accounting',
                        'MYOB',
                        'Kledo',
                        'BukuWarung',
                        'BukuKas',
                        'Olsera',
                        'Pawoon',
                        'Moka POS',
                        'Jurnal',
                        'Accurate',
                        'SAP',
                        'Oracle',
                        'Microsoft Excel',
                        'Google Sheets',
                        lang === 'id' ? 'Lainnya' : 'Other'
                      ].map((app) => (
                        <option key={app} value={app}>{app}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Selected Apps Tags */}
                  {form.aplikasi_penjualan.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {form.aplikasi_penjualan.map((app) => (
                        <div
                          key={app}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 text-orange-700 text-sm rounded-md border border-orange-200"
                        >
                          <span>{app}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setForm({ ...form, aplikasi_penjualan: form.aplikasi_penjualan.filter(a => a !== app) });
                            }}
                            className="hover:bg-orange-200 rounded-full p-0.5 transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <p className="text-xs text-gray-500 mt-1">
                    {lang === 'id' ? 'Pilih satu atau lebih aplikasi yang digunakan' : 'Select one or more applications used'}
                  </p>
                </div>

                {/* Metode Pembayaran Lumum */}
                <div>
                  <label className="block text-sm font-normal text-gray-700 mb-3">
                    {lang === 'id' ? 'Metode Pembayaran Umum' : 'Common Payment Methods'}
                  </label>
                  <div className="space-y-2">
                    {['Tunai', 'Kartu Kredit', 'Bank Transfer', 'Lainnya'].map((metode) => (
                      <label key={metode} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={form.metode_pembayaran.includes(metode)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setForm({ ...form, metode_pembayaran: [...form.metode_pembayaran, metode] });
                            } else {
                              setForm({ ...form, metode_pembayaran: form.metode_pembayaran.filter(m => m !== metode) });
                            }
                          }}
                          className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{metode}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Info Note */}
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3 flex items-start gap-2">
                <div className="text-blue-600 mt-0.5">ℹ️</div>
                <div className="flex-1">
                  <p className="text-xs text-blue-800">
                    {lang === 'id' 
                      ? 'Informasi tambahan ini opsional dan membantu proses verifikasi lebih cepat.'
                      : 'This additional information is optional and helps speed up the verification process.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="px-8 py-5 bg-gray-50 border-t flex items-center justify-between rounded-b-lg">
            <Button
              type="button"
              variant="outline"
              onClick={currentStep === 1 ? () => navigate('/profil') : handleBack}
              className="px-5 py-2 text-sm border-gray-300"
            >
              ← {lang === 'id' ? 'Kembali' : 'Back'}
            </Button>

            {currentStep < 3 ? (
              <Button
                type="button"
                onClick={handleNext}
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 text-sm rounded-md"
              >
                {lang === 'id' ? 'Selanjutnya' : 'Next'} →
              </Button>
            ) : (
              <Button
                type="button"
                onClick={(e) => {
                  console.log('Submit button clicked manually');
                  const formEvent = new Event('submit', { bubbles: true, cancelable: true });
                  e.currentTarget.closest('form')?.dispatchEvent(formEvent);
                }}
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 text-sm rounded-md"
              >
                {lang === 'id' ? 'Submit Formulir' : 'Submit Form'}
              </Button>
            )}
          </div>
        </form>
      </main>
    </div>
  );
}
