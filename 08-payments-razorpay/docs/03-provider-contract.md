# 03. Provider Contract: Understanding IPaymentGatewayProvider

Learn how both Mock and Razorpay implement the same interface.

## The Contract Pattern

A **contract** (interface) is like a promise: "I will implement these methods, you can call them without knowing my implementation details."

### Why This Matters

```typescript
// Bad: Controller knows about Razorpay API
if (provider === "razorpay") {
  client.paymentLink.create(...)
} else {
  // mock implementation
}

// Good: Controller just calls the interface
gatewayProvider.createHostedLink(input)
// Don't care if it's Razorpay, Mock, Stripe, etc.
```

The second approach is **contract-based** - it's how real production systems work!

## The IPaymentGatewayProvider Interface

```typescript
export interface IPaymentGatewayProvider {
  provider: PaymentProvider; // "razorpay" or "mock"

  // Create a hosted payment link
  createHostedLink(input: CreateHostedLinkInput): Promise<HostedLinkResult>;

  // Verify webhook signature
  verifyWebhook(rawBody: Buffer, signature: string): boolean;

  // Normalize webhook to our internal format
  normalizeWebhook(rawBody: Buffer): NormalizedGatewayEvent;

  // Check payment status
  fetchPaymentLinkStatus(providerLinkId: string): Promise<{...}>;
}
```

Let's break down each method.

## Method 1: createHostedLink()

### Purpose
Create a payment link that customers visit to pay.

### Input: CreateHostedLinkInput
```typescript
{
  amount: 5000,                      // Amount in currency units (INR)
  currency: "INR",                   // Currency code
  invoiceNumber: "INV-001",          // For display
  invoiceId: "uuid-123",             // For tracking
  customerId: "cust-456",            // Link to customer
  customerName: "Acme Corp",         // Customer name
  customerEmail: "acme@example.com", // For notifications
  customerContact: "+91-99999",      // Phone number
  idempotencyKey: "unique-key"       // Prevent duplicates
}
```

### Output: HostedLinkResult
```typescript
{
  provider: "razorpay",                      // Which provider
  providerLinkId: "plink_abc123",            // Razorpay's link ID
  hostedUrl: "https://rzp.io/...",           // URL to send customer
  metadata: {                                 // Store for later
    invoiceId: "uuid-123",
    customerId: "cust-456",
    idempotencyKey: "unique-key"
  }
}
```

### Mock Implementation
```typescript
async createHostedLink(input: CreateHostedLinkInput): Promise<HostedLinkResult> {
  // In real code, this doesn't call external API
  // Just generates local data
  const providerLinkId = generateMockId();
  const hostedUrl = `http://localhost:3001/pay/mock/${Date.now()}`;

  return {
    provider: "mock",
    providerLinkId,
    hostedUrl,
    metadata: { invoiceId: input.invoiceId, /* ... */ }
  };
}
```

### Razorpay Implementation
```typescript
async createHostedLink(input: CreateHostedLinkInput): Promise<HostedLinkResult> {
  // Real Razorpay API call
  const link = await client.paymentLink.create({
    amount: Math.round(input.amount * 100), // Razorpay uses paise
    currency: input.currency,
    description: `Invoice ${input.invoiceNumber}`,
    customer: {
      name: input.customerName,
      email: input.customerEmail,
      contact: input.customerContact,
    },
    notes: {
      invoiceId: input.invoiceId,
      customerId: input.customerId,
    }
  });

  return {
    provider: "razorpay",
    providerLinkId: link.id,
    hostedUrl: link.short_url,
    metadata: link.notes
  };
}
```

**Key Difference**: Mock is instant local data, Razorpay calls real API.

## Method 2: verifyWebhook()

### Purpose
Prove the webhook came from the provider, not a fake.

### How It Works

**Scenario**: Your app receives HTTP request with:
```
POST /webhooks/razorpay
X-Razorpay-Signature: abc123def456

{
  "id": "event_123",
  "event": "payment_link.paid",
  "payload": { ... }
}
```

How do you know it's really from Razorpay?

**Answer**: Signature verification using HMAC-SHA256

```
1. Take raw request body (unchanged)
2. Create HMAC using your webhook secret
3. Compare with signature header
4. If they match, it's authentic!
```

### Mock Implementation
```typescript
verifyWebhook(rawBody: Buffer, signature: string): boolean {
  const expectedSignature = createHmac("sha256", this.mockWebhookSecret)
    .update(rawBody)
    .digest("hex");
  
  return signature === expectedSignature;
}
```

### Razorpay Implementation
```typescript
verifyWebhook(rawBody: Buffer, signature: string): boolean {
  const secret = config.razorpay.webhookSecret;
  if (!secret || !signature) return false;

  const expectedSignature = createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  const expectedBuffer = Buffer.from(expectedSignature, "utf8");
  const signatureBuffer = Buffer.from(signature, "utf8");

  // Use timing-safe comparison (prevent timing attacks)
  return timingSafeEqual(expectedBuffer, signatureBuffer);
}
```

**Key Difference**: Mock uses test secret, Razorpay uses real webhook secret from dashboard.

## Method 3: normalizeWebhook()

### Purpose
Convert provider's webhook format to your internal format.

### The Problem

Razorpay sends:
```json
{
  "id": "event_123",
  "event": "payment_link.paid",
  "created_at": 1692864000,
  "payload": {
    "payment_link": {
      "entity": {
        "id": "plink_abc",
        "status": "completed",
        "amount_paid": 500000
      }
    }
  }
}
```

Mock might send:
```json
{
  "id": "mock-event-123",
  "eventType": "payment.captured",
  "amount": 5000,
  "currency": "INR"
}
```

Both mean "payment succeeded" but in different formats!

### Your Internal Format: NormalizedGatewayEvent
```typescript
{
  provider: "razorpay" | "mock",
  providerEventId: "event_123",           // Unique event ID
  eventType: "payment.captured" | "payment.failed" | "payment.pending",
  providerPaymentId: "pay_123",           // Provider's payment ID
  providerLinkId: "plink_abc",            // Provider's link ID
  amount: 5000,                           // Actual amount
  currency: "INR",
  occurredAt: Date,
  metadata: { invoiceId: "...", ... }
}
```

### Mock Implementation
```typescript
normalizeWebhook(rawBody: Buffer): NormalizedGatewayEvent {
  const payload = JSON.parse(rawBody.toString("utf8"));

  return {
    provider: "mock",
    providerEventId: payload.id,
    eventType: payload.eventType, // Already in our format!
    providerPaymentId: payload.providerPaymentId,
    amount: payload.amount,
    currency: payload.currency || "INR",
    occurredAt: new Date(payload.occurredAt),
    metadata: payload.metadata || {}
  };
}
```

### Razorpay Implementation
```typescript
normalizeWebhook(rawBody: Buffer): NormalizedGatewayEvent {
  const root = JSON.parse(rawBody.toString("utf8"));
  const payload = root.payload;
  const link = payload.payment_link.entity;
  const payment = payload.payment?.entity || {};

  // Razorpay event names need conversion
  const eventType = root.event.includes("captured") 
    ? "payment.captured"
    : root.event.includes("failed")
    ? "payment.failed"
    : "payment.pending";

  return {
    provider: "razorpay",
    providerEventId: root.id,
    eventType,
    providerPaymentId: payment.id,
    providerLinkId: link.id,
    amount: payment.amount / 100, // Convert from paise
    currency: payment.currency || "INR",
    occurredAt: new Date(root.created_at * 1000),
    metadata: link.notes || {}
  };
}
```

**Key Difference**: Parsing and field mapping - translating provider format to yours.

## Method 4: fetchPaymentLinkStatus()

### Purpose
Ask the provider: "What's the current status of this payment link?"

### When You Need It
- User asks for payment status
- Need to reconcile payment state
- Webhook didn't arrive yet

### Input
```typescript
providerLinkId: "plink_abc123" // Provider's link ID
```

### Output
```typescript
{
  provider: "razorpay",
  providerLinkId: "plink_abc123",
  status: "completed" | "pending" | "expired",
  amountPaid: 5000,
  paymentStatus: "captured" | "pending" | "failed",
  providerPaymentId: "pay_xyz",
  failureReason?: "Insufficient funds"
}
```

### Mock Implementation
```typescript
async fetchPaymentLinkStatus(providerLinkId: string) {
  // In memory or database lookup
  return {
    provider: "mock",
    providerLinkId,
    status: "pending",
    amountPaid: 0,
    paymentStatus: "pending"
  };
}
```

### Razorpay Implementation
```typescript
async fetchPaymentLinkStatus(providerLinkId: string) {
  // Real API call to Razorpay
  const link = await client.paymentLink.fetch(providerLinkId);
  
  return {
    provider: "razorpay",
    providerLinkId,
    status: link.status,
    amountPaid: link.amount_paid / 100,
    paymentStatus: link.payments[0]?.status,
    providerPaymentId: link.payments[0]?.id,
    failureReason: link.payments[0]?.error_description
  };
}
```

## Key Learnings

1. **Contract First**: Define interface before implementation
2. **Same Input/Output**: Both implementations handle same data shapes
3. **Implementation Details Hidden**: Controllers don't care how it's done
4. **Easy to Test**: Can swap Mock for testing, Razorpay for production
5. **Easy to Extend**: Adding Stripe? Just implement the interface!

## Next Steps

- Read `04-create-payment-link-flow.md` to see these methods in action
