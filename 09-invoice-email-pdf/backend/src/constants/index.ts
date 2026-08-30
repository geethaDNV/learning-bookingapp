// ── Email Provider Constants ──────────────────────────────────────────────────

export const EMAIL_PROVIDERS = {
  MOCK: 'mock',
  RESEND: 'resend',
} as const;

export const EMAIL_DEFAULTS = {
  FROM: 'noreply@invoicedemo.local',
  TIMEOUT_MS: 5000,
} as const;

// ── Email Template Templates ──────────────────────────────────────────────────

export const EMAIL_TEMPLATES = {
  INVOICE_SUBJECT: (invoiceNumber: string, orgName: string = 'Our Company') =>
    `Invoice ${invoiceNumber} from ${orgName}`,

  INVOICE_BODY_HTML: (params: {
    invoiceNumber: string;
    amount: string;
    dueDate: string;
    orgName: string;
    customerName?: string;
    paymentLink?: string;
  }) => {
    const { invoiceNumber, amount, dueDate, orgName, customerName = 'Customer', paymentLink } = params;
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #f5f5f5; padding: 20px; text-align: center; border-radius: 4px; }
    .content { margin: 20px 0; }
    .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; }
    .payment-button { display: inline-block; background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>${orgName}</h2>
      <h3>Invoice ${invoiceNumber}</h3>
    </div>
    
    <div class="content">
      <p>Dear ${customerName},</p>
      
      <p>Thank you for your business! Please find the details of your invoice below.</p>
      
      <table style="width: 100%; border-collapse: collapse;">
        <tr style="border-bottom: 1px solid #ddd;">
          <td style="padding: 10px;"><strong>Invoice Number:</strong></td>
          <td style="padding: 10px;">${invoiceNumber}</td>
        </tr>
        <tr style="border-bottom: 1px solid #ddd; background-color: #f9f9f9;">
          <td style="padding: 10px;"><strong>Amount:</strong></td>
          <td style="padding: 10px;"><strong>${amount}</strong></td>
        </tr>
        <tr style="border-bottom: 1px solid #ddd;">
          <td style="padding: 10px;"><strong>Due Date:</strong></td>
          <td style="padding: 10px;">${dueDate}</td>
        </tr>
      </table>
      
      ${
        paymentLink
          ? `
        <p style="text-align: center; margin-top: 20px;">
          <a href="${paymentLink}" class="payment-button">Pay Now</a>
        </p>
        <p style="text-align: center; font-size: 12px; color: #666;">Click the button above to view and pay this invoice online.</p>
      `
          : ''
      }
    </div>
    
    <div class="footer">
      <p>This is an automated invoice email. Please do not reply directly to this email.</p>
      <p>&copy; ${new Date().getFullYear()} ${orgName}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;
  },
} as const;

// ── Validation Constants ──────────────────────────────────────────────────────

export const EMAIL_CONSTRAINTS = {
  MAX_EMAIL_LENGTH: 254,
  MAX_SUBJECT_LENGTH: 255,
  MAX_BODY_LENGTH: 10000,
  MAX_CC_BCC_COUNT: 10,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
} as const;

// ── Error Messages ────────────────────────────────────────────────────────────

export const EMAIL_ERROR_MESSAGES = {
  PROVIDER_NOT_CONFIGURED: 'Email provider is not properly configured',
  RESEND_API_KEY_MISSING: 'Resend API key is not configured. Set RESEND_API_KEY in .env',
  INVALID_EMAIL: 'Invalid email address format',
  INVALID_RECIPIENT: 'Invalid recipient email',
  SEND_FAILED: 'Failed to send email',
  INVOICE_NOT_FOUND: 'Invoice not found',
  CUSTOMER_NOT_FOUND: 'Customer not found',
  MISSING_CUSTOMER_EMAIL: 'Customer email is required to send invoice',
} as const;

// ── Success Messages ──────────────────────────────────────────────────────────

export const EMAIL_SUCCESS_MESSAGES = {
  SEND_SUCCESS: 'Email sent successfully',
  EMAIL_QUEUED: 'Email has been queued for delivery',
} as const;

// ── Route Segments ────────────────────────────────────────────────────────────

export const INVOICE_EMAIL_ROUTE_SEGMENTS = {
  BASE: '/api/v1/invoices',
  SEND_EMAIL: 'send-email',
  PREVIEW: 'preview-email',
} as const;
