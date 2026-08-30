# Learning Module 11: Items Image Upload, Import & Export

## Overview

This module teaches the file workflows behind a production item feature. Learners start with normal item CRUD from earlier modules, then add image upload, image preview, CSV/XLSX import, row-level import validation, duplicate handling, and CSV/XLSX export.

The production idea is simple: files are user-controlled input. A booking or bookkeeping app must validate the file, show useful failures, and only save rows that match the application's item contract.

## What You Will Learn

- How multipart file upload differs from JSON requests.
- How item image preview is separate from saving image data.
- How MIME type and size validation protect the upload boundary.
- How item import maps spreadsheet columns into typed item DTOs.
- How preview-before-confirm avoids corrupt bulk imports.
- How duplicate handling works with SKU or name as the unique key.
- How CSV/XLSX export turns filtered item records into downloadable files.
- How DI keeps item CRUD, image upload, import, and export services separate.

## Project Structure

```
11-items-image-import-export/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   └── src/
│       ├── constants/
│       ├── controllers/
│       ├── di/
│       ├── middleware/
│       ├── repositories/
│       ├── schemas/
│       ├── services/
│       ├── types/
│       └── server.ts
├── frontend/
│   └── src/
│       ├── features/items/components/
│       ├── features/items/pages/
│       ├── features/items/schemas/
│       ├── services/
│       ├── store/
│       └── types/
└── docs/
```

## Quick Start

### Backend

```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

Backend runs on `http://localhost:3000`. Versioned routes are under `/api/v1/items`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`.

## Key Workflows

### Image Upload

1. Create or edit an item.
2. Choose a JPEG, PNG, or WebP image under 2 MB.
3. The browser shows a preview before saving.
4. The backend stores image data, thumbnail data, MIME type, filename, and size.

### Import Preview

Use a CSV or XLSX file with columns like:

| Name | SKU | Item Type | Unit | Sales Price |
| --- | --- | --- | --- | ---: |
| Notebook | NB-001 | GOODS | PCS | 120 |
| Notebook Duplicate | NB-001 | GOODS | PCS | 130 |
| Bad Price | BAD-001 | GOODS | PCS | abc |

Preview validates rows first. The duplicate row can be skipped or overwritten during confirmation, and the bad price row is returned as a row-level error.

### Export

The item list has CSV and XLSX export actions. Exports use the current filter object when one is provided and return a real browser download.

## Docs Reading Order

1. [docs/01-overview.md](docs/01-overview.md)
2. [docs/02-image-upload-basics.md](docs/02-image-upload-basics.md)
3. [docs/03-image-preview-form-integration.md](docs/03-image-preview-form-integration.md)
4. [docs/04-image-compression-and-storage.md](docs/04-image-compression-and-storage.md)
5. [docs/05-import-export-overview.md](docs/05-import-export-overview.md)
6. [docs/06-import-file-parsing.md](docs/06-import-file-parsing.md)
7. [docs/07-import-field-mapping.md](docs/07-import-field-mapping.md)
8. [docs/08-import-preview-validation.md](docs/08-import-preview-validation.md)
9. [docs/09-confirm-import-and-error-report.md](docs/09-confirm-import-and-error-report.md)
10. [docs/10-export-csv-xlsx.md](docs/10-export-csv-xlsx.md)
11. [docs/11-frontend-wizard-and-downloads.md](docs/11-frontend-wizard-and-downloads.md)
12. [docs/12-contracts-di-and-production-map.md](docs/12-contracts-di-and-production-map.md)
13. [docs/13-common-mistakes-and-exercises.md](docs/13-common-mistakes-and-exercises.md)

## Validation

```bash
cd backend
npm run build

cd ../frontend
npm run build
```

Then manually verify image upload, invalid MIME rejection, import preview, import confirmation, duplicate handling, CSV export, and XLSX export.
