# 02 - Items Basic CRUD

A self-contained learning module for the Items CRUD flow. This module builds on `01-items-basic` and teaches how an Item moves through the same kind of layers used in the real BookKeepingApp: React page -> Redux thunk -> API service -> Express route -> controller -> service -> repository -> Prisma -> database.

## What you will build

- List items with search, status, item type, and HSN/SAC code filters.
- View one item in a detail page.
- Create an item.
- Edit an item, including HSN and SAC code fields.
- Inactivate or reactivate an item.
- Optionally hard delete demo data.

## Prerequisites

- Node.js and npm.
- A Neon Postgres database branch for this module, for example `02-items-basic`.
- Basic TypeScript, React, Redux Toolkit, Express, and Prisma familiarity.

## Backend quick start

```bash
cd backend
cp .env.example .env
# Fill DATABASE_URL with the Neon branch connection string.
npm install
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

Backend runs on `http://localhost:4002` by default.

Useful smoke checks:

```bash
curl "http://localhost:4002/api/v1/items"
curl "http://localhost:4002/api/v1/items?search=chair"
curl "http://localhost:4002/api/v1/items?code=9983"
curl "http://localhost:4002/api/v1/items?status=active&itemType=service"
```

## Frontend quick start

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend runs on `http://localhost:5175` by default.

## Docs reading order

Read the docs in order:

1. [docs/01-overview.md](./docs/01-overview.md)
2. [docs/02-database-and-model.md](./docs/02-database-and-model.md)
3. [docs/03-backend-read-flow.md](./docs/03-backend-read-flow.md)
4. [docs/04-backend-create-flow.md](./docs/04-backend-create-flow.md)
5. [docs/05-backend-update-flow.md](./docs/05-backend-update-flow.md)
6. [docs/06-backend-delete-status-flow.md](./docs/06-backend-delete-status-flow.md)
7. [docs/07-frontend-form-design.md](./docs/07-frontend-form-design.md)
8. [docs/08-redux-mutations.md](./docs/08-redux-mutations.md)
9. [docs/09-table-actions-and-filters.md](./docs/09-table-actions-and-filters.md)
10. [docs/10-end-to-end-crud-traces.md](./docs/10-end-to-end-crud-traces.md)
11. [docs/11-how-this-maps-to-the-real-app.md](./docs/11-how-this-maps-to-the-real-app.md)
12. [docs/12-exercises.md](./docs/12-exercises.md)
