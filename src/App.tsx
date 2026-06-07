// React imports first
import React, { Suspense, lazy, useEffect } from "react";

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
const Index = lazy(() => import("./pages/home/Index"));
const DaftarProduk = lazy(() => import("./pages/products/DaftarProduk"));
const ProdukDetail = lazy(() => import("./pages/products/ProdukDetail"));
const Tentang = lazy(() => import("./pages/about/Tentang"));
const Hubungi = lazy(() => import("./pages/contact/Hubungi"));
const Masuk = lazy(() => import("./pages/auth/Masuk"));
const Daftar = lazy(() => import("./pages/auth/Daftar"));
const Profil = lazy(() => import("./pages/profile/Profil"));
const LengkapiProfil = lazy(() => import("./pages/profile/LengkapiProfil"));
const Checkout = lazy(() => import("./pages/orders/Checkout"));
const RiwayatPembelian = lazy(() => import("./pages/orders/RiwayatPembelian"));
const Admin = lazy(() => import("./pages/admin/dashboard/Admin"));
const AllActivities = lazy(() => import("./pages/admin/activities/AllActivities"));
const AdminDistributors = lazy(() => import("./pages/admin/distributors/AdminDistributors"));
const AdminUsers = lazy(() => import("./pages/admin/users/AdminUsers"));
const AdminProducts = lazy(() => import("./pages/admin/products/AdminProducts"));
const AdminSKUManager = lazy(() => import("./pages/admin/products/AdminSKUManager"));
const AdminAddProduct = lazy(() => import("./pages/admin/products/AdminAddProduct"));
const AdminEditProduct = lazy(() => import("./pages/admin/products/AdminEditProduct"));
const AdminViewDistributor = lazy(() => import("./pages/admin/distributors/AdminViewDistributor"));
const AdminEditDistributor = lazy(() => import("./pages/admin/distributors/AdminEditDistributor"));
const OrderManagement = lazy(() => import("./pages/admin/orders/OrderManagement"));
const AdminOrderDetail = lazy(() => import("./pages/admin/orders/AdminOrderDetail"));
const AdminAnalytics = lazy(() => import("./pages/admin/analytics/AdminAnalytics"));
const AdminReports = lazy(() => import("./pages/admin/reports/AdminReports"));
const NotFound = lazy(() => import("./pages/shared/NotFound"));

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

const RouteFallback: React.FC = () => (
  <div className="flex min-h-screen items-center justify-center bg-white text-sm text-muted-foreground">
    Memuat halaman...
  </div>
);

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

                  <Suspense fallback={<RouteFallback />}>
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
                      <Route
                        path="/riwayat-pembelian"
                        element={
                          <Protected>
                            <RiwayatPembelian />
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
                  </Suspense>
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
