// src/lib/baskitApiCustomer.ts
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

export async function getInventory(payload: InventoryPayload) {
  return baskitApiRequest("/distributor-hub/inventory-stock", {
    method: "GET",
    body: JSON.stringify(payload),
  });
}

// Example usage:
// await createCustomer({ ... });
