# 01 - Overview

File workflows are different from normal item CRUD because the input is not a small JSON object typed by your own UI. A user can upload a large image, a spreadsheet from another system, an empty file, or a file with columns your app has never seen before.

This module keeps the domain small: items have `name`, `sku`, `itemType`, `unit`, `salesPrice`, tax codes, active status, and optional image metadata. The complexity comes from accepting and producing files safely.

## Learning Example

A CSV import may contain:

| Name | SKU | Item Type | Unit | Sales Price |
| --- | --- | --- | --- | ---: |
| Notebook | NB-001 | GOODS | PCS | 120 |
| Consulting | CONS-001 | SERVICES | HOUR | 2500 |
| Bad Price | BAD-001 | GOODS | PCS | abc |

The app should preview this file first. Two rows are usable. One row has a clear price error. Nothing should be saved until the user confirms the import.

## Main Workflows

1. Upload an image for one item.
2. Preview a CSV/XLSX item import.
3. Confirm valid imported rows.
4. Export items as CSV or XLSX.

The repeated pattern is: validate at the boundary, convert into typed DTOs, run service logic, then show a result that a user can act on.