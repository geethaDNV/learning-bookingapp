# 08. DI Provider Selection

How dependency injection lets you swap payment providers without changing business logic.

## The Problem

Without DI:
```typescript
// Hard-coded provider choice
if (config.provider === "razorpay") {
  const client = new Razorpay(...);
  const link = await client.paymentLink.create(...);
} else if (config.provider === "mock") {
  // Different code path
  const link = generateMockLink(...);
}

// Problem: controllers, services scattered with provider logic
// Adding Stripe? Add another else-if...
```

## The Solution: Dependency Injection

```typescript
// Interface (contract)
interface IPaymentGatewayProvider {
  createHostedLink(...): Promise<...>;
}

// Implementations
class MockPaymentGatewayProvider implements IPaymentGatewayProvider {
  async createHostedLink(...) { ... }
}

class RazorpayGatewayProvider implements IPaymentGatewayProvider {
  async createHostedLink(...) { ... }
}

// Service (doesn't care which)
class PaymentService {
  constructor(private provider: IPaymentGatewayProvider) {}
  
  async createPaymentLink(invoiceId: string) {
    // Use provider without knowing which one
    const result = await this.provider.createHostedLink({...});
  }
}

// DI Container (decides which provider)
const gatewayProvider = config.razorpay.keyId 
  ? new RazorpayGatewayProvider()
  : new MockPaymentGatewayProvider();

const paymentService = new PaymentService(gatewayProvider);
```

Benefits:
- ✓ Controllers/services don't know about providers
- ✓ Easy to switch providers (change one line in DI)
- ✓ Easy to test (inject mock provider in tests)
- ✓ Easy to add Stripe/Square/etc (just implement interface)

## Our DI Container

### File: backend/src/di/container.ts

```typescript
import { PrismaClient } from "@prisma/client";
import { IPaymentGatewayProvider } from "./contracts.js";
import { MockPaymentGatewayProvider } from "../services/MockPaymentGatewayProvider.js";
import { RazorpayGatewayProvider } from "../services/RazorpayGatewayProvider.js";
import { PaymentService } from "../services/PaymentService.js";
import config from "../config.js";

export interface Cradle {
  // All dependencies
  prisma: PrismaClient;
  gatewayProvider: IPaymentGatewayProvider;
  paymentService: PaymentService;
  // ... other dependencies
}

export function createCradle(prisma: PrismaClient): Cradle {
  // Select provider based on config
  const gatewayProvider: IPaymentGatewayProvider =
    config.paymentProvider === "razorpay" &&
    config.razorpay.keyId &&
    config.razorpay.keySecret
      ? new RazorpayGatewayProvider()
      : new MockPaymentGatewayProvider();

  // All services receive same provider interface
  const paymentService = new PaymentService(
    paymentRepository,
    paymentNumberService,
    gatewayProvider,  // Could be Mock or Razorpay
    paymentWebhookService,
    prisma
  );

  return {
    prisma,
    gatewayProvider,
    paymentService,
    // ...
  };
}
```

### Key Decision Logic

```typescript
// Select provider based on config
const gatewayProvider: IPaymentGatewayProvider =
  config.paymentProvider === "razorpay" &&        // Setting says razorpay
  config.razorpay.keyId &&                        // And key ID is set
  config.razorpay.keySecret                       // And key secret is set
    ? new RazorpayGatewayProvider()               // Use real Razorpay
    : new MockPaymentGatewayProvider();           // Otherwise use mock
```

## Configuration

### File: backend/src/config.ts

```typescript
import dotenv from "dotenv";

interface Config {
  port: number;
  databaseUrl: string;
  razorpay: {
    keyId: string;
    keySecret: string;
    webhookSecret: string;
    publicAppUrl: string;
  };
  paymentProvider: "razorpay" | "mock";
}

const config: Config = {
  port: parseInt(process.env.PORT || "3001"),
  databaseUrl: process.env.DATABASE_URL || "",
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || "",
    keySecret: process.env.RAZORPAY_KEY_SECRET || "",
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || "",
    publicAppUrl: process.env.APP_PUBLIC_URL || "http://localhost:3001"
  },
  paymentProvider: (process.env.PAYMENT_PROVIDER as "razorpay" | "mock") || "mock"
};

export default config;
```

## Environment Variables (.env)

### For Mock Provider (Learning)

```bash
# .env

# Database
DATABASE_URL=sqlite:./prisma/dev.db

# Server
PORT=3001

# Leave these empty - mock provider doesn't need them
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=

# Public URL for mock (not used, but good to have)
APP_PUBLIC_URL=http://localhost:3001

# Use mock provider
PAYMENT_PROVIDER=mock
```

### For Razorpay Provider (Production/Sandbox)

```bash
# .env

# Database
DATABASE_URL=sqlite:./prisma/dev.db

# Server
PORT=3001

# Razorpay Sandbox Keys
RAZORPAY_KEY_ID=rzp_test_1a2b3c4d5e6f7g8h
RAZORPAY_KEY_SECRET=aBc1DeF2gHi3JkL4mNoPqRs
RAZORPAY_WEBHOOK_SECRET=wEbHoOkSeCrEtHeRe

# Public URL (ngrok for local testing)
APP_PUBLIC_URL=https://abc123.ngrok.io

# Use razorpay provider
PAYMENT_PROVIDER=razorpay
```

## How Services Use DI

### PaymentService

```typescript
export class PaymentService implements IPaymentService {
  constructor(
    private paymentRepository: IPaymentRepository,
    private paymentNumberService: IPaymentNumberService,
    private gatewayProvider: IPaymentGatewayProvider,  // Injected!
    private paymentWebhookService: IPaymentWebhookService,
    private prisma: PrismaClient
  ) {}

  async createPaymentLink(invoiceId: string): Promise<PaymentDTO> {
    // ... get invoice ...

    // Call provider without knowing which one
    const hostedLinkResult = await this.gatewayProvider.createHostedLink({
      amount: invoice.amount,
      // ... other params
    });

    // hostedLinkResult works same for Mock or Razorpay
    // Mock: local URL
    // Razorpay: real URL
  }
}
```

The service doesn't know or care which provider!

### Webhook Service

```typescript
export class PaymentWebhookService implements IPaymentWebhookService {
  constructor(
    private paymentRepository: IPaymentRepository,
    private invoicePaymentApplicationService: IInvoicePaymentApplicationService
  ) {}

  async processPaymentEvent(
    paymentId: string,
    event: NormalizedGatewayEvent  // Normalized from either provider
  ): Promise<PaymentDTO> {
    // Process event same way, regardless of provider
    // Mock provides: payment.captured event
    // Razorpay provides: payment_link.paid event
    // Both normalized to: "payment.captured"
  }
}
```

## Testing with Different Providers

### Test with Mock (No Setup Needed)

```bash
# Default: use mock provider
npm run dev

# Tests work without internet
# Fast, no external API calls
```

### Test with Razorpay (Needs Keys)

```bash
# Set keys in .env
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=yyy
RAZORPAY_WEBHOOK_SECRET=zzz
PAYMENT_PROVIDER=razorpay

npm run dev

# Real API calls to Razorpay
# Need ngrok for webhooks
```

### Unit Testing

```typescript
// In tests, inject mock provider
import { MockPaymentGatewayProvider } from "@services/MockPaymentGatewayProvider";

describe("PaymentService", () => {
  it("should create payment link", async () => {
    const mockProvider = new MockPaymentGatewayProvider();
    const service = new PaymentService(
      mockRepository,
      mockNumberService,
      mockProvider,  // Always mock in tests
      mockWebhookService,
      mockPrisma
    );

    const payment = await service.createPaymentLink("inv_123");
    expect(payment.status).toBe("PENDING");
  });
});
```

## Adding a New Provider (Stripe Example)

### Step 1: Implement Interface

```typescript
export class StripeGatewayProvider implements IPaymentGatewayProvider {
  async createHostedLink(input: CreateHostedLinkInput): Promise<HostedLinkResult> {
    // Stripe-specific implementation
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: input.currency,
          product_data: {
            name: `Invoice ${input.invoiceNumber}`
          },
          unit_amount: Math.round(input.amount * 100)
        },
        quantity: 1
      }],
      mode: "payment",
      success_url: `${input.callbackUrl}?status=success`,
      cancel_url: `${input.callbackUrl}?status=cancel`
    });

    return {
      provider: "stripe",
      providerLinkId: session.id,
      hostedUrl: session.url!,
      metadata: { invoiceId: input.invoiceId }
    };
  }

  // ... implement other methods
}
```

### Step 2: Add to DI

```typescript
export function createCradle(prisma: PrismaClient): Cradle {
  const gatewayProvider: IPaymentGatewayProvider =
    config.paymentProvider === "stripe"
      ? new StripeGatewayProvider()
      : config.paymentProvider === "razorpay"
      ? new RazorpayGatewayProvider()
      : new MockPaymentGatewayProvider();

  // ... rest of DI setup
}
```

### Step 3: Use

```bash
# .env
PAYMENT_PROVIDER=stripe
STRIPE_API_KEY=sk_test_xxx
```

All services automatically use Stripe! No code changes needed.

## Debugging Provider Selection

### Check Active Provider

```bash
curl http://localhost:3001/health

# Response shows provider:
{
  "status": "ok",
  "provider": "razorpay",  // or "mock"
  "timestamp": "2024-08-30T10:30:00Z"
}
```

### Log at Startup

```typescript
// backend/src/server.ts
console.log(
  `Payment provider: ${cradle.gatewayProvider.provider}`
);

// Output:
// Payment provider: razorpay
// or
// Payment provider: mock
```

## Best Practices

| Do ✓ | Don't ✗ |
|-----|--------|
| Define interface first | Hard-code provider logic in services |
| Inject provider into services | `new RazorpayGatewayProvider()` in code |
| One place to swap providers (DI) | Scattered provider logic |
| Normalize all providers to same format | Different code paths per provider |
| Test with mock provider first | Test only with real provider |

## Summary

```
.env: PAYMENT_PROVIDER=razorpay
        ↓
config.ts: Read from environment
        ↓
container.ts: Decide which provider to instantiate
        ↓
PaymentService: Receive provider via constructor
        ↓
Use provider.createHostedLink() without caring which one
```

Same code, multiple providers. That's the power of DI! 🚀

## Next Steps

- Read `09-frontend-flow.md` to see how frontend uses backend
