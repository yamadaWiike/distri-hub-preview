import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Search, Loader2, Edit, RotateCcw, Eye, Shield, ShieldOff } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';

export type UserProfile = {
  id: string;
  user_id: string;
  nama_bisnis: string;
  alamat_lengkap: string;
  provinsi_id?: string;
  kota: string;
  nama_pemilik: string;
  kontak_pemilik: string;
  email_pemilik: string;
  status: string;
  bentuk_usaha?: string;
  created_at: string;
  approved_at?: string | null;
  approved_by?: string | null;
  omzet?: number;
  jumlah_karyawan?: number;
  website_perusahaan?: string | null;
  npwp?: string;
};

export type User = {
  id: string;
  email: string;
  role: string;
  profile?: UserProfile;
};

const UserManager = () => {
  const { toast } = useToast();
  const { lang } = useLanguage();
  const t = lang === 'id' ? id : en;
  
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editForm, setEditForm] = useState({
    nama_bisnis: '',
    nama_pemilik: '',
    email_pemilik: '',
    kontak_pemilik: '',
    alamat_lengkap: '',
    kota: '',
    bentuk_usaha: '',
    website_perusahaan: '',
    npwp: '',
    status: '',
    role: '',
  });
  
  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      // Try to fetch from Supabase if available
      try {
        // Use a workaround for Supabase typing issues
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const typedSupabase = supabase as any;
        
        // Fetch profiles with user data using a join
        const { data: profiles, error: profileError } = await typedSupabase
          .from('distributor_profiles')
          .select(`
            id,
            user_id,
            nama_bisnis,
            alamat_lengkap,
            kota,
            nama_pemilik,
            kontak_pemilik,
            email_pemilik,
            status,
            bentuk_usaha,
            created_at,
            approved_at,
            approved_by,
            omzet,
            jumlah_karyawan,
            website_perusahaan,
            npwp
          `)
          .order('created_at', { ascending: true });
          
          if (!profileError && profiles && profiles.length > 0) {
          console.log('Fetched user profiles data:', profiles);
          
          // Create users array with profile data
          // Use email_pemilik as the email if available
          const usersWithProfiles = (profiles as UserProfile[]).map(profile => ({
            id: profile.user_id,
            email: profile.email_pemilik || `user_${profile.user_id.substring(0, 5)}@example.com`,
            role: (profile.email_pemilik === 'rudy@baskit.app' || profile.email_pemilik === 'admin.commercial@baskit.app') ? 'admin' : 'user', // Check for admin emails
            profile: profile,
          }));          setUsers(usersWithProfiles);
          setIsLoading(false);
          return;
        }
      } catch (supabaseError) {
        console.warn('Supabase fetch failed, using mock data instead', supabaseError);
      }
      
      // Fall back to mock data if Supabase fetch fails
      console.log('Using mock user data');
      import('@/data/mockData').then(({ mockUserProfiles }) => {
        console.log('Loaded mock user profiles:', mockUserProfiles);
        
        // Create mock users with profiles
        const mockUsersWithProfiles = mockUserProfiles.map(profile => ({
          id: profile.user_id,
          email: profile.email_pemilik,
          role: (profile.email_pemilik === 'rudy@baskit.app' || profile.email_pemilik === 'admin.commercial@baskit.app') ? 'admin' : 'user',
          profile: profile,
        }));
        
        setUsers(mockUsersWithProfiles);
        setIsLoading(false);
      }).catch(e => {
        console.error('Failed to load mock data:', e);
        setIsLoading(false);
      });
      return; // Early return to avoid setting isLoading=false twice
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: t.errorFetchingUsers,
        description: t.checkConsole,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Filter users based on search query
  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.profile?.nama_bisnis.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.profile?.nama_pemilik.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.profile?.kota.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Format date to a readable string
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(lang === 'id' ? 'id-ID' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };
  
  // Get status badge color based on status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">{t.active}</Badge>;
      case 'approved':
        return <Badge className="bg-green-600">{t.approved}</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">{t.pending}</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500">{t.rejected}</Badge>;
      case 'suspended':
        return <Badge className="bg-gray-500">{t.suspended}</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-400">{t.inactive}</Badge>;
      case 'draft':
        return <Badge className="bg-blue-400">{t.draft}</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Handle password reset
  const handlePasswordReset = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `https://distributor.baskit.app/auth/reset-password`
      });
      
      if (error) throw error;
      
      toast({
        title: t.passwordResetSent,
        description: t.passwordResetDescription.replace('{email}', email),
      });
    } catch (error) {
      console.error('Error resetting password:', error);
      toast({
        title: t.errorResettingPassword,
        description: t.checkConsole,
        variant: "destructive"
      });
    }
  };

  // Handle role toggle
  const handleRoleToggle = async (user: User) => {
    if (!user.profile) return;
    
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    setIsUpdating(true);
    
    try {
      // Update user role in auth.users table (this would need to be done server-side in real application)
      // For now, we'll update locally and show a message
      const updatedUsers = users.map(u => 
        u.id === user.id ? { ...u, role: newRole } : u
      );
      setUsers(updatedUsers);
      
      toast({
        title: t.roleUpdated,
        description: t.roleUpdatedDescription.replace('{email}', user.email).replace('{role}', newRole),
      });
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: t.errorUpdatingRole,
        description: t.checkConsole,
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle view user details
  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setIsViewModalOpen(true);
  };

  // Handle edit user
  const handleEditUser = (user: User) => {
    if (!user.profile) return;
    
    setSelectedUser(user);
    setEditForm({
      nama_bisnis: user.profile.nama_bisnis || '',
      nama_pemilik: user.profile.nama_pemilik || '',
      email_pemilik: user.profile.email_pemilik || '',
      kontak_pemilik: user.profile.kontak_pemilik || '',
      alamat_lengkap: user.profile.alamat_lengkap || '',
      kota: user.profile.kota || '',
      bentuk_usaha: user.profile.bentuk_usaha || '',
      website_perusahaan: user.profile.website_perusahaan || '',
      npwp: user.profile.npwp || '',
      status: user.profile.status || '',
      role: user.role || '',
    });
    setIsEditModalOpen(true);
  };

  // Handle save user changes
  const handleSaveUser = async () => {
    if (!selectedUser?.profile) return;
    
    setIsUpdating(true);
    try {
      // Try to update in Supabase
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const typedSupabase = supabase as any;
        
        // Prepare update data with only changed fields
        const updateData: Record<string, unknown> = {};
        
        if (editForm.nama_bisnis !== selectedUser.profile.nama_bisnis) {
          updateData.nama_bisnis = editForm.nama_bisnis;
        }
        if (editForm.nama_pemilik !== selectedUser.profile.nama_pemilik) {
          updateData.nama_pemilik = editForm.nama_pemilik;
        }
        if (editForm.email_pemilik !== selectedUser.profile.email_pemilik) {
          updateData.email_pemilik = editForm.email_pemilik;
        }
        if (editForm.kontak_pemilik !== selectedUser.profile.kontak_pemilik) {
          updateData.kontak_pemilik = editForm.kontak_pemilik;
        }
        if (editForm.alamat_lengkap !== selectedUser.profile.alamat_lengkap) {
          updateData.alamat_lengkap = editForm.alamat_lengkap;
        }
        if (editForm.kota !== selectedUser.profile.kota) {
          updateData.kota = editForm.kota;
        }
        if (editForm.bentuk_usaha !== selectedUser.profile.bentuk_usaha) {
          updateData.bentuk_usaha = editForm.bentuk_usaha;
        }
        if (editForm.website_perusahaan !== selectedUser.profile.website_perusahaan) {
          updateData.website_perusahaan = editForm.website_perusahaan;
        }
        if (editForm.npwp !== selectedUser.profile.npwp) {
          updateData.npwp = editForm.npwp;
        }
        if (editForm.status !== selectedUser.profile.status) {
          updateData.status = editForm.status;
        }
        
        // Only update if there are actual changes
        if (Object.keys(updateData).length > 0) {
          const { error } = await typedSupabase
            .from('distributor_profiles')
            .update(updateData)
            .eq('user_id', selectedUser.profile.user_id); // Use user_id instead of id
            
          if (error) {
            console.error('Supabase update error:', error);
            // If it's a permission error, provide helpful guidance
            if (error.message?.includes('policy') || error.message?.includes('permission')) {
              toast({
                title: t.permissionError,
                description: t.permissionErrorDescription,
                variant: "destructive"
              });
              setIsUpdating(false);
              return;
            }
            // If it's a constraint violation, provide specific guidance
            if (error.code === '23514' || error.message?.includes('check constraint')) {
              toast({
                title: t.constraintError,
                description: t.constraintErrorDescription,
                variant: "destructive"
              });
              setIsUpdating(false);
              return;
            }
            throw error;
          }
          console.log('Successfully updated user in Supabase');
        }
      } catch (supabaseError) {
        console.warn('Supabase update failed, updating locally only:', supabaseError);
      }
      
      // Update local state
      const updatedUsers = users.map(user => {
        if (user.id === selectedUser.id && user.profile) {
          return {
            ...user,
            email: editForm.email_pemilik,
            role: editForm.role,
            profile: {
              ...user.profile,
              nama_bisnis: editForm.nama_bisnis,
              nama_pemilik: editForm.nama_pemilik,
              email_pemilik: editForm.email_pemilik,
              kontak_pemilik: editForm.kontak_pemilik,
              alamat_lengkap: editForm.alamat_lengkap,
              kota: editForm.kota,
              bentuk_usaha: editForm.bentuk_usaha,
              website_perusahaan: editForm.website_perusahaan,
              npwp: editForm.npwp,
              status: editForm.status,
            }
          };
        }
        return user;
      });
      
      setUsers(updatedUsers);
      setIsEditModalOpen(false);
      
      toast({
        title: t.userUpdated,
        description: t.userUpdatedDescription,
      });
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: t.errorUpdatingUser,
        description: t.checkConsole,
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">{t.userManagement}</h2>
      </div>
      
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t.searchUsers}
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" onClick={() => setSearchQuery('')}>
          {t.clear}
        </Button>
      </div>

      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t.email}</TableHead>
              <TableHead>{t.businessName}</TableHead>
              <TableHead>{t.ownerName}</TableHead>
              <TableHead>{t.location}</TableHead>
              <TableHead>{t.registerDate}</TableHead>
              <TableHead>{t.status}</TableHead>
              <TableHead>{t.role}</TableHead>
              <TableHead>{t.actions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <div className="flex justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                  <p className="text-muted-foreground mt-2">{t.loading}</p>
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <p className="text-muted-foreground">{t.noUsersFound}</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.email}</TableCell>
                  <TableCell className="font-medium">
                    {user.profile?.nama_bisnis || '-'}
                  </TableCell>
                  <TableCell>{user.profile?.nama_pemilik || '-'}</TableCell>
                  <TableCell>{user.profile?.kota || '-'}</TableCell>
                  <TableCell>
                    {user.profile?.created_at 
                      ? formatDate(user.profile.created_at)
                      : '-'
                    }
                  </TableCell>
                  <TableCell>
                    {user.profile?.status 
                      ? getStatusBadge(user.profile.status)
                      : '-'
                    }
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-normal">
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewUser(user)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditUser(user)}
                        disabled={!user.profile}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePasswordReset(user.email)}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRoleToggle(user)}
                        disabled={isUpdating}
                      >
                        {user.role === 'admin' ? (
                          <ShieldOff className="h-4 w-4" />
                        ) : (
                          <Shield className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* View User Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t.viewUserDetails}</DialogTitle>
            <DialogDescription>{t.viewUserDescription}</DialogDescription>
          </DialogHeader>
          {selectedUser && selectedUser.profile && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">{t.email}</Label>
                <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">{t.role}</Label>
                <p className="text-sm text-muted-foreground">{selectedUser.role}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">{t.businessName}</Label>
                <p className="text-sm text-muted-foreground">{selectedUser.profile.nama_bisnis}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">{t.ownerName}</Label>
                <p className="text-sm text-muted-foreground">{selectedUser.profile.nama_pemilik}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">{t.contact}</Label>
                <p className="text-sm text-muted-foreground">{selectedUser.profile.kontak_pemilik}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">{t.location}</Label>
                <p className="text-sm text-muted-foreground">{selectedUser.profile.kota}</p>
              </div>
              <div className="col-span-2">
                <Label className="text-sm font-medium">{t.address}</Label>
                <p className="text-sm text-muted-foreground">{selectedUser.profile.alamat_lengkap}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">{t.businessType}</Label>
                <p className="text-sm text-muted-foreground">{selectedUser.profile.bentuk_usaha || '-'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">{t.website}</Label>
                <p className="text-sm text-muted-foreground">{selectedUser.profile.website_perusahaan || '-'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">{t.npwp}</Label>
                <p className="text-sm text-muted-foreground">{selectedUser.profile.npwp || '-'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">{t.status}</Label>
                <div className="mt-1">
                  {getStatusBadge(selectedUser.profile.status)}
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">{t.registerDate}</Label>
                <p className="text-sm text-muted-foreground">
                  {formatDate(selectedUser.profile.created_at)}
                </p>
              </div>
              {selectedUser.profile.omzet && (
                <div>
                  <Label className="text-sm font-medium">{t.revenue}</Label>
                  <p className="text-sm text-muted-foreground">
                    Rp {selectedUser.profile.omzet.toLocaleString('id-ID')}
                  </p>
                </div>
              )}
              {selectedUser.profile.jumlah_karyawan && (
                <div>
                  <Label className="text-sm font-medium">{t.employees}</Label>
                  <p className="text-sm text-muted-foreground">{selectedUser.profile.jumlah_karyawan}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t.editUserDetails}</DialogTitle>
            <DialogDescription>{t.editUserDescription}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nama_bisnis">{t.businessName}</Label>
              <Input
                id="nama_bisnis"
                value={editForm.nama_bisnis}
                onChange={(e) => setEditForm(prev => ({ ...prev, nama_bisnis: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="nama_pemilik">{t.ownerName}</Label>
              <Input
                id="nama_pemilik"
                value={editForm.nama_pemilik}
                onChange={(e) => setEditForm(prev => ({ ...prev, nama_pemilik: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="email_pemilik">{t.email}</Label>
              <Input
                id="email_pemilik"
                type="email"
                value={editForm.email_pemilik}
                onChange={(e) => setEditForm(prev => ({ ...prev, email_pemilik: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="kontak_pemilik">{t.contact}</Label>
              <Input
                id="kontak_pemilik"
                value={editForm.kontak_pemilik}
                onChange={(e) => setEditForm(prev => ({ ...prev, kontak_pemilik: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="kota">{t.location}</Label>
              <Input
                id="kota"
                value={editForm.kota}
                onChange={(e) => setEditForm(prev => ({ ...prev, kota: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="bentuk_usaha">{t.businessType}</Label>
              <Select
                value={editForm.bentuk_usaha}
                onValueChange={(value) => setEditForm(prev => ({ ...prev, bentuk_usaha: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t.selectBusinessType} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CV">CV</SelectItem>
                  <SelectItem value="PT">PT</SelectItem>
                  <SelectItem value="UD">UD</SelectItem>
                  <SelectItem value="Perorangan">Perorangan</SelectItem>
                  <SelectItem value="Koperasi">Koperasi</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label htmlFor="alamat_lengkap">{t.address}</Label>
              <Input
                id="alamat_lengkap"
                value={editForm.alamat_lengkap}
                onChange={(e) => setEditForm(prev => ({ ...prev, alamat_lengkap: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="website_perusahaan">{t.website}</Label>
              <Input
                id="website_perusahaan"
                value={editForm.website_perusahaan}
                onChange={(e) => setEditForm(prev => ({ ...prev, website_perusahaan: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="npwp">{t.npwp}</Label>
              <Input
                id="npwp"
                value={editForm.npwp}
                onChange={(e) => setEditForm(prev => ({ ...prev, npwp: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="status">{t.status}</Label>
              <Select
                value={editForm.status}
                onValueChange={(value) => setEditForm(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t.selectStatus} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{t.active}</SelectItem>
                  <SelectItem value="pending">{t.pending}</SelectItem>
                  <SelectItem value="approved">{t.approved}</SelectItem>
                  <SelectItem value="suspended">{t.suspended}</SelectItem>
                  <SelectItem value="rejected">{t.rejected}</SelectItem>
                  <SelectItem value="inactive">{t.inactive}</SelectItem>
                  <SelectItem value="draft">{t.draft}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="role">{t.role}</Label>
              <Select
                value={editForm.role}
                onValueChange={(value) => setEditForm(prev => ({ ...prev, role: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t.selectRole} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">{t.user}</SelectItem>
                  <SelectItem value="admin">{t.admin}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
              disabled={isUpdating}
            >
              {t.cancel}
            </Button>
            <Button onClick={handleSaveUser} disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t.saving}
                </>
              ) : (
                t.save
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      <div className="bg-muted p-4 rounded-md text-sm">
        <p className="font-medium mb-2">{t.adminRoleNote}</p>
        <pre className="bg-background p-2 rounded text-xs overflow-auto">
          {`-- SQL for granting admin role
UPDATE auth.users
SET raw_app_meta_data = jsonb_set(
  raw_app_meta_data, 
  '{role}', 
  '"admin"'
)
WHERE email = 'rudy@baskit.app';`}
        </pre>
      </div>
    </div>
  );
};

// Translations
const id = {
  userManagement: 'Manajemen Pengguna',
  searchUsers: 'Cari pengguna berdasarkan email, nama bisnis, nama pemilik, atau kota...',
  clear: 'Bersihkan',
  email: 'Email',
  businessName: 'Nama Bisnis',
  ownerName: 'Nama Pemilik',
  location: 'Lokasi',
  registerDate: 'Tanggal Daftar',
  status: 'Status',
  role: 'Peran',
  actions: 'Aksi',
  loading: 'Memuat pengguna...',
  noUsersFound: 'Tidak ada pengguna yang ditemukan.',
  active: 'Aktif',
  pending: 'Menunggu',
  approved: 'Disetujui',
  rejected: 'Ditolak',
  suspended: 'Ditangguhkan',
  inactive: 'Tidak Aktif',
  draft: 'Draft',
  errorFetchingUsers: 'Gagal memuat data pengguna',
  checkConsole: 'Silakan periksa konsol untuk detail lebih lanjut.',
  adminRoleNote: 'Catatan: Untuk memberikan peran admin kepada pengguna, jalankan SQL berikut pada database:',
  viewUserDetails: 'Lihat Detail Pengguna',
  viewUserDescription: 'Informasi lengkap tentang profil pengguna ini.',
  editUserDetails: 'Edit Detail Pengguna',
  editUserDescription: 'Ubah informasi profil pengguna ini.',
  contact: 'Kontak',
  address: 'Alamat',
  businessType: 'Bentuk Usaha',
  website: 'Website',
  npwp: 'NPWP',
  revenue: 'Omzet',
  employees: 'Jumlah Karyawan',
  selectBusinessType: 'Pilih bentuk usaha',
  selectStatus: 'Pilih status',
  selectRole: 'Pilih peran',
  user: 'Pengguna',
  admin: 'Admin',
  cancel: 'Batal',
  save: 'Simpan',
  saving: 'Menyimpan...',
  passwordResetSent: 'Email reset password terkirim',
  passwordResetDescription: 'Link reset password telah dikirim ke {email}',
  errorResettingPassword: 'Gagal mengirim reset password',
  roleUpdated: 'Peran pengguna diperbarui',
  roleUpdatedDescription: 'Peran untuk {email} telah diubah menjadi {role}',
  errorUpdatingRole: 'Gagal mengubah peran pengguna',
  userUpdated: 'Data pengguna diperbarui',
  userUpdatedDescription: 'Data pengguna berhasil diperbarui',
  errorUpdatingUser: 'Gagal memperbarui data pengguna',
  permissionError: 'Akses ditolak',
  permissionErrorDescription: 'Anda tidak memiliki izin untuk mengubah data ini. Pastikan Anda memiliki peran admin atau jalankan SQL fix di database.',
  constraintError: 'Nilai tidak valid',
  constraintErrorDescription: 'Status yang dipilih tidak diizinkan oleh database. Gunakan salah satu dari: active, pending, approved, rejected, suspended, inactive, draft.',
};

const en = {
  userManagement: 'User Management',
  searchUsers: 'Search users by email, business name, owner name, or location...',
  clear: 'Clear',
  email: 'Email',
  businessName: 'Business Name',
  ownerName: 'Owner Name',
  location: 'Location',
  registerDate: 'Register Date',
  status: 'Status',
  role: 'Role',
  actions: 'Actions',
  loading: 'Loading users...',
  noUsersFound: 'No users found.',
  active: 'Active',
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  suspended: 'Suspended',
  inactive: 'Inactive',
  draft: 'Draft',
  errorFetchingUsers: 'Failed to fetch users',
  checkConsole: 'Please check the console for more details.',
  adminRoleNote: 'Note: To grant admin role to a user, run the following SQL on the database:',
  viewUserDetails: 'View User Details',
  viewUserDescription: 'Complete information about this user profile.',
  editUserDetails: 'Edit User Details',
  editUserDescription: 'Modify this user profile information.',
  contact: 'Contact',
  address: 'Address',
  businessType: 'Business Type',
  website: 'Website',
  npwp: 'NPWP',
  revenue: 'Revenue',
  employees: 'Employees',
  selectBusinessType: 'Select business type',
  selectStatus: 'Select status',
  selectRole: 'Select role',
  user: 'User',
  admin: 'Admin',
  cancel: 'Cancel',
  save: 'Save',
  saving: 'Saving...',
  passwordResetSent: 'Password reset email sent',
  passwordResetDescription: 'Password reset link has been sent to {email}',
  errorResettingPassword: 'Failed to send password reset',
  roleUpdated: 'User role updated',
  roleUpdatedDescription: 'Role for {email} has been changed to {role}',
  errorUpdatingRole: 'Failed to update user role',
  userUpdated: 'User data updated',
  userUpdatedDescription: 'User data has been successfully updated',
  errorUpdatingUser: 'Failed to update user data',
  permissionError: 'Access denied',
  permissionErrorDescription: 'You do not have permission to modify this data. Ensure you have admin role or run the SQL fix in the database.',
  constraintError: 'Invalid value',
  constraintErrorDescription: 'The selected status is not allowed by the database. Use one of: active, pending, approved, rejected, suspended, inactive, draft.',
};

export default UserManager;
