# Module 10: Payments Accounting Advanced

## Overview

This learning module teaches how payment captures become accounting entries. After students understand invoices and payment capture, this module explains the production accounting infrastructure: ledger posting, journal entries, debit/credit thinking, refunds with reversal entries, reconciliation basics, and audit-friendly payment history.

### What You'll Learn

- **Debit/Credit Basics**: How every transaction has two sides that always balance
- **Payment Posting**: How captured payments create accounting journal entries
- **Idempotency**: How to prevent duplicate posting (critical in production)
- **Refunds & Reversals**: Why refunds create reversal entries, not deletions
- **Reconciliation**: How to match accounting records to bank statements
- **Contracts & DI**: How to design systems using interfaces, not concrete classes
- **Audit Trails**: Why immutable records matter for compliance

### Key Concepts

| Concept | Definition |
|---------|-----------|
| **Journal Entry** | Two-line accounting record (debit + credit) |
| **Debit/Credit** | Money in (debit) vs money out (credit) |
| **Idempotency** | Same request = same result (no duplicates) |
| **Reversal Entry** | Journal entry that undoes another (used for refunds) |
| **Reconciliation** | Verifying that accounting matches bank statement |

---

## Directory Structure

```
10-payments-accounting-advanced/
├── backend/
│   ├── src/
│   │   ├── controllers/         # HTTP handlers
│   │   ├── services/            # Business logic
│   │   │   ├── paymentPostingService.ts
│   │   │   ├── paymentRefundService.ts
│   │   │   ├── paymentReconciliationService.ts
│   │   │   └── ...
│   │   ├── repositories/        # Data access
│   │   ├── types/contracts/     # Interface contracts
│   │   ├── di/                  # Dependency injection
│   │   ├── middleware/          # Error handling
│   │   ├── schemas/             # Zod validation
│   │   ├── db.ts                # Prisma client
│   │   └── server.ts            # Express setup
│   ├── prisma/
│   │   ├── schema.prisma        # Database models
│   │   └── seed.ts              # Sample data
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   ├── services/            # API client
│   │   ├── store/               # Redux slices & store
│   │   ├── types/               # TypeScript interfaces
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── .env.example
└── docs/
    ├── 01-overview.md
    ├── 02-basic-debit-credit.md
    ├── 03-accounts-and-journal-model.md
    ├── 04-post-captured-payment.md
    ├── 05-idempotent-posting.md
    ├── 06-refunds-and-reversals.md
    ├── 07-reconciliation-basics.md
    ├── 08-backend-contracts-and-di.md
    ├── 09-frontend-accounting-views.md
    ├── 10-contract-trace.md
    ├── 11-how-this-maps-to-production.md
    ├── 12-common-mistakes.md
    └── 13-exercises.md
```

---

## Quick Start

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your database URL

# Generate Prisma client
npm run prisma:generate

# Run migrations (creates database)
npm run prisma:migrate dev

# Seed sample data
npm run prisma:seed

# Start development server
npm run dev
```

Server runs on `http://localhost:3001`

### Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# VITE_API_URL should point to backend (default: http://localhost:3001)

# Start development server
npm run dev
```

Frontend runs on `http://localhost:5174`

### API Health Check

```bash
curl http://localhost:3001/health
# Response: {"status":"ok"}
```

---

## Core Workflows

### 1. Payment Posting (Capturing Money)

```
User creates payment (from invoice)
  ↓
POST /api/v1/payments
  ↓
Payment record created, status = "captured", isPosted = false
  ↓
User clicks "Post Payment"
  ↓
POST /api/v1/payments/:paymentId/post
  ↓
Service creates JournalEntry with:
  - Debit: Bank/Cash
  - Credit: Accounts Receivable
  ↓
Payment marked: isPosted = true
  ↓
Frontend fetches accounting history, displays journal entry
```

**Example**: $1000 invoice paid
- Journal Entry: Debit Bank $1000, Credit AR $1000
- Total Debit = Total Credit ✓

### 2. Refund Processing (Returning Money)

```
Customer requests refund
  ↓
User enters refund amount + reason
  ↓
POST /api/v1/payments/:paymentId/refunds
  ↓
Refund record created with amount and reason
  ↓
Service creates reversal JournalEntry:
  - Debit: Refund Expense
  - Credit: Bank/Cash
  ↓
Payment status updated: "partially_refunded" or "refunded"
  ↓
Frontend shows refund in accounting history
```

**Example**: $300 refund for $1000 payment
- Refund Entry: Debit Refund Expense $300, Credit Bank $300
- Net cash: +$700 ($1000 payment - $300 refund)

### 3. Reconciliation (Verifying Against Bank)

```
User downloads bank statement
  ↓
GET /api/v1/reconciliation/payments
  ↓
System returns all unreconciled posted payments
  ↓
User reviews each payment against bank statement
  ↓
POST /api/v1/reconciliation/payments/:paymentId/mark-reconciled
  ↓
Reconciliation record created (does NOT change journal entry)
  ↓
Payment disappears from unreconciled list
```

**Example**: Bank statement shows $1000 payment on Aug 30
- Mark payment reconciled with bank reference "BANK-123"
- Accounting entry unchanged (still Debit Bank, Credit AR)
- Just confirms it's verified against bank

---

## Key Files

### Backend Entry Points

| File | Purpose |
|------|---------|
| `src/server.ts` | Express app setup, middleware, error handling |
| `src/di/container.ts` | Wires all dependencies together |
| `src/routes/index.ts` | HTTP routes to controllers |
| `src/controllers/index.ts` | Parse request, call service, respond |
| `src/services/*.ts` | Business logic (posting, refund, reconciliation) |
| `src/repositories/*.ts` | Prisma calls (database layer) |
| `src/types/contracts/*.ts` | Interface contracts for services |

### Frontend Entry Points

| File | Purpose |
|------|---------|
| `src/main.tsx` | React app entry |
| `src/App.tsx` | Main component, tabs, forms |
| `src/store/store.ts` | Redux setup |
| `src/store/*.Slice.ts` | Redux state & thunks |
| `src/services/apiClient.ts` | API calls |
| `src/components/*.tsx` | Reusable components |

---

## Database Models

### Account
```
- id, code (unique), name
- accountType (Asset, Liability, etc.)
- normalBalance (Debit or Credit)
```

### JournalEntry
```
- id, referenceType ("Payment", "Refund")
- referenceId (payment or refund ID)
- description, entryDate, status ("posted", "voided")
- lines: JournalEntryLine[]
```

### JournalEntryLine
```
- id, journalEntryId, accountId
- debitAmount, creditAmount
- lineNumber (order in entry)
```

### Payment
```
- id, invoiceId, amount
- status ("captured", "refunded", "partially_refunded")
- isPosted (boolean) - idempotency flag
- idempotencyKey (unique)
- postedAt (timestamp of posting)
```

### Refund
```
- id, paymentId, amount, reason
- status ("pending", "processed", "failed")
```

### ReconciliationRecord
```
- id, paymentId
- status ("unreconciled", "reconciled")
- reconciliationDate, bankReference, notes
```

---

## API Endpoints

### Payment Operations

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/v1/payments` | Create payment |
| POST | `/api/v1/payments/:id/post` | Post to accounting |
| POST | `/api/v1/payments/:id/refunds` | Issue refund |
| GET | `/api/v1/payments/:id/accounting` | Fetch accounting history |

### Reconciliation

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v1/reconciliation/payments` | List unreconciled |
| POST | `/api/v1/reconciliation/payments/:id/mark-reconciled` | Mark reconciled |
| GET | `/api/v1/reconciliation/payments/:id/status` | Check status |

### Accounts

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v1/accounts` | List all accounts |
| GET | `/api/v1/accounts/:id` | Get account detail |

---

## Building & Testing

### Backend Validation

```bash
cd backend

# Type check (no compilation)
npm run lint

# Build
npm run build

# Run tests (to be implemented)
npm test
```

### Frontend Validation

```bash
cd ../frontend

# Type check
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## Documentation

All documentation is in the `docs/` folder:

1. **01-overview.md** - Why accounting is separate from payment capture
2. **02-basic-debit-credit.md** - Beginner debit/credit examples
3. **03-accounts-and-journal-model.md** - Database schema & relationships
4. **04-post-captured-payment.md** - Payment posting flow & example
5. **05-idempotent-posting.md** - Preventing duplicate posting
6. **06-refunds-and-reversals.md** - How refunds work with reversals
7. **07-reconciliation-basics.md** - Matching to bank statements
8. **08-backend-contracts-and-di.md** - Service contracts & dependency injection
9. **09-frontend-accounting-views.md** - UI components & Redux architecture
10. **10-contract-trace.md** - End-to-end trace of a payment through the system
11. **11-how-this-maps-to-production.md** - Comparing to BookKeepingApp production
12. **12-common-mistakes.md** - 10 common pitfalls and how to avoid them
13. **13-exercises.md** - Hands-on exercises to practice

**Start with**: `01-overview.md` → `02-basic-debit-credit.md` → `04-post-captured-payment.md`

---

## Key Learning Outcomes

By completing this module, you should understand:

✓ How payment capture and accounting posting are separate concerns
✓ The meaning of debit and credit in business context
✓ Why every journal entry has exactly 2 sides that balance
✓ How idempotency prevents duplicate posting in production
✓ Why refunds use reversal entries (not deletion)
✓ How reconciliation verifies accounting matches reality
✓ Why contracts (interfaces) make code maintainable
✓ How dependency injection wires large systems together
✓ How to design an audit-friendly payment system

---

## Cross-Module References

### Previous Modules
- **Module 03 (Items, DI, Forms)**: DI patterns, Zod validation, React Hook Form
- **Module 06 (Invoices)**: Invoice creation & line items
- **Module 07 (Payments, Razorpay)**: Payment capture & gateway integration

### This Module
- **Accounting Posting**: Paying an invoice through GL
- **Refund Handling**: Issuing refunds and tracking them
- **Reconciliation**: Matching records to bank

### Next Module
- **Module 11** (if planned): Advanced accounting topics (multi-currency, tax, consolidation)

---

## Production Notes

This module is a learning foundation. Production systems require:

- **Multi-tenancy**: Support for multiple organizations
- **Advanced Reconciliation**: Auto-matching with bank feeds
- **Tax Integration**: GST/VAT calculations
- **Payment Gateway Integration**: Razorpay, Stripe, Square
- **Audit Logging**: Immutable history of all changes
- **Reporting**: P&L, Balance Sheet, Cash Flow
- **Performance**: Sub-100ms posting, batch reconciliation
- **Security**: PCI-DSS compliance, encryption, audit

See `docs/11-how-this-maps-to-production.md` for details.

---

## Troubleshooting

### Backend won't start
```bash
# Check database URL in .env
# Make sure PostgreSQL is running
# Run migrations: npm run prisma:migrate dev
# Check logs for errors
```

### Frontend can't connect to backend
```bash
# Verify backend is running on port 3001
# Check VITE_API_URL in frontend/.env
# Check CORS origin in backend/src/server.ts
curl http://localhost:3001/health
```

### TypeScript errors
```bash
# Regenerate Prisma types
npm run prisma:generate

# Type check
npm run lint
```

### Reconciliation not showing payments
```bash
# Verify payments are posted (isPosted = true)
# Check reconciliation records in database
npm run prisma:studio
```

---

## Support

- Review the documentation in `docs/`
- Check common mistakes in `12-common-mistakes.md`
- Work through exercises in `13-exercises.md`
- Trace through a payment in `10-contract-trace.md`

---

## Summary

This module teaches the production accounting infrastructure for handling payments. You'll learn how to:
1. Design immutable audit-friendly systems
2. Implement idempotent operations
3. Build services around contracts (interfaces)
4. Use dependency injection at scale
5. Ensure accounting always balances

Happy learning! 🚀
