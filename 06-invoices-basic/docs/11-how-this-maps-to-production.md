# 11 - How This Maps to Production

## Purpose

This document connects the learning module to the production BookKeepingApp codebase so you can recognize patterns when working with real code.

## Project Structure Mapping

### Backend

**Learning Module:** `learning-bookingapp/06-invoices-basic/backend/src/`
**Production:** `BookKeepingApp/backend/`

```
06-invoices-basic/backend/          BookKeepingApp/backend/
├── controllers/                     ├── controllers/
│   ├── InvoiceController.ts         │   ├── invoices/
│   └── SearchController.ts          │   │   └── ...
├── services/                        ├── services/
│   ├── InvoiceService.ts            │   ├── invoices/
│   └── InvoiceNumberService.ts      │   │   └── ...
├── repositories/                    ├── repositories/
│   ├── InvoiceRepository.ts         │   ├── invoices/
│   └── LookupRepositories.ts        │   │   └── ...
├── di/                              ├── di/
│   ├── contracts.ts                 │   ├── (similar pattern)
│   └── container.ts                 │   │
├── schemas/                         ├── schemas/
│   └── index.ts                     │   ├── invoices/
├── types/                           ├── types/
│   └── index.ts                     │   └── index.ts
└── routes/                          └── routes/
    └── index.ts                         └── ...
```

**Key difference:** Production splits by feature (e.g., `controllers/invoices/`, `services/invoices/`), learning module is simpler but follows same patterns.

### Frontend

**Learning Module:** `learning-bookingapp/06-invoices-basic/frontend/src/`
**Production:** `BookKeepingApp/frontend/src/`

```
06-invoices-basic/frontend/         BookKeepingApp/frontend/src/
├── pages/                           ├── features/
│   ├── InvoiceListPage.tsx          │   ├── invoices/
│   ├── InvoiceFormPage.tsx          │   │   ├── pages/
│   └── InvoiceDetailPage.tsx        │   │   ├── components/
├── components/                      │   │   └── (similar structure)
│   ├── InvoiceForm.tsx              │
│   ├── InvoiceList.tsx              │
│   ├── CustomerAutocomplete.tsx     │
│   └── ItemAutocomplete.tsx         │
├── services/                        ├── services/
│   └── api.ts                       │   ├── invoiceApi.ts
├── store/                           ├── store/
│   ├── index.ts                     │   ├── store.ts
│   └── invoiceSlice.ts              │   ├── invoices/
├── hooks/                           │   │   └── invoiceSlice.ts
│   └── useInvoiceCalculations.ts    │
└── types/                           └── types/
    └── index.ts                         └── index.ts
```

**Key difference:** Production organizes by feature within `features/`, learning module is flat but uses same Redux and hook patterns.

## Service Patterns

### Learning: IInvoiceService

```typescript
export interface IInvoiceService {
  createInvoice(data): Promise<{ id, publicId, invoiceNumber }>;
  getInvoice(publicId: string): Promise<InvoiceDTO>;
  updateInvoice(publicId: string, data): Promise<void>;
  updateInvoiceStatus(publicId: string, status): Promise<void>;
  listInvoices(options): Promise<{ items, total }>;
}
```

### Production: IInvoiceService

Production has the same interface structure but:
- More methods for advanced operations
- Additional auth/org context
- Email sending hooks
- Payment integration points
- Audit logging

**Similarity:** Core CRUD operations and status transitions follow same pattern.

## Repository Patterns

### Learning: InvoiceRepository

```typescript
async create(data): Promise<{ id, publicId, invoiceNumber }>;
async findByPublicId(publicId): Promise<Invoice | null>;
async update(id, data): Promise<void>;
async replaceLines(invoiceId, lines): Promise<void>;
async updateStatus(id, status): Promise<void>;
async list(options): Promise<Invoice[]>;
async count(options): Promise<number>;
```

### Production: InvoiceRepository

Production has:
- More sophisticated querying (filters, sorting)
- Audit trail insertion
- Organization/tenant filtering
- Status transition validation
- Journal posting (accounting integration)

**Similarity:** Core data access methods are the same; production adds cross-cutting concerns.

## Type Patterns

### Learning: InvoiceDTO

```typescript
interface InvoiceDTO {
  id: number;
  publicId: string;
  invoiceNumber: string;
  customerId: number;
  customerName: string;
  status: "DRAFT" | "SENT" | "PAID" | "CANCELLED";
  subtotal: string;
  totalTax: string;
  total: string;
  notes: string | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  lines: InvoiceLineDTO[];
}
```

### Production: InvoiceDTO

Production has:
- More fields (`organizationId`, `orgName`, `seller` info)
- Tax details (multiple tax types)
- Payment status and history
- Quote linkage
- Approval workflow fields

**Similarity:** Core fields are the same; production adds domain-specific extensions.

## DI Container

### Learning: createCradle()

```typescript
export function createCradle(prisma: PrismaClient): Cradle {
  const calculator = new InvoiceCalculator();
  const invoiceNumberService = new InvoiceNumberService(prisma);
  // ... wire all services
  return { calculator, invoiceNumberService, ... };
}
```

### Production: Similar pattern

Production uses same DI principle but:
- More services for auth, logging, email, etc.
- Possibly uses a DI library (e.g., `awilix`)
- Request-scoped dependencies (org context)

**Similarity:** DI container wires all services in one place.

## API Routes

### Learning Routes

```
POST   /api/v1/invoices
GET    /api/v1/invoices
GET    /api/v1/invoices/:publicId
PUT    /api/v1/invoices/:publicId
PATCH  /api/v1/invoices/:publicId/status
GET    /api/v1/customers/search?q=...
GET    /api/v1/items/search?q=...
```

### Production Routes

Production has:
- Org-scoped routes: `/api/v1/orgs/:orgId/invoices`
- Auth middleware: `POST /api/v1/invoices` requires auth
- Conversions: `POST /api/v1/invoices/convert-quote/:quoteId`
- Email: `POST /api/v1/invoices/:publicId/send`
- Payments: `POST /api/v1/invoices/:publicId/record-payment`

**Similarity:** Same endpoint structure; production adds auth and cross-feature integrations.

## Frontend Component Patterns

### Learning: CustomerAutocomplete

```typescript
function CustomerAutocomplete<T extends FieldValues>({
  control,
  name,
  label,
  required,
}) {
  const [options, setOptions] = useState<CustomerOption[]>([]);
  const handleSearch = async (query) => {
    const results = await SearchApiService.searchCustomers(query);
    setOptions(results);
  };
  // ...
}
```

### Production: Similar pattern

Production may have:
- More configuration options
- Caching of search results
- User preferences (default customer)
- Debounced search
- Analytics/tracking

**Similarity:** React Hook Form integration and search API pattern are the same.

## State Management

### Learning: Redux Slice

```typescript
export const createInvoice = createAsyncThunk("invoices/create", async (data) => {
  return InvoiceApiService.createInvoice(data);
});

export const invoiceSlice = createSlice({
  name: "invoices",
  initialState,
  extraReducers: (builder) => {
    builder.addCase(createInvoice.fulfilled, (state, action) => {
      state.current = action.payload;
    });
  },
});
```

### Production: Same pattern

Production may add:
- Pagination state
- Filter state
- Batch operations state
- Undo/redo

**Similarity:** Redux Toolkit thunks and slices follow same pattern.

## Key Differences: Learning vs Production

| Aspect | Learning | Production |
|--------|----------|-----------|
| **Org/Tenant** | None (single org) | Multi-tenant with `orgId` context |
| **Auth** | None | Auth middleware, role-based access |
| **Database** | SQLite | PostgreSQL |
| **Logging** | Console only | Structured logging, metrics |
| **Validation** | Zod only | Zod + business rule checks |
| **Email** | Placeholder | Full email sending |
| **Payments** | None | Payment service integration |
| **Accounting** | Denormalized totals | Journal posting with GL accounts |
| **Audit Trail** | None | Full audit log |
| **Caching** | None | Redis caching |
| **API Rate Limit** | None | Rate limiting middleware |
| **Error Handling** | Basic | Detailed error codes, monitoring |
| **Testing** | Manual | Unit + integration tests |

## Migration Path

If you move from learning to production code:

1. **Recognize patterns**: Contracts, DI, repositories, services
2. **Find the invoice feature**: `BookKeepingApp/backend/controllers/invoices`, `services/invoices`, etc.
3. **Trace a request**: Follow same flow as doc 10-contract-trace
4. **Note differences**: Auth middleware, org context, journal posting
5. **Extend gradually**: Start with read (GET), then write (POST/PUT)

## Example: Tracing createInvoice in Production

```
POST /api/v1/orgs/:orgId/invoices
  ↓
Auth middleware (is user in org?)
  ↓
InvoiceController.createInvoice()
  ↓
Zod validation
  ↓
OrganizationContext.check(orgId)  ← Production addition
  ↓
InvoiceService.createInvoice(orgId, data)  ← Receives orgId
  ↓
CustomerRepository.findByOrgId(customerId, orgId)  ← Org-scoped
  ↓
InvoiceRepository.create(orgId, data)  ← Org-scoped
  ↓
JournalService.postInvoice(invoice)  ← Production addition
  ↓
AuditLog.insert(orgId, userId, 'invoice.created')  ← Production addition
  ↓
HTTP 201 response
```

## Summary

- **Patterns are identical**: Contracts, DI, repositories, services, Redux
- **Scale is different**: Learning is simplified; production has auth, multi-org, accounting, email
- **Architecture is same**: Same layering (controller → service → repository → database)
- **Code organization differs**: Learning is flat; production is feature-organized
- **Database differs**: SQLite vs PostgreSQL, but Prisma ORM is same
- **Use learning as foundation**: Understand patterns here, then navigate production code with confidence
