# Doc 01: Overview - Why Production Forms Need Schemas and Validation

## The Problem: Forms Without Schemas

In module 02 (items-basic), we built forms using raw `useState`:

```typescript
const [name, setName] = useState('');
const [sku, setSku] = useState('');
const [itemType, setItemType] = useState('');
// ... separate state for each field
```

This approach works for simple forms, but breaks down:

1. **No validation until submit**: Users can submit invalid data
2. **Manual error tracking**: Need separate state for each field's errors
3. **No type safety**: Form values are just strings and objects
4. **Repetitive code**: Register, validate, and display errors for each field
5. **Backend duplicate errors don't update form**: Server says "name taken" but form doesn't know where to show it

## The Solution: Schema-Driven Forms

Production forms use **schemas** to describe form structure and validation:

```typescript
// Define once
const itemFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  sku: z.string().min(1, 'SKU is required'),
  itemType: z.enum(['GOODS', 'SERVICES']),
});

// Automatically get:
// - Type inference
// - Field validation
// - Error messages
// - Default values
type ItemFormValues = z.infer<typeof itemFormSchema>;
```

## What Module 03 Teaches

### Backend
- **DI (Dependency Injection)**: Services depend on interfaces, not concrete implementations
  ```typescript
  class ItemService {
    constructor(private repo: IItemRepository) {} // Interface, not concrete class
  }
  ```
- **Contracts**: Explicit interfaces define what services promise
- **Zod validation**: Type-safe request and response handling
- **Error codes**: DUPLICATE_NAME, DUPLICATE_SKU, NOT_FOUND for frontend handling

### Frontend  
- **React Hook Form**: Efficient form state management with minimal re-renders
- **Zod schemas**: Type-safe form validation and value inference
- **Strong typing**: Redux thunks, API services, and component props are all typed
- **Server error display**: API errors mapped to form fields
- **Form defaults & reset**: Loading data for edit mode

## Key Architecture Pattern

```
UI Form
   ↓
React Hook Form (manages state, handles submit)
   ↓
Zod Schema (validates on blur/submit)
   ↓
API Service (makes fetch call)
   ↓
Redux Thunk (handles async operation)
   ↓
Redux Slice (updates global state)
   ↓
Selectors (components read from Redux)
```

## Why This Matters

### For the learner:
- This is how professional React apps work
- You'll see this pattern in every production form

### For the team:
- Types catch bugs at compile time
- Schemas document API contracts
- Testable code with dependency injection
- Clear separation of concerns

### For the user:
- Better validation errors
- Faster form feedback
- Can't submit invalid data
- Server errors displayed clearly

## What's Different from Module 02?

| Aspect | Module 02 (Basic) | Module 03 (RHF + Zod) |
|--------|------------------|----------------------|
| Form state | useState for each field | React Hook Form |
| Validation | Manual in submit handler | Zod schema + resolver |
| Type safety | Loose typing | Strict types inferred from schema |
| Errors | Generic error object | Field-level and server-specific errors |
| Backend | No DI, loose typing | Interface-based with DI |
| Server errors | Not displayed in form | Mapped to form fields |

## Real-World Example: Duplicate Name Error

### Module 02 approach:
```typescript
try {
  await createItem(values);
} catch (error) {
  setError('An error occurred'); // Generic message
}
```

### Module 03 approach:
```typescript
// Backend throws: { error: 'DUPLICATE_NAME', message: 'Item with this name already exists' }
// Frontend automatically:
// 1. Catches it in thunk error handler
// 2. Stores in Redux state.submitError
// 3. ItemForm displays it above the form
// 4. User knows exactly what went wrong
```

## Next Steps

1. Read about **Zod schemas** in [02-zod-form-schema.md](02-zod-form-schema.md)
2. Learn **React Hook Form basics** in [03-react-hook-form-basics.md](03-react-hook-form-basics.md)
3. Trace the **create flow** in [04-create-form-flow.md](04-create-form-flow.md)

## Key Takeaway

Production forms aren't just about user input—they're about **contracts between frontend and backend**, **type safety from UI to database**, and **clear error communication**.

This module shows you how to build forms that scale.
