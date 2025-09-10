import SEO from "@/components/seo/SEO";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/layout/Navbar";
import heroImage from "@/assets/hero-baskit.jpg";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Box, Clock, CreditCard, MapPin, PackageCheck, ShieldCheck, TrendingUp, Truck, Workflow } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/lib/translations";

const Index = () => {
  const { lang } = useLanguage();
  const t = translations[lang];
  
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
        {/* Hero Section with Improved Layout */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(1200px_600px_at_30%_-10%,hsl(var(--accent)),transparent)]"/>
          <div className="container max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-8 py-16 md:py-24">
            <div className="w-full md:w-1/2 space-y-8">
              <div className="space-y-4">
                <span className="inline-block px-3 py-1 bg-secondary/30 text-primary font-medium rounded-full text-sm">
                  {lang === 'id' ? "Brands Distributor Partner 2025" : "Brands Distributor Partner 2025"}
                </span>
                <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                  {lang === 'id' 
                    ? <>Kembangkan Bisnis Anda Bersama <span className="text-primary">Baskit</span></>
                    : <>Grow Your Business With <span className="text-primary">Baskit</span></>
                  }
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  {lang === 'id'
                    ? "Area Distribusi Tertarget – Produk dan harga disesuaikan dengan area distribusi Anda, memberikan fleksibilitas dan fokus pasar yang lebih baik."
                    : "Targeted Distribution Areas – Products and prices tailored to your distribution area, providing better market flexibility and focus."
                  }
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/daftar-produk">
                  <Button variant="hero" size="lg" className="w-full sm:w-auto">
                    <Box className="mr-1" size={20} />
                    {lang === 'id' ? "Katalog Produk" : "Product Catalog"}
                  </Button>
                </Link>
                <Link to="/daftar">
                  <Button variant="soft" size="lg" className="w-full sm:w-auto">
                    <ShieldCheck className="mr-1" size={20} />
                    {lang === 'id' ? "Daftar Distributor" : "Register as Distributor"}
                  </Button>
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="text-primary" size={18} />
                  <span className="text-sm font-medium">{lang === 'id' ? "Resmi & Terpercaya" : "Official & Trusted"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="text-primary" size={18} />
                  <span className="text-sm font-medium">{lang === 'id' ? "Pengiriman Cepat" : "Fast Delivery"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="text-primary" size={18} />
                  <span className="text-sm font-medium">{lang === 'id' ? "Jangkauan Luas" : "Wide Coverage"}</span>
                </div>
              </div>
            </div>
            <div className="w-full md:w-1/2 rounded-2xl overflow-hidden border shadow-[var(--shadow-elegant)] relative">
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-4 py-2 rounded-bl-lg font-medium z-10">
                {lang === 'id' ? "Partner Resmi" : "Official Partner"}
              </div>
              <img src={heroImage} alt={lang === 'id' ? "Hero distributor Baskit" : "Baskit distributor hero"} loading="lazy" className="w-full h-full object-cover" />
            </div>
          </div>
        </section>
        
        {/* Benefits Section */}
        <section className="py-16 bg-muted/30">
          <div className="container max-w-7xl mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {lang === 'id' ? "Keuntungan Menjadi Distributor Baskit" : "Benefits of Becoming a Baskit Distributor"}
              </h2>
              <p className="text-muted-foreground text-lg">
                {lang === 'id' 
                  ? "Tingkatkan omzet dan ekspansi bisnis Anda dengan berbagai keuntungan eksklusif dari Baskit"
                  : "Increase your revenue and expand your business with exclusive benefits from Baskit"
                }
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="border-2 border-transparent hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                    <TrendingUp className="text-primary h-6 w-6" />
                  </div>
                  <CardTitle>{lang === 'id' ? "Margin Kompetitif" : "Competitive Margin"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    {lang === 'id'
                      ? "Dapatkan margin keuntungan yang kompetitif untuk setiap produk dengan harga distributor khusus."
                      : "Get competitive profit margins for each product with special distributor pricing."
                    }
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-2 border-transparent hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                    <Truck className="text-primary h-6 w-6" />
                  </div>
                  <CardTitle>{lang === 'id' ? "Pengiriman Prioritas" : "Priority Shipping"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    {lang === 'id'
                      ? "Nikmati pengiriman prioritas dan jaminan stok untuk memenuhi kebutuhan bisnis Anda."
                      : "Enjoy priority shipping and stock guarantees to meet your business needs."
                    }
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-2 border-transparent hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                    <CreditCard className="text-primary h-6 w-6" />
                  </div>
                  <CardTitle>{lang === 'id' ? "Kemudahan Pembayaran" : "Payment Convenience"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    {lang === 'id'
                      ? "Berbagai pilihan metode pembayaran yang fleksibel khusus untuk distributor terdaftar."
                      : "Various flexible payment method options specifically for registered distributors."
                    }
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
        
        {/* How It Works Section */}
        <section className="py-16">
          <div className="container max-w-7xl mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {lang === 'id' ? "Cara Kerja Distribusi" : "How Distribution Works"}
              </h2>
              <p className="text-muted-foreground text-lg">
                {lang === 'id'
                  ? "Proses distribusi yang sederhana dan efisien untuk memaksimalkan keuntungan"
                  : "Simple and efficient distribution process to maximize profits"
                }
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
              <div className="bg-card p-6 rounded-lg border relative">
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">1</div>
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <PackageCheck className="text-primary h-7 w-7" />
                </div>
                <h3 className="text-lg font-bold text-center mb-2">
                  {lang === 'id' ? "Pesan Produk" : "Order Products"}
                </h3>
                <p className="text-sm text-muted-foreground text-center">
                  {lang === 'id'
                    ? "Pilih produk sesuai kebutuhan area distribusi Anda dengan MOQ yang fleksibel"
                    : "Choose products according to your distribution area needs with flexible MOQ"
                  }
                </p>
              </div>
              
              <div className="bg-card p-6 rounded-lg border relative">
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">2</div>
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Clock className="text-primary h-7 w-7" />
                </div>
                <h3 className="text-lg font-bold text-center mb-2">
                  {lang === 'id' ? "Konfirmasi" : "Confirmation"}
                </h3>
                <p className="text-sm text-muted-foreground text-center">
                  {lang === 'id'
                    ? "Pesanan dikonfirmasi dan diproses dengan cepat oleh tim Baskit"
                    : "Orders are confirmed and processed quickly by the Baskit team"
                  }
                </p>
              </div>
              
              <div className="bg-card p-6 rounded-lg border relative">
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">3</div>
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Truck className="text-primary h-7 w-7" />
                </div>
                <h3 className="text-lg font-bold text-center mb-2">
                  {lang === 'id' ? "Pengiriman" : "Delivery"}
                </h3>
                <p className="text-sm text-muted-foreground text-center">
                  {lang === 'id'
                    ? "Produk dikirim langsung ke gudang Anda dengan status tracking realtime"
                    : "Products are shipped directly to your warehouse with realtime tracking status"
                  }
                </p>
              </div>
              
              <div className="bg-card p-6 rounded-lg border relative">
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">4</div>
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="text-primary h-7 w-7" />
                </div>
                <h3 className="text-lg font-bold text-center mb-2">
                  {lang === 'id' ? "Distribusi" : "Distribution"}
                </h3>
                <p className="text-sm text-muted-foreground text-center">
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
        <section className="py-16 bg-primary/5">
          <div className="container max-w-5xl mx-auto">
            <div className="bg-card rounded-xl p-8 md:p-12 shadow-lg border-2 border-primary/20">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="w-full md:w-2/3">
                  <h2 className="text-3xl font-bold mb-4">
                    {lang === 'id' ? "Siap Menjadi Distributor Resmi?" : "Ready to Become an Official Distributor?"}
                  </h2>
                  <p className="text-lg text-muted-foreground mb-6">
                    {lang === 'id'
                      ? "Daftar sekarang dan dapatkan akses ke katalog produk lengkap dengan harga khusus distributor."
                      : "Register now and get access to a complete product catalog with special distributor pricing."
                    }
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <Link to="/daftar">
                      <Button variant="hero" size="lg">
                        {lang === 'id' ? "Daftar Sekarang" : "Register Now"}
                      </Button>
                    </Link>
                    <Link to="/hubungi">
                      <Button variant="outline" size="lg">
                        {lang === 'id' ? "Konsultasi Dengan Tim" : "Consult With Our Team"}
                      </Button>
                    </Link>
                  </div>
                </div>
                <div className="w-full md:w-1/3 flex justify-center">
                  <div className="h-32 w-32 rounded-full bg-primary/20 flex items-center justify-center">
                    <Workflow className="h-16 w-16 text-primary" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Index;
