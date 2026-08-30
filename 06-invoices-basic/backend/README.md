# 06 Invoices Basic - Backend

Express + Prisma + Zod + TypeScript backend for invoice management learning module.

## Setup

```bash
npm install
cp .env.example .env
npx prisma migrate dev
npm run prisma:seed
npm run dev
```

## Project Structure

```
src/
├── server.ts              # Express entry point
├── types/                 # TypeScript types and DTOs
├── schemas/               # Zod validation schemas
├── di/
│   ├── contracts.ts      # Service interfaces (DI contracts)
│   └── container.ts      # DI container and cradle setup
├── services/              # Business logic
│   ├── InvoiceService.ts
│   └── InvoiceNumberService.ts
├── repositories/          # Data access layer
│   ├── InvoiceRepository.ts
│   └── LookupRepositories.ts (Customer, Item)
├── controllers/           # HTTP request handlers
│   ├── InvoiceController.ts
│   └── SearchController.ts
├── routes/                # Express route definitions
└── utils/                 # Utilities
    └── InvoiceCalculator.ts
```

## API Endpoints

### Invoices
- `POST /api/v1/invoices` - Create invoice
- `GET /api/v1/invoices` - List invoices with filters
- `GET /api/v1/invoices/:publicId` - Get invoice details
- `PUT /api/v1/invoices/:publicId` - Update draft invoice
- `PATCH /api/v1/invoices/:publicId/status` - Change status

### Autocomplete/Search
- `GET /api/v1/customers/search?q=...` - Search customers
- `GET /api/v1/items/search?q=...` - Search items

## Database

- **Driver**: SQLite (file-based for development)
- **Schema**: `prisma/schema.prisma`
- **Seed**: `prisma/seed.ts`

Models:
- `Customer` - Invoice recipients
- `Item` - Line item catalog (with pricing and tax)
- `Invoice` - Invoice header
- `InvoiceLine` - Line items within invoices

## Key Patterns

### Dependency Injection (DI)
Services are bound via contracts (interfaces) defined in `di/contracts.ts`. The `Cradle` in `di/container.ts` wires all dependencies. This allows mocking and testing.

### Validation & Schemas
All request bodies are validated with Zod schemas in `schemas/index.ts` before reaching controllers.

### Calculation
`InvoiceCalculator` handles all math (line totals, tax, invoice totals). Separated from business logic for testability.

### Invoice Number Generation
`InvoiceNumberService` generates unique numbers in format `INV-YYYY-NNNN`.

### Decimal Precision
Prisma's `Decimal` type ensures database stores currency values precisely (no floating-point errors).

## Running

```bash
# Development
npm run dev

# Build
npm run build

# Start production
npm start

# Prisma commands
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run prisma:studio
```

## Testing the API

### Create an Invoice
```bash
curl -X POST http://localhost:3001/api/v1/invoices \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": 1,
    "dueDate": "2025-02-28",
    "notes": "Thank you for your business",
    "lines": [
      { "itemId": 1, "quantity": 2, "rate": 150 },
      { "itemId": 2, "quantity": 1, "rate": 200 }
    ]
  }'
```

### List Invoices
```bash
curl http://localhost:3001/api/v1/invoices
```

### Get Invoice Detail
```bash
curl http://localhost:3001/api/v1/invoices/{publicId}
```

### Search Customers
```bash
curl "http://localhost:3001/api/v1/customers/search?q=ACME"
```

### Search Items
```bash
curl "http://localhost:3001/api/v1/items/search?q=Consulting"
```

## Learning Concepts

1. **Dependency Injection** - How to structure services for testability
2. **Repository Pattern** - Data access separated from business logic
3. **Validation Layer** - Zod schemas at the route boundary
4. **Calculation Separation** - Math logic extracted to dedicated service
5. **Decimal Precision** - Handling currency without floating-point errors
6. **Transaction** - Prisma transactions for invoice + line creation
7. **Status Lifecycle** - Invoice state transitions
8. **Nested Relations** - Creating parent + child records in one operation
