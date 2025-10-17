/**
 * Distributor Approval Manager Component
 * Admin component for managing distributor approval status
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  Loader2, 
  Eye,
  UserCheck,
  UserX,
  Users
} from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogTrigger
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface DistributorProfile {
  id: string;
  user_id: string;
  nama_bisnis: string;
  alamat_lengkap: string;
  kota: string;
  nama_pemilik: string;
  kontak_pemilik: string;
  email?: string;
  status: 'pending' | 'active' | 'inactive' | 'rejected';
  created_at: string;
  approved_at?: string;
  approved_by?: string;
}

const DistributorApprovalManager = () => {
  const [distributors, setDistributors] = useState<DistributorProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDistributor, setSelectedDistributor] = useState<DistributorProfile | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const { toast } = useToast();
  const { lang } = useLanguage();

  const t = {
    id: {
      title: 'Manajemen Persetujuan Distributor',
      description: 'Kelola persetujuan dan status akun distributor',
      pending: 'Menunggu',
      active: 'Aktif',
      inactive: 'Nonaktif',
      rejected: 'Ditolak',
      businessName: 'Nama Bisnis',
      ownerName: 'Nama Pemilik',
      city: 'Kota',
      phone: 'Telepon',
      email: 'Email',
      status: 'Status',
      registrationDate: 'Tanggal Daftar',
      actions: 'Aksi',
      approve: 'Setujui',
      reject: 'Tolak',
      activate: 'Aktifkan',
      deactivate: 'Nonaktifkan',
      viewDetails: 'Lihat Detail',
      distributorDetails: 'Detail Distributor',
      address: 'Alamat',
      approvedAt: 'Disetujui pada',
      approvedBy: 'Disetujui oleh',
      confirmApprove: 'Apakah Anda yakin ingin menyetujui distributor ini?',
      confirmReject: 'Apakah Anda yakin ingin menolak distributor ini?',
      confirmDeactivate: 'Apakah Anda yakin ingin menonaktifkan distributor ini?',
      distributorApproved: 'Distributor Disetujui',
      distributorRejected: 'Distributor Ditolak',
      distributorDeactivated: 'Distributor Dinonaktifkan',
      distributorActivated: 'Distributor Diaktifkan',
      errorUpdating: 'Gagal memperbarui status',
      pendingDistributors: 'Distributor Menunggu Persetujuan',
      totalDistributors: 'Total Distributor',
      activeDistributors: 'Distributor Aktif',
      batchApprove: 'Setujui Semua',
      batchApproveConfirm: 'Setujui semua distributor yang menunggu?',
      noPendingDistributors: 'Tidak ada distributor yang menunggu persetujuan',
      loadingDistributors: 'Memuat data distributor...'
    },
    en: {
      title: 'Distributor Approval Management',
      description: 'Manage distributor approval and account status',
      pending: 'Pending',
      active: 'Active',
      inactive: 'Inactive',
      rejected: 'Rejected',
      businessName: 'Business Name',
      ownerName: 'Owner Name',
      city: 'City',
      phone: 'Phone',
      email: 'Email',
      status: 'Status',
      registrationDate: 'Registration Date',
      actions: 'Actions',
      approve: 'Approve',
      reject: 'Reject',
      activate: 'Activate',
      deactivate: 'Deactivate',
      viewDetails: 'View Details',
      distributorDetails: 'Distributor Details',
      address: 'Address',
      approvedAt: 'Approved at',
      approvedBy: 'Approved by',
      confirmApprove: 'Are you sure you want to approve this distributor?',
      confirmReject: 'Are you sure you want to reject this distributor?',
      confirmDeactivate: 'Are you sure you want to deactivate this distributor?',
      distributorApproved: 'Distributor Approved',
      distributorRejected: 'Distributor Rejected',
      distributorDeactivated: 'Distributor Deactivated',
      distributorActivated: 'Distributor Activated',
      errorUpdating: 'Failed to update status',
      pendingDistributors: 'Pending Distributor Approvals',
      totalDistributors: 'Total Distributors',
      activeDistributors: 'Active Distributors',
      batchApprove: 'Approve All',
      batchApproveConfirm: 'Approve all pending distributors?',
      noPendingDistributors: 'No distributors pending approval',
      loadingDistributors: 'Loading distributors...'
    }
  };

  const currentLang = t[lang] || t.en;

  // Fetch distributors from database
  const fetchDistributors = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('distributor_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const distributorData = (data || []) as DistributorProfile[];
      setDistributors(distributorData);
      setPendingCount(distributorData.filter(d => d.status === 'pending').length);
    } catch (error) {
      console.error('Error fetching distributors:', error);
      toast({
        title: currentLang.errorUpdating,
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentLang.errorUpdating, toast]);

  useEffect(() => {
    fetchDistributors();
  }, [fetchDistributors]);

  // Update distributor status
  const updateDistributorStatus = async (
    distributorUserId: string, 
    newStatus: 'pending' | 'active' | 'inactive' | 'rejected'
  ) => {
    setIsUpdating(true);
    try {
      // Use the secure function to update status
      const { error } = await supabase.rpc('update_distributor_status', {
        distributor_user_id: distributorUserId,
        new_status: newStatus
      } as never);

      if (error) throw error;

      // Refresh the distributors list
      await fetchDistributors();

      // Show success toast
      const statusMessages = {
        active: { title: currentLang.distributorApproved, desc: 'Distributor has been approved and activated' },
        rejected: { title: currentLang.distributorRejected, desc: 'Distributor application has been rejected' },
        inactive: { title: currentLang.distributorDeactivated, desc: 'Distributor has been deactivated' },
        pending: { title: 'Status Updated', desc: 'Distributor status updated to pending' }
      };

      const message = statusMessages[newStatus];
      toast({
        title: message.title,
        description: message.desc,
        variant: "default"
      });

    } catch (error) {
      console.error('Error updating distributor status:', error);
      toast({
        title: currentLang.errorUpdating,
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Batch approve all pending distributors
  const batchApproveDistributors = async () => {
    setIsUpdating(true);
    try {
      const pendingDistributorIds = distributors
        .filter(d => d.status === 'pending')
        .map(d => d.user_id);

      if (pendingDistributorIds.length === 0) {
        toast({
          title: currentLang.noPendingDistributors,
          variant: "default"
        });
        return;
      }

      const { data, error } = await supabase.rpc('batch_approve_distributors', {
        distributor_user_ids: pendingDistributorIds
      } as never);

      if (error) throw error;

      await fetchDistributors();

      toast({
        title: 'Batch Approval Complete',
        description: `${data} distributors have been approved`,
        variant: "default"
      });

    } catch (error) {
      console.error('Error batch approving distributors:', error);
      toast({
        title: currentLang.errorUpdating,
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Get status badge component
  const getStatusBadge = (status: string) => {
    const configs = {
      pending: { icon: Clock, color: 'bg-orange-100 text-orange-800', text: currentLang.pending },
      active: { icon: CheckCircle, color: 'bg-green-100 text-green-800', text: currentLang.active },
      inactive: { icon: AlertTriangle, color: 'bg-gray-100 text-gray-800', text: currentLang.inactive },
      rejected: { icon: XCircle, color: 'bg-red-100 text-red-800', text: currentLang.rejected }
    };

    const config = configs[status as keyof typeof configs] || configs.pending;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.text}
      </Badge>
    );
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Calculate statistics
  const stats = {
    total: distributors.length,
    pending: distributors.filter(d => d.status === 'pending').length,
    active: distributors.filter(d => d.status === 'active').length,
    rejected: distributors.filter(d => d.status === 'rejected').length,
    inactive: distributors.filter(d => d.status === 'inactive').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{currentLang.title}</h1>
          <p className="text-muted-foreground">{currentLang.description}</p>
        </div>
        
        {pendingCount > 0 && (
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="default" className="flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                {currentLang.batchApprove} ({pendingCount})
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{currentLang.batchApprove}</DialogTitle>
                <DialogDescription>
                  {currentLang.batchApproveConfirm}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={batchApproveDistributors} disabled={isUpdating}>
                  {isUpdating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {currentLang.batchApprove}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{currentLang.totalDistributors}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{currentLang.pendingDistributors}</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{currentLang.activeDistributors}</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected/Inactive</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejected + stats.inactive}</div>
          </CardContent>
        </Card>
      </div>

      {/* Distributors Table */}
      <Card>
        <CardHeader>
          <CardTitle>{currentLang.title}</CardTitle>
          <CardDescription>{currentLang.description}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">{currentLang.loadingDistributors}</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{currentLang.businessName}</TableHead>
                  <TableHead>{currentLang.ownerName}</TableHead>
                  <TableHead>{currentLang.city}</TableHead>
                  <TableHead>{currentLang.status}</TableHead>
                  <TableHead>{currentLang.registrationDate}</TableHead>
                  <TableHead>{currentLang.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {distributors.map((distributor) => (
                  <TableRow key={distributor.id}>
                    <TableCell className="font-medium">{distributor.nama_bisnis}</TableCell>
                    <TableCell>{distributor.nama_pemilik}</TableCell>
                    <TableCell>{distributor.kota}</TableCell>
                    <TableCell>{getStatusBadge(distributor.status)}</TableCell>
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
                        
                        {distributor.status === 'pending' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => updateDistributorStatus(distributor.user_id, 'active')}
                              disabled={isUpdating}
                              className="text-green-600 hover:text-green-700"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => updateDistributorStatus(distributor.user_id, 'rejected')}
                              disabled={isUpdating}
                              className="text-red-600 hover:text-red-700"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        
                        {distributor.status === 'active' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateDistributorStatus(distributor.user_id, 'inactive')}
                            disabled={isUpdating}
                            className="text-gray-600 hover:text-gray-700"
                          >
                            <UserX className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {distributor.status === 'inactive' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateDistributorStatus(distributor.user_id, 'active')}
                            disabled={isUpdating}
                            className="text-green-600 hover:text-green-700"
                          >
                            <UserCheck className="h-4 w-4" />
                          </Button>
                        )}
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{currentLang.distributorDetails}</DialogTitle>
          </DialogHeader>
          {selectedDistributor && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">{currentLang.businessName}</label>
                  <p className="text-sm text-muted-foreground">{selectedDistributor.nama_bisnis}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">{currentLang.ownerName}</label>
                  <p className="text-sm text-muted-foreground">{selectedDistributor.nama_pemilik}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">{currentLang.phone}</label>
                  <p className="text-sm text-muted-foreground">{selectedDistributor.kontak_pemilik}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">{currentLang.city}</label>
                  <p className="text-sm text-muted-foreground">{selectedDistributor.kota}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium">{currentLang.address}</label>
                  <p className="text-sm text-muted-foreground">{selectedDistributor.alamat_lengkap}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">{currentLang.status}</label>
                  <div className="mt-1">{getStatusBadge(selectedDistributor.status)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium">{currentLang.registrationDate}</label>
                  <p className="text-sm text-muted-foreground">{formatDate(selectedDistributor.created_at)}</p>
                </div>
                {selectedDistributor.approved_at && (
                  <div>
                    <label className="text-sm font-medium">{currentLang.approvedAt}</label>
                    <p className="text-sm text-muted-foreground">{formatDate(selectedDistributor.approved_at)}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DistributorApprovalManager;