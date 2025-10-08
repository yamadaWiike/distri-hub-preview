import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Eye, Edit, Trash2, Search, Loader2, Calendar, Phone, Mail, MapPin } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { provinces, getCitiesByProvince, City } from '@/data/indonesia';

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
  const t = lang === 'id' ? translations.id : translations.en;
  
  const [distributors, setDistributors] = useState<DistributorProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistributor, setSelectedDistributor] = useState<DistributorProfile | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState<Partial<DistributorProfile>>({});
  const [availableCities, setAvailableCities] = useState<City[]>([]);

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

  // Update available cities when province changes in edit form
  useEffect(() => {
    // Province field does not exist in distributor profile, so skip updating available cities
    setAvailableCities([]);
  }, [editForm]);

  // Save distributor changes
  const saveDistributor = async () => {
    if (!selectedDistributor) return;

    try {
      // Use correct field names matching database schema
      const updateData = {
        nama_bisnis: editForm.nama_bisnis,
        nama_pemilik: editForm.nama_pemilik,
        email: editForm.email,
        kontak_pemilik: editForm.kontak_pemilik,
        alamat_lengkap: editForm.alamat_lengkap,
        kota: editForm.kota,
        status: editForm.status
      };

      // Use a direct approach without type assertion
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('distributor_profiles')
        .update(updateData)
        .eq('id', selectedDistributor.id);

      if (error) throw error;

      toast({
        title: t.distributorUpdated,
        description: t.distributorUpdatedDesc,
      });

      setIsEditDialogOpen(false);
      fetchDistributors();
    } catch (error) {
      console.error('Error updating distributor:', error);
      toast({
        title: t.errorUpdating,
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive"
      });
    }
  };

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

  // Open edit dialog
  const openEditDialog = (distributor: DistributorProfile) => {
    setSelectedDistributor(distributor);
    setEditForm({
      nama_bisnis: distributor.nama_bisnis,
      nama_pemilik: distributor.nama_pemilik,
      email: distributor.email,
      kontak_pemilik: distributor.kontak_pemilik,
      alamat_lengkap: distributor.alamat_lengkap,
      kota: distributor.kota,
      status: distributor.status,
    });
    
    setIsEditDialogOpen(true);
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
                          onClick={() => {
                            setSelectedDistributor(distributor);
                            setIsViewDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(distributor)}
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

      {/* View Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{t.distributorDetails}</DialogTitle>
            <DialogDescription>
              View detailed information about the selected distributor including business details and contact information.
            </DialogDescription>
          </DialogHeader>
          {selectedDistributor && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {t.registeredOn}: {formatDate(selectedDistributor.created_at)}
                  </span>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium">{t.businessName}</Label>
                    <p className="text-sm">{selectedDistributor.nama_bisnis}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">{t.contactPerson}</Label>
                    <p className="text-sm">{selectedDistributor.nama_pemilik}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm">{selectedDistributor.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm">{selectedDistributor.kontak_pemilik}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm">{selectedDistributor.alamat_lengkap}, {selectedDistributor.kota}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">{t.status}</Label>
                  <p className="text-sm">{selectedDistributor.status}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">{t.businessType}</Label>
                  <p className="text-sm text-muted-foreground">Not Available</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">{t.distributorLicense}</Label>
                  <p className="text-sm text-muted-foreground">Not Available</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">{t.taxId}</Label>
                  <p className="text-sm text-muted-foreground">Not Available</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">{t.bankInfo}</Label>
                  <p className="text-sm text-muted-foreground">Not Available</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t.editDistributor}</DialogTitle>
            <DialogDescription>
              Edit distributor information including business details, contact information, and location settings.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nama_bisnis">{t.businessName}</Label>
              <Input
                id="nama_bisnis"
                value={editForm.nama_bisnis || ''}
                onChange={(e) => setEditForm(prev => ({ ...prev, nama_bisnis: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nama_pemilik">{t.contactPerson}</Label>
              <Input
                id="nama_pemilik"
                value={editForm.nama_pemilik || ''}
                onChange={(e) => setEditForm(prev => ({ ...prev, nama_pemilik: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t.email}</Label>
              <Input
                id="email"
                type="email"
                value={editForm.email || ''}
                onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kontak_pemilik">{t.phone}</Label>
              <Input
                id="kontak_pemilik"
                value={editForm.kontak_pemilik || ''}
                onChange={(e) => setEditForm(prev => ({ ...prev, kontak_pemilik: e.target.value }))}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="alamat_lengkap">{t.address}</Label>
              <Input
                id="alamat_lengkap"
                value={editForm.alamat_lengkap || ''}
                onChange={(e) => setEditForm(prev => ({ ...prev, alamat_lengkap: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kota">{t.city}</Label>
              <Input
                id="kota"
                value={editForm.kota || ''}
                onChange={(e) => setEditForm(prev => ({ ...prev, kota: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">{t.status}</Label>
              <Select 
                value={editForm.status || ''} 
                onValueChange={(value) => setEditForm(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              {t.cancel}
            </Button>
            <Button onClick={saveDistributor}>
              {t.saveChanges}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

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

export default DistributorManager;