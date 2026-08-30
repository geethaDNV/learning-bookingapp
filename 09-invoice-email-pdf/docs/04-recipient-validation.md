# 04 - Recipient Validation

## The Problem

Invalid email addresses cause providers to fail:
- Typos: `custumer@acme.com` instead of `customer@acme.com`
- Missing domain: `customer@` or `@acme.com`
- Wrong format: `customer acme.com` or `customer@acme`
- Duplicates: same email in `to`, `cc`, `bcc`

**Validation happens at TWO layers:**

1. **Frontend** - quick UX feedback before sending
2. **Backend** - security + prevents API calls

## Email Validation Regex

**Simple but effective:**
```typescript
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Matches:
EMAIL_REGEX.test('customer@acme.com');      // ✓ true
EMAIL_REGEX.test('alice+tag@company.co.uk'); // ✓ true

// Doesn't match:
EMAIL_REGEX.test('customer');               // ✗ false (no @)
EMAIL_REGEX.test('customer@');              // ✗ false (no domain)
EMAIL_REGEX.test('customer@acme');          // ✗ false (no TLD)
EMAIL_REGEX.test('customer acme.com');      // ✗ false (space)
```

## Validation Constraints

From `backend/src/constants/index.ts`:

```typescript
export const EMAIL_CONSTRAINTS = {
  MAX_EMAIL_LENGTH: 254,           // RFC 5321
  MAX_SUBJECT_LENGTH: 255,         // RFC 5322
  MAX_BODY_LENGTH: 10000,          // Practical limit
  MAX_CC_BCC_COUNT: 10,            // Prevent abuse
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
} as const;
```

## Validation Flow

### Backend Validation

In `backend/src/services/resendEmailService.ts`:

```typescript
async sendInvoiceEmail(input: SendInvoiceEmailInput): Promise<SendEmailResult> {
  // 1. Validate primary recipient (required)
  if (!this.validateEmail(input.to)) {
    throw new ValidationError('Invalid recipient email address');
  }

  // 2. Validate CC recipients
  if (input.cc && input.cc.length > 0) {
    const invalidCc = input.cc.filter(email => !this.validateEmail(email));
    if (invalidCc.length > 0) {
      throw new ValidationError('Invalid CC recipient', {
        cc: [`Invalid emails: ${invalidCc.join(', ')}`],
      });
    }
  }

  // 3. Validate BCC recipients
  if (input.bcc && input.bcc.length > 0) {
    const invalidBcc = input.bcc.filter(email => !this.validateEmail(email));
    if (invalidBcc.length > 0) {
      throw new ValidationError('Invalid BCC recipient', {
        bcc: [`Invalid emails: ${invalidBcc.join(', ')}`],
      });
    }
  }

  // 4. Proceed with email send...
}
```

**Helper method:**
```typescript
validateEmail(email: string): boolean {
  if (!email || email.length > EMAIL_CONSTRAINTS.MAX_EMAIL_LENGTH) {
    return false;
  }
  return EMAIL_CONSTRAINTS.EMAIL_REGEX.test(email);
}
```

### Frontend Validation

In `frontend/src/utils/validationSchemas.ts`:

```typescript
const emailSchema = z
  .string()
  .email('Invalid email address')    // Built-in Zod email validation
  .max(254, 'Email is too long');

const sendEmailFormSchema = z.object({
  to: emailSchema,                   // Must be valid email
  cc: z.string().optional(),         // Parsed from CSV in component
  bcc: z.string().optional(),        // Parsed from CSV in component
  subject: z.string().min(1).max(255),
  body: z.string().min(1).max(10000),
  attachPdf: z.boolean().default(true),
  paymentLink: z.string().url().optional().or(z.literal('')),
});
```

### Form Component

In `frontend/src/components/SendEmailDialog.tsx`:

```typescript
// Parse CSV string to validate each email
const parseEmailCSV = (csv: string): string[] => {
  return csv
    .split(',')
    .map((email) => email.trim())
    .filter((email) => email.length > 0);
};

// On form submit
const onSubmit = async (data: SendEmailFormSchemaType) => {
  // This runs ONLY if Zod validation passes
  
  // Parse CSV to arrays
  const ccEmails = data.cc ? parseEmailCSV(data.cc) : [];
  const bccEmails = data.bcc ? parseEmailCSV(data.bcc) : [];

  // Send to API (backend validates again)
  const response = await invoiceEmailApi.sendInvoiceEmail(invoiceId, {
    to: data.to,
    cc: ccEmails.length > 0 ? ccEmails : undefined,
    bcc: bccEmails.length > 0 ? bccEmails : undefined,
    // ...
  });
};
```

## Validation Examples

### Example 1: Valid Recipients

**Input:**
```json
{
  "to": "customer@acme.com",
  "cc": ["finance@acme.com"],
  "bcc": ["audit@company.com"]
}
```

**Result:** ✓ All pass validation

### Example 2: Invalid CC Email

**Input:**
```json
{
  "to": "customer@acme.com",
  "cc": "finance@acme.com, invalid-email"
}
```

**Frontend Error:**
- After parsing CSV: `["finance@acme.com", "invalid-email"]`
- Zod validation would catch this at submission

**Backend Response (400):**
```json
{
  "success": false,
  "message": "Validation error",
  "errors": {
    "cc": ["Invalid email addresses: invalid-email"]
  }
}
```

### Example 3: Email Too Long

**Input:**
```json
{
  "to": "this.is.a.very.long.email.address.that.exceeds.maximum.allowed.length@very.long.domain.name.example.com.extra.extra.extra.extra.extra.extra.extra.extra"
}
```

**Backend Response (400):**
```json
{
  "success": false,
  "message": "Validation error",
  "errors": {
    "to": ["Email is too long"]
  }
}
```

### Example 4: Too Many CC Recipients

**Input:**
```json
{
  "to": "customer@acme.com",
  "cc": ["cc1@a.com", "cc2@a.com", ..., "cc11@a.com"]  // 11 recipients
}
```

**Backend Response (400):**
```json
{
  "success": false,
  "message": "Validation error",
  "errors": {
    "cc": ["Too many CC recipients (max 10)"]
  }
}
```

## Why Double Validation?

| Layer | Purpose | Benefits |
|-------|---------|----------|
| Frontend | UX feedback | Instant error, no network round-trip |
| Backend | Security | Can't bypass client-side validation |
| Backend | Consistency | Protects against curl/Postman requests |

```
User enters: "customer acme.com"
    ↓
Frontend validation catches it
    ↓
Error message shown immediately
    ↓
User fixes it
    ↓
User enters: "customer@acme.com"
    ↓
Form submits
    ↓
Backend validates again
    ↓
Backend calls email provider
    ↓
Email sent
```

## Advanced: Real Email Validation

The regex approach catches syntax errors. Real validation could:

```typescript
// 1. Check if domain has MX records
const mxRecords = await dns.resolveMx('acme.com');

// 2. Send verification email (double opt-in)
await sendVerificationEmail('customer@acme.com');

// 3. Use third-party service (ZeroBounce, NeverBounce, etc.)
const isValid = await validationService.verify('customer@acme.com');
```

For learning, regex + Zod is sufficient.

## Next Steps

1. Read **05-email-template-and-payment-link.md** to learn email content
2. Explore `backend/src/services/*.ts` to see `validateEmail()` implementation
3. Read **03-send-invoice-email-api.md** for API error examples
