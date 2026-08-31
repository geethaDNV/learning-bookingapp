# 03. Backend Customer CRUD

## Architecture: Repository → Service → Controller

The backend follows a **layered architecture** to separate concerns:

```
Request → Controller
            ↓
         Service (validation, business logic)
            ↓
         Repository (data access)
            ↓
         Prisma Client (ORM)
            ↓
         PostgreSQL
```

## Routes Overview

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v1/customers` | List customers (paged, searchable) |
| GET | `/api/v1/customers/:publicId` | Get single customer by public ID |
| GET | `/api/v1/customers/search` | Search customers (same as list, explicit) |
| GET | `/api/v1/customers/autocomplete` | Autocomplete for customer selection |
| POST | `/api/v1/customers` | Create customer |
| PUT | `/api/v1/customers/:publicId` | Update customer |
| PATCH | `/api/v1/customers/:publicId/status` | Activate/deactivate customer |

## Layer 1: Repository (Data Access)

**File**: `backend/src/repositories/customerRepository.ts` (barrel-exported via `repositories/index.ts`)

The repository implements `ICustomerRepository` interface:

```typescript
export interface ICustomerRepository {
  create(payload: CreateCustomerPayload): Promise<Customer>;
  findById(id: number): Promise<Customer | null>;
  findByPublicId(publicId: string): Promise<Customer | null>;
  findByEmail(email: string): Promise<Customer | null>;
  findByGstin(gstin: string): Promise<Customer | null>;
  findAll(filters?: { isActive?: boolean }): Promise<Customer[]>;
  findPaged(...): Promise<Customer[]>;
  search(query: CustomerListQuery): Promise<CustomerListResponse>;
  autocomplete(query: CustomerAutocompleteQuery): Promise<CustomerAutocompleteResponse>;
  update(publicId: string, payload: UpdateCustomerPayload): Promise<Customer | null>;
  setStatus(publicId: string, isActive: boolean): Promise<Customer | null>;
  count(filters?: { isActive?: boolean; search?: string }): Promise<number>;
}
```

### Example: Search Method

```typescript
async search(query: CustomerListQuery): Promise<CustomerListResponse> {
  const { page = 1, pageSize = 20, search, isActive, sortBy, sortOrder } = query;

  const where: any = {};
  
  if (isActive !== undefined) {
    where.isActive = isActive;
  }
  
  if (search) {
    // Multi-field OR search
    where.OR = [
      { displayName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
      { gstin: { contains: search, mode: 'insensitive' } },
    ];
  }

  const total = await this.prisma.customer.count({ where });
  const skip = (page - 1) * pageSize;

  const rows = await this.prisma.customer.findMany({
    where,
    orderBy: { [sortBy]: sortOrder },
    skip,
    take: pageSize,
  });

  return { rows: rows.map(c => this.mapToDomain(c)), total, page, pageSize };
}
```

**Key Points**:
- `OR` array allows multi-field search (name, email, phone, GSTIN)
- `mode: 'insensitive'` for case-insensitive matching
- Pagination via `skip` and `take`

## Layer 2: Service (Business Logic)

**File**: `backend/src/services/customerService.ts` (barrel-exported via `services/index.ts`)

The service implements `ICustomerService` and adds validation:

```typescript
export interface ICustomerService {
  create(payload: CreateCustomerPayload): Promise<Customer>;
  getById(id: number): Promise<Customer | null>;
  getByPublicId(publicId: string): Promise<Customer | null>;
  listAll(filters?: { isActive?: boolean }): Promise<Customer[]>;
  search(query: CustomerListQuery): Promise<CustomerListResponse>;
  autocomplete(query: CustomerAutocompleteQuery): Promise<CustomerAutocompleteResponse>;
  update(publicId: string, payload: UpdateCustomerPayload): Promise<Customer | null>;
  setStatus(publicId: string, isActive: boolean): Promise<Customer | null>;
}
```

### Example: Create with Validation

```typescript
async create(payload: CreateCustomerPayload): Promise<Customer> {
  // Check for duplicate email
  if (payload.email) {
    const existingByEmail = await this.repository.findByEmail(payload.email);
    if (existingByEmail) {
      throw new Error(CUSTOMER_ERROR_MESSAGES.DUPLICATE_EMAIL);
    }
  }

  // Check for duplicate GSTIN
  if (payload.gstin) {
    const existingByGstin = await this.repository.findByGstin(payload.gstin);
    if (existingByGstin) {
      throw new Error(CUSTOMER_ERROR_MESSAGES.DUPLICATE_GSTIN);
    }
  }

  return this.repository.create(payload);
}
```

**Why a Service?**
- Validates email uniqueness before DB insert
- Validates GSTIN uniqueness before DB insert
- Encapsulates business rules (not just data access)
- Easy to test (mock repository)

## Layer 3: Controller (HTTP Handler)

**File**: `backend/src/controllers/customerController.ts` (barrel-exported via `controllers/index.ts`)

The controller implements `ICustomerController`:

```typescript
export interface ICustomerController {
  getCustomers(req: Request, res: Response): Promise<void>;
  getCustomer(req: Request, res: Response): Promise<void>;
  searchCustomers(req: Request, res: Response): Promise<void>;
  autocompleteCustomers(req: Request, res: Response): Promise<void>;
  createCustomer(req: Request, res: Response): Promise<void>;
  updateCustomer(req: Request, res: Response): Promise<void>;
  setCustomerStatus(req: Request, res: Response): Promise<void>;
}
```

### Example: Create Customer

```typescript
async createCustomer(req: Request, res: Response): Promise<void> {
  try {
    // Parse & validate request body using Zod
    const body = parseBody(createCustomerSchema, req.body);
    
    // Call service
    const customer = await this.customerService.create(body);
    
    // Send success response
    sendResponse(
      res,
      {
        message: CUSTOMER_RESPONSE_MESSAGES.CREATE_SUCCESS,
        data: customer,
      },
      201
    );
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Duplicate')) {
        sendMessageResponse(res, error.message, 409); // Conflict
      } else {
        sendMessageResponse(res, error.message, 400);
      }
    } else {
      sendMessageResponse(res, CUSTOMER_ERROR_MESSAGES.INTERNAL_ERROR, 500);
    }
  }
}
```

## Request/Response Flow

### Example: Create Customer

**Request**:
```bash
POST /api/v1/customers
Content-Type: application/json

{
  "displayName": "My Company",
  "email": "contact@mycompany.com",
  "phone": "+91-9876543210",
  "gstin": "29AABCT1234H1Z5",
  "billingAddress": "123 Street, City, State 000000"
}
```

**Controller Logic**:
1. `parseBody(createCustomerSchema, req.body)` → Zod validation
2. `customerService.create(body)` → Business logic
3. `sendResponse(res, { message, data }, 201)` → HTTP 201 Created

**Response** (HTTP 201):
```json
{
  "success": true,
  "message": "Customer created successfully",
  "data": {
    "id": 1,
    "publicId": "550e8400-e29b-41d4-a716-446655440000",
    "displayName": "My Company",
    "email": "contact@mycompany.com",
    "phone": "+91-9876543210",
    "gstin": "29AABCT1234H1Z5",
    "billingAddress": "123 Street, City, State 000000",
    "isActive": true,
    "createdAt": "2026-08-30T10:00:00Z",
    "updatedAt": "2026-08-30T10:00:00Z",
    "createdBy": null,
    "updatedBy": null
  }
}
```

### Example: List Customers

**Request**:
```bash
GET /api/v1/customers?page=1&pageSize=20&search=acme&sortBy=displayName&sortOrder=asc
```

**Response** (HTTP 200):
```json
{
  "success": true,
  "message": "Customers retrieved successfully",
  "data": [
    {
      "id": 1,
      "publicId": "550e8400-e29b-41d4-a716-446655440000",
      "displayName": "Acme Corporation",
      "email": "contact@acme.com",
      ...
    }
  ],
  "meta": {
    "total": 5,
    "page": 1,
    "pageSize": 20
  }
}
```

## Error Handling

| Status | Scenario |
|--------|----------|
| 400 | Validation error (Zod parsing failed) |
| 404 | Customer not found by ID |
| 409 | Conflict (duplicate email/GSTIN) |
| 500 | Unexpected server error |

---

**Previous**: [02. Customer Model and Seed Data](02-customer-model-and-seed.md)  
**Next**: [04. Customer Validation](04-customer-validation.md)
