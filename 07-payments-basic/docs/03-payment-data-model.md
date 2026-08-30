# 03 - Payment Data Model

## Core Entities

### Payment

```prisma
model Payment {
  id       String  @id @default(cuid())
  publicId String  @unique                    // User-facing ID for public status page
  status   String  @default("created")         // created, pending, captured, failed, cancelled

  invoiceId String                            // Which invoice is this payment for?
  invoice   Invoice @relation(...)

  customerId String                           // Who is paying?
  customer   Customer @relation(...)

  amount Float                                // Amount in paise/cents

  // Provider info (e.g., Razorpay)
  providerPaymentId String?                   // ID returned by payment provider
  providerName      String  @default("mock")  // "mock", "razorpay", "stripe", etc

  // Idempotency tracking
  lastEventId String?                         // Last processed webhook event ID

  // Related events
  paymentEvents PaymentEvent[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### PaymentEvent

```prisma
model PaymentEvent {
  id        String @id @default(cuid())
  paymentId String
  payment   Payment @relation(...)

  eventId    String  @unique                  // Provider's event ID (for idempotency)
  eventType  String                           // "payment.created", "payment.captured", "payment.failed"
  status     String                           // "pending", "processed", "failed"
  payload    String                           // Raw JSON of webhook payload
  processed  Boolean @default(false)
  error      String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Updated Invoice

```prisma
model Invoice {
  id       String  @id
  number   String  @unique
  status   String  @default("draft")          // draft, issued, partially_paid, paid, cancelled

  customerId String
  customer   Customer @relation(...)

  subtotal  Float  @default(0)
  taxAmount Float  @default(0)
  total     Float  @default(0)

  // NEW: Payment tracking
  paidAmount Float  @default(0)               // Total paid so far
  balanceDue Float  @default(0)               // Remaining to pay

  invoiceLines InvoiceLine[]
  payments     Payment[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

## Key Fields Explained

### `publicId` (Payment)

- **Purpose**: User-facing payment ID for public status pages
- **Format**: `PAY-{timestamp}-{random}` e.g., `PAY-GRFY5LE-ABCD`
- **Why**: The internal `id` is a CUID and not user-friendly. We generate a short public ID for customer communication.
- **Usage**: Customers see `PAY-GRFY5LE-ABCD` in emails and receipts

### `providerPaymentId` (Payment)

- **Purpose**: Maps our payment to the provider's payment
- **Example**: Razorpay returns `pay_123456789abc` for a payment link
- **Why**: When Razorpay sends a webhook, it includes their ID so we know which payment they're talking about
- **Nullable**: Yes, we may not have this immediately after creation

### `status` (Payment)

- **created**: We just created the payment, waiting for customer
- **pending**: Customer is on the payment page (rare state, mostly for learning)
- **captured**: Payment succeeded, customer paid
- **failed**: Payment failed, customer declined or provider error
- **cancelled**: We or customer cancelled the payment

### `eventId` (PaymentEvent)

- **Purpose**: Provider's unique event ID for idempotency
- **Example**: `evt_1A2B3C4D5E6F` from Razorpay
- **Why**: If Razorpay sends the same webhook twice, we check `eventId` and skip if we've already processed it

### `paidAmount` and `balanceDue` (Invoice)

- **paidAmount**: Sum of all captured payments on this invoice
- **balanceDue**: `total - paidAmount`
- **Why**: Customers need to know how much is left to pay
- **Calculation**:
  ```
  balanceDue = total - paidAmount
  if balanceDue <= 0:
    status = "paid"
  elif paidAmount > 0:
    status = "partially_paid"
  else:
    status = "issued"
  ```

## Payment Flow Lifecycle

### 1. Invoice Created
```
Invoice { total: 10000, paidAmount: 0, balanceDue: 10000, status: "issued" }
```

### 2. Payment Created
```
Payment { id: "pay_1", status: "created", amount: 10000, providerPaymentId: "mock_pay_xyz" }
```

### 3. Customer Pays (Webhook Received)
```
PaymentEvent { eventId: "evt_123", paymentId: "pay_1", status: "processed" }
```

### 4. Service Processes Webhook
```
// In PaymentWebhookService
- Check lastEventId to avoid duplicate
- Update Payment { status: "captured" }
- Call InvoicePaymentApplicationService.applyPaymentToInvoice()
  - paidAmount += 10000
  - balanceDue = 0
  - status = "paid"
```

## Relationship Diagram

```
Customer
  ├─→ Invoice
  │    ├─→ paidAmount (sum of captured payments)
  │    ├─→ balanceDue (total - paidAmount)
  │    └─→ status (issued → partially_paid → paid)
  │
  └─→ Payment
       ├─→ status (created → captured/failed)
       ├─→ amount (full or partial)
       ├─→ providerPaymentId (Razorpay ID)
       └─→ PaymentEvent (webhook audit trail)
```

## Data Consistency Rules

1. **Invoice total is immutable** (once issued)
2. **paidAmount can only increase** (or reset on refund, not covered here)
3. **balanceDue = total - paidAmount** (always recalculated)
4. **Payment amount ≤ Invoice balanceDue** (can't overpay, or can with customer agreement)
5. **eventId is globally unique** (across all payments)
6. **lastEventId is per-payment** (tracks which webhook we last processed)

Next: [04 - Provider Abstraction](04-provider-abstraction.md)
