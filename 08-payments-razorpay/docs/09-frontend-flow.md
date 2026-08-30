# 09. Frontend Payment Flow

How the frontend creates payments and displays status updates.

## Architecture

```
Browser                         Backend
  │                               │
  │  1. Click "Create Payment"    │
  ├──────POST /api/v1/payments───>│
  │                               ├─ Fetch invoice
  │                               ├─ Call gateway provider
  │  2. Payment created           ├─ Store payment record
  │  { publicId, hostedUrl }      │
  │<─────────response─────────────┤
  │                               │
  │  3. Redirect to hostedUrl    │
  │     (Razorpay or mock)        │
  │                               │
  ├─────[Customer Pays]──────────>│ (External: Razorpay)
  │                               │
  │  4. Webhook received          │
  │     (Razorpay → Backend)      │
  │                               ├─ Verify signature
  │                               ├─ Update payment status
  │                               ├─ Update invoice
  │                               │
  │  5. Redirect to status page   │
  │     GET /pay/status/:publicId │
  │                               │
  │  6. Show payment status       │
  │     (Auto-refresh)            │
  │                               ├─ Query payment
  │<─────payment.status───────────┤
  │                               │
  └───────────────────────────────┘
```

## Frontend Components

### 1. Payment List Component

Shows all payments with status.

```typescript
// frontend/src/components/PaymentList.tsx
export const PaymentList: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    const loadPayments = async () => {
      const result = await paymentApiService.listPayments(1, 10);
      setPayments(result.payments);
    };
    loadPayments();
  }, []);

  return (
    <div>
      {payments.map((payment) => (
        <div key={payment.id}>
          <p>ID: {payment.publicId}</p>
          <p>Status: {payment.status}</p>
          <button onClick={() => window.location.href = payment.hostedUrl}>
            View Payment
          </button>
        </div>
      ))}
    </div>
  );
};
```

### 2. Create Payment Form Component

Takes invoiceId, creates payment, redirects customer.

```typescript
// frontend/src/components/CreatePaymentLinkForm.tsx
export const CreatePaymentLinkForm: React.FC<{
  invoiceId: string;
  onSuccess?: (payment: Payment) => void;
}> = ({ invoiceId, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    try {
      setLoading(true);
      const payment = await paymentApiService.createPaymentLink(invoiceId);
      onSuccess?.(payment);
      // Redirect to hosted payment link
      window.location.href = payment.hostedUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={handleCreate} disabled={loading}>
        {loading ? "Creating..." : "Create Payment Link"}
      </button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};
```

### 3. Payment Status Page Component

Shows payment status with auto-refresh.

```typescript
// frontend/src/pages/PaymentStatusPage.tsx
export const PaymentStatusPage: React.FC<{ publicId: string }> = ({ publicId }) => {
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const data = await paymentApiService.getPaymentStatus(publicId);
      setPayment(data);
      setLoading(false);
    };
    fetch();
  }, [publicId]);

  // Auto-refresh every 3 seconds if pending
  useEffect(() => {
    if (!payment || payment.status !== "PENDING") return;

    const interval = setInterval(async () => {
      const data = await paymentApiService.getPaymentStatus(publicId);
      setPayment(data);
    }, 3000);

    return () => clearInterval(interval);
  }, [payment, publicId]);

  if (loading) return <p>Loading...</p>;
  if (!payment) return <p>Payment not found</p>;

  return (
    <div>
      <h2>Payment Status</h2>
      <p>Amount: ₹{payment.amount}</p>
      <p>Status: {payment.status}</p>

      {payment.status === "PENDING" && (
        <a href={payment.hostedUrl} target="_blank">
          Complete Payment
        </a>
      )}

      {payment.status === "CAPTURED" && (
        <p style={{ color: "green" }}>✓ Payment successful!</p>
      )}

      {payment.status === "FAILED" && (
        <p style={{ color: "red" }}>✗ Payment failed</p>
      )}
    </div>
  );
};
```

## Payment API Service

```typescript
// frontend/src/services/paymentApi.ts
export class PaymentApiService {
  async createPaymentLink(invoiceId: string): Promise<Payment> {
    const response = await axios.post("/api/v1/payments", { invoiceId });
    return response.data.data;
  }

  async getPaymentStatus(publicId: string): Promise<Payment> {
    const response = await axios.get(`/api/v1/payments/${publicId}`);
    return response.data.data;
  }

  async listPayments(page: number, pageSize: number): Promise<{
    payments: Payment[];
    total: number;
  }> {
    const response = await axios.get("/api/v1/payments", {
      params: { page, pageSize }
    });
    return {
      payments: response.data.data,
      total: response.data.pagination.total
    };
  }
}
```

## User Workflows

### Workflow 1: Payment Success

```
1. User navigates to invoice detail page
   → Shows invoice amount and customer name

2. User clicks "Create Payment Link"
   → Frontend calls POST /api/v1/payments
   → Backend creates link with provider
   → Response: { hostedUrl: "https://rzp.io/...", publicId: "pay_abc" }

3. Frontend redirects: window.location.href = hostedUrl
   → Customer sees Razorpay payment form

4. Customer enters card details
   → Customer clicks "Pay Now"
   → Razorpay processes payment

5. Payment succeeds
   → Razorpay webhook sent to backend
   → Backend verifies and updates payment status
   → Backend updates invoice as PAID

6. Customer redirected to status page
   → Frontend queries payment status
   → Shows "✓ Payment successful!"
   → Auto-refresh shows status updated

7. Customer goes back to invoice
   → Invoice status: PAID
   → Balance due: ₹0
```

### Workflow 2: Payment Failure

```
1-4. Same as above

5. Payment fails (card declined)
   → Razorpay shows error
   → Customer sees "Payment failed"

6. Razorpay webhook sent to backend
   → Backend updates payment status to FAILED
   → Invoice status remains: SENT

7. Customer redirected to status page
   → Shows "✗ Payment failed"
   → "Try again" button redirects to payment link

8. Customer tries again
   → Creates new payment link
   → Repeats flow from step 2
```

### Workflow 3: Auto-Polling

```
1-3. User at status page, payment pending

4. Frontend auto-refreshes every 3 seconds
   → GET /api/v1/payments/pay_abc123

5. Initially status: PENDING
   → Shows "⏳ Payment pending"

6. Customer completes payment in another tab

7. Webhook updates backend (payment status → CAPTURED)

8. Frontend's auto-refresh detects status change
   → Shows "✓ Payment successful!"
   → Stops auto-refresh (no need for CAPTURED)
```

## Handling Edge Cases

### Payment Link Not Created

```typescript
// Check for error response
if (!response.data.success) {
  setError(response.data.error.message);
  // "Failed to create payment link: Razorpay credentials not configured"
  return;
}
```

### Webhook Not Received Yet

Customer at status page, webhook delayed:

```typescript
// Auto-refresh keeps polling
// Eventually receives webhook
// Status updates
```

### Browser Closed During Payment

Customer closes browser after clicking "Pay Now":

1. Razorpay still processes payment
2. Backend receives webhook and updates status
3. Customer opens app again, navigates to status page
4. Shows correct status (CAPTURED or FAILED)

### Multiple Payments for Same Invoice

- First payment created: publicId_1
- Second payment created: publicId_2
- Only latest payment shown in UI
- Multiple payments allowed for partial/retry scenarios

## Styling & UX

### Status Badge Colors

```typescript
const statusColors = {
  PENDING: "orange",
  CAPTURED: "green",
  FAILED: "red",
  CANCELLED: "gray"
};
```

### Loading States

```typescript
<button disabled={loading}>
  {loading ? "Creating..." : "Create Payment Link"}
</button>
```

### Error Display

```typescript
{error && (
  <div style={{ color: "red", marginTop: "1rem" }}>
    ❌ {error}
  </div>
)}
```

## Testing the Frontend Flow

### 1. With Mock Provider

```bash
# Backend running with mock provider
npm run dev

# Create payment (instant, local)
POST /api/v1/payments
{ "invoiceId": "cuid-123" }
→ { "publicId": "pay_abc", "hostedUrl": "http://localhost:3001/..." }

# Frontend redirects to mock payment page
# Show mock payment interface

# Simulate success
POST /api/v1/payments/{id}/simulate/success
→ Updates payment status to CAPTURED

# Status page updates
GET /api/v1/payments/pay_abc
→ { "status": "CAPTURED" }
```

### 2. With Razorpay Sandbox

```bash
# Backend with Razorpay keys
RAZORPAY_KEY_ID=rzp_test_xxx
PAYMENT_PROVIDER=razorpay

# Create payment
POST /api/v1/payments
→ { "publicId": "pay_abc", "hostedUrl": "https://rzp.io/..." }

# Customer opens Razorpay checkout
# Uses test card: 4111 1111 1111 1111
# Completes payment

# Razorpay sends webhook
# Status page updates automatically
```

## Performance Considerations

### Reduce Auto-Polling Frequency

```typescript
// Aggressive polling (1 second)
const interval = setInterval(() => fetch(), 1000);

// Better (3 seconds)
const interval = setInterval(() => fetch(), 3000);

// Even better (stop after 5 minutes)
const maxTime = 5 * 60 * 1000;  // 5 minutes
setTimeout(() => clearInterval(interval), maxTime);
```

### Batch Requests

Don't create multiple payments for same invoice:

```typescript
// Check if payment exists
const existingPayment = await checkPaymentExists(invoiceId);
if (existingPayment && existingPayment.status === "PENDING") {
  // Reuse existing payment link
  window.location.href = existingPayment.hostedUrl;
} else {
  // Create new one
}
```

## Next Steps

- Read `10-contract-trace.md` to see end-to-end request flow
