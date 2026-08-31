# 05. Customer Autocomplete API

## Purpose

The autocomplete endpoint powers **live, paginated search** as a user types in a form field and scrolls
through results. It:

1. **Searches by partial input** (name, email, phone, GSTIN)
2. **Paginates results** (server-side, page-based) so the dropdown can infinite-scroll instead of
   dumping the whole match set at once
3. **Filters by status** (only active customers by default)
4. **Shapes response for UI** (minimal fields needed)

Unlike the general `search`/`list` endpoints, autocomplete is **always server-paginated** — there is no
client-side "small dataset" fast path here, since a search-as-you-type dropdown always wants bounded,
incremental pages.

## Endpoint

```
GET /api/v1/customers/autocomplete?search=acme&page=1&limit=10&isActive=true
```

## Request Parameters

| Parameter | Type | Default | Required | Description |
|-----------|------|---------|----------|-------------|
| `search` | string | - | **Yes** | Partial search term (min 1 char) |
| `page` | number | 1 | No | Page number (1-based) |
| `limit` | number | 10 | No | Page size / max results per page (1-50) |
| `isActive` | boolean | true | No | Filter by active status |

## Request Examples

### Basic Search by Name (page 1)

```bash
GET /api/v1/customers/autocomplete?search=acme
```

**Response**:
```json
{
  "success": true,
  "message": "Autocomplete results retrieved",
  "data": [
    {
      "id": 1,
      "publicId": "550e8400-e29b-41d4-a716-446655440000",
      "displayName": "Acme Corporation",
      "email": "contact@acme.com"
    },
    {
      "id": 2,
      "publicId": "550e8400-e29b-41d4-a716-446655440001",
      "displayName": "Acme Solutions",
      "email": "info@acmesolutions.com"
    }
  ],
  "meta": {
    "total": 14,
    "page": 1,
    "pageSize": 10
  }
}
```

`meta.total` is the full match count for the search term — the frontend uses it to know whether more
pages exist (`options.length < total`).

### Loading the Next Page (infinite scroll)

```bash
GET /api/v1/customers/autocomplete?search=acme&page=2&limit=10
```

**Response**:
```json
{
  "success": true,
  "message": "Autocomplete results retrieved",
  "data": [
    { "id": 11, "publicId": "550e8400-...", "displayName": "Acme Widgets", "email": null }
  ],
  "meta": {
    "total": 14,
    "page": 2,
    "pageSize": 10
  }
}
```

The frontend appends these rows to the already-displayed list rather than replacing it (see
[07. Customer Autocomplete UI](07-customer-autocomplete-ui.md)).

### Search by Email

```bash
GET /api/v1/customers/autocomplete?search=contact@acme.com
```

### Search by Phone

```bash
GET /api/v1/customers/autocomplete?search=9876543210
```

### Search by GSTIN

```bash
GET /api/v1/customers/autocomplete?search=29AABCT1234H1Z5
```

### With a Smaller Page Size

```bash
GET /api/v1/customers/autocomplete?search=a&limit=5
```

Returns up to 5 results per page (instead of default 10).

### Include Inactive

```bash
GET /api/v1/customers/autocomplete?search=acme&isActive=false
```

Returns both active and inactive customers matching "acme".

## No Results

```bash
GET /api/v1/customers/autocomplete?search=nonexistent
```

**Response**:
```json
{
  "success": true,
  "message": "Autocomplete results retrieved",
  "data": [],
  "meta": { "total": 0, "page": 1, "pageSize": 10 }
}
```

## Response Shapes

### `CustomerAutocompleteOption` (one row)

```typescript
interface CustomerAutocompleteOption {
  id: number;              // Internal ID
  publicId: string;        // External ID (UUID)
  displayName: string;     // Show in autocomplete list
  email: string | null;    // Show as secondary text
}
```

**Why only these fields?**
- Minimal payload for fast network transfer
- `publicId` to identify selection (not `id`)
- `displayName` for visual match to search
- `email` for context in dropdown

The full `Customer` record is fetched **after** selection (separate GET request).

### `CustomerAutocompleteResponse` (repository/service return shape)

```typescript
interface CustomerAutocompleteResponse {
  rows: CustomerAutocompleteOption[];
  total: number;
  page: number;
  pageSize: number;
}
```

The controller unwraps this into `{ data: rows, meta: { total, page, pageSize } }`, mirroring the
`getCustomers`/`search` list endpoints' pagination shape.

## Validation Errors

### Missing Search Term

```bash
GET /api/v1/customers/autocomplete
```

**Response** (HTTP 400):
```json
{
  "success": false,
  "message": "Validation error: search: Search term required"
}
```

### Invalid Limit

```bash
GET /api/v1/customers/autocomplete?search=acme&limit=1000
```

**Response** (HTTP 400):
```json
{
  "success": false,
  "message": "Validation error: limit: Expected <= 50"
}
```

## Implementation in Repository

**File**: `backend/src/repositories/customerRepository.ts`

```typescript
async autocomplete(query: CustomerAutocompleteQuery): Promise<CustomerAutocompleteResponse> {
  const { search, page = 1, limit = 10, isActive } = query;

  const where: any = {
    OR: [
      { displayName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
      { gstin: { contains: search, mode: 'insensitive' } },
    ],
  };

  if (isActive !== undefined) {
    where.isActive = isActive;
  }

  const total = await this.prisma.customer.count({ where });
  const skip = (page - 1) * limit;

  const customers = await this.prisma.customer.findMany({
    where,
    select: {
      id: true,
      publicId: true,
      displayName: true,
      email: true,
    },
    orderBy: { displayName: 'asc' },
    skip,
    take: limit,
  });

  return { rows: customers, total, page, pageSize: limit };
}
```

**Key Points**:
- `select: { id, publicId, displayName, email }` returns only needed fields
- `OR` searches across multiple fields (case-insensitive)
- `count({ where })` + `skip`/`take` gives real page-based pagination (same pattern as `search()`)
- `orderBy: { displayName: 'asc' }` alphabetical order for predictable UX and stable paging

## Frontend Integration

The `customerService.autocomplete()` method and the `useCustomerAutocomplete` hook consume this
endpoint:

```typescript
// frontend/src/services/customerService.ts
async autocomplete(query: CustomerAutocompleteQuery): Promise<ApiResponse<CustomerAutocompleteOption[]>> {
  const response = await this.api.get<ApiResponse<CustomerAutocompleteOption[]>>(
    '/v1/customers/autocomplete',
    { params: { isActive: true, ...query } }
  );
  return response.data;
}
```

See [07. Customer Autocomplete UI](07-customer-autocomplete-ui.md) for debouncing, infinite-scroll
paging, and loading states.

---

**Previous**: [04. Customer Validation](04-customer-validation.md)  
**Next**: [06. Frontend Customer Form](06-frontend-customer-form.md)
