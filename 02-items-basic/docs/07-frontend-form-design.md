# 07 - Frontend Form Design

The shared form lives at [../frontend/src/features/items/components/form/ItemForm.tsx](../frontend/src/features/items/components/form/ItemForm.tsx).

It is used by both:

- [../frontend/src/features/items/pages/ItemCreatePage.tsx](../frontend/src/features/items/pages/ItemCreatePage.tsx)
- [../frontend/src/features/items/pages/ItemEditPage.tsx](../frontend/src/features/items/pages/ItemEditPage.tsx)

## Why one shared form

Create and edit need almost the same inputs:

- name
- SKU
- item type
- status
- HSN code
- SAC code

Using one form prevents create and edit from drifting apart. That is the same idea used in production, where the form is larger and split into sections.

## Controlled inputs

Each field is stored in React state. On submit, the form creates a payload and calls `onSubmit` from the page.

The page decides which thunk to dispatch:

- create page dispatches `createItem`
- edit page dispatches `updateItem`

## Optional field behavior

For optional fields, the form sends `null` when the input is blank:

```ts
sku: sku.trim() || null
hsnCode: hsnCode.trim() || null
sacCode: sacCode.trim() || null
```

That matches the backend schema, which also converts empty optional body strings to `null`.

## HSN and SAC in the form

Module 02 keeps HSN/SAC validation simple. The form lets users enter either field for learning purposes. A later exercise can add conditional validation based on item type.

Continue to [08-redux-mutations.md](./08-redux-mutations.md).
