# 12 - Exercises

Use these exercises after the basic CRUD flow works.

## 1. Add debounce to list search

Currently every filter change can dispatch `fetchItems`. Add a short debounce for the text inputs so typing feels smoother.

Files to inspect:

- [../frontend/src/features/items/hooks/useItemsList.ts](../frontend/src/features/items/hooks/useItemsList.ts)
- [../frontend/src/features/items/components/list/ItemFilters.tsx](../frontend/src/features/items/components/list/ItemFilters.tsx)

## 2. Add sort by name

Add `sortBy=name` and `sortOrder=asc|desc` query params, update the repository `orderBy`, and add table controls.

Files to inspect:

- [../backend/src/schemas/itemSchemas.ts](../backend/src/schemas/itemSchemas.ts)
- [../backend/src/repositories/itemRepository.ts](../backend/src/repositories/itemRepository.ts)
- [../frontend/src/features/items/components/list/ItemTable.tsx](../frontend/src/features/items/components/list/ItemTable.tsx)

## 3. Add conditional HSN/SAC validation

Teach the business rule:

- goods should have HSN code
- services should have SAC code

Start with frontend form validation, then add backend Zod validation.

Files to inspect:

- [../frontend/src/features/items/components/form/ItemForm.tsx](../frontend/src/features/items/components/form/ItemForm.tsx)
- [../backend/src/schemas/itemSchemas.ts](../backend/src/schemas/itemSchemas.ts)

## 4. Add tests

Add one backend test for `toItemWhereInput` and one frontend test for the form submit payload.

Suggested backend cases:

- `search=chair` includes name/SKU/HSN/SAC OR conditions
- `code=9983` searches only HSN/SAC
- `status=inactive` maps to `isActive: false`

## 5. Replace hard delete with restore-friendly behavior

Remove the frontend hard delete action and keep only inactivate/reactivate. Add a doc note explaining why this is safer for accounting-style products.

## 6. Compare with production

Open the production Items files listed in [11-how-this-maps-to-the-real-app.md](./11-how-this-maps-to-the-real-app.md). Write down what each extra production concern protects:

- auth
- org scoping
- audit logs
- account references
- unit references
- image upload
- import/export
