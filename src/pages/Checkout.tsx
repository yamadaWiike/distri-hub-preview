import { useState, useEffect, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Minus, Plus } from "lucide-react";
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
import { CartItem } from "@/contexts/CartContextDefinition";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
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

// Database types for order operations
interface DbDistributorProfile {
  id: string;
}

interface DbOrder {
  id: string;
  order_number: string;
  total_amount: number;
}

interface DbOrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  consumer_price: number;
  subtotal: number;
}

export default function Checkout() {
  const { items, totalAmount, clear, updateQuantity, removeItem } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { lang } = useLanguage();
  const t = translations[lang];

  // Quantity adjustment functions
  const handleQuantityChange = (itemId: string, province: string, newQty: number, variantId?: string) => {
    if (newQty < 1) {
      return; // Prevent zero or negative quantities
    }
    updateQuantity(itemId, province, newQty, variantId);
  };

  const incrementQuantity = (item: CartItem) => {
    const newQty = item.qty + 1;
    handleQuantityChange(item.id, item.province, newQty, item.variant?.id);
  };

  const decrementQuantity = (item: CartItem) => {
    if (item.qty > 1) {
      const newQty = item.qty - 1;
      handleQuantityChange(item.id, item.province, newQty, item.variant?.id);
    }
  };

  const handleTextFieldQuantityChange = (item: CartItem, inputValue: string) => {
    const newQty = parseInt(inputValue);
    if (!isNaN(newQty) && newQty >= 1) {
      handleQuantityChange(item.id, item.province, newQty, item.variant?.id);
    }
  };

  const handleRemoveItem = (item: CartItem) => {
    removeItem(item.id, item.province, item.variant?.id);
    toast({
      title: lang === 'id' ? "Item dihapus" : "Item removed",
      description: lang === 'id' 
        ? `${item.name} telah dihapus dari keranjang` 
        : `${item.name} has been removed from cart`,
    });
  };

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
      // Import supabase client
      const { supabase } = await import('@/integrations/supabase/client');
      
      // First, get the distributor profile ID
      const { data: distributorProfile, error: profileError } = await supabase
        .from('distributor_profiles')
        .select('id')
        .eq('user_id', user?.id)
        .single();
        
      if (profileError || !distributorProfile) {
        throw new Error('Distributor profile not found. Please complete your profile first.');
      }

      const typedDistributorProfile = distributorProfile as DbDistributorProfile;

      // Generate unique order number with retry logic
      let orderNumber: string;
      let attempts = 0;
      const maxAttempts = 5;
      
      do {
        const now = new Date();
        const dateStr = now.getFullYear().toString() + 
                      (now.getMonth() + 1).toString().padStart(2, '0') + 
                      now.getDate().toString().padStart(2, '0');
        const randomNum = Math.floor(Math.random() * 99999).toString().padStart(5, '0');
        orderNumber = `ORD-${dateStr}-${randomNum}`;
        
        // Check if order number already exists
        const { data: existingOrder } = await supabase
          .from('orders')
          .select('id')
          .eq('order_number', orderNumber)
          .single();
          
        if (!existingOrder) {
          break; // Order number is unique, we can use it
        }
        
        attempts++;
      } while (attempts < maxAttempts);
      
      if (attempts >= maxAttempts) {
        throw new Error('Unable to generate unique order number. Please try again.');
      }

      // Calculate shipping address based on address type
      const shippingAddress = deliveryDetails.address;
      const shippingCity = deliveryDetails.city;
      const shippingNotes = deliveryDetails.notes || null;

      // Insert order into database with type assertion
      const { data: orderData, error: orderError } = await (supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('orders') as any)
        .insert({
          distributor_id: typedDistributorProfile.id,
          order_number: orderNumber,
          status: 'pending',
          total_amount: totalAmount,
          shipping_address: shippingAddress,
          shipping_city: shippingCity,
          shipping_notes: shippingNotes,
          payment_status: 'unpaid'
        })
        .select()
        .single();

      if (orderError || !orderData) {
        throw new Error('Failed to create order: ' + (orderError?.message || 'Unknown error'));
      }

      // Insert order items with type assertion
      const typedOrderData = orderData as DbOrder;

      // Create order items
      const orderItems = items.map(item => ({
        order_id: typedOrderData.id,
        product_id: item.id, // assuming cart item.id is the product UUID
        quantity: item.qty,
        unit_price: item.unitPrice,
        consumer_price: item.consumerPrice || item.unitPrice, // fallback to unit price if consumer price not available
        subtotal: item.qty * item.unitPrice
      }));

      // Insert order items with type assertion
      const { error: itemsError } = await (supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('order_items') as any)
        .insert(orderItems);

      if (itemsError) {
        // If order items insertion fails, we should delete the order to maintain data integrity
        await supabase.from('orders').delete().eq('id', typedOrderData.id);
        throw new Error('Failed to create order items: ' + itemsError.message);
      }

      console.log('Order successfully saved to database:', {
        orderId: typedOrderData.id,
        orderNumber: orderNumber,
        itemsCount: orderItems.length
      });

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
        subject: `[Baskit] New Order #${orderNumber} from ${deliveryDetails.fullName}`,
        from_name: "Baskit Order System",
        message: `
=== NEW ORDER RECEIVED ===

Order Information:
- Order Number: ${orderNumber}
- Order ID: ${typedOrderData.id}

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
- Payment Status: Unpaid

Please process this order and contact the customer for shipping arrangements.

You can view this order in the admin panel using Order Number: ${orderNumber}
        `,
        // Additional fields for better email formatting
        "Order Number": orderNumber,
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
          description: `${t.orderProcessed} Order #${orderNumber}`,
        });

        // Clear the cart
        clear();

        // Redirect to homepage after a brief delay
        setTimeout(() => {
          navigate("/");
        }, 2000);
      } else {
        console.warn('Email failed to send, but order was saved:', result);
        toast({
          title: t.orderSuccess,
          description: `Order #${orderNumber} ${t.orderProcessed} (Email notification may have failed)`,
        });

        // Still clear cart and redirect even if email fails
        clear();
        setTimeout(() => {
          navigate("/");
        }, 2000);
      }
    } catch (error) {
      console.error('Error submitting order:', error);
      
      let errorMessage = lang === 'id' 
        ? "Gagal mengirim pesanan. Silakan coba lagi." 
        : "Failed to submit order. Please try again.";
        
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
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
                  <div key={`${item.id}-${item.province}-${item.variant?.id || 'no-variant'}`} className="flex gap-3 pb-3 border-b">
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
                      <div className="font-medium">
                        {item.name} - {item.size}
                        {item.variant && <span className="text-sm text-muted-foreground ml-1">({item.variant.name})</span>}
                      </div>
                      <div className="text-sm text-muted-foreground">{item.province}</div>
                      
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => decrementQuantity(item)}
                          disabled={item.qty <= 1}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        
                        <Input
                          type="number"
                          min="1"
                          value={item.qty}
                          onChange={(e) => handleTextFieldQuantityChange(item, e.target.value)}
                          className="h-8 w-16 text-center"
                        />
                        
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => incrementQuantity(item)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        
                        <span className="text-sm text-muted-foreground mx-2">x {formatIDR(item.unitPrice)}</span>
                        
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(item)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 ml-auto"
                        >
                          {lang === 'id' ? 'Hapus' : 'Remove'}
                        </Button>
                      </div>
                      
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-sm font-medium">
                          {lang === 'id' ? 'Subtotal:' : 'Subtotal:'}
                        </span>
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
