// React & Router
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// External Libraries
import { 
  Search, 
  MoreVertical, 
  Eye, 
  Package, 
  MapPin, 
  Clock, 
  User,
  Phone,
  Mail,
  FileText
} from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import Navbar from "@/components/layout/Navbar";
import AdminSidebar from "@/components/layout/AdminSidebar";
import SEO from "@/components/seo/SEO";

// Hooks
import { useLanguage } from "@/hooks/use-language";

// Integrations
import { supabase } from "@/integrations/supabase/client";

// Tax constant
const TAX_RATE = 0.11; // 11% VAT/PPN

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
  distributor?: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  order_items?: OrderItem[];
}

const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
const PAYMENT_STATUSES = ['unpaid', 'partial', 'paid'];

export default function OrderManagement() {
  const { lang } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<"latest" | "oldest">("latest");
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const t = lang === 'id' ? {
    title: "Kelola Pesanan",
    description: "Kelola semua pesanan distributor",
    search: "Cari pesanan...",
    searchBy: "Cari berdasarkan nomor order, distributor",
    orderNumber: "Nomor Pesanan",
    distributor: "Distributor",
    totalAmount: "Total",
    status: "Status",
    paymentStatus: "Status Pembayaran",
    date: "Tanggal",
    actions: "Aksi",
    viewDetails: "Lihat Detail",
    updateStatus: "Update Status",
    orderDetails: "Detail Pesanan",
    shippingInfo: "Informasi Pengiriman",
    orderItems: "Item Pesanan",
    product: "Produk",
    quantity: "Jumlah",
    unitPrice: "Harga Satuan",
    subtotal: "Subtotal",
    total: "Total",
    tax: "PPN (11%)",
    grandTotal: "Total Keseluruhan",
    notes: "Catatan",
    noOrders: "Tidak ada pesanan",
    loading: "Memuat...",
    sortBy: "Urutkan",
    latest: "Terbaru",
    oldest: "Terlama",
    perPage: "Per halaman",
    showing: "Menampilkan",
    of: "dari",
    orders: "pesanan",
    statusPending: "Menunggu",
    statusProcessing: "Diproses",
    statusShipped: "Dikirim",
    statusDelivered: "Terkirim",
    statusCancelled: "Dibatalkan",
    paymentUnpaid: "Belum Dibayar",
    paymentPartial: "Dibayar Sebagian",
    paymentPaid: "Lunas",
    updateOrderStatus: "Update Status Pesanan",
    orderStatus: "Status Pesanan",
    save: "Simpan",
    cancel: "Batal",
    successUpdate: "Status pesanan berhasil diupdate",
    errorUpdate: "Gagal mengupdate status pesanan",
  } : {
    title: "Manage Orders",
    description: "Manage all distributor orders",
    search: "Search orders...",
    searchBy: "Search by order number, distributor",
    orderNumber: "Order Number",
    distributor: "Distributor",
    totalAmount: "Total",
    status: "Status",
    paymentStatus: "Payment Status",
    date: "Date",
    actions: "Actions",
    viewDetails: "View Details",
    updateStatus: "Update Status",
    orderDetails: "Order Details",
    shippingInfo: "Shipping Information",
    orderItems: "Order Items",
    product: "Product",
    quantity: "Quantity",
    unitPrice: "Unit Price",
    subtotal: "Subtotal",
    total: "Total",
    tax: "VAT (11%)",
    grandTotal: "Grand Total",
    notes: "Notes",
    noOrders: "No orders found",
    loading: "Loading...",
    sortBy: "Sort by",
    latest: "Latest",
    oldest: "Oldest",
    perPage: "Per page",
    showing: "Showing",
    of: "of",
    orders: "orders",
    statusPending: "Pending",
    statusProcessing: "Processing",
    statusShipped: "Shipped",
    statusDelivered: "Delivered",
    statusCancelled: "Cancelled",
    paymentUnpaid: "Unpaid",
    paymentPartial: "Partial",
    paymentPaid: "Paid",
    updateOrderStatus: "Update Order Status",
    orderStatus: "Order Status",
    save: "Save",
    cancel: "Cancel",
    successUpdate: "Order status updated successfully",
    errorUpdate: "Failed to update order status",
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    filterAndSortOrders();
  }, [orders, searchQuery, sortOrder]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);

      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
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
          distributor_profiles!inner (
            id,
            nama_bisnis,
            email_pemilik,
            kontak_pemilik
          )
        `)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      const formattedOrders: Order[] = (ordersData || []).map((order: any) => ({
        ...order,
        distributor: {
          id: order.distributor_profiles?.id || '',
          name: order.distributor_profiles?.nama_bisnis || 'Unknown',
          email: order.distributor_profiles?.email_pemilik || '',
          phone: order.distributor_profiles?.kontak_pemilik || '',
        },
      }));

      setOrders(formattedOrders);
    } catch (error: any) {
      console.error('Error loading orders:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load orders",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndSortOrders = () => {
    let filtered = [...orders];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(order =>
        order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.distributor?.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort
    filtered.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === "latest" ? dateB - dateA : dateA - dateB;
    });

    setFilteredOrders(filtered);
  };

  const handleViewOrder = (order: Order) => {
    navigate(`/admin/orders/${order.id}`);
  };

  const handleUpdateStatus = (order: Order) => {
    navigate(`/admin/orders/${order.id}`);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: any; label: string }> = {
      pending: { variant: 'default', label: t.statusPending },
      processing: { variant: 'secondary', label: t.statusProcessing },
      shipped: { variant: 'outline', label: t.statusShipped },
      delivered: { variant: 'default', label: t.statusDelivered },
      cancelled: { variant: 'destructive', label: t.statusCancelled },
    };

    const statusInfo = statusMap[status] || { variant: 'default', label: status };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const getPaymentBadge = (status: string) => {
    const statusMap: Record<string, { variant: any; label: string }> = {
      unpaid: { variant: 'destructive', label: t.paymentUnpaid },
      partial: { variant: 'secondary', label: t.paymentPartial },
      paid: { variant: 'default', label: t.paymentPaid },
    };

    const statusInfo = statusMap[status] || { variant: 'default', label: status };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calculateTax = (amount: number) => {
    return amount * TAX_RATE;
  };

  const calculateGrandTotal = (amount: number) => {
    return amount + calculateTax(amount);
  };

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentOrders = filteredOrders.slice(startIndex, endIndex);

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO title={t.title} description={t.description} />
      <Navbar />
      <div className="flex">
        <AdminSidebar lang={lang} />
        <main className="flex-1 py-8 px-4 lg:px-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{t.title}</h1>
                <p className="text-gray-600 mt-1">{t.description}</p>
              </div>
            </div>

            {/* Search and Filters */}
            <Card className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder={t.search}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={sortOrder} onValueChange={(value: any) => setSortOrder(value)}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="latest">{t.latest}</SelectItem>
                      <SelectItem value="oldest">{t.oldest}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select 
                    value={itemsPerPage.toString()} 
                    onValueChange={(value) => {
                      setItemsPerPage(Number(value));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 {t.perPage}</SelectItem>
                      <SelectItem value="25">25 {t.perPage}</SelectItem>
                      <SelectItem value="50">50 {t.perPage}</SelectItem>
                      <SelectItem value="100">100 {t.perPage}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>

            {/* Orders Table */}
            <Card>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.orderNumber}</TableHead>
                      <TableHead>{t.distributor}</TableHead>
                      <TableHead>{t.totalAmount}</TableHead>
                      <TableHead>{t.status}</TableHead>
                      <TableHead>{t.paymentStatus}</TableHead>
                      <TableHead>{t.date}</TableHead>
                      <TableHead className="text-right">{t.actions}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          {t.loading}
                        </TableCell>
                      </TableRow>
                    ) : currentOrders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          {t.noOrders}
                        </TableCell>
                      </TableRow>
                    ) : (
                      currentOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-gray-400" />
                              {order.order_number}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-gray-400" />
                              <div>
                                <div className="font-medium">{order.distributor?.name}</div>
                                {order.distributor?.email && (
                                  <div className="text-xs text-gray-500">{order.distributor.email}</div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{formatCurrency(order.total_amount)}</TableCell>
                          <TableCell>{getStatusBadge(order.status)}</TableCell>
                          <TableCell>{getPaymentBadge(order.payment_status)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Clock className="h-4 w-4" />
                              {formatDate(order.created_at)}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewOrder(order)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  {t.viewDetails}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleUpdateStatus(order)}>
                                  <FileText className="h-4 w-4 mr-2" />
                                  {t.updateStatus}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {filteredOrders.length > 0 && (
                <div className="flex items-center justify-between px-4 py-4 border-t">
                  <div className="text-sm text-gray-500">
                    {t.showing} {startIndex + 1}-{Math.min(endIndex, filteredOrders.length)} {t.of} {filteredOrders.length} {t.orders}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
