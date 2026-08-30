# Backend - Invoice Email PDF Module

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env

# Development server
npm run dev

# Build for production
npm build

# Type checking
npm run lint
```

## Configuration

Edit `.env` to control email provider:

```
# Use mock provider for local development (recommended for learning)
EMAIL_PROVIDER=mock

# Or use Resend for real emails (requires API key)
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_xxx...
```

## API Endpoints

### Send Invoice Email
```
POST /api/v1/invoices/{invoiceId}/send-email

Request:
{
  "to": "customer@example.com",
  "cc": ["cc@example.com"],
  "bcc": ["bcc@example.com"],
  "subject": "Custom subject",
  "body": "Custom HTML body",
  "attachPdf": true,
  "paymentLink": "https://pay.example.com/..."
}

Response:
{
  "success": true,
  "message": "Email sent successfully",
  "messageId": "msg_123...",
  "provider": "mock",
  "timestamp": "2024-08-30T..."
}
```

### Preview Invoice Email
```
GET /api/v1/invoices/{invoiceId}/preview-email?body=custom%20body

Response:
{
  "subject": "Invoice INV-2024-001...",
  "body": "<html>...</html>",
  "bodyHtml": "<html>...</html>",
  "recipientEmail": "customer@example.com",
  "timestamp": "2024-08-30T..."
}
```

## Architecture

- **DI Container**: Manages all dependencies and service lifecycle
- **Controllers**: HTTP request/response handling
- **Services**: Business logic and orchestration
- **Repositories**: Data access (in-memory for learning)
- **Schemas**: Zod validation for all inputs

## Testing

Sample invoices in memory:
- `INV-2024-001` (ID: `inv-001`) → Acme Corp
- `INV-2024-002` (ID: `inv-002`) → TechStart Inc

## See Also

- [Backend Documentation](../docs/)
- [Frontend Module](../frontend/)
