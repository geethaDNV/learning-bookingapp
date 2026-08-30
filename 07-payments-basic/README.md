# 07-payments-basic: Payment Learning Module

Complete payment implementation teaching module covering provider abstraction, idempotency, webhook simulation, and invoice balance updates.

## What You'll Learn

After completing this module, you'll understand:

- ✓ Payment intent/link creation
- ✓ Provider abstraction pattern (interface-based design)
- ✓ Webhook callback simulation and real webhook handling
- ✓ Idempotency: preventing duplicate payment application
- ✓ Payment status vs. invoice status (two state machines)
- ✓ Applying captured payments to invoices
- ✓ Dependency injection for loose coupling
- ✓ How this maps to production Razorpay integration

## Quick Start

### Backend

```bash
cd backend

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your database URL

# Run Prisma migrations
npx prisma migrate dev

# Seed test data
npx prisma db seed

# Start dev server
npm run dev
# Server runs on http://localhost:3001
```

### Frontend

```bash
cd ../frontend

# Install dependencies
npm install

# Start dev server
npm run dev
# App runs on http://localhost:5174
```

## Project Structure

```
07-payments-basic/
├── backend/
│   ├── src/
│   │   ├── controllers/      # PaymentController
│   │   ├── services/         # Payment business logic + gateway provider
│   │   ├── repositories/     # PaymentRepository
│   │   ├── routes/           # Express routes
│   │   ├── schemas/          # Zod validation
│   │   ├── types/            # Payment types & DTOs
│   │   ├── di/               # Contracts & DI container
│   │   ├── middleware/       # Error handling, async wrapper
│   │   ├── errors/           # Custom error classes
│   │   ├── utils/            # API response helpers
│   │   ├── db.ts             # Prisma client
│   │   └── server.ts         # Express setup
│   ├── prisma/
│   │   ├── schema.prisma     # Database models
│   │   └── seed.ts           # Test data
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── store/            # Redux store & hooks
│   │   ├── services/         # API client
│   │   ├── features/payments/
│   │   │   ├── pages/        # PaymentStatusPage, PaymentListPage
│   │   │   ├── store/        # paymentSlice, selectors
│   │   │   ├── services/     # Payment API service
│   │   │   └── types/        # Payment DTOs
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── tsconfig.json
│
└── docs/
    ├── 01-overview.md                      # Why payments after invoices
    ├── 02-payment-vs-invoice-status.md    # Two state machines
    ├── 03-payment-data-model.md           # Database schema
    ├── 04-provider-abstraction.md         # IPaymentGatewayProvider
    ├── 05-create-payment-flow.md          # Step-by-step creation
    ├── 06-mock-webhook-flow.md            # Simulated callbacks
    ├── 07-idempotency-basics.md           # Duplicate event handling
    ├── 08-apply-payment-to-invoice.md     # Balance updates
    ├── 09-frontend-payment-state.md       # Redux thunks/selectors
    ├── 10-contracts-di-and-typing.md      # Interfaces & DI
    ├── 11-contract-trace.md               # Full request trace
    ├── 12-how-this-maps-to-production.md  # BookKeepingApp mapping
    └── 13-exercises.md                    # 10 exercises
```

## Key Endpoints

### Payment Creation
```
POST /api/v1/invoices/:invoiceId/payments
Request:  { "invoiceId": "inv_123" }
Response: { "id": "pay_xyz", "publicId": "PAY-XXXX-YYYY", "status": "created", ... }
```

### Get Payment
```
GET /api/v1/payments/:id
Response: { "id": "pay_xyz", "status": "created", ... }
```

### Get Payment Status (Public)
```
GET /api/v1/payments/public/status/:publicId
Response: { "status": "created", "paidAmount": 0, "balanceDue": 16500, ... }
```

### List Payments
```
GET /api/v1/payments?page=1&pageSize=10&status=captured&invoiceId=inv_123
Response: { "items": [...], "total": 42, "page": 1, "pageSize": 10 }
```

### Simulate Success (Learning)
```
POST /api/v1/payments/mock/:paymentId/succeed
Response: { "id": "pay_xyz", "status": "captured", ... }
```

### Simulate Failure (Learning)
```
POST /api/v1/payments/mock/:paymentId/fail
Response: { "id": "pay_xyz", "status": "failed", ... }
```

## Architecture

### Layered Approach
```
Route → Controller → Service → Repository → Prisma → Database
```

- **Route**: Maps HTTP to controller
- **Controller**: Validates request (Zod), calls service, formats response
- **Service**: Business logic, calls repository & other services
- **Repository**: Prisma calls only, returns DTOs
- **Prisma**: Database access

### Contracts (Interfaces)
```typescript
IPaymentService
IPaymentRepository
IPaymentGatewayProvider          // Mock or Razorpay
IPaymentWebhookService            // Idempotent event processing
IInvoicePaymentApplicationService // Update invoice balance
IPaymentNumberService
```

Every service depends on interfaces, not concrete classes → easy to swap implementations.

### Dependency Injection
```typescript
// src/di/container.ts
const cradle = {
  paymentRepository,
  paymentService,
  paymentController,
  // ... etc
};
```

All dependencies wired in one place. To add Razorpay:
```typescript
// Change one line
const gatewayProvider = new RazorpayPaymentGatewayProvider(config);
// Everything else still works!
```

## Key Concepts

### Payment Status States
- `created`: Payment just created, waiting for customer
- `pending`: Customer is paying (rare, for learning)
- `captured`: Payment succeeded, customer paid
- `failed`: Payment failed, customer declined
- `cancelled`: Payment was cancelled

### Invoice Status States
- `draft`: Not sent to customer
- `issued`: Sent, awaiting payment
- `partially_paid`: Some payment received
- `paid`: Full payment received
- `cancelled`: Invoice void

### Idempotency
Duplicate webhooks are safe because we track `lastEventId`:
```typescript
if (lastEventId === eventId) {
  // Already processed, return current state
  return payment;
}
// First time, process
```

### Payment Application
When payment is captured:
```
paidAmount += payment.amount
balanceDue = total - paidAmount
status = balanceDue === 0 ? "paid" : "partially_paid"
```

## Testing Scenarios

### Scenario 1: Full Payment
1. Create payment for $165 invoice
2. Simulate success
3. Invoice status changes to "paid"
4. Balance due becomes $0

### Scenario 2: Partial Payments
1. Create payment 1 for $600 (of $1000 invoice)
2. Simulate success → invoice is "partially_paid"
3. Create payment 2 for $400
4. Simulate success → invoice is "paid"

### Scenario 3: Duplicate Webhook
1. Create payment, simulate success
2. Simulate success again (duplicate)
3. Invoice balance not doubled (idempotency works!)

### Scenario 4: Failed Payment
1. Create payment, simulate failure
2. Invoice remains unpaid
3. Create new payment, simulate success
4. Invoice is paid

## Frontend Usage

### Payment List
```
http://localhost:5174
Shows all payments, status, amount, creation date
```

### Payment Status Page
```
http://localhost:5174?page=status&publicId=PAY-XXXX-YYYY
Public-facing payment status page
Shows learning controls (simulate success/failure)
Displays invoice balance updates in real-time
```

## Redux State

```typescript
// store/paymentSlice.ts
{
  payments: Payment[],
  selectedPayment: Payment | null,
  paymentStatus: PaymentStatus | null,
  loading: boolean,
  error: string | null,
  page: number,
  pageSize: number,
  total: number
}
```

Thunks:
- `createPayment(invoiceId)`
- `fetchPayment(id)`
- `fetchPaymentStatus(publicId)`
- `fetchPayments(filters)`
- `simulatePaymentSuccess(paymentId)`
- `simulatePaymentFailure(paymentId)`

## Learning Path

1. **Read [01-overview.md](docs/01-overview.md)** → Why payments, module structure
2. **Read [02-payment-vs-invoice-status.md](docs/02-payment-vs-invoice-status.md)** → Two state machines
3. **Read [03-payment-data-model.md](docs/03-payment-data-model.md)** → Database schema
4. **Read [04-provider-abstraction.md](docs/04-provider-abstraction.md)** → Interface pattern
5. **Run backend** → Create test payment via API
6. **Read [05-create-payment-flow.md](docs/05-create-payment-flow.md)** → Request → Response
7. **Read [06-mock-webhook-flow.md](docs/06-mock-webhook-flow.md)** → Callback flow
8. **Use frontend** → Watch payment status update
9. **Read [07-idempotency-basics.md](docs/07-idempotency-basics.md)** → Duplicate safety
10. **Read [08-apply-payment-to-invoice.md](docs/08-apply-payment-to-invoice.md)** → Balance logic
11. **Read [09-frontend-payment-state.md](docs/09-frontend-payment-state.md)** → Redux
12. **Read [10-contracts-di-and-typing.md](docs/10-contracts-di-and-typing.md)** → DI patterns
13. **Read [11-contract-trace.md](docs/11-contract-trace.md)** → Full trace
14. **Read [12-how-this-maps-to-production.md](docs/12-how-this-maps-to-production.md)** → Production bridge
15. **Do [13-exercises.md](docs/13-exercises.md)** → 10 hands-on exercises

## Building for Production

To use real Razorpay instead of mock:

1. Install Razorpay SDK:
   ```bash
   npm install razorpay
   ```

2. Create `RazorpayPaymentGatewayProvider` (implements `IPaymentGatewayProvider`)

3. Update DI container:
   ```typescript
   const gatewayProvider = new RazorpayPaymentGatewayProvider(razorpayClient);
   ```

4. Add webhook endpoint for Razorpay callbacks

5. That's it! Everything else remains the same.

See [12-how-this-maps-to-production.md](docs/12-how-this-maps-to-production.md) for details.

## Troubleshooting

### Database Connection Failed
- Ensure PostgreSQL is running
- Check `DATABASE_URL` in `.env`
- Run `npx prisma migrate dev` to create tables

### Port Already in Use
- Backend: Change `PORT` in `.env`
- Frontend: Change port in `vite.config.ts`

### Prisma Schema Errors
- Run `npx prisma generate`
- Run `npx prisma migrate reset` to recreate from scratch

### Frontend Cannot Connect to API
- Verify backend is running on `http://localhost:3001`
- Check CORS is enabled in `server.ts`
- Verify API response format

## Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Express.js Guide](https://expressjs.com)
- [React Redux](https://react-redux.js.org)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Razorpay Documentation](https://razorpay.com/docs)

## Next Steps

After mastering this module:

1. **Add to BookKeepingApp**: Implement payments in production app
2. **Explore refunds**: Handle payment refunds
3. **Multi-currency**: Support multiple currencies
4. **Reconciliation**: Compare local vs. provider payments
5. **Revenue recognition**: Integrate with accounting module

## License

This learning module is part of BookKeepingApp learning series.
