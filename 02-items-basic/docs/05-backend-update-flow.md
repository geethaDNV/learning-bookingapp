# 05 - Backend Update Flow

The update endpoint is:

```http
PUT /api/v1/items/:id
```

## Why update is different from create

Create always needs a name and item type. Update can change one field or many fields.

That is why [../backend/src/schemas/itemSchemas.ts](../backend/src/schemas/itemSchemas.ts) has a separate `updateItemBodySchema`.

It allows these fields:

- `name`
- `sku`
- `itemType`
- `hsnCode`
- `sacCode`
- `isActive`

It also rejects an empty update object. A request like `{}` does not teach or change anything.

## Route params

The `id` comes from the URL. The controller validates it with `itemIdParamSchema` before calling the service.

## Duplicate checks

The service checks name and SKU collisions during update too.

The difference is that the current item is allowed to keep its own name and SKU. A duplicate is only a problem when the matching row belongs to a different item.

## HSN/SAC edits

This module treats HSN/SAC as normal editable fields. The form can add, change, or clear them.

Examples:

```bash
curl -X PUT "http://localhost:4002/api/v1/items/1" \
  -H "Content-Type: application/json" \
  -d '{"hsnCode":"9401","sacCode":null}'
```

```bash
curl -X PUT "http://localhost:4002/api/v1/items/7" \
  -H "Content-Type: application/json" \
  -d '{"name":"Consulting Hours - Remote","sacCode":"9983"}'
```

## Layer trace

```text
PUT /items/:id
  routes/items.ts
  controllers/itemsController.ts
  schemas/itemSchemas.ts
  services/itemService.ts
  repositories/itemRepository.ts
  Prisma item.update
```

Continue to [06-backend-delete-status-flow.md](./06-backend-delete-status-flow.md).
