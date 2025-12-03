// src/lib/baskitApiInventory.ts
import { baskitApiRequest } from "./baskitApi";

export interface InventoryPayload {
  $page?: number;
  $limit?: number;
  $order?: string;
  $sort?: string;
  search?: string;
  searchKey?: string[];
  inventoryId?: string[];
  unitId?: string[];
  variantId?: string[];
  active?: boolean;
}

export interface InventoryData {
  id: string,
  inventoryId: string,
  variantId: string,
  unitId: string,
  companyId: string,
  companyName: string,
  unitName: string,
  active: boolean,
  basePrice: number,
  qtyOnHand: number,
  sku: string,
  inventoryName: string,
  variantName: string
}

export interface InventoryResponse {
  statusCode: number,
  totalData: number,
  totalPage: number,
  data: InventoryData[]
}

export async function getInventory(payload: InventoryPayload): Promise<InventoryResponse> {
  // Check if bypass mode is enabled
  const bypassEnabled = import.meta.env.VITE_BASKIT_API_BYPASS === 'true';
  
  if (bypassEnabled) {
    console.log('[BASKIT API BYPASS] Inventory fetch bypassed');
    console.log('[BASKIT API BYPASS] Request params:', payload);
    return {
      statusCode: 200,
      totalData: 0,
      totalPage: 0,
      data: []
    };
  }

  // Build query string from payload
  const params = new URLSearchParams();
  
  if (payload.$page !== undefined) params.append('$page', payload.$page.toString());
  if (payload.$limit !== undefined) params.append('$limit', payload.$limit.toString());
  if (payload.$order) params.append('$order', payload.$order);
  if (payload.$sort) params.append('$sort', payload.$sort);
  if (payload.search) params.append('search', payload.search);
  if (payload.searchKey) payload.searchKey.forEach(key => params.append('searchKey', key));
  if (payload.inventoryId) payload.inventoryId.forEach(id => params.append('inventoryId', id));
  if (payload.unitId) payload.unitId.forEach(id => params.append('unitId', id));
  if (payload.variantId) payload.variantId.forEach(id => params.append('variantId', id));
  if (payload.active !== undefined) params.append('active', payload.active.toString());

  const queryString = params.toString();
  const endpoint = `/distributor-hub/inventory-stock${queryString ? `?${queryString}` : ''}`;

  return baskitApiRequest(endpoint, {
    method: "GET",
  });
}

// Example usage:
// await getInventory({ $page: 1, $limit: 10, active: true });
