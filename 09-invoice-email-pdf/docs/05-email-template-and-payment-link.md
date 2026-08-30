# 05 - Email Template and Payment Link

## Email Templates

Email content is templated but customizable.

### Template Structure

**File:** `backend/src/constants/index.ts`

```typescript
export const EMAIL_TEMPLATES = {
  // Subject template (function)
  INVOICE_SUBJECT: (invoiceNumber: string, orgName: string = 'Our Company') =>
    `Invoice ${invoiceNumber} from ${orgName}`,

  // Body template (HTML function)
  INVOICE_BODY_HTML: (params: {
    invoiceNumber: string;
    amount: string;
    dueDate: string;
    orgName: string;
    customerName?: string;
    paymentLink?: string;
  }) => { /* returns HTML string */ }
} as const;
```

### Generated Subject

```typescript
// Input
const invoiceNumber = 'INV-2024-001';
const orgName = 'Acme Corp';

// Template call
const subject = EMAIL_TEMPLATES.INVOICE_SUBJECT(invoiceNumber, orgName);

// Result
"Invoice INV-2024-001 from Acme Corp"
```

### Generated Body (HTML)

```typescript
const body = EMAIL_TEMPLATES.INVOICE_BODY_HTML({
  invoiceNumber: 'INV-2024-001',
  amount: '₹10,000.00',
  dueDate: '2024-09-30',
  orgName: 'Acme Corp',
  customerName: 'Acme Billing Department',
  paymentLink: 'https://pay.razorpay.com/invoice/inv_123',
});
```

**Result:**
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; color: #333; }
    .header { background-color: #f5f5f5; padding: 20px; text-align: center; }
    .payment-button { background-color: #007bff; color: white; padding: 10px 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Acme Corp</h2>
      <h3>Invoice INV-2024-001</h3>
    </div>
    
    <div class="content">
      <p>Dear Acme Billing Department,</p>
      
      <p>Thank you for your business! Please find the details of your invoice below.</p>
      
      <table>
        <tr>
          <td><strong>Invoice Number:</strong></td>
          <td>INV-2024-001</td>
        </tr>
        <tr>
          <td><strong>Amount:</strong></td>
          <td><strong>₹10,000.00</strong></td>
        </tr>
        <tr>
          <td><strong>Due Date:</strong></td>
          <td>2024-09-30</td>
        </tr>
      </table>
      
      <p style="text-align: center; margin-top: 20px;">
        <a href="https://pay.razorpay.com/invoice/inv_123" 
           class="payment-button">
          Pay Now
        </a>
      </p>
      <p style="text-align: center; font-size: 12px;">
        Click the button above to view and pay this invoice online.
      </p>
    </div>
    
    <div class="footer">
      <p>This is an automated invoice email.</p>
      <p>&copy; 2024 Acme Corp. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
```

## Customization

Users can override the auto-generated template:

### Example 1: Custom Subject Only

```json
{
  "to": "customer@acme.com",
  "subject": "URGENT: Invoice INV-2024-001 requires payment",
  // body will be auto-generated
}
```

### Example 2: Custom Body HTML

```json
{
  "to": "customer@acme.com",
  "subject": "Invoice INV-2024-001",
  "body": "<h1>Hello!</h1><p>Please see the attached invoice.</p><p>Best regards</p>"
}
```

### Example 3: Both Custom

```json
{
  "to": "customer@acme.com",
  "subject": "Important: Your Invoice INV-2024-001",
  "body": "<p>We value your business!</p><p>Invoice amount: ₹10,000</p><p>Pay by Sept 30.</p>"
}
```

## Payment Link

A payment link is an optional URL to include in the email body.

### What It Does

```html
<!-- Without payment link -->
<p>Please find your invoice attached.</p>

<!-- With payment link -->
<p style="text-align: center; margin-top: 20px;">
  <a href="https://pay.razorpay.com/invoice/inv_123" class="payment-button">
    Pay Now
  </a>
</p>
```

### When to Use

1. **Invoice is draft** - no payment link yet
2. **Invoice sent without Razorpay** - use payment link from custom form
3. **Invoice with Razorpay payment** - include payment link

### Example Request

```json
{
  "to": "customer@acme.com",
  "subject": "Invoice INV-2024-001 - Payment Required",
  "body": "<p>Please pay your invoice.</p>",
  "paymentLink": "https://rzp.io/l/invoice_2024_001",
  "attachPdf": true
}
```

**Email Generated:**
```html
<p>Please pay your invoice.</p>

<p style="text-align: center; margin-top: 20px;">
  <a href="https://rzp.io/l/invoice_2024_001" class="payment-button">
    Pay Now
  </a>
</p>
```

## Template Best Practices

### 1. Responsive HTML

```html
<!-- DON'T -->
<div style="width: 1200px;">
  <p>Invoice details</p>
</div>

<!-- DO -->
<div style="max-width: 600px; margin: 0 auto;">
  <p>Invoice details</p>
</div>
```

### 2. Fallback Text

```html
<!-- DON'T -->
<p>
  <img src="logo.png" alt="" />
  Amount: ₹10,000
</p>

<!-- DO -->
<p>
  <img src="logo.png" alt="Company Logo" />
  Amount: ₹10,000
</p>
```

### 3. Inline Styles (Email Client Compatibility)

```html
<!-- DON'T -->
<style>
  .header { background: blue; }
</style>
<div class="header">Invoice</div>

<!-- DO -->
<div style="background: blue;">Invoice</div>
```

### 4. Test Rendering

Email clients render HTML differently:
- Gmail (web/mobile)
- Outlook (web/desktop)
- Apple Mail
- Android Gmail

Tools:
- [Litmus Email Tests](https://www.litmusapp.com/)
- [Email on Acid](https://www.emailonacid.com/)

## Template Variables

When building email content, these should be templated:

```typescript
interface EmailTemplateParams {
  invoiceNumber: string;      // INV-2024-001
  customerName: string;       // Acme Corp
  amount: string;             // ₹10,000.00 (formatted)
  dueDate: string;            // 2024-09-30 (formatted)
  orgName: string;            // Your Company
  paymentLink?: string;       // Optional pay URL
  invoicePdfUrl?: string;     // If PDF hosted online
  invoicePdfAttached?: boolean; // If PDF is attachment
}
```

## Example Emails

### Email 1: Simple Invoice

```html
<p>Dear Acme Corp,</p>

<p>Thank you for your business!</p>

<p>Invoice Details:
  <ul>
    <li>Invoice: INV-2024-001</li>
    <li>Amount: ₹10,000.00</li>
    <li>Due Date: 2024-09-30</li>
  </ul>
</p>

<p>Please find the detailed invoice attached.</p>

<p>Best regards,<br/>Our Company</p>
```

### Email 2: Invoice with Payment Link

```html
<p>Dear Acme Corp,</p>

<p>Your invoice INV-2024-001 for ₹10,000.00 is ready for payment.</p>

<p>Due Date: 2024-09-30</p>

<div style="text-align: center; margin: 20px 0;">
  <a href="https://pay.razorpay.com/i/ABC123DEF456" 
     style="background: #007bff; color: white; padding: 10px 20px; 
            text-decoration: none; border-radius: 4px; display: inline-block;">
    Pay Now
  </a>
</div>

<p>If you have questions, please reply to this email.</p>

<p>Thank you,<br/>Our Company</p>
```

### Email 3: Overdue Invoice

```html
<p>Dear Acme Corp,</p>

<p style="color: #dc3545; font-weight: bold;">
  ⚠️ This invoice is overdue
</p>

<p>Invoice INV-2024-001 was due on 2024-09-30 and is now overdue.</p>

<p>Amount Due: ₹10,000.00</p>

<div style="text-align: center; margin: 20px 0;">
  <a href="https://pay.razorpay.com/i/ABC123DEF456">
    Pay Now
  </a>
</div>

<p>Please contact us if you have already sent payment.</p>

<p>Regards,<br/>Accounts Department</p>
```

## Next Steps

1. Read **06-print-and-client-pdf.md** to learn PDF generation
2. Read **08-frontend-send-email-dialog.md** to see how frontend handles templates
3. Explore `backend/src/constants/index.ts` for template implementation
