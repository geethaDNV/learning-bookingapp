# 10 - Contracts, DI, and Typing

## Why Contracts Matter

**Contract** = An interface that defines what a service must do.

Without contracts:
```typescript
// ✗ BAD: Tightly coupled
const mockService = new MockEmailService();
const resendService = new ResendEmailService();
const controller = new InvoiceEmailController(mockService); // Hard-coded!
```

With contracts:
```typescript
// ✓ GOOD: Loosely coupled
interface IEmailService {
  sendInvoiceEmail(input: SendInvoiceEmailInput): Promise<SendEmailResult>;
}

const emailService: IEmailService = config.env === 'prod' 
  ? new ResendEmailService(apiKey)
  : new MockEmailService();

const controller = new InvoiceEmailController(emailService); // Flexible!
```

## Email Service Contract

**File:** `backend/src/types/index.ts`

```typescript
export interface SendInvoiceEmailInput {
  to: string;
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  invoicePdfBuffer?: Buffer;
  invoiceNumber: string;
  paymentLink?: string;
}

export interface SendEmailResult {
  messageId?: string;
  success: boolean;
  error?: string;
  provider?: string;
}

export interface IEmailService {
  sendInvoiceEmail(input: SendInvoiceEmailInput): Promise<SendEmailResult>;
  validateEmail(email: string): boolean;
}
```

**Who implements:**
- `MockEmailService` - for dev/testing
- `ResendEmailService` - for production

**Who uses:**
- `InvoiceEmailService` - business logic
- Tests - easily mock by passing test implementation

## Repository Contracts

**File:** `backend/src/types/index.ts`

```typescript
export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  amount: number;
  dueDate: Date;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  createdAt: Date;
}

export interface IInvoiceRepository {
  findById(id: string): Promise<Invoice | null>;
  findByInvoiceNumber(invoiceNumber: string): Promise<Invoice | null>;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  organizationId?: string;
  createdAt: Date;
}

export interface ICustomerRepository {
  findById(id: string): Promise<Customer | null>;
}
```

**Who implements:**
- `InMemoryInvoiceRepository` - for learning
- `PrismaInvoiceRepository` - for production (you would create)
- `InMemoryCustomerRepository` - for learning
- `PrismaCustomerRepository` - for production (you would create)

## Business Logic Contract

**File:** `backend/src/types/index.ts`

```typescript
export interface IInvoiceEmailService {
  /**
   * Orchestrates invoice email workflow:
   * 1. Validates recipients
   * 2. Loads invoice/customer data
   * 3. Prepares email content
   * 4. Calls email provider
   */
  sendInvoiceEmail(input: SendInvoiceEmailInput): Promise<SendEmailResult>;

  /**
   * Preview email without sending.
   * Used by frontend preview button.
   */
  previewInvoiceEmail(
    invoiceId: string,
    customizableBody?: string
  ): Promise<{ subject: string; body: string }>;
}
```

**Who implements:**
- `InvoiceEmailService` - main implementation

**Who uses:**
- `InvoiceEmailController` - routes requests to service
- Tests - can mock for testing controller in isolation

## Dependency Injection (DI)

The **DI Container** wires everything together.

**File:** `backend/src/di/container.ts`

```typescript
export class ServiceContainer {
  private static instance: ServiceContainer;

  private emailService: IEmailService;
  private invoiceRepository: IInvoiceRepository;
  private customerRepository: ICustomerRepository;
  private invoiceEmailService: IInvoiceEmailService;

  private constructor() {
    // 1. Create repositories
    this.invoiceRepository = new InMemoryInvoiceRepository();
    this.customerRepository = new InMemoryCustomerRepository();

    // 2. Create email service (based on config)
    if (config.email.provider === 'resend') {
      this.emailService = new ResendEmailService(
        config.email.apiKey,
        config.email.from
      );
    } else {
      this.emailService = new MockEmailService(config.email.from);
    }

    // 3. Create business logic service
    this.invoiceEmailService = new InvoiceEmailService(
      this.emailService,           // Injected
      this.invoiceRepository,      // Injected
      this.customerRepository      // Injected
    );
  }

  // Singleton accessor
  static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer();
    }
    return ServiceContainer.instance;
  }

  // Getters for services
  getEmailService(): IEmailService {
    return this.emailService;
  }

  getInvoiceEmailService(): IInvoiceEmailService {
    return this.invoiceEmailService;
  }
}
```

### How DI Works

**Initialization:**
```typescript
// In server.ts
const container = ServiceContainer.getInstance();
const invoiceEmailService = container.getInvoiceEmailService();
const controller = new InvoiceEmailController(invoiceEmailService);
```

**Dependency Graph:**
```
┌─────────────────────────────────┐
│ ServiceContainer (DI)           │
└───────────────┬─────────────────┘
                │
    ┌───────────┼───────────┐
    │           │           │
    ▼           ▼           ▼
┌───────────┐ ┌──────────┐ ┌──────────┐
│ EmailSvc  │ │ InvoicSvc│ │CustSvc   │
│ (Mock)    │ │(In-Memory)          │
└───────────┘ └──────────┘ └──────────┘
    │           │           │
    └───────────┼───────────┘
                │
                ▼
    ┌───────────────────────┐
    │InvoiceEmailService    │
    │(orchestrator)         │
    └───────────┬───────────┘
                │
                ▼
    ┌───────────────────────┐
    │InvoiceEmailController │
    │(HTTP handler)         │
    └───────────────────────┘
```

### Swapping Implementations

**To use Resend instead of Mock:**

```typescript
// In .env
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_xxx...

// In container.ts (already handles this)
if (config.email.provider === 'resend') {
  this.emailService = new ResendEmailService(...);
} else {
  this.emailService = new MockEmailService(...);
}

// No other code changes needed!
// Controller still uses IEmailService interface
```

## Type Safety

### End-to-End Typing

**Backend Request:**
```typescript
// Interface defines shape
interface SendInvoiceEmailInput {
  to: string;
  cc?: string[];
  subject: string;
  body: string;
}

// Zod validates at runtime
const schema = z.object({
  to: z.string().email(),
  cc: z.array(z.string().email()).optional(),
  subject: z.string().max(255),
  body: z.string().max(10000),
});

// Type extracted from schema
type SendInvoiceEmailRequest = z.infer<typeof schema>;

// Controller uses typed values
const request: SendInvoiceEmailRequest = schema.parse(req.body);
await service.sendInvoiceEmail(request);
```

**Frontend Request:**
```typescript
// Mirror backend types
interface SendInvoiceEmailRequest {
  to: string;
  cc?: string[];
  subject: string;
  body: string;
}

// Zod validates form
const schema = z.object({
  to: z.string().email(),
  cc: z.string().optional(),  // Parse to array later
  subject: z.string().max(255),
  body: z.string().max(10000),
});

// Type extracted
type SendEmailFormValues = z.infer<typeof schema>;

// Component uses typed values
const form = useForm<SendEmailFormValues>({
  resolver: zodResolver(schema),
});

// API call is typed
const response = await api.sendInvoiceEmail(invoiceId, {
  to: values.to,
  cc: parseCSV(values.cc),
  subject: values.subject,
  body: values.body,
});
```

### No `any` Types

**✗ BAD:**
```typescript
interface EmailService {
  send(input: any): Promise<any>;
}

const result: any = await service.send(data);
```

**✓ GOOD:**
```typescript
interface IEmailService {
  sendInvoiceEmail(input: SendInvoiceEmailInput): Promise<SendEmailResult>;
}

const result: SendEmailResult = await service.sendInvoiceEmail(data);
```

## Testing with Contracts

Contracts make testing much easier:

```typescript
// Mock implementation for testing
class MockEmailServiceForTests implements IEmailService {
  private sentEmails: SendInvoiceEmailInput[] = [];

  async sendInvoiceEmail(input: SendInvoiceEmailInput): Promise<SendEmailResult> {
    this.sentEmails.push(input);
    return { success: true, messageId: 'test_123' };
  }

  getSentEmails() {
    return this.sentEmails;
  }
}

// Test the controller
test('sends invoice email with correct recipients', async () => {
  const mockEmailService = new MockEmailServiceForTests();
  const mockInvoiceRepo = new MockInvoiceRepository();
  const mockCustomerRepo = new MockCustomerRepository();

  const service = new InvoiceEmailService(
    mockEmailService,
    mockInvoiceRepo,
    mockCustomerRepo
  );

  const result = await service.sendInvoiceEmail({
    to: 'customer@example.com',
    subject: 'Test',
    body: '<p>Test</p>',
    invoiceNumber: 'INV-001',
  });

  expect(result.success).toBe(true);
  expect(mockEmailService.getSentEmails()).toHaveLength(1);
  expect(mockEmailService.getSentEmails()[0].to).toBe('customer@example.com');
});
```

## File Organization

```
backend/src/
├── types/
│   └── index.ts              # Contracts (interfaces)
│
├── services/
│   ├── mockEmailService.ts   # Mock implementation
│   ├── resendEmailService.ts # Resend implementation
│   ├── invoiceEmailService.ts # Business logic
│   └── repositories/
│       └── inMemoryInvoiceRepository.ts
│
├── controllers/
│   └── invoiceEmailController.ts  # Uses contracts
│
├── di/
│   └── container.ts          # Wires dependencies
│
└── middleware/
    └── errorHandler.ts       # Generic error handling
```

**Order of reading:**
1. `types/index.ts` - Define contracts
2. `services/mock*.ts` - Simple implementation
3. `services/invoice*.ts` - Orchestrator using contracts
4. `di/container.ts` - Wiring
5. `controllers/*.ts` - HTTP handlers

## Key Principles

1. **Program to interfaces, not implementations**
   - Controller depends on `IEmailService`, not `MockEmailService`

2. **Dependency Injection**
   - Dependencies passed in, not created
   - Container manages lifecycle

3. **Single Responsibility**
   - `MockEmailService` - simulates email
   - `ResendEmailService` - calls Resend API
   - `InvoiceEmailService` - orchestrates workflow

4. **Type Safety**
   - Interfaces define contracts
   - TypeScript enforces at compile time
   - Zod validates at runtime

5. **Testability**
   - Swap implementations for testing
   - No hidden dependencies
   - Easy to mock

## Next Steps

1. Read **11-contract-trace.md** to follow a request through the system
2. Read **12-how-this-maps-to-production.md** to see production patterns
3. Explore `backend/src/di/container.ts` to see actual wiring
4. Review `backend/src/types/index.ts` for interface definitions
