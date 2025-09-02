import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/lib/translations";

const NotFound = () => {
  const location = useLocation();
  const { lang } = useLanguage();
  const t = translations[lang];

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl text-muted-foreground mb-4">
          {lang === 'id' ? "Oops! Halaman tidak ditemukan" : "Oops! Page not found"}
        </p>
        <a href="/" className="text-primary underline-offset-4 hover:underline">
          {lang === 'id' ? "Kembali ke Beranda" : "Back to Home"}
        </a>
      </div>
    </div>
  );
};

export default NotFound;
