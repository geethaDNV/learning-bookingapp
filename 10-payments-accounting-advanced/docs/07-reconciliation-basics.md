# Reconciliation Basics: Matching to Bank Statement

## What is Reconciliation?

**Reconciliation** = Proving that your accounting books match the bank statement.

```
Your Books:
  Cash / Bank balance: $5,000

Bank Statement:
  Ending balance: $5,000

Reconciliation: ✓ They match!
```

If they don't match, something is wrong:
- You made an accounting error
- The bank made an error
- A payment is still in transit

---

## Simple Reconciliation Workflow

### Step 1: Identify Unreconciled Payments

```
GET /api/v1/reconciliation/payments

Returns all payments that:
  - status = "captured"
  - isPosted = true
  - NOT yet marked as reconciled
```

Example response:
```json
{
  "data": [
    {
      "id": "pay-001",
      "amount": 1000,
      "status": "captured",
      "capturedAt": "2024-08-30T10:00:00Z"
    },
    {
      "id": "pay-002",
      "amount": 500,
      "status": "captured",
      "capturedAt": "2024-08-30T11:00:00Z"
    }
  ]
}
```

### Step 2: Compare to Bank Statement

You download your bank statement:

```
Bank Statement (Aug 30 - Sep 1):
  Aug 30 10:01:23 - Payment received: $1,000 (Ref: BANK-123)
  Aug 30 11:05:45 - Payment received: $500  (Ref: BANK-124)
  Sep 01 09:00:00 - Refund issued: $300    (Ref: BANK-125)
```

### Step 3: Mark as Reconciled

For each payment on the bank statement, mark it reconciled:

```http
POST /api/v1/reconciliation/payments/pay-001/mark-reconciled
{
  "paymentId": "pay-001",
  "bankReference": "BANK-123",
  "notes": "Matched to bank stmt Aug 30, 10:01 AM"
}
```

Response:
```json
{
  "success": true,
  "reconciliationId": "rc-001",
  "message": "Payment marked as reconciled"
}
```

### Step 4: Check Reconciliation Status

```http
GET /api/v1/reconciliation/payments/pay-001/status

{
  "id": "rc-001",
  "paymentId": "pay-001",
  "status": "reconciled",
  "reconciliationDate": "2024-09-01T14:00:00Z",
  "bankReference": "BANK-123",
  "notes": "Matched to bank stmt Aug 30"
}
```

---

## Database Reconciliation Record

```
ReconciliationRecord {
  id: "rc-001",
  paymentId: "pay-001",
  status: "reconciled",           // or "unreconciled"
  reconciliationDate: 2024-09-01,
  bankReference: "BANK-123",      // Bank's ref code
  notes: "Matched to stmt"
}
```

### State Transitions

```
Initial State:
  status = "unreconciled"
  reconciliationDate = null
  bankReference = null

After Marking Reconciled:
  status = "reconciled"
  reconciliationDate = 2024-09-01
  bankReference = "BANK-123"
```

---

## Common Scenario: Payment in Transit

### Timeline

**Aug 30, 10:00 AM**: Customer's card charged
  - Your system: `payment.status = "captured"`, `isPosted = true`
  - Bank: Money hasn't settled yet

**Aug 30, 11:00 PM**: Your monthly reconciliation
  - You check bank statement
  - Payment doesn't appear yet
  - Status: UNRECONCILED

**Aug 31, 9:00 AM**: Bank processes the batch
  - Bank statement shows payment: $1,000
  - Your system still has: `status = "unreconciled"`

**Aug 31, 10:00 AM**: You mark it reconciled
  ```
  POST /api/v1/reconciliation/payments/pay-001/mark-reconciled
  {
    "bankReference": "BANK-456",
    "notes": "Appeared on bank stmt Aug 31"
  }
  ```

---

## Reconciliation Doesn't Change Accounting

⚠️ **Important**: Marking a payment reconciled does NOT change the journal entry.

### Before Reconciliation
```
Payment:
  isPosted: true
  status: "captured"

JournalEntry:
  Debit: Bank $1000
  Credit: AR $1000
  status: "posted"
```

### After Reconciliation
```
Payment:
  isPosted: true
  status: "captured"    ← Same

JournalEntry:
  Debit: Bank $1000    ← Same
  Credit: AR $1000     ← Same
  status: "posted"      ← Same

ReconciliationRecord:
  status: "reconciled"  ← NEW: Just marks it as matched to bank
```

**Reconciliation is a meta-operation**: It records that you've verified the payment exists in the bank statement. It doesn't change the accounting entry.

---

## Advanced: Reconciliation with Timing Differences

### Bank Delay Scenario

```
Your Books (Aug 31):
  Payment 1: $1,000 (captured Aug 30, posted Aug 30)
  Payment 2: $500   (captured Aug 31, posted Aug 31)
  Total: $1,500

Bank Statement (Aug 31):
  Opening balance: $10,000
  Payment 1: $1,000
  Total: $11,000  ← Payment 2 hasn't appeared yet

Reconciliation:
  ✓ Mark payment-1 as reconciled (on bank stmt)
  ✗ Leave payment-2 as unreconciled (not yet on bank stmt)
  
Bank should show it by tomorrow.
```

### Monthly Reconciliation Report

```
Payments Posted:        $1,500
  - Reconciled:        -$1,000  (found on bank stmt)
  - Unreconciled:      -$500    (pending, in transit)

Status:
  $500 difference explained (payment in transit)
  No errors detected ✓
```

---

## Error Scenario: Missing Payment

```
Your Books:
  Payment captured: $1,000
  Marked as posted: isPosted = true
  Journal entry created: ✓

Bank Statement:
  No payment found
  
Investigation:
  - Gateway failed silently? (money never left)
  - Payment processor error?
  - Wrong bank account?
  
Action:
  - Contact payment provider
  - Reverse the journal entry (void it)
  - Investigate the capture
```

---

## Implementation: Reconciliation Service

```typescript
async getUnreconciledPayments(): Promise<Payment[]> {
  return prisma.payment.findMany({
    where: {
      status: "captured",
      isPosted: true
    },
    include: {
      reconciliation: true  // Fetch reconciliation status
    },
    orderBy: { capturedAt: "asc" }
  });
}

async markReconciled(payload: ReconciliationPayload): 
  Promise<ReconciliationResult> {
  
  const { paymentId, bankReference, notes } = payload;

  // Verify payment exists
  const payment = await paymentRepository.findById(paymentId);
  if (!payment) {
    throw new NotFoundError("Payment not found");
  }

  // Create or update reconciliation record
  const record = await prisma.reconciliationRecord.upsert({
    where: { paymentId },
    update: {
      status: "reconciled",
      reconciliationDate: new Date(),
      bankReference,
      notes
    },
    create: {
      paymentId,
      status: "reconciled",
      reconciliationDate: new Date(),
      bankReference,
      notes
    }
  });

  return {
    success: true,
    reconciliationId: record.id,
    message: "Payment marked as reconciled"
  };
}
```

---

## UI Workflow

```
1. List all unreconciled payments
   └─ Show: ID, amount, capture date, status

2. User reviews bank statement

3. For each payment on bank statement:
   └─ User clicks "Mark Reconciled"
   └─ User enters bank reference (e.g., "BANK-123")
   └─ Optional: Add notes (e.g., "Found on Aug 31 stmt")
   └─ Click submit

4. System updates reconciliation record

5. Payment disappears from unreconciled list ✓
```

---

## Key Insights

1. **Reconciliation is verification**: You're proving the accounting matches reality
2. **It's separate from posting**: Posting creates journal entries, reconciliation just marks them verified
3. **Timing matters**: Payments take time to settle, so timing differences are normal
4. **Bank reference is key**: Store the bank's reference code for audit trail
5. **It finds errors**: If something is unreconciled for weeks, investigate

Reconciliation is the accountant's quality control mechanism.
