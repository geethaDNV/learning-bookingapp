# 12 - Contracts DI And Production Map

The module keeps file workflows behind interfaces so the controller does not know parsing, image storage, or export details.

## Contracts

| Contract | Responsibility |
| --- | --- |
| `IItemImageService` | upload and delete item images |
| `IItemImportService` | preview and confirm imports |
| `IItemExportService` | generate CSV/XLSX exports |
| `IItemRepository` | persist items, images, imports, and export queries |

`Container.initialize` wires concrete services into the `Cradle`. The controller receives interfaces through constructor injection.

## Production Map

| Learning file | Production reference |
| --- | --- |
| `backend/src/middleware/itemFileUpload.ts` | `BookKeepingApp/backend/utils/uploads/fileUpload.ts` |
| `backend/src/services/ItemImportService.ts` | `BookKeepingApp/backend/services/items/itemImportService.ts` |
| `backend/src/services/ItemExportService.ts` | `BookKeepingApp/backend/services/items/itemExportService.ts` |
| `frontend/src/features/items/components/ImportItemsWizard.tsx` | `BookKeepingApp/frontend/src/features/items/components/import/ImportItemsWizard.tsx` |
| `frontend/src/features/items/components/ItemExportMenu.tsx` | `BookKeepingApp/frontend/src/features/items/components/list/ItemExportMenu.tsx` |

Production adds richer permissions, audit logs, object storage options, stronger image processing, and larger import batching. The teaching shape is the same.