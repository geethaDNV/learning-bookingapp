# 04 - Backend Create Flow

The create endpoint is:

```http
POST /api/v1/items
```

## Request body

Open [../backend/src/schemas/itemSchemas.ts](../backend/src/schemas/itemSchemas.ts).

`createItemBodySchema` accepts:

- `name` - required
- `sku` - optional
- `itemType` - `goods` or `service`
- `hsnCode` - optional
- `sacCode` - optional
- `isActive` - optional, defaults to `true`

Empty optional strings are converted to `null`. That matters because forms often send an empty string when a user clears a field.

## Controller

In [../backend/src/controllers/itemsController.ts](../backend/src/controllers/itemsController.ts), `createItem` does three things:

1. Parse `req.body` with `createItemBodySchema`.
2. Call `itemService.create(body)`.
3. Send a `201` response.

## Service

In [../backend/src/services/itemService.ts](../backend/src/services/itemService.ts), `create(payload)` owns the duplicate checks:

- item name must not already exist
- SKU must not already exist when provided

This is business logic, so it belongs in the service layer instead of the controller.

## Repository

In [../backend/src/repositories/itemRepository.ts](../backend/src/repositories/itemRepository.ts), `create(data)` is small:

```ts
return prisma.item.create({ data });
```

The repository should stay close to database operations.

## Try it

```bash
curl -X POST "http://localhost:4002/api/v1/items" \
  -H "Content-Type: application/json" \
  -d '{"name":"Accounting Review","sku":"SVC-100","itemType":"service","sacCode":"9982"}'
```

Then confirm it appears in the list:

```bash
curl "http://localhost:4002/api/v1/items?search=Accounting"
```

Continue to [05-backend-update-flow.md](./05-backend-update-flow.md).
