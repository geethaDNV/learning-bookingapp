# 02 - Email Provider Contract

## The Problem

Email delivery is complicated:
- Network failures
- Invalid recipient addresses
- Rate limits
- Domain verification (if using Resend free tier)
- Different providers have different APIs

We solve this with **contract-based abstraction**.

## The Solution: IEmailService Contract

All email providers implement the same interface:

```typescript
export interface IEmailService {
  sendInvoiceEmail(input: SendInvoiceEmailInput): Promise<SendEmailResult>;
  validateEmail(email: string): boolean;
}
```

This means:
- **Controller** doesn't know if it's Mock or Resend
- **Testing** is easy (use Mock)
- **Production** can be Resend
- **Switching** is one config change

## Mock Email Service

**File:** `backend/src/services/mockEmailService.ts`

Perfect for **local development and testing**.

### What It Does

```typescript
const mockService = new MockEmailService('noreply@example.com');

await mockService.sendInvoiceEmail({
  to: 'customer@example.com',
  cc: ['cc@example.com'],
  subject: 'Invoice INV-2024-001',
  body: '<p>Thank you!</p>',
  invoiceNumber: 'INV-2024-001',
});
```

### Output

Logs to console:
```
[MockEmailService] Email sent successfully: {
  timestamp: "2024-08-30T...",
  provider: "mock",
  from: "noreply@example.com",
  to: "customer@example.com",
  cc: "cc@example.com",
  bcc: "none",
  subject: "Invoice INV-2024-001",
  bodyPreview: "Thank you!...",
  hasAttachment: false,
  messageId: "mock_1725027600000_abcd1234"
}
```

### Why It's Perfect for Learning

1. **No external API calls** - no rate limits, no API key needed
2. **Simulates delay** - `await new Promise(...)` to feel like real network
3. **Validates like real provider** - checks email format, handles CC/BCC
4. **Stores history** - `getSentEmails()` for testing assertions
5. **Deterministic** - same input always same output

## Resend Email Service

**File:** `backend/src/services/resendEmailService.ts`

For **production or staging** when you want real email delivery.

### What It Does

```typescript
const resendService = new ResendEmailService(
  're_xxx...', // API key from environment
  'invoices@company.com'
);

await resendService.sendInvoiceEmail({
  to: 'customer@example.com',
  subject: 'Invoice INV-2024-001',
  body: '<p>Thank you!</p>',
  invoicePdfBuffer: pdfBytes,
  invoiceNumber: 'INV-2024-001',
});
```

### Validates Recipients

Before calling Resend API:
```typescript
// Check to address
if (!this.validateEmail(input.to)) {
  throw new ValidationError('Invalid recipient email');
}

// Check CC addresses
if (input.cc && input.cc.length > 0) {
  const invalidCc = input.cc.filter(e => !this.validateEmail(e));
  if (invalidCc.length > 0) {
    throw new ValidationError('Invalid CC email');
  }
}

// Check BCC addresses
if (input.bcc && input.bcc.length > 0) {
  const invalidBcc = input.bcc.filter(e => !this.validateEmail(e));
  if (invalidBcc.length > 0) {
    throw new ValidationError('Invalid BCC email');
  }
}
```

### Builds Email Payload

```typescript
const emailPayload = {
  from: this.emailFrom,           // 'invoices@company.com'
  to: input.to,                   // Customer email
  subject: input.subject,         // Invoice subject
  html: input.body,               // HTML body
  cc: input.cc,                   // Optional
  bcc: input.bcc,                 // Optional
  attachments: [                  // Optional
    {
      filename: 'INV-2024-001.pdf',
      content: pdfBuffer,
    }
  ]
};
```

### Calls Resend API

```typescript
const response = await this.resendClient.emails.send(emailPayload);
```

Returns:
- Success: `{ data: { id: 'msg_1234...' }, error: null }`
- Failure: `{ data: null, error: { message: '...' } }`

### Handles Errors

```typescript
if (response.error) {
  if (response.error.message?.includes('not verified')) {
    // Domain not verified (Resend free tier)
    return {
      success: false,
      error: 'Email domain not verified...',
    };
  }
  
  // Other API errors
  return {
    success: false,
    error: response.error.message,
  };
}
```

## Configuration

In **`.env`**:

```bash
# For development (uses MockEmailService)
EMAIL_PROVIDER=mock
EMAIL_FROM=noreply@invoicedemo.local

# For production (uses ResendEmailService)
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_xxx...
EMAIL_FROM=invoices@company.com
```

## How DI Wires Them

In `backend/src/di/container.ts`:

```typescript
if (config.email.provider === 'resend') {
  if (!config.email.apiKey) {
    console.warn('RESEND_API_KEY not configured. Using Mock.');
    this.emailService = new MockEmailService(config.email.from);
  } else {
    this.emailService = new ResendEmailService(
      config.email.apiKey,
      config.email.from
    );
    console.log('[DI] Using Resend email provider');
  }
} else {
  this.emailService = new MockEmailService(config.email.from);
  console.log('[DI] Using Mock email provider');
}
```

No other code cares which provider is used. They just use `IEmailService`.

## Provider Comparison

| Feature | Mock | Resend |
|---------|------|--------|
| **Cost** | Free | Free tier + paid |
| **When to use** | Development | Production |
| **Setup** | Just works | Requires API key |
| **Domain verification** | No | Yes (free tier) |
| **Real delivery** | No | Yes |
| **Bounce handling** | No | Yes |
| **Analytics** | No | Yes |
| **Logging** | Console | Resend dashboard |
| **Speed** | Instant (simulated) | Network dependent |

## Next Steps

1. Read **03-send-invoice-email-api.md** to see how the API uses these services
2. Explore `backend/src/services/mockEmailService.ts` and `resendEmailService.ts`
3. Read **10-contracts-di-and-typing.md** to understand the DI pattern
