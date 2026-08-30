# 08 - Apply Payment to Invoice: Balance and Status Logic

## The Core Logic

When a payment is captured, we update the invoice's financial state:

```typescript
// File: InvoicePaymentApplicationService.ts
async applyPaymentToInvoice(invoiceId: string, amount: number): Promise<InvoicePaymentInfo> {
  const invoice = await this.prisma.invoice.findUnique({
    where: { id: invoiceId },
  });

  // Calculate new state
  const newPaidAmount = invoice.paidAmount + amount;
  const newBalanceDue = Math.max(0, invoice.total - newPaidAmount);
  const newStatus = newBalanceDue === 0 ? "paid" : "partially_paid";

  // Update invoice
  const updated = await this.prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      paidAmount: newPaidAmount,
      balanceDue: newBalanceDue,
      status: newStatus,
    },
  });

  return this.toPaymentInfo(updated);
}
```

---

## Step-by-Step: Full Payment Example

### Scenario: Customer pays entire invoice in one payment

**Invoice Before:**
```json
{
  "id": "inv_123",
  "number": "INV-2025-001",
  "total": 16500,        // $165.00
  "paidAmount": 0,
  "balanceDue": 16500,
  "status": "issued"
}
```

**Payment Created:**
```json
{
  "id": "pay_abc",
  "invoiceId": "inv_123",
  "amount": 16500,       // Full balance
  "status": "created"
}
```

**After Payment Captured (processPaymentEvent called):**

```typescript
// Called from PaymentWebhookService
await this.invoicePaymentApplicationService.applyPaymentToInvoice(
  "inv_123",    // invoiceId
  16500         // payment amount
);
```

**Calculation:**
```typescript
newPaidAmount = 0 + 16500 = 16500
newBalanceDue = Math.max(0, 16500 - 16500) = 0
newStatus = balanceDue === 0 ? "paid" : "partially_paid"
          = 0 === 0 ? "paid" : "partially_paid"
          = "paid"
```

**Invoice After:**
```json
{
  "id": "inv_123",
  "number": "INV-2025-001",
  "total": 16500,        // ← Unchanged (immutable)
  "paidAmount": 16500,   // ← Updated
  "balanceDue": 0,       // ← Updated
  "status": "paid"       // ← Updated
}
```

---

## Step-by-Step: Partial Payment Example

### Scenario: Customer pays $600 toward a $1000 invoice

**Invoice Before:**
```json
{
  "id": "inv_456",
  "number": "INV-2025-002",
  "total": 100000,       // $1000.00
  "paidAmount": 0,
  "balanceDue": 100000,
  "status": "issued"
}
```

**Payment 1 Created:**
```json
{
  "id": "pay_partial_1",
  "invoiceId": "inv_456",
  "amount": 60000,       // $600 (customer chooses)
  "status": "created"
}
```

**After Payment 1 Captured:**

```typescript
applyPaymentToInvoice("inv_456", 60000);
```

**Calculation:**
```typescript
newPaidAmount = 0 + 60000 = 60000
newBalanceDue = Math.max(0, 100000 - 60000) = 40000
newStatus = 40000 === 0 ? "paid" : "partially_paid"
          = "partially_paid"
```

**Invoice After Payment 1:**
```json
{
  "id": "inv_456",
  "total": 100000,
  "paidAmount": 60000,       // ← Customer paid $600
  "balanceDue": 40000,       // ← $400 remains
  "status": "partially_paid" // ← New status
}
```

**Payment 2 Created (for remaining balance):**
```json
{
  "id": "pay_partial_2",
  "invoiceId": "inv_456",
  "amount": 40000,       // $400 (exact remaining balance)
  "status": "created"
}
```

**After Payment 2 Captured:**

```typescript
applyPaymentToInvoice("inv_456", 40000);
```

**Calculation:**
```typescript
newPaidAmount = 60000 + 40000 = 100000
newBalanceDue = Math.max(0, 100000 - 100000) = 0
newStatus = 0 === 0 ? "paid" : "partially_paid"
          = "paid"
```

**Invoice After Payment 2:**
```json
{
  "id": "inv_456",
  "total": 100000,
  "paidAmount": 100000,  // ← Full amount paid
  "balanceDue": 0,       // ← No balance
  "status": "paid"       // ← Back to paid
}
```

---

## Edge Case: Overpayment (Should Not Happen)

If somehow `paidAmount > total`:

```typescript
newBalanceDue = Math.max(0, invoice.total - newPaidAmount);
              = Math.max(0, 100000 - 110000)
              = Math.max(0, -10000)
              = 0  // ← Math.max ensures non-negative
```

We use `Math.max(0, ...)` to prevent negative balances.

---

## Status Transition Diagram

```
                          (any payment created)
                                 ↓
                     ┌────────────────────────┐
                     │   Invoice: "issued"    │
                     │   balanceDue: 100000   │
                     └────────────────────────┘
                                 ↓
                        (payment 1 captured)
                                 ↓
                  ┌──────────────────────────────┐
                  │  Invoice: "partially_paid"   │
                  │  paidAmount: 60000           │
                  │  balanceDue: 40000           │
                  └──────────────────────────────┘
                                 ↓
                        (payment 2 captured)
                                 ↓
                  ┌──────────────────────────────┐
                  │  Invoice: "paid"             │
                  │  paidAmount: 100000          │
                  │  balanceDue: 0               │
                  └──────────────────────────────┘
```

---

## API Response: Before and After

### Frontend Fetches Payment Status

**Request:**
```
GET /api/v1/payments/public/status/PAY-XXXX-YYYY
```

**Response (Before Capture):**
```json
{
  "id": "pay_abc",
  "publicId": "PAY-XXXX-YYYY",
  "status": "created",
  "amount": 16500,
  "invoiceId": "inv_123",
  "paidAmount": 0,          // Invoice still unpaid
  "balanceDue": 16500,      // Full balance due
  "invoiceStatus": "issued" // Invoice awaiting payment
}
```

**Response (After Capture):**
```json
{
  "id": "pay_abc",
  "publicId": "PAY-XXXX-YYYY",
  "status": "captured",
  "amount": 16500,
  "invoiceId": "inv_123",
  "paidAmount": 16500,      // ← Invoice now shows payment received
  "balanceDue": 0,          // ← No balance due
  "invoiceStatus": "paid"   // ← Invoice marked paid
}
```

---

## Business Logic: When to Apply Payment

In `PaymentWebhookService.processPaymentEvent()`:

```typescript
if (status === "captured") {
  // ✓ Only apply if payment was successful
  await this.invoicePaymentApplicationService.applyPaymentToInvoice(...);
}

if (status === "failed") {
  // ✓ Do NOT apply if payment failed
  // Invoice remains unpaid, customer can retry
}

if (status === "cancelled") {
  // ✓ Do NOT apply if payment was cancelled
  // Invoice remains unpaid
}
```

---

## Testing in Learning Module

### Create Payment
```bash
curl -X POST http://localhost:3001/api/v1/invoices/inv_123/payments \
  -H "Content-Type: application/json" \
  -d '{"invoiceId": "inv_123"}'
```

Response:
```json
{
  "id": "pay_xyz",
  "publicId": "PAY-XXXX-YYYY",
  "status": "created"
}
```

### Check Invoice Status (Before)
```bash
# Backend database query or frontend API
SELECT total, paidAmount, balanceDue, status FROM invoices WHERE id = 'inv_123';

# Result:
# total: 16500, paidAmount: 0, balanceDue: 16500, status: "issued"
```

### Simulate Payment Success
```bash
curl -X POST http://localhost:3001/api/v1/payments/mock/pay_xyz/succeed
```

Response:
```json
{
  "status": "captured"
}
```

### Check Invoice Status (After)
```bash
SELECT total, paidAmount, balanceDue, status FROM invoices WHERE id = 'inv_123';

# Result:
# total: 16500, paidAmount: 16500, balanceDue: 0, status: "paid"
```

---

## Key Formulas

```typescript
// Always true
total = invoice.total;                    // Never changes once issued

// Applied when payment captured
paidAmount = sum of all captured payments;
balanceDue = total - paidAmount;

// Never negative
balanceDue = Math.max(0, total - paidAmount);

// Status logic
if (balanceDue === 0) status = "paid"
else if (paidAmount > 0) status = "partially_paid"
else status = "issued"
```

Next: [09 - Frontend Payment State](09-frontend-payment-state.md)
