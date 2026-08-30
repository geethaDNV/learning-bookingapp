# 12 - How This Maps to Production

## This Learning Module vs. Production

| Layer | Learning Module | Production |
|-------|-----------------|------------|
| **Email Provider** | Mock (dev) or Resend | Resend or SendGrid or AWS SES |
| **Database** | In-memory | PostgreSQL + Prisma |
| **Invoice Repository** | InMemoryInvoiceRepository | PrismaInvoiceRepository |
| **PDF Generation** | Client-side html2pdf.js | Server-side (Puppeteer/pdfkit) |
| **Attachment Handling** | Base64 string | Buffer / file stream |
| **Invoice Data** | Hard-coded sample data | Loaded from database |
| **Authentication** | None (learning) | JWT / OAuth |
| **Authorization** | None (learning) | User owns invoice check |
| **Logging** | console.log() | Structured logs (Winston) |
| **Error Tracking** | Console errors | Sentry / Datadog |
| **Rate Limiting** | None | Redis-based rate limiter |
| **Email Queue** | Synchronous | Async queue (Bull/RabbitMQ) |

## Reference: BookKeepingApp Production

### Email Service Location
**Learning:** `09-invoice-email-pdf/backend/src/services/`
**Production:** [`BookKeepingApp/backend/services/email/`](../../../BookKeepingApp/backend/services/email)

### Email Constants
**Learning:** `backend/src/constants/index.ts`
**Production:** [`BookKeepingApp/backend/constants/email/`](../../../BookKeepingApp/backend/constants/email)

### Invoice Service
**Learning:** `backend/src/services/invoiceEmailService.ts`
**Production:** [`BookKeepingApp/backend/services/invoices/invoiceService.ts`](../../../BookKeepingApp/backend/services/invoices/invoiceService.ts)

### Frontend Invoice Features
**Learning:** `frontend/src/components/SendEmailDialog.tsx`
**Production:** [`BookKeepingApp/frontend/src/features/invoices/`](../../../BookKeepingApp/frontend/src/features/invoices)

### Print/PDF Utilities
**Learning:** (would create) `frontend/src/utils/pdfGenerator.ts`
**Production:** [`BookKeepingApp/frontend/src/components/print/printUtils.ts`](../../../BookKeepingApp/frontend/src/components/print/printUtils.ts)

## Scaling From Learning to Production

### Phase 1: Learning Module (This)

**What you get:**
- ✓ Full end-to-end workflow
- ✓ Type-safe contracts
- ✓ DI pattern understanding
- ✓ Frontend + backend integration
- ✓ Error handling strategies
- ✓ Mock provider for dev

**Limitations:**
- ✗ No real database (in-memory only)
- ✗ No persistence
- ✗ No auth/authz
- ✗ No logging/monitoring
- ✗ No queue/async
- ✗ Not scalable

### Phase 2: Add Persistence

**Steps:**
1. Replace `InMemoryInvoiceRepository` with `PrismaInvoiceRepository`
   ```typescript
   export class PrismaInvoiceRepository implements IInvoiceRepository {
     async findById(id: string): Promise<Invoice | null> {
       return prisma.invoice.findUnique({ where: { id } });
     }
   }
   ```

2. Create Prisma schema:
   ```prisma
   model Invoice {
     id        String   @id @default(cuid())
     number    String   @unique
     customerId String
     amount    Decimal
     dueDate   DateTime
     status    String
     createdAt DateTime @default(now())
     customer  Customer @relation(fields: [customerId], references: [id])
   }
   ```

3. Update DI container:
   ```typescript
   this.invoiceRepository = new PrismaInvoiceRepository();
   ```

### Phase 3: Add Authentication

**Steps:**
1. Add JWT middleware:
   ```typescript
   import jwt from 'jsonwebtoken';
   
   const authMiddleware = (req, res, next) => {
     const token = req.headers.authorization?.split(' ')[1];
     if (!token) return res.status(401).json({ error: 'No token' });
     
     const decoded = jwt.verify(token, process.env.JWT_SECRET);
     req.user = decoded;
     next();
   };
   ```

2. Protect routes:
   ```typescript
   router.post('/:invoiceId/send-email', authMiddleware, (req, res, next) => {
     controller.sendInvoiceEmail(req, res, next);
   });
   ```

3. Check ownership:
   ```typescript
   const invoice = await this.invoiceRepository.findById(invoiceId);
   if (invoice.organizationId !== req.user.organizationId) {
     throw new UnauthorizedError('Cannot send invoice for another org');
   }
   ```

### Phase 4: Add Logging & Monitoring

**Steps:**
1. Replace console.log with structured logger:
   ```typescript
   import winston from 'winston';
   
   const logger = winston.createLogger({
     format: winston.format.json(),
     transports: [
       new winston.transports.File({ filename: 'error.log', level: 'error' }),
       new winston.transports.File({ filename: 'combined.log' }),
     ],
   });
   ```

2. Log key events:
   ```typescript
   logger.info('Email sent', {
     invoiceId,
     recipient: input.to,
     provider: result.provider,
     messageId: result.messageId,
   });
   ```

3. Add error tracking:
   ```typescript
   import * as Sentry from '@sentry/node';
   
   try {
     await service.sendInvoiceEmail(input);
   } catch (error) {
     Sentry.captureException(error);
     throw error;
   }
   ```

### Phase 5: Add Async Queue

**Why:** Email sending should be async. User shouldn't wait for Resend API.

**Steps:**
1. Add Bull queue:
   ```typescript
   import Queue from 'bull';
   
   const emailQueue = new Queue('invoice-email', process.env.REDIS_URL);
   
   emailQueue.process(async (job) => {
     const { invoiceId, payload } = job.data;
     return await emailService.sendInvoiceEmail(payload);
   });
   ```

2. Enqueue instead of sending directly:
   ```typescript
   // Old (blocking):
   const result = await emailService.sendInvoiceEmail(payload);
   res.json({ success: true, messageId: result.messageId });
   
   // New (async):
   await emailQueue.add({ invoiceId, payload });
   res.json({ 
     success: true, 
     message: 'Email queued for delivery' 
   });
   ```

3. Handle failures:
   ```typescript
   emailQueue.on('failed', (job, error) => {
     logger.error('Email send failed', { jobId: job.id, error });
     // Retry, notify admin, etc.
   });
   ```

### Phase 6: Add Rate Limiting

**Why:** Prevent abuse/spam

```typescript
import rateLimit from 'express-rate-limit';

const emailLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 minute
  max: 10,              // 10 emails per minute per user
  keyGenerator: (req) => req.user.id,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many email requests. Please try again later.',
    });
  },
});

router.post('/:invoiceId/send-email', emailLimiter, (req, res, next) => {
  controller.sendInvoiceEmail(req, res, next);
});
```

## Contract Migration Path

The key insight: **Contracts stay the same, implementations change.**

```typescript
// Learning
interface IEmailService { ... }
  ├─ MockEmailService
  └─ ResendEmailService

// Production adds:
interface IEmailService { ... }
  ├─ MockEmailService (kept for testing)
  ├─ ResendEmailService
  ├─ SendGridEmailService
  └─ AWSEmailService

// Interface never changes (Liskov substitution principle)
// Just swap implementation in DI container
```

## Testing in Production Environment

```typescript
// Use Mock in test environment
if (process.env.NODE_ENV === 'test') {
  emailService = new MockEmailService();
}

// Or inject test double
const mockService = new MockEmailService();
const service = new InvoiceEmailService(mockService, ...);
await service.sendInvoiceEmail({...});
expect(mockService.getSentEmails()).toHaveLength(1);
```

## Performance Considerations

### Learning (This Module)
- Single-threaded
- In-memory data
- Synchronous email
- No caching
- OK for: Learning, small scale

### Production (BookKeepingApp)
- Multi-worker processes
- Database queries
- Async queue workers
- Redis caching
- Load balancing
- Suitable for: Thousands of users, millions of emails

## Security Hardening for Production

1. **Input validation** - already have Zod
2. **Rate limiting** - add express-rate-limit
3. **CORS** - configure properly (not `*`)
4. **Auth** - JWT + signatures
5. **Secrets** - environment variables (.env.vault)
6. **HTTPS** - enforce TLS
7. **Audit log** - log all email sends
8. **Compliance** - GDPR/CCPA privacy (unsubscribe links)

## Key Takeaway

**This learning module is the foundation.** It teaches:
- ✓ Contracts and DI
- ✓ Type-safe end-to-end flows
- ✓ Error handling
- ✓ Frontend-backend integration

**To scale to production, layer on:**
- ✓ Database + Prisma
- ✓ Authentication/Authorization
- ✓ Async queues
- ✓ Logging/Monitoring
- ✓ Rate limiting
- ✓ Security hardening

**The architecture doesn't change. Only implementations.**

## Next Steps

1. Read **13-exercises.md** to practice extending the module
2. Study the production code in `BookKeepingApp/backend/services/email/`
3. Plan migration: which phase would you implement next?
4. Refactor learning module to use Prisma repositories (exercise!)
