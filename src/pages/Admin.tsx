import { useState, useEffect } from "react";
import SEO from "@/components/seo/SEO";
import Navbar from "@/components/layout/Navbar";
import { useLanguage } from "@/hooks/use-language";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Package2, 
  Users, 
  ShoppingBag, 
  AlertTriangle,
  BarChart3,
  UserCheck
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
// Using the main version of SKUManager with category and variant functionality
import SKUManager from "@/components/admin/SKUManager";
import UserManager from "@/components/admin/UserManager";
import OrderManager from "@/components/admin/OrderManager";
import DistributorManager from "@/components/admin/DistributorManager";
import DistributorAnalytics from "@/components/admin/DistributorAnalytics";

export default function Admin() {
  const { lang } = useLanguage();
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState("products");
  const t = lang === 'id' ? id : en;
  
  useEffect(() => {
    // Check if user is admin
    // In a real app, this would check a role claim in the JWT
    // or query a server endpoint to confirm admin status
    const checkAdmin = async () => {
      if (!isLoading && user) {
        // For demo purposes, we'll consider certain emails as admin
        // In production, use proper role-based access control
        const adminEmails = [
          "rudy@baskit.app",
          "admin.commercial@baskit.app"
        ];
        
        setIsAdmin(adminEmails.includes(user.email || ""));
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
    <div className="min-h-screen bg-background">
      <SEO 
        title={t.adminDashboard} 
        description={t.adminAreaDescription}
      />
      <Navbar />
      <main className="container max-w-6xl mx-auto py-10 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">
            {t.adminDashboard}
          </h1>
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <span>{t.loggedInAs}</span>
            <span className="font-semibold">{user?.email}</span>
          </div>
        </div>
        
        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="mb-6">
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package2 className="h-4 w-4" />
              {t.products}
            </TabsTrigger>
            <TabsTrigger value="distributors" className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              {t.distributors}
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              {t.analytics}
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              {t.users}
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              {t.orders}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="products" className="space-y-4">
            <SKUManager />
          </TabsContent>
          
          <TabsContent value="distributors" className="space-y-4">
            <DistributorManager />
          </TabsContent>
          
          <TabsContent value="analytics" className="space-y-4">
            <DistributorAnalytics />
          </TabsContent>
          
          <TabsContent value="users" className="space-y-4">
            <UserManager />
          </TabsContent>
          
          <TabsContent value="orders" className="space-y-4">
            <OrderManager />
          </TabsContent>
        </Tabs>
      </main>
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
  loggedInAs: "Masuk sebagai:",
  products: "Produk",
  distributors: "Distributor",
  analytics: "Analitik",
  users: "Pengguna",
  orders: "Pesanan",
  loginRequired: "Login diperlukan untuk mengakses halaman admin."
};

const en = {
  adminDashboard: "Admin Dashboard",
  adminAreaDescription: "Internal area to manage SKUs, users, and distributor orders.",
  loading: "Loading...",
  accessDenied: "Access Denied",
  adminAccessOnly: "Only admins can access this page.",
  adminAccessRequired: "You need admin privileges to access this page.",
  backToHome: "Back to Home",
  loggedInAs: "Logged in as:",
  products: "Products",
  distributors: "Distributors",
  analytics: "Analytics",
  users: "Users",
  orders: "Orders",
  loginRequired: "Login required to access admin page."
};
