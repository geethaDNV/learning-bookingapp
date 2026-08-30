# Common Mistakes and How to Avoid Them

## 1. Double-Posting: Posting Same Payment Twice

### The Mistake
```typescript
// ❌ WRONG: No idempotency check
async postPayment(paymentId: string) {
  // Just create journal entry without checking
  const entry = await journalRepository.create({
    referenceType: "Payment",
    referenceId: paymentId,
    lines: [...]
  });
  return entry;
}

// Caller retries on network error
postPayment("pay-123");  // Attempt 1: Creates JE #1
postPayment("pay-123");  // Attempt 2: Creates JE #2 ← DUPLICATE!
```

**Result**: Payment posted twice in accounting, balance sheet wrong

### The Fix
```typescript
// ✅ CORRECT: Check isPosted flag
async postPayment(paymentId: string) {
  const payment = await paymentRepository.findById(paymentId);
  
  // Idempotency: If already posted, return success
  if (payment.isPosted) {
    return { success: true, message: "Already posted" };
  }
  
  // Create journal entry
  const entry = await journalRepository.create({...});
  
  // Mark as posted
  await paymentRepository.update(paymentId, { isPosted: true });
  
  return entry;
}

// Caller retries
postPayment("pay-123");  // Attempt 1: Creates JE, sets isPosted=true
postPayment("pay-123");  // Attempt 2: Sees isPosted=true, returns success
```

**Lesson**: Always use idempotency checks in financial operations.

---

## 2. Wrong Account: Crediting Instead of Debiting

### The Mistake
```typescript
// ❌ WRONG: Reversed accounts
const lines = [
  { accountId: arAccount.id, debit: 1000, credit: 0 },  // AR debited ← WRONG
  { accountId: bankAccount.id, debit: 0, credit: 1000 }  // Bank credited ← WRONG
];
```

**Result**: 
- Accounts Receivable shows $1000 owed when it should show $1000 paid
- Cash shows $1000 out when it should show $1000 in
- Balance sheet is completely backwards

### The Fix
```typescript
// ✅ CORRECT: Proper debit/credit
const lines = [
  { accountId: bankAccount.id, debit: 1000, credit: 0 },  // Bank debited (money in)
  { accountId: arAccount.id, debit: 0, credit: 1000 }     // AR credited (debt reduced)
];
```

### Remember the Rules
```
For ASSETS (Cash, AR, Inventory):
  Increase = Debit
  Decrease = Credit

For LIABILITIES (Loans, Payables):
  Increase = Credit
  Decrease = Debit

For REVENUE:
  Always credited (never debited)
```

**Lesson**: Double-check account types and normal balances.

---

## 3. Refund Without Reversal Entry

### The Mistake
```typescript
// ❌ WRONG: No reversal entry
async refundPayment(paymentId: string, amount: number) {
  // Just update payment status, no journal entry
  await paymentRepository.update(paymentId, {
    status: "refunded"
  });
  
  // But don't create reversal JournalEntry!
  // ← This is the mistake
}
```

**Result**:
- Books show payment of $1000
- Books don't show refund of $300
- Bank statement has $700, your books show $1000
- Reconciliation impossible

### The Fix
```typescript
// ✅ CORRECT: Create reversal entry
async refundPayment(paymentId: string, amount: number, reason: string) {
  // Create refund record
  const refund = await refundRepository.create({
    paymentId,
    amount,
    reason,
    status: "processed"
  });

  // Create reversal journal entry (this is the key!)
  await journalRepository.create({
    referenceType: "Refund",
    referenceId: refund.id,
    description: `Refund for payment (Amount: ${amount})`,
    lines: [
      { debit: refundExpense.id, amount },    // Expense
      { credit: bankAccount.id, amount }      // Money going out
    ]
  });

  // Update payment status
  await paymentRepository.update(paymentId, {
    status: amount === payment.amount ? "refunded" : "partially_refunded"
  });
}
```

**Lesson**: Refunds must create reversal entries. Never just update status.

---

## 4. Confusing Payment Status and Posting Status

### The Mistake
```typescript
// ❌ WRONG: Conflating two things
interface Payment {
  status: string;  // "captured", "refunded", etc.
  // Missing: isPosted flag!
}

async postPayment(paymentId) {
  // No way to distinguish "captured but not posted" 
  // from "captured and posted"
}
```

**Result**: You can't tell if a payment has been posted to accounting or not.

### The Fix
```typescript
// ✅ CORRECT: Separate concerns
interface Payment {
  status: string;          // "captured", "refunded" (payment provider view)
  isPosted: boolean;       // Has accounting entry been created? (accounting view)
  postedAt: Date | null;   // When was it posted?
}

async postPayment(paymentId) {
  const payment = await findById(paymentId);
  
  if (payment.isPosted) {
    // Already in accounting
    return success;
  }
  
  // Post to accounting
  createJournalEntry(...);
  update(paymentId, { isPosted: true, postedAt: now() });
}
```

**The Two Statuses**:
- `payment.status`: "captured" (money received), "refunded" (money returned)
- `payment.isPosted`: true (in accounting), false (not yet posted)

**Lesson**: Payment provider status ≠ Accounting posting status. Keep them separate.

---

## 5. Accepting Negative Refund Amounts

### The Mistake
```typescript
// ❌ WRONG: No validation
async refundPayment(paymentId: string, amount: number) {
  const refund = await refundRepository.create({
    paymentId,
    amount  // What if amount is negative? Or $0?
  });
  
  // Creates negative refund = payment!
  // If amount = -100, you've "refunded" negative, which adds money
}
```

**Result**: Accidental double-payment if amount is -$1000 instead of +$1000

### The Fix
```typescript
// ✅ CORRECT: Validate
async refundPayment(paymentId: string, amount: number) {
  const payment = await paymentRepository.findById(paymentId);

  // Check 1: Amount must be positive
  if (amount <= 0) {
    throw new ValidationError("Refund amount must be positive");
  }

  // Check 2: Amount can't exceed payment
  if (amount > payment.amount) {
    throw new ValidationError(
      `Cannot refund $${amount}, payment was only $${payment.amount}`
    );
  }

  // Safe to proceed
  const refund = await refundRepository.create({
    paymentId,
    amount,  // Now guaranteed valid
  });
}
```

**Lesson**: Always validate financial input.

---

## 6. Forgetting Journal Entry Balance Check

### The Mistake
```typescript
// ❌ WRONG: No balance verification
async createJournalEntry(payload: JournalEntryPayload) {
  const entry = await journalRepository.create({
    referenceType: payload.referenceType,
    lines: payload.lines  // What if debits ≠ credits?
  });
  
  return entry;
}

// Someone creates an entry with:
// Debit Bank $1000
// Debit AR $500
// Credit Revenue $1000
// Total Debit: $1500, Total Credit: $1000 ← UNBALANCED!
```

**Result**: Unbalanced journal entry, books don't reconcile

### The Fix
```typescript
// ✅ CORRECT: Verify balance
async createJournalEntry(payload: JournalEntryPayload) {
  const totalDebit = payload.lines.reduce((sum, l) => sum + l.debitAmount, 0);
  const totalCredit = payload.lines.reduce((sum, l) => sum + l.creditAmount, 0);

  if (totalDebit !== totalCredit) {
    throw new ValidationError(
      `Journal entry not balanced. Debit: $${totalDebit}, Credit: $${totalCredit}`
    );
  }

  const entry = await journalRepository.create({...});
  return entry;
}
```

**Lesson**: Always verify debit = credit before saving.

---

## 7. Reconciliation Doesn't Change Posting Status

### The Mistake
```typescript
// ❌ WRONG: Thinking reconciliation reverses posting
async markReconciled(paymentId: string) {
  // Someone mistakenly thinks "mark reconciled" should undo posting
  await paymentRepository.update(paymentId, {
    isPosted: false,  // ← WRONG! This voids the accounting entry
    status: "reconciled"
  });
}
```

**Result**: Accounting entry is effectively deleted when marked reconciled.

### The Fix
```typescript
// ✅ CORRECT: Reconciliation is meta-data only
async markReconciled(paymentId: string, bankReference?: string) {
  const payment = await paymentRepository.findById(paymentId);

  // Verify payment is posted before reconciling
  if (!payment.isPosted) {
    throw new ValidationError("Payment must be posted before reconciling");
  }

  // Create separate reconciliation record
  const reconciliation = await reconciliationRepository.create({
    paymentId,
    status: "reconciled",
    bankReference,
    reconciliationDate: new Date()
  });

  // DO NOT change payment.isPosted!
  // Payment stays isPosted = true
  
  return reconciliation;
}
```

**Lesson**: Reconciliation verifies posting, doesn't undo it.

---

## 8. Ignoring Timezone Issues

### The Mistake
```typescript
// ❌ WRONG: Timezone mismatch
const paymentDate = "2024-08-30";  // No timezone!

// User in London:  2024-08-30 23:00:00 UTC
// User in New York: 2024-08-30 20:00:00 EDT (same moment, different time)

// Different reconciliation results depending on user timezone!
```

**Result**: Two accountants see different reconciliation status for same payment

### The Fix
```typescript
// ✅ CORRECT: Use ISO 8601 with timezone
const paymentDate = "2024-08-30T10:00:00Z";  // UTC (Z = Zulu = UTC)

// Store in database as UTC
const entry = journalEntry {
  entryDate: new Date().toISOString()  // Always UTC
};

// Display to user in their timezone
const userTime = new Date(entry.entryDate).toLocaleString("en-US", {
  timeZone: "America/New_York"
});
```

**Lesson**: Always store dates in UTC. Convert to user timezone only for display.

---

## 9. Not Logging Financial Operations

### The Mistake
```typescript
// ❌ WRONG: No audit trail
async postPayment(paymentId: string) {
  // Create entry
  const entry = await journalRepository.create({...});
  // That's it. No record of WHO did this, WHEN, WHY
}
```

**Result**: Auditors have no trail. Can't prove who authorized posting.

### The Fix
```typescript
// ✅ CORRECT: Log everything
async postPayment(paymentId: string, userId: string) {
  const entry = await journalRepository.create({...});
  
  // Log the operation
  await auditLog.create({
    action: "POST_PAYMENT",
    paymentId,
    journalEntryId: entry.id,
    userId,  // Who did this?
    timestamp: new Date(),  // When?
    ipAddress: req.ip,  // From where?
    details: {
      amount: payment.amount,
      idempotencyKey: payload.idempotencyKey
    }
  });
  
  return entry;
}
```

**Lesson**: Financial systems must be auditable. Log everything.

---

## 10. Using Floating Point for Money

### The Mistake
```typescript
// ❌ WRONG: Using float
interface Payment {
  amount: number;  // 1000.1 could be 1000.100000000001
}

// In code:
let total = 0;
payments.forEach(p => {
  total += p.amount;  // Rounding errors accumulate!
});

// total might be 999.9999999999 instead of 1000
```

**Result**: Reconciliation fails due to rounding errors ($0.01 off per thousand payments)

### The Fix
```typescript
// ✅ CORRECT: Use integer cents (or Decimal type)
interface Payment {
  amountCents: number;  // 100000 cents = $1000.00
  // OR use Decimal library:
  amount: Decimal;
}

// In code:
let total = new Decimal(0);
payments.forEach(p => {
  total = total.plus(p.amount);
});
// Now: 100000 cents exactly
```

**In Prisma/Database**:
```prisma
model Payment {
  amountCents Int  // Store as cents, not dollars
}

// Or
model Payment {
  amount Decimal(10, 2)  // 10 total digits, 2 decimal places
}
```

**Lesson**: Never use `float` for money. Use `integer` (cents) or `Decimal`.

---

## Summary: The Big Picture

| Mistake | Consequence | Solution |
|---------|---|---|
| Double-posting | Duplicate entries, wrong balance | Use `isPosted` flag |
| Wrong account | Reversed balances, audit failure | Verify account types |
| No reversal entry | Reconciliation fails | Always reverse, never delete |
| Confused statuses | Can't track posting state | Separate `status` from `isPosted` |
| Negative refund | Accidental over-refund | Validate all inputs |
| Unbalanced entry | Books don't reconcile | Check debit = credit |
| Reconciliation confusion | Void posting accidentally | Reconciliation is metadata only |
| Timezone issues | Different results by location | Always use UTC |
| No logging | Audit failure | Log all operations |
| Float for money | Rounding errors | Use cents (integer) |

These mistakes are common in early-stage systems. Watch out for them!
