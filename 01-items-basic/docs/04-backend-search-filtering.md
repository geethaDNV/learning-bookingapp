# 04 — Backend Search & Filtering

This is the core learning point of the whole module: **how a `search` string and a `status` filter typed by a user become a Prisma query.**

## The query schema

[`src/schemas/itemSchemas.ts`](../backend/src/schemas/itemSchemas.ts):

```ts
export const listItemsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().min(1).optional(),
  status: z.enum(['active', 'inactive']).optional(),
});
```

`z.coerce.number()` converts the string query params Express always gives you (`req.query.page === "2"`) into real numbers, with validation and defaults baked in. If a client sends `status=banana`, this throws a `ZodError`, which `errorHandler` turns into a 400 response automatically.

## Turning filters into a Prisma `where` clause

[`src/repositories/itemRepository.ts`](../backend/src/repositories/itemRepository.ts):

```ts
function toItemWhereInput(filters: ItemFilters): Prisma.ItemWhereInput {
  return {
    ...(filters.status && { isActive: filters.status === 'active' }),
    ...(filters.search && {
      OR: [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { sku: { contains: filters.search, mode: 'insensitive' } },
      ],
    }),
  };
}
```

Walk through this line by line:
- `...(filters.status && { isActive: ... })` — this is a common TypeScript trick: if `filters.status` is falsy (`undefined`), the spread adds nothing to the object. If it's truthy, it spreads in `{ isActive: true | false }`. That's why the `status` filter only appears in the query when the user actually picked one.
- `filters.status === 'active'` — the frontend/API deal in the string `"active"`/`"inactive"`, but the database column is a `Boolean`. This is the translation point.
- The `search` block uses Prisma's `OR` to match **either** the name **or** the SKU, both case-insensitively (`mode: 'insensitive'`), both using `contains` (a `LIKE '%value%'` under the hood).

**Why hsnCode/sacCode aren't here yet:** the columns exist in the schema (see [02](./02-database-and-prisma.md)) so a future module can add HSN/SAC search without a migration, but wiring them into `search`'s `OR` array, or as their own `code` filter, is intentionally left as [an exercise](./09-exercises.md) — so you practice extending this exact function yourself.

## Pagination

```ts
return prisma.item.findMany({
  where,
  orderBy: { name: 'asc' },
  skip: (page - 1) * pageSize,
  take: pageSize,
});
```

`skip`/`take` is Prisma's equivalent of SQL's `OFFSET`/`LIMIT`. Page 1 skips 0 rows; page 2 skips `pageSize` rows; and so on. `itemRepository.count(filters)` runs the *same* `where` clause through `prisma.item.count()` to get the total row count for pagination math (`totalPages` in the API response).

## Tracing a full request

1. Frontend sends `GET /api/v1/items?search=chair&status=active&page=1&pageSize=10`.
2. `ItemsController.getItems` parses this into a typed, validated object via `listItemsQuerySchema.parse(req.query)`.
3. `ItemService.search(query)` builds `{ search: 'chair', status: 'active' }` and calls the repository twice (once for rows, once for count) in parallel via `Promise.all`.
4. `ItemRepository.findMany`/`count` build the `where` clause shown above and hit Postgres.
5. The controller wraps the result in the standard paginated envelope and sends it back.

Continue to [05-running-and-testing-the-api.md](./05-running-and-testing-the-api.md).
