# 06. Frontend Customer Form with React Hook Form & Zod

## Overview

The customer form page (`CustomerFormPage`) handles **create** and **edit** workflows using:

- **React Hook Form**: Efficient form state management
- **Zod**: Runtime validation and type inference
- **@hookform/resolvers**: Zod integration with React Hook Form

## Form Validation Schema

**File**: `frontend/src/pages/CustomerFormPage.tsx`

```typescript
import { z } from 'zod';

const customerSchema = z.object({
  displayName: z.string()
    .min(2, 'Name must be at least 2 characters'),
  email: z.string()
    .email('Invalid email')
    .optional()
    .or(z.literal('')),
  phone: z.string()
    .optional()
    .or(z.literal('')),
  gstin: z.string()
    .max(15, 'GSTIN must be 15 characters or less')
    .optional()
    .or(z.literal('')),
  billingAddress: z.string()
    .optional()
    .or(z.literal('')),
});

type CustomerFormData = z.infer<typeof customerSchema>;
```

## Routes

| Route | Mode | Purpose |
|-------|------|---------|
| `/customers/create` | POST | Create new customer |
| `/customers/:publicId/edit` | PUT | Edit existing customer |

## Component Structure

```typescript
export const CustomerFormPage: React.FC = () => {
  const { publicId } = useParams<{ publicId?: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const customer = useSelector(selectSelectedCustomer);
  const loading = useSelector(selectCustomersLoading);
  const error = useSelector(selectCustomersError);
  const isEdit = !!publicId;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
  });

  // Load existing customer if editing
  useEffect(() => {
    if (isEdit && publicId) {
      dispatch(fetchCustomer(publicId));
    }
  }, [publicId, dispatch, isEdit]);

  // Populate form with existing data
  useEffect(() => {
    if (isEdit && customer) {
      reset({
        displayName: customer.displayName,
        email: customer.email || '',
        phone: customer.phone || '',
        gstin: customer.gstin || '',
        billingAddress: customer.billingAddress || '',
      });
    }
  }, [customer, reset, isEdit]);

  // Handle form submission
  const onSubmit = async (data: CustomerFormData) => {
    try {
      if (isEdit && publicId) {
        await dispatch(
          updateCustomer({ publicId, payload: data })
        ).unwrap();
      } else {
        await dispatch(createCustomer(data)).unwrap();
      }
      navigate('/customers');
    } catch (err) {
      console.error('Form submission error:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  );
};
```

## Form Fields

### Display Name (Required)

```typescript
<div className="mb-6">
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Display Name *
  </label>
  <input
    {...register('displayName')}
    type="text"
    className={`w-full px-3 py-2 border rounded-md ${
      errors.displayName ? 'border-red-300' : 'border-gray-300'
    }`}
  />
  {errors.displayName && (
    <p className="mt-1 text-sm text-red-600">
      {errors.displayName.message}
    </p>
  )}
</div>
```

**React Hook Form**:
- `register('displayName')` connects input to form state
- Changes auto-update form value
- `errors.displayName` shows validation error message

### Email (Optional)

```typescript
<div className="mb-6">
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Email
  </label>
  <input
    {...register('email')}
    type="email"
    className={`w-full px-3 py-2 border rounded-md ${
      errors.email ? 'border-red-300' : 'border-gray-300'
    }`}
  />
  {errors.email && (
    <p className="mt-1 text-sm text-red-600">
      {errors.email.message}
    </p>
  )}
</div>
```

### Phone, GSTIN, Billing Address

Similar pattern to email (optional fields).

## Form Submission Flow

```
User clicks "Create/Update Customer"
    ↓
handleSubmit(onSubmit) runs
    ↓
React Hook Form validates using Zod schema
    ↓
If validation fails:
  - Display errors next to fields
  - Stop submission
    ↓
If validation passes:
  - Call dispatch(createCustomer(data)) or dispatch(updateCustomer(...))
    ↓
Redux thunk calls customerService.createCustomer() or .updateCustomer()
    ↓
Backend validates again (server-side validation)
    ↓
If success: navigate to /customers
If error: show error message in form
```

## Example: Create Customer

**User Input**:
```
Display Name: Acme Corporation
Email: contact@acme.com
Phone: +91-9876543210
GSTIN: 29AABCT1234H1Z5
Billing Address: 123 Business Street, Mumbai
```

**Frontend Zod Validation**:
- ✅ displayName: 16 chars (>= 2)
- ✅ email: valid format
- ✅ phone: present (optional)
- ✅ gstin: 15 chars (<= 15)
- ✅ billingAddress: present (optional)

**Submitted Payload**:
```json
{
  "displayName": "Acme Corporation",
  "email": "contact@acme.com",
  "phone": "+91-9876543210",
  "gstin": "29AABCT1234H1Z5",
  "billingAddress": "123 Business Street, Mumbai"
}
```

**Backend Processing**:
1. Zod schema validation (same as frontend)
2. Service validates email uniqueness
3. Service validates GSTIN uniqueness
4. Repository.create() inserts into DB
5. Returns created Customer with `publicId`

**Frontend Response**:
- Dispatch `createCustomer.fulfilled(customer)`
- Redux state updated with new customer
- Navigate to `/customers`

## Example: Edit Customer

**Form Pre-fill**:
- `useEffect` fetches customer by `publicId`
- `reset(customer)` populates all fields
- User modifies fields
- Submit triggers `updateCustomer` thunk

**Submission**:
```typescript
await dispatch(
  updateCustomer({
    publicId: "550e8400-e29b-41d4-a716-446655440000",
    payload: {
      displayName: "Acme Solutions",
      email: "updated@acme.com",
      // ... other fields
    }
  })
).unwrap();
```

## Error Handling

### Frontend Validation Error

```
User enters: email = "invalid-email"
Zod validation fails
Error message: "Invalid email"
Displayed under email field
Form submission blocked
```

### Backend Duplicate Error

```
User enters: email = "existing@company.com"
Frontend validation passes
Backend validation fails: "Duplicate email"
Redux thunk rejects with error message
Component displays error banner
```

## Accessibility Features

- Labels linked to inputs via `htmlFor` (semantic)
- Error messages associated with fields
- Required fields marked with `*`
- Focus management on error

---

**Previous**: [05. Customer Autocomplete API](05-customer-autocomplete-api.md)  
**Next**: [07. Customer Autocomplete UI](07-customer-autocomplete-ui.md)
