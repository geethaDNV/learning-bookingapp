# 02 - Payment Status vs Invoice Status

## Two Independent State Machines

Payments and invoices have separate status lifecycles. **This is critical.** A payment being captured does not automatically mark the invoice as paid—we must explicitly apply the payment to the invoice.

### Payment Status States

```
created
  ↓
pending  (payment provider is processing)
  ↓
├─→ captured (success, customer paid)
└─→ failed (customer declined or provider error)

cancelled (payment was not finalized)
```

### Invoice Status States

```
draft (not sent to customer)
  ↓
issued (sent to customer, awaiting payment)
  ↓
├─→ partially_paid (some payment received)
│    ↓
│    ├─→ paid (balance due = 0)
│    └─→ cancelled
├─→ paid (full payment in one go)
└─→ cancelled (invoice void)
```

## Example: Creating a Payment on an Invoice

### Starting State
```json
Invoice {
  id: "inv_123",
  number: "INV-2025-001",
  status: "issued",
  total: 16500,         // $165.00
  paidAmount: 0,
  balanceDue: 16500
}
```

### After Creating Payment
```json
Payment {
  id: "pay_abc",
  publicId: "PAY-XXXX-YYYY",
  status: "created",    // Just created, waiting for customer
  invoiceId: "inv_123",
  amount: 16500,        // Full invoice balance
  providerPaymentId: "mock_pay_xyz",
  createdAt: "2025-01-15T10:00:00Z"
}

Invoice {
  // Unchanged! No payment yet.
  status: "issued",
  balanceDue: 16500
}
```

The invoice remains unchanged because:
- The **payment** is waiting for the customer to pay
- The **invoice** is still awaiting payment
- Until the payment is captured (customer paid), we don't apply it

### After Customer Pays (Simulated Success)

Frontend hits `POST /api/v1/payments/mock/:paymentId/succeed`:

```json
Payment {
  id: "pay_abc",
  status: "captured",   // Customer paid!
  invoiceId: "inv_123",
  amount: 16500,
  updatedAt: "2025-01-15T10:05:00Z"
}

Invoice {
  // NOW we update it
  status: "paid",       // Changed!
  paidAmount: 16500,    // Added
  balanceDue: 0         // Reduced
}
```

## Key Insight: Eventual Consistency

In a real payment flow:

1. **T=0s**: Customer clicks "Pay" → app calls Razorpay API → returns payment link
   - Payment status: `created`
   - Invoice status: `issued`

2. **T=30s**: Customer fills card details and clicks "Pay" on Razorpay
   - Payment still `created` (customer is on Razorpay's page, our app doesn't know yet)
   - Invoice still `issued`

3. **T=32s**: Razorpay processes the payment and sends webhook to our app
   - Payment status updated to `captured`
   - Invoice updated to `paid` (now that we know the payment succeeded)

This gap (step 2 to step 3) is why:
- We can't trust payment status immediately
- We need idempotent webhooks (Razorpay might send the webhook twice)
- We need eventual consistency (the invoice catches up to the payment event)

## Why This Matters for Partial Payments

Suppose an invoice is for $1000 and the customer pays $600:

```json
Payment 1: {
  status: "captured",
  amount: 60000  // $600
}

Invoice {
  total: 100000,         // $1000
  paidAmount: 60000,     // $600 (from Payment 1)
  balanceDue: 40000,     // $400 remaining
  status: "partially_paid"
}

Payment 2: {
  status: "created",
  amount: 40000  // $400 (for remaining balance)
}
```

After Payment 2 is captured:

```json
Invoice {
  total: 100000,
  paidAmount: 100000,    // $600 + $400
  balanceDue: 0,
  status: "paid"
}
```

## Summary Table

| Scenario | Payment Status | Invoice Status | Invoice Balance |
|----------|---|---|---|
| Created but not paid | `created` | `issued` | Full amount due |
| Customer pays full | `captured` | `paid` | $0 |
| Customer pays partial | `captured` | `partially_paid` | Remaining amount |
| Payment fails | `failed` | `issued` | Full amount due |
| Two partial payments | (2×`captured`) | `paid` | $0 after second capture |

Next: [03 - Payment Data Model](03-payment-data-model.md)
