# Backend Contracts and Dependency Injection

## Why Contracts Matter

In production code, services should **not depend on concrete classes**. Instead, they depend on **interfaces (contracts)**:

```typescript
// ❌ Bad: Concrete dependency
class PaymentService {
  constructor(
    private repo: PaymentPostgresRepository  // Tied to Postgres!
  ) {}
}

// ✅ Good: Interface dependency
class PaymentService {
  constructor(
    private repo: IPaymentRepository  // Could be any implementation
  ) {}
}
```

**Why?**
- **Testing**: Swap in a mock repository instead of real database
- **Flexibility**: Switch databases without changing service code
- **Maintainability**: Clear contracts make code easier to understand

---

## Contracts Defined in This Module

### IAccountRepository
```typescript
export interface IAccountRepository {
  findById(id: string): Promise<Account | null>;
  findByCode(code: string): Promise<Account | null>;
  findAll(): Promise<Account[]>;
  create(data: Omit<Account, "id" | "createdAt" | "updatedAt">): Promise<Account>;
}

// Implementation
export class AccountRepository implements IAccountRepository {
  async findById(id: string): Promise<Account | null> {
    return prisma.account.findUnique({ where: { id } });
  }
  // ...
}
```

### IPaymentRepository
```typescript
export interface IPaymentRepository {
  findById(id: string): Promise<Payment | null>;
  findByIdempotencyKey(key: string): Promise<Payment | null>;
  create(data: Omit<Payment, "id" | "createdAt" | "updatedAt">): Promise<Payment>;
  update(id: string, data: Partial<Payment>): Promise<Payment>;
  findByInvoiceId(invoiceId: string): Promise<Payment[]>;
  findUnposted(): Promise<Payment[]>;
}
```

### IPaymentPostingService
```typescript
export interface IPaymentPostingService {
  postPayment(payload: PostingPayload): Promise<PostingResult>;
  isPaymentPosted(paymentId: string): Promise<boolean>;
}
```

### IPaymentRefundService
```typescript
export interface IPaymentRefundService {
  refundPayment(payload: RefundPayload): Promise<RefundResult>;
  getRefunds(paymentId: string): Promise<Refund[]>;
}
```

### IPaymentReconciliationService
```typescript
export interface IPaymentReconciliationService {
  markReconciled(payload: ReconciliationPayload): Promise<ReconciliationResult>;
  getUnreconciledPayments(): Promise<Payment[]>;
  getReconciliationStatus(paymentId: string): Promise<ReconciliationRecord | null>;
}
```

---

## Dependency Injection Container

The **DI container** is a single place where all dependencies are wired together.

### Container Definition
```typescript
export interface Cradle {
  // Repositories
  accountRepository: IAccountRepository;
  paymentRepository: IPaymentRepository;
  journalEntryRepository: IJournalEntryRepository;

  // Services
  accountingService: IAccountingService;
  paymentPostingService: IPaymentPostingService;
  paymentRefundService: IPaymentRefundService;
  paymentReconciliationService: IPaymentReconciliationService;
  paymentAccountingService: IPaymentAccountingService;
}
```

### Container Implementation
```typescript
export function createContainer(): Cradle {
  // Repositories
  const accountRepository = new AccountRepository();
  const paymentRepository = new PaymentRepository();
  const journalEntryRepository = new JournalEntryRepository();

  // Services
  const accountingService = new AccountingService(accountRepository);
  
  const paymentPostingService = new PaymentPostingService(
    paymentRepository,
    journalEntryRepository,
    accountRepository
  );
  
  const paymentRefundService = new PaymentRefundService(
    paymentRepository,
    journalEntryRepository,
    accountRepository
  );
  
  const paymentReconciliationService = new PaymentReconciliationService(
    paymentRepository
  );
  
  const paymentAccountingService = new PaymentAccountingService(
    paymentRepository,
    journalEntryRepository
  );

  // Return all registered dependencies
  return {
    accountRepository,
    paymentRepository,
    journalEntryRepository,
    accountingService,
    paymentPostingService,
    paymentRefundService,
    paymentReconciliationService,
    paymentAccountingService,
  };
}
```

### Usage in Server
```typescript
import { createContainer } from "./di/container.js";
import { createRoutes } from "./routes/index.js";

const app = express();

// Create container (wires everything)
const cradle = createContainer();

// Pass cradle to routes
const routes = createRoutes(cradle);
app.use(routes);
```

---

## How Controllers Get Dependencies

Controllers receive the `Cradle` and use it:

```typescript
export class PaymentController {
  constructor(private readonly cradle: Cradle) {}

  postPayment = async (req: Request, res: Response) => {
    const payload = PostPaymentSchema.parse(req.body);
    
    // Use service from cradle
    const result = await this.cradle.paymentPostingService.postPayment(payload);
    
    res.json(successResponse("Payment posted successfully", result));
  };

  refundPayment = async (req: Request, res: Response) => {
    const payload = RefundPaymentSchema.parse(req.body);
    
    // Use different service from cradle
    const result = await this.cradle.paymentRefundService.refundPayment(payload);
    
    res.json(successResponse("Payment refunded successfully", result));
  };
}
```

### Creating Controllers in Routes
```typescript
export function createRoutes(cradle: Cradle): Router {
  const router = Router();
  
  // Inject cradle into controllers
  const paymentController = new PaymentController(cradle);
  const accountController = new AccountController(cradle);

  // Use controllers
  router.post(
    "/api/v1/payments/:paymentId/post",
    asyncHandler(paymentController.postPayment)
  );

  return router;
}
```

---

## Layered Architecture

```
Request → Route → Controller → Service → Repository → Database
          ↑                                           ↑
          ├─────────── Injected from Cradle ─────────┤

Flow:
  1. Route receives HTTP request
  2. Calls controller (injected from cradle)
  3. Controller calls service (injected from cradle)
  4. Service calls repository (injected from cradle)
  5. Repository calls Prisma (database client)
  6. Response flows back up through layers
```

---

## Service Dependency Chain

```
PaymentPostingService
  ├─ depends on: IPaymentRepository
  ├─ depends on: IJournalEntryRepository
  └─ depends on: IAccountRepository

PaymentRefundService
  ├─ depends on: IPaymentRepository
  ├─ depends on: IJournalEntryRepository
  └─ depends on: IAccountRepository

PaymentReconciliationService
  └─ depends on: IPaymentRepository

PaymentAccountingService
  ├─ depends on: IPaymentRepository
  └─ depends on: IJournalEntryRepository
```

All dependencies flow through the container, making it easy to:
- Add new services
- Change implementations
- Inject mocks for testing

---

## Testing with DI

### Mock Repository
```typescript
class MockPaymentRepository implements IPaymentRepository {
  private payments: Map<string, Payment> = new Map();

  async findById(id: string): Promise<Payment | null> {
    return this.payments.get(id) || null;
  }

  async create(data: any): Promise<Payment> {
    const payment = { id: "mock-1", ...data };
    this.payments.set(payment.id, payment);
    return payment;
  }
  
  // ... other methods
}
```

### Test Container
```typescript
function createTestContainer(): Cradle {
  const accountRepository = new AccountRepository();
  const paymentRepository = new MockPaymentRepository(); // Use mock!
  const journalRepository = new JournalEntryRepository();

  const paymentPostingService = new PaymentPostingService(
    paymentRepository,      // Mock - no database calls
    journalRepository,
    accountRepository
  );

  return {
    accountRepository,
    paymentRepository,
    journalEntryRepository,
    paymentPostingService,
    // ... other services
  };
}
```

### Test
```typescript
test("posting idempotent payment twice returns success", async () => {
  const cradle = createTestContainer();
  
  const paymentId = "pay-123";
  const payload = { paymentId };

  // First posting
  const result1 = await cradle.paymentPostingService.postPayment(payload);
  expect(result1.success).toBe(true);

  // Second posting (should be idempotent)
  const result2 = await cradle.paymentPostingService.postPayment(payload);
  expect(result2.success).toBe(true);
  expect(result2.message).toContain("Already posted");
});
```

---

## Adding a New Service

1. **Define interface**:
```typescript
export interface IMyNewService {
  doSomething(): Promise<Result>;
}
```

2. **Implement service**:
```typescript
export class MyNewService implements IMyNewService {
  constructor(private readonly repo: IPaymentRepository) {}

  async doSomething(): Promise<Result> {
    // Implementation
  }
}
```

3. **Register in container**:
```typescript
export function createContainer(): Cradle {
  // ... existing code

  const myNewService = new MyNewService(paymentRepository);

  return {
    // ... existing services
    myNewService,  // Add here
  };
}
```

4. **Use in controller**:
```typescript
const result = await cradle.myNewService.doSomething();
```

---

## Key Benefits

| Benefit | Example |
|---------|---------|
| **Testability** | Mock repository, no database in unit tests |
| **Flexibility** | Switch Postgres to MongoDB, service code unchanged |
| **Clarity** | Interface documents what service needs |
| **Reusability** | Service can be reused in different contexts |
| **Maintainability** | Central place to change dependencies |

This is why professional systems use DI. It reduces coupling and makes code more resilient to change.
