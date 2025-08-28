import SEO from "@/components/seo/SEO";
import Navbar from "@/components/layout/Navbar";

export default function Admin() {
  return (
    <div className="min-h-screen bg-background">
      <SEO title="Admin | Baskit Distributor Hub" description="Area internal untuk mengelola SKU dan aplikasi distributor." />
      <Navbar />
      <main className="container max-w-6xl mx-auto py-10 space-y-6">
        <h1 className="text-2xl font-bold">Dashboard Admin</h1>
        <p className="text-sm text-muted-foreground">Login admin diperlukan. Fitur unggah/edit SKU, set harga per provinsi, ekspor CSV, dan approval aplikasi akan ditambahkan pada integrasi backend.</p>
      </main>
    </div>
  );
}
