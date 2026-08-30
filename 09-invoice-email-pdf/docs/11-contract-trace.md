# 11 - Contract Trace: Email Request End-to-End

## Scenario

User clicks "Send Email" with these values:

```
To: customer@acme.com
CC: (empty)
Subject: Invoice INV-2024-001
Body: <p>Thank you for your business</p>
Attach PDF: yes
Payment Link: https://pay.razorpay.com/i/ABC123
```

This document **traces that request** through every layer.

## Step 1: Frontend - Form Validation

**File:** `frontend/src/components/SendEmailDialog.tsx`

```typescript
// User fills form and clicks "Send Email"
const onSubmit = async (data: SendEmailFormSchemaType) => {
  // Zod validates (this runs FIRST, before any async)
  // Schema is: sendEmailFormSchema
  
  // data is now type-safe:
  // {
  //   to: "customer@acme.com",
  //   cc: "",
  //   bcc: "",
  //   subject: "Invoice INV-2024-001",
  //   body: "<p>Thank you...</p>",
  //   attachPdf: true,
  //   paymentLink: "https://pay.razorpay.com/i/ABC123"
  // }
};
```

**Type check:**
```typescript
// ✓ Zod.infer extracts type
type SendEmailFormSchemaType = z.infer<typeof sendEmailFormSchema>;

// ✓ Form uses this type
const { formState } = useForm<SendEmailFormSchemaType>({ ... });

// ✓ onSubmit receives typed data
const onSubmit: SubmitHandler<SendEmailFormSchemaType> = async (data) => {
  // data.to is string (email guaranteed by Zod)
  // data.cc is string (optional, may be empty)
};
```

## Step 2: Frontend - Parse CSV, Generate PDF

**File:** `frontend/src/components/SendEmailDialog.tsx`

```typescript
// Parse CC/BCC CSV strings to arrays
const ccEmails = data.cc 
  ? parseEmailCSV(data.cc)  // "" → []
  : [];

const bccEmails = data.bcc 
  ? parseEmailCSV(data.bcc) // "" → []
  : [];

// Result:
// ccEmails = []
// bccEmails = []

// If attachPdf checked, generate PDF
if (data.attachPdf) {
  const invoiceElement = document.getElementById('invoice-print');
  const pdfBlob = await generatePdfBlob(invoiceElement);
  // pdfBlob: Blob (binary data)
}
```

## Step 3: Frontend - Build API Payload

**File:** `frontend/src/components/SendEmailDialog.tsx`

```typescript
// Build request payload
const payload: SendInvoiceEmailRequest = {
  to: "customer@acme.com",
  cc: [],          // Empty, so not included
  bcc: [],         // Empty, so not included
  subject: "Invoice INV-2024-001",
  body: "<p>Thank you...</p>",
  attachPdf: true,
  paymentLink: "https://pay.razorpay.com/i/ABC123",
};

// Type check:
// ✓ payload matches SendInvoiceEmailRequest interface
// ✓ All required fields present
// ✓ No extra fields
```

## Step 4: Frontend - Call API

**File:** `frontend/src/services/invoiceEmailApi.ts`

```typescript
// Make HTTP request
const response = await this.apiClient.post<SendEmailResponse>(
  `/api/v1/invoices/inv-001/send-email`,
  payload
);

// Axios handles:
// ✓ Serialization (object → JSON)
// ✓ HTTP headers (Content-Type: application/json)
// ✓ Network transmission
// ✓ Response parsing (JSON → object)

// Console logs (in dev):
// [API Request] POST /api/v1/invoices/inv-001/send-email
// { to: "customer@acme.com", ... }
```

## Step 5: HTTP Transport

```
Client                           Server
  │                                │
  │ POST /api/v1/invoices/inv-001/send-email │
  │ Content-Type: application/json             │
  │ {                                          │
  │   "to": "customer@acme.com",               │
  │   "subject": "Invoice INV-2024-001",       │
  │   "body": "<p>Thank you...</p>",           │
  │   "attachPdf": true,                       │
  │   "paymentLink": "https://pay.razorpay..." │
  │ }                                          │
  ├───────────────────────────────────────────►│
  │                                            │
  │                             Received by Express
  │                             req.body contains:
  │                             {
  │                               to: "customer@acme.com",
  │                               ...
  │                             }
  │
```

## Step 6: Backend - Express Handler

**File:** `backend/src/routes/invoiceEmailRoutes.ts`

```typescript
// Route handler invoked:
router.post('/:invoiceId/send-email', (req, res, next) => {
  controller.sendInvoiceEmail(req, res, next);
});

// req = {
//   method: 'POST',
//   path: '/invoices/inv-001/send-email',
//   params: { invoiceId: 'inv-001' },
//   body: {
//     to: 'customer@acme.com',
//     subject: 'Invoice INV-2024-001',
//     body: '<p>Thank you...</p>',
//     attachPdf: true,
//     paymentLink: 'https://pay.razorpay.com/i/ABC123'
//   }
// }
```

## Step 7: Backend - Controller Validation

**File:** `backend/src/controllers/invoiceEmailController.ts`

```typescript
async sendInvoiceEmail(req: Request, res: Response, next: NextFunction) {
  try {
    // 1. Validate route params
    const { invoiceId } = invoiceIdParamSchema.parse(req.params);
    // invoiceId = 'inv-001' ✓

    // 2. Validate request body
    const payload = sendInvoiceEmailRequestSchema.parse(req.body);
    // ✓ to: valid email
    // ✓ subject: max 255 chars
    // ✓ body: max 10000 chars
    // ✓ paymentLink: valid URL
    // ✓ attachPdf: boolean

    // payload = {
    //   to: 'customer@acme.com',
    //   subject: 'Invoice INV-2024-001',
    //   body: '<p>Thank you...</p>',
    //   attachPdf: true,
    //   paymentLink: 'https://pay.razorpay.com/i/ABC123',
    //   cc: undefined,
    //   bcc: undefined
    // }

    // 3. Call service
    const result = await this.invoiceEmailService.sendInvoiceEmail({
      to: payload.to,
      cc: payload.cc,
      bcc: payload.bcc,
      subject: payload.subject,
      body: payload.body,
      invoiceNumber: invoiceId,
      paymentLink: payload.paymentLink,
    });

  } catch (error) {
    next(error); // Pass to error handler
  }
}
```

**Type guarantee:**
```typescript
// Zod ensures payload has correct shape
// TypeScript ensures correct usage
// If field is missing or wrong type, compile error
```

## Step 8: Backend - Business Logic

**File:** `backend/src/services/invoiceEmailService.ts`

```typescript
async sendInvoiceEmail(input: SendInvoiceEmailInput): Promise<SendEmailResult> {
  // input = {
  //   to: 'customer@acme.com',
  //   subject: 'Invoice INV-2024-001',
  //   body: '<p>Thank you...</p>',
  //   invoiceNumber: 'inv-001',
  //   paymentLink: 'https://pay.razorpay.com/i/ABC123',
  //   cc: undefined,
  //   bcc: undefined,
  //   invoicePdfBuffer: undefined
  // }

  // Validate recipient
  if (!this.emailService.validateEmail(input.to)) {
    throw new ValidationError('Invalid recipient email address');
  }
  // 'customer@acme.com' ✓ valid

  // Call email service
  return this.emailService.sendInvoiceEmail(input);
}
```

## Step 9: Backend - Email Provider

**File:** `backend/src/services/mockEmailService.ts`

```typescript
async sendInvoiceEmail(input: SendInvoiceEmailInput): Promise<SendEmailResult> {
  // Simulate network delay
  await this.simulateDelay(200);

  // Validate primary recipient
  if (!this.validateEmail(input.to)) {
    return {
      success: false,
      error: `Invalid email address: ${input.to}`,
      provider: 'mock',
    };
  }
  // 'customer@acme.com' ✓

  // Validate subject/body
  if (!input.subject || !input.body || !input.invoiceNumber) {
    return {
      success: false,
      error: 'Missing required fields',
      provider: 'mock',
    };
  }
  // All present ✓

  // Generate message ID
  const messageId = `mock_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  // messageId = 'mock_1725027600000_abc123def'

  // Log email (in real provider, this calls API)
  console.log('[MockEmailService] Email sent:', {
    from: 'noreply@example.com',
    to: 'customer@acme.com',
    subject: 'Invoice INV-2024-001',
    bodyPreview: '<p>Thank you...</p>',
    messageId,
  });

  // Return success
  return {
    messageId,
    success: true,
    provider: 'mock',
  };
}
```

## Step 10: Backend - Response

```typescript
// Service returned: SendEmailResult
{
  messageId: 'mock_1725027600000_abc123def',
  success: true,
  provider: 'mock'
}

// Controller sends HTTP response:
res.status(200).json({
  success: true,
  message: 'Email sent successfully',
  messageId: 'mock_1725027600000_abc123def',
  provider: 'mock',
  timestamp: '2024-08-30T12:34:56.789Z'
});
```

## Step 11: HTTP Response

```
Server                           Client
  │                                │
  │ 200 OK                         │
  │ Content-Type: application/json │
  │ {                              │
  │   "success": true,             │
  │   "message": "Email sent...",  │
  │   "messageId": "mock_...",     │
  │   "provider": "mock",          │
  │   "timestamp": "2024-08-30..." │
  │ }                              │
  ├───────────────────────────────►│
  │                        Received by axios
```

## Step 12: Frontend - Handle Response

**File:** `frontend/src/services/invoiceEmailApi.ts`

```typescript
// Axios receives and parses response
const response = await this.apiClient.post<SendEmailResponse>(
  `/api/v1/invoices/inv-001/send-email`,
  payload
);

// response.data = {
//   success: true,
//   message: 'Email sent successfully',
//   messageId: 'mock_1725027600000_abc123def',
//   provider: 'mock',
//   timestamp: '2024-08-30T12:34:56.789Z'
// }

return response.data; // Type is SendEmailResponse ✓
```

## Step 13: Frontend - UI Update

**File:** `frontend/src/components/SendEmailDialog.tsx`

```typescript
const onSubmit = async (data: SendEmailFormSchemaType) => {
  try {
    setLoading(true);

    const response = await invoiceEmailApi.sendInvoiceEmail(invoiceId, {
      // ... payload ...
    });

    // response: SendEmailResponse
    // response.success = true

    if (response.success) {
      if (onSuccess) {
        onSuccess(response);
      }
      reset();
      onClose();
    }

  } catch (error) {
    if (onError) onError(error);
  } finally {
    setLoading(false);
  }
};
```

## Step 14: Parent Component Notification

**File:** `frontend/src/App.tsx`

```typescript
const handleSuccess = (response: SendEmailResponse) => {
  setStatus({
    type: 'success',
    message: `✓ Email sent successfully! Message ID: ${response.messageId || 'N/A'}`,
  });

  // Clear after 5 seconds
  setTimeout(() => setStatus(null), 5000);
};

// Render:
{status && (
  <div className={`statusMessage ${status.type}`}>
    {status.message}
  </div>
)}
```

**User sees:**
```
✓ Email sent successfully! Message ID: mock_1725027600000_abc123def
```

Dialog closes, form resets.

## Summary: Type Flow

```
Frontend Form (React Hook Form + Zod)
  │
  ▼
SendEmailFormSchemaType (user input, type-safe)
  │
  ├─ Parse CSV emails
  ├─ Generate PDF (Blob)
  │
  ▼
SendInvoiceEmailRequest (API payload)
  │
  ▼ (HTTP POST)
  
Backend Express Handler
  │
  ▼
Zod Validation (sendInvoiceEmailRequestSchema)
  │
  ▼
Controller receives typed payload
  │
  ▼
InvoiceEmailService (uses IEmailService interface)
  │
  ▼
MockEmailService.sendInvoiceEmail()
  │
  ▼
SendEmailResult (typed return)
  │
  ▼ (HTTP 200)
  
Frontend API Client
  │
  ▼
SendEmailResponse (axios parses as typed)
  │
  ▼
handleSuccess() updates UI
```

**Every step is type-safe. No `any` types!**

## Next Steps

1. Read **12-how-this-maps-to-production.md** to see production patterns
2. Trace a real request through the code:
   - Open frontend form
   - Click Send Email
   - Watch browser DevTools Network tab
   - Check backend console logs
   - See response
3. Try modifying a field and see validation errors
