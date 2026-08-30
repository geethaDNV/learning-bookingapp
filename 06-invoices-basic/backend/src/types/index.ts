import { Invoice, InvoiceLine, Customer, Item } from "@prisma/client";

/**
 * DTO Response Types - what the API returns
 */
export interface InvoiceDTO {
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
  lines: InvoiceLineDTO[];
}

export interface InvoiceLineDTO {
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

export interface CustomerOptionDTO {
  id: number;
  name: string;
  email: string;
  phone: string | null;
}

export interface ItemOptionDTO {
  id: number;
  name: string;
  description: string | null;
  unitPrice: string;
  taxRate: string;
}

export interface InvoiceListItemDTO {
  id: number;
  publicId: string;
  invoiceNumber: string;
  customerName: string;
  status: "DRAFT" | "SENT" | "PAID" | "CANCELLED";
  total: string;
  createdAt: string;
}

/**
 * Form Input Types - what the frontend sends
 */
export interface CreateInvoicePayload {
  customerId: number;
  dueDate?: string | null;
  notes?: string;
  lines: CreateInvoiceLinePayload[];
}

export interface CreateInvoiceLinePayload {
  itemId: number;
  quantity: number | string;
  rate: number | string;
}

export interface UpdateInvoicePayload {
  customerId?: number;
  dueDate?: string | null;
  notes?: string;
  lines?: UpdateInvoiceLinePayload[];
}

export interface UpdateInvoiceLinePayload {
  id?: number;
  itemId: number;
  quantity: number | string;
  rate: number | string;
}

export interface UpdateInvoiceStatusPayload {
  status: "DRAFT" | "SENT" | "PAID" | "CANCELLED";
}

/**
 * Calculation Results
 */
export interface LineCalculation {
  quantity: number;
  rate: number;
  taxRate: number;
  subtotal: number;
  tax: number;
  total: number;
}

export interface InvoiceTotals {
  subtotal: number;
  totalTax: number;
  total: number;
}
