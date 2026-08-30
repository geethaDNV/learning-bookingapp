// Account types
export interface Account {
  id: string;
  code: string;
  name: string;
  accountType: "Asset" | "Liability" | "Equity" | "Revenue" | "Expense";
  normalBalance: "Debit" | "Credit";
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Journal Entry types
export interface JournalEntryLine {
  id: string;
  journalEntryId: string;
  accountId: string;
  debitAmount: number;
  creditAmount: number;
  lineNumber: number;
  description?: string;
  createdAt: Date;
}

export interface JournalEntry {
  id: string;
  referenceType: string;
  referenceId: string;
  description: string;
  entryDate: Date;
  status: "posted" | "voided";
  lines?: JournalEntryLine[];
  createdAt: Date;
  updatedAt: Date;
}

// Payment types
export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  paymentMethod: string;
  paymentGatewayId?: string;
  status: "captured" | "failed" | "refunded" | "partially_refunded";
  capturedAt: Date;
  postedAt?: Date;
  isPosted: boolean;
  idempotencyKey?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Refund types
export interface Refund {
  id: string;
  paymentId: string;
  amount: number;
  reason: string;
  status: "pending" | "processed" | "failed";
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Reconciliation types
export interface ReconciliationRecord {
  id: string;
  paymentId: string;
  status: "unreconciled" | "reconciled";
  reconciliationDate?: Date;
  bankReference?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Invoice types
export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  totalAmount: number;
  paidAmount: number;
  dueDate: Date;
  status: "unpaid" | "partially_paid" | "paid";
  createdAt: Date;
  updatedAt: Date;
}

// DTOs for API
export interface PostingPayload {
  paymentId: string;
  idempotencyKey?: string;
}

export interface PostingResult {
  success: boolean;
  paymentId: string;
  journalEntryId?: string;
  message: string;
}

export interface RefundPayload {
  paymentId: string;
  amount: number;
  reason: string;
}

export interface RefundResult {
  success: boolean;
  refundId?: string;
  journalEntryId?: string;
  message: string;
}

export interface ReconciliationPayload {
  paymentId: string;
  bankReference?: string;
  notes?: string;
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
