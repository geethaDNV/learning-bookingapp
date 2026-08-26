# 01 — Overview

## What you'll build

A tiny, fully working slice of the booking app's **Items** feature:

- A backend API (`GET /api/v1/items`, `POST /api/v1/items`) built with Express + Prisma + Postgres (Neon).
- A frontend page listing items in a table, with search-by-name/SKU and a status filter, built with React + Redux Toolkit + `@tanstack/react-table`.

You will run both, seed some sample data, and trace a request end-to-end: typing in the search box → Redux action → HTTP request → Express route → controller → service → repository → Prisma → Postgres → back up through the same layers → table re-renders.

## Prerequisites

- Node.js 18+ and npm.
- A free [Neon](https://neon.tech) account (Postgres, no local install needed).
- Basic familiarity with TypeScript, React, and REST APIs. No prior Redux or Prisma experience required — both are explained as you go.

## Why build it this way

The real `bookingapp` items feature has dozens of fields, multi-tenancy, auth, audit logging, image uploads, and a hybrid client/server pagination strategy. That's a lot to take in at once. This module keeps the **same layered architecture and the same core patterns** (routes → controller → service → repository → Prisma; Redux-driven data fetching; `@tanstack/react-table` rendering) but trims the fields and removes the advanced concerns, so you can focus on how the pieces fit together first.

## How this maps to the real app

| Learning file | Production equivalent |
| --- | --- |
| `backend/src/repositories/itemRepository.ts` | `bookingapp/backend/repositories/items/itemRepository.ts` |
| `backend/src/services/itemService.ts` | `bookingapp/backend/services/items/itemService.ts` |
| `backend/src/controllers/itemsController.ts` | `bookingapp/backend/controllers/items/itemsController.ts` |
| `backend/src/routes/items.ts` | `bookingapp/backend/routes/items/items.ts` |
| `backend/prisma/schema.prisma` (`Item` model) | `bookingapp/backend/prisma/schema.prisma` (`Item` model) |
| `frontend/src/features/items/store/*` | `bookingapp/frontend/src/features/items/store/*` |
| `frontend/src/features/items/components/list/ItemTable.tsx` | `bookingapp/frontend/src/features/items/components/list/ItemTable.tsx` |

See [10-how-this-maps-to-the-real-app.md](./10-how-this-maps-to-the-real-app.md) for the full, detailed comparison once you've finished this module.

## Module structure

```
01-items-basic/
├── backend/    # Express + Prisma + Postgres API
├── frontend/   # React + Redux Toolkit + react-table UI
└── docs/       # you are here
```

Continue to [02-database-and-prisma.md](./02-database-and-prisma.md).
