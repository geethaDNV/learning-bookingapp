/**
 * Frontend Type Definitions
 * Matches backend DTOs but defined for frontend use
 */

// API Response Wrappers
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  pagination?: {
    skip: number;
    take: number;
    total: number;
  };
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: unknown;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// Customer & Item Options (for autocomplete)
export interface CustomerOption {
  id: number;
  name: string;
  email: string;
  phone: string | null;
}

export interface ItemOption {
  id: number;
  name: string;
  description: string | null;
  unitPrice: string;
  taxRate: string;
}

// Invoice-related types
export interface InvoiceLine {
  id: number;
  itemId: number;
  itemName: string;
  quantity: string;
  rate: string;
  taxRate: string;
  lineSubtotal: string;
  lineTax: string;
  lineTotal: string;
}

export interface Invoice {
  id: number;
  publicId: string;
  invoiceNumber: string;
  customerId: number;
  customerName: string;
  status: "DRAFT" | "SENT" | "PAID" | "CANCELLED";
  subtotal: string;
  totalTax: string;
  total: string;
  notes: string | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  lines: InvoiceLine[];
}

export interface InvoiceListItem {
  id: number;
  publicId: string;
  invoiceNumber: string;
  customerName: string;
  status: "DRAFT" | "SENT" | "PAID" | "CANCELLED";
  total: string;
  createdAt: string;
}

// Form types (for React Hook Form)
export interface InvoiceLineFormValue {
  id?: number;
  itemId: number;
  quantity: number | string;
  rate: number | string;
}

export interface InvoiceFormValue {
  customerId: number;
  dueDate: string;
  notes: string;
  lines: InvoiceLineFormValue[];
}

// Totals display
export interface InvoiceTotalsDisplay {
  subtotal: number;
  totalTax: number;
  total: number;
}
