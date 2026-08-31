# 01. Overview: Why Customers Are a Prerequisite for Invoices

## Learning Context

This module teaches customer management as a **prerequisite for invoice creation**. In any business application, invoices require customers. Before a junior developer can build an invoice form, they must understand:

1. How customer data is created and maintained
2. How to search and find customers
3. How customers are represented as typed objects
4. How customer selection flows into a form (autocomplete)
5. How DI and typed interfaces work in practice

## Module Goal

Build a self-contained learning system that demonstrates:
- **CRUD Operations**: Create, read, update, list customers
- **Search & Autocomplete**: Server-side search for customer selection
- **Typed Contracts**: Interface-based DI, typed services, and repositories
- **Production Patterns**: Real patterns from the production BookKeepingApp
- **Full Stack**: TypeScript backend + React frontend with Redux

## Why This Matters

**Production Problem**: Invoices need to know which customer they're billing. A customer record includes:
- `displayName` – shown in invoice header
- `email` – for sending invoice
- `customerType` – distinguishes a business from an individual
- `gstin` – required for business customers and can prefill business details
- `pan` – required for individual customers
- `billingAddress` – printed on invoice
- `isActive` – only active customers can be invoiced

**Learning Problem**: A junior developer must understand customer selection before tackling invoice line items, totals, and payment flows.

## Module Structure

```
05-customers-basic/
├── backend/                    # Express + Prisma + TypeScript
│   ├── src/
│   │   ├── controllers/        # HTTP handlers
│   │   ├── services/           # Business logic
│   │   ├── repositories/       # Data access
│   │   ├── types/              # Interfaces & DTOs
│   │   ├── schemas/            # Zod validation
│   │   ├── di/                 # Dependency injection
│   │   ├── constants/          # Messages, constants
│   │   └── server.ts           # Express app
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema
│   │   └── seed.ts             # Sample data
│   └── package.json
├── frontend/                   # Vite + React + Redux
│   ├── src/
│   │   ├── pages/              # Route components
│   │   ├── components/         # Reusable components
│   │   ├── services/           # API client
│   │   ├── store/              # Redux slice
│   │   ├── types/              # TypeScript models
│   │   └── main.tsx            # Entry point
│   └── package.json
└── docs/                       # 11 documentation files
```

## Key Learning Outcomes

After this module, you will understand:

1. ✅ How to define typed database models with Prisma
2. ✅ How repository pattern decouples data access
3. ✅ How service layer adds business logic (validation, deduplication)
4. ✅ How controllers handle HTTP requests/responses
5. ✅ How Zod schemas validate and parse input
6. ✅ How DI containers manage dependencies
7. ✅ How to build a typed React autocomplete component
8. ✅ How Redux thunks coordinate async actions
9. ✅ How forms work with React Hook Form + Zod
10. ✅ How GSTIN lookup prefills business customer details while PAN identifies individuals

## What's Next?

Once you master this module:

- **Module 06**: Customer autocomplete → Invoice form, line items, totals
- **Module 07**: Invoice PDF generation, email delivery
- **Module 08**: Payment tracking and reconciliation

---

**Next**: [02. Customer Model and Seed Data](02-customer-model-and-seed.md)
