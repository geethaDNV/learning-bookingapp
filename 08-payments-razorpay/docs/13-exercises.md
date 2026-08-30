# 13. Exercises

Coding exercises to extend your learning.

## Exercise 1: Add Refund Support (Intermediate)

### Goal
Implement payment refunds. When a refund is requested, call Razorpay refund API, update payment status, and revert invoice payment.

### Requirements

1. **Database Schema**
   - Add `Refund` table to Prisma schema
   - Fields: `id`, `paymentId` (FK), `amount`, `status` ("PENDING"|"COMPLETED"|"FAILED"), `providerRefundId`, `createdAt`

2. **Gateway Contract**
   - Add method to `IPaymentGatewayProvider`:
   ```typescript
   refund(input: RefundInput): Promise<RefundResult>;
   
   type RefundInput = {
     paymentId: string;
     amount: number;
     reason?: string;
   };
   
   type RefundResult = {
     refundId: string;
     status: "created" | "pending" | "completed";
   };
   ```

3. **Mock Implementation**
   - `MockPaymentGatewayProvider.refund()` should return instant success
   - Create mock refund ID: `refund_${timestamp}`

4. **Razorpay Implementation**
   - `RazorpayGatewayProvider.refund()` should call:
   ```typescript
   const refund = await client.payments.refund(paymentId, {
     amount: amount * 100,  // paise
     reason: reason || "Customer request"
   });
   ```

5. **Service Layer**
   - Create `RefundService` with `requestRefund(paymentId, amount)`
   - Must verify payment exists and is CAPTURED
   - Must verify refund amount ≤ payment amount
   - Call gateway provider
   - Store refund record

6. **Controller**
   - Add endpoint: `POST /api/v1/payments/:id/refund`
   - Body: `{ amount: number, reason?: string }`

7. **Invoice Reversal**
   - When refund completes, call `invoicePaymentApplicationService.reversePayment()`
   - Reduces `paidAmount` and increases `balanceDue`

8. **Webhook Handling**
   - Handle `refund.completed` webhook event
   - Mark refund as COMPLETED in database

### Hints
- Look at `PaymentService.createPaymentLink()` for pattern
- Check production `backend/services/payments/refundService.ts` for reference
- Test with: `POST /api/v1/payments/{id}/refund` with `{ amount: 1000 }`

### Success Criteria
- [ ] Refund table created
- [ ] IPaymentGatewayProvider updated with refund method
- [ ] Both providers implement refund
- [ ] RefundService created
- [ ] POST endpoint works
- [ ] Invoices correctly reverse when refunded
- [ ] Webhook updates refund status

---

## Exercise 2: Add Payment Retry Logic (Intermediate)

### Goal
When a payment fails, allow customer to retry from status page without creating new payment link.

### Requirements

1. **Payment State Machine**
   - Existing: `PENDING` → `CAPTURED` or `FAILED`
   - New: `FAILED` → `PENDING` (retry)
   - Can retry max 3 times per payment

2. **Retry Tracking**
   - Add to Payment model: `retryCount` (default: 0), `lastRetryAt` (nullable)
   - Increment on each retry

3. **Retry Endpoint**
   - `POST /api/v1/payments/:id/retry`
   - Check if status is FAILED
   - Check retryCount < 3
   - Reset status to PENDING
   - Call `gatewayProvider.createHostedLink()` with same details
   - Update `hostedUrl` with new payment link
   - Increment `retryCount`

4. **Frontend Update**
   - In `PaymentStatusPage`, if status is FAILED:
   - Show "Retry Payment" button
   - On click: `POST /api/v1/payments/:id/retry`
   - Redirect to new hostedUrl
   - Show retry count: "Attempt 1 of 3"

5. **Razorpay Handling**
   - Use `idempotencyKey` from notes to prevent duplicates
   - Razorpay returns existing link if already created

### Hints
- Check `PaymentService` for existing pattern
- Use same `idempotencyKey` when retrying
- Test with mock provider: `POST /api/v1/payments/{id}/simulate/failure` then retry

### Success Criteria
- [ ] Payment schema updated with retryCount
- [ ] Retry endpoint creates new payment link
- [ ] Frontend shows retry button for FAILED payments
- [ ] Retry count displayed
- [ ] Max 3 retries enforced
- [ ] Customer can complete payment after retry

---

## Exercise 3: Add Payment Validation Middleware (Intermediate)

### Goal
Add request validation middleware to prevent invalid payments upfront.

### Requirements

1. **Custom Validation Middleware**
   - Check invoice exists before calling provider
   - Check invoice is in valid status (SENT or PARTIALLY_PAID, not PAID/CANCELLED)
   - Check invoice amount > 0
   - Check customer has valid email
   - Check payment doesn't already exist for invoice in PENDING status
   - Return 400 with clear error if any check fails

2. **Middleware Chain**
   - Apply to `POST /api/v1/payments` endpoint
   - Must run after Zod schema validation
   - Must run before PaymentService

3. **Error Messages**
   ```
   {
     "success": false,
     "error": {
       "code": "INVOICE_NOT_FOUND",
       "message": "Invoice INV-001 does not exist"
     }
   }
   ```

### Implementation
```typescript
// middleware/validatePaymentRequest.ts
export const validatePaymentRequest =
  (repo: PaymentRepository) =>
  async (req, res, next) => {
    try {
      const { invoiceId } = req.body;
      
      // Check 1: Invoice exists
      const invoice = await repo.getInvoice(invoiceId);
      if (!invoice) {
        return res.status(400).json({
          success: false,
          error: { code: "INVOICE_NOT_FOUND" }
        });
      }
      
      // Check 2-5: Your validations here
      
      next();
    } catch (error) {
      next(error);
    }
  };
```

### Success Criteria
- [ ] All validations implemented
- [ ] Clear error messages returned
- [ ] Returns 400 for validation failures
- [ ] Doesn't call provider if validation fails
- [ ] Middleware applied to endpoint

---

## Exercise 4: Add Email Notifications (Advanced)

### Goal
Send email to customer when payment status changes.

### Requirements

1. **Email Service Interface**
   ```typescript
   interface IEmailService {
     sendPaymentCreated(email: string, payment: Payment): Promise<void>;
     sendPaymentSuccess(email: string, payment: Payment): Promise<void>;
     sendPaymentFailed(email: string, payment: Payment): Promise<void>;
     sendRefundProcessed(email: string, refund: Refund): Promise<void>;
   }
   ```

2. **Mock Implementation**
   - Logs to console instead of sending real emails
   - Useful for testing

3. **Real Implementation (Optional - Choose One)
   - Nodemailer for SMTP
   - SendGrid API
   - AWS SES

4. **Trigger Points**
   - Payment link created: Send customer link
   - Payment captured: Send confirmation with invoice details
   - Payment failed: Send retry link
   - Refund processed: Send refund confirmation

5. **Email Templates**
   ```
   From: noreply@yourapp.com
   Subject: Payment successful for Invoice INV-001
   
   Hi [Customer Name],
   
   Your payment of ₹5,000 has been successfully captured.
   
   Invoice: INV-001
   Amount: ₹5,000
   Status: Paid
   
   Thank you for your business!
   
   ---
   [Your Company]
   ```

### Hints
- Use same pattern as `IPaymentGatewayProvider` - create interface + implementations
- Inject EmailService into PaymentService
- Send emails after payment status updates (not before)

### Success Criteria
- [ ] IEmailService interface created
- [ ] Mock implementation logs emails
- [ ] Real implementation sends (or can send) emails
- [ ] Emails triggered on status changes
- [ ] Customer receives correct email content

---

## Exercise 5: Add Payment Reconciliation Job (Advanced)

### Goal
Verify payment statuses with Razorpay periodically to catch missed webhooks.

### Requirements

1. **Reconciliation Job**
   - Runs every hour (cron job)
   - Finds all payments with status PENDING from > 2 hours ago
   - Calls `gatewayProvider.fetchPaymentLinkStatus(paymentId)`
   - Updates payment status if Razorpay has newer status
   - Sends alert if payment stuck in PENDING

2. **Job Scheduler**
   - Use `node-cron` package
   - Schedule: `0 * * * *` (every hour)
   - Log each run

3. **Fetch Status Implementation**
   - Razorpay: Call `client.paymentLink.fetch(linkId)`
   - Mock: Return existing status
   - Compare with DB status

4. **Handling Discrepancies**
   ```
   If Razorpay says COMPLETED but DB says PENDING:
   1. Get actual payment amount from Razorpay
   2. Apply to invoice (same as webhook)
   3. Update payment status
   4. Log event: "Reconciliation: Payment auto-captured"
   ```

### Hints
- Look at production `reconciliationService.ts`
- Log all reconciliations for debugging
- Add counter: `totalReconciled`, `statusChanged`, etc.

### Success Criteria
- [ ] Cron job scheduled to run hourly
- [ ] Queries pending payments
- [ ] Fetches status from provider
- [ ] Updates DB if status changed
- [ ] Sends alerts for stuck payments
- [ ] Logs all reconciliations

---

## Exercise 6: Improve Type Safety (Beginner)

### Goal
Add more specific types to reduce `any` usage and catch errors at compile time.

### Requirements

1. **API Response Types**
   ```typescript
   type ApiResponse<T> = {
     success: boolean;
     message: string;
     data?: T;
     error?: {
       code: string;
       message: string;
       details?: Record<string, string>;
     };
   };
   ```

2. **Payment Status Type**
   ```typescript
   type PaymentStatus = "PENDING" | "CAPTURED" | "FAILED" | "CANCELLED";
   
   // Create const for values:
   const PAYMENT_STATUSES = {
     PENDING: "PENDING",
     CAPTURED: "CAPTURED",
     FAILED: "FAILED"
   } as const;
   ```

3. **Error Codes Type**
   ```typescript
   type ErrorCode =
     | "INVOICE_NOT_FOUND"
     | "INVALID_AMOUNT"
     | "INVALID_SIGNATURE"
     | "DUPLICATE_EVENT"
     | "PROVIDER_ERROR";
   ```

4. **Replace All `any` Types**
   - Audit all files for `any`
   - Replace with specific types
   - Add type assertions only where necessary

### Success Criteria
- [ ] No `any` types in new code
- [ ] All API responses typed
- [ ] All error codes typed
- [ ] TypeScript strict mode passes
- [ ] Better IDE autocomplete

---

## Exercise 7: Add Rate Limiting (Intermediate)

### Goal
Protect payment endpoints from abuse.

### Requirements

1. **Install package**: `npm install express-rate-limit`

2. **Configure Limits**
   ```typescript
   const paymentLimiter = rateLimit({
     windowMs: 15 * 60 * 1000,  // 15 minutes
     max: 10,                    // 10 requests
     message: "Too many payments, try again later"
   });
   
   const webhookLimiter = rateLimit({
     windowMs: 60 * 1000,        // 1 minute
     max: 100,                   // 100 requests
     message: "Webhook rate limit exceeded"
   });
   ```

3. **Apply to Endpoints**
   - `POST /api/v1/payments` - 10 per 15 min per user
   - `POST /api/v1/payments/:id/refund` - 5 per 15 min
   - `POST /api/v1/payments/webhooks/razorpay` - 100 per minute
   - `GET /api/v1/payments/:id` - 50 per minute (public)

4. **Identify User**
   - Use IP address for anonymous requests
   - Use user ID for authenticated (if implemented)

### Success Criteria
- [ ] Rate limiters configured
- [ ] Applied to appropriate endpoints
- [ ] Requests over limit return 429
- [ ] Clear error message
- [ ] Doesn't break legitimate usage

---

## Exercise 8: Add Payment Search & Filtering (Intermediate)

### Goal
Add advanced search to payment list endpoint.

### Requirements

1. **Enhanced List Endpoint**
   ```
   GET /api/v1/payments?
     page=1
     pageSize=20
     status=CAPTURED,FAILED
     provider=razorpay
     minAmount=1000
     maxAmount=50000
     dateFrom=2024-08-01
     dateTo=2024-08-31
     search=cust_123  (searches publicId, customer email, invoice number)
   ```

2. **Database Query**
   - Use Prisma `where` with conditions
   - Filter by multiple statuses
   - Filter by date range
   - Full-text search on customer email

3. **Response Format**
   ```typescript
   {
     success: true,
     data: [Payment[], 
     pagination: {
       page: 1,
       pageSize: 20,
       total: 127,
       totalPages: 7
     }
   }
   ```

### Success Criteria
- [ ] Multiple filters work
- [ ] Pagination works
- [ ] Search works
- [ ] Filters combinable
- [ ] Performance acceptable (< 500ms)

---

## Exercise 9: Add Comprehensive Logging (Intermediate)

### Goal
Add structured logging throughout payment flow.

### Requirements

1. **Create Logger Utility**
   ```typescript
   interface ILogger {
     info(message: string, data?: object): void;
     warn(message: string, data?: object): void;
     error(message: string, data?: object): void;
     debug(message: string, data?: object): void;
   }
   ```

2. **Log Key Events**
   - Payment link created: `{ paymentId, invoiceId, amount }`
   - Webhook received: `{ eventId, eventType }`
   - Signature verified: `{ result: true/false }`
   - Invoice updated: `{ invoiceId, newStatus, newBalance }`
   - Payment failed: `{ paymentId, reason }`

3. **Log Format**
   ```
   [2024-08-30T10:30:00Z] INFO Payment created
     paymentId: pay_123
     invoiceId: inv_456
     amount: 5000
     provider: razorpay
   ```

### Success Criteria
- [ ] Logger interface created
- [ ] Console implementation
- [ ] Logs at all key points
- [ ] Structured format (JSON-friendly)
- [ ] Can filter by level (INFO, WARN, ERROR)

---

## Exercise 10: Write Unit Tests (Intermediate)

### Goal
Test critical payment logic.

### Requirements

1. **Test Framework**: Jest (already in BookKeepingApp)

2. **Test Files**
   - `src/services/__tests__/PaymentService.test.ts`
   - `src/services/__tests__/MockPaymentGatewayProvider.test.ts`
   - `src/services/__tests__/PaymentWebhookService.test.ts`

3. **Test Cases - PaymentService**
   ```typescript
   describe("PaymentService", () => {
     it("should create payment link for valid invoice", async () => {...});
     it("should throw error for non-existent invoice", async () => {...});
     it("should use mock provider when configured", async () => {...});
     it("should use razorpay provider when configured", async () => {...});
   });
   ```

4. **Test Cases - PaymentWebhookService**
   ```typescript
   describe("PaymentWebhookService", () => {
     it("should process payment captured event", async () => {...});
     it("should skip duplicate events", async () => {...});
     it("should update invoice on capture", async () => {...});
     it("should not modify invoice on payment failed", async () => {...});
   });
   ```

5. **Mocking Strategy**
   - Mock Prisma client
   - Mock gateway providers
   - Mock email service

### Hints
- Check production tests in `backend/__tests__/`
- Use Jest `describe` and `it` blocks
- Mock dependencies with `jest.mock()`
- Test both success and failure paths

### Success Criteria
- [ ] 15+ unit tests written
- [ ] All critical paths tested
- [ ] Tests pass with `npm test`
- [ ] Coverage > 70%
- [ ] Mock data set up properly

---

## Challenge: Full E2E Payment Flow

### Goal
Build complete payment flow test without Razorpay (everything local).

### Requirements

1. **Test Scenario**
   - Create customer and invoice
   - Create payment link (mock provider)
   - Simulate customer paying
   - Send webhook to backend
   - Verify payment captured
   - Verify invoice updated
   - Verify customer receives email

2. **Code**
   ```typescript
   async function testFullPaymentFlow() {
     // 1. Create test data
     const customer = await createCustomer({ email: "test@example.com" });
     const invoice = await createInvoice({ 
       customerId: customer.id, 
       amount: 5000 
     });
     
     // 2. Create payment
     const payment = await paymentService.createPaymentLink(invoice.id);
     expect(payment.status).toBe("PENDING");
     
     // 3. Simulate webhook
     const event = mockProvider.generateWebhookEvent({
       eventType: "payment.captured",
       amount: 5000
     });
     await webhookService.processPaymentEvent(payment.id, event);
     
     // 4. Verify updates
     const updatedPayment = await paymentRepository.getById(payment.id);
     expect(updatedPayment.status).toBe("CAPTURED");
     
     const updatedInvoice = await invoiceRepository.getById(invoice.id);
     expect(updatedInvoice.status).toBe("PAID");
     expect(updatedInvoice.balanceDue).toBe(0);
     
     // 5. Verify email sent
     const emails = emailService.getSentEmails();
     expect(emails.length).toBe(2);  // Created + Success
     expect(emails[1].subject).toContain("successful");
   }
   ```

### Success Criteria
- [ ] Full flow runs without external dependencies
- [ ] All assertions pass
- [ ] Takes < 1 second to run
- [ ] Repeatable (can run 100 times)

---

## Next Steps

1. **Start with Exercise 1-2**: Core features (refunds, retries)
2. **Then 3-5**: Code quality (validation, emails, reconciliation)
3. **Then 6-9**: Polish (types, rate limiting, logging, tests)
4. **Finally**: E2E challenge to tie it all together

Good luck! These exercises teach production patterns. When done, you'll understand payment systems at production depth.
