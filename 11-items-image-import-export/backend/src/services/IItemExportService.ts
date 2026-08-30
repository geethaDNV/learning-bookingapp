import { ItemExportFilters, ItemExportResult } from '../types/index';

export interface IItemExportService {
  exportItems(format: 'csv' | 'xlsx', filters: ItemExportFilters): Promise<ItemExportResult>;
}
