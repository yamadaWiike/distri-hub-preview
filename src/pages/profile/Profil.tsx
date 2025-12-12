// React & Router
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

// External Libraries & Icons
import { AlertCircle, MapPin } from "lucide-react";
import type { PostgrestResponse } from "@supabase/supabase-js";
import "leaflet/dist/leaflet.css";

// UI Components
import SEO from "@/components/seo/SEO";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import MapSelector from "@/components/ui/map-selector";

// Hooks
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";

// Utils & API
import { translations } from "@/lib/translations";
import { uploadFileToS3, getImageUrl } from "@/lib/s3-upload";
import PresignedImage from "@/components/ui/PresignedImage";
import { getImageUrlAsync } from "@/lib/s3-upload";

// Integrations & Types
import { Database } from "@/integrations/supabase/types";

// Indonesian Cities and Regencies
const INDONESIAN_AREAS = [
  // DKI Jakarta
  "Jakarta Pusat",
  "Jakarta Utara",
  "Jakarta Barat",
  "Jakarta Selatan",
  "Jakarta Timur",
  "Kepulauan Seribu",
  // Jawa Barat
  "Bandung",
  "Kota Bandung",
  "Bekasi",
  "Kota Bekasi",
  "Bogor",
  "Kota Bogor",
  "Cirebon",
  "Kota Cirebon",
  "Depok",
  "Sukabumi",
  "Kota Sukabumi",
  "Tasikmalaya",
  "Kota Tasikmalaya",
  "Banjar",
  "Cimahi",
  "Garut",
  "Indramayu",
  "Karawang",
  "Kuningan",
  "Majalengka",
  "Pangandaran",
  "Purwakarta",
  "Subang",
  "Sumedang",
  "Ciamis",
  "Cianjur",
  // Jawa Tengah
  "Semarang",
  "Surakarta (Solo)",
  "Magelang",
  "Kota Magelang",
  "Salatiga",
  "Pekalongan",
  "Kota Pekalongan",
  "Tegal",
  "Kota Tegal",
  "Banyumas",
  "Cilacap",
  "Purbalingga",
  "Banjarnegara",
  "Kebumen",
  "Purworejo",
  "Wonosobo",
  "Boyolali",
  "Klaten",
  "Sukoharjo",
  "Wonogiri",
  "Karanganyar",
  "Sragen",
  "Grobogan",
  "Blora",
  "Rembang",
  "Pati",
  "Kudus",
  "Jepara",
  "Demak",
  "Semarang (Kab.)",
  "Temanggung",
  "Kendal",
  "Batang",
  "Pemalang",
  "Brebes",
  // DI Yogyakarta
  "Yogyakarta",
  "Sleman",
  "Bantul",
  "Kulon Progo",
  "Gunung Kidul",
  // Jawa Timur
  "Surabaya",
  "Malang",
  "Kota Malang",
  "Kediri",
  "Kota Kediri",
  "Blitar",
  "Kota Blitar",
  "Madiun",
  "Kota Madiun",
  "Mojokerto",
  "Kota Mojokerto",
  "Pasuruan",
  "Kota Pasuruan",
  "Probolinggo",
  "Kota Probolinggo",
  "Batu",
  "Jember",
  "Lumajang",
  "Bondowoso",
  "Situbondo",
  "Banyuwangi",
  "Gresik",
  "Sidoarjo",
  "Bangkalan",
  "Sampang",
  "Pamekasan",
  "Sumenep",
  "Nganjuk",
  "Magetan",
  "Ngawi",
  "Bojonegoro",
  "Tuban",
  "Lamongan",
  "Jombang",
  "Tulungagung",
  "Trenggalek",
  "Pacitan",
  "Ponorogo",
  // Banten
  "Tangerang",
  "Kota Tangerang",
  "Tangerang Selatan",
  "Serang",
  "Kota Serang",
  "Cilegon",
  "Lebak",
  "Pandeglang",
  // Bali
  "Denpasar",
  "Badung",
  "Gianyar",
  "Tabanan",
  "Klungkung",
  "Bangli",
  "Karangasem",
  "Buleleng",
  "Jembrana",
  // Other major cities
  "Medan",
  "Palembang",
  "Makassar",
  "Banjarmasin",
  "Balikpapan",
  "Samarinda",
  "Manado",
  "Palu",
  "Pontianak",
];

// Extended type for distributor profile that includes all possible fields
type ExtendedDistributorProfile =
  Database["public"]["Tables"]["distributor_profiles"]["Row"] & {
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
    // Document URLs
    npwp_file_url?: string;
    nib_file_url?: string;
    ktp_file_url?: string;
    // PIC fields
    nama_pic?: string;
    posisi_pic?: string;
    nomor_kontak_pic?: string;
    email_pic?: string;
    // Banking fields
    nama_bank?: string;
    nama_pemilik_akun?: string;
    nomor_rekening?: string;
    jumlah_armada_pengiriman?: string;
    metode_pembayaran?: string;
    aplikasi_pencatatan?: string;
    area_distribusi?: string;
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

    // Document URLs
    npwp_file_url: "",
    nib_file_url: "",
    ktp_file_url: "",

    // PIC fields
    nama_pic: "",
    posisi_pic: "",
    nomor_kontak_pic: "",
    email_pic: "",

    // Banking fields
    nama_bank: "",
    nama_pemilik_akun: "",
    nomor_rekening: "",
    jumlah_armada_pengiriman: "",
    metode_pembayaran: "",
    aplikasi_pencatatan: "",
    area_distribusi: "",
  });

  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [mapDialogOpen, setMapDialogOpen] = useState(false);
  const [selectedCoordinates, setSelectedCoordinates] = useState<
    [number, number] | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [userStatus, setUserStatus] = useState<
    "pending" | "active" | "incomplete"
  >("pending");
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [documentPreview, setDocumentPreview] = useState<{
    url: string;
    title: string;
  } | null>(null);

  // Calculate profile completion percentage
  const calculateProfileCompletion = useCallback(() => {
    const requiredFields = [
      form.nama_bisnis,
      form.nama_pemilik,
      form.kontak_pemilik,
      form.email_pemilik,
      form.alamat_lengkap,
      form.kota,
      form.email_perusahaan,
      form.nomor_telp_perusahaan,
      form.nama_direktur,
      form.npwp_number,
      form.nib_number,
      form.status_pkp,
      form.alamat_gudang,
    ];

    const filledFields = requiredFields.filter(
      (field) => field && field.trim() !== ""
    ).length;
    const percentage = Math.round((filledFields / requiredFields.length) * 100);
    setProfileCompletion(percentage);

    return percentage;
  }, [form]);

  // Update profile completion when form changes
  useEffect(() => {
    if (!isLoading && profileLoaded) {
      calculateProfileCompletion();
    }
  }, [calculateProfileCompletion, isLoading, profileLoaded]);

  // Load profile data from Supabase if user is logged in
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user || !user.id) return;

      try {
        setIsLoading(true);
        // Import supabase client
        const { supabase } = await import("@/integrations/supabase/client");

        // Fetch profile data
        const { data, error } = await supabase
          .from("distributor_profiles")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle<
            Database["public"]["Tables"]["distributor_profiles"]["Row"]
          >();

        if (error && error.code !== "PGRST116") {
          console.error("Error fetching profile:", error);
          setProfileLoaded(false);
          return;
        }

        // If we have data, populate the form
        if (data) {
          // Set user status based on profile status
          const status = data.status || "pending";
          setUserStatus(status as "pending" | "active" | "incomplete");

          setForm({
            nama_bisnis: data.nama_bisnis || "",
            alamat_lengkap: data.alamat_lengkap || "",
            kota: data.kota || "",
            nama_pemilik: data.nama_pemilik || "",
            kontak_pemilik: data.kontak_pemilik || "",
            email_pemilik:
              (data as ExtendedDistributorProfile).email_pemilik ||
              data.email ||
              user.email ||
              "", // Use from DB or fall back to user email
            omzet: (data as ExtendedDistributorProfile).omzet || "",
            alamat_kantor:
              (data as ExtendedDistributorProfile).alamat_kantor || "",
            alamat_gudang:
              (data as ExtendedDistributorProfile).alamat_gudang || "",
            bentuk_usaha:
              (data as ExtendedDistributorProfile).bentuk_usaha || "",
            foto_gudang: (data as ExtendedDistributorProfile).foto_gudang || "",
            koordinat: (data as ExtendedDistributorProfile).koordinat || "",
            nib: (data as ExtendedDistributorProfile).nib || "",
            // New fields added to the database
            npwp: (data as ExtendedDistributorProfile).npwp || "",
            website_perusahaan:
              (data as ExtendedDistributorProfile).website_perusahaan || "",
            jumlah_karyawan: (data as ExtendedDistributorProfile)
              .jumlah_karyawan
              ? String((data as ExtendedDistributorProfile).jumlah_karyawan)
              : "",
            // KYB and company fields
            email_perusahaan:
              (data as ExtendedDistributorProfile).email_perusahaan || "",
            nomor_telp_perusahaan:
              (data as ExtendedDistributorProfile).nomor_telp_perusahaan || "",
            nama_direktur:
              (data as ExtendedDistributorProfile).nama_direktur || "",
            status_pkp:
              (data as ExtendedDistributorProfile).status_pkp || "Non-PKP",
            npwp_number: (data as ExtendedDistributorProfile).npwp_number || "",
            nib_number: (data as ExtendedDistributorProfile).nib_number || "",
            // Document URLs
            npwp_file_url:
              (data as ExtendedDistributorProfile).npwp_file_url || "",
            nib_file_url:
              (data as ExtendedDistributorProfile).nib_file_url || "",
            ktp_file_url:
              (data as ExtendedDistributorProfile).ktp_file_url || "",
            // PIC fields
            nama_pic:
              (data as ExtendedDistributorProfile).nama_pic ||
              data.nama_pemilik ||
              "",
            posisi_pic: (data as ExtendedDistributorProfile).posisi_pic || "",
            nomor_kontak_pic:
              (data as ExtendedDistributorProfile).nomor_kontak_pic ||
              data.kontak_pemilik ||
              "",
            email_pic:
              (data as ExtendedDistributorProfile).email_pic ||
              (data as ExtendedDistributorProfile).email_pemilik ||
              "",
            // Banking fields
            nama_bank: (data as ExtendedDistributorProfile).nama_bank || "",
            nama_pemilik_akun:
              (data as ExtendedDistributorProfile).nama_pemilik_akun || "",
            nomor_rekening:
              (data as ExtendedDistributorProfile).nomor_rekening || "",
            jumlah_armada_pengiriman:
              (data as ExtendedDistributorProfile).jumlah_armada_pengiriman ||
              "",
            metode_pembayaran:
              (data as ExtendedDistributorProfile).metode_pembayaran || "",
            aplikasi_pencatatan:
              (data as ExtendedDistributorProfile).aplikasi_pencatatan || "",
            area_distribusi:
              (data as ExtendedDistributorProfile).area_distribusi || "",
          });

          console.log("Loaded operational fields from DB:", {
            metode_pembayaran: (data as ExtendedDistributorProfile)
              .metode_pembayaran,
            aplikasi_pencatatan: (data as ExtendedDistributorProfile)
              .aplikasi_pencatatan,
            area_distribusi: (data as ExtendedDistributorProfile)
              .area_distribusi,
          });
          setProfileLoaded(true);
        } else {
          // If no profile data yet but we have user data, create a minimal profile row with the registration email
          try {
            const payload: Record<string, string> = {
              user_id: user.id,
              email_pemilik: user.email || "",
              status: "incomplete",
              nama_bisnis: "",
              alamat_lengkap: "",
              kota: "",
              nama_pemilik: "",
              kontak_pemilik: "",
            };
            const { error: insertError } = await supabase
              .from("distributor_profiles")
              .insert(payload);
            if (insertError) {
              console.warn("Unable to create initial distributor profile:", insertError);
            }
          } catch (ie) {
            console.warn("Exception creating initial distributor profile:", ie);
          }

          // Prefill local form so user sees their registration email immediately
          setForm((prev) => ({
            ...prev,
            nama_bisnis: user.namaBisnis || "",
            kota: user.kota || "",
            email_pemilik: user.email || "",
          }));
          setProfileLoaded(true);
        }
      } catch (e) {
        console.error("Error loading profile data:", e);
        setProfileLoaded(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, [user]);

  // Also check localStorage as fallback
  useEffect(() => {
    if (!isLoading) {
      const savedProfile = localStorage.getItem("baskit_profile");
      if (savedProfile) {
        try {
          const parsedProfile = JSON.parse(savedProfile);
          // Only use localStorage data for fields that aren't already populated
          setForm((prev) => {
            const updatedForm = { ...prev };
            Object.keys(parsedProfile).forEach((key) => {
              // Only update empty fields or fields that aren't in the database schema
              if (
                !updatedForm[key as keyof typeof updatedForm] ||
                ["npwp", "website_perusahaan", "jumlah_karyawan"].includes(key)
              ) {
                // Use type assertion with specific object type
                (updatedForm as Record<string, string>)[key] =
                  parsedProfile[key];
              }
            });
            return updatedForm;
          });
          // Consider localStorage as a valid data source for completion
          setProfileLoaded(true);
        } catch (e) {
          console.error("Error loading saved profile:", e);
        }
      }
    }
  }, [isLoading]);

  useEffect(() => {
    if (!user) navigate("/masuk");
  }, [user, navigate]);

  const set =
    (k: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm({ ...form, [k]: e.target.value });

  const setTemp =
    (k: string) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >
    ) =>
      setTempForm({ ...tempForm, [k]: e.target.value });

  // File upload handler
  const handleFileChange =
    (fileType: "npwp_file" | "nib_file" | "ktp_file" | "foto_gudang") =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        setTempFiles({ ...tempFiles, [fileType]: e.target.files[0] });
      }
    };

  // Upload file to S3
  const uploadFileToS3 = async (
    file: File,
    folder: string
  ): Promise<string | null> => {
    try {
      const { uploadFileToS3: s3Upload } = await import("@/lib/s3-upload");
      const result = await s3Upload(file, folder);
      const fileUrl = result.url;
      return fileUrl;
    } catch (error) {
      console.error("Error uploading file:", error);
      return null;
    }
  };

  // Save section edits
  const saveOwnerInfo = async () => {
    if (!user?.id) return;

    try {
      setIsSubmitting(true);
      const { supabase } = await import("@/integrations/supabase/client");

      // Prevent overwriting non-empty email with empty value
      const nextEmailPemilik = (tempForm.email_pemilik && tempForm.email_pemilik.trim().length > 0)
        ? tempForm.email_pemilik
        : (form.email_pemilik || "");

      const { error } = await supabase
        .from("distributor_profiles")
        // @ts-expect-error - Bypassing type check
        .update({
          nama_pemilik: tempForm.nama_pemilik,
          kontak_pemilik: tempForm.kontak_pemilik,
          email_pemilik: nextEmailPemilik,
        })
        .eq("user_id", user.id);

      if (error) throw error;

      setForm(tempForm);
      setEditOwnerOpen(false);
      toast({
        title: "Berhasil",
        description: "Informasi pemilik berhasil diperbarui",
      });
    } catch (error) {
      console.error("Error updating owner info:", error);
      toast({
        title: "Gagal",
        description: "Gagal memperbarui informasi",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveCompanyInfo = async () => {
    if (!user?.id) return;

    try {
      setIsSubmitting(true);
      setUploadingFiles(true);
      const { supabase } = await import("@/integrations/supabase/client");

      // Prevent overwriting non-empty company email with empty value
      const nextCompanyEmail = (tempForm.email_perusahaan && tempForm.email_perusahaan.trim().length > 0)
        ? tempForm.email_perusahaan
        : (form.email_perusahaan || "");

      // Upload files if they exist
      const updateData: Record<string, string | null | undefined> = {
        nama_bisnis: tempForm.nama_bisnis,
        email_perusahaan: nextCompanyEmail,
        nomor_telp_perusahaan: tempForm.nomor_telp_perusahaan,
        nama_direktur: tempForm.nama_direktur,
        alamat_lengkap: tempForm.alamat_lengkap,
        kota: tempForm.kota,
        status_pkp: tempForm.status_pkp,
        bentuk_usaha: tempForm.bentuk_usaha,
        npwp_number: tempForm.npwp_number,
        nib_number: tempForm.nib_number,
        website_perusahaan: tempForm.website_perusahaan,
      };

      // Upload NPWP file
      if (tempFiles.npwp_file) {
        const npwpUrl = await uploadFileToS3(
          tempFiles.npwp_file,
          "documents/npwp"
        );
        if (npwpUrl) {
          updateData.npwp_file_url = npwpUrl;
          setTempForm({ ...tempForm, npwp_file_url: npwpUrl });
        }
      }

      // Upload NIB file
      if (tempFiles.nib_file) {
        const nibUrl = await uploadFileToS3(
          tempFiles.nib_file,
          "documents/nib"
        );
        if (nibUrl) {
          updateData.nib_file_url = nibUrl;
          setTempForm({ ...tempForm, nib_file_url: nibUrl });
        }
      }

      // Upload KTP file
      if (tempFiles.ktp_file) {
        const ktpUrl = await uploadFileToS3(
          tempFiles.ktp_file,
          "documents/ktp"
        );
        if (ktpUrl) {
          updateData.ktp_file_url = ktpUrl;
          setTempForm({ ...tempForm, ktp_file_url: ktpUrl });
        }
      }

      const { error } = await supabase
        .from("distributor_profiles")
        // @ts-expect-error - Bypassing type check
        .update(updateData)
        .eq("user_id", user.id);

      if (error) throw error;

      setForm(tempForm);
      setTempFiles({
        npwp_file: null,
        nib_file: null,
        ktp_file: null,
        foto_gudang: null,
      });
      setEditCompanyOpen(false);
      toast({
        title: "Berhasil",
        description: "Profil perusahaan berhasil diperbarui",
      });
    } catch (error) {
      console.error("Error updating company info:", error);
      toast({
        title: "Gagal",
        description: "Gagal memperbarui informasi",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setUploadingFiles(false);
    }
  };

  const saveWarehouseInfo = async () => {
    if (!user?.id) return;

    try {
      setIsSubmitting(true);
      setUploadingFiles(true);
      const { supabase } = await import("@/integrations/supabase/client");

      // Default email_pic to owner email if empty
      const nextEmailPic = (tempForm.email_pic && tempForm.email_pic.trim().length > 0)
        ? tempForm.email_pic
        : (form.email_pemilik || "");

      const updateData: Record<string, string | null | undefined> = {
        nama_pic: tempForm.nama_pic,
        posisi_pic: tempForm.posisi_pic,
        nomor_kontak_pic: tempForm.nomor_kontak_pic,
        email_pic: nextEmailPic,
        alamat_gudang: tempForm.alamat_gudang,
        koordinat: tempForm.koordinat,
      };

      // Upload warehouse photo if exists
      if (tempFiles.foto_gudang) {
        const photoUrl = await uploadFileToS3(
          tempFiles.foto_gudang,
          "warehouse"
        );
        if (photoUrl) {
          updateData.foto_gudang = photoUrl;
          setTempForm({ ...tempForm, foto_gudang: photoUrl });
        }
      }

      const { error } = await supabase
        .from("distributor_profiles")
        // @ts-expect-error - Bypassing type check
        .update(updateData)
        .eq("user_id", user.id);

      if (error) throw error;

      setForm(tempForm);
      setTempFiles({ ...tempFiles, foto_gudang: null });
      setEditWarehouseOpen(false);
      toast({
        title: "Berhasil",
        description: "Informasi gudang berhasil diperbarui",
      });
    } catch (error) {
      console.error("Error updating warehouse info:", error);
      toast({
        title: "Gagal",
        description: "Gagal memperbarui informasi",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setUploadingFiles(false);
    }
  };

  const saveBankingInfo = async () => {
    if (!user?.id) return;

    try {
      setIsSubmitting(true);
      const { supabase } = await import("@/integrations/supabase/client");

      const updateData = {
        nama_bank: tempForm.nama_bank,
        nama_pemilik_akun: tempForm.nama_pemilik_akun,
        nomor_rekening: tempForm.nomor_rekening,
        jumlah_karyawan: tempForm.jumlah_karyawan
          ? parseInt(tempForm.jumlah_karyawan, 10)
          : null,
        jumlah_armada_pengiriman: tempForm.jumlah_armada_pengiriman,
        metode_pembayaran: tempForm.metode_pembayaran,
        aplikasi_pencatatan: tempForm.aplikasi_pencatatan,
        area_distribusi: tempForm.area_distribusi,
      };

      const { error } = await supabase
        .from("distributor_profiles")
        // @ts-expect-error - Bypassing type check
        .update(updateData)
        .eq("user_id", user.id);

      if (error) {
        console.error("Database error:", error);
        throw error;
      }

      console.log("Banking info saved successfully");

      setForm(tempForm);
      setEditBankingOpen(false);
      toast({
        title: "Berhasil",
        description: "Informasi operasional berhasil diperbarui",
      });
    } catch (error) {
      console.error("Error updating banking info:", error);
      toast({
        title: "Gagal",
        description: "Gagal memperbarui informasi",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Detect user location
  const detectUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError(
        lang === "id"
          ? "Geolokasi tidak didukung oleh browser Anda"
          : "Geolocation is not supported by your browser"
      );
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setForm((prev) => ({
          ...prev,
          koordinat: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
        }));
        setIsLocating(false);
      },
      (error) => {
        setLocationError(
          error.code === 1
            ? lang === "id"
              ? "Izin lokasi ditolak. Silakan izinkan akses lokasi."
              : "Location permission denied. Please allow location access."
            : lang === "id"
            ? "Gagal mendeteksi lokasi Anda. Silakan masukkan koordinat secara manual."
            : "Failed to detect your location. Please enter coordinates manually."
        );
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  }, [lang]);

  // Handle address found from map
  const handleAddressFound = useCallback((address: string) => {
    setForm((prev) => ({
      ...prev,
      alamatGudang: address,
    }));
  }, []);

  // Handle map location selection
  const handleMapPinSelection = (lat: number, lng: number) => {
    // Update the form with selected coordinates
    setForm((prev) => ({
      ...prev,
      koordinat: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
    }));

    // Reset the selected coordinates and close the dialog
    setSelectedCoordinates(null);
    setMapDialogOpen(false);
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Edit dialogs state
  const [editOwnerOpen, setEditOwnerOpen] = useState(false);
  const [editCompanyOpen, setEditCompanyOpen] = useState(false);
  const [editWarehouseOpen, setEditWarehouseOpen] = useState(false);
  const [editBankingOpen, setEditBankingOpen] = useState(false);
  const [editMapDialogOpen, setEditMapDialogOpen] = useState(false);
  const [editSelectedCoordinates, setEditSelectedCoordinates] = useState<
    [number, number] | null
  >(null);
  const [areaSearch, setAreaSearch] = useState("");

  // Temporary form state for editing
  const [tempForm, setTempForm] = useState(form);

  // File upload states
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [tempFiles, setTempFiles] = useState<{
    npwp_file: File | null;
    nib_file: File | null;
    ktp_file: File | null;
    foto_gudang: File | null;
  }>({
    npwp_file: null,
    nib_file: null,
    ktp_file: null,
    foto_gudang: null,
  });

  // Initialize selected coordinates when dialog opens
  useEffect(() => {
    if (mapDialogOpen && form.koordinat) {
      try {
        const [lat, lng] = form.koordinat
          .split(",")
          .map((coord) => parseFloat(coord.trim()));
        if (!isNaN(lat) && !isNaN(lng)) {
          setSelectedCoordinates([lat, lng]);
        }
      } catch (error) {
        console.error("Error parsing coordinates:", error);
      }
    }
  }, [mapDialogOpen, form.koordinat]);

  // Handle edit map location selection (temporarily store coordinates)
  const handleEditMapPinSelection = (lat: number, lng: number) => {
    // Store coordinates temporarily without closing the dialog
    setEditSelectedCoordinates([lat, lng]);
  };

  // Confirm and save the selected coordinates
  const confirmEditMapLocation = () => {
    if (editSelectedCoordinates) {
      const [lat, lng] = editSelectedCoordinates;
      // Update tempForm with selected coordinates in JSON format
      setTempForm((prev) => ({
        ...prev,
        koordinat: JSON.stringify({ lat, lng }),
      }));
    }

    // Reset and close
    setEditSelectedCoordinates(null);
    setEditMapDialogOpen(false);
  };

  // Initialize edit coordinates when dialog opens
  useEffect(() => {
    if (editMapDialogOpen && tempForm.koordinat) {
      try {
        const [lat, lng] = tempForm.koordinat
          .split(",")
          .map((coord) => parseFloat(coord.trim()));
        if (!isNaN(lat) && !isNaN(lng)) {
          setEditSelectedCoordinates([lat, lng]);
        }
      } catch (error) {
        console.error("Error parsing edit coordinates:", error);
      }
    }
  }, [editMapDialogOpen, tempForm.koordinat]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      toast({
        title: "Gagal",
        description: "Silakan masuk terlebih dahulu",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Save to localStorage as a backup
      localStorage.setItem("baskit_profile", JSON.stringify(form));

      // Import supabase client
      const { supabase } = await import("@/integrations/supabase/client");

      // Check if profile already exists
      const { data: existingProfile } = await supabase
        .from("distributor_profiles")
        .select("id")
        .eq("user_id", user.id)
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
        jumlah_karyawan: form.jumlah_karyawan
          ? parseInt(form.jumlah_karyawan, 10)
          : null,
        npwp: form.npwp || null,
      };

      let result;
      if (existingProfile) {
        // Update existing profile
        // Note: @ts-expect-error is used below to bypass TypeScript errors due to
        // type incompatibility issues with Supabase client. This is a known issue
        // with typing between the client and schema definitions.
        result = await supabase
          .from("distributor_profiles")
          // @ts-expect-error - Bypassing type check for Supabase client compatibility
          .update(profileData)
          .eq("id", existingProfile.id);
      } else {
        // Insert new profile
        // Using the same type bypass approach as above
        result = await supabase
          .from("distributor_profiles")
          // @ts-expect-error - Bypassing type check for Supabase client compatibility
          .insert(profileData);
      }

      if (result.error) {
        throw result.error;
      }

      setSubmitSuccess(true);
      toast({
        title: lang === "id" ? "Berhasil" : "Success",
        description:
          lang === "id"
            ? "Profil Anda berhasil disimpan"
            : "Your profile has been saved successfully",
      });

      // Redirect after a short delay
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: lang === "id" ? "Gagal" : "Failed",
        description:
          lang === "id"
            ? "Terjadi kesalahan saat menyimpan profil. Silakan coba lagi."
            : "An error occurred while saving your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO
        title={
          lang === "id"
            ? "Profil | Baskit Distributor Hub"
            : "Profile | Baskit Distributor Hub"
        }
        description={
          lang === "id"
            ? "Kelola profil dan informasi bisnis Anda."
            : "Manage your profile and business information."
        }
      />
      <Navbar />
      <main className="container max-w-4xl mx-auto py-8 px-4">
        {isLoading ? (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <div className="inline-block h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <h2 className="text-lg font-semibold text-gray-700 mb-2">
              {lang === "id" ? "Memuat Profil" : "Loading Profile"}
            </h2>
            <p className="text-gray-500">
              {lang === "id"
                ? "Mohon tunggu, sedang mengambil data profil Anda..."
                : "Please wait, loading your profile data..."}
            </p>
          </div>
        ) : (
          <>
            {/* User Info Header Card */}
            <div className="bg-white rounded-lg shadow-sm border mb-6">
              <div className="p-6">
                {/* Profile Avatar and Name */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-14 h-14 rounded-full bg-orange-500 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                    {form.nama_bisnis?.charAt(0).toUpperCase() ||
                      user?.email?.charAt(0).toUpperCase() ||
                      "U"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h1 className="text-lg font-semibold text-gray-900 mb-1">
                      {form.nama_bisnis || "Nama Bisnis Belum Diisi"}
                    </h1>
                    <p className="text-sm text-gray-600">
                      {user?.email || "Email tidak tersedia"}
                    </p>
                  </div>
                </div>

                {/* Status and Progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Status Akun
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {profileCompletion}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        profileCompletion === 100
                          ? "bg-green-500"
                          : profileCompletion >= 60
                          ? "bg-orange-500"
                          : "bg-yellow-400"
                      }`}
                      style={{ width: `${profileCompletion}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    {userStatus === "pending" && (
                      <span className="inline-flex items-center px-2.5 py-1 bg-yellow-50 text-yellow-700 rounded text-xs font-medium">
                        ⏱️ Menunggu Persetujuan
                      </span>
                    )}
                    {userStatus === "active" && profileCompletion < 100 && (
                      <span className="inline-flex items-center px-2.5 py-1 bg-orange-50 text-orange-700 rounded text-xs font-medium">
                        📝 Belum Lengkap
                      </span>
                    )}
                    {userStatus === "active" && profileCompletion === 100 && (
                      <span className="inline-flex items-center px-2.5 py-1 bg-green-50 text-green-700 rounded text-xs font-medium">
                        ✅ Aktif
                      </span>
                    )}
                  </div>
                </div>

                {/* Alert Message - Different messages based on status */}
                {userStatus === "pending" && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex gap-3">
                      <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-yellow-800 leading-relaxed">
                          {lang === "id"
                            ? "ℹ️ Pendaftaran Anda sedang ditinjau oleh tim kami. Anda akan menerima notifikasi via email setelah disetujui. Proses ini biasanya memakan waktu 1-2 hari kerja."
                            : "ℹ️ Your registration is being reviewed by our team. You will receive an email notification once approved. This process typically takes 1-2 business days."}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {userStatus === "active" && profileCompletion < 100 && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex flex-col gap-3">
                      <div className="flex gap-3">
                        <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm text-orange-800 leading-relaxed mb-3">
                            {lang === "id"
                              ? "Lengkapi profil untuk mendapatkan akses penuh ke semua fitur"
                              : "Complete your profile to get full access to all features"}
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                        onClick={() => navigate("/lengkapi-profil")}
                      >
                        {lang === "id"
                          ? "Lengkapi Profil Sekarang"
                          : "Complete Profile Now"}
                      </Button>
                    </div>
                  </div>
                )}

                {userStatus === "active" && profileCompletion === 100 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex gap-3">
                      <svg
                        className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <div className="flex-1">
                        <p className="text-sm text-green-800 leading-relaxed">
                          {lang === "id"
                            ? "✅ Profil Anda lengkap dan telah diverifikasi. Anda dapat mengakses semua fitur."
                            : "✅ Your profile is complete and verified. You can access all features."}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <form onSubmit={onSubmit}>
              {/* Informasi Pemilik */}
              <div className="bg-white rounded-lg shadow-sm border mb-4">
                <div className="px-6 py-4 border-b flex items-center justify-between">
                  <h2 className="text-sm font-semibold flex items-center gap-2">
                    <span className="text-lg">👤</span>
                    {lang === "id" ? "Informasi Pemilik" : "Owner Information"}
                  </h2>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    onClick={() => {
                      setTempForm(form);
                      setEditOwnerOpen(true);
                    }}
                  >
                    ✏️ Edit
                  </Button>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-4 text-sm">
                    <div>
                      <p className="text-gray-500 mb-1">Nama Pemilik</p>
                      <p className="font-medium text-gray-900">
                        {form.nama_pemilik || (
                          <span className="text-gray-400 italic">
                            {lang === "id" ? "Belum diisi" : "Not filled"}
                          </span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Nomor HP Pemilik</p>
                      <p className="font-medium text-gray-900">
                        {form.kontak_pemilik || (
                          <span className="text-gray-400 italic">
                            {lang === "id" ? "Belum diisi" : "Not filled"}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-gray-500 mb-1">Email Pemilik</p>
                      <p className="font-medium text-gray-900">
                        {form.email_pemilik || user?.email || (
                          <span className="text-gray-400 italic">
                            {lang === "id"
                              ? "Email tidak tersedia"
                              : "Email not available"}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Profil Perusahaan */}
              <div className="bg-white rounded-lg shadow-sm border mb-4">
                <div className="px-6 py-4 border-b flex items-center justify-between">
                  <h2 className="text-sm font-semibold flex items-center gap-2">
                    <span className="text-lg">🏢</span>
                    {lang === "id" ? "Profil Perusahaan" : "Company Profile"}
                  </h2>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    onClick={() => {
                      setTempForm(form);
                      setTempFiles({
                        npwp_file: null,
                        nib_file: null,
                        ktp_file: null,
                        foto_gudang: null,
                      });
                      setEditCompanyOpen(true);
                    }}
                  >
                    ✏️ Edit
                  </Button>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-4 text-sm">
                    <div>
                      <p className="text-gray-500 mb-1">Nama Perusahaan</p>
                      <p className="font-medium text-gray-900">
                        {form.nama_bisnis || (
                          <span className="text-gray-400 italic">
                            {lang === "id" ? "Belum diisi" : "Not filled"}
                          </span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Email Perusahaan</p>
                      <p className="font-medium text-gray-900">
                        {form.email_perusahaan || (
                          <span className="text-gray-400 italic">
                            {lang === "id" ? "Belum diisi" : "Not filled"}
                          </span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Nomor Kontak</p>
                      <p className="font-medium text-gray-900">
                        {form.nomor_telp_perusahaan || (
                          <span className="text-gray-400 italic">
                            {lang === "id" ? "Belum diisi" : "Not filled"}
                          </span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Nama Direktur</p>
                      <p className="font-medium text-gray-900">
                        {form.nama_direktur || (
                          <span className="text-gray-400 italic">
                            {lang === "id" ? "Belum diisi" : "Not filled"}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-gray-500 mb-1">Alamat Perusahaan</p>
                      <p className="font-medium text-gray-900">
                        {form.alamat_lengkap || (
                          <span className="text-gray-400 italic">
                            {lang === "id" ? "Belum diisi" : "Not filled"}
                          </span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Kota</p>
                      <p className="font-medium text-gray-900">
                        {form.kota || (
                          <span className="text-gray-400 italic">
                            {lang === "id" ? "Belum diisi" : "Not filled"}
                          </span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Status PKP</p>
                      <p className="font-medium text-gray-900">
                        {form.status_pkp || (
                          <span className="text-gray-400 italic">
                            {lang === "id" ? "Belum diisi" : "Not filled"}
                          </span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Status Kepemilikan</p>
                      <p className="font-medium text-gray-900">
                        {form.bentuk_usaha || (
                          <span className="text-gray-400 italic">
                            {lang === "id" ? "Belum diisi" : "Not filled"}
                          </span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">NPWP</p>
                      <p className="font-medium text-gray-900">
                        {form.npwp_number || (
                          <span className="text-gray-400 italic">
                            {lang === "id" ? "Belum diisi" : "Not filled"}
                          </span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">NIB</p>
                      <p className="font-medium text-gray-900">
                        {form.nib_number || (
                          <span className="text-gray-400 italic">
                            {lang === "id" ? "Belum diisi" : "Not filled"}
                          </span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Website</p>
                      <p className="font-medium text-gray-900">
                        {form.website_perusahaan || (
                          <span className="text-gray-400 italic">
                            {lang === "id" ? "Belum diisi" : "Not filled"}
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Legal Documents */}
                    <div className="sm:col-span-2 mt-4 pt-4 border-t border-gray-200">
                      <p className="text-gray-700 font-medium mb-3">
                        📄 Dokumen Legal
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-2">
                            Dokumen NPWP
                          </p>
                          {form.npwp_file_url ? (
                            <div className="space-y-2">
                              <div
                                className="relative w-full h-32 bg-gray-100 rounded-md overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() =>
                                  setDocumentPreview({
                                    url: form.npwp_file_url || "",
                                    title: "Dokumen NPWP",
                                  })
                                }
                              >
                                <PresignedImage
                                  src={form.npwp_file_url || ""}
                                  alt="NPWP Preview"
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 hidden items-center justify-center text-gray-400 bg-gray-100">
                                  <div className="w-full h-full flex justify-center items-center">
                                    <svg
                                      className="w-12 h-12"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                      />
                                    </svg>
                                  </div>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={async () => {
                                  const url = await getImageUrlAsync(form.npwp_file_url || "");
                                  if (url) {
                                    window.open(url, "_blank");
                                  }
                                }}
                                className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-md text-xs hover:bg-blue-100 transition-colors w-full justify-center"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                  />
                                </svg>
                                Download
                              </button>
                            </div>
                          ) : (
                            <p className="text-xs text-gray-400">
                              Belum diunggah
                            </p>
                          )}
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-2">
                            Dokumen NIB
                          </p>
                          {form.nib_file_url ? (
                            <div className="space-y-2">
                              <div
                                className="relative w-full h-32 bg-gray-100 rounded-md overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() =>
                                  setDocumentPreview({
                                    url: form.nib_file_url || "",
                                    title: "Dokumen NIB",
                                  })
                                }
                              >
                                <PresignedImage
                                  src={form.nib_file_url || ""}
                                  alt="NIB Preview"
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 hidden items-center justify-center text-gray-400 bg-gray-100">
                                  <div className="w-full h-full flex justify-center items-center">
                                    <svg
                                      className="w-12 h-12"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                      />
                                    </svg>
                                  </div>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={async () => {
                                  const url = await getImageUrlAsync(form.nib_file_url || "");
                                  if (url) {
                                    window.open(url, "_blank");
                                  }
                                }}
                                className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-md text-xs hover:bg-blue-100 transition-colors w-full justify-center"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                  />
                                </svg>
                                Download
                              </button>
                            </div>
                          ) : (
                            <p className="text-xs text-gray-400">
                              Belum diunggah
                            </p>
                          )}
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-2">
                            Dokumen KTP Pemilik
                          </p>
                          {form.ktp_file_url ? (
                            <div className="space-y-2">
                              <div
                                className="relative w-full h-32 bg-gray-100 rounded-md overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() =>
                                  setDocumentPreview({
                                    url: form.ktp_file_url || "",
                                    title: "Dokumen KTP Pemilik",
                                  })
                                }
                              >
                                <PresignedImage
                                  src={form.ktp_file_url || ""}
                                  alt="KTP Preview"
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 hidden items-center justify-center text-gray-400 bg-gray-100">
                                  <div className="w-full h-full flex justify-center items-center">
                                    <svg
                                      className="w-12 h-12"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                      />
                                    </svg>
                                  </div>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={async () => {
                                  const url = await getImageUrlAsync(form.ktp_file_url || "");
                                  if (url) {
                                    window.open(url, "_blank");
                                  }
                                }}
                                className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-md text-xs hover:bg-blue-100 transition-colors w-full justify-center"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                  />
                                </svg>
                                Download
                              </button>
                            </div>
                          ) : (
                            <p className="text-xs text-gray-400">
                              Belum diunggah
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* PIC & Gudang */}
              <div className="bg-white rounded-lg shadow-sm border mb-4">
                <div className="px-6 py-4 border-b flex items-center justify-between">
                  <h2 className="text-sm font-semibold flex items-center gap-2">
                    <span className="text-lg">📦</span>
                    {lang === "id" ? "PIC & Gudang" : "PIC & Warehouse"}
                  </h2>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    onClick={() => {
                      setTempForm(form);
                      setTempFiles({
                        npwp_file: null,
                        nib_file: null,
                        ktp_file: null,
                        foto_gudang: null,
                      });
                      setEditWarehouseOpen(true);
                    }}
                  >
                    ✏️ Edit
                  </Button>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-4 text-sm">
                    <div>
                      <p className="text-gray-500 mb-1">Nama PIC</p>
                      <p className="font-medium text-gray-900">
                        {form.nama_pic || form.nama_pemilik || (
                          <span className="text-gray-400 italic">
                            {lang === "id" ? "Belum diisi" : "Not filled"}
                          </span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Posisi PIC</p>
                      <p className="font-medium text-gray-900">
                        {form.posisi_pic || (
                          <span className="text-gray-400 italic">
                            {lang === "id" ? "Belum diisi" : "Not filled"}
                          </span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Nomor Kontak PIC</p>
                      <p className="font-medium text-gray-900">
                        {form.nomor_kontak_pic || form.kontak_pemilik || (
                          <span className="text-gray-400 italic">
                            {lang === "id" ? "Belum diisi" : "Not filled"}
                          </span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Email PIC</p>
                      <p className="font-medium text-gray-900">
                        {form.email_pic || form.email_pemilik || (
                          <span className="text-gray-400 italic">
                            {lang === "id" ? "Belum diisi" : "Not filled"}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-gray-500 mb-1">Alamat Gudang</p>
                      <p className="font-medium text-gray-900">
                        {form.alamat_gudang || (
                          <span className="text-gray-400 italic">
                            {lang === "id" ? "Belum diisi" : "Not filled"}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-gray-500 mb-1">Koordinat</p>
                      <p className="font-medium text-gray-900">
                        {form.koordinat || (
                          <span className="text-gray-400 italic">
                            {lang === "id" ? "Belum diisi" : "Not filled"}
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Map Display */}
                    {form.koordinat &&
                      (() => {
                        try {
                          // Ensure koordinat is a string before parsing
                          const koordinatStr =
                            typeof form.koordinat === "string"
                              ? form.koordinat.trim()
                              : "";
                          if (!koordinatStr) return null;

                          const coords = JSON.parse(koordinatStr);
                          if (coords.lat && coords.lng) {
                            return (
                              <div className="sm:col-span-2 mt-4 pt-4 border-t border-gray-200">
                                <p className="text-gray-700 font-medium mb-3">
                                  📍 Lokasi Gudang
                                </p>
                                <div
                                  className="rounded-lg overflow-hidden border border-gray-300 shadow-sm"
                                  style={{ height: "300px" }}
                                >
                                  <MapSelector
                                    onLocationSelected={() => {}}
                                    onAddressFound={() => {}}
                                    initialPosition={`${coords.lat},${coords.lng}`}
                                    readOnly={true}
                                  />
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                  📍 {coords.lat.toFixed(6)},{" "}
                                  {coords.lng.toFixed(6)}
                                </p>
                              </div>
                            );
                          }
                          return null;
                        } catch (e) {
                          // Silently fail for invalid coordinate data
                          return null;
                        }
                        return null;
                      })()}

                    {/* Warehouse Photo */}
                    {form.foto_gudang && (
                      <div className="sm:col-span-2 mt-4 pt-4 border-t border-gray-200">
                        <p className="text-gray-700 font-medium mb-3">
                          📸 Foto Gudang
                        </p>
                        <PresignedImage
                          src={form.foto_gudang}
                          alt="Foto Gudang"
                          className="w-full max-w-md h-48 object-cover rounded-lg border border-gray-200"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Perbankan & Operasional */}
              <div className="bg-white rounded-lg shadow-sm border mb-6">
                <div className="px-6 py-4 border-b flex items-center justify-between">
                  <h2 className="text-sm font-semibold flex items-center gap-2">
                    <span className="text-lg">💳</span>
                    {lang === "id"
                      ? "Perbankan & Operasional"
                      : "Banking & Operational"}
                  </h2>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    onClick={() => {
                      setTempForm(form);
                      setEditBankingOpen(true);
                    }}
                  >
                    ✏️ Edit
                  </Button>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-4 text-sm">
                    <div>
                      <p className="text-gray-500 mb-1">Nama Bank</p>
                      <p className="font-medium text-gray-900">
                        {form.nama_bank || (
                          <span className="text-gray-400 italic">
                            {lang === "id" ? "Belum diisi" : "Not filled"}
                          </span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">
                        Nama Pemilik Rekening
                      </p>
                      <p className="font-medium text-gray-900">
                        {form.nama_pemilik_akun || (
                          <span className="text-gray-400 italic">
                            {lang === "id" ? "Belum diisi" : "Not filled"}
                          </span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Nomor Rekening</p>
                      <p className="font-medium text-gray-900">
                        {form.nomor_rekening || (
                          <span className="text-gray-400 italic">
                            {lang === "id" ? "Belum diisi" : "Not filled"}
                          </span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Jumlah Karyawan</p>
                      <p className="font-medium text-gray-900">
                        {form.jumlah_karyawan || (
                          <span className="text-gray-400 italic">
                            {lang === "id" ? "Belum diisi" : "Not filled"}
                          </span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">
                        Jumlah Armada Pengiriman
                      </p>
                      <p className="font-medium text-gray-900">
                        {form.jumlah_armada_pengiriman || (
                          <span className="text-gray-400 italic">
                            {lang === "id" ? "Belum diisi" : "Not filled"}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-gray-500 mb-1">Metode Pembayaran</p>
                      <p className="font-medium text-gray-900">
                        {form.metode_pembayaran || (
                          <span className="text-gray-400 italic">
                            {lang === "id" ? "Belum diisi" : "Not filled"}
                          </span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Aplikasi Pencatatan</p>
                      <p className="font-medium text-gray-900">
                        {form.aplikasi_pencatatan || (
                          <span className="text-gray-400 italic">
                            {lang === "id" ? "Belum diisi" : "Not filled"}
                          </span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Area Distribusi</p>
                      <p className="font-medium text-gray-900">
                        {form.area_distribusi || (
                          <span className="text-gray-400 italic">
                            {lang === "id" ? "Belum diisi" : "Not filled"}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </form>

            {submitSuccess && (
              <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <svg
                    className="h-5 w-5 text-green-500 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <div>
                    <h3 className="text-sm font-medium text-green-800">
                      {lang === "id" ? "Profil tersimpan" : "Profile saved"}
                    </h3>
                    <p className="mt-1 text-sm text-green-600">
                      {lang === "id"
                        ? "Tim Baskit akan melakukan verifikasi data Anda."
                        : "The Baskit team will verify your data."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Edit Owner Dialog */}
            <Dialog open={editOwnerOpen} onOpenChange={setEditOwnerOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {lang === "id"
                      ? "Edit Informasi Pemilik"
                      : "Edit Owner Information"}
                  </DialogTitle>
                  <DialogDescription>
                    {lang === "id"
                      ? "Perbarui informasi pemilik bisnis"
                      : "Update business owner information"}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {lang === "id" ? "Nama Pemilik" : "Owner Name"}
                    </label>
                    <input
                      type="text"
                      value={tempForm.nama_pemilik}
                      onChange={setTemp("nama_pemilik")}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {lang === "id"
                        ? "Nomor HP Pemilik"
                        : "Owner Phone Number"}
                    </label>
                    <input
                      type="tel"
                      value={tempForm.kontak_pemilik}
                      onChange={setTemp("kontak_pemilik")}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {lang === "id" ? "Email Pemilik" : "Owner Email"}
                    </label>
                    <input
                      type="email"
                      value={tempForm.email_pemilik}
                      onChange={setTemp("email_pemilik")}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none"
                    />
                  </div>
                </div>
                <div className="flex gap-3 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditOwnerOpen(false)}
                    disabled={isSubmitting}
                  >
                    {lang === "id" ? "Batal" : "Cancel"}
                  </Button>
                  <Button
                    type="button"
                    onClick={saveOwnerInfo}
                    disabled={isSubmitting}
                    className="bg-orange-500 hover:bg-orange-600"
                  >
                    {isSubmitting
                      ? lang === "id"
                        ? "Menyimpan..."
                        : "Saving..."
                      : lang === "id"
                      ? "Simpan"
                      : "Save"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Edit Company Dialog */}
            <Dialog open={editCompanyOpen} onOpenChange={setEditCompanyOpen}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {lang === "id"
                      ? "Edit Profil Perusahaan"
                      : "Edit Company Profile"}
                  </DialogTitle>
                  <DialogDescription>
                    {lang === "id"
                      ? "Perbarui informasi perusahaan"
                      : "Update company information"}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {lang === "id" ? "Nama Perusahaan" : "Company Name"}
                      </label>
                      <input
                        type="text"
                        value={tempForm.nama_bisnis}
                        onChange={setTemp("nama_bisnis")}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {lang === "id" ? "Email Perusahaan" : "Company Email"}
                      </label>
                      <input
                        type="email"
                        value={tempForm.email_perusahaan}
                        onChange={setTemp("email_perusahaan")}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {lang === "id" ? "Nomor Kontak" : "Contact Number"}
                      </label>
                      <input
                        type="tel"
                        value={tempForm.nomor_telp_perusahaan}
                        onChange={setTemp("nomor_telp_perusahaan")}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {lang === "id" ? "Nama Direktur" : "Director Name"}
                      </label>
                      <input
                        type="text"
                        value={tempForm.nama_direktur}
                        onChange={setTemp("nama_direktur")}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {lang === "id" ? "Alamat Perusahaan" : "Company Address"}
                    </label>
                    <textarea
                      value={tempForm.alamat_lengkap}
                      onChange={setTemp("alamat_lengkap")}
                      rows={2}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {lang === "id" ? "Kota" : "City"}
                    </label>
                    <input
                      type="text"
                      value={tempForm.kota}
                      onChange={setTemp("kota")}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {lang === "id" ? "Status PKP" : "PKP Status"}
                      </label>
                      <select
                        value={tempForm.status_pkp}
                        onChange={setTemp("status_pkp")}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none bg-white"
                      >
                        <option value="PKP">PKP</option>
                        <option value="Non-PKP">Non-PKP</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {lang === "id"
                          ? "Status Kepemilikan"
                          : "Ownership Status"}
                      </label>
                      <select
                        value={tempForm.bentuk_usaha}
                        onChange={setTemp("bentuk_usaha")}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none bg-white"
                      >
                        <option value="">Pilih...</option>
                        <option value="Milik Sendiri">Milik Sendiri</option>
                        <option value="Sewa">Sewa</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        NPWP
                      </label>
                      <input
                        type="text"
                        value={tempForm.npwp_number}
                        onChange={setTemp("npwp_number")}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        NIB
                      </label>
                      <input
                        type="text"
                        value={tempForm.nib_number}
                        onChange={setTemp("nib_number")}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Website
                      </label>
                      <input
                        type="url"
                        value={tempForm.website_perusahaan}
                        onChange={setTemp("website_perusahaan")}
                        placeholder="https://"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Document Uploads */}
                  <div className="border-t pt-4 mt-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">
                      📄 Upload Dokumen Legal
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Dokumen NPWP{" "}
                          {tempForm.npwp_file_url && (
                            <span className="text-green-600 text-xs">
                              (Sudah ada)
                            </span>
                          )}
                        </label>
                        {tempForm.npwp_file_url && (
                          <div className="mb-2 flex items-center gap-3">
                            <div
                              className="relative w-16 h-16 bg-gray-100 rounded-md overflow-hidden cursor-pointer hover:opacity-90 transition-opacity flex-shrink-0"
                              onClick={() =>
                                setDocumentPreview({
                                  url: tempForm.npwp_file_url || "",
                                  title: "Dokumen NPWP",
                                })
                              }
                            >
                              <PresignedImage
                                src={tempForm.npwp_file_url || ""}
                                alt="NPWP Preview"
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 hidden items-center justify-center text-gray-400 bg-gray-100">
                                <svg
                                  className="w-6 h-6"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                  />
                                </svg>
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 font-medium">
                                Dokumen saat ini
                              </p>
                              <p className="text-xs text-gray-500">
                                Klik untuk melihat
                              </p>
                            </div>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={handleFileChange("npwp_file")}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Dokumen NIB{" "}
                          {tempForm.nib_file_url && (
                            <span className="text-green-600 text-xs">
                              (Sudah ada)
                            </span>
                          )}
                        </label>
                        {tempForm.nib_file_url && (
                          <div className="mb-2 flex items-center gap-3">
                            <div
                              className="relative w-16 h-16 bg-gray-100 rounded-md overflow-hidden cursor-pointer hover:opacity-90 transition-opacity flex-shrink-0"
                              onClick={() =>
                                setDocumentPreview({
                                  url: tempForm.nib_file_url || "",
                                  title: "Dokumen NIB",
                                })
                              }
                            >
                              <PresignedImage
                                src={tempForm.nib_file_url || ""}
                                alt="NIB Preview"
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 hidden items-center justify-center text-gray-400 bg-gray-100">
                                <svg
                                  className="w-6 h-6"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                  />
                                </svg>
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 font-medium">
                                Dokumen saat ini
                              </p>
                              <p className="text-xs text-gray-500">
                                Klik untuk melihat
                              </p>
                            </div>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={handleFileChange("nib_file")}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Dokumen KTP Pemilik{" "}
                          {tempForm.ktp_file_url && (
                            <span className="text-green-600 text-xs">
                              (Sudah ada)
                            </span>
                          )}
                        </label>
                        {tempForm.ktp_file_url && (
                          <div className="mb-2 flex items-center gap-3">
                            <div
                              className="relative w-16 h-16 bg-gray-100 rounded-md overflow-hidden cursor-pointer hover:opacity-90 transition-opacity flex-shrink-0"
                              onClick={() =>
                                setDocumentPreview({
                                  url: tempForm.ktp_file_url || "",
                                  title: "Dokumen KTP Pemilik",
                                })
                              }
                            >
                              <PresignedImage
                                src={tempForm.ktp_file_url || ""}
                                alt="KTP Preview"
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 hidden items-center justify-center text-gray-400 bg-gray-100">
                                <svg
                                  className="w-6 h-6"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                  />
                                </svg>
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 font-medium">
                                Dokumen saat ini
                              </p>
                              <p className="text-xs text-gray-500">
                                Klik untuk melihat
                              </p>
                            </div>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={handleFileChange("ktp_file")}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none"
                        />
                      </div>
                      {uploadingFiles && (
                        <p className="text-xs text-orange-600">
                          📤 Mengupload dokumen...
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditCompanyOpen(false)}
                    disabled={isSubmitting}
                  >
                    {lang === "id" ? "Batal" : "Cancel"}
                  </Button>
                  <Button
                    type="button"
                    onClick={saveCompanyInfo}
                    disabled={isSubmitting}
                    className="bg-orange-500 hover:bg-orange-600"
                  >
                    {isSubmitting
                      ? lang === "id"
                        ? "Menyimpan..."
                        : "Saving..."
                      : lang === "id"
                      ? "Simpan"
                      : "Save"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Edit Warehouse Dialog */}
            <Dialog
              open={editWarehouseOpen}
              onOpenChange={setEditWarehouseOpen}
            >
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {lang === "id"
                      ? "Edit PIC & Gudang"
                      : "Edit PIC & Warehouse"}
                  </DialogTitle>
                  <DialogDescription>
                    {lang === "id"
                      ? "Perbarui informasi PIC dan lokasi gudang"
                      : "Update PIC and warehouse location"}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="border-b pb-4 mb-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">
                      Informasi PIC
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {lang === "id" ? "Nama PIC" : "PIC Name"}
                        </label>
                        <input
                          type="text"
                          value={tempForm.nama_pic}
                          onChange={setTemp("nama_pic")}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {lang === "id" ? "Posisi PIC" : "PIC Position"}
                        </label>
                        <select
                          value={tempForm.posisi_pic}
                          onChange={setTemp("posisi_pic")}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none bg-white"
                        >
                          <option value="">Pilih Posisi...</option>
                          <option value="Owner">Owner</option>
                          <option value="Direktur">Direktur</option>
                          <option value="General Manager">
                            General Manager
                          </option>
                          <option value="Operations Manager">
                            Operations Manager
                          </option>
                          <option value="Warehouse Manager">
                            Warehouse Manager
                          </option>
                          <option value="Staff">Staff</option>
                          <option value="Lainnya">Lainnya</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {lang === "id"
                            ? "Nomor Kontak PIC"
                            : "PIC Contact Number"}
                        </label>
                        <input
                          type="tel"
                          value={tempForm.nomor_kontak_pic}
                          onChange={setTemp("nomor_kontak_pic")}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {lang === "id" ? "Email PIC" : "PIC Email"}
                        </label>
                        <input
                          type="email"
                          value={tempForm.email_pic}
                          onChange={setTemp("email_pic")}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">
                      Lokasi Gudang
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {lang === "id"
                            ? "Alamat Gudang"
                            : "Warehouse Address"}
                        </label>
                        <textarea
                          value={tempForm.alamat_gudang}
                          onChange={setTemp("alamat_gudang")}
                          rows={3}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {lang === "id" ? "Koordinat" : "Coordinates"}
                        </label>
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={tempForm.koordinat}
                            onChange={setTemp("koordinat")}
                            placeholder="Latitude, Longitude"
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none"
                          />
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setEditMapDialogOpen(true)}
                              className="flex-1"
                            >
                              <MapPin className="w-4 h-4 mr-2" />
                              {lang === "id"
                                ? "Pilih dari Peta"
                                : "Select from Map"}
                            </Button>
                          </div>
                          {tempForm.koordinat &&
                            (() => {
                              try {
                                const coords = JSON.parse(
                                  tempForm.koordinat.includes("{")
                                    ? tempForm.koordinat
                                    : `{"lat":${tempForm.koordinat
                                        .split(",")[0]
                                        .trim()},"lng":${tempForm.koordinat
                                        .split(",")[1]
                                        .trim()}}`
                                );
                                if (coords.lat && coords.lng) {
                                  return (
                                    <div className="mt-3">
                                      <p className="text-xs text-gray-600 mb-2">
                                        Preview Lokasi:
                                      </p>
                                      <div
                                        className="rounded-lg overflow-hidden border border-gray-300 shadow-sm"
                                        style={{ height: "200px" }}
                                      >
                                        <MapSelector
                                          onLocationSelected={() => {}}
                                          onAddressFound={() => {}}
                                          initialPosition={`${coords.lat},${coords.lng}`}
                                          readOnly={true}
                                        />
                                      </div>
                                      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
                                        📍 {coords.lat.toFixed(6)},{" "}
                                        {coords.lng.toFixed(6)}
                                      </div>
                                    </div>
                                  );
                                }
                              } catch (e) {
                                // If not JSON format, try parsing as "lat, lng"
                                try {
                                  const [lat, lng] = tempForm.koordinat
                                    .split(",")
                                    .map((s) => parseFloat(s.trim()));
                                  if (!isNaN(lat) && !isNaN(lng)) {
                                    return (
                                      <div className="mt-3">
                                        <p className="text-xs text-gray-600 mb-2">
                                          Preview Lokasi:
                                        </p>
                                        <div
                                          className="rounded-lg overflow-hidden border border-gray-300 shadow-sm"
                                          style={{ height: "200px" }}
                                        >
                                          <MapSelector
                                            onLocationSelected={() => {}}
                                            onAddressFound={() => {}}
                                            initialPosition={`${lat},${lng}`}
                                            readOnly={true}
                                          />
                                        </div>
                                        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
                                          📍 {lat.toFixed(6)}, {lng.toFixed(6)}
                                        </div>
                                      </div>
                                    );
                                  }
                                } catch (e2) {
                                  console.error(
                                    "Error parsing coordinates:",
                                    e2
                                  );
                                }
                              }
                              return null;
                            })()}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {lang === "id" ? "Foto Gudang" : "Warehouse Photo"}{" "}
                          {tempForm.foto_gudang && (
                            <span className="text-green-600 text-xs">
                              (Sudah ada)
                            </span>
                          )}
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange("foto_gudang")}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none"
                        />
                        {tempForm.foto_gudang && (
                          <div className="mt-2">
                            <PresignedImage
                              src={tempForm.foto_gudang}
                              alt="Preview"
                              className="w-32 h-32 object-cover rounded border"
                            />
                          </div>
                        )}
                      </div>
                      {uploadingFiles && (
                        <p className="text-xs text-orange-600">
                          📤 Mengupload foto...
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditWarehouseOpen(false)}
                    disabled={isSubmitting}
                  >
                    {lang === "id" ? "Batal" : "Cancel"}
                  </Button>
                  <Button
                    type="button"
                    onClick={saveWarehouseInfo}
                    disabled={isSubmitting}
                    className="bg-orange-500 hover:bg-orange-600"
                  >
                    {isSubmitting
                      ? lang === "id"
                        ? "Menyimpan..."
                        : "Saving..."
                      : lang === "id"
                      ? "Simpan"
                      : "Save"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Edit Banking Dialog */}
            <Dialog open={editBankingOpen} onOpenChange={setEditBankingOpen}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {lang === "id"
                      ? "Edit Perbankan & Operasional"
                      : "Edit Banking & Operational"}
                  </DialogTitle>
                  <DialogDescription>
                    {lang === "id"
                      ? "Perbarui informasi perbankan dan operasional bisnis"
                      : "Update banking and operational information"}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="border-b pb-4 mb-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">
                      Keterangan Bank
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {lang === "id" ? "Nama Bank" : "Bank Name"}
                        </label>
                        <select
                          value={tempForm.nama_bank}
                          onChange={setTemp("nama_bank")}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none bg-white"
                        >
                          <option value="">Pilih Bank...</option>
                          <option value="BCA">BCA</option>
                          <option value="Mandiri">Mandiri</option>
                          <option value="BNI">BNI</option>
                          <option value="BRI">BRI</option>
                          <option value="CIMB Niaga">CIMB Niaga</option>
                          <option value="Permata">Permata</option>
                          <option value="Danamon">Danamon</option>
                          <option value="BTN">BTN</option>
                          <option value="Maybank">Maybank</option>
                          <option value="BSI">BSI</option>
                          <option value="Lainnya">Lainnya</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {lang === "id"
                            ? "Nama Pemilik Rekening"
                            : "Account Owner Name"}
                        </label>
                        <input
                          type="text"
                          value={tempForm.nama_pemilik_akun}
                          onChange={setTemp("nama_pemilik_akun")}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {lang === "id" ? "Nomor Rekening" : "Account Number"}
                        </label>
                        <input
                          type="text"
                          value={tempForm.nomor_rekening}
                          onChange={setTemp("nomor_rekening")}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">
                      Informasi Operasional
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {lang === "id"
                            ? "Jumlah Karyawan"
                            : "Number of Employees"}
                        </label>
                        <input
                          type="text"
                          value={tempForm.jumlah_karyawan}
                          onChange={setTemp("jumlah_karyawan")}
                          placeholder="Contoh: 50"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {lang === "id"
                            ? "Jumlah Armada Pengiriman"
                            : "Delivery Fleet Size"}
                        </label>
                        <input
                          type="text"
                          value={tempForm.jumlah_armada_pengiriman}
                          onChange={setTemp("jumlah_armada_pengiriman")}
                          placeholder="Contoh: 10"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {lang === "id"
                            ? "Metode Pembayaran"
                            : "Payment Methods"}
                        </label>
                        <input
                          type="text"
                          value={tempForm.metode_pembayaran}
                          onChange={setTemp("metode_pembayaran")}
                          placeholder={
                            lang === "id"
                              ? "Contoh: Tunai, Transfer, Tempo 30 hari"
                              : "Example: Cash, Transfer, 30 days credit"
                          }
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {lang === "id"
                            ? "Aplikasi Pencatatan"
                            : "Recording Application"}
                        </label>
                        <select
                          onChange={(e) => {
                            const selectedApp = e.target.value;
                            if (selectedApp) {
                              const currentApps = tempForm.aplikasi_pencatatan
                                ? tempForm.aplikasi_pencatatan
                                    .split(", ")
                                    .filter((a) => a)
                                : [];
                              if (!currentApps.includes(selectedApp)) {
                                setTempForm((prev) => ({
                                  ...prev,
                                  aplikasi_pencatatan: [
                                    ...currentApps,
                                    selectedApp,
                                  ].join(", "),
                                }));
                              }
                            }
                            e.target.value = "";
                          }}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none bg-white"
                        >
                          <option value="">
                            {lang === "id"
                              ? "Pilih aplikasi..."
                              : "Select application..."}
                          </option>
                          {[
                            "Zahir Accounting",
                            "MYOB",
                            "Kledo",
                            "BukuWarung",
                            "BukuKas",
                            "Olsera",
                            "Pawoon",
                            "Moka POS",
                            "Jurnal",
                            "Accurate",
                            "SAP",
                            "Oracle",
                            "Microsoft Excel",
                            "Google Sheets",
                            lang === "id" ? "Lainnya" : "Other",
                          ].map((app) => (
                            <option key={app} value={app}>
                              {app}
                            </option>
                          ))}
                        </select>
                        {tempForm.aplikasi_pencatatan &&
                          tempForm.aplikasi_pencatatan
                            .split(", ")
                            .filter((a) => a).length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {tempForm.aplikasi_pencatatan
                                .split(", ")
                                .filter((a) => a)
                                .map((app) => (
                                  <div
                                    key={app}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 text-orange-700 text-sm rounded-md border border-orange-200"
                                  >
                                    <span>{app}</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const apps =
                                          tempForm.aplikasi_pencatatan
                                            .split(", ")
                                            .filter((a) => a !== app);
                                        setTempForm((prev) => ({
                                          ...prev,
                                          aplikasi_pencatatan: apps.join(", "),
                                        }));
                                      }}
                                      className="hover:bg-orange-200 rounded-full p-0.5 transition-colors"
                                    >
                                      <svg
                                        className="w-3.5 h-3.5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M6 18L18 6M6 6l12 12"
                                        />
                                      </svg>
                                    </button>
                                  </div>
                                ))}
                            </div>
                          )}
                        <p className="text-xs text-gray-500 mt-1">
                          {lang === "id"
                            ? "Pilih satu atau lebih aplikasi yang digunakan"
                            : "Select one or more applications used"}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {lang === "id"
                            ? "Area Distribusi"
                            : "Distribution Area"}
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={areaSearch}
                            onChange={(e) => setAreaSearch(e.target.value)}
                            placeholder={
                              lang === "id"
                                ? "Cari kota/kabupaten..."
                                : "Search city/regency..."
                            }
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none"
                          />
                          {areaSearch && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                              {INDONESIAN_AREAS.filter((area) =>
                                area
                                  .toLowerCase()
                                  .includes(areaSearch.toLowerCase())
                              )
                                .slice(0, 50)
                                .map((area) => {
                                  const currentAreas = tempForm.area_distribusi
                                    ? tempForm.area_distribusi
                                        .split(", ")
                                        .filter((a) => a)
                                    : [];
                                  return (
                                    <button
                                      key={area}
                                      type="button"
                                      onClick={() => {
                                        if (!currentAreas.includes(area)) {
                                          setTempForm((prev) => ({
                                            ...prev,
                                            area_distribusi: [
                                              ...currentAreas,
                                              area,
                                            ].join(", "),
                                          }));
                                        }
                                        setAreaSearch("");
                                      }}
                                      className="w-full text-left px-3 py-2 text-sm hover:bg-orange-50 transition-colors"
                                    >
                                      {area}
                                    </button>
                                  );
                                })}
                              {INDONESIAN_AREAS.filter((area) =>
                                area
                                  .toLowerCase()
                                  .includes(areaSearch.toLowerCase())
                              ).length === 0 && (
                                <div className="px-3 py-2 text-sm text-gray-500">
                                  {lang === "id"
                                    ? "Tidak ada hasil"
                                    : "No results"}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        {tempForm.area_distribusi &&
                          tempForm.area_distribusi.split(", ").filter((a) => a)
                            .length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {tempForm.area_distribusi
                                .split(", ")
                                .filter((a) => a)
                                .map((area) => (
                                  <div
                                    key={area}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 text-orange-700 text-sm rounded-md border border-orange-200"
                                  >
                                    <span>{area}</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const areas = tempForm.area_distribusi
                                          .split(", ")
                                          .filter((a) => a !== area);
                                        setTempForm((prev) => ({
                                          ...prev,
                                          area_distribusi: areas.join(", "),
                                        }));
                                      }}
                                      className="hover:bg-orange-200 rounded-full p-0.5 transition-colors"
                                    >
                                      <svg
                                        className="w-3.5 h-3.5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M6 18L18 6M6 6l12 12"
                                        />
                                      </svg>
                                    </button>
                                  </div>
                                ))}
                            </div>
                          )}
                        <p className="text-xs text-gray-500 mt-1">
                          {lang === "id"
                            ? "Ketik untuk mencari dan pilih kota/kabupaten"
                            : "Type to search and select cities/regencies"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditBankingOpen(false)}
                    disabled={isSubmitting}
                  >
                    {lang === "id" ? "Batal" : "Cancel"}
                  </Button>
                  <Button
                    type="button"
                    onClick={saveBankingInfo}
                    disabled={isSubmitting}
                    className="bg-orange-500 hover:bg-orange-600"
                  >
                    {isSubmitting
                      ? lang === "id"
                        ? "Menyimpan..."
                        : "Saving..."
                      : lang === "id"
                      ? "Simpan"
                      : "Save"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Edit Map Dialog for Warehouse Coordinates */}
            <Dialog
              open={editMapDialogOpen}
              onOpenChange={setEditMapDialogOpen}
            >
              <DialogContent className="max-w-4xl max-h-[90vh]">
                <DialogHeader>
                  <DialogTitle>
                    {lang === "id"
                      ? "Pilih Lokasi Gudang"
                      : "Select Warehouse Location"}
                  </DialogTitle>
                  <DialogDescription>
                    {lang === "id"
                      ? "Klik pada peta untuk memilih lokasi gudang Anda"
                      : "Click on the map to select your warehouse location"}
                  </DialogDescription>
                </DialogHeader>
                <div className="h-[500px] w-full">
                  <MapSelector
                    onLocationSelected={handleEditMapPinSelection}
                    initialPosition={tempForm.koordinat || undefined}
                    onAddressFound={(address) => {
                      // Optionally update alamat_gudang
                      setTempForm((prev) => ({
                        ...prev,
                        alamat_gudang: address,
                      }));
                    }}
                  />
                </div>
                {editSelectedCoordinates && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-medium text-green-800 mb-1">
                      📍{" "}
                      {lang === "id"
                        ? "Lokasi Terpilih:"
                        : "Selected Location:"}
                    </p>
                    <p className="text-xs text-green-700">
                      Lat: {editSelectedCoordinates[0].toFixed(6)}, Lng:{" "}
                      {editSelectedCoordinates[1].toFixed(6)}
                    </p>
                  </div>
                )}
                <div className="flex justify-end gap-3 mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditSelectedCoordinates(null);
                      setEditMapDialogOpen(false);
                    }}
                  >
                    {lang === "id" ? "Batal" : "Cancel"}
                  </Button>
                  <Button
                    type="button"
                    onClick={confirmEditMapLocation}
                    disabled={!editSelectedCoordinates}
                    className="bg-orange-500 hover:bg-orange-600"
                  >
                    {lang === "id" ? "Konfirmasi Lokasi" : "Confirm Location"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Document Preview Modal */}
            <Dialog
              open={!!documentPreview}
              onOpenChange={() => setDocumentPreview(null)}
            >
              <DialogContent className="max-w-4xl max-h-[90vh]">
                <DialogHeader>
                  <DialogTitle>{documentPreview?.title}</DialogTitle>
                </DialogHeader>
                <div className="relative w-full h-[70vh] bg-gray-100 rounded-lg overflow-hidden">
                  {documentPreview?.url && (
                    <PresignedImage
                      src={documentPreview.url}
                      alt={documentPreview.title || "Preview"}
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>
                <div className="flex justify-end gap-3 mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDocumentPreview(null)}
                  >
                    {lang === "id" ? "Tutup" : "Close"}
                  </Button>
                  {documentPreview?.url && (
                    <button
                      type="button"
                      onClick={async () => {
                        const url = await getImageUrlAsync(documentPreview.url);
                        if (url) {
                          window.open(url, "_blank");
                        }
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      Download
                    </button>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            
          </>
        )}
      </main>
    </div>
  );
}
