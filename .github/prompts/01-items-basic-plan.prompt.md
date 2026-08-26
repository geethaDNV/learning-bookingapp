# Plan: Learning Bookingapp — Module 01 Items Basic

## Goal
Build `learning-bookingapp/01-items-basic/{backend,frontend}` as a fully isolated, runnable mini-version of the Items feature (list + search by name/status) from `bookingapp`, replicating the real layered architecture but trimmed to a few fields, with numbered wiki-ready docs. Then list a roadmap of future numbered modules.

## Decisions (confirmed with user)
- Fields: `id`, `name`, `sku`, `itemType` (goods/service), `hsnCode`, `sacCode`, `isActive`. HSN/SAC columns exist now (avoids a migration in the future CRUD module) but are **not** searchable/filterable in module 01 — search stays scoped to name+status; hsn/sac search is deferred to a later module (CRUD or search-refinements).
- Backend layering: full (routes → controller → service → repository → prisma), trimmed — teaches the real pattern, no auth/tenant scoping/audit logging.
- No auth/orgId in module 01.
- Each module is fully isolated: own `package.json`, own `prisma/schema.prisma`, own DB.
- DB engine: **Postgres via Neon** (cloud, no local docker/install needed) — `.env` `DATABASE_URL` points to a Neon connection string. Docs instruct creating a **separate Neon branch per learning module** (e.g. branch `01-items-basic` off the Neon project) so modules stay isolated without spinning up new projects.
- No docker-compose file.
- Module folder shape: `01-items-basic/backend` and `01-items-basic/frontend` (mirrors main app split).
- Frontend uses **Redux Toolkit** for list state, matching production style but adapted: an `itemSlice` + `fetchItems` async thunk is dispatched (not a plain fetch hook) whenever search/status/page changes; component reads `items/total/loading/error` from the store via selectors. This mirrors "dispatch action to fetch data and search" as in the real app's mutation flow, applied here to the list-fetch flow since module 01 has no CRUD yet.
- Frontend uses **@tanstack/react-table** with basic column defs + built-in pagination (mirrors production `ItemTable.tsx`), no sorting yet.
- Docs: numbered markdown files inside `01-items-basic/docs/` read top-to-bottom, written to be wiki-publishable.
- Only module 01 fully planned now; future modules listed as a roadmap (names/numbers only).

## Reference patterns (from bookingapp, to replicate in trimmed form)
- Prisma model: [bookingapp/backend/prisma/schema.prisma](../../../bookingapp/backend/prisma/schema.prisma) `Item` model (lines ~459-536) — use subset: `id Int @id @default(autoincrement())`, `name String`, `sku String?`, `itemType String`, `hsnCode String?`, `sacCode String?`, `isActive Boolean @default(true)`, `createdAt`, `updatedAt`. Keep `@@unique([name])`, `@@index([name])`, `@@index([itemType])`, `@@index([isActive])`; drop orgId-scoped uniqueness (no multi-tenancy here). No index needed yet on hsnCode/sacCode (not queried until a later module).
- Routes: [bookingapp/backend/routes/items/items.ts](../../../bookingapp/backend/routes/items/items.ts) — pattern `router.get('/', asyncHandler(controller.getItems))` etc, but drop `requireAuthentication`/`requireRoles`.
- Controller: [bookingapp/backend/controllers/items/itemsController.ts](../../../bookingapp/backend/controllers/items/itemsController.ts) — thin orchestration: parseQuery → service.search → map to DTO → sendResponse. Drop `getRequestContext`/audit log calls.
- Service: [bookingapp/backend/services/items/itemService.ts](../../../bookingapp/backend/services/items/itemService.ts) — keep `search(query)` method; drop orgId param, drop client/server hybrid pagination strategy (too advanced) — just always paginate server-side.
- Repository: [bookingapp/backend/repositories/items/itemRepository.ts](../../../bookingapp/backend/repositories/items/itemRepository.ts) — `toItemWhereInput` pattern for building Prisma `where` from `search` (name/sku contains, insensitive) and `status` (isActive true/false). Keep this exact pattern since it's the core learning point. `hsnCode`/`sacCode` are selected/returned in the row shape but excluded from the `where` builder for now (commented note in code: "searchable from module 03 onward").
- Schemas: [bookingapp/backend/schemas/items/itemSchemas.ts](../../../bookingapp/backend/schemas/items/itemSchemas.ts) — Zod `listItemsQuerySchema` (page, pageSize, search, status) and a simple `createItemBodySchema` (name, sku, itemType, hsnCode, sacCode — create route included in module 01 purely to seed/demo data via API, full CRUD UI is module 02). Skip complex `.superRefine` conditional rules.
- Error handling: `asyncHandler` ([bookingapp/backend/middleware/asyncHandler.ts](../../../bookingapp/backend/middleware/asyncHandler.ts)) + `AppError` ([bookingapp/backend/errors/appError.ts](../../../bookingapp/backend/errors/appError.ts)) + central error middleware — copy trimmed versions.
- Response helpers: `sendResponse`/`sendPaginatedResponse` pattern from `utils/common/apiResponse.ts` — recreate a minimal version.
- Frontend: [bookingapp/frontend/src/features/items/pages/ItemListPage.tsx](../../../bookingapp/frontend/src/features/items/pages/ItemListPage.tsx), `ItemFilters.tsx`, `ItemTable.tsx`, `useItemQuery.ts`, `itemService.ts`, `apiClient.ts` — feature-based folder structure (`src/features/items/{pages,components,hooks,store,services,types}`), same as production. Key adaptation: instead of `useItemQuery`'s hand-rolled hybrid client/server fetch hook, module 01 uses **Redux Toolkit**: `store/itemSlice.ts` (state: `rows, total, page, pageSize, search, status, loading, error`) + `store/itemThunks.ts` (`fetchItems` async thunk calling `itemService.getItemList`) + `store/itemSelectors.ts`. `ItemsPage.tsx` dispatches `fetchItems` in a `useEffect` whenever `search`/`status`/`page` (local UI state or store state) changes, and reads list state via `useSelector`. Table rendering uses `@tanstack/react-table` (`createColumnHelper<Item>()`) with built-in pagination, mirroring `ItemTable.tsx`, no sorting yet. Skip the interceptor-based `apiClient` class — use a minimal `fetch`/`axios` wrapper instead.

## Steps

### Phase A — Backend module (`learning-bookingapp/01-items-basic/backend/`)
1. Scaffold `package.json` (express, @prisma/client, prisma, zod, cors, dotenv, typescript, ts-node-dev, @types/*), `tsconfig.json`.
2. `prisma/schema.prisma` — Postgres datasource (`DATABASE_URL` env pointing at Neon), trimmed `Item` model as above (incl. `hsnCode`/`sacCode`).
3. `prisma/seed.ts` — seed ~15-20 sample items with varied name/sku/itemType/hsnCode/sacCode/isActive for demoing search.
4. `src/db.ts` — PrismaClient singleton.
5. `src/errors/appError.ts` + `src/middleware/asyncHandler.ts` + `src/middleware/errorHandler.ts` — trimmed copies of the real patterns.
6. `src/utils/apiResponse.ts` — `sendResponse`, `sendPaginatedResponse`.
7. `src/schemas/itemSchemas.ts` — Zod: `listItemsQuerySchema` (page, pageSize, search, status), `createItemBodySchema` (name required, sku/hsnCode/sacCode optional, itemType via z.enum(['goods','service'])).
8. `src/repositories/itemRepository.ts` — `toItemWhereInput(filters)` (name/sku search + isActive status only), `findMany(filters, page, pageSize)`, `count(filters)`, `create(data)`.
9. `src/services/itemService.ts` — `search(query)` returns `{rows, total, page, pageSize}`; `create(payload)`.
10. `src/controllers/itemsController.ts` — `getItems`, `createItem`.
11. `src/routes/items.ts` + `src/app.ts`/`server.ts` — wire express app, cors, json, mount `/api/v1/items`, error middleware last.
12. `.env.example` with `DATABASE_URL="postgresql://<user>:<pass>@<neon-host>/<db>?sslmode=require"` (Neon connection string format, no docker).

### Phase B — Frontend module (`learning-bookingapp/01-items-basic/frontend/`) — *depends on Phase A for API contract, can be scaffolded in parallel*
1. Scaffold Vite + React + TS app, Tailwind configured (mirror minimal config from main frontend), install `@reduxjs/toolkit`, `react-redux`, `@tanstack/react-table`.
2. `src/features/items/types/item.types.ts` — `Item` interface (id, name, sku, itemType, hsnCode, sacCode, isActive, createdAt), `ItemListQuery`, `ItemListResponse`.
3. `src/services/api/apiClient.ts` — minimal fetch/axios wrapper, `API_BASE_URL` from `.env` (`VITE_API_BASE_URL`).
4. `src/features/items/services/itemService.ts` — class/module wrapping `apiClient`, `getItemList({search, status, page, pageSize})` calling `GET /items`.
5. `src/features/items/store/itemSlice.ts` — Redux Toolkit slice: state `{rows, total, page, pageSize, search, status, loading, error}`, reducers for `setSearch`/`setStatus`/`setPage`.
6. `src/features/items/store/itemThunks.ts` — `fetchItems` `createAsyncThunk` calling `itemService.getItemList`, handled in slice's `extraReducers` (pending/fulfilled/rejected).
7. `src/features/items/store/itemSelectors.ts` — selectors for rows/total/loading/filters.
8. `src/store/store.ts` (or `app/store.ts`) — root store combining `itemsReducer`, typed `RootState`/`AppDispatch`, `useAppDispatch`/`useAppSelector` hooks.
9. `src/features/items/hooks/useItemsList.ts` — thin hook wrapping `useAppDispatch`/`useAppSelector` + a `useEffect` that dispatches `fetchItems` whenever `search`/`status`/`page` in the store change (mirrors "dispatch action to fetch data and search").
10. `src/features/items/components/list/ItemFilters.tsx` — search text input + status `<select>` (all/active/inactive), dispatches `setSearch`/`setStatus`.
11. `src/features/items/components/list/ItemTable.tsx` — `@tanstack/react-table` `createColumnHelper<Item>()`, columns for name/sku/itemType/status badge, built-in pagination (page/pageSize wired to Redux `setPage`).
12. `src/features/items/pages/ItemListPage.tsx` — composes `ItemFilters` + `ItemTable`, uses `useItemsList`.
13. `src/App.tsx` — `<Provider store={store}>` wrapping `ItemListPage`.
14. `.env.example` with `VITE_API_BASE_URL=http://localhost:<port>/api/v1`.

### Phase C — Docs (`learning-bookingapp/01-items-basic/docs/`) — *depends on Phases A & B being finalized so code line references are accurate*
Numbered markdown files, each self-contained but building on the previous, written for direct wiki publish:
1. `01-overview.md` — what you'll build, prerequisites (Node, a free Neon account, basic TS/React/Redux knowledge), how this maps to the real `bookingapp` items feature (table of "learning file → production file" references).
2. `02-database-and-prisma.md` — create a Neon project + a dedicated branch for this module (e.g. branch name `01-items-basic`), copy the connection string into `.env`, `schema.prisma` walkthrough field-by-field (incl. why hsnCode/sacCode exist but aren't searchable yet), `prisma migrate dev`, `prisma db seed`, Prisma Studio.
3. `03-backend-architecture.md` — explain routes → controller → service → repository → prisma layering and *why*, walk through each file created in Phase A in order.
4. `04-backend-search-filtering.md` — deep dive on `toItemWhereInput`, how `search` becomes a Prisma `OR/contains` clause, how `status` becomes `isActive` boolean, pagination math (`skip`/`take`), explicit note on why hsn/sac search is deferred.
5. `05-running-and-testing-the-api.md` — run server, sample curl/Postman requests for list/search/create, expected JSON shapes.
6. `06-frontend-setup.md` — Vite/React/Tailwind/Redux Toolkit/react-table scaffold walkthrough, env config, connecting to backend (CORS note).
7. `07-frontend-redux-and-data-flow.md` — `itemSlice`/`itemThunks`/`useItemsList` walkthrough: how dispatching `fetchItems` flows through the thunk → service → API → back into the store → re-render.
8. `08-frontend-table-and-filters.md` — `ItemTable` (`@tanstack/react-table`) rendering + pagination, `ItemFilters` dispatching `setSearch`/`setStatus`, full end-to-end trace tying back to doc 04.
9. `09-exercises.md` — hands-on tasks for juniors: enable hsn/sac search end-to-end (schema already has fields → extend `toItemWhereInput` → extend query schema → add filter UI), add debounce to search, add sort-by-name, write one Jest/Vitest test.
10. `10-how-this-maps-to-the-real-app.md` — final "now it all makes sense" doc: side-by-side comparison of every simplified concept here vs. its full production counterpart in `bookingapp` (links to real files), so learners can graduate to reading the real codebase.

## Roadmap (future modules, names/numbers only — not detailed yet)
- `02-items-crud` — add update/delete, form validation, edit page.
- `03-search-refinements` — debounce, multi-field filters (itemType, sellable), sorting, pagination UI.
- `04-auth-basics` — introduce login, JWT, `requireAuthentication` middleware concept.
- `05-multi-tenancy` — orgId scoping, `requestContext` pattern.
- `06-relations-units` — introduce a related model (Unit) and Prisma relations/joins.
- `07-accounts-and-postings` — intro to the accounting posting engine concepts (simplified).
- `08-file-uploads` — image upload for items (multer + storage).
- `09-testing` — unit/integration testing conventions for backend and frontend.
- Naming/order may shift once module 01 is built and feedback gathered.

## Verification
1. Backend: `cd learning-bookingapp/01-items-basic/backend && npm install`, set `.env` `DATABASE_URL` to a Neon connection string, `npx prisma migrate dev && npx prisma db seed && npm run dev` — server starts, `GET /api/v1/items` returns seeded rows.
2. `curl "http://localhost:<port>/api/v1/items?search=chair&status=active"` — confirm filtering works per `toItemWhereInput` logic (only name/sku/status, not hsn/sac).
3. `cd ../frontend && npm install && npm run dev` — table renders seeded items via Redux (`fetchItems` dispatched on mount); typing in search box and toggling status dispatches `setSearch`/`setStatus` → re-triggers `fetchItems` → table updates; react-table pagination controls change page.
4. Confirm Redux DevTools shows `items/fetchItems/pending|fulfilled` actions firing on each filter change (validates the "dispatch action to fetch data and search" requirement).
5. Read through each numbered doc in order as a fresh junior dev would, confirm no missing steps/broken references, and that file/line references match actual created files.
6. Manually diff module 01's simplified files against the referenced production files to confirm the "maps to real app" doc (10) is accurate.

## Scope boundaries
- Included: list + search(name)/filter(status) + basic create endpoint, full but trimmed layered backend, Redux Toolkit + @tanstack/react-table frontend, Neon Postgres via Prisma, hsnCode/sacCode columns present (not searchable), numbered wiki docs, future roadmap list.
- Excluded (deferred to later modules per roadmap): auth, multi-tenancy/orgId, update/delete UI, hsn/sac search & other advanced tax/inventory fields, image upload, hybrid client/server pagination strategy, sorting, debounce, audit logging, docker/local Postgres setup.
