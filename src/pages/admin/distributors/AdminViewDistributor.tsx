// React & Router
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

// External Libraries & Icons
import {
  ArrowLeft,
  Edit,
  User,
  Building2,
  Warehouse,
  CreditCard,
  Briefcase,
  FileText,
  Eye,
  X,
} from "lucide-react";

// UI Components
import SEO from "@/components/seo/SEO";
import Navbar from "@/components/layout/Navbar";
import AdminSidebar from "@/components/layout/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";

// Hooks
import { useLanguage } from "@/hooks/use-language";

// Utils & API
import { getImageUrl } from "@/lib/s3-upload";

// Integrations
import { supabase } from "@/integrations/supabase/client";

/* eslint-disable @typescript-eslint/no-explicit-any */

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

export default function AdminViewDistributor() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { lang } = useLanguage();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [distributor, setDistributor] = useState<Distributor | null>(null);
  const [currentTab, setCurrentTab] = useState("overview");
  const [documentPreview, setDocumentPreview] = useState<{
    url: string;
    title: string;
  } | null>(null);

  const t = lang === "id" ? translations.id : translations.en;

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
        .from("distributor_profiles")
        .select("*")
        .eq("user_id", id)
        .single();

      if (error) throw error;

      if (data) {
        const profile = data as any as DistributorProfile;
        setDistributor({
          id: profile.user_id,
          email: profile.email || "",
          profile: profile,
        });
      }
    } catch (error: any) {
      toast({
        title: t.error,
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: "bg-green-500",
      pending: "bg-yellow-500",
      approved: "bg-blue-500",
      rejected: "bg-red-500",
      suspended: "bg-orange-500",
      inactive: "bg-gray-500",
      draft: "bg-gray-400",
    };

    return (
      <Badge className={colors[status] || "bg-gray-500"}>
        {t[status as keyof typeof t] || status}
      </Badge>
    );
  };

  const handleDocumentPreview = (url: string | undefined, title: string) => {
    if (!url) return;
    const imageUrl = getImageUrl(url);
    if (imageUrl) {
      setDocumentPreview({ url: imageUrl, title });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SEO title="View Distributor" description="View distributor details" />
        <Navbar />
        <div className="flex">
          <AdminSidebar lang={lang} />
          <main className="flex-1 py-8 px-4 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">{t.loading}</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={`${distributor?.profile?.nama_bisnis || "Distributor"} - View`}
        description="View distributor details"
      />
      <Navbar />
      <div className="flex">
        <AdminSidebar lang={lang} />
        <main className="flex-1 p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                  <User className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">
                    {distributor?.profile?.nama_bisnis}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {distributor?.email} • {distributor?.profile?.kota}
                  </p>
                </div>
              </div>
            </div>
            <Button
              onClick={() => navigate(`/admin/distributors/edit/${id}`)}
              className="bg-orange-500 hover:bg-orange-600"
            >
              <Edit className="h-4 w-4 mr-1" />
              {t.edit}
            </Button>
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
                    <Label className="text-sm font-medium text-muted-foreground">
                      {t.businessName}
                    </Label>
                    <p className="mt-1 text-base">
                      {distributor?.profile?.nama_bisnis || "-"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      {t.ownerName}
                    </Label>
                    <p className="mt-1 text-base">
                      {distributor?.profile?.nama_pemilik || "-"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      {t.email}
                    </Label>
                    <p className="mt-1 text-base">
                      {distributor?.profile?.email_pemilik || "-"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      {t.contact}
                    </Label>
                    <p className="mt-1 text-base">
                      {distributor?.profile?.kontak_pemilik || "-"}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-sm font-medium text-muted-foreground">
                      {t.address}
                    </Label>
                    <p className="mt-1 text-base">
                      {distributor?.profile?.alamat_lengkap || "-"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      {t.location}
                    </Label>
                    <p className="mt-1 text-base">
                      {distributor?.profile?.kota || "-"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      {t.status}
                    </Label>
                    <div className="mt-1">
                      {distributor?.profile?.status
                        ? getStatusBadge(distributor.profile.status)
                        : "-"}
                    </div>
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
                    <Label className="text-sm font-medium text-muted-foreground">
                      {t.companyEmail}
                    </Label>
                    <p className="mt-1 text-base">
                      {distributor?.profile?.email_perusahaan || "-"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      {t.companyPhone}
                    </Label>
                    <p className="mt-1 text-base">
                      {distributor?.profile?.nomor_telp_perusahaan || "-"}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-sm font-medium text-muted-foreground">
                      {t.companyAddress}
                    </Label>
                    <p className="mt-1 text-base">
                      {distributor?.profile?.alamat_lengkap || "-"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      {t.location}
                    </Label>
                    <p className="mt-1 text-base">
                      {distributor?.profile?.kota || "-"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      {t.directorName}
                    </Label>
                    <p className="mt-1 text-base">
                      {distributor?.profile?.nama_direktur || "-"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      {t.businessType}
                    </Label>
                    <p className="mt-1 text-base">
                      {distributor?.profile?.bentuk_usaha || "-"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      {t.pkpStatus}
                    </Label>
                    <p className="mt-1 text-base">
                      {distributor?.profile?.status_pkp || "-"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      {t.npwpNumber}
                    </Label>
                    <p className="mt-1 text-base">
                      {distributor?.profile?.npwp_number ||
                        distributor?.profile?.nomor_npwp ||
                        "-"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      {t.nibNumber}
                    </Label>
                    <p className="mt-1 text-base">
                      {distributor?.profile?.nib_number ||
                        distributor?.profile?.nomor_nib ||
                        "-"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      {t.website}
                    </Label>
                    <p className="mt-1 text-base">
                      {distributor?.profile?.website ||
                        distributor?.profile?.website_perusahaan ||
                        "-"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      {t.revenue}
                    </Label>
                    <p className="mt-1 text-base">
                      {distributor?.profile?.omzet || "-"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      {t.employees}
                    </Label>
                    <p className="mt-1 text-base">
                      {distributor?.profile?.jumlah_karyawan || "-"}
                    </p>
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
                    <Label className="text-sm font-medium text-muted-foreground">
                      {t.officeAddress}
                    </Label>
                    <p className="mt-1 text-base">
                      {distributor?.profile?.alamat_kantor || "-"}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-sm font-medium text-muted-foreground">
                      {t.warehouseAddress}
                    </Label>
                    <p className="mt-1 text-base">
                      {distributor?.profile?.alamat_gudang || "-"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      {t.coordinates}
                    </Label>
                    <p className="mt-1 text-base">
                      {distributor?.profile?.koordinat || "-"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      {t.deliveryFleet}
                    </Label>
                    <p className="mt-1 text-base">
                      {distributor?.profile?.jumlah_armada_pengiriman || "-"}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-sm font-medium text-muted-foreground">
                      {t.recordingApp}
                    </Label>
                    {distributor?.profile?.aplikasi_pencatatan ? (
                      <div className="flex flex-wrap gap-2 mt-1">
                        {distributor.profile.aplikasi_pencatatan
                          .split(", ")
                          .filter((a) => a)
                          .map((app) => (
                            <span
                              key={app}
                              className="inline-flex items-center px-3 py-1 bg-orange-100 text-orange-700 text-sm rounded-md border border-orange-200"
                            >
                              {app}
                            </span>
                          ))}
                      </div>
                    ) : (
                      <p className="mt-1 text-base">-</p>
                    )}
                  </div>
                  <div className="col-span-2">
                    <Label className="text-sm font-medium text-muted-foreground">
                      {t.distributionArea}
                    </Label>
                    {distributor?.profile?.area_distribusi ? (
                      <div className="flex flex-wrap gap-2 mt-1">
                        {distributor.profile.area_distribusi
                          .split(", ")
                          .filter((a) => a)
                          .map((area) => (
                            <span
                              key={area}
                              className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-md border border-blue-200"
                            >
                              {area}
                            </span>
                          ))}
                      </div>
                    ) : (
                      <p className="mt-1 text-base">-</p>
                    )}
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
                    <Label className="text-sm font-medium text-muted-foreground">
                      {t.bankName}
                    </Label>
                    <p className="mt-1 text-base">
                      {distributor?.profile?.nama_bank || "-"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      {t.accountOwner}
                    </Label>
                    <p className="mt-1 text-base">
                      {distributor?.profile?.nama_pemilik_akun || "-"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      {t.accountNumber}
                    </Label>
                    <p className="mt-1 text-base">
                      {distributor?.profile?.nomor_rekening || "-"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      {t.paymentMethods}
                    </Label>
                    <p className="mt-1 text-base">
                      {distributor?.profile?.metode_pembayaran || "-"}
                    </p>
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
                    <Label className="text-sm font-medium text-muted-foreground">
                      {t.picName}
                    </Label>
                    <p className="mt-1 text-base">
                      {distributor?.profile?.nama_pic || "-"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      {t.picPosition}
                    </Label>
                    <p className="mt-1 text-base">
                      {distributor?.profile?.posisi_pic || "-"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      {t.picContact}
                    </Label>
                    <p className="mt-1 text-base">
                      {distributor?.profile?.nomor_kontak_pic || "-"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      {t.picEmail}
                    </Label>
                    <p className="mt-1 text-base">
                      {distributor?.profile?.email_pic || "-"}
                    </p>
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
                    <Label className="text-base font-semibold mb-3 block">
                      {t.npwpDocument}
                    </Label>
                    {distributor?.profile?.npwp_file_url ? (
                      <div
                        className="relative aspect-[3/4] rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity border-2 border-gray-200"
                        onClick={() =>
                          handleDocumentPreview(
                            distributor.profile?.npwp_file_url,
                            t.npwpDocument
                          )
                        }
                      >
                        <img
                          src={
                            getImageUrl(distributor.profile.npwp_file_url) || ""
                          }
                          alt={t.npwpDocument}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                            target.parentElement!.innerHTML =
                              '<div class="flex items-center justify-center h-full bg-gray-100"><FileText class="h-12 w-12 text-gray-400" /></div>';
                          }}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all flex items-center justify-center">
                          <Eye className="h-8 w-8 text-white opacity-0 hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    ) : (
                      <div className="aspect-[3/4] rounded-lg bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300">
                        <p className="text-sm text-gray-400">{t.notUploaded}</p>
                      </div>
                    )}
                  </div>

                  {/* NIB Document */}
                  <div className="border rounded-lg p-4">
                    <Label className="text-base font-semibold mb-3 block">
                      {t.nibDocument}
                    </Label>
                    {distributor?.profile?.nib_file_url ? (
                      <div
                        className="relative aspect-[3/4] rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity border-2 border-gray-200"
                        onClick={() =>
                          handleDocumentPreview(
                            distributor.profile?.nib_file_url,
                            t.nibDocument
                          )
                        }
                      >
                        <img
                          src={
                            getImageUrl(distributor.profile.nib_file_url) || ""
                          }
                          alt={t.nibDocument}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                            target.parentElement!.innerHTML =
                              '<div class="flex items-center justify-center h-full bg-gray-100"><FileText class="h-12 w-12 text-gray-400" /></div>';
                          }}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all flex items-center justify-center">
                          <Eye className="h-8 w-8 text-white opacity-0 hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    ) : (
                      <div className="aspect-[3/4] rounded-lg bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300">
                        <p className="text-sm text-gray-400">{t.notUploaded}</p>
                      </div>
                    )}
                  </div>

                  {/* KTP Document */}
                  <div className="border rounded-lg p-4">
                    <Label className="text-base font-semibold mb-3 block">
                      {t.ktpDocument}
                    </Label>
                    {distributor?.profile?.ktp_file_url ? (
                      <div
                        className="relative aspect-[3/4] rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity border-2 border-gray-200"
                        onClick={() =>
                          handleDocumentPreview(
                            distributor.profile?.ktp_file_url,
                            t.ktpDocument
                          )
                        }
                      >
                        <img
                          src={
                            getImageUrl(distributor.profile.ktp_file_url) || ""
                          }
                          alt={t.ktpDocument}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                            target.parentElement!.innerHTML =
                              '<div class="flex items-center justify-center h-full bg-gray-100"><FileText class="h-12 w-12 text-gray-400" /></div>';
                          }}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all flex items-center justify-center">
                          <Eye className="h-8 w-8 text-white opacity-0 hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    ) : (
                      <div className="aspect-[3/4] rounded-lg bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300">
                        <p className="text-sm text-gray-400">{t.notUploaded}</p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Document Preview Dialog */}
      <Dialog
        open={!!documentPreview}
        onOpenChange={() => setDocumentPreview(null)}
      >
        <DialogContent className="max-w-5xl max-h-[95vh] p-0 bg-gray-900">
          <div className="relative w-full h-full flex flex-col">
            <div className="bg-gray-900 p-4 flex-shrink-0 flex items-center justify-between">
              <h3 className="text-white font-semibold">
                {documentPreview?.title}
              </h3>
              <button
                onClick={() => setDocumentPreview(null)}
                className="text-white hover:text-gray-300 transition-colors p-2 rounded-full hover:bg-gray-800"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="flex items-center justify-center p-6 flex-1 min-h-0 bg-gray-900">
              <img
                src={documentPreview?.url || ""}
                alt={documentPreview?.title || ""}
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
    error: "Error",
    loading: "Memuat...",
    back: "Kembali",
    edit: "Edit",
    overview: "Ringkasan",
    company: "Perusahaan",
    warehouse: "Gudang",
    banking: "Perbankan",
    documents: "Dokumen",
    basicInformation: "Informasi Dasar",
    companyInformation: "Informasi Perusahaan",
    warehouseInformation: "Informasi Gudang",
    bankingInformation: "Informasi Perbankan",
    picInformation: "Informasi PIC",
    documentsInformation: "Dokumen",
    businessName: "Nama Bisnis",
    ownerName: "Nama Pemilik",
    email: "Email",
    contact: "Kontak",
    address: "Alamat",
    location: "Lokasi",
    status: "Status",
    companyEmail: "Email Perusahaan",
    companyPhone: "Telepon Perusahaan",
    companyAddress: "Alamat Perusahaan",
    directorName: "Nama Direktur",
    businessType: "Bentuk Usaha",
    pkpStatus: "Status PKP",
    npwpNumber: "Nomor NPWP",
    nibNumber: "Nomor NIB",
    website: "Website",
    revenue: "Omzet",
    employees: "Jumlah Karyawan",
    officeAddress: "Alamat Kantor",
    warehouseAddress: "Alamat Gudang",
    coordinates: "Koordinat",
    deliveryFleet: "Jumlah Armada",
    recordingApp: "Aplikasi Pencatatan",
    distributionArea: "Area Distribusi",
    bankName: "Nama Bank",
    accountOwner: "Nama Pemilik Rekening",
    accountNumber: "Nomor Rekening",
    paymentMethods: "Metode Pembayaran",
    picName: "Nama PIC",
    picPosition: "Posisi PIC",
    picContact: "Kontak PIC",
    picEmail: "Email PIC",
    npwpDocument: "Dokumen NPWP",
    nibDocument: "Dokumen NIB",
    ktpDocument: "Dokumen KTP",
    download: "Unduh",
    uploaded: "Sudah diunggah",
    notUploaded: "Belum diunggah",
    active: "Aktif",
    pending: "Menunggu",
    approved: "Disetujui",
    rejected: "Ditolak",
    suspended: "Ditangguhkan",
    inactive: "Tidak Aktif",
    draft: "Draft",
  },
  en: {
    error: "Error",
    loading: "Loading...",
    back: "Back",
    edit: "Edit",
    overview: "Overview",
    company: "Company",
    warehouse: "Warehouse",
    banking: "Banking",
    documents: "Documents",
    basicInformation: "Basic Information",
    companyInformation: "Company Information",
    warehouseInformation: "Warehouse Information",
    bankingInformation: "Banking Information",
    picInformation: "PIC Information",
    documentsInformation: "Documents",
    businessName: "Business Name",
    ownerName: "Owner Name",
    email: "Email",
    contact: "Contact",
    address: "Address",
    location: "Location",
    status: "Status",
    companyEmail: "Company Email",
    companyPhone: "Company Phone",
    companyAddress: "Company Address",
    directorName: "Director Name",
    businessType: "Business Type",
    pkpStatus: "PKP Status",
    npwpNumber: "NPWP Number",
    nibNumber: "NIB Number",
    website: "Website",
    revenue: "Revenue",
    employees: "Employees",
    officeAddress: "Office Address",
    warehouseAddress: "Warehouse Address",
    coordinates: "Coordinates",
    deliveryFleet: "Delivery Fleet",
    recordingApp: "Recording Application",
    distributionArea: "Distribution Area",
    bankName: "Bank Name",
    accountOwner: "Account Owner",
    accountNumber: "Account Number",
    paymentMethods: "Payment Methods",
    picName: "PIC Name",
    picPosition: "PIC Position",
    picContact: "PIC Contact",
    picEmail: "PIC Email",
    npwpDocument: "NPWP Document",
    nibDocument: "NIB Document",
    ktpDocument: "KTP Document",
    download: "Download",
    uploaded: "Uploaded",
    notUploaded: "Not uploaded",
    active: "Active",
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
    suspended: "Suspended",
    inactive: "Inactive",
    draft: "Draft",
  },
};
