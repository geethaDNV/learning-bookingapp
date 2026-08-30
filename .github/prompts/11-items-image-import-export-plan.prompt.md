# Plan: Learning Bookingapp - Module 11 Items Image Import Export

## Goal
Build `learning-bookingapp/11-items-image-import-export/{backend,frontend}` as a focused learning module that explains how item features handle files safely. The module should teach single item image upload, image preview, validation, compression or thumbnail creation, CSV/XLSX import, import preview, row-level validation, duplicate handling, export downloads, and error-report friendly workflows.

This module comes after item forms, invoices, payments, email/PDF, and advanced payment accounting because file workflows add a different kind of complexity: the user uploads external data, the system must validate it carefully, and the UI must make failures understandable.

## Decisions
- Module folder name: `11-items-image-import-export`.
- Combine image upload and import/export in one module because both teach item file workflows.
- Assume learners understand item CRUD, item forms, React Hook Form, Zod, Redux Toolkit, Express controllers, services, repositories, Prisma, and typed DI from earlier modules.
- Include single item image upload only; keep bulk image upload as an exercise or production mapping note.
- Include CSV and XLSX import/export.
- Include import preview before saving rows.
- Include field mapping from uploaded file headers to item fields.
- Include row-level validation errors and downloadable error report data.
- Include duplicate handling with beginner-friendly options such as skip and overwrite.
- Include filtered export from the item list and unfiltered export from the API.
- Backend must use DI and contract-based image/import/export services.
- Frontend must be strongly typed.
- Docs must explain file workflows with examples before code.

## Teaching Intent
This module teaches the production question: how does an item feature safely accept and produce files without corrupting data or confusing users?

After finishing this module, a junior developer should understand:
- why file upload is different from normal JSON request handling.
- why MIME type, file size, and extension checks are not enough by themselves.
- how image preview differs from image persistence.
- why image compression and thumbnails improve UX and storage behavior.
- how CSV/XLSX import turns external rows into validated item DTOs.
- why import preview should happen before import confirmation.
- how field mapping helps users import files with different column names.
- how row-level errors make import failures fixable.
- why duplicate handling must be explicit.
- how export should respect filters when the user expects it.
- how file workflow services stay separated through contracts.

## Cross-Cutting Production Practices
- `ItemImageService` implements `IItemImageService`.
- `ItemImportService` implements `IItemImportService`.
- `ItemExportService` implements `IItemExportService`.
- Services depend on item repository interfaces, not concrete classes.
- File upload middleware should validate allowed MIME types and file size before controller logic.
- Image processing should be isolated in a utility or service helper.
- Import parsing, validation, preview, and persistence should be separate steps.
- Import confirmation should use a transaction or transaction-like repository method where appropriate.
- Add typed DI `Cradle` registrations for image, import, export, item repository, item service, and item controller.
- Use typed DTOs for image upload results, import options, import preview rows, import errors, import results, export filters, and export responses.
- Frontend image handlers, import wizard state, export actions, and API services must be typed.
- Avoid `any`.

## Reference Patterns
- Earlier item form learning module: [`learning-bookingapp/03-items-form-rhf-zod`](../../03-items-form-rhf-zod).
- Production item routes: [`BookKeepingApp/backend/routes/items/items.ts`](../../../BookKeepingApp/backend/routes/items/items.ts).
- Production item controller: [`BookKeepingApp/backend/controllers/items/itemsController.ts`](../../../BookKeepingApp/backend/controllers/items/itemsController.ts).
- Production file upload utilities: [`BookKeepingApp/backend/utils/uploads/fileUpload.ts`](../../../BookKeepingApp/backend/utils/uploads/fileUpload.ts).
- Production item import service: [`BookKeepingApp/backend/services/items/itemImportService.ts`](../../../BookKeepingApp/backend/services/items/itemImportService.ts).
- Production item export service: [`BookKeepingApp/backend/services/items/itemExportService.ts`](../../../BookKeepingApp/backend/services/items/itemExportService.ts).
- Production import/export constants: [`BookKeepingApp/backend/constants/items/itemImportExportConstants.ts`](../../../BookKeepingApp/backend/constants/items/itemImportExportConstants.ts).
- Production item import contract: [`BookKeepingApp/backend/types/interfaces/items/IItemImportService.ts`](../../../BookKeepingApp/backend/types/interfaces/items/IItemImportService.ts).
- Production frontend image hook: [`BookKeepingApp/frontend/src/features/items/hooks/useItemImageHandlers.ts`](../../../BookKeepingApp/frontend/src/features/items/hooks/useItemImageHandlers.ts).
- Production import wizard: [`BookKeepingApp/frontend/src/features/items/components/import/ImportItemsWizard.tsx`](../../../BookKeepingApp/frontend/src/features/items/components/import/ImportItemsWizard.tsx).
- Production export menu: [`BookKeepingApp/frontend/src/features/items/components/list/ItemExportMenu.tsx`](../../../BookKeepingApp/frontend/src/features/items/components/list/ItemExportMenu.tsx).
- Production item API service: [`BookKeepingApp/frontend/src/features/items/services/itemService.ts`](../../../BookKeepingApp/frontend/src/features/items/services/itemService.ts).
- Production item frontend types: [`BookKeepingApp/frontend/src/features/items/types/item.types.ts`](../../../BookKeepingApp/frontend/src/features/items/types/item.types.ts).

## Backend Scope
1. Scaffold Express + Prisma + Zod + TypeScript backend or extend an isolated copy of the item models from earlier learning modules.
2. Add simplified models:
   - `Item`
   - `ItemImage`
   - `ItemImportJob` or `ImportBatch`
   - `ItemImportRowError`
3. Add item image fields or related model fields such as:
   - `imageUrl` or `imageData`
   - `thumbnailUrl` or `thumbnailData`
   - `imageMimeType`
   - `imageFileName`
   - `imageSizeBytes`
4. Add constants for:
   - allowed image MIME types.
   - maximum image size.
   - allowed import MIME types.
   - export formats.
   - import field keys and required fields.
5. Add contracts:
   - `IItemRepository`
   - `IItemImageService`
   - `IItemImportService`
   - `IItemExportService`
6. Implement item image upload:
   - accept multipart form data.
   - validate size and file type.
   - create preview-friendly image metadata.
   - compress or generate a thumbnail.
   - attach image data or image path to an item.
7. Implement item image deletion or replacement:
   - clear image fields or delete stored files.
   - keep item data intact.
8. Implement import preview:
   - parse CSV/XLSX file.
   - read headers.
   - apply field mapping.
   - validate rows without saving them.
   - return valid row count, invalid row count, sample rows, and row-level errors.
9. Implement import confirmation:
   - accept the same file or a preview token/batch id.
   - save valid rows.
   - skip or overwrite duplicates according to selected option.
   - return created, updated, skipped, and failed counts.
10. Implement export:
   - export all items or currently filtered items.
   - support CSV and XLSX.
   - return file buffer, MIME type, and filename.
11. Add routes:
   - `POST /api/v1/items/:itemId/image`
   - `DELETE /api/v1/items/:itemId/image`
   - `POST /api/v1/items/import/preview`
   - `POST /api/v1/items/import/confirm`
   - `GET /api/v1/items/export?format=csv`
   - `GET /api/v1/items/export?format=xlsx`
12. Register dependencies through typed DI.

## Frontend Scope
1. Add typed models for item image metadata, image upload result, import file metadata, import field mapping, import preview rows, import row errors, import result, export format, and export filters.
2. Add typed API services for image upload, image delete, import preview, import confirm, and export download.
3. Add image upload to the item form:
   - choose image.
   - preview image before save.
   - remove image.
   - show validation errors.
   - submit image after or during item save.
4. Add import wizard:
   - upload file step.
   - map fields step.
   - preview rows and errors step.
   - confirm import step.
   - result summary step.
5. Add export menu or buttons to the item list:
   - export CSV.
   - export XLSX.
   - respect current list filters by default.
6. Add clear status badges or messages for import states:
   - ready to preview.
   - preview has errors.
   - importing.
   - import complete.
   - import failed.
7. Use typed Redux state/thunks/selectors or a typed query/state pattern consistent with previous modules.

## Docs
Create detailed numbered docs in `11-items-image-import-export/docs/`:

1. `01-overview.md` - why item file workflows need careful validation and UX.
2. `02-image-upload-basics.md` - multipart upload, file size, MIME type, and image safety basics.
3. `03-image-preview-form-integration.md` - React Hook Form integration, preview state, remove/replace behavior.
4. `04-image-compression-and-storage.md` - full image vs thumbnail, storage tradeoffs, and beginner-friendly examples.
5. `05-import-export-overview.md` - import vs export responsibilities and common user expectations.
6. `06-import-file-parsing.md` - CSV/XLSX parsing, headers, empty cells, and type conversion.
7. `07-import-field-mapping.md` - mapping uploaded columns such as Item Name, SKU, Sales Price, and Unit.
8. `08-import-preview-validation.md` - row-level validation, duplicate detection, and preview result shape.
9. `09-confirm-import-and-error-report.md` - save flow, skipped rows, overwritten rows, and downloadable error report data.
10. `10-export-csv-xlsx.md` - export formats, filtered exports, filenames, and browser downloads.
11. `11-frontend-wizard-and-downloads.md` - import wizard state, typed services, and export actions.
12. `12-contracts-di-and-production-map.md` - service interfaces, DI registration, and production file mapping.
13. `13-common-mistakes-and-exercises.md` - bad MIME validation, duplicate confusion, partial import problems, bulk image upload exercise, and import tests.

Docs must include concrete examples. For example: an import file with columns `Name`, `SKU`, `Sales Price`, and `Unit`; one valid row for `Notebook`, one duplicate SKU row, and one invalid price row. Explain the user problem first, then show the data shape and code.

## Validation
- Run backend build or `tsc --noEmit`.
- Run frontend build.
- Verify valid image upload succeeds.
- Verify invalid image MIME type is rejected.
- Verify oversized image is rejected.
- Verify image preview appears before submit and remove image clears form state.
- Verify import preview returns valid rows, invalid rows, and row-level errors without saving data.
- Verify duplicate import rows are skipped or overwritten according to selected option.
- Verify import confirmation creates or updates only valid rows.
- Verify import error report data is downloadable or clearly returned by the API.
- Verify CSV export downloads a readable file.
- Verify XLSX export downloads a readable file.
- Verify filtered export respects current list filters.
- Verify typed DI contracts compile.
- Verify no feature-level `any` is introduced.
- Run `git diff --check` for the new module and docs.