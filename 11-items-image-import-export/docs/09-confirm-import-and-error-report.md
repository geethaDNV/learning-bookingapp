# 09 - Confirm Import And Error Report

Confirmation saves valid rows after the user reviews the preview. Invalid rows stay out of the database.

## Duplicate Handling

The module supports two beginner-friendly duplicate strategies:

| Strategy | Behavior |
| --- | --- |
| skip | keep existing item and count the row as skipped |
| overwrite | update the existing item with imported values |

The unique key can be `sku` or `name`. SKU is the default because item names can change more often.

## Result Example

```json
{
  "created": 8,
  "updated": 2,
  "skipped": 1,
  "failed": 1
}
```

If failures exist, the API also returns `errorReportCsv`. The frontend turns it into a downloadable `item-import-errors.csv` file.

Production systems may save an import job record and reuse a preview token. This module keeps the confirm flow simple by uploading the file again with the same options.