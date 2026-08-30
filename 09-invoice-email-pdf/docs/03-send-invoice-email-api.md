# 03 - Send Invoice Email API

## Endpoint

```
POST /api/v1/invoices/{invoiceId}/send-email
Content-Type: application/json
```

## Request Payload

```typescript
interface SendInvoiceEmailRequest {
  to: string;              // Required: recipient email
  cc?: string[];           // Optional: carbon copy emails
  bcc?: string[];          // Optional: blind carbon copy emails
  subject?: string;        // Optional: email subject (auto-generated if omitted)
  body?: string;           // Optional: email body HTML (auto-generated if omitted)
  attachPdf?: boolean;     // Optional: attach invoice PDF (default: true)
  paymentLink?: string;    // Optional: payment URL to include in body
}
```

## Validation (Zod Schema)

**File:** `backend/src/utils/validationSchemas.ts`

```typescript
const emailSchema = z
  .string()
  .email('Invalid email address')
  .max(254, 'Email is too long');

const sendInvoiceEmailRequestSchema = z.object({
  to: emailSchema,                    // Required, must be valid email
  cc: z.array(emailSchema).optional(),
  bcc: z.array(emailSchema).optional(),
  subject: z.string().max(255).optional(),
  body: z.string().max(10000).optional(),
  attachPdf: z.boolean().default(true),
  paymentLink: z.string().url().optional(),
});
```

## Example Request

```bash
curl -X POST http://localhost:4000/api/v1/invoices/inv-001/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "customer@acme.com",
    "cc": ["finance@acme.com"],
    "bcc": ["audit@company.com"],
    "subject": "Invoice INV-2024-001",
    "body": "<h2>Invoice</h2><p>Amount: ₹10,000</p><p>Due: 2024-09-30</p>",
    "attachPdf": true,
    "paymentLink": "https://pay.razorpay.com/invoice/inv_123"
  }'
```

## Response (Success)

**Status: 200 OK**

```json
{
  "success": true,
  "message": "Email sent successfully",
  "messageId": "msg_1725027600000_abcd1234",
  "provider": "mock",
  "timestamp": "2024-08-30T12:34:56.789Z"
}
```

## Response (Validation Error)

**Status: 400 Bad Request**

```json
{
  "success": false,
  "message": "Validation error",
  "errors": {
    "to": [
      "Invalid email address"
    ],
    "subject": [
      "Subject is too long"
    ]
  },
  "timestamp": "2024-08-30T12:34:56.789Z"
}
```

## Response (Provider Error)

**Status: 500 Internal Server Error**

```json
{
  "success": false,
  "message": "Email domain not verified. Dev tier can only send to verified addresses.",
  "code": "RESEND_VERIFICATION_ERROR",
  "timestamp": "2024-08-30T12:34:56.789Z"
}
```

## Common Errors

### 1. Invalid Recipient Email

**Request:**
```json
{ "to": "not-an-email" }
```

**Response:**
```json
{
  "success": false,
  "message": "Validation error",
  "errors": {
    "to": ["Invalid email address"]
  }
}
```

**Fix:** Use valid email format `user@domain.com`

### 2. Invalid CC Email

**Request:**
```json
{
  "to": "customer@acme.com",
  "cc": ["valid@acme.com", "invalid-email"]
}
```

**Response:**
```json
{
  "success": false,
  "message": "Validation error",
  "errors": {
    "cc": ["Invalid email addresses: invalid-email"]
  }
}
```

**Fix:** All CC/BCC must be valid emails

### 3. Email Too Long

**Request:**
```json
{
  "to": "customer@acme.com",
  "subject": "A" (repeated 256 times)
}
```

**Response:**
```json
{
  "success": false,
  "message": "Validation error",
  "errors": {
    "subject": ["Subject is too long"]
  }
}
```

**Fix:** Keep subject ≤ 255 characters

### 4. Resend API Key Missing (when using Resend)

**Response:**
```json
{
  "success": false,
  "message": "Resend API key is not configured",
  "code": "INTERNAL_ERROR"
}
```

**Fix:** Set `RESEND_API_KEY` in `.env`

### 5. Domain Not Verified (Resend free tier)

**Response:**
```json
{
  "success": false,
  "message": "Email domain not verified. Dev tier can only send to verified addresses.",
  "code": "RESEND_VERIFICATION_ERROR"
}
```

**Fix:** 
- Use Mock provider for development
- Or verify domain in Resend dashboard
- Or use pre-verified sender address

## Email Preview Endpoint

Sometimes you want to see what will be sent without actually sending.

```
GET /api/v1/invoices/{invoiceId}/preview-email?to=customer@example.com&body=custom%20text
```

**Response:**
```json
{
  "subject": "Invoice INV-2024-001",
  "body": "<html>...full HTML body...</html>",
  "bodyHtml": "<html>...full HTML body...</html>",
  "recipientEmail": "customer@example.com",
  "timestamp": "2024-08-30T12:34:56.789Z"
}
```

This is useful for:
- Frontend preview dialog
- Testing email templates
- Debugging formatting issues

## HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Email sent successfully | Success response |
| 400 | Validation error | Invalid email format |
| 404 | Invoice not found | Invoice ID doesn't exist |
| 500 | Server/provider error | Resend API down |

## Implementation Details

### Backend Processing

1. **Parse & Validate Request**
   - Zod schema parsing
   - Returns 400 if validation fails

2. **Load Invoice & Customer Data**
   - Query invoice repository
   - Query customer repository
   - Throw 404 if not found

3. **Prepare Email Content**
   - Format subject
   - Format body (with placeholders)
   - Include payment link if provided

4. **Call Email Provider**
   - Mock: logs to console
   - Resend: calls Resend API

5. **Handle Response**
   - Success: return messageId
   - Error: return error message

### Frontend Processing

```typescript
// Collect form values
const values = {
  to: 'customer@acme.com',
  cc: 'cc1@acme.com, cc2@acme.com',  // CSV string
  subject: 'Invoice INV-2024-001',
  body: '<p>Please pay...</p>',
};

// Parse CSV to array
const cc = values.cc
  .split(',')
  .map(e => e.trim())
  .filter(e => e.length > 0);

// Call API
const response = await invoiceEmailApi.sendInvoiceEmail(invoiceId, {
  to: values.to,
  cc,
  subject: values.subject,
  body: values.body,
  attachPdf: true,
});

// Handle result
if (response.success) {
  console.log('Email sent!', response.messageId);
} else {
  console.error('Error:', response.error);
}
```

## Next Steps

1. Read **04-recipient-validation.md** to understand email validation
2. Read **05-email-template-and-payment-link.md** to learn about templates
3. Explore `backend/src/controllers/invoiceEmailController.ts` to see the implementation
