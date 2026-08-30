# 08-payments-razorpay Module: Complete Learning Guide

Welcome to Module 08! This learning module teaches you how to integrate real payment gateways (Razorpay) into a payment application while maintaining the same contract-based architecture you learned in Module 07 (Mock Payments).

## Module Overview

This module extends payment concepts from Module 07 by replacing the mock payment provider with a real Razorpay payment gateway. The architecture remains unchanged—only the provider implementation changes.

### What You'll Learn

- ✓ Real payment gateway integration (Razorpay)
- ✓ Razorpay hosted payment links/orders
- ✓ Webhook signature verification and event processing
- ✓ Provider abstraction and DI-based provider selection
- ✓ Idempotency: preventing duplicate webhook processing
- ✓ Public payment status pages
- ✓ Testing with sandbox credentials
- ✓ How production payment flows work

### Key Concepts

| Concept | Meaning |
|---------|---------|
| **Payment Link** | A Razorpay-hosted URL customers visit to pay |
| **Webhook** | HTTP callback from Razorpay when payment status changes |
| **Signature Verification** | Proves webhook came from Razorpay (not a fake) |
| **Sandbox/Test Mode** | Safe environment for testing without real money |
| **Idempotency** | Guarantee: event processed exactly once, never duplicated |
| **Provider Interface** | Contract both Mock and Razorpay implement |

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Invoice Detail Page                      │
└────────────────────────┬────────────────────────────────────┘
                         │ "Create Payment Link"
                         ▼
            ┌────────────────────────────┐
            │   PaymentController        │
            └─────────┬──────────────────┘
                      │
            ┌─────────▼──────────┐
            │  PaymentService    │
            └─────────┬──────────┘
                      │
       ┌──────────────┴──────────────┐
       │                             │
       ▼                             ▼
┌──────────────────────┐   ┌─────────────────────┐
│ IPaymentGateway      │   │ PaymentRepository   │
│  Provider (IF)       │   └─────────────────────┘
│                      │
├──────────────────────┤   ┌─────────────────────┐
│ Mock (learning)      │───│ Test without keys   │
│ Razorpay (real)      │───│ Real sandbox mode   │
└──────────────────────┘   └─────────────────────┘

┌─────────────────────────────────────────────────────┐
│              Razorpay (or Mock Provider)            │
│                                                     │
│ ┌─────────────────────────────────────────────┐   │
│ │ Customer clicks hosted link → Payment form  │   │
│ └────────────────────┬────────────────────────┘   │
│                      │ Success/Failure           │
│ ┌────────────────────▼────────────────────────┐   │
│ │ Sends webhook to: POST /webhooks/razorpay  │   │
│ └────────────────────┬────────────────────────┘   │
└─────────────────────┼──────────────────────────────┘
                      │
            ┌─────────▼──────────────┐
            │ WebhookController      │
            │ 1. Verify signature    │
            │ 2. Normalize event     │
            │ 3. Check idempotency   │
            │ 4. Apply payment       │
            └────────────────────────┘
```

## What's Different from Module 07

| Feature | Module 07 (Mock) | Module 08 (Razorpay) |
|---------|------------------|----------------------|
| **Payment Link** | Generated locally in code | Real URL from Razorpay API |
| **Testing** | Click "Simulate Success" button | Razorpay sandbox dashboard |
| **Webhooks** | Simulated locally | Real HTTP from Razorpay |
| **Signature** | Mock secret in config | Real secret from Razorpay dashboard |
| **Provider Config** | Always "mock" | "razorpay" via env var |
| **External Calls** | None | HTTPS to Razorpay API |

## Getting Started

### Prerequisites

- Node.js 25+
- SQLite (comes with Prisma)
- (For Razorpay) Razorpay sandbox account + API keys

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy example environment file
cp .env.example .env

# Edit .env - for mock provider, leave RAZORPAY_* blank
# For Razorpay provider, fill in keys from https://dashboard.razorpay.com/settings/api-keys

# Initialize database
npx prisma migrate dev
npx prisma db seed

# Start server (runs on http://localhost:3001)
npm run dev
```

### Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Start dev server (runs on http://localhost:3000)
npm run dev
```

### Verify Setup

Backend health check:
```bash
curl http://localhost:3001/health
# {
#   "status": "ok",
#   "provider": "mock"
# }
```

Open frontend: http://localhost:3000

## Key Files to Understand

| File | Purpose |
|------|---------|
| `backend/src/config.ts` | Environment configuration and validation |
| `backend/src/di/contracts.ts` | Provider interface definition |
| `backend/src/services/MockPaymentGatewayProvider.ts` | Learning provider (no credentials needed) |
| `backend/src/services/RazorpayGatewayProvider.ts` | Production provider (requires keys) |
| `backend/src/di/container.ts` | DI setup - selects which provider to use |
| `backend/src/routes/paymentRoutes.ts` | API routes including webhook |
| `backend/prisma/schema.prisma` | Database schema |

## Common Workflows

### Workflow 1: Test with Mock Provider (No Keys Needed)

1. Keep `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` empty in `.env`
2. Server uses `MockPaymentGatewayProvider`
3. Create invoices and payments via API
4. Use simulation endpoints to test success/failure
5. Perfect for understanding concepts without external dependencies

### Workflow 2: Test with Razorpay Sandbox

1. Create account at https://razorpay.com
2. Get sandbox keys from https://dashboard.razorpay.com/settings/api-keys
3. Set in `.env`:
   ```
   RAZORPAY_KEY_ID=rzp_test_xxx
   RAZORPAY_KEY_SECRET=xxxx
   RAZORPAY_WEBHOOK_SECRET=xxxx
   APP_PUBLIC_URL=https://your-ngrok-url
   ```
4. Configure webhook in Razorpay dashboard
5. Use Razorpay sandbox to test real flow

## Next Steps

- **First time?** Read `01-overview.md`
- **Setting up Razorpay?** Follow `02-razorpay-sandbox-setup.md`
- **Understanding the code?** Study `03-provider-contract.md`
- **Implementing features?** Follow flow docs `04-07`
- **Troubleshooting?** Check `12-troubleshooting.md`
- **Exercises?** Try `13-exercises.md`

## Architecture Philosophy

This module teaches **contract-based design**:

1. Define an interface (`IPaymentGatewayProvider`)
2. Implement it twice (Mock for learning, Razorpay for production)
3. Use dependency injection to select which one
4. Controllers/services never know which provider they're using
5. Same business logic handles both: perfect for testing and gradual production rollout

This is how real production systems are built! 🚀
