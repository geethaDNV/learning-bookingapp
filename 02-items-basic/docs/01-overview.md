# 01 - Overview

## What you will build

This module builds a small but complete Items CRUD app:

- `GET /api/v1/items` lists items with pagination and filters.
- `GET /api/v1/items/:id` loads one item for detail and edit screens.
- `POST /api/v1/items` creates an item.
- `PUT /api/v1/items/:id` updates an item.
- `PATCH /api/v1/items/:id/status` inactivates or reactivates an item.
- `DELETE /api/v1/items/:id` physically deletes demo data.

The frontend has matching screens for list, detail, create, and edit. It uses Redux Toolkit thunks for data fetching and mutations, so the flow resembles the real BookKeepingApp Items feature.

## What changed from module 01

Module 01 focused on reading data: list, search, status filter, Redux fetch, and table rendering.

Module 02 adds the write flows:

- create item
- update item
- load one item by id
- inactivate/reactivate item
- optional hard delete
- include HSN/SAC fields in forms, table, detail page, and search

## Why this mirrors BookKeepingApp

The production Items feature has more fields, auth, tenant scoping, role checks, audit logs, image upload, imports, exports, and reference validation. This learning module keeps the same architecture shape but removes the extra concerns so the CRUD path is easy to follow.

## Folder structure

```text
02-items-basic/
  backend/   # Express + Prisma API
  frontend/  # React + Redux Toolkit UI
  docs/      # this learning guide
```

## How to study this module

Start with the database model, then trace one request at a time. Do not begin with the React form. The form is easier to understand after you know what the API accepts and what the service layer validates.

Continue to [02-database-and-model.md](./02-database-and-model.md).
