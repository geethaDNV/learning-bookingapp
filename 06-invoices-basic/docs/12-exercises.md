# 12 - Exercises

This document provides practice exercises to deepen your understanding of the invoice module.

## Difficulty Levels

- ⭐ **Beginner**: UI changes, minor logic
- ⭐⭐ **Intermediate**: Add services, new endpoints, form enhancements
- ⭐⭐⭐ **Advanced**: Database changes, architectural patterns, integrations

---

## Exercise 1: Add Due Date Display ⭐

**Goal:** Display the due date in red if past, green if upcoming

**Where to work:**
- `frontend/src/pages/InvoiceDetailPage.tsx`

**Steps:**
1. Get current date
2. Compare with `invoice.dueDate`
3. Style red if `dueDate < now`, green if `dueDate >= now`

**Hint:**
```typescript
const isOverdue = new Date(invoice.dueDate) < new Date();
const color = isOverdue ? "text-red-500" : "text-green-500";
```

---

## Exercise 2: Add Item Description to Line Items ⭐

**Goal:** When user selects an item in autocomplete, show the item description below the line total

**Where to work:**
- `frontend/src/components/InvoiceLineFields.tsx`

**Steps:**
1. Update `InvoiceLineFormValue` to include `itemDescription?: string`
2. When item is selected in autocomplete, update form with description
3. Display description below line totals

**Hint:**
```typescript
const handleItemSelected = (index: number, item: ItemOption) => {
  lineFormArray[index].itemDescription = item.description;
};
```

---

## Exercise 3: Add Discount to Line Items ⭐⭐

**Goal:** Allow users to add a discount percentage per line

**Where to work:**
- Backend: `src/schemas`, `src/services/InvoiceService.ts`, `src/utils/InvoiceCalculator.ts`
- Frontend: `src/components/InvoiceLineFields.tsx`, `src/types/index.ts`

**Steps:**
1. Add `discountPercent?: number` field to `InvoiceLineFormValue`
2. Update `InvoiceCalculator.calculateLine()` to:
   - Subtract discount from rate before tax
   - Or subtract discount from subtotal
3. Add input field in line form
4. Update totals calculation to include discount

**Calculation:**
```
lineSubtotal = quantity * rate
discountAmount = lineSubtotal * (discountPercent / 100)
subtotalAfterDiscount = lineSubtotal - discountAmount
lineTax = subtotalAfterDiscount * (taxRate / 100)
lineTotal = subtotalAfterDiscount + lineTax
```

**Challenge:** Handle discount in invoice totals (should discount reduce tax or not?)

---

## Exercise 4: Add Line Item Deletion Confirmation ⭐

**Goal:** Show a confirmation dialog before deleting a line item

**Where to work:**
- `frontend/src/components/InvoiceLineFields.tsx`

**Steps:**
1. Create a simple confirm dialog component or use `window.confirm()`
2. Before calling `remove(index)`, show confirmation
3. Only delete if user confirms

**Code:**
```typescript
const handleRemoveLine = (index: number) => {
  if (window.confirm("Delete this line item?")) {
    remove(index);
  }
};
```

---

## Exercise 5: Duplicate Invoice ⭐⭐

**Goal:** Add a "Duplicate" button on invoice detail page that creates a new invoice with same lines

**Where to work:**
- Backend: Add new endpoint `POST /api/v1/invoices/:publicId/duplicate`
- Frontend: Add button and call new endpoint

**Steps:**
1. **Backend:**
   - New route that fetches invoice
   - Creates new invoice with same customer and lines
   - Returns new invoice

2. **Frontend:**
   - Add button: "📋 Duplicate Invoice"
   - Call API
   - Navigate to new invoice

**Endpoint:**
```
POST /api/v1/invoices/:publicId/duplicate
→ Returns new invoice with same data but DRAFT status
```

---

## Exercise 6: Filter Invoices by Status ⭐⭐

**Goal:** Add filter buttons to invoice list (All, Draft, Sent, Paid, Cancelled)

**Where to work:**
- `frontend/src/pages/InvoiceListPage.tsx`

**Steps:**
1. Add status filter to Redux state
2. Add filter button group in UI
3. When filter changes, refetch invoices with status query param
4. Highlight active filter

**Code:**
```typescript
const handleFilterChange = (status: string | null) => {
  dispatch(fetchInvoices({ status }));
};

// Render buttons
["All", "DRAFT", "SENT", "PAID", "CANCELLED"].map((s) => (
  <button
    onClick={() => handleFilterChange(s === "All" ? null : s)}
    className={activeFilter === s ? "bg-blue-600" : "bg-gray-200"}
  >
    {s}
  </button>
))
```

---

## Exercise 7: Validate Item Tax Rate Consistency ⭐⭐

**Goal:** Warn user if line tax rate differs significantly from item's default

**Where to work:**
- `frontend/src/components/InvoiceLineFields.tsx`
- Backend: `src/services/InvoiceService.ts`

**Steps:**
1. Fetch item details when selected
2. Compare selected tax rate with item default
3. If different by >5%, show warning

**Example:**
```typescript
const item = await itemLookup.findById(itemId);
if (Math.abs(selectedTaxRate - item.taxRate) > 5) {
  showWarning("Tax rate differs from item default");
}
```

---

## Exercise 8: Email Invoice Placeholder ⭐⭐

**Goal:** Add "Send Email" button that shows placeholder message

**Where to work:**
- `frontend/src/pages/InvoiceDetailPage.tsx`

**Steps:**
1. Add button: "📧 Send Email"
2. On click, show modal or toast: "Email sending not yet implemented"
3. Add backend endpoint (stub):
   ```typescript
   PATCH /api/v1/invoices/:publicId/send
   ```
4. Backend returns same invoice (no change)

**Why?**
Prepares structure for future email module. Users see button but feature is not live.

---

## Exercise 9: Quantity and Rate Validation ⭐⭐

**Goal:** Add real-time warnings for unusual quantities or rates

**Where to work:**
- `frontend/src/components/InvoiceLineFields.tsx`

**Steps:**
1. Watch for changes to quantity/rate in each line
2. Show warnings:
   - Quantity > 1000: "Unusually high quantity"
   - Rate > 10000: "Unusually high rate"
   - Rate < 10: "Very low rate"
3. Warnings don't prevent submission, just alert user

**Code:**
```typescript
const quantity = watch(`lines.${index}.quantity`);

useEffect(() => {
  if (quantity > 1000) {
    setWarning("Unusually high quantity");
  }
}, [quantity]);
```

---

## Exercise 10: Bulk Status Update ⭐⭐⭐

**Goal:** Allow users to select multiple invoices and change status in bulk

**Where to work:**
- Backend: New endpoint `PATCH /api/v1/invoices/bulk-status`
- Frontend: `InvoiceListPage.tsx`, `InvoiceList.tsx`

**Steps:**
1. Add checkboxes to invoice list rows
2. Add "Select All" checkbox in header
3. Add action bar with status dropdown
4. On status change, call bulk update endpoint
5. Refetch list after bulk update

**Endpoint:**
```
PATCH /api/v1/invoices/bulk-status
{
  "publicIds": ["id1", "id2", "id3"],
  "status": "SENT"
}
```

---

## Exercise 11: Export Invoice to CSV ⭐⭐⭐

**Goal:** Add button to export invoice lines to CSV file

**Where to work:**
- `frontend/src/pages/InvoiceDetailPage.tsx`

**Steps:**
1. Create `exportToCSV(invoice)` utility
2. Generate CSV content:
   ```
   Item Name, Quantity, Rate, Subtotal, Tax, Total
   Consulting, 5, 150, 750, 135, 885
   ```
3. Create blob and download
4. Add button: "📊 Export CSV"

**Code:**
```typescript
const exportToCSV = (invoice: Invoice) => {
  const lines = invoice.lines
    .map((l) => `${l.itemName},${l.quantity},${l.rate},${l.lineSubtotal},${l.lineTax},${l.lineTotal}`)
    .join("\n");
  
  const csv = `Item Name,Quantity,Rate,Subtotal,Tax,Total\n${lines}`;
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${invoice.invoiceNumber}.csv`;
  a.click();
};
```

---

## Exercise 12: Advanced Tax System ⭐⭐⭐

**Goal:** Add support for multiple tax rates per invoice

**Where to work:**
- Backend: Update schema, services, calculations
- Frontend: Add tax rate selector per line

**Changes Needed:**
1. **Database:**
   - Add tax description (e.g., "GST 18%", "VAT 20%")
   - Support multiple taxes per line

2. **Calculation:**
   - Line can have multiple taxes
   - Totals include all taxes

3. **UI:**
   - Tax rate dropdown instead of textinput
   - Show tax name + rate

**Challenge:** Handle tax combinations (e.g., GST + VAT)

---

## Exercise 13: Recurring Invoices ⭐⭐⭐

**Goal:** Allow invoices to repeat monthly/yearly

**Where to work:**
- Backend: New `RecurringInvoiceService`
- Frontend: New field in form

**Changes Needed:**
1. **UI:** Add checkbox "Recurring" with frequency dropdown
2. **Backend:** Scheduled job that creates new invoice copy
3. **Database:** Track recurring template and generated instances

**Placeholder:** For now, just add UI; backend scheduling is future work

---

## Exercise 14: Unit Tests ⭐⭐⭐

**Goal:** Add unit tests for calculator and service

**Where to work:**
- `backend/src/utils/__tests__/InvoiceCalculator.test.ts`
- `backend/src/services/__tests__/InvoiceService.test.ts`

**Setup:**
```bash
npm install --save-dev jest @types/jest ts-jest
```

**Example Test:**
```typescript
describe("InvoiceCalculator", () => {
  it("should calculate line total correctly", () => {
    const calc = new InvoiceCalculator();
    const result = calc.calculateLine(5, 150, 18);
    expect(result.subtotal).toBe(750);
    expect(result.tax).toBe(135);
    expect(result.total).toBe(885);
  });

  it("should calculate invoice totals", () => {
    const calc = new InvoiceCalculator();
    const lines = [
      { subtotal: 750, tax: 135, total: 885 },
      { subtotal: 500, tax: 90, total: 590 },
    ];
    const totals = calc.calculateTotals(lines);
    expect(totals.subtotal).toBe(1250);
    expect(totals.totalTax).toBe(225);
    expect(totals.total).toBe(1475);
  });
});
```

---

## Exercise 15: Performance Optimization ⭐⭐⭐

**Goal:** Optimize invoice list loading

**Changes:**
1. Add pagination with "Load More" button
2. Cache search results with React Query
3. Debounce autocomplete search
4. Use `useMemo` for calculations

**What to optimize:**
- Autocomplete: Add 300ms debounce
- List: Show 10 per page, "Load More" button
- Calculator: Use `useMemo` to avoid recalculating
- Search results: Cache for 5 minutes

**Tools:** React Query, lodash-debounce

---

## Suggested Learning Path

**Week 1:**
- Start with exercises 1-4 (UI, forms)
- Get familiar with frontend component patterns

**Week 2:**
- Do exercises 5-7 (API, state management)
- Understand backend service patterns

**Week 3:**
- Do exercises 8-10 (features, advanced UI)
- Build confidence with full-stack changes

**Week 4:**
- Do exercises 11-15 (testing, optimization)
- Transition to production-grade thinking

---

## Tips

1. **Start small**: Complete one exercise fully before moving to next
2. **Test manually**: Run frontend + backend, test in browser
3. **Read errors**: Error messages often point to solution
4. **Reference docs**: Use docs 01-11 when stuck
5. **Ask questions**: If something doesn't make sense, re-read the relevant doc
6. **Git commit**: After each exercise, `git add && git commit`

---

## Bonus: Design Your Own Feature

Once you've completed exercises 1-10, design and implement one of these:

1. **Invoice Revision History**: Track changes to invoices
2. **Template Invoices**: Save and reuse invoice layouts
3. **Bulk Import**: Upload CSV of customers/items for batch invoicing
4. **Invoice Analytics**: Dashboard with invoice trends (total revenue, average invoice, etc.)
5. **Customer Portal**: Read-only invoice view for customers

These exercises are open-ended; design the solution yourself, then implement it.

---

## Success Criteria

When you've completed all exercises, you should be able to:

✅ Add UI features without backend changes  
✅ Create new API endpoints and controllers  
✅ Extend the database schema  
✅ Write and run tests  
✅ Debug issues in full-stack flow  
✅ Refactor code safely  
✅ Explain invoice business logic  
✅ Navigate production code with confidence  

Good luck! 🚀
