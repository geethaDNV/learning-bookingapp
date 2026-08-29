# 03 - Backend Read Flow

The read flow has two endpoints:

- `GET /api/v1/items`
- `GET /api/v1/items/:id`

## Route

Open [../backend/src/routes/items.ts](../backend/src/routes/items.ts).

Routes do not contain business logic. They connect HTTP methods and paths to controller methods:

```ts
router.get('/', asyncHandler((req, res) => itemsController.getItems(req, res)));
router.get('/:id', asyncHandler((req, res) => itemsController.getItem(req, res)));
```

`asyncHandler` forwards thrown errors to the central error middleware.

## Controller

Open [../backend/src/controllers/itemsController.ts](../backend/src/controllers/itemsController.ts).

`getItems` parses query parameters with Zod, calls the service, and returns a paginated response.

`getItem` parses `id` from route params, calls the service, and returns one item.

The controller is thin on purpose. It should not know how Prisma filters are built.

## Service

Open [../backend/src/services/itemService.ts](../backend/src/services/itemService.ts).

`search(query)` converts parsed query values into repository filters and asks the repository for two things:

- current page rows
- total matching count

`getById(id)` owns the not-found rule. If the repository returns nothing, the service throws `NotFoundError`.

## Repository

Open [../backend/src/repositories/itemRepository.ts](../backend/src/repositories/itemRepository.ts).

The repository is the only layer that talks directly to Prisma. It contains the important `toItemWhereInput(filters)` function.

For module 02, the filters are:

- `search`: checks `name`, `sku`, `hsnCode`, and `sacCode`
- `code`: checks only `hsnCode` and `sacCode`
- `status`: maps to `isActive`
- `itemType`: maps to `goods` or `service`

## Try it

```bash
curl "http://localhost:4002/api/v1/items"
curl "http://localhost:4002/api/v1/items?search=chair"
curl "http://localhost:4002/api/v1/items?code=9983"
curl "http://localhost:4002/api/v1/items?status=inactive"
curl "http://localhost:4002/api/v1/items?itemType=goods"
curl "http://localhost:4002/api/v1/items/1"
```

Continue to [04-backend-create-flow.md](./04-backend-create-flow.md).
