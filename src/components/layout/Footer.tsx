// React & Router
import { Link } from "react-router-dom";

// Hooks
import { useLanguage } from "@/hooks/use-language";

export default function Footer() {
  const { lang } = useLanguage();

  const t = {
    id: {
      home: "Beranda",
      products: "Produk",
      productList: "Daftar Produk",
      aboutBaskit: "Tentang Baskit",
      contactUs: "Hubungi Kami",
      account: "Akun",
      login: "Masuk",
      register: "Daftar",
      profile: "Profil",
      copyright: "© 2025 Baskit. Semua hak dilindungi.",
    },
    en: {
      home: "Home",
      products: "Products",
      productList: "Product List",
      aboutBaskit: "About Baskit",
      contactUs: "Contact Us",
      account: "Account",
      login: "Login",
      register: "Register",
      profile: "Profile",
      copyright: "© 2025 Baskit. All rights reserved.",
    },
  };

  const translation = t[lang];

  return (
    <footer className="bg-slate-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <img src="/assets/baskit-logo.png" alt="Baskit" className="h-8 brightness-0 invert" />
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed">
              {lang === 'id' 
                ? 'Area Distribusi Tertarget - Produk dan harga disesuaikan dengan area distribusi Anda, memberikan fleksibilitas dan fokus pasar yang lebih baik.'
                : 'Targeted Distribution Area - Products and prices tailored to your distribution area, providing better flexibility and market focus.'}
            </p>
          </div>

          {/* Navigation Section - matching header */}
          <div>
            <h3 className="font-semibold text-lg mb-4">{translation.products}</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-400 hover:text-orange-400 transition-colors text-sm">
                  {translation.home}
                </Link>
              </li>
              <li>
                <Link to="/daftar-produk" className="text-gray-400 hover:text-orange-400 transition-colors text-sm">
                  {translation.productList}
                </Link>
              </li>
              <li>
                <Link to="/tentang" className="text-gray-400 hover:text-orange-400 transition-colors text-sm">
                  {translation.aboutBaskit}
                </Link>
              </li>
              <li>
                <Link to="/hubungi" className="text-gray-400 hover:text-orange-400 transition-colors text-sm">
                  {translation.contactUs}
                </Link>
              </li>
            </ul>
          </div>

          {/* Account Section */}
          <div>
            <h3 className="font-semibold text-lg mb-4">{translation.account}</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/masuk" className="text-gray-400 hover:text-orange-400 transition-colors text-sm">
                  {translation.login}
                </Link>
              </li>
              <li>
                <Link to="/daftar" className="text-gray-400 hover:text-orange-400 transition-colors text-sm">
                  {translation.register}
                </Link>
              </li>
              <li>
                <Link to="/profil" className="text-gray-400 hover:text-orange-400 transition-colors text-sm">
                  {translation.profile}
                </Link>
              </li>
            </ul>
          </div>

          {/* Empty column for spacing - can be used for additional links later */}
          <div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-700 mt-8 pt-6 text-center">
          <p className="text-sm text-gray-400">{translation.copyright}</p>
          <p className="text-xs text-gray-500 mt-2">v2.3.2</p>
        </div>
      </div>
    </footer>
  );
}
