// src/lib/baskitApiOrder.ts
import { baskitApiRequest } from "./baskitApi";

export interface orderProduct {
  inventoryId: string;
  productId: string;
  companyId: string;
  qty: number;
  price: number;
  neededQty: number;
  discount?: number;
  discountAmount?: number;
  tax?: number;
  notes?: string;
  inventoryPriceTierId?: string;
  unitFactor?: number;
  memberLevel?: string;
  memberDiscountAmount?: number;
  orderAccount?: string;
}

export interface orderPayload {
  customerId: string;
  paymentTypeId?: string;
  subTotal: number;
  shippingCost?: number;
  tax: number;
  total: number;
  orderType: string;
  companyId: string;
  wareHouse: number;
  notes?: string;
  description?: string;
  refCode: string;
  salesmanId?: string;
  deliveryType?: string;
  paymentNotes?: string;
  expeditionName?: string;
  salesOrderId?: string;
  linkedOrderId?: string;
  thirdPartyDelivery?: string;
  deliveryNotes?: string;
  supplierNotes?: string;
  products: orderProduct[];
}

export interface OrderResponse {
  statusCode?: number;
  orderCode?: string;
  message?: string;
}

export async function createOrder(
  payload: orderPayload
): Promise<OrderResponse> {
  // Check if bypass mode is enabled
  const bypassEnabled = import.meta.env.VITE_BASKIT_API_BYPASS === 'true';
  
  if (bypassEnabled) {
    console.log('[BASKIT API BYPASS] Order creation bypassed');
    console.log('[BASKIT API BYPASS] Order details:', {
      customerId: payload.customerId,
      total: payload.total,
      productsCount: payload.products.length
    });
    return {
      statusCode: 200,
      orderCode: `BYPASS-ORDER-${Date.now()}`,
      message: 'Order created successfully (bypassed)'
    };
  }

  return baskitApiRequest("/distributor-hub/order", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
