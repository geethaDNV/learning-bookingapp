# Doc 05: Edit Form Flow - Loading, Defaults, and Updates

## Edit vs Create Differences

| Aspect | Create | Edit |
|--------|--------|------|
| Initial load | Empty form | Form populated from database |
| Data fetching | None | Fetch by ID on page load |
| Default values | Empty strings | Item data from server |
| Submit method | POST /items | PUT /items/:id |
| Duplicate check | Check against all items | Exclude self from check |
| Redirect after | Navigate to /items | Navigate to /items |

## The Complete Edit Journey

```
User navigates to /items/42/edit
  ↓
useEffect dispatches fetchItemById(42)
  ↓
fetchItemById.pending: loading = true
  ↓
API request: GET /api/items/42
  ↓
Backend returns Item
  ↓
fetchItemById.fulfilled: currentItem set, loading = false
  ↓
useEffect in ItemForm detects currentItem change
  ↓
Calls reset(currentItem) to populate form
  ↓
Form displays with values
  ↓
User edits field (e.g., name)
  ↓
User clicks Save
  ↓
handleSubmit validates with Zod
  ↓
onSubmit dispatches updateItemThunk(id, payload)
  ↓
API request: PUT /api/items/42
  ↓
Backend checks duplicate name (excluding this item)
  ↓
Repository updates database
  ↓
Response returns updated Item
  ↓
Redux fulfilled, navigate('/items')
```

## Step-by-Step: Edit Page Load

### Step 1: Page Renders and Effect Runs

```typescript
// ItemEditPage.tsx
export function ItemEditPage() {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const { currentItem, loading } = useAppSelector(state => state.items);

  // Fetch item when component mounts
  useEffect(() => {
    if (itemId) {
      dispatch(fetchItemById(itemId));
    }
  }, [itemId, dispatch]);

  // ...
}
```

### Step 2: Thunk Makes API Call

```typescript
// itemThunks.ts
export const fetchItemById = createAsyncThunk<
  Item,
  number,
  { rejectValue: ApiError }
>(
  'items/fetchItemById',
  async (id, { rejectWithValue }) => {
    try {
      return await itemService.getItemById(id);
    } catch (error) {
      return rejectWithValue(error as ApiError);
    }
  }
);
```

### Step 3: Loading State Updates

```typescript
// itemsSlice.ts extraReducers
builder.addCase(fetchItemById.pending, (state) => {
  state.loading = true;
  state.error = null;
});

builder.addCase(fetchItemById.fulfilled, (state, action) => {
  state.loading = false;
  state.currentItem = action.payload; // Item now in state
});
```

### Step 4: Form Detects Change and Resets

This is **critical** for edit mode:

```typescript
// ItemEditPage.tsx
const { reset } = useForm();

// When item data arrives, update form
useEffect(() => {
  if (currentItem) {
    reset({
      name: currentItem.name,
      sku: currentItem.sku,
      itemType: currentItem.itemType,
      hsnCode: currentItem.hsnCode,
      sacCode: currentItem.sacCode,
      isActive: currentItem.isActive,
    });
  }
}, [currentItem, reset]);
```

**Why `reset()`?**
- Form's internal state needs to update
- React Hook Form's initial values are set at mount time
- `reset()` explicitly updates form when data arrives

### Step 5: User Edits and Submits

```typescript
// Form shows values:
// name: "Laptop" (from database)
// sku: "LAP-001"
// ...

// User changes name to "Gaming Laptop"
// User clicks Save
```

### Step 6: Update Validation

```typescript
// itemValidation.ts (same schema for create and edit)
const payload = {
  name: "Gaming Laptop",
  // other fields...
};

// Frontend validates
itemFormSchema.parse(payload); // ✓ Valid
```

### Step 7: Thunk Dispatched

```typescript
// ItemEditPage.tsx
const handleSubmit = async (values: ItemFormValues) => {
  const payload = formValuesToPayload(values);
  
  const result = await dispatch(
    updateItemThunk({
      id: itemId,
      payload: payload as any,
    })
  );
  
  if (result.type === updateItemThunk.fulfilled.type) {
    navigate('/items'); // Success
  }
};
```

### Step 8: Backend Update with Duplicate Check

```typescript
// ItemService.updateItem()
async updateItem(id: number, payload: UpdateItemPayload): Promise<ItemResponse> {
  const existing = await this.itemRepository.findById(id);
  if (!existing) {
    throw new NotFoundError('Item not found');
  }

  // Key difference from create:
  // Check for duplicate name, but exclude self
  if (payload.name && payload.name !== existing.name) {
    const duplicate = await this.itemRepository.findByName(payload.name);
    if (duplicate) {
      // Only error if it's a different item
      throw new DuplicateError('Item with this name already exists', 'DUPLICATE_NAME');
    }
  }

  // Same for SKU...

  const updated = await this.itemRepository.update(id, payload);
  return this.mapToResponse(updated);
}
```

### Step 9: Database Update

```typescript
// ItemRepository.update()
async update(id: number, payload: UpdateItemPayload): Promise<Item> {
  return this.db.item.update({
    where: { id },
    data: {
      // Only include fields that are provided
      ...(payload.name !== undefined && { name: payload.name }),
      ...(payload.sku !== undefined && { sku: payload.sku }),
      // ...
    },
  });
}
```

SQL:
```sql
UPDATE items
SET name = 'Gaming Laptop', updatedAt = NOW()
WHERE id = 42
```

### Step 10: Response and Redirect

Item updated, navigate back to list.

## Error Scenario: Duplicate Name (Edit)

```
User changes name to an existing item name
  ↓
Frontend Zod: ✓ Valid
  ↓
Backend receives PUT /items/42 with new name
  ↓
Service checks: is this name already taken?
  ↓
Finds item with that name BUT it's a different item (id 15)
  ↓
Throws: DUPLICATE_NAME
  ↓
Error middleware responds 409
  ↓
Frontend catches in thunk
  ↓
submitError displayed in form
  ↓
User sees "Item with this name already exists"
```

### vs. If user keeps the same name:

```
User submits form without changing name
  ↓
Backend: existing.name = "Laptop" = payload.name
  ↓
Skips duplicate check (it's the same name)
  ↓
Update succeeds
```

## Key Concepts

### Form Reset Pattern

```typescript
useEffect(() => {
  if (data) {
    reset(data); // Tell React Hook Form to update internal state
  }
}, [data, reset]);
```

This pattern is used whenever:
- Async data arrives for a form
- User selects a different item to edit
- Need to reload form state from props

### Partial Updates

Backend supports partial updates:

```typescript
// Send only changed fields
{
  name: "Gaming Laptop"
  // sku, itemType, etc. not included
}

// Backend only updates name
```

This matters for concurrent edit scenarios.

### Loading States

Edit page shows loading feedback:

```typescript
if (loading && !currentItem) {
  return <div>Loading item...</div>;
}

if (!currentItem) {
  return <div>Item not found</div>;
}

// Form is ready
return <ItemForm defaultValues={defaultValues} />;
```

## Code Locations

- **Edit page with fetch**: `frontend/src/features/items/pages/ItemEditPage.tsx`
- **Fetch thunk**: `frontend/src/store/itemThunks.ts` → `fetchItemById`
- **Update thunk**: `frontend/src/store/itemThunks.ts` → `updateItemThunk`
- **Form with reset**: `frontend/src/features/items/components/ItemForm.tsx`
- **Backend update**: `backend/src/services/ItemService.ts` → `updateItem()`
- **Duplicate check logic**: `backend/src/services/ItemService.ts`

## Next Step

Read [06-backend-contracts-and-di.md](06-backend-contracts-and-di.md) to understand backend architecture.
