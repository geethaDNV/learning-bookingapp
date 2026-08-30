# README - 05 Customers Basic Learning Module

## Quick Start

This is a **fully functional learning module** for building customer management with TypeScript, React, Express, and Prisma.

### What You'll Learn

✅ Customer CRUD operations  
✅ Autocomplete search  
✅ React Hook Form + Zod validation  
✅ Redux with async thunks  
✅ Dependency Injection patterns  
✅ Typed interfaces & contracts  
✅ Repository → Service → Controller layers  

### Prerequisites

- Node.js >=25 <26
- PostgreSQL (or SQLite for local testing)
- Git

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with DATABASE_URL
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev  # Runs on http://localhost:3001
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev  # Runs on http://localhost:3000
```

### Available Routes

**Backend API**:
- `GET /api/v1/customers` - List customers (paged)
- `GET /api/v1/customers/:publicId` - Get customer detail
- `GET /api/v1/customers/autocomplete` - Autocomplete search
- `POST /api/v1/customers` - Create customer
- `PUT /api/v1/customers/:publicId` - Update customer
- `PATCH /api/v1/customers/:publicId/status` - Update status

**Frontend Pages**:
- `/customers` - Customer list
- `/customers/:publicId` - Customer detail
- `/customers/create` - Create new customer
- `/customers/:publicId/edit` - Edit customer

## Documentation

Read the 11 docs in order:

1. [01. Overview](docs/01-overview.md) - Why customers matter
2. [02. Customer Model & Seed](docs/02-customer-model-and-seed.md) - Database schema
3. [03. Backend CRUD](docs/03-backend-customer-crud.md) - Repository, Service, Controller
4. [04. Validation](docs/04-customer-validation.md) - Zod schemas
5. [05. Autocomplete API](docs/05-customer-autocomplete-api.md) - Server search
6. [06. Frontend Form](docs/06-frontend-customer-form.md) - React Hook Form
7. [07. Autocomplete UI](docs/07-customer-autocomplete-ui.md) - Component & debounce
8. [08. Contracts & DI](docs/08-contracts-di-and-typing.md) - Interfaces & typing
9. [09. Contract Trace](docs/09-contract-trace.md) - End-to-end flow
10. [10. Production Mapping](docs/10-how-this-maps-to-production.md) - Real code patterns
11. [11. Exercises](docs/11-exercises.md) - Practice tasks

## Project Structure

```
05-customers-basic/
├── backend/
│   ├── src/
│   │   ├── controllers/     # HTTP handlers
│   │   ├── services/        # Business logic
│   │   ├── repositories/    # Data access
│   │   ├── types/           # Interfaces
│   │   ├── schemas/         # Zod validation
│   │   ├── di/              # Dependency injection
│   │   ├── constants/       # Messages
│   │   ├── config/          # Environment config
│   │   └── server.ts        # Express app
│   ├── prisma/
│   │   ├── schema.prisma    # Database schema
│   │   └── seed.ts          # Sample data
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── pages/           # Route components
│   │   ├── components/      # Reusable components
│   │   ├── services/        # API client
│   │   ├── store/           # Redux slice
│   │   ├── types/           # TypeScript models
│   │   ├── App.tsx          # Main app
│   │   └── main.tsx         # Entry point
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
└── docs/                    # 11 documentation files
```

## Key Concepts

### Layers

**Backend**:
```
Request → Controller → Service → Repository → Database
           (HTTP)      (Logic)   (Access)
```

**Frontend**:
```
Component → Redux Thunk → API Service → Backend
           (State)       (HTTP)
```

### Typing

- **Backend**: Zod schemas + TypeScript interfaces
- **Frontend**: TypeScript models + Redux typed selectors
- **Contract**: Types at boundary (publicId as UUID, not auto-inc)

### Validation

- **Format**: Zod (email format, string length)
- **Business**: Service layer (duplicate email/GSTIN)
- **Authorization**: Middleware (not in this module)

## Running Tests

```bash
# Backend type checking
cd backend
npm run typecheck

# Frontend type checking
cd frontend
npm run typecheck
```

## Production Patterns Not in This Module

This is a **learning module**, not production-ready. Production adds:

- Multi-tenancy (orgId filtering)
- Audit logging (who changed what when)
- Soft deletes (mark deleted_at, don't remove)
- Error observability (structured logging, tracing)
- Rate limiting (autocomplete API throttling)
- Permissions (role-based access control)
- Caching (Redis for hot data)
- Webhooks (notify on customer changes)

See [10. Production Mapping](docs/10-how-this-maps-to-production.md) for details.

## Next Steps

Once you complete this module:

1. Try the [11 exercises](docs/11-exercises.md) (GSTIN prefill, bulk operations, etc.)
2. Move to Module 06: Invoices Basic (uses customer autocomplete)
3. Explore the production BookKeepingApp code and compare patterns

## Troubleshooting

### Backend won't start

```bash
# Check database connection
echo $DATABASE_URL

# Generate Prisma client
npm run prisma:generate

# Create/migrate database
npm run prisma:migrate

# Run backend in dev mode
npm run dev
```

### Frontend won't connect to backend

```bash
# Check backend is running on http://localhost:3001
curl http://localhost:3001/health

# Frontend proxy is in vite.config.ts
# If different port, update vite.config.ts
```

### TypeScript errors

```bash
# Check tsconfig
npm run typecheck

# Fix path aliases in tsconfig.json if importing fails
```

## Getting Help

- Read the relevant doc (see list above)
- Check the production BookKeepingApp for real patterns
- Run the exercises to practice

---

**Start with**: [01. Overview](docs/01-overview.md)  
**Questions?**: See the specific doc for that layer (Controller? Service? Component?)
