# 07. Customer Autocomplete UI

## Component: `CustomerAutocomplete.tsx` + `useCustomerAutocomplete` hook

The autocomplete component powers live customer selection with:
- **Debounced search** to avoid flooding the backend
- **Server-side infinite scroll** — the dropdown fetches the next page as the user scrolls near the
  bottom, instead of loading all matches up front
- **Loading state** while searching, and a separate **"loading more"** state while paging
- **Empty state** when no results
- **Selected option display** to confirm choice

The data-fetching logic (debounce, paging, stale-request guarding) lives in a dedicated hook,
`useCustomerAutocomplete`, so the component itself only renders UI. This mirrors production's
`useCustomerQuery` hook, minus the client/server "small dataset" strategy switch — autocomplete here is
**always server-paginated**.

## Usage

```typescript
import { CustomerAutocomplete } from '@components/CustomerAutocomplete';
import type { CustomerAutocompleteOption } from '@types';
import { useState } from 'react';

export const MyForm = () => {
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerAutocompleteOption | null>(null);

  return (
    <div>
      <label>Select a Customer</label>
      <CustomerAutocomplete
        value={selectedCustomer}
        onSelect={setSelectedCustomer}
        placeholder="Search customers by name, email, phone, or GSTIN..."
      />

      {selectedCustomer && (
        <p>Selected: {selectedCustomer.displayName}</p>
      )}
    </div>
  );
};
```

A working example lives at `frontend/src/pages/CustomerAutocompleteDemoPage.tsx`, routed at
`/customers/autocomplete-demo`.

## Props

```typescript
interface CustomerAutocompleteProps {
  value: CustomerAutocompleteOption | null;              // Currently selected customer
  onSelect: (customer: CustomerAutocompleteOption | null) => void;  // Callback on selection/clear
  placeholder?: string;                                    // Input placeholder
}
```

## The `useCustomerAutocomplete` Hook

**File**: `frontend/src/hooks/useCustomerAutocomplete.ts`

```typescript
export interface UseCustomerAutocompleteResult {
  search: string;
  setSearch: (value: string) => void;
  options: CustomerAutocompleteOption[];
  total: number;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  fetchMore: () => void;
  clear: () => void;
}

export function useCustomerAutocomplete(pageSize?: number): UseCustomerAutocompleteResult;
```

It owns all the state the component needs: the raw/debounced search term, the accumulated `options`
list, pagination bookkeeping, and loading flags.

## Component + Hook Flow

```
User types in search input
    ↓
setSearch(value) — updates input immediately, no network call yet
    ↓
Debounce (350ms) — wait for user to stop typing
    ↓
debouncedSearch changes → hook fetches page 1, REPLACES options
    ↓
Set isLoading = true → Backend returns { rows, total } → isLoading = false
    ↓
User scrolls the dropdown near the bottom
    ↓
onScroll handler checks hasMore → calls fetchMore()
    ↓
Set isLoadingMore = true → Backend returns next page → APPENDS to options
    ↓
User clicks an option
    ↓
handleSelect() runs → onSelect(option) → clear() resets search/options
```

## Implementation Details

### Debounced Search (in the hook)

```typescript
useEffect(() => {
  const timer = setTimeout(() => setDebouncedSearch(search), SEARCH_DEBOUNCE_MS);
  return () => clearTimeout(timer);
}, [search]);
```

**Why debounce?**
- Don't search on every keystroke
- Wait 350ms after user stops typing
- Reduces backend load
- Better UX (less flickering)

### Fresh Search Replaces Page 1

```typescript
useEffect(() => {
  const query = debouncedSearch.trim();
  if (!query) {
    setOptions([]);
    setTotal(0);
    setPage(1);
    return;
  }

  const requestId = ++requestIdRef.current;
  setIsLoading(true);

  customerService
    .autocomplete({ search: query, page: 1, limit: pageSize })
    .then((response) => {
      if (requestId !== requestIdRef.current) return; // stale response guard
      setOptions(response.data || []);
      setTotal(response.meta?.total ?? 0);
      setPage(1);
    })
    .finally(() => {
      if (requestId === requestIdRef.current) setIsLoading(false);
    });
}, [debouncedSearch, pageSize]);
```

`requestIdRef` discards responses from a search that's already been superseded by a newer one (e.g.
the user kept typing while an older request was still in flight).

### Infinite Scroll: `fetchMore()`

```typescript
const hasMore = options.length < total;

const fetchMore = useCallback(() => {
  const query = debouncedSearch.trim();
  if (!query || !hasMore || isLoading || isLoadingMore || fetchMoreInFlightRef.current) return;

  const nextPage = page + 1;
  fetchMoreInFlightRef.current = true;
  setIsLoadingMore(true);

  customerService
    .autocomplete({ search: query, page: nextPage, limit: pageSize })
    .then((response) => {
      setOptions((prev) => [...prev, ...(response.data || [])]);
      setTotal(response.meta?.total ?? 0);
      setPage(nextPage);
    })
    .finally(() => {
      fetchMoreInFlightRef.current = false;
      setIsLoadingMore(false);
    });
}, [debouncedSearch, hasMore, isLoading, isLoadingMore, page, pageSize]);
```

**Guards against duplicate/overlapping fetches**:
- `hasMore` — stop once every row for this search term has been loaded (`options.length >= total`)
- `isLoading` / `isLoadingMore` — don't start a second fetch while one is in flight
- `fetchMoreInFlightRef` — belt-and-suspenders re-entrancy guard for rapid scroll events

### Scroll Trigger (in the component)

```typescript
<ul
  className="max-h-60 overflow-auto"
  onScroll={(e) => {
    const target = e.currentTarget;
    if (hasMore && target.scrollHeight - target.scrollTop - target.clientHeight < SCROLL_LOAD_MORE_THRESHOLD_PX) {
      fetchMore();
    }
  }}
>
```

When the user scrolls within `SCROLL_LOAD_MORE_THRESHOLD_PX` (60px) of the bottom of the dropdown,
`fetchMore()` is called to append the next page.

### Dropdown States

| State | Display |
|-------|---------|
| Idle (no search) | Hidden dropdown |
| Searching (page 1) | "Searching..." message |
| No results | "No customers found" |
| Has results | List of matching customers |
| Loading more (scrolled near bottom) | "Loading more..." row appended below the list |
| Selected | Show selected customer in a box below |

### UI Structure

```
Input Field [Search here...]
    ↓
Dropdown (if open)
  ├─ "Searching..." (if isLoading)
  ├─ "No customers found" (if no results)
  └─ Customer List (scrollable, onScroll triggers fetchMore)
       ├─ Acme Corporation
       │   contact@acme.com
       ├─ Acme Solutions
       │   info@acmesolutions.com
       ├─ ... (more pages appended as user scrolls)
       └─ "Loading more..." (if isLoadingMore)
    ↓
Selected Customer Box (if selected)
  Acme Corporation
  contact@acme.com
```

## Styling with Tailwind

```typescript
// Input field
<input
  className="w-full px-3 py-2 border border-gray-300 rounded-md 
    shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
/>

// Dropdown
<div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 
  rounded-md shadow-lg">

// Scrollable option list (infinite scroll container)
<ul className="max-h-60 overflow-auto" onScroll={...}>

// Option item
<button
  className="w-full text-left px-3 py-2 hover:bg-blue-50 
    flex items-center justify-between"
>

// Selected box
<div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
```

## Search Examples

### Search: "acme" (14 total matches, page size 10)

```
Input: [acme____]

Dropdown (page 1, 10 rows):
├─ Acme Corporation
│  contact@acme.com
├─ Acme Solutions
│  info@acmesolutions.com
├─ ... (8 more)

User scrolls to bottom → fetchMore() → page 2 appended:
├─ Acme Widgets
├─ Acme Traders
├─ Acme Holdings
├─ Acme Retail
```

### Selection

User clicks "Acme Corporation":

```
Input: [Acme Corporation]

Selected Box:
┌─────────────────────────────┐
│ Acme Corporation            │
│ contact@acme.com            │
└─────────────────────────────┘

onSelect callback fired with:
{
  id: 1,
  publicId: "550e8400-...",
  displayName: "Acme Corporation",
  email: "contact@acme.com"
}
```

### Clear Selection

User clicks the ✕ button:

```
Input cleared
Dropdown closed
Selected box removed
Hook state reset via clear() — search, options, total, page all reset
onSelect callback fired with null
```

## Integration with Another Form

In any form, use autocomplete to **pre-select a customer** (e.g. an invoice or quote form):

```typescript
import { CustomerAutocomplete } from '@components/CustomerAutocomplete';
import type { CustomerAutocompleteOption } from '@types';
import { useState } from 'react';

export const InvoiceFormPage = () => {
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerAutocompleteOption | null>(null);

  return (
    <form>
      <CustomerAutocomplete
        value={selectedCustomer}
        onSelect={setSelectedCustomer}
      />

      {selectedCustomer && (
        <div>
          <h3>Invoice for: {selectedCustomer.displayName}</h3>
          {/* Add line items, total, etc. */}
        </div>
      )}
    </form>
  );
};
```

## Keyboard Navigation (Optional Enhancement)

The current implementation supports **mouse selection** and **scroll-to-load-more**. To add keyboard
support:

```typescript
const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === 'ArrowDown') {
    setHighlightedIndex(prev => Math.min(prev + 1, options.length - 1));
  }
  if (e.key === 'ArrowUp') {
    setHighlightedIndex(prev => Math.max(prev - 1, 0));
  }
  if (e.key === 'Enter' && options[highlightedIndex]) {
    handleSelect(options[highlightedIndex]);
  }
  if (e.key === 'Escape') {
    setIsOpen(false);
  }
};
```

---

**Previous**: [06. Frontend Customer Form](06-frontend-customer-form.md)  
**Next**: [08. Contracts, DI, and Typing](08-contracts-di-and-typing.md)
