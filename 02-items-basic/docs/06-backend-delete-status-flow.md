# 06 - Backend Delete And Status Flow

Most business apps do not immediately delete master data. Items may already be connected to invoices, bills, inventory, audit trails, or reports.

This module teaches two ideas:

- primary flow: inactivate/reactivate with `PATCH /api/v1/items/:id/status`
- demo-only flow: hard delete with `DELETE /api/v1/items/:id`

## Inactivate or reactivate

The status endpoint accepts:

```json
{ "isActive": false }
```

or:

```json
{ "isActive": true }
```

The controller parses the id and body, the service checks the item exists, and the repository updates `isActive`.

Try it:

```bash
curl -X PATCH "http://localhost:4002/api/v1/items/1/status" \
  -H "Content-Type: application/json" \
  -d '{"isActive":false}'
```

Then filter inactive rows:

```bash
curl "http://localhost:4002/api/v1/items?status=inactive"
```

## Hard delete

The hard delete endpoint is included because this is a learning database with seed data:

```bash
curl -X DELETE "http://localhost:4002/api/v1/items/1"
```

In a production accounting or bookkeeping product, hard delete is usually restricted or avoided for master data.

## What to compare later

When you inspect the real BookingApp code, look for separate status actions and richer delete rules. The shape is similar, but production has more business context.

Continue to [07-frontend-form-design.md](./07-frontend-form-design.md).
