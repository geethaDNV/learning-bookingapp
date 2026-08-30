# 04 - Provider Abstraction: Why We Use Interfaces

## The Problem: Tight Coupling to Razorpay

Imagine this code (bad):

```typescript
// ❌ Tightly coupled to Razorpay
async createPayment(invoiceId: string) {
  const razorpay = new Razorpay({ key_id, key_secret });
  
  const paymentLink = await razorpay.paymentLink.create({
    upi_link: true,
    amount: invoice.total,
    currency: "INR",
  });

  // Our payment table now depends on Razorpay SDK
  await this.paymentRepository.create({
    invoiceId,
    providerPaymentId: paymentLink.id,
  });
}
```

**Problems:**
1. If we want to switch to Stripe, we must rewrite this method
2. Testing requires mocking Razorpay SDK
3. Business logic is mixed with provider API details
4. We can't test without a Razorpay account

## The Solution: Provider Abstraction

We define an **interface** (contract) that any provider must implement:

```typescript
export interface IPaymentGatewayProvider {
  createPaymentIntent(
    paymentId: string,
    amount: number,
    description: string
  ): Promise<{ providerPaymentId: string; paymentLink: string }>;

  getPaymentStatus(providerPaymentId: string): Promise<string>;
}
```

Now we can have **multiple implementations**:

### Implementation 1: Mock Provider (Learning)

```typescript
export class MockPaymentGatewayProvider implements IPaymentGatewayProvider {
  async createPaymentIntent(paymentId, amount, description) {
    // No API call, just generate a mock ID
    return {
      providerPaymentId: `mock_pay_${uuidv4()}`,
      paymentLink: `http://localhost:3001/api/v1/payments/public/status/${paymentId}`,
    };
  }

  async getPaymentStatus(providerPaymentId) {
    // Always return pending for learning
    return "pending";
  }
}
```

### Implementation 2: Razorpay (Production)

```typescript
export class RazorpayPaymentGatewayProvider implements IPaymentGatewayProvider {
  constructor(private razorpay: Razorpay) {}

  async createPaymentIntent(paymentId, amount, description) {
    const paymentLink = await this.razorpay.paymentLink.create({
      amount,
      description,
      currency: "INR",
      customer_notify: 1, // Email/SMS customer
    });

    return {
      providerPaymentId: paymentLink.id,
      paymentLink: paymentLink.url,
    };
  }

  async getPaymentStatus(providerPaymentId) {
    const paymentLink = await this.razorpay.paymentLink.fetch(providerPaymentId);
    return paymentLink.status; // "paid", "cancelled", etc
  }
}
```

### Implementation 3: Stripe (Future)

```typescript
export class StripePaymentGatewayProvider implements IPaymentGatewayProvider {
  constructor(private stripe: Stripe) {}

  async createPaymentIntent(paymentId, amount, description) {
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe uses cents
      currency: "inr",
      description,
    });

    return {
      providerPaymentId: paymentIntent.id,
      paymentLink: `https://dashboard.stripe.com/...`, // Client secret for frontend
    };
  }

  async getPaymentStatus(providerPaymentId) {
    const intent = await this.stripe.paymentIntents.retrieve(providerPaymentId);
    return intent.status;
  }
}
```

## How PaymentService Uses It

```typescript
export class PaymentService implements IPaymentService {
  constructor(
    private readonly paymentRepository: IPaymentRepository,
    private readonly paymentNumberService: IPaymentNumberService,
    private readonly gatewayProvider: IPaymentGatewayProvider, // ← Abstract!
    private readonly webhookService: IPaymentWebhookService,
    private readonly prisma: PrismaClient
  ) {}

  async createPayment(invoiceId: string): Promise<PaymentDTO> {
    // ... fetch invoice, etc ...

    const publicId = await this.paymentNumberService.generatePublicId();
    const payment = await this.paymentRepository.create(...);

    // Call the provider (could be Mock, Razorpay, or Stripe)
    const { providerPaymentId } = await this.gatewayProvider.createPaymentIntent(
      payment.id,
      invoice.balanceDue,
      `Invoice ${invoice.number}`
    );

    // ... update payment with provider ID ...
    return updatedPayment;
  }
}
```

The `PaymentService` doesn't care which provider is used—it just calls the interface!

## Dependency Injection: Swapping Providers

In the DI container, we wire up the provider:

```typescript
// Learning: Use mock provider
const gatewayProvider = new MockPaymentGatewayProvider();

// Production: Use Razorpay
const gatewayProvider = new RazorpayPaymentGatewayProvider(razorpayClient);

// Tomorrow: Use Stripe
const gatewayProvider = new StripePaymentGatewayProvider(stripeClient);
```

All without changing `PaymentService`, `PaymentController`, or routes!

## Benefits

| Benefit | How |
|---------|-----|
| **Easy testing** | Mock provider returns predictable results |
| **Swap providers** | New implementation + wire in DI container |
| **Isolated business logic** | Service doesn't know about provider APIs |
| **Learning-friendly** | Mock provider teaches without real payments |
| **Type-safe** | Interface ensures all providers have same methods |
| **Gradual migration** | Support multiple providers in transition |

## From Learning to Production

In this module, we use `MockPaymentGatewayProvider`.

To add Razorpay:
1. Install `razorpay` SDK
2. Create `RazorpayPaymentGatewayProvider` class
3. In DI container, swap:
   ```typescript
   // const provider = new MockPaymentGatewayProvider();
   const provider = new RazorpayPaymentGatewayProvider(razorpayClient);
   ```
4. No other code changes needed!

Next: [05 - Create Payment Flow](05-create-payment-flow.md)
