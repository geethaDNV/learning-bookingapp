# Overview: Why Accounting Exists After Payment Capture

## The Problem: Payment vs. Accounting Separation

In real-world money systems, **capturing a payment** and **recording it in accounting** are two different events:

1. **Payment Capture** (what customers see):
   - Customer's card is charged
   - Money flows to your bank account
   - Status: ✓ Captured

2. **Accounting Recording** (what accountants need):
   - The accounting entry records *where* the money came from and where it went
   - Enables balance sheet and income statement
   - Links the payment to the invoice it paid
   - Critical for audits and financial reporting

### Real Example

Invoice for $1,000 is captured via credit card:

```
CAPTURE: Customer card charged $1,000
         Money appears in your bank account tomorrow

ACCOUNTING (must happen separately):
  Debit:  Bank/Cash Account ......... $1,000
  Credit: Accounts Receivable ....... $1,000
```

The journal entry proves the cash was received *and* the invoice debt was reduced.

---

## Why This Matters in Production

1. **Regulatory**: Auditors require proof that every transaction is recorded
2. **Idempotency**: Payments must post exactly once (no double-posting)
3. **Reconciliation**: Bank statement amounts must match your books
4. **Reversals**: Refunds must create reversal entries, not just delete the original
5. **Multi-Currency**: Payment in USD, accounting in your home currency

---

## The Learning Path

This module teaches:

1. **Basic debit/credit** logic with simple examples
2. **Payment posting flow**: Capture → Post to Accounting
3. **Idempotency**: How to prevent double-posting
4. **Refunds & Reversals**: How refunds create reversal journal entries
5. **Reconciliation**: Matching payments to bank statements
6. **Audit trails**: Why we keep immutable records

---

## Module Architecture

```
Payment Flow
├── Create Payment (Capture)
│   └── Status: "captured"
│   └── Revenue: Not yet recognized
│
├── Post Payment (Accounting)
│   └── Create Journal Entry
│   └── Status: "posted"
│   └── Revenue: Now recognized
│   └── Idempotency Key: Prevent duplicates
│
├── Refund Payment
│   ├── Create Refund Record
│   ├── Create Reversal Journal Entry
│   └── Status: "refunded" or "partially_refunded"
│
└── Reconcile Payment
    └── Match to bank statement
    └── Status: "reconciled"
```

---

## Key Concepts

| Concept | Definition | Example |
|---------|-----------|---------|
| **Debit** | Increase in Assets/Expenses, Decrease in Liabilities/Revenue | Debit Bank +$1000 |
| **Credit** | Decrease in Assets/Expenses, Increase in Liabilities/Revenue | Credit Accounts Receivable +$1000 |
| **Idempotency Key** | Unique ID that prevents duplicate posting | Payment ID + timestamp |
| **Reversal Entry** | A journal entry that "undoes" another entry | Refund creates opposite debit/credit |
| **Reconciliation** | Matching accounting records to bank statement | Payment shows on bank + in our books |

---

## Next Steps

Read `02-basic-debit-credit.md` for beginner-friendly debit/credit examples.
