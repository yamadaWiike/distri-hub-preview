import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import DaftarProduk from "./pages/DaftarProduk";
import ProdukDetail from "./pages/ProdukDetail";
import Tentang from "./pages/Tentang";
import Hubungi from "./pages/Hubungi";
import Masuk from "./pages/Masuk";
import Daftar from "./pages/Daftar";
import Profil from "./pages/Profil";
import Admin from "./pages/Admin";
import { AuthProvider } from "./contexts/AuthContext";
import { useAuth } from "./hooks/use-auth";
import { CartProvider } from "./contexts/CartContext";
import { LanguageProvider } from "./contexts/LanguageContext";

const queryClient = new QueryClient();

function Protected({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? children : <Navigate to="/masuk" replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <LanguageProvider>
          <AuthProvider>
            <CartProvider>
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/daftar-produk" element={<DaftarProduk />} />
                  <Route path="/produk/:id" element={<ProdukDetail />} />
                  <Route path="/tentang" element={<Tentang />} />
                  <Route path="/hubungi" element={<Hubungi />} />
                  <Route path="/masuk" element={<Masuk />} />
                  <Route path="/daftar" element={<Daftar />} />
                  <Route path="/profil" element={<Protected><Profil /></Protected>} />
                  <Route path="/admin" element={<Admin />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
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
