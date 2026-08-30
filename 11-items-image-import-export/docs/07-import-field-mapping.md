# 07 - Import Field Mapping

Real users rarely upload files with exactly the column names your code expects. Field mapping lets the UI say: source column `Item Name` should become app field `name`.

## Default Mapping

```json
{
  "name": "Name",
  "sku": "SKU",
  "itemType": "Item Type",
  "unit": "Unit",
  "salesPrice": "Sales Price"
}
```

## Example

A vendor file might contain:

| Product | Code | Type | Price |
| --- | --- | --- | ---: |
| Notebook | NB-001 | GOODS | 120 |

The user can map:

| App field | Source column |
| --- | --- |
| name | Product |
| sku | Code |
| itemType | Type |
| salesPrice | Price |

This keeps the backend contract stable while still accepting many file shapes.