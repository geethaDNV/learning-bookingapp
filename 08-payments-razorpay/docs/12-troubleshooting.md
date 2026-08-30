# 12. Troubleshooting

Common problems and solutions.

## Module Setup Issues

### Problem: "Cannot find module @services/PaymentService"

**Cause**: Path aliases not configured correctly

**Solution**:
1. Check `tsconfig.json` has correct paths:
```json
{
  "compilerOptions": {
    "baseUrl": "./src",
    "paths": {
      "@services/*": ["./services/*"]
    }
  }
}
```

2. Restart TypeScript server (VSCode: Ctrl+Shift+P → "TypeScript: Restart TS Server")

### Problem: "DATABASE_URL environment variable is not set"

**Cause**: `.env` file missing or empty

**Solution**:
```bash
cd backend
cp .env.example .env
# Edit .env and add database URL
```

### Problem: "Prisma migrations failed"

**Cause**: Database already exists with different schema

**Solution**:
```bash
# Reset database
npx prisma migrate reset

# Or start fresh
rm prisma/dev.db
npx prisma migrate dev --name init
```

## Provider Configuration Issues

### Problem: Server logs "Payment provider: mock" but you set Razorpay keys

**Cause**: Keys not being read from `.env`

**Solution**:
```bash
# 1. Check .env file
cat .env | grep RAZORPAY

# 2. Verify keys are set:
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=yyy
RAZORPAY_WEBHOOK_SECRET=zzz

# 3. Restart server
npm run dev

# 4. Check health endpoint
curl http://localhost:3001/health
# Should show provider: razorpay
```

### Problem: "Razorpay credentials are not configured"

**Cause**: `RazorpayGatewayProvider` instantiated but keys are empty

**Solution**: Check DI container selects mock provider:
```typescript
// In container.ts
const gatewayProvider =
  config.paymentProvider === "razorpay" &&  // ← Check this
  config.razorpay.keyId &&                   // ← And this
  config.razorpay.keySecret
    ? new RazorpayGatewayProvider()
    : new MockPaymentGatewayProvider();
```

## Payment Link Creation Issues

### Problem: 404 when calling POST /api/v1/payments

**Cause**: Routes not registered

**Solution**:
1. Check `server.ts`:
```typescript
app.use("/api/v1/payments", createPaymentRoutes(cradle.paymentController));
```

2. Check routes file exists: `src/routes/paymentRoutes.ts`

3. Restart server

### Problem: "Invoice not found" error when creating payment

**Cause**: Invoice ID doesn't exist in database

**Solution**:
```bash
# 1. Create test data
npx prisma db seed

# 2. Check invoice exists
sqlite3 prisma/dev.db "SELECT id FROM invoices LIMIT 1;"

# 3. Use that ID
curl -X POST http://localhost:3001/api/v1/payments \
  -H "Content-Type: application/json" \
  -d '{"invoiceId":"<correct-id>"}'
```

### Problem: "Invalid amount" when creating with Razorpay

**Cause**: Amount is 0 or negative

**Solution**: Check invoice amount:
```bash
sqlite3 prisma/dev.db "SELECT id, amount FROM invoices;"
```

Create invoice with valid amount:
```typescript
const invoice = await prisma.invoice.create({
  data: {
    amount: 5000,  // Must be > 0
    // ... other fields
  }
});
```

## Razorpay Sandbox Issues

### Problem: "Razorpay credentials are not configured" even with keys

**Cause**: Keys are invalid or in wrong format

**Solution**:
```bash
# 1. Verify key format
# KEY_ID should start with: rzp_test_
# KEY_SECRET should be: 40+ character random string

echo $RAZORPAY_KEY_ID
echo $RAZORPAY_KEY_SECRET

# 2. Get keys from dashboard
# https://dashboard.razorpay.com/settings/api-keys
# Select "Test Mode" (not Live)
# Copy exactly

# 3. Restart server after setting keys
npm run dev

# 4. Test with simple call
curl http://localhost:3001/health
```

### Problem: "Invalid signature" in webhook test

**Cause**: Webhook secret doesn't match

**Solution**:
1. Get webhook secret from Razorpay dashboard:
   - Settings → Webhooks
   - Click your webhook
   - Copy secret

2. Set in `.env`:
```bash
RAZORPAY_WEBHOOK_SECRET=<exact-copy-from-dashboard>
```

3. Restart server

4. Test webhook:
```bash
WEBHOOK_SECRET="your-secret"
BODY='{"id":"event_123"}'
SIGNATURE=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "$WEBHOOK_SECRET" -hex | sed 's/.* //')
curl -X POST http://localhost:3001/api/v1/payments/webhooks/razorpay \
  -H "X-Razorpay-Signature: $SIGNATURE" \
  -d "$BODY"
```

### Problem: Webhook not received by your app

**Cause**: Ngrok tunnel not running or URL not configured

**Solution**:
```bash
# 1. Start ngrok tunnel
ngrok http 3001
# Shows: Forwarding https://abc123.ngrok.io → http://localhost:3001

# 2. Set in .env
APP_PUBLIC_URL=https://abc123.ngrok.io

# 3. In Razorpay dashboard:
# Settings → Webhooks → Edit
# URL: https://abc123.ngrok.io/api/v1/payments/webhooks/razorpay

# 4. Test endpoint is accessible
curl https://abc123.ngrok.io/health
# Should return 200

# 5. Create payment and test
# Check ngrok terminal for requests
```

## Database Issues

### Problem: "UNIQUE constraint failed: payments.publicId"

**Cause**: Trying to create payment with duplicate publicId

**Solution**:
```bash
# Check for duplicates
sqlite3 prisma/dev.db "SELECT publicId, COUNT(*) FROM payments GROUP BY publicId HAVING COUNT(*) > 1;"

# Delete duplicates if needed
sqlite3 prisma/dev.db "DELETE FROM payments WHERE publicId IN (SELECT publicId FROM payments GROUP BY publicId HAVING COUNT(*) > 1);"

# Or reset database
npx prisma migrate reset
```

### Problem: "Foreign key constraint failed"

**Cause**: Trying to create payment for non-existent invoice/customer

**Solution**:
```bash
# Seed test data
npx prisma db seed

# Or verify references exist
sqlite3 prisma/dev.db "SELECT id FROM customers;"
sqlite3 prisma/dev.db "SELECT id FROM invoices;"
```

## Frontend Issues

### Problem: Cannot connect to backend on http://localhost:3001

**Cause**: Backend not running or proxy misconfigured

**Solution**:
```bash
# 1. Check backend is running
curl http://localhost:3001/health

# 2. Check vite.config.ts has proxy:
# server: {
#   proxy: {
#     '/api': {
#       target: 'http://localhost:3001'
#     }
#   }
# }

# 3. Restart frontend
npm run dev
```

### Problem: "localhost/api/v1/payments" returns 404

**Cause**: Vite proxy not working

**Solution**:
1. Verify `vite.config.ts` has proxy configuration
2. Frontend must be served from `http://localhost:3000`
3. Restart Vite dev server

### Problem: CORS error: "Access to XMLHttpRequest blocked"

**Cause**: Backend CORS not configured or frontend on different origin

**Solution**:
```typescript
// In backend/src/server.ts
app.use(cors());  // Allow all origins in dev

// In production, restrict:
app.use(cors({
  origin: ["https://yourdomain.com"]
}));
```

## Testing Issues

### Problem: Mock provider test fails

**Cause**: Provider not set to mock

**Solution**:
```bash
# Ensure mock is used
grep -E "RAZORPAY_KEY_ID|RAZORPAY_KEY_SECRET" .env
# Should be empty

# Set explicitly
export PAYMENT_PROVIDER=mock

# Restart
npm run dev

# Verify
curl http://localhost:3001/health | grep provider
# Should show: "provider": "mock"
```

### Problem: Cannot simulate payment success (simulate endpoint not found)

**Cause**: Endpoint only available with mock provider

**Solution**:
```bash
# Check you're using mock provider
curl http://localhost:3001/health | grep provider

# If "razorpay", switch to mock:
# In .env:
PAYMENT_PROVIDER=mock
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

# Restart server
npm run dev

# Now simulation endpoints work:
curl -X POST http://localhost:3001/api/v1/payments/{id}/simulate/success
```

## Common Errors Explained

### "Payment not found: {id}"

```
Meaning: Payment record doesn't exist in database

Causes:
1. Wrong payment ID format
2. Payment was deleted
3. Payment belongs to different organization

Solution:
1. List payments: GET /api/v1/payments
2. Use correct publicId
3. Check database: sqlite3 prisma/dev.db "SELECT * FROM payments;"
```

### "Duplicate event detected"

```
Meaning: Webhook for this event already processed (correct!)

This is normal:
1. Payment created
2. Webhook sent, processed
3. Webhook retried (Razorpay didn't get 200)
4. Second processing skipped (idempotency working)

No action needed - this is feature, not bug
```

### "Invalid signature"

```
Meaning: Webhook signature verification failed

Causes:
1. Webhook secret doesn't match
2. Raw body modified before verification
3. Signature header missing

Solutions:
1. Verify webhook secret matches dashboard
2. Ensure rawBodyMiddleware runs before express.json()
3. Check X-Razorpay-Signature header is present
```

## Debug Tips

### Enable Logging

```typescript
// In service
console.log("Payment created:", payment);
console.log("Webhook event:", event);
console.log("Invoice updated:", invoice);
```

### Check Database State

```bash
# List all payments
sqlite3 prisma/dev.db "SELECT id, publicId, status, provider FROM payments;"

# List all invoices
sqlite3 prisma/dev.db "SELECT id, invoiceNumber, paidAmount, balanceDue, status FROM invoices;"

# Find payment for invoice
sqlite3 prisma/dev.db "SELECT * FROM payments WHERE invoiceId = 'xxx';"
```

### Monitor Requests

```bash
# Terminal 1: Start Ngrok
ngrok http 3001

# Terminal 2: Watch requests
ngrok web 4040
# Opens http://localhost:4040 - see all requests

# Terminal 3: Start backend
npm run dev

# Terminal 4: Make requests
curl ...

# Check ngrok terminal for all requests/responses
```

### Test With cURL

```bash
# Create payment
curl -X POST http://localhost:3001/api/v1/payments \
  -H "Content-Type: application/json" \
  -d '{"invoiceId":"<id>"}'

# Get payment
curl http://localhost:3001/api/v1/payments/<publicId>

# List payments
curl http://localhost:3001/api/v1/payments

# Simulate success (mock only)
curl -X POST http://localhost:3001/api/v1/payments/<id>/simulate/success
```

## Getting Help

1. **Check logs**: `npm run dev` shows console logs
2. **Check database**: `sqlite3 prisma/dev.db ...`
3. **Check config**: `cat .env`
4. **Check network**: Use ngrok dashboard for webhook requests
5. **Read docs**: Especially doc 04 (payment flow) and doc 06 (webhook processing)
6. **Check production code**: `backend/` for reference implementation
7. **Run tests**: Look for existing test patterns in production code

## Next Steps

- All issues solved? Try exercises in `13-exercises.md`
- Want to understand more? Re-read relevant doc section
- Found a bug? Check production code in `BookKeepingApp/backend/`
