# Doc 07: Frontend Typing - From API to Components

## Type Safety Strategy

Module 03 uses **strict typing throughout**:

```
API Types (backend contract)
  ↓
API Service (makes calls, returns typed data)
  ↓
Redux Thunks (async operations return typed data)
  ↓
Redux Selectors (read typed data from state)
  ↓
Hooks (return typed data to components)
  ↓
Components (receive typed props, events)
```

## API Types

Define what the API returns:

```typescript
// frontend/src/types/index.ts
export interface Item {
  id: number;
  name: string;
  sku: string;
  itemType: string;
  hsnCode: string | null;
  sacCode: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateItemPayload {
  name: string;
  sku: string;
  itemType: string;
  hsnCode?: string | null;
  sacCode?: string | null;
  isActive?: boolean;
}

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
  details?: Record<string, string[]>;
}
```

These types are **independent** of backend types. They document the frontend's expectation of the API.

## API Service

Typed methods returning typed data:

```typescript
// frontend/src/services/itemService.ts
import { Item, CreateItemPayload, ItemListResponse } from '../types/index.js';

export async function createItem(payload: CreateItemPayload): Promise<Item> {
  const response = await fetch('/api/items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw await response.json(); // Throws typed ApiError
  }

  return response.json(); // Returns typed Item
}

export async function getItemById(id: number): Promise<Item> {
  // ...
}

export async function listItems(page: number, pageSize: number): Promise<ItemListResponse> {
  // ...
}
```

**Benefits:**
- TypeScript knows `createItem` returns `Promise<Item>`
- Can't accidentally treat result as string
- IDE autocomplete works: `item.name`, `item.id`, etc.

## Redux Types

### Store Configuration

```typescript
// frontend/src/store/index.ts
export const store = configureStore({
  reducer: {
    items: itemsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

### Slice State

```typescript
// frontend/src/store/itemsSlice.ts
export interface ItemsState {
  list: Item[];                    // Array of Items
  currentItem: Item | null;        // Single item or null
  loading: boolean;                // Loading flag
  error: ApiError | null;          // Fetch error
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  submitError: ApiError | null;    // Submit error (create/update/delete)
}

const initialState: ItemsState = {
  list: [],
  currentItem: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  },
  submitError: null,
};
```

### Thunks with Full Typing

```typescript
// frontend/src/store/itemThunks.ts
export const createItemThunk = createAsyncThunk<
  Item,                           // Fulfilled payload type
  CreateItemPayload,              // Argument type
  { rejectValue: ApiError }       // Rejection type
>(
  'items/createItem',
  async (payload, { rejectWithValue }) => {
    try {
      return await itemService.createItem(payload); // Returns typed Item
    } catch (error: unknown) {
      return rejectWithValue(error as ApiError);
    }
  }
);
```

**TypeScript knows:**
- Argument must be `CreateItemPayload`
- Success resolves to `Item`
- Rejection provides `ApiError`

## Selectors

```typescript
// frontend/src/store/selectors.ts
export const selectItems = (state: RootState) => state.items.list;
export const selectCurrentItem = (state: RootState) => state.items.currentItem;
export const selectLoading = (state: RootState) => state.items.loading;
export const selectError = (state: RootState) => state.items.error;
export const selectSubmitError = (state: RootState) => state.items.submitError;
export const selectPagination = (state: RootState) => state.items.pagination;
```

TypeScript infers return types:

```typescript
const items = useAppSelector(selectItems); // TypeScript knows: Item[]
const error = useAppSelector(selectError); // TypeScript knows: ApiError | null
```

## Typed Hooks

```typescript
// frontend/src/hooks/redux.ts
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import { RootState, AppDispatch } from '../store/index.js';

// Typed dispatch
export const useAppDispatch = () => useDispatch<AppDispatch>();

// Typed selector
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

Usage:

```typescript
const dispatch = useAppDispatch();
const items = useAppSelector(state => state.items.list);

// TypeScript knows:
// dispatch can be called with AppDispatch actions
// items is Item[]
```

## Component Props

```typescript
// frontend/src/features/items/components/ItemForm.tsx
interface ItemFormProps {
  onSubmit: (values: ItemFormValues) => void | Promise<void>;
  defaultValues?: ItemFormValues;
  loading?: boolean;
  submitError?: ApiError | null; // Typed ApiError
}

export function ItemForm({
  onSubmit,
  defaultValues,
  loading = false,
  submitError,
}: ItemFormProps) {
  // Form implementation
}
```

Parent component:

```typescript
<ItemForm
  onSubmit={handleSubmit} // Must match signature
  loading={loading}       // Must be boolean
  submitError={error}     // Must be ApiError | null
/>
```

TypeScript catches mistakes:

```typescript
<ItemForm
  onSubmit={() => console.log("ok")} // ✓ Correct
  onSubmit={() => console.log("ok")} // ✓ Correct
  loading="true"                       // ✗ Error: string is not boolean
  submitError={{ error: true }}        // ✗ Error: wrong structure
/>
```

## Form Values Typing

```typescript
// frontend/src/features/items/schemas/itemValidation.ts
export const itemFormSchema = z.object({
  name: z.string(),
  sku: z.string(),
  // ...
});

// Infer type from Zod schema
export type ItemFormValues = z.infer<typeof itemFormSchema>;

// Use in form
function ItemForm() {
  const { handleSubmit } = useForm<ItemFormValues>({
    resolver: zodResolver(itemFormSchema),
  });

  // TypeScript knows:
  // - Form values match schema
  // - handleSubmit receives ItemFormValues
  // - Can't pass wrong structure to onSubmit
}
```

## Avoiding `any`

**Bad:**
```typescript
const response: any = await fetch(...); // No type safety
const name = response.data.name; // Could be anything
dispatch(response); // Any type accepted
```

**Good:**
```typescript
const response: ItemListResponse = await fetch(...); // Typed
const name = response.items[0].name; // TypeScript knows structure
dispatch(createItemThunk(response)); // TypeScript validates
```

## Complete Type Flow: Create Item

```
User inputs → ItemFormValues (typed form schema)
  ↓
convert → CreateItemPayload (typed create API request)
  ↓
dispatch(createItemThunk(payload: CreateItemPayload))
  ↓
thunk → itemService.createItem(payload: CreateItemPayload): Promise<Item>
  ↓
API returns → Item (typed API response)
  ↓
Redux → itemsSlice handles Item
  ↓
State → ItemsState { currentItem: Item | null }
  ↓
selector → useAppSelector(state => state.items.currentItem): Item | null
  ↓
Component → receives typed Item or null
  ↓
JSX → TypeScript ensures correct property access
```

At every step, types are enforced. No `any`, no runtime surprises.

## Benefits of This Approach

1. **Compile-time checking**: Catch API contract breaks before runtime
2. **IDE support**: Autocomplete and "go to definition" work perfectly
3. **Self-documenting**: Types show what data structures exist
4. **Refactoring safety**: Change a type, TypeScript highlights all usages
5. **Testing**: Easy to mock typed objects

## Real-World Example

Change API contract:

```typescript
// Backend adds new field
export interface Item {
  id: number;
  name: string;
  sku: string;
  description: string; // NEW FIELD
  // ...
}
```

**Without types:**
- App still works
- UI doesn't show description
- Users confused
- Days later, someone files a bug

**With types:**
- Build fails
- TypeScript: "Property 'description' is not used"
- Compiler forces attention to new field
- Developer makes conscious choice

## Next Step

Read [08-contract-trace.md](08-contract-trace.md) to follow a single field through the entire system.
