# 06 - Mock Webhook Flow: Simulating Payment Success/Failure

## What is a Webhook?

A webhook is an **HTTP callback**: a provider calls *our* API to tell us something happened.

In production with Razorpay:
1. Customer pays on Razorpay's platform
2. Razorpay processes the payment
3. **Razorpay calls our webhook endpoint** with the result
4. We update payment status and invoice balance

In this learning module, we simulate this by calling:
```
POST /api/v1/payments/mock/:paymentId/succeed
POST /api/v1/payments/mock/:paymentId/fail
```

---

## Mock Success Flow

### Frontend Calls Simulate Success

```javascript
// Frontend (learning)
const response = await fetch(
  'http://localhost:3001/api/v1/payments/mock/pay_xyz/succeed',
  { method: 'POST' }
);
```

### Controller Routes to Payment Controller

**File**: `src/routes/paymentRoutes.ts`

```typescript
router.post("/mock/:paymentId/succeed", (req: Request, res: Response) => {
  return controller.simulatePaymentSuccess(req, res);
});
```

### Controller Calls Service

**File**: `src/controllers/PaymentController.ts`

```typescript
simulatePaymentSuccess = asyncHandler(async (req: Request, res: Response) => {
  const { paymentId } = req.params;

  const payment = await this.paymentService.simulatePaymentSuccess(paymentId);

  sendResponse(res, 200, "Payment marked as captured (simulated)", {
    id: payment.id,
    status: payment.status,
    invoiceId: payment.invoiceId,
    amount: payment.amount,
  });
});
```

### Service Simulates Webhook

**File**: `src/services/PaymentService.ts`

```typescript
async simulatePaymentSuccess(paymentId: string): Promise<PaymentDTO> {
  const payment = await this.getPayment(paymentId);

  // Generate a fake provider event ID
  const eventId = `evt_${uuidv4()}`;

  // Call webhook service (same as real webhook would)
  const updatedPayment = await this.webhookService.processPaymentEvent(
    paymentId,
    eventId,
    "payment.captured", // Event type
    "captured"          // Status
  );

  return updatedPayment;
}
```

---

## Webhook Service: The Critical Part

**File**: `src/services/PaymentWebhookService.ts`

This is where payment success/failure logic lives. This is **exactly the same** whether the webhook comes from a real provider or our mock.

```typescript
async processPaymentEvent(
  paymentId: string,
  eventId: string,
  eventType: string,
  status: string
): Promise<PaymentDTO> {
  // STEP 1: Check idempotency
  const lastEventId = await this.paymentRepository.getLastEventId(paymentId);

  if (lastEventId === eventId) {
    // We've already processed this exact event!
    const payment = await this.paymentRepository.getById(paymentId);
    return payment!; // Return current state, don't re-apply
  }

  // STEP 2: Update payment status
  let payment = await this.paymentRepository.updateStatus(paymentId, status);

  // STEP 3: If captured, apply payment to invoice
  if (status === "captured") {
    await this.invoicePaymentApplicationService.applyPaymentToInvoice(
      payment.invoiceId,
      payment.amount
    );
  }

  // STEP 4: Record event ID for next time
  await this.paymentRepository.recordEventId(paymentId, eventId);

  return payment;
}
```

---

## State Changes: Before and After

### Before Simulate Success

```json
Payment {
  id: "pay_xyz",
  status: "created",
  invoiceId: "inv_123",
  amount: 16500,
  lastEventId: null
}

Invoice {
  id: "inv_123",
  status: "issued",
  total: 16500,
  paidAmount: 0,
  balanceDue: 16500
}
```

### After Simulate Success (STEP 1: Idempotency Check)

```typescript
// Check if we've already processed this event
lastEventId = await paymentRepository.getLastEventId("pay_xyz");
// Result: null (first time processing)

// If it was null, we continue...
```

### After Simulate Success (STEP 2: Update Payment)

```typescript
payment = await paymentRepository.updateStatus("pay_xyz", "captured");
```

**Payment now:**
```json
{
  id: "pay_xyz",
  status: "captured",  // ← Changed
  invoiceId: "inv_123",
  amount: 16500,
  lastEventId: null    // (not yet recorded)
}
```

### After Simulate Success (STEP 3: Apply to Invoice)

```typescript
await invoicePaymentApplicationService.applyPaymentToInvoice(
  "inv_123",  // Invoice ID
  16500       // Payment amount
);
```

**Invoice Application Service does:**
```typescript
async applyPaymentToInvoice(invoiceId: string, amount: number) {
  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });

  const newPaidAmount = invoice.paidAmount + amount;        // 0 + 16500 = 16500
  const newBalanceDue = Math.max(0, invoice.total - newPaidAmount); // 16500 - 16500 = 0
  const newStatus = newBalanceDue === 0 ? "paid" : "partially_paid"; // "paid"

  const updated = await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      paidAmount: newPaidAmount,
      balanceDue: newBalanceDue,
      status: newStatus,
    },
  });

  return updated;
}
```

**Invoice now:**
```json
{
  id: "inv_123",
  status: "paid",       // ← Changed
  total: 16500,
  paidAmount: 16500,    // ← Changed
  balanceDue: 0         // ← Changed
}
```

### After Simulate Success (STEP 4: Record Event ID)

```typescript
await paymentRepository.recordEventId("pay_xyz", "evt_..."); // Save event ID
```

**Payment now:**
```json
{
  id: "pay_xyz",
  status: "captured",
  lastEventId: "evt_..."  // ← Recorded for idempotency
}
```

---

## Idempotency in Action

### Duplicate Webhook Arrives

Razorpay sends the webhook again (with the same `eventId`):

```typescript
// Same event, same ID
eventId = "evt_1A2B3C";

// Check idempotency
lastEventId = await paymentRepository.getLastEventId("pay_xyz");
// Result: "evt_1A2B3C" (we've seen this before!)

if (lastEventId === eventId) {
  // Return current state without re-applying
  return payment; // Status is still "captured", invoice still "paid"
  // ✓ No double-charging!
}
```

---

## Mock Failure Flow

```javascript
// Frontend
await fetch(
  'http://localhost:3001/api/v1/payments/mock/pay_xyz/fail',
  { method: 'POST' }
);
```

**Service calls:**
```typescript
const eventId = `evt_${uuidv4()}`;
await this.webhookService.processPaymentEvent(
  paymentId,
  eventId,
  "payment.failed",  // Event type
  "failed"           // Status
);
```

**WebhookService does:**
```typescript
if (status === "captured") {
  // Only apply if captured
  await this.invoicePaymentApplicationService.applyPaymentToInvoice(...);
}
// If status is "failed", we skip application
```

### State After Failure

```json
Payment {
  id: "pay_xyz",
  status: "failed",    // ← Changed
  invoiceId: "inv_123",
  amount: 16500
}

Invoice {
  id: "inv_123",
  status: "issued",     // ← Unchanged (payment failed)
  total: 16500,
  paidAmount: 0,        // ← Unchanged
  balanceDue: 16500     // ← Unchanged
}
```

**Customer can retry** with another payment.

---

## Full Success Sequence Diagram

```
Frontend                 Controller                Service               Webhook Service      Repository      Invoice Service
  │                         │                        │                       │                   │                 │
  ├─ POST /mock/.../succeed->│                        │                       │                   │                 │
  │                         │                        │                       │                   │                 │
  │                         ├─ simulateSuccess ────────→                      │                   │                 │
  │                         │                        │                       │                   │                 │
  │                         │                        ├─ eventId ─────────────→                   │                 │
  │                         │                        │                       │                   │                 │
  │                         │                        │                   processPaymentEvent    │                 │
  │                         │                        │                       │                   │                 │
  │                         │                        │                       ├─ getLastEventId ──→                 │
  │                         │                        │                       │  (null, first time)│                 │
  │                         │                        │                       │                   │                 │
  │                         │                        │                       ├─ updateStatus ────→                 │
  │                         │                        │                       │  payment.status = captured          │
  │                         │                        │                       │                   │                 │
  │                         │                        │                       ├─ applyPaymentToInvoice ──────────────→
  │                         │                        │                       │                   │                 │
  │                         │                        │                       │                   │  paidAmount += amount
  │                         │                        │                       │                   │  balanceDue = 0
  │                         │                        │                       │                   │  status = "paid"
  │                         │                        │                       │                   │
  │                         │                        │                       ←─────────────────────
  │                         │                        │                       │                   │
  │                         │                        │                       ├─ recordEventId ───→
  │                         │                        │                       │  lastEventId = eventId
  │                         │                        │                       │                   │
  │                         │                        ←─ updatedPayment ──────│                   │
  │                         │                        │                       │                   │
  │                         ←─ paymentDTO ────────────│                       │                   │
  │                         │                        │                       │                   │
  │←─ 200 OK ─────────────────│                       │                       │                   │
  │  { status: "captured" }   │                       │                       │                   │
  │                           │                       │                       │                   │
```

---

## Key Insights

1. **Same code path for mock and real**: Whether the webhook comes from mock or Razorpay, `processPaymentEvent()` handles it identically
2. **Idempotency via eventId**: Duplicate webhooks don't double-apply
3. **Invoice updates only on capture**: We only call `applyPaymentToInvoice()` if `status === "captured"`
4. **Eventual consistency**: Invoice is updated *after* payment status changes

Next: [07 - Idempotency Basics](07-idempotency-basics.md)
