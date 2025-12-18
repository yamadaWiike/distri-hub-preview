// React imports first
import React, { useEffect } from "react";

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
import Index from "./pages/home/Index";
import DaftarProduk from "./pages/products/DaftarProduk";
import ProdukDetail from "./pages/products/ProdukDetail";
import Tentang from "./pages/about/Tentang";
import Hubungi from "./pages/contact/Hubungi";
import Masuk from "./pages/auth/Masuk";
import Daftar from "./pages/auth/Daftar";
import Profil from "./pages/profile/Profil";
import LengkapiProfil from "./pages/profile/LengkapiProfil";
import Admin from "./pages/admin/dashboard/Admin";
import AllActivities from "./pages/admin/activities/AllActivities";
import AdminDistributors from "./pages/admin/distributors/AdminDistributors";
import AdminUsers from "./pages/admin/users/AdminUsers";
import AdminProducts from "./pages/admin/products/AdminProducts";
import AdminSKUManager from "./pages/admin/products/AdminSKUManager";
import AdminAddProduct from "./pages/admin/products/AdminAddProduct";
import AdminEditProduct from "./pages/admin/products/AdminEditProduct";
import AdminViewDistributor from "./pages/admin/distributors/AdminViewDistributor";
import AdminEditDistributor from "./pages/admin/distributors/AdminEditDistributor";
import AdminOrders from "./pages/admin/orders/AdminOrders";
import OrderManagement from "./pages/admin/orders/OrderManagement";
import AdminOrderDetail from "./pages/admin/orders/AdminOrderDetail";
import AdminAnalytics from "./pages/admin/analytics/AdminAnalytics";
import AdminReports from "./pages/admin/reports/AdminReports";
import Checkout from "./pages/orders/Checkout";
import NotFound from "./pages/shared/NotFound";

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
const App: React.FC = () => {
  // Add global error handling to prevent misleading error messages
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error("Unhandled promise rejection:", event.reason);

      // Check if this is related to photo upload and might interfere with other operations
      const errorMsg = event.reason?.message?.toLowerCase() || "";
      if (
        errorMsg.includes("upload") ||
        errorMsg.includes("photo") ||
        errorMsg.includes("image")
      ) {
        console.warn(
          "Photo/upload related error detected, preventing propagation to avoid misleading messages"
        );
        event.preventDefault(); // Prevent the default error handling
      }
    };

    const handleError = (event: ErrorEvent) => {
      console.error("Global error:", event.error);

      // Similar handling for regular errors
      const errorMsg = event.error?.message?.toLowerCase() || "";
      if (
        errorMsg.includes("upload") ||
        errorMsg.includes("photo") ||
        errorMsg.includes("image")
      ) {
        console.warn("Photo/upload related error detected in global handler");
      }
    };

    // Add event listeners
    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    window.addEventListener("error", handleError);

    // Cleanup
    return () => {
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection
      );
      window.removeEventListener("error", handleError);
    };
  }, []);

  return (
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
                <BrowserRouter
                  future={{
                    v7_startTransition: true,
                    v7_relativeSplatPath: true,
                  }}
                >
                  {/* Analytics tracking components */}
                  <GoogleAnalytics />
                  <Hotjar />

                  <Routes>
                    {/* Public pages */}
                    <Route path="/" element={<Index />} />
                    <Route path="/daftar-produk" element={<DaftarProduk />} />
                    <Route
                      path="/produk/:category/:slug"
                      element={<ProdukDetail />}
                    />
                    <Route path="/tentang" element={<Tentang />} />
                    <Route path="/hubungi" element={<Hubungi />} />
                    <Route path="/masuk" element={<Masuk />} />
                    <Route path="/daftar" element={<Daftar />} />

                    {/* Protected routes - require authentication */}
                    <Route
                      path="/profil"
                      element={
                        <Protected>
                          <Profil />
                        </Protected>
                      }
                    />
                    <Route
                      path="/lengkapi-profil"
                      element={
                        <Protected>
                          <LengkapiProfil />
                        </Protected>
                      }
                    />
                    <Route
                      path="/checkout"
                      element={
                        <Protected>
                          <Checkout />
                        </Protected>
                      }
                    />

                    {/* Admin routes */}
                    <Route path="/admin" element={<Admin />} />
                    <Route
                      path="/admin/activities"
                      element={<AllActivities />}
                    />
                    <Route
                      path="/admin/distributors"
                      element={<AdminDistributors />}
                    />
                    <Route
                      path="/admin/distributors/view/:id"
                      element={<AdminViewDistributor />}
                    />
                    <Route
                      path="/admin/distributors/edit/:id"
                      element={<AdminEditDistributor />}
                    />
                    <Route path="/admin/users" element={<AdminUsers />} />
                    <Route path="/admin/products" element={<AdminProducts />} />
                    <Route
                      path="/admin/products/add"
                      element={<AdminAddProduct />}
                    />
                    <Route
                      path="/admin/products/edit/:id"
                      element={<AdminEditProduct />}
                    />
                    <Route
                      path="/admin/sku-manager"
                      element={<AdminSKUManager />}
                    />
                    <Route path="/admin/orders" element={<OrderManagement />} />
                    <Route
                      path="/admin/orders/:id"
                      element={<AdminOrderDetail />}
                    />
                    <Route
                      path="/admin/analytics"
                      element={<AdminAnalytics />}
                    />
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
};

export default App;
