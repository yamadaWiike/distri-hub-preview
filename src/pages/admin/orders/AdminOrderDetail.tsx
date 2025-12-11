// React & Router
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

// External Libraries
import {
  ArrowLeft,
  Package,
  MapPin,
  Clock,
  User,
  Phone,
  Mail,
  FileText,
  Save,
  Trash2,
  Plus,
  Pencil,
} from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { Separator } from "@/components/ui/separator";
import Navbar from "@/components/layout/Navbar";
import AdminSidebar from "@/components/layout/AdminSidebar";
import SEO from "@/components/seo/SEO";

// Hooks
import { useLanguage } from "@/hooks/use-language";

// Integrations
import { supabase } from "@/integrations/supabase/client";

interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  product_name?: string;
  product_sku?: string;
}

interface Order {
  id: string;
  distributor_id: string;
  total_amount: number;
  status: string;
  order_number: string;
  shipping_address: string;
  shipping_city: string;
  shipping_notes: string | null;
  payment_status: string;
  created_at: string;
  updated_at?: string;
  distributor?: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  order_items?: OrderItem[];
}

const ORDER_STATUSES = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];
const PAYMENT_STATUSES = ["unpaid", "partial", "paid"];

export default function AdminOrderDetail() {
  const { lang } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { id } = useParams();

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [orderStatus, setOrderStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [taxRate, setTaxRate] = useState(11); // Default 11%

  const t =
    lang === "id"
      ? {
          title: "Detail Pesanan",
          description: "Lihat dan kelola detail pesanan",
          backToOrders: "Kembali ke Pesanan",
          orderNumber: "Nomor Pesanan",
          distributor: "Distributor",
          status: "Status",
          paymentStatus: "Status Pembayaran",
          date: "Tanggal",
          updatedDate: "Terakhir Diupdate",
          shippingInfo: "Informasi Pengiriman",
          address: "Alamat",
          city: "Kota",
          notes: "Catatan",
          orderItems: "Item Pesanan",
          product: "Produk",
          sku: "SKU",
          quantity: "Jumlah",
          unitPrice: "Harga Satuan",
          subtotal: "Subtotal",
          orderSummary: "Ringkasan Pesanan",
          total: "Total",
          tax: "PPN (11%)",
          grandTotal: "Total Keseluruhan",
          statusPending: "Menunggu",
          statusProcessing: "Diproses",
          statusShipped: "Dikirim",
          statusDelivered: "Terkirim",
          statusCancelled: "Dibatalkan",
          paymentUnpaid: "Belum Dibayar",
          paymentPartial: "Dibayar Sebagian",
          paymentPaid: "Lunas",
          saveChanges: "Simpan Perubahan",
          saving: "Menyimpan...",
          loading: "Memuat...",
          orderNotFound: "Pesanan tidak ditemukan",
          successUpdate: "Pesanan berhasil diupdate",
          errorUpdate: "Gagal mengupdate pesanan",
          orderStatus: "Status Pesanan",
          distributorInfo: "Informasi Distributor",
          taxRate: "Tarif Pajak (%)",
          editItems: "Edit Item",
          removeItem: "Hapus Item",
          addItem: "Tambah Item",
          actions: "Aksi",
          recalculating: "Menghitung ulang...",
        }
      : {
          title: "Order Details",
          description: "View and manage order details",
          backToOrders: "Back to Orders",
          orderNumber: "Order Number",
          distributor: "Distributor",
          status: "Status",
          paymentStatus: "Payment Status",
          date: "Date",
          updatedDate: "Last Updated",
          shippingInfo: "Shipping Information",
          address: "Address",
          city: "City",
          notes: "Notes",
          orderItems: "Order Items",
          product: "Product",
          sku: "SKU",
          quantity: "Quantity",
          unitPrice: "Unit Price",
          subtotal: "Subtotal",
          orderSummary: "Order Summary",
          total: "Total",
          tax: "VAT (11%)",
          grandTotal: "Grand Total",
          statusPending: "Pending",
          statusProcessing: "Processing",
          statusShipped: "Shipped",
          statusDelivered: "Delivered",
          statusCancelled: "Cancelled",
          paymentUnpaid: "Unpaid",
          paymentPartial: "Partial",
          paymentPaid: "Paid",
          saveChanges: "Save Changes",
          saving: "Saving...",
          loading: "Loading...",
          orderNotFound: "Order not found",
          successUpdate: "Order updated successfully",
          errorUpdate: "Failed to update order",
          orderStatus: "Order Status",
          distributorInfo: "Distributor Information",
          taxRate: "Tax Rate (%)",
          editItems: "Edit Items",
          removeItem: "Remove Item",
          addItem: "Add Item",
          actions: "Actions",
          recalculating: "Recalculating...",
        };

  useEffect(() => {
    if (id) {
      fetchOrderDetails();
    }
  }, [id]);

  const fetchOrderDetails = async () => {
    try {
      setIsLoading(true);

      // Fetch order with distributor info
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select(
          `
          id,
          distributor_id,
          total_amount,
          status,
          order_number,
          shipping_address,
          shipping_city,
          shipping_notes,
          payment_status,
          created_at,
          updated_at,
          distributor_profiles!inner (
            id,
            nama_bisnis,
            email_pemilik,
            kontak_pemilik
          )
        `
        )
        .eq("id", id)
        .single();

      if (orderError) throw orderError;

      // Fetch order items with product details
      const { data: items, error: itemsError } = await supabase
        .from("order_items")
        .select(
          `
          id,
          product_id,
          quantity,
          unit_price,
          subtotal,
          products (
            name,
            sku
          )
        `
        )
        .eq("order_id", id);

      if (itemsError) throw itemsError;

      const formattedItems = (items || []).map((item: any) => ({
        ...item,
        product_name: item.products?.name || "Unknown Product",
        product_sku: item.products?.sku || "N/A",
      }));

      const formattedOrder: Order = {
        ...orderData,
        distributor: {
          id: orderData.distributor_profiles?.id || "",
          name: orderData.distributor_profiles?.nama_bisnis || "Unknown",
          email: orderData.distributor_profiles?.email_pemilik || "",
          phone: orderData.distributor_profiles?.kontak_pemilik || "",
        },
        order_items: formattedItems,
      };

      setOrder(formattedOrder);
      setOrderStatus(formattedOrder.status);
      setPaymentStatus(formattedOrder.payment_status);
      setOrderItems(formattedItems);
    } catch (error: any) {
      console.error("Error loading order:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load order details",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    setOrderItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const subtotal = item.unit_price * newQuantity;
          return { ...item, quantity: newQuantity, subtotal };
        }
        return item;
      })
    );
  };

  const handlePriceChange = (itemId: string, newPrice: number) => {
    if (newPrice < 0) return;

    setOrderItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const subtotal = newPrice * item.quantity;
          return { ...item, unit_price: newPrice, subtotal };
        }
        return item;
      })
    );
  };

  const handleRemoveItem = (itemId: string) => {
    setOrderItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const calculateItemsTotal = () => {
    return orderItems.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const handleSave = async () => {
    if (!order) return;

    try {
      setIsSaving(true);

      const newTotal = calculateItemsTotal();

      // Update order items
      for (const item of orderItems) {
        const { error: itemError } = await supabase
          .from("order_items")
          .update({
            quantity: item.quantity,
            unit_price: item.unit_price,
            subtotal: item.subtotal,
          })
          .eq("id", item.id);

        if (itemError) throw itemError;
      }

      // Update order
      const { error } = await supabase
        .from("orders")
        .update({
          status: orderStatus,
          payment_status: paymentStatus,
          total_amount: newTotal,
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.id);

      if (error) throw error;

      toast({
        title: t.successUpdate,
      });

      fetchOrderDetails();
    } catch (error: any) {
      console.error("Error updating order:", error);
      toast({
        title: t.errorUpdate,
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: any; label: string }> = {
      pending: { variant: "default", label: t.statusPending },
      processing: { variant: "secondary", label: t.statusProcessing },
      shipped: { variant: "outline", label: t.statusShipped },
      delivered: { variant: "default", label: t.statusDelivered },
      cancelled: { variant: "destructive", label: t.statusCancelled },
    };

    const statusInfo = statusMap[status] || {
      variant: "default",
      label: status,
    };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const getPaymentBadge = (status: string) => {
    const statusMap: Record<string, { variant: any; label: string }> = {
      unpaid: { variant: "destructive", label: t.paymentUnpaid },
      partial: { variant: "secondary", label: t.paymentPartial },
      paid: { variant: "default", label: t.paymentPaid },
    };

    const statusInfo = statusMap[status] || {
      variant: "default",
      label: status,
    };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const calculateTax = (amount: number) => {
    return amount * (taxRate / 100);
  };

  const calculateGrandTotal = (amount: number) => {
    return amount + calculateTax(amount);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SEO title={t.loading} description={t.description} />
        <Navbar />
        <div className="flex">
          <AdminSidebar lang={lang} />
          <main className="flex-1 py-8 px-4 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">{t.loading}</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SEO title={t.orderNotFound} description={t.description} />
        <Navbar />
        <div className="flex">
          <AdminSidebar lang={lang} />
          <main className="flex-1 py-8 px-4 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <Card className="p-6 text-center">
                <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h2 className="text-xl font-semibold mb-2">
                  {t.orderNotFound}
                </h2>
                <Button
                  onClick={() => navigate("/admin/orders")}
                  className="mt-4"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Card>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO
        title={`${t.title} - ${order.order_number}`}
        description={t.description}
      />
      <Navbar />
      <div className="flex">
        <AdminSidebar lang={lang} />
        <main className="flex-1 py-8 px-4 lg:px-8">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => navigate("/admin/orders")}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {t.backToOrders}
                </Button>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {t.title}
                  </h1>
                  <p className="text-gray-600 mt-1">{order.order_number}</p>
                </div>
              </div>
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? t.saving : t.saveChanges}
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Order Info & Status */}
              <div className="lg:col-span-2 space-y-6">
                {/* Order Info Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      {t.orderNumber}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-600">{t.orderNumber}</Label>
                        <p className="font-medium text-lg">
                          {order.order_number}
                        </p>
                      </div>
                      <div>
                        <Label className="text-gray-600">{t.date}</Label>
                        <p className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          {formatDate(order.created_at)}
                        </p>
                      </div>
                      {order.updated_at && (
                        <div className="col-span-2">
                          <Label className="text-gray-600">
                            {t.updatedDate}
                          </Label>
                          <p className="text-sm text-gray-600">
                            {formatDate(order.updated_at)}
                          </p>
                        </div>
                      )}
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{t.orderStatus}</Label>
                        <Select
                          value={orderStatus}
                          onValueChange={setOrderStatus}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ORDER_STATUSES.map((status) => (
                              <SelectItem key={status} value={status}>
                                {
                                  (t as any)[
                                    `status${
                                      status.charAt(0).toUpperCase() +
                                      status.slice(1)
                                    }`
                                  ]
                                }
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>{t.paymentStatus}</Label>
                        <Select
                          value={paymentStatus}
                          onValueChange={setPaymentStatus}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PAYMENT_STATUSES.map((status) => (
                              <SelectItem key={status} value={status}>
                                {
                                  (t as any)[
                                    `payment${
                                      status.charAt(0).toUpperCase() +
                                      status.slice(1)
                                    }`
                                  ]
                                }
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Order Items Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      {t.orderItems}
                      <Badge variant="secondary" className="ml-2">
                        <Pencil className="h-3 w-3 mr-1" />
                        {t.editItems}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{t.product}</TableHead>
                            <TableHead>{t.sku}</TableHead>
                            <TableHead className="text-right">
                              {t.quantity}
                            </TableHead>
                            <TableHead className="text-right">
                              {t.unitPrice}
                            </TableHead>
                            <TableHead className="text-right">
                              {t.subtotal}
                            </TableHead>
                            <TableHead className="text-right">
                              {t.actions}
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {orderItems.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium">
                                {item.product_name}
                              </TableCell>
                              <TableCell className="text-gray-600">
                                {item.product_sku}
                              </TableCell>
                              <TableCell className="text-right">
                                <Input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) =>
                                    handleQuantityChange(
                                      item.id,
                                      parseInt(e.target.value) || 1
                                    )
                                  }
                                  className="w-20 text-right"
                                />
                              </TableCell>
                              <TableCell className="text-right">
                                <Input
                                  type="number"
                                  min="0"
                                  value={item.unit_price}
                                  onChange={(e) =>
                                    handlePriceChange(
                                      item.id,
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                  className="w-32 text-right"
                                />
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {formatCurrency(item.subtotal)}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveItem(item.id)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                {/* Shipping Info Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      {t.shippingInfo}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-gray-600">{t.address}</Label>
                      <p className="mt-1">{order.shipping_address}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">{t.city}</Label>
                      <p className="mt-1">{order.shipping_city}</p>
                    </div>
                    {order.shipping_notes && (
                      <div>
                        <Label className="text-gray-600">{t.notes}</Label>
                        <p className="mt-1 text-sm">{order.shipping_notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Distributor & Summary */}
              <div className="space-y-6">
                {/* Distributor Info Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      {t.distributorInfo}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="font-semibold text-lg">
                        {order.distributor?.name}
                      </p>
                    </div>
                    {order.distributor?.email && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="h-4 w-4" />
                        <a
                          href={`mailto:${order.distributor.email}`}
                          className="hover:underline"
                        >
                          {order.distributor.email}
                        </a>
                      </div>
                    )}
                    {order.distributor?.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="h-4 w-4" />
                        <a
                          href={`tel:${order.distributor.phone}`}
                          className="hover:underline"
                        >
                          {order.distributor.phone}
                        </a>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Order Summary Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>{t.orderSummary}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-base">
                      <span className="text-gray-600">{t.total}</span>
                      <span className="font-medium">
                        {formatCurrency(calculateItemsTotal())}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label className="text-gray-600">{t.taxRate}</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={taxRate}
                            onChange={(e) =>
                              setTaxRate(parseFloat(e.target.value) || 0)
                            }
                            className="w-20 text-right"
                          />
                          <span className="text-sm text-gray-600">%</span>
                        </div>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>{t.tax}</span>
                        <span>
                          {formatCurrency(calculateTax(calculateItemsTotal()))}
                        </span>
                      </div>
                    </div>

                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>{t.grandTotal}</span>
                      <span className="text-primary">
                        {formatCurrency(
                          calculateGrandTotal(calculateItemsTotal())
                        )}
                      </span>
                    </div>

                    <Separator />

                    <div className="space-y-2 pt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          {t.status}
                        </span>
                        {getStatusBadge(order.status)}
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          {t.paymentStatus}
                        </span>
                        {getPaymentBadge(order.payment_status)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
