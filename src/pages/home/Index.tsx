// React & Router
import { Link } from "react-router-dom";

// External Libraries & Icons
import {
  BarChart3,
  Box,
  Clock,
  CreditCard,
  MapPin,
  PackageCheck,
  ShieldCheck,
  TrendingUp,
  Truck,
  Workflow,
} from "lucide-react";

// UI Components
import SEO from "@/components/seo/SEO";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Hooks
import { useLanguage } from "@/hooks/use-language";
import { useAnalytics } from "@/hooks/use-analytics";
import { useHotjar } from "@/hooks/use-hotjar";

// Utils & Data
import { translations } from "@/lib/translations";
import heroImage from "@/assets/hero-baskit.jpg";

const Index = () => {
  const { lang } = useLanguage();
  const t = translations[lang];
  const { trackEvent } = useAnalytics();
  const { triggerEvent } = useHotjar();
  
  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Baskit Distributor Hub" 
        description={lang === 'id' 
          ? "Katalog produk, harga, MOQ, dan pendaftaran distributor Baskit." 
          : "Product catalog, prices, MOQ, and distributor registration for Baskit."
        } 
      />
      <Navbar />
      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-white to-orange-50/30">
          <div className="container max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-8 py-12 md:py-20 px-4">
            <div className="w-full md:w-1/2 space-y-6">
              <div className="space-y-4">
                <span className="inline-block px-4 py-1.5 bg-orange-100 text-orange-600 font-medium rounded-full text-sm">
                  {lang === 'id' ? "Brands Distributor Partner" : "Brands Distributor Partner"}
                </span>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-gray-900">
                  {lang === 'id' 
                    ? <>Kembangkan Bisnis Anda Bersama <span className="text-orange-500">Baskit</span></>
                    : <>Grow Your Business With <span className="text-orange-500">Baskit</span></>
                  }
                </h1>
                <p className="text-lg text-gray-600 leading-relaxed">
                  {lang === 'id'
                    ? "Area Distribusi Tertarget – Produk dan harga disesuaikan dengan area distribusi Anda, memberikan fleksibilitas dan fokus pasar yang lebih baik."
                    : "Targeted Distribution Areas – Products and prices tailored to your distribution area, providing better market flexibility and focus."
                  }
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link 
                  to="/daftar-produk" 
                  onClick={() => {
                    trackEvent('view_catalog_clicked');
                    triggerEvent('catalog_view');
                  }}
                >
                  <Button className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white px-6 py-6 rounded-lg text-base font-medium">
                    {lang === 'id' ? "📦 Katalog Produk" : "📦 Product Catalog"}
                  </Button>
                </Link>
                <Link 
                  to="/daftar" 
                  onClick={() => {
                    trackEvent('register_distributor_clicked');
                    triggerEvent('distributor_registration');
                  }}
                >
                  <Button variant="outline" className="w-full sm:w-auto border-2 border-orange-500 text-orange-600 hover:bg-orange-50 px-6 py-6 rounded-lg text-base font-medium">
                    {lang === 'id' ? "✓ Daftar Distributor" : "✓ Register as Distributor"}
                  </Button>
                </Link>
              </div>
              <div className="grid grid-cols-3 gap-6 pt-4">
                <div className="text-center">
                  <div className="mx-auto mb-2 w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                    <ShieldCheck className="text-orange-500" size={24} />
                  </div>
                  <span className="text-xs text-gray-600 font-medium">
                    {lang === 'id' ? "Resmi & Terpercaya" : "Official & Trusted"}
                  </span>
                </div>
                <div className="text-center">
                  <div className="mx-auto mb-2 w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                    <Truck className="text-orange-500" size={24} />
                  </div>
                  <span className="text-xs text-gray-600 font-medium">
                    {lang === 'id' ? "Pengiriman Cepat" : "Fast Delivery"}
                  </span>
                </div>
                <div className="text-center">
                  <div className="mx-auto mb-2 w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                    <MapPin className="text-orange-500" size={24} />
                  </div>
                  <span className="text-xs text-gray-600 font-medium">
                    {lang === 'id' ? "Jangkauan Luas" : "Wide Coverage"}
                  </span>
                </div>
              </div>
            </div>
            <div className="w-full md:w-1/2 rounded-2xl overflow-hidden shadow-xl">
              <img src={heroImage} alt={lang === 'id' ? "Hero distributor Baskit" : "Baskit distributor hero"} loading="lazy" className="w-full h-full object-cover" />
            </div>
          </div>
        </section>
        
        {/* Benefits Section */}
        <section className="py-16 bg-white">
          <div className="container max-w-7xl mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
                {lang === 'id' ? "Keuntungan Menjadi Distributor Baskit" : "Benefits of Becoming a Baskit Distributor"}
              </h2>
              <p className="text-gray-600 text-base">
                {lang === 'id' 
                  ? "Tingkatkan omzet dan ekspansi bisnis Anda dengan berbagai keuntungan eksklusif dari Baskit"
                  : "Increase your revenue and expand your business with exclusive benefits from Baskit"
                }
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border border-gray-200 hover:shadow-lg transition-shadow duration-300 bg-white">
                <CardHeader>
                  <div className="h-14 w-14 rounded-xl bg-orange-100 flex items-center justify-center mb-3">
                    <TrendingUp className="text-orange-500 h-7 w-7" />
                  </div>
                  <CardTitle className="text-xl text-gray-900">{lang === 'id' ? "Margin Kompetitif" : "Competitive Margin"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {lang === 'id'
                      ? "Dapatkan margin keuntungan yang kompetitif untuk setiap produk dengan harga distributor khusus."
                      : "Get competitive profit margins for each product with special distributor pricing."
                    }
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border border-gray-200 hover:shadow-lg transition-shadow duration-300 bg-white">
                <CardHeader>
                  <div className="h-14 w-14 rounded-xl bg-orange-100 flex items-center justify-center mb-3">
                    <Truck className="text-orange-500 h-7 w-7" />
                  </div>
                  <CardTitle className="text-xl text-gray-900">{lang === 'id' ? "Pengiriman Prioritas" : "Priority Shipping"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {lang === 'id'
                      ? "Nikmati pengiriman prioritas dan jaminan stok untuk memenuhi kebutuhan bisnis Anda."
                      : "Enjoy priority shipping and stock guarantees to meet your business needs."
                    }
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border border-gray-200 hover:shadow-lg transition-shadow duration-300 bg-white">
                <CardHeader>
                  <div className="h-14 w-14 rounded-xl bg-orange-100 flex items-center justify-center mb-3">
                    <CreditCard className="text-orange-500 h-7 w-7" />
                  </div>
                  <CardTitle className="text-xl text-gray-900">{lang === 'id' ? "Kemudahan Pembayaran" : "Payment Convenience"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {lang === 'id'
                      ? "Area Distribusi Tertarget – Produk dan harga disesuaikan dengan area distribusi Anda, memberikan fleksibilitas dan fokus pasar yang lebih baik."
                      : "Various flexible payment method options specifically for registered distributors."
                    }
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
        
        {/* How It Works Section */}
        <section className="py-16 bg-gray-50">
          <div className="container max-w-7xl mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
                {lang === 'id' ? "Cara Kerja" : "How It Works"}
              </h2>
              <p className="text-gray-600 text-base">
                {lang === 'id'
                  ? "Mulai kemitraan dalam 3 langkah mudah"
                  : "Start partnership in 3 easy steps"
                }
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-xl border border-gray-200 text-center hover:shadow-lg transition-shadow">
                <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
                  <span className="text-2xl font-bold text-orange-500">1</span>
                </div>
                <div className="mb-3">
                  <div className="inline-block p-3 rounded-lg bg-orange-50">
                    <PackageCheck className="text-orange-500 h-6 w-6" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {lang === 'id' ? "Daftar & Verifikasi" : "Register & Verify"}
                </h3>
                <p className="text-sm text-gray-600">
                  {lang === 'id'
                    ? "Lengkapi data bisnis Anda melalui form pendaftaran kami"
                    : "Complete your business data through our registration form"
                  }
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-xl border border-gray-200 text-center hover:shadow-lg transition-shadow">
                <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
                  <span className="text-2xl font-bold text-orange-500">2</span>
                </div>
                <div className="mb-3">
                  <div className="inline-block p-3 rounded-lg bg-orange-50">
                    <Box className="text-orange-500 h-6 w-6" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {lang === 'id' ? "Pilih Produk" : "Choose Products"}
                </h3>
                <p className="text-sm text-gray-600">
                  {lang === 'id'
                    ? "Pilih produk dari katalog kami dengan harga khusus distributor"
                    : "Choose products from our catalog with special distributor prices"
                  }
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-xl border border-gray-200 text-center hover:shadow-lg transition-shadow">
                <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
                  <span className="text-2xl font-bold text-orange-500">3</span>
                </div>
                <div className="mb-3">
                  <div className="inline-block p-3 rounded-lg bg-orange-50">
                    <Truck className="text-orange-500 h-6 w-6" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {lang === 'id' ? "Pesan & Terima" : "Order & Receive"}
                </h3>
                <p className="text-sm text-gray-600">
                  {lang === 'id'
                    ? "Pesanan Anda akan diproses dan dikirim ke alamat Anda"
                    : "Your order will be processed and shipped to your address"
                  }
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-xl border border-gray-200 text-center hover:shadow-lg transition-shadow">
                <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
                  <span className="text-2xl font-bold text-orange-500">4</span>
                </div>
                <div className="mb-3">
                  <div className="inline-block p-3 rounded-lg bg-orange-50">
                    <BarChart3 className="text-orange-500 h-6 w-6" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {lang === 'id' ? "Distribusi" : "Distribute"}
                </h3>
                <p className="text-sm text-gray-600">
                  {lang === 'id'
                    ? "Distribusikan produk ke toko retail dengan margin menguntungkan"
                    : "Distribute products to retail stores with profitable margins"
                  }
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Call to Action Section */}
        <section className="py-16 bg-white">
          <div className="container max-w-6xl mx-auto px-4">
            <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-2xl p-8 md:p-12 border border-orange-200">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="w-full md:w-2/3">
                  <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
                    {lang === 'id' ? "Siap Bergabung?" : "Ready to Join?"}
                  </h2>
                  <p className="text-lg text-gray-700 mb-6">
                    {lang === 'id'
                      ? "Daftar sekarang dan raih peluang bisnis yang menguntungkan dengan sistem distribusi yang efisien."
                      : "Register now and seize profitable business opportunities with an efficient distribution system."
                    }
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Link 
                      to="/daftar"
                      onClick={() => {
                        trackEvent('register_cta_clicked');
                        triggerEvent('register_cta');
                      }}
                    >
                      <Button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-6 rounded-lg text-base font-medium">
                        {lang === 'id' ? "📝 Daftar Sekarang" : "📝 Register Now"}
                      </Button>
                    </Link>
                    <Link 
                      to="/hubungi"
                      onClick={() => {
                        trackEvent('contact_cta_clicked');
                        triggerEvent('contact_cta');
                      }}
                    >
                      <Button variant="outline" className="border-2 border-orange-500 text-orange-600 hover:bg-orange-50 px-6 py-6 rounded-lg text-base font-medium">
                        {lang === 'id' ? "💬 Konsul" : "💬 Consult"}
                      </Button>
                    </Link>
                  </div>
                </div>
                <div className="w-full md:w-1/3 flex justify-center">
                  <div className="w-48 h-48 rounded-2xl overflow-hidden shadow-lg">
                    <img src={heroImage} alt="Office" className="w-full h-full object-cover" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
