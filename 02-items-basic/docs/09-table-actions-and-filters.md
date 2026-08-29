# 09 - Table Actions And Filters

The list page is [../frontend/src/features/items/pages/ItemListPage.tsx](../frontend/src/features/items/pages/ItemListPage.tsx).

It combines three pieces:

- [../frontend/src/features/items/components/list/ItemFilters.tsx](../frontend/src/features/items/components/list/ItemFilters.tsx)
- [../frontend/src/features/items/components/list/ItemTable.tsx](../frontend/src/features/items/components/list/ItemTable.tsx)
- [../frontend/src/features/items/hooks/useItemsList.ts](../frontend/src/features/items/hooks/useItemsList.ts)

## Filters

The filters are stored in Redux:

- `search`
- `status`
- `itemType`
- `code`
- `page`
- `pageSize`

When a filter changes, the slice resets `page` to `1`. Then `useItemsList` dispatches `fetchItems` with the new query.

## Code filter

`code` is dedicated to HSN/SAC search. It maps to:

```http
GET /api/v1/items?code=9983
```

The backend repository checks `hsnCode` and `sacCode` only.

## Table

The table uses `@tanstack/react-table` and defines columns for:

- name
- SKU
- item type
- HSN
- SAC
- status
- actions

The action column includes:

- view by clicking the item name
- edit
- inactivate/reactivate
- delete

## Confirmation dialog

Inactivate/reactivate and delete both use [../frontend/src/features/items/components/shared/ConfirmDialog.tsx](../frontend/src/features/items/components/shared/ConfirmDialog.tsx).

This keeps accidental destructive actions out of the table click itself.

Continue to [10-end-to-end-crud-traces.md](./10-end-to-end-crud-traces.md).
