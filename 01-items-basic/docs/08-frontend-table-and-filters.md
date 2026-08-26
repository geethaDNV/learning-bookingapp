# 08 — Frontend: Table and Filters

## ItemFilters

[`src/features/items/components/list/ItemFilters.tsx`](../frontend/src/features/items/components/list/ItemFilters.tsx) is a fully controlled component — it owns no state of its own, it just renders whatever `search`/`status` it's given and calls the callbacks it's given on change:

```tsx
<input value={search} onChange={(e) => onSearchChange(e.target.value)} />
<select value={status} onChange={(e) => onStatusChange(e.target.value as ItemStatusFilter)}>
  <option value="all">All statuses</option>
  <option value="active">Active</option>
  <option value="inactive">Inactive</option>
</select>
```

`ItemListPage` passes `onSearchChange={setSearch}` / `onStatusChange={setStatus}` from `useItemsList()` — so every keystroke dispatches `setSearch`, which (per [doc 07](./07-frontend-redux-and-data-flow.md)) triggers a new `fetchItems` call. There's no debounce yet — every keystroke fires a request. That's a deliberate simplification for this module; adding a debounce is one of the [exercises](./09-exercises.md).

## ItemTable — @tanstack/react-table

[`src/features/items/components/list/ItemTable.tsx`](../frontend/src/features/items/components/list/ItemTable.tsx) defines columns with `createColumnHelper<Item>()`:

```ts
const columnHelper = createColumnHelper<Item>();
const columns = [
  columnHelper.accessor('name', { header: 'Name' }),
  columnHelper.accessor('sku', { header: 'SKU', cell: (info) => info.getValue() ?? '—' }),
  columnHelper.accessor('itemType', { header: 'Type' }),
  columnHelper.accessor('isActive', {
    header: 'Status',
    cell: (info) => (/* colored badge */),
  }),
];
```

`react-table` is a **headless** table library — it manages column/row *state and logic*, but you write the actual `<table>` markup yourself (that's the `flexRender(header.column.columnDef.header, header.getContext())` calls you see in the JSX). This module only uses `getCoreRowModel()` (basic row rendering); production's `ItemTable` also enables sorting and row-selection models, which this module intentionally skips (see [09-exercises.md](./09-exercises.md) for adding sorting yourself).

Pagination here is **not** handled by react-table's built-in pagination model — it's driven by the same Redux `page`/`pageSize` state from [doc 07](./07-frontend-redux-and-data-flow.md), via simple Previous/Next buttons that call `onPageChange`, which calls `setPage`, which triggers a new server-side fetch for that page.

## Full end-to-end trace

Put it all together — here's what happens when someone types "chair" into the search box:

1. `ItemFilters`'s `<input onChange>` fires → calls `onSearchChange("chair")`.
2. `ItemListPage` passed `onSearchChange={setSearch}` (from `useItemsList()`) → dispatches `setSearch("chair")`.
3. `itemSlice`'s reducer sets `state.items.search = "chair"` and resets `state.items.page = 1`.
4. `useItemsList`'s `useEffect` sees `search` changed → dispatches `fetchItems({ search: "chair", status: undefined, page: 1, pageSize: 10 })`.
5. The thunk calls `itemService.getItemList(...)` → `apiClient.get('/items', { search: 'chair', ... })` → `fetch('http://localhost:4001/api/v1/items?search=chair&page=1&pageSize=10')`.
6. Backend: `ItemsController.getItems` → `ItemService.search` → `ItemRepository.findMany`/`count` → `toItemWhereInput({ search: 'chair' })` → Prisma `WHERE name ILIKE '%chair%' OR sku ILIKE '%chair%'` (see [doc 04](./04-backend-search-filtering.md)).
7. Response flows back → `fetchItems.fulfilled` → `state.items.rows` updated.
8. `ItemListPage` re-renders → `ItemTable` shows only matching rows.

If you can explain each of these 8 steps in your own words, you understand the whole module.

Continue to [09-exercises.md](./09-exercises.md).
