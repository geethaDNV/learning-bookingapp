# 06. Webhook Event Processing

How to safely process webhook events with idempotency to prevent duplicate payments.

## The Event Flow

```
1. Payment happens on Razorpay
2. Razorpay sends webhook to your server
3. Server receives HTTP POST
4. Verify signature (from doc 05)
5. Normalize event (from doc 03)
6. Check: is this a duplicate event?
7. If new: process payment (apply to invoice)
8. Return 200 OK to Razorpay (stop retrying)
```

## Why Idempotency Matters

### The Problem

Razorpay sends webhook, your server processes it:
```
1. Payment captured
2. Invoice updated: paidAmount += 5000
3. Server crashes before returning 200
4. Razorpay doesn't get 200, thinks delivery failed
5. Razorpay retries webhook
6. Server comes back up, processes webhook again
7. Invoice updated twice: paidAmount += 5000 (WRONG!)
8. Invoice shows double payment
```

### The Solution: Idempotency

```
1. Payment captured (first time)
2. Mark event as processed: lastEventId = "event_123"
3. Invoice updated
4. Return 200
5. Server crashes
6. Razorpay retries webhook (event_123 again)
7. Server comes back up
8. Check: have we seen event_123 before? YES
9. Don't process again, just return 200
10. Correct payment amount
```

## Implementation

### Step 1: Receive and Verify Webhook

```typescript
// backend/src/controllers/PaymentController.ts
async handleRazorpayWebhook(req: Request, res: Response): Promise<void> {
  try {
    const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
    const signature = req.headers["x-razorpay-signature"] as string;

    // 1. Verify signature (prevent fake webhooks)
    if (!this.gatewayProvider.verifyWebhook(rawBody, signature)) {
      res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Invalid signature" }
      });
      return;
    }

    // 2. Normalize webhook to internal format
    const event = this.gatewayProvider.normalizeWebhook(rawBody);

    // 3. Extract invoice ID from metadata
    const invoiceId = String(event.metadata.invoiceId || "");
    if (!invoiceId) {
      throw new ValidationError("Missing invoiceId in webhook metadata");
    }

    // 4. Find payment record by provider payment ID or link ID
    // In production, you'd look up by providerPaymentId
    // For now, assume payment exists from earlier create call

    // 5. Process the event with idempotency
    // ... continue below
  } catch (error) {
    // Log but return 200 anyway
    // Razorpay doesn't care about errors, just needs 200 OK
    console.error("Webhook error:", error);
    res.status(200).json({ success: true });
  }
}
```

### Step 2: Find Payment Record

```typescript
// Look up payment by provider payment ID
const payment = await this.paymentRepository.getByProviderPaymentId(
  event.providerPaymentId
);

if (!payment) {
  // Payment not found?
  // In learning module, might not have created yet
  // In production, look up by metadata
  console.warn("Payment not found for event:", event.providerEventId);
  res.status(200).json({ success: true });  // Still return 200
  return;
}
```

### Step 3: Check for Duplicate Event

```typescript
// Check if we've processed this event before
const lastEventId = await this.paymentRepository.getLastEventId(payment.id);

if (lastEventId === event.providerEventId) {
  // This is a duplicate, skip processing
  console.log(
    `Duplicate event detected: ${event.providerEventId}, skipping`
  );
  res.status(200).json({ success: true });
  return;
}

// Not a duplicate, continue
```

### Step 4: Record Event ID

```typescript
// Record that we're processing this event
// Do this BEFORE processing, so if something fails,
// we still mark it as seen
await this.paymentRepository.recordEventId(
  payment.id,
  event.providerEventId
);
```

### Step 5: Process Based on Event Type

```typescript
// Normalize event type is "payment.captured" | "payment.failed" | "payment.pending"
if (event.eventType === "payment.captured" && event.amount) {
  // Payment succeeded!
  
  // 1. Apply payment to invoice
  await this.invoicePaymentApplicationService.applyPaymentToInvoice(
    payment.invoiceId,
    event.amount
  );

  // 2. Update payment status
  await this.paymentRepository.updateStatus(payment.id, "CAPTURED");

  // Log for audit
  console.log(
    `Payment ${payment.publicId} captured: ₹${event.amount}`
  );

} else if (event.eventType === "payment.failed") {
  // Payment failed
  
  // 1. Update payment status
  await this.paymentRepository.updateStatus(payment.id, "FAILED");

  // 2. Don't touch invoice (no money captured)
  
  // Log failure reason
  console.log(
    `Payment ${payment.publicId} failed: ${event.metadata.failureMessage}`
  );

} else if (event.eventType === "payment.pending") {
  // Payment is pending (authorized but not captured)
  // For now, don't update status
  // In real production, might need different handling
}

// Return success
res.status(200).json({ success: true });
```

## Database Changes During Processing

### Before Webhook

```sql
-- Payment record
SELECT * FROM payments WHERE id = 'pay_123';
-- status: PENDING
-- lastEventId: NULL

-- Invoice
SELECT * FROM invoices WHERE id = 'inv_456';
-- paidAmount: 0
-- balanceDue: 5000
-- status: SENT
```

### After Successful Webhook

```sql
-- Payment record (updated)
SELECT * FROM payments WHERE id = 'pay_123';
-- status: CAPTURED
-- lastEventId: event_xyz789

-- Invoice (updated)
SELECT * FROM invoices WHERE id = 'inv_456';
-- paidAmount: 5000
-- balanceDue: 0
-- status: PAID
```

### If Duplicate Webhook

```sql
-- Payment record (unchanged)
SELECT * FROM payments WHERE id = 'pay_123';
-- status: CAPTURED (same)
-- lastEventId: event_xyz789 (same)

-- Invoice (unchanged)
SELECT * FROM invoices WHERE id = 'inv_456';
-- paidAmount: 5000 (same - not doubled!)
-- balanceDue: 0 (same)
-- status: PAID (same)
```

## Invoice Payment Application Logic

```typescript
// backend/src/services/InvoicePaymentApplicationService.ts
async applyPaymentToInvoice(
  invoiceId: string,
  amount: number
): Promise<InvoicePaymentInfo> {
  const invoice = await this.prisma.invoice.findUnique({
    where: { id: invoiceId }
  });

  if (!invoice) {
    throw new NotFoundError(`Invoice not found`);
  }

  // Calculate new balances
  const newPaidAmount = (invoice.paidAmount || 0) + amount;
  const newBalanceDue = Math.max(0, invoice.amount - newPaidAmount);

  // Determine new status
  let status = invoice.status;
  if (newBalanceDue === 0) {
    status = "PAID";
  } else if (newPaidAmount > 0) {
    status = "PARTIALLY_PAID";
  }

  // Update database
  const updated = await this.prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      paidAmount: newPaidAmount,
      balanceDue: newBalanceDue,
      status,
      updatedAt: new Date()
    }
  });

  return {
    invoiceId: updated.id,
    totalAmount: updated.amount,
    paidAmount: updated.paidAmount || 0,
    balanceDue: updated.balanceDue || 0,
    status: updated.status as any
  };
}
```

## Idempotency Implementation Details

### Key Principle

Record the event ID **before** processing, not after:

```typescript
// ✓ CORRECT
await payment.recordEventId(event.providerEventId);  // Record first
await applyPaymentToInvoice(...);                    // Then process
// If this crashes, on retry we'll skip processing

// ✗ WRONG
await applyPaymentToInvoice(...);                    // Process first
await payment.recordEventId(event.providerEventId);  // Record after
// If this crashes, on retry we'll process again (double-charged!)
```

### Why Event IDs Matter

Each Razorpay event has unique ID:
```json
{
  "id": "event_FNuiMqfTL0Wqsc",  // Unique per event
  "event": "payment_link.paid",
  "payload": { ... }
}
```

This ID never changes, even if webhook is retried 10 times.

You store it:
```sql
UPDATE payments 
SET lastEventId = 'event_FNuiMqfTL0Wqsc'
WHERE id = 'pay_123';
```

Next time same event arrives, you check:
```sql
SELECT lastEventId FROM payments WHERE id = 'pay_123';
-- Returns: event_FNuiMqfTL0Wqsc
-- New event ID: event_FNuiMqfTL0Wqsc
-- Same! Skip processing
```

## Error Handling

### What Errors Can Happen?

```typescript
// 1. Event doesn't belong to your system
if (!invoiceId) {
  // Log but return 200 (not your event)
  res.status(200).json({ success: true });
  return;
}

// 2. Invoice doesn't exist (data corruption?)
if (!invoice) {
  console.error("Invoice not found:", invoiceId);
  // Log, don't apply payment, return 200
  res.status(200).json({ success: true });
  return;
}

// 3. Database error
if (err instanceof Error) {
  console.error("Database error processing webhook:", err);
  // Return 200 anyway (Razorpay will retry)
  res.status(200).json({ success: true });
  return;
}
```

### Always Return 200

Critical rule:
```typescript
// ALWAYS return 200 when Razorpay calls
try {
  // ... process webhook
} catch (error) {
  console.error("Error:", error);
  // Still return 200
  res.status(200).json({ success: true });
}
```

Why? Razorpay retries on 4xx/5xx. If your server is temporarily down, returning 200 stops retries. When server comes back, next webhook will work.

## Testing

### With Mock Provider

Simulate payment success:
```bash
curl -X POST http://localhost:3001/api/v1/payments/{paymentId}/simulate/success
```

With Razorpay Sandbox:
1. Create payment link (via API)
2. Open payment link in browser
3. Use test card to pay
4. Razorpay sends webhook automatically
5. Your server processes it

### Test Duplicate Webhook

```bash
# First call
curl -X POST http://localhost:3001/api/v1/payments/webhooks/razorpay \
  -H "X-Razorpay-Signature: xxx" \
  -d '{"id":"event_123",...}'
# Returns: 200, payment updated

# Same call again (duplicate)
curl -X POST http://localhost:3001/api/v1/payments/webhooks/razorpay \
  -H "X-Razorpay-Signature: xxx" \
  -d '{"id":"event_123",...}'
# Returns: 200, payment NOT updated again (correct!)
```

## Next Steps

- Read `07-public-payment-status-page.md` for customer-facing status pages
