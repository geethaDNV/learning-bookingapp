# 09 - Contracts, DI, and Typing

## Contracts (Interfaces)

Contracts define the boundary between components. They answer: "What can I rely on from this component?"

**File:** `backend/src/di/contracts.ts`

### Example: IInvoiceCalculator

```typescript
export interface IInvoiceCalculator {
  calculateLine(
    quantity: number,
    rate: number,
    taxRate: number
  ): LineCalculation;

  calculateTotals(lines: LineCalculation[]): InvoiceTotals;

  toDecimal(value: number): Decimal;
}
```

**What it says:**
- Any object implementing `IInvoiceCalculator` has these three methods
- `calculateLine()` takes 3 numbers, returns `LineCalculation`
- `calculateTotals()` takes array of `LineCalculation`, returns `InvoiceTotals`
- `toDecimal()` takes number, returns `Decimal`

### Why Contracts?

1. **Decoupling**: Service depends on interface, not concrete class
2. **Testing**: Mock the interface instead of real implementation
3. **Swapping**: Replace implementation without changing service code
4. **Documentation**: Interface documents what's expected

## Implementation

The concrete class implements the interface:

```typescript
export class InvoiceCalculator implements IInvoiceCalculator {
  calculateLine(
    quantity: number,
    rate: number,
    taxRate: number
  ): LineCalculation {
    // Implementation
  }

  calculateTotals(lines: LineCalculation[]): InvoiceTotals {
    // Implementation
  }

  toDecimal(value: number): Decimal {
    // Implementation
  }
}
```

## Dependency Injection (DI)

**Problem without DI:**
```typescript
// InvoiceService creates its own dependencies
export class InvoiceService {
  private calculator = new InvoiceCalculator();  // ❌ Tightly coupled
  private numberService = new InvoiceNumberService();
  // ...
}
```

Issues:
- Hard to test (can't mock calculator)
- Hard to swap implementations
- Hidden dependencies (not obvious from constructor)

**Solution with DI:**
```typescript
// Dependencies injected via constructor
export class InvoiceService implements IInvoiceService {
  constructor(
    private invoiceRepository: IInvoiceRepository,
    private invoiceNumberService: IInvoiceNumberService,
    private customerLookupRepository: ICustomerLookupRepository,
    private itemLookupRepository: IItemLookupRepository,
    private calculator: IInvoiceCalculator  // ← Injected
  ) {}
  // ...
}
```

Benefits:
- Easy to test (inject mock calculator)
- Easy to swap implementations
- Clear dependencies in constructor
- Follows Dependency Inversion Principle

## DI Container

**File:** `backend/src/di/container.ts`

Centralizes wiring:

```typescript
export function createCradle(prisma: PrismaClient): Cradle {
  // Create implementations
  const calculator = new InvoiceCalculator();
  const invoiceNumberService = new InvoiceNumberService(prisma);
  const customerLookupRepository = new CustomerLookupRepository(prisma);
  const itemLookupRepository = new ItemLookupRepository(prisma);
  const invoiceRepository = new InvoiceRepository(prisma);

  // Wire together
  const invoiceService = new InvoiceService(
    invoiceRepository,
    invoiceNumberService,
    customerLookupRepository,
    itemLookupRepository,
    calculator
  );

  // Return typed container
  return {
    prisma,
    calculator,
    invoiceNumberService,
    customerLookupRepository,
    itemLookupRepository,
    invoiceRepository,
    invoiceService,
  };
}
```

**Benefits:**
- All wiring in one place
- Easy to add/remove services
- Type-safe with `Cradle` interface
- No global singletons

## Typed Cradle

**File:** `backend/src/di/container.ts`

```typescript
export interface Cradle {
  prisma: PrismaClient;
  calculator: IInvoiceCalculator;
  invoiceNumberService: IInvoiceNumberService;
  customerLookupRepository: ICustomerLookupRepository;
  itemLookupRepository: IItemLookupRepository;
  invoiceRepository: IInvoiceRepository;
  invoiceService: IInvoiceService;
}
```

In server:
```typescript
const cradle = createCradle(prisma);
const invoiceService: IInvoiceService = cradle.invoiceService;
```

TypeScript ensures:
- Cradle has all required services
- Services match their interfaces
- Compile-time errors if wiring is wrong

## Typing in Controllers

**File:** `backend/src/controllers/InvoiceController.ts`

```typescript
export class InvoiceController {
  constructor(private invoiceService: IInvoiceService) {}
  // ↑ Depends on interface, not concrete class

  async createInvoice(req: Request, res: Response): Promise<void> {
    const validatedData = createInvoiceSchema.parse(req.body);
    // ↑ Zod validates and types the data

    const result = await this.invoiceService.createInvoice({
      customerId: validatedData.customerId,
      dueDate: validatedData.dueDate ?? null,
      notes: validatedData.notes ?? null,
      lines: validatedData.lines.map((line) => ({
        itemId: line.itemId,
        quantity: Number(line.quantity),
        rate: Number(line.rate),
      })),
    });
    // ↑ TypeScript knows all fields exist
  }
}
```

## Typing in Routes

**File:** `backend/src/routes/index.ts`

```typescript
export function createInvoiceRoutes(cradle: Cradle): Router {
  const router = Router();

  // Cradle is typed, so InvoiceController gets typed service
  const invoiceController = new InvoiceController(cradle.invoiceService);

  router.post("/invoices", (req: Request, res: Response) =>
    invoiceController.createInvoice(req, res)
  );

  return router;
}
```

## Frontend Typing

### Redux Store

**File:** `frontend/src/store/index.ts`

```typescript
export const store = configureStore({
  reducer: {
    invoices: invoiceReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

In components:
```typescript
const dispatch = useDispatch<AppDispatch>();
const invoices = useSelector((state: RootState) => state.invoices.list);
```

### React Hook Form

**File:** `frontend/src/components/InvoiceForm.tsx`

```typescript
interface InvoiceFormValue {
  customerId: number;
  dueDate: string;
  notes: string;
  lines: InvoiceLineFormValue[];
}

const form = useForm<InvoiceFormValue>({
  resolver: zodResolver(invoiceFormSchema),
  // ↑ Zod schema ensures form values match type
});
```

Form fields are type-safe:
```typescript
{form.register("customerId")}  // ✓ Correct field
{form.register("invalidField")}  // ✗ Type error
```

## Validation Layers

### Backend: Zod Schemas

**File:** `backend/src/schemas/index.ts`

```typescript
export const createInvoiceSchema = z.object({
  customerId: z.number().int().positive(),
  lines: z.array(
    z.object({
      itemId: z.number().int().positive(),
      quantity: z.coerce.number().positive(),
      rate: z.coerce.number().nonnegative(),
    })
  ),
});

export type CreateInvoiceSchemaType = z.infer<typeof createInvoiceSchema>;
// ↑ Type derived from schema
```

Controller uses both:
```typescript
const validatedData = createInvoiceSchema.parse(req.body);
// ↑ Validates at runtime

const data: CreateInvoiceSchemaType = validatedData;
// ↑ Type-safe, matches schema
```

### Frontend: Zod Schemas

**File:** `frontend/src/components/InvoiceForm.tsx`

Same approach:
```typescript
const invoiceFormSchema = z.object({
  customerId: z.number().int().positive(),
  lines: z.array(...),
});

type InvoiceFormValue = z.infer<typeof invoiceFormSchema>;

const form = useForm<InvoiceFormValue>({
  resolver: zodResolver(invoiceFormSchema),
});
```

## Type Safety Flow

```
Raw HTTP Request
    ↓
Zod Schema Validation
    ↓
CreateInvoiceSchemaType (typed)
    ↓
IInvoiceService.createInvoice(typed data)
    ↓
IInvoiceCalculator.calculateLine(typed inputs)
    ↓
LineCalculation (typed return)
    ↓
IInvoiceRepository.create(typed data)
    ↓
Prisma.invoice.create() (database)
    ↓
Invoice DTO (typed response)
    ↓
HTTP 201 JSON Response
```

Every step is typed, so errors caught at compile-time.

## Testing with Mocks

Because of contracts, testing is easy:

```typescript
// Mock calculator
const mockCalculator: IInvoiceCalculator = {
  calculateLine: () => ({ subtotal: 0, tax: 0, total: 0 }),
  calculateTotals: () => ({ subtotal: 0, totalTax: 0, total: 0 }),
  toDecimal: (v) => new Decimal(v),
};

// Inject mock into service
const service = new InvoiceService(
  mockRepository,
  mockNumberService,
  mockCustomerRepo,
  mockItemRepo,
  mockCalculator  // ← Mock used instead of real
);

// Test service logic without real database
const result = await service.createInvoice(testData);
expect(result.invoiceNumber).toStartWith("INV-");
```

## Summary

- **Contracts**: Interfaces define boundaries between components
- **Dependency Injection**: Services receive dependencies via constructor
- **DI Container**: Centralizes wiring in one place (`Cradle`)
- **Typed Cradle**: Interface ensures all wiring is correct
- **Zod Schemas**: Runtime validation + TypeScript types
- **Type Flow**: Data typed all the way through
- **Testing**: Mock interfaces for isolated testing
- **No `any`**: Strict types prevent entire classes of bugs
