# 04 - Backend Create Flow

## Endpoint: POST /api/v1/invoices

**Request:**
```json
{
  "customerId": 1,
  "dueDate": "2025-02-28",
  "notes": "Thank you for your business",
  "lines": [
    { "itemId": 1, "quantity": 2, "rate": 150 },
    { "itemId": 2, "quantity": 1, "rate": 200 }
  ]
}
```

## Data Flow Through DI Container

### 1. Express Route Binding
**File:** `backend/src/routes/index.ts`

```typescript
router.post("/invoices", (req: Request, res: Response) =>
  invoiceController.createInvoice(req, res)
);
```

Route is bound to controller method. DI container creates the controller.

### 2. Controller Entry Point
**File:** `backend/src/controllers/InvoiceController.ts`

```typescript
async createInvoice(req: Request, res: Response): Promise<void> {
  // Parse and validate request body
  const validatedData = createInvoiceSchema.parse(req.body);

  // Call service
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

  // Fetch full invoice with relations
  const invoice = await this.invoiceService.getInvoice(result.publicId);

  // Return response
  res.status(201).json({
    success: true,
    data: invoice,
  });
}
```

**Contract:** Controller depends on `IInvoiceService`
**Validation:** Zod schema validates structure

### 3. Service Business Logic
**File:** `backend/src/services/InvoiceService.ts`

```typescript
async createInvoice(data: {
  customerId: number;
  dueDate: string | null;
  notes: string | null;
  lines: Array<{ itemId: number; quantity: number; rate: number }>;
}): Promise<{ id: number; publicId: string; invoiceNumber: string }> {
  // Step 1: Validate customer exists
  await this.customerLookupRepository.findById(data.customerId);

  // Step 2: Validate items and calculate lines
  const calculatedLines = await Promise.all(
    data.lines.map(async (line) => {
      const item = await this.itemLookupRepository.findById(line.itemId);
      const taxRate = Number(item.taxRate);
      const calculated = this.calculator.calculateLine(
        line.quantity,
        line.rate,
        taxRate
      );

      return {
        itemId: line.itemId,
        quantity: this.calculator.toDecimal(calculated.quantity),
        rate: this.calculator.toDecimal(calculated.rate),
        taxRate: this.calculator.toDecimal(calculated.taxRate),
        lineSubtotal: this.calculator.toDecimal(calculated.subtotal),
        lineTax: this.calculator.toDecimal(calculated.tax),
        lineTotal: this.calculator.toDecimal(calculated.total),
      };
    })
  );

  // Step 3: Calculate invoice totals
  const lineCalculations = calculatedLines.map((line) => ({
    subtotal: Number(line.lineSubtotal),
    tax: Number(line.lineTax),
    total: Number(line.lineTotal),
  }));
  const totals = this.calculator.calculateTotals(lineCalculations);

  // Step 4: Generate invoice number
  const invoiceNumber = await this.invoiceNumberService.generateInvoiceNumber();

  // Step 5: Persist to database
  return this.invoiceRepository.create({
    invoiceNumber,
    customerId: data.customerId,
    dueDate: data.dueDate ? new Date(data.dueDate) : null,
    notes: data.notes || null,
    subtotal: this.calculator.toDecimal(totals.subtotal),
    totalTax: this.calculator.toDecimal(totals.totalTax),
    total: this.calculator.toDecimal(totals.total),
    lines: calculatedLines,
  });
}
```

**Contracts depended on:**
- `ICustomerLookupRepository` - Find customer by ID
- `IItemLookupRepository` - Find item by ID
- `IInvoiceCalculator` - Calculate line and invoice totals
- `IInvoiceNumberService` - Generate next number
- `IInvoiceRepository` - Persist invoice

**Errors handled:** If any step fails, exception bubbles up to controller

### 4. Calculation Separation
**File:** `backend/src/utils/InvoiceCalculator.ts`

```typescript
export class InvoiceCalculator implements IInvoiceCalculator {
  calculateLine(quantity: number, rate: number, taxRate: number): LineCalculation {
    const subtotal = quantity * rate;
    const tax = (subtotal * taxRate) / 100;
    const total = subtotal + tax;
    return {
      quantity,
      rate,
      taxRate,
      subtotal: Math.round(subtotal * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      total: Math.round(total * 100) / 100,
    };
  }

  calculateTotals(lines: LineCalculation[]): InvoiceTotals {
    const subtotal = lines.reduce((sum, line) => sum + line.subtotal, 0);
    const totalTax = lines.reduce((sum, line) => sum + line.tax, 0);
    const total = subtotal + totalTax;
    return {
      subtotal: Math.round(subtotal * 100) / 100,
      totalTax: Math.round(totalTax * 100) / 100,
      total: Math.round(total * 100) / 100,
    };
  }

  toDecimal(value: number): Decimal {
    return new Decimal(value.toFixed(2));
  }
}
```

**Why separate?**
- Logic is pure and testable
- No database or HTTP concerns
- Reused by update and other operations
- Easy to test with different tax rates

### 5. Repository Data Access
**File:** `backend/src/repositories/InvoiceRepository.ts`

```typescript
async create(data: {
  invoiceNumber: string;
  customerId: number;
  dueDate: Date | null;
  notes: string | null;
  subtotal: Decimal;
  totalTax: Decimal;
  total: Decimal;
  lines: Array<{...}>;
}): Promise<{ id: number; publicId: string; invoiceNumber: string }> {
  const invoice = await this.prisma.invoice.create({
    data: {
      invoiceNumber: data.invoiceNumber,
      customerId: data.customerId,
      dueDate: data.dueDate,
      notes: data.notes,
      subtotal: data.subtotal,
      totalTax: data.totalTax,
      total: data.total,
      lines: {
        create: data.lines.map((line) => ({
          itemId: line.itemId,
          quantity: line.quantity,
          rate: line.rate,
          taxRate: line.taxRate,
          lineSubtotal: line.lineSubtotal,
          lineTax: line.lineTax,
          lineTotal: line.lineTotal,
        })),
      },
    },
    select: {
      id: true,
      publicId: true,
      invoiceNumber: true,
    },
  });

  return invoice;
}
```

**Key feature:** Prisma nested creates - `lines: { create: [...] }` creates invoice and all lines in one operation. If any fails, entire transaction rolls back.

### 6. DI Container Wiring
**File:** `backend/src/di/container.ts`

```typescript
export function createCradle(prisma: PrismaClient): Cradle {
  const calculator = new InvoiceCalculator();
  const invoiceNumberService = new InvoiceNumberService(prisma);
  const customerLookupRepository = new CustomerLookupRepository(prisma);
  const itemLookupRepository = new ItemLookupRepository(prisma);
  const invoiceRepository = new InvoiceRepository(prisma);

  const invoiceService = new InvoiceService(
    invoiceRepository,
    invoiceNumberService,
    customerLookupRepository,
    itemLookupRepository,
    calculator
  );

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

All dependencies are wired in one place. Services get what they need via constructor.

### 7. Server Bootstrap
**File:** `backend/src/server.ts`

```typescript
const prisma = new PrismaClient();
const cradle = createCradle(prisma);
const app = express();
app.use("/api/v1", createInvoiceRoutes(cradle));
app.listen(PORT, () => {
  console.log(`✅ Invoice API listening on port ${PORT}`);
});
```

Server creates Cradle once, passes to route factory. All requests use same Cradle.

## Summary of DI Flow

```
HTTP POST /api/v1/invoices
        ↓
createInvoiceRoutes(cradle) binds route
        ↓
InvoiceController.createInvoice (from cradle)
        ↓
Validates with Zod schema
        ↓
InvoiceService.createInvoice (from cradle)
        ↓
    ICustomerLookupRepository.findById
    IItemLookupRepository.findById (multiple calls)
    IInvoiceCalculator.calculateLine (for each line)
    IInvoiceCalculator.calculateTotals
    IInvoiceNumberService.generateInvoiceNumber
    IInvoiceRepository.create (with nested lines)
        ↓
Prisma creates Invoice + InvoiceLines in transaction
        ↓
Return publicId + invoiceNumber
        ↓
InvoiceService.getInvoice (fetch with relations)
        ↓
InvoiceController formats as DTO
        ↓
HTTP 201 response with invoice data
```

## Why This Design?

1. **Separation of concerns**: Each class has one job
2. **Testability**: Interfaces mean easy mocking
3. **Reusability**: Same services used for create, update, list
4. **Transaction safety**: Nested creates ensure atomicity
5. **Type safety**: TypeScript catches errors at compile time
6. **Validation early**: Zod validates at route boundary
