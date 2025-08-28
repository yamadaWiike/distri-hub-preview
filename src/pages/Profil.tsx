import SEO from "@/components/seo/SEO";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Profil() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    omzet: "",
    alamatKantor: "",
    alamatGudang: "",
    bentukUsaha: "",
    fotoGudang: "",
    koordinat: "",
    bank: "",
    norek: "",
    namaRek: "",
    nib: "",
  });

  useEffect(() => {
    if (!user) navigate('/masuk');
  }, [user, navigate]);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('baskit_profile', JSON.stringify(form));
    alert('Profil tersimpan. Tim Baskit akan melakukan verifikasi.');
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Lengkapi Profil | Baskit Distributor Hub" description="Lengkapi data untuk proses onboarding dan pembelian." />
      <Navbar />
      <main className="container max-w-3xl mx-auto py-10">
        <h1 className="text-2xl font-bold mb-6">Lengkapi Profil</h1>
        <form onSubmit={onSubmit} className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-muted-foreground">Estimasi Omzet Bulanan (IDR)</label>
            <input required className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" value={form.omzet} onChange={set('omzet')} />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm text-muted-foreground">Alamat Kantor</label>
            <input required className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" value={form.alamatKantor} onChange={set('alamatKantor')} />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm text-muted-foreground">Alamat Gudang</label>
            <input required className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" value={form.alamatGudang} onChange={set('alamatGudang')} />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Bentuk Badan Usaha</label>
            <input placeholder="PT / CV / Perorangan / Lainnya" required className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" value={form.bentukUsaha} onChange={set('bentukUsaha')} />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Koordinat Lokasi</label>
            <input placeholder="-6.2, 106.8" required className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" value={form.koordinat} onChange={set('koordinat')} />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Nama Bank</label>
            <input required className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" value={form.bank} onChange={set('bank')} />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">No. Rekening</label>
            <input required className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" value={form.norek} onChange={set('norek')} />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Nama Pemilik Rekening</label>
            <input required className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" value={form.namaRek} onChange={set('namaRek')} />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm text-muted-foreground">NIB</label>
            <input required className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" value={form.nib} onChange={set('nib')} />
          </div>
          <div className="sm:col-span-2">
            <p className="text-sm text-muted-foreground">Upload dokumen (Akta Perusahaan, KTP Pemilik, NPWP) akan ditambahkan pada versi berikut.</p>
          </div>
          <div className="sm:col-span-2">
            <Button variant="hero" className="w-full">Simpan Profil</Button>
          </div>
        </form>
        <p className="text-sm text-muted-foreground mt-6">Jika Anda membutuhkan bantuan untuk pembelian, silakan hubungi tim Baskit melalui halaman Hubungi Kami.</p>
      </main>
    </div>
  );
}
