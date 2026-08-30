# Frontend - Invoice Email PDF Module

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env

# Development server
npm run dev

# Build for production
npm run build

# Type checking
npm run lint
```

## Project Structure

- `src/components/` - React components (SendEmailDialog, etc.)
- `src/services/` - API client (invoiceEmailApi.ts)
- `src/types/` - TypeScript type definitions
- `src/utils/` - Validation schemas and helpers
- `src/pages/` - Page components

## Features

- **Send Email Dialog** - Fully typed form for composing invoice emails
- **Email Preview** - Preview email before sending
- **Recipient Management** - To, CC, BCC fields with validation
- **Customizable Content** - Edit subject and HTML body
- **API Integration** - Axios-based service for backend communication
- **Type-Safe** - Full TypeScript with Zod validation

## Development

The app connects to the backend API on `http://localhost:4000`. Make sure to start the backend:

```bash
cd ../backend
npm run dev
```

## Architecture

- **React Hook Form** - Form state management with validation
- **Zod** - Runtime type validation
- **Axios** - HTTP client
- **Vite** - Build tool and dev server
- **TypeScript** - Type safety

## See Also

- [Backend Module](../backend/)
- [Documentation](../docs/)
