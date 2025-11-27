// src/lib/baskitApiCustomer.ts
import { baskitApiRequest } from "./baskitApi";

export interface primaryContact {
  name: string;
  email: string;
  phone: string;
  jobTitle: string;
  leadSource: string;
}

export interface billingAddress {
  address: string;
  district: string;
  city: string;
  province: string;
  zipcode: string;
}

export interface shippingAddress {
  address: string;
  district: string;
  city: string;
  province: string;
  zipcode: string;
}

export interface CustomerPayload {
  companyName: string;
  phone: string;
  email: string;
  companyTypeId: string;
  assignedUsersId: string[];
  parentCompanyId: string;
  childType: string;
  districtId: 0;
  detailAddress: string;
  companyWebsite: string;
  notes: string;
  postalCode: string;
  billingAddress: billingAddress;
  shippingAddress: shippingAddress;
  primaryContact: primaryContact;
}

export async function createCustomer(payload: CustomerPayload) {
  return baskitApiRequest("/distributor-hub/customer", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// Example usage:
// await createCustomer({ ... });
