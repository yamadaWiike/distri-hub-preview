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
    if (!dateFrom || !dateTo) {
      calculateStats(distributors);
      calculateMonthlyData(distributors);
      return;
    }
    
    const filtered = distributors.filter(d => {
      const createdDate = new Date(d.created_at);
      return createdDate >= new Date(dateFrom) && createdDate <= new Date(dateTo);
    });
    
    calculateStats(filtered);
    calculateMonthlyData(filtered);
  };

  // Calculate growth percentage
  const calculateGrowthPercentage = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  useEffect(() => {
    fetchDistributors();
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
    errorFetching: "Gagal Memuat Data"
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
    errorFetching: "Failed to Fetch Data"
  }
};

export default DistributorAnalytics;