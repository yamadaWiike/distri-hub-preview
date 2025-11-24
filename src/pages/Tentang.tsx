import SEO from "@/components/seo/SEO";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Building2, CheckCircle, Globe, LineChart, ShieldCheck, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/hooks/use-language";
import { translations } from "@/lib/translations";

export default function Tentang() {
  const { lang } = useLanguage();
  const t = translations[lang];
  
  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title={lang === 'id' ? "Tentang Baskit | Distributor Hub" : "About Baskit | Distributor Hub"} 
        description={lang === 'id' 
          ? "Profil perusahaan Baskit dan komitmen kami kepada distributor." 
          : "Baskit company profile and our commitment to distributors."
        } 
      />
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(1000px_500px_at_50%_-10%,hsl(var(--primary)/10),transparent)]"/>
        <div className="container max-w-5xl mx-auto text-center px-4">
          <div className="inline-block p-2 px-4 bg-primary/10 rounded-full text-primary font-medium text-sm mb-4">
            {lang === 'id' ? "Tentang Kami" : "About Us"}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">{lang === 'id' ? "Tentang Baskit" : "About Baskit"}</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {lang === 'id' 
              ? "Platform distribusi FMCG terdepan di Indonesia yang menghubungkan produsen dengan distributor untuk menciptakan ekosistem perdagangan yang efisien dan menguntungkan."
              : "Indonesia's leading FMCG distribution platform that connects manufacturers with distributors to create an efficient and profitable trading ecosystem."
            }
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
                  <h2 className="text-2xl font-bold">{lang === 'id' ? "Misi Kami" : "Our Mission"}</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {lang === 'id' 
                    ? "Memudahkan akses distribusi produk FMCG berkualitas tinggi ke seluruh Indonesia dengan teknologi modern, transparansi harga, dan layanan terpercaya yang mendukung pertumbuhan bisnis mitra distributor."
                    : "To facilitate access to high-quality FMCG product distribution throughout Indonesia with modern technology, price transparency, and trusted services that support the business growth of distributor partners."
                  }
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
                  <h2 className="text-2xl font-bold">{lang === 'id' ? "Visi Kami" : "Our Vision"}</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {lang === 'id'
                    ? "Menjadi platform distribusi FMCG nomor satu di Indonesia yang menghubungkan ribuan produsen dan distributor dalam ekosistem perdagangan yang adil, transparan, dan berkelanjutan."
                    : "To become Indonesia's number one FMCG distribution platform connecting thousands of manufacturers and distributors in a fair, transparent, and sustainable trading ecosystem."
                  }
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
            <h2 className="text-3xl font-bold">{lang === 'id' ? "Mengapa Memilih Baskit?" : "Why Choose Baskit?"}</h2>
            <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
              {lang === 'id'
                ? "Solusi distribusi yang menyeluruh untuk kesuksesan bisnis Anda"
                : "Comprehensive distribution solutions for your business success"
              }
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card p-6 rounded-xl border hover:shadow-md transition-all">
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <ShieldCheck className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">{lang === 'id' ? "Produk Berkualitas" : "Quality Products"}</h3>
              <p className="text-muted-foreground">
                {lang === 'id'
                  ? "Semua produk telah melalui seleksi ketat dan memiliki sertifikasi halal serta standar kualitas internasional."
                  : "All products have gone through strict selection and have halal certification and international quality standards."
                }
              </p>
            </div>
            
            <div className="bg-card p-6 rounded-xl border hover:shadow-md transition-all">
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Building2 className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">{lang === 'id' ? "Jaringan Luas" : "Wide Network"}</h3>
              <p className="text-muted-foreground">
                {lang === 'id'
                  ? "Terhubung dengan ribuan distributor di seluruh Indonesia, dari Sabang hingga Merauke, dengan fokus utama di Jawa, Bali, dan Sumatera."
                  : "Connected with thousands of distributors across Indonesia, from Sabang to Merauke, with main focus on Java, Bali, and Sumatra."
                }
              </p>
            </div>
            
            <div className="bg-card p-6 rounded-xl border hover:shadow-md transition-all">
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Users className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">{lang === 'id' ? "Dukungan Penuh" : "Full Support"}</h3>
              <p className="text-muted-foreground">
                {lang === 'id'
                  ? "Tim customer service yang responsif, training produk, dan dukungan marketing untuk membantu kesuksesan bisnis Anda."
                  : "Responsive customer service team, product training, and marketing support to help your business succeed."
                }
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16">
        <div className="container max-w-5xl mx-auto px-4">
          <div className="bg-card rounded-xl p-8 md:p-12 shadow-lg border-2 border-primary/10 text-center">
            <h2 className="text-3xl font-bold mb-4">
              {lang === 'id' 
                ? "Bergabunglah dengan Jaringan Distributor Baskit" 
                : "Join the Baskit Distributor Network"
              }
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-3xl mx-auto">
              {lang === 'id'
                ? "Jadilah bagian dari kesuksesan distribusi FMCG bersama ribuan distributor lainnya di seluruh Indonesia"
                : "Be part of the successful FMCG distribution along with thousands of other distributors throughout Indonesia"
              }
            </p>
            <a href="/daftar" className="inline-flex items-center justify-center h-11 px-8 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium shadow-[var(--shadow-elegant)] hover:shadow-[var(--shadow-glow)] hover:-translate-y-0.5 active:translate-y-0 transition-all">
              {lang === 'id' ? "Daftar Sekarang" : "Register Now"}
            </a>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
