// React & Router
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// External Libraries & Icons
import { ArrowLeft, Filter } from "lucide-react";

// UI Components
import SEO from "@/components/seo/SEO";
import Navbar from "@/components/layout/Navbar";
import AdminSidebar from "@/components/layout/AdminSidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Hooks
import { useLanguage } from "@/hooks/use-language";
import { useAuth } from "@/hooks/use-auth";

// Integrations
import { supabase } from "@/integrations/supabase/client";

interface Activity {
  id: string;
  type: 'Approval' | 'Product' | 'Order' | 'User';
  activity: string;
  detail: string;
  time: string;
  timestamp: Date;
  actor: string;
  actorEmail?: string;
}

export default function AllActivities() {
  const { lang } = useLanguage();
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [isAdmin, setIsAdmin] = useState(false);
  
  const t = lang === 'id' ? id : en;

  useEffect(() => {
    const checkAdmin = async () => {
      if (!authLoading && user) {
        setIsAdmin(user.role === 'admin');
      }
    };
    checkAdmin();
  }, [user, authLoading]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/masuk");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchActivities();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  useEffect(() => {
    if (filterType === 'all') {
      setFilteredActivities(activities);
    } else {
      setFilteredActivities(activities.filter(a => a.type === filterType));
    }
  }, [filterType, activities]);

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const fetchActivities = async () => {
    try {
      setIsLoading(true);
      const allActivities: Activity[] = [];

      // Fetch all users for mapping
      const { data: users } = await supabase
        .from('profiles')
        .select('id, email, full_name');

      const getUserName = (userId: string | null) => {
        if (!userId) return 'System';
        const user = users?.find((u: any) => u.id === userId);
        return (user as any)?.full_name || (user as any)?.email || 'Unknown User';
      };

      const getUserEmail = (userId: string | null) => {
        if (!userId) return undefined;
        const user = users?.find((u: any) => u.id === userId);
        return (user as any)?.email;
      };

      // Fetch distributor approvals
      const { data: distributors } = await supabase
        .from('distributor_profiles')
        .select('id, nama_bisnis, approval_status, created_at, updated_at, user_id')
        .order('updated_at', { ascending: false })
        .limit(50);

      distributors?.forEach((dist: any) => {
        if (dist.approval_status === 'approved' && dist.updated_at) {
          allActivities.push({
            id: `approval-${dist.id}`,
            type: 'Approval',
            activity: lang === 'id' ? 'Distributor baru disetujui' : 'New distributor approved',
            detail: dist.nama_bisnis || 'Unknown',
            time: getTimeAgo(dist.updated_at),
            timestamp: new Date(dist.updated_at),
            actor: 'Admin',
            actorEmail: 'admin@baskit.co.id'
          });
        } else if (dist.approval_status === 'pending' && dist.created_at) {
          allActivities.push({
            id: `approval-pending-${dist.id}`,
            type: 'Approval',
            activity: lang === 'id' ? 'Distributor baru menunggu approval' : 'New distributor pending approval',
            detail: dist.nama_bisnis || 'Unknown',
            time: getTimeAgo(dist.created_at),
            timestamp: new Date(dist.created_at),
            actor: getUserName(dist.user_id),
            actorEmail: getUserEmail(dist.user_id)
          });
        }
      });

      // Fetch products
      const { data: products } = await supabase
        .from('products')
        .select('id, name, created_at, created_by')
        .order('created_at', { ascending: false })
        .limit(50);

      products?.forEach((product: any) => {
        if (product.created_at) {
          allActivities.push({
            id: `product-${product.id}`,
            type: 'Product',
            activity: lang === 'id' ? 'Produk baru ditambahkan' : 'New product added',
            detail: product.name || 'Unknown Product',
            time: getTimeAgo(product.created_at),
            timestamp: new Date(product.created_at),
            actor: getUserName(product.created_by) || 'Admin',
            actorEmail: getUserEmail(product.created_by) || 'admin@baskit.co.id'
          });
        }
      });

      // Fetch orders with distributor info
      const { data: orders } = await supabase
        .from('orders')
        .select('id, distributor_id, total, status, created_at')
        .order('created_at', { ascending: false })
        .limit(50);

      // Get distributor names for orders
      const { data: orderDistributors } = await supabase
        .from('distributor_profiles')
        .select('id, nama_bisnis, user_id');

      orders?.forEach((order: any) => {
        if (order.created_at) {
          const statusText = order.status === 'pending' 
            ? (lang === 'id' ? 'Pesanan baru masuk' : 'New order received')
            : order.status === 'processing'
            ? (lang === 'id' ? 'Pesanan sedang diproses' : 'Order being processed')
            : (lang === 'id' ? 'Pesanan selesai' : 'Order completed');

          const orderDist = orderDistributors?.find((d: any) => d.id === order.distributor_id);
          const actorName = (orderDist as any)?.nama_bisnis || getUserName((orderDist as any)?.user_id) || 'Unknown';

          allActivities.push({
            id: `order-${order.id}`,
            type: 'Order',
            activity: statusText,
            detail: `Order #${order.id?.slice(0, 8)} • ${order.total ? `Rp ${(order.total / 1000000).toFixed(1)} jt` : 'N/A'}`,
            time: getTimeAgo(order.created_at),
            timestamp: new Date(order.created_at),
            actor: actorName,
            actorEmail: getUserEmail((orderDist as any)?.user_id)
          });
        }
      });

      // Sort all activities by timestamp
      allActivities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      setActivities(allActivities);
      setFilteredActivities(allActivities);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setIsLoading(false);
    }
  };
  /* eslint-enable @typescript-eslint/no-explicit-any */

  const getTimeAgo = (dateString: string | null | undefined): string => {
    if (!dateString) return '-';
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return lang === 'id' ? `${seconds} detik lalu` : `${seconds} seconds ago`;
    if (seconds < 3600) return lang === 'id' ? `${Math.floor(seconds / 60)} menit lalu` : `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return lang === 'id' ? `${Math.floor(seconds / 3600)} jam lalu` : `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return lang === 'id' ? `${Math.floor(seconds / 86400)} hari lalu` : `${Math.floor(seconds / 86400)} days ago`;
    
    return date.toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'Approval': return 'bg-green-100 text-green-700';
      case 'Product': return 'bg-blue-100 text-blue-700';
      case 'Order': return 'bg-orange-100 text-orange-700';
      case 'User': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (authLoading || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">{t.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO 
        title={t.allActivities} 
        description={t.allActivitiesDesc}
      />
      <Navbar />
      <div className="flex">
        <AdminSidebar lang={lang} />
        <main className="flex-1 py-8 px-4 lg:px-8">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/admin')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t.backToDashboard}
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{t.allActivities}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {t.totalActivities}: {filteredActivities.length}
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="p-4 mb-6">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{t.filterBy}:</span>
            </div>
            <Button
              variant={filterType === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType('all')}
              className={filterType === 'all' ? 'bg-orange-500 hover:bg-orange-600' : ''}
            >
              {t.all} ({activities.length})
            </Button>
            <Button
              variant={filterType === 'Approval' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType('Approval')}
              className={filterType === 'Approval' ? 'bg-orange-500 hover:bg-orange-600' : ''}
            >
              {t.approvals} ({activities.filter(a => a.type === 'Approval').length})
            </Button>
            <Button
              variant={filterType === 'Product' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType('Product')}
              className={filterType === 'Product' ? 'bg-orange-500 hover:bg-orange-600' : ''}
            >
              {t.products} ({activities.filter(a => a.type === 'Product').length})
            </Button>
            <Button
              variant={filterType === 'Order' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType('Order')}
              className={filterType === 'Order' ? 'bg-orange-500 hover:bg-orange-600' : ''}
            >
              {t.orders} ({activities.filter(a => a.type === 'Order').length})
            </Button>
          </div>
        </Card>

        {/* Activities List */}
        <Card className="p-6">
          {isLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                <p className="text-sm text-muted-foreground">{t.loadingActivities}</p>
              </div>
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">{t.noActivities}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredActivities.map((activity) => (
                <div 
                  key={activity.id} 
                  className="flex items-start gap-3 pb-3 border-b last:border-b-0 hover:bg-gray-50 p-3 rounded-lg transition-colors"
                >
                  <div className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(activity.type)}`}>
                    {activity.type}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{activity.activity}</p>
                    <p className="text-xs text-muted-foreground mt-1">{activity.detail}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <span className="font-medium">By:</span>
                        {activity.actorEmail ? (
                          <span title={activity.actorEmail}>{activity.actor}</span>
                        ) : (
                          <span>{activity.actor}</span>
                        )}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <span className="font-medium">When:</span>
                        {activity.timestamp.toLocaleString(lang === 'id' ? 'id-ID' : 'en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground flex-shrink-0 mt-0.5">
                    {activity.time}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
        </main>
      </div>
    </div>
  );
}

// Translations
const id = {
  allActivities: "Semua Aktivitas",
  allActivitiesDesc: "Lihat semua aktivitas sistem terbaru",
  loading: "Memuat...",
  backToDashboard: "Kembali ke Dashboard",
  totalActivities: "Total aktivitas",
  filterBy: "Filter berdasarkan",
  all: "Semua",
  approvals: "Approval",
  products: "Produk",
  orders: "Pesanan",
  loadingActivities: "Memuat aktivitas...",
  noActivities: "Belum ada aktivitas"
};

const en = {
  allActivities: "All Activities",
  allActivitiesDesc: "View all recent system activities",
  loading: "Loading...",
  backToDashboard: "Back to Dashboard",
  totalActivities: "Total activities",
  filterBy: "Filter by",
  all: "All",
  approvals: "Approvals",
  products: "Products",
  orders: "Orders",
  loadingActivities: "Loading activities...",
  noActivities: "No activities yet"
};
