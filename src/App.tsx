// Third-party library imports
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";

// Context providers
import { AuthProvider } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import { LanguageProvider } from "./contexts/LanguageContext";

// Hooks
import { useAuth } from "./hooks/use-auth";

// UI Components
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

// Analytics/Tracking components
import GoogleAnalytics from "./components/seo/GoogleAnalytics";
import Hotjar from "./components/seo/Hotjar";

// Pages
import Index from "./pages/Index";
import DaftarProduk from "./pages/DaftarProduk";
import ProdukDetail from "./pages/ProdukDetail";
import Tentang from "./pages/Tentang";
import Hubungi from "./pages/Hubungi";
import Masuk from "./pages/Masuk";
import Daftar from "./pages/Daftar";
import Profil from "./pages/Profil";
import LengkapiProfil from "./pages/LengkapiProfil";
import Admin from "./pages/Admin";
import AllActivities from "./pages/AllActivities";
import AdminDistributors from "./pages/AdminDistributors";
import AdminUsers from "./pages/AdminUsers";
import AdminProducts from "./pages/AdminProducts";
import AdminSKUManager from "./pages/AdminSKUManager";
import AdminAddProduct from "./pages/AdminAddProduct";
import AdminEditProduct from "./pages/AdminEditProduct";
import AdminViewDistributor from "./pages/AdminViewDistributor";
import AdminEditDistributor from "./pages/AdminEditDistributor";
import AdminOrders from "./pages/AdminOrders";
import AdminAnalytics from "./pages/AdminAnalytics";
import AdminReports from "./pages/AdminReports";
import Checkout from "./pages/Checkout";
import NotFound from "./pages/NotFound";

/**
 * Configure React Query client with default options
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 60000, // 1 minute
    },
  },
});

/**
 * Protected route wrapper component
 * Redirects to login page if user is not authenticated
 */
interface ProtectedRouteProps {
  children: JSX.Element;
}

const Protected: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, isLoading } = useAuth();
  
  // Show nothing while checking auth status
  if (isLoading) return null;
  
  // Either render the children or redirect to login
  return user ? children : <Navigate to="/masuk" replace />;
};

/**
 * Main application component
 */
const App: React.FC = () => (
  <QueryClientProvider client={queryClient}>
    {/* Helmet for managing document head */}
    <HelmetProvider>
      {/* UI component providers */}
      <TooltipProvider>
        <Toaster />
        <Sonner />
        
        {/* Application context providers */}
        <LanguageProvider>
          <AuthProvider>
            <CartProvider>
              
              {/* Router configuration */}
              <BrowserRouter future={{ 
                v7_startTransition: true, 
                v7_relativeSplatPath: true 
              }}>
                {/* Analytics tracking components */}
                <GoogleAnalytics />
                <Hotjar />
                
                <Routes>
                  {/* Public pages */}
                  <Route path="/" element={<Index />} />
                  <Route path="/daftar-produk" element={<DaftarProduk />} />
                  <Route path="/produk/:category/:slug" element={<ProdukDetail />} />
                  <Route path="/tentang" element={<Tentang />} />
                  <Route path="/hubungi" element={<Hubungi />} />
                  <Route path="/masuk" element={<Masuk />} />
                  <Route path="/daftar" element={<Daftar />} />
                  
                  {/* Protected routes - require authentication */}
                  <Route path="/profil" element={<Protected><Profil /></Protected>} />
                  <Route path="/lengkapi-profil" element={<Protected><LengkapiProfil /></Protected>} />
                  <Route path="/checkout" element={<Protected><Checkout /></Protected>} />
                  
                  {/* Admin routes */}
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/admin/activities" element={<AllActivities />} />
                  <Route path="/admin/distributors" element={<AdminDistributors />} />
                  <Route path="/admin/distributors/view/:id" element={<AdminViewDistributor />} />
                  <Route path="/admin/distributors/edit/:id" element={<AdminEditDistributor />} />
                  <Route path="/admin/users" element={<AdminUsers />} />
                  <Route path="/admin/products" element={<AdminProducts />} />
                  <Route path="/admin/products/add" element={<AdminAddProduct />} />
                  <Route path="/admin/products/edit/:id" element={<AdminEditProduct />} />
                  <Route path="/admin/sku-manager" element={<AdminSKUManager />} />
                  <Route path="/admin/orders" element={<AdminOrders />} />
                  <Route path="/admin/analytics" element={<AdminAnalytics />} />
                  <Route path="/admin/reports" element={<AdminReports />} />
                  
                  {/* Fallback route for 404 errors */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </CartProvider>
          </AuthProvider>
        </LanguageProvider>
      </TooltipProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
