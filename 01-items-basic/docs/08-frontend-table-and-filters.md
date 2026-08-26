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

### About `(info) => info.getValue()`

That function is a **cell renderer**. For each row in that column, React Table calls it with a cell context object (`info`):

```ts
cell: (info) => info.getValue()
```

- `info` contains metadata about the current cell (row, column, table, helpers).
- `info.getValue()` returns the accessor value for that row/column.
  - For `accessor('sku', ...)`, it returns that row's `sku`.
  - For `accessor('name', ...)`, it returns that row's `name`.

So this is basically saying: "Render the raw value for this cell."

In your code, SKU uses:

```ts
cell: (info) => info.getValue() ?? '—'
```

That means: if `sku` is `null`/`undefined`, show `—` instead of a blank cell.

Note: if you omit `cell` entirely, TanStack can still render basic values. You add `cell: (info) => ...` when you need custom formatting, fallback text, badges, links, buttons, etc.

### Clear filters behavior

The filters bar now includes a **Clear filters** button.

- It clears `search` back to `''`.
- It resets `status` back to `'all'`.
- It resets `page` back to `1`.
- The button is disabled when filters are already at default (`search` empty and `status === 'all'`).

Event flow for Clear filters:

1. User clicks **Clear filters** in `ItemFilters`.
2. `ItemFilters` calls `onClearFilters()`.
3. `ItemListPage` passes `onClearFilters={clearFilters}` from `useItemsList()`.
4. `useItemsList.clearFilters` dispatches `resetFilters()`.
5. `itemSlice.resetFilters` sets `search=''`, `status='all'`, and `page=1`.
6. `useItemsList` effect sees state changed and dispatches `fetchItems(...)` with default filters.
7. Table refreshes with unfiltered server results.

`react-table` is a **headless** table library — it manages column/row *state and logic*, but you write the actual `<table>` markup yourself (that's the `flexRender(header.column.columnDef.header, header.getContext())` calls you see in the JSX). This module only uses `getCoreRowModel()` (basic row rendering); production's `ItemTable` also enables sorting and row-selection models, which this module intentionally skips (see [09-exercises.md](./09-exercises.md) for adding sorting yourself).

### How headers are rendered

In `ItemTable`, `useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() })` builds an internal table model. Header rendering usually looks like this:

```tsx
<thead>
  {table.getHeaderGroups().map((headerGroup) => (
    <tr key={headerGroup.id}>
      {headerGroup.headers.map((header) => (
        <th key={header.id}>
          {header.isPlaceholder
            ? null
            : flexRender(header.column.columnDef.header, header.getContext())}
        </th>
      ))}
    </tr>
  ))}
</thead>
```

What is happening here:

1. `getHeaderGroups()` returns one or more header rows.
2. Each group becomes one `<tr>`.
3. Each header in that group becomes one `<th>`.
4. `flexRender(...)` resolves whatever you configured in `columnDef.header`:
   - plain text (`'Name'`), or
   - a custom render function.

`header.isPlaceholder` matters when you have grouped/nested columns; it avoids rendering text in structural placeholder cells. Even if this module uses simple flat columns, this pattern keeps the table compatible with future grouped headers.

### How detail/body rows are rendered

Body rendering usually looks like this:

```tsx
<tbody>
  {table.getRowModel().rows.map((row) => (
    <tr key={row.id}>
      {row.getVisibleCells().map((cell) => (
        <td key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </td>
      ))}
    </tr>
  ))}
</tbody>
```

Flow of data-to-rows:

1. Your Redux/API result becomes `data` passed into `useReactTable`.
2. `getCoreRowModel()` converts that array into row objects.
3. `getRowModel().rows` is the final list of rows to draw.
4. `row.getVisibleCells()` gives one cell per visible column.
5. `flexRender(...)` resolves each `columnDef.cell` renderer:
   - default value rendering (for simple columns), or
   - custom logic (for example SKU fallback `?? '—'`, or status badge styling).

So React Table does not create DOM for you; it gives you a structured model (`headerGroup -> header`, `row -> cell`) and helpers (`flexRender`) so you can render full semantic HTML with your own classes and layout.

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
