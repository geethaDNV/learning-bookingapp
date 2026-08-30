# Doc 09: How This Maps to Production

## Overview

Module 03 is a **simplified version** of production BookKeepingApp. This doc shows where module patterns appear in production.

## Backend Mapping

### Module 03 Backend Structure

```
03-items-form-rhf-zod/backend/src/
├── controllers/ItemController.ts
├── services/ItemService.ts + IItemService.ts
├── repositories/ItemRepository.ts + IItemRepository.ts
├── di/container.ts + types.ts
├── schemas/itemSchemas.ts
└── server.ts
```

### Production BookKeepingApp Backend Structure

```
BookKeepingApp/backend/
├── controllers/
│   ├── items/       (module-specific)
│   ├── invoices/
│   └── ...
├── services/
│   ├── items/
│   └── ...
├── repositories/
│   ├── items/
│   └── ...
├── di/
│   ├── container.ts         (same pattern)
│   ├── types.ts             (same pattern)
│   ├── accounting.ts        (specialized DI)
│   └── ...                  (more complex)
├── schemas/
│   ├── itemSchemas.ts
│   └── ...
└── server.ts
```

**Key difference**: Production is organized by **domain** (items, invoices, etc.) with nested folders. Module 03 is flat because it only has Items.

### Service Layer Comparison

**Module 03:**
```typescript
// backend/src/services/ItemService.ts
class ItemService implements IItemService {
  constructor(private itemRepository: IItemRepository) {}
  
  async createItem(payload) { ... }
  async updateItem(id, payload) { ... }
}
```

**Production:**
```typescript
// BookKeepingApp/backend/services/items/ItemService.ts
class ItemService implements IItemService {
  constructor(
    private itemRepository: IItemRepository,
    private auditService: IAuditService,
    private eventBus: IEventBus,
  ) {}
  
  async createItem(payload) {
    // Audit who created what
    // Emit events for other services
    // Validate with tax rules
    // Return with organization context
  }
}
```

**Pattern is identical**: Interface-based, constructor injection, type-safe.

### Error Handling

**Module 03:**
```typescript
// backend/src/errors/appError.ts
export class AppError extends Error { ... }
export class ValidationError extends AppError { ... }
export class DuplicateError extends AppError { ... }
```

**Production:**
Uses same pattern with more error types (AuthError, PermissionError, etc.).

### Zod Schemas

**Module 03:**
```typescript
// backend/src/schemas/itemSchemas.ts
export const createItemSchema = z.object({
  name: z.string().min(1),
  // ...
});
```

**Production:**
Same pattern, but also validates:
- Org-specific rules (e.g., SKU format by company)
- Tax compliance (HSN/SAC requirements)
- Permissions (who can create items)

## Frontend Mapping

### Module 03 Frontend Structure

```
03-items-form-rhf-zod/frontend/src/
├── features/items/
│   ├── components/ItemForm.tsx
│   ├── pages/
│   │   ├── ItemListPage.tsx
│   │   ├── ItemCreatePage.tsx
│   │   └── ItemEditPage.tsx
│   └── schemas/itemValidation.ts
├── store/
│   ├── itemsSlice.ts
│   ├── itemThunks.ts
│   └── index.ts
├── services/itemService.ts
├── hooks/redux.ts
├── types/index.ts
└── App.tsx
```

### Production BookKeepingApp Frontend Structure

```
BookKeepingApp/frontend/src/
├── features/
│   ├── items/
│   │   ├── components/
│   │   │   ├── form/
│   │   │   │   ├── sections/      (split form into pieces)
│   │   │   │   └── ItemForm.tsx
│   │   │   └── ItemTable.tsx
│   │   ├── pages/
│   │   │   ├── ItemListPage.tsx
│   │   │   ├── ItemCreatePage.tsx
│   │   │   └── ItemEditPage.tsx
│   │   └── schemas/itemValidation.ts
│   └── [other domains]
├── store/
│   ├── itemsSlice.ts
│   ├── itemThunks.ts
│   └── ...
├── services/itemService.ts
├── hooks/...
├── types/...
└── App.tsx
```

**Key difference**: Production breaks complex forms into **sections** (e.g., BasicInfo, TaxInfo, PricingInfo).

### Form Component Comparison

**Module 03: Single Component**
```typescript
// ItemForm.tsx - handles all fields in one component
export function ItemForm({ onSubmit, ... }) {
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} />
      <input {...register('sku')} />
      <select {...register('itemType')} />
      <input {...register('hsnCode')} />
      <input {...register('sacCode')} />
      <input {...register('isActive')} />
    </form>
  );
}
```

**Production: Multiple Sections**
```typescript
// features/items/components/form/ItemForm.tsx
export function ItemForm({ onSubmit, ... }) {
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <BasicInfoSection control={control} />
      <TaxInfoSection control={control} />
      <PricingSection control={control} />
      <WarehouseSection control={control} />
    </form>
  );
}

// features/items/components/form/sections/BasicInfoSection.tsx
export function BasicInfoSection({ control }) {
  return (
    <>
      <Controller control={control} name="name" render={...} />
      <Controller control={control} name="sku" render={...} />
    </>
  );
}
```

**Why split?**
- Each section can have complex logic
- Reusable across different forms
- Easier to test
- Better maintainability

### Redux Structure

**Module 03:**
```typescript
// itemsSlice.ts
export interface ItemsState {
  list: Item[];
  currentItem: Item | null;
  loading: boolean;
  error: ApiError | null;
  submitError: ApiError | null;
  pagination: { ... };
}
```

**Production:**
```typescript
// itemsSlice.ts
export interface ItemsState {
  // List page state
  list: Item[];
  pagination: { ... };
  filters: ItemFilters;
  sorting: SortState;
  loading: boolean;
  error: ApiError | null;

  // Detail/Form page state
  detail: Item | null;
  
  // Form submission state
  formSubmitting: boolean;
  formError: ApiError | null;
  formSuccess: boolean;
  
  // Other UI state
  selectedIds: number[];
  bulkAction: BulkAction | null;
}
```

More state to handle more features (filters, bulk actions, etc.).

### Types

**Module 03:**
```typescript
// types/index.ts
export interface Item { ... }
export interface CreateItemPayload { ... }
export interface ItemListResponse { ... }
```

**Production:**
```typescript
// types/Item.ts
export interface Item { ... }

// types/ItemPayloads.ts
export interface CreateItemPayload { ... }
export interface UpdateItemPayload { ... }

// types/ItemFilters.ts
export interface ItemFilters { ... }

// types/ItemResponses.ts
export interface ItemResponse { ... }
export interface ItemListResponse { ... }
```

Split by concern for better organization.

## Common Production Patterns

### 1. Nested Resources

**Module 03:**
```
/items
/items/:id
```

**Production:**
```
/organizations/:orgId/items
/organizations/:orgId/items/:itemId
/organizations/:orgId/items/:itemId/edit
/organizations/:orgId/items/:itemId/pricing
```

Organization context is part of routing.

### 2. Validation Middleware

**Module 03:**
```typescript
// Controller validates with Zod
const validatedData = schema.parse(req.body);
```

**Production:**
```typescript
// Middleware validates before reaching controller
app.post('/items', validateRequest(createItemSchema), itemController.create);
```

Centralizes validation logic.

### 3. Pagination & Filtering

**Module 03:**
```typescript
listItems(page: number, pageSize: number)
```

**Production:**
```typescript
listItems(page, pageSize, filters, sortBy, sortOrder)
```

Supports complex queries.

### 4. Permissions & Tenancy

**Module 03:**
None. Items are global.

**Production:**
```typescript
// Every query is scoped to organization
async createItem(payload, context: RequestContext) {
  // Only create in user's organization
  const item = await repo.create({
    ...payload,
    organizationId: context.organization.id
  });
}
```

Ensures data isolation.

### 5. Audit Trail

**Module 03:**
Timestamps only (createdAt, updatedAt).

**Production:**
```typescript
async createItem(payload, context) {
  // Create item
  const item = await repo.create(payload);
  
  // Log who created what
  await auditLog.record({
    entityId: item.id,
    action: 'CREATE',
    userId: context.user.id,
    changes: payload,
    timestamp: new Date()
  });
}
```

## Learning Path

1. **Start here**: Module 03 (simplified, focused)
2. **Study next**: Specific production features
   - Look at ItemService in production
   - See how pagination works
   - Study form sections
3. **Trace**: Follow a production API call end-to-end
4. **Extend**: Add permissions, filters, audit trail to module 03

## Key Insight

Module 03 is **production-grade in architecture** but **simplified in scope**. The patterns are identical:

- ✓ Interface-based services
- ✓ Constructor injection
- ✓ Zod validation
- ✓ Typed Redux
- ✓ Separated concerns

What's different is **complexity**: production has more features, more edge cases, more integrations.

But the fundamentals are the same. If you understand this module, you can navigate production code.

## Next Step

Read [10-exercises.md](10-exercises.md) for ways to extend this module toward production.
