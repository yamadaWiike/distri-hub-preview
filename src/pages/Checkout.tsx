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
    
    if (!user) {
      navigate("/masuk", { replace: true });
      return;
    }
    
    // Check if profile is complete
    if (user.profileComplete === false) {
      toast({
        title: lang === 'id' ? "Profil Belum Lengkap" : "Profile Incomplete",
        description: lang === 'id' 
          ? "Anda perlu melengkapi profil terlebih dahulu untuk dapat memesan barang." 
          : "You need to complete your profile first to place orders.",
        variant: "destructive",
      });
      navigate("/profil", { replace: true });
      return;
    }
    
    if (items.length === 0) {
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

  // eslint-disable-next-line react-hooks/exhaustive-deps
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
    
    try {
      // Import supabase client, createOrder API, and getInventory
      const { supabase } = await import('@/integrations/supabase/client');
      const { createOrder } = await import('@/lib/baskitApiOrder');
      const { getInventory } = await import('@/lib/baskitApiInventory');

      // Fetch inventory data for all cart items
      console.log('Fetching inventory data for cart items...');
      const productIds = items.map(item => item.id);
      
      // Start with original items, will be enriched if inventory data is available
      let enrichedItems = items;
      
      try {
        const inventoryResponse = await getInventory({
          inventoryId: productIds,
          active: true,
          $limit: 100 // Get up to 100 items
        });

        console.log('Inventory response:', inventoryResponse);

        if (inventoryResponse.statusCode === 200 && inventoryResponse.data) {
          // Create a map of product ID to inventory data
          const inventoryMap = new Map(
            inventoryResponse.data.map(inv => [inv.inventoryId, inv])
          );

          // Validate stock and enrich cart items with inventory data
          const itemsWithInventory = items.map(item => {
            const inventoryData = inventoryMap.get(item.id);
            
            if (!inventoryData) {
              console.warn(`No inventory data found for product ${item.id}`);
              return {
                ...item,
                inventoryId: item.id, // Fallback to product ID
              };
            }

            // Check stock availability
            if (inventoryData.qtyOnHand < item.qty) {
              throw new Error(
                lang === 'id'
                  ? `Stok tidak cukup untuk ${item.name}. Tersedia: ${inventoryData.qtyOnHand}, Diminta: ${item.qty}`
                  : `Insufficient stock for ${item.name}. Available: ${inventoryData.qtyOnHand}, Requested: ${item.qty}`
              );
            }

            return {
              ...item,
              inventoryId: inventoryData.id, // Use the inventory record ID
              sku: inventoryData.sku,
              qtyOnHand: inventoryData.qtyOnHand,
              inventoryPriceTierId: inventoryData.id, // Use inventory ID as price tier ID
            };
          });

          console.log('Items enriched with inventory data:', itemsWithInventory);

          // Use enriched items for order creation
          enrichedItems = itemsWithInventory;
        } else {
          console.warn('Inventory API returned non-200 status or no data, proceeding with fallback');
        }
      } catch (inventoryError) {
        console.error('Error fetching inventory:', inventoryError);
        // If it's a stock validation error, re-throw it
        if (inventoryError instanceof Error && inventoryError.message.includes('Stok tidak cukup')) {
          throw inventoryError;
        }
        // Otherwise, log and continue with fallback (product IDs)
        console.warn('Continuing with product IDs as fallback for inventoryId');
      }

      // Get distributor profile ID
      const { data: distributorProfile, error: profileError } = await supabase
        .from('distributor_profiles')
        .select('id, company_id')
        .eq('user_id', user?.id)
        .single();

      if (profileError || !distributorProfile) {
        throw new Error('Distributor profile not found. Please complete your profile first.');
      }

      const typedDistributorProfile = distributorProfile as DbDistributorProfile & { company_id?: string };

      // Generate unique order number
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
        const { data: existingOrder } = await supabase
          .from('orders')
          .select('id')
          .eq('order_number', orderNumber)
          .single();
        if (!existingOrder) {
          break;
        }
        attempts++;
      } while (attempts < maxAttempts);
      if (attempts >= maxAttempts) {
        throw new Error('Unable to generate unique order number. Please try again.');
      }

      // Calculate order totals
      const subTotal = totalAmount;
      const taxRate = 0.11; // 11% tax
      const taxAmount = Math.round(subTotal * taxRate);
      const shippingCost = 0; // Can be updated based on shipping selection
      const orderTotal = subTotal + taxAmount + shippingCost;

      // Build external API payload
      const orderPayload = {
        customerId: user?.id || '',
        companyId: typedDistributorProfile.company_id || '',
        paymentTypeId: '', // Optional - can be added later
        orderType: 'SHOP',
        wareHouse: 1,
        shippingCost: shippingCost,
        tax: taxAmount,
        subTotal: subTotal,
        total: orderTotal,
        refCode: orderNumber,
        paymentNotes: deliveryDetails.notes || '',
        notes: deliveryDetails.notes || '',
        deliveryType: 'REGULAR',
        expeditionName: '', // Optional - can be added later
        products: enrichedItems.map(item => ({
          productId: item.id,
          companyId: typedDistributorProfile.company_id || '',
          inventoryId: item.inventoryId || item.id, // Fallback to product ID if inventoryId not available
          qty: item.qty,
          neededQty: item.qty,
          price: item.unitPrice,
          inventoryPriceTierId: item.inventoryPriceTierId,
          discount: 0,
          discountAmount: 0,
          tax: Math.round(item.unitPrice * item.qty * taxRate),
        }))
      };

      // Call external order API
      const apiResponse = await createOrder(orderPayload);
      const statusCode = apiResponse?.statusCode;

      if (statusCode && statusCode !== 200) {
        throw new Error(apiResponse?.message || 'Order API failed. Please try again.');
      }

      // Calculate shipping address based on address type
      const shippingAddress = deliveryDetails.address;
      const shippingCity = deliveryDetails.city;
      const shippingNotes = deliveryDetails.notes || null;

      // Insert order into database
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
        access_key: import.meta.env.VITE_WEB3FORMS_ACCESS_KEY,
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
      <main className="container max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6 lg:mb-8">
          {t.checkoutTitle}
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 xl:gap-8">
          {/* Order Summary */}
          <div className="lg:col-span-4 order-2 lg:order-1 w-full">
            <div className="border rounded-lg p-3 sm:p-4 lg:p-6 bg-white shadow-sm sticky top-6 w-full max-w-full overflow-hidden">
              <h2 className="text-lg sm:text-xl font-semibold mb-4">
                {t.orderSummary}
              </h2>
              
              <div className="space-y-3 max-w-full">
                {items.map((item) => (
                  <div key={`${item.id}-${item.province}-${item.variant?.id || 'no-variant'}`} className="flex gap-2 sm:gap-3 p-2 sm:p-3 border rounded-lg bg-gray-50 w-full overflow-hidden">
                    {item.image && (
                      <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 border rounded overflow-hidden flex-shrink-0">
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <div className="font-medium text-xs sm:text-sm lg:text-base truncate max-w-full">
                        {item.name} - {item.size}
                        {item.variant && <span className="text-xs text-muted-foreground ml-1 block sm:inline">({item.variant.name})</span>}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">{item.province}</div>
                      
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-1 mt-2 flex-wrap">
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-6 w-6 sm:h-7 sm:w-7 p-0 flex-shrink-0"
                            onClick={() => decrementQuantity(item)}
                            disabled={item.qty <= 1}
                          >
                            <Minus className="h-2 w-2 sm:h-3 sm:w-3" />
                          </Button>
                          
                          <Input
                            type="number"
                            min="1"
                            value={item.qty}
                            onChange={(e) => handleTextFieldQuantityChange(item, e.target.value)}
                            className="h-6 w-16 sm:h-7 sm:w-20 text-center text-xs flex-shrink-0"
                          />
                          
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-6 w-6 sm:h-7 sm:w-7 p-0 flex-shrink-0"
                            onClick={() => incrementQuantity(item)}
                          >
                            <Plus className="h-2 w-2 sm:h-3 sm:w-3" />
                          </Button>
                        </div>
                        
                        <span className="text-xs text-muted-foreground truncate min-w-0">x {formatIDR(item.unitPrice)}</span>
                        
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(item)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 ml-auto text-xs h-6 px-2 flex-shrink-0"
                        >
                          {lang === 'id' ? 'Hapus' : 'Remove'}
                        </Button>
                      </div>
                      
                      <div className="flex justify-between items-center mt-2 min-w-0">
                        <span className="text-xs font-medium truncate">
                          {lang === 'id' ? 'Subtotal:' : 'Subtotal:'}
                        </span>
                        <span className="font-medium text-xs sm:text-sm flex-shrink-0">{formatIDR(item.qty * item.unitPrice)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 lg:mt-6 space-y-3 pt-4 border-t">
                <div className="flex justify-between text-sm">
                  <span className="truncate">{t.subtotal}</span>
                  <span className="font-medium flex-shrink-0">{formatIDR(totalAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="truncate">{t.shipping}</span>
                  <span className="font-medium text-muted-foreground text-xs lg:text-sm flex-shrink-0">{t.shippingCalculatedLater}</span>
                </div>
                <div className="flex justify-between font-semibold text-base lg:text-lg pt-3 border-t">
                  <span className="truncate">{t.total}</span>
                  <span className="flex-shrink-0">{formatIDR(totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Checkout Form */}
          <div className="lg:col-span-8 order-1 lg:order-2 w-full min-w-0">
            <form onSubmit={handleSubmit} className="border rounded-lg p-4 sm:p-6 bg-white shadow-sm w-full max-w-full overflow-hidden">
              <h2 className="text-lg sm:text-xl font-semibold mb-6">
                {t.deliveryDetails}
              </h2>
              
              <div className="space-y-6">
                {/* Address Type Selection */}
                <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-900">
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
                    className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                  >
                    <div className="flex items-center space-x-3 p-3 border border-blue-200 rounded-lg bg-white hover:bg-blue-25 transition-colors">
                      <RadioGroupItem value="default" id="default_address" />
                      <Label htmlFor="default_address" className="cursor-pointer font-medium">
                        {lang === 'id' ? 'Alamat Utama' : 'Default Address'}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 p-3 border border-blue-200 rounded-lg bg-white hover:bg-blue-25 transition-colors">
                      <RadioGroupItem value="warehouse" id="warehouse_address" />
                      <Label htmlFor="warehouse_address" className="cursor-pointer font-medium">
                        {lang === 'id' ? 'Alamat Gudang' : 'Warehouse Address'}
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
                
                {/* Contact Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 border-b pb-2">
                    {lang === 'id' ? 'Informasi Kontak' : 'Contact Information'}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="text-sm font-medium">
                        {t.fullName} *
                      </Label>
                      <Input 
                        id="fullName" 
                        value={deliveryDetails.fullName}
                        onChange={(e) => updateDeliveryDetails("fullName", e.target.value)}
                        required
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-medium">
                        {t.phoneNumber} *
                      </Label>
                      <Input 
                        id="phone" 
                        type="tel"
                        value={deliveryDetails.phone}
                        onChange={(e) => updateDeliveryDetails("phone", e.target.value)}
                        required
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Shipping Address */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 border-b pb-2">
                    {lang === 'id' ? 'Alamat Pengiriman' : 'Shipping Address'}
                  </h3>
                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-sm font-medium">
                      {t.fullAddress} *
                    </Label>
                    <Textarea 
                      id="address" 
                      rows={3}
                      value={deliveryDetails.address}
                      onChange={(e) => updateDeliveryDetails("address", e.target.value)}
                      required
                      className="w-full resize-none"
                      placeholder={lang === 'id' ? 'Masukkan alamat lengkap...' : 'Enter complete address...'}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-sm font-medium">
                        {t.city} *
                      </Label>
                      <Input 
                        id="city" 
                        value={deliveryDetails.city}
                        onChange={(e) => updateDeliveryDetails("city", e.target.value)}
                        required
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="postalCode" className="text-sm font-medium">
                        {t.postalCode}
                      </Label>
                      <Input 
                        id="postalCode" 
                        value={deliveryDetails.postalCode}
                        onChange={(e) => updateDeliveryDetails("postalCode", e.target.value)}
                        className="w-full"
                        placeholder="12345"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Additional Notes */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 border-b pb-2">
                    {lang === 'id' ? 'Catatan Tambahan' : 'Additional Notes'}
                  </h3>
                  <div className="space-y-2">
                    <Label htmlFor="notes" className="text-sm font-medium">
                      {t.additionalNotes}
                    </Label>
                    <Textarea 
                      id="notes" 
                      rows={3}
                      value={deliveryDetails.notes}
                      onChange={(e) => updateDeliveryDetails("notes", e.target.value)}
                      className="w-full resize-none"
                      placeholder={lang === 'id' ? 'Catatan khusus untuk pengiriman...' : 'Special notes for delivery...'}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t">
                <Button type="submit" size="lg" className="w-full">
                  {lang === 'id' ? 'Pesan Sekarang' : 'Place Order'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
