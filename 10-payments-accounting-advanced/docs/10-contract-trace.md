# Contract Trace: From Payment to Journal Entry to UI

## The Complete Flow

This document traces a single payment capture through the entire system, from initial capture through posting through UI display.

---

## Step 1: Payment Capture (Frontend → Backend)

### Frontend Code
```typescript
// App.tsx - User fills form and clicks "Create Payment"
const handleCreatePayment = async (e: React.FormEvent) => {
  e.preventDefault();
  
  dispatch(createPayment({
    invoiceId: "inv-001",
    amount: 1000,
    paymentMethod: "card"
  }));
};

// paymentsSlice.ts - Dispatch thunk
export const createPayment = createAsyncThunk(
  "payments/create",
  async (params) => {
    // Call API
    return apiClient.createPayment(
      params.invoiceId,
      params.amount,
      params.paymentMethod
    );
  }
);

// apiClient.ts - HTTP request
async createPayment(
  invoiceId: string,
  amount: number,
  paymentMethod: string
): Promise<Payment> {
  const response = await this.client.post(`/api/v1/payments`, {
    invoiceId,
    amount,
    paymentMethod
  });
  return response.data.data as Payment;
}
```

### HTTP Request
```http
POST /api/v1/payments
Content-Type: application/json

{
  "invoiceId": "inv-001",
  "amount": 1000,
  "paymentMethod": "card"
}
```

---

## Step 2: Backend Route → Controller

### routes/index.ts
```typescript
export function createRoutes(cradle: Cradle): Router {
  const router = Router();
  const paymentController = new PaymentController(cradle);

  router.post("/api/v1/payments", asyncHandler(
    paymentController.createPayment
  ));

  return router;
}
```

### controllers/index.ts
```typescript
export class PaymentController {
  constructor(private readonly cradle: Cradle) {}

  createPayment = async (req: Request, res: Response) => {
    // Parse and validate
    const payload = CreatePaymentSchema.parse(req.body);
    
    // Call repository via cradle
    const payment = await this.cradle.paymentRepository.create({
      invoiceId: payload.invoiceId,
      amount: payload.amount,
      paymentMethod: payload.paymentMethod,
      status: "captured",
      capturedAt: new Date(),
      isPosted: false
    });

    res.json(successResponse("Payment created successfully", payment));
  };
}
```

### Validation
```typescript
// schemas/index.ts
export const CreatePaymentSchema = z.object({
  invoiceId: z.string().min(1),
  amount: z.number().positive(),
  paymentMethod: z.string().min(1)
});
```

---

## Step 3: Repository Layer

### repositories/journalEntryRepository.ts
```typescript
export class PaymentRepository implements IPaymentRepository {
  async create(
    data: Omit<Payment, "id" | "createdAt" | "updatedAt">
  ): Promise<Payment> {
    return prisma.payment.create({
      data: {
        invoiceId: data.invoiceId,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        status: data.status,
        capturedAt: data.capturedAt,
        isPosted: data.isPosted
      }
    });
  }
}
```

### Database Insert
```sql
INSERT INTO "Payment" (
  id, invoiceId, amount, paymentMethod, status, capturedAt, isPosted, createdAt, updatedAt
) VALUES (
  'pay-123', 'inv-001', 1000, 'card', 'captured', NOW(), false, NOW(), NOW()
);
```

---

## Step 4: Frontend Receives Payment

### Response
```json
{
  "message": "Payment created successfully",
  "data": {
    "id": "pay-123",
    "invoiceId": "inv-001",
    "amount": 1000,
    "paymentMethod": "card",
    "status": "captured",
    "isPosted": false,
    "capturedAt": "2024-08-30T10:00:00Z"
  }
}
```

### Redux Update
```typescript
// paymentsSlice.ts - extraReducers
.addCase(createPayment.fulfilled, (state, action) => {
  state.currentPayment = action.payload;
  state.success = "Payment created successfully";
})
```

### Component State
```typescript
paymentsState = {
  currentPayment: {
    id: "pay-123",
    invoiceId: "inv-001",
    amount: 1000,
    status: "captured",
    isPosted: false
  },
  success: "Payment created successfully"
}
```

### UI Display
```
Current Payment:
  Payment ID: pay-123
  Amount: $1,000.00
  Status: 🟡 Captured

[Post Payment Button] (visible because isPosted = false)
```

---

## Step 5: User Clicks "Post Payment"

### Frontend Thunk
```typescript
// App.tsx
const handlePostPayment = async () => {
  dispatch(postPayment({
    paymentId: paymentsState.currentPayment.id
  }));
};

// paymentsSlice.ts
export const postPayment = createAsyncThunk(
  "payments/post",
  async (params) => {
    return apiClient.postPayment(params.paymentId, params.idempotencyKey);
  }
);

// apiClient.ts
async postPayment(
  paymentId: string,
  idempotencyKey?: string
): Promise<PostingResult> {
  const response = await this.client.post(
    `/api/v1/payments/${paymentId}/post`,
    { paymentId, idempotencyKey }
  );
  return response.data.data as PostingResult;
}
```

### HTTP Request
```http
POST /api/v1/payments/pay-123/post
Content-Type: application/json

{
  "paymentId": "pay-123",
  "idempotencyKey": null
}
```

---

## Step 6: Backend Posting Service

### Route → Controller
```typescript
// routes/index.ts
router.post(
  "/api/v1/payments/:paymentId/post",
  asyncHandler(paymentController.postPayment)
);

// controllers/index.ts
postPayment = async (req: Request, res: Response) => {
  const payload = PostPaymentSchema.parse(req.body);
  const result = await this.cradle.paymentPostingService.postPayment(payload);
  res.json(successResponse("Payment posted successfully", result));
};
```

### Service Layer
```typescript
// services/paymentPostingService.ts
export class PaymentPostingService implements IPaymentPostingService {
  constructor(
    private readonly paymentRepository: IPaymentRepository,
    private readonly journalRepository: JournalEntryRepository,
    private readonly accountRepository: AccountRepository
  ) {}

  async postPayment(payload: PostingPayload): Promise<PostingResult> {
    // 1. Fetch payment
    const payment = await this.paymentRepository.findById("pay-123");
    
    // 2. Check idempotency
    if (payment.isPosted) {
      return {
        success: true,
        message: "Already posted"
      };
    }

    // 3. Fetch accounts
    const bankAccount = await this.accountRepository.findByCode("1010");
    const arAccount = await this.accountRepository.findByCode("1200");

    // 4. Create journal entry (within transaction)
    const journalEntry = await prisma.journalEntry.create({
      data: {
        referenceType: "Payment",
        referenceId: "pay-123",
        description: "Payment posting for invoice (Amount: 1000)",
        entryDate: new Date(),
        status: "posted",
        lines: {
          create: [
            {
              accountId: bankAccount.id,
              debitAmount: 1000,
              creditAmount: 0,
              lineNumber: 1,
              description: "Payment received"
            },
            {
              accountId: arAccount.id,
              debitAmount: 0,
              creditAmount: 1000,
              lineNumber: 2,
              description: "Accounts receivable reduction"
            }
          ]
        }
      },
      include: { lines: true }
    });

    // 5. Mark payment as posted
    await this.paymentRepository.update("pay-123", {
      isPosted: true,
      postedAt: new Date()
    });

    return {
      success: true,
      journalEntryId: journalEntry.id,
      message: "Payment posted successfully"
    };
  }
}
```

### Database Transactions
```sql
BEGIN TRANSACTION;

-- Create journal entry
INSERT INTO "JournalEntry" (id, referenceType, referenceId, ...) 
VALUES ('je-789', 'Payment', 'pay-123', ...);

-- Create line 1: Debit Bank
INSERT INTO "JournalEntryLine" (journalEntryId, accountId, debitAmount, creditAmount, lineNumber)
VALUES ('je-789', 'acc-1010', 1000, 0, 1);

-- Create line 2: Credit AR
INSERT INTO "JournalEntryLine" (journalEntryId, accountId, debitAmount, creditAmount, lineNumber)
VALUES ('je-789', 'acc-1200', 0, 1000, 2);

-- Update payment
UPDATE "Payment" SET isPosted = true, postedAt = NOW() WHERE id = 'pay-123';

COMMIT;
```

---

## Step 7: Backend Response

### Response JSON
```json
{
  "message": "Payment posted successfully",
  "data": {
    "success": true,
    "paymentId": "pay-123",
    "journalEntryId": "je-789",
    "message": "Payment posted successfully"
  }
}
```

---

## Step 8: Frontend Receives Posting Result

### Redux Update
```typescript
// paymentsSlice.ts - postPayment.fulfilled
.addCase(postPayment.fulfilled, (state, action) => {
  state.success = action.payload.message;
})
```

### Fetch Accounting History
```typescript
// App.tsx - After posting
if (paymentsState.currentPayment) {
  dispatch(fetchPaymentAccounting(paymentsState.currentPayment.id));
}

// apiClient.ts
async getPaymentAccountingHistory(paymentId: string): Promise<AccountingHistory> {
  const response = await this.client.get(
    `/api/v1/payments/${paymentId}/accounting`
  );
  return response.data.data as AccountingHistory;
}
```

---

## Step 9: Fetch Accounting History

### Backend Route
```typescript
// routes/index.ts
router.get(
  "/api/v1/payments/:paymentId/accounting",
  asyncHandler(paymentController.getPaymentAccounting)
);

// controllers/index.ts
getPaymentAccounting = async (req: Request, res: Response) => {
  const { paymentId } = req.params;
  const history = await this.cradle.paymentAccountingService
    .getPaymentAccountingHistory(paymentId);
  res.json(successResponse("Payment accounting history retrieved", history));
};
```

### Service Layer
```typescript
// services/paymentAccountingService.ts
async getPaymentAccountingHistory(paymentId: string): Promise<AccountingHistory> {
  // Fetch the payment
  const payment = await this.paymentRepository.findById(paymentId);
  
  // Fetch journal entries
  const journalEntries = await prisma.journalEntry.findMany({
    where: { referenceId: paymentId },
    include: { lines: true }
  });

  // Fetch refunds
  const refunds = await prisma.refund.findMany({
    where: { paymentId }
  });

  return {
    paymentId,
    amount: payment.amount,
    status: payment.status,
    isPosted: payment.isPosted,
    journalEntries,
    refunds
  };
}
```

### Database Query
```sql
SELECT * FROM "JournalEntry" WHERE referenceId = 'pay-123';
SELECT * FROM "JournalEntryLine" WHERE journalEntryId = 'je-789';
SELECT * FROM "Refund" WHERE paymentId = 'pay-123';
```

---

## Step 10: Frontend Displays Journal Entry

### Response
```json
{
  "data": {
    "paymentId": "pay-123",
    "amount": 1000,
    "status": "captured",
    "isPosted": true,
    "journalEntries": [
      {
        "id": "je-789",
        "referenceType": "Payment",
        "referenceId": "pay-123",
        "description": "Payment posting for invoice (Amount: 1000)",
        "entryDate": "2024-08-30T10:01:00Z",
        "status": "posted",
        "lines": [
          {
            "id": "jel-1",
            "accountId": "acc-1010",
            "debitAmount": 1000,
            "creditAmount": 0,
            "lineNumber": 1,
            "description": "Payment received"
          },
          {
            "id": "jel-2",
            "accountId": "acc-1200",
            "debitAmount": 0,
            "creditAmount": 1000,
            "lineNumber": 2,
            "description": "Accounts receivable reduction"
          }
        ]
      }
    ],
    "refunds": []
  }
}
```

### Redux Update
```typescript
// paymentsSlice.ts - fetchPaymentAccounting.fulfilled
.addCase(fetchPaymentAccounting.fulfilled, (state, action) => {
  state.accounting = action.payload;
})
```

### Component Rendering
```typescript
// App.tsx
<JournalEntryTable
  entries={paymentsState.accounting.journalEntries}
  loading={paymentsState.loading}
/>
```

### UI Display
```
Accounting History

Entry: Payment - Payment posting for invoice (Amount: 1000)  Status: Posted
Date: Aug 30, 2024

Account      | Debit  | Credit | Description
─────────────┼────────┼────────┼──────────────────────────
Cash / Bank  | 1000   |    -   | Payment received
AR           |    -   | 1000   | Accounts receivable reduction
─────────────┴────────┴────────┴──────────────────────────
TOTALS       | 1000   | 1000   | BALANCED ✓
```

---

## Complete Contract Chain

```
Payment Capture:
  Payment {captured, isPosted=false}

User Action:
  Click "Post Payment" → dispatch(postPayment)

Frontend:
  apiClient → HTTP POST /api/v1/payments/pay-123/post

Backend Route:
  → paymentController.postPayment()

Backend Controller:
  → Parse & validate schema
  → Call paymentPostingService.postPayment()

Backend Service (Contract):
  → IPaymentRepository.findById()
  → IAccountRepository.findByCode("1010")
  → IAccountRepository.findByCode("1200")
  → IJournalEntryRepository.create()
  → IPaymentRepository.update()

Database:
  → INSERT JournalEntry
  → INSERT JournalEntryLine (2 lines)
  → UPDATE Payment

Backend Response:
  PostingResult {success, journalEntryId}

Frontend Redux:
  → postPayment.fulfilled reducer
  → Dispatch fetchPaymentAccounting

Frontend Component:
  → JournalEntryTable displays posting

User Sees:
  ✓ Posted status
  ✓ Journal entries with debit/credit
  ✓ Balanced accounting entry
```

This trace shows how a single business operation (posting a payment) flows through all system layers using contracts and dependency injection, ending with a fully typed UI display.
