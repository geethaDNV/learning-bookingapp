# Idempotent Posting: Why Same Payment Can't Post Twice

## The Problem: Network Retries

In distributed systems, network requests can fail or timeout. Your frontend might retry:

```
Attempt 1: POST /api/v1/payments/pay-001/post
           → Timeout (no response)
           → Frontend waits
           
Attempt 2: POST /api/v1/payments/pay-001/post  (retry)
           → Server receives this one
```

**Without idempotency protection:**

Attempt 1 might succeed on the server, but the response never reaches the client.
When Attempt 2 arrives, the server would create **duplicate journal entries**.

```
JournalEntry #1: Debit Bank 1000, Credit AR 1000  ← Attempt 1
JournalEntry #2: Debit Bank 1000, Credit AR 1000  ← Attempt 2

Total now shows: Bank +2000, AR +2000
Incorrect!
```

---

## Solution: Idempotency Key

An **idempotency key** is a unique ID that the client sends with the request:

```http
POST /api/v1/payments/pay-001/post
{
  "paymentId": "pay-001",
  "idempotencyKey": "payment-abc-123-xyz"
}
```

The server stores this key in the payment record:

```
Payment {
  id: "pay-001",
  idempotencyKey: "payment-abc-123-xyz",  ← Unique
  isPosted: true
}
```

On retry with the **same key**, the server recognizes it's a duplicate:

```
Attempt 1: idempotencyKey = "payment-abc-123-xyz"
           → Creates journal entry
           → Stores key in Payment record
           → Response sent to client
           
Attempt 2: idempotencyKey = "payment-abc-123-xyz"  (same key)
           → Server finds existing payment with this key
           → Returns success WITHOUT creating duplicate entry
           → Idempotency guaranteed ✓
```

---

## Implementation in Code

### 1. Database Schema
```sql
CREATE UNIQUE INDEX idx_idempotency_key ON Payment(idempotencyKey);
-- Ensures key is unique across all payments
```

### 2. Posting Service
```typescript
async postPayment(payload: PostingPayload): Promise<PostingResult> {
  const { paymentId, idempotencyKey } = payload;

  // Step 1: Fetch payment
  const payment = await paymentRepository.findById(paymentId);
  if (!payment) {
    throw new NotFoundError("Payment not found");
  }

  // Step 2: Check if already posted (is Posted flag)
  if (payment.isPosted) {
    // Safe to return success - idempotency guaranteed
    return {
      success: true,
      paymentId,
      message: "Payment already posted"
    };
  }

  // Step 3: Prevent key reuse for different payments
  if (idempotencyKey) {
    const existingWithKey = await paymentRepository
      .findByIdempotencyKey(idempotencyKey);
    
    if (existingWithKey && existingWithKey.id !== paymentId) {
      // Same key used for different payment!
      throw new ConflictError(
        "Idempotency key already used for different payment"
      );
    }
  }

  // Step 4: Create journal entry and post
  const journalEntry = await journalRepository.create({
    referenceType: "Payment",
    referenceId: paymentId,
    // ... rest of entry creation
  });

  // Step 5: Mark as posted
  await paymentRepository.update(paymentId, {
    isPosted: true,
    postedAt: new Date(),
    idempotencyKey: idempotencyKey  // Store the key
  });

  return { success: true, journalEntryId: journalEntry.id };
}
```

---

## Three Layers of Idempotency

### Layer 1: isPosted Flag
```typescript
if (payment.isPosted) {
  // Payment already in accounting - don't do it again
  return success;
}
```
- Simplest check
- Works even without idempotencyKey

### Layer 2: Idempotency Key Uniqueness
```typescript
UNIQUE INDEX idx_idempotency_key ON Payment(idempotencyKey);
```
- Database-level enforcement
- Prevents key collision

### Layer 3: Payment-Level Check
```typescript
if (existingWithKey && existingWithKey.id !== paymentId) {
  throw ConflictError("Key used for different payment");
}
```
- Prevents cross-payment key reuse
- Additional safety

---

## Client-Side Best Practices

### Generate Idempotency Key (Frontend)
```typescript
async function postPaymentWithRetry(paymentId: string) {
  const idempotencyKey = generateUUID(); // e.g., "xxxxxxxx-xxxx-xxxx-xxxx"

  // Retry up to 3 times with SAME key
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await apiClient.postPayment(paymentId, {
        idempotencyKey  // Always same key across retries
      });
      return response;
    } catch (error) {
      if (attempt === 3) throw error;
      await sleep(1000 * attempt);  // Exponential backoff
    }
  }
}
```

### Never Change the Key
```typescript
// ❌ WRONG: Different key each retry
postPayment({ idempotencyKey: "key-1" });  // Attempt 1
postPayment({ idempotencyKey: "key-2" });  // Attempt 2 - NEW KEY!

// ✅ CORRECT: Same key each retry
const key = "unique-payment-id-001";
postPayment({ idempotencyKey: key });      // Attempt 1
postPayment({ idempotencyKey: key });      // Attempt 2 - SAME KEY
```

---

## Real-World Scenario

### Without Idempotency
```
1. Network error on first POST
2. System retries (frontend or payment gateway)
3. Server receives both requests within milliseconds
4. Both create separate journal entries
5. Payment appears DOUBLED in accounting
6. Auditor finds $2,000 posted instead of $1,000
7. Manual correction needed
```

### With Idempotency
```
1. Network error on first POST
2. System retries with SAME idempotency key
3. Server receives both requests
4. Second request sees isPosted = true
5. Returns success WITHOUT creating duplicate
6. Payment appears once, correctly
7. Audit trail is clean
```

---

## Testing Idempotency

```bash
#!/bin/bash

PAYMENT_ID="pay-123"
KEY="idempotent-key-001"

# First request
echo "First request..."
curl -X POST http://localhost:3001/api/v1/payments/$PAYMENT_ID/post \
  -H "Content-Type: application/json" \
  -d "{ \"paymentId\": \"$PAYMENT_ID\", \"idempotencyKey\": \"$KEY\" }" \
  | jq '.data.journalEntryId' > je1.txt

# Second request (should NOT create new entry)
echo "Second request (retry)..."
curl -X POST http://localhost:3001/api/v1/payments/$PAYMENT_ID/post \
  -H "Content-Type: application/json" \
  -d "{ \"paymentId\": \"$PAYMENT_ID\", \"idempotencyKey\": \"$KEY\" }" \
  | jq '.data.journalEntryId' > je2.txt

# Compare - should be identical or empty
diff je1.txt je2.txt
# If no difference → Idempotency working ✓
```

---

## Key Insights

1. **Idempotency is a contract**: "If I send the same request twice, I get the same result"
2. **Idempotency key must be stable**: Generate it once, reuse across retries
3. **isPosted flag is the guarantee**: Once true, posting never happens again
4. **Database uniqueness is the safety net**: Prevents key collision at DB level
5. **Customer retries must use same key**: Frontend must not generate new keys on retry

This is why production payment systems require idempotency keys. It's not optional—it's essential.
