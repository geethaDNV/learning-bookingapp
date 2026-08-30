# Plan: Learning Bookingapp - Module 09 Invoice Email PDF

## Goal
Build `learning-bookingapp/09-invoice-email-pdf/{backend,frontend}` as a focused invoice delivery module. The module should teach sending an invoice email, editing recipient/subject/body, including an optional payment link placeholder, generating/downloading a client-side invoice PDF, and attaching the PDF where practical.

This should be taught as an invoice workflow, not as a generic email demo.

## Decisions
- Module folder name: `09-invoice-email-pdf`.
- Use invoice/customer data as prerequisites inside the isolated module.
- Teach email as invoice delivery: invoice PDF + message + optional payment link.
- Use Resend or a mock email provider depending on setup complexity. If real Resend is included, keep a mock provider fallback for local learning.
- Keep PDF generation client-side to match current production direction.
- Include print/download PDF before email attachment.
- Backend must use DI and an `IEmailService`/provider contract.
- Frontend must be strongly typed.
- Docs must include examples of email payloads, templates, and attachment behavior.

## Teaching Intent
Invoice email is where business workflow and external I/O meet. A junior developer needs to understand not only how to call an email provider, but what data is being sent, where the PDF comes from, how recipients are validated, and why payment links may be embedded.

After finishing this module, a junior developer should understand:
- invoice delivery flow.
- email provider abstraction.
- recipient validation.
- editable email subject/body.
- payment-link placeholders.
- client-side PDF generation.
- attachment handling tradeoffs.
- error handling for external email APIs.

## Cross-Cutting Production Practices
- `InvoiceEmailController` depends on `IInvoiceEmailService` through DI.
- `InvoiceEmailService` depends on `IEmailService`, `IInvoiceRepository`, and `ICustomerRepository` contracts.
- Real and mock email providers should implement the same email contract.
- Use typed DTOs for email request/response.
- Use Zod schemas for recipients, subject, body, attach flag, and payment-link placeholder inputs.
- Frontend dialog form values, API payloads, response types, and component props must be typed.
- Avoid `any`.

## Reference Patterns
- Production email service: [`BookKeepingApp/backend/services/email/emailService.ts`](../../../BookKeepingApp/backend/services/email/emailService.ts).
- Production email constants/config: [`BookKeepingApp/backend/constants/email`](../../../BookKeepingApp/backend/constants/email).
- Production invoice service send behavior: [`BookKeepingApp/backend/services/invoices/invoiceService.ts`](../../../BookKeepingApp/backend/services/invoices/invoiceService.ts).
- Production invoice frontend: [`BookKeepingApp/frontend/src/features/invoices`](../../../BookKeepingApp/frontend/src/features/invoices).
- Production print/PDF utility: [`BookKeepingApp/frontend/src/components/print/printUtils.ts`](../../../BookKeepingApp/frontend/src/components/print/printUtils.ts).
- Production payment docs: [`BookKeepingApp/backend/docs/PAYMENTS_SETUP.md`](../../../BookKeepingApp/backend/docs/PAYMENTS_SETUP.md).

## Backend Scope
1. Scaffold Express + Prisma + Zod + TypeScript backend or reuse isolated invoice models inside this module.
2. Add minimal `Customer`, `Invoice`, and `PaymentLink` or payment summary fields if needed.
3. Add contracts:
   - `IEmailService`
   - `IInvoiceEmailService`
   - `IInvoiceRepository`
   - `ICustomerRepository`
4. Implement `MockEmailService` for deterministic local learning.
5. Optionally implement `ResendEmailService` behind the same interface.
6. Implement `InvoiceEmailService` that loads invoice/customer data, validates recipients, builds email content, and sends through the provider.
7. Add Zod schema for send-email request:
   - `to`
   - `cc`
   - `bcc`
   - `subject`
   - `body`
   - `attachPdf`
   - optional `paymentLink`
8. Add route:
   - `POST /api/v1/invoices/:invoiceId/send-email`
9. If supporting attachments, accept a multipart PDF upload or a typed base64 payload only if the implementation stays simple and documented.
10. Register dependencies through typed DI.

## Frontend Scope
1. Add invoice detail/print context for email sending.
2. Add typed send-email dialog form using React Hook Form + Zod.
3. Add fields for `to`, `cc`, `bcc`, `subject`, `body`, `attachPdf`, and optional payment-link placeholder.
4. Add typed API service for sending invoice email.
5. Add client-side PDF download/generation using the established print utility pattern.
6. If attachment is implemented, convert/generated PDF should be passed in a typed, documented way.
7. Show sending, success, and failure states.
8. Add preview of email body with payment link placeholder replacement if practical.
9. Keep email sending separate from Razorpay creation; payment links can be selected or pasted from previous module data.

## Docs
Create detailed numbered docs in `09-invoice-email-pdf/docs/`:

1. `01-overview.md` - invoice delivery workflow and why this is not generic email.
2. `02-email-provider-contract.md` - mock provider vs Resend provider.
3. `03-send-invoice-email-api.md` - request schema, response DTO, examples.
4. `04-recipient-validation.md` - to/cc/bcc validation and examples.
5. `05-email-template-and-payment-link.md` - body placeholders, pay-now link examples.
6. `06-print-and-client-pdf.md` - print route, PDF generation, download flow.
7. `07-pdf-attachment-options.md` - client-generated attachment vs server-generated PDF tradeoffs.
8. `08-frontend-send-email-dialog.md` - React Hook Form + Zod dialog flow.
9. `09-error-handling.md` - provider failure, missing email, invalid attachment, retry guidance.
10. `10-contracts-di-and-typing.md` - backend email interfaces and typed frontend payloads.
11. `11-contract-trace.md` - trace `attachPdf` and `paymentLink` from UI to email provider call.
12. `12-how-this-maps-to-production.md` - map learning files to production email/invoice files.
13. `13-exercises.md` - HTML templates, resend retry, audit log, email history, tests.

Docs must include realistic email examples and explain provider, recipient, attachment, template, placeholder, PDF, and delivery failure in beginner-friendly language.

## Validation
- Run backend build or `tsc --noEmit`.
- Run frontend build.
- Verify PDF print/download works.
- Verify mock email send works.
- If Resend is included, verify missing env vars produce clear guidance and real send works only when configured.
- Verify invalid recipients show frontend and backend validation errors.
- Verify DI contracts compile.
- Verify no feature-level `any` is introduced.
- Run `git diff --check` for the new module and docs.
