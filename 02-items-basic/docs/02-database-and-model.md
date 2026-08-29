# 02 - Database And Model

## Create the database branch

Use a separate Neon branch for this module so it stays isolated from module 01 and the real app.

Suggested branch name: `02-items-basic`.

Copy that branch connection string into `backend/.env`:

```env
PORT=4002
DATABASE_URL="postgresql://<user>:<pass>@<neon-host>/<db>?sslmode=require"
```

## The Item model

Open [../backend/prisma/schema.prisma](../backend/prisma/schema.prisma).

The model is intentionally small:

```prisma
model Item {
  id        Int      @id @default(autoincrement())
  name      String   @db.VarChar(255)
  sku       String?  @db.VarChar(100)
  itemType  String   @map("item_type") @db.VarChar(20)
  hsnCode   String?  @map("hsn_code") @db.VarChar(20)
  sacCode   String?  @map("sac_code") @db.VarChar(20)
  isActive  Boolean  @default(true) @map("is_active")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
}
```

## HSN and SAC

HSN codes are usually used for goods. SAC codes are usually used for services. This module keeps both fields optional so the CRUD flow stays simple.

Later exercises can make the validation stricter:

- goods should usually have `hsnCode`
- services should usually have `sacCode`
- a single item should usually not need both

## Indexes

The schema indexes fields used by list filters:

- `name`
- `sku`
- `itemType`
- `hsnCode`
- `sacCode`
- `isActive`

That connects the database design to the repository filter code you will read next.

## Seed data

Open [../backend/prisma/seed.ts](../backend/prisma/seed.ts).

The seed file creates goods and services with different HSN/SAC values, active states, names, and SKUs. This gives you predictable data for testing list filters and CRUD actions.

Run:

```bash
cd backend
npx prisma migrate dev --name init
npx prisma db seed
```

Optional database browser:

```bash
npx prisma studio
```

Continue to [03-backend-read-flow.md](./03-backend-read-flow.md).
