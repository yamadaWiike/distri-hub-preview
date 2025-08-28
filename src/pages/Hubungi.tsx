import SEO from "@/components/seo/SEO";
import Navbar from "@/components/layout/Navbar";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

export default function Hubungi() {
  const [form, setForm] = useState({
    name: "",
    business: "",
    area: "",
    phone: "",
    email: "",
    message: "",
  });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: "Terkirim", description: "Pesan Anda telah kami terima. Tim kami akan menghubungi Anda." });
    setForm({ name: "", business: "", area: "", phone: "", email: "", message: "" });
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Hubungi Kami | Baskit Distributor Hub" description="Informasi kontak dan FAQ untuk bantuan distributor." />
      <Navbar />
      <main className="container max-w-4xl mx-auto py-10 space-y-6">
        <h1 className="text-3xl font-bold">Hubungi Kami</h1>
        <p className="text-muted-foreground">Tim Baskit GT mendukung distributor dalam onboarding produk, negosiasi harga, dan perencanaan distribusi. Kami siap membantu kebutuhan bisnis Anda.</p>
        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Pertanyaan yang Sering Diajukan (FAQ)</h2>
          <ul className="list-disc pl-6 text-sm text-muted-foreground space-y-1">
            <li><span className="text-foreground font-medium">Bagaimana cara menjadi distributor?</span> Daftar melalui Distributor Hub kami dengan informasi bisnis Anda. Setelah verifikasi, Anda akan mendapat akses ke harga dan pemesanan.</li>
            <li><span className="text-foreground font-medium">Apakah ada minimum order?</span> Ya, setiap produk memiliki MOQ yang bervariasi berdasarkan wilayah. Anda akan melihat ini setelah login.</li>
            <li><span className="text-foreground font-medium">Wilayah mana saja yang dilayani?</span> Terutama Jawa, Bali, dan Sumatera. Filter area akan menampilkan produk yang tersedia di kota Anda.</li>
            <li><span className="text-foreground font-medium">Bagaimana mengetahui produk tersedia di kota saya?</span> Gunakan filter area — ini akan menampilkan hanya produk dan harga yang sesuai dengan wilayah Anda.</li>
            <li><span className="text-foreground font-medium">Siapa yang bisa dihubungi untuk bantuan?</span> Hubungi kami via WhatsApp/email yang tercantum, atau isi formulir kontak — kami akan segera merespons.</li>
            <li><span className="text-foreground font-medium">Berapa lama proses verifikasi distributor?</span> Proses verifikasi biasanya memakan waktu 1-3 hari kerja setelah dokumen lengkap diterima.</li>
            <li><span className="text-foreground font-medium">Apakah ada biaya pendaftaran menjadi distributor?</span> Tidak ada biaya pendaftaran. Gratis untuk bergabung sebagai distributor resmi Baskit.</li>
            <li><span className="text-foreground font-medium">Bagaimana sistem pembayaran?</span> Kami menerima transfer bank, dan pembayaran tempo sesuai kesepakatan untuk distributor terverifikasi.</li>
            <li><span className="text-foreground font-medium">Apakah ada dukungan pemasaran?</span> Ya, kami menyediakan materi pemasaran, training produk, dan dukungan promosi untuk distributor aktif.</li>
            <li><span className="text-foreground font-medium">Bagaimana cara melacak pesanan?</span> Setelah login, Anda dapat melacak status pesanan di dashboard distributor atau menghubungi tim kami.</li>
          </ul>
        </section>
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Formulir Kontak</h2>
          <form onSubmit={onSubmit} className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-1">
              <Label className="text-sm text-muted-foreground">Nama</Label>
              <Input value={form.name} onChange={set('name')} required />
            </div>
            <div className="sm:col-span-1">
              <Label className="text-sm text-muted-foreground">Nama Bisnis</Label>
              <Input value={form.business} onChange={set('business')} required />
            </div>
            <div className="sm:col-span-1">
              <Label className="text-sm text-muted-foreground">Area (Kota/Provinsi)</Label>
              <Input value={form.area} onChange={set('area')} required />
            </div>
            <div className="sm:col-span-1">
              <Label className="text-sm text-muted-foreground">Nomor Telepon</Label>
              <Input value={form.phone} onChange={set('phone')} required />
            </div>
            <div className="sm:col-span-1">
              <Label className="text-sm text-muted-foreground">Email</Label>
              <Input type="email" value={form.email} onChange={set('email')} required />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-sm text-muted-foreground">Pesan</Label>
              <Textarea value={form.message} onChange={set('message')} rows={5} required />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" variant="hero" className="w-full">Kirim</Button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}