# 06 - Print and Client-Side PDF

## PDF Generation Strategy

This module focuses on **client-side PDF generation** - the frontend generates the PDF from HTML and includes it in the email.

### Why Client-Side?

| Approach | Pros | Cons |
|----------|------|------|
| **Client-side** | User controls timing, privacy, storage | Browser dependency |
| **Server-side** | Consistent, reliable, no client overhead | More server load, slower |
| **Hybrid** | Best of both | Most complex |

For a learning module: **client-side is simple and teaches React integration**.

For production: consider server-side or hybrid depending on volume/latency.

## PDF Generation Library

This module uses **html2pdf.js** (lazy-loaded via dynamic import).

### Installation

Already in `frontend/package.json`:
```bash
npm install html2pdf.js
```

### Basic Usage

```typescript
// 1. Get HTML element
const invoiceElement = document.getElementById('invoice-document');

// 2. Generate PDF blob
const pdfBlob = await generatePdfBlob(invoiceElement);

// 3. Download or send
await downloadPdf(pdfBlob, 'invoice-INV-2024-001.pdf');
```

### Implementation

**File:** `frontend/src/utils/pdfGenerator.ts` (to be created)

```typescript
/**
 * Generate a PDF blob from an HTML element.
 * Uses html2pdf.js (lazy-loaded).
 */
export const generatePdfBlob = async (element: HTMLElement): Promise<Blob> => {
  // Dynamic import to avoid bloating bundle
  const html2pdf = (await import('html2pdf.js')).default as any;

  return new Promise((resolve, reject) => {
    const options = {
      margin: 10,           // 10mm margin
      filename: 'invoice.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' },
    };

    html2pdf()
      .set(options)
      .from(element)
      .save()
      // For converting to blob instead of downloading:
      // .output('blob')
      // .then(resolve)
      // .catch(reject);
  });
};

/**
 * Download a PDF blob to user's computer.
 */
export const downloadPdf = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Convert PDF blob to base64 string (for sending via API).
 */
export const pdfBlobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1]; // Remove data:application/pdf;base64, prefix
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};
```

## Print-Friendly HTML

For PDF generation to work well, create a print-friendly version of your invoice HTML.

### Invoice Print Component

**File:** `frontend/src/components/InvoicePrint.tsx` (to be created)

```typescript
export interface InvoicePrintProps {
  invoice: Invoice;
  customer: Customer;
  hideActions?: boolean;  // Hide print/download buttons when printing
}

export const InvoicePrint: React.FC<InvoicePrintProps> = ({
  invoice,
  customer,
  hideActions = false,
}) => {
  return (
    <div id="invoice-print-container" style={{ padding: '20px' }}>
      <style>{`
        @media print {
          body { margin: 0; }
          #print-actions { display: none; }
        }
      `}</style>

      <div id="print-actions" style={{ marginBottom: '20px' }}>
        <button onClick={() => window.print()}>🖨️ Print</button>
        <button onClick={() => downloadInvoicePdf()}>📥 Download PDF</button>
      </div>

      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '40px',
        border: '1px solid #ddd',
        backgroundColor: 'white',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1>INVOICE</h1>
          <p style={{ color: '#999' }}>Invoice #{invoice.invoiceNumber}</p>
        </div>

        {/* Bill To */}
        <div style={{ marginBottom: '30px' }}>
          <h3>Bill To:</h3>
          <p>
            <strong>{customer.name}</strong><br/>
            {customer.email}
          </p>
        </div>

        {/* Invoice Details */}
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #000' }}>
              <th style={{ textAlign: 'left', padding: '10px' }}>Description</th>
              <th style={{ textAlign: 'right', padding: '10px' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #ddd' }}>
              <td style={{ padding: '10px' }}>Services Rendered</td>
              <td style={{ textAlign: 'right', padding: '10px' }}>
                ₹{invoice.amount.toLocaleString('en-IN')}
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr style={{ borderTop: '2px solid #000' }}>
              <th style={{ textAlign: 'left', padding: '10px' }}>Total Due:</th>
              <th style={{ textAlign: 'right', padding: '10px', fontSize: '18px' }}>
                ₹{invoice.amount.toLocaleString('en-IN')}
              </th>
            </tr>
          </tfoot>
        </table>

        {/* Footer */}
        <div style={{ marginTop: '40px', color: '#999', fontSize: '12px' }}>
          <p>Due Date: {new Date(invoice.dueDate).toLocaleDateString()}</p>
          <p>Thank you for your business!</p>
        </div>
      </div>
    </div>
  );
};
```

## Workflow

### 1. User Opens Invoice Detail Page

```
Invoice Detail Page
├─ Invoice Info (read-only)
├─ Customer Info
└─ Actions
   ├─ "Download PDF" button
   ├─ "Print" button
   └─ "Send Email" button
```

### 2. User Clicks "Download PDF"

```typescript
const handleDownloadPdf = async () => {
  try {
    const printElement = document.getElementById('invoice-print-container');
    const pdfBlob = await generatePdfBlob(printElement);
    downloadPdf(pdfBlob, `Invoice-${invoice.invoiceNumber}.pdf`);
  } catch (error) {
    console.error('Failed to generate PDF:', error);
  }
};
```

**Result:** Invoice.pdf downloads to Downloads folder

### 3. User Clicks "Send Email"

Opens SendEmailDialog:

```typescript
<SendEmailDialog
  invoiceId={invoice.id}
  invoiceNumber={invoice.invoiceNumber}
  customerEmail={customer.email}
  onClose={...}
  onSuccess={...}
/>
```

### 4. In SendEmailDialog, Optionally Attach PDF

**If `attachPdf` checkbox is checked:**

```typescript
if (data.attachPdf) {
  // Generate PDF from print component
  const printElement = document.getElementById('invoice-print-container');
  const pdfBlob = await generatePdfBlob(printElement);
  
  // Convert to base64 for API
  const pdfBase64 = await pdfBlobToBase64(pdfBlob);
  
  // Send to API with base64 payload
  await invoiceEmailApi.sendInvoiceEmail(invoiceId, {
    to: data.to,
    subject: data.subject,
    body: data.body,
    attachPdf: true,
    pdfBase64,  // Add to payload
  });
}
```

## Styling for PDF

Print-friendly CSS:

```css
/* Regular screen styles */
.no-print {
  display: block;
}

@media print {
  /* Hide elements that shouldn't print */
  .no-print {
    display: none;
  }

  /* Optimize for paper */
  body {
    margin: 0;
    padding: 0;
    background: white;
    font-size: 12pt;
  }

  /* Avoid page breaks in tables/sections */
  .invoice-section {
    page-break-inside: avoid;
  }

  /* Force colors in print (some browsers disable by default) */
  * {
    -webkit-print-color-adjust: exact !important;
    color-adjust: exact !important;
  }
}
```

## Troubleshooting PDF Generation

### Issue: PDF is blurry
**Solution:** Increase scale in options:
```typescript
html2canvas: { scale: 3 }  // was scale: 2
```

### Issue: HTML elements cut off
**Solution:** Set max-width and center:
```typescript
<div style={{ maxWidth: '800px', margin: '0 auto' }}>
  {/* invoice content */}
</div>
```

### Issue: Colors don't print
**Solution:** Add explicit print color adjustment:
```css
@media print {
  * {
    -webkit-print-color-adjust: exact !important;
    color-adjust: exact !important;
  }
}
```

### Issue: Images missing in PDF
**Solution:** Use data URIs or wait for images to load:
```typescript
const options = {
  html2canvas: {
    scale: 2,
    useCORS: true,  // Enable CORS for cross-origin images
    allowTaint: true,
  },
};
```

## Next Steps

1. Read **07-pdf-attachment-options.md** to understand attachment tradeoffs
2. Read **08-frontend-send-email-dialog.md** to see complete UI flow
3. Create `InvoicePrint.tsx` component with invoice details
4. Test PDF generation with sample invoice HTML
