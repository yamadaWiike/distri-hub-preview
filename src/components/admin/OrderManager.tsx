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

// Define types for orders
type Order = {
  id: string;
  user_id: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  total_amount: number;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
  shipping_address: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
};

type OrderItem = {
  id: string;
  order_id: string;
  product_id: string; // Now a VARCHAR string from products table, not a UUID
  quantity: number;
  unit_price: number;
  product_name: string;
};

// English and Indonesian translations
const en = {
  ordersManagement: "Orders Management",
  searchOrders: "Search orders...",
  exportCSV: "Export CSV",
  noOrders: "No orders found.",
  orderId: "Order ID",
  customer: "Customer",
  date: "Date",
  total: "Total",
  status: "Status",
  actions: "Actions",
  viewDetails: "View Details",
  orderDetails: "Order Details",
  customerInfo: "Customer Information",
  name: "Name",
  email: "Email",
  phone: "Phone",
  address: "Address",
  items: "Items",
  product: "Product",
  quantity: "Quantity",
  unitPrice: "Unit Price",
  subtotal: "Subtotal",
  updateStatus: "Update Status",
  close: "Close",
  pending: "Pending",
  confirmed: "Confirmed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
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
  orderId: "ID Pesanan",
  customer: "Pelanggan",
  date: "Tanggal",
  total: "Total",
  status: "Status",
  actions: "Tindakan",
  viewDetails: "Lihat Detail",
  orderDetails: "Detail Pesanan",
  customerInfo: "Informasi Pelanggan",
  name: "Nama",
  email: "Email",
  phone: "Telepon",
  address: "Alamat",
  items: "Item",
  product: "Produk",
  quantity: "Jumlah",
  unitPrice: "Harga Satuan",
  subtotal: "Subtotal",
  updateStatus: "Perbarui Status",
  close: "Tutup",
  pending: "Tertunda",
  confirmed: "Dikonfirmasi",
  shipped: "Dikirim",
  delivered: "Diterima",
  cancelled: "Dibatalkan",
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
        order.customer_name.toLowerCase().includes(query) ||
        order.customer_email.toLowerCase().includes(query) ||
        order.status.toLowerCase().includes(query)
      ));
    }
  }, [searchQuery, orders]);
  
  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      // Try to fetch from Supabase if available
      try {
        // Fetch orders and join with order_items table
        // Note: This query expects product_id to reference the 'products' table, not 'skus'
        const { data, error } = await supabase
          .from('orders')
          .select(`
            id, 
            user_id,
            status, 
            total_amount,
            created_at, 
            updated_at,
            shipping_address,
            customer_name,
            customer_email,
            customer_phone,
            items:order_items(
              id,
              order_id,
              product_id,
              quantity,
              unit_price,
              product_name
            )
          `)
          .order('created_at', { ascending: false });
          
        if (!error && data && data.length > 0) {
          console.log('Fetched orders data:', data);
          setOrders(data);
          setFilteredOrders(data);
          setIsLoading(false);
          return;
        }
      } catch (supabaseError) {
        console.warn('Supabase fetch failed, using mock data instead', supabaseError);
      }
      
      // Fall back to mock data if Supabase fetch fails
      console.log('Using mock order data');
      import('@/data/mockData').then(({ mockOrders }) => {
        console.log('Loaded mock order data:', mockOrders);
        setOrders(mockOrders);
        setFilteredOrders(mockOrders);
        setIsLoading(false);
      }).catch(e => {
        console.error('Failed to load mock data:', e);
        setIsLoading(false);
      });
      return; // Early return to avoid setting isLoading=false twice
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: t.errorFetching,
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
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
      t.orderId, 
      t.customer, 
      t.email, 
      t.phone, 
      t.address, 
      t.date, 
      t.total, 
      t.status
    ].join(',');
    
    const rows = filteredOrders.map(order => [
      order.id,
      order.customer_name,
      order.customer_email,
      order.customer_phone,
      `"${order.shipping_address.replace(/"/g, '""')}"`,
      new Date(order.created_at).toLocaleDateString(),
      order.total_amount.toFixed(2),
      order.status
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
      case 'confirmed': return 'bg-blue-100 text-blue-800';
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
                <TableHead>{t.orderId}</TableHead>
                <TableHead>{t.customer}</TableHead>
                <TableHead>{t.date}</TableHead>
                <TableHead>{t.total}</TableHead>
                <TableHead>{t.status}</TableHead>
                <TableHead>{t.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id.substring(0, 8)}...</TableCell>
                  <TableCell>{order.customer_name}</TableCell>
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
                <h4 className="text-sm font-medium mb-2">{t.customerInfo}</h4>
                <div className="grid grid-cols-2 gap-4 bg-muted p-4 rounded-md">
                  <div>
                    <p className="text-sm font-medium">{t.name}</p>
                    <p className="text-sm">{selectedOrder.customer_name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{t.email}</p>
                    <p className="text-sm">{selectedOrder.customer_email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{t.phone}</p>
                    <p className="text-sm">{selectedOrder.customer_phone}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{t.address}</p>
                    <p className="text-sm">{selectedOrder.shipping_address}</p>
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
                        <TableHead className="w-24">{t.quantity}</TableHead>
                        <TableHead className="w-32">{t.unitPrice}</TableHead>
                        <TableHead className="w-32">{t.subtotal}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrder.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.product_name}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>Rp {item.unit_price.toLocaleString()}</TableCell>
                          <TableCell>Rp {(item.quantity * item.unit_price).toLocaleString()}</TableCell>
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
                      <SelectItem value="confirmed">{t.confirmed}</SelectItem>
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
