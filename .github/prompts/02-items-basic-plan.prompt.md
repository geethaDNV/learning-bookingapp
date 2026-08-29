# Plan: Learning Bookingapp — Module 02 Items Basic CRUD

## Goal
Build `learning-bookingapp/02-items-basic/{backend,frontend}` as a fully isolated, runnable mini-version of the Items CRUD feature from `BookKeepingApp`. The module should teach junior developers the complete Item CRUD flow step by step: list, search/filter, view detail, create, edit, inactivate/reactivate, and optionally hard delete for demo data.

The learning app must deliberately mirror the real BookingApp Items architecture so that, after completing this module, developers can open the production Items slice, thunks, services, backend controllers, services, repositories, and schemas and recognize how all the pieces fit together.

## Decisions (confirmed with user)
- Module folder name: `02-items-basic`.
- Module 02 builds on `01-items-basic`, but the focus is now **CRUD** instead of only list/search/status.
- Fields: `id`, `name`, `sku`, `itemType` (`goods`/`service`), `hsnCode`, `sacCode`, `isActive`, `createdAt`, `updatedAt`.
- HSN/SAC codes are first-class in this module: display in the table/detail page, editable in create/edit forms, included in API payloads, and searchable through a dedicated code filter.
- Backend layering stays full but trimmed: routes → controller → service → repository → Prisma.
- Frontend state flow intentionally mirrors the real BookingApp Items Redux flow: `itemSlice` + `itemThunks` + `itemSelectors` + `itemService`.
- Keep the production mental model, but remove production complexity: no auth, no org/tenant scoping, no audit logging, no account/unit/vendor relations, no image upload, no imports/exports, no complex tax calculations, and no hybrid pagination.
- Use status-based inactivation/reactivation as the primary beginner-friendly delete flow. A physical `DELETE` endpoint can be included as a clearly marked learning/demo endpoint or deferred to exercises.
- Each module remains fully isolated: own `package.json`, own `prisma/schema.prisma`, own DB connection, own backend, own frontend, own docs.
- DB engine should follow the established learning-module direction: Postgres via Neon, with a separate Neon branch for this module, e.g. `02-items-basic`.
- Docs must be numbered markdown files inside `02-items-basic/docs/`, written top-to-bottom and suitable for wiki publishing.

## Teaching Intent
This module is not meant to be a toy CRUD app with random architecture. It is a simplified teaching copy of the real BookingApp Items feature.

After finishing this module, a junior developer should be able to inspect the production app and say:
- `itemSlice.ts` is the bigger production version of the same Redux state pattern.
- `itemThunks.ts` is the bigger production version of the same async create/update/delete flow.
- `itemService.ts` is the bigger production version of the same frontend API wrapper.
- `itemsController.ts` is the bigger production version of the same request orchestration.
- `itemService.ts` on the backend is the bigger production version of the same business-rule layer.
- `itemRepository.ts` is the bigger production version of the same Prisma access layer and `where` builder.
- `itemSchemas.ts` is the bigger production version of the same Zod validation layer.

## Reference patterns (from BookKeepingApp, to replicate in trimmed form)
- Module 01 baseline: [`learning-bookingapp/01-items-basic`](../../01-items-basic) — reuse the isolated backend/frontend/docs structure, dependency choices, response helpers, error middleware, Redux list flow, and TanStack Table setup.
- Prisma model: [`BookKeepingApp/backend/prisma/schema.prisma`](../../../BookKeepingApp/backend/prisma/schema.prisma) `Item` model — use only the learning subset: `id`, `name`, `sku`, `itemType`, `hsnCode`, `sacCode`, `isActive`, `createdAt`, `updatedAt`. Add indexes for `name`, `sku`, `itemType`, `hsnCode`, `sacCode`, and `isActive`.
- Routes: [`BookKeepingApp/backend/routes/items/items.ts`](../../../BookKeepingApp/backend/routes/items/items.ts) — mirror REST route organization, but drop authentication/role middleware.
- Controller: [`BookKeepingApp/backend/controllers/items/itemsController.ts`](../../../BookKeepingApp/backend/controllers/items/itemsController.ts) — thin orchestration: parse params/query/body → call service → map response → send JSON.
- Backend service: [`BookKeepingApp/backend/services/items/itemService.ts`](../../../BookKeepingApp/backend/services/items/itemService.ts) — mirror the business-rule layer for search, get-by-id, create, update, and status changes, but remove orgId, audit logging, account validation, image logic, and import/export concerns.
- Repository: [`BookKeepingApp/backend/repositories/items/itemRepository.ts`](../../../BookKeepingApp/backend/repositories/items/itemRepository.ts) — mirror the `toItemWhereInput` pattern for translating filters into Prisma `where` clauses. In module 02, search should include `name`, `sku`, `hsnCode`, and `sacCode`; the dedicated `code` filter should search `hsnCode` and `sacCode` only.
- Schemas: [`BookKeepingApp/backend/schemas/items/itemSchemas.ts`](../../../BookKeepingApp/backend/schemas/items/itemSchemas.ts) — mirror Zod schema organization with simplified create/update/list/status schemas.
- Error handling: `asyncHandler`, `AppError`, and central error middleware — use trimmed copies/patterns from module 01 and production.
- Response helpers: `sendResponse` and `sendPaginatedResponse` — use the module 01 minimal response format.
- Frontend item slice: [`BookKeepingApp/frontend/src/features/items/store/itemSlice.ts`](../../../BookKeepingApp/frontend/src/features/items/store/itemSlice.ts) — mirror the shape and async state handling, but keep fewer fields and fewer async cases.
- Frontend item thunks: [`BookKeepingApp/frontend/src/features/items/store/itemThunks.ts`](../../../BookKeepingApp/frontend/src/features/items/store/itemThunks.ts) — mirror thunk naming and mutation flow: fetch list, fetch by id, create, update, status change, optional delete.
- Frontend item service: [`BookKeepingApp/frontend/src/features/items/services/itemService.ts`](../../../BookKeepingApp/frontend/src/features/items/services/itemService.ts) — mirror API service method organization with a minimal API client.
- Frontend list page: [`BookKeepingApp/frontend/src/features/items/pages/ItemListPage.tsx`](../../../BookKeepingApp/frontend/src/features/items/pages/ItemListPage.tsx) — mirror list/filter/table/action flow in a simplified way.
- Frontend form page: [`BookKeepingApp/frontend/src/features/items/pages/ItemFormPage.tsx`](../../../BookKeepingApp/frontend/src/features/items/pages/ItemFormPage.tsx) — mirror create/edit form intent, but keep a much smaller form.
- Frontend filters/table: [`BookKeepingApp/frontend/src/features/items/components/list/ItemFilters.tsx`](../../../BookKeepingApp/frontend/src/features/items/components/list/ItemFilters.tsx), [`BookKeepingApp/frontend/src/features/items/components/list/ItemTable.tsx`](../../../BookKeepingApp/frontend/src/features/items/components/list/ItemTable.tsx) — mirror TanStack Table columns, filters, status badges, and row actions in beginner-friendly form.

## Steps

### Phase A — Backend module (`learning-bookingapp/02-items-basic/backend/`)
1. Scaffold `package.json` with Express, Prisma, Zod, CORS, dotenv, TypeScript, ts-node-dev, and required `@types/*` packages.
2. Add `tsconfig.json` matching the style of module 01.
3. Add `.env.example` with `DATABASE_URL="postgresql://<user>:<pass>@<neon-host>/<db>?sslmode=require"` and a note to use a dedicated Neon branch named `02-items-basic`.
4. Add `prisma/schema.prisma` with a trimmed `Item` model:
   - `id Int @id @default(autoincrement())`
   - `name String`
   - `sku String?`
   - `itemType String`
   - `hsnCode String?`
   - `sacCode String?`
   - `isActive Boolean @default(true)`
   - `createdAt DateTime @default(now())`
   - `updatedAt DateTime @updatedAt`
   - indexes for `name`, `sku`, `itemType`, `hsnCode`, `sacCode`, and `isActive`
5. Add `prisma/seed.ts` with 15-20 sample items:
   - goods with HSN codes
   - services with SAC codes
   - active and inactive examples
   - names/SKUs that make search behavior easy to test
6. Add `src/db.ts` as a PrismaClient singleton.
7. Add trimmed infrastructure files:
   - `src/errors/appError.ts`
   - `src/middleware/asyncHandler.ts`
   - `src/middleware/errorHandler.ts`
   - `src/utils/apiResponse.ts`
8. Add `src/schemas/itemSchemas.ts`:
   - `listItemsQuerySchema`: `page`, `pageSize`, `search`, `status`, `itemType`, `code`
   - `itemIdParamSchema`: numeric `id`
   - `createItemBodySchema`: `name`, `sku`, `itemType`, `hsnCode`, `sacCode`, `isActive`
   - `updateItemBodySchema`: editable fields, partial but must contain at least one valid update field
   - `updateItemStatusBodySchema`: `isActive`
9. Add `src/repositories/itemRepository.ts`:
   - `toItemWhereInput(filters)`
   - `findPaged(filters, page, pageSize)`
   - `count(filters)`
   - `findById(id)`
   - `findByName(name)`
   - `findBySku(sku)`
   - `create(data)`
   - `update(id, data)`
   - `setStatus(id, isActive)`
   - optional `delete(id)`
10. `toItemWhereInput(filters)` must teach the core search idea clearly:
   - `search` builds an `OR` over `name`, `sku`, `hsnCode`, and `sacCode`
   - `code` builds an `OR` over only `hsnCode` and `sacCode`
   - `status=active` maps to `isActive: true`
   - `status=inactive` maps to `isActive: false`
   - `itemType=goods|service` maps to `itemType`
11. Add `src/services/itemService.ts`:
   - `search(query)` returns `{ rows, total, page, pageSize }`
   - `getById(id)` throws a 404-style `AppError` when missing
   - `create(payload)` checks duplicate name/SKU before creating
   - `update(id, payload)` checks item exists and prevents duplicate name/SKU collisions
   - `setStatus(id, isActive)` handles inactivate/reactivate
   - optional `delete(id)` physically deletes demo data
12. Add `src/controllers/itemsController.ts`:
   - `getItems`
   - `getItem`
   - `createItem`
   - `updateItem`
   - `updateItemStatus`
   - optional `deleteItem`
13. Add `src/routes/items.ts`:
   - `GET /`
   - `GET /:id`
   - `POST /`
   - `PUT /:id`
   - `PATCH /:id/status`
   - optional `DELETE /:id`
14. Add `src/app.ts` and `src/server.ts` with JSON middleware, CORS, `/api/v1/items`, a health route, and error middleware last.

### Phase B — Frontend module (`learning-bookingapp/02-items-basic/frontend/`)
1. Scaffold Vite + React + TypeScript + Tailwind using module 01 as the baseline.
2. Install and configure:
   - `@reduxjs/toolkit`
   - `react-redux`
   - `@tanstack/react-table`
   - `react-router-dom`
3. Add `.env.example` with `VITE_API_BASE_URL=http://localhost:<port>/api/v1`.
4. Add `src/services/api/apiClient.ts` as a minimal fetch wrapper.
5. Add `src/features/items/types/item.types.ts`:
   - `Item`
   - `ItemListQuery`
   - `ItemListResponse`
   - `CreateItemPayload`
   - `UpdateItemPayload`
   - `UpdateItemStatusPayload`
6. Add `src/features/items/services/itemService.ts`:
   - `getItemList(query)` → `GET /items`
   - `getById(id)` → `GET /items/:id`
   - `create(payload)` → `POST /items`
   - `update(id, payload)` → `PUT /items/:id`
   - `setStatus(id, isActive)` → `PATCH /items/:id/status`
   - optional `delete(id)` → `DELETE /items/:id`
7. Add `src/features/items/store/itemThunks.ts`:
   - `fetchItems`
   - `fetchItemById`
   - `createItem`
   - `updateItem`
   - `setItemStatus`
   - optional `deleteItem`
8. Add `src/features/items/store/itemSlice.ts` with state:
   - `rows`
   - `selectedItem`
   - `total`
   - `page`
   - `pageSize`
   - `search`
   - `status`
   - `itemType`
   - `code`
   - `loading`
   - `saving`
   - `error`
   - `successMessage`
9. Add slice reducers:
   - `setSearch`
   - `setStatus`
   - `setItemType`
   - `setCode`
   - `setPage`
   - `setPageSize`
   - `clearSelectedItem`
   - `clearError`
   - `clearSuccessMessage`
10. Handle thunk lifecycle in `extraReducers` so juniors see the production pattern:
   - pending → loading/saving true
   - fulfilled → update list/selected item/messages
   - rejected → capture error
11. Add `src/features/items/store/itemSelectors.ts` for list state, filters, selected item, loading/saving, errors, and success messages.
12. Add typed store setup in `src/store/store.ts` and typed hooks in `src/store/hooks.ts`.
13. Add `src/features/items/hooks/useItemsList.ts`:
   - read filters from Redux
   - dispatch `fetchItems` on mount and whenever `page`, `pageSize`, `search`, `status`, `itemType`, or `code` changes
14. Add pages:
   - `src/features/items/pages/ItemListPage.tsx`
   - `src/features/items/pages/ItemCreatePage.tsx`
   - `src/features/items/pages/ItemEditPage.tsx`
   - `src/features/items/pages/ItemDetailPage.tsx`
15. Add list components:
   - `src/features/items/components/list/ItemFilters.tsx`: search, status, item type, HSN/SAC code filter, clear filters
   - `src/features/items/components/list/ItemTable.tsx`: TanStack Table columns for name, SKU, item type, HSN/SAC, status, and actions
16. Add form components:
   - `src/features/items/components/form/ItemForm.tsx`: shared create/edit form
   - fields: `name`, `sku`, `itemType`, `hsnCode`, `sacCode`, `isActive`
   - keep validation simple and visible; advanced conditional validation can be an exercise
17. Add a small confirmation component for inactivate/reactivate and optional hard delete.
18. Add routes in `src/App.tsx`:
   - `/items`
   - `/items/new`
   - `/items/:id`
   - `/items/:id/edit`
   - redirect `/` to `/items`

### Phase C — Docs (`learning-bookingapp/02-items-basic/docs/`)
Numbered markdown files, each self-contained but building on the previous, written for direct wiki publishing:

1. `01-overview.md` — what CRUD means, what this module builds, what changed from module 01, and what production complexity is intentionally excluded.
2. `02-database-and-model.md` — Neon branch setup, Prisma model walkthrough, HSN vs SAC at a beginner level, indexes, seed data, migration, seed, Prisma Studio.
3. `03-backend-read-flow.md` — `GET /items` and `GET /items/:id` route → controller → service → repository → Prisma → response.
4. `04-backend-create-flow.md` — `POST /items`, Zod body validation, duplicate checks, repository create, API response shape.
5. `05-backend-update-flow.md` — `PUT /items/:id`, route params, partial update validation, duplicate checks, editing HSN/SAC values.
6. `06-backend-delete-status-flow.md` — status-based inactivation/reactivation, why production apps often avoid hard delete, optional hard-delete demo.
7. `07-frontend-form-design.md` — shared create/edit `ItemForm`, controlled inputs, basic validation, HSN/SAC form fields.
8. `08-redux-mutations.md` — `itemSlice` and `itemThunks` walkthrough; map learning thunks to the production BookingApp Items thunks.
9. `09-table-actions-and-filters.md` — TanStack Table columns, row actions, HSN/SAC code filter, status badges, pagination.
10. `10-end-to-end-crud-traces.md` — trace create, edit, detail, inactivate/reactivate from UI click to DB write and back.
11. `11-how-this-maps-to-the-real-app.md` — side-by-side mapping of every simplified learning file to the production BookingApp file.
12. `12-exercises.md` — add debounce, add sort by name, add conditional HSN/SAC validation, add tests, add hard delete/restore audit notes.

### Phase D — README and roadmap
1. Add `learning-bookingapp/02-items-basic/README.md` with:
   - module goal
   - prerequisites
   - backend setup
   - frontend setup
   - docs reading order
   - quick API smoke tests
2. Update the learning roadmap, if one exists, so module 02 is named `02-items-basic` and described as Item CRUD with HSN/SAC code handling.

## Suggested file structure
```text
learning-bookingapp/02-items-basic/
  README.md
  backend/
    package.json
    tsconfig.json
    .env.example
    prisma/
      schema.prisma
      seed.ts
    src/
      app.ts
      server.ts
      db.ts
      controllers/
        itemsController.ts
      errors/
        appError.ts
      middleware/
        asyncHandler.ts
        errorHandler.ts
      repositories/
        itemRepository.ts
      routes/
        items.ts
      schemas/
        itemSchemas.ts
      services/
        itemService.ts
      utils/
        apiResponse.ts
  frontend/
    package.json
    tsconfig.json
    vite.config.ts
    tailwind.config.js
    postcss.config.js
    .env.example
    index.html
    src/
      main.tsx
      App.tsx
      services/
        api/
          apiClient.ts
      store/
        store.ts
        hooks.ts
      features/
        items/
          components/
            form/
              ItemForm.tsx
            list/
              ItemFilters.tsx
              ItemTable.tsx
            shared/
              ConfirmDialog.tsx
          hooks/
            useItemsList.ts
          pages/
            ItemCreatePage.tsx
            ItemDetailPage.tsx
            ItemEditPage.tsx
            ItemListPage.tsx
          services/
            itemService.ts
          store/
            itemSelectors.ts
            itemSlice.ts
            itemThunks.ts
          types/
            item.types.ts
  docs/
    01-overview.md
    02-database-and-model.md
    03-backend-read-flow.md
    04-backend-create-flow.md
    05-backend-update-flow.md
    06-backend-delete-status-flow.md
    07-frontend-form-design.md
    08-redux-mutations.md
    09-table-actions-and-filters.md
    10-end-to-end-crud-traces.md
    11-how-this-maps-to-the-real-app.md
    12-exercises.md
```

## Verification
1. Backend: `cd learning-bookingapp/02-items-basic/backend && npm install`.
2. Configure `.env` with the Neon branch connection string for `02-items-basic`.
3. Run Prisma migration/generate/seed: `npx prisma migrate dev && npx prisma db seed`.
4. Run backend dev server and verify:
   - `GET /api/v1/items`
   - `GET /api/v1/items?search=chair`
   - `GET /api/v1/items?code=9983`
   - `GET /api/v1/items?status=active`
   - `GET /api/v1/items?itemType=service`
   - `GET /api/v1/items/:id`
   - `POST /api/v1/items`
   - `PUT /api/v1/items/:id`
   - `PATCH /api/v1/items/:id/status`
   - optional `DELETE /api/v1/items/:id`
5. Confirm HSN/SAC behavior:
   - goods items can store and update HSN codes
   - service items can store and update SAC codes
   - the list table displays both fields
   - the `code` filter searches both fields
6. Frontend: `cd learning-bookingapp/02-items-basic/frontend && npm install && npm run build`.
7. Run frontend against backend and verify:
   - list loads through `fetchItems`
   - filters dispatch Redux actions and re-fetch data
   - create page dispatches `createItem`
   - edit page loads `fetchItemById` and dispatches `updateItem`
   - detail page shows HSN/SAC and status
   - inactivate/reactivate dispatches `setItemStatus`
8. Use Redux DevTools to confirm mutation lifecycle actions:
   - `items/fetchItems/pending|fulfilled|rejected`
   - `items/fetchItemById/pending|fulfilled|rejected`
   - `items/createItem/pending|fulfilled|rejected`
   - `items/updateItem/pending|fulfilled|rejected`
   - `items/setItemStatus/pending|fulfilled|rejected`
9. Read docs in order as a junior developer and confirm every command, endpoint, filename, and UI label matches the created module.
10. Compare the final learning files to the referenced production BookingApp files and confirm `11-how-this-maps-to-the-real-app.md` accurately explains the relationship.

## Scope boundaries
- Included: CRUD, detail page, list search/filter, HSN/SAC display/edit/code search, status-based inactivation/reactivation, optional hard delete, layered backend, Redux Toolkit frontend, TanStack Table, numbered docs.
- Excluded: auth, role permissions, org scoping, audit logs, accounts, units, vendors, image upload, CSV import/export, advanced tax logic, inventory behavior, hybrid client/server pagination, production-level validation services.
- Keep the code small enough for juniors to read in one sitting, but structurally faithful enough that the real BookingApp Items feature feels familiar afterward.

## Roadmap after module 02
- `03-search-refinements` — debounce, multi-field filters, sorting, richer pagination UI.
- `04-auth-basics` — login, JWT, and `requireAuthentication` middleware concept.
- `05-multi-tenancy` — orgId scoping and `requestContext` pattern.
- `06-relations-units` — introduce Unit relation and Prisma joins.
- `07-accounts-and-postings` — simplified accounting posting concepts.
- `08-file-uploads` — image upload for items.
- `09-testing` — backend and frontend testing conventions.