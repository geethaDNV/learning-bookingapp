# 11 - How This Maps To The Real App

This module is a smaller version of the real BookKeepingApp Items feature. The goal is recognition: when you open the production code, the shape should feel familiar.

## Backend mapping

| Learning file | Production equivalent | What production adds |
| --- | --- | --- |
| [../backend/prisma/schema.prisma](../backend/prisma/schema.prisma) | [../../../BookKeepingApp/backend/prisma/schema.prisma](../../../BookKeepingApp/backend/prisma/schema.prisma) | many more item fields, relations, tax fields, image fields, org scoping |
| [../backend/src/routes/items.ts](../backend/src/routes/items.ts) | [../../../BookKeepingApp/backend/routes/items/items.ts](../../../BookKeepingApp/backend/routes/items/items.ts) | authentication, role checks, import/export, image routes, extra helpers |
| [../backend/src/controllers/itemsController.ts](../backend/src/controllers/itemsController.ts) | [../../../BookKeepingApp/backend/controllers/items/itemsController.ts](../../../BookKeepingApp/backend/controllers/items/itemsController.ts) | request context, audit logs, DTO mapping, more endpoints |
| [../backend/src/services/itemService.ts](../backend/src/services/itemService.ts) | [../../../BookKeepingApp/backend/services/items/itemService.ts](../../../BookKeepingApp/backend/services/items/itemService.ts) | orgId, reference validation, account/unit/vendor checks, import/export logic |
| [../backend/src/repositories/itemRepository.ts](../backend/src/repositories/itemRepository.ts) | [../../../BookKeepingApp/backend/repositories/items/itemRepository.ts](../../../BookKeepingApp/backend/repositories/items/itemRepository.ts) | shared base repository, includes, org-scoped uniqueness, more filters |
| [../backend/src/schemas/itemSchemas.ts](../backend/src/schemas/itemSchemas.ts) | [../../../BookKeepingApp/backend/schemas/items/itemSchemas.ts](../../../BookKeepingApp/backend/schemas/items/itemSchemas.ts) | conditional rules, richer create/update payloads, image/import schemas |

## Frontend mapping

| Learning file | Production equivalent | What production adds |
| --- | --- | --- |
| [../frontend/src/features/items/store/itemSlice.ts](../frontend/src/features/items/store/itemSlice.ts) | [../../../BookKeepingApp/frontend/src/features/items/store/itemSlice.ts](../../../BookKeepingApp/frontend/src/features/items/store/itemSlice.ts) | more mutation states, import summaries, success/error paths |
| [../frontend/src/features/items/store/itemThunks.ts](../frontend/src/features/items/store/itemThunks.ts) | [../../../BookKeepingApp/frontend/src/features/items/store/itemThunks.ts](../../../BookKeepingApp/frontend/src/features/items/store/itemThunks.ts) | image upload, import/export, activate/inactivate helpers, SKU generation |
| [../frontend/src/features/items/services/itemService.ts](../frontend/src/features/items/services/itemService.ts) | [../../../BookKeepingApp/frontend/src/features/items/services/itemService.ts](../../../BookKeepingApp/frontend/src/features/items/services/itemService.ts) | axios client, auth handling, file upload, export download handling |
| [../frontend/src/features/items/pages/ItemListPage.tsx](../frontend/src/features/items/pages/ItemListPage.tsx) | [../../../BookKeepingApp/frontend/src/features/items/pages/ItemListPage.tsx](../../../BookKeepingApp/frontend/src/features/items/pages/ItemListPage.tsx) | hybrid query hook, more filters, richer actions, shared UI components |
| [../frontend/src/features/items/components/form/ItemForm.tsx](../frontend/src/features/items/components/form/ItemForm.tsx) | [../../../BookKeepingApp/frontend/src/features/items/pages/ItemFormPage.tsx](../../../BookKeepingApp/frontend/src/features/items/pages/ItemFormPage.tsx) | sectioned form, reference dropdowns, tax and inventory fields |
| [../frontend/src/features/items/components/list/ItemTable.tsx](../frontend/src/features/items/components/list/ItemTable.tsx) | [../../../BookKeepingApp/frontend/src/features/items/components/list/ItemTable.tsx](../../../BookKeepingApp/frontend/src/features/items/components/list/ItemTable.tsx) | row selection, images, sorting, shared table primitives |

## Key mental model

The learning app gives you the skeleton. The production app adds muscles: permissions, tenant safety, business validation, relationships, and operational workflows.

Read production in this order:

1. backend schema
2. backend repository
3. backend service
4. backend controller
5. backend routes
6. frontend service
7. frontend thunks
8. frontend slice
9. frontend pages and components

Continue to [12-exercises.md](./12-exercises.md).
