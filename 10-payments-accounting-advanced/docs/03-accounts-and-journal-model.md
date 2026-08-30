# Accounts and Journal Model

## Database Schema Overview

This module uses five main tables to record accounting:

```
Account
├── id: Primary key
├── code: Unique account code (e.g., "1010")
├── name: Human-readable name
├── accountType: Asset, Liability, Equity, Revenue, Expense
├── normalBalance: Debit or Credit
└── description: Optional notes

JournalEntry
├── id: Primary key
├── referenceType: "Payment", "Refund", "Adjustment"
├── referenceId: Payment ID or Refund ID
├── description: Human explanation
├── entryDate: When the entry was posted
├── status: "posted", "voided"
└── lines: Array of JournalEntryLine records

JournalEntryLine
├── id: Primary key
├── journalEntryId: Foreign key to JournalEntry
├── accountId: Foreign key to Account
├── debitAmount: Amount debited (0 if credit only)
├── creditAmount: Amount credited (0 if debit only)
├── lineNumber: Order in the entry (1, 2, 3...)
└── description: Optional explanation

Payment
├── id: Primary key
├── invoiceId: Which invoice this payment is for
├── amount: How much was captured
├── status: "captured", "refunded", "partially_refunded"
├── isPosted: Boolean flag (idempotency check)
├── idempotencyKey: Unique key to prevent duplicates
└── postedAt: Timestamp when accounting entry was created

Refund
├── id: Primary key
├── paymentId: Which payment this refund is for
├── amount: How much was refunded
├── status: "pending", "processed", "failed"
└── reason: Why was it refunded
```

---

## Chart of Accounts (Demo Data)

When you seed the database, these accounts are created:

| Code | Name | Type | Normal Balance | Purpose |
|------|------|------|---|---|
| 1010 | Cash / Bank | Asset | Debit | Your bank account |
| 1200 | Accounts Receivable | Asset | Debit | Money customers owe |
| 1220 | Payment Gateway Clearing | Asset | Debit | Temporary account for gateway settlements |
| 4100 | Sales Revenue | Revenue | Credit | Revenue from invoices |
| 5100 | Refund Expense | Expense | Debit | Cost of refunds issued |

---

## Journal Entry Structure

Each journal entry consists of:
1. **Header**: referenceType, referenceId, description, entryDate, status
2. **Lines**: Array of debit/credit line items

### Example: Payment Posting Entry

```
JournalEntry {
  id: "je-123",
  referenceType: "Payment",
  referenceId: "pay-456",
  description: "Payment posting for invoice (Amount: 1000)",
  entryDate: 2024-08-30,
  status: "posted",
  lines: [
    {
      lineNumber: 1,
      accountId: "1010",  // Cash / Bank
      debitAmount: 1000,
      creditAmount: 0,
      description: "Payment received"
    },
    {
      lineNumber: 2,
      accountId: "1200",  // Accounts Receivable
      debitAmount: 0,
      creditAmount: 1000,
      description: "Accounts receivable reduction"
    }
  ]
}
```

---

## Relationships

```
Payment
  ├─→ may have JournalEntry (via referenceId)
  └─→ may have Refund records

Refund
  ├─→ belongs to Payment
  └─→ may have JournalEntry (via referenceId)

JournalEntry
  ├─→ has multiple JournalEntryLine records
  └─→ references Payment or Refund (via referenceId)

JournalEntryLine
  ├─→ belongs to JournalEntry
  └─→ references Account (via accountId)
```

---

## Validation Rules

1. **Journal Entry Balance**: Sum of all debits = Sum of all credits
2. **Idempotency**: Same payment cannot be posted twice (isPosted flag)
3. **Refund Amount**: Cannot exceed original payment amount
4. **Account Code Uniqueness**: Each account has a unique code
5. **Reference Integrity**: A journal entry must reference a payment or refund

---

## Transaction Flow in Code

### 1. Payment Captured
```
payment = {
  id: "pay-456",
  invoiceId: "inv-001",
  amount: 1000,
  status: "captured",
  isPosted: false  // Not yet in accounting
}
```

### 2. Payment Posted
```
// Check if already posted
if (payment.isPosted) {
  return "Already posted"; // Idempotency
}

// Create journal entry
journalEntry = create({
  referenceType: "Payment",
  referenceId: payment.id,
  lines: [
    { debit Bank 1000 },
    { credit AR 1000 }
  ]
});

// Mark payment as posted
payment.isPosted = true;
payment.postedAt = now();
```

### 3. Refund Issued
```
refund = {
  id: "ref-789",
  paymentId: "pay-456",
  amount: 300,
  reason: "Customer requested",
  status: "processed"
};

// Create reversal entry
journalEntry = create({
  referenceType: "Refund",
  referenceId: refund.id,
  lines: [
    { debit RefundExpense 300 },
    { credit Bank 300 }
  ]
});

// Update payment status
payment.status = "partially_refunded";
```

---

## Key Insight

The **journal entry** is the source of truth for accounting. The **payment record** is just a reference to which business event created this accounting entry.

A payment can have only one posting entry, but multiple refund entries (for partial refunds).
