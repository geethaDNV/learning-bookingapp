# 05 - Create Payment Flow: Step by Step

## Overview

Creating a payment is the first step. Let's trace what happens when a frontend calls:

```javascript
POST /api/v1/invoices/inv_123/payments
{
  "invoiceId": "inv_123"
}
```

## Step 1: HTTP Request → Controller

**File**: `src/controllers/PaymentController.ts`

```typescript
createPayment = asyncHandler(async (req: Request, res: Response) => {
  // Parse request body
  const validated = CreatePaymentSchema.parse(req.body);
  // ✓ Ensures invoiceId is a non-empty string

  // Delegate to service
  const payment = await this.paymentService.createPayment(validated.invoiceId);

  // Return response
  sendResponse(res, 201, "Payment created successfully", {
    id: payment.id,
    publicId: payment.publicId,
    status: payment.status,
    amount: payment.amount,
    providerPaymentId: payment.providerPaymentId,
    invoiceId: payment.invoiceId,
  });
});
```

**What happens:**
1. Zod schema validates the request (throws ValidationError if invalid)
2. Passes to service
3. Returns 201 with payment details

---

## Step 2: Service - Fetch Invoice

**File**: `src/services/PaymentService.ts`

```typescript
async createPayment(invoiceId: string): Promise<PaymentDTO> {
  // Step 2: Fetch invoice to validate
  const invoice = await this.prisma.invoice.findUnique({
    where: { id: invoiceId },
  });

  if (!invoice) {
    throw new NotFoundError(`Invoice ${invoiceId} not found`);
  }

  if (invoice.balanceDue <= 0) {
    throw new ValidationError("Invoice has no outstanding balance");
  }
```

**Checks:**
- ✓ Invoice exists
- ✓ Invoice has a positive balance (not already paid)

**State at this point:**
```json
Invoice {
  id: "inv_123",
  number: "INV-2025-001",
  total: 16500,
  paidAmount: 0,
  balanceDue: 16500,
  customerId: "cust_abc"
}
```

---

## Step 3: Service - Generate Public ID

```typescript
  // Step 3: Generate user-friendly public ID
  const publicId = await this.paymentNumberService.generatePublicId();
  // Result: "PAY-GRFY5LE-ABCD"
```

**Why:**
- Customers see this ID in emails/receipts
- Internal `id` (CUID) is not user-friendly

---

## Step 4: Service - Create Payment Record (Step 1)

```typescript
  // Step 4: Create payment in database
  const tempProviderPaymentId = `temp_${uuidv4()}`;

  const payment = await this.paymentRepository.create(
    invoiceId,           // "inv_123"
    invoice.customerId,  // "cust_abc"
    invoice.balanceDue,  // 16500 (full balance)
    publicId,            // "PAY-GRFY5LE-ABCD"
    tempProviderPaymentId // Placeholder
  );
```

**Database state (Payment table):**
```json
{
  "id": "pay_xyz",
  "publicId": "PAY-GRFY5LE-ABCD",
  "status": "created",
  "invoiceId": "inv_123",
  "customerId": "cust_abc",
  "amount": 16500,
  "providerPaymentId": "temp_...",
  "createdAt": "2025-01-15T10:00:00Z"
}
```

**Invoice is unchanged** (payment hasn't been captured yet).

---

## Step 5: Service - Call Payment Gateway

```typescript
  // Step 5: Ask mock provider to create payment intent
  const { providerPaymentId } = await this.gatewayProvider.createPaymentIntent(
    payment.id,         // "pay_xyz"
    invoice.balanceDue, // 16500
    `Invoice ${invoice.number}` // "Invoice INV-2025-001"
  );
```

**MockPaymentGatewayProvider does:**
```typescript
async createPaymentIntent(paymentId, amount, description) {
  const providerPaymentId = `mock_pay_${uuidv4()}`;
  // In production, Razorpay would return: pay_ABC123XYZ

  const paymentLink = `http://localhost:3001/api/v1/payments/public/status/${paymentId}`;
  // In production, Razorpay would return: https://rzp.io/i/ABC123

  return { providerPaymentId, paymentLink };
}
```

**Result:**
```json
{
  "providerPaymentId": "mock_pay_9a8b7c6d-5e4f-3g2h-1i0j",
  "paymentLink": "http://localhost:3001/api/v1/payments/public/status/pay_xyz"
}
```

---

## Step 6: Service - Update Payment with Provider ID

```typescript
  // Step 6: Update payment record with real provider ID
  const updatedPayment = await this.paymentRepository.updateProviderPaymentId(
    payment.id,         // "pay_xyz"
    providerPaymentId   // "mock_pay_..."
  );

  return updatedPayment;
```

**Final Payment state:**
```json
{
  "id": "pay_xyz",
  "publicId": "PAY-GRFY5LE-ABCD",
  "status": "created",
  "invoiceId": "inv_123",
  "customerId": "cust_abc",
  "amount": 16500,
  "providerPaymentId": "mock_pay_9a8b7c6d-5e4f-3g2h-1i0j",
  "providerName": "mock",
  "createdAt": "2025-01-15T10:00:00Z",
  "updatedAt": "2025-01-15T10:00:00Z"
}
```

---

## Step 7: Controller - Return Response

```typescript
sendResponse(res, 201, "Payment created successfully", {
  id: payment.id,
  publicId: payment.publicId,
  status: payment.status,
  amount: payment.amount,
  providerPaymentId: payment.providerPaymentId,
  invoiceId: payment.invoiceId,
  message: "Payment ready for processing",
});
```

**HTTP Response:**
```json
{
  "message": "Payment created successfully",
  "data": {
    "id": "pay_xyz",
    "publicId": "PAY-GRFY5LE-ABCD",
    "status": "created",
    "amount": 16500,
    "providerPaymentId": "mock_pay_9a8b7c6d-5e4f-3g2h-1i0j",
    "invoiceId": "inv_123",
    "message": "Payment ready for processing"
  }
}
```

---

## Full Sequence Diagram

```
Frontend                  Controller              Service              Provider        Database
  │                          │                       │                    │               │
  ├─ POST /payments ────────>│                       │                    │               │
  │                          │                       │                    │               │
  │                          ├─ validate ─────────────────────────────────────────────────┤
  │                          │                       │                    │               │
  │                          ├─ call createPayment ──→                    │               │
  │                          │                       │                    │               │
  │                          │                       ├─ fetch invoice ─────────────────────→
  │                          │                       │                    │               │
  │                          │                       ←─ invoice data ─────────────────────┤
  │                          │                       │                    │               │
  │                          │                       ├─ generate publicId │               │
  │                          │                       │                    │               │
  │                          │                       ├─ create payment ─────────────────────→
  │                          │                       │                    │               │
  │                          │                       ←─ payment ──────────────────────────┤
  │                          │                       │                    │               │
  │                          │                       ├─ call provider.createPaymentIntent │
  │                          │                       ├──────────────────────→             │
  │                          │                       │                    │               │
  │                          │                       ←──────────────────────┤             │
  │                          │                       │ {providerPaymentId}  │             │
  │                          │                       │                    │               │
  │                          │                       ├─ update payment ────────────────────→
  │                          │                       │                    │               │
  │                          │                       ←─ updated payment ────────────────────┤
  │                          │                       │                    │               │
  │                          ←─ paymentDTO ─────────│                    │               │
  │                          │                       │                    │               │
  │←─ 201 Created ─────────────│                       │                    │               │
  │  { payment details }       │                       │                    │               │
  │                            │                       │                    │               │
```

---

## Error Scenarios

### Scenario 1: Invoice Not Found
```
HTTP 404
{
  "message": "Invoice inv_xxx not found",
  "error": "NOT_FOUND"
}
```

### Scenario 2: Invoice Already Paid
```
HTTP 400
{
  "message": "Invoice has no outstanding balance",
  "error": "VALIDATION_ERROR"
}
```

### Scenario 3: Invalid Request Body
```
HTTP 400
{
  "message": "invoiceId is required",
  "error": "VALIDATION_ERROR"
}
```

---

## Next Steps

At this point:
- ✓ Payment is created with status `created`
- ✓ Provider has been called (mock or real)
- ✓ Payment link/intent is ready for customer

The customer now visits the payment link or our frontend calls it. After payment, we need to **process the success/failure webhook**.

See: [06 - Mock Webhook Flow](06-mock-webhook-flow.md)
