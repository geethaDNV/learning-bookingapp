# 11 - Frontend Wizard And Downloads

The import wizard keeps file workflow state visible instead of hiding it inside one submit button.

## Wizard State

| State | Meaning |
| --- | --- |
| selected file | the user chose a CSV/XLSX file |
| field mapping | app fields point to source headers |
| preview result | backend validated rows without saving |
| import result | backend saved valid rows after confirmation |
| file workflow error | upload, preview, confirm, or export failed |

## Download Flow

Export and error reports use the same browser pattern:

1. Receive a `Blob` or CSV string.
2. Create an object URL.
3. Create a temporary anchor.
4. Click it programmatically.
5. Revoke the object URL.

This is why the API service owns download behavior. Components ask for `exportItems('csv')`; they do not manually assemble response headers.