import {
  Payment,
  JournalEntry,
  PostingPayload,
  PostingResult,
  RefundPayload,
  RefundResult,
  ReconciliationPayload,
  ReconciliationResult,
  Refund,
  ReconciliationRecord,
  AccountingHistory,
} from "../index.js";

export interface IPaymentRepository {
  findById(id: string): Promise<Payment | null>;
  findByIdempotencyKey(key: string): Promise<Payment | null>;
  create(data: Omit<Payment, "id" | "createdAt" | "updatedAt">): Promise<Payment>;
  update(id: string, data: Partial<Payment>): Promise<Payment>;
  findByInvoiceId(invoiceId: string): Promise<Payment[]>;
  findUnposted(): Promise<Payment[]>;
}

export interface IJournalEntryRepository {
  findById(id: string): Promise<JournalEntry | null>;
  create(data: Omit<JournalEntry, "id" | "createdAt" | "updatedAt">): Promise<JournalEntry>;
  findByReferenceId(referenceId: string): Promise<JournalEntry | null>;
}

export interface IPaymentPostingService {
  postPayment(payload: PostingPayload): Promise<PostingResult>;
  isPaymentPosted(paymentId: string): Promise<boolean>;
}

export interface IPaymentRefundService {
  refundPayment(payload: RefundPayload): Promise<RefundResult>;
  getRefunds(paymentId: string): Promise<Refund[]>;
}

export interface IPaymentReconciliationService {
  markReconciled(
    payload: ReconciliationPayload
  ): Promise<ReconciliationResult>;
  getUnreconciledPayments(): Promise<Payment[]>;
  getReconciliationStatus(paymentId: string): Promise<ReconciliationRecord | null>;
}

export interface IPaymentAccountingService {
  getPaymentAccountingHistory(paymentId: string): Promise<AccountingHistory>;
}
