# 10. Contract Trace: End-to-End Request Flow

Detailed trace of a single payment from start to finish, showing how all components interact.

## Scenario

User creates payment for invoice INV-001 (₹5,000), customer pays successfully.

## Step-by-Step Trace

### Step 1: Frontend Creates Payment Link

```
┌──── Frontend ────────────────────────────────┐
│                                              │
│  User clicks: "Create Payment Link"          │
│                                              │
│  Code:                                       │
│  const payment = await paymentApiService    │
│    .createPaymentLink("inv-uuid-123")       │
│                                              │
│  HTTP:                                       │
│  POST /api/v1/payments                       │
│  Content-Type: application/json              │
│  Accept: application/json                    │
│                                              │
│  Body:                                       │
│  {                                           │
│    "invoiceId": "inv-uuid-123"              │
│  }                                           │
│                                              │
└──────────────────┬───────────────────────────┘
                   │ (1)
                   ▼
```

### Step 2: Backend Routes Request

```
┌──── Backend Routes ──────────────────────────┐
│                                              │
│  // backend/src/routes/paymentRoutes.ts     │
│  router.post("/", async (req, res) => {     │
│    await paymentController                  │
│      .createPaymentLink(req, res);          │
│  });                                         │
│                                              │
└──────────────────┬───────────────────────────┘
                   │ (2)
                   ▼
```

### Step 3: Controller Validates

```
┌──── PaymentController ────────────────────────┐
│                                               │
│  async createPaymentLink(req, res) {         │
│    const body = createPaymentLinkSchema      │
│      .parse(req.body);                       │
│    // Validates invoiceId is UUID            │
│                                               │
│    const payment =                           │
│      await this.paymentService               │
│        .createPaymentLink(body.invoiceId);  │
│  }                                            │
│                                               │
└──────────────────┬───────────────────────────┘
                   │ (3)
                   ▼
```

### Step 4: Service Fetches Invoice

```
┌──── PaymentService ─────────────────────────────────┐
│                                                     │
│  async createPaymentLink(invoiceId: string) {      │
│                                                     │
│    // 4.1: Get invoice from database              │
│    const invoice =                                 │
│      await this.prisma.invoice.findUnique({       │
│        where: { id: "inv-uuid-123" }              │
│      });                                           │
│                                                     │
│    // Database: SELECT * FROM invoices             │
│    //           WHERE id = 'inv-uuid-123'         │
│                                                     │
│    // Returns:                                      │
│    // {                                             │
│    //   id: "inv-uuid-123",                        │
│    //   invoiceNumber: "INV-001",                  │
│    //   amount: 5000,                              │
│    //   currency: "INR",                           │
│    //   customerId: "cust-456",                    │
│    //   status: "SENT"                             │
│    // }                                             │
│                                                     │
│    // 4.2: Check if invoice exists                │
│    if (!invoice) throw new NotFoundError(...)     │
│                                                     │
│    // 4.3: Get customer                           │
│    const customer =                                │
│      await this.prisma.customer.findUnique({      │
│        where: { id: invoice.customerId }          │
│      });                                           │
│                                                     │
│    // Returns: { id, name, email, phone }         │
│                                                     │
└──────────────────┬────────────────────────────────┘
                   │ (4)
                   ▼
```

### Step 5: Service Generates Public ID

```
┌──── PaymentNumberService ─────────────────┐
│                                            │
│  async generatePublicId() {               │
│    return `pay_${Date.now()}_           │
│      ${Math.random().toString(36)...}`;  │
│  }                                         │
│                                            │
│  // Returns: "pay_1693395000123_abc45"   │
│                                            │
└──────────────────┬────────────────────────┘
                   │ (5)
                   ▼
```

### Step 6: Service Calls Gateway Provider

```
┌──── PaymentService (cont'd) ─────────────────────────┐
│                                                      │
│  // 6.1: Prepare input for provider                 │
│  const input: CreateHostedLinkInput = {             │
│    amount: 5000,                                    │
│    currency: "INR",                                 │
│    invoiceNumber: "INV-001",                        │
│    invoiceId: "inv-uuid-123",                       │
│    customerId: "cust-456",                          │
│    customerName: "Acme Corp",                       │
│    customerEmail: "acme@example.com",               │
│    customerContact: "+91-9999999999",               │
│    idempotencyKey: "pay_1693395000123_abc45"       │
│  };                                                  │
│                                                      │
│  // 6.2: Call provider (could be Mock or Razorpay) │
│  const hostedLinkResult =                           │
│    await this.gatewayProvider                       │
│      .createHostedLink(input);                      │
│                                                      │
└──────────────────┬───────────────────────────────────┘
                   │ (6)
                   ▼
```

### Step 7a: Mock Provider Implementation

```
┌──── MockPaymentGatewayProvider ──────────────┐
│                                               │
│  async createHostedLink(input) {             │
│                                               │
│    // No external call, just local data     │
│    const providerPaymentId =                │
│      generateMockProviderPaymentId();       │
│    // Returns: "mock_1693395000_abc123"    │
│                                               │
│    const providerLinkId =                    │
│      generateMockProviderLinkId();           │
│    // Returns: "link_1693395000_def456"    │
│                                               │
│    const hostedUrl =                         │
│      generateMockHostedUrl();                │
│    // Returns:                               │
│    // "http://localhost:3001/pay/mock      │
│    //  /1693395000"                         │
│                                               │
│    return {                                  │
│      provider: "mock",                       │
│      providerLinkId: "link_...",            │
│      hostedUrl: "http://localhost...",      │
│      metadata: {                             │
│        providerPaymentId: "mock_...",       │
│        invoiceId: "inv-uuid-123",           │
│        customerId: "cust-456",               │
│        invoiceNumber: "INV-001",             │
│        idempotencyKey: "pay_..."            │
│      }                                        │
│    };                                        │
│  }                                            │
│                                               │
└──────────────────┬────────────────────────────┘
                   │ (7a) Or 7b for Razorpay
                   ▼
```

### Step 7b: Razorpay Provider Implementation

```
┌──── RazorpayGatewayProvider ──────────────────────────────────┐
│                                                               │
│  async createHostedLink(input) {                             │
│                                                               │
│    // 7b.1: Make HTTPS call to Razorpay API                 │
│    const link = await client.paymentLink.create({           │
│      amount: Math.round(5000 * 100),    // 500000 paise     │
│      currency: "INR",                                        │
│      reference_id: "pay_1693395000123_abc45",               │
│      description: "Invoice INV-001",                        │
│      customer: {                                             │
│        name: "Acme Corp",                                   │
│        email: "acme@example.com",                           │
│        contact: "+91-9999999999"                            │
│      },                                                      │
│      notes: {                                                │
│        invoiceId: "inv-uuid-123",                           │
│        customerId: "cust-456",                              │
│        invoiceNumber: "INV-001",                            │
│        idempotencyKey: "pay_..."                            │
│      }                                                       │
│    });                                                       │
│                                                               │
│    // 7b.2: Razorpay API responds with:                     │
│    // {                                                       │
│    //   id: "plink_1234567890",                             │
│    //   short_url: "https://rzp.io/l/abcd1234",             │
│    //   amount_paid: 0,                                      │
│    //   status: "created",                                   │
│    //   notes: { invoiceId, customerId, ... }               │
│    // }                                                       │
│                                                               │
│    return {                                                  │
│      provider: "razorpay",                                  │
│      providerLinkId: "plink_1234567890",                    │
│      hostedUrl: "https://rzp.io/l/abcd1234",                │
│      metadata: {                                             │
│        invoiceId: "inv-uuid-123",                           │
│        customerId: "cust-456",                              │
│        invoiceNumber: "INV-001",                            │
│        idempotencyKey: "pay_..."                            │
│      }                                                       │
│    };                                                        │
│  }                                                            │
│                                                               │
└──────────────────┬──────────────────────────────────────────┘
                   │ (7) Returns
                   ▼
```

### Step 8: Service Stores Payment Record

```
┌──── PaymentService (cont'd) ──────────────────────┐
│                                                   │
│  // Extract from provider response               │
│  const providerPaymentId = String(               │
│    hostedLinkResult.metadata.providerPaymentId   │
│  );                                               │
│  const providerLinkId =                          │
│    hostedLinkResult.providerLinkId;              │
│                                                   │
│  // 8.1: Create payment record in database      │
│  const payment = await paymentRepository.create( │
│    invoiceId: "inv-uuid-123",                    │
│    customerId: "cust-456",                       │
│    amount: 5000,                                 │
│    currency: "INR",                              │
│    publicId: "pay_1693395000123_abc45",         │
│    providerPaymentId: "mock_1693395000_abc123", │
│    providerLinkId: "link_1693395000_def456",    │
│    hostedUrl: "http://localhost:3001/...",      │
│    provider: "mock"                              │
│  );                                               │
│                                                   │
│  // Database: INSERT INTO payments VALUES (...)  │
│                                                   │
│  // Returns PaymentDTO:                          │
│  // {                                             │
│  //   id: "pay_123",                             │
│  //   invoiceId: "inv-uuid-123",                 │
│  //   publicId: "pay_1693395000123_abc45",      │
│  //   status: "PENDING",                         │
│  //   hostedUrl: "http://localhost:3001...",     │
│  //   provider: "mock",                          │
│  //   amount: 5000,                              │
│  //   currency: "INR"                            │
│  // }                                             │
│                                                   │
└──────────────────┬────────────────────────────────┘
                   │ (8)
                   ▼
```

### Step 9: Controller Returns Response

```
┌──── PaymentController ─────────────────────────────────┐
│                                                        │
│  res.status(201).json({                               │
│    success: true,                                     │
│    message: "Payment link created successfully",      │
│    data: payment  // PaymentDTO from step 8          │
│  });                                                   │
│                                                        │
│  HTTP Response:                                        │
│  Status: 201 Created                                  │
│  Content-Type: application/json                       │
│                                                        │
│  Body:                                                 │
│  {                                                     │
│    "success": true,                                   │
│    "message": "Payment link created successfully",    │
│    "data": {                                           │
│      "id": "pay_123",                                 │
│      "publicId": "pay_1693395000123_abc45",          │
│      "amount": 5000,                                  │
│      "currency": "INR",                               │
│      "status": "PENDING",                             │
│      "provider": "mock",                              │
│      "hostedUrl": "http://localhost:3001/pay/mock...", │
│      "createdAt": "2024-08-30T10:30:00Z"             │
│    }                                                   │
│  }                                                     │
│                                                        │
└──────────────────┬──────────────────────────────────────┘
                   │ (9)
                   ▼
```

### Step 10: Frontend Redirects Customer

```
┌──── Frontend ─────────────────────────────┐
│                                            │
│  // Receive response                      │
│  const payment = response.data.data;     │
│                                            │
│  // Redirect customer to payment link     │
│  window.location.href = payment.hostedUrl;│
│  // → "http://localhost:3001/pay/mock..." │
│  // or "https://rzp.io/l/abcd1234"       │
│                                            │
└──────────────────┬───────────────────────┘
                   │ (10)
                   ▼
```

### Step 11: Customer Pays (With Razorpay)

```
┌──── Razorpay Checkout ──────────────────────┐
│                                              │
│  Customer sees:                              │
│  ┌─────────────────────────────────────┐   │
│  │  Invoice: INV-001                   │   │
│  │  Amount: ₹5,000                     │   │
│  │  Merchant: Acme Corp                │   │
│  ├─────────────────────────────────────┤   │
│  │  Card Number:  [_____________]      │   │
│  │  Expiry:       [__] / [__]          │   │
│  │  CVV:          [___]                │   │
│  │                                     │   │
│  │  [ Pay Now ]  [ Cancel ]            │   │
│  └─────────────────────────────────────┘   │
│                                              │
│  Customer enters:                           │
│  - Test card: 4111 1111 1111 1111          │
│  - Expiry: 12/25                           │
│  - CVV: 123                                 │
│  - Clicks "Pay Now"                         │
│                                              │
│  Razorpay processes payment:                │
│  ✓ Payment successful                       │
│                                              │
└──────────────────┬───────────────────────────┘
                   │ (11)
                   ▼
```

### Step 12: Razorpay Sends Webhook

```
┌──── Razorpay ────────────────────────────────────────────────┐
│                                                               │
│  // Razorpay detects payment success                         │
│  // Creates webhook event                                    │
│                                                               │
│  event = {                                                   │
│    id: "event_FNuiMqfTL0Wqsc",                              │
│    event: "payment_link.paid",                              │
│    created_at: 1693395000,                                  │
│    payload: {                                                │
│      payment_link: {                                         │
│        entity: {                                             │
│          id: "plink_1234567890",                            │
│          status: "completed",                               │
│          amount_paid: 500000,                               │
│          notes: {                                            │
│            invoiceId: "inv-uuid-123",                       │
│            customerId: "cust-456",                          │
│            invoiceNumber: "INV-001"                         │
│          }                                                   │
│        }                                                     │
│      },                                                      │
│      payment: {                                              │
│        entity: {                                             │
│          id: "pay_FNuiMqfTL0Wqsc",                          │
│          amount: 500000,                                    │
│          currency: "INR",                                   │
│          status: "captured"                                 │
│        }                                                     │
│      }                                                       │
│    }                                                         │
│  }                                                            │
│                                                               │
│  // Calculate signature                                      │
│  signature = HMAC-SHA256(body, webhookSecret)               │
│  // "d41d8cd98f00b204e9800998ecf8427e"                      │
│                                                               │
│  // Send to your webhook endpoint                            │
│  POST https://your-app.com/api/v1/payments/webhooks/razorpay│
│  Content-Type: application/json                              │
│  X-Razorpay-Signature: d41d8cd98f00b204...                  │
│                                                               │
│  [raw body - exact bytes used for signature]                │
│                                                               │
└──────────────────┬────────────────────────────────────────────┘
                   │ (12)
                   ▼
```

### Step 13: Backend Receives & Verifies Webhook

```
┌──── PaymentController.handleRazorpayWebhook ──────────────┐
│                                                           │
│  // 13.1: Get raw body and signature                    │
│  const rawBody = req.rawBody;                           │
│  const signature =                                       │
│    req.headers["x-razorpay-signature"];                 │
│                                                           │
│  // 13.2: Verify signature                              │
│  if (!gatewayProvider.verifyWebhook(rawBody, sig)) {    │
│    res.status(401).json({ error: "Invalid signature" }); │
│    return;                                                │
│  }                                                        │
│                                                           │
│  // Signature is valid! Webhook came from Razorpay      │
│                                                           │
│  // 13.3: Normalize webhook to internal format          │
│  const event = gatewayProvider                          │
│    .normalizeWebhook(rawBody);                          │
│                                                           │
│  // Returns NormalizedGatewayEvent:                      │
│  // {                                                     │
│  //   provider: "razorpay",                              │
│  //   providerEventId: "event_FNuiMqfTL0Wqsc",          │
│  //   eventType: "payment.captured",                     │
│  //   amount: 5000,                                      │
│  //   currency: "INR",                                   │
│  //   metadata: { invoiceId: "inv-uuid-123", ... }      │
│  // }                                                     │
│                                                           │
└──────────────────┬──────────────────────────────────────────┘
                   │ (13)
                   ▼
```

### Step 14: Webhook Service Processes Event

```
┌──── PaymentWebhookService ──────────────────────────────────┐
│                                                              │
│  async processPaymentEvent(paymentId, event) {             │
│                                                              │
│    // 14.1: Check for duplicate event                      │
│    const lastEventId =                                      │
│      await paymentRepository.getLastEventId(paymentId);    │
│                                                              │
│    if (lastEventId === event.providerEventId) {            │
│      // Duplicate! Skip processing, return 200             │
│      return;                                                │
│    }                                                        │
│                                                              │
│    // 14.2: Record event ID (BEFORE processing)            │
│    await paymentRepository.recordEventId(                   │
│      paymentId,                                             │
│      event.providerEventId                                  │
│    );                                                       │
│                                                              │
│    // 14.3: Check event type                               │
│    if (event.eventType === "payment.captured") {          │
│                                                              │
│      // Apply payment to invoice                           │
│      await invoicePaymentApplicationService                │
│        .applyPaymentToInvoice(                             │
│          "inv-uuid-123",                                   │
│          5000  // amount                                   │
│        );                                                   │
│                                                              │
│      // Updates database:                                  │
│      // UPDATE invoices                                     │
│      // SET paidAmount = 5000,                             │
│      //     balanceDue = 0,                                │
│      //     status = "PAID"                                │
│      // WHERE id = "inv-uuid-123"                          │
│                                                              │
│      // Update payment status                              │
│      await paymentRepository.updateStatus(                 │
│        "pay_123",                                           │
│        "CAPTURED"                                           │
│      );                                                     │
│                                                              │
│      // Updates database:                                  │
│      // UPDATE payments                                     │
│      // SET status = "CAPTURED"                            │
│      // WHERE id = "pay_123"                               │
│    }                                                        │
│                                                              │
│    return updated payment;                                 │
│  }                                                           │
│                                                              │
└──────────────────┬─────────────────────────────────────────┘
                   │ (14)
                   ▼
```

### Step 15: Controller Returns 200 OK

```
┌──── PaymentController ─────────────────────┐
│                                             │
│  res.status(200).json({                    │
│    success: true,                          │
│    message: "Webhook processed successfully"│
│  });                                         │
│                                             │
│  // Razorpay receives 200 and stops retry  │
│                                             │
└──────────────────┬──────────────────────────┘
                   │ (15)
                   ▼
```

### Step 16: Frontend Auto-Refresh Detects Status Change

```
┌──── Frontend (Payment Status Page) ───────────────┐
│                                                    │
│  // Auto-refresh every 3 seconds                 │
│  GET /api/v1/payments/pay_1693395000123_abc45   │
│                                                    │
│  // Backend returns:                              │
│  // {                                              │
│  //   "status": "CAPTURED",                       │
│  //   "amount": 5000,                             │
│  //   ...                                          │
│  // }                                              │
│                                                    │
│  // Frontend updates UI:                          │
│  // ✓ Payment successful!                         │
│  //                                                │
│  // Stops auto-refresh (payment completed)       │
│                                                    │
└────────────────────────────────────────────────────┘
```

## Database State Progression

### Initial State

```sql
-- Invoice before payment
SELECT * FROM invoices WHERE id = 'inv-uuid-123';
-- id | invoiceNumber | amount | paidAmount | balanceDue | status
-- ---|---------------|--------|------------|------------|--------
-- inv-uuid-123 | INV-001 | 5000 | 0 | 5000 | SENT

-- No payment yet
SELECT * FROM payments;
-- (empty)
```

### After Payment Link Creation

```sql
SELECT * FROM payments WHERE id = 'pay_123';
-- id | invoiceId | publicId | status | hostedUrl | provider
-- ---|-----------|----------|--------|-----------|----------
-- pay_123 | inv-uuid-123 | pay_1693... | PENDING | http://... | mock
```

### After Payment Success

```sql
-- Invoice updated
SELECT * FROM invoices WHERE id = 'inv-uuid-123';
-- id | invoiceNumber | amount | paidAmount | balanceDue | status
-- ---|---------------|--------|------------|------------|--------
-- inv-uuid-123 | INV-001 | 5000 | 5000 | 0 | PAID

-- Payment updated
SELECT * FROM payments WHERE id = 'pay_123';
-- id | invoiceId | publicId | status | lastEventId
-- ---|-----------|----------|--------|--------------------
-- pay_123 | inv-uuid-123 | pay_... | CAPTURED | event_FNuiMq...
```

## Key Takeaways

1. **Separation of Concerns**: Each component does one thing
2. **Contract-Based Design**: Services use interfaces, not implementations
3. **Idempotency**: Event recorded before processing prevents duplicates
4. **Signature Verification**: Proves webhook came from provider
5. **Normalization**: Both providers use same internal format
6. **Database as Source of Truth**: UI reflects database state

## Next Steps

- Read `11-how-this-maps-to-production.md` to understand production architecture
