import SEO from "@/components/seo/SEO";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/lib/translations";

export default function Daftar() {
  const { register } = useAuth();
  const { lang } = useLanguage();
  const t = translations[lang];
  const [form, setForm] = useState({
    namaBisnis: "",
    alamatLengkap: "",
    kota: "",
    namaPemilik: "",
    kontakPemilik: "",
    email: "",
    password: "",
  });
  const navigate = useNavigate();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await register({
      email: form.email,
      password: form.password,
      namaBisnis: form.namaBisnis,
      alamatLengkap: form.alamatLengkap,
      kota: form.kota,
      namaPemilik: form.namaPemilik,
      kontakPemilik: form.kontakPemilik,
    });
    navigate('/daftar-produk');
  };

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title={lang === 'id' ? "Daftar | Baskit Distributor Hub" : "Register | Baskit Distributor Hub"}
        description={lang === 'id' 
          ? "Daftar untuk melihat harga distributor dan akses simulasi penuh."
          : "Register to view distributor prices and full simulation access."
        } 
      />
      <Navbar />
      <main className="container max-w-2xl mx-auto py-10">
        <h1 className="text-2xl font-bold mb-6">{lang === 'id' ? "Pendaftaran Distributor" : "Distributor Registration"}</h1>
        <form onSubmit={onSubmit} className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="text-sm text-muted-foreground">{lang === 'id' ? "Nama Bisnis" : "Business Name"}</label>
            <input required className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" value={form.namaBisnis} onChange={set('namaBisnis')} />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm text-muted-foreground">{lang === 'id' ? "Alamat Lengkap Bisnis" : "Complete Business Address"}</label>
            <input required className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" value={form.alamatLengkap} onChange={set('alamatLengkap')} />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">{lang === 'id' ? "Kota/Kabupaten" : "City/Regency"}</label>
            <input required className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" value={form.kota} onChange={set('kota')} />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">{lang === 'id' ? "Nama Pemilik" : "Owner Name"}</label>
            <input required className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" value={form.namaPemilik} onChange={set('namaPemilik')} />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">{lang === 'id' ? "Kontak Pemilik" : "Owner Contact"}</label>
            <input required className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" value={form.kontakPemilik} onChange={set('kontakPemilik')} />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">{lang === 'id' ? "Email Pemilik" : "Owner Email"}</label>
            <input type="email" required className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" value={form.email} onChange={set('email')} />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">{lang === 'id' ? "Buat Password" : "Create Password"}</label>
            <input type="password" required className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" value={form.password} onChange={set('password')} />
          </div>
          <div className="sm:col-span-2">
            <Button variant="hero" className="w-full">{lang === 'id' ? "Lanjutkan" : "Continue"}</Button>
          </div>
        </form>
      </main>
    </div>
  );
}
