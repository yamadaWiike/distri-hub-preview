import { Link, NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/use-language";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { translations } from "@/lib/translations";
import { ModernCartDrawer } from "../cart/NewModernCartDrawer";
import { Menu, X, ChevronDown, User, Home, Package, Info, Phone, LogOut, Globe, ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `px-4 py-2 rounded-md text-sm font-medium transition-colors relative ${
    isActive 
      ? "text-orange-600 font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-orange-500" 
      : "text-gray-700 hover:text-orange-600 hover:after:absolute hover:after:bottom-0 hover:after:left-0 hover:after:right-0 hover:after:h-0.5 hover:after:bg-orange-300"
  }`;

const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-2 px-4 py-3 transition-colors ${
    isActive ? "bg-accent text-foreground font-medium" : "text-foreground/80 hover:bg-accent/50"
  }`;

// Cart indicator component
function CartIndicator() {
  const { totalItems } = useCart();
  
  if (totalItems === 0) return null;
  
  return (
    <Badge variant="destructive" className="absolute -top-1 -right-1 px-1.5 min-w-[1.2rem] h-5 rounded-full">
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
        <div className="flex items-center gap-8">
          {isMobile && (
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(true)} className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
              
              <SheetContent side="left" className="w-[80%] max-w-[300px] p-0">
                <SheetHeader className="border-b p-4">
                  <div className="flex items-center justify-between">
                    <SheetTitle>Menu</SheetTitle>
                    <SheetClose asChild>
                      <Button variant="ghost" size="icon">
                        <X className="h-4 w-4" />
                      </Button>
                    </SheetClose>
                  </div>
                </SheetHeader>
                
                {/* Mobile Navigation Links */}
                <div className="py-3 flex flex-col">
                  <SheetClose asChild>
                    <NavLink to="/" className={mobileNavLinkClass}>
                      <Home className="h-4 w-4" /> {t.home}
                    </NavLink>
                  </SheetClose>
                  <SheetClose asChild>
                    <NavLink to="/daftar-produk" className={mobileNavLinkClass}>
                      <Package className="h-4 w-4" /> {t.productList}
                    </NavLink>
                  </SheetClose>
                  <SheetClose asChild>
                    <NavLink to="/tentang" className={mobileNavLinkClass}>
                      <Info className="h-4 w-4" /> {t.about}
                    </NavLink>
                  </SheetClose>
                  <SheetClose asChild>
                    <NavLink to="/hubungi" className={mobileNavLinkClass}>
                      <Phone className="h-4 w-4" /> {t.contact}
                    </NavLink>
                  </SheetClose>
                </div>
                
                {/* Language Selector (Mobile) */}
                <div className="border-t py-4 px-4">
                  <div className="text-sm font-medium mb-2 text-muted-foreground">
                    {lang === 'id' ? "Bahasa" : "Language"}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className={`flex-1 ${lang === 'id' ? 'bg-accent' : ''}`}
                      onClick={() => setLang('id')}
                    >
                      Bahasa Indonesia
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className={`flex-1 ${lang === 'en' ? 'bg-accent' : ''}`}
                      onClick={() => setLang('en')}
                    >
                      English
                    </Button>
                  </div>
                </div>
                
                {/* Auth Actions (Mobile) */}
                <div className="border-t py-4 px-4">
                  <div className="flex flex-col gap-2">
                    {user ? (
                      <>
                        <SheetClose asChild>
                          <Link to="/profil" className="w-full">
                            <Button variant="outline" className="w-full flex items-center justify-start gap-2">
                              <User className="h-4 w-4" /> {t.profile}
                            </Button>
                          </Link>
                        </SheetClose>
                        <ModernCartDrawer />
                        <Button 
                          variant="outline" 
                          className="w-full flex items-center justify-start gap-2 text-destructive" 
                          onClick={() => {
                            logout();
                            setMobileMenuOpen(false);
                          }}
                        >
                          <LogOut className="h-4 w-4" /> {t.logout}
                        </Button>
                      </>
                    ) : (
                      <>
                        <SheetClose asChild>
                          <Link to="/masuk" className="w-full">
                            <Button variant="outline" className="w-full">{t.login}</Button>
                          </Link>
                        </SheetClose>
                        <SheetClose asChild>
                          <Link to="/daftar" className="w-full">
                            <Button variant="hero" className="w-full">{t.register}</Button>
                          </Link>
                        </SheetClose>
                      </>
                    )}
                  </div>
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
              {lang === 'id' ? "Daftar Produk" : "Product List"}
            </NavLink>
            <NavLink to="/tentang" className={navLinkClass}>
              {lang === 'id' ? "Tentang Baskit" : "About Baskit"}
            </NavLink>
            <NavLink to="/hubungi" className={navLinkClass}>
              {lang === 'id' ? "Hubungi Kami" : "Contact Us"}
            </NavLink>
          </nav>
        )}
        
        {/* Right Side Actions */}
        <div className="flex items-center gap-3">
          {/* Language Switcher (Desktop) */}
          {!isMobile ? (
            <div className="hidden sm:flex items-center gap-1 border rounded-md p-0.5">
              <Button 
                variant={lang === 'id' ? 'secondary' : 'ghost'}
                size="sm" 
                aria-label="Bahasa Indonesia" 
                onClick={() => setLang('id')} 
                className={`text-xs ${lang === 'id' ? 'bg-gray-100' : ''}`}
              >
                ID
              </Button>
              <Button 
                variant={lang === 'en' ? 'secondary' : 'ghost'}
                size="sm" 
                aria-label="English" 
                onClick={() => setLang('en')} 
                className={`text-xs ${lang === 'en' ? 'bg-gray-100' : ''}`}
              >
                EN
              </Button>
            </div>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Globe className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setLang('id')} className={lang === 'id' ? 'bg-accent' : ''}>
                  Bahasa Indonesia
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLang('en')} className={lang === 'en' ? 'bg-accent' : ''}>
                  English
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          
          {/* Masuk Link */}
          {!user && !isMobile && (
            <Link to="/masuk">
              <Button variant="ghost" className="hidden sm:inline-flex text-gray-700 hover:text-orange-600">
                {t.login}
              </Button>
            </Link>
          )}
          
          {/* Daftar Distributor Button */}
          {!user && !isMobile && (
            <Link to="/daftar">
              <Button className="hidden sm:inline-flex bg-orange-500 hover:bg-orange-600 text-white rounded-lg px-5">
                {lang === 'id' ? "Daftar Distributor" : "Register Distributor"}
              </Button>
            </Link>
          )}
          
          {/* Cart */}
          {user && <ModernCartDrawer />}
          
          {/* Auth Actions (Desktop) - Only show if logged in */}
          {!isMobile && user ? (
            <>
              <Link to="/profil">
                <Button variant="ghost" className="hidden sm:inline-flex text-gray-700 hover:text-orange-600">
                  {t.profile}
                </Button>
              </Link>
              <Button variant="outline" onClick={logout} className="hidden sm:inline-flex text-gray-700 hover:text-orange-600">
                {t.logout}
              </Button>
            </>
          ) : null}
          
          {/* Mobile User Menu */}
          {isMobile && (
            user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <User className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to="/profil">
                      {t.profile}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={logout} className="text-destructive">
                    {t.logout}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/masuk">
                <Button variant="outline" size="icon">
                  <User className="h-4 w-4" />
                </Button>
              </Link>
            )
          )}
        </div>
      </div>
    </header>
  );
}
