# 13 - Common Mistakes And Exercises

## Common Mistakes

### Saving Before Preview

If import immediately writes rows, users discover errors after data is already mixed with good records. Preview first, then confirm.

### Treating File Extension As Security

A file named `item.png` is not automatically a real image. The module checks MIME type and size; production systems can inspect magic bytes and scan files too.

### Hiding Row Errors

A message like `Import failed` is not useful. A row-level error such as `Row 5, salesPrice, abc is not a number` lets the user fix the file.

### Confusing Skip And Overwrite

Duplicate handling must be explicit. If SKU `NB-001` already exists, skip keeps the current record and overwrite updates it.

## Exercises

1. Add an `inventoryQuantity` column to import and export.
2. Add a sample CSV file in the module root and document how to import it.
3. Replace the demo thumbnail behavior with Sharp resizing.
4. Add bulk image upload as a separate endpoint using SKU in filenames.
5. Add import tests for one valid row, one duplicate row, and one invalid price row.
6. Add a filter control to the item list and pass it to `ItemExportMenu`.
7. Store import preview results with a short-lived `ImportBatch` record instead of re-uploading the file on confirm.

## Test Data

Use this CSV to practice:

```csv
Name,SKU,Item Type,Unit,Sales Price,Active
Notebook,NB-001,GOODS,PCS,120,Yes
Notebook Duplicate,NB-001,GOODS,PCS,130,Yes
Bad Price,BAD-001,GOODS,PCS,abc,Yes
Consulting,CONS-001,SERVICES,HOUR,2500,Yes
```
