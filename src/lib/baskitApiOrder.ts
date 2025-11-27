// src/lib/baskitApiOrder.ts

export interface OrderProduct {
  productId: string;
  companyId: string;
  inventoryId: string;
  qty: number;
  neededQty: number;
  price: number;
  inventoryPriceTierId?: string;
}

export interface OrderPayload {
  customerId: string;
  companyId: string;
  paymentTypeId: string;
  orderType: string;
  wareHouse: number;
  shippingCost: number;
  tax: number;
  refCode: string;
  paymentNotes: string;
  notes: string;
  deliveryType: string;
  expeditionName: string;
  product: OrderProduct[];
}

export async function createOrder(payload: OrderPayload): Promise<any> {
  const apiKey = process.env.NEXT_PUBLIC_BASKIT_API_KEY || process.env.BASKIT_API_KEY;
  const endpoint = process.env.NEXT_PUBLIC_BASKIT_ORDER_API || "https://api-dev.baskit.app/baskit-core/distributor-hub/order";

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey ?? "",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  return data;
}
