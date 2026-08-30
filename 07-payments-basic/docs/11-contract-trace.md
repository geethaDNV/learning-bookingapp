# 11 - Contract Trace: Full Payment Journey

## Scenario

Customer creates a payment for invoice, then simulates payment success. Let's trace **every contract call** through the system.

---

## Part 1: Create Payment

### HTTP Request

```
POST /api/v1/invoices/inv_123/payments
Content-Type: application/json

{
  "invoiceId": "inv_123"
}
```

---

### Stack Trace: Request → Response

#### 1. Server Routes
```typescript
// src/routes/paymentRoutes.ts
router.post("/invoices/:invoiceId/payments", (req, res) => {
  return controller.createPayment(req, res);
  //     ↓
});
```

#### 2. Controller
```typescript
// src/controllers/PaymentController.ts
createPayment = asyncHandler(async (req, res) => {
  // Parse & validate with Zod
  const validated = CreatePaymentSchema.parse(req.body);
  // { invoiceId: "inv_123" }
  
  // Delegate to service (IPaymentService interface)
  const payment = await this.paymentService.createPayment(validated.invoiceId);
  //                          ↓
  
  sendResponse(res, 201, "Payment created successfully", payment);
});
```

#### 3. PaymentService.createPayment() - Line 1: Fetch Invoice
```typescript
// src/services/PaymentService.ts
async createPayment(invoiceId: string): Promise<PaymentDTO> {
  // Fetch invoice directly from Prisma
  const invoice = await this.prisma.invoice.findUnique({
    where: { id: invoiceId },
  });
  
  if (!invoice) {
    throw new NotFoundError(`Invoice ${invoiceId} not found`);
  }
  
  if (invoice.balanceDue <= 0) {
    throw new ValidationError("Invoice has no outstanding balance");
  }
  
  // State check passes, continue...
  //     ↓
}
```

#### 4. PaymentService - Line 2: Generate Public ID
```typescript
  // IPaymentNumberService.generatePublicId()
  const publicId = await this.paymentNumberService.generatePublicId();
  //                           ↓
```

#### 5. PaymentNumberService
```typescript
// src/services/PaymentNumberService.ts
export class PaymentNumberService implements IPaymentNumberService {
  async generatePublicId(): Promise<string> {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `PAY-${timestamp}-${random}`;
    // Returns: "PAY-GRFY5LE-ABCD"
    //     ↓
  }
}
```

#### 6. PaymentService - Line 3: Create Payment Record
```typescript
  // IPaymentRepository.create()
  const payment = await this.paymentRepository.create(
    invoiceId,           // "inv_123"
    invoice.customerId,  // "cust_abc"
    invoice.balanceDue,  // 16500
    publicId,            // "PAY-GRFY5LE-ABCD"
    `temp_${uuidv4()}`   // Temp provider ID
  );
  //     ↓
```

#### 7. PaymentRepository.create()
```typescript
// src/repositories/PaymentRepository.ts
async create(invoiceId, customerId, amount, publicId, providerPaymentId) {
  const payment = await this.prisma.payment.create({
    data: {
      invoiceId,
      customerId,
      amount,
      publicId,
      providerPaymentId,
      status: "created",
    },
  });
  
  return this.toDTO(payment);
  // Returns: PaymentDTO { id: "pay_xyz", status: "created", ... }
  //     ↓
}
```

#### 8. PaymentService - Line 4: Call Payment Gateway
```typescript
  // IPaymentGatewayProvider.createPaymentIntent()
  const { providerPaymentId } = await this.gatewayProvider.createPaymentIntent(
    payment.id,              // "pay_xyz"
    invoice.balanceDue,      // 16500
    `Invoice ${invoice.number}` // "Invoice INV-2025-001"
  );
  //     ↓
```

#### 9. MockPaymentGatewayProvider.createPaymentIntent()
```typescript
// src/services/MockPaymentGatewayProvider.ts
async createPaymentIntent(paymentId, amount, description) {
  const providerPaymentId = `mock_pay_${uuidv4()}`;
  const paymentLink = `http://localhost:3001/api/v1/payments/public/status/${paymentId}`;
  
  return { providerPaymentId, paymentLink };
  // Returns: { providerPaymentId: "mock_pay_9a8b7c6d...", paymentLink: "http://..." }
  //     ↓
}
```

#### 10. PaymentService - Line 5: Update Payment
```typescript
  // IPaymentRepository.updateProviderPaymentId()
  const updatedPayment = await this.paymentRepository.updateProviderPaymentId(
    payment.id,           // "pay_xyz"
    providerPaymentId     // "mock_pay_9a8b7c6d..."
  );
  
  return updatedPayment;
  // Returns: PaymentDTO with providerPaymentId set
  //     ↓
```

#### 11. PaymentRepository.updateProviderPaymentId()
```typescript
// src/repositories/PaymentRepository.ts
async updateProviderPaymentId(id, providerPaymentId) {
  const payment = await this.prisma.payment.update({
    where: { id },
    data: { providerPaymentId },
  });
  
  return this.toDTO(payment);
  // Returns: Updated PaymentDTO
  //     ↓
}
```

#### 12. Controller Returns Response
```typescript
// src/controllers/PaymentController.ts
sendResponse(res, 201, "Payment created successfully", {
  id: payment.id,
  publicId: payment.publicId,
  status: payment.status,
  amount: payment.amount,
  providerPaymentId: payment.providerPaymentId,
  invoiceId: payment.invoiceId,
});
```

### HTTP Response
```json
{
  "message": "Payment created successfully",
  "data": {
    "id": "pay_xyz",
    "publicId": "PAY-GRFY5LE-ABCD",
    "status": "created",
    "amount": 16500,
    "providerPaymentId": "mock_pay_9a8b7c6d...",
    "invoiceId": "inv_123",
    "message": "Payment ready for processing"
  }
}
```

---

## Part 2: Simulate Payment Success

### HTTP Request

```
POST /api/v1/payments/mock/pay_xyz/succeed
```

---

### Stack Trace: Webhook Simulation

#### 1. Controller
```typescript
// src/controllers/PaymentController.ts
simulatePaymentSuccess = asyncHandler(async (req, res) => {
  const { paymentId } = req.params;  // "pay_xyz"
  
  // Delegate to service
  const payment = await this.paymentService.simulatePaymentSuccess(paymentId);
  //                          ↓
  
  sendResponse(res, 200, "Payment marked as captured (simulated)", {
    id: payment.id,
    status: payment.status,
    invoiceId: payment.invoiceId,
    amount: payment.amount,
  });
});
```

#### 2. PaymentService.simulatePaymentSuccess()
```typescript
// src/services/PaymentService.ts
async simulatePaymentSuccess(paymentId: string): Promise<PaymentDTO> {
  const payment = await this.getPayment(paymentId);
  
  // Generate a fake provider event ID
  const eventId = `evt_${uuidv4()}`;  // "evt_1A2B3C..."
  
  // Call webhook service (same as real webhook)
  const updatedPayment = await this.webhookService.processPaymentEvent(
    paymentId,           // "pay_xyz"
    eventId,             // "evt_1A2B3C..."
    "payment.captured",  // Event type
    "captured"           // Status
  );
  //     ↓
  
  return updatedPayment;
}
```

#### 3. PaymentWebhookService.processPaymentEvent()
```typescript
// src/services/PaymentWebhookService.ts
async processPaymentEvent(paymentId, eventId, eventType, status) {
  // ===== IDEMPOTENCY CHECK =====
  const lastEventId = await this.paymentRepository.getLastEventId(paymentId);
  // IPaymentRepository.getLastEventId()
  //     ↓
}
```

#### 4. PaymentRepository.getLastEventId()
```typescript
// src/repositories/PaymentRepository.ts
async getLastEventId(id) {
  const payment = await this.prisma.payment.findUnique({
    where: { id },
    select: { lastEventId: true },
  });
  
  return payment?.lastEventId || null;
  // Returns: null (first time processing)
  //     ↓
}
```

#### 5. Back to PaymentWebhookService
```typescript
  if (lastEventId === eventId) {
    // We've already processed this, return early
    const payment = await this.paymentRepository.getById(paymentId);
    return payment!;
  }
  
  // First time, continue processing
  
  // ===== UPDATE PAYMENT STATUS =====
  let payment = await this.paymentRepository.updateStatus(paymentId, status);
  // IPaymentRepository.updateStatus("pay_xyz", "captured")
  //     ↓
}
```

#### 6. PaymentRepository.updateStatus()
```typescript
// src/repositories/PaymentRepository.ts
async updateStatus(id, status) {
  const payment = await this.prisma.payment.update({
    where: { id },
    data: { status },  // "captured"
  });
  
  return this.toDTO(payment);
  // Returns: PaymentDTO with status: "captured"
  //     ↓
}
```

#### 7. Back to PaymentWebhookService
```typescript
  // ===== APPLY PAYMENT TO INVOICE =====
  if (status === "captured") {
    await this.invoicePaymentApplicationService.applyPaymentToInvoice(
      payment.invoiceId,  // "inv_123"
      payment.amount      // 16500
    );
    // IInvoicePaymentApplicationService.applyPaymentToInvoice()
    //     ↓
  }
}
```

#### 8. InvoicePaymentApplicationService.applyPaymentToInvoice()
```typescript
// src/services/InvoicePaymentApplicationService.ts
async applyPaymentToInvoice(invoiceId, amount) {
  const invoice = await this.prisma.invoice.findUnique({
    where: { id: invoiceId },  // "inv_123"
  });
  
  // Calculate new state
  const newPaidAmount = invoice.paidAmount + amount;      // 0 + 16500 = 16500
  const newBalanceDue = Math.max(0, invoice.total - newPaidAmount); // 0
  const newStatus = newBalanceDue === 0 ? "paid" : "partially_paid";  // "paid"
  
  // Update invoice
  const updated = await this.prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      paidAmount: newPaidAmount,
      balanceDue: newBalanceDue,
      status: newStatus,
    },
  });
  
  return this.toPaymentInfo(updated);
  // Returns: InvoicePaymentInfo { status: "paid", paidAmount: 16500, balanceDue: 0 }
  //     ↓
}
```

#### 9. Back to PaymentWebhookService
```typescript
  // ===== RECORD EVENT FOR IDEMPOTENCY =====
  await this.paymentRepository.recordEventId(paymentId, eventId);
  // IPaymentRepository.recordEventId("pay_xyz", "evt_1A2B3C...")
  //     ↓
}
```

#### 10. PaymentRepository.recordEventId()
```typescript
// src/repositories/PaymentRepository.ts
async recordEventId(id, eventId) {
  await this.prisma.payment.update({
    where: { id },
    data: { lastEventId: eventId },  // "evt_1A2B3C..."
  });
}
```

#### 11. Back to PaymentService
```typescript
// src/services/PaymentService.ts
const updatedPayment = await this.webhookService.processPaymentEvent(...);
return updatedPayment;
// Returns: PaymentDTO with status: "captured"
//     ↓
```

#### 12. Controller Returns Response
```typescript
// src/controllers/PaymentController.ts
sendResponse(res, 200, "Payment marked as captured (simulated)", {
  id: payment.id,              // "pay_xyz"
  status: payment.status,      // "captured"
  invoiceId: payment.invoiceId, // "inv_123"
  amount: payment.amount,      // 16500
});
```

### HTTP Response
```json
{
  "message": "Payment marked as captured (simulated)",
  "data": {
    "id": "pay_xyz",
    "status": "captured",
    "invoiceId": "inv_123",
    "amount": 16500
  }
}
```

---

## Final State

### Payment Table
```
id        | status    | invoiceId | lastEventId
------    | -----     | --------- | -----------
pay_xyz   | captured  | inv_123   | evt_1A2B3C
```

### Invoice Table
```
id      | status | total  | paidAmount | balanceDue
------  | ------ | ------ | ---------- | ----------
inv_123 | paid   | 16500  | 16500      | 0
```

---

## Contract Flow Summary

```
Request
  ↓
PaymentController
  ├─ uses: IPaymentService
  │   ├─ uses: IPaymentRepository
  │   ├─ uses: IPaymentNumberService
  │   ├─ uses: IPaymentGatewayProvider
  │   ├─ uses: IPaymentWebhookService
  │   │   ├─ uses: IPaymentRepository
  │   │   └─ uses: IInvoicePaymentApplicationService
  │   └─ uses: PrismaClient
  └─ Response

Every interface (IPaymentService, IPaymentRepository, etc.)
has concrete implementations (PaymentService, PaymentRepository, etc.)
that are wired together in the DI Container.

To swap implementations (e.g., MockPaymentGatewayProvider → RazorpayPaymentGatewayProvider),
just change one line in the container. Everything else works!
```

Next: [12 - How This Maps to Production](12-how-this-maps-to-production.md)
# 11 - Contract Trace: A Payment from Start to Finish

## Overview

This document traces a single payment through every layer of the application, showing how contracts and DI work together.

**Scenario**: Customer pays an unpaid invoice in full.

```
Invoice: inv_123, total: $165 (16500 paise), status: "issued"
Customer wants to pay the full amount
```

---

## Step 1: Frontend Initiates Payment

**User Action**: Clicks "Create Payment" button

```typescript
// PaymentListPage.tsx (hypothetical, not fully in module frontend)
const handleCreatePayment = () => {
  dispatch(createPayment(invoiceId)); // "inv_123"
};
```

**Frontend Thunk** (`createPaymentThunk`):
```typescript
return paymentAPI.createPayment(invoiceId);
// → fetch("http://localhost:3001/api/v1/invoices/inv_123/payments", { method: "POST" })
```

---

## Step 2: Route Receives Request

**HTTP Request**:
```
POST /api/v1/invoices/inv_123/payments
Content-Type: application/json

{ "invoiceId": "inv_123" }
```

**Route Handler** (`src/routes/paymentRoutes.ts`):
```typescript
router.post("/invoices/:invoiceId/payments", (req: Request, res: Response) => {
  return controller.createPayment(req, res);
  // ↓ Controller is a PaymentController instance from Cradle
});
```

---

## Step 3: Controller Validates and Delegates

**PaymentController.createPayment**:
```typescript
createPayment = asyncHandler(async (req: Request, res: Response) => {
  // Contract: Uses IPaymentService
  const validated = CreatePaymentSchema.parse(req.body);
  // ✓ { invoiceId: "inv_123" }

  // Calls service (contract: IPaymentService)
  const payment = await this.paymentService.createPayment(validated.invoiceId);
  // ↓ Delegates to PaymentService (from Cradle)

  sendResponse(res, 201, "Payment created successfully", payment);
});
```

**Key**: Controller doesn't care that service is `PaymentService`—it only knows it's `IPaymentService`.

---

## Step 4: Service Orchestrates

**PaymentService.createPayment** (implements `IPaymentService`):

```typescript
async createPayment(invoiceId: string): Promise<PaymentDTO> {
  // 4a. Fetch invoice
  const invoice = await this.prisma.invoice.findUnique({
    where: { id: "inv_123" },
  });
  // Result:
  // { id: "inv_123", total: 16500, paidAmount: 0, balanceDue: 16500, customerId: "cust_abc" }

  // Validate
  if (!invoice) throw new NotFoundError(...);
  if (invoice.balanceDue <= 0) throw new ValidationError(...);

  // 4b. Generate public ID (contract: IPaymentNumberService)
  const publicId = await this.paymentNumberService.generatePublicId();
  // Result: "PAY-XXXX-YYYY"

  // 4c. Create payment record (contract: IPaymentRepository)
  const payment = await this.paymentRepository.create(
    "inv_123",                // invoiceId
    "cust_abc",               // customerId
    16500,                    // amount (full balance)
    "PAY-XXXX-YYYY",         // publicId
    `temp_${uuidv4()}`       // temp provider ID
  );
  // Result:
  // { id: "pay_xyz", status: "created", publicId: "PAY-XXXX-YYYY", ... }

  // 4d. Call provider (contract: IPaymentGatewayProvider)
  const { providerPaymentId } = await this.gatewayProvider.createPaymentIntent(
    "pay_xyz",                           // paymentId
    16500,                               // amount
    "Invoice INV-2025-001"              // description
  );
  // Result: { providerPaymentId: "mock_pay_9a8b7c...", paymentLink: "..." }

  // 4e. Update payment with provider ID (contract: IPaymentRepository)
  const updatedPayment = await this.paymentRepository.updateProviderPaymentId(
    "pay_xyz",
    "mock_pay_9a8b7c..."
  );
  // Result:
  // { id: "pay_xyz", status: "created", providerPaymentId: "mock_pay_9a8b7c...", ... }

  return updatedPayment;
}
```

**Key**: Service uses 5 different contracts:
- `this.prisma` (PrismaClient) → Direct DB access
- `this.paymentNumberService` (IPaymentNumberService) → Generate ID
- `this.paymentRepository` (IPaymentRepository) → Persist payment
- `this.gatewayProvider` (IPaymentGatewayProvider) → Create provider intent
- `this.paymentRepository` (IPaymentRepository) → Update payment

All are injected; service doesn't create them.

---

## Step 5: Repository Persistence

**PaymentRepository.create** (implements `IPaymentRepository`):

```typescript
async create(invoiceId, customerId, amount, publicId, providerPaymentId) {
  // Contract: IPaymentRepository
  const payment = await this.prisma.payment.create({
    data: {
      invoiceId,
      customerId,
      amount,
      publicId,
      providerPaymentId,
      status: "created",
    },
  });

  return this.toDTO(payment);
  // Converts Prisma Payment to PaymentDTO (plain TypeScript object)
}
```

**Key**: Repository uses Prisma directly but returns DTOs, not Prisma objects.

---

## Step 6: Gateway Provider Generates Mock Intent

**MockPaymentGatewayProvider.createPaymentIntent** (implements `IPaymentGatewayProvider`):

```typescript
async createPaymentIntent(paymentId, amount, description) {
  // Contract: IPaymentGatewayProvider
  const providerPaymentId = `mock_pay_${uuidv4()}`;
  const paymentLink = `http://localhost:3001/api/v1/payments/public/status/${paymentId}`;

  return { providerPaymentId, paymentLink };
  // In production, Razorpay would return a real payment link
}
```

**Key**: Mock provider follows the same interface as production Razorpay provider.

---

## Step 7: Controller Returns Response

**HTTP Response**:
```
201 Created
{
  "message": "Payment created successfully",
  "data": {
    "id": "pay_xyz",
    "publicId": "PAY-XXXX-YYYY",
    "status": "created",
    "amount": 16500,
    "invoiceId": "inv_123",
    "providerPaymentId": "mock_pay_9a8b7c..."
  }
}
```

---

## Step 8: Frontend Receives Payment

**Frontend Redux State**:
```typescript
// paymentSlice.createPayment.fulfilled
state.selectedPayment = {
  id: "pay_xyz",
  publicId: "PAY-XXXX-YYYY",
  status: "created",
  amount: 16500,
  invoiceId: "inv_123",
  ...
};
```

**Frontend Renders**:
```
Payment Created Successfully!
Public ID: PAY-XXXX-YYYY
Status: CREATED
Amount: $165.00
```

---

## Step 9: Customer Simulates Payment Success

**User Action**: Clicks "Simulate Success" button

**Frontend Thunk**:
```typescript
dispatch(simulatePaymentSuccess(paymentId)); // "pay_xyz"
// → fetch("http://localhost:3001/api/v1/payments/mock/pay_xyz/succeed", { method: "POST" })
```

**HTTP Request**:
```
POST /api/v1/payments/mock/pay_xyz/succeed
```

---

## Step 10: Controller Routes to Simulate

**PaymentController.simulatePaymentSuccess**:
```typescript
simulatePaymentSuccess = asyncHandler(async (req, res) => {
  // Contract: IPaymentService
  const payment = await this.paymentService.simulatePaymentSuccess(paymentId);

  sendResponse(res, 200, "Payment marked as captured (simulated)", payment);
});
```

---

## Step 11: Service Simulates Webhook

**PaymentService.simulatePaymentSuccess**:
```typescript
async simulatePaymentSuccess(paymentId: string): Promise<PaymentDTO> {
  const payment = await this.getPayment(paymentId);

  // Generate fake provider event ID
  const eventId = `evt_${uuidv4()}`;

  // Call webhook service (same as real webhook would)
  // Contract: IPaymentWebhookService
  const updatedPayment = await this.webhookService.processPaymentEvent(
    paymentId,          // "pay_xyz"
    eventId,            // "evt_abc123..."
    "payment.captured", // eventType
    "captured"          // status
  );

  return updatedPayment;
}
```

---

## Step 12: Webhook Service Processes Event

**PaymentWebhookService.processPaymentEvent** (implements `IPaymentWebhookService`):

```typescript
async processPaymentEvent(paymentId, eventId, eventType, status) {
  // Contract: IPaymentWebhookService

  // 12a. Idempotency check
  const lastEventId = await this.paymentRepository.getLastEventId(paymentId);
  // Result: null (first time)

  if (lastEventId === eventId) {
    // Event already processed, skip
    const payment = await this.paymentRepository.getById(paymentId);
    return payment!;
  }

  // 12b. Update payment status (contract: IPaymentRepository)
  let payment = await this.paymentRepository.updateStatus(paymentId, "captured");
  // payment.status = "captured"

  // 12c. Apply payment to invoice (contract: IInvoicePaymentApplicationService)
  if (status === "captured") {
    await this.invoicePaymentApplicationService.applyPaymentToInvoice(
      payment.invoiceId,  // "inv_123"
      payment.amount      // 16500
    );
  }

  // 12d. Record event ID (contract: IPaymentRepository)
  await this.paymentRepository.recordEventId(paymentId, eventId);
  // payment.lastEventId = "evt_abc123..."

  return payment;
}
```

---

## Step 13: Invoice Payment Application

**InvoicePaymentApplicationService.applyPaymentToInvoice** (implements `IInvoicePaymentApplicationService`):

```typescript
async applyPaymentToInvoice(invoiceId, amount) {
  // Contract: IInvoicePaymentApplicationService

  const invoice = await this.prisma.invoice.findUnique({
    where: { id: "inv_123" },
  });
  // Result:
  // { id: "inv_123", total: 16500, paidAmount: 0, balanceDue: 16500, status: "issued" }

  // Calculate new state
  const newPaidAmount = 0 + 16500 = 16500;
  const newBalanceDue = Math.max(0, 16500 - 16500) = 0;
  const newStatus = newBalanceDue === 0 ? "paid" : "partially_paid" = "paid";

  // Update invoice
  const updated = await this.prisma.invoice.update({
    where: { id: "inv_123" },
    data: {
      paidAmount: 16500,
      balanceDue: 0,
      status: "paid",
    },
  });

  return updated;
  // Result:
  // { id: "inv_123", total: 16500, paidAmount: 16500, balanceDue: 0, status: "paid" }
}
```

---

## Step 14: Repository Updates Event Tracking

**PaymentRepository.recordEventId**:
```typescript
async recordEventId(paymentId, eventId) {
  // Contract: IPaymentRepository
  await this.prisma.payment.update({
    where: { id: paymentId },
    data: { lastEventId: eventId },
  });
  // payment.lastEventId = "evt_abc123..."
}
```

---

## Step 15: Webhook Service Returns Updated Payment

```typescript
// Back in PaymentWebhookService.processPaymentEvent
return payment;
// {
//   id: "pay_xyz",
//   status: "captured",      ← Changed from "created"
//   lastEventId: "evt_...",  ← Changed from null
//   invoiceId: "inv_123"
// }
```

---

## Step 16: Controller Returns Response

**HTTP Response**:
```
200 OK
{
  "message": "Payment marked as captured (simulated)",
  "data": {
    "id": "pay_xyz",
    "status": "captured",
    "invoiceId": "inv_123",
    "amount": 16500
  }
}
```

---

## Step 17: Frontend Updates Redux State

**Frontend Redux State**:
```typescript
// paymentSlice.simulatePaymentSuccess.fulfilled
state.selectedPayment = {
  id: "pay_xyz",
  status: "captured",  // ← Changed
  invoiceId: "inv_123",
  amount: 16500,
  ...
};

state.paymentStatus = {
  status: "captured",        // ← Changed
  paidAmount: 16500,         // ← Changed
  balanceDue: 0,             // ← Changed
  invoiceStatus: "paid",     // ← Changed
};
```

---

## Step 18: Frontend Renders Updated UI

```
Payment Status: CAPTURED ✓
Paid Amount: $165.00
Balance Due: $0.00
Invoice Status: PAID ✓
```

---

## Complete Flow Diagram

```
Frontend                                  Backend
────────────────────────────────────────────────────────────────────
1. Click "Create Payment"
                            2. POST /invoices/.../payments
                                   ↓
                            3. PaymentController
                                   ↓
                            4. IPaymentService
                                   ├─ IPaymentRepository.create()
                                   ├─ IPaymentNumberService.generatePublicId()
                                   ├─ IPaymentGatewayProvider.createPaymentIntent()
                                   └─ IPaymentRepository.updateProviderPaymentId()
                                   ↓
5. Receive payment, render status ←
                            
6. Click "Simulate Success"
                            7. POST /payments/mock/.../succeed
                                   ↓
                            8. PaymentController
                                   ↓
                            9. IPaymentService.simulatePaymentSuccess()
                                   ↓
                            10. IPaymentWebhookService.processPaymentEvent()
                                   ├─ IPaymentRepository.updateStatus()
                                   ├─ IInvoicePaymentApplicationService.applyPaymentToInvoice()
                                   └─ IPaymentRepository.recordEventId()
                                   ↓
11. Receive captured payment ←
12. Redux state updates
13. UI shows "CAPTURED", balance = $0
```

---

## Key Contract Usage

| Contract | Used By | Why |
|----------|---------|-----|
| `IPaymentService` | PaymentController | Orchestrates payment operations |
| `IPaymentRepository` | PaymentService, PaymentWebhookService | Persist and query payments |
| `IPaymentNumberService` | PaymentService | Generate public IDs |
| `IPaymentGatewayProvider` | PaymentService | Create payment intents (mock or real) |
| `IPaymentWebhookService` | PaymentService | Process events (idempotent) |
| `IInvoicePaymentApplicationService` | PaymentWebhookService | Update invoice balance |

**Every service depends on interfaces, not concrete classes.** This makes testing and provider swapping trivial.

Next: [12 - How This Maps to Production](12-how-this-maps-to-production.md)
