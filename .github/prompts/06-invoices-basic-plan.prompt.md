# Plan: Learning Bookingapp - Module 06 Invoices Basic

## Goal
Build `learning-bookingapp/06-invoices-basic/{backend,frontend}` as a fully isolated, runnable invoice learning module. The module should teach invoice creation, invoice line items, customer selection, item autocomplete, totals calculation, status transitions, detail/list views, print view, and client-side PDF download.

This module is the bridge from CRUD to real business workflows. It must remain beginner-friendly while preserving the production mental model.

## Decisions
- Module folder name: `06-invoices-basic`.
- Include simplified `Customer`, `Item`, `Invoice`, and `InvoiceLine` models in this module so it is runnable in isolation.
- Customers and Items can be trimmed copies of previous modules.
- Use React Hook Form + Zod + `useFieldArray` for invoice lines.
- Include customer autocomplete and item autocomplete.
- Include totals calculation but keep tax rules simple.
- Include status transitions such as `draft`, `sent`, `paid`, and optionally `cancelled`.
- Include print view and client-side PDF download.
- Do not include real payments yet.
- Backend must use DI and contract-based implementation.
- Frontend must be strongly typed.
- Docs must be detailed, example-heavy, and suitable for wiki publishing.

## Teaching Intent
An invoice is not just a form. It coordinates customer data, selected items, line quantities, rates, totals, lifecycle status, printable output, and later payment collection.

After finishing this module, a junior developer should understand:
- how invoice header fields and line items work together.
- how `useFieldArray` manages dynamic rows.
- how autocomplete writes selected IDs into the form.
- how totals are calculated.
- how invoice status changes over time.
- how print/PDF is related to invoice delivery.
- why payments need invoices before they can be taught.

## Cross-Cutting Production Practices
- Controllers depend on `IInvoiceService`, not concrete services.
- Services depend on `IInvoiceRepository`, `IInvoiceNumberService`, and calculation contracts.
- Repositories implement explicit interfaces.
- Add typed DI `Cradle` and registrations.
- Use Zod for request validation and typed DTOs for response payloads.
- Frontend form values, line item values, autocomplete options, API services, thunks, selectors, and component props must be typed.
- Avoid `any`.

## Reference Patterns
- Production invoice docs: [`BookKeepingApp/backend/docs/INVOICE_API.md`](../../../BookKeepingApp/backend/docs/INVOICE_API.md).
- Production invoice backend: [`BookKeepingApp/backend/controllers/invoices`](../../../BookKeepingApp/backend/controllers/invoices), [`BookKeepingApp/backend/services/invoices`](../../../BookKeepingApp/backend/services/invoices), [`BookKeepingApp/backend/repositories/invoices`](../../../BookKeepingApp/backend/repositories/invoices).
- Production invoice frontend: [`BookKeepingApp/frontend/src/features/invoices`](../../../BookKeepingApp/frontend/src/features/invoices).
- Production invoice form: [`BookKeepingApp/frontend/src/features/invoices/pages/InvoiceFormPage.tsx`](../../../BookKeepingApp/frontend/src/features/invoices/pages/InvoiceFormPage.tsx).
- Production customer autocomplete: [`BookKeepingApp/frontend/src/features/customers/components/CustomerAutocomplete.tsx`](../../../BookKeepingApp/frontend/src/features/customers/components/CustomerAutocomplete.tsx).
- Production item autocomplete: [`BookKeepingApp/frontend/src/features/items/components/ItemAutocomplete.tsx`](../../../BookKeepingApp/frontend/src/features/items/components/ItemAutocomplete.tsx).
- Production print utilities: [`BookKeepingApp/frontend/src/components/print/printUtils.ts`](../../../BookKeepingApp/frontend/src/components/print/printUtils.ts).

## Backend Scope
1. Scaffold Express + Prisma + Zod + TypeScript backend.
2. Add simplified models: `Customer`, `Item`, `Invoice`, `InvoiceLine`.
3. Add seed data for customers and items.
4. Add contracts:
   - `IInvoiceRepository`
   - `IInvoiceService`
   - `IInvoiceNumberService`
   - `IInvoiceCalculator`
   - `ICustomerLookupRepository` or equivalent
   - `IItemLookupRepository` or equivalent
5. Implement invoice number generation.
6. Implement invoice totals calculation in a dedicated calculator utility/service.
7. Add Zod schemas for create, update, params, list query, and status update.
8. Add service logic for validating customer existence and item IDs.
9. Add repository logic for creating/updating invoice with nested lines using Prisma transactions where appropriate.
10. Add routes:
   - `GET /api/v1/invoices`
   - `GET /api/v1/invoices/:id`
   - `POST /api/v1/invoices`
   - `PUT /api/v1/invoices/:id`
   - `PATCH /api/v1/invoices/:id/status`
   - `GET /api/v1/customers/search`
   - `GET /api/v1/items/search`
11. Register all services/repositories/calculators in typed DI.

## Frontend Scope
1. Scaffold Vite + React + TypeScript + Tailwind.
2. Add React Hook Form + Zod + `useFieldArray`.
3. Add typed models for customer options, item options, invoice line form values, invoice form values, payloads, DTOs, and list responses.
4. Add typed API services for invoices, customer search, and item search.
5. Add typed Redux slice/thunks/selectors for invoices.
6. Build pages:
   - invoice list
   - invoice detail
   - invoice create
   - invoice edit
   - invoice print
7. Build form sections:
   - invoice details/customer selection
   - line items with item autocomplete
   - totals summary
   - status/actions
8. Implement client-side totals preview.
9. Implement print view and PDF download.
10. Keep email and payments out, except for a clearly marked placeholder explaining future modules.

## Docs
Create detailed numbered docs in `06-invoices-basic/docs/`:

1. `01-overview.md` - what an invoice is and why it comes before payments.
2. `02-data-model.md` - Customer, Item, Invoice, InvoiceLine relationships.
3. `03-invoice-number-and-status.md` - invoice numbers and lifecycle states.
4. `04-backend-create-flow.md` - create invoice request through DI, service, repository, transaction.
5. `05-line-items-and-totals.md` - quantity, rate, tax/simple totals, examples.
6. `06-frontend-use-field-array.md` - dynamic line rows with beginner explanations.
7. `07-customer-and-item-autocomplete.md` - selected IDs, labels, server search, examples.
8. `08-print-and-pdf.md` - print route, printable document, client-side PDF download.
9. `09-contracts-di-and-typing.md` - backend interfaces, typed DI, frontend form/API types.
10. `10-contract-trace.md` - trace one invoice line from UI row to DB row and back.
11. `11-how-this-maps-to-production.md` - map learning files to production invoice files.
12. `12-exercises.md` - discounts, taxes, edit line deletion, email placeholder, tests.

Docs must include example invoice payloads and explain `useFieldArray`, transaction, DTO, calculated field, and status transition.

## Validation
- Run backend build or `tsc --noEmit`.
- Run frontend build.
- Verify customer autocomplete and item autocomplete work.
- Verify create invoice with multiple lines.
- Verify edit invoice changes lines and totals.
- Verify print/PDF view renders useful invoice data.
- Verify DI contracts compile.
- Verify no feature-level `any` is introduced.
- Run `git diff --check` for the new module and docs.
