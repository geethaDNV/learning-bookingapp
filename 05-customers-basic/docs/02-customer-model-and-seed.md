# 02. Customer Model and Seed Data

## Database Schema

The `Customer` model defines how customer data is persisted in PostgreSQL.

### Prisma Schema

```prisma
model Customer {
  id            Int       @id @default(autoincrement())
  publicId      String    @unique @default(uuid())
  displayName   String    @db.VarChar(255)
  email         String?   @db.VarChar(255)
  phone         String?   @db.VarChar(20)
  gstin         String?   @db.VarChar(15)
  billingAddress String?  @db.Text
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  createdBy     String?   @db.VarChar(100)
  updatedBy     String?   @db.VarChar(100)

  @@index([displayName])
  @@index([email])
  @@index([phone])
  @@index([gstin])
  @@index([isActive])
  @@map("customers")
}
```

## Field Explanations

| Field | Type | Nullable | Purpose |
|-------|------|----------|---------|
| `id` | Integer | No | Auto-increment primary key |
| `publicId` | UUID | No | External identifier (never expose `id` to frontend) |
| `displayName` | String | No | Customer name (appears in invoice header) |
| `email` | String | Yes | Contact email (invoice delivery, communication) |
| `phone` | String | Yes | Contact phone number |
| `gstin` | String | Yes | GST Registration Number (required for Indian businesses) |
| `billingAddress` | Text | Yes | Full billing address (printed on invoice) |
| `isActive` | Boolean | No | Soft-active flag (only active customers for new invoices) |
| `createdAt` | DateTime | No | Timestamp when created |
| `updatedAt` | DateTime | No | Auto-updated on changes |
| `createdBy` | String | Yes | User ID who created the record |
| `updatedBy` | String | Yes | User ID who last updated the record |

## Indexes for Performance

Indexes speed up searches when filtering by these fields:
- `displayName` – autocomplete and list searches by name
- `email` – find by email
- `phone` – find by phone
- `gstin` – find by GSTIN
- `isActive` – filter active/inactive

## Sample Seed Data

The `prisma/seed.ts` file populates the database with 10 realistic customers:

```typescript
[
  {
    displayName: "Acme Corporation",
    email: "contact@acme.com",
    phone: "+91-9876543210",
    gstin: "29AABCT1234H1Z5",
    billingAddress: "123 Business Street, Mumbai, Maharashtra 400001"
  },
  {
    displayName: "TechStart India Ltd",
    email: "info@techstart.com",
    phone: "+91-8765432109",
    gstin: "18AABCT5678H1Z0",
    billingAddress: "456 Innovation Park, Bangalore, Karnataka 560001"
  },
  // ... 8 more customers
]
```

## How to Initialize the Database

### Step 1: Copy `.env.example` → `.env`

```bash
cd backend
cp .env.example .env
```

Update `.env` with your database URL:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/customers_db?schema=public"
```

Or use SQLite for local testing:

```env
DATABASE_URL="file:./prisma/dev.db"
```

### Step 2: Generate Prisma Client

```bash
npm run prisma:generate
```

### Step 3: Run Migrations

```bash
npm run prisma:migrate
```

This creates the `customers` table.

### Step 4: Seed Sample Data

```bash
npm run prisma:seed
```

This inserts 10 sample customers.

### Step 5: Verify

```bash
npm run prisma:studio
```

Opens Prisma Studio (GUI) to view the data.

## Why These Fields?

### Required Fields
- **displayName**: Every customer must have a name (searchable, displayed)
- **id + publicId**: Security (never expose auto-increment IDs to frontend)

### Business Fields
- **email**: Used for invoice delivery, communication
- **gstin**: India-specific tax ID (required for GST invoices)
- **billingAddress**: Printed on invoices, required for B2B

### Soft Flags
- **isActive**: Logical soft-delete (no hard deletes in accounting)
- **createdAt/updatedAt**: Audit trail
- **createdBy/updatedBy**: Track who made changes

## GSTIN Format

GSTIN (Goods and Services Tax Identification Number) in India is a 15-character alphanumeric code:

```
29AABCT1234H1Z5
│││││││││││││││
│││││││││││││└─ Check digit
│││││││││││└─── Entity type (N/O/P etc.)
││││││││││└──── Jurisdiction code
│││││││││└───── Business category
││││││││└────── Status indicator
│││││││└─────── Registration category
││││││└──────── Checksum
│││││└───────── Fiscal year
│││└─────────── Serial number
└└└─────────── State code (first 2 digits)
```

Example: `29AABCT1234H1Z5` = State 29 (Maharashtra) + AABC (surname) + T1234H (name) + 1 (status) + Z5 (checksum).

## Relationships to Future Modules

In Module 06 (Invoices), the `Invoice` model will have:

```prisma
model Invoice {
  customerId    Int
  customer      Customer  @relation(fields: [customerId], references: [id])
  
  billingName   String    // Copied from customer.displayName at invoice time
  billingEmail  String    // Copied from customer.email
  gstin         String    // Copied from customer.gstin
  billingAddress String   // Copied from customer.billingAddress
}
```

The invoice **denormalizes** customer fields at creation time so that if a customer is updated, past invoices show the customer data as it was at invoice time.

---

**Previous**: [01. Overview](01-overview.md)  
**Next**: [03. Backend Customer CRUD](03-backend-customer-crud.md)
