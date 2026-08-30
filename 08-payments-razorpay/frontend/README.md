# Frontend Setup & Reference

Complete guide to running and using the payment frontend.

## Quick Start (3 minutes)

```bash
# 1. Install dependencies
npm install

# 2. Start dev server
npm run dev

# Frontend running at http://localhost:3000
# Automatically connects to backend at http://localhost:3001
```

## Prerequisites

- Node.js 18+ (check: `node --version`)
- npm 9+ (check: `npm --version`)
- Backend running on http://localhost:3001 (see `backend/README.md`)

## Directory Structure

```
frontend/
├── src/
│   ├── main.tsx                 # React entry point
│   ├── App.tsx                  # Main component
│   ├── App.css                  # App styling
│   │
│   ├── types/
│   │   └── payment.ts           # TypeScript types
│   │
│   ├── services/
│   │   └── paymentApi.ts        # Backend communication
│   │
│   ├── components/
│   │   ├── PaymentList.tsx      # Display all payments
│   │   └── CreatePaymentLinkForm.tsx  # Create payment form
│   │
│   ├── pages/
│   │   └── PaymentStatusPage.tsx     # Payment status display
│   │
│   ├── index.css                # Global styles
│   │
│   └── vite-env.d.ts            # Vite types
│
├── public/                       # Static files
├── index.html                    # HTML entry point
├── vite.config.ts               # Vite bundler config
├── tsconfig.json                # TypeScript config
├── package.json                 # Dependencies
└── README.md                     # This file
```

## Configuration

### Vite Proxy

The app automatically proxies API requests from `/api` to the backend:

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
});
```

This means:
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3001`
- Request to `/api/v1/payments` → proxied to `http://localhost:3001/api/v1/payments`

### Environment Variables

Create `.env` file if needed (currently no env vars required):

```bash
# Optional: Override backend URL
VITE_API_BASE_URL=http://localhost:3001
```

## Running the Server

### Development Mode
```bash
npm run dev
# Watches files, auto-reloads on changes
# http://localhost:3000
```

### Build for Production
```bash
npm run build
# Compiles React to dist/ folder
# Output is static HTML/CSS/JS (no runtime needed)
```

### Preview Production Build
```bash
npm run preview
# Runs the built version locally
# http://localhost:3000
```

### Linting
```bash
npm run lint
# Checks code quality
```

## User Interface

### Main Views

#### 1. Payment List View
- Shows all payments
- Displays: publicId, amount, status, created date
- Status color coding:
  - 🟢 Green: CAPTURED (success)
  - 🔴 Red: FAILED
  - 🟠 Orange: PENDING
- Pagination controls
- "View" button to see payment details

#### 2. Create Payment Form
- Input field for Invoice ID
- "Create Payment Link" button
- Error messages if validation fails
- Auto-redirects to Razorpay/mock payment page on success

#### 3. Payment Status Page
- Shows payment details: ID, amount, status
- Status badge with message
- Auto-refreshes every 3 seconds while PENDING
- "Complete Payment" button redirects to payment link
- Shows confirmation when CAPTURED or FAILED

### Navigation

```
┌─────────────────────────────────────┐
│  Payments App                       │
├─────────────────────────────────────┤
│ [List]  [Create]  [Status]          │
├─────────────────────────────────────┤
│                                     │
│  View content based on selection    │
│                                     │
└─────────────────────────────────────┘
```

## API Service

### PaymentApiService

```typescript
// src/services/paymentApi.ts
class PaymentApiService {
  // Create payment for invoice
  async createPaymentLink(invoiceId: string): Promise<Payment>
  
  // Get single payment by publicId (public endpoint)
  async getPaymentStatus(publicId: string): Promise<Payment>
  
  // List all payments with pagination
  async listPayments(page: number, pageSize: number): Promise<{
    payments: Payment[];
    total: number;
  }>
  
  // Mock only: simulate successful payment
  async simulatePaymentSuccess(paymentId: string): Promise<Payment>
  
  // Mock only: simulate failed payment
  async simulatePaymentFailure(paymentId: string): Promise<Payment>
}

// Usage:
const payment = await paymentApiService.createPaymentLink("invoice-id");
```

## Component Usage

### PaymentList Component

```tsx
import { PaymentList } from "./components/PaymentList";

function App() {
  return <PaymentList />;
}
```

**Features**:
- Auto-loads all payments on mount
- Displays paginated table
- Click "View" to see payment details
- Status color coding

### CreatePaymentLinkForm Component

```tsx
import { CreatePaymentLinkForm } from "./components/CreatePaymentLinkForm";

function App() {
  const handleSuccess = (payment: Payment) => {
    console.log("Payment created:", payment);
  };

  return (
    <CreatePaymentLinkForm 
      invoiceId="invoice-123"
      onSuccess={handleSuccess}
    />
  );
}
```

**Features**:
- Input field for invoice ID
- Create button with loading state
- Error display
- Auto-redirect to payment link

### PaymentStatusPage Component

```tsx
import { PaymentStatusPage } from "./pages/PaymentStatusPage";

function App() {
  return <PaymentStatusPage publicId="pay_abc123" />;
}
```

**Features**:
- Displays payment status
- Auto-refreshes every 3 seconds
- Shows payment details table
- Links to payment link if PENDING
- Confirmation messages if success/failure

## Styling

### Global Styles

```css
/* src/App.css */
- Purple-to-violet gradient header
- Responsive layout (mobile-friendly)
- Light/dark mode support
- Smooth transitions
```

### Component Styles

```css
/* Buttons */
button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 1rem;
}

button:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(102, 126, 234, 0.4);
}

/* Tables */
table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
}

th, td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

/* Status Badge */
.status-captured {
  color: green;
}

.status-failed {
  color: red;
}

.status-pending {
  color: orange;
}
```

## Testing

### Manual Testing

#### 1. Check Backend is Running
```bash
curl http://localhost:3001/health
# Should return: { "status": "ok", "provider": "mock" }
```

#### 2. Start Frontend
```bash
npm run dev
# Frontend at http://localhost:3000
# Open in browser
```

#### 3. Create Payment (Mock Provider)
- Click "Create" tab
- Enter invoice ID (from database)
- Click "Create Payment Link"
- Should redirect to mock payment page

#### 4. Check Payment List
- Click "List" tab
- Should show created payment
- Status should be PENDING (orange)

#### 5. Simulate Payment Success
- Get payment ID from mock page
- In terminal: `curl -X POST http://localhost:3001/api/v1/payments/{id}/simulate/success`
- In browser, go back to "List" tab
- Payment status should now be CAPTURED (green)
- Or go to "Status" tab - should show success message

### Testing with Razorpay Sandbox

1. **Create Payment**
   - Go to Create tab
   - Enter invoice ID
   - Click "Create Payment Link"
   - Gets redirected to Razorpay checkout

2. **Use Test Card**
   - Card Number: `4111 1111 1111 1111`
   - Expiry: Any future date (e.g., 12/25)
   - CVV: Any 3 digits (e.g., 123)
   - Name: Any name
   - Click "Pay Now"

3. **Check Status**
   - Complete payment
   - Redirected to status page
   - Status should update to CAPTURED within 3 seconds (auto-refresh)

4. **Check List**
   - Go to List view
   - Payment status should be green (CAPTURED)

## Architecture

### Request Flow

```
User Action
    ↓
React Component (onClick, etc.)
    ↓
PaymentApiService
    ├─ Validates input
    ├─ Makes HTTP request to /api/v1/payments
    ├─ Shows loading state
    └─ Handles errors
    ↓
Axios HTTP Client
    ↓
Vite Proxy
    ├─ Intercepts /api/* requests
    └─ Forwards to http://localhost:3001
    ↓
Backend Express Server
    ├─ Processes request
    └─ Returns JSON response
    ↓
PaymentApiService
    ├─ Parses response
    └─ Returns typed data
    ↓
React Component
    ├─ Updates state
    └─ Re-renders with new data
```

### State Management

Currently using React hooks (local state):

```typescript
// In component
const [payment, setPayment] = useState<Payment | null>(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  const fetch = async () => {
    setLoading(true);
    try {
      const data = await paymentApiService.getPaymentStatus(id);
      setPayment(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  fetch();
}, [id]);
```

### Auto-Refresh Logic

```typescript
// In PaymentStatusPage
useEffect(() => {
  // Only refresh if payment is PENDING
  if (!payment || payment.status !== "PENDING") return;

  // Set up interval
  const interval = setInterval(async () => {
    const updated = await paymentApiService.getPaymentStatus(publicId);
    setPayment(updated);
  }, 3000);  // Every 3 seconds

  // Clean up
  return () => clearInterval(interval);
}, [payment, publicId]);
```

## Debugging

### Check Browser Console

1. Open DevTools: F12 or Ctrl+Shift+I
2. Go to Console tab
3. Look for errors
4. Check Network tab for failed requests

### Check Network Requests

1. DevTools → Network tab
2. Perform action (create payment, etc.)
3. See request:
   - Method: POST/GET
   - URL: http://localhost:3000/api/v1/payments
   - Status: 200 (success) or 400+ (error)
4. Click request to see:
   - Request body/headers
   - Response body/headers

### Common Issues

| Issue | Solution |
|-------|----------|
| "Backend URL not accessible" | Ensure backend running: `npm run dev` in backend folder |
| "CORS error" | Backend needs `cors()` middleware; check `backend/src/server.ts` |
| "Cannot read property 'status' of undefined" | Payment fetch failed; check backend logs |
| "Invoice not found" | Backend doesn't have invoice; run `npx prisma db seed` |
| "Auto-refresh not working" | Check browser console for errors |

### View API Responses

```bash
# Get all payments
curl http://localhost:3001/api/v1/payments

# Get single payment
curl http://localhost:3001/api/v1/payments/pay_abc123

# Check what frontend receives:
# Open DevTools → Network tab → See API responses
```

## Extending the Frontend

### Add New Component

```tsx
// src/components/MyComponent.tsx
import React from "react";
import { Payment } from "../types/payment";

export const MyComponent: React.FC<{ payment: Payment }> = ({ payment }) => {
  return (
    <div>
      <h3>{payment.publicId}</h3>
      <p>Amount: ₹{payment.amount}</p>
    </div>
  );
};
```

### Add New API Method

```typescript
// src/services/paymentApi.ts
export class PaymentApiService {
  async newMethod(params: any) {
    const response = await axios.get("/api/v1/endpoint", { params });
    return response.data.data;
  }
}
```

### Add New Page

```tsx
// src/pages/NewPage.tsx
import React from "react";

export const NewPage: React.FC = () => {
  return <div>New page content</div>;
};
```

## Performance Tips

### 1. Reduce Auto-Polling Frequency

If auto-refresh drains battery/bandwidth, increase interval:

```typescript
// Every 5 seconds instead of 3
const interval = setInterval(fetch, 5000);
```

### 2. Stop Polling After Time Limit

```typescript
const maxTime = 5 * 60 * 1000;  // 5 minutes
setTimeout(() => clearInterval(interval), maxTime);
```

### 3. Cache Results

```typescript
const [paymentCache, setPaymentCache] = useState<Record<string, Payment>>({});

const getPayment = async (id: string) => {
  if (paymentCache[id]) return paymentCache[id];
  const payment = await paymentApiService.getPaymentStatus(id);
  setPaymentCache(prev => ({ ...prev, [id]: payment }));
  return payment;
};
```

### 4. Optimize Re-renders

```typescript
// Wrap components with React.memo to prevent unnecessary re-renders
export const PaymentRow = React.memo(({ payment }) => {
  return <tr>...</tr>;
});
```

## Next Steps

1. **Run the app**: `npm run dev`
2. **Read backend README**: Understand API endpoints
3. **Test with mock**: Create and view payments locally
4. **Test with Razorpay**: Set up sandbox and test real flow
5. **Explore components**: Understand React structure
6. **Extend components**: Add features from exercises

## Deployment

### Build for Production

```bash
npm run build
# Creates dist/ folder with static files
# Ready to deploy to:
# - Vercel, Netlify (auto-detects Vite)
# - AWS S3 + CloudFront
# - Any static hosting
```

### Environment Configuration

Create `.env.production` for production:

```bash
VITE_API_BASE_URL=https://api.yourdomain.com
```

### Deployment Steps

1. Build: `npm run build`
2. Deploy dist/ folder to hosting
3. Ensure backend API is accessible from your domain
4. Update CORS in backend if needed

### Testing Before Deploy

```bash
# Test production build locally
npm run build
npm run preview
# Visit http://localhost:3000
```

## Useful Commands

```bash
npm run dev        # Start dev server
npm run build      # Build for production
npm run preview    # Test production build
npm run lint       # Check code quality
npm install        # Install dependencies
npm update         # Update packages
```

## Browser Support

- Chrome/Edge: Latest
- Firefox: Latest
- Safari: Latest
- IE: Not supported (uses ES2020+)

## Next: Backend Integration

Once familiar with frontend, check [Backend README](../backend/README.md) for:
- API endpoints reference
- Database schema
- Razorpay setup
- Error handling
