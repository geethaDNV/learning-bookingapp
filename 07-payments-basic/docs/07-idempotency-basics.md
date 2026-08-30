# 07 - Idempotency Basics: Handling Duplicate Events

## The Problem: Webhook Retries

In production, payment providers can send the same webhook **multiple times**:

- Network timeout → provider retries
- Our server briefly down → provider retries when we're back up
- Provider thinks we didn't receive → sends again

If we don't handle this, the same payment might be applied **twice**:

```
Customer pays $100

Webhook 1 (evt_123): Invoice paidAmount = 0 → 100
Webhook 1 (retry, evt_123): Invoice paidAmount = 100 → 200 ❌ Double charged!
```

## The Solution: Idempotency Keys

We track the **event ID** to ensure each webhook is processed only once.

### Data Model

```prisma
model Payment {
  id         String
  lastEventId String?  // Latest event we processed
}

model PaymentEvent {
  id      String  @id
  paymentId String
  eventId String  @unique  // Provider's event ID
  payload String           // Webhook payload
  processed Boolean
}
```

### Webhook Service Logic

```typescript
async processPaymentEvent(
  paymentId: string,
  eventId: string,    // ← This is the idempotency key
  eventType: string,
  status: string
): Promise<PaymentDTO> {
  // IDEMPOTENCY CHECK
  const lastEventId = await this.paymentRepository.getLastEventId(paymentId);

  if (lastEventId === eventId) {
    // We've already processed this exact event!
    console.log(`Event ${eventId} already processed, skipping`);
    const payment = await this.paymentRepository.getById(paymentId);
    return payment!;  // Return current state
  }

  // First time seeing this event
  // Process normally
  let payment = await this.paymentRepository.updateStatus(paymentId, status);

  if (status === "captured") {
    await this.invoicePaymentApplicationService.applyPaymentToInvoice(
      payment.invoiceId,
      payment.amount
    );
  }

  // Record that we've now seen this event
  await this.paymentRepository.recordEventId(paymentId, eventId);

  return payment;
}
```

---

## Scenario: First Event

```
Webhook arrives:
{
  eventId: "evt_1A2B3C",
  paymentId: "pay_xyz",
  status: "captured"
}

Process:
1. lastEventId = getLastEventId("pay_xyz")
   → null (first time)
2. lastEventId !== eventId
   → Continue processing

3. updateStatus("pay_xyz", "captured")
   → Payment.status = "captured"

4. applyPaymentToInvoice("inv_123", 16500)
   → Invoice.paidAmount = 16500
   → Invoice.balanceDue = 0
   → Invoice.status = "paid"

5. recordEventId("pay_xyz", "evt_1A2B3C")
   → Payment.lastEventId = "evt_1A2B3C"

Result:
✓ Payment marked captured
✓ Invoice marked paid
```

---

## Scenario: Duplicate Event

```
SAME webhook arrives again (network retry):
{
  eventId: "evt_1A2B3C",  ← Same event ID!
  paymentId: "pay_xyz",
  status: "captured"
}

Process:
1. lastEventId = getLastEventId("pay_xyz")
   → "evt_1A2B3C" (we've seen this before!)
2. lastEventId === eventId
   → ✓ Match! We've already processed this!
   → Return current payment state without re-applying

Result:
✓ Payment status: still "captured"
✓ Invoice status: still "paid"
✓ Invoice paidAmount: still 16500 (NOT 33000)
✓ No double-charge!
```

---

## Scenario: Different Event (Retry Loop with Status Change)

```
First webhook: evt_1A2B3C (captured)
→ Payment.lastEventId = "evt_1A2B3C"

Later, webhook: evt_1A2B3D (failed)
→ Different event ID!
→ Process this one too
```

This is rare but possible if Razorpay sends a "failed" event after sending "captured" (shouldn't happen, but we're resilient).

---

## Best Practices for Idempotency

### 1. Use a Unique ID from Provider
```typescript
// ✓ Razorpay sends a unique event ID
eventId = webhook.id;  // "evt_1A2B3C4D5E6F"

// ✓ Mock provider generates one
eventId = `evt_${uuidv4()}`;
```

### 2. Store Both Payment and Event
Keep track at two levels:

```typescript
// Per-payment (fast check)
Payment.lastEventId = "evt_1A2B3C";

// Full audit trail
PaymentEvent {
  eventId: "evt_1A2B3C",
  paymentId: "pay_xyz",
  status: "processed",
  payload: "...",
  error: null
}
```

### 3. Idempotency Key in Request
In production, send idempotency key in API headers:

```
POST /api/v1/payments/webhook
X-Idempotency-Key: evt_1A2B3C4D5E6F
Content-Type: application/json
{...webhook payload...}
```

Our webhook service checks this header.

### 4. Log Everything
```typescript
logger.info(`Processing event ${eventId} for payment ${paymentId}`);
logger.info(`Event already processed: ${eventId}`, { skipped: true });
logger.error(`Event processing failed`, { eventId, error });
```

---

## Testing Idempotency

### In the Learning Module

1. Create a payment:
   ```
   POST /api/v1/invoices/inv_123/payments
   ```

2. Simulate success:
   ```
   POST /api/v1/payments/mock/pay_xyz/succeed
   ```
   → Invoice marked paid

3. Fetch payment status:
   ```
   GET /api/v1/payments/pay_xyz
   ```
   → Status is "captured"

4. Simulate success again (duplicate):
   ```
   POST /api/v1/payments/mock/pay_xyz/succeed
   ```
   → Should return 200 with same state
   → Check `lastEventId` matches

5. Verify invoice still has correct balance:
   ```
   GET /api/v1/invoices/inv_123
   ```
   → paidAmount still 16500 (not doubled)
   → balanceDue still 0

---

## Real-World: Razorpay Retry Behavior

Razorpay sends webhooks with:
- `event.id`: `evt_1A2B3C4D5E6F` (unique per event, never changes)
- Retry strategy: exponential backoff (1s, 2s, 4s, 8s, 16s)
- Maximum retries: up to 24 hours

If your webhook endpoint is down:
```
T=0s:    Send webhook (endpoint down, timeout)
T=1s:    Retry (still down)
T=3s:    Retry (still down)
...
T=24h:   Final retry
```

When your endpoint comes back online:
- Next webhook arrives with same `event.id`
- Our idempotency check: `lastEventId === event.id`
- ✓ We recognize it's a duplicate and skip
- ✓ Invoice balance doesn't change

---

## Summary

| Scenario | Action |
|----------|--------|
| First webhook for event | Process fully, record lastEventId |
| Duplicate webhook (same event.id) | Skip processing, return current state |
| Different event (new event.id) | Process as new event |
| Multiple partial payments | Each payment has own lastEventId, track independently |

**The key**: `lastEventId` is our circuit breaker for duplicate events. It's simple, reliable, and works in production with real providers.

Next: [08 - Apply Payment to Invoice](08-apply-payment-to-invoice.md)
