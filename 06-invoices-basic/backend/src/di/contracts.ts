import { Decimal } from "@prisma/client/runtime/library";
import {
  LineCalculation,
  InvoiceTotals,
  InvoiceLineDTO,
} from "../types/index.js";

/**
 * Contract for calculating invoice line totals
 */
export interface IInvoiceCalculator {
  /**
   * Calculate line-level amounts: subtotal, tax, and total
   */
  calculateLine(
    quantity: number,
    rate: number,
    taxRate: number
  ): LineCalculation;

  /**
   * Calculate invoice-level totals from line items
   */
  calculateTotals(lines: LineCalculation[]): InvoiceTotals;

  /**
   * Convert line items to Decimal for database storage
   */
  toDecimal(value: number): Decimal;
}

/**
 * Contract for managing invoice numbers
 */
export interface IInvoiceNumberService {
  /**
   * Generate the next invoice number (e.g., "INV-2025-001")
   */
  generateInvoiceNumber(): Promise<string>;
}

/**
 * Contract for Customer lookup
 */
export interface ICustomerLookupRepository {
  /**
   * Find customer by ID, throw if not found
   */
  findById(id: number): Promise<{ id: number; name: string; email: string }>;

  /**
   * Search customers by name or email prefix
   */
  search(query: string): Promise<
    Array<{
      id: number;
      name: string;
      email: string;
      phone: string | null;
    }>
  >;
}

/**
 * Contract for Item lookup
 */
export interface IItemLookupRepository {
  /**
   * Find item by ID, throw if not found
   */
  findById(id: number): Promise<{
    id: number;
    name: string;
    description: string | null;
    unitPrice: Decimal;
    taxRate: Decimal;
  }>;

  /**
   * Search items by name
   */
  search(query: string): Promise<
    Array<{
      id: number;
      name: string;
      description: string | null;
      unitPrice: Decimal;
      taxRate: Decimal;
    }>
  >;
}

/**
 * Contract for Invoice persistence
 */
export interface IInvoiceRepository {
  /**
   * Create a new invoice with lines
   */
  create(data: {
    invoiceNumber: string;
    customerId: number;
    dueDate: Date | null;
    notes: string | null;
    subtotal: Decimal;
    totalTax: Decimal;
    total: Decimal;
    lines: Array<{
      itemId: number;
      quantity: Decimal;
      rate: Decimal;
      taxRate: Decimal;
      lineSubtotal: Decimal;
      lineTax: Decimal;
      lineTotal: Decimal;
    }>;
  }): Promise<{
    id: number;
    publicId: string;
    invoiceNumber: string;
  }>;

  /**
   * Retrieve invoice by public ID
   */
  findByPublicId(publicId: string): Promise<any | null>;

  /**
   * Retrieve invoice by ID (internal)
   */
  findById(id: number): Promise<any | null>;

  /**
   * Update invoice header (for draft invoices)
   */
  update(
    id: number,
    data: {
      customerId?: number;
      dueDate?: Date | null;
      notes?: string;
      subtotal: Decimal;
      totalTax: Decimal;
      total: Decimal;
    }
  ): Promise<void>;

  /**
   * Replace invoice lines
   */
  replaceLines(
    invoiceId: number,
    lines: Array<{
      itemId: number;
      quantity: Decimal;
      rate: Decimal;
      taxRate: Decimal;
      lineSubtotal: Decimal;
      lineTax: Decimal;
      lineTotal: Decimal;
    }>
  ): Promise<void>;

  /**
   * Update invoice status
   */
  updateStatus(id: number, status: string): Promise<void>;

  /**
   * List invoices with optional filters
   */
  list(options: {
    customerId?: number;
    status?: string;
    skip: number;
    take: number;
  }): Promise<Array<any>>;

  /**
   * Count invoices with optional filters
   */
  count(options: {
    customerId?: number;
    status?: string;
  }): Promise<number>;
}

/**
 * Contract for Invoice business logic
 */
export interface IInvoiceService {
  /**
   * Create a new invoice
   */
  createInvoice(data: {
    customerId: number;
    dueDate: string | null;
    notes: string | null;
    lines: Array<{
      itemId: number;
      quantity: number;
      rate: number;
    }>;
  }): Promise<{ id: number; publicId: string; invoiceNumber: string }>;

  /**
   * Get invoice details
   */
  getInvoice(publicId: string): Promise<any>;

  /**
   * Update invoice (draft only)
   */
  updateInvoice(
    publicId: string,
    data: {
      customerId?: number;
      dueDate?: string | null;
      notes?: string;
      lines?: Array<{
        id?: number;
        itemId: number;
        quantity: number;
        rate: number;
      }>;
    }
  ): Promise<void>;

  /**
   * Update invoice status
   */
  updateInvoiceStatus(
    publicId: string,
    status: "DRAFT" | "SENT" | "PAID" | "CANCELLED"
  ): Promise<void>;

  /**
   * List invoices
   */
  listInvoices(options: {
    customerId?: number;
    status?: string;
    skip: number;
    take: number;
  }): Promise<{ items: any[]; total: number }>;
}
