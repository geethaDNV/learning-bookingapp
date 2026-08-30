# 03 - Invoice Number and Status

## Invoice Number Generation

### Format
`INV-{YEAR}-{SEQUENCE}`

Examples:
- `INV-2025-0001` (first invoice of 2025)
- `INV-2025-0002` (second invoice of 2025)
- `INV-2026-0001` (first invoice of 2026, counter resets)

### Service: InvoiceNumberService

Located in `backend/src/services/InvoiceNumberService.ts`

```typescript
export class InvoiceNumberService implements IInvoiceNumberService {
  constructor(private prisma: PrismaClient) {}

  async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `INV-${year}-`;

    // Find highest invoice number for this year
    const lastInvoice = await this.prisma.invoice.findMany({
      where: {
        invoiceNumber: { startsWith: prefix },
      },
      orderBy: { invoiceNumber: "desc" },
      take: 1,
      select: { invoiceNumber: true },
    });

    let nextNumber = 1;
    if (lastInvoice.length > 0) {
      const lastNumber = parseInt(
        lastInvoice[0].invoiceNumber.split("-")[2] || "0",
        10
      );
      nextNumber = lastNumber + 1;
    }

    return `${prefix}${String(nextNumber).padStart(4, "0")}`;
  }
}
```

**How it works:**
1. Get current year
2. Query for invoices with prefix `INV-{year}-`
3. Get the highest one (if any)
4. Extract the sequence number and increment
5. Pad to 4 digits: `0001`, `0002`, etc.

**Why this design:**
- Per-year sequence: Easy to count invoices per year
- Unique: Database constraint ensures no duplicates
- Readable: Numbers are meaningful, not random UUIDs

## Invoice Status Lifecycle

### States
```
DRAFT → SENT → PAID
            ↓
         CANCELLED
```

### DRAFT
- Initial state when invoice is created
- Can be edited (update customer, lines, due date, notes)
- Only allow `PUT /api/v1/invoices/:publicId` when status is DRAFT
- Lines can be added, modified, deleted

### SENT
- Invoice is ready and sent to customer
- Can move to PAID (customer pays)
- Can move to CANCELLED (customer doesn't pay)
- Cannot edit (read-only)

### PAID
- Customer has paid
- Marks end of life
- Cannot transition anywhere else
- Triggers accounting entries (future module)

### CANCELLED
- Invoice is voided
- Marks end of life
- Cannot transition anywhere else

### Status Transitions

**Allowed transitions:**
- `DRAFT` → `SENT` ✓
- `DRAFT` → `CANCELLED` ✓ (optional: allow cancelling drafts)
- `SENT` → `PAID` ✓
- `SENT` → `CANCELLED` ✓
- `PAID` → anything ✗ (read-only)
- `CANCELLED` → anything ✗ (read-only)

### API: Update Status

**Endpoint:**
```
PATCH /api/v1/invoices/:publicId/status
```

**Request:**
```json
{
  "status": "SENT"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "publicId": "abc-123",
    "invoiceNumber": "INV-2025-0001",
    "status": "SENT",
    ...
  }
}
```

### Validation

**Backend checks:**
- Invoice exists
- New status is valid enum value
- Transition is allowed (draft allows all, sent allows paid/cancelled, paid/cancelled are read-only)

**Frontend UI:**
- Show status as badge (color-coded)
- Show action buttons only for allowed transitions
- Disable buttons for read-only states

## Example: Full Lifecycle

```
User creates invoice → status = DRAFT
  • Can edit (customer, lines, notes)
  • URL: /invoices/abc-123/edit

User clicks "Send" → PATCH /invoices/abc-123/status { "status": "SENT" }
  • status = SENT
  • Edit button disappears
  • Can't modify anymore
  • Shows "Send" button (already sent? or unsend?)

Customer pays → PATCH /invoices/abc-123/status { "status": "PAID" }
  • status = PAID
  • Invoice is complete
  • Links to payment record (future)

Or user decides not to send → PATCH /invoices/abc-123/status { "status": "CANCELLED" }
  • status = CANCELLED
  • Marked as voided
  • Can't undo
```

## Why This Matters

1. **Audit trail**: Status shows when invoice was sent vs paid
2. **Prevents errors**: Can't edit a sent invoice by accident
3. **Business process**: Matches real-world invoice workflow
4. **Reconciliation**: Can query by status for accounting
5. **Communication**: Clear status in UI tells user what happened

## Summary

- **Invoice number**: `INV-{YEAR}-{SEQUENCE}`, unique, human-readable
- **Status**: `DRAFT` | `SENT` | `PAID` | `CANCELLED`, lifecycle enforced
- **Editable only as DRAFT**: Prevents accidental changes to sent invoices
- **Transitions controlled**: Can't jump from DRAFT to PAID (must go through SENT)
- **Service-based generation**: Centralized logic in `InvoiceNumberService`
