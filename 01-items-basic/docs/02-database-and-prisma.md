# 02 — Database and Prisma

## 1. Create a Neon project and a dedicated branch

1. Sign up at [neon.tech](https://neon.tech) and create a project (any region).
2. Neon lets you create isolated **branches** of your database — each branch has its own connection string but shares the project's compute. Create a branch named `01-items-basic` so this module never collides with other learning modules or your own experiments.
3. Open the branch's **Connection Details** and copy the connection string. It looks like:
   ```
   postgresql://<user>:<password>@<neon-host>/<database>?sslmode=require
   ```

## 2. Configure the backend

```bash
cd 01-items-basic/backend
cp .env.example .env
```

Paste your Neon connection string into `.env` as `DATABASE_URL`.

## 3. The `Item` model

Open [`prisma/schema.prisma`](../backend/prisma/schema.prisma):

```prisma
model Item {
  id        Int      @id @default(autoincrement())
  name      String   @db.VarChar(255)
  sku       String?  @db.VarChar(100)
  itemType  String   @map("item_type") @db.VarChar(20) // "goods" | "service"

  hsnCode   String?  @map("hsn_code") @db.VarChar(20)
  sacCode   String?  @map("sac_code") @db.VarChar(20)

  isActive  Boolean  @default(true) @map("is_active")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@unique([name])
  @@index([name])
  @@index([itemType])
  @@index([isActive])
  @@map("items")
}
```

Field-by-field:
- **`id`** — auto-incrementing primary key, simplest possible identifier for a learning project (production uses this *plus* a public UUID for external references — skipped here).
- **`name`** — required, unique per item (`@@unique([name])`) so two items can't share a name.
- **`sku`** — optional stock-keeping unit code, useful for goods but not services.
- **`itemType`** — a plain string (`"goods"` or `"service"`), validated at the application layer via Zod rather than a Prisma enum — same approach as production.
- **`hsnCode` / `sacCode`** — tax classification codes (HSN for goods, SAC for services) used in Indian GST invoicing. They're in the schema now, and the seed data includes them, but the search/filter API does **not** query them yet — see [04-backend-search-filtering.md](./04-backend-search-filtering.md) for why, and [09-exercises.md](./09-exercises.md) for the exercise that adds it.
- **`isActive`** — the "status" toggle the frontend filters by.
- **`@@index([...])`** — speeds up the exact lookups this module performs: filtering by name/sku (via search), by itemType, and by isActive.

## 4. Run the migration and seed data

```bash
npx prisma migrate dev --name init
npx prisma db seed
```

`migrate dev` creates the `items` table in your Neon branch from the schema above. `db seed` runs [`prisma/seed.ts`](../backend/prisma/seed.ts), which inserts ~18 sample items — a mix of goods/services, active/inactive, with varied names and SKUs so you have realistic data to search against.

## 5. Explore the data (optional)

```bash
npx prisma studio
```

Opens a browser UI at `http://localhost:5555` where you can view/edit rows directly — useful for confirming the seed worked and for spot-checking search results later.

Continue to [03-backend-architecture.md](./03-backend-architecture.md).
