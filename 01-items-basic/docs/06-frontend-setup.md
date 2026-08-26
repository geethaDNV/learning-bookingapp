# 06 — Frontend Setup

## Stack

- **Vite + React + TypeScript** — fast dev server, minimal config.
- **Tailwind CSS** — utility classes for styling (no custom CSS files to maintain).
- **Redux Toolkit + react-redux** — global state for the item list (search/status/page/data), matching production's use of Redux for dispatch-driven data flow.
- **@tanstack/react-table** — headless table library that handles column definitions and row rendering, same library production uses.

## Install and configure

```bash
cd 01-items-basic/frontend
cp .env.example .env
npm install
```

`.env` should point at your backend:
```
VITE_API_BASE_URL=http://localhost:4001/api/v1
```

## Run it

```bash
npm run dev
```

Vite prints a local URL (default `http://localhost:5174`). Open it — you should see an (initially empty until the backend responds) items table.

## CORS

The backend ([`src/app.ts`](../backend/src/app.ts)) calls `app.use(cors())` with no restrictions, which allows the Vite dev server (a different origin/port) to call it directly. In a real production app you'd restrict `cors()` to your actual frontend's origin.

## Folder structure

```
frontend/src/
├── App.tsx                     # wraps everything in <Provider store={store}>
├── main.tsx                    # React root
├── store/
│   ├── store.ts                # combines reducers, exports RootState/AppDispatch
│   └── hooks.ts                # typed useAppDispatch/useAppSelector
├── services/api/apiClient.ts   # minimal fetch wrapper
└── features/items/
    ├── types/item.types.ts
    ├── services/itemService.ts # API calls scoped to items
    ├── store/
    │   ├── itemSlice.ts        # state + reducers (setSearch/setStatus/setPage)
    │   ├── itemThunks.ts       # fetchItems async thunk
    │   └── itemSelectors.ts
    ├── hooks/useItemsList.ts   # ties store + thunk together
    ├── components/list/
    │   ├── ItemFilters.tsx
    │   └── ItemTable.tsx
    └── pages/ItemListPage.tsx
```

This **feature-based folder structure** (`features/items/{types,services,store,hooks,components,pages}`) is the same convention `bookingapp/frontend/src/features/items` uses — everything related to the items feature lives together instead of being scattered across generic `components/`, `hooks/`, `pages/` folders.

Continue to [07-frontend-redux-and-data-flow.md](./07-frontend-redux-and-data-flow.md).
