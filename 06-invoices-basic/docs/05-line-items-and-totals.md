# 05 - Line Items and Totals

## Line Item Structure

Each line item in an invoice represents one "row":

```
┌─────────────────────────────────────────────────┐
│ Item: "Consulting - 1 hour"                     │
│ Qty: 5                                          │
│ Rate: $150 (per unit)                           │
│ Tax: 18%                                        │
│ ────────────────────────────────────────────    │
│ Subtotal: 5 × $150 = $750                       │
│ Tax: $750 × 18% = $135                          │
│ Total: $750 + $135 = $885                       │
└─────────────────────────────────────────────────┘
```

## Calculation Logic

### Line-Level Calculation

**Input:**
```
quantity: 5
rate: 150
taxRate: 18
```

**Calculation:**
```typescript
subtotal = quantity * rate
         = 5 * 150
         = 750

tax = subtotal * (taxRate / 100)
    = 750 * (18 / 100)
    = 750 * 0.18
    = 135

total = subtotal + tax
      = 750 + 135
      = 885
```

**Code:**
```typescript
// In InvoiceCalculator.calculateLine()
calculateLine(quantity: number, rate: number, taxRate: number): LineCalculation {
  const subtotal = quantity * rate;
  const tax = (subtotal * taxRate) / 100;
  const total = subtotal + tax;

  return {
    quantity,
    rate,
    taxRate,
    subtotal: Math.round(subtotal * 100) / 100,  // Round to 2 decimals
    tax: Math.round(tax * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}
```

**Why `Math.round(...* 100) / 100`?**
Avoids floating-point errors like `0.1 + 0.2 = 0.30000000000000004`.

### Invoice-Level Calculation

**Input:** Array of line calculations

```typescript
lines = [
  { subtotal: 750, tax: 135, total: 885 },
  { subtotal: 500, tax: 90, total: 590 },
]
```

**Calculation:**
```typescript
subtotal = sum of all line subtotals
         = 750 + 500
         = 1250

totalTax = sum of all line taxes
         = 135 + 90
         = 225

total = subtotal + totalTax
      = 1250 + 225
      = 1475
```

**Code:**
```typescript
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
```

## Full Invoice Example

### Input Data
```json
{
  "customerId": 1,
  "dueDate": "2025-02-28",
  "notes": "Thank you!",
  "lines": [
    {
      "itemId": 1,
      "quantity": 5,
      "rate": 150
    },
    {
      "itemId": 2,
      "quantity": 1,
      "rate": 500
    }
  ]
}
```

### Backend Processing

**For Line 1 (itemId=1):**
```
item.name = "Consulting - 1 hour"
item.taxRate = 18

quantity = 5
rate = 150
taxRate = 18

Subtotal = 5 × 150 = 750
Tax = 750 × 18% = 135
Total = 885
```

**For Line 2 (itemId=2):**
```
item.name = "Development - 1 hour"
item.taxRate = 18

quantity = 1
rate = 500
taxRate = 18

Subtotal = 1 × 500 = 500
Tax = 500 × 18% = 90
Total = 590
```

**Invoice Totals:**
```
Subtotal = 750 + 500 = 1250
Total Tax = 135 + 90 = 225
Total = 1250 + 225 = 1475
```

### Database Storage

**Invoice record:**
```
id: 1
publicId: "abc-123-def"
invoiceNumber: "INV-2025-0001"
customerId: 1
status: "DRAFT"
subtotal: 1250.00
totalTax: 225.00
total: 1475.00
notes: "Thank you!"
dueDate: 2025-02-28
```

**InvoiceLine records:**
```
Line 1:
  invoiceId: 1
  itemId: 1
  quantity: 5.00
  rate: 150.00
  taxRate: 18.00
  lineSubtotal: 750.00
  lineTax: 135.00
  lineTotal: 885.00

Line 2:
  invoiceId: 1
  itemId: 2
  quantity: 1.00
  rate: 500.00
  taxRate: 18.00
  lineSubtotal: 500.00
  lineTax: 90.00
  lineTotal: 590.00
```

## Frontend Display

### Real-Time Calculation
```typescript
// In InvoiceForm.tsx, watch for line changes
const lines = watch("lines");

const totals = useMemo(() => {
  const calculations = lines.map((line) =>
    calculateLine(line.quantity, line.rate, 18)  // hardcoded 18% for now
  );
  return calculateTotals(calculations);
}, [lines, calculateLine, calculateTotals]);
```

As user edits quantities/rates, totals update instantly without API call.

### Display
```
Line 1:  Consulting × 5 @ $150 = $885 (incl. $135 tax)
Line 2:  Development × 1 @ $500 = $590 (incl. $90 tax)
         ────────────────────────────────────────
Subtotal:  $1250.00
Tax:       $225.00
TOTAL:     $1475.00
```

## Decimal Precision

**In TypeScript/JavaScript (frontend):**
```typescript
// Avoid floating-point errors
const tax = Math.round((subtotal * taxRate / 100) * 100) / 100;
```

**In Prisma (backend):**
```prisma
subtotal  Decimal @db.Decimal(12, 2)  // 12 digits total, 2 after decimal
totalTax  Decimal @db.Decimal(12, 2)
total     Decimal @db.Decimal(12, 2)
```

**Why Decimal?**
- `Float` has rounding errors
- `Decimal` is exact for currency
- Prisma `Decimal` type maps to database `DECIMAL(12,2)`

## Tax Handling

### Simple Tax (This Module)
One tax percentage per item. Each line can have different tax rate.

```
Subtotal = quantity × rate
Tax = subtotal × (taxRate / 100)
Total = subtotal + tax
```

### Advanced Tax (Future)
- Different tax names (VAT, GST, Sales Tax)
- Compound tax
- Tax by region
- Tax-exempt items

For now, we keep it simple: per-item percentage.

## Summary

- **Line item**: Quantity × Rate, with Tax Rate
- **Line calculation**: Subtotal, Tax, Total
- **Invoice calculation**: Sum of line totals
- **Denormalization**: Totals stored on Invoice and InvoiceLine for perf
- **Rounding**: Always round currency to 2 decimals
- **Decimal type**: Use Decimal, not Float
- **Frontend preview**: Calculate totals in real-time without API
- **Backend validation**: Validate item and customer, recalculate totals, persist
