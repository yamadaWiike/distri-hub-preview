import SEO from "@/components/seo/SEO";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/layout/Navbar";
import heroImage from "@/assets/hero-baskit.jpg";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Box, Clock, CreditCard, MapPin, PackageCheck, ShieldCheck, TrendingUp, Truck, Workflow } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO title="Baskit Distributor Hub" description="Katalog produk, harga, MOQ, dan pendaftaran distributor Baskit." />
      <Navbar />
      <main>
        {/* Hero Section with Improved Layout */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(1200px_600px_at_30%_-10%,hsl(var(--accent)),transparent)]"/>
          <div className="container max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-8 py-16 md:py-24">
            <div className="w-full md:w-1/2 space-y-8">
              <div className="space-y-4">
                <span className="inline-block px-3 py-1 bg-secondary/30 text-primary font-medium rounded-full text-sm">
                  Brands Distributor Partner 2025
                </span>
                <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                  Kembangkan Bisnis Anda Bersama <span className="text-primary">Baskit</span>
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  Jelajahi katalog, simulasi keuntungan, dan daftar sebagai distributor untuk melihat harga khusus per area wilayah.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/daftar-produk">
                  <Button variant="hero" size="lg" className="w-full sm:w-auto">
                    <Box className="mr-1" size={20} />
                    Katalog Produk
                  </Button>
                </Link>
                <Link to="/daftar">
                  <Button variant="soft" size="lg" className="w-full sm:w-auto">
                    <ShieldCheck className="mr-1" size={20} />
                    Daftar Distributor
                  </Button>
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="text-primary" size={18} />
                  <span className="text-sm font-medium">Resmi &amp; Terpercaya</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="text-primary" size={18} />
                  <span className="text-sm font-medium">Pengiriman Cepat</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="text-primary" size={18} />
                  <span className="text-sm font-medium">Jangkauan Luas</span>
                </div>
              </div>
            </div>
            <div className="w-full md:w-1/2 rounded-2xl overflow-hidden border shadow-[var(--shadow-elegant)] relative">
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-4 py-2 rounded-bl-lg font-medium z-10">
                Partner Resmi
              </div>
              <img src={heroImage} alt="Hero distributor Baskit" loading="lazy" className="w-full h-full object-cover" />
            </div>
          </div>
        </section>
        
        {/* Benefits Section */}
        <section className="py-16 bg-muted/30">
          <div className="container max-w-7xl mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Keuntungan Menjadi Distributor Baskit</h2>
              <p className="text-muted-foreground text-lg">Tingkatkan omzet dan ekspansi bisnis Anda dengan berbagai keuntungan eksklusif dari Baskit</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="border-2 border-transparent hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                    <TrendingUp className="text-primary h-6 w-6" />
                  </div>
                  <CardTitle>Margin Kompetitif</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Dapatkan margin keuntungan yang kompetitif untuk setiap produk dengan harga distributor khusus.</p>
                </CardContent>
              </Card>
              
              <Card className="border-2 border-transparent hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                    <Truck className="text-primary h-6 w-6" />
                  </div>
                  <CardTitle>Pengiriman Prioritas</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Nikmati pengiriman prioritas dan jaminan stok untuk memenuhi kebutuhan bisnis Anda.</p>
                </CardContent>
              </Card>
              
              <Card className="border-2 border-transparent hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                    <CreditCard className="text-primary h-6 w-6" />
                  </div>
                  <CardTitle>Kemudahan Pembayaran</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Berbagai pilihan metode pembayaran yang fleksibel khusus untuk distributor terdaftar.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
        
        {/* How It Works Section */}
        <section className="py-16">
          <div className="container max-w-7xl mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Cara Kerja Distribusi</h2>
              <p className="text-muted-foreground text-lg">Proses distribusi yang sederhana dan efisien untuk memaksimalkan keuntungan</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
              <div className="bg-card p-6 rounded-lg border relative">
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">1</div>
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <PackageCheck className="text-primary h-7 w-7" />
                </div>
                <h3 className="text-lg font-bold text-center mb-2">Pesan Produk</h3>
                <p className="text-sm text-muted-foreground text-center">Pilih produk sesuai kebutuhan area distribusi Anda dengan MOQ yang fleksibel</p>
              </div>
              
              <div className="bg-card p-6 rounded-lg border relative">
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">2</div>
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Clock className="text-primary h-7 w-7" />
                </div>
                <h3 className="text-lg font-bold text-center mb-2">Konfirmasi</h3>
                <p className="text-sm text-muted-foreground text-center">Pesanan dikonfirmasi dan diproses dengan cepat oleh tim Baskit</p>
              </div>
              
              <div className="bg-card p-6 rounded-lg border relative">
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">3</div>
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Truck className="text-primary h-7 w-7" />
                </div>
                <h3 className="text-lg font-bold text-center mb-2">Pengiriman</h3>
                <p className="text-sm text-muted-foreground text-center">Produk dikirim langsung ke gudang Anda dengan status tracking realtime</p>
              </div>
              
              <div className="bg-card p-6 rounded-lg border relative">
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">4</div>
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="text-primary h-7 w-7" />
                </div>
                <h3 className="text-lg font-bold text-center mb-2">Distribusi</h3>
                <p className="text-sm text-muted-foreground text-center">Distribusikan produk ke toko retail dengan margin menguntungkan</p>
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
                  <h2 className="text-3xl font-bold mb-4">Siap Menjadi Distributor Resmi?</h2>
                  <p className="text-lg text-muted-foreground mb-6">Daftar sekarang dan dapatkan akses ke katalog produk lengkap dengan harga khusus distributor.</p>
                  <div className="flex flex-wrap gap-4">
                    <Link to="/daftar">
                      <Button variant="hero" size="lg">Daftar Sekarang</Button>
                    </Link>
                    <Link to="/hubungi">
                      <Button variant="outline" size="lg">Konsultasi Dengan Tim</Button>
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
