# 03 — Backend Architecture

## Why layers?

A single file that reads `req.query`, talks to Prisma, and writes the response would work — but it doesn't scale as features grow, and it's hard to test. The production app (and this module) splits responsibilities into four layers, each with one job:

```mermaid
graph LR
  A[Route] --> B[Controller]
  B --> C[Service]
  C --> D[Repository]
  D --> E[(Postgres via Prisma)]
```

| Layer | File | Job |
| --- | --- | --- |
| **Route** | `src/routes/items.ts` | Maps an HTTP verb + path to a controller method. No logic. |
| **Controller** | `src/controllers/itemsController.ts` | Parses/validates the request, calls the service, shapes the HTTP response. No business logic or database calls. |
| **Service** | `src/services/itemService.ts` | Business logic (e.g. "what counts as a duplicate item"). Calls the repository. No Express types, no direct Prisma calls. |
| **Repository** | `src/repositories/itemRepository.ts` | The *only* place that talks to Prisma. Translates filters into `where` clauses. |

This separation means: you can unit-test the service without spinning up Express; you can swap the repository's implementation (e.g. add caching) without touching the controller; and each file stays small and focused.

## Class-based, constructor-injected — like the real app

Every layer here is a class, and each class takes its dependency as a constructor parameter with a default:

```ts
// src/services/itemService.ts
export class ItemService {
  constructor(private readonly itemRepository: ItemRepository = new ItemRepository()) {}
  ...
}
```

```ts
// src/controllers/itemsController.ts
export class ItemsController {
  constructor(private readonly itemService: ItemService = new ItemService()) {}
  ...
}
```

This mirrors `bookingapp/backend/services/items/itemService.ts` and `bookingapp/backend/controllers/items/itemsController.ts` exactly. The default parameter means routes can just write `new ItemsController()` for normal use, while tests can pass in a fake repository/service instead — no framework needed for that flexibility.

## Wiring it together

[`src/routes/items.ts`](../backend/src/routes/items.ts):

```ts
const router = Router();
const itemsController = new ItemsController();

router.get('/', asyncHandler((req, res) => itemsController.getItems(req, res)));
router.post('/', asyncHandler((req, res) => itemsController.createItem(req, res)));
```

[`src/app.ts`](../backend/src/app.ts) mounts this router at `/api/v1/items` and registers the error-handling middleware last, so any error thrown (or rejected promise) anywhere in the chain ends up formatted consistently.

## Error handling

- [`src/middleware/asyncHandler.ts`](../backend/src/middleware/asyncHandler.ts) wraps every controller method. Express doesn't automatically catch rejected promises in async route handlers — this wrapper forwards them to `next(error)` so they reach the error middleware instead of crashing the process or hanging the request.
- [`src/errors/appError.ts`](../backend/src/errors/appError.ts) defines `AppError` (and `NotFoundError`/`ValidationError` subclasses) — throw these anywhere in the service/controller to produce a specific HTTP status + message.
- [`src/middleware/errorHandler.ts`](../backend/src/middleware/errorHandler.ts) is the single place that turns a thrown error (Zod validation error, `AppError`, or anything unexpected) into a JSON response.

## Response shape

[`src/utils/apiResponse.ts`](../backend/src/utils/apiResponse.ts) gives every endpoint a consistent envelope:

```json
{
  "message": "Items fetched successfully",
  "data": [ /* items */ ],
  "pagination": { "total": 18, "page": 1, "pageSize": 10, "totalPages": 2 }
}
```

Continue to [04-backend-search-filtering.md](./04-backend-search-filtering.md).
