# Doc 03: React Hook Form Basics

## What is React Hook Form?

React Hook Form is a library that manages form state and validation **efficiently** with minimal re-renders.

Key benefits:
- Small bundle size (~8.6kb)
- Uncontrolled form inputs (better performance)
- Built-in async validation
- Great TypeScript support
- Works with any validation library (Zod, Yup, etc.)

## The `useForm` Hook

### Basic Usage

```typescript
import { useForm } from 'react-hook-form';

function MyForm() {
  const { register, handleSubmit, formState: { errors } } = useForm();

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} />
      {errors.name && <span>{errors.name.message}</span>}
      <button type="submit">Submit</button>
    </form>
  );
}
```

### With Zod Resolver

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { itemFormSchema } from './schemas';

function ItemForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(itemFormSchema),
    mode: 'onBlur', // Validate when field loses focus
    defaultValues: {
      name: '',
      sku: '',
      itemType: 'GOODS',
      isActive: true,
    }
  });

  return (
    // ...
  );
}
```

## Key Concepts

### 1. `register()` - Bind Input to Form

Connects an input to form state and validation:

```typescript
<input {...register('name')} />
// This makes React Hook Form:
// - Track the field value
// - Validate when specified (onBlur, onChange, onSubmit)
// - Capture and display errors
```

### 2. `handleSubmit()` - Validation + Submit

```typescript
const onSubmit = (data) => {
  // data is validated and typed
  console.log(data); // { name: "...", sku: "...", ... }
};

<form onSubmit={handleSubmit(onSubmit)}>
  // handleSubmit:
  // - Validates entire form with Zod schema
  // - Calls onSubmit only if valid
  // - Does nothing if invalid
</form>
```

### 3. `formState.errors` - Display Field Errors

```typescript
const { errors } = useForm({
  resolver: zodResolver(itemFormSchema)
});

// errors.name = { message: "Name is required" }
// errors.sku = { message: "SKU must be..." }
// errors.email = undefined (no error)

{errors.name && <span className="error">{errors.name.message}</span>}
```

### 4. `reset()` - Clear or Populate Form

```typescript
const { reset } = useForm();

// Clear form
reset();

// Set values
reset({
  name: 'Laptop',
  sku: 'LAP-001',
  itemType: 'GOODS',
});
```

### 5. `formState.isSubmitting` - Track Submission

```typescript
const { formState: { isSubmitting } } = useForm();

<button disabled={isSubmitting}>
  {isSubmitting ? 'Saving...' : 'Save'}
</button>
```

## Full ItemForm Example

```typescript
export function ItemForm({ onSubmit, defaultValues, loading, submitError }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<ItemFormValues>({
    resolver: zodResolver(itemFormSchema),
    defaultValues,
    mode: 'onBlur',
  });

  const itemType = watch('itemType');
  const showHsnCode = itemType === 'GOODS' || itemType === 'CONSUMABLE';
  const showSacCode = itemType === 'SERVICES';

  // Update form when defaultValues change (edit mode)
  useEffect(() => {
    if (defaultValues) {
      reset(defaultValues);
    }
  }, [defaultValues, reset]);

  // Clear the hidden code field when item type changes
  useEffect(() => {
    if (showHsnCode) {
      setValue('sacCode', null);
    }

    if (showSacCode) {
      setValue('hsnCode', null);
    }
  }, [setValue, showHsnCode, showSacCode]);

  const isLoading = isSubmitting || loading;

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Server error at top */}
      {submitError && (
        <div className="error-banner">
          <p>{submitError.message}</p>
        </div>
      )}

      {/* Name field */}
      <div>
        <label>Name</label>
        <input
          {...register('name')}
          disabled={isLoading}
        />
        {errors.name && <span className="error">{errors.name.message}</span>}
      </div>

      {showHsnCode && <input {...register('hsnCode')} />}
      {showSacCode && <input {...register('sacCode')} />}

      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Saving...' : 'Save Item'}
      </button>
    </form>
  );
}
```

## Validation Modes

```typescript
useForm({
  mode: 'onSubmit',      // Validate only on form submit
  // mode: 'onBlur',       // Validate when field loses focus
  // mode: 'onChange',     // Validate on every keystroke
  // mode: 'all',          // Validate on blur and change
})
```

Module 03 uses **`onBlur`**: Validates when user leaves a field (good UX balance).

## Async Validation

React Hook Form supports async validators:

```typescript
const { register } = useForm({
  resolver: zodResolver(schema),
});

// Example: Check if email is available
const validateEmail = async (email) => {
  const exists = await checkEmailExists(email);
  if (exists) {
    throw new Error('Email already registered');
  }
};

<input
  {...register('email', {
    validate: validateEmail
  })}
/>
```

## Common Patterns

### Pattern 1: Controlled Sync

```typescript
const { watch } = useForm();
const itemType = watch('itemType'); // Re-render when itemType changes

// Show HSN code for goods-like items
{(itemType === 'GOODS' || itemType === 'CONSUMABLE') && (
  <input {...register('hsnCode')} />
)}

// Show SAC code for services
{itemType === 'SERVICES' && (
  <input {...register('sacCode')} />
)}
```

### Pattern 2: Dynamic Fields

```typescript
const { fields, append, remove } = useFieldArray({
  control,
  name: 'items', // Array field
});

{fields.map((field, index) => (
  <input {...register(`items.${index}.name`)} />
))}

<button onClick={() => append({ name: '' })}>Add Item</button>
```

### Pattern 3: Async Default Values

```typescript
const { data: item, isLoading } = useQuery(['item', id], fetchItem);

const { reset } = useForm();

useEffect(() => {
  if (item) {
    reset(item); // Populate form when data arrives
  }
}, [item, reset]);
```

## TypeScript

With Zod resolver, types are automatically inferred:

```typescript
export type ItemFormValues = z.infer<typeof itemFormSchema>;

function ItemForm({ onSubmit }: { onSubmit: (data: ItemFormValues) => void }) {
  const { handleSubmit } = useForm<ItemFormValues>({
    resolver: zodResolver(itemFormSchema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* data passed to onSubmit is typed as ItemFormValues */}
    </form>
  );
}
```

## Performance

React Hook Form uses **uncontrolled inputs** by default:

```typescript
// BAD: Controlled input, re-renders on every keystroke
const [name, setName] = useState('');
<input value={name} onChange={(e) => setName(e.target.value)} />

// GOOD: Uncontrolled input via register
<input {...register('name')} />
// React Hook Form only re-renders on error or submit
```

## Comparison: useState vs React Hook Form

| Aspect | useState | React Hook Form |
|--------|----------|-----------------|
| Re-renders | Many | Minimal |
| Validation | Manual | Automatic with resolver |
| Typing | Loose | Strict with Zod |
| Error handling | Manual | Built-in |
| Field count | 1 per field + 1 for errors | 1 form state |
| Bundle | N/A | 8.6kb |

## Next Step

Read [04-create-form-flow.md](04-create-form-flow.md) to trace how a form submission flows through the app.
