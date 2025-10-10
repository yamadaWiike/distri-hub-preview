import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, 
  UserPlus, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  BarChart3,
  Activity,
  MapPin
} from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';

// Types (simplified without status)
type DistributorStats = {
  total: number;
  newThisWeek: number;
  newThisMonth: number;
  activeLastMonth: number;
};

// Export analytics
type ExportStats = {
  total: number;
  thisWeek: number;
  thisMonth: number;
  byArea: { area: string; count: number }[];
  byUser: { user_id: string; business_name: string; count: number }[];
};

// Order analytics
type OrderStats = {
  total: number;
  pending: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
};

import { CatalogExportData, OrderStatus } from '@/utils/analytics';

// Catalog export type
type CatalogExport = CatalogExportData & {
  id: string;
  created_at: string;
};

// Order type for analytics
type OrderAnalytics = {
  id: string;
  order_number: string;
  distributor_id: string;
  status: OrderStatus;
  total_amount: number;
  created_at: string;
};

type MonthlyRegistration = {
  month: string;
  count: number;
  year: number;
};

type RegionStats = {
  province: string;
  count: number;
};

type DistributorProfile = {
  id: string;
  business_name: string;
  province: string;
  created_at: string;
  updated_at: string;
};

const DistributorAnalytics = () => {
  const { toast } = useToast();
  const { lang } = useLanguage();
  const t = lang === 'id' ? translations.id : translations.en;
  
  const [distributors, setDistributors] = useState<DistributorProfile[]>([]);
  const [stats, setStats] = useState<DistributorStats>({
    total: 0,
    newThisWeek: 0,
    newThisMonth: 0,
    activeLastMonth: 0
  });
  const [exportStats, setExportStats] = useState<ExportStats>({
    total: 0,
    thisWeek: 0,
    thisMonth: 0,
    byArea: [],
    byUser: []
  });
  const [orderStats, setOrderStats] = useState<OrderStats>({
    total: 0,
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0
  });
  const [monthlyData, setMonthlyData] = useState<MonthlyRegistration[]>([]);
  const [regionData, setRegionData] = useState<RegionStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Date filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  // Fetch distributors data
  const fetchDistributors = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('distributor_profiles')
        .select(`
          id, 
          business_name, 
          nama_bisnis,
          province, 
          kota,
          created_at, 
          updated_at
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Transform data to handle mixed schema
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const transformedData = (data || []).map((profile: any) => ({
        id: profile.id,
        business_name: profile.business_name || profile.nama_bisnis || 'Unknown Business',
        province: profile.province || profile.kota || 'Unknown Province',
        created_at: profile.created_at,
        updated_at: profile.updated_at
      }));
      
      setDistributors(transformedData);
      calculateStats(transformedData);
      calculateMonthlyData(transformedData);
      calculateRegionData(transformedData);
      
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

  // Calculate statistics
  const calculateStats = (data: DistributorProfile[]) => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const newThisWeek = data.filter(d => 
      new Date(d.created_at) >= oneWeekAgo
    ).length;
    
    const newThisMonth = data.filter(d => 
      new Date(d.created_at) >= oneMonthAgo
    ).length;
    
    const activeLastMonth = data.filter(d => 
      new Date(d.updated_at) >= oneMonthAgo
    ).length;
    
    setStats({
      total: data.length,
      newThisWeek,
      newThisMonth,
      activeLastMonth
    });
  };

  // Calculate monthly registration data
  const calculateMonthlyData = (data: DistributorProfile[]) => {
    const monthlyMap = new Map<string, number>();
    
    data.forEach(distributor => {
      const date = new Date(distributor.created_at);
      const year = date.getFullYear();
      const month = date.getMonth();
      const key = `${year}-${month}`;
      
      monthlyMap.set(key, (monthlyMap.get(key) || 0) + 1);
    });
    
    const monthlyArray: MonthlyRegistration[] = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const year = date.getFullYear();
      const month = date.getMonth();
      const key = `${year}-${month}`;
      
      monthlyArray.push({
        month: date.toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { month: 'short' }),
        count: monthlyMap.get(key) || 0,
        year
      });
    }
    
    setMonthlyData(monthlyArray);
  };

  // Calculate region distribution
  const calculateRegionData = (data: DistributorProfile[]) => {
    const regionMap = new Map<string, number>();
    
    data.forEach(distributor => {
      const province = distributor.province || 'Unknown';
      regionMap.set(province, (regionMap.get(province) || 0) + 1);
    });
    
    const regionArray = Array.from(regionMap.entries())
      .map(([province, count]) => ({ province, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 provinces
    
    setRegionData(regionArray);
  };

  // Filter data by date range
  const filterByDateRange = () => {
    if (!dateFrom && !dateTo) {
      // If no date filters, show all data
      calculateStats(distributors);
      calculateMonthlyData(distributors);
      // Also reload export and order stats without filters
      fetchExportStats();
      fetchOrderStats();
      return;
    }
    
    const fromDate = dateFrom ? new Date(dateFrom) : new Date(0); // Default to epoch start if not specified
    const toDate = dateTo ? new Date(dateTo) : new Date(); // Default to today if not specified
    
    // Add one day to toDate to include the selected day in results (up to 23:59:59)
    toDate.setDate(toDate.getDate() + 1); 
    
    // Filter distributors
    const filteredDistributors = distributors.filter(d => {
      const createdDate = new Date(d.created_at);
      return createdDate >= fromDate && createdDate < toDate;
    });
    
    calculateStats(filteredDistributors);
    calculateMonthlyData(filteredDistributors);
    
    // Also refetch export and order stats with date filters
    // Cast as any to avoid TypeScript errors with the function signatures
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (fetchExportStats as any)(fromDate, toDate);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (fetchOrderStats as any)(fromDate, toDate);
  };

  // Calculate growth percentage
  const calculateGrowthPercentage = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  // Fetch catalog export statistics
  const fetchExportStats = async (fromDate?: Date, toDate?: Date) => {
    try {
      // Start query builder for exports - use simpler query without joins first
      let query = supabase
        .from('catalog_exports')
        .select('*');
      
      // Apply date filters if provided
      if (fromDate) {
        query = query.gte('exported_at', fromDate.toISOString());
      }
      
      if (toDate) {
        query = query.lt('exported_at', toDate.toISOString());
      }
      
      // Complete query with ordering
      const { data, error: exportsError } = await query.order('exported_at', { ascending: false });
      
      if (exportsError) throw exportsError;
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const exports = (data || []) as any[];
      
      if (exports.length > 0) {
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        
        // Calculate export statistics
        const thisWeek = exports.filter(exp => 
          new Date(exp.exported_at) >= oneWeekAgo
        ).length;
        
        const thisMonth = exports.filter(exp => 
          new Date(exp.exported_at) >= oneMonthAgo
        ).length;
        
        // Group by area
        const areaMap = new Map<string, number>();
        exports.forEach(exp => {
          const area = exp.area || 'all';
          areaMap.set(area, (areaMap.get(area) || 0) + 1);
        });
        
        const areaStats = Array.from(areaMap.entries())
          .map(([area, count]) => ({ area, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5); // Top 5 areas
        
        // Group by user
        const userMap = new Map<string, {count: number, business_name: string}>();
        exports.forEach(exp => {
          const userId = exp.user_id || 'unknown';
          
          // Since we're not joining with distributor_profiles anymore, 
          // we'll show user IDs for now and fetch names separately if needed
          const displayName = `User ${userId.substring(0, 8)}...`;
          
          if (!userMap.has(userId)) {
            userMap.set(userId, {count: 1, business_name: displayName});
          } else {
            const current = userMap.get(userId)!;
            userMap.set(userId, {
              count: current.count + 1,
              business_name: current.business_name
            });
          }
        });
        
        const userStats = Array.from(userMap.entries())
          .map(([user_id, data]) => ({ 
            user_id, 
            business_name: data.business_name,
            count: data.count
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10); // Top 10 users
        
        setExportStats({
          total: exports.length,
          thisWeek,
          thisMonth,
          byArea: areaStats,
          byUser: userStats
        });
      } else {
        // Reset stats when no exports are found
        setExportStats({
          total: 0,
          thisWeek: 0,
          thisMonth: 0,
          byArea: [],
          byUser: []
        });
      }
    } catch (error) {
      console.error('Error fetching export stats:', error);
      
      // Set default empty state to prevent UI from breaking
      setExportStats({
        total: 0,
        thisWeek: 0,
        thisMonth: 0,
        byArea: [],
        byUser: []
      });
      
      // Show more detailed error message
      toast({
        title: t.errorFetching,
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive"
      });
    }
  };
  
  // Fetch order statistics
  const fetchOrderStats = async (fromDate?: Date, toDate?: Date) => {
    try {
      // Start query builder
      let query = supabase
        .from('orders')
        .select('*');
      
      // Apply date filters if provided
      if (fromDate) {
        query = query.gte('created_at', fromDate.toISOString());
      }
      
      if (toDate) {
        query = query.lt('created_at', toDate.toISOString());
      }
      
      // Complete the query
      const { data, error: ordersError } = await query;
      
      if (ordersError) throw ordersError;
      
      const orders = data as OrderAnalytics[] || [];
      
      if (orders.length > 0) {
        // Calculate order statistics by status
        const pending = orders.filter(order => order.status === 'pending').length;
        const processing = orders.filter(order => order.status === 'processing').length;
        const shipped = orders.filter(order => order.status === 'shipped').length;
        const delivered = orders.filter(order => order.status === 'delivered').length;
        const cancelled = orders.filter(order => order.status === 'cancelled').length;
        
        setOrderStats({
          total: orders.length,
          pending,
          processing,
          shipped,
          delivered,
          cancelled
        });
      } else {
        // Set default values when no orders are found
        setOrderStats({
          total: 0,
          pending: 0,
          processing: 0,
          shipped: 0,
          delivered: 0,
          cancelled: 0
        });
      }
    } catch (error) {
      console.error('Error fetching order stats:', error);
      
      // Set default values to prevent UI from breaking
      setOrderStats({
        total: 0,
        pending: 0,
        processing: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0
      });
      
      toast({
        title: t.errorFetching,
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchDistributors();
    fetchExportStats();
    fetchOrderStats();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    filterByDateRange();
  }, [dateFrom, dateTo]); // eslint-disable-line react-hooks/exhaustive-deps

  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t.distributorAnalytics}</h2>
          <p className="text-muted-foreground">{t.comprehensiveAnalytics}</p>
        </div>
        <BarChart3 className="h-8 w-8 text-muted-foreground" />
      </div>

      {/* Date Range Filters */}
      <Card>
        <CardHeader>
          <CardTitle>{t.filters}</CardTitle>
          <CardDescription>{t.filterDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateFrom">{t.fromDate}</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateTo">{t.toDate}</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="year">{t.year}</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map(year => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                onClick={() => {setDateFrom(''); setDateTo('');}} 
                variant="outline"
                className="w-full"
              >
                {t.clearFilters}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.totalDistributors}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">{t.allTimeRegistrations}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.newRegistrations}</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.newThisMonth}</div>
            <div className="flex items-center text-xs">
              {stats.newThisMonth > stats.activeLastMonth ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              <span className="text-muted-foreground">{t.thisMonth}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.weeklyGrowth}</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.newThisWeek}</div>
            <p className="text-xs text-muted-foreground">{t.newThisWeek}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.activeDistributors}</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeLastMonth}</div>
            <p className="text-xs text-muted-foreground">{t.activeLastMonth}</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Catalog Export Analytics */}
      <h3 className="text-lg font-semibold mt-6 mb-2">{t.catalogExports}</h3>
      <p className="text-sm text-muted-foreground mb-4">{t.exportAnalyticsDesc}</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.catalogExports}</CardTitle>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{exportStats.total}</div>
            <div className="flex justify-between mt-1">
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-emerald-500 mr-1">{exportStats.thisWeek}</span> {t.exportsThisWeek}
              </p>
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-emerald-500 mr-1">{exportStats.thisMonth}</span> {t.exportsThisMonth}
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-1 md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.topExportAreas}</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {exportStats.byArea.map((area, idx) => (
                <div key={idx} className="flex items-center">
                  <div className="w-36 truncate mr-2">{area.area}</div>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.round((area.count / Math.max(...exportStats.byArea.map(a => a.count))) * 100))}%` }}
                    />
                  </div>
                  <span className="ml-2 text-sm font-medium">{area.count}</span>
                </div>
              ))}
              {exportStats.byArea.length === 0 && (
                <p className="text-sm text-muted-foreground">{t.noExportData}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Per-User Export Analytics */}
      <h4 className="text-md font-semibold mt-6 mb-2">{t.exportsPerDistributor}</h4>
      <Card>
        <CardHeader>
          <CardTitle>{t.topExportDistributors}</CardTitle>
          <CardDescription>{t.distributorsWithMostExports}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {exportStats.byUser.map((user, index) => {
              const percentage = exportStats.total > 0 ? Math.round((user.count / exportStats.total) * 100) : 0;
              
              return (
                <div key={user.user_id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-semibold">
                      {index + 1}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium truncate max-w-[200px]">{user.business_name}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">{user.count} {t.exports}</span>
                    <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold w-8">{percentage}%</span>
                  </div>
                </div>
              );
            })}
            {exportStats.byUser.length === 0 && (
              <p className="text-sm text-muted-foreground py-4">{t.noExportData}</p>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Order Analytics */}
      <h3 className="text-lg font-semibold mt-6 mb-2">{t.orderAnalytics}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.orders}</CardTitle>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orderStats.total}</div>
            <p className="text-xs text-muted-foreground">{t.ordersByStatus}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.pending}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orderStats.pending}</div>
            <p className="text-xs text-muted-foreground">
              {orderStats.total > 0 ? Math.round((orderStats.pending / orderStats.total) * 100) : 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.processing}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orderStats.processing}</div>
            <p className="text-xs text-muted-foreground">
              {orderStats.total > 0 ? Math.round((orderStats.processing / orderStats.total) * 100) : 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.shipped}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orderStats.shipped}</div>
            <p className="text-xs text-muted-foreground">
              {orderStats.total > 0 ? Math.round((orderStats.shipped / orderStats.total) * 100) : 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.delivered}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orderStats.delivered}</div>
            <p className="text-xs text-muted-foreground">
              {orderStats.total > 0 ? Math.round((orderStats.delivered / orderStats.total) * 100) : 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.cancelled}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orderStats.cancelled}</div>
            <p className="text-xs text-muted-foreground">
              {orderStats.total > 0 ? Math.round((orderStats.cancelled / orderStats.total) * 100) : 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Registration Trends */}
      <Card>
        <CardHeader>
          <CardTitle>{t.monthlyRegistrationTrends}</CardTitle>
          <CardDescription>{t.registrationTrendsDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-64 flex items-end justify-between bg-muted/20 rounded p-4">
              {monthlyData.map((data, index) => {
                const maxCount = Math.max(...monthlyData.map(d => d.count));
                const height = maxCount > 0 ? (data.count / maxCount) * 200 : 0;
                
                return (
                  <div key={index} className="flex flex-col items-center space-y-2">
                    <div 
                      className="bg-primary rounded-t w-8 min-h-[4px] flex items-end justify-center"
                      style={{ height: `${height}px` }}
                    >
                      {data.count > 0 && (
                        <span className="text-xs text-primary-foreground font-semibold mb-1">
                          {data.count}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {data.month}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Regional Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>{t.regionalDistribution}</CardTitle>
          <CardDescription>{t.topProvinces}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {regionData.map((region, index) => {
              const percentage = stats.total > 0 ? Math.round((region.count / stats.total) * 100) : 0;
              
              return (
                <div key={region.province} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-semibold">
                      {index + 1}
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{region.province}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">{region.count} distributors</span>
                    <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold w-8">{percentage}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Translations
const translations = {
  id: {
    distributorAnalytics: "Analitik Distributor",
    comprehensiveAnalytics: "Data analitik komprehensif untuk manajemen distributor",
    filters: "Filter",
    filterDescription: "Filter data berdasarkan rentang tanggal dan tahun",
    fromDate: "Dari Tanggal",
    toDate: "Sampai Tanggal",
    year: "Tahun",
    clearFilters: "Hapus Filter",
    totalDistributors: "Total Distributor",
    allTimeRegistrations: "registrasi sepanjang waktu",
    newRegistrations: "Registrasi Baru",
    thisMonth: "bulan ini",
    weeklyGrowth: "Pertumbuhan Mingguan",
    newThisWeek: "baru minggu ini",
    activeDistributors: "Distributor Aktif",
    activeLastMonth: "aktif bulan lalu",
    monthlyRegistrationTrends: "Tren Registrasi Bulanan",
    registrationTrendsDescription: "Grafik registrasi distributor baru per bulan",
    regionalDistribution: "Distribusi Regional",
    topProvinces: "10 provinsi teratas berdasarkan jumlah distributor",
    errorFetching: "Gagal Memuat Data",
    catalogExports: "Ekspor Katalog",
    exportAnalytics: "Analitik Ekspor",
    exportAnalyticsDesc: "Analitik ekspor katalog produk oleh distributor",
    exportsByArea: "Ekspor per Area",
    totalExports: "Total Ekspor",
    exportsThisWeek: "ekspor minggu ini",
    exportsThisMonth: "ekspor bulan ini",
    orders: "Pesanan",
    orderAnalytics: "Analitik Pesanan",
    ordersByStatus: "Pesanan per Status",
    pending: "Menunggu",
    processing: "Diproses",
    shipped: "Dikirim",
    delivered: "Diterima",
    cancelled: "Dibatalkan",
    topExportAreas: "Area Ekspor Teratas",
    exportsPerDistributor: "Ekspor per Distributor",
    topExportDistributors: "Distributor dengan Ekspor Terbanyak",
    distributorsWithMostExports: "Daftar distributor dengan ekspor katalog terbanyak",
    noExportData: "Tidak ada data ekspor tersedia",
    exports: "ekspor"
  },
  en: {
    distributorAnalytics: "Distributor Analytics",
    comprehensiveAnalytics: "Comprehensive analytics data for distributor management",
    filters: "Filters",
    filterDescription: "Filter data by date range and year",
    fromDate: "From Date",
    toDate: "To Date",
    year: "Year",
    clearFilters: "Clear Filters",
    totalDistributors: "Total Distributors",
    allTimeRegistrations: "all-time registrations",
    newRegistrations: "New Registrations",
    thisMonth: "this month",
    weeklyGrowth: "Weekly Growth",
    newThisWeek: "new this week",
    activeDistributors: "Active Distributors",
    activeLastMonth: "active last month",
    monthlyRegistrationTrends: "Monthly Registration Trends",
    registrationTrendsDescription: "Chart of new distributor registrations per month",
    regionalDistribution: "Regional Distribution",
    topProvinces: "Top 10 provinces by distributor count",
    errorFetching: "Failed to Fetch Data",
    catalogExports: "Catalog Exports",
    exportAnalytics: "Export Analytics",
    exportAnalyticsDesc: "Analytics for product catalog exports by distributors",
    exportsByArea: "Exports by Area",
    totalExports: "Total Exports",
    exportsThisWeek: "exports this week",
    exportsThisMonth: "exports this month",
    orders: "Orders",
    orderAnalytics: "Order Analytics",
    ordersByStatus: "Orders by Status",
    pending: "Pending",
    processing: "Processing",
    shipped: "Shipped",
    delivered: "Delivered",
    cancelled: "Cancelled",
    topExportAreas: "Top Export Areas",
    exportsPerDistributor: "Exports per Distributor",
    topExportDistributors: "Top Exporting Distributors",
    distributorsWithMostExports: "List of distributors with most catalog exports",
    noExportData: "No export data available",
    exports: "exports"
  }
};

export default DistributorAnalytics;