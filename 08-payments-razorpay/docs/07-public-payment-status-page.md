# 07. Public Payment Status Page

How to show customers the current status of their payment.

## Why Customers Need a Status Page

**Problem**: Customer pays, gets back to your app, refreshes page.
- Did payment go through?
- Is status updating?
- Do they need to try again?

**Solution**: Public status page shows payment state.

```
curl http://localhost:3001/api/v1/payments/{publicId}

Response:
{
  "success": true,
  "data": {
    "publicId": "pay_abc123",
    "amount": 5000,
    "currency": "INR",
    "status": "CAPTURED",
    "provider": "razorpay",
    "hostedUrl": "https://rzp.io/...",
    "createdAt": "2024-08-30T10:30:00Z",
    "updatedAt": "2024-08-30T10:32:00Z"
  }
}
```

## API Endpoint

### GET /api/v1/payments/:publicId

**Public endpoint** - no authentication needed (anyone can check status with publicId)

**Parameters**:
- `publicId` (URL path): Public payment ID

**Response**:
```json
{
  "success": true,
  "message": "Payment retrieved successfully",
  "data": {
    "id": "pay_123",
    "publicId": "pay_abc123",
    "amount": 5000,
    "currency": "INR",
    "status": "CAPTURED",
    "provider": "razorpay",
    "createdAt": "2024-08-30T10:30:00Z",
    "updatedAt": "2024-08-30T10:32:00Z",
    "hostedUrl": "https://rzp.io/...",
    "providerPaymentId": "pay_xyz789"
  }
}
```

**Status Values**:
- `PENDING`: Payment link created, awaiting payment
- `CAPTURED`: Payment successful
- `FAILED`: Payment failed (card declined, user cancelled, etc.)
- `CANCELLED`: Payment link expired

## Frontend Implementation

### Simple Status Page Component

```typescript
// frontend/src/pages/PaymentStatusPage.tsx
import React, { useState, useEffect } from "react";
import { Payment } from "../types/payment";
import { paymentApiService } from "../services/paymentApi";

interface PaymentStatusPageProps {
  publicId: string;
}

export const PaymentStatusPage: React.FC<PaymentStatusPageProps> = ({
  publicId,
}) => {
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPaymentStatus();
  }, [publicId]);

  const fetchPaymentStatus = async () => {
    try {
      setLoading(true);
      const data = await paymentApiService.getPaymentStatus(publicId);
      setPayment(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load payment");
      setPayment(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CAPTURED":
        return "green";
      case "FAILED":
        return "red";
      case "PENDING":
        return "orange";
      default:
        return "gray";
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case "CAPTURED":
        return "✓ Payment successful!";
      case "FAILED":
        return "✗ Payment failed. Please try again.";
      case "PENDING":
        return "⏳ Payment pending. Please wait or open the payment link.";
      default:
        return "Payment status unknown";
    }
  };

  if (loading) {
    return <div style={{ textAlign: "center", padding: "2rem" }}>Loading...</div>;
  }

  if (error) {
    return (
      <div style={{ color: "red", textAlign: "center", padding: "2rem" }}>
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={fetchPaymentStatus}>Retry</button>
      </div>
    );
  }

  if (!payment) {
    return <div style={{ textAlign: "center" }}>Payment not found</div>;
  }

  return (
    <div style={{ maxWidth: "600px", margin: "2rem auto" }}>
      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: "8px",
          padding: "2rem",
          backgroundColor: "#f9f9f9"
        }}
      >
        <h1>Payment Status</h1>

        {/* Status Badge */}
        <div
          style={{
            marginTop: "1.5rem",
            padding: "1rem",
            backgroundColor:
              payment.status === "CAPTURED"
                ? "#e8f5e9"
                : payment.status === "FAILED"
                ? "#ffebee"
                : "#fff8e1",
            borderLeft:
              `4px solid ${getStatusColor(payment.status)}`,
            borderRadius: "4px"
          }}
        >
          <div
            style={{
              color: getStatusColor(payment.status),
              fontWeight: "bold",
              fontSize: "1.2rem"
            }}
          >
            {getStatusMessage(payment.status)}
          </div>
        </div>

        {/* Payment Details */}
        <div style={{ marginTop: "2rem" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse"
            }}
          >
            <tbody>
              <tr style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "0.5rem", fontWeight: "bold" }}>
                  Payment ID:
                </td>
                <td style={{ padding: "0.5rem" }}>
                  <code>{payment.publicId}</code>
                </td>
              </tr>
              <tr style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "0.5rem", fontWeight: "bold" }}>Amount:</td>
                <td style={{ padding: "0.5rem" }}>
                  ₹{payment.amount} {payment.currency}
                </td>
              </tr>
              <tr style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "0.5rem", fontWeight: "bold" }}>Status:</td>
                <td style={{ padding: "0.5rem" }}>
                  <span
                    style={{
                      color: getStatusColor(payment.status),
                      fontWeight: "bold"
                    }}
                  >
                    {payment.status}
                  </span>
                </td>
              </tr>
              <tr style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "0.5rem", fontWeight: "bold" }}>
                  Provider:
                </td>
                <td style={{ padding: "0.5rem" }}>
                  {payment.provider}
                  {payment.provider === "mock" && (
                    <span style={{ fontSize: "0.9em", color: "blue" }}>
                      {" "}(Learning Mode)
                    </span>
                  )}
                </td>
              </tr>
              <tr style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "0.5rem", fontWeight: "bold" }}>
                  Created:
                </td>
                <td style={{ padding: "0.5rem" }}>
                  {new Date(payment.createdAt).toLocaleString()}
                </td>
              </tr>
              <tr>
                <td style={{ padding: "0.5rem", fontWeight: "bold" }}>
                  Updated:
                </td>
                <td style={{ padding: "0.5rem" }}>
                  {new Date(payment.updatedAt).toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Actions */}
        {payment.status === "PENDING" && payment.hostedUrl && (
          <div style={{ marginTop: "2rem" }}>
            <a
              href={payment.hostedUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-block",
                padding: "0.75rem 1.5rem",
                backgroundColor: "#2196F3",
                color: "white",
                textDecoration: "none",
                borderRadius: "4px",
                fontWeight: "bold"
              }}
            >
              Complete Payment →
            </a>
          </div>
        )}

        {payment.status === "CAPTURED" && (
          <div style={{ marginTop: "2rem" }}>
            <p style={{ color: "green", fontWeight: "bold" }}>
              ✓ Thank you! Your payment has been received.
            </p>
          </div>
        )}

        {payment.status === "FAILED" && (
          <div style={{ marginTop: "2rem" }}>
            <p style={{ color: "red" }}>
              Please try making the payment again. If the issue persists,
              contact support.
            </p>
          </div>
        )}

        {/* Refresh Button */}
        <button
          onClick={fetchPaymentStatus}
          style={{
            marginTop: "2rem",
            padding: "0.5rem 1rem",
            backgroundColor: "#f0f0f0",
            border: "1px solid #ddd",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          🔄 Refresh Status
        </button>
      </div>
    </div>
  );
};
```

## Integration with Invoice

### Workflow

1. User views invoice
2. Clicks "Create Payment Link"
3. Payment link created, redirects to Razorpay
4. Customer pays
5. Redirected back to status page: `/payment/status?id=pay_abc123`
6. Status page shows "Payment Successful"

### Deep Linking

After payment, Razorpay can redirect to your status page:

```typescript
// When creating payment link, set callback_url
const link = await client.paymentLink.create({
  // ...
  callback_url: `${config.razorpay.publicAppUrl}/payment/status/${publicId}`,
  callback_method: "get"
});
```

Razorpay will redirect customer to:
```
https://your-app.com/payment/status/pay_abc123?razorpay_payment_link_id=plink_xyz
```

## Auto-Polling (Optional)

Customer wants to see status update automatically:

```typescript
// Auto-refresh every 5 seconds
useEffect(() => {
  const interval = setInterval(() => {
    if (payment?.status === "PENDING") {
      fetchPaymentStatus();
    }
  }, 5000);  // 5 seconds

  return () => clearInterval(interval);
}, [payment?.status]);
```

Or use WebSocket for real-time updates (more advanced).

## Security Considerations

### Public vs. Private Data

```
PUBLIC (anyone can see):
- Payment status (PENDING, CAPTURED, FAILED)
- Amount
- Currency
- Creation time

PRIVATE (only customer should see):
- Invoice details (might include customer business data)
- Customer email
- Refund requests
```

Solution: Public status page shows only status, not invoice details.

### Rate Limiting (Production)

Prevent abuse (someone checking 1000 statuses):

```typescript
// Implement rate limiting
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100                     // 100 requests per window
}));
```

### CORS (If Frontend on Different Domain)

```typescript
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(","),
  credentials: true
}));
```

## Database Query

```sql
-- Get payment with status
SELECT 
  id,
  publicId,
  amount,
  currency,
  status,
  provider,
  createdAt,
  updatedAt
FROM payments
WHERE publicId = 'pay_abc123';
```

## Error Cases

### Payment Not Found

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Payment not found with public ID: pay_invalid"
  }
}
```

### Invalid Public ID Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid payment ID format"
  }
}
```

## Testing

```bash
# 1. Create payment
INVOICE_ID="cuid-xxx"
curl -X POST http://localhost:3001/api/v1/payments \
  -H "Content-Type: application/json" \
  -d "{\"invoiceId\":\"$INVOICE_ID\"}"
# Returns: {"success":true,"data":{"publicId":"pay_abc123",...}}

# 2. Check status before payment
curl http://localhost:3001/api/v1/payments/pay_abc123
# Returns: {"success":true,"data":{"status":"PENDING",...}}

# 3. Simulate payment (mock provider)
curl -X POST http://localhost:3001/api/v1/payments/pay_123/simulate/success

# 4. Check status after payment
curl http://localhost:3001/api/v1/payments/pay_abc123
# Returns: {"success":true,"data":{"status":"CAPTURED",...}}
```

## Next Steps

- Read `08-di-provider-selection.md` for understanding how to switch between mock and Razorpay
