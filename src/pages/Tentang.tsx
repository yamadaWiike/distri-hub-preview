import SEO from "@/components/seo/SEO";
import Navbar from "@/components/layout/Navbar";
import { Building2, CheckCircle, Globe, LineChart, ShieldCheck, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function Tentang() {
  return (
    <div className="min-h-screen bg-background">
      <SEO title="Tentang Baskit | Distributor Hub" description="Profil perusahaan Baskit dan komitmen kami kepada distributor." />
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(1000px_500px_at_50%_-10%,hsl(var(--primary)/10),transparent)]"/>
        <div className="container max-w-5xl mx-auto text-center px-4">
          <div className="inline-block p-2 px-4 bg-primary/10 rounded-full text-primary font-medium text-sm mb-4">
            Tentang Kami
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Tentang Baskit</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Platform distribusi FMCG terdepan di Indonesia yang menghubungkan produsen dengan distributor untuk menciptakan ekosistem perdagangan yang efisien dan menguntungkan.
          </p>
        </div>
      </section>
      
      {/* Mission & Vision Section */}
      <section className="py-12 bg-muted/30">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="overflow-hidden border-2 border-primary/20 shadow-lg">
              <div className="h-2 bg-primary"></div>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <LineChart className="h-6 w-6 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold">Misi Kami</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Memudahkan akses distribusi produk FMCG berkualitas tinggi ke seluruh Indonesia dengan teknologi modern, transparansi harga, dan layanan terpercaya yang mendukung pertumbuhan bisnis mitra distributor.
                </p>
              </CardContent>
            </Card>
            
            <Card className="overflow-hidden border-2 border-primary/20 shadow-lg">
              <div className="h-2 bg-primary"></div>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Globe className="h-6 w-6 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold">Visi Kami</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Menjadi platform distribusi FMCG nomor satu di Indonesia yang menghubungkan ribuan produsen dan distributor dalam ekosistem perdagangan yang adil, transparan, dan berkelanjutan.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      
      {/* Why Choose Us Section */}
      <section className="py-16">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Mengapa Memilih Baskit?</h2>
            <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
              Solusi distribusi yang menyeluruh untuk kesuksesan bisnis Anda
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card p-6 rounded-xl border hover:shadow-md transition-all">
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <ShieldCheck className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Produk Berkualitas</h3>
              <p className="text-muted-foreground">
                Semua produk telah melalui seleksi ketat dan memiliki sertifikasi halal serta standar kualitas internasional.
              </p>
            </div>
            
            <div className="bg-card p-6 rounded-xl border hover:shadow-md transition-all">
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Building2 className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Jaringan Luas</h3>
              <p className="text-muted-foreground">
                Terhubung dengan ribuan distributor di seluruh Indonesia, dari Sabang hingga Merauke, dengan fokus utama di Jawa, Bali, dan Sumatera.
              </p>
            </div>
            
            <div className="bg-card p-6 rounded-xl border hover:shadow-md transition-all">
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Users className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Dukungan Penuh</h3>
              <p className="text-muted-foreground">
                Tim customer service yang responsif, training produk, dan dukungan marketing untuk membantu kesuksesan bisnis Anda.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16">
        <div className="container max-w-5xl mx-auto px-4">
          <div className="bg-card rounded-xl p-8 md:p-12 shadow-lg border-2 border-primary/10 text-center">
            <h2 className="text-3xl font-bold mb-4">Bergabunglah dengan Jaringan Distributor Baskit</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-3xl mx-auto">
              Jadilah bagian dari kesuksesan distribusi FMCG bersama ribuan distributor lainnya di seluruh Indonesia
            </p>
            <a href="/daftar" className="inline-flex items-center justify-center h-11 px-8 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium shadow-[var(--shadow-elegant)] hover:shadow-[var(--shadow-glow)] hover:-translate-y-0.5 active:translate-y-0 transition-all">
              Daftar Sekarang
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
