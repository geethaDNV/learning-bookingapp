# 05 — Running and Testing the API

## Start the server

```bash
cd 01-items-basic/backend
npm install
npx prisma generate
npm run dev
```

You should see:
```
01-items-basic backend listening on http://localhost:4001
```

## Health check

```bash
curl http://localhost:4001/health
# {"status":"ok"}
```

## List items

```bash
curl "http://localhost:4001/api/v1/items"
```

```json
{
  "message": "Items fetched successfully",
  "data": [ { "id": 1, "name": "27-inch Monitor", "sku": "ELE-012", "itemType": "goods", ... } ],
  "pagination": { "total": 18, "page": 1, "pageSize": 10, "totalPages": 2 }
}
```

## Search by name/SKU

```bash
curl "http://localhost:4001/api/v1/items?search=chair"
curl "http://localhost:4001/api/v1/items?search=ELE-01"
```

## Filter by status

```bash
curl "http://localhost:4001/api/v1/items?status=active"
curl "http://localhost:4001/api/v1/items?status=inactive"
```

## Combine filters + pagination

```bash
curl "http://localhost:4001/api/v1/items?search=e&status=active&page=2&pageSize=5"
```

## Create an item

```bash
curl -X POST http://localhost:4001/api/v1/items \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Widget","sku":"TW-001","itemType":"goods","hsnCode":"1234"}'
```

```json
{ "message": "Item created successfully", "data": { "id": 19, "name": "Test Widget", ... } }
```

Try it twice with the same name — the second call should return a `409` with `"An item named \"Test Widget\" already exists"`, thanks to the `@@unique([name])` constraint and the duplicate-key handling in `ItemService.create`.

## Validation errors

```bash
curl "http://localhost:4001/api/v1/items?status=bogus"
```

Returns a `400` with a `VALIDATION_ERROR` code and details about which field failed — this comes from `listItemsQuerySchema` rejecting `"bogus"` (only `"active"`/`"inactive"` are allowed) and `errorHandler` catching the `ZodError`.

Continue to [06-frontend-setup.md](./06-frontend-setup.md).
