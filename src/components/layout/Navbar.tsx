import { Link, NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/use-auth";
import { translations } from "@/lib/translations";
import { CartDrawer } from "../cart/CartDrawer";
import { Menu, X, ChevronDown, User, Home, Package, Info, Phone, LogOut, Globe } from "lucide-react";
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
  `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
    isActive ? "text-foreground bg-accent" : "text-foreground/80 hover:text-foreground"
  }`;

const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-2 px-4 py-3 transition-colors ${
    isActive ? "bg-accent text-foreground font-medium" : "text-foreground/80 hover:bg-accent/50"
  }`;

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
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container max-w-6xl mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
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
          
          <Link to="/" className="font-semibold tracking-tight text-lg whitespace-nowrap">
            Baskit Distributor Hub
          </Link>
        </div>
        
        {/* Desktop Navigation */}
        {!isMobile && (
          <nav className="hidden md:flex items-center gap-1">
            <NavLink to="/" className={navLinkClass}>
              {t.home}
            </NavLink>
            <NavLink to="/daftar-produk" className={navLinkClass}>
              {t.productList}
            </NavLink>
            <NavLink to="/tentang" className={navLinkClass}>
              {t.about}
            </NavLink>
            <NavLink to="/hubungi" className={navLinkClass}>
              {t.contact}
            </NavLink>
          </nav>
        )}
        
        {/* Right Side Actions */}
        <div className="flex items-center gap-2">
          {/* Language Switcher (Desktop) */}
          {!isMobile ? (
            <div className="hidden sm:flex items-center gap-1">
              <Button 
                variant="outline" 
                size="sm" 
                aria-label="Bahasa Indonesia" 
                onClick={() => setLang('id')} 
                className={lang === 'id' ? 'bg-accent' : ''}
              >
                ID
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                aria-label="English" 
                onClick={() => setLang('en')} 
                className={lang === 'en' ? 'bg-accent' : ''}
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
          
          {/* Cart */}
          <CartDrawer />
          
          {/* Auth Actions (Desktop) */}
          {!isMobile ? (
            <>
              {user ? (
                <>
                  <Link to="/profil">
                    <Button variant="ghost" className="hidden sm:inline-flex">
                      {t.profile}
                    </Button>
                  </Link>
                  <Button variant="outline" onClick={logout} className="hidden sm:inline-flex">
                    {t.logout}
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/masuk">
                    <Button variant="ghost" className="hidden sm:inline-flex">
                      {t.login}
                    </Button>
                  </Link>
                  <Link to="/daftar">
                    <Button variant="hero" className="hidden sm:inline-flex">
                      {t.register}
                    </Button>
                  </Link>
                </>
              )}
            </>
          ) : (
            /* User Menu (Mobile) */
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
