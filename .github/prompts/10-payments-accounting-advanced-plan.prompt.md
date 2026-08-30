# Plan: Learning Bookingapp - Module 10 Payments Accounting Advanced

## Goal
Build `learning-bookingapp/10-payments-accounting-advanced/{backend,frontend}` as an advanced learning module that explains how captured payments become accounting entries. The module should teach ledger posting, journal entries, debit/credit thinking, refunds, reversal entries, reconciliation basics, and audit-friendly payment history.

This module comes after mock payments, Razorpay, invoices, and invoice email/PDF because accounting adds a different kind of complexity.

## Decisions
- Module folder name: `10-payments-accounting-advanced`.
- Assume learners understand invoices and basic payment capture.
- Include simplified accounts, journal entries, payment records, invoice balances, and refund records.
- Teach accounting concepts with small examples before code.
- Include payment posting after capture.
- Include refund/reversal posting in a controlled, beginner-friendly way.
- Include reconciliation as a simple compare-and-mark workflow, not a full bank reconciliation system.
- Backend must use DI and contract-based posting/reconciliation services.
- Frontend must be strongly typed.
- Docs must be especially detailed and example-heavy.

## Teaching Intent
This module teaches the production question: after money is captured, how does the system record it correctly and safely?

After finishing this module, a junior developer should understand:
- why payment status is not the same as accounting posting.
- basic debit and credit examples for invoice payment.
- how journal entries are created from payment events.
- why refunds need reversal entries.
- why reconciliation exists.
- why idempotency and audit trails are critical in money systems.
- how payment/accounting services stay separated through contracts.

## Cross-Cutting Production Practices
- `PaymentPostingService` implements `IPaymentPostingService`.
- `PaymentRefundService` implements `IPaymentRefundService`.
- `PaymentReconciliationService` implements `IPaymentReconciliationService`.
- Services depend on accounting/payment repository interfaces, not concrete classes.
- Posting operations should use database transactions where appropriate.
- Add typed DI `Cradle` and registrations for payment, accounting, refund, and reconciliation services.
- Use typed DTOs for posting payloads, journal entries, refund requests, reconciliation results, and audit history.
- Frontend accounting views, payment details, refund dialogs, and reconciliation actions must be typed.
- Avoid `any`.

## Reference Patterns
- Production payment setup docs: [`BookKeepingApp/backend/docs/PAYMENTS_SETUP.md`](../../../BookKeepingApp/backend/docs/PAYMENTS_SETUP.md).
- Production accounting docs: [`BookKeepingApp/backend/docs/ACCOUNTING_POSTING_ENGINE.md`](../../../BookKeepingApp/backend/docs/ACCOUNTING_POSTING_ENGINE.md).
- Production accounts docs: [`BookKeepingApp/backend/docs/ACCOUNTS_IMPLEMENTATION.md`](../../../BookKeepingApp/backend/docs/ACCOUNTS_IMPLEMENTATION.md).
- Production payment posting service: [`BookKeepingApp/backend/services/payments/paymentPostingService.ts`](../../../BookKeepingApp/backend/services/payments/paymentPostingService.ts).
- Production payment refund service: [`BookKeepingApp/backend/services/payments/paymentRefundService.ts`](../../../BookKeepingApp/backend/services/payments/paymentRefundService.ts).
- Production payment reconciliation service: [`BookKeepingApp/backend/services/payments/paymentReconciliationService.ts`](../../../BookKeepingApp/backend/services/payments/paymentReconciliationService.ts).
- Production accounting service/repository: [`BookKeepingApp/backend/services/accounting`](../../../BookKeepingApp/backend/services/accounting), [`BookKeepingApp/backend/repositories/accounting`](../../../BookKeepingApp/backend/repositories/accounting).
- Production DI: [`BookKeepingApp/backend/di/payments.ts`](../../../BookKeepingApp/backend/di/payments.ts), [`BookKeepingApp/backend/di/accounting.ts`](../../../BookKeepingApp/backend/di/accounting.ts).

## Backend Scope
1. Scaffold Express + Prisma + Zod + TypeScript backend or use an isolated copy of payment/invoice/accounting models.
2. Add simplified models:
   - `Account`
   - `JournalEntry`
   - `JournalEntryLine`
   - `Invoice`
   - `Payment`
   - `Refund`
   - `ReconciliationRecord`
3. Add seed accounts such as Cash/Bank, Accounts Receivable, Sales Revenue, Payment Gateway Clearing, and Refund Expense or equivalent simplified accounts.
4. Add contracts:
   - `IAccountingRepository`
   - `IAccountingService`
   - `IPaymentPostingService`
   - `IPaymentRefundService`
   - `IPaymentReconciliationService`
   - `IPaymentRepository`
5. Implement posting for captured payment:
   - debit Cash/Bank or Gateway Clearing.
   - credit Accounts Receivable.
   - link journal entry to payment.
6. Implement refund flow:
   - create refund record.
   - update payment/refund status.
   - create reversal journal entry.
7. Implement reconciliation flow:
   - list unreconciled captured payments.
   - mark payment as reconciled with reference/date/notes.
8. Add idempotency checks so the same payment cannot be posted twice.
9. Add routes:
   - `POST /api/v1/payments/:paymentId/post`
   - `POST /api/v1/payments/:paymentId/refunds`
   - `GET /api/v1/payments/:paymentId/accounting`
   - `GET /api/v1/reconciliation/payments`
   - `POST /api/v1/reconciliation/payments/:paymentId/mark-reconciled`
10. Register dependencies through typed DI.

## Frontend Scope
1. Add typed models for accounts, journal entries, posting result, refund payload, refund result, reconciliation rows, and payment accounting history.
2. Add typed API services for posting, refund, accounting history, and reconciliation.
3. Add payment detail accounting tab or section.
4. Add journal entry display with debit/credit columns.
5. Add refund dialog with validation.
6. Add reconciliation list with mark-reconciled action.
7. Add clear status badges: unposted, posted, refunded, partially refunded, reconciled.
8. Use typed Redux state/thunks/selectors or a typed query/state pattern consistent with previous modules.

## Docs
Create detailed numbered docs in `10-payments-accounting-advanced/docs/`:

1. `01-overview.md` - why accounting is separate from payment capture.
2. `02-basic-debit-credit.md` - beginner examples with small tables.
3. `03-accounts-and-journal-model.md` - account, journal entry, journal line relationships.
4. `04-post-captured-payment.md` - payment posting flow with debit/credit example.
5. `05-idempotent-posting.md` - why the same payment must not post twice.
6. `06-refunds-and-reversals.md` - refund status, reversal entries, examples.
7. `07-reconciliation-basics.md` - provider/bank match concept and simple workflow.
8. `08-backend-contracts-and-di.md` - posting/refund/reconciliation interfaces and registrations.
9. `09-frontend-accounting-views.md` - journal table, refund dialog, reconciliation list.
10. `10-contract-trace.md` - trace a captured payment into journal entry lines and UI accounting history.
11. `11-how-this-maps-to-production.md` - map learning files to production accounting/payment files.
12. `12-common-mistakes.md` - double posting, wrong account, refund without reversal, reconciliation confusion.
13. `13-exercises.md` - partial refund, gateway fees, reconciliation import, tests.

Docs must include numeric examples. For example: invoice total 1000, payment captured 1000, debit Bank 1000, credit Accounts Receivable 1000. Explain debit/credit using plain business language before showing code.

## Validation
- Run backend build or `tsc --noEmit`.
- Run frontend build.
- Verify captured payment can be posted once.
- Verify duplicate posting is rejected or ignored safely.
- Verify refund creates a reversal entry.
- Verify reconciliation marks a payment reconciled without changing the original journal entry.
- Verify journal entry debit and credit totals balance.
- Verify DI contracts compile.
- Verify no feature-level `any` is introduced.
- Run `git diff --check` for the new module and docs.
