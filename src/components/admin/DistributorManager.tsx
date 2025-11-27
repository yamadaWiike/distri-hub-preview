import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Eye, Edit, Trash2, Search, Loader2, Calendar } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createCustomer } from '@/lib/baskitApiCustomer';

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

  // Add this function to handle status change and API call
  const handleStatusChange = async (distributor: DistributorProfile, newStatus: string) => {
    try {
      // Normalize status value
      const statusMap = {
        'aktif': 'active',
        'active': 'active',
        'approved': 'active',
        'disetujui': 'active',
        'menunggu': 'pending',
        'waiting': 'pending',
      };
      const normalizedStatus = statusMap[newStatus] || newStatus;
      // Get previous status before update
      const previousStatus = distributor.status;
      const { error } = await supabase
        .from('distributor_profiles')
        // @ts-expect-error - Type mismatch with Supabase generated types
        .update({ status: normalizedStatus })
        .eq('id', distributor.id);
      if (error) throw error;
      toast({ title: 'Status updated', variant: 'default' });
      // Always call API and log when status is set to 'active'
      if (normalizedStatus === 'active') {
        console.log('[DistributorManager] Registering distributor in Baskit API:', {
          distributorId: distributor.id,
          previousStatus,
          newStatus: normalizedStatus,
          payload: {
            companyName: distributor.nama_bisnis,
            phone: distributor.kontak_pemilik,
            email: distributor.email || '',
            companyWebsite: '',
            notes: '',
            detailAddress: distributor.alamat_lengkap,
            postalCode: '',
            districtName: distributor.kota,
            primaryContact: {
              name: distributor.nama_pemilik,
              email: distributor.email || '',
              phone: distributor.kontak_pemilik,
              jobTitle: 'Owner',
            },
          }
        });
        const payload = {
          companyName: distributor.nama_bisnis,
          phone: distributor.kontak_pemilik,
          email: distributor.email || '',
          companyWebsite: '',
          notes: '',
          detailAddress: distributor.alamat_lengkap,
          postalCode: '',
          districtName: distributor.kota,
          primaryContact: {
            name: distributor.nama_pemilik,
            email: distributor.email || '',
            phone: distributor.kontak_pemilik,
            jobTitle: 'Owner',
          },
        };
        try {
          const response = await createCustomer(payload);
          console.log('createCustomer API response:', response);
          // If response is an object, check statusCode property
          const statusCode = (response && typeof response === 'object' && 'statusCode' in response)
            ? (response as { statusCode?: number }).statusCode
            : undefined;
          if (statusCode === 200) {
            toast({ title: 'Customer created in Baskit API', variant: 'default' });
          } else {
            toast({ title: 'Failed to create customer in Baskit API', variant: 'destructive' });
          }
        } catch (apiError) {
          console.error('createCustomer API error:', apiError);
          toast({ title: 'API error', description: apiError instanceof Error ? apiError.message : String(apiError), variant: 'destructive' });
        }
      }
      fetchDistributors();
    } catch (err) {
      console.error('Status update error:', err);
      toast({ title: 'Error', description: err instanceof Error ? err.message : String(err), variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <CardTitle className="text-sm font-medium">{t.thisMonth}</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {distributors.filter(d => {
                const createdDate = new Date(d.created_at);
                const now = new Date();
                return createdDate.getMonth() === now.getMonth() && createdDate.getFullYear() === now.getFullYear();
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">{t.newRegistrations}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.recentActivity}</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {distributors.filter(d => {
                const updatedDate = new Date(d.updated_at);
                const dayAgo = new Date();
                dayAgo.setDate(dayAgo.getDate() - 7);
                return updatedDate > dayAgo;
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">{t.lastWeek}</p>
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
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        distributor.status === 'active' ? 'bg-green-100 text-green-800' :
                        distributor.status === 'inactive' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {distributor.status}
                      </span>
                    </TableCell>
                    <TableCell>{formatDate(distributor.created_at || '')}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDistributor(distributor)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditDistributor(distributor)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteDistributor(distributor.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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
    confirmDelete: "Apakah Anda yakin ingin menghapus distributor ini?",
    distributorUpdated: "Distributor Diperbarui",
    distributorUpdatedDesc: "Informasi distributor berhasil diperbarui",
    distributorDeleted: "Distributor Dihapus",
    distributorDeletedDesc: "Distributor berhasil dihapus dari sistem",
    errorFetching: "Gagal Memuat Data",
    errorUpdating: "Gagal Memperbarui",
    errorDeleting: "Gagal Menghapus"
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
    confirmDelete: "Are you sure you want to delete this distributor?",
    distributorUpdated: "Distributor Updated",
    distributorUpdatedDesc: "Distributor information updated successfully",
    distributorDeleted: "Distributor Deleted",
    distributorDeletedDesc: "Distributor successfully removed from system",
    errorFetching: "Failed to Fetch Data",
    errorUpdating: "Failed to Update",
    errorDeleting: "Failed to Delete"
  }
};