# Plan: Learning Bookingapp - Module 03 Items Form RHF + Zod

## Goal
Build `learning-bookingapp/03-items-form-rhf-zod/{backend,frontend}` as a focused learning module that upgrades the Item create/edit experience from basic controlled inputs to the production-style form stack used in `BookKeepingApp`: React Hook Form, Zod validation, typed form values, typed API payloads, typed Redux thunks, and clear server-error handling.

This module should reuse the mental model from `02-items-basic`, but its main teaching objective is frontend form architecture and type safety. A junior developer should finish this module understanding why production forms use schemas, resolvers, typed form values, submit-state helpers, and reusable form sections.

## Decisions
- Module folder name: `03-items-form-rhf-zod`.
- Keep the domain small: Items only.
- Keep fields close to module 02: `name`, `sku`, `itemType`, `hsnCode`, `sacCode`, `isActive`.
- Use React Hook Form and `@hookform/resolvers/zod` for create and edit forms.
- Use Zod on the frontend for form validation and on the backend for request validation.
- Teach strong TypeScript typing deliberately: no feature-level `any` for API data, form values, component props, thunks, or selectors.
- Backend must use dependency injection and interface-based contracts, even if the backend is small.
- Docs must be detailed enough for a junior developer and include examples of valid and invalid form input.

## Teaching Intent
This module is the bridge between beginner CRUD and production forms.

After finishing this module, a junior developer should be able to open the production Item form and recognize:
- `useForm` setup.
- `zodResolver` usage.
- typed form values.
- field-level error display.
- default values for edit mode.
- submit state and disabled buttons.
- mapping form values to create/update API payloads.
- server duplicate errors displayed in the UI.

## Cross-Cutting Production Practices
- Backend controllers must receive services from a DI container.
- Services must depend on repository interfaces, not concrete repositories.
- Repositories must implement explicit interfaces.
- Add a small typed DI setup in `backend/src/di/` with a typed `Cradle`.
- Define backend contracts under `backend/src/types/interfaces` or `backend/src/contracts`.
- Zod schemas should produce or align with TypeScript request types.
- Frontend API responses, service methods, thunks, selectors, form values, and component props must be typed.
- Avoid `any`. If a cast is unavoidable, document why in code or docs.

## Reference Patterns
- Previous module: [`learning-bookingapp/02-items-basic`](../../02-items-basic).
- Production Item form: [`BookKeepingApp/frontend/src/features/items/pages/ItemFormPage.tsx`](../../../BookKeepingApp/frontend/src/features/items/pages/ItemFormPage.tsx).
- Production Item validation: [`BookKeepingApp/frontend/src/features/items/schemas/itemValidation.ts`](../../../BookKeepingApp/frontend/src/features/items/schemas/itemValidation.ts).
- Production Item form sections: [`BookKeepingApp/frontend/src/features/items/components/form/sections`](../../../BookKeepingApp/frontend/src/features/items/components/form/sections).
- Production backend Item service/repository/controller: [`BookKeepingApp/backend/services/items`](../../../BookKeepingApp/backend/services/items), [`BookKeepingApp/backend/repositories/items`](../../../BookKeepingApp/backend/repositories/items), [`BookKeepingApp/backend/controllers/items`](../../../BookKeepingApp/backend/controllers/items).
- Production DI style: [`BookKeepingApp/backend/di/types.ts`](../../../BookKeepingApp/backend/di/types.ts).

## Backend Scope
1. Scaffold a small Express + Prisma + Zod + TypeScript backend.
2. Add Prisma `Item` model with the learning fields.
3. Add `IItemRepository` and `IItemService` contracts.
4. Implement `ItemRepository implements IItemRepository`.
5. Implement `ItemService implements IItemService`.
6. Add `ItemController` that receives `IItemService` through constructor injection.
7. Add a typed DI container registration.
8. Add routes that resolve the controller from DI.
9. Add Zod schemas for create, update, params, and list query.
10. Return typed response DTOs for item detail, list, create, and update.

## Frontend Scope
1. Scaffold Vite + React + TypeScript + Tailwind.
2. Add React Hook Form, Zod, `@hookform/resolvers`, Redux Toolkit, React Redux, React Router.
3. Add `itemFormSchema` and infer `ItemFormValues` from Zod.
4. Add typed API models: `Item`, `CreateItemPayload`, `UpdateItemPayload`, `ItemResponse`, `ItemListResponse`.
5. Add typed `itemService` methods.
6. Add typed thunks for fetch by id, create, update, and fetch list.
7. Add typed selectors and typed hooks.
8. Build shared `ItemForm` with create/edit mode.
9. Show field-level Zod errors and top-level server errors.
10. In edit mode, load defaults and call `reset` when the item arrives.
11. Map empty optional fields to `undefined` or omitted payload fields consistently.

## Docs
Create detailed numbered docs in `03-items-form-rhf-zod/docs/`:

1. `01-overview.md` - why production forms use React Hook Form + Zod instead of only `useState`.
2. `02-zod-form-schema.md` - explain schema fields, inferred types, optional fields, and examples of valid/invalid data.
3. `03-react-hook-form-basics.md` - `useForm`, `register`, `handleSubmit`, `formState.errors`, default values.
4. `04-create-form-flow.md` - trace create from typing in the form to database row.
5. `05-edit-form-flow.md` - edit defaults, async fetch, `reset`, update payload, duplicate errors.
6. `06-backend-contracts-and-di.md` - explain controller/service/repository interfaces and typed DI container.
7. `07-frontend-typing.md` - API types, thunk types, selector types, component props, avoiding `any`.
8. `08-contract-trace.md` - trace `name`, `itemType`, and `hsnCode` from UI form type to Zod schema to backend service contract to response.
9. `09-how-this-maps-to-production.md` - map simplified files to production files.
10. `10-exercises.md` - add conditional HSN/SAC validation, split form sections, add tests, improve server-error mapping.

Docs should use short code snippets and realistic examples. Explain terms like resolver, schema, inferred type, payload, DTO, and contract in beginner-friendly language.

## Validation
- Run backend build or `tsc --noEmit`.
- Run frontend build.
- Verify create form shows Zod validation errors.
- Verify edit form loads defaults and updates successfully.
- Verify duplicate name/SKU server errors appear in the UI.
- Verify no feature-level `any` is introduced.
- Run `git diff --check` for the new module and docs.
