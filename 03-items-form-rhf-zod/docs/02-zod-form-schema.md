# Doc 02: Zod Schemas - Type Safety for Forms

## What is Zod?

Zod is a **schema validation library** for TypeScript. It lets you define what data should look like and automatically validates and types it.

```typescript
import { z } from 'zod';

// Define schema once
const schema = z.object({
  name: z.string().min(1),
  age: z.number().positive(),
});

// Parse data
const data = schema.parse({ name: "John", age: 30 }); // ✓ Valid
const invalid = schema.parse({ name: "John", age: -5 }); // ✗ Throws

// Infer type
type Person = z.infer<typeof schema>;
// Person = { name: string; age: number }
```

## The Item Form Schema

### Frontend: `frontend/src/features/items/schemas/itemValidation.ts`

```typescript
export const itemFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(255, 'Name must be 255 characters or less'),

  sku: z
    .string()
    .min(1, 'SKU is required')
    .max(50, 'SKU must be 50 characters or less'),

  itemType: z
    .enum(['GOODS', 'SERVICES', 'CONSUMABLE'], {
      errorMap: () => ({ message: 'Select a valid item type' }),
    }),

  hsnCode: z
    .union([
      z.string().max(8, 'HSN code must be 8 characters or less'),
      z.literal(null),
    ])
    .optional()
    .transform(val => val === '' ? null : val),

  sacCode: z
    .union([
      z.string().max(6, 'SAC code must be 6 characters or less'),
      z.literal(null),
    ])
    .optional()
    .transform(val => val === '' ? null : val),

  isActive: z.boolean().default(true),
});

// Infer form values type
export type ItemFormValues = z.infer<typeof itemFormSchema>;
```

### Backend: `backend/src/schemas/itemSchemas.ts`

The backend has a **similar but independent** schema:

```typescript
export const createItemSchema = z.object({
  name: z.string().min(1).max(255),
  sku: z.string().min(1).max(50),
  itemType: z.enum(['GOODS', 'SERVICES', 'CONSUMABLE']),
  hsnCode: z.string().max(8).nullable().optional(),
  sacCode: z.string().max(6).nullable().optional(),
  isActive: z.boolean().optional().default(true),
});
```

**Why separate schemas?**
- Frontend validates for UX (before sending to server)
- Backend validates at API boundary (never trust client)
- They can differ (e.g., password field only on frontend)

## Schema Breakdown

### Required vs Optional Fields

```typescript
// Required: must always be present
name: z.string()

// Optional: can be undefined
hsnCode: z.string().optional()

// Required but can be null
sacCode: z.string().nullable()

// Optional and can be null
code: z.string().nullable().optional()
```

### Custom Error Messages

```typescript
z.string().min(1, 'Name is required')
// Instead of default: "String must contain at least 1 character(s)"

z.enum(['GOODS', 'SERVICES'], {
  errorMap: () => ({ message: 'Select a valid item type' })
})
```

### Transforms

```typescript
// Convert empty string to null for optional fields
hsnCode: z.string().optional().transform(val => val === '' ? null : val)

// Trim whitespace
name: z.string().transform(val => val.trim())
```

## Inferred Types

Zod can infer TypeScript types from schemas:

```typescript
const userSchema = z.object({
  id: z.number(),
  name: z.string(),
});

type User = z.infer<typeof userSchema>;
// User = { id: number; name: string }
```

This means:
- Schema is the **single source of truth**
- TypeScript types stay in sync automatically
- No separate type definitions needed

## Working with Schema Data

### Parsing (Validating & Transforming)

```typescript
const schema = z.object({
  name: z.string(),
  age: z.number(),
});

// Parse - throws on error
const result1 = schema.parse({ name: "John", age: 30 }); // ✓

// Safe parse - returns result object
const result2 = schema.safeParse({ name: "John", age: "30" });
if (!result2.success) {
  console.log(result2.error.issues); // Array of validation errors
} else {
  console.log(result2.data); // Valid data
}
```

### Partial (Make all fields optional)

```typescript
const updateSchema = createItemSchema.partial();
// All fields are now optional for updates
```

## Valid and Invalid Form Data

### Valid Data (passes schema)

```typescript
{
  name: "Laptop",
  sku: "LAP-001",
  itemType: "GOODS",
  hsnCode: "8471",
  sacCode: null,
  isActive: true
}
```

### Invalid Data (fails schema)

```typescript
// Missing required fields
{ name: "" } // ✗ Name is required

// Wrong enum value
{ itemType: "INVALID" } // ✗ Invalid enum value

// Wrong type
{ sku: 123 } // ✗ Expected string

// Wrong length
{ name: "x".repeat(300) } // ✗ Too long

// Invalid for optional field
{ hsnCode: "ABC-XYZ-12345" } // ✗ Max 8 chars
```

## How React Hook Form Uses Zod

React Hook Form doesn't validate forms itself. Instead, it uses **resolvers**:

```typescript
// Without resolver (manual validation)
useForm({
  onSubmit: (data) => {
    if (!data.name) setError('name', 'Required');
  }
})

// With zodResolver (automatic validation)
useForm({
  resolver: zodResolver(itemFormSchema), // Pass schema here
})
// React Hook Form now:
// - Validates with Zod
// - Displays error messages automatically
// - Infers form values type from schema
```

## Key Concepts

| Term | Meaning |
|------|---------|
| **Schema** | Definition of what valid data looks like |
| **Parse** | Validate and transform data (throws on error) |
| **Infer** | Extract TypeScript type from schema |
| **Resolver** | Bridge between form library and validation library |
| **Transform** | Modify data after validation (e.g., trim, convert) |
| **Nullable** | Field can be null (but present) |
| **Optional** | Field can be undefined (not present) |

## Next Step

Now that you understand schemas, read [03-react-hook-form-basics.md](03-react-hook-form-basics.md) to learn how React Hook Form uses these schemas.
