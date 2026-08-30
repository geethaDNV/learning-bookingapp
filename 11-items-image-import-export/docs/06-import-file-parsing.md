# 06 - Import File Parsing

The backend parses CSV and XLSX files with the same service method. The uploaded bytes are read into a workbook, then the first sheet becomes row objects.

## Header Row

The first row must contain headers. Example:

| Name | SKU | Item Type | Unit | Sales Price | Active |
| --- | --- | --- | --- | ---: | --- |
| Notebook | NB-001 | GOODS | PCS | 120 | Yes |

The parser returns headers such as `Name`, `SKU`, and `Sales Price`. Later, field mapping decides which header belongs to which item field.

## Empty Cells

Empty cells become empty strings during parsing. The validation step decides whether an empty value is acceptable.

| Field | Empty allowed? |
| --- | --- |
| name | No |
| sku | No |
| itemType | No |
| salesPrice | Yes, defaults to 0 |
| hsnCode | Yes |
| sacCode | Yes |

Parsing should not try to enforce every business rule. Keep parsing about file shape and validation about item rules.