import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import {
  Search,
  Eye,
  Edit,
  Shield,
  User,
  FileCheck,
} from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import { createCustomer } from '@/lib/baskitApiCustomer';

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

export default function UserManagementRevamped() {
  const { toast } = useToast();
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const t = lang === 'id' ? id : en;

  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
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
        .from('distributor_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const usersWithProfiles = (profiles || []).map((profile: any) => ({
        id: profile.user_id,
        email: profile.email_pemilik || `user_${profile.user_id}@example.com`,
        role: 'user',
        profile: profile,
      }));

      setUsers(usersWithProfiles);
      setFilteredUsers(usersWithProfiles);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast({
        title: t.error,
        description: error.message,
        variant: 'destructive',
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
      active: 'bg-green-500',
      approved: 'bg-green-600',
      pending: 'bg-yellow-500',
      rejected: 'bg-red-500',
      suspended: 'bg-gray-500',
      inactive: 'bg-gray-400',
      draft: 'bg-blue-400',
    };

    return (
      <Badge className={colors[status] || 'bg-gray-500'}>
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

  // Add this function to handle status change and API call
  const handleStatusChange = async (user: User, newStatus: string) => {
    // Update status in Supabase
    try {
      const { error } = await supabase
        .from('distributor_profiles')
        // @ts-expect-error - Type mismatch with Supabase generated types
        .update({ status: newStatus })
        .eq('user_id', user.id);
      if (error) throw error;
      toast({ title: t.statusUpdated, variant: 'default' });
      // If status is 'active' or 'approved', call createCustomer API
      if (['active', 'approved'].includes(newStatus)) {
        const profile = user.profile;
        if (profile) {
          // Build payload for createCustomer
          const payload = {
            companyName: profile.nama_bisnis,
            phone: profile.kontak_pemilik,
            email: profile.email_pemilik,
            companyTypeId: '1', // Default company type
            assignedUsersId: [], // Empty array for now
            parentCompanyId: '', // Empty for independent distributors
            childType: 'distributor',
            districtId: 0,
            detailAddress: profile.alamat_lengkap,
            companyWebsite: profile.website_perusahaan || '',
            notes: `Auto-created from user approval`,
            postalCode: '',
            billingAddress: {
              address: profile.alamat_lengkap,
              district: profile.kota,
              city: profile.kota,
              province: '',
              zipcode: ''
            },
            shippingAddress: {
              address: profile.alamat_lengkap,
              district: profile.kota,
              city: profile.kota,
              province: '',
              zipcode: ''
            },
            primaryContact: {
              name: profile.nama_pemilik,
              email: profile.email_pemilik,
              phone: profile.kontak_pemilik,
              jobTitle: 'Owner',
              leadSource: 'distributor-hub'
            },
          };
          try {
            const response = await createCustomer(payload);
            console.log('createCustomer API response:', response);
            const statusCode = (response && typeof response === 'object' && 'statusCode' in response)
              ? (response as { statusCode?: number }).statusCode
              : undefined;
            if (statusCode === 200) {
              toast({ title: t.success, description: 'Customer created in Baskit API', variant: 'default' });
            } else {
              toast({ title: t.error, description: 'Failed to create customer in Baskit API', variant: 'destructive' });
            }
          } catch (apiError) {
            console.error('createCustomer API error:', apiError);
            toast({ title: t.error, description: apiError instanceof Error ? apiError.message : String(apiError), variant: 'destructive' });
          }
        }
      }
      // Refresh users list
      fetchUsers();
    } catch (err) {
      console.error('Status update error:', err);
      toast({ title: t.error, description: err instanceof Error ? err.message : String(err), variant: 'destructive' });
    }
  };

  // Statistics
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.profile?.status === 'active').length;
  const pendingUsers = users.filter((u) => u.profile?.status === 'pending').length;
  const approvedUsers = users.filter((u) => u.profile?.status === 'approved').length;

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
              <p className="text-sm text-muted-foreground">{t.activeUsers}</p>
              <p className="text-2xl font-bold text-green-600">{activeUsers}</p>
            </div>
            <Shield className="h-8 w-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t.pendingUsers}</p>
              <p className="text-2xl font-bold text-yellow-600">{pendingUsers}</p>
            </div>
            <FileCheck className="h-8 w-8 text-yellow-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t.approvedUsers}</p>
              <p className="text-2xl font-bold text-blue-600">{approvedUsers}</p>
            </div>
            <FileCheck className="h-8 w-8 text-blue-500" />
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
            className={showFilters ? 'bg-orange-50 border-orange-300' : ''}
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
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder={t.allStatus} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{ t.allStatus}</SelectItem>
                  <SelectItem value="active">{t.active}</SelectItem>
                  <SelectItem value="pending">{t.pending}</SelectItem>
                  <SelectItem value="approved">{t.approved}</SelectItem>
                  <SelectItem value="rejected">{t.rejected}</SelectItem>
                  <SelectItem value="suspended">{t.suspended}</SelectItem>
                </SelectContent>
              </Select>
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
                  setStatusFilter('');
                  setRoleFilter('');
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
                <TableCell colSpan={7} className="text-center py-12">
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
                    {user.profile?.nama_bisnis || '-'}
                  </TableCell>
                  <TableCell>{user.profile?.nama_pemilik || '-'}</TableCell>
                  <TableCell className="text-sm">{user.email}</TableCell>
                  <TableCell>{user.profile?.kota || '-'}</TableCell>
                  <TableCell>
                    {user.profile?.status
                      ? getStatusBadge(user.profile.status)
                      : '-'}
                  </TableCell>
                  <TableCell className="text-sm">
                    {user.profile?.created_at
                      ? new Date(user.profile.created_at).toLocaleDateString(
                          lang === 'id' ? 'id-ID' : 'en-US'
                        )
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
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

// Translations
const id = {
  error: 'Error',
  success: 'Berhasil',
  totalUsers: 'Total Pengguna',
  activeUsers: 'Pengguna Aktif',
  pendingUsers: 'Menunggu Persetujuan',
  approvedUsers: 'Disetujui',
  searchUsers: 'Cari pengguna...',
  filter: 'Filter',
  allStatus: 'Semua Status',
  allRoles: 'Semua Peran',
  resetFilters: 'Reset Filter',
  businessName: 'Nama Bisnis',
  ownerName: 'Nama Pemilik',
  email: 'Email',
  location: 'Lokasi',
  status: 'Status',
  registerDate: 'Tanggal Daftar',
  actions: 'Aksi',
  loading: 'Memuat...',
  noUsersFound: 'Tidak ada pengguna ditemukan',
  view: 'Lihat',
  edit: 'Edit',
  save: 'Simpan',
  cancel: 'Batal',
  userDetails: 'Detail Pengguna',
  overview: 'Ringkasan',
  company: 'Perusahaan',
  warehouse: 'Gudang',
  banking: 'Perbankan',
  documents: 'Dokumen',
  basicInformation: 'Informasi Dasar',
  contact: 'Kontak',
  address: 'Alamat',
  companyEmail: 'Email Perusahaan',
  companyPhone: 'Telepon Perusahaan',
  directorName: 'Nama Direktur',
  businessType: 'Bentuk Usaha',
  pkpStatus: 'Status PKP',
  npwpNumber: 'Nomor NPWP',
  nibNumber: 'Nomor NIB',
  website: 'Website',
  revenue: 'Omzet',
  employees: 'Jumlah Karyawan',
  officeAddress: 'Alamat Kantor',
  warehouseAddress: 'Alamat Gudang',
  coordinates: 'Koordinat',
  warehousePhoto: 'Foto Gudang',
  bankName: 'Nama Bank',
  accountOwner: 'Nama Pemilik Rekening',
  accountNumber: 'Nomor Rekening',
  deliveryFleet: 'Jumlah Armada',
  paymentMethods: 'Metode Pembayaran',
  recordingApp: 'Aplikasi Pencatatan',
  distributionArea: 'Area Distribusi',
  picName: 'Nama PIC',
  picPosition: 'Posisi PIC',
  picContact: 'Kontak PIC',
  picEmail: 'Email PIC',
  npwpDocument: 'Dokumen NPWP',
  nibDocument: 'Dokumen NIB',
  ktpDocument: 'Dokumen KTP',
  download: 'Unduh',
  uploading: 'Mengunggah...',
  uploaded: 'Sudah diunggah',
  notUploaded: 'Belum diunggah',
  fileUploaded: 'File berhasil diunggah',
  userUpdated: 'Data pengguna berhasil diperbarui',
  statusUpdated: 'Status berhasil diperbarui',
  selectBusinessType: 'Pilih bentuk usaha',
  active: 'Aktif',
  pending: 'Menunggu',
  approved: 'Disetujui',
  rejected: 'Ditolak',
  suspended: 'Ditangguhkan',
  inactive: 'Tidak Aktif',
  draft: 'Draft',
  role: 'Peran',
  user: 'Pengguna',
  admin: 'Admin',
};

const en = {
  error: 'Error',
  success: 'Success',
  totalUsers: 'Total Users',
  activeUsers: 'Active Users',
  pendingUsers: 'Pending Approval',
  approvedUsers: 'Approved',
  searchUsers: 'Search users...',
  filter: 'Filter',
  allStatus: 'All Status',
  allRoles: 'All Roles',
  resetFilters: 'Reset Filters',
  businessName: 'Business Name',
  ownerName: 'Owner Name',
  email: 'Email',
  location: 'Location',
  status: 'Status',
  registerDate: 'Register Date',
  actions: 'Actions',
  loading: 'Loading...',
  noUsersFound: 'No users found',
  view: 'View',
  edit: 'Edit',
  save: 'Save',
  cancel: 'Cancel',
  userDetails: 'User Details',
  overview: 'Overview',
  company: 'Company',
  warehouse: 'Warehouse',
  banking: 'Banking',
  documents: 'Documents',
  basicInformation: 'Basic Information',
  contact: 'Contact',
  address: 'Address',
  companyEmail: 'Company Email',
  companyPhone: 'Company Phone',
  directorName: 'Director Name',
  businessType: 'Business Type',
  pkpStatus: 'PKP Status',
  npwpNumber: 'NPWP Number',
  nibNumber: 'NIB Number',
  website: 'Website',
  revenue: 'Revenue',
  employees: 'Employees',
  officeAddress: 'Office Address',
  warehouseAddress: 'Warehouse Address',
  coordinates: 'Coordinates',
  warehousePhoto: 'Warehouse Photo',
  bankName: 'Bank Name',
  accountOwner: 'Account Owner',
  accountNumber: 'Account Number',
  deliveryFleet: 'Delivery Fleet',
  paymentMethods: 'Payment Methods',
  recordingApp: 'Recording Application',
  distributionArea: 'Distribution Area',
  picName: 'PIC Name',
  picPosition: 'PIC Position',
  picContact: 'PIC Contact',
  picEmail: 'PIC Email',
  npwpDocument: 'NPWP Document',
  nibDocument: 'NIB Document',
  ktpDocument: 'KTP Document',
  download: 'Download',
  uploading: 'Uploading...',
  uploaded: 'Uploaded',
  notUploaded: 'Not uploaded',
  fileUploaded: 'File uploaded successfully',
  userUpdated: 'User data updated successfully',
  statusUpdated: 'Status updated successfully',
  selectBusinessType: 'Select business type',
  active: 'Active',
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  suspended: 'Suspended',
  inactive: 'Inactive',
  draft: 'Draft',
  role: 'Role',
  user: 'User',
  admin: 'Admin',
};
