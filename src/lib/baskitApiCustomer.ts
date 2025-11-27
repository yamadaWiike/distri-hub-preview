// src/lib/baskitApiCustomer.ts
import { baskitApiRequest } from "./baskitApi";

export interface PrimaryContact {
  name: string;
  email: string;
  phone: string;
  jobTitle: string;
}

export interface Address {
  address: string;
  provinceId: number;
  regencyId: number;
  districtName: string;
  postalCode: string;
}

export interface CustomerPayload {
  companyName: string;
  phone: string;
  email: string;
  companyWebsite?: string;
  notes?: string;
  detailAddress: string;
  postalCode: string;
  districtName?: string;
  primaryContact: PrimaryContact;
  billingAddress?: Address;
  shippingAddress?: Address;
}

export async function createCustomer(payload: CustomerPayload) {
  return baskitApiRequest(
    "baskit-core/distributor-hub/customer",
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}

// Example usage:
// await createCustomer({ ... });
