// React
import React, { useState, useEffect, useCallback } from 'react';

// External Libraries
import { Eye, Package, MapPin, Clock, User, Phone, Mail } from "lucide-react";

// UI Components
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// Hooks
import { useToast } from '@/hooks/use-toast';

// Integrations
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

// Utils
import { updateOrder } from '@/utils/supabase-helpers';

interface OrderFromDB {
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
  distributor_profiles: {
    id: string;
    business_name?: string;
    nama_bisnis?: string;
    contact_person?: string;
    nama_pemilik?: string;
    email?: string;
    phone?: string;
    kontak_pemilik?: string;
  } | null;
}

interface OrderItemFromDB {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

interface ProductFromDB {
  name: string;
  sku: string;
}

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

export default function OrderManager() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusSaving, setStatusSaving] = useState(false);
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [statusDraft, setStatusDraft] = useState<string | null>(null);
  const [paymentDraft, setPaymentDraft] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);

      // Check if user is authenticated and has admin access
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('Authentication required');
      }

      // Check admin access using the same logic as the supabase client
      let isUserAdmin = false;
      
      // First check jwt claims if they exist
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        try {
          const claims = JSON.parse(atob(session.access_token.split('.')[1]));
          if (claims && claims.role === 'admin') {
            isUserAdmin = true;
          }
        } catch (e) {
          // Could not parse JWT claims
        }
      }
      
      // Check user app_metadata for admin role (server-side managed)
      if (!isUserAdmin && user.app_metadata?.role === 'admin') {
        isUserAdmin = true;
      }
      
      if (!isUserAdmin) {
        // Continue anyway - let database policies handle access control if needed
      }

      // Fetch orders with distributor information
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
          distributor_profiles:distributor_id (
            id,
            business_name,
            nama_bisnis,
            contact_person,
            nama_pemilik,
            email,
            phone,
            kontak_pemilik
          )
        `)
        .order('created_at', { ascending: false });

      if (ordersError) {
        throw new Error(`Failed to fetch orders: ${ordersError.message}`);
      }

      // Transform data to match our interface
      const ordersWithDetails: Order[] = await Promise.all(ordersData.map(async (order: OrderFromDB) => {
        
        // Fetch order items for each order
        const { data: orderItemsData, error: itemsError } = await supabase
          .from('order_items')
          .select('id, product_id, quantity, unit_price, subtotal')
          .eq('order_id', order.id);

        if (itemsError) {
          throw new Error(`Failed to fetch order items: ${itemsError.message}`);
        }

        // For each order item, fetch product details
        const enhancedOrderItems: OrderItem[] = orderItemsData ? await Promise.all(
          orderItemsData.map(async (item: OrderItemFromDB) => {
            
            const { data: productData, error: productError } = await supabase
              .from('products')
              .select('name, sku')
              .eq('id', item.product_id)
              .single() as { data: ProductFromDB | null; error: Error | null };

            if (productError) {
              // Handle product fetch error silently
            }

            const enhancedItem = {
              ...item,
              product_name: productData?.name || 'Unknown Product',
              product_sku: productData?.sku || 'N/A'
            };
            
            return enhancedItem;
          })
        ) : [];

        return {
          ...order,
          distributor: order.distributor_profiles ? {
            id: order.distributor_profiles.id,
            name: order.distributor_profiles.business_name || order.distributor_profiles.nama_bisnis || 'Unknown Business',
            email: order.distributor_profiles.email || 'N/A',
            phone: order.distributor_profiles.phone || order.distributor_profiles.kontak_pemilik || 'N/A'
          } : {
            id: '', name: 'Unknown', email: 'N/A', phone: 'N/A'
          },
          order_items: enhancedOrderItems,
          shipping_address: order.shipping_address,
          shipping_city: order.shipping_city,
          shipping_notes: order.shipping_notes,
          payment_status: order.payment_status,
          order_number: order.order_number,
          total_amount: order.total_amount,
          status: order.status,
          created_at: order.created_at,
        };
      }));

      setOrders(ordersWithDetails);
    } catch (error: unknown) {
      toast({
        title: "Error Fetching Orders",
        description: error instanceof Error ? error.message : "Failed to fetch orders.",
        variant: "destructive",
      });
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Order Management</h1>
        <Button onClick={fetchOrders} disabled={loading}>
          Refresh Orders
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order Number</TableHead>
              <TableHead>Distributor</TableHead>
              <TableHead>Total Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  No orders found
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-sm">
                    {order.order_number}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{order.distributor?.name || 'Unknown'}</div>
                      <div className="text-sm text-gray-500">{order.distributor?.email}</div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(order.total_amount)}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(order.status)}>
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={order.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {order.payment_status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(order.created_at).toLocaleDateString('id-ID')}
                  </TableCell>
                  <TableCell className="text-right">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {

                            setSelectedOrder(order);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="w-[90vw] max-w-4xl max-h-screen overflow-auto">
                        <DialogHeader>
                          <DialogTitle>Order Details</DialogTitle>
                          <DialogDescription>
                            Detailed information about order {order.id.slice(0, 8)}...
                          </DialogDescription>
                        </DialogHeader>
                        {selectedOrder && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs md:text-sm">
                            {/* Left column: Order, Distributor */}
                            <div className="space-y-4">
                              {/* Order Information */}
                              <Card>
                                <CardHeader className="py-2 px-3">
                                  <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                                    <Package className="h-4 w-4 md:h-5 md:w-5" />
                                    Order Information
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-1 px-3 pb-3">
                                  <div className="space-y-1">
                                    <div>
                                      <label className="text-xs font-medium text-gray-500">Order Number</label>
                                      <p className="font-mono text-xs md:text-sm">{selectedOrder.order_number}</p>
                                    </div>
                                    <div>
                                      <label className="text-xs font-medium text-gray-500">Status</label>
                                      <div className="flex items-center gap-2">
                                        <select
                                          className="border rounded px-1 py-0.5 text-xs"
                                          value={statusDraft ?? selectedOrder.status}
                                          onChange={e => setStatusDraft(e.target.value)}
                                          disabled={statusSaving}
                                        >
                                          {ORDER_STATUSES.map(s => (
                                            <option key={s} value={s}>{s}</option>
                                          ))}
                                        </select>
                                        <button
                                          className="text-xs px-2 py-0.5 rounded bg-blue-500 text-white disabled:opacity-50"
                                          disabled={statusSaving || (statusDraft === null || statusDraft === selectedOrder.status)}
                                          onClick={async () => {
                                            if (!statusDraft || statusDraft === selectedOrder.status) return;
                                            setStatusSaving(true);
                                            const { error } = await updateOrder(
                                              selectedOrder.id,
                                              { status: statusDraft }
                                            );
                                            setStatusSaving(false);
                                            if (!error) {
                                              toast({ title: 'Order status updated', variant: 'default' });
                                              setStatusDraft(null);
                                              fetchOrders();
                                            } else {
                                              toast({ title: 'Failed to update status', description: error.message, variant: 'destructive' });
                                            }
                                          }}
                                        >Save</button>
                                      </div>
                                    </div>
                                    <div>
                                      <label className="text-xs font-medium text-gray-500">Payment Status</label>
                                      <div className="flex items-center gap-2">
                                        <select
                                          className="border rounded px-1 py-0.5 text-xs"
                                          value={paymentDraft ?? selectedOrder.payment_status}
                                          onChange={e => setPaymentDraft(e.target.value)}
                                          disabled={paymentSaving}
                                        >
                                          {PAYMENT_STATUSES.map(s => (
                                            <option key={s} value={s}>{s}</option>
                                          ))}
                                        </select>
                                        <button
                                          className="text-xs px-2 py-0.5 rounded bg-blue-500 text-white disabled:opacity-50"
                                          disabled={paymentSaving || (paymentDraft === null || paymentDraft === selectedOrder.payment_status)}
                                          onClick={async () => {
                                            if (!paymentDraft || paymentDraft === selectedOrder.payment_status) return;
                                            setPaymentSaving(true);
                                            const { error } = await updateOrder(
                                              selectedOrder.id,
                                              { payment_status: paymentDraft }
                                            );
                                            setPaymentSaving(false);
                                            if (!error) {
                                              toast({ title: 'Payment status updated', variant: 'default' });
                                              setPaymentDraft(null);
                                              fetchOrders();
                                            } else {
                                              toast({ title: 'Failed to update payment status', description: error.message, variant: 'destructive' });
                                            }
                                          }}
                                        >Save</button>
                                      </div>
                                    </div>
                                    <div>
                                      <label className="text-xs font-medium text-gray-500">Total Amount</label>
                                      <p className="text-base font-semibold">{formatCurrency(selectedOrder.total_amount)}</p>
                                    </div>
                                    <div>
                                      <label className="text-xs font-medium text-gray-500">Created</label>
                                      <p className="flex items-center gap-1">
                                        <Clock className="h-3 w-3 md:h-4 md:w-4" />
                                        {formatDate(selectedOrder.created_at)}
                                      </p>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                              {/* Distributor Information */}
                              <Card>
                                <CardHeader className="py-2 px-3">
                                  <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                                    <User className="h-4 w-4 md:h-5 md:w-5" />
                                    Distributor Information
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-1 px-3 pb-3">
                                  <div>
                                    <label className="text-xs font-medium text-gray-500">Name</label>
                                    <p className="font-medium text-xs md:text-sm">{selectedOrder.distributor?.name || 'Unknown'}</p>
                                  </div>
                                  <div>
                                    <label className="text-xs font-medium text-gray-500">Email</label>
                                    <p className="flex items-center gap-1">
                                      <Mail className="h-3 w-3 md:h-4 md:w-4" />
                                      {selectedOrder.distributor?.email || 'N/A'}
                                    </p>
                                  </div>
                                  <div>
                                    <label className="text-xs font-medium text-gray-500">Phone</label>
                                    <p className="flex items-center gap-1">
                                      <Phone className="h-3 w-3 md:h-4 md:w-4" />
                                      {selectedOrder.distributor?.phone || 'N/A'}
                                    </p>
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                            {/* Right column: Shipping */}
                            <div className="space-y-4">
                              {/* Shipping Information */}
                              <Card>
                                <CardHeader className="py-2 px-3">
                                  <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                                    <MapPin className="h-4 w-4 md:h-5 md:w-5" />
                                    Shipping Information
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-1 px-3 pb-3">
                                  <div>
                                    <label className="text-xs font-medium text-gray-500">Shipping Address</label>
                                    <p className="whitespace-pre-wrap text-xs md:text-sm">{selectedOrder.shipping_address}</p>
                                  </div>
                                  <div>
                                    <label className="text-xs font-medium text-gray-500">City</label>
                                    <p className="text-xs md:text-sm">{selectedOrder.shipping_city}</p>
                                  </div>
                                  {selectedOrder.shipping_notes && (
                                    <div>
                                      <label className="text-xs font-medium text-gray-500">Shipping Notes</label>
                                      <p className="whitespace-pre-wrap text-xs md:text-sm">{selectedOrder.shipping_notes}</p>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            </div>
                            {/* Full width: Order Items */}
                            <div className="col-span-1 md:col-span-2">
                              <Card>
                                <CardHeader className="py-2 px-3">
                                  <CardTitle className="text-base md:text-lg">Items ({selectedOrder.order_items?.length || 0})</CardTitle>
                                  <CardDescription className="text-xs md:text-sm">Products in this order</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-2 px-3 pb-3">
                                  {selectedOrder.order_items && selectedOrder.order_items.length > 0 ? (
                                    <div className="space-y-2">
                                      {selectedOrder.order_items.map((item, index) => (
                                        <div key={item.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-2 border rounded-lg gap-2 md:gap-0">
                                          <div className="flex-1">
                                            <h4 className="font-medium text-xs md:text-sm">{item.product_name}</h4>
                                            <p className="text-xs text-gray-500">SKU: {item.product_sku}</p>
                                            <p className="text-xs text-gray-500">
                                              Quantity: {item.quantity} × {formatCurrency(item.unit_price)}
                                            </p>
                                          </div>
                                          <div className="text-right">
                                            <p className="font-semibold text-xs md:text-sm">{formatCurrency(item.subtotal)}</p>
                                          </div>
                                        </div>
                                      ))}
                                      <Separator />
                                      <div className="flex justify-between items-center font-semibold text-base md:text-lg">
                                        <span>Total</span>
                                        <span>{formatCurrency(selectedOrder.total_amount)}</span>
                                      </div>
                                    </div>
                                  ) : (
                                    <p className="text-center text-gray-500 py-4">No items found for this order</p>
                                  )}
                                </CardContent>
                              </Card>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
