# 12 - How This Maps to Production (BookKeepingApp)

## Overview

This learning module teaches the patterns and architecture used in the production BookKeepingApp. Once you understand 07-payments-basic, you're ready to read the production payment code.

---

## File Mapping

| Learning Module | Production | Purpose |
|---|---|---|
| `src/types/payment.types.ts` | `backend/src/types/payment.types.ts` | DTOs and payment types |
| `src/di/contracts.ts` | `backend/src/types/interfaces/payments/` | Payment interfaces |
| `src/di/container.ts` | `backend/src/di/payments.ts` | Payment DI wiring |
| `src/services/PaymentService.ts` | `backend/src/services/payments/PaymentService.ts` | Core payment logic |
| `src/services/PaymentWebhookService.ts` | `backend/src/services/payments/PaymentWebhookService.ts` | Webhook handling |
| `src/services/PaymentNumberService.ts` | `backend/src/services/payments/PaymentNumberService.ts` | Public ID generation |
| `src/services/InvoicePaymentApplicationService.ts` | `backend/src/services/payments/InvoicePaymentApplicationService.ts` | Invoice updates |
| `src/services/MockPaymentGatewayProvider.ts` | `backend/src/services/payments/providers/MockPaymentGatewayProvider.ts` | Mock provider |
| (N/A) | `backend/src/services/payments/providers/RazorpayPaymentGatewayProvider.ts` | Real Razorpay |
| `src/repositories/PaymentRepository.ts` | `backend/src/repositories/payments/PaymentRepository.ts` | Payment persistence |
| `src/controllers/PaymentController.ts` | `backend/src/controllers/payments/PaymentController.ts` | HTTP handlers |
| `src/routes/paymentRoutes.ts` | `backend/src/routes/paymentRoutes.ts` | Route definitions |
| `prisma/schema.prisma` | `BookKeepingApp/backend/prisma/schema.prisma` | Payment models (subset) |
| `frontend/src/features/payments/` | `BookKeepingApp/frontend/src/features/payments/` | Payment UI |

---

## Key Differences: Learning → Production

### 1. Payment Gateway Provider

**Learning:**
```typescript
// MockPaymentGatewayProvider returns mock IDs
export class MockPaymentGatewayProvider implements IPaymentGatewayProvider {
  async createPaymentIntent(paymentId, amount, description) {
    return {
      providerPaymentId: `mock_pay_${uuidv4()}`,
      paymentLink: `http://localhost:3001/api/v1/payments/public/status/${paymentId}`,
    };
  }
}
```

**Production:**
```typescript
// RazorpayPaymentGatewayProvider calls real Razorpay API
export class RazorpayPaymentGatewayProvider implements IPaymentGatewayProvider {
  async createPaymentIntent(paymentId, amount, description) {
    const paymentLink = await this.razorpay.paymentLink.create({
      amount,
      description,
      customer_notify: 1,
      currency: "INR",
    });

    return {
      providerPaymentId: paymentLink.id,
      paymentLink: paymentLink.url,
    };
  }
}
```

Both implement the same interface! No other code changes needed.

### 2. Webhook Endpoint

**Learning:**
```typescript
// Mock endpoint for learning
POST /api/v1/payments/mock/:paymentId/succeed
POST /api/v1/payments/mock/:paymentId/fail
```

**Production:**
```typescript
// Real webhook endpoint called by Razorpay
POST /api/v1/webhooks/razorpay

// Razorpay sends:
{
  "event": "payment_link.paid",
  "id": "evt_1A2B3C4D5E6F",
  "payload": {
    "payment_link": {
      "id": "plink_123",
      "amount": 16500,
      "status": "paid"
    }
  }
}
```

The webhook controller extracts event data and calls `paymentWebhookService.processPaymentEvent()`.

### 3. DI Container Integration

**Learning:**
```typescript
// Separate DI file for learning
import { createCradle } from "./di/container";
const cradle = createCradle(prisma);
app.use("/api/v1/payments", createPaymentRoutes(cradle.paymentController));
```

**Production:**
```typescript
// Integrated with app-wide DI
const cradle = createCradle(prisma);  // All features wired together

// Other features can depend on payment services
const invoiceService = new InvoiceService(
  invoiceRepository,
  paymentService,  // ← Cross-feature dependency
  ...
);
```

### 4. Database

**Learning:**
```prisma
// Simplified models for learning
model Invoice {
  id            String
  paidAmount    Float  @default(0)
  balanceDue    Float  @default(0)
  payments      Payment[]
}
```

**Production:**
```prisma
// Full BookKeepingApp models with more fields
model Invoice {
  id              String
  number          String  @unique
  customerId      String
  organizationId  String
  paymentTerms    String
  dueDate         DateTime
  // ... more fields ...
  paidAmount      Float  @default(0)
  balanceDue      Float  @default(0)
  payments        Payment[]
  invoiceLines    InvoiceLine[]
}

model Payment {
  id              String
  publicId        String  @unique
  status          String
  invoiceId       String
  customerId      String
  organizationId  String
  amount          Float
  providerPaymentId String?
  providerName    String
  notes           String?
  // ... more fields ...
  paymentEvents   PaymentEvent[]
}
```

### 5. Error Handling

**Learning:**
```typescript
// Simple error classes
throw new NotFoundError("Payment not found");
throw new ValidationError("Amount must be positive");
```

**Production:**
```typescript
// Application-wide error hierarchy
throw new AppError("Payment not found", "PAYMENT_NOT_FOUND", 404);
throw new PaymentValidationError("Amount must be positive");
throw new PaymentProviderError("Razorpay API timeout");
```

### 6. Logging and Monitoring

**Learning:**
```typescript
// Optional: console.log for debugging
console.log(`Processing event ${eventId} for payment ${paymentId}`);
```

**Production:**
```typescript
// Structured logging with context
logger.info("Payment webhook processed", {
  paymentId,
  eventId,
  status,
  amount,
  timestamp: new Date(),
  userId: req.user?.id,
});

// Metrics for monitoring
metrics.increment("payment.webhook.received");
metrics.histogram("payment.amount", amount);
metrics.gauge("payment.pending_count", pendingCount);
```

### 7. Transaction Safety

**Learning:**
```typescript
// Individual updates (good for learning)
await paymentRepository.updateStatus(paymentId, "captured");
await invoicePaymentApplicationService.applyPaymentToInvoice(invoiceId, amount);
```

**Production:**
```typescript
// Database transaction (atomic)
const result = await prisma.$transaction(async (tx) => {
  const payment = await tx.payment.update({
    where: { id: paymentId },
    data: { status: "captured" },
  });

  const invoice = await tx.invoice.update({
    where: { id: invoiceId },
    data: {
      paidAmount: { increment: amount },
      balanceDue: { decrement: amount },
      status: balanceDue - amount === 0 ? "paid" : "partially_paid",
    },
  });

  return { payment, invoice };
});
// If anything fails, both updates roll back
```

### 8. Testing

**Learning:**
```typescript
// Tests use mock provider directly
describe("PaymentService", () => {
  it("should create payment with public ID", async () => {
    const payment = await paymentService.createPayment("inv_123");
    expect(payment.publicId).toBeTruthy();
  });
});
```

**Production:**
```typescript
// Tests mock at interface level + integration tests
describe("PaymentService", () => {
  it("should create Razorpay payment link", async () => {
    const mockRazorpay = { paymentLink: { create: jest.fn() } };
    const provider = new RazorpayPaymentGatewayProvider(mockRazorpay);
    // ...
  });

  it("should handle webhook with idempotency", async () => {
    const event1 = { id: "evt_123", status: "paid" };
    const event1_retry = { id: "evt_123", status: "paid" };

    await webhookService.processPaymentEvent(...event1);
    await webhookService.processPaymentEvent(...event1_retry);

    expect(invoice.paidAmount).toBe(16500); // Not doubled
  });
});
```

---

## Stepping Stones to Production

### After Module 07, You Can:

1. **Read production code**: You understand the contracts, DI, and flow
2. **Add Razorpay**: Create `RazorpayPaymentGatewayProvider`, wire it in DI
3. **Set up webhooks**: Create `POST /api/v1/webhooks/razorpay`, call webhook service
4. **Understand invoice updates**: You know why payment capture updates invoice balance
5. **Test payments**: You know how idempotency prevents double-charging
6. **Extend to partial payments**: Reuse payment and invoice application logic

### Common Next Steps:

1. **Refund handling**
   - Add `PaymentRefund` model
   - Implement `IRefundService`
   - Subtract from `invoice.paidAmount` on refund

2. **Multi-currency support**
   - Add `currency` field to Payment
   - Update provider abstraction to handle conversion

3. **Payment reconciliation**
   - Compare local payments with provider payments
   - Handle missed webhooks (polling as fallback)

4. **Revenue recognition**
   - Track payment received date for accounting
   - Trigger revenue recognition workflows

---

## Production File Locations

**Backend:**
- Interfaces: [`BookKeepingApp/backend/src/types/interfaces/payments/`](../../../BookKeepingApp/backend/src/types/interfaces/payments)
- Services: [`BookKeepingApp/backend/src/services/payments/`](../../../BookKeepingApp/backend/src/services/payments)
- Repository: [`BookKeepingApp/backend/src/repositories/payments/`](../../../BookKeepingApp/backend/src/repositories/payments)
- Controller: [`BookKeepingApp/backend/src/controllers/payments/`](../../../BookKeepingApp/backend/src/controllers/payments)
- Routes: [`BookKeepingApp/backend/src/routes/paymentRoutes.ts`](../../../BookKeepingApp/backend/src/routes/paymentRoutes.ts)
- DI: [`BookKeepingApp/backend/src/di/payments.ts`](../../../BookKeepingApp/backend/src/di/payments.ts)
- Docs: [`BookKeepingApp/backend/docs/PAYMENTS_SETUP.md`](../../../BookKeepingApp/backend/docs/PAYMENTS_SETUP.md)

**Frontend:**
- Feature: [`BookKeepingApp/frontend/src/features/payments/`](../../../BookKeepingApp/frontend/src/features/payments)

---

## Summary

The learning module (07-payments-basic) uses:
- ✓ Same architecture (contracts, DI, services)
- ✓ Same data flow (create payment → webhook → apply to invoice)
- ✓ Same idempotency pattern (lastEventId)
- ✓ Same typing and error handling

The production code (BookKeepingApp) extends this with:
- ✓ Real Razorpay provider
- ✓ Structured logging and metrics
- ✓ Transaction safety
- ✓ Comprehensive testing
- ✓ Webhook signature verification
- ✓ Multi-tenant support
- ✓ Audit trails

Your learning foundation translates directly to production!

Next: [13 - Exercises](13-exercises.md)
