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
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/lib/translations";

export default function Hubungi() {
  const { lang } = useLanguage();
  const t = translations[lang];
  
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
        title: lang === 'id' ? "Terkirim" : "Sent", 
        description: lang === 'id' 
          ? "Pesan Anda telah kami terima. Tim kami akan menghubungi Anda segera."
          : "Your message has been received. Our team will contact you shortly."
      });
      // Remove the query parameter from URL without refreshing
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [lang]);

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
          title: lang === 'id' ? "Terkirim" : "Sent", 
          description: lang === 'id' 
            ? "Pesan Anda telah kami terima. Tim kami akan menghubungi Anda segera."
            : "Your message has been received. Our team will contact you shortly."
        });
        setForm({ name: "", business: "", area: "", phone: "", email: "", message: "" });
      } else {
        toast({ 
          title: lang === 'id' ? "Gagal" : "Failed", 
          description: lang === 'id'
            ? "Terjadi kesalahan saat mengirim pesan. Silakan coba lagi nanti."
            : "An error occurred while sending your message. Please try again later.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({ 
        title: lang === 'id' ? "Gagal" : "Failed", 
        description: lang === 'id'
          ? "Terjadi kesalahan saat mengirim pesan. Silakan coba lagi nanti."
          : "An error occurred while sending your message. Please try again later.",
        variant: "destructive"
      });
      console.error("Form submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title={lang === 'id' ? "Hubungi Kami | Baskit Distributor Hub" : "Contact Us | Baskit Distributor Hub"} 
        description={lang === 'id' 
          ? "Informasi kontak dan FAQ untuk bantuan distributor." 
          : "Contact information and FAQ for distributor assistance."
        } 
      />
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative py-16 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(800px_600px_at_50%_-10%,hsl(var(--primary)/10),transparent)]"/>
        <div className="container max-w-5xl mx-auto text-center px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">{t.contact}</h1>
          <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
            {lang === 'id' 
              ? "Tim Baskit GT mendukung distributor dalam onboarding produk, negosiasi harga, dan perencanaan distribusi. Kami siap membantu kebutuhan bisnis Anda."
              : "The Baskit GT team supports distributors in product onboarding, price negotiation, and distribution planning. We are ready to assist with your business needs."
            }
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
                {lang === 'id' ? "Pertanyaan yang Sering Diajukan (FAQ)" : "Frequently Asked Questions (FAQ)"}
              </h2>
              
              <div className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  {/* Left column */}
                  <div className="space-y-4">
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <h3 className="font-medium mb-1.5">
                        {lang === 'id' ? "Bagaimana cara menjadi distributor?" : "How to become a distributor?"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {lang === 'id' 
                          ? "Daftar melalui Distributor Hub kami dengan informasi bisnis Anda. Setelah verifikasi, Anda akan mendapat akses ke harga dan pemesanan."
                          : "Register through our Distributor Hub with your business information. After verification, you'll get access to prices and ordering."
                        }
                      </p>
                    </div>
                    
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <h3 className="font-medium mb-1.5">
                        {lang === 'id' ? "Apakah ada minimum order?" : "Is there a minimum order?"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {lang === 'id'
                          ? "Ya, setiap produk memiliki MOQ yang bervariasi berdasarkan wilayah. Anda akan melihat ini setelah login."
                          : "Yes, each product has a MOQ that varies by region. You'll see this after logging in."
                        }
                      </p>
                    </div>
                    
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <h3 className="font-medium mb-1.5">
                        {lang === 'id' ? "Wilayah mana saja yang dilayani?" : "Which areas are served?"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {lang === 'id'
                          ? "Terutama Jawa, Bali, dan Sumatera. Filter area akan menampilkan produk yang tersedia di kota Anda."
                          : "Mainly Java, Bali, and Sumatra. The area filter will display products available in your city."
                        }
                      </p>
                    </div>
                    
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <h3 className="font-medium mb-1.5">
                        {lang === 'id' ? "Bagaimana mengetahui produk tersedia di kota saya?" : "How do I know if products are available in my city?"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {lang === 'id'
                          ? "Gunakan filter area — ini akan menampilkan hanya produk dan harga yang sesuai dengan wilayah Anda."
                          : "Use the area filter — this will display only products and prices that match your region."
                        }
                      </p>
                    </div>
                    
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <h3 className="font-medium mb-1.5">
                        {lang === 'id' ? "Siapa yang bisa dihubungi untuk bantuan?" : "Who can I contact for help?"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {lang === 'id'
                          ? "Isi formulir kontak pada halaman ini — tim kami akan segera merespons pertanyaan Anda."
                          : "Fill out the contact form on this page — our team will respond to your questions quickly."
                        }
                      </p>
                    </div>
                  </div>
                  
                  {/* Right column */}
                  <div className="space-y-4">
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <h3 className="font-medium mb-1.5">
                        {lang === 'id' ? "Berapa lama proses verifikasi distributor?" : "How long is the distributor verification process?"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {lang === 'id'
                          ? "Proses verifikasi biasanya memakan waktu 1-3 hari kerja setelah dokumen lengkap diterima."
                          : "The verification process usually takes 1-3 business days after complete documents are received."
                        }
                      </p>
                    </div>
                    
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <h3 className="font-medium mb-1.5">
                        {lang === 'id' ? "Apakah ada biaya pendaftaran menjadi distributor?" : "Is there a fee to register as a distributor?"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {lang === 'id'
                          ? "Tidak ada biaya pendaftaran. Gratis untuk bergabung sebagai distributor resmi Baskit."
                          : "There is no registration fee. It's free to join as an official Baskit distributor."
                        }
                      </p>
                    </div>
                    
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <h3 className="font-medium mb-1.5">
                        {lang === 'id' ? "Bagaimana sistem pembayaran?" : "How does the payment system work?"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {lang === 'id'
                          ? "Kami menerima transfer bank, dan pembayaran tempo sesuai kesepakatan untuk distributor terverifikasi."
                          : "We accept bank transfers and term payments according to agreements for verified distributors."
                        }
                      </p>
                    </div>
                    
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <h3 className="font-medium mb-1.5">
                        {lang === 'id' ? "Apakah ada dukungan pemasaran?" : "Is there marketing support?"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {lang === 'id'
                          ? "Ya, kami menyediakan materi pemasaran, training produk, dan dukungan promosi untuk distributor aktif."
                          : "Yes, we provide marketing materials, product training, and promotional support for active distributors."
                        }
                      </p>
                    </div>
                    
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <h3 className="font-medium mb-1.5">
                        {lang === 'id' ? "Bagaimana cara melacak pesanan?" : "How can I track my orders?"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {lang === 'id'
                          ? "Setelah login, Anda dapat melacak status pesanan di dashboard distributor atau menghubungi tim kami."
                          : "After logging in, you can track the status of orders on the distributor dashboard or by contacting our team."
                        }
                      </p>
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
                {lang === 'id' ? "Formulir Kontak" : "Contact Form"}
              </h2>
              
              {isSuccess && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
                  <p className="flex items-center font-medium">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                    </svg>
                    {lang === 'id' ? "Pesan Anda telah kami terima!" : "Your message has been received!"}
                  </p>
                  <p className="mt-1 text-sm">
                    {lang === 'id' ? "Tim kami akan menghubungi Anda segera." : "Our team will contact you shortly."}
                  </p>
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
                    {lang === 'id' ? "Nama" : "Name"}
                  </Label>
                  <Input 
                    value={form.name} 
                    onChange={set('name')} 
                    placeholder={lang === 'id' ? "Nama lengkap Anda" : "Your full name"}
                    className="focus-within:ring-1 focus-within:ring-primary/50"
                    required 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    <Building className="inline-block h-4 w-4 mr-1.5 opacity-70" />
                    {lang === 'id' ? "Nama Bisnis" : "Business Name"}
                  </Label>
                  <Input 
                    value={form.business} 
                    onChange={set('business')}
                    placeholder={lang === 'id' ? "Nama perusahaan Anda" : "Your company name"}
                    className="focus-within:ring-1 focus-within:ring-primary/50"
                    required 
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      <MapPin className="inline-block h-4 w-4 mr-1.5 opacity-70" />
                      {lang === 'id' ? "Area" : "Area"}
                    </Label>
                    <Input 
                      value={form.area} 
                      onChange={set('area')}
                      placeholder={lang === 'id' ? "Kota/Provinsi" : "City/Province"}
                      className="focus-within:ring-1 focus-within:ring-primary/50"
                      required 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      <Phone className="inline-block h-4 w-4 mr-1.5 opacity-70" />
                      {lang === 'id' ? "Nomor Telepon" : "Phone Number"}
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
                    {lang === 'id' ? "Email" : "Email"}
                  </Label>
                  <Input 
                    type="email" 
                    value={form.email} 
                    onChange={set('email')}
                    placeholder={lang === 'id' ? "email@anda.com" : "email@example.com"}
                    className="focus-within:ring-1 focus-within:ring-primary/50"
                    required 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    <MessageSquare className="inline-block h-4 w-4 mr-1.5 opacity-70" />
                    {lang === 'id' ? "Pesan" : "Message"}
                  </Label>
                  <Textarea 
                    value={form.message} 
                    onChange={set('message')} 
                    placeholder={lang === 'id' ? "Bagaimana kami dapat membantu Anda?" : "How can we help you?"}
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
                      {lang === 'id' ? "Mengirim..." : "Sending..."}
                    </>
                  ) : (
                    lang === 'id' ? "Kirim Pesan" : "Send Message"
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