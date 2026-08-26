# 07 — Frontend: Redux and Data Flow

## Why Redux for a list of items?

Production `bookingapp` uses Redux Toolkit primarily for *mutations* (create/update/delete) and a hand-rolled hook for the list itself. This module simplifies that by using Redux for the **entire list-fetch flow** too — search text, status filter, current page, the fetched rows, loading/error state — all live in one slice. This lets you learn the "dispatch an action → thunk hits the API → reducer updates state → component re-renders" pattern in the simplest possible context, before you see the more advanced hybrid approach in the real app.

## The slice

[`src/features/items/store/itemSlice.ts`](../frontend/src/features/items/store/itemSlice.ts) holds:

```ts
interface ItemState {
  rows: Item[];
  total: number;
  page: number;
  pageSize: number;
  search: string;
  status: ItemStatusFilter;
  loading: boolean;
  error: string | null;
}
```

Three plain reducers update filter state directly:

```ts
setSearch(state, action) { state.search = action.payload; state.page = 1; }
setStatus(state, action) { state.status = action.payload; state.page = 1; }
setPage(state, action) { state.page = action.payload; }
```

(Redux Toolkit uses [Immer](https://immerjs.github.io/immer/) internally, so this "mutating" code is actually producing a new immutable state behind the scenes — that's why you're allowed to write `state.search = ...` instead of returning a new object.)

Note `setSearch`/`setStatus` both reset `page` back to `1` — otherwise you could end up on "page 3" of a filtered result set that only has one page.

## The thunk

[`src/features/items/store/itemThunks.ts`](../frontend/src/features/items/store/itemThunks.ts):

```ts
export const fetchItems = createAsyncThunk('items/fetchItems', async (query: ItemListQuery) => {
  return itemService.getItemList(query);
});
```

`createAsyncThunk` auto-generates three action types — `items/fetchItems/pending`, `/fulfilled`, `/rejected` — dispatched automatically as the promise resolves/rejects. The slice's `extraReducers` listens for exactly these:

```ts
.addCase(fetchItems.pending, (state) => { state.loading = true; state.error = null; })
.addCase(fetchItems.fulfilled, (state, action) => {
  state.loading = false;
  state.rows = action.payload.rows;
  state.total = action.payload.total;
})
.addCase(fetchItems.rejected, (state, action) => {
  state.loading = false;
  state.error = action.error.message ?? 'Failed to fetch items';
});
```

## Wiring it into a component

[`src/features/items/hooks/useItemsList.ts`](../frontend/src/features/items/hooks/useItemsList.ts) is the glue: it reads `search`/`status`/`page`/`pageSize` from the store, and a `useEffect` **dispatches `fetchItems` every time any of those change**:

```ts
useEffect(() => {
  dispatch(fetchItems({
    search: search || undefined,
    status: status === 'all' ? undefined : status,
    page,
    pageSize,
  }));
}, [dispatch, search, status, page, pageSize]);
```

This is the "dispatch action to fetch data and search" pattern: typing in the search box calls `setSearch` (a plain reducer, synchronous, instant) which changes `state.search`, which re-runs the effect, which dispatches `fetchItems` (async, hits the network), which — once resolved — updates `state.rows` via the `fulfilled` reducer, which re-renders the table.

## Watch it happen

Install the [Redux DevTools browser extension](https://github.com/reduxjs/redux-devtools), open it while the app is running, and type in the search box. You'll see `items/setSearch` fire immediately, followed by `items/fetchItems/pending` and then `items/fetchItems/fulfilled` a moment later.

Continue to [08-frontend-table-and-filters.md](./08-frontend-table-and-filters.md).
