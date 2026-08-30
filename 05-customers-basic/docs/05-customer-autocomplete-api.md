# 05. Customer Autocomplete API

## Purpose

The autocomplete endpoint powers **live search** as a user types in a form field. It:

1. **Searches by partial input** (name, email, phone, GSTIN)
2. **Returns limited results** (e.g., 10) for fast UI responsiveness
3. **Filters by status** (only active customers)
4. **Shapes response for UI** (minimal fields needed)

## Endpoint

```
GET /api/v1/customers/autocomplete?search=acme&limit=10&isActive=true
```

## Request Parameters

| Parameter | Type | Default | Required | Description |
|-----------|------|---------|----------|-------------|
| `search` | string | - | **Yes** | Partial search term (min 1 char) |
| `limit` | number | 10 | No | Max results (1-50) |
| `isActive` | boolean | true | No | Filter by active status |

## Request Examples

### Basic Search by Name

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
  ]
}
```

### Search by Email

```bash
GET /api/v1/customers/autocomplete?search=contact@acme.com
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
    }
  ]
}
```

### Search by Phone

```bash
GET /api/v1/customers/autocomplete?search=9876543210
```

**Response**:
```json
{
  "success": true,
  "message": "Autocomplete results retrieved",
  "data": [
    {
      "id": 5,
      "publicId": "550e8400-e29b-41d4-a716-446655440004",
      "displayName": "Premium Services Group",
      "email": "hello@premiumservices.com"
    }
  ]
}
```

### Search by GSTIN

```bash
GET /api/v1/customers/autocomplete?search=29AABCT1234H1Z5
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
    }
  ]
}
```

### With Limit

```bash
GET /api/v1/customers/autocomplete?search=a&limit=5
```

Returns up to 5 results (instead of default 10).

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
  "data": []
}
```

## Response Shape: `CustomerAutocompleteOption`

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

```typescript
async autocomplete(query: CustomerAutocompleteQuery): Promise<CustomerAutocompleteOption[]> {
  const { search, limit = 10, isActive } = query;

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

  const customers = await this.prisma.customer.findMany({
    where,
    select: {
      id: true,
      publicId: true,
      displayName: true,
      email: true,
    },
    orderBy: { displayName: 'asc' },
    take: limit,
  });

  return customers;
}
```

**Key Points**:
- `select: { id, publicId, displayName, email }` returns only needed fields
- `OR` searches across multiple fields (case-insensitive)
- `take: limit` restricts results
- `orderBy: { displayName: 'asc' }` alphabetical order for predictable UX

## Frontend Integration

The `CustomerAutocomplete` component uses this endpoint:

```typescript
async autocomplete(search: string, limit: number = 10): Promise<ApiResponse<CustomerAutocompleteOption[]>> {
  const response = await this.api.get<ApiResponse<CustomerAutocompleteOption[]>>(
    '/v1/customers/autocomplete',
    { params: { search, limit, isActive: true } }
  );
  return response.data;
}
```

See [07. Customer Autocomplete UI](07-customer-autocomplete-ui.md) for debouncing and loading states.

---

**Previous**: [04. Customer Validation](04-customer-validation.md)  
**Next**: [06. Frontend Customer Form](06-frontend-customer-form.md)
