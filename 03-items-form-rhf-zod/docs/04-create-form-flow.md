# Doc 04: Create Form Flow - From Input to Database

## The Complete Journey

When a user clicks "Create Item", here's everything that happens:

```
User Input in Form
  ↓
handleSubmit validates with Zod schema
  ↓
validation passes → onSubmit called with validated data
  ↓
ItemCreatePage.handleSubmit() called
  ↓
formValuesToPayload() converts form values to API payload
  ↓
dispatch(createItemThunk(payload))
  ↓
createItemThunk.pending: Redux sets loading = true
  ↓
itemService.createItem(payload) makes POST /api/items
  ↓
Backend validates with Zod schema
  ↓
Service checks for duplicate name/SKU
  ↓
Repository inserts into database
  ↓
Response returns Item with id
  ↓
createItemThunk.fulfilled: Redux sets loading = false
  ↓
navigate('/items') redirects to list
```

## Step-by-Step Walkthrough

### Step 1: User Types in Form

```typescript
// User enters: name="Laptop", sku="LAP-001", itemType="GOODS"
<input {...register('name')} />
<input {...register('sku')} />
<select {...register('itemType')} />
```

React Hook Form tracks these values uncontrolled.

### Step 2: User Clicks Submit

```typescript
<button type="submit">Save Item</button>
```

This triggers `handleSubmit(onSubmit)`.

### Step 3: Zod Validates

The `zodResolver` runs the schema:

```typescript
itemFormSchema.parse({
  name: "Laptop",
  sku: "LAP-001",
  itemType: "GOODS",
  hsnCode: null,
  sacCode: null,
  isActive: true
})
```

If validation passes, proceed. If fails, show field errors and stop.

### Step 4: onSubmit Handler Called

```typescript
// ItemCreatePage.tsx
const handleSubmit = async (values: ItemFormValues) => {
  // values is fully typed and validated
  const payload = formValuesToPayload(values);
  // payload = {
  //   name: "Laptop",
  //   sku: "LAP-001",
  //   itemType: "GOODS",
  //   isActive: true
  // }
  
  const result = await dispatch(createItemThunk(payload));
  
  if (result.type === createItemThunk.fulfilled.type) {
    navigate('/items'); // Success!
  }
};
```

### Step 5: Redux Thunk Dispatched

```typescript
// Redux sets loading state
dispatch(createItemThunk(payload))

// In itemThunks.ts
export const createItemThunk = createAsyncThunk(
  'items/createItem',
  async (payload, { rejectWithValue }) => {
    try {
      return await itemService.createItem(payload);
    } catch (error) {
      return rejectWithValue(error); // Caught error
    }
  }
);
```

Redux transitions to `pending` state, setting `loading = true`.

### Step 6: API Call

```typescript
// itemService.ts
export async function createItem(payload: CreateItemPayload): Promise<Item> {
  const response = await fetch('/api/items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw error; // { error: 'DUPLICATE_NAME', message: '...' }
  }
  
  return response.json();
}
```

The frontend sends:
```json
{
  "name": "Laptop",
  "sku": "LAP-001",
  "itemType": "GOODS",
  "isActive": true
}
```

### Step 7: Backend Receives Request

```typescript
// ItemController.create()
async create(req: Request, res: Response, next: NextFunction) {
  try {
    // Validate with Zod
    const validatedData = createItemSchema.parse(req.body);
    
    // Call service
    const item = await this.itemService.createItem(validatedData);
    
    // Return created item
    res.status(201).json(item);
  } catch (error) {
    // Error middleware handles it
    next(error);
  }
}
```

### Step 8: Backend Validates Duplicates

```typescript
// ItemService.createItem()
async createItem(payload: CreateItemPayload): Promise<ItemResponse> {
  // Check for duplicate name
  const existingByName = await this.itemRepository.findByName(payload.name);
  if (existingByName) {
    const error = new Error('Item with this name already exists');
    (error as any).code = 'DUPLICATE_NAME';
    throw error; // Service throws
  }

  // Check for duplicate SKU
  const existingBySku = await this.itemRepository.findBySku(payload.sku);
  if (existingBySku) {
    const error = new Error('Item with this SKU already exists');
    (error as any).code = 'DUPLICATE_SKU';
    throw error;
  }

  // All checks passed, create
  const item = await this.itemRepository.create(payload);
  return this.mapToResponse(item);
}
```

### Step 9: Database Insert

```typescript
// ItemRepository.create()
async create(payload: CreateItemPayload): Promise<Item> {
  return this.db.item.create({
    data: {
      name: payload.name,
      sku: payload.sku,
      itemType: payload.itemType,
      hsnCode: payload.hsnCode || null,
      sacCode: payload.sacCode || null,
      isActive: payload.isActive !== false,
    },
  });
}
```

Prisma inserts:
```sql
INSERT INTO items (name, sku, itemType, hsnCode, sacCode, isActive, createdAt, updatedAt)
VALUES ('Laptop', 'LAP-001', 'GOODS', NULL, NULL, true, NOW(), NOW())
```

### Step 10: Response Returns

```typescript
// Backend returns Item with generated id
{
  id: 42,
  name: "Laptop",
  sku: "LAP-001",
  itemType: "GOODS",
  hsnCode: null,
  sacCode: null,
  isActive: true,
  createdAt: "2025-08-30T10:30:00.000Z",
  updatedAt: "2025-08-30T10:30:00.000Z"
}
```

### Step 11: Redux Fulfilled

```typescript
// Redux recognizes response success
createItemThunk.fulfilled dispatches
  → itemsSlice.extraReducers handles it
  → Sets loading = false
  → Sets submitError = null
  → (Note: We don't add to list, let create page navigate)
```

### Step 12: Navigate to List

```typescript
if (result.type === createItemThunk.fulfilled.type) {
  navigate('/items'); // User sees list page
}
```

User sees newly created item in the list!

## Error Scenario: Duplicate Name

What if user tries to create an item with a name that already exists?

```
User submits form with name="Laptop" (already exists)
  ↓
Frontend Zod validates (passes, doesn't know about database)
  ↓
onSubmit dispatches thunk
  ↓
API request sent: POST /api/items
  ↓
Backend Zod validates (passes, schema is generic)
  ↓
Service checks findByName('Laptop')
  ↓
Found! Throws error with code 'DUPLICATE_NAME'
  ↓
errorHandler middleware catches it
  ↓
Responds: { error: 'DUPLICATE_NAME', statusCode: 409, message: '...' }
  ↓
Frontend itemService throws error
  ↓
createItemThunk.rejected catches it
  ↓
Sets state: submitError = { error: 'DUPLICATE_NAME', message: '...' }
  ↓
ItemForm displays submitError banner
  ↓
User sees "Item with this name already exists"
```

## Code Locations

- **User clicks submit**: `frontend/src/features/items/components/ItemForm.tsx`
- **Form validation**: `frontend/src/features/items/schemas/itemValidation.ts`
- **Thunk dispatch**: `frontend/src/features/items/pages/ItemCreatePage.tsx`
- **Redux thunk**: `frontend/src/store/itemThunks.ts`
- **API call**: `frontend/src/services/itemService.ts`
- **Backend validation**: `backend/src/schemas/itemSchemas.ts`
- **Service logic**: `backend/src/services/ItemService.ts`
- **Database query**: `backend/src/repositories/ItemRepository.ts`
- **Error handling**: `backend/src/middleware/errorHandler.ts`

## Key Insights

1. **Frontend validation is UX**: Catches errors before server roundtrip
2. **Backend validation is security**: Never trust the client
3. **Error propagation**: Backend errors flow back to Redux → form display
4. **Type safety**: Data is typed at every step (schema → API → thunk → state)
5. **Separation of concerns**: Each layer has one responsibility

## Next Step

Read [05-edit-form-flow.md](05-edit-form-flow.md) to see how edit differs from create.
