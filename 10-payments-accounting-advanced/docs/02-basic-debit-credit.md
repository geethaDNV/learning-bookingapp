# Basic Debit and Credit Thinking

## The Golden Rule

Every transaction has two sides:

- **Debit**: Money in, Assets increase, Expenses increase
- **Credit**: Money out, Liabilities decrease, Revenue increases

**Total Debits = Total Credits** (always)

---

## Account Types and Normal Balance

| Account Type | Normal Balance | Increases With | Example |
|---|---|---|---|
| **Asset** | Debit | Debit | Cash, Bank, Inventory |
| **Liability** | Credit | Credit | Loan, Accounts Payable |
| **Equity** | Credit | Credit | Owner Investment |
| **Revenue** | Credit | Credit | Sales, Invoice Payment |
| **Expense** | Debit | Debit | Refunds, Discounts |

---

## Payment Example: $1,000 Invoice

### Scenario
- Customer owes $1,000 (invoice issued)
- Payment is captured via credit card
- Money sits in payment gateway, waiting to settle

### Step 1: Record the Capture
When payment is captured, we recognize the money is owed to us.

```
Debit:  Cash / Bank Account ........ $1,000  ← Money is incoming
Credit: Accounts Receivable ........ $1,000  ← Customer debt reduced
        (Journal Entry Posted)
```

**Why?**
- Cash (asset) increases → Debit it
- Accounts Receivable (asset) decreases → Credit it
- Debit + Credit both $1,000 → Balanced ✓

### Step 2: Recording in T-Accounts

```
         Cash / Bank                 Accounts Receivable
         ┌─────────────┐             ┌─────────────┐
  Debit  │  1,000      │  Credit     │  1,000      │  Debit
         └─────────────┘             └─────────────┘
         Balance: +$1,000            Balance: -$1,000
```

---

## Refund Example: $300 Refund

Customer requests refund of $300 (before goods shipped).

### Journal Entry for Refund (Reversal)

```
Debit:  Refund Expense / Contra Revenue .... $300  ← Cost of refund
Credit: Cash / Bank ............................... $300  ← Money going out
        (Reversal Entry)
```

**Why is this a reversal?**
- The original entry had: **Debit Cash, Credit AR**
- The refund entry has: **Debit Expense, Credit Cash**
- This "reverses" part of the original entry

### T-Accounts After Refund

```
         Cash / Bank                    Refund Expense
         ┌─────────────┐                ┌─────────────┐
  Debit  │  1,000      │  Credit        │     300     │
         │             │     300        │             │
         └─────────────┘                └─────────────┘
         Balance: +$700                 Balance: $300 (cost)
```

---

## Income Statement View

After posting payment and refund:

```
Revenue:
  Sales .......................... +$1,000 (original invoice)
  Less: Refund Expense ...........    -$300
                                 ──────────
  Net Revenue .....................    $700
```

---

## Why This Matters

1. **Correctness**: Total revenue = what actually stayed with you
2. **Audit Trail**: Every $300 refund is traceable to its payment
3. **Tax Reporting**: Refund Expense is deductible
4. **No Deletion**: Original payment + refund entries stay forever

---

## Practice: Other Transactions

### Fee Payment ($50 payment gateway fee)
```
Debit:  Payment Processing Fee ....... $50
Credit: Cash / Bank ................... $50
```

### Invoice Reversal (cancelled invoice before payment)
```
Debit:  Sales / Revenue ............... $1,000
Credit: Accounts Receivable ........... $1,000
        (Just reversed the original invoice)
```

---

## Key Takeaway

Every payment and refund creates **two accounting lines**:
- One line increases a debit account
- One line increases a credit account
- **They are always equal**

This equality is how we detect errors and keep the books balanced.
