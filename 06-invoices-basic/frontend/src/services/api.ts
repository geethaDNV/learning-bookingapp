import type {
  ApiResponse,
  Invoice,
  InvoiceListItem,
  InvoiceLineFormValue,
  CustomerOption,
  ItemOption,
} from "../types/index.js";

const API_BASE = "/api/v1";

/**
 * InvoiceService: API client for invoice operations
 */
export class InvoiceApiService {
  static async createInvoice(data: {
    customerId: number;
    dueDate?: string;
    notes?: string;
    lines: InvoiceLineFormValue[];
  }): Promise<Invoice> {
    const response = await fetch(`${API_BASE}/invoices`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId: data.customerId,
        dueDate: data.dueDate || null,
        notes: data.notes || null,
        lines: data.lines.map((line) => ({
          itemId: line.itemId,
          quantity: Number(line.quantity),
          rate: Number(line.rate),
        })),
      }),
    });

    const result = (await response.json()) as ApiResponse<Invoice>;

    if (!result.success) {
      throw new Error((result as any).message || "Failed to create invoice");
    }

    return result.data;
  }

  static async getInvoice(publicId: string): Promise<Invoice> {
    const response = await fetch(`${API_BASE}/invoices/${publicId}`);

    const result = (await response.json()) as ApiResponse<Invoice>;

    if (!result.success) {
      throw new Error((result as any).message || "Failed to fetch invoice");
    }

    return result.data;
  }

  static async listInvoices(options?: {
    customerId?: number;
    status?: string;
    skip?: number;
    take?: number;
  }): Promise<{
    items: InvoiceListItem[];
    pagination: { skip: number; take: number; total: number };
  }> {
    const params = new URLSearchParams();
    if (options?.customerId) params.append("customerId", String(options.customerId));
    if (options?.status) params.append("status", options.status);
    if (options?.skip) params.append("skip", String(options.skip));
    if (options?.take) params.append("take", String(options.take));

    const response = await fetch(
      `${API_BASE}/invoices?${params.toString()}`
    );

    const result = (await response.json()) as ApiResponse<InvoiceListItem[]>;

    if (!result.success) {
      throw new Error((result as any).message || "Failed to fetch invoices");
    }

    return {
      items: result.data,
      pagination: result.pagination || { skip: 0, take: 10, total: 0 },
    };
  }

  static async updateInvoice(
    publicId: string,
    data: {
      customerId?: number;
      dueDate?: string;
      notes?: string;
      lines?: InvoiceLineFormValue[];
    }
  ): Promise<Invoice> {
    const response = await fetch(`${API_BASE}/invoices/${publicId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId: data.customerId,
        dueDate: data.dueDate || null,
        notes: data.notes || null,
        lines: data.lines?.map((line) => ({
          id: line.id,
          itemId: line.itemId,
          quantity: Number(line.quantity),
          rate: Number(line.rate),
        })),
      }),
    });

    const result = (await response.json()) as ApiResponse<Invoice>;

    if (!result.success) {
      throw new Error((result as any).message || "Failed to update invoice");
    }

    return result.data;
  }

  static async updateInvoiceStatus(
    publicId: string,
    status: "DRAFT" | "SENT" | "PAID" | "CANCELLED"
  ): Promise<Invoice> {
    const response = await fetch(
      `${API_BASE}/invoices/${publicId}/status`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      }
    );

    const result = (await response.json()) as ApiResponse<Invoice>;

    if (!result.success) {
      throw new Error((result as any).message || "Failed to update status");
    }

    return result.data;
  }
}

/**
 * SearchService: API client for customer and item search
 */
export class SearchApiService {
  static async searchCustomers(query: string): Promise<CustomerOption[]> {
    const response = await fetch(
      `${API_BASE}/customers/search?q=${encodeURIComponent(query)}`
    );

    const result = (await response.json()) as ApiResponse<CustomerOption[]>;

    if (!result.success) {
      throw new Error(
        (result as any).message || "Failed to search customers"
      );
    }

    return result.data;
  }

  static async searchItems(query: string): Promise<ItemOption[]> {
    const response = await fetch(
      `${API_BASE}/items/search?q=${encodeURIComponent(query)}`
    );

    const result = (await response.json()) as ApiResponse<ItemOption[]>;

    if (!result.success) {
      throw new Error((result as any).message || "Failed to search items");
    }

    return result.data;
  }
}
