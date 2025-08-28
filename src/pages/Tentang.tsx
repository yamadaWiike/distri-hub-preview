import SEO from "@/components/seo/SEO";
import Navbar from "@/components/layout/Navbar";

export default function Tentang() {
  return (
    <div className="min-h-screen bg-background">
      <SEO title="Tentang Baskit | Distributor Hub" description="Profil perusahaan Baskit dan komitmen kami kepada distributor." />
      <Navbar />
      <main className="container max-w-4xl mx-auto py-10 space-y-6">
        <h1 className="text-3xl font-bold">Tentang Baskit</h1>
        <p className="text-muted-foreground">
          Platform distribusi FMCG terdepan di Indonesia yang menghubungkan produsen dengan distributor untuk menciptakan ekosistem perdagangan yang efisien dan menguntungkan.
        </p>
        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Misi Kami</h2>
          <p className="text-muted-foreground">Memudahkan akses distribusi produk FMCG berkualitas tinggi ke seluruh Indonesia dengan teknologi modern, transparansi harga, dan layanan terpercaya yang mendukung pertumbuhan bisnis mitra distributor.</p>
        </section>
        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Visi Kami</h2>
          <p className="text-muted-foreground">Menjadi platform distribusi FMCG nomor satu di Indonesia yang menghubungkan ribuan produsen dan distributor dalam ekosistem perdagangan yang adil, transparan, dan berkelanjutan.</p>
        </section>
        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Mengapa Memilih Baskit?</h2>
          <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
            <li><span className="font-medium text-foreground">Produk Berkualitas:</span> Semua produk telah melalui seleksi ketat dan memiliki sertifikasi halal serta standar kualitas internasional.</li>
            <li><span className="font-medium text-foreground">Jaringan Luas:</span> Terhubung dengan ribuan distributor di seluruh Indonesia, dari Sabang hingga Merauke, dengan fokus utama di Jawa, Bali, dan Sumatera.</li>
            <li><span className="font-medium text-foreground">Dukungan Penuh:</span> Tim customer service yang responsif, training produk, dan dukungan marketing untuk membantu kesuksesan bisnis Anda.</li>
          </ul>
        </section>
      </main>
    </div>
  );
}
