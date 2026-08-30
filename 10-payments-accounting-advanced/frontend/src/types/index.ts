// Account Types
export interface Account {
  id: string;
  code: string;
  name: string;
  accountType: "Asset" | "Liability" | "Equity" | "Revenue" | "Expense";
  normalBalance: "Debit" | "Credit";
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// Journal Entry Types
export interface JournalEntryLine {
  id: string;
  journalEntryId: string;
  accountId: string;
  debitAmount: number;
  creditAmount: number;
  lineNumber: number;
  description?: string;
  createdAt: string;
}

export interface JournalEntry {
  id: string;
  referenceType: string;
  referenceId: string;
  description: string;
  entryDate: string;
  status: "posted" | "voided";
  lines: JournalEntryLine[];
  createdAt: string;
  updatedAt: string;
}

// Payment Types
export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  paymentMethod: string;
  paymentGatewayId?: string;
  status: "captured" | "failed" | "refunded" | "partially_refunded";
  capturedAt: string;
  postedAt?: string;
  isPosted: boolean;
  createdAt: string;
  updatedAt: string;
}

// Refund Types
export interface Refund {
  id: string;
  paymentId: string;
  amount: number;
  reason: string;
  status: "pending" | "processed" | "failed";
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Reconciliation Types
export interface ReconciliationRecord {
  id: string;
  paymentId: string;
  status: "unreconciled" | "reconciled";
  reconciliationDate?: string;
  bankReference?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// API DTOs
export interface PostingResult {
  success: boolean;
  paymentId: string;
  journalEntryId?: string;
  message: string;
}

export interface RefundResult {
  success: boolean;
  refundId?: string;
  journalEntryId?: string;
  message: string;
}

export interface ReconciliationResult {
  success: boolean;
  reconciliationId?: string;
  message: string;
}

export interface AccountingHistory {
  paymentId: string;
  amount: number;
  status: string;
  isPosted: boolean;
  journalEntries: JournalEntry[];
  refunds: Refund[];
}

// Response Types
export interface ApiResponse<T> {
  message: string;
  data?: T;
  error?: string;
  pagination?: {
    total: number;
    page: number;
    pageSize: number;
  };
}
