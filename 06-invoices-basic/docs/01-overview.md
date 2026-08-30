# 01 - Overview

## What is an Invoice?

An invoice is a formal request for payment. It documents:
- **Who** is selling (seller/vendor)
- **Who** is buying (customer/client)
- **What** is being sold (items/services with quantities and prices)
- **How much** is owed (subtotal, tax, total)
- **When** payment is due (due date)

## Invoice in Business Workflow

```
Quote (Optional)
    ↓
Invoice ← You are here
    ↓
Payment
    ↓
Accounting/Reporting
```

## Why Invoices Come Before Payments

1. **Legal requirement**: Invoices document the transaction
2. **Payment reference**: Customers pay using the invoice number
3. **Accounting**: Invoices create the journal entries that tracking revenue
4. **Status tracking**: A payment can only be recorded against an invoice
5. **Communication**: Invoices tell the customer what they owe

## In This Learning Module

You will learn:
- ✅ How to create invoices with multiple line items
- ✅ How customer selection works
- ✅ How to pick items and specify quantities/rates
- ✅ How tax and totals are calculated
- ✅ How invoices change status (Draft → Sent → Paid)
- ✅ How to display and print invoices
- ✅ How the backend calculates and persists everything
- ✅ How the frontend validates and previews in real-time

## Module Architecture

### Backend (Express + Prisma + Zod)
- Contracts/interfaces define service boundaries
- Services contain business logic
- Repositories handle database operations
- Controllers handle HTTP requests
- Dependency Injection (DI) wires it all together

### Frontend (React + Redux + React Hook Form)
- Redux manages invoice state
- React Hook Form manages form state
- Components are composable and typed
- `useFieldArray` handles dynamic line items
- Autocomplete for customer and item selection

## What We're Learning

This module teaches the **invoice feature end-to-end**:
- How to think about invoice data
- How to structure a form for a complex document
- How to calculate and validate
- How to communicate between frontend and backend
- How state flows through the system

**Not in scope (yet):**
- Email sending (placeholder only)
- Payment integration
- Multi-currency or advanced tax
- Recurring invoices
- Bulk operations

## Next Steps

1. Read **02 - Data Model** to understand the tables and relationships
2. Read **03 - Invoice Number and Status** to understand lifecycle
3. Read **04 - Backend Create Flow** to trace a request through DI
4. Read **05 - Line Items and Totals** to understand calculations
5. Read **06 - Frontend useFieldArray** for dynamic forms
6. Read **07 - Autocomplete** for search integration
7. Read **08 - Print and PDF** for output generation
8. Read **09 - Contracts and DI** for backend architecture
9. Read **10 - Contract Trace** to follow a line through the system
10. Read **11 - Maps to Production** to connect learning to real code
11. Read **12 - Exercises** for practice ideas
