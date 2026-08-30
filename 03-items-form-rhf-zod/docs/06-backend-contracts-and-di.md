# Doc 06: Backend Contracts and Dependency Injection

## Why Interfaces Matter

### Without Interfaces (Tightly Coupled)

```typescript
// Bad: Service depends on concrete class
class ItemService {
  constructor() {
    this.repo = new ItemRepository(); // Hard-coded dependency
  }
}

// Problem: Can't test without real database
// Problem: Can't swap repository implementations
// Problem: Business logic and data access are coupled
```

### With Interfaces (Loosely Coupled)

```typescript
// Good: Service depends on interface
class ItemService {
  constructor(private repo: IItemRepository) {} // Interface injected
}

// Benefit: Can pass mock repository in tests
// Benefit: Can swap implementations anytime
// Benefit: Business logic is independent
```

## The ItemService Interface

Define what operations ItemService must provide:

```typescript
// backend/src/services/IItemService.ts
export interface IItemService {
  createItem(payload: CreateItemPayload): Promise<ItemResponse>;
  getItemById(id: number): Promise<ItemResponse>;
  updateItem(id: number, payload: UpdateItemPayload): Promise<ItemResponse>;
  deleteItem(id: number): Promise<void>;
  listItems(page: number, pageSize: number): Promise<ItemListResponse>;
}
```

Any class implementing this interface **must have these methods with matching signatures**.

```typescript
// backend/src/services/ItemService.ts
export class ItemService implements IItemService {
  constructor(private itemRepository: IItemRepository) {}

  async createItem(payload: CreateItemPayload): Promise<ItemResponse> {
    // Implementation...
  }

  async getItemById(id: number): Promise<ItemResponse> {
    // Implementation...
  }

  // ... rest of methods
}
```

## The ItemRepository Interface

Define what operations the repository must provide:

```typescript
// backend/src/repositories/IItemRepository.ts
export interface IItemRepository {
  create(payload: CreateItemPayload): Promise<Item>;
  findById(id: number): Promise<Item | null>;
  findByName(name: string): Promise<Item | null>;
  findBySku(sku: string): Promise<Item | null>;
  update(id: number, payload: UpdateItemPayload): Promise<Item>;
  delete(id: number): Promise<boolean>;
  list(page: number, pageSize: number): Promise<{ items: Item[]; total: number }>;
}
```

The Prisma-based implementation:

```typescript
// backend/src/repositories/ItemRepository.ts
export class ItemRepository implements IItemRepository {
  constructor(private db: PrismaClient) {}

  async create(payload: CreateItemPayload): Promise<Item> {
    return this.db.item.create({ data: payload });
  }

  // ... rest of methods
}
```

## Architecture Layers

```
HTTP Request
  ↓
ItemController (handles HTTP, delegates to service)
  ↓
ItemService (business logic: validation, rules)
  ↓
IItemRepository (interface: what operations are needed)
  ↓
ItemRepository (Prisma: actual database queries)
  ↓
Database
```

**Key principle**: Each layer depends on the layer below it **via interface**, not concrete class.

## Dependency Injection Container

The DI container is responsible for **wiring dependencies together**:

```typescript
// backend/src/di/types.ts
export interface Cradle {
  itemRepository: IItemRepository;
  itemService: IItemService;
}
```

The container defines what's available:

```typescript
// backend/src/di/container.ts
export class Container {
  static initialize(prisma: PrismaClient): Cradle {
    // Create instances
    const itemRepository = new ItemRepository(prisma);
    const itemService = new ItemService(itemRepository);
    const itemController = new ItemController(itemService);

    // Return container with all dependencies
    return {
      itemRepository,
      itemService,
      itemController,
    };
  }
}
```

## How Routes Use DI

```typescript
// backend/src/routes/items.ts
export function createItemRoutes(cradle: Cradle): Router {
  const router = Router();
  const controller = cradle.itemController;

  router.post('/', (req, res, next) => controller.create(req, res, next));
  router.get('/:id', (req, res, next) => controller.getById(req, res, next));

  return router;
}
```

In server.ts:

```typescript
// backend/src/server.ts
const prisma = new PrismaClient();
const cradle = Container.initialize(prisma); // Initialize DI

app.use('/items', createItemRoutes(cradle)); // Pass DI to routes
```

## Flow Diagram

```
Initialize:
  PrismaClient
    ↓
  ItemRepository (depends on PrismaClient)
    ↓
  ItemService (depends on IItemRepository)
    ↓
  ItemController (depends on IItemService)
    ↓
  Cradle { itemRepository, itemService, itemController }

Request comes in:
  Route
    ↓
  ItemController (resolved from cradle)
    ↓
  itemService.createItem()
    ↓
  itemRepository.create() (gets db from constructor)
    ↓
  Database
```

## Why This Matters

### 1. Testing

Without DI, testing is hard:

```typescript
// Can't test without database
const service = new ItemService(); // Hard-coded repository
```

With DI, testing is easy:

```typescript
// Create mock repository
const mockRepo: IItemRepository = {
  create: jest.fn().mockResolvedValue({ id: 1, ... }),
  findByName: jest.fn().mockResolvedValue(null),
  // ...
};

// Pass mock to service
const service = new ItemService(mockRepo);
await service.createItem({ ... }); // Uses mock
```

### 2. Flexibility

If you want to add caching:

```typescript
// Create cached repository
class CachedItemRepository implements IItemRepository {
  constructor(private repo: IItemRepository, private cache: Redis) {}

  async findById(id: number) {
    const cached = await this.cache.get(`item:${id}`);
    if (cached) return JSON.parse(cached);
    
    const item = await this.repo.findById(id);
    await this.cache.set(`item:${id}`, JSON.stringify(item));
    return item;
  }

  // ... delegate other methods to repo
}

// Update container
const itemRepository = new CachedItemRepository(
  new ItemRepository(prisma),
  redis
);
```

Service code doesn't change—it still receives `IItemRepository`.

### 3. Decoupling

Service doesn't care about Prisma, database, or caching. It only knows:

```typescript
constructor(private repo: IItemRepository) {}
```

This is clean, testable, and sustainable.

## Error Handling at Boundary

Controller catches errors and delegates to error middleware:

```typescript
// backend/src/controllers/ItemController.ts
async create(req: Request, res: Response, next: NextFunction) {
  try {
    const validatedData = createItemSchema.parse(req.body);
    const item = await this.itemService.createItem(validatedData);
    res.status(201).json(item);
  } catch (error) {
    next(error); // Pass to error middleware
  }
}
```

Error middleware handles all error types:

```typescript
// backend/src/middleware/errorHandler.ts
export function errorHandler(err, req, res, next) {
  if (err instanceof ZodError) {
    // Zod validation error
    res.status(400).json({ error: 'VALIDATION_ERROR', ... });
  } else if (err.code === 'DUPLICATE_NAME') {
    // Service threw duplicate error
    res.status(409).json({ error: 'DUPLICATE_NAME', ... });
  } else if (err instanceof AppError) {
    // Custom app error
    res.status(err.statusCode).json({ ... });
  } else {
    // Generic error
    res.status(500).json({ error: 'INTERNAL_ERROR', ... });
  }
}
```

## Contract Example: createItem

**Interface contract:**

```typescript
// IItemService says:
createItem(payload: CreateItemPayload): Promise<ItemResponse>;
```

**Implementation must:**
1. Accept exactly `CreateItemPayload` type
2. Return exactly `ItemResponse` type
3. Throw errors on duplicate name/SKU
4. Return item with generated id

**Consumer knows:**
- If it calls `createItem`, it will get a typed response
- It can handle errors with known error codes
- No surprises or undocumented behavior

## Typing the Cradle

The `Cradle` interface makes DI type-safe:

```typescript
export interface Cradle {
  itemRepository: IItemRepository; // Type-safe
  itemService: IItemService;       // Type-safe
}

// If you try to pass wrong type:
const cradle = {
  itemService: "wrong!" // ✗ TypeScript error
};

createItemRoutes(cradle); // Compilation fails
```

## Summary

| Aspect | Without DI | With DI |
|--------|-----------|---------|
| Testing | Need real database | Use mocks |
| Changes | Modify service and route | Add decorator/wrapper |
| Clarity | Implicit dependencies | Explicit in constructor |
| Coupling | High | Low |
| Swapping | Hard | Easy |
| Errors | Scattered | Centralized middleware |

## Next Step

Read [07-frontend-typing.md](07-frontend-typing.md) to see how frontend implements similar type safety.
