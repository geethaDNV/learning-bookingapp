# 04. Create Payment Link Flow

End-to-end walkthrough: from invoice to hosted payment link.

## The User Journey

```
1. [Frontend] User clicks "Create Payment Link" on invoice
        ↓
2. [API] POST /api/v1/payments with invoiceId
        ↓
3. [Backend] PaymentService.createPaymentLink()
        ↓
4. [Provider] Call gatewayProvider.createHostedLink()
        ↓
5. [Razorpay API] Create link, return hosted URL
        ↓
6. [Backend] Store payment record with link ID
        ↓
7. [Frontend] Show link, send customer to Razorpay
        ↓
8. [Customer] Fills payment form, enters card, pays
        ↓
9. [Razorpay] Sends webhook to your server
```

## Code Walkthrough

### Step 1: Frontend Makes Request

```typescript
// frontend/src/components/CreatePaymentLinkForm.tsx
const handleCreatePaymentLink = async () => {
  const payment = await paymentApiService.createPaymentLink(invoiceId);
  // payment = { id, hostedUrl, publicId, status, ... }
  
  // Send customer to payment link
  window.location.href = payment.hostedUrl;
};
```

Request sent:
```bash
POST /api/v1/payments
Content-Type: application/json

{
  "invoiceId": "cuid-uuid-123"
}
```

### Step 2: Backend Routes Request

```typescript
// backend/src/routes/paymentRoutes.ts
router.post("/", async (req, res, next) => {
  await paymentController.createPaymentLink(req, res);
});
```

### Step 3: Controller Validates Input

```typescript
// backend/src/controllers/PaymentController.ts
async createPaymentLink(req: Request, res: Response) {
  const body = createPaymentLinkSchema.parse(req.body);
  // Validation: invoiceId must be valid UUID
  
  const payment = await this.paymentService.createPaymentLink(body.invoiceId);
  
  res.status(201).json({
    success: true,
    data: payment
  });
}
```

### Step 4: Service Fetches Invoice

```typescript
// backend/src/services/PaymentService.ts
async createPaymentLink(invoiceId: string): Promise<PaymentDTO> {
  // 1. Get invoice from database
  const invoice = await this.prisma.invoice.findUnique({
    where: { id: invoiceId }
  });
  
  if (!invoice) {
    throw new NotFoundError(`Invoice not found: ${invoiceId}`);
  }

  // 2. Get customer details
  const customer = await this.prisma.customer.findUnique({
    where: { id: invoice.customerId }
  });

  // ... validation continues
}
```

### Step 5: Service Calls Provider

```typescript
// Still in PaymentService.ts
// Generate a unique public ID for status page
const publicId = await this.paymentNumberService.generatePublicId();

// Call provider (could be Mock or Razorpay)
const hostedLinkResult = await this.gatewayProvider.createHostedLink({
  amount: invoice.amount,
  currency: invoice.currency || "INR",
  invoiceNumber: invoice.invoiceNumber,
  invoiceId,
  customerId: invoice.customerId,
  customerName: customer.name,
  customerEmail: customer.email,
  customerContact: customer.phone,
  idempotencyKey: publicId
});

// Result includes:
// - hostedUrl: "https://rzp.io/l/abc123" or mock URL
// - providerLinkId: "plink_abc" or mock ID
// - metadata: { invoiceId, customerId, ... }
```

### Step 6a: Mock Provider Implementation

```typescript
// backend/src/services/MockPaymentGatewayProvider.ts
async createHostedLink(input: CreateHostedLinkInput): Promise<HostedLinkResult> {
  // No external call, just generate local data
  const providerPaymentId = generateMockProviderPaymentId();
  const providerLinkId = generateMockProviderLinkId();
  const hostedUrl = generateMockHostedUrl();
  
  return {
    provider: "mock",
    providerLinkId,
    hostedUrl,
    metadata: {
      providerPaymentId,
      invoiceId: input.invoiceId,
      customerId: input.customerId,
      idempotencyKey: input.idempotencyKey
    }
  };
}
```

**Mock Response:**
```json
{
  "provider": "mock",
  "providerLinkId": "link_1692864000",
  "hostedUrl": "http://localhost:3001/pay/mock/1692864000",
  "metadata": { "invoiceId": "...", ... }
}
```

### Step 6b: Razorpay Implementation

```typescript
// backend/src/services/RazorpayGatewayProvider.ts
async createHostedLink(input: CreateHostedLinkInput): Promise<HostedLinkResult> {
  // HTTPS call to Razorpay API
  const link = await client.paymentLink.create({
    amount: Math.round(input.amount * 100), // Important: paise not rupees!
    currency: input.currency,
    reference_id: input.idempotencyKey,     // For idempotency
    description: `Invoice ${input.invoiceNumber}`,
    customer: {
      name: input.customerName || input.invoiceNumber,
      email: input.customerEmail || "",
      contact: input.customerContact || ""
    },
    notify: { email: Boolean(input.customerEmail), sms: false },
    notes: {
      invoiceId: input.invoiceId,
      customerId: input.customerId,
      invoiceNumber: input.invoiceNumber,
      idempotencyKey: input.idempotencyKey
    }
  });

  return {
    provider: "razorpay",
    providerLinkId: link.id,
    hostedUrl: link.short_url,
    metadata: {
      invoiceId: input.invoiceId,
      customerId: input.customerId,
      invoiceNumber: input.invoiceNumber,
      idempotencyKey: input.idempotencyKey
    }
  };
}
```

**Razorpay Response:**
```json
{
  "provider": "razorpay",
  "providerLinkId": "plink_1234567890",
  "hostedUrl": "https://rzp.io/l/abcd1234",
  "metadata": { "invoiceId": "...", ... }
}
```

### Step 7: Service Stores Payment Record

```typescript
// Back in PaymentService.ts
const providerPaymentId = String(hostedLinkResult.metadata.providerPaymentId || "unknown");
const providerLinkId = hostedLinkResult.providerLinkId;

// Save to database
const payment = await this.paymentRepository.create(
  invoiceId,                          // Which invoice
  invoice.customerId,                 // Which customer
  invoice.amount,                     // Amount to collect
  invoice.currency || "INR",          // Currency
  publicId,                           // Public ID for status page
  providerPaymentId,                  // Provider's payment ID
  providerLinkId,                     // Provider's link ID
  hostedLinkResult.hostedUrl,         // URL to send customer
  this.gatewayProvider.provider       // Which provider ("mock" or "razorpay")
);

// Saved payment record:
// {
//   id: "pay_123",
//   invoiceId: "inv_456",
//   publicId: "pay_abc123",
//   hostedUrl: "https://rzp.io/...",
//   status: "PENDING",
//   provider: "razorpay"
// }
```

### Step 8: Controller Returns Response

```typescript
res.status(201).json({
  success: true,
  message: "Payment link created successfully",
  data: {
    id: "pay_123",
    publicId: "pay_abc123",
    hostedUrl: "https://rzp.io/l/abcd1234",
    status: "PENDING",
    provider: "razorpay",
    amount: 5000,
    currency: "INR",
    createdAt: "2024-08-30T10:30:00Z"
  }
});
```

### Step 9: Frontend Redirects Customer

```typescript
// After receiving response
window.location.href = payment.hostedUrl;
// Customer goes to Razorpay hosted page
```

**What customer sees:**
```
┌─────────────────────────────────────┐
│  Razorpay Secure Payment Form       │
├─────────────────────────────────────┤
│ Invoice: INV-001                    │
│ Amount: ₹5,000                      │
│ Merchant: Your Company              │
├─────────────────────────────────────┤
│ Card Number:  [______________]      │
│ Expiry:       [__] / [__]           │
│ CVV:          [___]                 │
│                                     │
│ [  Pay Now  ]  [  Cancel  ]         │
└─────────────────────────────────────┘
```

## Critical Details

### Amount in Paise (Razorpay)

```typescript
// WRONG: Razorpay expects paise (1/100th)
await client.paymentLink.create({ amount: 5000 });  // 5000 paise = ₹50

// RIGHT:
await client.paymentLink.create({ 
  amount: Math.round(5000 * 100) // 500000 paise = ₹5000
});
```

### Idempotency Key

```typescript
// If payment link creation fails and retries:
// 1st call: creates link with ID "plink_abc"
// 2nd call (retry): returns same "plink_abc" (doesn't create new)

// This is why we use idempotencyKey with unique publicId
const publicId = await this.paymentNumberService.generatePublicId();
const link = await client.paymentLink.create({
  reference_id: publicId  // Razorpay uses this for idempotency
});
```

### Metadata Storage

```typescript
// Store invoice/customer info in payment notes
// When webhook arrives, we need to know which invoice to update
notes: {
  invoiceId: input.invoiceId,
  customerId: input.customerId,
  invoiceNumber: input.invoiceNumber
}

// In webhook handler, extract from event.metadata
```

## Database State After Creation

```sql
-- Invoice
SELECT * FROM invoices WHERE id = 'inv_456';
-- Returns: amount=5000, balanceDue=5000, paidAmount=0, status='SENT'

-- Payment (newly created)
SELECT * FROM payments WHERE id = 'pay_123';
-- Returns: 
--   invoiceId='inv_456'
--   publicId='pay_abc123'
--   providerLinkId='plink_1234567890'
--   hostedUrl='https://rzp.io/l/abcd1234'
--   status='PENDING'
--   provider='razorpay'
```

## Error Handling

### What Can Go Wrong?

```typescript
// 1. Invoice not found
if (!invoice) {
  throw new NotFoundError(`Invoice not found: ${invoiceId}`);
}

// 2. Razorpay API down
try {
  const link = await client.paymentLink.create(...);
} catch (error) {
  throw new ValidationError(`Failed to create Razorpay link: ${error.message}`);
}

// 3. Invalid amount
if (invoice.amount <= 0) {
  throw new ValidationError("Invoice amount must be greater than 0");
}
```

## Next Steps

- **What happens next?** Read `05-webhook-signature-verification.md`
- **Want to test it?** Use mock provider (no keys needed) or setup Razorpay sandbox
