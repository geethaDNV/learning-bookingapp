# Plan: Learning Bookingapp — Module 02 Items CRUD & Search Refinements

## Goal
Build `learning-bookingapp/02-items/{backend,frontend}` as a fully isolated, runnable mini-version of the Items feature expanding on Module 01 (`01-items-basic`). It adds full CRUD capabilities (Create, Read Single, Update, Delete) and search refinements (enabling case-insensitive search across `name`, `sku`, `hsnCode`, and `sacCode`), replicating the real layered architecture trimmed to basic fields, accompanied by 10 numbered wiki-ready docs and an updated roadmap.

## Decisions (confirmed with user)
- Fields: `id`, `name`, `sku`, `itemType` (`goods`/`service`), `hsnCode`, `sacCode`, `isActive`, `createdAt`, `updatedAt`.
- Search Scope Expansion: In Module 01, search was limited to `name` and `sku`. Module 02 extends the repository `toItemWhereInput` function to construct a multi-field Prisma `OR` query that searches across `name`, `sku`, `hsnCode`, and `sacCode` (case-insensitive `contains`) whenever a search term is provided.
- CRUD API Endpoints:
  - `GET /api/v1/items` — List items with search (name, sku, hsnCode, sacCode), status filter (`isActive`), and pagination (`page`, `pageSize`).
  - `GET /api/v1/items/:id` — Get a single item by numeric ID (returns 404 if not found).
  - `POST /api/v1/items` — Create a new item (validates unique name, requires HSN code for `goods` and SAC code for `service`).
  - `PUT /api/v1/items/:id` — Update an existing item by numeric ID (supports partial or full updates, validates name uniqueness against other records).
  - `DELETE /api/v1/items/:id` — Delete an item by numeric ID.
- Backend Layering: Full trimmed layering (routes → controller → service → repository → prisma). No auth, tenant scoping, or audit logging in this module.
- Validation: Zod schemas (`listItemsQuerySchema`, `itemIdParamSchema`, `createItemBodySchema`, `updateItemBodySchema`).
- DB Engine: **Postgres via Neon** (cloud, no local docker/install required) — `.env` `DATABASE_URL` points to a Neon connection string. Instructs creating a **separate Neon branch for module 02** (e.g. branch `02-items` off the main Neon project).
- Module folder shape: `02-items/backend`, `02-items/frontend`, and `02-items/docs`.
- Frontend Redux Toolkit state & thunks:
  - Slice state: `{ rows, total, page, pageSize, search, status, selectedItem, loading, error, isFormModalOpen, isDeleteModalOpen, activeEditId }`.
  - Thunks: `fetchItems`, `fetchItemById`, `createItem`, `updateItem`, `deleteItem`.
  - Reducers / Selectors for filter updates, opening/closing modals, and managing active selection.
- Frontend UI Components:
  - `ItemFilters.tsx`: Search text input ("Search by name, SKU, HSN, or SAC..."), status dropdown filter, and a primary "+ Add Item" button.
  - `ItemTable.tsx`: `@tanstack/react-table` with columns for Name, SKU, Type (`goods`/`service`), HSN/SAC, Status badge, and an **Actions** column containing "Edit" and "Delete" buttons.
  - `ItemFormModal.tsx`: Reusable modal dialog for both Create and Edit operations with dynamic field switching (HSN for Goods, SAC for Services) and inline error validation messages.
  - `DeleteConfirmModal.tsx`: Modal dialog asking for confirmation before executing the `deleteItem` thunk.
- Docs: 10 numbered markdown files inside `02-items/docs/` read top-to-bottom, written for direct wiki publishing.

## Reference patterns (from bookingapp, to replicate in trimmed form)
- Prisma model: [bookingapp/backend/prisma/schema.prisma](../../../bookingapp/backend/prisma/schema.prisma) `Item` model (lines ~459-536) — subset: `id Int @id @default(autoincrement())`, `name String`, `sku String?`, `itemType String`, `hsnCode String?`, `sacCode String?`, `isActive Boolean @default(true)`, `createdAt`, `updatedAt`.
- Routes: [bookingapp/backend/routes/items/items.ts](../../../bookingapp/backend/routes/items/items.ts) — `router.get('/')`, `router.get('/:id')`, `router.post('/')`, `router.put('/:id')`, `router.delete('/:id')` with `asyncHandler`.
- Controller: [bookingapp/backend/controllers/items/itemsController.ts](../../../bookingapp/backend/controllers/items/itemsController.ts) — thin orchestration: parse params/body/query → call service method → `sendResponse` or `sendPaginatedResponse`.
- Service: [bookingapp/backend/services/items/itemService.ts](../../../bookingapp/backend/services/items/itemService.ts) — methods: `search(query)`, `getById(id)`, `create(payload)`, `update(id, payload)`, `delete(id)`. Handles business checks (e.g. checking if name already exists, throwing `AppError(404)` or `AppError(400)`).
- Repository: [bookingapp/backend/repositories/items/itemRepository.ts](../../../bookingapp/backend/repositories/items/itemRepository.ts) — `toItemWhereInput(filters)` updated to include `hsnCode` and `sacCode` in `OR` array; methods: `findMany`, `count`, `findById`, `findByName`, `create`, `update`, `delete`.
- Schemas: [bookingapp/backend/schemas/items/itemSchemas.ts](../../../bookingapp/backend/schemas/items/itemSchemas.ts) — Zod query, param, create, and update validation schemas with superRefine rules for conditional HSN/SAC requirement based on `itemType`.
- Frontend Form Page/Modal: [bookingapp/frontend/src/features/items/pages/ItemFormPage.tsx](../../../bookingapp/frontend/src/features/items/pages/ItemFormPage.tsx) — converted to a modal component `ItemFormModal.tsx`.
- Frontend API & Redux: [bookingapp/frontend/src/features/items/services/itemsApi.ts](../../../bookingapp/frontend/src/features/items/services/itemsApi.ts) and [bookingapp/frontend/src/features/items/store/itemsSlice.ts](../../../bookingapp/frontend/src/features/items/store/itemsSlice.ts).

## Steps

### Phase A — Backend module (`learning-bookingapp/02-items/backend/`)
1. Scaffold `package.json`, `tsconfig.json`, `.env.example`, `src/db.ts`, `src/errors/appError.ts`, `src/middleware/asyncHandler.ts`, `src/middleware/errorHandler.ts`, `src/utils/apiResponse.ts`.
2. `prisma/schema.prisma` — Postgres datasource (`DATABASE_URL` env pointing at Neon branch `02-items`), `Item` model with fields (`id`, `name`, `sku`, `itemType`, `hsnCode`, `sacCode`, `isActive`, `createdAt`, `updatedAt`).
3. `prisma/seed.ts` — Seed ~20-25 realistic items with varied names, SKUs, goods (with HSN codes like `8471`, `8517`), and services (with SAC codes like `9983`, `9984`).
4. `src/schemas/itemSchemas.ts` — Zod schemas:
   - `listItemsQuerySchema` (`page`, `pageSize`, `search`, `status`)
   - `itemIdParamSchema` (`id` as numeric string coerced to positive integer)
   - `createItemBodySchema` (`name`, `sku`, `itemType` enum `['goods', 'service']`, `hsnCode`, `sacCode`, `isActive`) with `.superRefine` checking HSN for goods and SAC for service
   - `updateItemBodySchema` (partial/full updates for update endpoint)
5. `src/repositories/itemRepository.ts` — Update `toItemWhereInput` to search `name`, `sku`, `hsnCode`, and `sacCode` in `OR` array (`contains`, `mode: 'insensitive'`). Implement `findById(id)`, `findByName(name)`, `create(data)`, `update(id, data)`, `delete(id)`.
6. `src/services/itemService.ts` — `search(query)`, `getById(id)` (throws 404 if missing), `create(payload)` (checks duplicate name -> throws 400), `update(id, payload)` (checks existence and duplicate name -> throws 400), `delete(id)` (checks existence -> deletes).
7. `src/controllers/itemsController.ts` — Handlers: `getItems`, `getItemById`, `createItem`, `updateItem`, `deleteItem`.
8. `src/routes/items.ts` + `src/app.ts`/`server.ts` — Mount routes (`GET /`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id`), wire express app, CORS, error middleware.

### Phase B — Frontend module (`learning-bookingapp/02-items/frontend/`)
1. Scaffold Vite + React + TypeScript app, Tailwind CSS configuration, install `@reduxjs/toolkit`, `react-redux`, `@tanstack/react-table`, `lucide-react` (or simple icons).
2. `src/features/items/types/item.types.ts` — `Item`, `ItemListQuery`, `ItemListResponse`, `CreateItemPayload`, `UpdateItemPayload`.
3. `src/services/api/apiClient.ts` & `src/features/items/services/itemService.ts` — API client wrapping fetch calls for `getItemList`, `getItemById`, `createItem`, `updateItem`, `deleteItem`.
4. `src/features/items/store/itemSlice.ts` — Redux slice with state: `{ rows, total, page, pageSize, search, status, loading, error, isFormModalOpen, isDeleteModalOpen, activeEditItem, activeDeleteId }`.
5. `src/features/items/store/itemThunks.ts` — Async thunks: `fetchItems`, `fetchItemById`, `createItem`, `updateItem`, `deleteItem`. Update extraReducers to automatically re-fetch list or update local state upon create/update/delete fulfillment.
6. `src/features/items/store/itemSelectors.ts` — Typed selectors for state properties and modal triggers.
7. `src/features/items/components/list/ItemFilters.tsx` — Search text input (placeholder: "Search by name, SKU, HSN, or SAC code..."), status dropdown (`all`, `active`, `inactive`), and "+ Add Item" button (opens form modal in create mode).
8. `src/features/items/components/list/ItemTable.tsx` — `@tanstack/react-table` column helper: Name, SKU, Type badge, HSN/SAC code, Status badge, and Actions column ("Edit" triggers open modal with item data, "Delete" triggers open confirm modal).
9. `src/features/items/components/modals/ItemFormModal.tsx` — Controlled form modal for Create/Edit:
   - Radio/Select for `itemType` (`goods` vs `service`).
   - Conditional display: shows `hsnCode` field when `goods`, shows `sacCode` field when `service`.
   - Form state management, validation feedback, and thunk dispatch (`createItem` or `updateItem`).
10. `src/features/items/components/modals/DeleteConfirmModal.tsx` — Confirmation dialog displaying item name/SKU and "Confirm Delete" / "Cancel" buttons.
11. `src/features/items/pages/ItemListPage.tsx` — Composes `ItemFilters`, `ItemTable`, `ItemFormModal`, and `DeleteConfirmModal`.
12. `src/App.tsx` & `.env.example` — Redux Provider setup and `VITE_API_BASE_URL`.

### Phase C — Docs (`learning-bookingapp/02-items/docs/`)
Numbered markdown files written for direct wiki publishing:
1. `01-overview.md` — Overview of Module 02, what you will build (CRUD + multi-field search), prerequisites, and delta compared to Module 01.
2. `02-database-and-seed-data.md` — Neon branch setup (`02-items`), Prisma schema field explanation, unique name constraints, and creating realistic seed data with HSN/SAC codes.
3. `03-backend-multi-field-search.md` — Deep dive into multi-field search in `itemRepository.ts`: how `toItemWhereInput` uses Prisma `OR` array across `name`, `sku`, `hsnCode`, and `sacCode` with `mode: 'insensitive'`.
4. `04-backend-crud-architecture.md` — Layer-by-layer breakdown of full REST CRUD endpoints (`GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id`), Zod schema validation (conditional HSN/SAC rules), duplicate checking, and error handling with `AppError`.
5. `05-running-and-testing-the-api.md` — Testing guide with sample cURL/Postman commands for list with HSN/SAC search, fetch single, create, update, delete, and expected HTTP status codes (200, 201, 204, 400, 404).
6. `06-frontend-redux-crud-state.md` — Redux Toolkit slice and thunk architecture for CRUD operations: managing asynchronous state mutations (`createItem`, `updateItem`, `deleteItem`) and automatic table re-fetching.
7. `07-frontend-form-modal-and-validation.md` — Building `ItemFormModal`: dynamic field switching (HSN vs SAC based on `itemType`), handling create vs edit modes, and displaying validation errors.
8. `08-frontend-table-actions-and-deletion.md` — TanStack Table actions column integration, opening modals with row context, and building safe deletion flows with `DeleteConfirmModal`.
9. `09-exercises.md` — Hands-on junior developer challenges: convert hard delete to soft delete (`isActive = false`), add SKU uniqueness validation, implement search debouncing, and write unit tests for `itemService`.
10. `10-how-this-maps-to-the-real-app.md` — Side-by-side mapping comparing Module 02's simplified files with full production counterparts in `bookingapp` (links to real files in `bookingapp/backend` and `bookingapp/frontend`).

## Roadmap (future modules, names/numbers only)
- `01-items-basic` — List + basic name search + status filter (completed).
- `02-items` — Full CRUD + HSN/SAC multi-field search (this module).
- `03-search-refinements` — Debounce, advanced multi-field filter controls (itemType, sellable), column sorting, pagination UI.
- `04-auth-basics` — Login, JWT authentication, `requireAuthentication` middleware concept.
- `05-multi-tenancy` — Multi-tenant `orgId` scoping, `requestContext` pattern.
- `06-relations-units` — Related models (Unit) and Prisma relations/joins.
- `07-accounts-and-postings` — Introduction to the accounting posting engine concepts (simplified).
- `08-file-uploads` — Image upload for items (multer + storage).
- `09-testing` — Unit and integration testing conventions for backend and frontend.

## Verification
1. Backend: `cd learning-bookingapp/02-items/backend && npm install`, set `.env` `DATABASE_URL` to a Neon connection string (branch `02-items`), `npx prisma migrate dev && npx prisma db seed && npm run dev`.
2. HSN/SAC Search API Test: `curl "http://localhost:<port>/api/v1/items?search=9983"` — verify that items with matching SAC or HSN codes are returned in JSON response.
3. CRUD API Test:
   - `POST /api/v1/items` with valid payload -> returns 201 created item.
   - `GET /api/v1/items/:id` -> returns 200 item object.
   - `PUT /api/v1/items/:id` -> updates item fields and returns 200.
   - `DELETE /api/v1/items/:id` -> returns 204 or 200 success response.
4. Frontend: `cd ../frontend && npm install && npm run dev` — load page, test search by typing HSN code (`8471`) or SAC code (`9983`).
5. Form Modal Test: Click "+ Add Item", fill form (toggle `goods` -> HSN field shows; toggle `service` -> SAC field shows), save -> verify new row appears in table. Click "Edit" on a row -> modal opens pre-filled -> save changes -> row updates.
6. Delete Modal Test: Click "Delete" on a row -> confirmation modal opens -> confirm -> item is removed from table.
7. Redux DevTools: Confirm thunk actions (`items/fetchItems`, `items/createItem`, `items/updateItem`, `items/deleteItem`) fire properly and transition through `pending` -> `fulfilled`.
8. Read through each numbered doc in order to verify accuracy, file links, and clear step-by-step instructions.

## Scope boundaries
- Included: Full CRUD (List/Search, GET single, Create, Update, Delete), multi-field search across `name`, `sku`, `hsnCode`, `sacCode`, Redux Toolkit CRUD thunks, `@tanstack/react-table` with Actions column, `ItemFormModal`, `DeleteConfirmModal`, 10 wiki-ready docs, roadmap update.
- Excluded (deferred to later modules): auth/JWT, multi-tenancy `orgId` scoping, audit logging, image uploads, unit relations, search debouncing, column sorting, docker setup.
