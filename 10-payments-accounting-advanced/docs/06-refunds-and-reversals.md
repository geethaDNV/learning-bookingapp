# Refunds and Reversals: The Reverse Journal Entry

## The Problem: Why You Can't Just Delete

In accounting, you **never delete** a transaction. Why?

1. **Audit Trail**: Auditors need to see the original transaction
2. **Compliance**: Regulations require immutable records
3. **Reconciliation**: Bank statement already shows the refund
4. **Reversal Proof**: The reversal entry proves you caught an error

**Solution: Create a reversal entry** (the opposite debit/credit)

---

## Example: $1,000 Payment Followed by $300 Refund

### Original Payment (Already Posted)
```
JournalEntry #1 (Payment):
  Debit:  Cash / Bank ............... $1,000
  Credit: Accounts Receivable ....... $1,000
```

### Refund Request
Customer wants $300 back before goods ship.

```
POST /api/v1/payments/pay-001/refunds
{
  "paymentId": "pay-001",
  "amount": 300,
  "reason": "Customer requested before shipment"
}
```

### Processing the Refund

**Step 1: Create Refund Record**
```
Refund {
  id: "ref-001",
  paymentId: "pay-001",
  amount: 300,
  reason: "Customer requested before shipment",
  status: "processed",
  processedAt: now()
}
```

**Step 2: Create Reversal Journal Entry**

The reversal "undoes" part of the original posting:

```
JournalEntry #2 (Refund Reversal):
  Debit:  Refund Expense ............ $300
  Credit: Cash / Bank .............. $300
```

**Why these accounts?**
- **Refund Expense**: Cost to business of issuing refund (Debit)
- **Cash / Bank**: Money going back out (Credit)

### After Refund: The Net Picture

```
Net Journal Entries:
  Cash / Bank:
    Debit (payment):  +$1,000
    Credit (refund):  -$300
    Net Balance:      +$700  ✓

  Accounts Receivable:
    Credit (payment): -$1,000
    No change:       
    Net Balance:      -$1,000

  Refund Expense:
    Debit (refund):   +$300
    Net Balance:      +$300 (cost to company)
```

**Income Statement View:**
```
Revenue:
  Sales (from invoice) ............. +$1,000
  Less: Refund Expense ............. -$300
  Net ............................. +$700
```

**Balance Sheet View:**
```
Assets:
  Cash / Bank ...................... $700 (down from $1,000)
  Accounts Receivable .............. Unchanged

Equity:
  Retained Earnings ................ -$300 (cost of refund)
```

---

## Partial vs Full Refund

### Full Refund (Entire Payment)
```
Refund {
  amount: 1000,  // Full payment amount
  status: "processed"
}

payment.status = "refunded"  // Entire payment refunded
```

Journal Entry: Debit Refund Expense $1000, Credit Bank $1000

### Partial Refund (Part of Payment)
```
Refund {
  amount: 300,  // Part of payment
  reason: "Partial return"
  status: "processed"
}

payment.status = "partially_refunded"  // Some refunded, some kept
```

Journal Entry: Debit Refund Expense $300, Credit Bank $300

---

## Multiple Refunds for One Payment

A single payment can have **multiple refund entries**:

```
Original Payment: $1,000
  JournalEntry #1: Debit Bank $1000, Credit AR $1000

Refund #1: $200 (customer changed mind about item)
  JournalEntry #2: Debit Refund Expense $200, Credit Bank $200
  
Refund #2: $100 (damaged item discovered)
  JournalEntry #3: Debit Refund Expense $100, Credit Bank $100

Net Result:
  Cash / Bank:           $700
  Refund Expense:        $300 (sum of all refunds)
  Accounts Receivable:   -$1,000
```

---

## Implementation Code

```typescript
async refundPayment(payload: RefundPayload): Promise<RefundResult> {
  const { paymentId, amount, reason } = payload;

  // Fetch payment
  const payment = await paymentRepository.findById(paymentId);
  if (!payment) {
    throw new NotFoundError("Payment not found");
  }

  // Validate refund amount
  if (amount <= 0 || amount > payment.amount) {
    throw new ValidationError(
      `Refund amount must be 0 < amount ≤ ${payment.amount}`
    );
  }

  // Create refund record
  const refund = await refundRepository.create({
    paymentId,
    amount,
    reason,
    status: "processed",
    processedAt: new Date()
  });

  // Get accounts for reversal
  const bankAccount = await accountRepository.findByCode("1010");
  const refundExpenseAccount = await accountRepository.findByCode("5100");

  // Create reversal journal entry
  const reversalEntry = await journalRepository.create({
    referenceType: "Refund",
    referenceId: refund.id,
    description: `Refund reversal (Amount: ${amount}, Reason: ${reason})`,
    entryDate: new Date(),
    status: "posted",
    lines: [
      {
        accountId: refundExpenseAccount.id,  // Debit side
        debitAmount: amount,
        creditAmount: 0,
        lineNumber: 1,
        description: "Refund expense"
      },
      {
        accountId: bankAccount.id,  // Credit side
        debitAmount: 0,
        creditAmount: amount,
        lineNumber: 2,
        description: "Cash refunded"
      }
    ]
  });

  // Update payment status
  const totalRefunded = (await refundRepository.getTotal(paymentId))
    .reduce((sum, r) => sum + r.amount, 0) + amount;

  const newStatus = totalRefunded === payment.amount 
    ? "refunded" 
    : "partially_refunded";

  await paymentRepository.update(paymentId, {
    status: newStatus
  });

  return {
    success: true,
    refundId: refund.id,
    journalEntryId: reversalEntry.id,
    message: `Refund processed (${newStatus})`
  };
}
```

---

## API Request/Response

### Request
```http
POST /api/v1/payments/pay-001/refunds
Content-Type: application/json

{
  "paymentId": "pay-001",
  "amount": 300,
  "reason": "Customer changed mind"
}
```

### Response
```json
{
  "success": true,
  "refundId": "ref-001",
  "journalEntryId": "je-789",
  "message": "Refund processed (partially_refunded)"
}
```

---

## Reconciliation After Refund

When comparing to bank statement:

```
Bank Statement:
  Payment In:  +$1,000 (date: Aug 30)
  Refund Out:  -$300   (date: Aug 31)
  Net:         +$700

Our Books:
  Cash / Bank balance:  +$700  ✓

Journal Entries:
  Entry #1 (Payment):   Debit Bank $1000
  Entry #2 (Refund):    Credit Bank $300
  Net effect:           +$700  ✓
```

All reconcile perfectly.

---

## Why This Matters

1. **Audit Trail**: Auditors see both original payment AND refund
2. **Error Detection**: If refund entry is missing, books won't match bank statement
3. **Compliance**: Regulations require proof of refund handling
4. **Financial Accuracy**: Refund Expense is deductible, shows true profit
5. **Pattern Recognition**: Tracking refunds reveals product issues

A system that just deletes or modifies the original entry would fail an audit. Reversals are the professional accounting practice.
