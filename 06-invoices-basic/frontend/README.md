# 06 Invoices Basic - Frontend

Vite + React + TypeScript + Tailwind + Redux frontend for invoice management learning module.

## Setup

```bash
npm install
npm run dev
```

The dev server runs on http://localhost:5173 and proxies `/api` requests to `http://localhost:3001` (the backend).

## Project Structure

```
src/
├── main.tsx               # React entry point
├── App.tsx                # Router and main layout
├── index.css              # Tailwind CSS imports
├── types/                 # TypeScript type definitions
├── services/              # API client services
├── store/                 # Redux store, slices, selectors
├── hooks/                 # Custom React hooks
├── components/            # Reusable UI components
│   ├── CustomerAutocomplete.tsx
│   ├── ItemAutocomplete.tsx
│   ├── InvoiceLineFields.tsx
│   ├── InvoiceForm.tsx
│   └── InvoiceList.tsx
└── pages/                 # Page components (routes)
    ├── InvoiceListPage.tsx
    ├── InvoiceFormPage.tsx
    └── InvoiceDetailPage.tsx
```

## Pages & Routes

- `/invoices` - List all invoices
- `/invoices/create` - Create a new invoice
- `/invoices/:publicId` - View invoice details
- `/invoices/:publicId/edit` - Edit draft invoice

## Key Patterns

### Redux State Management
Uses Redux Toolkit for invoice state, async thunks for API calls, and selectors for component access.

### React Hook Form + Zod
Forms are validated with Zod schemas and managed by React Hook Form with TypeScript type safety.

### useFieldArray for Dynamic Lines
Invoice lines are dynamic using `useFieldArray` from React Hook Form. Add/remove rows interactively.

### Client-Side Calculations
`useInvoiceCalculations` hook calculates line and invoice totals in real-time for preview.

### Autocomplete Components
`CustomerAutocomplete` and `ItemAutocomplete` components search the backend API and populate form fields.

### API Service Classes
`InvoiceApiService` and `SearchApiService` provide typed wrappers around fetch calls.

## Building & Deployment

```bash
# Development
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint
npm run lint
```

## Learning Concepts

1. **React Router** - Multi-page application with client-side routing
2. **Redux Toolkit** - State management with async thunks
3. **React Hook Form** - Form state and validation with Zod
4. **useFieldArray** - Dynamic form arrays for invoice lines
5. **Autocomplete** - Real-time search with API integration
6. **TypeScript** - Strict typing throughout (no `any`)
7. **Tailwind CSS** - Utility-first styling
8. **Client-Side Calculations** - Real-time totals preview
9. **API Integration** - Typed fetch wrapper for clean API calls
10. **Component Composition** - Splitting UI into reusable pieces

## Troubleshooting

### Backend Not Found
Make sure the backend is running on http://localhost:3001 and the proxy in `vite.config.ts` is configured correctly.

### Import Errors
Ensure all files have `.ts` or `.tsx` extensions and imports match the file names exactly.

### Redux Not Working
Check that `<Provider store={store}>` wraps the app in `main.tsx`.

### Form Validation Not Working
Verify Zod schema matches form field names and types in `InvoiceForm.tsx`.
