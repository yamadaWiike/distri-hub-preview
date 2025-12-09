// React & Router
import { useState, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";

// External Libraries & Icons
import {
  Menu,
  User,
  Home,
  Package,
  Info,
  Phone,
  LogOut,
  Languages,
  LogIn,
} from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ModernCartDrawer } from "../cart/NewModernCartDrawer";

// Hooks
import { useLanguage } from "@/hooks/use-language";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { useIsMobile } from "@/hooks/use-mobile";

// Utils & Data
import { translations } from "@/lib/translations";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `px-4 py-2 rounded-md text-sm font-medium transition-colors relative ${
    isActive
      ? "text-orange-600 font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-orange-500"
      : "text-gray-700 hover:text-orange-600 hover:after:absolute hover:after:bottom-0 hover:after:left-0 hover:after:right-0 hover:after:h-0.5 hover:after:bg-orange-300"
  }`;

const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-2 px-4 py-3 transition-colors ${
    isActive
      ? "bg-accent text-foreground font-medium"
      : "text-foreground/80 hover:bg-accent/50"
  }`;

// Cart indicator component
function CartIndicator() {
  const { totalItems } = useCart();

  if (totalItems === 0) return null;

  return (
    <Badge
      variant="destructive"
      className="absolute -top-1 -right-1 px-1.5 min-w-[1.2rem] h-5 rounded-full"
    >
      {totalItems}
    </Badge>
  );
}

export default function Navbar() {
  const { lang, setLang } = useLanguage();
  const { user, logout } = useAuth();
  const t = translations[lang];
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close the mobile menu when resizing to desktop
  useEffect(() => {
    if (!isMobile) {
      setMobileMenuOpen(false);
    }
  }, [isMobile]);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90 shadow-sm">
      <div className="container max-w-7xl mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          {isMobile && (
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>

              <SheetContent side="left" className="w-[80%] max-w-[300px] p-0">
                <SheetHeader className="border-b p-4">
                  <div className="flex items-center justify-between">
                    <SheetTitle>Menu</SheetTitle>
                  </div>
                </SheetHeader>

                {/* Mobile Navigation Links */}
                <div className="py-3 flex flex-col">
                  <SheetClose asChild>
                    <NavLink to="/" className={mobileNavLinkClass}>
                      <div className="flex justify-start items-center">
                        <Home className="h-4 w-4 me-3" /> {t.home}
                      </div>
                    </NavLink>
                  </SheetClose>
                  <SheetClose asChild>
                    <NavLink to="/daftar-produk" className={mobileNavLinkClass}>
                      <div className="flex justify-start items-center">
                        <Package className="h-4 w-4 me-3" /> {t.productList}
                      </div>
                    </NavLink>
                  </SheetClose>
                  <SheetClose asChild>
                    <NavLink to="/tentang" className={mobileNavLinkClass}>
                      <div className="flex justify-start items-center">
                        <Info className="h-4 w-4 me-3" /> {t.about}
                      </div>
                    </NavLink>
                  </SheetClose>
                  <SheetClose asChild>
                    <NavLink to="/hubungi" className={mobileNavLinkClass}>
                      <div className="flex justify-start items-center">
                        <Phone className="h-4 w-4 me-3" /> {t.contact}
                      </div>
                    </NavLink>
                  </SheetClose>
                </div>
              </SheetContent>
            </Sheet>
          )}

          <Link to="/" className="flex items-center gap-2">
            <img src="/assets/baskit-logo.png" alt="Baskit" className="h-8" />
          </Link>
        </div>

        {/* Desktop Navigation */}
        {!isMobile && (
          <nav className="hidden md:flex items-center gap-1">
            <NavLink to="/" className={navLinkClass}>
              {t.home}
            </NavLink>
            <NavLink to="/daftar-produk" className={navLinkClass}>
              {lang === "id" ? "Daftar Produk" : "Product List"}
            </NavLink>
            <NavLink to="/tentang" className={navLinkClass}>
              {lang === "id" ? "Tentang Baskit" : "About Baskit"}
            </NavLink>
            <NavLink to="/hubungi" className={navLinkClass}>
              {lang === "id" ? "Hubungi Kami" : "Contact Us"}
            </NavLink>
          </nav>
        )}

        {/* Right Side Actions */}
        <div className="flex items-center gap-3">
          {/* Language Switcher (Desktop) */}
          {!isMobile ? (
            <div className="hidden sm:flex items-center gap-1 border rounded-md p-0.5">
              <Button
                variant={lang === "id" ? "secondary" : "ghost"}
                size="sm"
                aria-label="Bahasa Indonesia"
                onClick={() => setLang("id")}
                className={`text-xs ${lang === "id" ? "bg-gray-100" : ""}`}
              >
                ID
              </Button>
              <Button
                variant={lang === "en" ? "secondary" : "ghost"}
                size="sm"
                aria-label="English"
                onClick={() => setLang("en")}
                className={`text-xs ${lang === "en" ? "bg-gray-100" : ""}`}
              >
                EN
              </Button>
            </div>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Languages className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => setLang("id")}
                  className={lang === "id" ? "bg-accent" : ""}
                >
                  Bahasa Indonesia
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setLang("en")}
                  className={lang === "en" ? "bg-accent" : ""}
                >
                  English
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Masuk Link */}
          {!user && !isMobile && (
            <Link to="/masuk">
              <Button
                variant="ghost"
                className="hidden sm:inline-flex text-gray-700 hover:text-orange-600"
              >
                {t.login}
              </Button>
            </Link>
          )}

          {/* Daftar Distributor Button */}
          {!user && !isMobile && (
            <Link to="/daftar">
              <Button className="hidden sm:inline-flex bg-orange-500 hover:bg-orange-600 text-white rounded-lg px-5">
                {lang === "id" ? "Daftar Distributor" : "Register Distributor"}
              </Button>
            </Link>
          )}

          {/* Cart */}
          {user && <ModernCartDrawer />}

          {/* Auth Actions (Desktop) - Only show if logged in */}
          {!isMobile && user ? (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="default">
                    <span className="text-sm">{user.email}</span>
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <div className="w-full flex justify-start items-center font-normal">
                      <User className="h-4 w-4 me-2" />
                      <Link to="/profil">{t.profile}</Link>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => logout()}
                    className="text-destructive cursor-pointer"
                  >
                    <div className="w-full flex justify-start items-center font-normal">
                      <LogOut className="h-4 w-4 me-2" />
                      {t.logout}
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : null}

          {/* Mobile User Menu */}
          {isMobile &&
            (user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="default">
                    <span className="text-sm overflow-hidden text-ellipsis whitespace-nowrap max-w-20">
                      {user.email}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <div className="w-full flex justify-start items-center font-normal">
                      <User className="h-4 w-4 me-2" />
                      <Link to="/profil">{t.profile}</Link>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => logout()}
                    className="text-destructive"
                  >
                    <div className="w-full flex justify-start items-center font-normal">
                      <LogOut className="h-4 w-4 me-2" />
                      {t.logout}
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/masuk">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-700 hover:text-orange-600"
                  >
                    {t.login}
                  </Button>
                </Link>
                <Link to="/daftar">
                  <Button
                    size="sm"
                    className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg"
                  >
                    {lang === "id" ? "Daftar" : "Register"}
                  </Button>
                </Link>
              </div>
            ))}
        </div>
      </div>
    </header>
  );
}
