import { useState, useEffect, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import SEO from "@/components/seo/SEO";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { formatIDR } from "@/lib/utils";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/lib/translations";

// Address type selection
type AddressType = 'default' | 'warehouse';

// Delivery details type
interface DeliveryDetails {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  notes: string;
  addressType: AddressType;
}

export default function Checkout() {
  const { items, totalAmount, clear } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { lang } = useLanguage();
  const t = translations[lang];

  // State for profile data
  const [profileData, setProfileData] = useState<{
    nama_bisnis?: string;
    nama_pemilik?: string;
    kontak_pemilik?: string;
    alamat_lengkap?: string;
    alamat_gudang?: string;
    kota?: string;
  } | null>(null);

  // Initial delivery details
  const [deliveryDetails, setDeliveryDetails] = useState<DeliveryDetails>({
    fullName: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    notes: "",
    addressType: "default",
  });

  // Check for user authentication, cart items, and fetch profile data
  useEffect(() => {
    console.log("Checkout page mounted, checking auth and cart");
    
    if (!user) {
      console.log("User not authenticated, redirecting to login");
      navigate("/masuk", { replace: true });
      return;
    }
    
    console.log(`Cart has ${items.length} items`);
    if (items.length === 0) {
      console.log("Cart is empty, redirecting to products");
      navigate("/daftar-produk", { replace: true });
      return;
    }

    // Fetch profile data for autofill
    const fetchProfileData = async () => {
      if (!user || !user.id) return;
      
      try {
        // Import supabase client
        const { supabase } = await import('@/integrations/supabase/client');
        
        // Fetch profile data
        const { data, error } = await supabase
          .from('distributor_profiles')
          .select('nama_bisnis, nama_pemilik, kontak_pemilik, alamat_lengkap, alamat_gudang, kota')
          .eq('user_id', user.id)
          .maybeSingle<{
            nama_bisnis: string;
            nama_pemilik: string;
            kontak_pemilik: string;
            alamat_lengkap: string;
            alamat_gudang: string | null;
            kota: string;
          }>();
          
        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching profile:', error);
          return;
        }
        
        // If we have data, store it and autofill the form
        if (data) {
          setProfileData(data);
          
          setDeliveryDetails(prev => ({
            ...prev,
            fullName: data.nama_pemilik || "",
            phone: data.kontak_pemilik || "",
            address: data.alamat_lengkap || "",
            city: data.kota || "",
          }));
        }
      } catch (err) {
        console.error('Profile fetch error:', err);
      }
    };
    
    fetchProfileData();
    console.log("Checkout page ready");
  }, [user, items, navigate]);

  // Update delivery details
  const updateDeliveryDetails = (field: keyof DeliveryDetails, value: string) => {
    setDeliveryDetails((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Validate the form
    if (!deliveryDetails.fullName || !deliveryDetails.phone || !deliveryDetails.address || !deliveryDetails.city) {
      toast({
        title: "Error",
        description: t.requiredField,
        variant: "destructive",
      });
      return;
    }
    
    // Include address type in order data
    const orderData = {
      ...deliveryDetails,
      addressType: deliveryDetails.addressType,
      items: items,
      totalAmount
    };
    console.log('Submitting order:', orderData);

    try {
      // Prepare order details for email
      const orderItemsText = items.map(item => 
        `• ${item.name} - ${item.size} (${item.province})
  Qty: ${item.qty} x ${formatIDR(item.unitPrice)} = ${formatIDR(item.qty * item.unitPrice)}`
      ).join('\n');

      const addressTypeText = deliveryDetails.addressType === 'default' 
        ? (lang === 'id' ? 'Alamat Utama' : 'Default Address')
        : (lang === 'id' ? 'Alamat Gudang' : 'Warehouse Address');

      // Prepare email data for Web3Forms
      const emailData = {
        access_key: "aaf6ab03-78a5-4e84-94bc-0acd0a51273c",
        subject: `[Baskit] New Order from ${deliveryDetails.fullName}`,
        from_name: "Baskit Order System",
        message: `
=== NEW ORDER RECEIVED ===

Customer Information:
- Name: ${deliveryDetails.fullName}
- Phone: ${deliveryDetails.phone}
- Email: ${user?.email || 'N/A'}

Shipping Information:
- Address Type: ${addressTypeText}
- Address: ${deliveryDetails.address}
- City: ${deliveryDetails.city}
- Postal Code: ${deliveryDetails.postalCode || 'N/A'}
- Additional Notes: ${deliveryDetails.notes || 'None'}

Order Details:
${orderItemsText}

Order Summary:
- Total Amount: ${formatIDR(totalAmount)}
- Order Date: ${new Date().toLocaleString()}

Please process this order and contact the customer for shipping arrangements.
        `,
        // Additional fields for better email formatting
        "Customer Name": deliveryDetails.fullName,
        "Phone Number": deliveryDetails.phone,
        "Customer Email": user?.email || 'N/A',
        "Shipping Address": deliveryDetails.address,
        "City": deliveryDetails.city,
        "Total Amount": formatIDR(totalAmount),
        "Order Items": orderItemsText
      };

      // Send email via Web3Forms
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(emailData)
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: t.orderSuccess,
          description: t.orderProcessed,
        });

        // Clear the cart
        clear();

        // Redirect to homepage after a brief delay
        setTimeout(() => {
          navigate("/");
        }, 2000);
      } else {
        throw new Error(result.message || "Failed to send order email");
      }
    } catch (error) {
      console.error('Error submitting order:', error);
      toast({
        title: "Error",
        description: lang === 'id' 
          ? "Gagal mengirim pesanan. Silakan coba lagi." 
          : "Failed to submit order. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title={lang === 'id' ? "Checkout | Baskit" : "Checkout | Baskit"} 
        description={lang === 'id' ? "Selesaikan pembelian Anda" : "Complete your purchase"} 
      />
      <Navbar />
      <main className="container max-w-6xl mx-auto py-10 px-4">
        <h1 className="text-3xl font-bold mb-8">
          {t.checkoutTitle}
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Summary */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <div className="border rounded-lg p-6 bg-white">
              <h2 className="text-xl font-semibold mb-4">
                {t.orderSummary}
              </h2>
              
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={`${item.id}-${item.province}`} className="flex gap-3 pb-3 border-b">
                    {item.image && (
                      <div className="w-16 h-16 border rounded overflow-hidden flex-shrink-0">
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="font-medium">{item.name} - {item.size}</div>
                      <div className="text-sm text-muted-foreground">{item.province}</div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-sm">{item.qty} x {formatIDR(item.unitPrice)}</span>
                        <span className="font-medium">{formatIDR(item.qty * item.unitPrice)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{t.subtotal}</span>
                  <span className="font-medium">{formatIDR(totalAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>{t.shipping}</span>
                  <span className="font-medium">{t.shippingCalculatedLater}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg pt-2 border-t mt-2">
                  <span>{t.total}</span>
                  <span>{formatIDR(totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Checkout Form */}
          <div className="lg:col-span-2 order-1 lg:order-2">
            <form onSubmit={handleSubmit} className="border rounded-lg p-6 bg-white">
              <h2 className="text-xl font-semibold mb-4">
                {t.deliveryDetails}
              </h2>
              
              <div className="space-y-4">
                <div className="space-y-3 mb-5 pb-3 border-b">
                  <h3 className="font-semibold">
                    {lang === 'id' ? 'Pilih Alamat Pengiriman' : 'Select Shipping Address'} *
                  </h3>
                  
                  <RadioGroup 
                    value={deliveryDetails.addressType} 
                    onValueChange={(value) => {
                      const newType = value as AddressType;
                      updateDeliveryDetails("addressType", newType);
                      
                      // Auto-fill the address based on selection
                      if (profileData) {
                        if (newType === 'default') {
                          updateDeliveryDetails("address", profileData.alamat_lengkap || "");
                        } else if (newType === 'warehouse') {
                          updateDeliveryDetails("address", profileData.alamat_gudang || profileData.alamat_lengkap || "");
                        }
                      }
                    }}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="default" id="default_address" />
                      <Label htmlFor="default_address">
                        {lang === 'id' ? 'Alamat Utama' : 'Default Address'}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="warehouse" id="warehouse_address" />
                      <Label htmlFor="warehouse_address">
                        {lang === 'id' ? 'Alamat Gudang' : 'Warehouse Address'}
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">
                      {t.fullName} *
                    </Label>
                    <Input 
                      id="fullName" 
                      value={deliveryDetails.fullName}
                      onChange={(e) => updateDeliveryDetails("fullName", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">
                      {t.phoneNumber} *
                    </Label>
                    <Input 
                      id="phone" 
                      type="tel"
                      value={deliveryDetails.phone}
                      onChange={(e) => updateDeliveryDetails("phone", e.target.value)}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="address">
                    {t.fullAddress} *
                  </Label>
                  <Textarea 
                    id="address" 
                    rows={3}
                    value={deliveryDetails.address}
                    onChange={(e) => updateDeliveryDetails("address", e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">
                      {t.city} *
                    </Label>
                    <Input 
                      id="city" 
                      value={deliveryDetails.city}
                      onChange={(e) => updateDeliveryDetails("city", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">
                      {t.postalCode}
                    </Label>
                    <Input 
                      id="postalCode" 
                      value={deliveryDetails.postalCode}
                      onChange={(e) => updateDeliveryDetails("postalCode", e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notes">
                    {t.additionalNotes}
                  </Label>
                  <Textarea 
                    id="notes" 
                    rows={2}
                    value={deliveryDetails.notes}
                    onChange={(e) => updateDeliveryDetails("notes", e.target.value)}
                  />
                </div>
              </div>

              <div className="mt-8">
                <Button type="submit" className="w-full">
                  {lang === 'id' ? 'Pesan' : 'Order'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
