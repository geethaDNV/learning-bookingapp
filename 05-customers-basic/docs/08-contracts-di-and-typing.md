# 08. Contracts, DI, and Typing

## Why Interfaces & Contracts Matter

**Without contracts**, code is fragile:

```typescript
// ❌ BAD: Tightly coupled, hard to test
const service = new CustomerService(new Prisma Client());
const controller = new CustomerController(service);

// If Service changes signature, everything breaks
// Hard to test (can't mock Prisma)
```

**With contracts**, code is flexible:

```typescript
// ✅ GOOD: Loosely coupled, mockable, testable
interface ICustomerRepository { /* ... */ }
interface ICustomerService { /* ... */ }

const repo: ICustomerRepository = new CustomerRepository(prisma);
const service: ICustomerService = new CustomerService(repo);
const controller: ICustomerController = new CustomerController(service);

// Can swap implementation without changing consumers
```

## Backend DI Container

**File**: `backend/src/di/index.ts`

```typescript
export interface Cradle {
  prisma: PrismaClient;
  customerRepository: ICustomerRepository;
  customerService: ICustomerService;
  customerController: ICustomerController;
}

export function createContainer(): Cradle {
  const prisma = new PrismaClient();

  // Layer 1: Repository
  const customerRepository: ICustomerRepository = 
    new CustomerRepository(prisma);

  // Layer 2: Service (depends on Repository)
  const customerService: ICustomerService = 
    new CustomerService(customerRepository);

  // Layer 3: Controller (depends on Service)
  const customerController: ICustomerController = 
    new CustomerController(customerService);

  return {
    prisma,
    customerRepository,
    customerService,
    customerController,
  };
}
```

### Dependency Resolution

```
Cradle (container)
├── Prisma
├── Repository (needs Prisma)
├── Service (needs Repository)
└── Controller (needs Service)
```

### Usage in Server

**File**: `backend/src/server.ts`

```typescript
async function startServer(): Promise<void> {
  // Get container with all dependencies resolved
  const container = getContainer();

  // Pass controller to routes
  registerCustomerRoutes(app, container.customerController);

  // ... listen, handle shutdown, cleanup
  await closeContainer();
}
```

## Backend Interfaces

### Repository Interface

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
  autocomplete(query: CustomerAutocompleteQuery): Promise<CustomerAutocompleteOption[]>;
  update(publicId: string, payload: UpdateCustomerPayload): Promise<Customer | null>;
  setStatus(publicId: string, isActive: boolean): Promise<Customer | null>;
  count(filters?: { isActive?: boolean; search?: string }): Promise<number>;
}
```

**Contract**:
- Repository must implement all these methods
- Service depends on this interface, not concrete class
- Swappable: SQL → NoSQL → Mock

### Service Interface

```typescript
export interface ICustomerService {
  create(payload: CreateCustomerPayload): Promise<Customer>;
  getById(id: number): Promise<Customer | null>;
  getByPublicId(publicId: string): Promise<Customer | null>;
  listAll(filters?: { isActive?: boolean }): Promise<Customer[]>;
  search(query: CustomerListQuery): Promise<CustomerListResponse>;
  autocomplete(query: CustomerAutocompleteQuery): Promise<CustomerAutocompleteOption[]>;
  update(publicId: string, payload: UpdateCustomerPayload): Promise<Customer | null>;
  setStatus(publicId: string, isActive: boolean): Promise<Customer | null>;
}
```

**Contract**:
- Service adds validation logic on top of repository
- Controller depends on this interface
- Swappable: Different business rules → Different service

### Controller Interface

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

**Contract**:
- Routes depend on this interface
- Swappable: Express → Fastify → NestJS

## Frontend Typing

### Service with Typed Methods

**File**: `frontend/src/services/customerService.ts`

```typescript
export class CustomerService {
  private api: AxiosInstance;

  constructor(baseURL: string = '/api') {
    this.api = axios.create({ baseURL });
  }

  async listCustomers(query: CustomerListQuery = {}): Promise<ApiResponse<Customer[]>> {
    const response = await this.api.get<ApiResponse<Customer[]>>('/v1/customers', {
      params: query,
    });
    return response.data;
  }

  async getCustomer(publicId: string): Promise<ApiResponse<Customer>> {
    const response = await this.api.get<ApiResponse<Customer>>(
      `/v1/customers/${publicId}`
    );
    return response.data;
  }

  // ... more methods with full typing
}

export const customerService = new CustomerService();
```

**Benefits**:
- API methods are **typed** (input params, return type)
- IDE autocomplete works
- Compile-time errors caught before runtime

### Redux Thunks with Typing

**File**: `frontend/src/store/customerSlice.ts`

```typescript
// Typed async thunk
export const fetchCustomers = createAsyncThunk(
  'customers/fetchList',
  async (query: CustomerListQuery = {}) => {
    const response = await customerService.listCustomers(query);
    if (!response.success) throw new Error(response.message);
    return {
      customers: response.data || [],
      meta: response.meta,
    };
  }
);

// Typed selector
export const selectAllCustomers = (state: RootState) => 
  state.customers.customers;

// Typed dispatch
export const MyComponent = () => {
  const dispatch = useDispatch<AppDispatch>();
  
  dispatch(fetchCustomers({ page: 1 })); // TypeScript checks args
};
```

**Benefits**:
- Thunks are **typed** (input, payload, error)
- Selectors are **typed** (return type)
- Dispatch is **typed** (only valid thunks)

### Component Props with Typing

**File**: `frontend/src/components/CustomerAutocomplete.tsx`

```typescript
interface CustomerAutocompleteProps {
  value: CustomerAutocompleteOption | null;
  onSelect: (customer: CustomerAutocompleteOption) => void;
  placeholder?: string;
}

export const CustomerAutocomplete: React.FC<CustomerAutocompleteProps> = ({
  value,
  onSelect,
  placeholder,
}) => {
  // Component typed: props, state, callbacks
};

// Usage with type checking
<CustomerAutocomplete
  value={selectedCustomer}
  onSelect={setSelectedCustomer}
  placeholder="Search..."
/>
// TypeScript error if missing required prop
```

## Type Flow

```
Database Schema (Prisma)
  ↓
Domain Model (Customer interface)
  ↓
Repository Interface (ICustomerRepository)
  ↓
Service Interface (ICustomerService)
  ↓
Controller Interface (ICustomerController)
  ↓
HTTP Response (ApiResponse<Customer>)
  ↓
Frontend Types (Customer interface)
  ↓
Redux State (CustomerState)
  ↓
Component Props (CustomerAutocompleteProps)
  ↓
React Component
```

**Each layer** knows only the interface it needs, not concrete implementations.

## Testing Benefits

With interfaces:

```typescript
// Mock repository for testing service
class MockCustomerRepository implements ICustomerRepository {
  async create(payload) { return { id: 1, ...payload }; }
  async findByEmail(email) { return null; }
  // ... implement minimal mock
}

// Test service with mock
const mockRepo = new MockCustomerRepository();
const service = new CustomerService(mockRepo);

test('create validates duplicate email', async () => {
  const mockRepo = new MockCustomerRepository();
  mockRepo.findByEmail = async () => ({ /* existing */ });
  
  const service = new CustomerService(mockRepo);
  
  await expect(
    service.create({ email: 'duplicate@example.com' })
  ).rejects.toThrow('Duplicate email');
});
```

---

**Previous**: [07. Customer Autocomplete UI](07-customer-autocomplete-ui.md)  
**Next**: [09. Contract Trace](09-contract-trace.md)
