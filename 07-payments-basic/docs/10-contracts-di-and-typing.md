# 10 - Contracts, DI, and Typing

## Why Contracts (Interfaces)?

Contracts define **what** classes must do, not **how** they do it.

### Without Contracts (Tightly Coupled)

```typescript
// ❌ Bad: Controller depends on concrete class
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {} // Concrete
  // Hard to test: must instantiate PaymentService with all its dependencies
}
```

### With Contracts (Loosely Coupled)

```typescript
// ✓ Good: Controller depends on interface
export class PaymentController {
  constructor(private readonly paymentService: IPaymentService) {} // Interface
  // Easy to test: can inject mock or stub
}
```

---

## Payment Contracts

**File**: `src/di/contracts.ts`

### IPaymentGatewayProvider

```typescript
export interface IPaymentGatewayProvider {
  /**
   * Create a payment intent/link
   * Implementations: MockPaymentGatewayProvider, RazorpayPaymentGatewayProvider, etc
   */
  createPaymentIntent(
    paymentId: string,
    amount: number,
    description: string
  ): Promise<{ providerPaymentId: string; paymentLink: string }>;

  getPaymentStatus(providerPaymentId: string): Promise<string>;
}
```

### IPaymentRepository

```typescript
export interface IPaymentRepository {
  create(
    invoiceId: string,
    customerId: string,
    amount: number,
    publicId: string,
    providerPaymentId: string
  ): Promise<PaymentDTO>;

  getById(id: string): Promise<PaymentDTO | null>;
  getByPublicId(publicId: string): Promise<PaymentDTO | null>;

  list(filters: {
    page?: number;
    pageSize?: number;
    status?: string;
    invoiceId?: string;
  }): Promise<{ items: PaymentDTO[]; total: number }>;

  updateStatus(id: string, status: string): Promise<PaymentDTO>;
  updateProviderPaymentId(id: string, providerPaymentId: string): Promise<PaymentDTO>;

  recordEventId(id: string, eventId: string): Promise<void>;
  getLastEventId(id: string): Promise<string | null>;
}
```

### IPaymentService

```typescript
export interface IPaymentService {
  createPayment(invoiceId: string): Promise<PaymentDTO>;
  getPayment(id: string): Promise<PaymentDTO>;
  getPaymentByPublicId(publicId: string): Promise<PaymentDTO>;

  listPayments(filters: {
    page?: number;
    pageSize?: number;
    status?: string;
    invoiceId?: string;
  }): Promise<{ items: PaymentDTO[]; total: number }>;

  simulatePaymentSuccess(paymentId: string): Promise<PaymentDTO>;
  simulatePaymentFailure(paymentId: string): Promise<PaymentDTO>;
}
```

### IPaymentWebhookService

```typescript
export interface IPaymentWebhookService {
  /**
   * Process a payment event (success/failure)
   * Handles idempotency and calls invoice application service
   */
  processPaymentEvent(
    paymentId: string,
    eventId: string,
    eventType: string,
    status: string
  ): Promise<PaymentDTO>;
}
```

### IInvoicePaymentApplicationService

```typescript
export interface IInvoicePaymentApplicationService {
  /**
   * Apply a captured payment to an invoice
   * Updates paidAmount, balanceDue, and status
   */
  applyPaymentToInvoice(invoiceId: string, amount: number): Promise<InvoicePaymentInfo>;

  getInvoicePaymentInfo(invoiceId: string): Promise<InvoicePaymentInfo>;
}
```

### IPaymentNumberService

```typescript
export interface IPaymentNumberService {
  /**
   * Generate a unique public payment ID
   */
  generatePublicId(): Promise<string>;
}
```

---

## Dependency Injection Container

**File**: `src/di/container.ts`

The container wires all dependencies together:

```typescript
export interface Cradle {
  prisma: PrismaClient;
  paymentRepository: IPaymentRepository;
  paymentNumberService: IPaymentNumberService;
  gatewayProvider: IPaymentGatewayProvider;
  invoicePaymentApplicationService: IInvoicePaymentApplicationService;
  paymentWebhookService: IPaymentWebhookService;
  paymentService: IPaymentService;
  paymentController: PaymentController;
}

export function createCradle(prisma: PrismaClient): Cradle {
  // Create repository
  const paymentRepository = new PaymentRepository(prisma);

  // Create services (order matters!)
  const paymentNumberService = new PaymentNumberService();
  const gatewayProvider = new MockPaymentGatewayProvider();
  const invoicePaymentApplicationService = new InvoicePaymentApplicationService(prisma);

  // Webhook service depends on repository and application service
  const paymentWebhookService = new PaymentWebhookService(
    paymentRepository,
    invoicePaymentApplicationService
  );

  // Payment service depends on all the above
  const paymentService = new PaymentService(
    paymentRepository,
    paymentNumberService,
    gatewayProvider,
    paymentWebhookService,
    prisma
  );

  // Controller depends on service
  const paymentController = new PaymentController(paymentService, prisma);

  // Return all dependencies
  return {
    prisma,
    paymentRepository,
    paymentNumberService,
    gatewayProvider,
    invoicePaymentApplicationService,
    paymentWebhookService,
    paymentService,
    paymentController,
  };
}
```

### Dependency Graph

```
Cradle (Container)
  ├─ PrismaClient
  │
  ├─ PaymentRepository
  │   └─ depends on: PrismaClient
  │
  ├─ PaymentNumberService
  │   └─ depends on: (none)
  │
  ├─ MockPaymentGatewayProvider (IPaymentGatewayProvider)
  │   └─ depends on: (none)
  │
  ├─ InvoicePaymentApplicationService (IInvoicePaymentApplicationService)
  │   └─ depends on: PrismaClient
  │
  ├─ PaymentWebhookService (IPaymentWebhookService)
  │   └─ depends on: IPaymentRepository, IInvoicePaymentApplicationService
  │
  ├─ PaymentService (IPaymentService)
  │   └─ depends on: IPaymentRepository, IPaymentNumberService, IPaymentGatewayProvider,
  │                  IPaymentWebhookService, PrismaClient
  │
  └─ PaymentController
      └─ depends on: IPaymentService, PrismaClient
```

---

## Swapping Implementations

### Scenario: Add Razorpay Provider

1. Create new class:
```typescript
export class RazorpayPaymentGatewayProvider implements IPaymentGatewayProvider {
  async createPaymentIntent(paymentId, amount, description) {
    const razorpay = new Razorpay(this.config);
    const link = await razorpay.paymentLink.create({ amount, ... });
    return { providerPaymentId: link.id, paymentLink: link.url };
  }
}
```

2. Update container:
```typescript
// const gatewayProvider = new MockPaymentGatewayProvider();
const gatewayProvider = new RazorpayPaymentGatewayProvider(razorpayConfig);
```

3. **No other code changes needed!**
   - `PaymentService` still works (uses interface)
   - `PaymentController` still works (uses service interface)
   - Routes still work (same URLs)

---

## Implementation Examples

### PaymentRepository

```typescript
export class PaymentRepository implements IPaymentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(invoiceId, customerId, amount, publicId, providerPaymentId) {
    // Implements IPaymentRepository.create
    const payment = await this.prisma.payment.create({ ... });
    return this.toDTO(payment);
  }

  async getById(id) {
    // Implements IPaymentRepository.getById
    const payment = await this.prisma.payment.findUnique({ where: { id } });
    return payment ? this.toDTO(payment) : null;
  }

  // ... all other methods ...
}
```

### PaymentService

```typescript
export class PaymentService implements IPaymentService {
  constructor(
    private readonly paymentRepository: IPaymentRepository,        // ← Interface
    private readonly paymentNumberService: IPaymentNumberService, // ← Interface
    private readonly gatewayProvider: IPaymentGatewayProvider,    // ← Interface
    private readonly webhookService: IPaymentWebhookService,      // ← Interface
    private readonly prisma: PrismaClient
  ) {}

  async createPayment(invoiceId: string): Promise<PaymentDTO> {
    // Uses interfaces, doesn't know implementation details
    const publicId = await this.paymentNumberService.generatePublicId();
    const payment = await this.paymentRepository.create(...);
    const { providerPaymentId } = await this.gatewayProvider.createPaymentIntent(...);
    // ... etc
  }
}
```

### PaymentController

```typescript
export class PaymentController {
  constructor(
    private readonly paymentService: IPaymentService,  // ← Interface
    private readonly prisma: PrismaClient
  ) {}

  createPayment = asyncHandler(async (req, res) => {
    // Uses service interface
    const payment = await this.paymentService.createPayment(req.body.invoiceId);
    sendResponse(res, 201, "Payment created", payment);
  });
}
```

---

## Benefits

| Benefit | How |
|---------|-----|
| **Easy testing** | Inject mock implementations |
| **Swap providers** | New implementation + update container |
| **Type safety** | TypeScript ensures all implementations match interface |
| **Clear contracts** | Everyone knows what each service must do |
| **Maintainability** | Changes to implementation don't affect consumers |
| **Loose coupling** | Services don't depend on concrete classes |

---

## Testing Example

### Unit Test with Mock Repository

```typescript
describe("PaymentService", () => {
  let paymentService: PaymentService;
  let mockRepository: IPaymentRepository;

  beforeEach(() => {
    mockRepository = {
      create: jest.fn().mockResolvedValue({ id: "pay_1", status: "created" }),
      getById: jest.fn(),
      getLastEventId: jest.fn().mockResolvedValue(null),
      // ... other mocks
    };

    paymentService = new PaymentService(
      mockRepository,
      new PaymentNumberService(),
      new MockPaymentGatewayProvider(),
      new PaymentWebhookService(mockRepository, ...),
      prisma
    );
  });

  it("should create payment with public ID", async () => {
    const payment = await paymentService.createPayment("inv_123");
    expect(payment.publicId).toBeTruthy();
    expect(mockRepository.create).toHaveBeenCalled();
  });
});
```

The test injects mocks instead of real database calls. Easy!

Next: [11 - Contract Trace](11-contract-trace.md)
