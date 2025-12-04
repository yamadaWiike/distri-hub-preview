// React & Router
import { useState, useEffect, FormEvent } from "react";
import { useNavigate } from "react-router-dom";

// External Libraries & Icons
import { Minus, Plus } from "lucide-react";

// UI Components
import SEO from "@/components/seo/SEO";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

// Hooks
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";

// Utils, Data & API
import { formatIDR } from "@/lib/utils";
import { translations } from "@/lib/translations";
import { createOrder } from "@/lib/baskitApiOrder";
import { getInventory } from "@/lib/baskitApiInventory";

// Integrations & Types
import { supabase } from "@/integrations/supabase/client";
import { CartItem } from "@/contexts/CartContextDefinition";

// Address type selection
type AddressType = "default" | "warehouse";

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
  const handleQuantityChange = (
    itemId: string,
    province: string,
    newQty: number,
    variantId?: string
  ) => {
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

  const handleTextFieldQuantityChange = (
    item: CartItem,
    inputValue: string
  ) => {
    const newQty = parseInt(inputValue);
    if (!isNaN(newQty) && newQty >= 1) {
      handleQuantityChange(item.id, item.province, newQty, item.variant?.id);
    }
  };

  const handleRemoveItem = (item: CartItem) => {
    removeItem(item.id, item.province, item.variant?.id);
    toast({
      title: lang === "id" ? "Item dihapus" : "Item removed",
      description:
        lang === "id"
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
        title: lang === "id" ? "Profil Belum Lengkap" : "Profile Incomplete",
        description:
          lang === "id"
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
        // Fetch profile data
        const { data, error } = await supabase
          .from("distributor_profiles")
          .select(
            "nama_bisnis, nama_pemilik, kontak_pemilik, alamat_lengkap, alamat_gudang, kota"
          )
          .eq("user_id", user.id)
          .maybeSingle<{
            nama_bisnis: string;
            nama_pemilik: string;
            kontak_pemilik: string;
            alamat_lengkap: string;
            alamat_gudang: string | null;
            kota: string;
          }>();

        if (error && error.code !== "PGRST116") {
          console.error("Error fetching profile:", error);
          return;
        }

        // If we have data, store it and autofill the form
        if (data) {
          setProfileData(data);

          setDeliveryDetails((prev) => ({
            ...prev,
            fullName: data.nama_pemilik || "",
            phone: data.kontak_pemilik || "",
            address: data.alamat_lengkap || "",
            city: data.kota || "",
          }));
        }
      } catch (err) {
        console.error("Profile fetch error:", err);
      }
    };

    fetchProfileData();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, items, navigate]);

  // Update delivery details
  const updateDeliveryDetails = (
    field: keyof DeliveryDetails,
    value: string
  ) => {
    setDeliveryDetails((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // ========== Validate Form ==========
    const { fullName, phone, address, city, postalCode, notes, addressType } =
      deliveryDetails;
    if (!fullName || !phone || !address || !city) {
      toast({
        title: "Error",
        description: t.requiredField,
        variant: "destructive",
      });

      return;
    }

    try {
      // ========== Fetch & Validate Inventory ==========
      const bypassEnabled = import.meta.env.VITE_BASKIT_API_BYPASS === "true";
      let enrichedItems = items;

      if (!bypassEnabled) {
        const productIds = items.map((item) => item.id);
        const inventoryResponse = await getInventory({
          inventoryId: productIds,
          active: true,
          $limit: 100,
        });

        if (!inventoryResponse?.data?.length) {
          throw new Error(
            lang === "id"
              ? "Gagal mendapatkan data inventory. Silakan coba lagi atau hubungi admin."
              : "Failed to fetch inventory data. Please try again or contact admin."
          );
        }

        // Enrich items and check stock
        enrichedItems = items.map((item) => {
          const inventoryItem = inventoryResponse.data.find(
            (inv) =>
              inv.inventoryId === item.id &&
              (item.variant ? inv.variantId === item.variant.id : true)
          );

          const itemDesc = item.variant
            ? `${item.name} (${item.variant.name})`
            : item.name;

          if (!inventoryItem) {
            throw new Error(
              lang === "id"
                ? `Data inventory tidak ditemukan untuk ${itemDesc}. Silakan hubungi admin.`
                : `Inventory data not found for ${itemDesc}. Please contact admin.`
            );
          }

          if (inventoryItem.qtyOnHand < item.qty) {
            throw new Error(
              lang === "id"
                ? `Stok tidak cukup untuk ${itemDesc}. Tersedia: ${inventoryItem.qtyOnHand}, Diminta: ${item.qty}`
                : `Insufficient stock for ${itemDesc}. Available: ${inventoryItem.qtyOnHand}, Requested: ${item.qty}`
            );
          }

          return {
            ...item,
            inventoryId: inventoryItem.id,
            inventoryPriceTierId: item.inventoryPriceTierId || "default-tier",
            sku: inventoryItem.sku,
            qtyOnHand: inventoryItem.qtyOnHand,
          };
        });
      }

      // ========== Get Distributor Profile ==========
      const { data: distributorProfile, error: profileError } = await supabase
        .from("distributor_profiles")
        .select("id, npwp_number, nib_number, ktp_url, npwp_url, akta_url")
        .eq("user_id", user?.id)
        .single<{
          id: string;
          npwp_number?: string;
          nib_number?: string;
          ktp_url?: string;
          npwp_url?: string;
          akta_url?: string;
        }>();

      if (profileError) {
        console.error("Profile fetch error:", profileError);
        throw new Error(
          lang === "id"
            ? "Gagal mengambil profil distributor. Silakan coba lagi."
            : "Failed to fetch distributor profile. Please try again."
        );
      }

      if (!distributorProfile) {
        throw new Error(
          lang === "id"
            ? "Profil distributor tidak ditemukan. Silakan lengkapi profil Anda terlebih dahulu."
            : "Distributor profile not found. Please complete your profile first."
        );
      }

      // Check if profile is sufficiently complete (has legal documents - either numbers or uploaded files)
      const hasLegalDocs =
        distributorProfile.npwp_number ||
        distributorProfile.nib_number ||
        distributorProfile.ktp_url ||
        distributorProfile.npwp_url ||
        distributorProfile.akta_url;

      if (!hasLegalDocs) {
        throw new Error(
          lang === "id"
            ? "Silakan lengkapi dokumen legal (NPWP/NIB/KTP) di profil Anda sebelum melakukan pemesanan."
            : "Please complete your legal documents (NPWP/NIB/KTP) in your profile before placing orders."
        );
      }

      const typedDistributorProfile =
        distributorProfile as DbDistributorProfile;

      // ========== Generate Unique Order Number ==========
      let orderNumber: string = "";
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 5;

      while (!isUnique && attempts < maxAttempts) {
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
        const randomNum = Math.floor(Math.random() * 99999)
          .toString()
          .padStart(5, "0");
        orderNumber = `ORD-${dateStr}-${randomNum}`;

        const { data: existingOrder } = await supabase
          .from("orders")
          .select("id")
          .eq("order_number", orderNumber)
          .single();

        if (!existingOrder) isUnique = true;
        attempts++;
      }

      if (!isUnique) {
        throw new Error(
          "Unable to generate unique order number. Please try again."
        );
      }

      // ========== Calculate Totals ==========
      const subTotal = totalAmount;
      const taxRate = 0.11;
      const taxAmount = Math.round(subTotal * taxRate);
      const shippingCost = 0;
      const orderTotal = subTotal + taxAmount + shippingCost;

      // ========== Build & Send External API Order ==========
      const companyId = typedDistributorProfile.id;
      const orderPayload = {
        customerId: user?.id || "",
        companyId: companyId,
        paymentTypeId: "",
        orderType: "SHOP",
        wareHouse: 1,
        shippingCost,
        tax: taxAmount,
        subTotal,
        total: orderTotal,
        refCode: orderNumber,
        paymentNotes: notes || "",
        notes: notes || "",
        deliveryType: "REGULAR",
        expeditionName: "",
        products: enrichedItems.map((item) => ({
          productId: item.id,
          companyId: companyId,
          inventoryId: item.inventoryId || item.id, // Fallback to productId saat bypass
          qty: item.qty,
          neededQty: item.qty,
          price: item.unitPrice,
          inventoryPriceTierId: item.inventoryPriceTierId || "default-tier", // Default tier saat bypass
          discount: 0,
          discountAmount: 0,
          tax: Math.round(item.unitPrice * item.qty * taxRate),
        })),
      };

      const apiResponse = await createOrder(orderPayload);
      if (apiResponse?.statusCode !== 200) {
        throw new Error("Order API failed. Please try again.");
      }

      // ========== Create Supabase Order ==========
      const { data: orderData, error: orderError } = await (
        supabase
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .from("orders") as any
      )
        .insert({
          distributor_id: typedDistributorProfile.id,
          order_number: orderNumber,
          status: "pending",
          total_amount: totalAmount,
          shipping_address: address,
          shipping_city: city,
          shipping_notes: notes || null,
          payment_status: "unpaid",
        })
        .select()
        .single();

      if (orderError || !orderData) {
        throw new Error(
          "Failed to create order: " + (orderError?.message || "Unknown error")
        );
      }

      const typedOrderData = orderData as DbOrder;

      // ========== Create Order Items ==========
      const orderItems = items.map((item) => ({
        order_id: typedOrderData.id,
        product_id: item.id,
        quantity: item.qty,
        unit_price: item.unitPrice,
        consumer_price: item.consumerPrice || item.unitPrice,
        subtotal: item.qty * item.unitPrice,
      }));

      const { error: itemsError } = await (
        supabase
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .from("order_items") as any
      ).insert(orderItems);

      if (itemsError) {
        await supabase.from("orders").delete().eq("id", typedOrderData.id);
        throw new Error("Failed to create order items: " + itemsError.message);
      }

      // ========== Send Email Notification ==========
      const addressTypeText =
        addressType === "default"
          ? lang === "id"
            ? "Alamat Utama"
            : "Default Address"
          : lang === "id"
          ? "Alamat Gudang"
          : "Warehouse Address";

      const orderItemsText = items
        .map(
          (item) =>
            `• ${item.name} - ${item.size} (${item.province})\n   Qty: ${
              item.qty
            } x ${formatIDR(item.unitPrice)} = ${formatIDR(
              item.qty * item.unitPrice
            )}`
        )
        .join("\n");

      const emailMessage = `
=== NEW ORDER RECEIVED ===

Order Information:
- Order Number: ${orderNumber}
- Order ID: ${typedOrderData.id}

Customer Information:
- Name: ${fullName}
- Phone: ${phone}
- Email: ${user?.email || "N/A"}

Shipping Information:
- Address Type: ${addressTypeText}
- Address: ${address}
- City: ${city}
- Postal Code: ${postalCode || "N/A"}
- Additional Notes: ${notes || "None"}

Order Details:
${orderItemsText}

Order Summary:
- Total Amount: ${formatIDR(totalAmount)}
- Order Date: ${new Date().toLocaleString()}
- Payment Status: Unpaid

Please process this order and contact the customer for shipping arrangements.
You can view this order in the admin panel using Order Number: ${orderNumber}
      `.trim();

      const emailResponse = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          access_key: import.meta.env.VITE_WEB3FORMS_ACCESS_KEY,
          subject: `[Baskit] New Order #${orderNumber} from ${fullName}`,
          from_name: "Baskit Order System",
          message: emailMessage,
          "Order Number": orderNumber,
          "Customer Name": fullName,
          "Phone Number": phone,
          "Customer Email": user?.email || "N/A",
          "Shipping Address": address,
          City: city,
          "Total Amount": formatIDR(totalAmount),
          "Order Items": orderItemsText,
        }),
      });

      const result = await emailResponse.json();

      // ========== Success & Redirect ==========
      toast({
        title: t.orderSuccess,
        description: result.success
          ? `${t.orderProcessed} Order #${orderNumber}`
          : `Order #${orderNumber} ${t.orderProcessed} (Email notification may have failed)`,
      });

      clear();
      setTimeout(() => navigate("/daftar-produk"), 2000);
    } catch (error) {
      console.error("Error submitting order:", error);

      let errorMessage =
        lang === "id"
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
        title={lang === "id" ? "Checkout | Baskit" : "Checkout | Baskit"}
        description={
          lang === "id" ? "Selesaikan pembelian Anda" : "Complete your purchase"
        }
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
                  <div
                    key={`${item.id}-${item.province}-${
                      item.variant?.id || "no-variant"
                    }`}
                    className="flex gap-2 sm:gap-3 p-2 sm:p-3 border rounded-lg bg-gray-50 w-full overflow-hidden"
                  >
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
                        {item.variant && (
                          <span className="text-xs text-muted-foreground ml-1 block sm:inline">
                            ({item.variant.name})
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {item.province}
                      </div>

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
                            onChange={(e) =>
                              handleTextFieldQuantityChange(
                                item,
                                e.target.value
                              )
                            }
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

                        <span className="text-xs text-muted-foreground truncate min-w-0">
                          x {formatIDR(item.unitPrice)}
                        </span>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(item)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 ml-auto text-xs h-6 px-2 flex-shrink-0"
                        >
                          {lang === "id" ? "Hapus" : "Remove"}
                        </Button>
                      </div>

                      <div className="flex justify-between items-center mt-2 min-w-0">
                        <span className="text-xs font-medium truncate">
                          {lang === "id" ? "Subtotal:" : "Subtotal:"}
                        </span>
                        <span className="font-medium text-xs sm:text-sm flex-shrink-0">
                          {formatIDR(item.qty * item.unitPrice)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 lg:mt-6 space-y-3 pt-4 border-t">
                <div className="flex justify-between text-sm">
                  <span className="truncate">{t.subtotal}</span>
                  <span className="font-medium flex-shrink-0">
                    {formatIDR(totalAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="truncate">{t.shipping}</span>
                  <span className="font-medium text-muted-foreground text-xs lg:text-sm flex-shrink-0">
                    {t.shippingCalculatedLater}
                  </span>
                </div>
                <div className="flex justify-between font-semibold text-base lg:text-lg pt-3 border-t">
                  <span className="truncate">{t.total}</span>
                  <span className="flex-shrink-0">
                    {formatIDR(totalAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Checkout Form */}
          <div className="lg:col-span-8 order-1 lg:order-2 w-full min-w-0">
            <form
              onSubmit={handleSubmit}
              className="border rounded-lg p-4 sm:p-6 bg-white shadow-sm w-full max-w-full overflow-hidden"
            >
              <h2 className="text-lg sm:text-xl font-semibold mb-6">
                {t.deliveryDetails}
              </h2>

              <div className="space-y-6">
                {/* Address Type Selection */}
                <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-900">
                    {lang === "id"
                      ? "Pilih Alamat Pengiriman"
                      : "Select Shipping Address"}{" "}
                    *
                  </h3>

                  <RadioGroup
                    value={deliveryDetails.addressType}
                    onValueChange={(value) => {
                      const newType = value as AddressType;
                      updateDeliveryDetails("addressType", newType);

                      // Auto-fill the address based on selection
                      if (profileData) {
                        if (newType === "default") {
                          updateDeliveryDetails(
                            "address",
                            profileData.alamat_lengkap || ""
                          );
                        } else if (newType === "warehouse") {
                          updateDeliveryDetails(
                            "address",
                            profileData.alamat_gudang ||
                              profileData.alamat_lengkap ||
                              ""
                          );
                        }
                      }
                    }}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                  >
                    <div className="flex items-center space-x-3 p-3 border border-blue-200 rounded-lg bg-white hover:bg-blue-25 transition-colors">
                      <RadioGroupItem value="default" id="default_address" />
                      <Label
                        htmlFor="default_address"
                        className="cursor-pointer font-medium"
                      >
                        {lang === "id" ? "Alamat Utama" : "Default Address"}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 p-3 border border-blue-200 rounded-lg bg-white hover:bg-blue-25 transition-colors">
                      <RadioGroupItem
                        value="warehouse"
                        id="warehouse_address"
                      />
                      <Label
                        htmlFor="warehouse_address"
                        className="cursor-pointer font-medium"
                      >
                        {lang === "id" ? "Alamat Gudang" : "Warehouse Address"}
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Contact Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 border-b pb-2">
                    {lang === "id" ? "Informasi Kontak" : "Contact Information"}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="text-sm font-medium">
                        {t.fullName} *
                      </Label>
                      <Input
                        id="fullName"
                        value={deliveryDetails.fullName}
                        onChange={(e) =>
                          updateDeliveryDetails("fullName", e.target.value)
                        }
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
                        onChange={(e) =>
                          updateDeliveryDetails("phone", e.target.value)
                        }
                        required
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Shipping Address */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 border-b pb-2">
                    {lang === "id" ? "Alamat Pengiriman" : "Shipping Address"}
                  </h3>
                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-sm font-medium">
                      {t.fullAddress} *
                    </Label>
                    <Textarea
                      id="address"
                      rows={3}
                      value={deliveryDetails.address}
                      onChange={(e) =>
                        updateDeliveryDetails("address", e.target.value)
                      }
                      required
                      className="w-full resize-none"
                      placeholder={
                        lang === "id"
                          ? "Masukkan alamat lengkap..."
                          : "Enter complete address..."
                      }
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
                        onChange={(e) =>
                          updateDeliveryDetails("city", e.target.value)
                        }
                        required
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="postalCode"
                        className="text-sm font-medium"
                      >
                        {t.postalCode}
                      </Label>
                      <Input
                        id="postalCode"
                        value={deliveryDetails.postalCode}
                        onChange={(e) =>
                          updateDeliveryDetails("postalCode", e.target.value)
                        }
                        className="w-full"
                        placeholder="12345"
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Notes */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 border-b pb-2">
                    {lang === "id" ? "Catatan Tambahan" : "Additional Notes"}
                  </h3>
                  <div className="space-y-2">
                    <Label htmlFor="notes" className="text-sm font-medium">
                      {t.additionalNotes}
                    </Label>
                    <Textarea
                      id="notes"
                      rows={3}
                      value={deliveryDetails.notes}
                      onChange={(e) =>
                        updateDeliveryDetails("notes", e.target.value)
                      }
                      className="w-full resize-none"
                      placeholder={
                        lang === "id"
                          ? "Catatan khusus untuk pengiriman..."
                          : "Special notes for delivery..."
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t">
                <Button type="submit" size="lg" className="w-full">
                  {lang === "id" ? "Pesan Sekarang" : "Place Order"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
