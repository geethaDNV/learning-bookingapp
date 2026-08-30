# Learning Module 03: Items Form with React Hook Form + Zod

## Overview

This is the third learning module in the BookKeepingApp series. It teaches production-grade form architecture using **React Hook Form**, **Zod validation**, **strong TypeScript typing**, and **dependency injection patterns**.

After completing this module, you'll understand:

- Why production forms use schema validation instead of just `useState`
- How React Hook Form manages form state and validation
- How Zod schemas provide type safety from frontend to backend
- How to use dependency injection for loosely-coupled, testable code
- How to handle and display server-side validation errors in forms
- How to strongly type Redux thunks, selectors, and API services

## Key Concepts Introduced

### Frontend
- **React Hook Form**: Lightweight form state management
- **Zod**: Schema validation for forms and API payloads
- **zodResolver**: Bridge between React Hook Form and Zod schemas
- **Form defaults and reset**: Handling edit mode with async data loading
- **Server error display**: Showing API errors in the UI
- **Redux with typed hooks**: Managing form and list state

### Backend
- **Interface-based contracts**: `IItemRepository` and `IItemService`
- **Dependency injection**: Constructor-injected dependencies
- **Zod for request validation**: Type-safe request handling
- **Error handling**: Standardized error responses

## Project Structure

```
03-items-form-rhf-zod/
├── backend/
│   ├── src/
│   │   ├── controllers/      # HTTP request handlers
│   │   ├── services/         # Business logic (with interfaces)
│   │   ├── repositories/     # Data access (with interfaces)
│   │   ├── di/              # Dependency injection setup
│   │   ├── schemas/         # Zod validation schemas
│   │   ├── types/           # TypeScript interfaces
│   │   ├── errors/          # Custom error classes
│   │   ├── middleware/      # Express middleware
│   │   └── server.ts        # Express app entry point
│   ├── prisma/
│   │   ├── schema.prisma    # Database schema
│   │   └── seed.ts          # Sample data
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── features/items/
│   │   │   ├── components/  # Form, sections
│   │   │   ├── pages/       # Create, Edit, List
│   │   │   └── schemas/     # Form validation
│   │   ├── store/           # Redux slices and thunks
│   │   ├── services/        # API service
│   │   ├── hooks/           # Custom hooks
│   │   ├── types/           # API types
│   │   ├── App.tsx          # Router setup
│   │   └── main.tsx         # Entry point
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── tsconfig.json
│
└── docs/
    ├── 01-overview.md
    ├── 02-zod-form-schema.md
    ├── 03-react-hook-form-basics.md
    ├── 04-create-form-flow.md
    ├── 05-edit-form-flow.md
    ├── 06-backend-contracts-and-di.md
    ├── 07-frontend-typing.md
    ├── 08-contract-trace.md
    ├── 09-how-this-maps-to-production.md
    └── 10-exercises.md
```

## Quick Start

### Prerequisites
- Node.js 25.x
- PostgreSQL running locally or Neon database
- pnpm or npm

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Set up .env file
cp .env.example .env
# Edit .env with your database URL

# Set up Prisma
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed

# Start development server
npm run dev
```

Backend runs on `http://localhost:3000`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend runs on `http://localhost:5173`

## Learning Path

1. **Start with backend**
   - Read [01-overview.md](docs/01-overview.md)
   - Read [06-backend-contracts-and-di.md](docs/06-backend-contracts-and-di.md)
   - Review backend code structure

2. **Learn Zod schemas**
   - Read [02-zod-form-schema.md](docs/02-zod-form-schema.md)
   - Compare frontend and backend schemas

3. **Learn React Hook Form**
   - Read [03-react-hook-form-basics.md](docs/03-react-hook-form-basics.md)
   - Walk through ItemForm component

4. **Trace the create flow**
   - Read [04-create-form-flow.md](docs/04-create-form-flow.md)
   - Debug the create flow in your browser

5. **Trace the edit flow**
   - Read [05-edit-form-flow.md](docs/05-edit-form-flow.md)
   - Test edit functionality

6. **Frontend typing deep dive**
   - Read [07-frontend-typing.md](docs/07-frontend-typing.md)
   - Check types in Redux and services

7. **Type safety across boundaries**
   - Read [08-contract-trace.md](docs/08-contract-trace.md)
   - Follow a single field from form to database

8. **Map to production**
   - Read [09-how-this-maps-to-production.md](docs/09-how-this-maps-to-production.md)

9. **Extend it**
   - Work through [10-exercises.md](docs/10-exercises.md)

## Key Files to Study

- **Backend DI setup**: `backend/src/di/container.ts`
- **Backend interfaces**: `backend/src/repositories/IItemRepository.ts`, `backend/src/services/IItemService.ts`
- **Backend request validation**: `backend/src/schemas/itemSchemas.ts`
- **Frontend form schema**: `frontend/src/features/items/schemas/itemValidation.ts`
- **Frontend form component**: `frontend/src/features/items/components/ItemForm.tsx`
- **Redux thunks**: `frontend/src/store/itemThunks.ts`
- **API service**: `frontend/src/services/itemService.ts`

## Testing the Module

### Test Create Flow
1. Navigate to http://localhost:5173/items
2. Click "Create Item"
3. Leave name empty and tab away → should show validation error
4. Fill in name "Laptop", SKU "LAP-001", select "Goods" type
5. Click "Save Item"
6. Item should appear in list

### Test Duplicate Validation
1. Try creating another item with the same name or SKU
2. Server should return 409 error with DUPLICATE_NAME or DUPLICATE_SKU
3. Error should display in the form

### Test Edit Flow
1. Click "Edit" on an item
2. Form should load with values
3. Change the name
4. Click "Save Item"
5. Should redirect to list with updated item

## Architectural Decisions

### Why Interface-Based Repositories?
- Decouples business logic from database implementation
- Easy to mock for testing
- Can swap Prisma with another ORM without changing service layer

### Why Zod on Both Frontend and Backend?
- Frontend Zod catches errors before sending to server
- Backend Zod validates at API boundary
- Schemas can diverge (e.g., password on frontend, password hash on backend)

### Why React Hook Form?
- Lightweight (small bundle size)
- Minimal re-renders
- Great TypeScript support
- Built-in async validation support

### Why Redux?
- Predictable state management
- Middleware for logging/debugging
- Time-travel debugging with Redux DevTools
- Typed thunks for async operations

## Common Pitfalls and Solutions

### Pitfall 1: Form doesn't update when item loads in edit mode
**Solution**: Use `reset()` in a useEffect when item data arrives. See ItemEditPage.

### Pitfall 2: Server errors not showing in form
**Solution**: Use a separate `submitError` in Redux state and display it above form fields.

### Pitfall 3: Optional fields become empty strings instead of null
**Solution**: Use Zod `.transform()` to convert empty strings to null. See itemValidation.ts.

### Pitfall 4: Types don't align between frontend and backend
**Solution**: Use Zod's `z.infer<>` on both sides for types that matter. See ItemFormValues.

## Next Steps

After this module:
1. Study the production ItemForm in `BookKeepingApp/frontend/src/features/items/`
2. Look at how multiple form sections are composed
3. Study how tests are written for forms and Redux
4. Learn about file uploads and image handling
5. Implement role-based access control for items

## References

- [React Hook Form Docs](https://react-hook-form.com/)
- [Zod Docs](https://zod.dev)
- [@hookform/resolvers](https://github.com/react-hook-form/resolvers)
- [Redux Toolkit Docs](https://redux-toolkit.js.org/)
- [Express Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

## Questions?

Refer to the docs/ folder. Each document is self-contained and can be read independently.
