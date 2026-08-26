# 10 — How This Maps to the Real App

You've now built a small, complete slice of the Items feature. This doc is the bridge to reading the real `bookingapp` codebase — for every simplified concept here, here's its full production counterpart, and *why* production needs the extra complexity.

## Backend

| Concept here | Production equivalent | What's added in production |
| --- | --- | --- |
| [`prisma/schema.prisma`](../backend/prisma/schema.prisma) — 8 fields | [`bookingapp/backend/prisma/schema.prisma`](../../../bookingapp/backend/prisma/schema.prisma) `Item` model — 30+ fields | Tax rates, sales/purchase pricing, inventory tracking, image storage, custom fields, tags, `orgId` for multi-tenancy, relations to `Vendor`/`Unit`/`Account` |
| [`itemRepository.ts`](../backend/src/repositories/itemRepository.ts) — `ItemRepository` class, plain methods | [`bookingapp/backend/repositories/items/itemRepository.ts`](../../../bookingapp/backend/repositories/items/itemRepository.ts) | Extends a shared `BaseRepository`; every query scoped by `orgId`; `include` clauses joining related accounts/vendor/unit |
| [`itemService.ts`](../backend/src/services/itemService.ts) — `search`/`create` | [`bookingapp/backend/services/items/itemService.ts`](../../../bookingapp/backend/services/items/itemService.ts) | `orgId` threaded through every call; reference validation (does this vendor/account actually exist?); a "client vs server" pagination strategy that returns *all* rows in one page for small orgs |
| [`itemsController.ts`](../backend/src/controllers/itemsController.ts) — `getItems`/`createItem` | [`bookingapp/backend/controllers/items/itemsController.ts`](../../../bookingapp/backend/controllers/items/itemsController.ts) | `getRequestContext(req)` for tenant/user identity; audit log entries on every mutation; full CRUD (`getItem`, `updateItem`, `deleteItem`, activate/inactivate, image upload, import/export) |
| [`items.ts`](../backend/src/routes/items.ts) — 2 routes, no middleware | [`bookingapp/backend/routes/items/items.ts`](../../../bookingapp/backend/routes/items/items.ts) | `requireAuthentication` + `requireRoles([...])` on every route; extra routes for SKU generation, code search, export/import, image CRUD |
| [`itemSchemas.ts`](../backend/src/schemas/itemSchemas.ts) — 2 simple Zod schemas | [`bookingapp/backend/schemas/items/itemSchemas.ts`](../../../bookingapp/backend/schemas/items/itemSchemas.ts) | `.superRefine` conditional rules (e.g. goods require `hsnCode`, `isSellable` requires a price + account); image data validation |

## Frontend

| Concept here | Production equivalent | What's added in production |
| --- | --- | --- |
| [`itemSlice.ts`](../frontend/src/features/items/store/itemSlice.ts) drives the whole list fetch | [`bookingapp/frontend/src/features/items/store/itemSlice.ts`](../../../bookingapp/frontend/src/features/items/store/itemSlice.ts) + [`useItemQuery.ts`](../../../bookingapp/frontend/src/features/items/hooks/useItemQuery.ts) | Redux is used for *mutations* (activate/inactivate/delete); the list itself is fetched by a hand-rolled hook with a hybrid client/server strategy and built-in 350ms debounce |
| [`ItemTable.tsx`](../frontend/src/features/items/components/list/ItemTable.tsx) — core row model only | [`bookingapp/frontend/src/features/items/components/list/ItemTable.tsx`](../../../bookingapp/frontend/src/features/items/components/list/ItemTable.tsx) | Sorting, row selection, and a shared `Table` UI primitive with built-in pagination controls |
| Plain Tailwind utility classes | CSS Modules (`*.module.scss`) per component | Production leans on a shared component library (`Button`, `Input`, `Select`, `Badge`, `ConfirmDialog`, etc.) instead of raw HTML elements |
| No auth | JWT-based auth + `requestContextMiddleware`, `apiClient`'s 401-refresh interceptor | Multi-tenant orgId scoping end-to-end |

## What to read next in the real codebase

Now that you know the shape of this feature, a good next step is opening these files side by side with what you built:

1. [`bookingapp/backend/services/items/itemService.ts`](../../../bookingapp/backend/services/items/itemService.ts) — see how `search()` handles the client/server pagination decision.
2. [`bookingapp/backend/repositories/items/itemRepository.ts`](../../../bookingapp/backend/repositories/items/itemRepository.ts) — see the fuller `toItemWhereInput` with `code`, `sellable`, `purchasable` filters.
3. [`bookingapp/frontend/src/features/items/hooks/useItemQuery.ts`](../../../bookingapp/frontend/src/features/items/hooks/useItemQuery.ts) — see the debounce and hybrid-mode logic this module deferred.

Then check the roadmap in the [module planning doc](../../.github/prompts/01-items-basic-plan.prompt.md) for what the next learning modules (CRUD, auth, multi-tenancy, and beyond) will cover.
