import { ItemImportOptions, ItemImportPreviewResult, ItemImportResult } from '../types/index';

export interface IItemImportService {
  preview(file: Express.Multer.File, options: ItemImportOptions): Promise<ItemImportPreviewResult>;
  confirm(file: Express.Multer.File, options: ItemImportOptions): Promise<ItemImportResult>;
}
