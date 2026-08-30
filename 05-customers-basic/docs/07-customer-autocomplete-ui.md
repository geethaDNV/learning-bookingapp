# 07. Customer Autocomplete UI

## Component: `CustomerAutocomplete.tsx`

The autocomplete component powers live customer selection with:
- **Debounced search** to avoid flooding the backend
- **Loading state** while searching
- **Empty state** when no results
- **Selected option display** to confirm choice

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

## Props

```typescript
interface CustomerAutocompleteProps {
  value: CustomerAutocompleteOption | null;      // Currently selected customer
  onSelect: (customer: CustomerAutocompleteOption) => void;  // Callback on selection
  placeholder?: string;                            // Input placeholder
}
```

## Component Flow

```
User types in search input
    ↓
handleSearch() runs
    ↓
Debounce (300ms default) - wait for user to stop typing
    ↓
Call customerService.autocomplete(query)
    ↓
Set loading = true
    ↓
Backend returns results
    ↓
Set loading = false
Set options = results
Set isOpen = true
    ↓
User clicks option
    ↓
handleSelect() runs
    ↓
Call onSelect(option)
    ↓
Clear search
Close dropdown
```

## Implementation Details

### Debounced Search

```typescript
const handleSearch = useCallback(async (query: string) => {
  setSearch(query);

  if (!query.trim()) {
    setOptions([]);
    setIsOpen(false);
    return;
  }

  setLoading(true);
  try {
    const response = await customerService.autocomplete(query, 10);
    if (response.success) {
      setOptions(response.data || []);
      setIsOpen(true);
    }
  } catch (error) {
    console.error('Autocomplete error:', error);
    setOptions([]);
  } finally {
    setLoading(false);
  }
}, []);
```

**Why debounce?**
- Don't search on every keystroke
- Wait 300ms after user stops typing
- Reduces backend load
- Better UX (less flickering)

### Dropdown States

| State | Display |
|-------|---------|
| Idle (no search) | Hidden dropdown |
| Searching | "Searching..." message |
| No results | "No customers found" |
| Has results | List of matching customers |
| Selected | Show selected customer in a box below |

### UI Structure

```
Input Field [Search here...]
    ↓
Dropdown (if open)
  ├─ "Searching..." (if loading)
  ├─ "No customers found" (if no results)
  └─ Customer List (if results)
       ├─ Acme Corporation
       │   contact@acme.com
       ├─ Acme Solutions
       │   info@acmesolutions.com
       └─ ...
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

// Option item
<button
  className="w-full text-left px-3 py-2 hover:bg-blue-50 
    flex items-center justify-between"
>

// Selected box
<div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
```

## Search Examples

### Search: "acme"

```
Input: [acme____]

Dropdown:
├─ Acme Corporation
│  contact@acme.com
├─ Acme Solutions
│  info@acmesolutions.com
```

### Search: "9876543210" (phone)

```
Input: [9876543210____]

Dropdown:
├─ Acme Corporation
│  contact@acme.com
```

### Search: "29AABCT" (GSTIN prefix)

```
Input: [29AABCT____]

Dropdown:
├─ Acme Corporation
│  contact@acme.com
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
onSelect callback fired with null
```

## Integration with Customer Form

In `CustomerFormPage`, use autocomplete to **pre-select a customer** (future use in invoice form):

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

The current implementation supports **mouse selection**. To add keyboard support:

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
