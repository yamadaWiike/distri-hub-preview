import SEO from "@/components/seo/SEO";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useLanguage } from "@/hooks/use-language";
import { translations } from "@/lib/translations";

export default function Masuk() {
  const { login } = useAuth();
  const { lang } = useLanguage();
  const t = translations[lang];
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password);
    navigate('/daftar-produk');
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title={lang === 'id' ? "Masuk | Baskit Distributor Hub" : "Login | Baskit Distributor Hub"}
        description={lang === 'id' 
          ? "Masuk untuk melihat harga distributor dan simulasi."
          : "Login to view distributor prices and simulation."
        } 
      />
      <Navbar />
      <main className="container max-w-md mx-auto py-10">
        <h1 className="text-2xl font-bold mb-6">{lang === 'id' ? "Masuk" : "Login"}</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground">Email</label>
            <input className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" value={email} onChange={(e)=>setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">{lang === 'id' ? "Password" : "Password"}</label>
            <input type="password" className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" value={password} onChange={(e)=>setPassword(e.target.value)} required />
          </div>
          <Button variant="hero" className="w-full">{lang === 'id' ? "Masuk" : "Login"}</Button>
        </form>
        <p className="text-sm text-muted-foreground mt-4">
          {lang === 'id' 
            ? <>Belum punya akun? <Link to="/daftar" className="text-primary underline-offset-4 hover:underline">Daftar</Link></>
            : <>Don't have an account? <Link to="/daftar" className="text-primary underline-offset-4 hover:underline">Register</Link></>
          }
        </p>
      </main>
    </div>
  );
}
