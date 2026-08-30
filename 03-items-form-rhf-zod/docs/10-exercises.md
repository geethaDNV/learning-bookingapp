# Doc 10: Exercises - Extending the Module

## Exercise 1: Conditional HSN/SAC Validation

**Goal**: Only allow HSN or SAC code based on item type.

**Requirements**:
- If `itemType === 'GOODS'`, HSN code is required, SAC code is hidden
- If `itemType === 'SERVICES'`, SAC code is required, HSN code is hidden
- If `itemType === 'CONSUMABLE'`, both are optional

**Frontend Changes**:

1. Update `itemValidation.ts`:
```typescript
export const itemFormSchema = z.object({
  // ... existing fields
  hsnCode: z.string().optional(),
  sacCode: z.string().optional(),
}).refine(
  (data) => {
    if (data.itemType === 'GOODS') {
      return data.hsnCode && data.hsnCode.length > 0; // Required
    }
    if (data.itemType === 'SERVICES') {
      return data.sacCode && data.sacCode.length > 0; // Required
    }
    return true; // CONSUMABLE: both optional
  },
  {
    message: 'Required field for this item type',
    path: ['hsnCode'] // or ['sacCode']
  }
);
```

2. Update `ItemForm.tsx`:
```typescript
const { watch } = useForm({...});
const itemType = watch('itemType');

{itemType === 'GOODS' && (
  <div>
    <label>HSN Code *</label>
    <input {...register('hsnCode')} required />
  </div>
)}

{itemType === 'SERVICES' && (
  <div>
    <label>SAC Code *</label>
    <input {...register('sacCode')} required />
  </div>
)}

{itemType === 'CONSUMABLE' && (
  <div>
    <label>HSN Code (Optional)</label>
    <input {...register('hsnCode')} />
    <label>SAC Code (Optional)</label>
    <input {...register('sacCode')} />
  </div>
)}
```

3. Backend validation (add to schema):
```typescript
export const createItemSchema = z.object({
  // ...
}).refine(
  (data) => {
    if (data.itemType === 'GOODS') return data.hsnCode != null;
    if (data.itemType === 'SERVICES') return data.sacCode != null;
    return true;
  },
  {
    message: 'HSN code required for GOODS, SAC code required for SERVICES'
  }
);
```

---

## Exercise 2: Bulk Deletion

**Goal**: Select multiple items and delete them at once.

**Requirements**:
- Checkbox in each table row
- "Delete Selected" button in list header
- Confirm before deleting

**Frontend Changes**:

1. Add state to `itemsSlice.ts`:
```typescript
export interface ItemsState {
  // ... existing
  selectedIds: Set<number>;
}

export const itemsSlice = createSlice({
  reducers: {
    toggleItemSelection: (state, action: PayloadAction<number>) => {
      if (state.selectedIds.has(action.payload)) {
        state.selectedIds.delete(action.payload);
      } else {
        state.selectedIds.add(action.payload);
      }
    },
    clearSelection: (state) => {
      state.selectedIds.clear();
    },
  },
});
```

2. Add bulk delete thunk:
```typescript
export const bulkDeleteItemsThunk = createAsyncThunk<
  void,
  number[],
  { rejectValue: ApiError }
>(
  'items/bulkDelete',
  async (ids, { rejectWithValue }) => {
    try {
      await Promise.all(ids.map(id => itemService.deleteItem(id)));
    } catch (error) {
      return rejectWithValue(error as ApiError);
    }
  }
);
```

3. Update `ItemListPage.tsx`:
```typescript
const { list, selectedIds } = useAppSelector(state => ({
  list: state.items.list,
  selectedIds: state.items.selectedIds,
}));

const handleBulkDelete = async () => {
  if (selectedIds.size === 0) return;
  if (!confirm(`Delete ${selectedIds.size} items?`)) return;

  await dispatch(bulkDeleteItemsThunk(Array.from(selectedIds)));
  dispatch(clearSelection());
  // Refresh list
};

// In table header:
{selectedIds.size > 0 && (
  <button onClick={handleBulkDelete} className="bg-red-600">
    Delete {selectedIds.size} Items
  </button>
)}

// In table rows:
<td>
  <input
    type="checkbox"
    checked={selectedIds.has(item.id)}
    onChange={() => dispatch(toggleItemSelection(item.id))}
  />
</td>
```

---

## Exercise 3: Filters and Search

**Goal**: Filter items by status and search by name.

**Requirements**:
- Search input for name (real-time)
- Filter dropdown for active/inactive
- Update list as user types

**Frontend Changes**:

1. Add filter state:
```typescript
export interface ItemsState {
  // ... existing
  searchTerm: string;
  filterActive: 'all' | 'active' | 'inactive';
}
```

2. Add filter actions:
```typescript
export const itemsSlice = createSlice({
  reducers: {
    setSearchTerm: (state, action) => {
      state.searchTerm = action.payload;
    },
    setFilterActive: (state, action) => {
      state.filterActive = action.payload;
    },
  },
});
```

3. Update fetch thunk to accept filters:
```typescript
export const fetchItems = createAsyncThunk<
  ItemListResponse,
  { page?: number; pageSize?: number; search?: string; status?: string },
  { rejectValue: ApiError }
>(
  'items/fetchItems',
  async (params, { rejectWithValue }) => {
    try {
      const query = new URLSearchParams({
        page: String(params.page || 1),
        pageSize: String(params.pageSize || 10),
        ...(params.search && { search: params.search }),
        ...(params.status && { status: params.status }),
      });
      return await itemService.listItems(
        query.toString()
      );
    } catch (error) {
      return rejectWithValue(error as ApiError);
    }
  }
);
```

4. Update API service:
```typescript
export async function listItems(queryString: string): Promise<ItemListResponse> {
  const response = await fetch(`${API_BASE}/items?${queryString}`);
  return handleResponse<ItemListResponse>(response);
}
```

5. Update `ItemListPage.tsx`:
```typescript
const { list, searchTerm, filterActive } = useAppSelector(state => state.items);
const dispatch = useAppDispatch();

const handleSearch = (value: string) => {
  dispatch(setSearchTerm(value));
  dispatch(fetchItems({
    page: 1,
    search: value,
    status: filterActive === 'all' ? undefined : filterActive,
  }));
};

// UI:
<input
  type="text"
  placeholder="Search items..."
  value={searchTerm}
  onChange={(e) => handleSearch(e.target.value)}
/>

<select
  value={filterActive}
  onChange={(e) => {
    dispatch(setFilterActive(e.target.value as any));
    dispatch(fetchItems({
      page: 1,
      search: searchTerm,
      status: e.target.value === 'all' ? undefined : e.target.value,
    }));
  }}
>
  <option value="all">All</option>
  <option value="active">Active Only</option>
  <option value="inactive">Inactive Only</option>
</select>
```

6. Backend: Add to routes/controllers:
```typescript
// backend/src/routes/items.ts
router.get('/', validateRequest(listQuerySchema.extend({
  search: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional(),
})), (req, res, next) => controller.list(req, res, next));

// backend/src/repositories/ItemRepository.ts
async list(page: number, pageSize: number, filters?: { search?: string; status?: 'active' | 'inactive' }): Promise<{ items: Item[]; total: number }> {
  const where: any = {};
  
  if (filters?.search) {
    where.name = { contains: filters.search, mode: 'insensitive' };
  }
  
  if (filters?.status === 'active') {
    where.isActive = true;
  } else if (filters?.status === 'inactive') {
    where.isActive = false;
  }

  const [items, total] = await Promise.all([
    this.db.item.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    this.db.item.count({ where }),
  ]);

  return { items, total };
}
```

---

## Exercise 4: Form Sections (Refactor)

**Goal**: Split ItemForm into reusable sections.

**Create `BasicInfoSection.tsx`:**
```typescript
export function BasicInfoSection({ control }) {
  return (
    <div>
      <h3 className="font-bold mb-4">Basic Information</h3>
      <div>
        <label>Name *</label>
        <Controller
          control={control}
          name="name"
          render={({ field, fieldState: { error } }) => (
            <>
              <input {...field} />
              {error && <span className="error">{error.message}</span>}
            </>
          )}
        />
      </div>
      <div>
        <label>SKU *</label>
        <Controller
          control={control}
          name="sku"
          render={({ field, fieldState: { error } }) => (
            <>
              <input {...field} />
              {error && <span className="error">{error.message}</span>}
            </>
          )}
        />
      </div>
    </div>
  );
}
```

**Update `ItemForm.tsx`:**
```typescript
export function ItemForm({ onSubmit, ... }) {
  const { control, handleSubmit, formState: { errors }, ... } = useForm({...});

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <BasicInfoSection control={control} />
      <TaxInfoSection control={control} itemType={watch('itemType')} />
      <SettingsSection control={control} />
      <button type="submit">Save</button>
    </form>
  );
}
```

---

## Exercise 5: Write Tests

**Frontend test (Jest + React Testing Library):**

```typescript
// frontend/src/features/items/components/ItemForm.test.tsx
import { render, screen, userEvent } from '@testing-library/react';
import { ItemForm } from './ItemForm';

describe('ItemForm', () => {
  it('should display validation error when name is empty', async () => {
    const mockSubmit = jest.fn();
    render(<ItemForm onSubmit={mockSubmit} />);

    const input = screen.getByLabelText('Name');
    await userEvent.clear(input);
    await userEvent.tab();

    expect(screen.getByText('Name is required')).toBeInTheDocument();
  });

  it('should call onSubmit with valid data', async () => {
    const mockSubmit = jest.fn();
    render(<ItemForm onSubmit={mockSubmit} />);

    await userEvent.type(screen.getByLabelText('Name'), 'Laptop');
    await userEvent.type(screen.getByLabelText('SKU'), 'LAP-001');
    await userEvent.selectOption(screen.getByLabelText('Item Type'), 'GOODS');
    await userEvent.click(screen.getByText('Save'));

    expect(mockSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Laptop',
        sku: 'LAP-001',
        itemType: 'GOODS',
      })
    );
  });

  it('should populate form with default values in edit mode', () => {
    const mockSubmit = jest.fn();
    const defaultValues = {
      name: 'Laptop',
      sku: 'LAP-001',
      itemType: 'GOODS',
      isActive: true,
      hsnCode: null,
      sacCode: null,
    };

    render(<ItemForm onSubmit={mockSubmit} defaultValues={defaultValues} />);

    expect(screen.getByDisplayValue('Laptop')).toBeInTheDocument();
    expect(screen.getByDisplayValue('LAP-001')).toBeInTheDocument();
  });
});
```

**Backend test (Jest):**

```typescript
// backend/src/services/ItemService.test.ts
describe('ItemService', () => {
  let service: ItemService;
  let mockRepo: jest.Mocked<IItemRepository>;

  beforeEach(() => {
    mockRepo = {
      create: jest.fn(),
      findByName: jest.fn(),
      findBySku: jest.fn(),
      // ... other methods
    };
    service = new ItemService(mockRepo);
  });

  it('should throw error if name already exists', async () => {
    mockRepo.findByName.mockResolvedValue({
      id: 1,
      name: 'Laptop',
      // ...
    } as any);

    await expect(
      service.createItem({ name: 'Laptop', sku: 'NEW-001', itemType: 'GOODS' })
    ).rejects.toThrow('Item with this name already exists');
  });

  it('should create item if validation passes', async () => {
    mockRepo.findByName.mockResolvedValue(null);
    mockRepo.findBySku.mockResolvedValue(null);
    mockRepo.create.mockResolvedValue({
      id: 42,
      name: 'Laptop',
      // ...
    } as any);

    const result = await service.createItem({
      name: 'Laptop',
      sku: 'LAP-001',
      itemType: 'GOODS',
    });

    expect(result.id).toBe(42);
    expect(mockRepo.create).toHaveBeenCalled();
  });
});
```

---

## Exercise 6: Pagination UI

**Goal**: Add previous/next buttons and page navigation.

```typescript
// ItemListPage.tsx
const { list, pagination } = useAppSelector(state => state.items);

const handlePrevious = () => {
  if (pagination.page > 1) {
    dispatch(fetchItems({ page: pagination.page - 1, pageSize: pagination.pageSize }));
  }
};

const handleNext = () => {
  if (pagination.page < pagination.totalPages) {
    dispatch(fetchItems({ page: pagination.page + 1, pageSize: pagination.pageSize }));
  }
};

// UI:
<div className="flex gap-2 justify-center mt-4">
  <button onClick={handlePrevious} disabled={pagination.page === 1}>
    Previous
  </button>
  <span>Page {pagination.page} of {pagination.totalPages}</span>
  <button onClick={handleNext} disabled={pagination.page === pagination.totalPages}>
    Next
  </button>
</div>
```

---

## Challenge: Add Pricing Fields

**Goal**: Add cost price and selling price to items.

1. Update database schema (add fields to `Item` model)
2. Create migration
3. Update frontend form
4. Add Zod validation (prices must be positive, sell > cost)
5. Update thunks
6. Test edge cases

---

## Next Steps After Exercises

1. Pick one exercise and implement it
2. Run tests to verify it works
3. Compare your solution with production code
4. Look for similar patterns in BookKeepingApp
5. Read production code more confidently now

You've learned the fundamentals. The rest is applying them to more complex scenarios!
