# Plan: Learning Bookingapp - Module 07 Payments Basic

## Goal
Build `learning-bookingapp/07-payments-basic/{backend,frontend}` as a fully isolated, runnable payment learning module using a mock payment gateway. The module should teach payment intent/link creation, provider abstraction, webhook-like callback simulation, idempotency basics, payment status changes, and applying a payment to an invoice balance.

This module must teach the payment business flow before real Razorpay integration is introduced.

## Decisions
- Module folder name: `07-payments-basic`.
- Use a mock payment gateway only.
- Include simplified `Customer`, `Item`, `Invoice`, `InvoiceLine`, and `Payment` models so the module is runnable in isolation.
- Use invoices from the previous module as the conceptual prerequisite.
- Include full and partial payment examples if practical; otherwise full payment first and partial payment as an exercise.
- Include payment statuses such as `created`, `pending`, `captured`, `failed`, and `cancelled`.
- Include invoice balance/status update after captured payment.
- Backend must use DI and contract-based gateway/provider interfaces.
- Frontend must be strongly typed.
- Docs must explain payment flow slowly, with sequence examples.

## Teaching Intent
Payments are difficult because the application does not directly control the final outcome. The app creates a payment request, a provider reports success/failure later, and the system must update local payment and invoice state correctly.

After finishing this module, a junior developer should understand:
- why payments need invoices.
- payment status vs invoice status.
- provider abstraction.
- webhook/callback mental model.
- idempotency basics.
- how captured payment updates invoice balance.
- why mock providers are useful before Razorpay.

## Cross-Cutting Production Practices
- `PaymentController` depends on `IPaymentService` and `IPaymentWebhookService` through DI.
- `PaymentService` depends on `IPaymentRepository`, `IPaymentNumberService`, `IPaymentGatewayProvider`, and invoice application contracts.
- Mock gateway implements `IPaymentGatewayProvider`.
- Repository implements `IPaymentRepository`.
- Add typed DI `Cradle` and registrations.
- Use Zod request schemas and typed response DTOs.
- Frontend payment API services, thunks, selectors, component props, and payment status models must be typed.
- Avoid `any`.

## Reference Patterns
- Production payment docs: [`BookKeepingApp/backend/docs/PAYMENTS_SETUP.md`](../../../BookKeepingApp/backend/docs/PAYMENTS_SETUP.md).
- Production payment DI: [`BookKeepingApp/backend/di/payments.ts`](../../../BookKeepingApp/backend/di/payments.ts).
- Production payment interfaces: [`BookKeepingApp/backend/types/interfaces/payments`](../../../BookKeepingApp/backend/types/interfaces/payments).
- Production payment services: [`BookKeepingApp/backend/services/payments`](../../../BookKeepingApp/backend/services/payments).
- Production payment repository: [`BookKeepingApp/backend/repositories/payments/paymentRepository.ts`](../../../BookKeepingApp/backend/repositories/payments/paymentRepository.ts).
- Production payment frontend: [`BookKeepingApp/frontend/src/features/payments`](../../../BookKeepingApp/frontend/src/features/payments).

## Backend Scope
1. Scaffold Express + Prisma + Zod + TypeScript backend.
2. Add simplified invoice and payment models.
3. Add seed data with at least two unpaid invoices and one partially paid example if practical.
4. Add contracts:
   - `IPaymentRepository`
   - `IPaymentService`
   - `IPaymentGatewayProvider`
   - `IPaymentWebhookService`
   - `IInvoicePaymentApplicationService`
   - `IPaymentNumberService`
5. Implement `MockPaymentGatewayProvider` with methods to create a payment link/intent and simulate success/failure.
6. Implement payment creation for an invoice.
7. Implement mock callback/webhook handling.
8. Implement idempotency by storing a provider event ID or mock event ID and ignoring duplicates.
9. Implement invoice payment application: update paid amount, balance due, and status.
10. Add routes:
   - `GET /api/v1/payments`
   - `GET /api/v1/payments/:id`
   - `POST /api/v1/invoices/:invoiceId/payments`
   - `POST /api/v1/payments/mock/:paymentId/succeed`
   - `POST /api/v1/payments/mock/:paymentId/fail`
   - `GET /api/v1/payments/public/status/:publicId`
11. Register payment dependencies through typed DI.

## Frontend Scope
1. Scaffold Vite + React + TypeScript + Tailwind.
2. Add typed models for invoice payment summary, payment, payment status, create payment payload, mock callback response, and public status response.
3. Add typed payment API service.
4. Add typed Redux slice/thunks/selectors.
5. Add invoice detail page with create payment action.
6. Add payment detail page.
7. Add public payment status/result page.
8. Add mock provider controls for learning: simulate success/failure.
9. Show invoice balance before and after payment.
10. Keep Razorpay out of this module.

## Docs
Create detailed numbered docs in `07-payments-basic/docs/`:

1. `01-overview.md` - why payments are taught after invoices.
2. `02-payment-vs-invoice-status.md` - explain the two state machines with examples.
3. `03-payment-data-model.md` - Payment, Invoice, provider IDs, public IDs.
4. `04-provider-abstraction.md` - `IPaymentGatewayProvider` and mock implementation.
5. `05-create-payment-flow.md` - create payment from invoice detail.
6. `06-mock-webhook-flow.md` - simulate success/failure and explain real webhooks.
7. `07-idempotency-basics.md` - duplicate events and why they must not double-apply money.
8. `08-apply-payment-to-invoice.md` - balance, paid amount, status update examples.
9. `09-frontend-payment-state.md` - thunks/selectors/UI status handling.
10. `10-contracts-di-and-typing.md` - payment interfaces, DI, typed frontend contracts.
11. `11-contract-trace.md` - trace a captured payment event through provider, webhook service, invoice update, and UI refresh.
12. `12-how-this-maps-to-production.md` - map learning files to production payment files.
13. `13-exercises.md` - partial payments, duplicate callback test, cancelled payment, tests.

Docs must include sequence diagrams or step lists, example JSON payloads, and plain explanations of provider, callback, webhook, idempotency, captured, failed, and balance due.

## Validation
- Run backend build or `tsc --noEmit`.
- Run frontend build.
- Verify create payment for invoice.
- Verify mock success updates payment and invoice status.
- Verify mock failure does not mark invoice paid.
- Verify duplicate mock event does not double-apply payment.
- Verify DI contracts compile.
- Verify no feature-level `any` is introduced.
- Run `git diff --check` for the new module and docs.
