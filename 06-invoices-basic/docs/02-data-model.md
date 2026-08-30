# 02 - Data Model

## Tables and Relationships

### Customer
Represents a person or business that invoices are issued to.

```typescript
model Customer {
  id    Int     @id @default(autoincrement())
  name  String  @unique
  email String  @unique
  phone String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  invoices Invoice[]
}
```

**Why these fields:**
- `name` - Display on invoice
- `email` - Contact and future email sending
- `phone` - Contact information
- `invoices` - One customer has many invoices

### Item
Represents a product or service that can be sold.

```typescript
model Item {
  id    Int     @id @default(autoincrement())
  name  String  @unique
  description String?
  unitPrice Decimal @db.Decimal(10, 2)
  taxRate   Decimal @default(0) @db.Decimal(5, 2)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  invoiceLines InvoiceLine[]
}
```

**Why these fields:**
- `name` - What you're selling
- `description` - More details (optional)
- `unitPrice` - Price per unit; stored as Decimal to avoid floating-point errors
- `taxRate` - Tax percentage (e.g., 18 for 18% GST); each item can have different tax
- `invoiceLines` - An item appears on many invoice lines

### Invoice
The main document: header information.

```typescript
model Invoice {
  id        Int     @id @default(autoincrement())
  publicId  String  @unique @default(uuid())
  invoiceNumber String @unique
  
  customerId Int
  customer   Customer @relation(fields: [customerId], references: [id])
  
  status    InvoiceStatus @default(DRAFT)
  
  subtotal  Decimal @db.Decimal(12, 2)
  totalTax  Decimal @db.Decimal(12, 2)
  total     Decimal @db.Decimal(12, 2)
  
  notes     String?
  dueDate   DateTime?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  lines InvoiceLine[]
}

enum InvoiceStatus {
  DRAFT
  SENT
  PAID
  CANCELLED
}
```

**Key fields:**
- `id` (numeric) - Database primary key, used internally
- `publicId` (UUID string) - What the frontend uses; opaque, can't guess
- `invoiceNumber` - Human-readable like "INV-2025-0001"
- `customerId` - Foreign key to Customer
- `status` - Lifecycle: DRAFT → SENT → PAID (or CANCELLED)
- `subtotal`, `totalTax`, `total` - Denormalized (also calculated from lines)
- `notes` - Message to customer
- `dueDate` - When payment is due (optional)

**Why denormalize totals?**
For query efficiency: `SELECT total FROM invoices WHERE status = 'PAID'` is fast without calculating from lines every time.

### InvoiceLine
One row in the line item table (the detail of an invoice).

```typescript
model InvoiceLine {
  id        Int     @id @default(autoincrement())
  invoiceId Int
  invoice   Invoice @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
  
  itemId    Int
  item      Item @relation(fields: [itemId], references: [id])
  
  quantity  Decimal @db.Decimal(10, 2)
  rate      Decimal @db.Decimal(10, 2)
  taxRate   Decimal @default(0) @db.Decimal(5, 2)
  
  lineSubtotal Decimal @db.Decimal(12, 2)
  lineTax      Decimal @db.Decimal(12, 2)
  lineTotal    Decimal @db.Decimal(12, 2)
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Fields:**
- `invoiceId` - Which invoice this line belongs to (delete invoice = delete lines via cascade)
- `itemId` - Which item this line is for
- `quantity` - How many units (e.g., 5 hours)
- `rate` - Price per unit (might differ from item.unitPrice for discounts/customizations)
- `taxRate` - Tax % applied to this line (copied from item or overridden)
- `lineSubtotal`, `lineTax`, `lineTotal` - Denormalized for display/reporting

**Why denormalize line totals?**
Same reason as invoice totals: fast access, guaranteed consistency within a transaction.

## Relationships Diagram

```
Customer
  │
  ├─→ 1 (has many)
  │
  └─→ Invoice
      │
      ├─→ invoice_number (unique)
      ├─→ status (DRAFT, SENT, PAID, CANCELLED)
      ├─→ subtotal, totalTax, total (denormalized)
      │
      └─→ InvoiceLine (1 to many; cascade delete)
          │
          ├─→ quantity, rate, taxRate (user input)
          ├─→ lineSubtotal, lineTax, lineTotal (calculated)
          │
          └─→ Item
              │
              └─→ unitPrice, taxRate (catalog)
```

## Data Flow Example

**User creates an invoice:**

1. Frontend sends: `{ customerId: 1, lines: [{ itemId: 2, quantity: 5, rate: 100 }] }`
2. Backend validates customer and item exist
3. Backend calculates:
   - `lineSubtotal = 5 * 100 = 500`
   - `lineTax = 500 * 18% = 90` (assuming 18% tax)
   - `lineTotal = 500 + 90 = 590`
4. Backend generates invoice number: `"INV-2025-0001"`
5. Backend creates:
   - Invoice record with `subtotal=500, totalTax=90, total=590, status=DRAFT`
   - InvoiceLine record with `quantity=5, rate=100, taxRate=18, lineSubtotal=500, lineTax=90, lineTotal=590`
6. Database returns `publicId` (UUID) and `invoiceNumber`
7. Frontend displays new invoice and navigates to detail page

## Constraints & Validations

- **Customer must exist** - Foreign key enforced
- **Item must exist** - Foreign key enforced
- **Invoice number is unique** - Can't create two invoices with same number
- **publicId is unique** - Generated UUID, unique by definition
- **Quantity and rate are non-negative** - Decimal(10,2) allows 0
- **Tax rate is non-negative** - Decimal(5,2) allows 0 (no tax)
- **Status is one of enum values** - Database constraint
- **OnDelete Cascade** - If invoice is deleted, all its lines are deleted

## Summary

- **4 tables**: Customer, Item, Invoice, InvoiceLine
- **Parent-child**: Invoice contains many InvoiceLines; Customer has many Invoices
- **Denormalization**: Invoice and InvoiceLine store calculated totals for performance
- **Unique identifiers**: `publicId` (UUID) for frontend, `id` (int) for database
- **Human-readable**: `invoiceNumber` and `invoiceStatus` enum for clarity
- **Decimal type**: Always use `Decimal` for currency, never `Float`
