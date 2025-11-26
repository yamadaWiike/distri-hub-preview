import { useState, useEffect } from "react";
import SEO from "@/components/seo/SEO";
import Navbar from "@/components/layout/Navbar";
import AdminSidebar from "@/components/layout/AdminSidebar";
import UserManagementRevamped from "@/components/admin/UserManagementRevamped";
import { useLanguage } from "@/hooks/use-language";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminUsers() {
  const { lang } = useLanguage();
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);

  const t = lang === 'id' ? {
    title: "Kelola Pengguna",
    description: "Kelola pengguna sistem",
    accessDenied: "Akses Ditolak",
    adminAccessOnly: "Area khusus admin",
    adminAccessRequired: "Anda harus masuk sebagai admin untuk mengakses halaman ini.",
    backToHome: "Kembali ke Beranda",
    loading: "Memuat..."
  } : {
    title: "Manage Users",
    description: "Manage system users",
    accessDenied: "Access Denied",
    adminAccessOnly: "Admin area only",
    adminAccessRequired: "You must be logged in as an admin to access this page.",
    backToHome: "Back to Home",
    loading: "Loading..."
  };

  useEffect(() => {
    const checkAdmin = async () => {
      if (!isLoading && user) {
        setIsAdmin(user.role === 'admin');
      } else if (!isLoading && !user) {
        navigate("/masuk");
      }
    };
    checkAdmin();
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">{t.loading}</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <SEO title={t.accessDenied} description={t.adminAccessOnly} />
        <Navbar />
        <main className="container max-w-md mx-auto py-20">
          <Card className="p-6 space-y-4 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500" />
            <h1 className="text-2xl font-bold">{t.accessDenied}</h1>
            <p className="text-muted-foreground">{t.adminAccessRequired}</p>
            <Button onClick={() => navigate("/")}>{t.backToHome}</Button>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO title={t.title} description={t.description} />
      <Navbar />
      <div className="flex">
        <AdminSidebar lang={lang} />
        <main className="flex-1 py-8 px-4 lg:px-8">
          <UserManagementRevamped />
        </main>
      </div>
    </div>
  );
}
