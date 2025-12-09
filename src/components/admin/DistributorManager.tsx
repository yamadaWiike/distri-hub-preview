// React & Router
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// External Libraries
import { Eye, Edit, Trash2, Search, Loader2, Calendar, MoreVertical } from 'lucide-react';

// UI Components
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Hooks
import { useLanguage } from '@/hooks/use-language';

// Integrations
import { supabase } from '@/integrations/supabase/client';


// Define distributor profile type based on actual database schema
type DistributorProfile = {
  id: string;
  user_id: string;
  nama_bisnis: string;
  alamat_lengkap: string;
  kota: string;
  nama_pemilik: string;
  kontak_pemilik: string;
  email?: string | null;
  status: string;
  created_at?: string;
  updated_at?: string;
};

const DistributorManager = () => {
  const { toast } = useToast();
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const t = lang === 'id' ? translations.id : translations.en;
  
  const [distributors, setDistributors] = useState<DistributorProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch distributors from database
  const fetchDistributors = async () => {
    setIsLoading(true);
    try {
      // In the fetchDistributors function, revert to original:
      const { data, error } = await supabase
        .from('distributor_profiles')
        .select('*');
      if (error) {
        console.error('Error fetching distributors:', error);
        throw error;
      }
      setDistributors(data || []);
    } catch (error) {
      console.error('Error fetching distributors:', error);
      toast({
        title: t.errorFetching,
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDistributors();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Delete distributor
  const deleteDistributor = async (distributorId: string) => {
    if (!confirm(t.confirmDelete)) return;

    try {
      const { error } = await supabase
        .from('distributor_profiles')
        .delete()
        .eq('id', distributorId);

      if (error) throw error;

      toast({
        title: t.distributorDeleted,
        description: t.distributorDeletedDesc,
      });

      fetchDistributors();
    } catch (error) {
      console.error('Error deleting distributor:', error);
      toast({
        title: t.errorDeleting,
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive"
      });
    }
  };

  // Navigate to view distributor page
  const handleViewDistributor = (distributor: DistributorProfile) => {
    navigate(`/admin/distributors/view/${distributor.user_id}`);
  };

  // Navigate to edit distributor page
  const handleEditDistributor = (distributor: DistributorProfile) => {
    navigate(`/admin/distributors/edit/${distributor.user_id}`);
  };

  // Filter distributors based on search query
  const filteredDistributors = distributors.filter(distributor => {
    const searchLower = searchQuery.toLowerCase();
    return (
      distributor.nama_bisnis?.toLowerCase().includes(searchLower) ||
      distributor.nama_pemilik?.toLowerCase().includes(searchLower) ||
      distributor.email?.toLowerCase().includes(searchLower) ||
      distributor.kontak_pemilik?.toLowerCase().includes(searchLower) ||
      distributor.kota?.toLowerCase().includes(searchLower)
    );
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Handle status change using actual database status values
  const handleStatusChange = async (distributor: DistributorProfile, newStatus: string) => {
    try {
      // Update status in Supabase directly
      const { error } = await supabase
        .from('distributor_profiles')
        // @ts-expect-error - Type mismatch with Supabase generated types
        .update({ status: newStatus })
        .eq('user_id', distributor.user_id);
      
      if (error) throw error;
      
      toast({ title: t.statusUpdated, variant: 'default' });
      
      // TODO: External Customer API call bypassed for now to prevent blocking
      if (newStatus === 'active') {
        console.log('[BYPASSED] Customer API call for distributor:', distributor.nama_bisnis);
        toast({ title: t.success, description: 'Distributor activated successfully (API calls bypassed)', variant: 'default' });
        
        // Future implementation:
        // - Call external Customer API
        // - Register distributor in external systems
        // - Handle API responses and errors
      }
      
      // Refresh distributors list
      fetchDistributors();
    } catch (err) {
      console.error('Status update error:', err);
      toast({ title: t.error, description: err instanceof Error ? err.message : String(err), variant: 'destructive' });
    }
  };

  // Get status badge color and label using actual database values
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'pending': { color: 'bg-yellow-500 text-white', label: t.pending },
      'waiting_activation': { color: 'bg-blue-500 text-white', label: t.waitingActivation },
      'active': { color: 'bg-green-500 text-white', label: t.active },
      'inactive': { color: 'bg-gray-500 text-white', label: t.inactive },
      'rejected': { color: 'bg-red-500 text-white', label: t.rejected },
    };
    
    const config = statusConfig[status] || { color: 'bg-gray-400 text-white', label: status };
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.totalDistributors}</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{distributors.length}</div>
            <p className="text-xs text-muted-foreground">{t.registeredDistributors}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.activeDistributors}</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {distributors.filter(d => d.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">{t.approvedAndActive}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.pendingApproval}</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {distributors.filter(d => d.status === 'pending').length}
            </div>
            <p className="text-xs text-muted-foreground">{t.awaitingReview}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.waitingActivation}</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {distributors.filter(d => d.status === 'waiting_activation').length}
            </div>
            <p className="text-xs text-muted-foreground">{t.kybCompleted}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t.searchDistributors}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button 
          variant="outline" 
          onClick={() => setSearchQuery('')}
        >
          {t.clearFilters}
        </Button>
      </div>

      {/* Distributors Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t.distributorProfiles}</CardTitle>
          <CardDescription>{t.manageDistributorProfiles}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.businessName}</TableHead>
                  <TableHead>{t.contactPerson}</TableHead>
                  <TableHead>{t.email}</TableHead>
                  <TableHead>{t.phone}</TableHead>
                  <TableHead>{t.city}</TableHead>
                  <TableHead>{t.status}</TableHead>
                  <TableHead>{t.registrationDate}</TableHead>
                  <TableHead>{t.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDistributors.map((distributor) => (
                  <TableRow key={distributor.id}>
                    <TableCell className="font-medium">{distributor.nama_bisnis}</TableCell>
                    <TableCell>{distributor.nama_pemilik}</TableCell>
                    <TableCell>{distributor.email}</TableCell>
                    <TableCell>{distributor.kontak_pemilik}</TableCell>
                    <TableCell>{distributor.kota}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(distributor.status)}
                        <Select
                          value={distributor.status}
                          onValueChange={(newStatus) => handleStatusChange(distributor, newStatus)}
                        >
                          <SelectTrigger className="w-auto h-6 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">{t.pending}</SelectItem>
                            <SelectItem value="waiting_activation">{t.waitingActivation}</SelectItem>
                            <SelectItem value="active">{t.active}</SelectItem>
                            <SelectItem value="inactive">{t.inactive}</SelectItem>
                            <SelectItem value="rejected">{t.rejected}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(distributor.created_at || '')}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditDistributor(distributor)}>
                            <Edit className="h-4 w-4 mr-2" />
                            {t.edit}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleViewDistributor(distributor)}>
                            <Eye className="h-4 w-4 mr-2" />
                            {t.viewDetails}
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={() => deleteDistributor(distributor.id)}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            {t.delete}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DistributorManager;

// Translations
const translations = {
  id: {
    totalDistributors: "Total Distributor",
    registeredDistributors: "distributor terdaftar",
    thisMonth: "Bulan Ini",
    newRegistrations: "registrasi baru",
    recentActivity: "Aktivitas Terbaru",
    lastWeek: "minggu terakhir",
    searchDistributors: "Cari distributor...",
    clearFilters: "Hapus Filter",
    distributorProfiles: "Profil Distributor",
    manageDistributorProfiles: "Kelola profil dan informasi distributor",
    businessName: "Nama Bisnis",
    contactPerson: "Kontak Person",
    email: "Email",
    phone: "Telepon",
    city: "Kota",
    registrationDate: "Tanggal Daftar",
    actions: "Aksi",
    edit: "Edit",
    viewDetails: "Lihat Detail",
    delete: "Hapus",
    distributorDetails: "Detail Distributor",
    registeredOn: "Terdaftar pada",
    address: "Alamat",
    businessType: "Jenis Bisnis",
    distributorLicense: "Lisensi Distributor",
    taxId: "NPWP",
    bankInfo: "Info Bank",
    editDistributor: "Edit Distributor",
    province: "Provinsi",
    status: "Status",
    cancel: "Batal",
    saveChanges: "Simpan Perubahan",
    statusUpdated: "Status berhasil diperbarui",
    success: "Berhasil",
    error: "Error",
    pending: "Menunggu Persetujuan",
    waitingActivation: "Menunggu Aktivasi",
    active: "Aktif",
    inactive: "Tidak Aktif",
    rejected: "Ditolak",
    changeStatus: "Ubah Status",
    kybCompleted: "KYB selesai",
    confirmDelete: "Apakah Anda yakin ingin menghapus distributor ini?",
    distributorUpdated: "Distributor Diperbarui",
    distributorUpdatedDesc: "Informasi distributor berhasil diperbarui",
    distributorDeleted: "Distributor Dihapus",
    distributorDeletedDesc: "Distributor berhasil dihapus dari sistem",
    errorFetching: "Gagal Memuat Data",
    errorUpdating: "Gagal Memperbarui",
    errorDeleting: "Gagal Menghapus",
    activeDistributors: "Distributor Aktif",
    approvedAndActive: "disetujui & aktif",
    pendingApproval: "Menunggu Persetujuan",
    awaitingReview: "menunggu tinjauan"
  },
  en: {
    totalDistributors: "Total Distributors",
    registeredDistributors: "registered distributors",
    thisMonth: "This Month",
    newRegistrations: "new registrations",
    recentActivity: "Recent Activity",
    lastWeek: "last week",
    searchDistributors: "Search distributors...",
    clearFilters: "Clear Filters",
    distributorProfiles: "Distributor Profiles",
    manageDistributorProfiles: "Manage distributor profiles and information",
    businessName: "Business Name",
    contactPerson: "Contact Person",
    email: "Email",
    phone: "Phone",
    city: "City",
    registrationDate: "Registration Date",
    actions: "Actions",
    edit: "Edit",
    viewDetails: "View Details",
    delete: "Delete",
    distributorDetails: "Distributor Details",
    registeredOn: "Registered on",
    address: "Address",
    businessType: "Business Type",
    distributorLicense: "Distributor License",
    taxId: "Tax ID",
    bankInfo: "Bank Info",
    editDistributor: "Edit Distributor",
    province: "Province",
    status: "Status",
    cancel: "Cancel",
    saveChanges: "Save Changes",
    statusUpdated: "Status updated successfully",
    success: "Success",
    error: "Error",
    pending: "Pending Approval",
    waitingActivation: "Waiting Activation",
    active: "Active",
    inactive: "Inactive",
    rejected: "Rejected",
    changeStatus: "Change Status",
    kybCompleted: "KYB completed",
    confirmDelete: "Are you sure you want to delete this distributor?",
    distributorUpdated: "Distributor Updated",
    distributorUpdatedDesc: "Distributor information updated successfully",
    distributorDeleted: "Distributor Deleted",
    distributorDeletedDesc: "Distributor successfully removed from system",
    errorFetching: "Failed to Fetch Data",
    errorUpdating: "Failed to Update",
    errorDeleting: "Failed to Delete",
    activeDistributors: "Active Distributors",
    approvedAndActive: "approved & active",
    pendingApproval: "Pending Approval",
    awaitingReview: "awaiting review"
  }
};