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
  districtId: number;
  detailAddress: string;
  companyWebsite: string;
  notes: string;
  postalCode: string;
  billingAddress: billingAddress;
  shippingAddress: shippingAddress;
  primaryContact: primaryContact;
}

export async function createCustomer(payload: CustomerPayload) {
  // Check if bypass mode is enabled
  const bypassEnabled = import.meta.env.VITE_BASKIT_API_BYPASS === 'true';
  
  if (bypassEnabled) {
    return {
      statusCode: 200,
      message: 'Customer created successfully (bypassed)',
      customerId: `BYPASS-CUSTOMER-${Date.now()}`,
      success: true
    };
  }

  return baskitApiRequest("/distributor-hub/customer", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// Example usage:
// await createCustomer({ ... });
