# 13 - Exercises

## Exercise 1: HTML Email Templates

**Level:** Beginner  
**Time:** 30 minutes

**Goal:** Create a more sophisticated email template with inline CSS.

**Tasks:**

1. Create a new template in `backend/src/constants/index.ts`:
   ```typescript
   INVOICE_BODY_PREMIUM: (params: { ... }) => `
     <!-- Create an HTML email with:
          - Company logo (data URI)
          - Invoice items table
          - Tax calculation
          - Payment terms
          - Footer with company contact
     -->
   `
   ```

2. Add template selector in controller:
   ```typescript
   const body = data.templateName === 'premium'
     ? EMAIL_TEMPLATES.INVOICE_BODY_PREMIUM(...)
     : EMAIL_TEMPLATES.INVOICE_BODY_HTML(...);
   ```

3. Test in Resend or email client for rendering

**Learning:**
- Email template composition
- HTML/CSS best practices for email
- Testing email across clients

---

## Exercise 2: Resend Retry Logic

**Level:** Intermediate  
**Time:** 45 minutes

**Goal:** Implement automatic retry with exponential backoff for Resend errors.

**Tasks:**

1. Create `backend/src/utils/retryHandler.ts`:
   ```typescript
   export async function retryWithBackoff<T>(
     fn: () => Promise<T>,
     maxRetries: number = 3,
     initialDelayMs: number = 1000
   ): Promise<T> {
     for (let attempt = 0; attempt < maxRetries; attempt++) {
       try {
         return await fn();
       } catch (error) {
         if (attempt === maxRetries - 1) throw error;
         
         const delay = initialDelayMs * Math.pow(2, attempt);
         await new Promise(resolve => setTimeout(resolve, delay));
       }
     }
   }
   ```

2. Use in ResendEmailService:
   ```typescript
   async sendInvoiceEmail(input: SendInvoiceEmailInput): Promise<SendEmailResult> {
     return retryWithBackoff(
       () => this.resendClient.emails.send({...}),
       3,  // max retries
       1000  // 1s, 2s, 4s backoff
     );
   }
   ```

3. Add metric logging:
   ```typescript
   logger.info('Email retry', {
     attempt,
     delay,
     error: error.message,
   });
   ```

**Learning:**
- Error recovery patterns
- Exponential backoff strategy
- Logging transient failures

---

## Exercise 3: Email Audit Log

**Level:** Intermediate  
**Time:** 1 hour

**Goal:** Create an audit table to track all email send attempts.

**Tasks:**

1. Create Prisma schema:
   ```prisma
   model EmailAuditLog {
     id          String   @id @default(cuid())
     invoiceId   String
     recipient   String
     subject     String
     provider    String   // mock, resend
     messageId   String?
     success     Boolean
     errorMessage String?
     createdAt   DateTime @default(now())
   }
   ```

2. Create repository:
   ```typescript
   export class EmailAuditRepository {
     async log(data: {
       invoiceId: string;
       recipient: string;
       success: boolean;
       messageId?: string;
       error?: string;
     }): Promise<void> {
       await prisma.emailAuditLog.create({ data });
     }
   }
   ```

3. Log in controller:
   ```typescript
   await auditRepo.log({
     invoiceId,
     recipient: payload.to,
     success: result.success,
     messageId: result.messageId,
     error: result.error,
   });
   ```

4. Add query endpoint:
   ```typescript
   GET /api/v1/invoices/:invoiceId/email-history
   Response: [
     {
       recipient: "...",
       sent: "2024-08-30T...",
       success: true,
       provider: "mock"
     }
   ]
   ```

**Learning:**
- Audit logging patterns
- Database schema design
- Historical data tracking

---

## Exercise 4: Unsubscribe Link

**Level:** Intermediate  
**Time:** 30 minutes

**Goal:** Add unsubscribe link to email body.

**Tasks:**

1. Modify template to include unsubscribe:
   ```html
   <div style="text-align: center; margin-top: 40px;">
     <a href="{{UNSUBSCRIBE_URL}}">Unsubscribe from invoices</a>
   </div>
   ```

2. Generate unsubscribe URL:
   ```typescript
   const unsubscribeToken = jwt.sign(
     { customerId: customer.id },
     process.env.JWT_SECRET,
     { expiresIn: '30d' }
   );
   
   const unsubscribeUrl = 
     `https://app.example.com/unsubscribe/${unsubscribeToken}`;
   ```

3. Replace placeholder in body:
   ```typescript
   let body = template;
   body = body.replace('{{UNSUBSCRIBE_URL}}', unsubscribeUrl);
   ```

4. Create unsubscribe endpoint:
   ```typescript
   POST /api/v1/unsubscribe/:token
   // Mark customer as unsubscribed
   // Return: { success: true }
   ```

**Learning:**
- Email compliance (CAN-SPAM)
- JWT token signing
- Preference management

---

## Exercise 5: Multi-Language Email

**Level:** Advanced  
**Time:** 1.5 hours

**Goal:** Support multiple languages in email templates.

**Tasks:**

1. Create translations:
   ```typescript
   // backend/src/constants/emailI18n.ts
   export const EMAIL_I18N = {
     en: {
       SUBJECT: 'Invoice {{invoiceNumber}}',
       GREETING: 'Dear {{customerName}}',
       BODY: '...',
     },
     es: {
       SUBJECT: 'Factura {{invoiceNumber}}',
       GREETING: 'Estimado {{customerName}}',
       BODY: '...',
     },
   };
   ```

2. Update template function:
   ```typescript
   INVOICE_BODY_I18N: (locale: string, params: {...}) => {
     const translations = EMAIL_I18N[locale] || EMAIL_I18N.en;
     return `...${translations.GREETING}...`;
   }
   ```

3. Get locale from customer:
   ```typescript
   const customer = await customerRepo.findById(invoice.customerId);
   const locale = customer.preferredLocale || 'en';
   
   const body = EMAIL_TEMPLATES.INVOICE_BODY_I18N(locale, {...});
   ```

4. Add locale selector in form:
   ```typescript
   <select name="locale">
     <option value="en">English</option>
     <option value="es">Español</option>
   </select>
   ```

**Learning:**
- Internationalization (i18n) patterns
- Multi-language support
- Locale management

---

## Exercise 6: Email Preview in PDF

**Level:** Advanced  
**Time:** 1.5 hours

**Goal:** Generate a PDF that includes both invoice AND the email that was sent.

**Tasks:**

1. Create combined HTML:
   ```typescript
   const combinedHtml = `
     <div style="page-break-after: always;">
       <!-- Invoice HTML -->
       ${invoiceHtml}
     </div>
     
     <div style="page-break-before: always;">
       <h2>Email Sent</h2>
       <p>To: ${email.to}</p>
       <p>Subject: ${email.subject}</p>
       <div>${email.body}</div>
     </div>
   `;
   ```

2. Generate combined PDF:
   ```typescript
   const pdfBlob = await generatePdfBlob(combinedHtml);
   ```

3. Store PDF in archive:
   ```typescript
   // Save to S3 or file system
   const pdfUrl = await storage.uploadPdf(pdfBlob, {
     invoiceId,
     timestamp: new Date(),
   });
   ```

4. Link from audit log:
   ```typescript
   // In EmailAuditLog
   model EmailAuditLog {
     ...
     pdfArchiveUrl?: String
   }
   ```

**Learning:**
- PDF archival patterns
- Document versioning
- Compliance/audit trails

---

## Exercise 7: A/B Testing Email Subject

**Level:** Advanced  
**Time:** 1 hour

**Goal:** Test two different email subjects and track open rates.

**Tasks:**

1. Add subject variants:
   ```typescript
   const SUBJECT_VARIANTS = {
     a: (invoiceNumber: string) => `Invoice ${invoiceNumber} - Action Required`,
     b: (invoiceNumber: string) => `Your Invoice ${invoiceNumber} is Ready`,
   };
   ```

2. Select variant:
   ```typescript
   const variant = Math.random() > 0.5 ? 'a' : 'b';
   const subject = SUBJECT_VARIANTS[variant](invoiceNumber);
   ```

3. Track in audit log:
   ```typescript
   model EmailAuditLog {
     ...
     subjectVariant?: String
   }
   ```

4. Track opens with pixel:
   ```typescript
   // Add tracking pixel to email
   const trackingPixel = 
     `<img src="https://track.example.com/open/${auditLogId}" 
           alt="" width="1" height="1" style="display:none;" />`;
   ```

5. Analyze results:
   ```typescript
   GET /api/v1/email-analytics/subject-variants
   Response:
   [
     { variant: 'a', sent: 100, opened: 35, openRate: 0.35 },
     { variant: 'b', sent: 100, opened: 42, openRate: 0.42 },
   ]
   ```

**Learning:**
- A/B testing strategies
- Metrics and analytics
- Email engagement tracking

---

## Exercise 8: Integration Test

**Level:** Beginner  
**Time:** 30 minutes

**Goal:** Write an integration test for the send email workflow.

**Tasks:**

1. Create test file: `backend/src/services/__tests__/invoiceEmailService.test.ts`:
   ```typescript
   import { InvoiceEmailService } from '../invoiceEmailService';
   import { MockEmailService } from '../mockEmailService';
   import { InMemoryInvoiceRepository } from '../repositories/inMemoryInvoiceRepository';
   
   describe('InvoiceEmailService', () => {
     it('sends email successfully', async () => {
       const mockEmail = new MockEmailService();
       const invoiceRepo = new InMemoryInvoiceRepository();
       const customerRepo = new InMemoryCustomerRepository();
       
       const service = new InvoiceEmailService(
         mockEmail,
         invoiceRepo,
         customerRepo
       );
       
       const result = await service.sendInvoiceEmail({
         to: 'customer@example.com',
         subject: 'Test',
         body: '<p>Test</p>',
         invoiceNumber: 'INV-001',
       });
       
       expect(result.success).toBe(true);
       expect(mockEmail.getSentEmails()).toHaveLength(1);
     });
     
     it('throws on invalid email', async () => {
       // ... test invalid email rejection
     });
   });
   ```

2. Run tests:
   ```bash
   npm test
   ```

**Learning:**
- Unit testing with mocks
- Integration test patterns
- Test-driven development

---

## Exercise 9: Error Recovery Dashboard

**Level:** Advanced  
**Time:** 2 hours

**Goal:** Build a dashboard to view and retry failed emails.

**Tasks:**

1. Backend endpoint:
   ```typescript
   GET /api/v1/email-failures
   Response: [
     {
       id: 'log-123',
       invoiceId: 'inv-001',
       recipient: 'customer@example.com',
       error: 'Domain not verified',
       failedAt: '2024-08-30T...',
       retryCount: 0
     }
   ]
   
   POST /api/v1/email-failures/:id/retry
   Response: { success: true, messageId: '...' }
   ```

2. Frontend component:
   ```typescript
   export const EmailFailuresDashboard: React.FC = () => {
     const [failures, setFailures] = useState([]);
     
     const handleRetry = async (id: string) => {
       await api.retryEmail(id);
       // Refresh list
     };
     
     return (
       <table>
         <thead><tr><th>Invoice</th><th>Error</th><th>Action</th></tr></thead>
         <tbody>
           {failures.map(f => (
             <tr key={f.id}>\n              <td>{f.invoiceId}</td>\n              <td>{f.error}</td>\n              <td>\n                <button onClick={() => handleRetry(f.id)}>\n                  Retry\n                </button>\n              </td>\n            </tr>\n           ))}\n         </tbody>\n       </table>\n     );\n   };
   ```

**Learning:**
- Error visibility patterns
- Recovery workflows
- Admin dashboards

---

## Exercise 10: Rate Limiting

**Level:** Intermediate  
**Time:** 45 minutes

**Goal:** Add rate limiting to prevent email spam.

**Tasks:**

1. Install redis:
   ```bash
   npm install redis
   ```

2. Create limiter:
   ```typescript
   import { createClient } from 'redis';
   
   const redis = createClient();
   
   export async function checkEmailRateLimit(userId: string): Promise<boolean> {
     const key = `email:${userId}`;
     const count = await redis.incr(key);
     
     if (count === 1) {
       await redis.expire(key, 60); // 1 minute window
     }
     
     return count <= 10; // 10 emails per minute
   }
   ```

3. Use in controller:
   ```typescript
   if (!await checkEmailRateLimit(req.user.id)) {
     return res.status(429).json({
       error: 'Too many requests. Try again later.'
     });
   }
   ```

**Learning:**
- Rate limiting strategies
- Redis usage
- DDoS prevention

---

## Challenge: Extend the Module

Pick any extension and implement it:

- [ ] Add email template builder (WYSIWYG)
- [ ] Implement real Resend provider
- [ ] Create email preference center (frequency, topics)
- [ ] Add attachment preview
- [ ] Implement email forwarding
- [ ] Create email thread/conversation view
- [ ] Add signature management
- [ ] Implement SPF/DKIM/DMARC setup guide
- [ ] Create email analytics dashboard
- [ ] Build email notification center

**Pick one, extend the module, and share your implementation!**

## Next Steps

1. Start with Exercise 1 (HTML templates)
2. Move to Exercise 2 (Retry logic)
3. Try Exercise 8 (Testing) to validate your changes
4. Pick a Challenge to extend further

Good luck! 🚀
