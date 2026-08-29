# 08 - Redux Mutations

The Redux files live in [../frontend/src/features/items/store](../frontend/src/features/items/store).

This module mirrors the real BookingApp Items state flow, but with fewer actions and fewer fields.

## Thunks

Open [../frontend/src/features/items/store/itemThunks.ts](../frontend/src/features/items/store/itemThunks.ts).

The thunks are:

- `fetchItems`
- `fetchItemById`
- `createItem`
- `updateItem`
- `setItemStatus`
- `deleteItem`

Each thunk calls [../frontend/src/features/items/services/itemService.ts](../frontend/src/features/items/services/itemService.ts). The thunk does not build URLs directly.

## Slice state

Open [../frontend/src/features/items/store/itemSlice.ts](../frontend/src/features/items/store/itemSlice.ts).

Important state fields:

- `rows` - current list page
- `selectedItem` - detail/edit item
- `total`, `page`, `pageSize` - pagination
- `search`, `status`, `itemType`, `code` - list filters
- `loading` - list/detail reads
- `saving` - create/update/status/delete mutations
- `error` and `successMessage` - simple feedback

## Lifecycle pattern

Every async thunk has three states:

- pending
- fulfilled
- rejected

That pattern is the key lesson. Production has more thunks, but the mental model is the same.

## Production mapping

Learning module:

```text
itemThunks.ts -> itemService.ts -> apiClient.ts -> backend API
```

Production app:

```text
BookKeepingApp/frontend/src/features/items/store/itemThunks.ts
BookKeepingApp/frontend/src/features/items/services/itemService.ts
BookKeepingApp/frontend/src/services/api
BookKeepingApp/backend/routes/items/items.ts
```

Continue to [09-table-actions-and-filters.md](./09-table-actions-and-filters.md).
