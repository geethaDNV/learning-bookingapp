# 07 - Customer and Item Autocomplete

## Overview

Autocomplete allows users to search and select customers and items without knowing IDs. The frontend queries the backend API for matching options.

## Backend: Search Endpoints

### Endpoint: GET /api/v1/customers/search?q=...

**Request:**
```
GET /api/v1/customers/search?q=ACME
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "ACME Corp",
      "email": "contact@acme.com",
      "phone": "+1-555-0101"
    },
    {
      "id": 3,
      "name": "ACME Solutions Ltd",
      "email": "sales@acme-solutions.com",
      "phone": "+1-555-0103"
    }
  ]
}
```

### Endpoint: GET /api/v1/items/search?q=...

**Request:**
```
GET /api/v1/items/search?q=Consulting
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Consulting - 1 hour",
      "description": "Professional consulting service",
      "unitPrice": "150.00",
      "taxRate": "18.00"
    }
  ]
}
```

## Backend: Implementation

### SearchController

**File:** `backend/src/controllers/SearchController.ts`

```typescript
export class SearchController {
  constructor(
    private customerLookupRepository: ICustomerLookupRepository,
    private itemLookupRepository: IItemLookupRepository
  ) {}

  async searchCustomers(req: Request, res: Response): Promise<void> {
    const { q } = req.query;

    if (!q || typeof q !== "string") {
      res.status(400).json({
        success: false,
        message: "Query parameter 'q' is required",
      });
      return;
    }

    const customers = await this.customerLookupRepository.search(q);
    res.json({ success: true, data: customers });
  }

  async searchItems(req: Request, res: Response): Promise<void> {
    const { q } = req.query;

    if (!q || typeof q !== "string") {
      res.status(400).json({
        success: false,
        message: "Query parameter 'q' is required",
      });
      return;
    }

    const items = await this.itemLookupRepository.search(q);
    res.json({ success: true, data: items });
  }
}
```

### LookupRepositories

**File:** `backend/src/repositories/LookupRepositories.ts`

```typescript
export class CustomerLookupRepository implements ICustomerLookupRepository {
  constructor(private prisma: PrismaClient) {}

  async search(query: string): Promise<CustomerOption[]> {
    return this.prisma.customer.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      },
      take: 10,  // Limit results
    });
  }
}

export class ItemLookupRepository implements IItemLookupRepository {
  constructor(private prisma: PrismaClient) {}

  async search(query: string): Promise<ItemOption[]> {
    return this.prisma.item.findMany({
      where: {
        name: {
          contains: query,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        name: true,
        description: true,
        unitPrice: true,
        taxRate: true,
      },
      take: 10,
    });
  }
}
```

**Key features:**
- Case-insensitive search
- Search multiple fields (name + email for customers)
- Limit to 10 results for performance
- Return selected fields only (not full records)

## Frontend: API Service

**File:** `frontend/src/services/api.ts`

```typescript
export class SearchApiService {
  static async searchCustomers(query: string): Promise<CustomerOption[]> {
    const response = await fetch(
      `/api/v1/customers/search?q=${encodeURIComponent(query)}`
    );
    const result = await response.json();
    if (!result.success) throw new Error(result.message);
    return result.data;
  }

  static async searchItems(query: string): Promise<ItemOption[]> {
    const response = await fetch(
      `/api/v1/items/search?q=${encodeURIComponent(query)}`
    );
    const result = await response.json();
    if (!result.success) throw new Error(result.message);
    return result.data;
  }
}
```

## Frontend: Autocomplete Components

### CustomerAutocomplete

**File:** `frontend/src/components/CustomerAutocomplete.tsx`

```typescript
export function CustomerAutocomplete<T extends FieldValues>({
  control,
  name,
  label = "Customer",
}) {
  const [options, setOptions] = useState<CustomerOption[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setOptions([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await SearchApiService.searchCustomers(query);
      setOptions(results);
    } catch (error) {
      console.error("Search failed:", error);
      setOptions([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <div className="relative">
          <input
            type="text"
            placeholder="Search customer..."
            onFocus={() => setIsOpen(true)}
            onBlur={() => setTimeout(() => setIsOpen(false), 200)}
            onChange={(e) => handleSearch(e.target.value)}
          />

          {isOpen && options.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-white border rounded shadow-lg">
              {options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    field.onChange(option.id);
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-blue-50"
                >
                  <div className="font-medium">{option.name}</div>
                  <div className="text-xs text-gray-500">{option.email}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    />
  );
}
```

**How it works:**
1. User types in input → `handleSearch(query)` is called
2. `handleSearch` calls `SearchApiService.searchCustomers(query)`
3. Results are set in state and dropdown appears
4. User clicks option → `field.onChange(option.id)` updates form state
5. Form field now holds the customer ID

### ItemAutocomplete

**File:** `frontend/src/components/ItemAutocomplete.tsx`

Similar structure to CustomerAutocomplete but:
- Displays `unitPrice` and `taxRate` in results
- Calls `SearchApiService.searchItems(query)`
- Accepts `onItemSelected` callback to update rate when item is chosen

```typescript
export function ItemAutocomplete<T extends FieldValues>({
  control,
  name,
  onItemSelected,  // Callback when user selects an item
}) {
  // ... same as CustomerAutocomplete but:

  const handleItemSelected = (option: ItemOption) => {
    field.onChange(option.id);
    // Pre-fill rate with item's unit price
    onItemSelected?.(option);
    setIsOpen(false);
  };

  return (
    // ...
    <button
      onClick={() => handleItemSelected(option)}
      className="w-full text-left px-3 py-2 hover:bg-blue-50"
    >
      <div className="font-medium">{option.name}</div>
      <div className="text-xs text-gray-500">
        ${option.unitPrice} | Tax: {option.taxRate}%
      </div>
    </button>
  );
}
```

## Integration with InvoiceLineFields

**File:** `frontend/src/components/InvoiceLineFields.tsx`

```typescript
{fields.map((field, index) => (
  <div key={field.id}>
    {/* Item autocomplete */}
    <ItemAutocomplete
      control={control}
      name={`lines.${index}.itemId`}
      onItemSelected={(item) => {
        // When item is selected, optionally pre-fill rate
        // (or set tax rate for calculations)
        handleItemSelected(index, item);
      }}
    />

    {/* Quantity input */}
    <input {...register(`lines.${index}.quantity`)} />

    {/* Rate input - can be pre-filled by onItemSelected */}
    <input {...register(`lines.${index}.rate`)} />

    <button onClick={() => remove(index)}>Remove</button>
  </div>
))}
```

## Search Behavior

### What Happens When User Types

```
User types: "AC"
  ↓
handleSearch("AC") called
  ↓
SearchApiService.searchCustomers("AC")
  ↓
GET /api/v1/customers/search?q=AC
  ↓
Backend returns: [
  { id: 1, name: "ACME Corp", ... },
  { id: 3, name: "ACME Solutions", ... }
]
  ↓
setOptions([...])
  ↓
Dropdown renders with 2 options
```

### What Happens When User Clicks

```
User clicks: "ACME Corp" option
  ↓
onItemSelected callback
  ↓
field.onChange(1)  // Set customerId to 1
  ↓
Form state: { customerId: 1, ... }
  ↓
setIsOpen(false)  // Close dropdown
  ↓
Display: "Selected: ACME Corp"
```

## Performance Considerations

### Debouncing (Optional Enhancement)

Avoid too many API calls as user types:

```typescript
const handleSearch = useCallback(
  debounce(async (query: string) => {
    // API call
  }, 300),  // Wait 300ms after user stops typing
  []
);
```

### Limiting Results

Both endpoints limit to 10 results to keep response small.

### Exact Match Handling

When user selects an item, the ID is stored (not the name):
```typescript
field.onChange(option.id)  // Store 1, not "ACME Corp"
```

This ensures we have the exact item even if another item with similar name is added later.

## Summary

- **Search endpoints**: `GET /api/v1/customers/search?q=...` and `GET /api/v1/items/search?q=...`
- **Backend search**: Case-insensitive, multiple fields, limit 10 results
- **Frontend autocomplete**: Input → Search → Dropdown → Click → Select
- **Form integration**: Selected ID is stored in form field
- **Item selection**: Can trigger callback to pre-fill rate/tax
- **Performance**: Debounce optional, limit results, exact ID matching
