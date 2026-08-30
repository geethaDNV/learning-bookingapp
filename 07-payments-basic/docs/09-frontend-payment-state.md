# 09 - Frontend Payment State: Redux and UI

## Redux Architecture

Frontend state management uses Redux Toolkit with async thunks:

```
PaymentSlice (State)
  ├─ payments: Payment[]           // List of payments
  ├─ selectedPayment: Payment | null
  ├─ paymentStatus: PaymentStatus | null
  ├─ loading: boolean
  ├─ error: string | null
  ├─ page: number
  ├─ pageSize: number
  └─ total: number
```

---

## Payment State Slice

**File**: `src/features/payments/store/paymentSlice.ts`

```typescript
const paymentSlice = createSlice({
  name: "payments",
  initialState: {
    payments: [],
    selectedPayment: null,
    paymentStatus: null,
    loading: false,
    error: null,
    total: 0,
    page: 1,
    pageSize: 10,
  },
  reducers: {
    setPage: (state, action) => {
      state.page = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Handle async thunks
  },
});
```

---

## Async Thunks

Thunks handle API communication and update state:

### Fetch Payments List

```typescript
export const fetchPayments = createAsyncThunk(
  "payments/fetchPayments",
  async (params: { page?: number; pageSize?: number; status?: string; invoiceId?: string }) => {
    return paymentAPI.listPayments(params.page, params.pageSize, params.status, params.invoiceId);
  }
);
```

**State transitions:**
```
Pending:
  state.loading = true
  state.error = null

Fulfilled:
  state.loading = false
  state.payments = action.payload.items
  state.total = action.payload.total
  state.page = action.payload.page
  state.pageSize = action.payload.pageSize

Rejected:
  state.loading = false
  state.error = action.error.message
```

### Create Payment

```typescript
export const createPayment = createAsyncThunk(
  "payments/createPayment",
  async (invoiceId: string) => {
    return paymentAPI.createPayment(invoiceId);
  }
);
```

### Fetch Payment Status

```typescript
export const fetchPaymentStatus = createAsyncThunk(
  "payments/fetchPaymentStatus",
  async (publicId: string) => {
    return paymentAPI.getPaymentStatus(publicId);
  }
);
```

Stores result in `state.paymentStatus`.

### Simulate Success/Failure

```typescript
export const simulatePaymentSuccess = createAsyncThunk(
  "payments/simulatePaymentSuccess",
  async (paymentId: string) => {
    return paymentAPI.simulatePaymentSuccess(paymentId);
  }
);

export const simulatePaymentFailure = createAsyncThunk(
  "payments/simulatePaymentFailure",
  async (paymentId: string) => {
    return paymentAPI.simulatePaymentFailure(paymentId);
  }
);
```

---

## Selectors

Selectors provide typed access to state:

**File**: `src/features/payments/store/paymentSelectors.ts`

```typescript
export const selectPayments = (state: RootState) => state.payments.payments;
export const selectSelectedPayment = (state: RootState) => state.payments.selectedPayment;
export const selectPaymentStatus = (state: RootState) => state.payments.paymentStatus;
export const selectPaymentLoading = (state: RootState) => state.payments.loading;
export const selectPaymentError = (state: RootState) => state.payments.error;
export const selectPaymentTotal = (state: RootState) => state.payments.total;
export const selectPaymentPage = (state: RootState) => state.payments.page;
export const selectPaymentPageSize = (state: RootState) => state.payments.pageSize;
```

Usage in components:
```typescript
const payments = useAppSelector(selectPayments);
const loading = useAppSelector(selectPaymentLoading);
const error = useAppSelector(selectPaymentError);
```

---

## Payment Status Page Component

**File**: `src/features/payments/pages/PaymentStatusPage.tsx`

```typescript
export const PaymentStatusPage: React.FC<PaymentStatusPageProps> = ({ publicId }) => {
  const dispatch = useAppDispatch();
  const status = useAppSelector(selectSelectedPayment);
  const loading = useAppSelector(selectPaymentLoading);
  const error = useAppSelector(selectPaymentError);

  // Fetch status when component mounts
  React.useEffect(() => {
    dispatch(fetchPaymentStatus(publicId));
  }, [publicId, dispatch]);

  const handleSimulateSuccess = () => {
    if (status) {
      dispatch(simulatePaymentSuccess(status.id));
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!status) return <div>Payment not found</div>;

  return (
    <div className="payment-status-container">
      <h1>Payment Status</h1>

      <div className="status-card">
        <div className="field">
          <label>Public ID</label>
          <p>{status.publicId}</p>
        </div>

        <div className="field">
          <label>Status</label>
          <span className={`badge badge-${status.status}`}>
            {status.status.toUpperCase()}
          </span>
        </div>

        <div className="field">
          <label>Amount</label>
          <p>${(status.amount / 100).toFixed(2)}</p>
        </div>

        <div className="grid">
          <div className="field">
            <label>Paid Amount</label>
            <p>${(status.paidAmount / 100).toFixed(2)}</p>
          </div>
          <div className="field">
            <label>Balance Due</label>
            <p>${(status.balanceDue / 100).toFixed(2)}</p>
          </div>
        </div>

        <div className="field">
          <label>Invoice Status</label>
          <p>{status.invoiceStatus.toUpperCase()}</p>
        </div>
      </div>

      <div className="learning-controls">
        <h3>Learning Controls</h3>
        <p>Simulate payment provider callbacks for testing.</p>
        <button
          onClick={handleSimulateSuccess}
          disabled={status.status === "captured" || loading}
          className="btn btn-success"
        >
          Simulate Success
        </button>
        <button
          onClick={handleSimulateFailure}
          disabled={status.status === "failed" || loading}
          className="btn btn-danger"
        >
          Simulate Failure
        </button>
      </div>
    </div>
  );
};
```

---

## Payment List Page Component

**File**: `src/features/payments/pages/PaymentListPage.tsx`

```typescript
export const PaymentListPage: React.FC<PaymentListPageProps> = ({ invoiceId }) => {
  const dispatch = useAppDispatch();
  const payments = useAppSelector(selectPayments);
  const loading = useAppSelector(selectPaymentLoading);
  const error = useAppSelector(selectPaymentError);
  const page = useAppSelector(selectPaymentPage);
  const total = useAppSelector(selectPaymentTotal);
  const pageSize = useAppSelector(selectPaymentPageSize);

  // Fetch payments when page or filters change
  React.useEffect(() => {
    dispatch(fetchPayments({ page, pageSize, invoiceId }));
  }, [page, pageSize, invoiceId, dispatch]);

  return (
    <div className="payment-list-container">
      <h1>Payments</h1>

      {payments.length === 0 ? (
        <div className="empty-state">No payments found</div>
      ) : (
        <table className="payment-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Status</th>
              <th>Amount</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment.id}>
                <td className="font-mono">{payment.publicId}</td>
                <td>
                  <span className={`badge badge-${payment.status}`}>
                    {payment.status.toUpperCase()}
                  </span>
                </td>
                <td>${(payment.amount / 100).toFixed(2)}</td>
                <td>{new Date(payment.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Pagination */}
      {total > pageSize && (
        <div className="pagination">
          <button
            onClick={() => dispatch(setPage(Math.max(1, page - 1)))}
            disabled={page === 1}
          >
            Previous
          </button>
          <span>Page {page} of {Math.ceil(total / pageSize)}</span>
          <button
            onClick={() => dispatch(setPage(Math.min(Math.ceil(total / pageSize), page + 1)))}
            disabled={page * pageSize >= total}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};
```

---

## Data Flow: User Action to UI Update

```
User clicks "Simulate Success"
  ↓
handleSimulateSuccess()
  ↓
dispatch(simulatePaymentSuccess(paymentId))
  ↓
Thunk calls API: POST /api/v1/payments/mock/{paymentId}/succeed
  ↓
Thunk.pending:
  state.loading = true
  UI shows spinner
  ↓
API returns: { status: "captured", ... }
  ↓
Thunk.fulfilled:
  state.loading = false
  state.selectedPayment = action.payload
  state.paymentStatus.status = "captured"
  state.paymentStatus.paidAmount = 16500
  state.paymentStatus.balanceDue = 0
  state.paymentStatus.invoiceStatus = "paid"
  ↓
Component re-renders with new state
  Status badge changes from "created" → "captured"
  Balance Due changes from "$165" → "$0"
  Invoice Status changes from "issued" → "paid"
```

---

## Error Handling

If API call fails:

```typescript
Thunk.rejected:
  state.loading = false
  state.error = "Failed to simulate payment success"
  ↓
Component renders:
  <div className="error-message">
    Failed to simulate payment success
  </div>
```

Users can click "Clear Error" to dismiss.

---

## useAppDispatch and useAppSelector Hooks

**File**: `src/store/hooks.ts`

These are typed wrappers around Redux hooks:

```typescript
import { useDispatch, useSelector } from "react-redux";
import type { TypedUseSelectorHook } from "react-redux";
import type { RootState, AppDispatch } from "./store";

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

Usage:
```typescript
const dispatch = useAppDispatch();        // ✓ Knows AppDispatch type
const status = useAppSelector(selectPaymentStatus); // ✓ Knows RootState type
```

---

## Key Points

1. **Async thunks handle API calls**: No mixing of API and Redux logic
2. **Selectors provide type-safe access**: No string keys, IDE autocomplete
3. **Loading state for spinners**: `selectPaymentLoading`
4. **Error state for messages**: `selectPaymentError`
5. **Pagination via reducers**: `setPage` updates state locally
6. **Eventual consistency**: UI updates after API response

Next: [10 - Contracts, DI, and Typing](10-contracts-di-and-typing.md)
