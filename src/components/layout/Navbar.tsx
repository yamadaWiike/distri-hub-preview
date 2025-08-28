import { Link, NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
    isActive ? "text-foreground bg-accent" : "text-foreground/80 hover:text-foreground"
  }`;

export default function Navbar() {
  const { lang, setLang } = useLanguage();
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container max-w-6xl mx-auto flex h-16 items-center justify-between">
        <Link to="/" className="font-semibold tracking-tight text-lg">
          Baskit Distributor Hub
        </Link>
        <nav className="flex items-center gap-1">
          <NavLink to="/daftar-produk" className={navLinkClass}>
            Daftar Produk
          </NavLink>
          <NavLink to="/tentang" className={navLinkClass}>
            Tentang Baskit
          </NavLink>
          <NavLink to="/hubungi" className={navLinkClass}>
            Hubungi Kami
          </NavLink>
        </nav>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" aria-label="Bahasa Indonesia" onClick={() => setLang('id')} className={lang === 'id' ? 'bg-accent' : ''}>ID</Button>
            <Button variant="outline" size="sm" aria-label="English" onClick={() => setLang('en')} className={lang === 'en' ? 'bg-accent' : ''}>EN</Button>
          </div>
          <Link to="/masuk">
            <Button variant="ghost">Masuk</Button>
          </Link>
          <Link to="/daftar">
            <Button variant="hero">Daftar Distributor</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
