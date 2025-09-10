import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Search, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

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
            role: profile.email_pemilik === 'rudy@baskit.app' ? 'admin' : 'user', // Check for admin email
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
          role: profile.email_pemilik === 'rudy@baskit.app' ? 'admin' : 'user',
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
      case 'pending':
        return <Badge className="bg-yellow-500">{t.pending}</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500">{t.rejected}</Badge>;
      case 'suspended':
        return <Badge className="bg-gray-500">{t.suspended}</Badge>;
      default:
        return <Badge>{status}</Badge>;
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                  <p className="text-muted-foreground mt-2">{t.loading}</p>
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
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
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
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
  loading: 'Memuat pengguna...',
  noUsersFound: 'Tidak ada pengguna yang ditemukan.',
  active: 'Aktif',
  pending: 'Menunggu',
  rejected: 'Ditolak',
  suspended: 'Ditangguhkan',
  errorFetchingUsers: 'Gagal memuat data pengguna',
  checkConsole: 'Silakan periksa konsol untuk detail lebih lanjut.',
  adminRoleNote: 'Catatan: Untuk memberikan peran admin kepada pengguna, jalankan SQL berikut pada database:',
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
  loading: 'Loading users...',
  noUsersFound: 'No users found.',
  active: 'Active',
  pending: 'Pending',
  rejected: 'Rejected',
  suspended: 'Suspended',
  errorFetchingUsers: 'Failed to fetch users',
  checkConsole: 'Please check the console for more details.',
  adminRoleNote: 'Note: To grant admin role to a user, run the following SQL on the database:',
};

export default UserManager;
