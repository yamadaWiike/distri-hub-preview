// React & Router
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// External Libraries
import { Search, Eye, Edit, Shield, User, FileCheck } from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Hooks
import { useLanguage } from "@/hooks/use-language";

// Integrations
import { supabase } from "@/integrations/supabase/client";
// Customer API calls removed - handled in DistributorManager only

/* eslint-disable @typescript-eslint/no-explicit-any */

interface UserProfile {
  id: string;
  user_id: string;
  nama_bisnis: string;
  alamat_lengkap: string;
  kota: string;
  nama_pemilik: string;
  kontak_pemilik: string;
  email_pemilik: string;
  status: string;
  bentuk_usaha?: string;
  created_at: string;
  omzet?: string;
  jumlah_karyawan?: string;
  website_perusahaan?: string;
  npwp?: string;
  // Company fields
  email_perusahaan?: string;
  nomor_telp_perusahaan?: string;
  nama_direktur?: string;
  status_pkp?: string;
  npwp_number?: string;
  nib_number?: string;
  // Warehouse fields
  alamat_kantor?: string;
  alamat_gudang?: string;
  koordinat?: string;
  foto_gudang?: string;
  nib?: string;
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
  // Document URLs
  npwp_file_url?: string;
  nib_file_url?: string;
  ktp_file_url?: string;
}

interface User {
  id: string;
  email: string;
  role: string;
  profile?: UserProfile;
}

// Translations
const id = {
  error: "Error",
  success: "Berhasil",
  totalUsers: "Total Pengguna",
  adminUsers: "Admin",
  distributorUsers: "Distributor",
  salesUsers: "Sales",
  adminRole: "peran admin",
  distributorRole: "peran distributor",
  salesRole: "peran sales",
  resetPassword: "Reset Password",
  roleUpdated: "Peran berhasil diperbarui",
  passwordResetSent: "Link reset password terkirim",
  passwordResetDesc: "Link reset password telah dikirim ke email pengguna",
  searchUsers: "Cari pengguna...",
  filter: "Filter",
  allStatus: "Semua Status",
  allRoles: "Semua Peran",
  resetFilters: "Reset Filter",
  businessName: "Nama Bisnis",
  ownerName: "Nama Pemilik",
  email: "Email",
  location: "Lokasi",
  status: "Status",
  registerDate: "Tanggal Daftar",
  actions: "Aksi",
  loading: "Memuat...",
  noUsersFound: "Tidak ada pengguna ditemukan",
  view: "Lihat",
  edit: "Edit",
  save: "Simpan",
  cancel: "Batal",
  userDetails: "Detail Pengguna",
  overview: "Ringkasan",
  company: "Perusahaan",
  warehouse: "Gudang",
  banking: "Perbankan",
  documents: "Dokumen",
  basicInformation: "Informasi Dasar",
  contact: "Kontak",
  address: "Alamat",
  companyEmail: "Email Perusahaan",
  companyPhone: "Telepon Perusahaan",
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
  warehousePhoto: "Foto Gudang",
  bankName: "Nama Bank",
  accountOwner: "Nama Pemilik Rekening",
  accountNumber: "Nomor Rekening",
  deliveryFleet: "Jumlah Armada",
  paymentMethods: "Metode Pembayaran",
  recordingApp: "Aplikasi Pencatatan",
  distributionArea: "Area Distribusi",
  picName: "Nama PIC",
  picPosition: "Posisi PIC",
  picContact: "Kontak PIC",
  picEmail: "Email PIC",
  npwpDocument: "Dokumen NPWP",
  nibDocument: "Dokumen NIB",
  ktpDocument: "Dokumen KTP",
  download: "Unduh",
  uploading: "Mengunggah...",
  uploaded: "Sudah diunggah",
  notUploaded: "Belum diunggah",
  fileUploaded: "File berhasil diunggah",
  userUpdated: "Data pengguna berhasil diperbarui",
  role: "Peran",
  user: "Pengguna",
  admin: "Admin",
  distributor: "Distributor",
  sales: "Sales",
};

const en = {
  error: "Error",
  success: "Success",
  totalUsers: "Total Users",
  adminUsers: "Admins",
  distributorUsers: "Distributors",
  salesUsers: "Sales",
  adminRole: "admin role",
  distributorRole: "distributor role",
  salesRole: "sales role",
  resetPassword: "Reset Password",
  roleUpdated: "Role updated successfully",
  passwordResetSent: "Password reset link sent",
  passwordResetDesc: "Password reset link has been sent to user email",
  searchUsers: "Search users...",
  filter: "Filter",
  allStatus: "All Status",
  allRoles: "All Roles",
  resetFilters: "Reset Filters",
  businessName: "Business Name",
  ownerName: "Owner Name",
  email: "Email",
  location: "Location",
  status: "Status",
  registerDate: "Register Date",
  actions: "Actions",
  loading: "Loading...",
  noUsersFound: "No users found",
  view: "View",
  edit: "Edit",
  save: "Save",
  cancel: "Cancel",
  userDetails: "User Details",
  overview: "Overview",
  company: "Company",
  warehouse: "Warehouse",
  banking: "Banking",
  documents: "Documents",
  basicInformation: "Basic Information",
  contact: "Contact",
  address: "Address",
  companyEmail: "Company Email",
  companyPhone: "Company Phone",
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
  warehousePhoto: "Warehouse Photo",
  bankName: "Bank Name",
  accountOwner: "Account Owner",
  accountNumber: "Account Number",
  deliveryFleet: "Delivery Fleet",
  paymentMethods: "Payment Methods",
  recordingApp: "Recording Application",
  distributionArea: "Distribution Area",
  picName: "PIC Name",
  picPosition: "PIC Position",
  picContact: "PIC Contact",
  picEmail: "PIC Email",
  npwpDocument: "NPWP Document",
  nibDocument: "NIB Document",
  ktpDocument: "KTP Document",
  download: "Download",
  uploading: "Uploading...",
  uploaded: "Uploaded",
  notUploaded: "Not uploaded",
  fileUploaded: "File uploaded successfully",
  userUpdated: "User data updated successfully",
  role: "Role",
  user: "User",
  admin: "Admin",
  distributor: "Distributor",
  sales: "Sales",
};

export default function UserManagementRevamped() {
  const { toast } = useToast();
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const t = lang === "id" ? id : en;

  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter states
  const [statusFilter, setStatusFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    filterUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, statusFilter, roleFilter, users]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data: profiles, error } = await supabase
        .from("distributor_profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const usersWithProfiles = (profiles || []).map((profile: any) => ({
        id: profile.user_id,
        // Prefer distributor signup email: email_pemilik, then profile.email
        email: profile.email_pemilik || profile.email || `user_${profile.user_id}@example.com`,
        role: "user",
        profile: profile,
      }));

      setUsers(usersWithProfiles);
      setFilteredUsers(usersWithProfiles);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      toast({
        title: t.error,
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.email.toLowerCase().includes(query) ||
          u.profile?.nama_bisnis?.toLowerCase().includes(query) ||
          u.profile?.nama_pemilik?.toLowerCase().includes(query) ||
          u.profile?.kota?.toLowerCase().includes(query)
      );
    }

    if (statusFilter) {
      filtered = filtered.filter((u) => u.profile?.status === statusFilter);
    }

    if (roleFilter) {
      filtered = filtered.filter((u) => u.role === roleFilter);
    }

    setFilteredUsers(filtered);
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-500 text-white",
      waiting_activation: "bg-blue-500 text-white",
      active: "bg-green-500 text-white",
      inactive: "bg-gray-500 text-white",
      rejected: "bg-red-500 text-white",
    };

    return (
      <Badge className={colors[status] || "bg-gray-400"}>
        {t[status as keyof typeof t] || status}
      </Badge>
    );
  };

  const handleViewUser = (user: User) => {
    navigate(`/admin/distributors/view/${user.id}`);
  };

  const handleEditUser = (user: User) => {
    navigate(`/admin/distributors/edit/${user.id}`);
  };

  // Handle status change and API call for customer registration
  const handleRoleChange = async (user: User, newRole: string) => {
    try {
      console.log("Updating user role:", user.id, "to:", newRole);

      // Update user role in auth.users table
      const { error: userError } = await supabase.auth.admin.updateUserById(
        user.id,
        {
          user_metadata: { role: newRole },
        }
      );

      if (userError) {
        console.error("Error updating user role:", userError);
        throw userError;
      }

      toast({
        title: t.success,
        description: "User role updated successfully",
        variant: "default",
      });

      // Refresh users list
      fetchUsers();
    } catch (err) {
      console.error("Role update error:", err);
      toast({
        title: t.error,
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    }
  };

  // Statistics
  const totalUsers = users.length;
  const adminUsers = users.filter((u) => u.role === "admin").length;
  const distributorUsers = users.filter((u) => u.role === "distributor").length;
  const salesUsers = users.filter((u) => u.role === "sales").length;

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t.totalUsers}</p>
              <p className="text-2xl font-bold">{totalUsers}</p>
            </div>
            <User className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t.adminUsers}</p>
              <p className="text-2xl font-bold text-purple-600">{adminUsers}</p>
            </div>
            <Shield className="h-8 w-8 text-purple-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {t.distributorUsers}
              </p>
              <p className="text-2xl font-bold text-blue-600">
                {distributorUsers}
              </p>
            </div>
            <FileCheck className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t.salesUsers}</p>
              <p className="text-2xl font-bold text-green-600">{salesUsers}</p>
            </div>
            <FileCheck className="h-8 w-8 text-green-500" />
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t.searchUsers}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters ? "bg-orange-50 border-orange-300" : ""}
          >
            {t.filter}
            {(statusFilter || roleFilter) && (
              <span className="ml-2 bg-orange-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                {[statusFilter, roleFilter].filter(Boolean).length}
              </span>
            )}
          </Button>
        </div>

        {showFilters && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs">{t.status}</Label>
            </div>
            <div>
              <Label className="text-xs">{t.role}</Label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder={t.allRoles} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t.allRoles}</SelectItem>
                  <SelectItem value="user">{t.user}</SelectItem>
                  <SelectItem value="admin">{t.admin}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setStatusFilter("");
                  setRoleFilter("");
                }}
              >
                {t.resetFilters}
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Users Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t.businessName}</TableHead>
              <TableHead>{t.ownerName}</TableHead>
              <TableHead>{t.email}</TableHead>
              <TableHead>{t.location}</TableHead>
              <TableHead>{t.status}</TableHead>
              <TableHead>{t.registerDate}</TableHead>
              <TableHead>{t.actions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 h-64">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                  <p className="mt-2 text-muted-foreground">{t.loading}</p>
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <User className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-2 text-muted-foreground">{t.noUsersFound}</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.slice(0, 50).map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.profile?.nama_bisnis || "-"}
                  </TableCell>
                  <TableCell>{user.profile?.nama_pemilik || "-"}</TableCell>
                  <TableCell className="text-sm">{user.profile?.email_pemilik || user.profile?.email || user.email}</TableCell>
                  <TableCell>{user.profile?.kota || "-"}</TableCell>
                  <TableCell>
                    {user.profile?.status
                      ? getStatusBadge(user.profile.status)
                      : "-"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {user.profile?.created_at
                      ? new Date(user.profile.created_at).toLocaleDateString(
                          lang === "id" ? "id-ID" : "en-US"
                        )
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2 items-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewUser(user)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        {t.view}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditUser(user)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        {t.edit}
                      </Button>
                      <Select
                        value={user.role || ""}
                        onValueChange={(value) => handleRoleChange(user, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">{t.admin}</SelectItem>
                          <SelectItem value="distributor">
                            {t.distributor}
                          </SelectItem>
                          <SelectItem value="sales">{t.sales}</SelectItem>
                          <SelectItem value="user">{t.user}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
