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

// Payment method type
type PaymentMethod = 'transfer_bank' | 'cod' | 'credit_card';

// Delivery details type
interface DeliveryDetails {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  notes: string;
  paymentMethod: PaymentMethod;
}

export default function Checkout() {
  const { items, totalAmount, clear } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { lang } = useLanguage();
  const t = translations[lang];

  // Initial delivery details
  const [deliveryDetails, setDeliveryDetails] = useState<DeliveryDetails>({
    fullName: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    notes: "",
    paymentMethod: "transfer_bank",
  });

  // Check for user authentication and cart items
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
    } else {
      console.log("Checkout page ready");
    }
  }, [user, items, navigate]);

  // Update delivery details
  const updateDeliveryDetails = (field: keyof DeliveryDetails, value: string) => {
    setDeliveryDetails((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = (e: FormEvent) => {
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

    // Process the order
    // In a real app, this would send the order to the backend
    // For now, we'll just show a success message and clear the cart

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

                <div className="space-y-3 pt-4 border-t">
                  <h3 className="font-semibold">
                    {t.paymentMethod} *
                  </h3>
                  
                  <RadioGroup 
                    value={deliveryDetails.paymentMethod} 
                    onValueChange={(value) => updateDeliveryDetails("paymentMethod", value as PaymentMethod)}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="transfer_bank" id="transfer_bank" />
                      <Label htmlFor="transfer_bank">
                        {t.bankTransfer}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="cod" id="cod" />
                      <Label htmlFor="cod">
                        {t.cashOnDelivery}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="credit_card" id="credit_card" />
                      <Label htmlFor="credit_card">
                        {t.creditCard}
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>

              <div className="mt-8">
                <Button type="submit" className="w-full">
                  {t.completeOrder}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
