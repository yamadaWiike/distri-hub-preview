// React & Router
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

// External Libraries & Icons
import { ArrowLeft, Save, X, User, Building2, Warehouse, CreditCard, Briefcase, FileText, Upload, Eye } from 'lucide-react';

// UI Components
import SEO from '@/components/seo/SEO';
import Navbar from '@/components/layout/Navbar';
import AdminSidebar from '@/components/layout/AdminSidebar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';

// Hooks
import { useLanguage } from '@/hooks/use-language';

// Utils & API
import { uploadFileToS3, getImageUrl } from '@/lib/s3-upload';

// Integrations
import { supabase } from '@/integrations/supabase/client';

/* eslint-disable @typescript-eslint/no-explicit-any */

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
  // Other major cities
  'Medan', 'Palembang', 'Makassar', 'Banjarmasin', 'Balikpapan', 'Samarinda', 'Manado', 'Palu', 'Pontianak',
];

interface DistributorProfile {
  user_id: string;
  email?: string;
  nama_bisnis?: string;
  nama_pemilik?: string;
  email_pemilik?: string;
  kontak_pemilik?: string;
  alamat_lengkap?: string;
  kota?: string;
  status?: string;
  email_perusahaan?: string;
  nomor_telp_perusahaan?: string;
  nama_direktur?: string;
  bentuk_usaha?: string;
  status_pkp?: string;
  nomor_npwp?: string;
  npwp_number?: string;
  nomor_nib?: string;
  nib_number?: string;
  website?: string;
  website_perusahaan?: string;
  omzet?: string;
  jumlah_karyawan?: number;
  alamat_kantor?: string;
  alamat_gudang?: string;
  koordinat_gudang?: string;
  koordinat?: string;
  jumlah_armada?: number;
  jumlah_armada_pengiriman?: string;
  aplikasi_pencatatan?: string;
  area_distribusi?: string;
  nama_bank?: string;
  nama_pemilik_rekening?: string;
  nama_pemilik_akun?: string;
  nomor_rekening?: string;
  metode_pembayaran?: string;
  nama_pic?: string;
  posisi_pic?: string;
  jabatan_pic?: string;
  kontak_pic?: string;
  nomor_kontak_pic?: string;
  email_pic?: string;
  npwp_file_url?: string;
  nib_file_url?: string;
  ktp_file_url?: string;
  foto_gudang?: string;
  nib?: string;
  npwp?: string;
  created_at?: string;
}

interface Distributor {
  id: string;
  email: string;
  profile?: DistributorProfile;
}

export default function AdminEditDistributor() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { lang } = useLanguage();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [distributor, setDistributor] = useState<Distributor | null>(null);
  const [currentTab, setCurrentTab] = useState('overview');
  const [documentPreview, setDocumentPreview] = useState<{ url: string; title: string } | null>(null);
  const [formData, setFormData] = useState<DistributorProfile>({
    user_id: '',
  });
  const [areaSearch, setAreaSearch] = useState('');

  const t = lang === 'id' ? translations.id : translations.en;

  useEffect(() => {
    if (id) {
      loadDistributor();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadDistributor = async () => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .from('distributor_profiles')
        .select('*')
        .eq('user_id', id)
        .single();

      if (error) throw error;

      if (data) {
        const profile = data as any as DistributorProfile;
        const dist = {
          id: profile.user_id,
          email: profile.email || '',
          profile: profile,
        };
        setDistributor(dist);
        setFormData(profile);
      }
    } catch (error: any) {
      toast({
        title: t.error,
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof DistributorProfile, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDocumentPreview = (url: string | undefined, title: string) => {
    if (!url) return;
    const imageUrl = getImageUrl(url);
    if (imageUrl) {
      setDocumentPreview({ url: imageUrl, title });
    }
  };

  const handleFileUpload = async (field: 'npwp_file_url' | 'nib_file_url' | 'ktp_file_url', file: File) => {
    try {
      // Use uploadFileToS3 which handles compression automatically
      const folderMap = {
        npwp_file_url: 'documents/npwp',
        nib_file_url: 'documents/nib',
        ktp_file_url: 'documents/ktp',
      };
      
      const result = await uploadFileToS3(file, folderMap[field]);
      
      if (!result.success || !result.url) {
        throw new Error(result.error || 'Upload failed');
      }

      // Update form data
      setFormData((prev) => ({
        ...prev,
        [field]: result.url,
      }));

      // Immediately save to database
      const updateData: Record<string, string> = {
        [field]: result.url!,
      };

      const { error } = await (supabase as any)
        .from('distributor_profiles')
        .update(updateData)
        .eq('user_id', id);

      if (error) throw error;

      toast({
        title: t.success,
        description: t.fileUploaded,
      });
    } catch (error: any) {
      toast({
        title: t.error,
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      const { error } = await (supabase as any)
        .from('distributor_profiles')
        .upsert({
          user_id: id,
          ...formData,
        });

      if (error) throw error;

      toast({
        title: t.success,
        description: t.saveSuccess,
      });

      // Navigate back to view page
      navigate(`/admin/distributors/view/${id}`);
    } catch (error: any) {
      toast({
        title: t.error,
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(`/admin/distributors/view/${id}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <SEO
          title="Edit Distributor"
          description="Edit distributor details"
        />
        <Navbar />
        <div className="flex">
          <AdminSidebar lang={lang} />
          <main className="flex-1 p-8">
            <p>{t.loading}</p>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={`${distributor?.profile?.nama_bisnis || 'Distributor'} - Edit`}
        description="Edit distributor details"
      />
      <Navbar />
      <div className="flex">
        <AdminSidebar lang={lang} />
        <main className="flex-1 p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                {t.back}
              </Button>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                  <User className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{distributor?.profile?.nama_bisnis || t.editDistributor}</h1>
                  <p className="text-sm text-muted-foreground">
                    {distributor?.email} • {distributor?.profile?.kota}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isSaving}
              >
                <X className="h-4 w-4 mr-1" />
                {t.cancel}
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-orange-500 hover:bg-orange-600"
              >
                <Save className="h-4 w-4 mr-1" />
                {isSaving ? t.saving : t.save}
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={currentTab} onValueChange={setCurrentTab}>
            <TabsList className="grid w-full grid-cols-6 mb-6">
              <TabsTrigger value="overview">
                <User className="h-4 w-4 mr-1" />
                {t.overview}
              </TabsTrigger>
              <TabsTrigger value="company">
                <Building2 className="h-4 w-4 mr-1" />
                {t.company}
              </TabsTrigger>
              <TabsTrigger value="warehouse">
                <Warehouse className="h-4 w-4 mr-1" />
                {t.warehouse}
              </TabsTrigger>
              <TabsTrigger value="banking">
                <CreditCard className="h-4 w-4 mr-1" />
                {t.banking}
              </TabsTrigger>
              <TabsTrigger value="pic">
                <Briefcase className="h-4 w-4 mr-1" />
                PIC
              </TabsTrigger>
              <TabsTrigger value="documents">
                <FileText className="h-4 w-4 mr-1" />
                {t.documents}
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {t.basicInformation}
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="nama_bisnis">{t.businessName}</Label>
                    <Input
                      id="nama_bisnis"
                      value={formData.nama_bisnis || ''}
                      onChange={(e) => handleInputChange('nama_bisnis', e.target.value)}
                      placeholder={t.businessName}
                    />
                  </div>
                  <div>
                    <Label htmlFor="nama_pemilik">{t.ownerName}</Label>
                    <Input
                      id="nama_pemilik"
                      value={formData.nama_pemilik || ''}
                      onChange={(e) => handleInputChange('nama_pemilik', e.target.value)}
                      placeholder={t.ownerName}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email_pemilik">{t.email}</Label>
                    <Input
                      id="email_pemilik"
                      type="email"
                      value={formData.email_pemilik || ''}
                      onChange={(e) => handleInputChange('email_pemilik', e.target.value)}
                      placeholder={t.email}
                    />
                  </div>
                  <div>
                    <Label htmlFor="kontak_pemilik">{t.contact}</Label>
                    <Input
                      id="kontak_pemilik"
                      value={formData.kontak_pemilik || ''}
                      onChange={(e) => handleInputChange('kontak_pemilik', e.target.value)}
                      placeholder={t.contact}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="alamat_lengkap">{t.address}</Label>
                    <Textarea
                      id="alamat_lengkap"
                      value={formData.alamat_lengkap || ''}
                      onChange={(e) => handleInputChange('alamat_lengkap', e.target.value)}
                      placeholder={t.address}
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="kota">{t.location}</Label>
                    <Input
                      id="kota"
                      value={formData.kota || ''}
                      onChange={(e) => handleInputChange('kota', e.target.value)}
                      placeholder={t.location}
                    />
                  </div>
                  <div>
                    <Label htmlFor="status">{t.status}</Label>
                    <Select
                      value={formData.status || 'pending'}
                      onValueChange={(value) => handleInputChange('status', value)}
                    >
                      <SelectTrigger id="status">
                        <SelectValue placeholder={t.selectStatus} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">{t.active}</SelectItem>
                        <SelectItem value="pending">{t.pending}</SelectItem>
                        <SelectItem value="approved">{t.approved}</SelectItem>
                        <SelectItem value="rejected">{t.rejected}</SelectItem>
                        <SelectItem value="suspended">{t.suspended}</SelectItem>
                        <SelectItem value="inactive">{t.inactive}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Company Tab */}
            <TabsContent value="company">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  {t.companyInformation}
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="email_perusahaan">{t.companyEmail}</Label>
                    <Input
                      id="email_perusahaan"
                      type="email"
                      value={formData.email_perusahaan || ''}
                      onChange={(e) => handleInputChange('email_perusahaan', e.target.value)}
                      placeholder={t.companyEmail}
                    />
                  </div>
                  <div>
                    <Label htmlFor="nomor_telp_perusahaan">{t.companyPhone}</Label>
                    <Input
                      id="nomor_telp_perusahaan"
                      value={formData.nomor_telp_perusahaan || ''}
                      onChange={(e) => handleInputChange('nomor_telp_perusahaan', e.target.value)}
                      placeholder={t.companyPhone}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="alamat_lengkap">{t.companyAddress}</Label>
                    <Textarea
                      id="alamat_lengkap"
                      value={formData.alamat_lengkap || ''}
                      onChange={(e) => handleInputChange('alamat_lengkap', e.target.value)}
                      placeholder={t.companyAddress}
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="kota">{t.location}</Label>
                    <Input
                      id="kota"
                      value={formData.kota || ''}
                      onChange={(e) => handleInputChange('kota', e.target.value)}
                      placeholder={t.location}
                    />
                  </div>
                  <div>
                    <Label htmlFor="nama_direktur">{t.directorName}</Label>
                    <Input
                      id="nama_direktur"
                      value={formData.nama_direktur || ''}
                      onChange={(e) => handleInputChange('nama_direktur', e.target.value)}
                      placeholder={t.directorName}
                    />
                  </div>
                  <div>
                    <Label htmlFor="bentuk_usaha">{t.businessType}</Label>
                    <Select
                      value={formData.bentuk_usaha || ''}
                      onValueChange={(value) => handleInputChange('bentuk_usaha', value)}
                    >
                      <SelectTrigger id="bentuk_usaha">
                        <SelectValue placeholder={t.selectBusinessType} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PT">PT</SelectItem>
                        <SelectItem value="CV">CV</SelectItem>
                        <SelectItem value="UD">UD</SelectItem>
                        <SelectItem value="Perorangan">Perorangan</SelectItem>
                        <SelectItem value="Koperasi">Koperasi</SelectItem>
                        <SelectItem value="Lainnya">Lainnya</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="status_pkp">{t.pkpStatus}</Label>
                    <Input
                      id="status_pkp"
                      value={formData.status_pkp || ''}
                      onChange={(e) => handleInputChange('status_pkp', e.target.value)}
                      placeholder={t.pkpStatus}
                    />
                  </div>
                  <div>
                    <Label htmlFor="npwp_number">{t.npwpNumber}</Label>
                    <Input
                      id="npwp_number"
                      value={formData.npwp_number || formData.nomor_npwp || ''}
                      onChange={(e) => handleInputChange('npwp_number', e.target.value)}
                      placeholder={t.npwpNumber}
                    />
                  </div>
                  <div>
                    <Label htmlFor="nib_number">{t.nibNumber}</Label>
                    <Input
                      id="nib_number"
                      value={formData.nib_number || formData.nomor_nib || ''}
                      onChange={(e) => handleInputChange('nib_number', e.target.value)}
                      placeholder={t.nibNumber}
                    />
                  </div>
                  <div>
                    <Label htmlFor="website">{t.website}</Label>
                    <Input
                      id="website"
                      type="url"
                      value={formData.website || formData.website_perusahaan || ''}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      placeholder={t.website}
                    />
                  </div>
                  <div>
                    <Label htmlFor="omzet">{t.revenue}</Label>
                    <Input
                      id="omzet"
                      value={formData.omzet || ''}
                      onChange={(e) => handleInputChange('omzet', e.target.value)}
                      placeholder={t.revenue}
                    />
                  </div>
                  <div>
                    <Label htmlFor="jumlah_karyawan">{t.employees}</Label>
                    <Input
                      id="jumlah_karyawan"
                      type="number"
                      value={formData.jumlah_karyawan || ''}
                      onChange={(e) => handleInputChange('jumlah_karyawan', parseInt(e.target.value) || 0)}
                      placeholder={t.employees}
                    />
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Warehouse Tab */}
            <TabsContent value="warehouse">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Warehouse className="h-5 w-5" />
                  {t.warehouseInformation}
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2">
                    <Label htmlFor="alamat_kantor">{t.officeAddress}</Label>
                    <Textarea
                      id="alamat_kantor"
                      value={formData.alamat_kantor || ''}
                      onChange={(e) => handleInputChange('alamat_kantor', e.target.value)}
                      placeholder={t.officeAddress}
                      rows={3}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="alamat_gudang">{t.warehouseAddress}</Label>
                    <Textarea
                      id="alamat_gudang"
                      value={formData.alamat_gudang || ''}
                      onChange={(e) => handleInputChange('alamat_gudang', e.target.value)}
                      placeholder={t.warehouseAddress}
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="koordinat">{t.coordinates}</Label>
                    <Input
                      id="koordinat"
                      value={formData.koordinat || ''}
                      onChange={(e) => handleInputChange('koordinat', e.target.value)}
                      placeholder={t.coordinates}
                    />
                  </div>
                  <div>
                    <Label htmlFor="jumlah_armada_pengiriman">{t.deliveryFleet}</Label>
                    <Input
                      id="jumlah_armada_pengiriman"
                      type="number"
                      value={formData.jumlah_armada_pengiriman || ''}
                      onChange={(e) => handleInputChange('jumlah_armada_pengiriman', e.target.value)}
                      placeholder={t.deliveryFleet}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="aplikasi_pencatatan">{t.recordingApp}</Label>
                    <Select
                      value=""
                      onValueChange={(selectedApp) => {
                        if (selectedApp) {
                          const currentApps = formData.aplikasi_pencatatan ? formData.aplikasi_pencatatan.split(', ').filter(a => a) : [];
                          if (!currentApps.includes(selectedApp)) {
                            handleInputChange('aplikasi_pencatatan', [...currentApps, selectedApp].join(', '));
                          }
                        }
                      }}
                    >
                      <SelectTrigger id="aplikasi_pencatatan">
                        <SelectValue placeholder={lang === 'id' ? 'Pilih aplikasi...' : 'Select application...'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Zahir Accounting">Zahir Accounting</SelectItem>
                        <SelectItem value="MYOB">MYOB</SelectItem>
                        <SelectItem value="Kledo">Kledo</SelectItem>
                        <SelectItem value="BukuWarung">BukuWarung</SelectItem>
                        <SelectItem value="BukuKas">BukuKas</SelectItem>
                        <SelectItem value="Olsera">Olsera</SelectItem>
                        <SelectItem value="Pawoon">Pawoon</SelectItem>
                        <SelectItem value="Moka POS">Moka POS</SelectItem>
                        <SelectItem value="Jurnal">Jurnal</SelectItem>
                        <SelectItem value="Accurate">Accurate</SelectItem>
                        <SelectItem value="SAP">SAP</SelectItem>
                        <SelectItem value="Oracle">Oracle</SelectItem>
                        <SelectItem value="Microsoft Excel">Microsoft Excel</SelectItem>
                        <SelectItem value="Google Sheets">Google Sheets</SelectItem>
                        <SelectItem value={lang === 'id' ? 'Lainnya' : 'Other'}>{lang === 'id' ? 'Lainnya' : 'Other'}</SelectItem>
                      </SelectContent>
                    </Select>
                    {formData.aplikasi_pencatatan && formData.aplikasi_pencatatan.split(', ').filter(a => a).length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.aplikasi_pencatatan.split(', ').filter(a => a).map((app) => (
                          <div
                            key={app}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 text-orange-700 text-sm rounded-md border border-orange-200"
                          >
                            <span>{app}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const apps = formData.aplikasi_pencatatan!.split(', ').filter(a => a !== app);
                                handleInputChange('aplikasi_pencatatan', apps.join(', '));
                              }}
                              className="hover:bg-orange-200 rounded-full p-0.5 transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {lang === 'id' ? 'Pilih satu atau lebih aplikasi yang digunakan' : 'Select one or more applications used'}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="area_distribusi">{t.distributionArea}</Label>
                    <div className="relative">
                      <Input
                        type="text"
                        value={areaSearch}
                        onChange={(e) => setAreaSearch(e.target.value)}
                        placeholder={lang === 'id' ? 'Cari kota/kabupaten...' : 'Search city/regency...'}
                      />
                      {areaSearch && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                          {INDONESIAN_AREAS
                            .filter(area => area.toLowerCase().includes(areaSearch.toLowerCase()))
                            .slice(0, 50)
                            .map((area) => {
                              const currentAreas = formData.area_distribusi ? formData.area_distribusi.split(', ').filter(a => a) : [];
                              return (
                                <button
                                  key={area}
                                  type="button"
                                  onClick={() => {
                                    if (!currentAreas.includes(area)) {
                                      handleInputChange('area_distribusi', [...currentAreas, area].join(', '));
                                    }
                                    setAreaSearch("");
                                  }}
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-orange-50 transition-colors"
                                >
                                  {area}
                                </button>
                              );
                            })}
                          {INDONESIAN_AREAS.filter(area => area.toLowerCase().includes(areaSearch.toLowerCase())).length === 0 && (
                            <div className="px-3 py-2 text-sm text-gray-500">
                              {lang === 'id' ? 'Tidak ada hasil' : 'No results'}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {formData.area_distribusi && formData.area_distribusi.split(', ').filter(a => a).length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.area_distribusi.split(', ').filter(a => a).map((area) => (
                          <div
                            key={area}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 text-orange-700 text-sm rounded-md border border-orange-200"
                          >
                            <span>{area}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const areas = formData.area_distribusi!.split(', ').filter(a => a !== area);
                                handleInputChange('area_distribusi', areas.join(', '));
                              }}
                              className="hover:bg-orange-200 rounded-full p-0.5 transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {lang === 'id' ? 'Ketik untuk mencari dan pilih kota/kabupaten' : 'Type to search and select cities/regencies'}
                    </p>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Banking Tab */}
            <TabsContent value="banking">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  {t.bankingInformation}
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="nama_bank">{t.bankName}</Label>
                    <Input
                      id="nama_bank"
                      value={formData.nama_bank || ''}
                      onChange={(e) => handleInputChange('nama_bank', e.target.value)}
                      placeholder={t.bankName}
                    />
                  </div>
                  <div>
                    <Label htmlFor="nama_pemilik_akun">{t.accountOwner}</Label>
                    <Input
                      id="nama_pemilik_akun"
                      value={formData.nama_pemilik_akun || ''}
                      onChange={(e) => handleInputChange('nama_pemilik_akun', e.target.value)}
                      placeholder={t.accountOwner}
                    />
                  </div>
                  <div>
                    <Label htmlFor="nomor_rekening">{t.accountNumber}</Label>
                    <Input
                      id="nomor_rekening"
                      value={formData.nomor_rekening || ''}
                      onChange={(e) => handleInputChange('nomor_rekening', e.target.value)}
                      placeholder={t.accountNumber}
                    />
                  </div>
                  <div>
                    <Label htmlFor="metode_pembayaran">{t.paymentMethods}</Label>
                    <Input
                      id="metode_pembayaran"
                      value={formData.metode_pembayaran || ''}
                      onChange={(e) => handleInputChange('metode_pembayaran', e.target.value)}
                      placeholder={t.paymentMethods}
                    />
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* PIC Tab */}
            <TabsContent value="pic">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  {t.picInformation}
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="nama_pic">{t.picName}</Label>
                    <Input
                      id="nama_pic"
                      value={formData.nama_pic || ''}
                      onChange={(e) => handleInputChange('nama_pic', e.target.value)}
                      placeholder={t.picName}
                    />
                  </div>
                  <div>
                    <Label htmlFor="posisi_pic">{t.picPosition}</Label>
                    <Input
                      id="posisi_pic"
                      value={formData.posisi_pic || ''}
                      onChange={(e) => handleInputChange('posisi_pic', e.target.value)}
                      placeholder={t.picPosition}
                    />
                  </div>
                  <div>
                    <Label htmlFor="nomor_kontak_pic">{t.picContact}</Label>
                    <Input
                      id="nomor_kontak_pic"
                      value={formData.nomor_kontak_pic || ''}
                      onChange={(e) => handleInputChange('nomor_kontak_pic', e.target.value)}
                      placeholder={t.picContact}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email_pic">{t.picEmail}</Label>
                    <Input
                      id="email_pic"
                      type="email"
                      value={formData.email_pic || ''}
                      onChange={(e) => handleInputChange('email_pic', e.target.value)}
                      placeholder={t.picEmail}
                    />
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {t.documentsInformation}
                </h3>
                <div className="grid grid-cols-3 gap-6">
                  {/* NPWP Document */}
                  <div className="border rounded-lg p-4">
                    <Label className="text-base font-semibold mb-3 block">{t.npwpDocument}</Label>
                    {formData.npwp_file_url ? (
                      <div 
                        className="relative aspect-[3/4] rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity border-2 border-gray-200 mb-3"
                        onClick={() => handleDocumentPreview(formData.npwp_file_url, t.npwpDocument)}
                      >
                        <img 
                          src={getImageUrl(formData.npwp_file_url) || ''} 
                          alt={t.npwpDocument}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.parentElement!.innerHTML = '<div class="flex items-center justify-center h-full bg-gray-100"><svg class="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg></div>';
                          }}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all flex items-center justify-center">
                          <Eye className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    ) : (
                      <div className="aspect-[3/4] rounded-lg bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300 mb-3">
                        <p className="text-sm text-gray-400">{t.notUploaded}</p>
                      </div>
                    )}
                    <label htmlFor="npwp_upload">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        asChild
                      >
                        <span>
                          <Upload className="h-4 w-4 mr-1" />
                          {t.upload}
                        </span>
                      </Button>
                      <input
                        id="npwp_upload"
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload('npwp_file_url', file);
                        }}
                      />
                    </label>
                  </div>

                  {/* NIB Document */}
                  <div className="border rounded-lg p-4">
                    <Label className="text-base font-semibold mb-3 block">{t.nibDocument}</Label>
                    {formData.nib_file_url ? (
                      <div 
                        className="relative aspect-[3/4] rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity border-2 border-gray-200 mb-3"
                        onClick={() => handleDocumentPreview(formData.nib_file_url, t.nibDocument)}
                      >
                        <img 
                          src={getImageUrl(formData.nib_file_url) || ''} 
                          alt={t.nibDocument}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.parentElement!.innerHTML = '<div class="flex items-center justify-center h-full bg-gray-100"><svg class="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg></div>';
                          }}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all flex items-center justify-center">
                          <Eye className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    ) : (
                      <div className="aspect-[3/4] rounded-lg bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300 mb-3">
                        <p className="text-sm text-gray-400">{t.notUploaded}</p>
                      </div>
                    )}
                    <label htmlFor="nib_upload">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        asChild
                      >
                        <span>
                          <Upload className="h-4 w-4 mr-1" />
                          {t.upload}
                        </span>
                      </Button>
                      <input
                        id="nib_upload"
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload('nib_file_url', file);
                        }}
                      />
                    </label>
                  </div>

                  {/* KTP Document */}
                  <div className="border rounded-lg p-4">
                    <Label className="text-base font-semibold mb-3 block">{t.ktpDocument}</Label>
                    {formData.ktp_file_url ? (
                      <div 
                        className="relative aspect-[3/4] rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity border-2 border-gray-200 mb-3"
                        onClick={() => handleDocumentPreview(formData.ktp_file_url, t.ktpDocument)}
                      >
                        <img 
                          src={getImageUrl(formData.ktp_file_url) || ''} 
                          alt={t.ktpDocument}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.parentElement!.innerHTML = '<div class="flex items-center justify-center h-full bg-gray-100"><svg class="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg></div>';
                          }}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all flex items-center justify-center">
                          <Eye className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    ) : (
                      <div className="aspect-[3/4] rounded-lg bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300 mb-3">
                        <p className="text-sm text-gray-400">{t.notUploaded}</p>
                      </div>
                    )}
                    <label htmlFor="ktp_upload">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        asChild
                      >
                        <span>
                          <Upload className="h-4 w-4 mr-1" />
                          {t.upload}
                        </span>
                      </Button>
                      <input
                        id="ktp_upload"
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload('ktp_file_url', file);
                        }}
                      />
                    </label>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Document Preview Dialog */}
      <Dialog open={!!documentPreview} onOpenChange={() => setDocumentPreview(null)}>
        <DialogContent className="max-w-5xl max-h-[95vh] p-0 bg-gray-900">
          <div className="relative w-full h-full flex flex-col">
            <div className="bg-gray-900 p-4 flex-shrink-0 flex items-center justify-between">
              <h3 className="text-white font-semibold">{documentPreview?.title}</h3>
              <button
                onClick={() => setDocumentPreview(null)}
                className="text-white hover:text-gray-300 transition-colors p-2 rounded-full hover:bg-gray-800"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="flex items-center justify-center p-6 flex-1 min-h-0 bg-gray-900">
              <img 
                src={documentPreview?.url || ''} 
                alt={documentPreview?.title || ''}
                className="max-w-full max-h-[calc(95vh-100px)] object-contain"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Translations
const translations = {
  id: {
    error: 'Error',
    success: 'Sukses',
    loading: 'Memuat...',
    saving: 'Menyimpan...',
    back: 'Kembali',
    save: 'Simpan',
    cancel: 'Batal',
    edit: 'Edit',
    editDistributor: 'Edit Distributor',
    overview: 'Ringkasan',
    company: 'Perusahaan',
    warehouse: 'Gudang',
    banking: 'Perbankan',
    documents: 'Dokumen',
    basicInformation: 'Informasi Dasar',
    companyInformation: 'Informasi Perusahaan',
    warehouseInformation: 'Informasi Gudang',
    bankingInformation: 'Informasi Perbankan',
    picInformation: 'Informasi PIC',
    documentsInformation: 'Dokumen',
    businessName: 'Nama Bisnis',
    ownerName: 'Nama Pemilik',
    email: 'Email',
    contact: 'Kontak',
    address: 'Alamat',
    location: 'Lokasi',
    status: 'Status',
    selectStatus: 'Pilih Status',
    companyEmail: 'Email Perusahaan',
    companyPhone: 'Telepon Perusahaan',
    companyAddress: 'Alamat Perusahaan',
    directorName: 'Nama Direktur',
    businessType: 'Bentuk Usaha',
    selectBusinessType: 'Pilih Bentuk Usaha',
    pkpStatus: 'Status PKP',
    npwpNumber: 'Nomor NPWP',
    nibNumber: 'Nomor NIB',
    website: 'Website',
    revenue: 'Omzet',
    employees: 'Jumlah Karyawan',
    officeAddress: 'Alamat Kantor',
    warehouseAddress: 'Alamat Gudang',
    coordinates: 'Koordinat',
    deliveryFleet: 'Jumlah Armada',
    recordingApp: 'Aplikasi Pencatatan',
    distributionArea: 'Area Distribusi',
    bankName: 'Nama Bank',
    accountOwner: 'Nama Pemilik Rekening',
    accountNumber: 'Nomor Rekening',
    paymentMethods: 'Metode Pembayaran',
    picName: 'Nama PIC',
    picPosition: 'Posisi PIC',
    picContact: 'Kontak PIC',
    picEmail: 'Email PIC',
    npwpDocument: 'Dokumen NPWP',
    nibDocument: 'Dokumen NIB',
    ktpDocument: 'Dokumen KTP',
    upload: 'Unggah',
    view: 'Lihat',
    uploaded: 'Sudah diunggah',
    notUploaded: 'Belum diunggah',
    fileUploaded: 'File berhasil diunggah',
    saveSuccess: 'Data berhasil disimpan',
    active: 'Aktif',
    pending: 'Menunggu',
    approved: 'Disetujui',
    rejected: 'Ditolak',
    suspended: 'Ditangguhkan',
    inactive: 'Tidak Aktif',
  },
  en: {
    error: 'Error',
    success: 'Success',
    loading: 'Loading...',
    saving: 'Saving...',
    back: 'Back',
    save: 'Save',
    cancel: 'Cancel',
    edit: 'Edit',
    editDistributor: 'Edit Distributor',
    overview: 'Overview',
    company: 'Company',
    warehouse: 'Warehouse',
    banking: 'Banking',
    documents: 'Documents',
    basicInformation: 'Basic Information',
    companyInformation: 'Company Information',
    warehouseInformation: 'Warehouse Information',
    bankingInformation: 'Banking Information',
    picInformation: 'PIC Information',
    documentsInformation: 'Documents',
    businessName: 'Business Name',
    ownerName: 'Owner Name',
    email: 'Email',
    contact: 'Contact',
    address: 'Address',
    location: 'Location',
    status: 'Status',
    selectStatus: 'Select Status',
    companyEmail: 'Company Email',
    companyPhone: 'Company Phone',
    companyAddress: 'Company Address',
    directorName: 'Director Name',
    businessType: 'Business Type',
    selectBusinessType: 'Select Business Type',
    pkpStatus: 'PKP Status',
    npwpNumber: 'NPWP Number',
    nibNumber: 'NIB Number',
    website: 'Website',
    revenue: 'Revenue',
    employees: 'Employees',
    officeAddress: 'Office Address',
    warehouseAddress: 'Warehouse Address',
    coordinates: 'Coordinates',
    deliveryFleet: 'Delivery Fleet',
    recordingApp: 'Recording Application',
    distributionArea: 'Distribution Area',
    bankName: 'Bank Name',
    accountOwner: 'Account Owner',
    accountNumber: 'Account Number',
    paymentMethods: 'Payment Methods',
    picName: 'PIC Name',
    picPosition: 'PIC Position',
    picContact: 'PIC Contact',
    picEmail: 'PIC Email',
    npwpDocument: 'NPWP Document',
    nibDocument: 'NIB Document',
    ktpDocument: 'KTP Document',
    upload: 'Upload',
    view: 'View',
    uploaded: 'Uploaded',
    notUploaded: 'Not uploaded',
    fileUploaded: 'File uploaded successfully',
    saveSuccess: 'Data saved successfully',
    active: 'Active',
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    suspended: 'Suspended',
    inactive: 'Inactive',
  },
};
