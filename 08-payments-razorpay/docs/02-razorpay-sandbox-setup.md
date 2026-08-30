# 02. Razorpay Sandbox Setup

Learn how to set up Razorpay test account, get API keys, and configure your application.

## Creating a Razorpay Sandbox Account

### Step 1: Sign Up

1. Go to https://razorpay.com
2. Click "Sign Up" (top right)
3. Enter your email and create password
4. Verify email with OTP
5. Complete basic business information

### Step 2: Switch to Test Mode

1. Login to dashboard: https://dashboard.razorpay.com
2. Look for **Mode Toggle** (top left or top right, might say "Test Mode")
3. Switch to **Test Mode** (you'll see red "TEST" badge)
4. This is your sandbox - use test data here, no real charges

## Getting API Keys

### Finding Your Keys

1. In Razorpay dashboard, go to **Settings** → **API Keys**
2. You'll see two pairs of keys:
   - **Live Keys** (for production - don't use yet)
   - **Test Keys** (for sandbox - use these)

### Key Structure

```
KEY_ID:       rzp_test_1a2b3c4d5e6f7g8h  (starts with rzp_test_)
KEY_SECRET:   aBc1DeF2gHi3JkL4mNoPqRs  (random string)
```

⚠️ **NEVER** share these keys or commit them to git!

### Copy Keys to Your `.env`

```bash
# backend/.env
RAZORPAY_KEY_ID=rzp_test_1a2b3c4d5e6f7g8h
RAZORPAY_KEY_SECRET=aBc1DeF2gHi3JkL4mNoPqRs
RAZORPAY_WEBHOOK_SECRET=aBc1DeF2gHi3JkL4mNoPqRs
APP_PUBLIC_URL=http://localhost:3001
PAYMENT_PROVIDER=razorpay
```

## Getting Webhook Secret

### Why You Need It

Razorpay sends webhooks (HTTP callbacks) when payments happen. You need to:
1. Receive the webhook
2. Verify it came from Razorpay (not a fake)
3. Process the payment

The webhook secret is used for verification.

### Finding Webhook Settings

1. In Razorpay dashboard: **Settings** → **Webhooks** (or **Notifications**)
2. Click **Add New Webhook**
3. Fill in:
   - **URL**: `https://your-app-url/api/v1/payments/webhooks/razorpay`
   - **Events**: Select `payment.authorized`, `payment.failed`, etc.
   - Click **Create**
4. Copy the **Webhook Secret** (displayed after creation)
5. Set in `.env` as `RAZORPAY_WEBHOOK_SECRET`

## Public URL for Local Testing

### The Problem

Your local machine (`localhost:3001`) is not accessible from the internet. Razorpay can't send webhooks to it!

### Solution: Use a Tunnel

**Option A: ngrok (Recommended)**

```bash
# Download from https://ngrok.com
ngrok http 3001

# You'll see:
# Forwarding    https://abc123.ngrok.io -> http://localhost:3001

# Use this URL as APP_PUBLIC_URL
APP_PUBLIC_URL=https://abc123.ngrok.io
```

**Option B: Cloudflare Tunnel**

```bash
# Install wrangler
npm install -g @cloudflare/wrangler

# Create tunnel
wrangler tunnel create my-payment-tunnel

# Get URL and use it as APP_PUBLIC_URL
```

**Option C: Local Testing Without Webhooks**

For learning, test with mock provider first (no internet needed).

## Test Payment Methods

### Test Card Numbers

Razorpay provides test cards. In sandbox mode, use:

| Card Number | Type | Status |
|------------|------|--------|
| `4111 1111 1111 1111` | Visa | Success |
| `5555 5555 5555 4444` | Mastercard | Success |
| `6011 1111 1111 1117` | Discover | Success |

**Expiry**: Any future date  
**CVV**: Any 3 digits  
**OTP**: Any 6 digits (if prompted)

### Test Phone Numbers

For SMS verification (if enabled):
- Use any Indian number: `9876543210`
- OTP will be `000000`

## Verifying Your Setup

### 1. Check Backend Recognizes Keys

```bash
cd backend
npm run dev

# Should log: "Payment provider: razorpay"
# If it says "mock", your keys are empty
```

### 2. Test API Call

```bash
curl -X GET http://localhost:3001/health
# Should show provider: razorpay
```

### 3. Create a Test Payment Link

From the UI or API:
```bash
curl -X POST http://localhost:3001/api/v1/payments \
  -H "Content-Type: application/json" \
  -d '{"invoiceId": "your-invoice-id"}'
```

Should return a payment with `hostedUrl` pointing to Razorpay.

## Security Reminders

| Do ✓ | Don't ✗ |
|-----|--------|
| Keep keys in `.env` only | Commit `.env` to git |
| Use test keys for sandbox | Use live keys for sandbox testing |
| Rotate keys periodically | Reuse old keys indefinitely |
| Use HTTPS in production | Use HTTP in production |
| Store secrets securely | Log secrets to console |

## Environment File Example

```bash
# backend/.env

# Database
DATABASE_URL=sqlite:./prisma/dev.db

# Server
PORT=3001

# Razorpay Sandbox Credentials
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=yyy
RAZORPAY_WEBHOOK_SECRET=zzz

# For local testing, use ngrok URL
APP_PUBLIC_URL=https://abc123.ngrok.io

# Which provider to use: "razorpay" or "mock"
PAYMENT_PROVIDER=razorpay
```

## Troubleshooting

**Q: "Razorpay credentials are not configured"**
- Check `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are set in `.env`
- Restart backend after changing `.env`

**Q: Webhook not received by my app**
- Verify ngrok tunnel is running: `ngrok http 3001`
- Check webhook URL is correct in Razorpay dashboard
- Look at Razorpay dashboard → Webhooks → Recent deliveries

**Q: "Invalid signature"**
- Webhook secret might be wrong
- Check it matches exactly in Razorpay dashboard
- Check raw body is being used for verification

## Next Steps

- ✓ Setup complete!
- Now read `03-provider-contract.md` to understand provider interface
- Then follow `04-create-payment-link-flow.md` for implementation
