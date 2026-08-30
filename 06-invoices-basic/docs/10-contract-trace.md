# 10 - Contract Trace: One Line from UI to DB and Back

## Scenario

User fills invoice form:
- Customer: "ACME Corp" (ID: 1)
- Line 1: Consulting × 5 @ $150
- Clicks "Create Invoice"

Let's trace one invoice line through the entire system.

## Frontend: User Submits Form

**File:** `frontend/src/components/InvoiceForm.tsx`

```typescript
const handleSubmit = async (data: InvoiceFormValue) => {
  // data = {
  //   customerId: 1,
  //   dueDate: "2025-02-28",
  //   notes: "Thank you",
  //   lines: [
  //     { itemId: 1, quantity: 5, rate: 150 }  ← Our line
  //   ]
  // }
  
  await dispatch(createInvoice({
    customerId: 1,
    dueDate: "2025-02-28",
    notes: "Thank you",
    lines: [
      { itemId: 1, quantity: 5, rate: 150 }
    ]
  }));
};
```

## Frontend: Redux Action

**File:** `frontend/src/store/invoiceSlice.ts`

```typescript
export const createInvoice = createAsyncThunk(
  "invoices/create",
  async (data) => {
    // Calls API service
    return InvoiceApiService.createInvoice(data);
  }
);
```

## Frontend: API Call

**File:** `frontend/src/services/api.ts`

```typescript
export class InvoiceApiService {
  static async createInvoice(data) {
    const response = await fetch(`/api/v1/invoices`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId: 1,
        dueDate: "2025-02-28",
        notes: "Thank you",
        lines: [
          { itemId: 1, quantity: 5, rate: 150 }  ← Sent to backend
        ]
      }),
    });

    const result = await response.json();
    return result.data;  // Return invoice
  }
}
```

## Network: HTTP POST Request

```
POST /api/v1/invoices HTTP/1.1
Host: localhost:3001
Content-Type: application/json

{
  "customerId": 1,
  "dueDate": "2025-02-28",
  "notes": "Thank you",
  "lines": [
    { "itemId": 1, "quantity": 5, "rate": 150 }
  ]
}
```

## Backend: Route Binding

**File:** `backend/src/routes/index.ts`

```typescript
export function createInvoiceRoutes(cradle: Cradle): Router {
  const router = Router();

  const invoiceController = new InvoiceController(cradle.invoiceService);

  router.post("/invoices", (req: Request, res: Response) =>
    invoiceController.createInvoice(req, res)  ← Matched route
  );

  return router;
}
```

## Backend: Controller Entry Point

**File:** `backend/src/controllers/InvoiceController.ts`

```typescript
async createInvoice(req: Request, res: Response): Promise<void> {
  // Step 1: Validate request body
  const validatedData = createInvoiceSchema.parse(req.body);
  // validatedData = {
  //   customerId: 1,
  //   dueDate: "2025-02-28",
  //   notes: "Thank you",
  //   lines: [
  //     { itemId: 1, quantity: 5, rate: 150 }  ← Validated and typed
  //   ]
  // }

  // Step 2: Call service
  const result = await this.invoiceService.createInvoice({
    customerId: 1,
    dueDate: "2025-02-28",
    notes: "Thank you",
    lines: [
      { itemId: 1, quantity: 5, rate: 150 }
    ]
  });
}
```

## Backend: Service Business Logic

**File:** `backend/src/services/InvoiceService.ts`

```typescript
async createInvoice(data) {
  // Step 1: Validate customer exists
  await this.customerLookupRepository.findById(1);  // ✓ Exists

  // Step 2: Validate item and calculate line
  const item = await this.itemLookupRepository.findById(1);
  // item = {
  //   id: 1,
  //   name: "Consulting - 1 hour",
  //   unitPrice: Decimal(150),
  //   taxRate: Decimal(18)  ← Tax comes from item
  // }

  const taxRate = Number(item.taxRate);  // 18

  const calculated = this.calculator.calculateLine(
    5,      // quantity
    150,    // rate
    18      // taxRate from item
  );

  // Step 3: Calculate line totals
  // Subtotal = 5 × 150 = 750
  // Tax = 750 × 18% = 135
  // Total = 750 + 135 = 885

  const calculatedLine = {
    itemId: 1,
    quantity: Decimal(5),
    rate: Decimal(150),
    taxRate: Decimal(18),
    lineSubtotal: Decimal(750.00),
    lineTax: Decimal(135.00),
    lineTotal: Decimal(885.00)
  };

  // Step 4: Calculate invoice totals
  const totals = this.calculator.calculateTotals([
    { subtotal: 750, tax: 135, total: 885 }
  ]);
  // totals = {
  //   subtotal: 1250,
  //   totalTax: 225,
  //   total: 1475
  // }

  // Step 5: Generate invoice number
  const invoiceNumber = "INV-2025-0001";

  // Step 6: Persist via repository
  return this.invoiceRepository.create({
    invoiceNumber: "INV-2025-0001",
    customerId: 1,
    dueDate: new Date("2025-02-28"),
    notes: "Thank you",
    subtotal: Decimal(750.00),
    totalTax: Decimal(135.00),
    total: Decimal(885.00),
    lines: [
      {
        itemId: 1,
        quantity: Decimal(5),
        rate: Decimal(150),
        taxRate: Decimal(18),
        lineSubtotal: Decimal(750.00),
        lineTax: Decimal(135.00),
        lineTotal: Decimal(885.00)
      }
    ]
  });
}
```

## Backend: Repository Data Access

**File:** `backend/src/repositories/InvoiceRepository.ts`

```typescript
async create(data) {
  const invoice = await this.prisma.invoice.create({
    data: {
      invoiceNumber: "INV-2025-0001",
      customerId: 1,
      dueDate: new Date("2025-02-28"),
      notes: "Thank you",
      subtotal: Decimal(750.00),
      totalTax: Decimal(135.00),
      total: Decimal(885.00),
      lines: {
        create: [
          {
            itemId: 1,
            quantity: Decimal(5),
            rate: Decimal(150),
            taxRate: Decimal(18),
            lineSubtotal: Decimal(750.00),
            lineTax: Decimal(135.00),
            lineTotal: Decimal(885.00)
          }
        ]
      }
    },
    select: {
      id: true,
      publicId: true,
      invoiceNumber: true
    }
  });
  // ↑ Nested create: Invoice + InvoiceLine in one transaction

  return {
    id: 1,
    publicId: "abc-123-def",
    invoiceNumber: "INV-2025-0001"
  };
}
```

## Database: Transaction

Prisma nested creates become a **transaction**:

```sql
BEGIN;

INSERT INTO invoices (
  publicId, invoiceNumber, customerId, dueDate, notes, 
  subtotal, totalTax, total, status, createdAt, updatedAt
) VALUES (
  'abc-123-def', 'INV-2025-0001', 1, '2025-02-28', 'Thank you',
  750.00, 135.00, 885.00, 'DRAFT', NOW(), NOW()
) RETURNING id;
-- Inserted: id = 1

INSERT INTO invoice_lines (
  invoiceId, itemId, quantity, rate, taxRate,
  lineSubtotal, lineTax, lineTotal, createdAt, updatedAt
) VALUES (
  1, 1, 5.00, 150.00, 18.00,
  750.00, 135.00, 885.00, NOW(), NOW()
);

COMMIT;
```

## Backend: Response Generation

**File:** `backend/src/controllers/InvoiceController.ts`

```typescript
// Get full invoice with relations
const invoice = await this.invoiceService.getInvoice(result.publicId);

// invoice = {
//   id: 1,
//   publicId: "abc-123-def",
//   invoiceNumber: "INV-2025-0001",
//   customerId: 1,
//   customerName: "ACME Corp",
//   status: "DRAFT",
//   subtotal: "750.00",
//   totalTax: "135.00",
//   total: "885.00",
//   notes: "Thank you",
//   dueDate: "2025-02-28",
//   createdAt: "2025-01-15T10:30:00Z",
//   updatedAt: "2025-01-15T10:30:00Z",
//   lines: [
//     {
//       id: 1,
//       itemId: 1,
//       itemName: "Consulting - 1 hour",
//       quantity: "5.00",
//       rate: "150.00",
//       taxRate: "18.00",
//       lineSubtotal: "750.00",
//       lineTax: "135.00",
//       lineTotal: "885.00"
//     }
//   ]
// }

res.status(201).json({
  success: true,
  data: invoice  ← DTO sent to frontend
});
```

## Network: HTTP Response

```
HTTP/1.1 201 Created
Content-Type: application/json

{
  "success": true,
  "data": {
    "id": 1,
    "publicId": "abc-123-def",
    "invoiceNumber": "INV-2025-0001",
    "customerId": 1,
    "customerName": "ACME Corp",
    "status": "DRAFT",
    "subtotal": "750.00",
    "totalTax": "135.00",
    "total": "885.00",
    "notes": "Thank you",
    "dueDate": "2025-02-28",
    "createdAt": "2025-01-15T10:30:00Z",
    "updatedAt": "2025-01-15T10:30:00Z",
    "lines": [
      {
        "id": 1,
        "itemId": 1,
        "itemName": "Consulting - 1 hour",
        "quantity": "5.00",
        "rate": "150.00",
        "taxRate": "18.00",
        "lineSubtotal": "750.00",
        "lineTax": "135.00",
        "lineTotal": "885.00"
      }
    ]
  }
}
```

## Frontend: Redux State Update

**File:** `frontend/src/store/invoiceSlice.ts`

```typescript
builder.addCase(createInvoice.fulfilled, (state, action) => {
  state.loading = false;
  state.current = action.payload;  // ← Invoice stored in Redux
});
```

Redux state now contains:
```javascript
state.invoices = {
  current: {
    id: 1,
    publicId: "abc-123-def",
    invoiceNumber: "INV-2025-0001",
    // ...
    lines: [
      {
        id: 1,
        itemId: 1,
        itemName: "Consulting - 1 hour",
        quantity: "5.00",
        rate: "150.00",
        // ...
      }
    ]
  },
  // ...
}
```

## Frontend: Navigation & Display

**File:** `frontend/src/pages/InvoiceFormPage.tsx`

```typescript
const handleSubmit = async (data) => {
  const result = await dispatch(createInvoice(data)).unwrap();
  // result contains the invoice with publicId
  navigate(`/invoices/${result.publicId}`);  // Go to detail page
};
```

User is navigated to invoice detail page.

## Frontend: Invoice Display

**File:** `frontend/src/pages/InvoiceDetailPage.tsx`

```typescript
const invoice = useSelector(selectCurrentInvoice);

return (
  <div>
    <h1>{invoice.invoiceNumber}</h1>
    <p>Customer: {invoice.customerName}</p>

    <table>
      <tbody>
        {invoice.lines.map((line) => (
          <tr key={line.id}>
            <td>{line.itemName}</td>
            <td>{line.quantity}</td>
            <td>${line.rate}</td>
            <td>${line.lineTotal}</td>
          </tr>
        ))}
      </tbody>
    </table>

    <div>
      <p>Subtotal: ${invoice.subtotal}</p>
      <p>Tax: ${invoice.totalTax}</p>
      <p>Total: ${invoice.total}</p>
    </div>
  </div>
);
```

## Full Circle

```
Frontend Form Input (quantity: 5, rate: 150)
  ↓
Redux Action
  ↓
API Call (POST /api/v1/invoices)
  ↓
HTTP Request
  ↓
Backend Route
  ↓
Controller validates with Zod
  ↓
Service fetches item (tax: 18)
  ↓
Calculator: 5 × 150 = 750, tax = 135, total = 885
  ↓
Repository creates Invoice + InvoiceLine in transaction
  ↓
Database: INSERT invoice, INSERT invoice_line
  ↓
Service retrieves full invoice with relations
  ↓
Controller formats as DTO
  ↓
HTTP 201 Response with invoice data
  ↓
Redux stores invoice in state
  ↓
Component selects from Redux
  ↓
UI displays: "Consulting × 5 @ $150 = $885"
```

## Key Takeaways

1. **Type Safety**: Data typed all the way (frontend → backend → DB → frontend)
2. **Validation**: Zod validates at boundary, calculator validates logic
3. **Calculation**: Happens once in backend, stored, sent to frontend
4. **Real-Time Preview**: Frontend recalculates for UI feedback (without API)
5. **Transaction Safety**: Nested creates ensure invoice + lines are created together
6. **Contracts**: Each layer depends on interfaces, not implementations
7. **DTOs**: Data transformed to DTOs for API response (not raw DB records)
8. **Redux**: Central state store (single source of truth)
9. **Navigation**: After creation, navigate to detail page
