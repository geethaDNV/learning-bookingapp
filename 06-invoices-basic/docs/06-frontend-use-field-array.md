# 06 - Frontend useFieldArray

## What is useFieldArray?

React Hook Form's `useFieldArray` hook manages **dynamic arrays** of fields. In invoices, it manages the line items array.

Without it, adding/removing lines would require complex state management.

## Basic Usage

```typescript
import { useFieldArray } from "react-hook-form";

const MyForm = () => {
  const { control } = useForm();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "lines",  // The array field name
  });

  return (
    <div>
      {fields.map((field, index) => (
        <div key={field.id}>
          <input {...register(`lines.${index}.quantity`)} />
          <input {...register(`lines.${index}.rate`)} />
          <button onClick={() => remove(index)}>Delete</button>
        </div>
      ))}
      <button onClick={() => append({ quantity: 0, rate: 0 })}>
        Add Line
      </button>
    </div>
  );
};
```

## In Our Invoice Form

**File:** `frontend/src/components/InvoiceLineFields.tsx`

### Initialization
```typescript
const InvoiceLineFields = ({ control, fieldArray }) => {
  const { fields, append, remove } = fieldArray;

  const handleAddLine = () => {
    append({
      itemId: 0,
      quantity: 0,
      rate: 0,
    });
  };

  return (
    <div>
      {fields.map((field, index) => (
        <div key={field.id} className="p-4 border rounded">
          {/* Item selector */}
          <ItemAutocomplete
            control={control}
            name={`lines.${index}.itemId`}
          />

          {/* Quantity input */}
          <input
            {...register(`lines.${index}.quantity`)}
            type="number"
            step="0.01"
          />

          {/* Rate input */}
          <input
            {...register(`lines.${index}.rate`)}
            type="number"
            step="0.01"
          />

          {/* Delete button */}
          <button onClick={() => remove(index)}>Remove</button>
        </div>
      ))}

      <button onClick={handleAddLine}>+ Add Line</button>
    </div>
  );
};
```

## How It Works Step-by-Step

### Initial State
```javascript
fields = [
  // (empty)
]
```

### User Clicks "Add Line"
```javascript
append({ itemId: 0, quantity: 0, rate: 0 })

fields = [
  { id: "a1b2c3", itemId: 0, quantity: 0, rate: 0 }
]

Form watches "lines.0.itemId", "lines.0.quantity", "lines.0.rate"
```

### User Enters Values
```javascript
Input line 0, quantity: 5
Input line 0, rate: 150
Input line 0, itemId: 1

form.getValues("lines") = [
  { itemId: 1, quantity: 5, rate: 150 }
]
```

### User Adds Another Line
```javascript
append({ itemId: 0, quantity: 0, rate: 0 })

fields = [
  { id: "a1b2c3", itemId: 1, quantity: 5, rate: 150 },
  { id: "d4e5f6", itemId: 0, quantity: 0, rate: 0 }
]

Form now watches "lines.1.itemId", "lines.1.quantity", "lines.1.rate"
```

### User Enters Values for Line 2
```javascript
form.getValues("lines") = [
  { itemId: 1, quantity: 5, rate: 150 },
  { itemId: 2, quantity: 1, rate: 500 }
]
```

### User Removes Line 1
```javascript
remove(0)

fields = [
  { id: "d4e5f6", itemId: 2, quantity: 1, rate: 500 }
]

Form now only watches "lines.0.itemId", "lines.0.quantity", "lines.0.rate"
```

### User Submits
```javascript
form.handleSubmit(onSubmit)

// onSubmit receives:
{
  customerId: 1,
  dueDate: "2025-02-28",
  notes: "Thank you",
  lines: [
    { itemId: 2, quantity: 1, rate: 500 }
  ]
}
```

## Key Properties

### `fields`
Array of field objects with generated `id`. Use `field.id` as React key (not index).

```typescript
fields.map((field) => (
  <div key={field.id}>  // ✓ Correct
```

### `append(value, options?)`
Add a new line to the end. Value is merged with existing field state.

```typescript
append({ itemId: 0, quantity: 0, rate: 0 })
// or
append({ itemId: 0, quantity: 0, rate: 0 }, { shouldFocus: true })
```

### `remove(index)`
Remove line at specific index. Automatically re-indexes other lines.

```typescript
remove(0)  // Remove first line
```

### `insert(index, value)`
Insert line at specific index (not used in basic invoice).

### `swap(indexA, indexB)`
Swap two lines (optional feature).

## Real-Time Calculation with useFieldArray

**File:** `frontend/src/components/InvoiceForm.tsx`

```typescript
const InvoiceForm = () => {
  const form = useForm<InvoiceFormValue>({ ... });
  const { control, watch } = form;
  const fieldArray = useFieldArray({ control, name: "lines" });

  const lines = watch("lines");  // Watch all lines
  const { calculateLine, calculateTotals } = useInvoiceCalculations();

  // Recalculate whenever lines change
  const totals = useMemo(() => {
    if (!lines || lines.length === 0) {
      return { subtotal: 0, totalTax: 0, total: 0 };
    }

    const calculations = lines.map((line) =>
      calculateLine(line.quantity, line.rate, 18)
    );

    return calculateTotals(calculations);
  }, [lines, calculateLine, calculateTotals]);

  return (
    <div>
      <InvoiceLineFields control={control} fieldArray={fieldArray} />

      {/* Display totals */}
      <div>
        <p>Subtotal: ${totals.subtotal.toFixed(2)}</p>
        <p>Tax: ${totals.totalTax.toFixed(2)}</p>
        <p>Total: ${totals.total.toFixed(2)}</p>
      </div>

      <button type="submit">Create Invoice</button>
    </div>
  );
};
```

## Validation with useFieldArray

Zod schema for lines:
```typescript
const invoiceFormSchema = z.object({
  customerId: z.number().positive(),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
  lines: z
    .array(
      z.object({
        itemId: z.number().int().positive("Item is required"),
        quantity: z.coerce.number().positive("Qty must be > 0"),
        rate: z.coerce.number().nonnegative("Rate must be >= 0"),
      })
    )
    .min(1, "At least one line is required"),
});
```

If validation fails:
```typescript
{errors.lines && (
  <p className="text-red-500">{errors.lines.message}</p>
)}
```

## Common Patterns

### Add/Remove with UI Buttons
```typescript
const handleAdd = () => append({ itemId: 0, quantity: 1, rate: 0 });
const handleRemove = (index) => remove(index);

return (
  <>
    {fields.map((field, index) => (
      <div key={field.id}>
        <ItemAutocomplete name={`lines.${index}.itemId`} />
        <button onClick={() => handleRemove(index)}>Remove</button>
      </div>
    ))}
    <button onClick={handleAdd}>+ Add Line</button>
  </>
);
```

### Initialize with Existing Data
```typescript
const { data: invoice } = useQuery(publicId);

useForm({
  defaultValues: invoice ? {
    customerId: invoice.customerId,
    lines: invoice.lines.map((line) => ({
      itemId: line.itemId,
      quantity: Number(line.quantity),
      rate: Number(line.rate),
    })),
  } : { lines: [] },
});
```

### Field Array Validation Errors
```typescript
{errors.lines?.map((error, index) => (
  <div key={index} className="text-red-500 text-sm">
    {error?.itemId?.message}
    {error?.quantity?.message}
    {error?.rate?.message}
  </div>
))}
```

## Summary

- **useFieldArray** manages dynamic arrays of form fields
- **`fields`**: Array of field objects (use `.id` as key, not index)
- **`append()`**: Add new line
- **`remove()`**: Delete line
- **`watch()`**: Get current values, triggers recalculation
- **Watch + useMemo**: Real-time totals without API call
- **Zod validation**: Validates entire array structure
- **Error display**: Show errors per line or global
