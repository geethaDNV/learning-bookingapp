# 08 - Print and PDF

## Overview

Print and PDF generation allow users to export invoices in a shareable, readable format suitable for:
- Sending to customers
- Storing as records
- Printing on paper
- Archiving

## Print View Page

### Route
```
/invoices/:publicId/print
```

### Component: PrintInvoice

**File:** `frontend/src/pages/PrintInvoicePage.tsx`

```typescript
export function PrintInvoicePage() {
  const { publicId } = useParams<{ publicId: string }>();
  const invoice = useSelector(selectCurrentInvoice);

  useEffect(() => {
    dispatch(fetchInvoice(publicId));
  }, [publicId, dispatch]);

  return (
    <div className="print-container">
      <InvoicePrintView invoice={invoice} />
      <button onClick={() => window.print()}>
        🖨️ Print or Save as PDF
      </button>
    </div>
  );
}
```

### Print Layout

**File:** `frontend/src/components/InvoicePrintView.tsx`

```typescript
export function InvoicePrintView({ invoice }: { invoice: Invoice }) {
  return (
    <div className="bg-white p-12 text-black" style={{ pageBreak: "avoid" }}>
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold">INVOICE</h1>
        <p className="text-gray-600 text-lg">{invoice.invoiceNumber}</p>
      </div>

      {/* Customer Info */}
      <div className="grid grid-cols-2 gap-12 mb-12">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-600">
            Bill To
          </h2>
          <p className="text-lg font-medium">{invoice.customerName}</p>
        </div>

        <div className="text-right">
          <div className="mb-4">
            <p className="text-sm text-gray-600">Invoice Date</p>
            <p className="text-lg font-medium">
              {new Date(invoice.createdAt).toLocaleDateString()}
            </p>
          </div>
          {invoice.dueDate && (
            <div>
              <p className="text-sm text-gray-600">Due Date</p>
              <p className="text-lg font-medium">
                {new Date(invoice.dueDate).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Line Items Table */}
      <div className="mb-12">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-800">
              <th className="text-left py-2 font-semibold">Description</th>
              <th className="text-right py-2 font-semibold">Qty</th>
              <th className="text-right py-2 font-semibold">Rate</th>
              <th className="text-right py-2 font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lines.map((line) => (
              <tr key={line.id} className="border-b border-gray-200">
                <td className="py-3">
                  <p className="font-medium">{line.itemName}</p>
                </td>
                <td className="text-right py-3">
                  {Number(line.quantity).toFixed(2)}
                </td>
                <td className="text-right py-3">
                  ${Number(line.rate).toFixed(2)}
                </td>
                <td className="text-right py-3">
                  ${Number(line.lineTotal).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="flex justify-end mb-12">
        <div className="w-64">
          <div className="flex justify-between py-2">
            <span>Subtotal:</span>
            <span>${Number(invoice.subtotal).toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-2">
            <span>Tax:</span>
            <span>${Number(invoice.totalTax).toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-2 border-t-2 border-gray-800 font-semibold text-lg">
            <span>Total:</span>
            <span>${Number(invoice.total).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {invoice.notes && (
        <div className="border-t pt-6">
          <h3 className="font-semibold mb-2">Notes</h3>
          <p className="text-gray-700 whitespace-pre-wrap">{invoice.notes}</p>
        </div>
      )}
    </div>
  );
}
```

## Client-Side PDF Download

### Option 1: Browser Print Dialog

Simplest approach - use `window.print()`:

```typescript
<button onClick={() => window.print()}>
  🖨️ Print to PDF
</button>
```

User clicks → Print dialog opens → User selects "Save as PDF" → PDF downloaded.

### Option 2: html2pdf Library

For more control:

```bash
npm install html2pdf.js
```

```typescript
import html2pdf from "html2pdf.js";

const handleDownloadPDF = () => {
  const element = document.getElementById("invoice-print");
  const options = {
    margin: 10,
    filename: `${invoice.invoiceNumber}.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { orientation: "portrait", unit: "mm", format: "a4" },
  };
  html2pdf().set(options).from(element).save();
};
```

```typescript
<div id="invoice-print">
  <InvoicePrintView invoice={invoice} />
</div>
<button onClick={handleDownloadPDF}>
  📥 Download PDF
</button>
```

## CSS for Print

### Print-Specific Styles

**File:** `frontend/src/styles/print.css`

```css
@media print {
  /* Hide non-print elements */
  .no-print {
    display: none !important;
  }

  /* Optimize for printing */
  body {
    background: white;
    margin: 0;
    padding: 0;
  }

  .print-container {
    background: white;
    color: black;
    font-family: serif;
  }

  /* Prevent page breaks inside elements */
  .invoice-section {
    page-break-inside: avoid;
  }

  /* Ensure images print */
  img {
    max-width: 100%;
  }

  /* Links not underlined in print */
  a {
    text-decoration: none;
  }

  /* Tables look good */
  table {
    border-collapse: collapse;
    width: 100%;
  }

  th, td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: left;
  }
}
```

## Full Print Flow

```
User views invoice → Clicks "Print" or "Download PDF"
  ↓
window.print() OR html2pdf()
  ↓
Browser opens print dialog OR saves PDF file
  ↓
User can:
  - Print to physical printer
  - Save as PDF file
  - Cancel
```

## Backend Support (Future)

For server-side PDF generation (e.g., sending via email):

### Option 1: Puppeteer (Node.js)
```typescript
// Render HTML → PDF on backend
const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.setContent(htmlContent);
const pdf = await page.pdf({ format: "A4" });
```

### Option 2: External Service
- Use Tempustech or similar service
- POST HTML → GET PDF

For this learning module, we stick with client-side.

## Print Template Best Practices

1. **High contrast**: Black text on white background
2. **Clear layout**: Organized sections, proper spacing
3. **No colors**: Avoid heavy background colors (waste ink)
4. **Mobile-safe**: Use print media query
5. **Page breaks**: Avoid breaking lines/tables mid-page
6. **Footer**: Optional page numbers or footer info
7. **Headers**: Repeat on each page if multi-page

## Display Issues & Solutions

### Issue: Colors don't print
**Solution:** Use dark text, avoid colored backgrounds

### Issue: Page break in middle of table
**Solution:** Add `page-break-inside: avoid` to table

### Issue: Margins too small
**Solution:** Use print margins in CSS or set in print dialog

### Issue: Long notes overflow
**Solution:** Use `white-space: pre-wrap` and set max-height

## Summary

- **Print view**: Formatted for paper/PDF, hides UI buttons
- **window.print()**: Browser's print dialog (simplest)
- **html2pdf.js**: Programmatic PDF generation
- **CSS @media print**: Print-specific styling
- **Client-side**: No backend PDF generation needed
- **User experience**: Click button → Save PDF (instant, no server needed)
