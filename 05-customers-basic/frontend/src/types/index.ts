// Frontend TypeScript Models & Types

export interface Customer {
  id: number;
  publicId: string;
  customerType: 'business' | 'individual';
  displayName: string;
  email: string | null;
  phone: string | null;
  gstin: string | null;
  pan: string | null;
  billingAddress: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
}

export interface CreateCustomerPayload {
  customerType: 'business' | 'individual';
  displayName: string;
  email?: string;
  phone?: string;
  gstin?: string;
  pan?: string;
  billingAddress?: string;
}

export interface UpdateCustomerPayload {
  customerType?: 'business' | 'individual';
  displayName?: string;
  email?: string;
  phone?: string;
  gstin?: string;
  pan?: string;
  billingAddress?: string;
  isActive?: boolean;
}

export interface CustomerListQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  isActive?: boolean;
  sortBy?: 'displayName' | 'createdAt' | 'email' | 'phone';
  sortOrder?: 'asc' | 'desc';
}

export interface CustomerListResponse {
  rows: Customer[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CustomerAutocompleteOption {
  id: number;
  publicId: string;
  displayName: string;
  email: string | null;
}

export interface CustomerAutocompleteQuery {
  search: string;
  page?: number;
  limit?: number;
  isActive?: boolean;
}

export interface CustomerGstinPrefill {
  displayName: string;
  gstin: string;
  pan: string;
  billingAddress: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T | null;
  meta?: {
    total?: number;
    page?: number;
    pageSize?: number;
  };
}
