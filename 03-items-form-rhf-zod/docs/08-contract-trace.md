# Doc 08: Contract Trace - Following a Field Through the System

## The Journey of `name: "Laptop"`

Let's trace the field `name` from the user typing it to it being stored in the database.

### Frontend: User Types

```typescript
// User types in ItemForm input
<input {...register('name')} />
// User enters: "Laptop"

// React Hook Form tracks this value uncontrolled
// No re-render triggered (performance!)
```

### Frontend: Form Validates (Zod)

```typescript
// frontend/src/features/items/schemas/itemValidation.ts
const itemFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(255, 'Name must be 255 characters or less'),
  // ... other fields
});

// When user submits, React Hook Form calls zodResolver
const result = itemFormSchema.parse({
  name: "Laptop",
  sku: "LAP-001",
  itemType: "GOODS",
  // ...
});

// ✓ Validation passes, "Laptop" is valid
```

TypeScript knows:

```typescript
type ItemFormValues = z.infer<typeof itemFormSchema>;
// ItemFormValues.name: string (non-empty, ≤255 chars)
```

### Frontend: Component Handler

```typescript
// frontend/src/features/items/pages/ItemCreatePage.tsx
const handleSubmit = async (values: ItemFormValues) => {
  // values.name is typed as: string (from Zod)
  // values.name = "Laptop"

  const payload = formValuesToPayload(values);
  // Converts form values to API payload
  
  const result = await dispatch(createItemThunk(payload));
};
```

### Frontend: Thunk Dispatch

```typescript
// frontend/src/store/itemThunks.ts
export const createItemThunk = createAsyncThunk<
  Item,                  // Response type
  CreateItemPayload,     // Argument type ← payload is this type
  { rejectValue: ApiError }
>(
  'items/createItem',
  async (payload, { rejectWithValue }) => {
    // payload: CreateItemPayload
    // payload.name: string
    // payload.name = "Laptop"

    return await itemService.createItem(payload);
  }
);
```

TypeScript knows:

```typescript
type CreateItemPayload = {
  name: string;
  sku: string;
  itemType: string;
  hsnCode?: string | null;
  sacCode?: string | null;
  isActive?: boolean;
};
```

### Frontend: API Call

```typescript
// frontend/src/services/itemService.ts
export async function createItem(payload: CreateItemPayload): Promise<Item> {
  // payload.name = "Laptop"

  const response = await fetch('/api/items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    // JSON: { "name": "Laptop", "sku": "LAP-001", ... }
  });

  if (!response.ok) {
    throw await response.json();
  }

  return response.json(); // Returns Item
}
```

**HTTP Request Body:**
```json
{
  "name": "Laptop",
  "sku": "LAP-001",
  "itemType": "GOODS",
  "isActive": true
}
```

### Backend: Express Receives Request

```typescript
// backend/src/server.ts
app.post('/items', (req, res) => {
  // req.body.name = "Laptop"
  // (string, raw from JSON)
});
```

### Backend: Zod Validates

```typescript
// backend/src/schemas/itemSchemas.ts
export const createItemSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(255, 'Name must be 255 characters or less'),
  // ... other fields
});

// backend/src/controllers/ItemController.ts
async create(req: Request, res: Response, next: NextFunction) {
  try {
    const validatedData = createItemSchema.parse(req.body);
    // validatedData.name = "Laptop" (string, validated)
    
    const item = await this.itemService.createItem(validatedData);
    // ...
  } catch (error) {
    next(error);
  }
}
```

TypeScript knows:

```typescript
type CreateItemInput = z.infer<typeof createItemSchema>;
// CreateItemInput.name: string (non-empty, ≤255 chars)
```

### Backend: Service Logic

```typescript
// backend/src/services/ItemService.ts
async createItem(payload: CreateItemPayload): Promise<ItemResponse> {
  // payload.name = "Laptop"

  // Check for duplicate
  const existingByName = await this.itemRepository.findByName(payload.name);
  // Query: SELECT * FROM items WHERE name = 'Laptop'

  if (existingByName) {
    // name already taken, throw error
    throw new Error('Item with this name already exists');
  }

  // Name is unique, proceed
  const item = await this.itemRepository.create(payload);
  return this.mapToResponse(item);
}
```

### Backend: Repository Queries

```typescript
// backend/src/repositories/ItemRepository.ts
async findByName(name: string): Promise<Item | null> {
  // name = "Laptop"
  
  return this.db.item.findUnique({
    where: { name }, // name = "Laptop"
  });
}

async create(payload: CreateItemPayload): Promise<Item> {
  // payload.name = "Laptop"
  
  return this.db.item.create({
    data: {
      name: payload.name, // name = "Laptop"
      sku: payload.sku,
      itemType: payload.itemType,
      // ... other fields
    },
  });
}
```

### Backend: Prisma ORM

```typescript
// Prisma translates to SQL:
INSERT INTO items (name, sku, itemType, isActive, createdAt, updatedAt)
VALUES ('Laptop', 'LAP-001', 'GOODS', true, NOW(), NOW())
RETURNING *;
```

### Backend: Database Insert

PostgreSQL executes:

```sql
INSERT INTO items (
  name,
  sku,
  itemType,
  hsnCode,
  sacCode,
  isActive,
  createdAt,
  updatedAt
) VALUES (
  'Laptop',
  'LAP-001',
  'GOODS',
  NULL,
  NULL,
  true,
  '2025-08-30T10:30:00Z',
  '2025-08-30T10:30:00Z'
)
RETURNING *;
```

Database inserts row:

```
id    | name    | sku       | itemType | hsnCode | sacCode | isActive | createdAt | updatedAt
------|---------|-----------|----------|---------|---------|----------|-----------|----------
42    | Laptop  | LAP-001   | GOODS    | NULL    | NULL    | true     | 2025-08-30| 2025-08-30
```

### Backend: Response

```typescript
// Prisma returns inserted row
const item: Item = {
  id: 42,
  name: "Laptop", // ← Back from database
  sku: "LAP-001",
  itemType: "GOODS",
  hsnCode: null,
  sacCode: null,
  isActive: true,
  createdAt: "2025-08-30T10:30:00Z",
  updatedAt: "2025-08-30T10:30:00Z",
};

// Service maps to response DTO
return this.mapToResponse(item);
```

**HTTP Response:**
```json
{
  "id": 42,
  "name": "Laptop",
  "sku": "LAP-001",
  "itemType": "GOODS",
  "hsnCode": null,
  "sacCode": null,
  "isActive": true,
  "createdAt": "2025-08-30T10:30:00Z",
  "updatedAt": "2025-08-30T10:30:00Z"
}
```

### Frontend: Thunk Fulfilled

```typescript
// Redux processes successful response
createItemThunk.fulfilled dispatches

// itemsSlice.extraReducers
builder.addCase(createItemThunk.fulfilled, (state, action) => {
  state.loading = false;
  // action.payload.name = "Laptop" (from server)
});
```

### Frontend: Component Reflects

```typescript
// ItemCreatePage.tsx
if (result.type === createItemThunk.fulfilled.type) {
  navigate('/items'); // Redirect to list
}

// ItemListPage.tsx
const { list } = useAppSelector(state => state.items);
// list[0].name = "Laptop" (if we stored it)

// Render
{list.map(item => (
  <tr key={item.id}>
    <td>{item.name}</td> {/* "Laptop" displays */}
  </tr>
))}
```

## Type Safety at Each Step

```
User types "Laptop"
  ↓ (no type, raw string)
Zod validates → ItemFormValues { name: string }
  ↓
formValuesToPayload → CreateItemPayload { name: string }
  ↓
dispatch thunk → createItemThunk<Item, CreateItemPayload, ...>
  ↓
HTTP POST → JSON { "name": "Laptop" }
  ↓
Backend receives → { name: "Laptop" } (any type)
  ↓
Zod validates → CreateItemInput { name: string }
  ↓
Service → CreateItemPayload { name: string }
  ↓
Repository → name: string passed to create()
  ↓
SQL INSERT → 'Laptop' literal
  ↓
Database stores → CHAR/VARCHAR 'Laptop'
  ↓
SQL RETURNING → 'Laptop' back
  ↓
Prisma maps → Item { name: "Laptop" }
  ↓
Service returns → ItemResponse { name: "Laptop" }
  ↓
HTTP response → JSON { "name": "Laptop" }
  ↓
Frontend fetch → response.json(): Item
  ↓
Redux stores → state.items.list[0].name: "Laptop"
  ↓
Component renders → <td>{item.name}</td>
```

## Why This Matters

1. **Frontend mistakes caught immediately**
   - Type wrong field name? TypeScript error
   - Send wrong type? TypeScript error

2. **Backend security**
   - Even if frontend sends malicious data
   - Zod schema revalidates at boundary
   - Only valid data reaches service

3. **Refactoring confidence**
   - Change type of `name`?
   - All usages highlighted
   - No silent bugs

4. **Debugging**
   - Intermediate types documented in code
   - Can trace from UI to database
   - Know exactly what structure is expected

## Code Locations

- Form input: `frontend/src/features/items/components/ItemForm.tsx`
- Form schema: `frontend/src/features/items/schemas/itemValidation.ts`
- Create page: `frontend/src/features/items/pages/ItemCreatePage.tsx`
- Thunk: `frontend/src/store/itemThunks.ts`
- API service: `frontend/src/services/itemService.ts`
- Backend schema: `backend/src/schemas/itemSchemas.ts`
- Controller: `backend/src/controllers/ItemController.ts`
- Service: `backend/src/services/ItemService.ts`
- Repository: `backend/src/repositories/ItemRepository.ts`
- DB schema: `backend/prisma/schema.prisma`

## Key Insight

This contract is **self-documenting**. Anyone reading the code can follow the path from form input to database and see exactly what type is expected at each step.

## Next Step

Read [09-how-this-maps-to-production.md](09-how-this-maps-to-production.md) to see how this learning module relates to production code.
