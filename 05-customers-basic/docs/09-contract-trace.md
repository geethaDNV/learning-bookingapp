# 09. Contract Trace: From Autocomplete to Invoice Form

## End-to-End Data Flow

This document traces a `customerId` and `displayName` from the autocomplete component through to how it will be used in a future invoice form.

## Scenario: User Creates an Invoice

### Step 1: User Opens Invoice Form

**URL**: `/invoices/create`

```typescript
export const InvoiceFormPage = () => {
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerAutocompleteOption | null>(null);

  return (
    <form>
      <CustomerAutocomplete
        value={selectedCustomer}
        onSelect={setSelectedCustomer}
      />
    </form>
  );
};
```

### Step 2: User Types "Acme" in Autocomplete

**Input**: User types "acme" in the search field.

```
CustomerAutocomplete component:
├─ Input value: "acme"
└─ useCustomerAutocomplete().setSearch("acme") triggered
```

### Step 3: Debounce & API Call (page 1)

```typescript
// useCustomerAutocomplete.ts
useEffect(() => {
  const timer = setTimeout(() => setDebouncedSearch(search), SEARCH_DEBOUNCE_MS);
  return () => clearTimeout(timer);
}, [search]);

useEffect(() => {
  const query = debouncedSearch.trim();
  if (!query) return;

  setIsLoading(true);
  customerService
    .autocomplete({ search: query, page: 1, limit: pageSize })
    // Call: GET /api/v1/customers/autocomplete?search=acme&page=1&limit=10
    .then((response) => {
      setOptions(response.data || []);      // [ CustomerAutocompleteOption, ... ]
      setTotal(response.meta?.total ?? 0);
      setPage(1);
    })
    .finally(() => setIsLoading(false));
}, [debouncedSearch, pageSize]);
```

### Step 4: Backend Search

**Endpoint**: `GET /api/v1/customers/autocomplete?search=acme&page=1&limit=10`

```typescript
// Controller
async autocompleteCustomers(req: Request, res: Response): Promise<void> {
  const query = parseQuery(autocompleteQuerySchema, req.query);
  const result = await this.customerService.autocomplete(query);
  sendResponse(res, {
    message: CUSTOMER_RESPONSE_MESSAGES.AUTOCOMPLETE_SUCCESS,
    data: result.rows,
    meta: { total: result.total, page: result.page, pageSize: result.pageSize },
  });
}

// Service
async autocomplete(query): Promise<CustomerAutocompleteResponse> {
  return this.repository.autocomplete(query);
}

// Repository
async autocomplete(query): Promise<CustomerAutocompleteResponse> {
  const { search, page = 1, limit = 10 } = query;
  const where = {
    OR: [
      { displayName: { contains: search, mode: 'insensitive' } },
      // ... other fields
    ]
  };

  const total = await this.prisma.customer.count({ where });
  const customers = await this.prisma.customer.findMany({
    where,
    select: { id: true, publicId: true, displayName: true, email: true },
    orderBy: { displayName: 'asc' },
    skip: (page - 1) * limit,
    take: limit,
  });

  return { rows: customers, total, page, pageSize: limit };
}
```

### Step 5: Frontend Receives Options

```typescript
// Response from backend
{
  data: [
    {
      id: 1,
      publicId: "550e8400-e29b-41d4-a716-446655440000",
      displayName: "Acme Corporation",
      email: "contact@acme.com"
    }
  ],
  meta: { total: 14, page: 1, pageSize: 10 }
}

// CustomerAutocomplete displays:
Dropdown:
├─ Acme Corporation
  contact@acme.com
```

### Step 5b: User Scrolls — Next Page Appended

```typescript
// CustomerAutocomplete.tsx — onScroll handler on the dropdown <ul>
if (hasMore && target.scrollHeight - target.scrollTop - target.clientHeight < SCROLL_LOAD_MORE_THRESHOLD_PX) {
  fetchMore(); // useCustomerAutocomplete: GET .../autocomplete?search=acme&page=2&limit=10
}

// useCustomerAutocomplete.ts — appends instead of replacing
setOptions((prev) => [...prev, ...(response.data || [])]);
```

### Step 6: User Clicks "Acme Corporation"

```typescript
// CustomerAutocomplete.tsx
const handleSelect = (option: CustomerAutocompleteOption) => {
  onSelect(option);  // Call prop callback
  clear();           // useCustomerAutocomplete: resets search, options, total, page
  setIsOpen(false);
};

// InvoiceFormPage receives callback
setSelectedCustomer({
  id: 1,
  publicId: "550e8400-e29b-41d4-a716-446655440000",
  displayName: "Acme Corporation",
  email: "contact@acme.com"
});
```

### Step 7: Form State Updated

```typescript
// InvoiceFormPage component state
{
  selectedCustomer: {
    id: 1,
    publicId: "550e8400-e29b-41d4-a716-446655440000",
    displayName: "Acme Corporation",
    email: "contact@acme.com"
  }
}

// Display in form
<div>
  <h3>Invoice for: Acme Corporation</h3>
  <p>Email: contact@acme.com</p>
</div>
```

### Step 8: User Adds Line Items and Total

```typescript
// Form state now includes
{
  customerId: "550e8400-e29b-41d4-a716-446655440000",
  lineItems: [
    { description: "Service", amount: 1000 },
    { description: "Tax", amount: 100 }
  ],
  total: 1100
}
```

### Step 9: User Submits Form

```typescript
// InvoiceFormPage
const onSubmit = async (formData) => {
  const payload: CreateInvoicePayload = {
    customerId: selectedCustomer.publicId,  // ← Use publicId here
    billingName: selectedCustomer.displayName,  // ← Denormalize displayName
    billingEmail: selectedCustomer.email,       // ← Denormalize email
    // ... line items, total
  };

  await dispatch(createInvoice(payload)).unwrap();
};
```

### Step 10: Backend Creates Invoice

```typescript
// InvoiceController
async createInvoice(req: Request, res: Response): Promise<void> {
  const body = parseBody(createInvoiceSchema, req.body);
  // body.customerId = "550e8400-e29b-41d4-a716-446655440000"
  // body.billingName = "Acme Corporation"
  // body.billingEmail = "contact@acme.com"
  
  const invoice = await this.invoiceService.create(body);
  sendResponse(res, { message: '...', data: invoice }, 201);
}

// InvoiceService
async create(payload: CreateInvoicePayload): Promise<Invoice> {
  // Verify customer exists
  const customer = await this.customerRepository.findByPublicId(payload.customerId);
  if (!customer) throw new Error('Customer not found');

  // Denormalize customer fields into invoice record
  const invoiceData = {
    customerId: customer.id,  // Store internal ID for FK
    billingName: payload.billingName,  // "Acme Corporation" as it was at invoice time
    billingEmail: payload.billingEmail,  // "contact@acme.com" as it was
    billingGstin: customer.gstin,  // "29AABCT1234H1Z5"
    // ... line items, total
  };

  return this.invoiceRepository.create(invoiceData);
}

// Database
INSERT INTO invoices (
  customer_id,
  billing_name,
  billing_email,
  billing_gstin,
  line_items,
  total
) VALUES (
  1,
  'Acme Corporation',
  'contact@acme.com',
  '29AABCT1234H1Z5',
  [...],
  1100
);
```

## Why Denormalize?

```typescript
// ❌ BAD: Store only customerId, fetch name at display time
Invoice {
  customerId: 1
}
// Problem: If customer name changes, invoice shows new name (wrong!)

// ✅ GOOD: Store customer name as it was at invoice time
Invoice {
  customerId: 1,
  billingName: "Acme Corporation"  // Snapshot at invoice time
}
// Correct: Invoice always shows "Acme Corporation" even if customer updated to "Acme Solutions"
```

## Data Journey Summary

```
autocomplete input ("acme")
  ↓ [Customer Autocomplete Component]
API request (GET /api/v1/customers/autocomplete?search=acme)
  ↓ [Backend Repository]
Query database (SELECT ... FROM customers WHERE displayName LIKE '%acme%')
  ↓ [Prisma ORM]
Customer records matched
  ↓ [Backend Repository]
Select minimal fields (id, publicId, displayName, email)
  ↓ [Backend Controller]
API response
  ↓ [Customer Autocomplete Component]
Dropdown renders options
  ↓ [User click]
onSelect callback fires
  ↓ [Invoice Form Page]
selectedCustomer state updated
  ↓ [User submits invoice]
createInvoice thunk dispatched
  ↓ [Invoice Service]
Denormalize customer into invoice (name, email, GSTIN snapshot)
  ↓ [Invoice Repository]
INSERT invoice record
  ↓ [PostgreSQL]
Invoice stored with customer data as of creation time
```

## Types Through the Stack

```typescript
// Backend AutocompleteOption (one row)
interface CustomerAutocompleteOption {
  id: number;
  publicId: string;  // UUID
  displayName: string;
  email: string | null;
}

// Backend paginated response (repository/service/controller data)
interface CustomerAutocompleteResponse {
  rows: CustomerAutocompleteOption[];
  total: number;
  page: number;
  pageSize: number;
}

// Frontend Component Prop
interface CustomerAutocompleteProps {
  value: CustomerAutocompleteOption | null;
  onSelect: (customer: CustomerAutocompleteOption | null) => void;
}

// Invoice Create Payload (future)
interface CreateInvoicePayload {
  customerId: string;  // publicId from CustomerAutocompleteOption
  billingName: string; // displayName snapshot
  billingEmail: string; // email snapshot
  // ... line items, total
}
```

---

**Previous**: [08. Contracts, DI, and Typing](08-contracts-di-and-typing.md)  
**Next**: [10. How This Maps to Production](10-how-this-maps-to-production.md)
