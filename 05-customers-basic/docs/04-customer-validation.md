# 04. Customer Validation with Zod

## Validation at the Boundary

**Zod schemas** validate and parse input at the HTTP boundary before any business logic runs:

```
HTTP Request
    ↓
Zod Schema (validation)
    ↓
Parsed Data (strongly typed)
    ↓
Service/Repository (guaranteed valid)
```

## Schemas

**File**: `backend/src/schemas/index.ts`

### Create Customer Schema

```typescript
export const createCustomerSchema = z.object({
  customerType: z.enum(['business', 'individual']),
  displayName: z.string()
    .min(2, 'Display name must be at least 2 characters')
    .max(255),
  email: z.string()
    .email('Invalid email format')
    .optional()
    .or(z.literal('')),
  phone: z.string()
    .max(20)
    .optional()
    .or(z.literal('')),
  gstin: z.string()
    .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/, 'Invalid GSTIN format')
    .optional()
    .or(z.literal('')),
  pan: z.string()
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, 'Invalid PAN format')
    .optional()
    .or(z.literal('')),
  billingAddress: z.string()
    .optional()
    .or(z.literal('')),
}).superRefine((value, context) => {
  if (value.customerType === 'business' && !value.gstin) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['gstin'], message: 'GSTIN is required for a business customer' });
  }
  if (value.customerType === 'individual' && !value.pan) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['pan'], message: 'PAN is required for an individual customer' });
  }
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
```

### Update Customer Schema

```typescript
export const updateCustomerSchema = z.object({
  customerType: z.enum(['business', 'individual']).optional(),
  displayName: z.string().min(2).max(255).optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().max(20).optional().or(z.literal('')),
  gstin: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/, 'Invalid GSTIN format').optional().or(z.literal('')),
  pan: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, 'Invalid PAN format').optional().or(z.literal('')),
  billingAddress: z.string().optional().or(z.literal('')),
  isActive: z.boolean().optional(),
});
```

### List Query Schema

```typescript
export const listCustomersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  isActive: z.enum(['true', 'false'])
    .optional()
    .transform(v => v === 'true'),  // Convert string to boolean
  sortBy: z.enum(['displayName', 'createdAt', 'email', 'phone'])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type ListCustomersQuery = z.infer<typeof listCustomersQuerySchema>;
```

### Autocomplete Query Schema

```typescript
export const autocompleteQuerySchema = z.object({
  search: z.string().min(1, 'Search term required'),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  isActive: z.enum(['true', 'false'])
    .optional()
    .transform(v => v === 'true'),
});

export type AutocompleteQuery = z.infer<typeof autocompleteQuerySchema>;
```

## Usage in Controller

```typescript
async createCustomer(req: Request, res: Response): Promise<void> {
  try {
    // Zod parses and validates the request body
    const body = parseBody(createCustomerSchema, req.body);
    // body is now guaranteed to have:
    // - displayName: string (2-255 chars)
    // - email?: string (valid email or empty)
    // - phone?: string (max 20 chars)
    // - gstin?: string (max 15 chars)
    // - billingAddress?: string

    const customer = await this.customerService.create(body);
    sendResponse(res, { message: '...', data: customer }, 201);
  } catch (error) {
    if (error instanceof Error && error.message.includes('validation')) {
      sendMessageResponse(res, CUSTOMER_RESPONSE_MESSAGES.VALIDATION_ERROR, 400);
    } else {
      sendMessageResponse(res, CUSTOMER_ERROR_MESSAGES.INTERNAL_ERROR, 500);
    }
  }
}
```

## Validation Examples

### Valid Input

```json
{
  "displayName": "Acme Corp",
  "email": "contact@acme.com",
  "phone": "+91-9876543210",
  "gstin": "29AABCT1234H1Z5",
  "billingAddress": "123 Business St, Mumbai"
}
```

✅ **Passes**: All required fields present, formats correct.

### Missing Email (OK)

```json
{
  "displayName": "Acme Corp"
}
```

✅ **Passes**: Email is optional (`.optional()`).

### Empty Email (OK)

```json
{
  "displayName": "Acme Corp",
  "email": ""
}
```

✅ **Passes**: `.or(z.literal(''))` allows empty string to mean "no email".

### Invalid Email (FAIL)

```json
{
  "displayName": "Acme Corp",
  "email": "not-an-email"
}
```

❌ **Fails**: Zod throws validation error → Controller catches → HTTP 400.

Response:
```json
{
  "success": false,
  "message": "Validation error: email: Invalid email format"
}
```

### Name Too Short (FAIL)

```json
{
  "displayName": "A"
}
```

❌ **Fails**: Display name must be at least 2 characters.

### GSTIN Too Long (FAIL)

```json
{
  "displayName": "Acme Corp",
  "gstin": "29AABCT1234H1Z5EXTRA"
}
```

❌ **Fails**: GSTIN exceeds 15 character limit.

## Query Parameter Validation

Query parameters come as **strings** in the URL, so Zod must coerce them:

```typescript
// URL: /api/v1/customers?page=2&pageSize=10&isActive=true

// Zod coerces and parses:
{
  page: 2,            // z.coerce.number() converts "2" → 2
  pageSize: 10,       // z.coerce.number() converts "10" → 10
  isActive: true,     // .transform(v => v === 'true') converts "true" → true
  sortBy: 'createdAt',
  sortOrder: 'desc'
}
```

## Duplicate Validation (Service Layer)

While Zod handles **format** validation, **business logic** validation happens in the service:

```typescript
// Zod validates email format
// Service validates email uniqueness

async create(payload: CreateCustomerPayload): Promise<Customer> {
  if (payload.email) {
    const existingByEmail = await this.repository.findByEmail(payload.email);
    if (existingByEmail) {
      throw new Error(CUSTOMER_ERROR_MESSAGES.DUPLICATE_EMAIL);
    }
  }
  
  if (payload.gstin) {
    const existingByGstin = await this.repository.findByGstin(payload.gstin);
    if (existingByGstin) {
      throw new Error(CUSTOMER_ERROR_MESSAGES.DUPLICATE_GSTIN);
    }
  }

  return this.repository.create(payload);
}
```

| Validation Type | Who | When | Example |
|---|---|---|---|
| Format | Zod | Parse time | Email format, string length |
| Business Logic | Service | Create/update | Duplicate email, duplicate GSTIN |
| Authorization | Middleware | Request time | (Not in this module) |

---

**Previous**: [03. Backend Customer CRUD](03-backend-customer-crud.md)  
**Next**: [05. Customer Autocomplete API](05-customer-autocomplete-api.md)
