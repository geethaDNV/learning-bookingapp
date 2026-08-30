# 08 - Frontend Send Email Dialog

## Overview

The `SendEmailDialog` component is the main UI for composing and sending invoice emails.

**File:** `frontend/src/components/SendEmailDialog.tsx`

## Component Props

```typescript
interface SendEmailDialogProps {
  invoiceId: string;                    // Invoice ID
  invoiceNumber: string;                // INV-2024-001
  customerEmail: string;                // Prefilled recipient
  onClose: () => void;                  // Called when dialog closes
  onSuccess?: (response: SendEmailResponse) => void;  // After successful send
  onError?: (error: ApiErrorResponse | Error) => void; // On error
}
```

## Form Structure

### Fields

1. **To** (required)
   - Pre-filled with customer email
   - Validated as email
   - Shown in feedback if invalid

2. **CC** (optional)
   - Comma-separated emails
   - Helper text: "Comma-separated email addresses"
   - Each email validated

3. **BCC** (optional)
   - Comma-separated emails
   - Helper text: "Comma-separated email addresses"
   - Hidden from main email

4. **Subject** (required)
   - Pre-filled with invoice subject
   - Max 255 characters
   - User can customize

5. **Body** (required)
   - Pre-filled with HTML template
   - Textarea for editing
   - HTML support (user can add tags)
   - Max 10000 characters

6. **Attach PDF** (checkbox)
   - Default: checked
   - Generates PDF from invoice
   - Shows as attachment in email

7. **Payment Link** (optional)
   - URL to payment page
   - Must be valid URL
   - Included in email body if provided

## Form Validation

Uses **React Hook Form + Zod**:

```typescript
const {
  register,
  handleSubmit,
  formState: { errors },
  watch,
  reset,
} = useForm<SendEmailFormSchemaType>({
  resolver: zodResolver(sendEmailFormSchema),
  defaultValues: {
    to: customerEmail,
    cc: '',
    bcc: '',
    subject: `Invoice ${invoiceNumber}`,
    body: `<p>Dear Valued Customer...</p>`,
    attachPdf: true,
    paymentLink: '',
  },
});
```

### Validation Rules

| Field | Validation | Error Message |
|-------|-----------|-----------------|
| to | email, required | "Invalid email address" |
| cc | optional, each email valid | "Invalid CC recipient" |
| bcc | optional, each email valid | "Invalid BCC recipient" |
| subject | required, max 255 | "Subject too long" |
| body | required, max 10000 | "Body too long" |
| paymentLink | valid URL or empty | "Invalid URL" |
| attachPdf | boolean | N/A |

## User Flows

### Flow 1: Send with Defaults

```
┌─────────────────────────────────┐
│ SendEmailDialog opens           │
│ Fields pre-filled               │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ User reviews email content      │
│ (subject, body, recipient)      │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ User clicks "Send Email"        │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ Form validates (Zod)            │
│ - All required fields present   │
│ - Email format valid            │
│ - No length exceeded            │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ If attachPdf checked:           │
│ - Generate PDF from HTML        │
│ - Convert to base64             │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ Call API: POST /send-email      │
│ Loading state: true             │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ Backend processes               │
│ Sends through provider          │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ Response received               │
│ - success: true                 │
│ - messageId: "..."              │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ Dialog closes                   │
│ onSuccess() callback called     │
│ Parent shows success message    │
└─────────────────────────────────┘
```

### Flow 2: Customize Before Sending

```
Dialog opens
  │
  ├─ Click "Preview" button
  │  │
  │  ├─ API call: GET /preview-email
  │  │  └─ Backend renders email template
  │  │
  │  └─ Show preview panel
  │     ├─ Subject preview
  │     └─ Body HTML preview (first 300 chars)
  │
  ├─ Click "Back to Form"
  │  └─ Return to form
  │
  ├─ Edit subject/body
  │  │
  │  ├─ User clicks "Preview" again
  │  │  └─ Shows updated content
  │  │
  │  └─ User clicks "Send Email"
  │     └─ Send with customizations
  │
  └─ Dialog closes
```

### Flow 3: Error Handling

```
Form submission
  │
  ├─ Validation error (client)
  │  ├─ Show field error message
  │  ├─ Highlight invalid field
  │  └─ Wait for user fix
  │
  ├─ API error (server)
  │  ├─ onError callback called
  │  ├─ Parent shows error message
  │  ├─ Dialog stays open
  │  └─ User can retry or fix values
  │
  └─ Network error
     ├─ Catch block triggered
     ├─ Error message shown
     └─ User can retry
```

## Component State

```typescript
const [loading, setLoading] = useState(false);      // API call in progress
const [showPreview, setShowPreview] = useState(false); // Preview panel visible
const [previewContent, setPreviewContent] = useState<...>(null); // Preview data
```

### State Transitions

```
Initial
├─ loading: false
├─ showPreview: false
└─ previewContent: null

After "Preview" click
├─ loading: true (fetching preview)
│
After preview received
├─ loading: false
├─ showPreview: true
└─ previewContent: { subject, body }

After "Back to Form"
├─ showPreview: false
└─ previewContent: still cached

After "Send Email"
├─ loading: true (sending email)
│
After send response
├─ loading: false
├─ If success:
│  ├─ Dialog closes
│  └─ onSuccess() called
│
└─ If error:
   ├─ Dialog stays open
   └─ onError() called
```

## UI Breakdown

```
┌─────────────────────────────────────────────┐
│ Dialog Header                               │
├─ "Send Invoice Email" title                 │
├─ Close button (X)                           │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Form or Preview                             │
│                                             │
│ [Form Mode]                                 │
│ ┌──────────────────────────────────────┐    │
│ │ To:                                  │    │
│ │ ├─ Input: [customer@acme.com]        │    │
│ │ └─ Error: (if invalid)               │    │
│ ├─ CC:                                 │    │
│ │ ├─ Input: [                        ] │    │
│ │ └─ Hint: "Comma-separated..."        │    │
│ ├─ BCC:                                │    │
│ │ ├─ Input: [                        ] │    │
│ │ └─ Hint: "Comma-separated..."        │    │
│ ├─ Subject:                            │    │
│ │ ├─ Input: [Invoice INV-2024-001]    │    │
│ │ └─ Error: (if too long)              │    │
│ ├─ Body:                               │    │
│ │ ├─ Textarea: [<p>Dear...</p>]        │    │
│ │ ├─ Error: (if too long)              │    │
│ │ └─ Hint: "Supports HTML"             │    │
│ ├─ Payment Link:                       │    │
│ │ ├─ Input: [https://pay.com/...]      │    │
│ │ └─ Hint: "Optional link"             │    │
│ ├─ ☑ Attach PDF                        │    │
│ └─ Buttons:                            │    │
│    ├─ "Preview" (secondary)            │    │
│    ├─ "Cancel" (secondary)             │    │
│    └─ "Send Email" (primary)           │    │
│                                        │    │
│ [Preview Mode]                         │    │
│ ┌──────────────────────────────────────┐    │
│ │ Preview                              │    │
│ │ ├─ "Back to Form" button             │    │
│ │ ├─ Subject: Invoice INV-2024-001     │    │
│ │ └─ Body (first 300 chars):           │    │
│ │    <h2>Invoice</h2>...               │    │
│ └──────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

## Styling

**File:** `frontend/src/components/SendEmailDialog.module.css`

Uses CSS modules for scoping:
- `.dialog` - main modal backdrop + container
- `.form` - form layout
- `.formGroup` - field + label group
- `.inputError` - red border for invalid fields
- `.error` - red text error message
- `.buttonPrimary` - blue send button
- `.buttonSecondary` - gray cancel/preview button
- `.preview` - preview panel layout

## Error Handling

### Frontend Validation Error

```typescript
// Form not valid (Zod caught it)
if (errors.to) {
  // Show: "Invalid email address"
}
```

### API Validation Error

```typescript
// Backend returned 400
{
  "success": false,
  "message": "Validation error",
  "errors": {
    "cc": ["Invalid email addresses: bad@example"]
  }
}

// Handler:
onError(response);  // Pass to parent, show in toast
```

### API Server Error

```typescript
// Backend returned 500
{
  "success": false,
  "message": "Failed to send email",
  "code": "INTERNAL_ERROR"
}

// Handler:
try {
  await sendInvoiceEmail(...);
} catch (error) {
  onError(error);
}
```

## Accessibility

- Form labels linked to inputs with `htmlFor`
- Required fields marked with `<span className={styles.required}>*</span>`
- Error messages associated with fields
- Buttons disabled during loading
- Dialog overlay clickable to close
- Escape key not implemented (would need `onKeyDown`)

## Performance Considerations

1. **Lazy PDF generation** - only when user clicks "Send" and `attachPdf` checked
2. **Debounce preview** - one API call per preview, not per keystroke
3. **CSS modules** - scoped styles avoid conflicts
4. **Form state** - React Hook Form minimizes re-renders

## Next Steps

1. Read **09-error-handling.md** for error strategies
2. Read **10-contracts-di-and-typing.md** for type safety
3. Explore `SendEmailDialog.tsx` implementation
4. Study `invoiceEmailApi.ts` for API integration
