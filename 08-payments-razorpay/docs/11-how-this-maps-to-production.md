# 11. How This Maps to Production

How the learning module relates to production BookKeepingApp.

## Architecture Comparison

### Learning Module (08-payments-razorpay)

```
┌─────────────────────────────────────────┐
│        Express + Prisma + SQLite        │
│     Simplified for learning (< 1000LOC) │
│                                         │
│  ✓ Payment link creation                │
│  ✓ Webhook processing                   │
│  ✓ Invoice status updates                │
│  ✓ Provider abstraction (Mock/Razorpay) │
│  ✗ Refunds                              │
│  ✗ Accounting/ledger posting            │
│  ✗ Multi-org/tenants                    │
│  ✗ Email notifications                  │
│  ✗ Advanced error handling              │
│  ✗ Rate limiting, caching               │
└─────────────────────────────────────────┘
```

### Production BookKeepingApp

```
┌─────────────────────────────────────────────────┐
│      Express + Prisma + PostgreSQL (AWS)        │
│   Full-featured (10,000+ LOC) accounting        │
│                                                  │
│  ✓ Payment link creation                        │
│  ✓ Webhook processing with signature verify    │
│  ✓ Invoice status updates                       │
│  ✓ Provider abstraction (Mock/Razorpay)        │
│  ✓ Refunds with reconciliation                 │
│  ✓ Accounting/ledger posting                    │
│  ✓ Multi-org/tenant isolation                  │
│  ✓ Email notifications                         │
│  ✓ Audit logging                               │
│  ✓ Rate limiting, caching, monitoring           │
│  ✓ Error tracking, metrics                      │
└─────────────────────────────────────────────────┘
```

## File Mapping

### Core Payment Logic

| Learning (08) | Production (BookKeepingApp) | Notes |
|---|---|---|
| `src/di/contracts.ts` | `backend/src/interfaces/payments/index.ts` | Same interface design |
| `src/services/MockPaymentGatewayProvider.ts` | `backend/src/services/payments/MockPaymentGatewayService.ts` | Similar mock implementation |
| `src/services/RazorpayGatewayProvider.ts` | `backend/src/services/payments/razorpayGatewayService.ts` | More sophisticated, handles refunds |
| `src/di/container.ts` | `backend/di/payments.ts` | More complex DI with Awilix |
| `src/services/PaymentService.ts` | `backend/src/services/payments/PaymentService.ts` | Has extra accounting logic |
| `src/services/PaymentWebhookService.ts` | `backend/src/services/payments/paymentWebhookService.ts` | Similar webhook handling |

### Database

| Learning | Production | Difference |
|---|---|---|
| `prisma/schema.prisma` (3 models) | `backend/prisma/schema.prisma` (50+ models) | Learning has minimal schema; production has full accounting |
| Payment, Invoice, Customer | + Ledger, JournalEntry, Account, etc. | Production tracks every rupee movement |

### Routes

| Learning (08) | Production | Features |
|---|---|---|
| `POST /api/v1/payments` | `POST /api/v1/payments/link` | Same, but production validates org ID |
| `GET /api/v1/payments/:id` | `GET /api/v1/payments/:publicId` | Public endpoints same |
| `POST /webhooks/razorpay` | `POST /api/v1/payments/webhooks/razorpay` | Learning + production both handle |

## Key Production Enhancements

### 1. Multi-Tenancy

**Learning**: Single organization
```typescript
// Create payment
const payment = await createPaymentLink(invoiceId);
```

**Production**: Organization-aware
```typescript
// Create payment with org ID from context
const payment = await createPaymentLink(invoiceId, context.orgId);

// Webhook verifies organization ownership
const payment = await paymentRepository.getByPublicIdAndOrgId(
  publicId,
  context.orgId
);
```

### 2. Accounting Integration

**Learning**: Just updates invoice balance
```typescript
await invoicePaymentApplicationService.applyPaymentToInvoice(
  invoiceId,
  amount
);
// Updates: paidAmount, balanceDue, status
```

**Production**: Posts journal entries
```typescript
// When payment captured:
await paymentPostingService.postPaymentCapture(payment);
// Creates journal entries:
//   Debit: Clearing Account (Razorpay)
//   Credit: Accounts Receivable

// When refunded:
await paymentPostingService.postRefundReversal(refund);
// Creates reversal journal entries
```

### 3. Refund Handling

**Learning**: Not included
```typescript
// Refunds are exercise 1 in doc 13
```

**Production**: Full refund workflow
```typescript
class PaymentRefundService {
  async requestRefund(paymentId: string, amount: number) {
    // 1. Call Razorpay refund API
    // 2. Create refund record
    // 3. Post journal entries
    // 4. Update payment status
    // 5. Wait for webhook confirmation
  }

  async reconcileRefund(refundId: string) {
    // Verify Razorpay webhook
    // Finalize refund
    // Complete journal entries
  }
}
```

### 4. Error Handling & Recovery

**Learning**: Basic try/catch
```typescript
try {
  await createPaymentLink(...);
} catch (error) {
  throw new ValidationError("Failed to create payment link");
}
```

**Production**: Comprehensive
```typescript
try {
  // ... create payment
} catch (error) {
  if (error instanceof RazorpayNetworkError) {
    // Retry logic with exponential backoff
    // Alert DevOps
  } else if (error instanceof DuplicatePaymentError) {
    // Return existing payment (idempotent)
  } else if (error instanceof InvalidConfigError) {
    // Alert on-call to configure Razorpay
  }
  // Log to error tracking (Sentry)
  // Notify via Slack
}
```

### 5. Audit Logging

**Learning**: Not included
```typescript
// No audit trail
```

**Production**: Everything logged
```typescript
await createAuditLog({
  organizationId: context.orgId,
  userId: toAuditUserId(context.userId),
  action: AUDIT_ACTIONS.CREATE,
  entity: AUDIT_ENTITY_NAMES.PAYMENT,
  entityId: String(payment.id),
  metadata: {
    paymentNumber: payment.paymentNumber,
    amount: payment.amount,
    provider: payment.provider
  }
});

// Audit trail:
// WHO: User123
// WHAT: Created payment
// WHEN: 2024-08-30 10:30:00
// WHERE: Organization456
// CONTEXT: Payment amount ₹5000
```

### 6. Rate Limiting & Caching

**Learning**: Unlimited requests
```typescript
// Anyone can poll /api/v1/payments/:id as much as they want
```

**Production**: Protected
```typescript
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                   // 100 requests per window
  keyGenerator: (req) => req.user.id  // Per-user limit
}));

// Webhook verification caching
const webhookCache = new Map<string, boolean>();
if (webhookCache.has(eventId)) {
  return;  // Already processed, skip
}
```

### 7. Metrics & Monitoring

**Learning**: Just logs to console
```typescript
console.log(`Payment ${id} captured: ₹${amount}`);
```

**Production**: Comprehensive metrics
```typescript
// Instrument payment creation
metrics.timer("payment.creation.time", duration);
metrics.counter("payment.created.count", 1);

// Instrument webhook processing
metrics.timer("webhook.processing.time", duration);
metrics.counter("webhook.received.count", 1);
metrics.counter("webhook.processed.count", 1);
metrics.gauge("webhook.pending.count", pendingCount);

// Track by provider
metrics.counter("payment.provider.razorpay", 1);
metrics.counter("payment.provider.mock", 1);

// Track by status
metrics.counter("payment.status.captured", 1);
metrics.counter("payment.status.failed", 1);

// In dashboard/Grafana:
// - Payment creation rate
// - Webhook processing latency
// - Error rate by type
// - Provider distribution
```

### 8. Configuration Management

**Learning**: Simple .env file
```bash
# .env
RAZORPAY_KEY_ID=xxx
RAZORPAY_KEY_SECRET=yyy
```

**Production**: Secrets + feature flags
```bash
# .env
RAZORPAY_KEY_ID=${AWS_SECRETS_MANAGER.razorpay_key_id}
RAZORPAY_KEY_SECRET=${AWS_SECRETS_MANAGER.razorpay_key_secret}

# Feature flags
ENABLE_PAYMENT_REFUNDS=true
ENABLE_PAYMENT_RECONCILIATION=true
WEBHOOK_RETRY_COUNT=3
WEBHOOK_RETRY_DELAY_MS=1000

# Timeouts
RAZORPAY_API_TIMEOUT_MS=5000
WEBHOOK_PROCESSING_TIMEOUT_MS=30000
```

### 9. Testing Strategy

**Learning**: Manual testing
```bash
# Test with mock provider
npm run dev

# Manually check /health
curl http://localhost:3001/health

# Click buttons in UI
```

**Production**: Comprehensive test suite
```typescript
// Unit tests
describe("PaymentService", () => {
  it("creates payment link with valid invoice", () => {...});
  it("throws on missing invoice", () => {...});
  it("retries on Razorpay timeout", () => {...});
});

// Integration tests
describe("Payment Flow", () => {
  it("end-to-end: create link → webhook → update invoice", () => {...});
  it("duplicate webhook doesn't double-charge", () => {...});
  it("handles partial refunds correctly", () => {...});
});

// E2E tests
describe("Payment UI", () => {
  it("user can create payment and complete via Razorpay", () => {...});
  it("status page updates after webhook", () => {...});
});

// Load tests
describe("Performance", () => {
  it("handles 1000 webhook events/sec", () => {...});
  it("payment creation < 500ms", () => {...});
});
```

## Graduation Path

### Phase 1: Learning (Current - 08-payments-razorpay)
- ✓ Learn provider pattern
- ✓ Understand webhooks
- ✓ Build basic payment flow
- ✓ Get familiar with Razorpay API

### Phase 2: Core Features (For Production)
- Add refund handling
- Add accounting/ledger posting
- Add audit logging
- Add error recovery strategies

### Phase 3: Scalability
- Add multi-tenancy
- Add caching layers
- Add rate limiting
- Add monitoring/metrics

### Phase 4: Compliance
- Add encryption for sensitive data
- Add comprehensive audit trail
- Add compliance reporting
- Add data retention policies

## Code Reuse Guide

### What You Can Copy Directly

```typescript
// ✓ Interface design
// These are exactly the same
IPaymentGatewayProvider (learning)
PaymentGatewayProvider (production)

// ✓ Mock provider logic
// Learning mock = simpler version of production mock
MockPaymentGatewayProvider

// ✓ Webhook normalization
// Same contract, same approach
normalizeWebhook()

// ✓ Idempotency handling
// Same logic: record event ID first, then process
lastEventId check
```

### What You'll Need to Adapt

```typescript
// ✗ DI container
// Learning: Simple function-based
// Production: Complex Awilix with complex dependency graph

// ✗ Services
// Learning: PaymentService does one thing
// Production: PaymentService + PaymentPostingService + PaymentRefundService

// ✗ Database schema
// Learning: 3 simple tables
// Production: 50+ tables with relationships

// ✗ Error handling
// Learning: Throw and let error handler catch
// Production: Granular error types with specific handling

// ✗ Configuration
// Learning: 10 env vars
// Production: 100+ config options + secrets manager
```

## Next Steps

For learning:
- Finish module 08 exercises
- Understand each component deeply

For production:
- Read production code
- Study accounting integration
- Learn multi-tenancy patterns
- Implement comprehensive tests

## Useful Production Files to Study

1. `backend/services/payments/razorpayGatewayService.ts` - Real implementation
2. `backend/di/payments.ts` - Complex DI setup
3. `backend/services/payments/paymentWebhookService.ts` - Robust webhook handling
4. `backend/docs/PAYMENTS_SETUP.md` - Production setup guide
5. `backend/docs/ACCOUNTING_POSTING_ENGINE.md` - Ledger integration

