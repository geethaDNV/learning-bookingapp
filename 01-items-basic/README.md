# 01 — Items Basic

A self-contained learning module: list + search(name/sku) + filter(status) for a trimmed-down Items feature, built with the same layered backend and Redux/react-table frontend patterns as the real `bookingapp`.

## Start here

Read the docs in order: [docs/01-overview.md](./docs/01-overview.md) → [docs/10-how-this-maps-to-the-real-app.md](./docs/10-how-this-maps-to-the-real-app.md).

## Quick start

**Backend**
```bash
cd backend
cp .env.example .env   # fill in your Neon DATABASE_URL
npm install
npx prisma migrate dev --name init
npx prisma db seed
npm run dev             # http://localhost:4001
```

**Frontend**
```bash
cd frontend
cp .env.example .env
npm install
npm run dev              # http://localhost:5174
```

See [docs/02-database-and-prisma.md](./docs/02-database-and-prisma.md) for Neon setup details.
