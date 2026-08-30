# 07 - PDF Attachment Options

## The Question

**Should the email have a PDF attachment?**

Three common approaches:

1. **Client-side PDF** - frontend generates, sends as base64
2. **Server-side PDF** - backend generates from invoice data
3. **No PDF** - link to online invoice instead
4. **Hybrid** - backend can generate if frontend doesn't

## Option 1: Client-Side PDF (This Module)

### How It Works

```
Frontend                          Backend
  │                                 │
  ├─ User clicks "Send Email"       │
  │                                 │
  ├─ Dialog renders invoice HTML    │
  │                                 │
  ├─ Generate PDF from HTML ◄─────(html2pdf.js)
  │  └─ pdfBlob = html2pdf(invoiceElement)
  │                                 │
  ├─ Convert to base64              │
  │  └─ pdfBase64 = btoa(pdfBlob)
  │                                 │
  ├─ Send email request ───────────►│
  │  POST /send-email               │
  │  {                              │
  │    to: "...",                   │
  │    pdfBase64: "JVBERi0x...",    │
  │  }                              │
  │                                 │
  │                          Backend validates
  │                          & sends email
  │                                 │
  │                     Email provider (Resend)
  │                          attaches PDF
  │                                 │
  │◄──────────── Response ──────────┤
  │   { success: true, ... }        │
  │                                 │
  └─ Show success message
```

### Pros

✓ **No server load** - client does PDF work  
✓ **User controls** - can preview PDF before sending  
✓ **Privacy** - PDF never stored on server  
✓ **Real-time** - uses current invoice data  

### Cons

✗ **Browser dependency** - html2pdf.js needs to work  
✗ **Network** - base64 PDF enlarges request  
✗ **Delays sending** - must generate PDF first  
✗ **Compatibility** - browser must support FileReader API  

### Implementation

**Frontend:**
```typescript
// Generate PDF
const pdfBlob = await generatePdfBlob(invoiceElement);
const pdfBase64 = await blobToBase64(pdfBlob);

// Send with base64
await sendInvoiceEmail({
  to: '...',
  pdfBase64,  // Base64 string
});
```

**Backend:**
```typescript
// Request body
interface SendEmailRequest {
  to: string;
  pdfBase64?: string;  // Optional base64 PDF
}

// Convert to buffer
if (input.pdfBase64) {
  const pdfBuffer = Buffer.from(input.pdfBase64, 'base64');
  
  // Send with attachment
  await emailService.send({
    to: input.to,
    invoicePdfBuffer: pdfBuffer,
  });
}
```

## Option 2: Server-Side PDF

### How It Works

```
Frontend                              Backend
  │                                     │
  ├─ User clicks "Send Email"          │
  │                                     │
  ├─ Send request ────────────────────►│
  │  POST /send-email                  │
  │  { to: "...", ... }                │
  │                                     │
  │                        Backend:
  │                        ├─ Load invoice data
  │                        ├─ Generate PDF
  │                        │  └─ pdfkit/puppeteer
  │                        ├─ Send email
  │                        │  └─ attach PDF
  │                        │
  │◄──────── Response ──────────────────┤
  │  { success: true, ... }             │
  │                                     │
  └─ Show success message
```

### Pros

✓ **Consistent** - same PDF every time  
✓ **Reliable** - no browser issues  
✓ **Smaller requests** - no base64 encoding  
✓ **Security** - PDF never leaves backend  
✓ **Faster sending** - no client-side processing  

### Cons

✗ **Server load** - backend generates PDF  
✗ **Storage** - PDF stored temporarily on server  
✗ **Latency** - takes longer to send  
✗ **Dependencies** - needs PDF library (pdfkit, puppeteer)  

### Example Libraries

```typescript
// 1. PDFKit - Low-level PDF generation
import PDFDocument from 'pdfkit';

const doc = new PDFDocument();
doc.fontSize(25).text('Invoice', 100, 100);
doc.pipe(response);
doc.end();

// 2. Puppeteer - Screenshot HTML to PDF
import puppeteer from 'puppeteer';

const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.setContent(htmlContent);
const pdf = await page.pdf({ format: 'A4' });

// 3. Pug + PDFKit - Templated PDF
const template = pug.renderFile('invoice.pug', { invoice });
// Then convert template to PDF
```

## Option 3: No PDF Attachment

### How It Works

```
Frontend                          Backend
  │                                 │
  ├─ User clicks "Send Email"       │
  │                                 │
  ├─ Send request ─────────────────►│
  │  POST /send-email               │
  │  {                              │
  │    to: "...",                   │
  │    attachPdf: false,            │
  │  }                              │
  │                                 │
  │                    Backend sends email
  │                    └─ No PDF attached
  │                                 │
  │◄──────── Response ──────────────┤
  │  Email sent (no attachment)     │
  │                                 │
  └─ Show success
```

### Pros

✓ **Minimal** - simplest implementation  
✓ **Fast** - instant send  
✓ **No generation** - no PDF library needed  
✓ **Small requests** - no file payload  

### Cons

✗ **No attachment** - customer must download separately  
✗ **Email size** - relies on external links  
✗ **Offline** - customer needs internet to access PDF  
✗ **Limited context** - email alone doesn't show full details  

### Use Cases

- Invoices already available online
- Prefer customer to view in dashboard
- Bandwidth or storage constraints
- Simple notification emails

## Option 4: Hybrid (Smart)

### How It Works

```
Frontend                          Backend
  │                                 │
  ├─ If PDF small enough            │
  │  ├─ Generate on frontend        │
  │  └─ Send as base64              │
  │                                 │
  ├─ If PDF too large OR error      │
  │  └─ Send request ───────────────►│
  │                                  │
  │                   If attachPdf:
  │                   ├─ Generate PDF
  │                   ├─ Attach to email
  │                   └─ Send
  │                                  │
  │◄────── Response ─────────────────┤
```

**Pseudo-code:**

Frontend:
```typescript
if (data.attachPdf) {
  try {
    const pdfBlob = await generatePdfBlob(element);
    
    // Only send if < 5MB
    if (pdfBlob.size < 5 * 1024 * 1024) {
      const base64 = await blobToBase64(pdfBlob);
      await sendEmail({ ...data, pdfBase64: base64 });
    } else {
      // Too large, let backend generate
      await sendEmail({ ...data, generatePdfOnServer: true });
    }
  } catch (error) {
    // Generation failed, try server-side
    await sendEmail({ ...data, generatePdfOnServer: true });
  }
} else {
  await sendEmail(data);  // No PDF
}
```

## Decision Matrix

| Scenario | Approach | Reason |
|----------|----------|--------|
| Learning module | Client-side | Teaches browser PDF + API integration |
| Low volume | Client-side | No server overhead |
| High volume | Server-side | Consistent, faster |
| Large PDFs | Server-side | Base64 encoding too big |
| Simple emails | No attachment | Just text/links |
| Enterprise | Hybrid | Flexibility + reliability |

## This Module

**Uses: Client-Side PDF**

Because:
1. **Educational** - teaches frontend-backend integration
2. **Realistic** - many modern apps do this
3. **Pragmatic** - works for small invoices
4. **Decoupled** - frontend generates PDF independently

## Attachment Constraints

Most email providers limit attachment size:

| Provider | Limit |
|----------|-------|
| Resend | 25 MB per request |
| Gmail | 25 MB |
| Outlook | 20 MB |
| SendGrid | 30 MB |

**Base64 Overhead:**
```
Original PDF: 500 KB
Base64 encoded: ~667 KB (33% larger)
```

**Recommendation:**
- Keep invoice PDFs under 2 MB
- Monitor base64 size
- Use server-side for large documents

## Next Steps

1. Read **08-frontend-send-email-dialog.md** to see UI implementation
2. Explore `frontend/src/components/SendEmailDialog.tsx`
3. Read **03-send-invoice-email-api.md** for API contract
4. Consider: would you implement differently for production?
