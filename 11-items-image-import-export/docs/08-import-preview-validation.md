# 08 - Import Preview Validation

Preview validates rows without saving them. This is the most important import safety rule in the module.

## Example Preview

| Row | Name | SKU | Item Type | Sales Price |
| ---: | --- | --- | --- | ---: |
| 2 | Notebook | NB-001 | GOODS | 120 |
| 3 | Bad Price | BAD-001 | GOODS | abc |

Preview response:

```json
{
  "summary": {
    "totalRows": 2,
    "validRows": 1,
    "invalidRows": 1
  },
  "errors": [
    {
      "rowNumber": 3,
      "field": "salesPrice",
      "message": "Sales price must be a positive number or zero",
      "rawValue": "abc"
    }
  ]
}
```

The frontend can now show the user exactly what needs fixing. No data has changed yet.