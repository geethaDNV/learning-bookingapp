# 10. How This Maps to Production

This module is based on **real production code** from BookKeepingApp. This doc maps learning files to production equivalents so you can see how patterns scale.

## File Mapping

### Backend

| Learning Module | Production Path | Purpose |
|---|---|---|
| `src/types/index.ts` | `backend/types/interfaces/customers.ts` + `backend/di/types.ts` | Customer interfaces & DI types |
| `src/schemas/index.ts` | `backend/schemas/customers/index.ts` | Zod validation schemas |
| `src/constants/index.ts` | `backend/constants/customers/index.ts` | Error/response messages |
| `src/repositories/index.ts` | `backend/repositories/customers/customerRepository.ts` | Data access layer |
| `src/services/index.ts` | `backend/services/customers/customerService.ts` | Business logic layer |
| `src/controllers/index.ts` | `backend/controllers/customers/customersController.ts` | HTTP handlers |
| `src/routes/index.ts` | `backend/routes/customers.ts` | Route registration |
| `src/di/index.ts` | `backend/di/container.ts` + `backend/di/index.ts` | DI container setup |
| `src/config/index.ts` | `backend/config/index.ts` | Configuration loading |
| `src/server.ts` | `backend/backend.ts` | Express app entry point |
| `prisma/schema.prisma` | `backend/prisma/schema.prisma` | Database schema (Customer model is there) |
| `prisma/seed.ts` | `backend/prisma/seedCustomers.ts` | Seed sample data |

### Frontend

| Learning Module | Production Path | Purpose |
|---|---|---|
| `src/types/index.ts` | `frontend/src/types/customer.ts` | Customer TypeScript models |
| `src/services/customerService.ts` | `frontend/src/features/customers/api/customerApi.ts` | API client |
| `src/store/customerSlice.ts` | `frontend/src/features/customers/store/customerSlice.ts` | Redux slice |
| `src/store/store.ts` | `frontend/src/store/store.ts` | Redux store config |
| `src/components/CustomerAutocomplete.tsx` | `frontend/src/features/customers/components/CustomerAutocomplete.tsx` | Autocomplete component |
| `src/pages/CustomerListPage.tsx` | `frontend/src/features/customers/pages/CustomerListPage.tsx` | Customer list view |
| `src/pages/CustomerDetailPage.tsx` | `frontend/src/features/customers/pages/CustomerDetailPage.tsx` | Customer detail view |
| `src/pages/CustomerFormPage.tsx` | `frontend/src/features/customers/pages/CustomerFormPage.tsx` | Customer form (create/edit) |
| `src/App.tsx` | `frontend/src/App.tsx` | Main app with routing |
| `src/main.tsx` | `frontend/src/main.tsx` | React entry point |

## Pattern Differences: Learning vs Production

### Simplifications in Learning

The learning module simplifies production for clarity:

#### 1. Single File Organization

**Learning** (`src/repositories/index.ts`):
```
- CustomerRepository class directly in file
- All methods in one file for simplicity
```

**Production** (`backend/repositories/customers/`):
```
├── index.ts                    # Exports
├── customerRepository.ts       # Main implementation
└── contracts.ts               # Shared interfaces
```

#### 2. Simplified Error Handling

**Learning**:
```typescript
catch (error) {
  sendMessageResponse(res, CUSTOMER_ERROR_MESSAGES.INTERNAL_ERROR, 500);
}
```

**Production**:
```typescript
catch (error) {
  if (error instanceof ValidationError) {
    // Log to observability
    // Send structured error response
  }
  if (error instanceof NotFoundError) {
    // Specific 404 handling
  }
  // Audit logging
  // Error tracking service
}
```

#### 3. No Multi-Tenancy

**Learning**:
```typescript
async search(query: CustomerListQuery): Promise<CustomerListResponse> {
  // Search all customers (single org)
}
```

**Production**:
```typescript
async search(
  orgId: number,  // ← Filter by organization
  query: CustomerListQuery,
  rawQuery: Record<string, unknown>
): Promise<ListCustomersResult> {
  // Search only this org's customers
  // May decide between CLIENT or SERVER data strategy
}
```

#### 4. No Audit Logging

**Learning**:
```typescript
async createCustomer(req: Request, res: Response): Promise<void> {
  const customer = await this.customerService.create(body);
  // No audit trail
}
```

**Production**:
```typescript
async createCustomer(req: Request, res: Response): Promise<void> {
  const customer = await this.customerService.create(body, context.orgId, context.userId);
  
  // Log audit trail
  await createAuditLog({
    organizationId: context.orgId,
    userId: toAuditUserId(context.userId),
    action: AUDIT_ACTIONS.CREATE,
    entity: AUDIT_ENTITY_NAMES.CUSTOMER,
    entityId: String(customer.id),
    metadata: { displayName: customer.displayName },
  });
}
```

#### 5. No Soft Deletes

**Learning**:
```typescript
// Only updates isActive
await setStatus(publicId, isActive: boolean)
```

**Production**:
```typescript
// Soft delete (mark deleted_at timestamp)
// Hard delete (admin only, irreversible)
// Soft delete can be restored
```

### Expanding Learning to Production

Once you've mastered this module, you're ready for:

1. **Multi-Tenancy**: Filter by `orgId` in all queries
2. **Audit Logging**: Track who created/updated what and when
3. **Soft Deletes**: Mark `deletedAt` instead of removing
4. **Observability**: Log structure for debugging and monitoring
5. **Error Handling**: Specific error types and recovery strategies
6. **Caching**: Redis for frequently accessed customers
7. **Rate Limiting**: Protect autocomplete API from abuse
8. **Batch Operations**: Import customers from CSV
9. **Webhooks**: Notify external systems when customer changes
10. **Advanced Search**: Elasticsearch for complex queries

## Production Features Not in Learning

### Backend

- **Multi-tenancy**: `orgId` in all queries
- **Pagination strategies**: CLIENT vs SERVER mode
- **Data strategies**: Full load vs paged load decisions
- **GSTIN validation**: Against GSTIN database API
- **Address autocomplete**: Google Places API integration
- **Soft deletes**: Logical deletion (never lose data)
- **Audit trails**: Track all changes with user + timestamp
- **Permissions**: Role-based access control (RBAC)
- **Batch imports**: CSV customer imports
- **Duplicate detection**: Smart deduplication on import
- **Webhook events**: Notify when customer is created/updated/deleted
- **Search optimizations**: Elasticsearch indexes

### Frontend

- **Advanced search filters**: Status, date range, GSTIN prefix
- **Bulk operations**: Select multiple, bulk status change
- **Export**: Download customers as CSV/Excel
- **Import**: Upload CSV to bulk create customers
- **Customer segments**: Group by revenue, region, industry
- **Activity timeline**: Show all customer changes
- **Related records**: Show customer's invoices, quotes, orders
- **Address lookup**: Google Places integration in form
- **GSTIN prefill**: Fetch business name from GSTIN API
- **Duplicate detection**: Warn if entering similar customer
- **Merge customers**: Consolidate duplicate records
- **Permissions**: Hide/show fields based on user role

## Learning Path

```
Module 05: Customers Basic (you are here)
  ✓ Single-entity CRUD
  ✓ Autocomplete search
  ✓ DI & typed interfaces
  ✓ Form validation (RHF + Zod)
  ✓ Redux with thunks & selectors
  
    ↓
    
Module 06: Invoices Basic
  ✓ Multi-entity (Invoice ← Customer)
  ✓ Invoice number generation
  ✓ Line items & totals
  ✓ Customer selection → Invoice creation
  
    ↓
    
Module 07: Advanced Topics
  ✓ Pagination strategies (CLIENT vs SERVER)
  ✓ Data denormalization (invoice snapshots)
  ✓ Soft deletes & audit trails
  ✓ Multi-tenancy patterns
  
    ↓
    
Module 08: Production Patterns
  ✓ Error handling & observability
  ✓ Rate limiting & caching
  ✓ Webhooks & event bus
  ✓ Permissions & security
```

---

**Previous**: [09. Contract Trace](09-contract-trace.md)  
**Next**: [11. Exercises & Enhancements](11-exercises.md)
