# 11. Exercises & Enhancements

After completing the learning module, try these exercises to deepen your understanding.

## Exercise 1: Create Customer On-The-Fly

**Goal**: Allow users to create a new customer directly from the autocomplete component.

**Scenario**:
```
User types "New Client Co" in autocomplete
Search returns no results
Show "Create 'New Client Co'" button
User clicks button
Quick create form appears
User enters email and GSTIN
Customer created
Autocomplete auto-selects the new customer
```

**Steps**:

1. **Modify `CustomerAutocomplete` component**:
   ```typescript
   // Add state for quick create form
   const [showQuickCreate, setShowQuickCreate] = useState(false);
   
   // If no results and search term provided
   {!loading && options.length === 0 && search && (
     <button onClick={() => setShowQuickCreate(true)}>
       Create "{search}"
     </button>
   )}
   ```

2. **Add quick create logic**:
   ```typescript
   const handleQuickCreate = async (email: string, gstin: string) => {
     const newCustomer = await customerService.createCustomer({
       displayName: search,
       email,
       gstin
     });
     handleSelect(newCustomer);
   };
   ```

3. **Test**: Try creating a customer from autocomplete

## Exercise 2: Add Address Fields to Form

**Goal**: Expand the customer model with separate address fields (street, city, state, zip).

**Steps**:

1. **Update Prisma schema**:
   ```prisma
   model Customer {
     // ... existing fields
     street         String?   @db.VarChar(255)
     city           String?   @db.VarChar(100)
     state          String?   @db.VarChar(100)
     zipCode        String?   @db.VarChar(10)
   }
   ```

2. **Run migration**:
   ```bash
   npm run prisma:migrate
   ```

3. **Update Zod schema**:
   ```typescript
   const customerSchema = z.object({
     // ... existing fields
     street: z.string().optional(),
     city: z.string().optional(),
     state: z.string().optional(),
     zipCode: z.string().optional(),
   });
   ```

4. **Update repository/service/controller** to handle new fields

5. **Update form** to include address fields

6. **Test**: Create customer with full address

## Exercise 3: Replace the GSTIN Lookup Data Source

**Goal**: Replace the learning module's deterministic `GSTIN_PREFILL_DATA` with a real GSTIN provider.

The module already validates GSTIN format and exposes `GET /api/v1/customers/prefill/:gstin`. Preserve that contract, add provider configuration, and keep the existing client behavior: business customers can prefill their display name and billing address, while individual customers use PAN and never call the lookup.

## Exercise 4: Add Pagination Controls

**Goal**: Add "Rows per page" dropdown and "Showing X of Y" counter.

**Steps**:

1. **Update Redux selector**:
   ```typescript
   export const selectCustomersPageSize = (state: RootState) => 
     state.customers.listMeta.pageSize;
   ```

2. **Add UI controls**:
   ```typescript
   <select
     value={pageSize}
     onChange={(e) => {
       setPageSize(parseInt(e.target.value));
       setPage(1); // Reset to first page
     }}
   >
     <option value="10">10 per page</option>
     <option value="20">20 per page</option>
     <option value="50">50 per page</option>
   </select>
   ```

3. **Fetch with new pageSize**:
   ```typescript
   useEffect(() => {
     dispatch(fetchCustomers({ page, pageSize }));
   }, [page, pageSize]);
   ```

4. **Test**: Change rows per page and verify list updates

## Exercise 5: Add Customer Status Filter

**Goal**: Add buttons to filter: All / Active / Inactive.

**Steps**:

1. **Add state**:
   ```typescript
   const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
   ```

2. **Add filter buttons**:
   ```typescript
   <div className="flex gap-2 mb-4">
     {(['all', 'active', 'inactive'] as const).map(status => (
       <button
         key={status}
         onClick={() => setStatusFilter(status)}
         className={statusFilter === status ? 'bg-blue-600' : 'bg-gray-200'}
       >
         {status === 'all' ? 'All' : status === 'active' ? 'Active' : 'Inactive'}
       </button>
     ))}
   </div>
   ```

3. **Fetch with filter**:
   ```typescript
   useEffect(() => {
     const query: CustomerListQuery = {
       page,
       pageSize,
       search: search || undefined,
       isActive: statusFilter === 'all' ? undefined : statusFilter === 'active'
     };
     dispatch(fetchCustomers(query));
   }, [page, pageSize, search, statusFilter]);
   ```

4. **Test**: Click filters and verify results change

## Exercise 6: Add Sort by Email/Phone

**Goal**: Add column headers that are clickable to sort by that field.

**Steps**:

1. **Add state**:
   ```typescript
   const [sortBy, setSortBy] = useState<'displayName' | 'email' | 'createdAt'>('createdAt');
   const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
   ```

2. **Add clickable headers**:
   ```typescript
   <th
     onClick={() => {
       if (sortBy === 'email') {
         setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
       } else {
         setSortBy('email');
         setSortOrder('asc');
       }
     }}
     className="cursor-pointer hover:bg-gray-100"
   >
     Email {sortBy === 'email' && (sortOrder === 'asc' ? '↑' : '↓')}
   </th>
   ```

3. **Fetch with sort**:
   ```typescript
   useEffect(() => {
     dispatch(fetchCustomers({ page, search, sortBy, sortOrder }));
   }, [sortBy, sortOrder]);
   ```

4. **Test**: Click headers to sort

## Exercise 7: Bulk Status Update

**Goal**: Select multiple customers and change their status at once.

**Steps**:

1. **Add checkbox column**:
   ```typescript
   const [selected, setSelected] = useState<Set<string>>(new Set());
   
   <input
     type="checkbox"
     checked={selected.has(customer.publicId)}
     onChange={(e) => {
       const newSelected = new Set(selected);
       if (e.target.checked) {
         newSelected.add(customer.publicId);
       } else {
         newSelected.delete(customer.publicId);
       }
       setSelected(newSelected);
     }}
   />
   ```

2. **Add bulk action buttons**:
   ```typescript
   {selected.size > 0 && (
     <div>
       <button onClick={() => bulkSetStatus([...selected], true)}>
         Mark Active ({selected.size})
       </button>
       <button onClick={() => bulkSetStatus([...selected], false)}>
         Mark Inactive ({selected.size})
       </button>
     </div>
   )}
   ```

3. **Implement bulk action**:
   ```typescript
   const bulkSetStatus = async (publicIds: string[], isActive: boolean) => {
     for (const id of publicIds) {
       await dispatch(setCustomerStatus({ publicId: id, isActive })).unwrap();
     }
     setSelected(new Set());
   };
   ```

4. **Test**: Select multiple customers and bulk update status

## Exercise 8: Add Delete Functionality

**Goal**: Add "Delete" button and confirm dialog.

**Steps**:

1. **Add delete thunk to Redux**:
   ```typescript
   export const deleteCustomer = createAsyncThunk(
     'customers/delete',
     async (publicId: string) => {
       const response = await customerService.deleteCustomer(publicId);
       if (!response.success) throw new Error(response.message);
       return publicId;
     }
   );
   ```

2. **Add delete method to service**:
   ```typescript
   async deleteCustomer(publicId: string): Promise<ApiResponse<void>> {
     const response = await this.api.delete(`/v1/customers/${publicId}`);
     return response.data;
   }
   ```

3. **Add backend endpoint & logic** (leave as exercise)

4. **Add confirm dialog**:
   ```typescript
   const handleDelete = (customer: Customer) => {
     if (window.confirm(`Delete ${customer.displayName}?`)) {
       dispatch(deleteCustomer(customer.publicId));
     }
   };
   ```

5. **Add delete button** in customer list and detail pages

6. **Test**: Delete a customer with confirmation

## Exercise 9: Add Customer Import from CSV

**Goal**: Upload a CSV file to bulk create customers.

**Steps**:

1. **Create upload form** (frontend exercise):
   ```typescript
   <input type="file" accept=".csv" onChange={handleCsvUpload} />
   ```

2. **Parse CSV**:
   ```typescript
   const handleCsvUpload = async (file: File) => {
     const text = await file.text();
     const rows = text.split('\\n');
     const customers = rows.slice(1).map(row => {
       const [name, email, phone, gstin] = row.split(',');
       return { displayName: name, email, phone, gstin };
     });
     // Dispatch bulk create
   };
   ```

3. **Add backend batch endpoint**:
   ```
   POST /api/v1/customers/batch
   ```

4. **Implement batch validation & creation** (backend exercise)

5. **Test**: Upload customers.csv and see them created

## Exercise 10: Add Export to CSV

**Goal**: Export all customers to CSV file.

**Steps**:

1. **Add export button**:
   ```typescript
   const handleExport = () => {
     const csv = customers
       .map(c => `${c.displayName},${c.email},${c.phone},${c.gstin}`)
       .join('\\n');
     
     const blob = new Blob([csv], { type: 'text/csv' });
     const url = URL.createObjectURL(blob);
     const a = document.createElement('a');
     a.href = url;
     a.download = 'customers.csv';
     a.click();
   };
   ```

2. **Add export button to UI**

3. **Test**: Export customers and open in Excel

## Bonus: Add Unit Tests

```typescript
// backend/src/__tests__/customerService.test.ts
import { CustomerService } from '../services';
import { MockCustomerRepository } from './mocks/customerRepository.mock';

describe('CustomerService', () => {
  let service: CustomerService;
  let mockRepository: MockCustomerRepository;

  beforeEach(() => {
    mockRepository = new MockCustomerRepository();
    service = new CustomerService(mockRepository);
  });

  test('create throws on duplicate email', async () => {
    mockRepository.findByEmail = async () => ({ /* existing */ });
    
    await expect(
      service.create({ email: 'duplicate@example.com', displayName: 'Test' })
    ).rejects.toThrow('Duplicate email');
  });
});
```

---

**Previous**: [10. How This Maps to Production](10-how-this-maps-to-production.md)  
**Module Complete**: You now understand customer CRUD, DI patterns, typed contracts, and are ready for Module 06 (Invoices)!
