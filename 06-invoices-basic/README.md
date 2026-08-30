# 06 Invoices Basic - Learning Module

Complete invoice management learning module: backend (Express + Prisma + Zod + DI), frontend (React + Redux + React Hook Form), and 12 comprehensive documentation files.

## 🎯 What You'll Learn

This module teaches invoice creation, line items, customer selection, autocomplete, status transitions, print/PDF, and the full-stack flow from UI to database and back.

After completing this module, you'll understand:
- ✅ Invoice business logic (customers, items, totals, tax, status)
- ✅ Dependency Injection and service contracts
- ✅ React Hook Form with `useFieldArray` for dynamic forms
- ✅ Redux state management with async thunks
- ✅ Backend service layer, repository pattern, Prisma relations
- ✅ Real-time form calculations without API calls
- ✅ Autocomplete with backend search
- ✅ How production code differs from learning code

## 📁 Structure

```
06-invoices-basic/
├── backend/                 # Express + Prisma + Zod + DI backend
│   ├── src/
│   │   ├── server.ts
│   │   ├── controllers/     # HTTP request handlers
│   │   ├── services/        # Business logic
│   │   ├── repositories/    # Data access
│   │   ├── di/              # DI container & contracts
│   │   ├── routes/
│   │   ├── schemas/         # Zod validation
│   │   ├── types/           # TypeScript types
│   │   └── utils/           # Utilities (calculator)
│   ├── prisma/              # Prisma schema & seed
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
├── frontend/                # Vite + React + Redux frontend
│   ├── src/
│   │   ├── main.tsx         # Entry point
│   │   ├── App.tsx          # Router
│   │   ├── pages/           # Page components
│   │   ├── components/      # Reusable UI components
│   │   ├── services/        # API clients
│   │   ├── store/           # Redux store & slices
│   │   ├── hooks/           # Custom hooks
│   │   ├── types/           # TypeScript types
│   │   └── index.css        # Tailwind CSS
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── package.json
│   └── README.md
└── docs/                    # 12 comprehensive learning guides
    ├── 01-overview.md           # What is an invoice
    ├── 02-data-model.md         # Tables and relationships
    ├── 03-invoice-number-and-status.md  # Invoice lifecycle
    ├── 04-backend-create-flow.md        # DI container walkthrough
    ├── 05-line-items-and-totals.md      # Calculation logic
    ├── 06-frontend-use-field-array.md   # Dynamic forms
    ├── 07-customer-and-item-autocomplete.md  # Search
    ├── 08-print-and-pdf.md              # Output generation
    ├── 09-contracts-di-and-typing.md    # Architecture
    ├── 10-contract-trace.md             # Follow one line through the system
    ├── 11-how-this-maps-to-production.md  # Connect to real code
    └── 12-exercises.md          # Practice problems (15 exercises)
```

## 🚀 Quick Start

### Backend

```bash
cd backend
npm install
cp .env.example .env
npx prisma migrate dev
npm run prisma:seed
npm run dev
```

Server runs on `http://localhost:3001`. Database is SQLite file-based.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173` with proxy to backend.

## 📖 Documentation

### For Learning

1. **Start:** [01-overview.md](docs/01-overview.md) - Understand what an invoice is
2. **Model:** [02-data-model.md](docs/02-data-model.md) - Database schema
3. **Lifecycle:** [03-invoice-number-and-status.md](docs/03-invoice-number-and-status.md) - Invoice states
4. **Backend Flow:** [04-backend-create-flow.md](docs/04-backend-create-flow.md) - Trace create request through DI
5. **Calculations:** [05-line-items-and-totals.md](docs/05-line-items-and-totals.md) - Tax & totals math
6. **Frontend Form:** [06-frontend-use-field-array.md](docs/06-frontend-use-field-array.md) - Dynamic form rows
7. **Autocomplete:** [07-customer-and-item-autocomplete.md](docs/07-customer-and-item-autocomplete.md) - Search integration
8. **Print/PDF:** [08-print-and-pdf.md](docs/08-print-and-pdf.md) - Export invoices
9. **Architecture:** [09-contracts-di-and-typing.md](docs/09-contracts-di-and-typing.md) - DI patterns
10. **Full Trace:** [10-contract-trace.md](docs/10-contract-trace.md) - Follow one line UI→DB→UI
11. **Production:** [11-how-this-maps-to-production.md](docs/11-how-this-maps-to-production.md) - Real code mapping
12. **Practice:** [12-exercises.md](docs/12-exercises.md) - 15 exercises from ⭐ to ⭐⭐⭐

### For Reference

- **Backend README:** [backend/README.md](backend/README.md) - Setup, structure, patterns
- **Frontend README:** [frontend/README.md](frontend/README.md) - Setup, structure, patterns

## 🎓 Key Concepts

### Backend Concepts

- **Dependency Injection (DI)**: Services depend on interfaces, not concrete classes
- **Service Contracts**: Interfaces define service boundaries (`IInvoiceService`, `IInvoiceRepository`)
- **Repository Pattern**: Data access layer separate from business logic
- **Zod Validation**: Schema-based runtime validation with TypeScript types
- **Prisma Relations**: Nested creates for invoice + lines atomicity
- **Decimal Precision**: Always use `Decimal` for currency, never `Float`
- **Invoice Number Generation**: Per-year sequence `INV-YYYY-NNNN`
- **Status Lifecycle**: DRAFT → SENT → PAID/CANCELLED

### Frontend Concepts

- **React Hook Form**: Form state with validation
- **`useFieldArray`**: Dynamic form arrays (add/remove lines)
- **Redux Toolkit**: State management with async thunks
- **Autocomplete**: Real-time search with debouncing
- **Client-Side Calculation**: `useInvoiceCalculations` hook for live totals
- **React Router**: Client-side routing
- **Tailwind CSS**: Utility-first styling

### Full-Stack Concepts

- **Type Safety**: End-to-end typing from frontend to database
- **Validation Layers**: Zod at route boundary, business logic in service
- **DTO Pattern**: Transform database records to API response objects
- **Transaction Safety**: Atomic invoice + lines creation
- **Separation of Concerns**: Clear boundaries between layers

## 🔗 API Endpoints

### Invoices

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/v1/invoices` | Create invoice |
| GET | `/api/v1/invoices` | List invoices (with pagination) |
| GET | `/api/v1/invoices/:publicId` | Get invoice details |
| PUT | `/api/v1/invoices/:publicId` | Update draft invoice |
| PATCH | `/api/v1/invoices/:publicId/status` | Change invoice status |

### Search/Autocomplete

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v1/customers/search?q=...` | Search customers |
| GET | `/api/v1/items/search?q=...` | Search items |

## 📝 Database

**Tables:**
- `customers` - Bill-to parties
- `items` - Product/service catalog
- `invoices` - Invoice headers (with denormalized totals)
- `invoice_lines` - Line items (with denormalized totals)

**Relations:**
```
Customer (1) ──── (many) Invoice
Invoice (1) ──── (many) InvoiceLine
Item (1) ──── (many) InvoiceLine
```

**Key Fields:**
- Invoice: `publicId` (UUID, frontend use), `invoiceNumber` (human-readable), `status` (enum)
- InvoiceLine: `quantity`, `rate`, `taxRate`, `lineSubtotal`, `lineTax`, `lineTotal`

## 🧪 Testing

### Manual Testing

1. Create invoice with multiple lines
2. Edit draft invoice
3. Change status (draft → sent → paid)
4. Search customers and items
5. View invoice details
6. Print/download as PDF

### Exercise Practice

See [12-exercises.md](docs/12-exercises.md) for 15 practice exercises ranging from UI tweaks to full-feature implementation.

## 🎯 Learning Outcomes

After working through this module, you should be able to:

- [ ] Explain invoice business logic and status lifecycle
- [ ] Navigate the backend DI container
- [ ] Understand repository pattern and data access
- [ ] Use React Hook Form with `useFieldArray` for dynamic forms
- [ ] Build autocomplete with API integration
- [ ] Calculate totals with tax (frontend + backend)
- [ ] Design form validation with Zod
- [ ] Implement Redux thunks for async operations
- [ ] Trace a request through the full stack
- [ ] Identify patterns that map to production code
- [ ] Complete 15 exercises across difficulty levels

## 🚦 Troubleshooting

### Backend won't start

```bash
# Check Node version
node --version  # Should be >= 25

# Regenerate Prisma client
npx prisma generate

# Check database
npx prisma studio

# Restart
npm run dev
```

### Frontend won't connect to backend

```bash
# Ensure backend is running on :3001
# Check vite.config.ts proxy configuration
# Check browser console for CORS errors
```

### Form validation failing

- Check Zod schema matches field names
- Verify form state with React DevTools Redux extension
- Check network tab for API request/response

## 📚 Further Learning

This module is part of a larger curriculum:

- **01-05**: Items, auth, customers (CRUD basics)
- **06** (you are here): Invoices (composite documents)
- **07** (future): Payments (financial integration)
- **08** (future): Accounting (journal posting)

## 💡 Design Philosophy

**Learning-focused:**
- Simplified code (no middleware cruft, no multi-tenancy)
- Clear patterns (DI, repository, service contracts)
- Comprehensive docs (12 files, 10000+ lines)
- Progressive exercises (15 levels, from UI to testing)

**Production-aware:**
- Same architecture used in production code
- Patterns map directly to real codebase
- Prepared for scaling (auth, org context, email)

## 📄 License

Learning module for BookKeepingApp project.

## 🤝 Contributing

To extend this module:

1. Add new feature (e.g., discounts)
2. Update relevant docs
3. Add exercise to 12-exercises.md
4. Test with both backend and frontend

**Before adding features:**
- Check if it's in production code
- Ensure docs are still accurate
- Keep code simple and readable
- Match existing patterns

---

**Start learning:** Read [01-overview.md](docs/01-overview.md) →  Run backend + frontend → Trace code → Complete exercises 🚀
