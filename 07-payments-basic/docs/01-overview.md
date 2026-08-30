# 01 - Overview: Why Payments Are Taught After Invoices

## Context

Payments are the final piece in the business flow of invoicing. This learning module teaches payments *after* invoices because:

1. **Invoices are prerequisites**: A payment applies to an invoice. Before we can pay, we must have something to pay.
2. **Complexity requires foundation**: Payments introduce asynchronous callbacks, provider abstraction, and eventual consistency. Understanding invoices first clarifies what we're paying *for*.
3. **Separation of concerns**: By the time a developer reaches this module, they understand:
   - How to create and track invoices
   - Line item calculations
   - Multi-entity relationships (Customer → Invoice → InvoiceLine → Item)

## What This Module Teaches

### Key Concepts
- **Payment intent/link**: A provider request to accept a payment (e.g., a Razorpay link)
- **Idempotency**: Why duplicate events must not double-charge or double-apply money
- **Payment status** vs. **Invoice status**: Two independent state machines that must be kept in sync
- **Provider abstraction**: Why we abstract the payment gateway (Razorpay, Stripe, etc.) behind an interface
- **Webhook/callback**: How a provider tells us a payment succeeded or failed (simulated here)
- **Invoice application**: Updating invoice `paidAmount`, `balanceDue`, and `status` after payment captures

### Real-World Why
In production, a payment doesn't settle instantly. The flow is:

1. **App creates payment** → calls provider API → gets payment link
2. **Customer pays** → on provider platform → pays with card/UPI/bank transfer
3. **Provider notifies app** → via webhook → "payment succeeded" or "payment failed"
4. **App updates invoice** → marks paid, reduces balance, may unlock next invoice

This async flow is why:
- We can't trust a payment is successful until the provider tells us
- We must handle duplicate notifications (idempotency)
- We must abstract the provider (swap Razorpay for Stripe without rewriting our app)

## Module Structure

```
07-payments-basic/
├── backend/          # Express + Prisma + DI
│   ├── src/
│   │   ├── services/
│   │   │   ├── PaymentService.ts           # Orchestrates payment flow
│   │   │   ├── PaymentNumberService.ts     # Generates public IDs
│   │   │   ├── MockPaymentGatewayProvider.ts # Mock provider
│   │   │   ├── PaymentWebhookService.ts    # Processes callbacks
│   │   │   └── InvoicePaymentApplicationService.ts # Updates invoice
│   │   ├── repositories/
│   │   │   └── PaymentRepository.ts        # Payment persistence
│   │   ├── controllers/
│   │   │   └── PaymentController.ts        # HTTP handlers
│   │   ├── routes/
│   │   │   └── paymentRoutes.ts            # Express routes
│   │   ├── di/
│   │   │   ├── contracts.ts                # Interfaces
│   │   │   └── container.ts                # DI wiring
│   │   ├── types/
│   │   ├── schemas/
│   │   └── middleware/
│   └── prisma/
│       └── schema.prisma                   # Models + Seed
├── frontend/         # React + Redux + Tailwind
│   └── src/
│       └── features/payments/
│           ├── pages/
│           │   ├── PaymentStatusPage.tsx   # Public status + learning controls
│           │   └── PaymentListPage.tsx     # Payment list view
│           ├── store/
│           │   ├── paymentSlice.ts         # Redux state + thunks
│           │   └── paymentSelectors.ts     # Selectors
│           ├── services/
│           │   └── paymentService.ts       # API calls
│           └── types/
│               └── payment.types.ts        # Payment DTOs
└── docs/            # Learning materials
    ├── 01-overview.md (this file)
    ├── 02-payment-vs-invoice-status.md
    ├── 03-payment-data-model.md
    ├── 04-provider-abstraction.md
    ├── 05-create-payment-flow.md
    ├── 06-mock-webhook-flow.md
    ├── 07-idempotency-basics.md
    ├── 08-apply-payment-to-invoice.md
    ├── 09-frontend-payment-state.md
    ├── 10-contracts-di-and-typing.md
    ├── 11-contract-trace.md
    ├── 12-how-this-maps-to-production.md
    └── 13-exercises.md

```

## Running the Module

### Backend
```bash
cd 07-payments-basic/backend
npm install
npx prisma migrate dev          # Create tables
npx prisma db seed              # Load test data
npm run dev                      # Start server on :3001
```

### Frontend
```bash
cd 07-payments-basic/frontend
npm install
npm run dev                      # Start Vite on :5174
```

Visit `http://localhost:5174` to explore:
- Payment list view
- Public payment status page
- Learning controls to simulate success/failure

## Learning Path

1. **Read** `02-payment-vs-invoice-status.md` → Understand the two state machines
2. **Read** `03-payment-data-model.md` → Understand what we're storing
3. **Read** `04-provider-abstraction.md` → See why `IPaymentGatewayProvider` matters
4. **Read** `05-create-payment-flow.md` → Trace a create payment request
5. **Run backend** → Create a test payment via API
6. **Read** `06-mock-webhook-flow.md` → Understand callback flow
7. **Use frontend** → Watch payment and invoice status update together
8. **Read** `07-idempotency-basics.md` → See why duplicate events are safe
9. **Read** `08-apply-payment-to-invoice.md` → Understand invoice balance logic
10. **Read** `09-frontend-payment-state.md` → Redux thunks and selectors
11. **Read** `10-contracts-di-and-typing.md` → DI and interface design
12. **Read** `11-contract-trace.md` → Full end-to-end trace
13. **Read** `12-how-this-maps-to-production.md` → Bridge to real Razorpay
14. **Do** `13-exercises.md` → Partial payments, cancellation, tests

## Key Takeaways

By the end of this module, you will know:

1. ✓ Why invoices must exist before payments
2. ✓ What payment status means (created → pending → captured/failed)
3. ✓ What invoice status changes with payment (issued → partially_paid → paid)
4. ✓ How to abstract a payment provider and why
5. ✓ How to handle idempotent webhook events
6. ✓ How to update invoice balance after payment captures
7. ✓ How to build a public-facing payment status page
8. ✓ How to test payments with mock callbacks
9. ✓ How to structure payment code in TypeScript with DI
10. ✓ How production Razorpay integration differs from this learning module
