import SEO from "@/components/seo/SEO";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/layout/Navbar";
import heroImage from "@/assets/hero-baskit.jpg";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO title="Baskit Distributor Hub" description="Katalog produk, harga, MOQ, dan pendaftaran distributor Baskit." />
      <Navbar />
      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(1200px_600px_at_30%_-10%,hsl(var(--accent)),transparent)]"/>
          <div className="container max-w-6xl mx-auto grid md:grid-cols-2 items-center gap-8 py-12 md:py-20">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                Portal Resmi Distributor GT Baskit
              </h1>
              <p className="text-lg text-muted-foreground">
                Jelajahi katalog, simulasi keuntungan, dan daftar sebagai distributor untuk melihat harga khusus per provinsi.
              </p>
              <div className="flex gap-3">
                <Link to="/daftar-produk">
                  <Button variant="hero" size="lg">Lihat Daftar Produk</Button>
                </Link>
                <Link to="/daftar">
                  <Button variant="soft" size="lg">Daftar Distributor</Button>
                </Link>
              </div>
            </div>
            <div className="rounded-xl overflow-hidden border shadow-[var(--shadow-elegant)]">
              <img src={heroImage} alt="Hero distributor Baskit" loading="lazy" className="w-full h-full object-cover" />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Index;
