import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import {
  Search,
  Plus,
  Eye,
  Edit,
  RotateCcw,
  Shield,
  ShieldOff,
  Upload,
  FileText,
  Building2,
  User,
  MapPin,
  Phone,
  Mail,
  Briefcase,
  CreditCard,
  Warehouse,
  FileCheck,
  X,
  Download,
} from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';

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
  const t = lang === 'id' ? id : en;

  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTab, setCurrentTab] = useState('overview');
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState<Partial<UserProfile>>({});
  
  // File upload states
  const [uploadingFile, setUploadingFile] = useState<string | null>(null);
  const [fileUploads, setFileUploads] = useState<{
    npwp_file?: File;
    nib_file?: File;
    ktp_file?: File;
    foto_gudang?: File;
  }>({});

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
    setSelectedUser(user);
    setEditForm(user.profile || {});
    setIsEditing(false);
    setCurrentTab('overview');
    setIsDetailDialogOpen(true);
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    if (!isEditing) {
      setEditForm(selectedUser?.profile || {});
    }
  };

  const handleSaveChanges = async () => {
    if (!selectedUser?.profile) return;

    try {
      const { error } = await (supabase as any)
        .from('distributor_profiles')
        .update(editForm)
        .eq('user_id', selectedUser.profile.user_id);

      if (error) throw error;

      toast({
        title: t.success,
        description: t.userUpdated,
      });

      // Update local state
      const updatedUsers = users.map((u) =>
        u.id === selectedUser.id && u.profile
          ? { ...u, profile: { ...u.profile, ...editForm } }
          : u
      );
      setUsers(updatedUsers);
      setSelectedUser({
        ...selectedUser,
        profile: { ...selectedUser.profile, ...editForm },
      });
      setIsEditing(false);
    } catch (error: any) {
      toast({
        title: t.error,
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleFileUpload = async (fileType: string, file: File) => {
    if (!selectedUser?.profile) return;

    setUploadingFile(fileType);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${selectedUser.profile.user_id}/${fileType}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName);

      const fileUrl = urlData.publicUrl;
      const fieldName = `${fileType}_url` as keyof UserProfile;

      const { error: updateError } = await (supabase as any)
        .from('distributor_profiles')
        .update({ [fieldName]: fileUrl })
        .eq('user_id', selectedUser.profile.user_id);

      if (updateError) throw updateError;

      setEditForm({ ...editForm, [fieldName]: fileUrl });
      
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
    } finally {
      setUploadingFile(null);
    }
  };

  const handleStatusChange = async (userId: string, newStatus: string) => {
    try {
      const { error } = await (supabase as any)
        .from('distributor_profiles')
        .update({ status: newStatus })
        .eq('user_id', userId);

      if (error) throw error;

      const updatedUsers = users.map((u) =>
        u.id === userId && u.profile
          ? { ...u, profile: { ...u.profile, status: newStatus } }
          : u
      );
      setUsers(updatedUsers);

      toast({
        title: t.success,
        description: t.statusUpdated,
      });
    } catch (error: any) {
      toast({
        title: t.error,
        description: error.message,
        variant: 'destructive',
      });
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewUser(user)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      {t.view}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Detail Dialog with Tabs */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>{selectedUser?.profile?.nama_bisnis}</DialogTitle>
                <DialogDescription>
                  {t.userDetails} - {selectedUser?.email}
                </DialogDescription>
              </div>
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(false)}
                    >
                      {t.cancel}
                    </Button>
                    <Button size="sm" onClick={handleSaveChanges}>
                      {t.save}
                    </Button>
                  </>
                ) : (
                  <Button size="sm" onClick={handleEditToggle}>
                    <Edit className="h-4 w-4 mr-1" />
                    {t.edit}
                  </Button>
                )}
              </div>
            </div>
          </DialogHeader>

          <Tabs value={currentTab} onValueChange={setCurrentTab} className="mt-4">
            <TabsList className="grid w-full grid-cols-6">
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
            <TabsContent value="overview" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t.businessName}</Label>
                  {isEditing ? (
                    <Input
                      value={editForm.nama_bisnis || ''}
                      onChange={(e) =>
                        setEditForm({ ...editForm, nama_bisnis: e.target.value })
                      }
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedUser?.profile?.nama_bisnis || '-'}
                    </p>
                  )}
                </div>
                <div>
                  <Label>{t.ownerName}</Label>
                  {isEditing ? (
                    <Input
                      value={editForm.nama_pemilik || ''}
                      onChange={(e) =>
                        setEditForm({ ...editForm, nama_pemilik: e.target.value })
                      }
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedUser?.profile?.nama_pemilik || '-'}
                    </p>
                  )}
                </div>
                <div>
                  <Label>{t.email}</Label>
                  {isEditing ? (
                    <Input
                      value={editForm.email_pemilik || ''}
                      onChange={(e) =>
                        setEditForm({ ...editForm, email_pemilik: e.target.value })
                      }
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedUser?.profile?.email_pemilik || '-'}
                    </p>
                  )}
                </div>
                <div>
                  <Label>{t.contact}</Label>
                  {isEditing ? (
                    <Input
                      value={editForm.kontak_pemilik || ''}
                      onChange={(e) =>
                        setEditForm({ ...editForm, kontak_pemilik: e.target.value })
                      }
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedUser?.profile?.kontak_pemilik || '-'}
                    </p>
                  )}
                </div>
                <div className="col-span-2">
                  <Label>{t.address}</Label>
                  {isEditing ? (
                    <Textarea
                      value={editForm.alamat_lengkap || ''}
                      onChange={(e) =>
                        setEditForm({ ...editForm, alamat_lengkap: e.target.value })
                      }
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedUser?.profile?.alamat_lengkap || '-'}
                    </p>
                  )}
                </div>
                <div>
                  <Label>{t.location}</Label>
                  {isEditing ? (
                    <Input
                      value={editForm.kota || ''}
                      onChange={(e) =>
                        setEditForm({ ...editForm, kota: e.target.value })
                      }
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedUser?.profile?.kota || '-'}
                    </p>
                  )}
                </div>
                <div>
                  <Label>{t.status}</Label>
                  {isEditing ? (
                    <Select
                      value={editForm.status || ''}
                      onValueChange={(value) =>
                        setEditForm({ ...editForm, status: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">{t.active}</SelectItem>
                        <SelectItem value="pending">{t.pending}</SelectItem>
                        <SelectItem value="approved">{t.approved}</SelectItem>
                        <SelectItem value="rejected">{t.rejected}</SelectItem>
                        <SelectItem value="suspended">{t.suspended}</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="mt-1">
                      {selectedUser?.profile?.status
                        ? getStatusBadge(selectedUser.profile.status)
                        : '-'}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Company Tab */}
            <TabsContent value="company" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t.companyEmail}</Label>
                  {isEditing ? (
                    <Input
                      value={editForm.email_perusahaan || ''}
                      onChange={(e) =>
                        setEditForm({ ...editForm, email_perusahaan: e.target.value })
                      }
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedUser?.profile?.email_perusahaan || '-'}
                    </p>
                  )}
                </div>
                <div>
                  <Label>{t.companyPhone}</Label>
                  {isEditing ? (
                    <Input
                      value={editForm.nomor_telp_perusahaan || ''}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          nomor_telp_perusahaan: e.target.value,
                        })
                      }
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedUser?.profile?.nomor_telp_perusahaan || '-'}
                    </p>
                  )}
                </div>
                <div>
                  <Label>{t.directorName}</Label>
                  {isEditing ? (
                    <Input
                      value={editForm.nama_direktur || ''}
                      onChange={(e) =>
                        setEditForm({ ...editForm, nama_direktur: e.target.value })
                      }
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedUser?.profile?.nama_direktur || '-'}
                    </p>
                  )}
                </div>
                <div>
                  <Label>{t.businessType}</Label>
                  {isEditing ? (
                    <Select
                      value={editForm.bentuk_usaha || ''}
                      onValueChange={(value) =>
                        setEditForm({ ...editForm, bentuk_usaha: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t.selectBusinessType} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PT">PT</SelectItem>
                        <SelectItem value="CV">CV</SelectItem>
                        <SelectItem value="UD">UD</SelectItem>
                        <SelectItem value="Perorangan">Perorangan</SelectItem>
                        <SelectItem value="Koperasi">Koperasi</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedUser?.profile?.bentuk_usaha || '-'}
                    </p>
                  )}
                </div>
                <div>
                  <Label>{t.pkpStatus}</Label>
                  {isEditing ? (
                    <Select
                      value={editForm.status_pkp || ''}
                      onValueChange={(value) =>
                        setEditForm({ ...editForm, status_pkp: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PKP">PKP</SelectItem>
                        <SelectItem value="Non-PKP">Non-PKP</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedUser?.profile?.status_pkp || '-'}
                    </p>
                  )}
                </div>
                <div>
                  <Label>{t.npwpNumber}</Label>
                  {isEditing ? (
                    <Input
                      value={editForm.npwp_number || ''}
                      onChange={(e) =>
                        setEditForm({ ...editForm, npwp_number: e.target.value })
                      }
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedUser?.profile?.npwp_number || '-'}
                    </p>
                  )}
                </div>
                <div>
                  <Label>{t.nibNumber}</Label>
                  {isEditing ? (
                    <Input
                      value={editForm.nib_number || ''}
                      onChange={(e) =>
                        setEditForm({ ...editForm, nib_number: e.target.value })
                      }
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedUser?.profile?.nib_number || '-'}
                    </p>
                  )}
                </div>
                <div>
                  <Label>{t.website}</Label>
                  {isEditing ? (
                    <Input
                      value={editForm.website_perusahaan || ''}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          website_perusahaan: e.target.value,
                        })
                      }
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedUser?.profile?.website_perusahaan || '-'}
                    </p>
                  )}
                </div>
                <div>
                  <Label>{t.revenue}</Label>
                  {isEditing ? (
                    <Input
                      value={editForm.omzet || ''}
                      onChange={(e) =>
                        setEditForm({ ...editForm, omzet: e.target.value })
                      }
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedUser?.profile?.omzet || '-'}
                    </p>
                  )}
                </div>
                <div>
                  <Label>{t.employees}</Label>
                  {isEditing ? (
                    <Input
                      value={editForm.jumlah_karyawan || ''}
                      onChange={(e) =>
                        setEditForm({ ...editForm, jumlah_karyawan: e.target.value })
                      }
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedUser?.profile?.jumlah_karyawan || '-'}
                    </p>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Warehouse Tab */}
            <TabsContent value="warehouse" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>{t.officeAddress}</Label>
                  {isEditing ? (
                    <Textarea
                      value={editForm.alamat_kantor || ''}
                      onChange={(e) =>
                        setEditForm({ ...editForm, alamat_kantor: e.target.value })
                      }
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedUser?.profile?.alamat_kantor || '-'}
                    </p>
                  )}
                </div>
                <div className="col-span-2">
                  <Label>{t.warehouseAddress}</Label>
                  {isEditing ? (
                    <Textarea
                      value={editForm.alamat_gudang || ''}
                      onChange={(e) =>
                        setEditForm({ ...editForm, alamat_gudang: e.target.value })
                      }
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedUser?.profile?.alamat_gudang || '-'}
                    </p>
                  )}
                </div>
                <div>
                  <Label>{t.coordinates}</Label>
                  {isEditing ? (
                    <Input
                      value={editForm.koordinat || ''}
                      onChange={(e) =>
                        setEditForm({ ...editForm, koordinat: e.target.value })
                      }
                      placeholder="lat, lng"
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedUser?.profile?.koordinat || '-'}
                    </p>
                  )}
                </div>
                <div>
                  <Label>{t.warehousePhoto}</Label>
                  {selectedUser?.profile?.foto_gudang ? (
                    <div className="mt-1">
                      <img
                        src={selectedUser.profile.foto_gudang}
                        alt="Warehouse"
                        className="h-20 w-20 object-cover rounded border"
                      />
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">-</p>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Banking Tab */}
            <TabsContent value="banking" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t.bankName}</Label>
                  {isEditing ? (
                    <Input
                      value={editForm.nama_bank || ''}
                      onChange={(e) =>
                        setEditForm({ ...editForm, nama_bank: e.target.value })
                      }
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedUser?.profile?.nama_bank || '-'}
                    </p>
                  )}
                </div>
                <div>
                  <Label>{t.accountOwner}</Label>
                  {isEditing ? (
                    <Input
                      value={editForm.nama_pemilik_akun || ''}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          nama_pemilik_akun: e.target.value,
                        })
                      }
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedUser?.profile?.nama_pemilik_akun || '-'}
                    </p>
                  )}
                </div>
                <div>
                  <Label>{t.accountNumber}</Label>
                  {isEditing ? (
                    <Input
                      value={editForm.nomor_rekening || ''}
                      onChange={(e) =>
                        setEditForm({ ...editForm, nomor_rekening: e.target.value })
                      }
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedUser?.profile?.nomor_rekening || '-'}
                    </p>
                  )}
                </div>
                <div>
                  <Label>{t.deliveryFleet}</Label>
                  {isEditing ? (
                    <Input
                      value={editForm.jumlah_armada_pengiriman || ''}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          jumlah_armada_pengiriman: e.target.value,
                        })
                      }
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedUser?.profile?.jumlah_armada_pengiriman || '-'}
                    </p>
                  )}
                </div>
                <div className="col-span-2">
                  <Label>{t.paymentMethods}</Label>
                  {isEditing ? (
                    <Input
                      value={editForm.metode_pembayaran || ''}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          metode_pembayaran: e.target.value,
                        })
                      }
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedUser?.profile?.metode_pembayaran || '-'}
                    </p>
                  )}
                </div>
                <div>
                  <Label>{t.recordingApp}</Label>
                  {isEditing ? (
                    <Input
                      value={editForm.aplikasi_pencatatan || ''}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          aplikasi_pencatatan: e.target.value,
                        })
                      }
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedUser?.profile?.aplikasi_pencatatan || '-'}
                    </p>
                  )}
                </div>
                <div>
                  <Label>{t.distributionArea}</Label>
                  {isEditing ? (
                    <Input
                      value={editForm.area_distribusi || ''}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          area_distribusi: e.target.value,
                        })
                      }
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedUser?.profile?.area_distribusi || '-'}
                    </p>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* PIC Tab */}
            <TabsContent value="pic" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t.picName}</Label>
                  {isEditing ? (
                    <Input
                      value={editForm.nama_pic || ''}
                      onChange={(e) =>
                        setEditForm({ ...editForm, nama_pic: e.target.value })
                      }
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedUser?.profile?.nama_pic || '-'}
                    </p>
                  )}
                </div>
                <div>
                  <Label>{t.picPosition}</Label>
                  {isEditing ? (
                    <Input
                      value={editForm.posisi_pic || ''}
                      onChange={(e) =>
                        setEditForm({ ...editForm, posisi_pic: e.target.value })
                      }
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedUser?.profile?.posisi_pic || '-'}
                    </p>
                  )}
                </div>
                <div>
                  <Label>{t.picContact}</Label>
                  {isEditing ? (
                    <Input
                      value={editForm.nomor_kontak_pic || ''}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          nomor_kontak_pic: e.target.value,
                        })
                      }
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedUser?.profile?.nomor_kontak_pic || '-'}
                    </p>
                  )}
                </div>
                <div>
                  <Label>{t.picEmail}</Label>
                  {isEditing ? (
                    <Input
                      value={editForm.email_pic || ''}
                      onChange={(e) =>
                        setEditForm({ ...editForm, email_pic: e.target.value })
                      }
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedUser?.profile?.email_pic || '-'}
                    </p>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 gap-6">
                {/* NPWP Document */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-base font-semibold">{t.npwpDocument}</Label>
                    {selectedUser?.profile?.npwp_file_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          window.open(selectedUser.profile?.npwp_file_url, '_blank')
                        }
                      >
                        <Download className="h-4 w-4 mr-1" />
                        {t.download}
                      </Button>
                    )}
                  </div>
                  {isEditing ? (
                    <div className="space-y-2">
                      <Input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload('npwp_file', file);
                        }}
                        disabled={uploadingFile === 'npwp_file'}
                      />
                      {uploadingFile === 'npwp_file' && (
                        <p className="text-sm text-muted-foreground">{t.uploading}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {selectedUser?.profile?.npwp_file_url ? t.uploaded : t.notUploaded}
                    </p>
                  )}
                </div>

                {/* NIB Document */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-base font-semibold">{t.nibDocument}</Label>
                    {selectedUser?.profile?.nib_file_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          window.open(selectedUser.profile?.nib_file_url, '_blank')
                        }
                      >
                        <Download className="h-4 w-4 mr-1" />
                        {t.download}
                      </Button>
                    )}
                  </div>
                  {isEditing ? (
                    <div className="space-y-2">
                      <Input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload('nib_file', file);
                        }}
                        disabled={uploadingFile === 'nib_file'}
                      />
                      {uploadingFile === 'nib_file' && (
                        <p className="text-sm text-muted-foreground">{t.uploading}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {selectedUser?.profile?.nib_file_url ? t.uploaded : t.notUploaded}
                    </p>
                  )}
                </div>

                {/* KTP Document */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-base font-semibold">{t.ktpDocument}</Label>
                    {selectedUser?.profile?.ktp_file_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          window.open(selectedUser.profile?.ktp_file_url, '_blank')
                        }
                      >
                        <Download className="h-4 w-4 mr-1" />
                        {t.download}
                      </Button>
                    )}
                  </div>
                  {isEditing ? (
                    <div className="space-y-2">
                      <Input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload('ktp_file', file);
                        }}
                        disabled={uploadingFile === 'ktp_file'}
                      />
                      {uploadingFile === 'ktp_file' && (
                        <p className="text-sm text-muted-foreground">{t.uploading}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {selectedUser?.profile?.ktp_file_url ? t.uploaded : t.notUploaded}
                    </p>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
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
