import SEO from "@/components/seo/SEO";
import Navbar from "@/components/layout/Navbar";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { AtSign, Building, Loader2, Mail, MapPin, MessageSquare, Phone, Users } from "lucide-react";

export default function Hubungi() {
  const [form, setForm] = useState({
    name: "",
    business: "",
    area: "",
    phone: "",
    email: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value });
  
  // Check for success query parameter on component mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      setIsSuccess(true);
      toast({ 
        title: "Terkirim", 
        description: "Pesan Anda telah kami terima. Tim kami akan menghubungi Anda segera." 
      });
      // Remove the query parameter from URL without refreshing
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const apiKey = import.meta.env.VITE_WEB3FORMS_KEY;
      
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          access_key: apiKey,
          name: form.name,
          business: form.business,
          area: form.area,
          email: form.email,
          phone: form.phone,
          message: form.message,
          subject: `Kontak dari ${form.name} - ${form.business}`,
          botcheck: "",
          from_name: "Baskit Distributor Hub",
          redirect: window.location.origin + "/hubungi?success=true",
        }),
      });
      
      const result = await response.json();
      if (result.success) {
        toast({ 
          title: "Terkirim", 
          description: "Pesan Anda telah kami terima. Tim kami akan menghubungi Anda segera."
        });
        setForm({ name: "", business: "", area: "", phone: "", email: "", message: "" });
      } else {
        toast({ 
          title: "Gagal", 
          description: "Terjadi kesalahan saat mengirim pesan. Silakan coba lagi nanti.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({ 
        title: "Gagal", 
        description: "Terjadi kesalahan saat mengirim pesan. Silakan coba lagi nanti.",
        variant: "destructive"
      });
      console.error("Form submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Hubungi Kami | Baskit Distributor Hub" description="Informasi kontak dan FAQ untuk bantuan distributor." />
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative py-16 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(800px_600px_at_50%_-10%,hsl(var(--primary)/10),transparent)]"/>
        <div className="container max-w-5xl mx-auto text-center px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Hubungi Kami</h1>
          <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
            Tim Baskit GT mendukung distributor dalam onboarding produk, negosiasi harga, dan perencanaan distribusi. Kami siap membantu kebutuhan bisnis Anda.
          </p>
          

        </div>
      </section>
      
      <main className="container max-w-6xl mx-auto pb-16 px-4">
        <div className="grid md:grid-cols-5 gap-8 mt-8">
          {/* FAQ Section - 3 columns */}
          <div className="md:col-span-3">
            <div className="bg-card border rounded-xl p-6 shadow-sm">
              <h2 className="text-2xl font-bold mb-6 flex items-center">
                <Users className="mr-2 h-6 w-6 text-primary" />
                Pertanyaan yang Sering Diajukan (FAQ)
              </h2>
              
              <div className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  {/* Left column */}
                  <div className="space-y-4">
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <h3 className="font-medium mb-1.5">Bagaimana cara menjadi distributor?</h3>
                      <p className="text-sm text-muted-foreground">Daftar melalui Distributor Hub kami dengan informasi bisnis Anda. Setelah verifikasi, Anda akan mendapat akses ke harga dan pemesanan.</p>
                    </div>
                    
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <h3 className="font-medium mb-1.5">Apakah ada minimum order?</h3>
                      <p className="text-sm text-muted-foreground">Ya, setiap produk memiliki MOQ yang bervariasi berdasarkan wilayah. Anda akan melihat ini setelah login.</p>
                    </div>
                    
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <h3 className="font-medium mb-1.5">Wilayah mana saja yang dilayani?</h3>
                      <p className="text-sm text-muted-foreground">Terutama Jawa, Bali, dan Sumatera. Filter area akan menampilkan produk yang tersedia di kota Anda.</p>
                    </div>
                    
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <h3 className="font-medium mb-1.5">Bagaimana mengetahui produk tersedia di kota saya?</h3>
                      <p className="text-sm text-muted-foreground">Gunakan filter area — ini akan menampilkan hanya produk dan harga yang sesuai dengan wilayah Anda.</p>
                    </div>
                    
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <h3 className="font-medium mb-1.5">Siapa yang bisa dihubungi untuk bantuan?</h3>
                      <p className="text-sm text-muted-foreground">Isi formulir kontak pada halaman ini — tim kami akan segera merespons pertanyaan Anda.</p>
                    </div>
                  </div>
                  
                  {/* Right column */}
                  <div className="space-y-4">
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <h3 className="font-medium mb-1.5">Berapa lama proses verifikasi distributor?</h3>
                      <p className="text-sm text-muted-foreground">Proses verifikasi biasanya memakan waktu 1-3 hari kerja setelah dokumen lengkap diterima.</p>
                    </div>
                    
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <h3 className="font-medium mb-1.5">Apakah ada biaya pendaftaran menjadi distributor?</h3>
                      <p className="text-sm text-muted-foreground">Tidak ada biaya pendaftaran. Gratis untuk bergabung sebagai distributor resmi Baskit.</p>
                    </div>
                    
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <h3 className="font-medium mb-1.5">Bagaimana sistem pembayaran?</h3>
                      <p className="text-sm text-muted-foreground">Kami menerima transfer bank, dan pembayaran tempo sesuai kesepakatan untuk distributor terverifikasi.</p>
                    </div>
                    
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <h3 className="font-medium mb-1.5">Apakah ada dukungan pemasaran?</h3>
                      <p className="text-sm text-muted-foreground">Ya, kami menyediakan materi pemasaran, training produk, dan dukungan promosi untuk distributor aktif.</p>
                    </div>
                    
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <h3 className="font-medium mb-1.5">Bagaimana cara melacak pesanan?</h3>
                      <p className="text-sm text-muted-foreground">Setelah login, Anda dapat melacak status pesanan di dashboard distributor atau menghubungi tim kami.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Contact Form - 2 columns */}
          <div className="md:col-span-2">
            <div className="bg-card border rounded-xl p-6 shadow-sm h-full">
              <h2 className="text-2xl font-bold mb-6 flex items-center">
                <MessageSquare className="mr-2 h-6 w-6 text-primary" />
                Formulir Kontak
              </h2>
              
              {isSuccess && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
                  <p className="flex items-center font-medium">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                    </svg>
                    Pesan Anda telah kami terima!
                  </p>
                  <p className="mt-1 text-sm">Tim kami akan menghubungi Anda segera.</p>
                </div>
              )}
              
              <form onSubmit={onSubmit} className="space-y-4">
                {/* Honeypot field to prevent spam */}
                <input
                  type="checkbox"
                  name="botcheck"
                  id=""
                  style={{ display: "none" }}
                  className="hidden"
                />
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    <Users className="inline-block h-4 w-4 mr-1.5 opacity-70" />
                    Nama
                  </Label>
                  <Input 
                    value={form.name} 
                    onChange={set('name')} 
                    placeholder="Nama lengkap Anda"
                    className="focus-within:ring-1 focus-within:ring-primary/50"
                    required 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    <Building className="inline-block h-4 w-4 mr-1.5 opacity-70" />
                    Nama Bisnis
                  </Label>
                  <Input 
                    value={form.business} 
                    onChange={set('business')}
                    placeholder="Nama perusahaan Anda"
                    className="focus-within:ring-1 focus-within:ring-primary/50"
                    required 
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      <MapPin className="inline-block h-4 w-4 mr-1.5 opacity-70" />
                      Area
                    </Label>
                    <Input 
                      value={form.area} 
                      onChange={set('area')}
                      placeholder="Kota/Provinsi"
                      className="focus-within:ring-1 focus-within:ring-primary/50"
                      required 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      <Phone className="inline-block h-4 w-4 mr-1.5 opacity-70" />
                      Nomor Telepon
                    </Label>
                    <Input 
                      value={form.phone} 
                      onChange={set('phone')}
                      placeholder="+62xxx"
                      className="focus-within:ring-1 focus-within:ring-primary/50"
                      required 
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    <AtSign className="inline-block h-4 w-4 mr-1.5 opacity-70" />
                    Email
                  </Label>
                  <Input 
                    type="email" 
                    value={form.email} 
                    onChange={set('email')}
                    placeholder="email@anda.com"
                    className="focus-within:ring-1 focus-within:ring-primary/50"
                    required 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    <MessageSquare className="inline-block h-4 w-4 mr-1.5 opacity-70" />
                    Pesan
                  </Label>
                  <Textarea 
                    value={form.message} 
                    onChange={set('message')} 
                    placeholder="Bagaimana kami dapat membantu Anda?"
                    rows={4}
                    className="focus-within:ring-1 focus-within:ring-primary/50"
                    required 
                  />
                </div>
                
                <Button 
                  type="submit" 
                  variant="hero" 
                  className="w-full mt-4"
                  size="lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Mengirim...
                    </>
                  ) : (
                    "Kirim Pesan"
                  )}
                </Button>
                
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Kami akan merespons pesan Anda dalam 1-2 hari kerja
                </p>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}