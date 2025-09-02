import SEO from "@/components/seo/SEO";
import Navbar from "@/components/layout/Navbar";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Admin() {
  const { lang } = useLanguage();
  
  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Admin | Baskit Distributor Hub" 
        description={
          lang === 'id' 
            ? "Area internal untuk mengelola SKU dan aplikasi distributor."
            : "Internal area to manage SKUs and distributor applications."
        } 
      />
      <Navbar />
      <main className="container max-w-6xl mx-auto py-10 space-y-6">
        <h1 className="text-2xl font-bold">
          {lang === 'id' ? "Dashboard Admin" : "Admin Dashboard"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {lang === 'id'
            ? "Login admin diperlukan. Fitur unggah/edit SKU, set harga per provinsi, ekspor CSV, dan approval aplikasi akan ditambahkan pada integrasi backend."
            : "Admin login required. Features for uploading/editing SKUs, setting prices per province, exporting CSV, and application approval will be added with backend integration."
          }
        </p>
      </main>
    </div>
  );
}
