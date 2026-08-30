# 13 - Exercises

## Exercise 1: Partial Payment Flow

### Objective
Create two payments on a single invoice: $600 and $400 to total $1000.

### Steps
1. Create an invoice with total = 100000 (paise, $1000)
2. Create payment 1 with amount = 60000 ($600)
3. Simulate success → check invoice is "partially_paid"
4. Create payment 2 with amount = 40000 ($400)
5. Simulate success → check invoice is "paid"

### Expected Behavior

**After Payment 1 Success:**
```json
Invoice {
  status: "partially_paid",
  paidAmount: 60000,
  balanceDue: 40000
}
```

**After Payment 2 Success:**
```json
Invoice {
  status: "paid",
  paidAmount: 100000,
  balanceDue: 0
}
```

### Code Hints
- You can specify amount when creating a payment (modify `createPayment` if needed)
- Each payment should have its own ID and event ID
- `balanceDue` when creating payment 2 should be 40000 (not 100000)

### Testing
```bash
# Create payment 1
curl -X POST http://localhost:3001/api/v1/invoices/inv_456/payments \
  -H "Content-Type: application/json" \
  -d '{"invoiceId": "inv_456", "amount": 60000}'

# Simulate success
curl -X POST http://localhost:3001/api/v1/payments/mock/pay_1/succeed

# Check invoice status
# SELECT status, paidAmount, balanceDue FROM invoices WHERE id = 'inv_456';
# Expected: partially_paid, 60000, 40000

# Create payment 2
curl -X POST http://localhost:3001/api/v1/invoices/inv_456/payments \
  -H "Content-Type: application/json" \
  -d '{"invoiceId": "inv_456", "amount": 40000}'

# Simulate success
curl -X POST http://localhost:3001/api/v1/payments/mock/pay_2/succeed

# Check invoice status again
# Expected: paid, 100000, 0
```

---

## Exercise 2: Duplicate Webhook Idempotency

### Objective
Verify that duplicate webhooks don't double-apply payments.

### Steps
1. Create a payment for an invoice
2. Simulate success
3. Check invoice balance (should be paid)
4. Simulate success again (same payment ID) → should be idempotent
5. Check invoice balance again (should still be paid, not doubled)

### Expected Behavior

**First success:**
```
Invoice: status="paid", paidAmount=16500
```

**Second success (duplicate):**
```
Invoice: status="paid", paidAmount=16500 (NOT 33000)
Payment.lastEventId records the event
```

### Code Hints
- The webhook service checks `lastEventId` before applying
- If `lastEventId === eventId`, it returns early
- Second call should return 200 without re-applying

### Testing
```bash
# Create payment
curl -X POST http://localhost:3001/api/v1/invoices/inv_123/payments \
  -H "Content-Type: application/json" \
  -d '{"invoiceId": "inv_123"}' \
  -s | grep -o '"id":"[^"]*"'

# Simulate success first time
curl -X POST http://localhost:3001/api/v1/payments/mock/pay_xyz/succeed

# Check invoice
# paidAmount should be 16500

# Simulate success again (duplicate)
curl -X POST http://localhost:3001/api/v1/payments/mock/pay_xyz/succeed

# Check invoice
# paidAmount should STILL be 16500 (not doubled)
```

---

## Exercise 3: Payment Failure and Retry

### Objective
Simulate a failed payment and then retry with success.

### Steps
1. Create a payment
2. Simulate failure → invoice should remain unpaid
3. Create another payment for the same invoice
4. Simulate success → invoice should now be paid

### Expected Behavior

**After Failure:**
```json
Payment 1: { status: "failed" }
Invoice: { status: "issued", paidAmount: 0, balanceDue: 16500 }
```

**After Retry Success:**
```json
Payment 2: { status: "captured" }
Invoice: { status: "paid", paidAmount: 16500, balanceDue: 0 }
```

### Code Hints
- Failed payment should NOT call `applyPaymentToInvoice()`
- Invoice status should only change on captured payment
- Two separate Payment records for two attempts

### Testing
```bash
# Create payment 1
curl -X POST http://localhost:3001/api/v1/invoices/inv_789/payments \
  -H "Content-Type: application/json" \
  -d '{"invoiceId": "inv_789"}'

# Simulate failure
curl -X POST http://localhost:3001/api/v1/payments/mock/pay_1/fail

# Check invoice
# status should be "issued", balanceDue should be full amount

# Create payment 2
curl -X POST http://localhost:3001/api/v1/invoices/inv_789/payments \
  -H "Content-Type: application/json" \
  -d '{"invoiceId": "inv_789"}'

# Simulate success
curl -X POST http://localhost:3001/api/v1/payments/mock/pay_2/succeed

# Check invoice
# status should be "paid"
```

---

## Exercise 4: Cancelled Payment

### Objective
Add support for cancelled payments (customer cancels mid-transaction).

### Enhancement
1. Add a new status: "cancelled"
2. When a payment is cancelled, invoice should remain unpaid
3. Frontend should allow cancelling a payment

### Code Changes
- Modify `PaymentWebhookService.processPaymentEvent()` to handle `status === "cancelled"`
- Add route: `POST /api/v1/payments/mock/:paymentId/cancel` for learning
- Cancelled payment should NOT apply to invoice
- Update frontend to show cancel button

### Testing
```bash
# Create payment
curl -X POST http://localhost:3001/api/v1/invoices/inv_xyz/payments \
  -H "Content-Type: application/json" \
  -d '{"invoiceId": "inv_xyz"}'

# Cancel it
curl -X POST http://localhost:3001/api/v1/payments/mock/pay_abc/cancel

# Check payment and invoice
# Payment.status = "cancelled"
# Invoice.status = "issued" (unchanged)
```

---

## Exercise 5: API Error Handling

### Objective
Test and handle edge cases and errors.

### Scenarios
1. Create payment for non-existent invoice
   - Expected: 404 NOT_FOUND
2. Create payment for already-paid invoice
   - Expected: 400 VALIDATION_ERROR
3. Get payment by invalid public ID
   - Expected: 404 NOT_FOUND
4. Fetch payments with invalid filters
   - Expected: 400 VALIDATION_ERROR

### Code Hints
- Zod schemas validate request parameters
- Services throw AppError with appropriate status codes
- errorHandler middleware formats errors consistently

### Testing
```bash
# Test 1: Non-existent invoice
curl -X POST http://localhost:3001/api/v1/invoices/invalid_id/payments \
  -H "Content-Type: application/json" \
  -d '{"invoiceId": "invalid_id"}'

# Expected response: { "error": "NOT_FOUND", "message": "Invoice invalid_id not found" }

# Test 2: Already paid invoice
# First create and pay one
curl -X POST http://localhost:3001/api/v1/invoices/inv_already_paid/payments \
  -H "Content-Type: application/json" \
  -d '{"invoiceId": "inv_already_paid"}'

curl -X POST http://localhost:3001/api/v1/payments/mock/pay_x/succeed

# Try to create another payment
curl -X POST http://localhost:3001/api/v1/invoices/inv_already_paid/payments \
  -H "Content-Type: application/json" \
  -d '{"invoiceId": "inv_already_paid"}'

# Expected: { "error": "VALIDATION_ERROR", "message": "Invoice has no outstanding balance" }

# Test 3: Invalid public ID
curl http://localhost:3001/api/v1/payments/public/status/invalid_public_id

# Expected: 404 NOT_FOUND

# Test 4: Invalid page number
curl http://localhost:3001/api/v1/payments?page=-1

# Expected: 400 VALIDATION_ERROR (Zod rejects negative page)
```

---

## Exercise 6: Unit Tests

### Objective
Write unit tests for PaymentService and PaymentWebhookService.

### Test Cases

**PaymentService**
```typescript
describe("PaymentService", () => {
  it("should create payment with public ID", async () => {
    // Arrange
    const invoiceId = "inv_123";
    const mockInvoice = { id: invoiceId, balanceDue: 16500 };

    // Act
    const payment = await paymentService.createPayment(invoiceId);

    // Assert
    expect(payment.publicId).toBeTruthy();
    expect(payment.status).toBe("created");
    expect(payment.invoiceId).toBe(invoiceId);
  });

  it("should throw error for non-existent invoice", async () => {
    // Act & Assert
    await expect(paymentService.createPayment("invalid"))
      .rejects.toThrow(NotFoundError);
  });

  it("should throw error for invoice with zero balance", async () => {
    // Arrange
    const invoiceId = "inv_paid";
    // Mock invoice with balanceDue = 0

    // Act & Assert
    await expect(paymentService.createPayment(invoiceId))
      .rejects.toThrow(ValidationError);
  });
});
```

**PaymentWebhookService**
```typescript
describe("PaymentWebhookService", () => {
  it("should apply payment on first success event", async () => {
    // Arrange
    const paymentId = "pay_xyz";
    const eventId = "evt_123";

    // Act
    await webhookService.processPaymentEvent(
      paymentId,
      eventId,
      "payment.captured",
      "captured"
    );

    // Assert
    const payment = await paymentRepository.getById(paymentId);
    expect(payment.status).toBe("captured");
    expect(payment.lastEventId).toBe(eventId);
  });

  it("should skip processing duplicate event", async () => {
    // Arrange
    const paymentId = "pay_xyz";
    const eventId = "evt_123";

    // First event
    await webhookService.processPaymentEvent(
      paymentId,
      eventId,
      "payment.captured",
      "captured"
    );

    // Duplicate event
    const result = await webhookService.processPaymentEvent(
      paymentId,
      eventId,
      "payment.captured",
      "captured"
    );

    // Assert
    expect(result.status).toBe("captured");
    // Verify invoice wasn't double-applied (check balance)
  });

  it("should not apply payment on failure", async () => {
    // Arrange
    const paymentId = "pay_xyz";
    const eventId = "evt_456";

    // Act
    await webhookService.processPaymentEvent(
      paymentId,
      eventId,
      "payment.failed",
      "failed"
    );

    // Assert
    const payment = await paymentRepository.getById(paymentId);
    expect(payment.status).toBe("failed");
    // Verify invoice remains unpaid
  });
});
```

### Running Tests
```bash
cd 07-payments-basic/backend
npm test
# or
npm test -- --watch
```

---

## Exercise 7: Frontend Integration

### Objective
Build a complete payment creation flow in the frontend.

### Enhancement
1. Add "Create Payment" button on invoice detail page
2. Show payment status in real-time
3. Allow customer to view payment link
4. Show learning controls (simulate success/failure)

### Frontend Components
```typescript
// InvoiceDetailPage.tsx
const InvoiceDetailPage = ({ invoiceId }) => {
  const dispatch = useAppDispatch();
  const [payment, setPayment] = useState(null);

  const handleCreatePayment = async () => {
    const result = await dispatch(createPayment(invoiceId));
    setPayment(result.payload);
  };

  return (
    <div>
      <InvoiceDetails invoiceId={invoiceId} />
      <button onClick={handleCreatePayment}>Create Payment</button>
      {payment && (
        <PaymentStatus
          payment={payment}
          onSuccess={() => refetch()}
          onFailure={() => refetch()}
        />
      )}
    </div>
  );
};
```

### Testing
- Create invoice
- Click "Create Payment"
- See payment status page
- Click "Simulate Success"
- Verify invoice balance updates
- See "Payment Complete" message

---

## Exercise 8: Documentation and Comments

### Objective
Add detailed JSDoc comments and README to payment module.

### Add Comments For
1. Each service method: What it does, parameters, return value, throws
2. Each contract/interface: Purpose and implementations
3. Each route: HTTP method, path, query params, response
4. Complex logic: Idempotency check, balance calculation

### Example JSDoc
```typescript
/**
 * Apply a captured payment to an invoice.
 * Updates paidAmount, balanceDue, and status based on remaining balance.
 *
 * @param invoiceId - The invoice ID to apply payment to
 * @param amount - The payment amount in paise/cents
 * @returns Invoice payment info with updated status
 * @throws {NotFoundError} If invoice doesn't exist
 *
 * @example
 * const result = await service.applyPaymentToInvoice("inv_123", 16500);
 * // Invoice status changed from "issued" to "paid"
 */
async applyPaymentToInvoice(invoiceId: string, amount: number): Promise<InvoicePaymentInfo>
```

---

## Exercise 9: Performance Optimization

### Objective
Identify and optimize database queries.

### Tasks
1. Add indexes to Payment table (status, invoiceId, customerId)
2. Batch webhook processing for multiple payments
3. Cache payment public IDs to avoid generation collisions
4. Add database query logging to identify slow operations

### Implementation Hints
```typescript
// Add indexes to Prisma schema
model Payment {
  // ...
  @@index([status])
  @@index([invoiceId])
  @@index([customerId])
}

// Use select() to fetch only needed fields
const payment = await prisma.payment.findUnique({
  where: { id },
  select: { id: true, status: true, lastEventId: true },
  // Fetch only what we need
});
```

---

## Exercise 10: Error Recovery and Retry Logic

### Objective
Add resilience for transient failures.

### Enhancement
1. Implement retry logic for failed payment gateway calls
2. Queue failed webhook events for retry
3. Implement circuit breaker pattern for provider calls
4. Add health check endpoint for payment service

### Code Hints
```typescript
// Retry with exponential backoff
async function retryWithBackoff(
  fn: () => Promise<T>,
  maxAttempts: number = 3
): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 1000));
    }
  }
}
```

---

## Challenge: Mini Project

### "Payment Status Dashboard"

Build a complete payment monitoring dashboard:

**Backend:**
- Add aggregate queries: payment count by status, total revenue
- Add filtering: date range, customer, status
- Add export: CSV of payments

**Frontend:**
- Display payment metrics (total, captured, failed)
- Show payment timeline
- Add advanced filters
- Export functionality

**Learning Outcomes:**
- End-to-end feature development
- Complex queries and aggregations
- Frontend state management at scale
- Export/reporting features

---

## Summary

By completing these exercises, you'll:
- ✓ Understand partial and full payment flows
- ✓ Verify idempotency protection
- ✓ Test error handling
- ✓ Write unit tests
- ✓ Build frontend payment UI
- ✓ Optimize for production
- ✓ Add resilience and monitoring

You're now ready to work on payment features in production BookKeepingApp!
