# Exercises: Hands-On Learning

These exercises are designed to deepen your understanding. Complete them in order.

---

## Exercise 1: Create and Post a Payment

**Objective**: Understand the full payment capture → posting flow.

### Steps

1. **Start the backend**
   ```bash
   cd backend
   npm install
   npm run prisma:generate
   npm run prisma:migrate dev  # First time only
   npm run prisma:seed
   npm run dev
   ```

2. **Start the frontend**
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

3. **In the UI**:
   - Go to "Payment Posting" tab
   - Enter Invoice ID: `INV-001`
   - Enter Amount: `1000`
   - Click "Create Payment"
   - Note the payment ID

4. **Click "Post Payment"**
   - Verify the success message
   - View the journal entry table
   - Verify:
     - Line 1: Debit Bank $1000
     - Line 2: Credit AR $1000
     - Total debits = Total credits = $1000

5. **Verify in backend**
   ```bash
   curl http://localhost:3001/api/v1/payments/[payment-id]/accounting
   ```
   You should see the journal entry in the response.

### What You Should Learn
- How payment capture and posting are separate steps
- How journal entries are structured (two-line format)
- How debits and credits balance

---

## Exercise 2: Partial Refund

**Objective**: Understand refunds and reversal entries.

### Steps

1. **Use the payment from Exercise 1**

2. **Go to "Refunds" tab**

3. **Click "Refund Payment"**
   - Amount: `300`
   - Reason: `Customer changed mind about item`
   - Submit

4. **Verify the refund**:
   - Payment status should show "partially_refunded"
   - Accounting history should show TWO journal entries:
     - Entry 1: Payment posting
     - Entry 2: Refund reversal

5. **Verify refund entry**:
   - Line 1: Debit Refund Expense $300
   - Line 2: Credit Bank $300

6. **Calculate net impact**:
   ```
   Cash / Bank:
     From payment:  +$1000
     From refund:   -$300
     Net:           +$700
   
   Refund Expense: $300
   ```

### What You Should Learn
- Refunds create reversal entries (not deletions)
- Reversals have opposite debit/credit to original
- Multiple journal entries for one payment are OK
- Partial refunds can happen

---

## Exercise 3: Full Refund

**Objective**: Understand full refunds vs partial.

### Steps

1. **Create a new payment**:
   - Invoice: `INV-002`
   - Amount: `500`

2. **Post the payment**

3. **Refund the entire amount**:
   - Amount: `500`
   - Reason: `Order cancelled`

4. **Verify**:
   - Payment status: `refunded`
   - Two journal entries

5. **Calculate net impact**:
   ```
   Cash / Bank: +$500 - $500 = $0
   AR: -$500
   Refund Expense: $500
   ```
   
   Net income impact: `-$500` (you paid the refund)

### What You Should Learn
- Full refunds set status to "refunded"
- Partial vs full is based on amount comparison
- The accounting is the same (both create reversal entries)

---

## Exercise 4: Idempotency Test

**Objective**: Understand idempotency keys and duplicate prevention.

### Steps

1. **Create a new payment**:
   - Invoice: `INV-003`
   - Amount: `750`
   - Note the payment ID

2. **In a terminal, post the payment twice with cURL**:
   ```bash
   PAYMENT_ID="[copy-from-ui]"
   
   # First request
   curl -X POST http://localhost:3001/api/v1/payments/$PAYMENT_ID/post \
     -H "Content-Type: application/json" \
     -d '{"paymentId": "'$PAYMENT_ID'", "idempotencyKey": "test-key-001"}'
   
   # Second request (same key)
   curl -X POST http://localhost:3001/api/v1/payments/$PAYMENT_ID/post \
     -H "Content-Type: application/json" \
     -d '{"paymentId": "'$PAYMENT_ID'", "idempotencyKey": "test-key-001"}'
   ```

3. **Verify**:
   - First response: `journalEntryId` populated
   - Second response: No `journalEntryId` (already posted)
   - Payment shows only ONE journal entry total

4. **Check the database** (optional):
   ```bash
   npm run prisma:studio
   # Go to Payment table
   # Find payment by ID
   # Verify idempotencyKey is set
   # Verify isPosted = true
   ```

### What You Should Learn
- Idempotency keys prevent duplicates
- Retrying with same key returns success without creating duplicate
- This is critical for production reliability

---

## Exercise 5: Reconciliation Workflow

**Objective**: Understand the reconciliation process.

### Steps

1. **Create and post multiple payments**:
   ```
   Payment 1: $1000 → Post
   Payment 2: $500  → Post
   Payment 3: $750  → Post
   ```

2. **Go to "Reconciliation" tab**

3. **You should see all 3 payments as "Unreconciled"**

4. **For Payment 1**:
   - Click to expand
   - Enter Bank Reference: `BANK-123456`
   - Enter Notes: `Found on Aug 30 bank statement`
   - Click "Mark Reconciled"

5. **Verify**:
   - Payment 1 disappears from list
   - Remaining: Payments 2 and 3 (unreconciled)

6. **Simulate partial bank processing** (mark only 2 of 3):
   - Mark Payment 2 as reconciled
   - Leave Payment 3 unreconciled
   - This simulates payment 3 still in transit

7. **Check via API**:
   ```bash
   curl http://localhost:3001/api/v1/reconciliation/payments
   ```
   Should return only Payment 3 (unreconciled)

### What You Should Learn
- Reconciliation marks payments as verified against bank
- It doesn't change the journal entry
- Unreconciled payments are a normal state (timing differences)
- Reconciliation is a manual/semi-automated process

---

## Exercise 6: View Accounting History

**Objective**: Understand how to retrieve full accounting trail for a payment.

### Steps

1. **Get a payment ID from any previous exercise**

2. **Call the accounting endpoint**:
   ```bash
   curl http://localhost:3001/api/v1/payments/[payment-id]/accounting
   ```

3. **You should see**:
   ```json
   {
     "paymentId": "pay-xxx",
     "amount": 1000,
     "status": "captured",
     "isPosted": true,
     "journalEntries": [
       {
         "referenceType": "Payment",
         "lines": [...]
       },
       {
         "referenceType": "Refund",
         "lines": [...]
       }
     ],
     "refunds": [...]
   }
   ```

4. **Verify**:
   - All journal entries are present
   - All refunds are listed
   - The accounting history is complete

### What You Should Learn
- You can retrieve complete accounting trail for any payment
- The audit is immutable (can't change past entries)
- This is essential for audits and compliance

---

## Exercise 7: Error Handling - Validate Refund Amount

**Objective**: Understand validation in financial systems.

### Steps

1. **Create and post a payment**: `$500`

2. **Try to refund invalid amounts**:
   - Amount: `0` → Should fail
   - Amount: `-100` → Should fail
   - Amount: `600` (more than payment) → Should fail

3. **Verify error messages** in UI

4. **Valid refund**:
   - Amount: `500` (exact match) → Should succeed
   - Amount: `250` (partial) → Should succeed

### What You Should Learn
- Validation prevents logical errors
- The UI shows validation errors
- Backend enforces validation (don't trust UI)

---

## Exercise 8: Check Journal Balance

**Objective**: Understand the fundamental accounting rule.

### Steps

1. **For any payment you've posted**, check the journal entry:
   ```
   Total Debit: ?
   Total Credit: ?
   ```

2. **They must be EQUAL**

3. **Manually add up the lines** (verify the app's calculation):
   - Debit line: $X
   - Credit line: $X
   - These must match

4. **For refunds**, verify the same:
   - Refund entries must also balance

### What You Should Learn
- Debit always = Credit (the fundamental accounting equation)
- If they don't match, there's a bug
- This is how auditors detect errors

---

## Exercise 9: Multi-Step Refund Scenario

**Objective**: Understand complex refund scenarios.

### Steps

1. **Create a $1000 payment**

2. **Post it**

3. **Issue refund 1**: `$300` (customer returned item)

4. **Issue refund 2**: `$200` (customer changed mind about item)

5. **Verify**:
   - Payment status: `partially_refunded`
   - Total refunded: `$500`
   - Cash position: `+$500` (`$1000 - $300 - $200`)
   - Journal entries: 1 posting + 2 refunds = 3 entries

6. **Check accounting**:
   ```
   Cash / Bank: 
     Post:   +$1000
     Refund1: -$300
     Refund2: -$200
     Net:     +$500 ✓
   
   Refund Expense:
     Refund1: $300
     Refund2: $200
     Total:   $500
   ```

### What You Should Learn
- Multiple refunds for one payment are normal
- Each refund gets its own reversal entry
- Status stays "partially_refunded" until all amount is refunded
- The accounting cumulative effect is clear

---

## Exercise 10: Investigate a Reconciliation Gap

**Objective**: Understand how to debug reconciliation mismatches.

### Steps

1. **Create 3 payments**: $100, $200, $300

2. **Post only the first 2**

3. **Go to reconciliation**: Should only show the first 2

4. **Mark first payment as reconciled**

5. **Leave second unreconciled**

6. **Note**: The third payment is not in reconciliation list because it's not posted

7. **Post the third payment**

8. **Now it appears** in the unreconciled list

9. **Reconcile it**

### Debugging Scenario

**Simulated bank statement shows**: $100 + $200 + $300 = $600

**Your reconciliation list shows**: $200 + $300 = $500 remaining

**Question**: Where's the $100?

**Answer**: It's reconciled (you marked it)

**What you should learn**:
- Reconciliation requires posting FIRST
- Unposted payments won't appear in reconciliation
- This is the expected workflow

---

## Challenge Exercises

### Challenge 1: Build a Reconciliation Report

Write a backend endpoint that returns:
```
GET /api/v1/reconciliation/report

{
  "total_posted": 5000,
  "total_reconciled": 4500,
  "total_unreconciled": 500,
  "unreconciled_payments": [
    { "id": "pay-xxx", "amount": 500, "days_unreconciled": 2 }
  ]
}
```

### Challenge 2: Implement Voiding

Extend the system to allow voiding (reversing) a journal entry:
```
POST /api/v1/journal-entries/:entryId/void
{
  "reason": "Posted in error"
}
```

This should:
- Create an opposite journal entry
- Mark original as "voided"
- Maintain audit trail

### Challenge 3: Add Multi-Currency Support

Modify payment posting to handle:
```
{
  "paymentId": "pay-xxx",
  "paymentCurrency": "INR",
  "baseCurrency": "USD",
  "exchangeRate": 83.5
}
```

The journal entry should use base currency with exchange rate disclosure.

---

## Validation Checklist

After completing all exercises, verify:

- [ ] Can create and post a payment
- [ ] Payment posting creates journal entry with two balanced lines
- [ ] Refund creates reversal entry (not deletion)
- [ ] Idempotency key prevents duplicate posting
- [ ] Reconciliation marks payment as verified
- [ ] Accounting history shows complete audit trail
- [ ] Validation catches invalid amounts
- [ ] Journal entries always balance (debit = credit)
- [ ] Multiple refunds accumulate correctly
- [ ] Unposted payments don't appear in reconciliation
- [ ] No breaking of the fundamental accounting equation

---

## Next Steps

1. **Read the production mapping** (`11-how-this-maps-to-production.md`)
2. **Review common mistakes** (`12-common-mistakes.md`)
3. **Study the contracts** (`08-backend-contracts-and-di.md`)
4. **Build extensions**: Add features like vouching, tax, multi-org

You now have a solid foundation in payments accounting!
