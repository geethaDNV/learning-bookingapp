# 09 - Error Handling

## Error Types

### 1. Validation Errors (400)

**Cause:** User input is invalid

**Examples:**
- Invalid email format
- Subject too long
- Missing required field

**Response:**
```json
{
  "success": false,
  "message": "Validation error",
  "errors": {
    "to": ["Invalid email address"],
    "subject": ["Subject is too long"]
  }
}
```

**Handling:**
```typescript
try {
  await sendEmail(data);
} catch (error) {
  if (error.response?.status === 400) {
    // Show field-level errors
    const errors = error.response.data.errors;
    // Display: "to: Invalid email address"
    // Display: "subject: Subject is too long"
  }
}
```

### 2. Not Found Errors (404)

**Cause:** Invoice or customer doesn't exist

**Response:**
```json
{
  "success": false,
  "message": "Invoice with id inv-999 not found",
  "code": "NOT_FOUND"
}
```

**Handling:**
```typescript
// Backend should load invoice before sending
if (!invoice) {
  throw new NotFoundError('Invoice', invoiceId);
}

// Frontend should catch and show:
// "This invoice no longer exists. Please refresh."
```

### 3. Provider Errors (500)

**Cause:** Email service (Resend) failed

**Examples:**
- Domain not verified (Resend free tier)
- API rate limited
- API key invalid
- Network timeout

**Response:**
```json
{
  "success": false,
  "message": "Email domain not verified. Dev tier can only send to verified addresses.",
  "code": "RESEND_VERIFICATION_ERROR"
}
```

**Handling:**
```typescript
// 1. Check error code for specific guidance
if (error.code === 'RESEND_VERIFICATION_ERROR') {
  console.error('Domain not verified. Use mock provider or verify in Resend.');
}

// 2. Generic message to user
onError('Failed to send email. Please try again.');

// 3. Retry logic
setTimeout(() => {
  // Retry with exponential backoff
}, 1000 * attempt);
```

### 4. Network Errors

**Cause:** Network timeout, backend down, CORS issue

**Handling:**
```typescript
try {
  await invoiceEmailApi.sendInvoiceEmail(invoiceId, payload);
} catch (error) {
  if (error instanceof AxiosError) {
    if (error.code === 'ECONNABORTED') {
      // Timeout
      onError('Request timed out. Please try again.');
    } else if (error.code === 'ERR_NETWORK') {
      // Network error
      onError('Network error. Check your connection.');
    } else if (error.response?.status === 0) {
      // CORS error
      onError('API connection failed. Contact support.');
    }
  }
}
```

## Error Handling Strategy

### Frontend Error Handling

**File:** `frontend/src/components/SendEmailDialog.tsx`

```typescript
const onSubmit = async (data: SendEmailFormSchemaType) => {
  try {
    setLoading(true);

    // Step 1: Validate form locally (Zod)
    // → if invalid, Zod prevents submit

    // Step 2: Parse CSV emails
    const ccEmails = parseEmailCSV(data.cc);
    const bccEmails = parseEmailCSV(data.bcc);

    // Step 3: Generate PDF if needed
    if (data.attachPdf) {
      try {
        const pdfBlob = await generatePdfBlob(invoiceElement);
        // proceed with PDF
      } catch (pdfError) {
        // If PDF generation fails:
        // Option A: Show error and don't send
        throw new Error('Failed to generate PDF');
        
        // Option B: Uncheck attachPdf and retry
        // data.attachPdf = false;
      }
    }

    // Step 4: Call API
    const response = await invoiceEmailApi.sendInvoiceEmail(invoiceId, {
      to: data.to,
      cc: ccEmails.length > 0 ? ccEmails : undefined,
      bcc: bccEmails.length > 0 ? bccEmails : undefined,
      subject: data.subject,
      body: data.body,
      attachPdf: data.attachPdf,
      paymentLink: data.paymentLink,
    });

    // Step 5: Handle response
    if (!response.success) {
      throw new Error(response.error || response.message);
    }

    // Success
    if (onSuccess) onSuccess(response);
    reset();
    onClose();

  } catch (error) {
    // Log for debugging
    console.error('Send email error:', error);

    // Call error callback
    if (onError) {
      onError(
        error instanceof Error
          ? error
          : {
              success: false,
              message: 'Unknown error',
              timestamp: new Date().toISOString(),
            }
      );
    }

    // Optionally: show error toast in component
    // setErrorMessage(error.message);
  } finally {
    setLoading(false);
  }
};
```

### Backend Error Handling

**File:** `backend/src/middleware/errorHandler.ts`

```typescript
export const errorHandler = (
  err: Error | ZodError | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // 1. Zod validation error
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: err.flatten().fieldErrors,
      timestamp: new Date().toISOString(),
    });
  }

  // 2. Custom validation error
  if (err instanceof ValidationError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
      details: err.details,
      timestamp: new Date().toISOString(),
    });
  }

  // 3. Not found error
  if (err instanceof NotFoundError) {
    return res.status(404).json({
      success: false,
      message: err.message,
      code: 'NOT_FOUND',
      timestamp: new Date().toISOString(),
    });
  }

  // 4. Custom app error
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
      timestamp: new Date().toISOString(),
    });
  }

  // 5. Unexpected error
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    code: 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV === 'development' && {
      details: err.message,
    }),
    timestamp: new Date().toISOString(),
  });
};
```

## Error Messages

### User-Friendly Messages

**✓ Good:**
```
"Invalid email: customer@"
"Subject is too long (max 255 characters)"
"Email domain not verified. Use Mock provider for testing."
```

**✗ Bad:**
```
"Validation error"
"Internal server error"
"TypeError: Cannot read property 'email' of undefined"
```

### Error Message Patterns

```typescript
// Pattern 1: What went wrong + how to fix
"Invalid email: ${email}. Use format: user@domain.com"

// Pattern 2: Constraint exceeded
"Subject is too long (${length}/${MAX}). Please shorten it."

// Pattern 3: External service error + guidance
"Email domain not verified (Resend). ${actionItems}"

// Pattern 4: Retry suggestion
"Failed to send email. Please try again in a moment."
```

## Retry Strategy

### Automatic Retry (Backend)

```typescript
async function sendWithRetry(input, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await emailService.send(input);
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
      
      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

### User-Initiated Retry (Frontend)

```typescript
const handleRetry = async () => {
  setLoading(true);
  try {
    await onSubmit(formValues);
  } finally {
    setLoading(false);
  }
};
```

## Logging

### Backend Logging

```typescript
// In email service
console.log('[EmailService] Sending email to:', input.to);
console.error('[EmailService] Send failed:', error.message);

// In controller
console.log('[Controller] Email request received');
console.log('[Controller] Email sent successfully:', response.messageId);

// In middleware
console.error('[ErrorHandler] Unhandled error:', err);
```

### Frontend Logging

```typescript
// API interceptor
apiClient.interceptors.response.use(
  response => {
    console.log(`[API] ${response.status} ${response.config.url}`);
    return response;
  },
  error => {
    console.error(`[API] ${error.response?.status} ${error.config?.url}`);
    return Promise.reject(error);
  }
);
```

## Testing Error Scenarios

### Test Case 1: Invalid Email

```bash
curl -X POST http://localhost:4000/api/v1/invoices/inv-001/send-email \
  -H "Content-Type: application/json" \
  -d '{"to": "not-an-email"}'

# Expected:
# 400 Bad Request
# { errors: { to: ["Invalid email address"] } }
```

### Test Case 2: Missing Required Field

```bash
curl -X POST http://localhost:4000/api/v1/invoices/inv-001/send-email \
  -H "Content-Type: application/json" \
  -d '{"cc": ["cc@example.com"]}'

# Expected:
# 400 Bad Request
# { errors: { to: ["Required"] } }
```

### Test Case 3: Invoice Not Found

```bash
curl -X POST http://localhost:4000/api/v1/invoices/inv-999/send-email \
  -H "Content-Type: application/json" \
  -d '{"to": "customer@example.com"}'

# Expected:
# 404 Not Found
# { message: "Invoice with id inv-999 not found" }
```

## Next Steps

1. Read **10-contracts-di-and-typing.md** to understand architecture
2. Review `backend/src/middleware/errorHandler.ts`
3. Review `backend/src/services/*.ts` for error patterns
4. Add comprehensive error messages to all user-facing operations
