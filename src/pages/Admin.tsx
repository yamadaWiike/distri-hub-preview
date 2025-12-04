// React & Router
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// External Libraries & Icons
import {
  Package2,
  Users,
  ShoppingBag,
  AlertTriangle,
  UserCheck,
  TrendingUp,
  Download,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

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

export default function Admin() {
  const { lang } = useLanguage();
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const t = lang === 'id' ? id : en;

  // Real data states
  const [stats, setStats] = useState({
    totalDistributors: 0,
    pendingApprovals: 0,
    totalProducts: 0,
    activeOrders: 0,
    distributorGrowth: 0,
    orderGrowth: 0
  });
  const [monthlyData, setMonthlyData] = useState<Array<{month: string, value: number}>>([]);
  const [areaDistributors, setAreaDistributors] = useState<Array<{name: string, count: number, percentage: string}>>([]);
  const [topDistributors, setTopDistributors] = useState<Array<{name: string, location: string, revenue: string}>>([]);
  const [recentActivities, setRecentActivities] = useState<Array<{type: string, activity: string, detail: string, time: string, actor: string, actorEmail?: string, timestamp: Date}>>([]);
  const [exportStats, setExportStats] = useState({ thisWeek: 0, thisMonth: 0 });
  const [financialStats, setFinancialStats] = useState({ totalRevenue: 0, avgOrderValue: 0 });
  const [loadingData, setLoadingData] = useState(true);

  // Fetch real data
  /* eslint-disable @typescript-eslint/no-explicit-any */
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoadingData(true);

        // Fetch distributors
        const { data: distributors } = await supabase
          .from('distributor_profiles')
          .select('*');

        const totalDist = distributors?.length || 0;
        const pending = distributors?.filter((d: any) => d.approval_status === 'pending').length || 0;
        const approved = distributors?.filter((d: any) => d.approval_status === 'approved').length || 0;

        // Fetch products
        const { data: products } = await supabase
          .from('products')
          .select('id, name, created_at');

        // Fetch orders
        const { data: orders } = await supabase
          .from('orders')
          .select('*');

        const activeOrders = orders?.filter((o: any) => o.status === 'pending' || o.status === 'processing').length || 0;

        // Calculate monthly registration trend
        const now = new Date();
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
        const monthlyTrend = [];
        
        for (let i = 5; i >= 0; i--) {
          const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthName = monthNames[monthDate.getMonth()];
          const count = distributors?.filter((d: any) => {
            if (!d.created_at) return false;
            const createdDate = new Date(d.created_at);
            return createdDate.getMonth() === monthDate.getMonth() && 
                   createdDate.getFullYear() === monthDate.getFullYear();
          }).length || 0;
          monthlyTrend.push({ month: monthName, value: count });
        }

        // Calculate area distribution
        const areaCounts: Record<string, number> = {};
        distributors?.forEach((d: any) => {
          if (d.kota) {
            const city = d.kota.split(',')[0].trim();
            areaCounts[city] = (areaCounts[city] || 0) + 1;
          }
        });

        const sortedAreas = Object.entries(areaCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3)
          .map(([name, count]) => ({
            name,
            count,
            percentage: `(${Math.round((count / totalDist) * 100)}%)`
          }));

        // Calculate top distributors by order value
        const distributorOrders: Record<string, { total: number, count: number, name: string, city: string }> = {};
        
        orders?.forEach((order: any) => {
          if (order.distributor_id) {
            const dist: any = distributors?.find((d: any) => d.id === order.distributor_id);
            if (dist && order.total) {
              if (!distributorOrders[order.distributor_id]) {
                distributorOrders[order.distributor_id] = {
                  total: 0,
                  count: 0,
                  name: dist.nama_bisnis || 'Unknown',
                  city: dist.kota || 'Unknown'
                };
              }
              distributorOrders[order.distributor_id].total += order.total;
              distributorOrders[order.distributor_id].count += 1;
            }
          }
        });

        const topDist = Object.values(distributorOrders)
          .sort((a, b) => b.total - a.total)
          .slice(0, 2)
          .map(d => ({
            name: d.name,
            location: `${d.count} Orders`,
            revenue: `Rp ${(d.total / 1000000).toFixed(1)} jt`
          }));

        // Calculate recent activities
        const activities = [];
        
        // Recent approvals (last 5)
        const recentApprovals = distributors
          ?.filter((d: any) => d.approval_status === 'approved' && d.updated_at)
          .sort((a: any, b: any) => new Date(b.updated_at!).getTime() - new Date(a.updated_at!).getTime())
          .slice(0, 2);
        
        recentApprovals?.forEach((approval: any) => {
          activities.push({
            type: 'Approval',
            activity: 'Distributor baru disetujui',
            detail: approval.nama_bisnis || 'Unknown',
            time: getTimeAgo(approval.updated_at),
            actor: 'Admin',
            actorEmail: 'admin@baskit.co.id',
            timestamp: new Date(approval.updated_at)
          });
        });

        // Recent pending approvals
        const pendingApprovals = distributors
          ?.filter((d: any) => d.approval_status === 'pending' && d.created_at)
          .sort((a: any, b: any) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime())
          .slice(0, 1);
        
        pendingApprovals?.forEach((pending: any) => {
          activities.push({
            type: 'Approval',
            activity: 'Distributor baru menunggu approval',
            detail: pending.nama_bisnis || 'Unknown',
            time: getTimeAgo(pending.created_at),
            actor: getUserName(pending.user_id),
            actorEmail: getUserEmail(pending.user_id),
            timestamp: new Date(pending.created_at)
          });
        });

        // Recent products (last 5)
        const recentProducts = products
          ?.sort((a: any, b: any) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime())
          .slice(0, 2);

        recentProducts?.forEach((product: any) => {
          activities.push({
            type: 'Product',
            activity: 'Produk baru ditambahkan',
            detail: product.name || 'Unknown Product',
            time: getTimeAgo(product.created_at),
            actor: 'Admin',
            actorEmail: 'admin@baskit.co.id',
            timestamp: new Date(product.created_at)
          });
        });

        // Recent orders (last 5)
        const recentOrders = orders
          ?.sort((a: any, b: any) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime())
          .slice(0, 2);

        recentOrders?.forEach((order: any) => {
          const statusText = order.status === 'pending' 
            ? 'Pesanan baru masuk'
            : order.status === 'processing'
            ? 'Pesanan sedang diproses'
            : 'Pesanan selesai';

          const orderDist: any = distributors?.find((d: any) => d.id === order.distributor_id);
          const actorName = orderDist?.nama_bisnis || 'Unknown';

          activities.push({
            type: 'Order',
            activity: statusText,
            detail: `Order #${order.id?.slice(0, 8)} • ${order.total ? `Rp ${(order.total / 1000000).toFixed(1)} jt` : 'N/A'}`,
            time: getTimeAgo(order.created_at),
            actor: actorName,
            actorEmail: orderDist?.email_pemilik,
            timestamp: new Date(order.created_at)
          });
        });

        // Sort all activities by most recent and take top 6
        const sortedActivities = activities
          .sort((a, b) => {
            // We need to convert time strings back to timestamps for accurate sorting
            // For now, we'll keep them in the order they were added since we're pulling the most recent from each category
            return 0;
          })
          .slice(0, 6);

        // Calculate financial stats
        const totalRevenue = orders?.reduce((sum: number, order: any) => sum + (order.total || 0), 0) || 0;
        const avgOrder = orders && orders.length > 0 ? totalRevenue / orders.length : 0;

        // Calculate export stats (using products created this week/month)
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        
        const thisWeekProducts = products?.filter((p: any) => p.created_at && new Date(p.created_at) >= oneWeekAgo).length || 0;
        const thisMonthProducts = products?.filter((p: any) => p.created_at && new Date(p.created_at) >= oneMonthAgo).length || 0;

        // Calculate growth percentages
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthDist = distributors?.filter((d: any) => {
          if (!d.created_at) return false;
          const created = new Date(d.created_at);
          return created >= lastMonth && created < new Date(now.getFullYear(), now.getMonth(), 1);
        }).length || 0;

        const thisMonthDist = distributors?.filter((d: any) => {
          if (!d.created_at) return false;
          const created = new Date(d.created_at);
          return created >= new Date(now.getFullYear(), now.getMonth(), 1);
        }).length || 0;

        const distGrowth = lastMonthDist > 0 ? Math.round(((thisMonthDist - lastMonthDist) / lastMonthDist) * 100) : 0;

        const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const thisWeekOrders = orders?.filter((o: any) => o.created_at && new Date(o.created_at) >= lastWeek).length || 0;
        const previousWeekOrders = orders?.filter((o: any) => {
          if (!o.created_at) return false;
          const created = new Date(o.created_at);
          const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
          return created >= twoWeeksAgo && created < lastWeek;
        }).length || 0;

        const orderGrowth = previousWeekOrders > 0 ? Math.round(((thisWeekOrders - previousWeekOrders) / previousWeekOrders) * 100) : 0;

        setStats({
          totalDistributors: totalDist,
          pendingApprovals: pending,
          totalProducts: products?.length || 0,
          activeOrders,
          distributorGrowth: distGrowth,
          orderGrowth
        });

        setMonthlyData(monthlyTrend);
        setAreaDistributors(sortedAreas);
        setTopDistributors(topDist);
        setRecentActivities(sortedActivities);
        setExportStats({ thisWeek: thisWeekProducts, thisMonth: thisMonthProducts });
        setFinancialStats({ 
          totalRevenue: totalRevenue / 1000000, 
          avgOrderValue: avgOrder / 1000000 
        });

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoadingData(false);
      }
    };

    if (isAdmin) {
      fetchDashboardData();
    }
  }, [isAdmin]);
  /* eslint-enable @typescript-eslint/no-explicit-any */

  const getTimeAgo = (dateString: string | null | undefined): string => {
    if (!dateString) return '-';
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return `${seconds} detik lalu`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} menit lalu`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} jam lalu`;
    return `${Math.floor(seconds / 86400)} hari lalu`;
  };
  
  useEffect(() => {
    // Check if user is admin using server-side role management
    const checkAdmin = async () => {
      if (!isLoading && user) {
        // Use server-side role from JWT token app_metadata
        // This is set by Supabase Auth and cannot be manipulated client-side
        setIsAdmin(user.role === 'admin');
      }
    };
    
    checkAdmin();
  }, [user, isLoading]);
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/masuk", { 
        state: { 
          from: "/admin",
          message: t.loginRequired 
        } 
      });
    }
  }, [user, isLoading, navigate, t.loginRequired]);
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">{t.loading}</p>
        </div>
      </div>
    );
  }
  
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <SEO 
          title={t.accessDenied} 
          description={t.adminAccessOnly}
        />
        <Navbar />
        <main className="container max-w-md mx-auto py-20">
          <Card className="p-6 space-y-4 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500" />
            <h1 className="text-2xl font-bold">{t.accessDenied}</h1>
            <p className="text-muted-foreground">
              {t.adminAccessRequired}
            </p>
            <Button onClick={() => navigate("/")}>
              {t.backToHome}
            </Button>
          </Card>
        </main>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <SEO 
        title={t.adminDashboard} 
        description={t.adminAreaDescription}
      />
      <Navbar />
      <div className="flex">
        <AdminSidebar lang={lang} />
        <main className="flex-1 py-8 px-4 lg:px-8 space-y-6">
        {/* Welcome Header */}
        <div className="bg-white rounded-lg border p-6">
          <h1 className="text-xl font-bold mb-1">
            {t.welcome} 👋
          </h1>
          <p className="text-sm text-muted-foreground">
            {t.welcomeMessage}
          </p>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-base font-semibold mb-3">{t.quickActions}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card 
              className="p-5 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate('/admin/users')}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1">{t.manageUsers}</h3>
                  <p className="text-xs text-muted-foreground">{t.manageUsersDesc}</p>
                </div>
              </div>
            </Card>
            
            <Card 
              className="p-5 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate('/admin/products')}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Package2 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1">{t.manageProducts}</h3>
                  <p className="text-xs text-muted-foreground">{t.manageProductsDesc}</p>
                </div>
              </div>
            </Card>
            
            <Card 
              className="p-5 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate('/admin/distributors')}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <UserCheck className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1">{t.manageDistributors}</h3>
                  <p className="text-xs text-muted-foreground">{t.manageDistributorsDesc}</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded bg-orange-100 flex items-center justify-center">
                <UserCheck className="h-4 w-4 text-orange-600" />
              </div>
              {stats.distributorGrowth !== 0 && (
                <span className={`text-xs font-medium ${stats.distributorGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.distributorGrowth > 0 ? '+' : ''}{stats.distributorGrowth}% bulan ini
                </span>
              )}
            </div>
            <h3 className="text-xs text-muted-foreground mb-1">{t.totalDistributor}</h3>
            <p className="text-2xl font-bold">{loadingData ? '-' : stats.totalDistributors}</p>
            <p className="text-xs text-muted-foreground mt-1">Aktif</p>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded bg-yellow-100 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
              </div>
            </div>
            <h3 className="text-xs text-muted-foreground mb-1">{t.pendingApprovals}</h3>
            <p className="text-2xl font-bold">{loadingData ? '-' : stats.pendingApprovals}</p>
            <p className="text-xs text-muted-foreground mt-1">Perlu review</p>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center">
                <Package2 className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            <h3 className="text-xs text-muted-foreground mb-1">{t.totalProducts}</h3>
            <p className="text-2xl font-bold">{loadingData ? '-' : stats.totalProducts}</p>
            <p className="text-xs text-muted-foreground mt-1">SKU aktif</p>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded bg-green-100 flex items-center justify-center">
                <ShoppingBag className="h-4 w-4 text-green-600" />
              </div>
              {stats.orderGrowth !== 0 && (
                <span className={`text-xs font-medium ${stats.orderGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.orderGrowth > 0 ? '+' : ''}{stats.orderGrowth}% minggu ini
                </span>
              )}
            </div>
            <h3 className="text-xs text-muted-foreground mb-1">{t.activeOrders}</h3>
            <p className="text-2xl font-bold">{loadingData ? '-' : stats.activeOrders}</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Monthly Trend Chart */}
            <Card className="p-6">
              <h3 className="text-sm font-semibold mb-4">{t.monthlyTrend}</h3>
              {loadingData ? (
                <div className="h-[200px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Bar dataKey="value" fill="#FF6B35" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>

            {/* Export Catalog */}
            <Card className="p-6">
              <h3 className="text-sm font-semibold mb-3">{t.exportCatalog}</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-left">
                  <p className="text-xs text-muted-foreground mb-1">{t.thisWeek}</p>
                  <p className="text-2xl font-bold">{loadingData ? '-' : exportStats.thisWeek}</p>
                </div>
                <div className="text-left">
                  <p className="text-xs text-muted-foreground mb-1">{t.thisMonth}</p>
                  <p className="text-2xl font-bold">{loadingData ? '-' : exportStats.thisMonth}</p>
                </div>
              </div>
            </Card>

            {/* Recent Activity */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold">{t.recentActivity}</h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs h-8"
                  onClick={() => navigate('/admin/activities')}
                >
                  {t.viewAll} →
                </Button>
              </div>
              {loadingData ? (
                <div className="h-32 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                </div>
              ) : recentActivities.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  Belum ada aktivitas
                </div>
              ) : (
                <div className="space-y-3">
                  {recentActivities.map((activity, idx) => (
                    <div key={idx} className="flex items-start gap-3 pb-3 border-b last:border-b-0">
                      <div className="flex-shrink-0 px-2 py-1 bg-gray-100 rounded text-xs font-medium">
                        {activity.type}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{activity.activity}</p>
                        <p className="text-xs text-muted-foreground truncate">{activity.detail}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <span className="font-medium">By:</span>
                            {activity.actorEmail ? (
                              <span title={activity.actorEmail}>{activity.actor}</span>
                            ) : (
                              <span>{activity.actor}</span>
                            )}
                          </span>
                          <span>•</span>
                          <span>{activity.time}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Button 
                variant="link" 
                className="w-full mt-3 text-orange-600 text-xs h-8"
                onClick={() => navigate('/admin/activities')}
              >
                {t.viewAllActivity}
              </Button>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Area Distributor Insights */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold">{t.insights}</h3>
              </div>
              {loadingData ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">{t.areaDistributor}</p>
                    {areaDistributors.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">Belum ada data</p>
                    ) : (
                      <>
                        {areaDistributors.map((area, idx) => (
                          <div key={idx} className="flex items-center justify-between py-2">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{idx + 1}</span>
                              <span className="text-sm">{area.name}</span>
                            </div>
                            <div className="text-right">
                              <span className="font-semibold text-sm">{area.count}</span>
                              <span className="text-xs text-muted-foreground ml-1">{area.percentage}</span>
                            </div>
                          </div>
                        ))}
                        <Button variant="link" className="w-full text-orange-600 text-xs h-8 mt-2">
                          {t.viewMore}
                        </Button>
                      </>
                    )}
                  </div>

                  <div className="pt-4 border-t">
                    <p className="text-xs text-muted-foreground mb-3">{t.topDistributor}</p>
                    {topDistributors.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">Belum ada data</p>
                    ) : (
                      topDistributors.map((dist, idx) => (
                        <div key={idx} className="flex items-start justify-between py-2 border-b last:border-b-0">
                          <div className="flex items-start gap-2">
                            <span className="text-sm font-semibold">{idx + 1}</span>
                            <div>
                              <p className="text-sm font-medium">{dist.name}</p>
                              <p className="text-xs text-muted-foreground">{dist.location}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-semibold">{dist.revenue}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="pt-4 border-t">
                    <p className="text-xs font-semibold mb-1">{t.totalRevenue}</p>
                    <p className="text-lg font-bold">
                      Rp {financialStats.totalRevenue.toFixed(1)} jt
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{t.avgOrderValue}</p>
                    <p className="text-base font-semibold">
                      Rp {financialStats.avgOrderValue.toFixed(1)} jt
                    </p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
        </main>
      </div>
    </div>
  );
}

// Translations
const id = {
  adminDashboard: "Dashboard Admin",
  adminAreaDescription: "Area internal untuk mengelola SKU, pengguna, dan pesanan distributor.",
  loading: "Memuat...",
  accessDenied: "Akses Ditolak",
  adminAccessOnly: "Hanya admin yang dapat mengakses halaman ini.",
  adminAccessRequired: "Anda perlu memiliki hak akses admin untuk mengakses halaman ini.",
  backToHome: "Kembali ke Beranda",
  loginRequired: "Login diperlukan untuk mengakses halaman admin.",
  welcome: "Selamat datang kembali, Admin Baskit",
  welcomeMessage: "Kelola produk, distributor, pengguna, dan pesanan dalam satu tempat.",
  quickActions: "Aksi Cepat",
  manageUsers: "Manage Users",
  manageUsersDesc: "Kelola hak akses user-user ini",
  manageProducts: "Manage Products",
  manageProductsDesc: "Kelola katalog produk",
  manageDistributors: "Manage Distributors",
  manageDistributorsDesc: "Approval distributor baru",
  totalDistributor: "Total Distributor",
  pendingApprovals: "Pending Approvals",
  totalProducts: "Total Products",
  activeOrders: "Active Orders",
  monthlyTrend: "Tren Registrasi Bulanan Distributor",
  exportCatalog: "Ekspor Katalog",
  thisWeek: "Minggu Ini",
  thisMonth: "Bulan Ini",
  recentActivity: "Recent Activity",
  viewAll: "Semua Aktivitas",
  viewAllActivity: "Lihat Semua Data (7)",
  insights: "Insights",
  areaDistributor: "Area Distributor",
  viewMore: "Lihat Semua (8)",
  topDistributor: "Top Distributor",
  totalRevenue: "Total Revenue",
  avgOrderValue: "Avg. Order Value"
};

const en = {
  adminDashboard: "Admin Dashboard",
  adminAreaDescription: "Internal area to manage SKUs, users, and distributor orders.",
  loading: "Loading...",
  accessDenied: "Access Denied",
  adminAccessOnly: "Only admins can access this page.",
  adminAccessRequired: "You need admin privileges to access this page.",
  backToHome: "Back to Home",
  loginRequired: "Login required to access admin page.",
  welcome: "Welcome back, Admin Baskit",
  welcomeMessage: "Manage products, distributors, users, and orders in one place.",
  quickActions: "Quick Actions",
  manageUsers: "Manage Users",
  manageUsersDesc: "Manage user access rights",
  manageProducts: "Manage Products",
  manageProductsDesc: "Manage product catalog",
  manageDistributors: "Manage Distributors",
  manageDistributorsDesc: "Approve new distributors",
  totalDistributor: "Total Distributor",
  pendingApprovals: "Pending Approvals",
  totalProducts: "Total Products",
  activeOrders: "Active Orders",
  monthlyTrend: "Monthly Distributor Registration Trend",
  exportCatalog: "Export Catalog",
  thisWeek: "This Week",
  thisMonth: "This Month",
  recentActivity: "Recent Activity",
  viewAll: "All Activities",
  viewAllActivity: "View All Data (7)",
  insights: "Insights",
  areaDistributor: "Distributor Area",
  viewMore: "View All (8)",
  topDistributor: "Top Distributor",
  totalRevenue: "Total Revenue",
  avgOrderValue: "Avg. Order Value"
};
