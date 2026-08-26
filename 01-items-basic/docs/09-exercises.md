# 09 — Exercises

Try these yourself, in order. Each builds on the previous docs.

## 1. Enable HSN/SAC search (end-to-end)

The `hsnCode`/`sacCode` columns already exist (see [doc 02](./02-database-and-prisma.md)) but aren't searchable. Wire them up:

1. **Repository** — in `toItemWhereInput` ([`itemRepository.ts`](../backend/src/repositories/itemRepository.ts)), add `hsnCode`/`sacCode` to the `search`'s `OR` array (see [doc 04](./04-backend-search-filtering.md) for the exact pattern to copy).
2. **Test** with curl: `curl "http://localhost:4001/api/v1/items?search=9401"` should now return items with that HSN code.
3. **Frontend** — no changes needed to search *for* hsn/sac (it's the same `search` box), but consider adding the code to the table as a visible column in `ItemTable.tsx`.

## 2. Add a debounce to the search input

Right now every keystroke triggers an API call (see [doc 08](./08-frontend-table-and-filters.md)). Add a 300ms debounce so the request only fires after the user pauses typing.

Hint: you can debounce either in `ItemFilters` (local state + `setTimeout` before calling `onSearchChange`) or inside `useItemsList`'s `useEffect` (delay the `dispatch(fetchItems(...))` call). Compare both approaches — which is closer to what production's `useItemQuery` does?

## 3. Add sort-by-name

1. Add a `sortOrder: z.enum(['asc', 'desc']).default('asc')` field to `listItemsQuerySchema`.
2. Use it in `orderBy: { name: sortOrder }` in `ItemRepository.findMany`.
3. On the frontend, enable `getSortedRowModel()` in `useReactTable(...)` and make the "Name" column header clickable, dispatching a new Redux action (e.g. `setSortOrder`) that's included in the `fetchItems` payload.

## 4. Add a page-size selector

Add a `<select>` next to the pagination buttons in `ItemTable` letting the user pick 10/25/50 per page, dispatching a new `setPageSize` reducer (remember to reset `page` to `1` when it changes, same as `setSearch`/`setStatus` do).

## 5. Write your first test

Pick either:
- **Backend**: a unit test for `toItemWhereInput` (no Prisma/DB needed — it's a pure function) asserting the shape of the returned `where` object for various filter combinations.
- **Frontend**: a test for `itemSlice`'s reducers (e.g. `setSearch` resets `page` to `1`) using `@reduxjs/toolkit`'s slice directly, no rendering required.

Neither the backend nor frontend `package.json` has a test runner installed yet — pick one (Vitest is a good, fast choice for both) and add it as a dev dependency.

Continue to [10-how-this-maps-to-the-real-app.md](./10-how-this-maps-to-the-real-app.md).
