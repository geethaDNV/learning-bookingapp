# 05 - Import Export Overview

Import and export are mirror workflows.

Import turns an external file into app records. Export turns app records into an external file.

## Import Responsibilities

- Read CSV/XLSX bytes.
- Detect headers.
- Map source columns to item fields.
- Validate each row.
- Preview errors without saving.
- Confirm valid rows only when the user chooses to proceed.

## Export Responsibilities

- Read typed item records.
- Apply filters if provided.
- Shape rows with friendly column names.
- Generate CSV or XLSX content.
- Return a filename and MIME type.

## Example

A user says, "Export active goods." The service should not export inactive services by accident. Filters are part of the export contract because users expect the downloaded file to match what they are working with.