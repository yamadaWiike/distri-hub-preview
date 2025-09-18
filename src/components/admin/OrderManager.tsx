import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Search, Loader2, FileDown, Eye } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

// Define types for orders matching the actual database schema
type Order = {
  id: string;
  distributor_id: string;
  order_number: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total_amount: number;
  shipping_address: string;
  shipping_city: string;
  shipping_notes?: string;
  payment_method?: string;
  payment_status: 'unpaid' | 'partial' | 'paid';
  created_at: string;
  updated_at: string;
  order_items: OrderItem[];
  distributor?: {
    nama_bisnis: string;
    nama_pemilik: string;
    email_pemilik?: string;
    kontak_pemilik: string;
  };
};

type OrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  consumer_price: number;
  subtotal: number;
  created_at: string;
  product?: {
    name: string;
    sku: string;
  };
};

// English and Indonesian translations
const en = {
  ordersManagement: "Orders Management",
  searchOrders: "Search orders...",
  exportCSV: "Export CSV",
  noOrders: "No orders found.",
  orderNumber: "Order Number",
  distributor: "Distributor",
  date: "Date",
  total: "Total",
  status: "Status",
  paymentStatus: "Payment Status",
  actions: "Actions",
  viewDetails: "View Details",
  orderDetails: "Order Details",
  distributorInfo: "Distributor Information",
  businessName: "Business Name",
  ownerName: "Owner Name",
  email: "Email",
  phone: "Phone",
  shippingAddress: "Shipping Address",
  shippingCity: "Shipping City",
  shippingNotes: "Shipping Notes",
  paymentMethod: "Payment Method",
  items: "Items",
  product: "Product",
  sku: "SKU",
  quantity: "Quantity",
  unitPrice: "Unit Price",
  consumerPrice: "Consumer Price",
  subtotal: "Subtotal",
  updateStatus: "Update Status",
  close: "Close",
  pending: "Pending",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  unpaid: "Unpaid",
  partial: "Partial",
  paid: "Paid",
  statusUpdated: "Status Updated",
  statusUpdatedDesc: "The order status has been updated successfully.",
  errorFetching: "Error Fetching Orders",
  errorUpdating: "Error Updating Order"
};

const id = {
  ordersManagement: "Manajemen Pesanan",
  searchOrders: "Cari pesanan...",
  exportCSV: "Ekspor CSV",
  noOrders: "Tidak ada pesanan ditemukan.",
  orderNumber: "Nomor Pesanan",
  distributor: "Distributor",
  date: "Tanggal",
  total: "Total",
  status: "Status",
  paymentStatus: "Status Pembayaran",
  actions: "Tindakan",
  viewDetails: "Lihat Detail",
  orderDetails: "Detail Pesanan",
  distributorInfo: "Informasi Distributor",
  businessName: "Nama Bisnis",
  ownerName: "Nama Pemilik",
  email: "Email",
  phone: "Telepon",
  shippingAddress: "Alamat Pengiriman",
  shippingCity: "Kota Pengiriman",
  shippingNotes: "Catatan Pengiriman",
  paymentMethod: "Metode Pembayaran",
  items: "Item",
  product: "Produk",
  sku: "SKU",
  quantity: "Jumlah",
  unitPrice: "Harga Satuan",
  consumerPrice: "Harga Konsumen",
  subtotal: "Subtotal",
  updateStatus: "Perbarui Status",
  close: "Tutup",
  pending: "Tertunda",
  processing: "Diproses",
  shipped: "Dikirim",
  delivered: "Diterima",
  cancelled: "Dibatalkan",
  unpaid: "Belum Bayar",
  partial: "Sebagian",
  paid: "Lunas",
  statusUpdated: "Status Diperbarui",
  statusUpdatedDesc: "Status pesanan telah berhasil diperbarui.",
  errorFetching: "Kesalahan Mengambil Pesanan",
  errorUpdating: "Kesalahan Memperbarui Pesanan"
};

const OrderManager = () => {
  const { toast } = useToast();
  const { lang } = useLanguage();
  const t = lang === 'id' ? id : en;
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [orderStatus, setOrderStatus] = useState<Order['status']>('pending');
  
  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredOrders(orders);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredOrders(orders.filter(order => 
        order.id.toLowerCase().includes(query) ||
        order.order_number.toLowerCase().includes(query) ||
        order.distributor?.nama_bisnis?.toLowerCase().includes(query) ||
        order.distributor?.nama_pemilik?.toLowerCase().includes(query) ||
        order.distributor?.email_pemilik?.toLowerCase().includes(query) ||
        order.status.toLowerCase().includes(query)
      ));
    }
  }, [searchQuery, orders]);
  
  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      // Debug: Check current user and auth state
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('Auth error:', userError);
      }
      console.log('Current user:', user?.email);
      
      // Check admin access using the same logic as client.ts
      const adminEmails = ['rudy@baskit.app', 'admin.commercial@baskit.app'];
      const isAdminUser = adminEmails.includes(user?.email || '');
      console.log('Is admin user:', isAdminUser);
      
      if (!isAdminUser) {
        throw new Error('Access denied. Admin privileges required.');
      }
      
      // Query with the correct database schema
      console.log('Fetching orders with correct schema...');
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          distributor_id,
          order_number,
          status,
          total_amount,
          shipping_address,
          shipping_city,
          shipping_notes,
          payment_method,
          payment_status,
          created_at,
          updated_at,
          distributor:distributor_profiles(
            nama_bisnis,
            nama_pemilik,
            email_pemilik,
            kontak_pemilik
          ),
          order_items (
            id,
            order_id,
            product_id,
            quantity,
            unit_price,
            consumer_price,
            subtotal,
            created_at,
            product:products(
              name,
              sku
            )
          )
        `)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Database error:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }
      
      console.log('Raw query result:', { data, error, dataLength: data?.length });
      
      if (data && data.length > 0) {
        console.log('Fetched orders data:', data);
        setOrders(data);
        setFilteredOrders(data);
      } else {
        console.log('No orders found in database - this could be due to RLS policies or no data');
        setOrders([]);
        setFilteredOrders([]);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: t.errorFetching,
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive"
      });
      // Set empty array on error instead of mock data
      setOrders([]);
      setFilteredOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Debug function to test database access
  const debugDatabaseAccess = async () => {
    console.log('=== DATABASE DEBUG STARTED ===');
    
    try {
      // 1. Check authentication
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      console.log('1. Current user:', { email: user?.email, id: user?.id, error: userError });
      
      // 2. Test admin function
      const { data: adminResult, error: adminError } = await supabase.rpc('is_admin_user');
      console.log('2. Admin function result:', { result: adminResult, error: adminError });
      
      // 3. Test simple orders count
      const { count, error: countError } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });
      console.log('3. Orders count:', { count, error: countError });
      
      // 4. Test orders query without joins
      const { data: simpleOrders, error: simpleError } = await supabase
        .from('orders')
        .select('id, order_number, status, created_at')
        .limit(5);
      console.log('4. Simple orders query:', { data: simpleOrders, error: simpleError });
      
      // 5. Test RLS policies existence
      const { data: policies, error: policyError } = await supabase
        .from('pg_policies')
        .select('tablename, policyname, cmd')
        .in('tablename', ['orders', 'order_items']);
      console.log('5. RLS policies:', { policies, error: policyError });
      
    } catch (error) {
      console.error('Debug error:', error);
    }
    
    console.log('=== DATABASE DEBUG COMPLETED ===');
  };
  
  const openOrderDialog = (order: Order) => {
    setSelectedOrder(order);
    setOrderStatus(order.status);
    setIsDialogOpen(true);
  };
  
  const closeDialog = () => {
    setIsDialogOpen(false);
    setSelectedOrder(null);
  };
  
  const updateOrderStatus = async () => {
    if (!selectedOrder) return;
    
    try {
      const { error } = await supabase
        .from('orders')
        // @ts-expect-error - Supabase types don't match our Order type structure
        .update({ status: orderStatus })
        .eq('id', selectedOrder.id);
        
      if (error) throw error;
      
      // Update local state
      setOrders(prev => prev.map(order => 
        order.id === selectedOrder.id ? { ...order, status: orderStatus } : order
      ));
      
      toast({
        title: t.statusUpdated,
        description: t.statusUpdatedDesc,
      });
      
      closeDialog();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: t.errorUpdating,
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive"
      });
    }
  };
  
  const exportToCSV = () => {
    // Create CSV content
    const headers = [
      t.orderNumber, 
      t.distributor, 
      t.email, 
      t.phone, 
      t.shippingAddress, 
      t.date, 
      t.total, 
      t.status,
      t.paymentStatus
    ].join(',');
    
    const rows = filteredOrders.map(order => [
      order.order_number,
      order.distributor?.nama_bisnis || '',
      order.distributor?.email_pemilik || '',
      order.distributor?.kontak_pemilik || '',
      `"${order.shipping_address.replace(/"/g, '""')}"`,
      new Date(order.created_at).toLocaleDateString(),
      order.total_amount.toFixed(2),
      order.status,
      order.payment_status
    ].join(','));
    
    const csvContent = [headers, ...rows].join('\n');
    
    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `orders_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Status badge color mapping
  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{t.ordersManagement}</h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t.searchOrders}
              className="pl-8 w-[250px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button 
            variant="outline" 
            onClick={exportToCSV} 
            className="flex items-center gap-2"
          >
            <FileDown size={16} />
            {t.exportCSV}
          </Button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {t.noOrders}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.orderNumber}</TableHead>
                <TableHead>{t.distributor}</TableHead>
                <TableHead>{t.date}</TableHead>
                <TableHead>{t.total}</TableHead>
                <TableHead>{t.status}</TableHead>
                <TableHead>{t.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.order_number}</TableCell>
                  <TableCell>{order.distributor?.nama_bisnis || 'N/A'}</TableCell>
                  <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>Rp {order.total_amount.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(order.status)}>
                      {t[order.status as keyof typeof t]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => openOrderDialog(order)}
                      className="flex items-center gap-1"
                    >
                      <Eye size={14} />
                      {t.viewDetails}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      
      {/* Order Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{t.orderDetails}</DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium mb-2">{t.distributorInfo}</h4>
                <div className="grid grid-cols-2 gap-4 bg-muted p-4 rounded-md">
                  <div>
                    <p className="text-sm font-medium">{t.businessName}</p>
                    <p className="text-sm">{selectedOrder.distributor?.nama_bisnis || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{t.ownerName}</p>
                    <p className="text-sm">{selectedOrder.distributor?.nama_pemilik || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{t.email}</p>
                    <p className="text-sm">{selectedOrder.distributor?.email_pemilik || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{t.phone}</p>
                    <p className="text-sm">{selectedOrder.distributor?.kontak_pemilik || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{t.shippingAddress}</p>
                    <p className="text-sm">{selectedOrder.shipping_address}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Distributor</p>
                    <p className="text-sm">{selectedOrder.distributor?.nama_bisnis || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Contact Person</p>
                    <p className="text-sm">{selectedOrder.distributor?.nama_pemilik || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Contact Email</p>
                    <p className="text-sm">{selectedOrder.distributor?.email_pemilik || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Shipping City</p>
                    <p className="text-sm">{selectedOrder.shipping_city}</p>
                  </div>
                  {selectedOrder.shipping_notes && (
                    <div className="col-span-2">
                      <p className="text-sm font-medium">Shipping Notes</p>
                      <p className="text-sm">{selectedOrder.shipping_notes}</p>
                    </div>
                  )}
                  {selectedOrder.payment_method && (
                    <div>
                      <p className="text-sm font-medium">Payment Method</p>
                      <p className="text-sm">{selectedOrder.payment_method}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium">Payment Status</p>
                    <p className="text-sm">{selectedOrder.payment_status}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">{t.items}</h4>
                <div className="bg-muted p-4 rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t.product}</TableHead>
                        <TableHead>{t.sku}</TableHead>
                        <TableHead className="w-24">{t.quantity}</TableHead>
                        <TableHead className="w-32">{t.unitPrice}</TableHead>
                        <TableHead className="w-32">{t.consumerPrice}</TableHead>
                        <TableHead className="w-32">{t.subtotal}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrder.order_items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.product?.name || 'N/A'}</TableCell>
                          <TableCell>{item.product?.sku || 'N/A'}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>Rp {item.unit_price.toLocaleString()}</TableCell>
                          <TableCell>Rp {item.consumer_price.toLocaleString()}</TableCell>
                          <TableCell>Rp {item.subtotal.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={3} className="text-right font-medium">
                          {t.total}:
                        </TableCell>
                        <TableCell className="font-bold">
                          Rp {selectedOrder.total_amount.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">{t.updateStatus}</h4>
                <div className="flex gap-4">
                  <Select 
                    value={orderStatus} 
                    onValueChange={(value) => setOrderStatus(value as Order['status'])}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">{t.pending}</SelectItem>
                      <SelectItem value="processing">{t.processing}</SelectItem>
                      <SelectItem value="shipped">{t.shipped}</SelectItem>
                      <SelectItem value="delivered">{t.delivered}</SelectItem>
                      <SelectItem value="cancelled">{t.cancelled}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={updateOrderStatus}>
                    {t.updateStatus}
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              {t.close}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrderManager;
