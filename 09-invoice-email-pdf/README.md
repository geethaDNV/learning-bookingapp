# 09 - Invoice Email & PDF Module

A comprehensive learning module for building a **production-ready invoice email workflow** with TypeScript, React, Express, and Prisma.

## 🎯 What You'll Learn

- **Invoice delivery as a business workflow** (not generic email)
- **Dependency Injection & contracts** for flexible service architecture
- **Type-safe end-to-end flows** with TypeScript + Zod
- **Email provider abstraction** (Mock for dev, Resend for prod)
- **Client-side PDF generation** and email attachments
- **Recipient validation** and error handling
- **Frontend-backend integration** with React Hook Form
- **Testing strategies** with mock implementations

## 📁 Project Structure

```
09-invoice-email-pdf/
├── backend/                    # Express + TypeScript
│   ├── src/
│   │   ├── config/            # Configuration
│   │   ├── constants/         # Email templates & messages
│   │   ├── types/             # TypeScript interfaces (contracts)
│   │   ├── services/          # Business logic
│   │   │   ├── mockEmailService.ts      # Mock provider (dev)
│   │   │   ├── resendEmailService.ts    # Resend provider (prod)
│   │   │   ├── invoiceEmailService.ts   # Orchestrator
│   │   │   └── repositories/   # Data access
│   │   ├── controllers/       # HTTP handlers
│   │   ├── routes/            # API routes
│   │   ├── middleware/        # Error handling
│   │   ├── di/                # Dependency Injection
│   │   └── server.ts          # Express app
│   ├── package.json
│   └── README.md
│
├── frontend/                   # React + Vite
│   ├── src/
│   │   ├── components/        # React components
│   │   │   └── SendEmailDialog.tsx
│   │   ├── services/          # API client
│   │   │   └── invoiceEmailApi.ts
│   │   ├── types/             # TypeScript types
│   │   ├── utils/             # Helpers & validation
│   │   ├── App.tsx            # Main app
│   │   └── main.tsx           # Entry point
│   ├── index.html
│   ├── package.json
│   └── README.md
│
└── docs/                       # Comprehensive documentation
    ├── 01-overview.md         # Invoice workflow
    ├── 02-email-provider-contract.md
    ├── 03-send-invoice-email-api.md
    ├── 04-recipient-validation.md
    ├── 05-email-template-and-payment-link.md
    ├── 06-print-and-client-pdf.md
    ├── 07-pdf-attachment-options.md
    ├── 08-frontend-send-email-dialog.md
    ├── 09-error-handling.md
    ├── 10-contracts-di-and-typing.md
    ├── 11-contract-trace.md
    ├── 12-how-this-maps-to-production.md
    └── 13-exercises.md
```

## 🚀 Quick Start

### Backend

```bash
cd backend

# Install dependencies
npm install

# Set up environment
cp .env.example .env

# Development server (watches for changes)
npm run dev

# Build for production
npm run build

# Type check
npm run lint
```

**Server will start at:** `http://localhost:4000`  
**Health check:** `http://localhost:4000/health`  
**API docs:** `http://localhost:4000/api/v1`

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Set up environment
cp .env.example .env

# Development server
npm run dev

# Build for production
npm run build

# Type check
npm run lint
```

**App will start at:** `http://localhost:5173`

## 📚 Documentation

Start with the docs in this order:

1. **[01-overview.md](docs/01-overview.md)** - Understand invoice email workflow
2. **[02-email-provider-contract.md](docs/02-email-provider-contract.md)** - Learn about Mock vs Resend
3. **[03-send-invoice-email-api.md](docs/03-send-invoice-email-api.md)** - API contract & examples
4. **[04-recipient-validation.md](docs/04-recipient-validation.md)** - Email validation strategies
5. **[05-email-template-and-payment-link.md](docs/05-email-template-and-payment-link.md)** - Template design
6. **[06-print-and-client-pdf.md](docs/06-print-and-client-pdf.md)** - PDF generation
7. **[07-pdf-attachment-options.md](docs/07-pdf-attachment-options.md)** - Attachment strategies
8. **[08-frontend-send-email-dialog.md](docs/08-frontend-send-email-dialog.md)** - React component walkthrough
9. **[09-error-handling.md](docs/09-error-handling.md)** - Error patterns
10. **[10-contracts-di-and-typing.md](docs/10-contracts-di-and-typing.md)** - Architecture
11. **[11-contract-trace.md](docs/11-contract-trace.md)** - Follow a request end-to-end
12. **[12-how-this-maps-to-production.md](docs/12-how-this-maps-to-production.md)** - Scaling up
13. **[13-exercises.md](docs/13-exercises.md)** - Practice problems

## 🛠 Key Technologies

### Backend
- **Express.js** - HTTP server
- **TypeScript** - Type safety
- **Zod** - Runtime validation
- **Resend** - Email provider
- **In-memory storage** - For learning (replace with Prisma in prod)

### Frontend
- **React** - UI library
- **TypeScript** - Type safety
- **React Hook Form** - Form state
- **Zod** - Validation
- **Axios** - HTTP client
- **Vite** - Build tool
- **html2pdf.js** - PDF generation

## 📋 API Endpoints

### Send Invoice Email
```
POST /api/v1/invoices/{invoiceId}/send-email
```

**Request:**
```json
{
  "to": "customer@example.com",
  "cc": ["cc@example.com"],
  "bcc": ["bcc@example.com"],
  "subject": "Invoice INV-2024-001",
  "body": "<h2>Invoice</h2><p>Thank you...</p>",
  "attachPdf": true,
  "paymentLink": "https://pay.razorpay.com/i/ABC123"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Email sent successfully",
  "messageId": "msg_1234567890",
  "provider": "mock",
  "timestamp": "2024-08-30T12:34:56.789Z"
}
```

### Preview Invoice Email
```
GET /api/v1/invoices/{invoiceId}/preview-email?to=customer@example.com
```

**Response:**
```json
{
  "subject": "Invoice INV-2024-001",
  "body": "<html>...</html>",
  "bodyHtml": "<html>...</html>",
  "recipientEmail": "customer@example.com",
  "timestamp": "2024-08-30T12:34:56.789Z"
}
```

## 🔧 Configuration

### Backend (.env)
```bash
# Email provider (mock for development, resend for production)
EMAIL_PROVIDER=mock
# EMAIL_PROVIDER=resend

# Only needed if using Resend
# RESEND_API_KEY=re_your_api_key_here

# Email sender address
EMAIL_FROM=noreply@invoicedemo.local

# Server configuration
PORT=4000
NODE_ENV=development
```

### Frontend (.env)
```bash
# Backend API URL
VITE_API_URL=http://localhost:4000

# App name
VITE_APP_NAME=Invoice Email PDF Learning Module
```

## 🧪 Sample Data

The module comes with in-memory sample data:

**Invoices:**
- `inv-001` → INV-2024-001, ₹10,000, Acme Corp
- `inv-002` → INV-2024-002, ₹25,000, TechStart Inc

**Customers:**
- `cust-001` → Acme Corp (billing@acme.com)
- `cust-002` → TechStart Inc (accounts@techstart.com)

Test by sending to these customers!

## 📈 Architecture Highlights

### 1. Dependency Injection
Every service declares its dependencies. The DI container wires them together.

```typescript
// Easy to swap implementations
const emailService: IEmailService = config.provider === 'resend'
  ? new ResendEmailService(apiKey)
  : new MockEmailService();
```

### 2. Type Safety
- **TypeScript interfaces** define contracts
- **Zod schemas** validate at runtime
- **No `any` types** in feature code

### 3. Error Handling
- Custom error types (ValidationError, NotFoundError, AppError)
- Consistent error responses
- User-friendly messages

### 4. Frontend Integration
- React Hook Form for state management
- Zod for client-side validation
- Axios interceptors for logging
- Loading/error states

## 🚨 Common Issues

### Issue: Backend not starting
**Solution:** Check port 4000 is available
```bash
npm run dev  # Should see "listening on port 4000"
```

### Issue: Frontend can't connect to backend
**Solution:** Check VITE_API_URL in frontend/.env
```bash
VITE_API_URL=http://localhost:4000
```

### Issue: Resend domain error
**Solution:** Use mock provider for development
```bash
EMAIL_PROVIDER=mock
```

### Issue: PDF not generating
**Solution:** Check html2pdf.js is installed
```bash
npm install html2pdf.js
```

## 🎓 Learning Path

| Level | Topic | Time |
|-------|-------|------|
| **Beginner** | Overview + API | 1 hour |
| **Beginner** | Email validation | 30 min |
| **Beginner** | Frontend form | 1 hour |
| **Intermediate** | Contracts & DI | 1.5 hours |
| **Intermediate** | Error handling | 1 hour |
| **Advanced** | PDF generation | 1 hour |
| **Advanced** | Production patterns | 1 hour |

**Total:** ~7 hours of learning content

## 📝 Exercises

The module includes 10 hands-on exercises:

1. HTML email templates
2. Resend retry logic
3. Email audit log
4. Unsubscribe link
5. Multi-language email
6. Email + PDF combined
7. A/B testing email subject
8. Integration tests
9. Error recovery dashboard
10. Rate limiting

See [13-exercises.md](docs/13-exercises.md) for details.

## 🔗 Production References

This learning module references production patterns from:
- **Email service:** `BookKeepingApp/backend/services/email/`
- **Email constants:** `BookKeepingApp/backend/constants/email/`
- **Invoice service:** `BookKeepingApp/backend/services/invoices/`
- **Frontend features:** `BookKeepingApp/frontend/src/features/invoices/`
- **Print utilities:** `BookKeepingApp/frontend/src/components/print/`

Use these as reference for real-world implementations.

## ✅ Validation Checklist

Before considering the module complete:

- [ ] Backend starts with `npm run dev`
- [ ] Frontend starts with `npm run dev`
- [ ] Can send email with mock provider
- [ ] Form validation works
- [ ] Email preview works
- [ ] PDF can be generated/downloaded
- [ ] Error messages display correctly
- [ ] Type checking passes (`npm run lint`)
- [ ] Documentation is clear
- [ ] At least one exercise completed

## 🎯 Next Steps

1. **Start:** Read [01-overview.md](docs/01-overview.md)
2. **Run:** Start backend + frontend
3. **Test:** Send a test email
4. **Learn:** Read remaining docs in order
5. **Practice:** Complete exercises
6. **Extend:** Implement your own features
7. **Compare:** Study BookKeepingApp production code

## 📞 Support

If stuck:
1. Check the documentation files (docs/)
2. Review error messages carefully
3. Check console logs (frontend DevTools + backend terminal)
4. Review code comments (especially in services/)
5. Look at exercise examples

## 📄 License

This learning module is part of the BookKeepingApp project.

---

**Happy learning!** 🚀

Next: [Start with 01-overview.md](docs/01-overview.md)
