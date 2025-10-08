/**
 * 404 Not Found Page
 * Displayed when user navigates to a non-existent route
 */

// Third-party imports
import { useLocation } from "react-router-dom";
import { useEffect } from "react";

// Hooks
import { useLanguage } from "@/hooks/use-language";

// Utils
import { translations } from "@/lib/translations";

/**
 * NotFound Component
 * Displays a 404 error page with a link back to home
 */
const NotFound = () => {
  // Get current location and language
  const location = useLocation();
  const { lang } = useLanguage();
  const t = translations[lang];

  /**
   * Log the 404 error when component mounts
   */
  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  /**
   * Render the 404 page
   */
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        {/* Error code */}
        <h1 className="text-4xl font-bold mb-4">404</h1>
        
        {/* Error message */}
        <p className="text-xl text-muted-foreground mb-4">
          {lang === 'id' ? "Oops! Halaman tidak ditemukan" : "Oops! Page not found"}
        </p>
        
        {/* Link back to home */}
        <a href="/" className="text-primary underline-offset-4 hover:underline">
          {lang === 'id' ? "Kembali ke Beranda" : "Back to Home"}
        </a>
      </div>
    </div>
  );
};

export default NotFound;
