# 10 - Export CSV XLSX

Export starts with typed item records and ends with a downloadable file.

## Export Columns

| Column | Source field |
| --- | --- |
| Name | `item.name` |
| SKU | `item.sku` |
| Item Type | `item.itemType` |
| Unit | `item.unit` |
| Sales Price | `item.salesPrice` |
| Active | `item.isActive` |

## Routes

```http
GET /api/v1/items/export?format=csv
GET /api/v1/items/export?format=xlsx
```

Optional filters can be added:

```http
GET /api/v1/items/export?format=csv&itemType=GOODS&isActive=true
```

The response sets `Content-Type` and `Content-Disposition` headers so the browser treats it as a file download.