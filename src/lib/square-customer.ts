import squareClient from './square';
import { SquareError } from 'square';

export interface CustomerData {
  id: string;
  emailAddress: string;
  givenName?: string;
  familyName?: string;
  phoneNumber?: string;
  address?: {
    addressLine1?: string;
    addressLine2?: string;
    locality?: string;
    administrativeDistrictLevel1?: string;
    postalCode?: string;
    country?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerRequest {
  emailAddress: string;
  givenName?: string;
  familyName?: string;
  phoneNumber?: string;
  address?: {
    addressLine1?: string;
    addressLine2?: string;
    locality?: string;
    administrativeDistrictLevel1?: string;
    postalCode?: string;
    country?: string;
  };
}

export interface UpdateCustomerRequest {
  id: string;
  emailAddress?: string;
  givenName?: string;
  familyName?: string;
  phoneNumber?: string;
  address?: {
    addressLine1?: string;
    addressLine2?: string;
    locality?: string;
    administrativeDistrictLevel1?: string;
    postalCode?: string;
    country?: string;
  };
}

/**
 * Create a new customer in Square
 * Note: This is a placeholder implementation. Square Customer API methods need to be verified.
 */
export async function createCustomer(customerData: CreateCustomerRequest): Promise<CustomerData> {
  try {
    const resp: any = await (squareClient as any).customers.createCustomer({
      emailAddress: customerData.emailAddress,
      givenName: customerData.givenName,
      familyName: customerData.familyName,
      phoneNumber: customerData.phoneNumber,
      address: customerData.address ? {
        addressLine1: customerData.address.addressLine1,
        addressLine2: customerData.address.addressLine2,
        locality: customerData.address.locality,
        administrativeDistrictLevel1: customerData.address.administrativeDistrictLevel1,
        postalCode: customerData.address.postalCode,
        country: customerData.address.country,
      } : undefined,
    });
    const c = resp?.customer;
    if (!c?.id) throw new Error('Square createCustomer returned no id');
    return {
      id: c.id,
      emailAddress: c.emailAddress,
      givenName: c.givenName,
      familyName: c.familyName,
      phoneNumber: c.phoneNumber,
      address: c.address,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    } as CustomerData;
  } catch (error) {
    console.error('Error creating customer:', error);
    throw new Error('Failed to create customer');
  }
}

/**
 * Get a customer by ID
 * Note: This is a placeholder implementation. Square Customer API methods need to be verified.
 */
export async function getCustomer(customerId: string): Promise<CustomerData | null> {
  try {
    const resp: any = await (squareClient as any).customers.retrieveCustomer({ customerId });
    const c = resp?.customer;
    if (!c?.id) return null;
    return {
      id: c.id,
      emailAddress: c.emailAddress,
      givenName: c.givenName,
      familyName: c.familyName,
      phoneNumber: c.phoneNumber,
      address: c.address,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    } as CustomerData;
  } catch (error) {
    console.error('Error retrieving customer:', error);
    return null;
  }
}

/**
 * Get a customer by email address
 * Note: This is a placeholder implementation. Square Customer API methods need to be verified.
 */
export async function getCustomerByEmail(email: string): Promise<CustomerData | null> {
  try {
    const resp: any = await (squareClient as any).customers.searchCustomers({
      query: { filter: { emailAddress: { exact: email } } }
    });
    const c = resp?.customers?.[0];
    if (!c?.id) return null;
    return {
      id: c.id,
      emailAddress: c.emailAddress,
      givenName: c.givenName,
      familyName: c.familyName,
      phoneNumber: c.phoneNumber,
      address: c.address,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    } as CustomerData;
  } catch (error) {
    console.error('Error searching customer:', error);
    return null;
  }
}

/**
 * Update a customer
 * Note: This is a placeholder implementation. Square Customer API methods need to be verified.
 */
export async function updateCustomer(updateData: UpdateCustomerRequest): Promise<CustomerData> {
  try {
    const resp: any = await (squareClient as any).customers.updateCustomer({
      customerId: updateData.id,
      emailAddress: updateData.emailAddress,
      givenName: updateData.givenName,
      familyName: updateData.familyName,
      phoneNumber: updateData.phoneNumber,
      address: updateData.address ? {
        addressLine1: updateData.address.addressLine1,
        addressLine2: updateData.address.addressLine2,
        locality: updateData.address.locality,
        administrativeDistrictLevel1: updateData.address.administrativeDistrictLevel1,
        postalCode: updateData.address.postalCode,
        country: updateData.address.country,
      } : undefined,
    });
    const c = resp?.customer;
    if (!c?.id) throw new Error('Square updateCustomer returned no id');
    return {
      id: c.id,
      emailAddress: c.emailAddress,
      givenName: c.givenName,
      familyName: c.familyName,
      phoneNumber: c.phoneNumber,
      address: c.address,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    } as CustomerData;
  } catch (error) {
    console.error('Error updating customer:', error);
    throw new Error('Failed to update customer');
  }
}

/**
 * List all customers (with pagination)
 * Note: This is a placeholder implementation. Square Customer API methods need to be verified.
 */
export async function listCustomers(cursor?: string): Promise<{
  customers: CustomerData[];
  cursor?: string;
}> {
  try {
    const resp: any = await (squareClient as any).customers.listCustomers({ cursor });
    const cs = Array.isArray(resp?.customers) ? resp.customers : [];
    return {
      customers: cs.map((c: any) => ({
        id: c.id,
        emailAddress: c.emailAddress,
        givenName: c.givenName,
        familyName: c.familyName,
        phoneNumber: c.phoneNumber,
        address: c.address,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
      cursor: resp?.cursor,
    };
  } catch (error) {
    console.error('Error listing customers:', error);
    throw new Error('Failed to list customers');
  }
}

/**
 * Delete a customer
 * Note: This is a placeholder implementation. Square Customer API methods need to be verified.
 */
export async function deleteCustomer(customerId: string): Promise<void> {
  try {
    await (squareClient as any).customers.deleteCustomer({ customerId });
  } catch (error) {
    console.error('Error deleting customer:', error);
    throw new Error('Failed to delete customer');
  }
}

/**
 * Helper function to validate customer data
 */
export function validateCustomerData(data: CreateCustomerRequest): string[] {
  const errors: string[] = [];
  
  if (!data.emailAddress) {
    errors.push('Email address is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.emailAddress)) {
    errors.push('Invalid email address format');
  }
  
  if (data.givenName && data.givenName.length < 2) {
    errors.push('Given name must be at least 2 characters');
  }
  
  if (data.familyName && data.familyName.length < 2) {
    errors.push('Family name must be at least 2 characters');
  }
  
  return errors;
} 

/**
 * Upsert a customer by email. If a customer exists with the exact email, returns it;
 * otherwise creates a new customer with the provided details. Best-effort updates
 * additional fields when an existing customer is found.
 */
export async function upsertCustomerByEmail(data: CreateCustomerRequest): Promise<CustomerData | null> {
  if (!data.emailAddress) return null;
  try {
    const existing = await getCustomerByEmail(data.emailAddress);
    if (existing?.id) {
      try {
        // Best-effort update to enrich profile; ignore failures
        await updateCustomer({
          id: existing.id,
          emailAddress: data.emailAddress,
          givenName: data.givenName,
          familyName: data.familyName,
          phoneNumber: data.phoneNumber,
          address: data.address,
        });
      } catch {}
      return existing;
    }
    return await createCustomer(data);
  } catch (e) {
    console.warn('Customer upsert failed (continuing without linkage):', e);
    return null;
  }
}