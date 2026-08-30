# Backend Setup & Reference

Complete guide to running and understanding the backend payment server.

## Quick Start (5 minutes)

```bash
# 1. Install dependencies
npm install

# 2. Create database
npx prisma migrate dev --name init

# 3. Seed test data
npx prisma db seed

# 4. Start dev server
npm run dev

# Server running at http://localhost:3001
# API: http://localhost:3001/api/v1/payments
```

## Prerequisites

- Node.js 25+ (check: `node --version`)
- npm 10+ (check: `npm --version`)

## Directory Structure

```
backend/
├── src/
│   ├── server.ts                 # Express app setup
│   ├── db.ts                     # Prisma client
│   ├── config.ts                 # Environment config
│   │
│   ├── types/
│   │   └── payment.types.ts      # TypeScript types
│   │
│   ├── schemas/
│   │   └── payment.schemas.ts    # Zod validation schemas
│   │
│   ├── errors/
│   │   └── CustomErrors.ts       # Error classes
│   │
│   ├── middleware/
│   │   ├── errorHandler.ts       # Error handling middleware
│   │   └── rawBodyMiddleware.ts  # Captures raw body for webhooks
│   │
│   ├── services/
│   │   ├── MockPaymentGatewayProvider.ts    # Learning provider
│   │   ├── RazorpayGatewayProvider.ts       # Production provider
│   │   ├── PaymentService.ts               # Main payment logic
│   │   ├── PaymentNumberService.ts         # Generates payment IDs
│   │   ├── PaymentWebhookService.ts        # Webhook processing
│   │   └── InvoicePaymentApplicationService.ts  # Invoice updates
│   │
│   ├── repositories/
│   │   └── PaymentRepository.ts  # Database access
│   │
│   ├── controllers/
│   │   └── PaymentController.ts  # HTTP handlers
│   │
│   ├── routes/
│   │   └── paymentRoutes.ts      # Route definitions
│   │
│   └── di/
│       ├── contracts.ts          # Service interfaces
│       └── container.ts          # Dependency injection
│
├── prisma/
│   ├── schema.prisma             # Database schema
│   ├── seed.ts                   # Test data
│   └── dev.db                    # SQLite database (generated)
│
├── .env.example                  # Config template
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
└── README.md                     # This file
```

## Configuration

### Environment Variables

Create `.env` file (copy from `.env.example`):

```bash
# Database
DATABASE_URL="file:./dev.db"

# Payment provider
PAYMENT_PROVIDER="mock"  # or "razorpay"

# For Razorpay (get from https://dashboard.razorpay.com/settings/api-keys)
RAZORPAY_KEY_ID="rzp_test_xxx"
RAZORPAY_KEY_SECRET="zzz"
RAZORPAY_WEBHOOK_SECRET="webhook_secret_from_dashboard"

# Public URL (for webhooks)
APP_PUBLIC_URL="http://localhost:3001"  # or ngrok URL
```

### Mock Provider Setup (Default)

```bash
# No extra config needed!
PAYMENT_PROVIDER="mock"

npm run dev
# Server running with mock provider
# Payments are instant, no external dependencies
```

### Razorpay Sandbox Setup

1. **Create Razorpay Account**
   - Go to https://razorpay.com/
   - Sign up for free account

2. **Get API Keys**
   - Dashboard → Settings → API Keys
   - Select "Test Mode" (not Live!)
   - Copy Key ID and Key Secret
   - Set in `.env`:
   ```bash
   RAZORPAY_KEY_ID=rzp_test_xxx
   RAZORPAY_KEY_SECRET=zzz
   PAYMENT_PROVIDER=razorpay
   ```

3. **Set Up Webhook**
   - Dashboard → Settings → Webhooks
   - Click "Create Webhook"
   - URL: `http://localhost:3001/api/v1/payments/webhooks/razorpay`
   - Events: Select all payment events
   - Copy webhook secret
   - Set in `.env`:
   ```bash
   RAZORPAY_WEBHOOK_SECRET=webhook_secret_here
   ```

4. **Enable Public URL**
   - Download ngrok: https://ngrok.com/download
   - Start tunnel: `ngrok http 3001`
   - Update webhook URL in Razorpay dashboard
   - Set in `.env`:
   ```bash
   APP_PUBLIC_URL=https://abc123.ngrok.io
   ```

5. **Restart Server**
   ```bash
   npm run dev
   # Check health endpoint
   curl http://localhost:3001/health
   # Should show: "provider": "razorpay"
   ```

## Running the Server

### Development Mode
```bash
npm run dev
# Watches files, auto-restarts on changes
# http://localhost:3001
```

### Build for Production
```bash
npm run build
# Compiles TypeScript to dist/
```

### Run Production Build
```bash
npm start
# Runs compiled JavaScript
```

## Database

### Initialize Database
```bash
# Create tables
npx prisma migrate dev --name init

# Seed test data
npx prisma db seed
# Creates:
# - 2 customers (Acme Corp, TechCorp)
# - 2 invoices (₹5000, ₹7500)
```

### Explore Database
```bash
# Open interactive shell
npx prisma studio
# Opens browser at http://localhost:5555

# Or use SQLite CLI
sqlite3 prisma/dev.db
```

### Reset Database
```bash
# ⚠️ Deletes all data
npx prisma migrate reset

# Or manually
rm prisma/dev.db
npx prisma migrate dev --name init
```

## API Reference

### Create Payment Link
```
POST /api/v1/payments
Content-Type: application/json

{
  "invoiceId": "cuid-from-database"
}

Response:
{
  "success": true,
  "data": {
    "id": "pay_123",
    "publicId": "pay_1693395000123_abc",
    "amount": 5000,
    "currency": "INR",
    "status": "PENDING",
    "provider": "mock",
    "hostedUrl": "http://localhost:3001/pay/mock/...",
    "createdAt": "2024-08-30T10:30:00Z"
  }
}
```

### Get Payment Status (Public)
```
GET /api/v1/payments/:publicId

Response:
{
  "success": true,
  "data": {
    "publicId": "pay_abc123",
    "amount": 5000,
    "status": "PENDING",
    "hostedUrl": "http://localhost:3001/...",
    "createdAt": "2024-08-30T10:30:00Z"
  }
}
```

### List Payments
```
GET /api/v1/payments?page=1&pageSize=10

Response:
{
  "success": true,
  "data": [
    { payment1 },
    { payment2 }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "total": 23,
    "totalPages": 3
  }
}
```

### Webhook: Razorpay
```
POST /api/v1/payments/webhooks/razorpay
X-Razorpay-Signature: <hmac-sha256-signature>
Content-Type: application/json

{
  "event": "payment_link.paid",
  "payload": { ... }
}

Response: { "success": true }
```

### Simulate Payment (Mock Only)
```
POST /api/v1/payments/:id/simulate/success
POST /api/v1/payments/:id/simulate/failure

Response:
{
  "success": true,
  "data": { updated payment }
}
```

### Health Check
```
GET /health

Response:
{
  "status": "ok",
  "provider": "mock"  // or "razorpay"
}
```

## Testing

### Manual Testing with cURL

#### 1. Get Invoice ID
```bash
sqlite3 prisma/dev.db "SELECT id FROM invoices LIMIT 1;"
# Returns: cuid-1234-5678
```

#### 2. Create Payment
```bash
INVOICE_ID="cuid-1234-5678"
curl -X POST http://localhost:3001/api/v1/payments \
  -H "Content-Type: application/json" \
  -d "{\"invoiceId\":\"$INVOICE_ID\"}"

# Copy publicId from response
```

#### 3. Check Status
```bash
PUBLIC_ID="pay_1693395000123_abc"
curl http://localhost:3001/api/v1/payments/$PUBLIC_ID
```

#### 4. Simulate Success (Mock Only)
```bash
PAYMENT_ID="pay_123"  # Internal ID, not publicId
curl -X POST http://localhost:3001/api/v1/payments/$PAYMENT_ID/simulate/success
```

#### 5. Verify Invoice Updated
```bash
sqlite3 prisma/dev.db "SELECT status, paidAmount, balanceDue FROM invoices LIMIT 1;"
# Should show: status=PAID, paidAmount=5000, balanceDue=0
```

### Testing with Razorpay Sandbox

1. Create payment link: `POST /api/v1/payments`
2. Open hostedUrl in browser
3. Use test card: `4111 1111 1111 1111`
4. Any future date for expiry
5. Any CVV
6. Complete payment
7. Backend receives webhook
8. Status page updates automatically

## Architecture Overview

### Request Flow

```
Client HTTP Request
        ↓
Express Router
        ↓
Middleware Chain:
  - cors
  - express.json
  - rawBodyMiddleware (webhooks only)
        ↓
PaymentController
  - Validates with Zod
        ↓
PaymentService
  - Fetches invoice
  - Calls provider
  - Stores payment
        ↓
IPaymentGatewayProvider (Interface)
  ├─ MockPaymentGatewayProvider
  └─ RazorpayGatewayProvider
        ↓
Prisma (ORM)
        ↓
SQLite Database
```

### Webhook Flow

```
Razorpay HTTP POST
        ↓
PaymentController.handleRazorpayWebhook
        ↓
rawBodyMiddleware (captured raw body)
        ↓
RazorpayGatewayProvider.verifyWebhook
  - HMAC-SHA256 signature check
        ↓
RazorpayGatewayProvider.normalizeWebhook
  - Convert to internal format
        ↓
PaymentWebhookService.processPaymentEvent
  - Check for duplicates (idempotency)
  - Apply payment to invoice
  - Update payment status
        ↓
Return 200 OK to Razorpay
```

## Key Concepts

### Contract-Based Design

```typescript
// Define interface (contract)
interface IPaymentGatewayProvider {
  createHostedLink(input: CreateHostedLinkInput): Promise<HostedLinkResult>;
  verifyWebhook(rawBody: string, signature: string): boolean;
  normalizeWebhook(rawBody: string): NormalizedGatewayEvent;
}

// Two implementations
class MockPaymentGatewayProvider implements IPaymentGatewayProvider { ... }
class RazorpayGatewayProvider implements IPaymentGatewayProvider { ... }

// Use through interface
const provider: IPaymentGatewayProvider = 
  config.provider === "razorpay" ? new RazorpayGatewayProvider() : new MockPaymentGatewayProvider();

// Services don't know which provider
await provider.createHostedLink(...);  // Works for both!
```

### Idempotency

Prevents duplicate webhook processing:

```
1. Webhook arrives: eventId_123
2. Check: have we seen eventId_123 before?
   - Yes? Return early (skip processing)
   - No? Continue...
3. Record eventId_123 in database (BEFORE processing)
4. Process webhook (update payment, invoice, etc.)
5. If error occurs, customer retries webhook
6. Step 2 catches duplicate, returns 200 OK
```

### Signature Verification

```
Razorpay sends:
- Webhook body (JSON)
- X-Razorpay-Signature header

Your backend:
1. Get raw bytes from request
2. Calculate: HMAC-SHA256(body, secret)
3. Compare with signature header
4. If match: webhook from Razorpay ✓
5. If no match: reject (fake webhook ✗)
```

## Debugging

### Check Server Status
```bash
curl http://localhost:3001/health
# Shows provider and status
```

### View Logs
```bash
npm run dev
# All console.log appears here
# Look for: "Payment created", "Webhook received", errors
```

### Check Database
```bash
sqlite3 prisma/dev.db
sqlite> SELECT * FROM payments;
sqlite> SELECT * FROM invoices;
```

### Test Webhook Signature
```bash
# Calculate signature manually
BODY='{"event":"payment_link.paid"}'
SECRET="your-webhook-secret"
SIGNATURE=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "$SECRET" -hex | sed 's/.* //')

# Send to webhook endpoint
curl -X POST http://localhost:3001/api/v1/payments/webhooks/razorpay \
  -H "X-Razorpay-Signature: $SIGNATURE" \
  -d "$BODY"
```

## Common Issues

| Issue | Solution |
|-------|----------|
| "DATABASE_URL not set" | Create `.env` file with `DATABASE_URL="file:./dev.db"` |
| "Cannot find module @services" | Check tsconfig.json path aliases, restart TS server |
| "Invoice not found" | Run `npx prisma db seed` to create test data |
| "Razorpay credentials not configured" | Check `.env` has RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET |
| "Invalid signature" | Ensure rawBodyMiddleware runs before express.json() |
| "Payment not found" | Use correct publicId, not internal id |

## Next Steps

1. **Run the server**: `npm run dev`
2. **Read the docs**: Start with `docs/01-overview.md`
3. **Test locally**: Use mock provider first
4. **Understand flow**: Read `docs/04-create-payment-link-flow.md`
5. **Try Razorpay**: Set up sandbox and test real integration
6. **Do exercises**: Implement features from `docs/13-exercises.md`

## Production Deployment

When ready for production:

1. **Use PostgreSQL** instead of SQLite
2. **Configure secrets** in environment manager (AWS Secrets Manager, etc.)
3. **Set RAZORPAY_WEBHOOK_SECRET** from production dashboard
4. **Use live keys** (not test mode)
5. **Enable monitoring** and error tracking
6. **Add rate limiting** to prevent abuse
7. **Use HTTPS** for all webhooks
8. **Test thoroughly** with sandbox first

See `docs/11-how-this-maps-to-production.md` for more details.
