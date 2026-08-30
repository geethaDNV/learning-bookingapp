# 01 - Invoice Email Workflow Overview

## What is Invoice Email?

Invoice email is not generic email. It's a **specific business workflow** where a customer receives their invoice through email with:

1. **Invoice details** - invoice number, amount, due date
2. **Context message** - "thank you for your business"
3. **Call to action** - payment link or next steps
4. **Attachment** - PDF of the invoice (optional but common)

This module teaches how to build this workflow end-to-end.

## Why This Matters

A junior developer learning invoice email will understand:

- **When** to send email (after invoice is marked "sent" or "partially paid")
- **To whom** (customer, CC accounting, BCC yourself for tracking)
- **What content** (templated but customizable subject/body)
- **How delivery works** (through email provider like Resend)
- **What happens if it fails** (validation, network, provider errors)

This is real business logic, not a toy exercise.

## The Workflow

```
┌─────────────────┐
│ Invoice Created │
└────────┬────────┘
         │
         ▼
┌─────────────────────┐
│ User clicks "Send"  │
└────────┬────────────┘
         │
         ▼
┌───────────────────────────────┐
│ Dialog opens with form        │
│ - recipient email             │
│ - subject (prefilled)         │
│ - body (prefilled + editable) │
│ - optional: CC, BCC, link     │
└────────┬──────────────────────┘
         │
         ▼
┌──────────────────────┐
│ User clicks "Preview"│
└────────┬─────────────┘
         │
         ▼
┌──────────────────────────────┐
│ Backend generates HTML email │
│ Shows subject + body preview │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────┐
│ User clicks "Send"   │
└────────┬─────────────┘
         │
         ▼
┌────────────────────────────────┐
│ Frontend validates form        │
│ Collects: to, cc[], bcc[],     │
│ subject, body, attachPdf, link │
└────────┬───────────────────────┘
         │
         ▼
┌──────────────────────────┐
│ POST /api/v1/invoices/:  │
│   invoiceId/send-email   │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ Backend validates recipients     │
│ (email format, count limits)     │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ Backend loads invoice + customer │
│ Builds email content             │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ Call email provider              │
│ (MockEmailService or Resend)     │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ Provider validates + sends       │
│ Returns messageId or error       │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ Backend returns response         │
│ { success, message, messageId }  │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ Frontend shows success/error     │
│ Dialog closes on success         │
└──────────────────────────────────┘
```

## Key Concepts You'll Learn

### 1. **Service Contracts (Interfaces)**
   - `IEmailService` - Send emails (Mock or Resend)
   - `IInvoiceEmailService` - Business logic orchestrator
   - `IInvoiceRepository`, `ICustomerRepository` - Data access

### 2. **Dependency Injection**
   - Container manages all dependencies
   - Swap Mock ↔ Resend via config
   - No hardcoded coupling

### 3. **Validation**
   - Zod schemas on backend (type-safe request parsing)
   - Zod schemas on frontend (UX validation)
   - Email format, length, count constraints

### 4. **Error Handling**
   - Custom error types (AppError, ValidationError, NotFoundError)
   - HTTP status codes (400, 404, 500)
   - User-friendly error messages

### 5. **Type Safety**
   - End-to-end TypeScript
   - Request/Response DTOs
   - No `any` types in feature code

## Files in This Module

```
09-invoice-email-pdf/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── constants/
│   │   ├── types/
│   │   ├── services/
│   │   │   ├── mockEmailService.ts
│   │   │   ├── resendEmailService.ts
│   │   │   ├── invoiceEmailService.ts
│   │   │   └── repositories/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── di/
│   │   └── server.ts
│   ├── package.json
│   └── README.md
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── SendEmailDialog.tsx
│   │   ├── services/
│   │   │   └── invoiceEmailApi.ts
│   │   ├── types/
│   │   ├── utils/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── README.md
├── docs/
│   ├── 01-overview.md (this file)
│   ├── 02-email-provider-contract.md
│   ├── 03-send-invoice-email-api.md
│   ├── ...
│   └── 13-exercises.md
└── README.md
```

## Quick Start

### Backend
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Then open http://localhost:5173

## Next Steps

1. Read **02-email-provider-contract.md** to understand how email providers work
2. Read **03-send-invoice-email-api.md** to see the API contract
3. Explore **src/services/mockEmailService.ts** to understand the simplest provider
4. Read **10-contracts-di-and-typing.md** to see how DI wires it all together
