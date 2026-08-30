# Plan: Learning Bookingapp - Module 08 Payments Razorpay

## Goal
Build `learning-bookingapp/08-payments-razorpay/{backend,frontend}` as a focused Razorpay integration learning module. This module should start from the mock payment mental model in `07-payments-basic` and replace the mock provider with a real Razorpay sandbox provider, while keeping the rest of the payment flow recognizable.

The objective is to teach real gateway integration without mixing in refunds, reconciliation, accounting postings, or email delivery.

## Decisions
- Module folder name: `08-payments-razorpay`.
- Use Razorpay sandbox/test credentials through environment variables.
- Keep a mock provider available only for local comparison if useful, but the main lesson is Razorpay.
- Include provider selection through DI.
- Include hosted payment link or order creation, based on the production approach.
- Include webhook route and signature verification.
- Include public payment status/result page.
- Include clear sandbox setup instructions.
- Do not include refunds, reconciliation, ledger posting, or email in this module.
- Backend must use DI and contract-based provider interfaces.
- Frontend must be strongly typed.
- Docs must be detailed enough for a junior to understand keys, signatures, webhooks, and local testing.

## Teaching Intent
Real payment integrations add external infrastructure. The junior developer must understand what is app logic and what is provider logic.

After finishing this module, a junior developer should understand:
- Razorpay test keys and environment variables.
- provider selection through DI.
- creating a hosted payment link/order.
- why webhooks exist.
- signature verification.
- public payment result/status pages.
- how the Razorpay provider fits the same contract as the mock provider.

## Cross-Cutting Production Practices
- `RazorpayGatewayProvider` implements `IPaymentGatewayProvider`.
- `PaymentWebhookService` depends on the provider interface for signature verification/event parsing.
- Provider selection must happen in DI, not inside controllers.
- Typed DI `Cradle` must expose `mockPaymentGatewayProvider`, `razorpayGatewayProvider`, and selected `paymentGatewayProvider` where applicable.
- Use Zod for inbound request validation where possible, and careful typing for raw webhook bodies.
- Frontend payment result/status types must be explicit.
- Avoid `any`, especially in Razorpay event parsing; use narrowed typed helpers for provider payloads.

## Reference Patterns
- Production payment setup docs: [`BookKeepingApp/backend/docs/PAYMENTS_SETUP.md`](../../../BookKeepingApp/backend/docs/PAYMENTS_SETUP.md).
- Production Razorpay provider: [`BookKeepingApp/backend/services/payments/razorpayGatewayService.ts`](../../../BookKeepingApp/backend/services/payments/razorpayGatewayService.ts).
- Production payment DI: [`BookKeepingApp/backend/di/payments.ts`](../../../BookKeepingApp/backend/di/payments.ts).
- Production payment controller: [`BookKeepingApp/backend/controllers/payments/paymentsController.ts`](../../../BookKeepingApp/backend/controllers/payments/paymentsController.ts).
- Production payment webhook service: [`BookKeepingApp/backend/services/payments/paymentWebhookService.ts`](../../../BookKeepingApp/backend/services/payments/paymentWebhookService.ts).
- Production payment frontend: [`BookKeepingApp/frontend/src/features/payments`](../../../BookKeepingApp/frontend/src/features/payments).

## Backend Scope
1. Start from the concepts of `07-payments-basic`, but keep this module fully isolated and runnable.
2. Add environment variables:
   - `RAZORPAY_KEY_ID`
   - `RAZORPAY_KEY_SECRET`
   - `RAZORPAY_WEBHOOK_SECRET`
   - `APP_PUBLIC_URL`
3. Add contracts:
   - `IPaymentGatewayProvider`
   - `IPaymentWebhookService`
   - `IPaymentService`
   - `IPaymentRepository`
4. Implement `RazorpayGatewayProvider` for creating hosted payment links/orders and verifying webhook signatures.
5. Preserve a small mock provider only if it helps explain provider parity.
6. Implement DI provider selection based on config.
7. Ensure webhook route can receive the raw body needed for signature verification.
8. Implement webhook processing for success/failure events.
9. Add idempotency handling for provider event IDs.
10. Update payment and invoice status after verified events.
11. Add routes:
   - `POST /api/v1/invoices/:invoiceId/payments/razorpay`
   - `POST /api/v1/payments/webhooks/razorpay`
   - `GET /api/v1/payments/public/status/:publicId`
12. Include explicit error messages for missing env vars in setup docs or config validation.

## Frontend Scope
1. Add typed payment API service for Razorpay link creation and public status lookup.
2. Add invoice detail action to create/open Razorpay payment link.
3. Add public payment result/status page.
4. Show pending/success/failure states clearly.
5. Add sandbox-only UI labels so learners know this is test mode.
6. Do not collect card details directly in the app if using hosted checkout/link.
7. Keep frontend types explicit for `PaymentStatus`, `ProviderName`, `PaymentPublicStatus`, and API responses.

## Docs
Create detailed numbered docs in `08-payments-razorpay/docs/`:

1. `01-overview.md` - what changes from mock payments to Razorpay.
2. `02-razorpay-sandbox-setup.md` - test account, keys, env vars, callback/public URL basics.
3. `03-provider-contract.md` - how Razorpay implements the same payment provider interface.
4. `04-create-payment-link-flow.md` - invoice to Razorpay hosted link/order.
5. `05-webhook-signature-verification.md` - raw body, signature header, webhook secret, examples.
6. `06-webhook-event-processing.md` - event IDs, statuses, idempotency, invoice update.
7. `07-public-payment-status-page.md` - why customers need a public result/status URL.
8. `08-di-provider-selection.md` - typed DI selection between mock and Razorpay.
9. `09-frontend-flow.md` - create link, open checkout/link, poll or load status.
10. `10-contract-trace.md` - trace Razorpay event from HTTP webhook to payment status UI.
11. `11-how-this-maps-to-production.md` - map learning files to production Razorpay files.
12. `12-troubleshooting.md` - missing keys, signature mismatch, webhook not received, duplicate event.
13. `13-exercises.md` - add failure event handling, add retry, add better provider payload typing.

Docs must include `.env.example`, example webhook headers/body shape, and plain explanations of secret, signature, raw body, sandbox, hosted checkout, callback, and webhook.

## Validation
- Run backend build or `tsc --noEmit`.
- Run frontend build.
- Verify app starts with missing Razorpay keys producing clear setup guidance.
- Verify create Razorpay payment link/order in sandbox.
- Verify webhook signature verification path.
- Verify duplicate webhook event is ignored.
- Verify public status page shows expected state.
- Verify DI provider selection compiles and is tested manually.
- Verify no feature-level `any` is introduced.
- Run `git diff --check` for the new module and docs.
