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
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { provinces, getCitiesByProvince, City } from '@/data/indonesia';

// Define distributor profile type (simplified without status)
type DistributorProfile = {
  id: string;
  user_id: string;
  business_name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postal_code: string;
  business_type: string;
  distributor_license: string;
  tax_id: string;
  bank_account: string;
  bank_name: string;
  role: string;
  created_at: string;
  updated_at: string;
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
    if (editForm.province) {
      // Find province by name to get the ID
      const province = provinces.find(p => p.name === editForm.province);
      if (province) {
        const citiesList = getCitiesByProvince(province.id);
        setAvailableCities(citiesList);
      }
    } else {
      setAvailableCities([]);
    }
  }, [editForm.province]);

  // Save distributor changes
  const saveDistributor = async () => {
    if (!selectedDistributor) return;

    try {
      // Use a more flexible approach to avoid TypeScript issues
      const updateData = {
        business_name: editForm.business_name,
        contact_person: editForm.contact_person,
        email: editForm.email,
        phone: editForm.phone,
        address: editForm.address,
        city: editForm.city,
        province: editForm.province,
        postal_code: editForm.postal_code,
        business_type: editForm.business_type,
        distributor_license: editForm.distributor_license,
        tax_id: editForm.tax_id,
        bank_account: editForm.bank_account,
        bank_name: editForm.bank_name
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
      business_name: distributor.business_name,
      contact_person: distributor.contact_person,
      email: distributor.email,
      phone: distributor.phone,
      address: distributor.address,
      city: distributor.city,
      province: distributor.province,
      postal_code: distributor.postal_code,
      business_type: distributor.business_type,
      distributor_license: distributor.distributor_license,
      tax_id: distributor.tax_id,
      bank_account: distributor.bank_account,
      bank_name: distributor.bank_name,
    });
    
    // Load cities for the current province
    if (distributor.province) {
      const province = provinces.find(p => p.name === distributor.province);
      if (province) {
        const citiesList = getCitiesByProvince(province.id);
        setAvailableCities(citiesList);
      }
    }
    
    setIsEditDialogOpen(true);
  };

  // Filter distributors based on search query
  const filteredDistributors = distributors.filter(distributor => {
    const searchLower = searchQuery.toLowerCase();
    return (
      distributor.business_name?.toLowerCase().includes(searchLower) ||
      distributor.contact_person?.toLowerCase().includes(searchLower) ||
      distributor.email?.toLowerCase().includes(searchLower) ||
      distributor.phone?.toLowerCase().includes(searchLower) ||
      distributor.city?.toLowerCase().includes(searchLower)
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
                  <TableHead>{t.registrationDate}</TableHead>
                  <TableHead>{t.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDistributors.map((distributor) => (
                  <TableRow key={distributor.id}>
                    <TableCell className="font-medium">{distributor.business_name}</TableCell>
                    <TableCell>{distributor.contact_person}</TableCell>
                    <TableCell>{distributor.email}</TableCell>
                    <TableCell>{distributor.phone}</TableCell>
                    <TableCell>{distributor.city}</TableCell>
                    <TableCell>{formatDate(distributor.created_at)}</TableCell>
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
                    <p className="text-sm">{selectedDistributor.business_name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">{t.contactPerson}</Label>
                    <p className="text-sm">{selectedDistributor.contact_person}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm">{selectedDistributor.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm">{selectedDistributor.phone}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm">{selectedDistributor.address}, {selectedDistributor.city}, {selectedDistributor.province} {selectedDistributor.postal_code}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">{t.businessType}</Label>
                  <p className="text-sm">{selectedDistributor.business_type}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">{t.distributorLicense}</Label>
                  <p className="text-sm">{selectedDistributor.distributor_license}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">{t.taxId}</Label>
                  <p className="text-sm">{selectedDistributor.tax_id}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">{t.bankInfo}</Label>
                  <p className="text-sm">{selectedDistributor.bank_name} - {selectedDistributor.bank_account}</p>
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
              <Label htmlFor="business_name">{t.businessName}</Label>
              <Input
                id="business_name"
                value={editForm.business_name || ''}
                onChange={(e) => setEditForm(prev => ({ ...prev, business_name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_person">{t.contactPerson}</Label>
              <Input
                id="contact_person"
                value={editForm.contact_person || ''}
                onChange={(e) => setEditForm(prev => ({ ...prev, contact_person: e.target.value }))}
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
              <Label htmlFor="phone">{t.phone}</Label>
              <Input
                id="phone"
                value={editForm.phone || ''}
                onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">{t.address}</Label>
              <Input
                id="address"
                value={editForm.address || ''}
                onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="province">{t.province}</Label>
              <Select 
                value={editForm.province || ''} 
                onValueChange={(value) => setEditForm(prev => ({ ...prev, province: value, city: '' }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={lang === 'id' ? "Pilih Provinsi" : "Select Province"} />
                </SelectTrigger>
                <SelectContent>
                  {provinces.map((province) => (
                    <SelectItem key={province.id} value={province.name}>
                      {province.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">{t.city}</Label>
              <Select 
                value={editForm.city || ''} 
                onValueChange={(value) => setEditForm(prev => ({ ...prev, city: value }))}
                disabled={!editForm.province}
              >
                <SelectTrigger>
                  <SelectValue placeholder={lang === 'id' ? "Pilih Kota/Kabupaten" : "Select City/Regency"} />
                </SelectTrigger>
                <SelectContent>
                  {availableCities.map((city) => (
                    <SelectItem key={city.id} value={city.name}>
                      {city.name}
                    </SelectItem>
                  ))}
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