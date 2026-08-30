# Plan: Learning Bookingapp - Module 05 Customers Basic

## Goal
Build `learning-bookingapp/05-customers-basic/{backend,frontend}` as a fully isolated, runnable customer learning module. The module should teach customer CRUD, customer search, active/inactive status, typed contracts, DI, and a reusable customer autocomplete component that prepares juniors for invoice creation.

This module should make customer selection understandable before invoice forms introduce line items, totals, and payment flows.

## Decisions
- Module folder name: `05-customers-basic`.
- Keep customer fields beginner-friendly but realistic: `id`, `displayName`, `email`, `phone`, `gstin`, `billingAddress`, `isActive`, `createdAt`, `updatedAt`.
- Include list/search/detail/create/edit/status flows.
- Include a reusable `CustomerAutocomplete` backed by server search.
- Use React Hook Form + Zod for customer create/edit forms.
- Backend must use DI and interface-based contracts.
- Frontend must use typed API services, thunks, selectors, form values, component props, and autocomplete options.
- Docs must teach autocomplete slowly with examples.

## Teaching Intent
Invoices need customers. Before a junior developer builds an invoice form, they should understand how customer data is created, searched, selected, and represented as a typed object.

After finishing this module, a junior developer should understand:
- customer CRUD flow.
- server-side search for autocomplete.
- debounced UI search.
- selected option vs full customer record.
- typed API contracts for list and autocomplete results.
- how customer selection will plug into invoice forms later.

## Cross-Cutting Production Practices
- Controllers depend on `ICustomerService` through DI.
- Services depend on `ICustomerRepository`.
- Repository implements an explicit contract.
- Add a typed DI `Cradle` and registration file.
- Use Zod request schemas and typed DTOs.
- Frontend autocomplete props and option models must be typed.
- Avoid `any`.

## Reference Patterns
- Production customer controller: [`BookKeepingApp/backend/controllers/customers`](../../../BookKeepingApp/backend/controllers/customers).
- Production customer service/repository: [`BookKeepingApp/backend/services/customers`](../../../BookKeepingApp/backend/services/customers), [`BookKeepingApp/backend/repositories/customers`](../../../BookKeepingApp/backend/repositories/customers).
- Production customer autocomplete: [`BookKeepingApp/frontend/src/features/customers/components/CustomerAutocomplete.tsx`](../../../BookKeepingApp/frontend/src/features/customers/components/CustomerAutocomplete.tsx).
- Production customer frontend: [`BookKeepingApp/frontend/src/features/customers`](../../../BookKeepingApp/frontend/src/features/customers).
- Production DI/interfaces: [`BookKeepingApp/backend/di/types.ts`](../../../BookKeepingApp/backend/di/types.ts), [`BookKeepingApp/backend/types/interfaces`](../../../BookKeepingApp/backend/types/interfaces).

## Backend Scope
1. Scaffold Express + Prisma + Zod + TypeScript backend.
2. Add `Customer` model with indexes for `displayName`, `email`, `phone`, `gstin`, and `isActive`.
3. Add seed data with realistic names/emails/GSTIN examples.
4. Add contracts:
   - `ICustomerRepository`
   - `ICustomerService`
5. Implement repository methods for paged list, count, search, find by id/email/GSTIN, create, update, and set status.
6. Implement service methods for list, autocomplete search, get by id, create, update, and set status.
7. Add duplicate validation for email/GSTIN when provided.
8. Add Zod schemas for list query, autocomplete query, params, create, update, and status update.
9. Add controller methods and routes:
   - `GET /api/v1/customers`
   - `GET /api/v1/customers/search`
   - `GET /api/v1/customers/:id`
   - `POST /api/v1/customers`
   - `PUT /api/v1/customers/:id`
   - `PATCH /api/v1/customers/:id/status`
10. Register dependencies through the typed DI container.

## Frontend Scope
1. Scaffold Vite + React + TypeScript + Tailwind.
2. Add React Hook Form + Zod for create/edit forms.
3. Add typed models:
   - `Customer`
   - `CustomerListQuery`
   - `CustomerListResponse`
   - `CustomerAutocompleteOption`
   - `CreateCustomerPayload`
   - `UpdateCustomerPayload`
4. Add typed `customerService` methods.
5. Add typed Redux slice/thunks/selectors.
6. Add customer list, detail, create, and edit pages.
7. Add `CustomerAutocomplete` with:
   - typed `value`
   - typed `onSelect`
   - debounced search input
   - loading state
   - empty state
   - keyboard/mouse selection if practical
8. Add a small demo page showing how autocomplete selection populates a typed selected customer.
9. Document how this component will be used by the invoice form later.

## Docs
Create detailed numbered docs in `05-customers-basic/docs/`:

1. `01-overview.md` - why customers are a prerequisite for invoices.
2. `02-customer-model-and-seed.md` - fields, indexes, realistic examples.
3. `03-backend-customer-crud.md` - route/controller/service/repository/Prisma flow.
4. `04-customer-validation.md` - Zod schemas, duplicate email/GSTIN examples.
5. `05-customer-autocomplete-api.md` - server search endpoint, query params, response shape.
6. `06-frontend-customer-form.md` - React Hook Form + Zod form flow.
7. `07-customer-autocomplete-ui.md` - debounce, loading, empty state, selected option.
8. `08-contracts-di-and-typing.md` - backend interfaces, DI, frontend typed service/thunks.
9. `09-contract-trace.md` - trace `customerId` and `displayName` from autocomplete to future invoice form.
10. `10-how-this-maps-to-production.md` - map learning files to production customer files.
11. `11-exercises.md` - add create-customer-on-the-fly, address fields, GSTIN prefill stub, tests.

Docs should include examples of autocomplete request URLs and response JSON.

## Validation
- Run backend build or `tsc --noEmit`.
- Run frontend build.
- Verify create/edit/list/detail/status flows.
- Verify autocomplete searches by name/email/phone/GSTIN.
- Verify selected autocomplete option is strongly typed.
- Verify DI container and contracts compile.
- Verify no feature-level `any` is introduced.
- Run `git diff --check` for the new module and docs.
