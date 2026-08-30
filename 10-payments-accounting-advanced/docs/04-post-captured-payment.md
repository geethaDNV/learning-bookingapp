# Post Captured Payment to Accounting

## The Flow

```
1. Payment Captured (Payment.status = "captured")
                ↓
2. POST /api/v1/payments/:paymentId/post
                ↓
3. Service: PaymentPostingService.postPayment()
                ↓
4. Create Journal Entry with two lines
                ↓
5. Mark Payment as isPosted = true
                ↓
6. Return success + journalEntryId
```

---

## Example: $1,000 Invoice Payment

### Before Posting
```
Payment {
  id: "pay-001",
  invoiceId: "inv-001",
  amount: 1000,
  status: "captured",
  isPosted: false,
  capturedAt: 2024-08-30T10:00:00Z,
  postedAt: null
}
```

### Request
```http
POST /api/v1/payments/pay-001/post
Content-Type: application/json

{
  "paymentId": "pay-001",
  "idempotencyKey": "unique-key-001"  // Optional
}
```

### Processing

**Step 1: Check if already posted** (Idempotency)
```javascript
const payment = await paymentRepository.findById("pay-001");
if (payment.isPosted) {
  return { success: true, message: "Already posted" };
  // Idempotency: return success without creating duplicate
}
```

**Step 2: Fetch required accounts**
```javascript
const bankAccount = await accountRepository.findByCode("1010");
const arAccount = await accountRepository.findByCode("1200");

// bankAccount = { code: "1010", name: "Cash / Bank", ... }
// arAccount = { code: "1200", name: "Accounts Receivable", ... }
```

**Step 3: Create journal entry**
```javascript
const journalEntry = await journalRepository.create({
  referenceType: "Payment",
  referenceId: "pay-001",
  description: "Payment posting for invoice (Amount: 1000)",
  entryDate: new Date(),
  status: "posted",
  lines: [
    {
      accountId: bankAccount.id,  // 1010 Cash
      debitAmount: 1000,
      creditAmount: 0,
      lineNumber: 1,
      description: "Payment received"
    },
    {
      accountId: arAccount.id,    // 1200 Accounts Receivable
      debitAmount: 0,
      creditAmount: 1000,
      lineNumber: 2,
      description: "Accounts receivable reduction"
    }
  ]
});

// Results in:
// Debit: Cash 1000
// Credit: Accounts Receivable 1000
// Total Debits: 1000 = Total Credits: 1000 ✓
```

**Step 4: Mark payment as posted**
```javascript
await paymentRepository.update("pay-001", {
  isPosted: true,
  postedAt: new Date(),
  idempotencyKey: "unique-key-001",
  status: "captured"
});
```

### Response
```json
{
  "success": true,
  "paymentId": "pay-001",
  "journalEntryId": "je-123",
  "message": "Payment posted successfully"
}
```

### After Posting
```
Payment {
  id: "pay-001",
  invoiceId: "inv-001",
  amount: 1000,
  status: "captured",
  isPosted: true,        // ← Changed
  capturedAt: 2024-08-30T10:00:00Z,
  postedAt: 2024-08-30T10:01:00Z  // ← Set to now
}

JournalEntry {
  id: "je-123",
  referenceType: "Payment",
  referenceId: "pay-001",
  lines: [
    { accountId: "1010", debit: 1000, credit: 0 },
    { accountId: "1200", debit: 0, credit: 1000 }
  ]
}
```

---

## Idempotency Key: Preventing Duplicates

If the same request is sent twice:

### First Request
```http
POST /api/v1/payments/pay-001/post
{ "paymentId": "pay-001", "idempotencyKey": "req-abc" }

Response: 200
{
  "success": true,
  "journalEntryId": "je-123"
}
```

### Second Request (Same Key)
```http
POST /api/v1/payments/pay-001/post
{ "paymentId": "pay-001", "idempotencyKey": "req-abc" }

Response: 200
{
  "success": true,
  "message": "Already posted"
}
// NO duplicate journal entry created
```

**Implementation:**
```javascript
const existing = await paymentRepository.findByIdempotencyKey("req-abc");
if (existing && existing.id !== paymentId) {
  throw new ConflictError("Idempotency key used for different payment");
}

if (payment.isPosted) {
  return { success: true, message: "Already posted" };
}
```

---

## Error Scenarios

### 1. Payment Not Found
```javascript
const payment = await paymentRepository.findById("pay-999");
// Returns null

throw new NotFoundError("Payment with ID pay-999 not found");

// Response: 404
// {
//   "message": "Payment not found",
//   "error": "NOT_FOUND"
// }
```

### 2. Required Accounts Not Found
```javascript
const bankAccount = await accountRepository.findByCode("1010");
if (!bankAccount) {
  throw new ValidationError("Required account (Bank) not found");
}

// Response: 400
// {
//   "message": "Required account (Bank) not found",
//   "error": "VALIDATION_ERROR"
// }
```

---

## Testing the Flow

### Manual Test with cURL
```bash
# 1. Create a payment
curl -X POST http://localhost:3001/api/v1/payments \
  -H "Content-Type: application/json" \
  -d '{
    "invoiceId": "inv-001",
    "amount": 1000,
    "paymentMethod": "card"
  }'

# Save the returned payment ID, e.g., "pay-123"

# 2. Post the payment
curl -X POST http://localhost:3001/api/v1/payments/pay-123/post \
  -H "Content-Type: application/json" \
  -d '{
    "paymentId": "pay-123"
  }'

# 3. Fetch accounting history
curl http://localhost:3001/api/v1/payments/pay-123/accounting
```

---

## Key Insights

1. **Posting is separate from capture**: A payment captured ≠ a payment posted
2. **Idempotency is critical**: Network retries should not create duplicate entries
3. **Double-line entry**: Every payment posting creates exactly 2 accounting lines
4. **Balance is guaranteed**: Debit total always = Credit total
5. **Audit trail**: Payment + JournalEntry link payment to accounting forever
