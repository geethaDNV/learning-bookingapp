# Frontend Accounting Views

## Overview

The frontend provides three main views:

1. **Payment Posting Tab**: Create payment, post to accounting, view journal entries
2. **Refunds Tab**: Issue refunds, view refund status
3. **Reconciliation Tab**: Mark payments as reconciled with bank statement

---

## Redux Architecture

### State Structure
```typescript
interface RootState {
  payments: PaymentsState;
  reconciliation: ReconciliationState;
}

interface PaymentsState {
  payments: Payment[];
  currentPayment: Payment | null;
  accounting: AccountingHistory | null;
  loading: boolean;
  error: string | null;
  success: string | null;
}

interface ReconciliationState {
  unreconciledPayments: Payment[];
  reconciliationStatuses: Map<string, ReconciliationRecord>;
  loading: boolean;
  error: string | null;
  success: string | null;
}
```

### Thunks (Async Actions)
```typescript
// Create a new payment
export const createPayment = createAsyncThunk(
  "payments/create",
  async (params) => {
    return apiClient.createPayment(...params);
  }
);

// Post payment to accounting
export const postPayment = createAsyncThunk(
  "payments/post",
  async (params) => {
    return apiClient.postPayment(params.paymentId);
  }
);

// Refund a payment
export const refundPayment = createAsyncThunk(
  "payments/refund",
  async (params) => {
    return apiClient.refundPayment(
      params.paymentId,
      params.amount,
      params.reason
    );
  }
);

// Fetch accounting history
export const fetchPaymentAccounting = createAsyncThunk(
  "payments/fetchAccounting",
  async (paymentId) => {
    return apiClient.getPaymentAccountingHistory(paymentId);
  }
);
```

---

## Components

### 1. JournalEntryTable Component

Displays the journal entries for a payment.

```typescript
interface JournalEntryTableProps {
  entries: JournalEntry[];
  loading?: boolean;
}
```

**Features:**
- Shows header row with entry date, reference type, description, status
- Nested table for each entry showing debit/credit lines
- Color-coded for readability
- Handles empty state

**Example Output:**
```
┌─ Payment - Payment posting for invoice (Amount: 1000) ├─ Posted
│ Account    │ Debit  │ Credit │ Description
├────────────┼────────┼────────┼─────────────────────────────
│ Cash/Bank  │ 1000   │    -   │ Payment received
│ AR         │    -   │ 1000   │ AR reduction

┌─ Refund - Refund reversal (Amount: 300, Reason: ...) ├─ Posted
│ Account    │ Debit  │ Credit │ Description
├────────────┼────────┼────────┼─────────────────────────────
│ Ref Exp    │  300   │    -   │ Refund expense
│ Cash/Bank  │    -   │  300   │ Cash refunded
```

---

### 2. RefundDialog Component

Modal for issuing a refund.

```typescript
interface RefundDialogProps {
  payment: Payment | null;
  isOpen: boolean;
  onClose: () => void;
  onRefund: (paymentId, amount, reason) => Promise<void>;
  loading?: boolean;
}
```

**Form Fields:**
- **Payment ID** (read-only): Shows which payment is being refunded
- **Payment Amount** (read-only): Total payment amount
- **Refund Amount** (input): How much to refund (validated: 0 < amount ≤ payment)
- **Reason** (textarea): Why the refund (required)

**Validation:**
- Amount must be positive
- Amount cannot exceed payment amount
- Reason cannot be empty

**After Refund:**
- Dialog closes
- Payment status updates to "refunded" or "partially_refunded"
- Journal entry created with reversal lines

---

### 3. ReconciliationList Component

List of unreconciled payments that user can mark as reconciled.

```typescript
interface ReconciliationListProps {
  payments: Payment[];
  onReconcile: (paymentId, bankReference?, notes?) => Promise<void>;
  loading?: boolean;
}
```

**UX Flow:**
1. List shows all unreconciled payments with collapsible rows
2. User clicks on a payment to expand details
3. Expanded form allows:
   - **Bank Reference**: e.g., "BANK-123456" (optional)
   - **Notes**: e.g., "Found on Aug 30 bank stmt" (optional)
4. User clicks "Mark Reconciled"
5. Payment disappears from list ✓

**Example Display:**
```
┌─ pay-001 ──────────────────────────────────── [Unreconciled]
│ Amount: $1,000
│ Captured: 2024-08-30
│
├─ Bank Reference: [_______________]
├─ Notes: [________________]
└─ [Mark Reconciled] button
```

---

## Data Flow Example: Payment Posting

### User Action
```typescript
// User clicks "Create Payment"
const handleCreatePayment = async (e) => {
  e.preventDefault();
  
  // Dispatch thunk to create payment
  dispatch(createPayment({
    invoiceId: "inv-001",
    amount: 1000,
    paymentMethod: "card"
  }));
};
```

### Redux Thunk
```typescript
export const createPayment = createAsyncThunk(
  "payments/create",
  async (params) => {
    // Call API
    return apiClient.createPayment(
      params.invoiceId,
      params.amount,
      params.paymentMethod
    );
  }
);

// paymentSlice.extraReducers handles:
// - createPayment.pending: Set loading = true
// - createPayment.fulfilled: Update state with payment
// - createPayment.rejected: Set error message
```

### State Update
```typescript
paymentsState = {
  currentPayment: {
    id: "pay-001",
    amount: 1000,
    status: "captured",
    isPosted: false
  },
  loading: false,
  success: "Payment created successfully"
}
```

### Component Re-renders
```typescript
// App component uses hook
const paymentsState = useAppSelector(state => state.payments);

// Re-renders with new payment
<div>
  <div>Payment ID: {paymentsState.currentPayment.id}</div>
  <button onClick={handlePostPayment}>Post Payment</button>
</div>
```

---

## Hooks

### useAppDispatch
Typed dispatch hook for type safety:
```typescript
const dispatch = useAppDispatch();

// Type-checked thunk dispatch
dispatch(createPayment({
  invoiceId: "inv-001",
  amount: 1000,
  paymentMethod: "card"
}));
```

### useAppSelector
Typed selector hook:
```typescript
const payments = useAppSelector(state => state.payments.payments);
const loading = useAppSelector(state => state.payments.loading);
const error = useAppSelector(state => state.payments.error);
```

---

## API Service Layer

### apiClient.ts
Wraps all backend API calls:

```typescript
class ApiClient {
  async postPayment(paymentId: string, idempotencyKey?: string) {
    return this.client.post(`/api/v1/payments/${paymentId}/post`, {
      paymentId,
      idempotencyKey
    });
  }

  async refundPayment(paymentId, amount, reason) {
    return this.client.post(`/api/v1/payments/${paymentId}/refunds`, {
      paymentId,
      amount,
      reason
    });
  }

  async getPaymentAccountingHistory(paymentId) {
    return this.client.get(`/api/v1/payments/${paymentId}/accounting`);
  }
}
```

---

## Key Components Interaction

```
App (Provider)
├─ Store (Redux)
│  ├─ paymentsSlice
│  └─ reconciliationSlice
│
├─ AppContent (Main component)
│  ├─ Payment Posting Tab
│  │  ├─ Form (Create payment)
│  │  ├─ Post Button → dispatch(postPayment)
│  │  └─ JournalEntryTable ← fetches on post
│  │
│  ├─ Refunds Tab
│  │  ├─ Refund Button → opens RefundDialog
│  │  └─ RefundDialog
│  │     └─ onRefund → dispatch(refundPayment)
│  │
│  └─ Reconciliation Tab
│     └─ ReconciliationList
│        └─ onReconcile → dispatch(markPaymentReconciled)
│           → dispatch(fetchUnreconciledPayments)
```

---

## Error Handling

### Global Error Display
```typescript
// In AppContent
{paymentsState.error && (
  <div className="alert alert-error">
    {paymentsState.error}
  </div>
)}
```

### Component-Level Error
```typescript
// In RefundDialog
const [error, setError] = useState("");

try {
  await onRefund(paymentId, amount, reason);
} catch (err) {
  setError(err.message);
}
```

---

## UI Status Indicators

### Payment Status Badge
```
Captured:      Yellow badge "Captured"
Refunded:      Red badge "Refunded"
Partial Refund: Orange badge "Partial Refund"
```

### Posting Status
```
isPosted=false: "Not Yet Posted"
isPosted=true:  "Posted" with green checkmark
```

### Reconciliation Status
```
Unreconciled: Yellow "Unreconciled"
Reconciled:   Green "Reconciled"
```

---

## Performance Considerations

1. **Redux Selector Memoization**: Use `useAppSelector` to avoid unnecessary re-renders
2. **Async Thunks**: Only fetch when needed (e.g., accounting on post)
3. **Modal Dialogs**: Refund dialog doesn't re-render full page
4. **List Rendering**: ReconciliationList memoizes individual items

---

## Testing Frontend

```typescript
test("posting payment fetches accounting history", async () => {
  const { dispatch } = useTestStore();
  
  await dispatch(createPayment({
    invoiceId: "inv-001",
    amount: 1000,
    paymentMethod: "card"
  }));
  
  const state = store.getState();
  expect(state.payments.currentPayment).toBeDefined();
  
  // Post the payment
  await dispatch(postPayment({ paymentId: state.payments.currentPayment.id }));
  
  // Accounting should be loaded
  expect(state.payments.accounting).toBeDefined();
  expect(state.payments.accounting.journalEntries.length).toBe(1);
});
```

The frontend is fully typed and provides a clean UI for all three core operations: posting, refunding, and reconciling.
