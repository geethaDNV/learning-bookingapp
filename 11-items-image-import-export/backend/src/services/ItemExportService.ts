import { utils, write } from 'xlsx';
import { IItemRepository } from '../repositories/IItemRepository';
import { AppError } from '../errors/appError';
import { ItemExportFilters, ItemExportResult } from '../types/index';
import { IItemExportService } from './IItemExportService';

interface ExportRow {
  Name: string;
  SKU: string;
  'Item Type': string;
  Unit: string;
  'Sales Price': number;
  'HSN Code': string;
  'SAC Code': string;
  Active: string;
}

export class ItemExportService implements IItemExportService {
  constructor(private readonly itemRepository: IItemRepository) {}

  async exportItems(format: 'csv' | 'xlsx', filters: ItemExportFilters): Promise<ItemExportResult> {
    if (!['csv', 'xlsx'].includes(format)) {
      throw new AppError('Export format must be csv or xlsx', 'INVALID_EXPORT_FORMAT', 400);
    }

    const items = await this.itemRepository.listForExport(filters);
    const rows: ExportRow[] = items.map((item) => ({
      Name: item.name,
      SKU: item.sku,
      'Item Type': item.itemType,
      Unit: item.unit,
      'Sales Price': Number(item.salesPrice),
      'HSN Code': item.hsnCode || '',
      'SAC Code': item.sacCode || '',
      Active: item.isActive ? 'Yes' : 'No',
    }));

    const worksheet = utils.json_to_sheet(rows);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, 'Items');

    if (format === 'csv') {
      return {
        fileName: `items-export-${new Date().toISOString().slice(0, 10)}.csv`,
        mimeType: 'text/csv',
        buffer: Buffer.from(utils.sheet_to_csv(worksheet), 'utf8'),
      };
    }

    return {
      fileName: `items-export-${new Date().toISOString().slice(0, 10)}.xlsx`,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer: write(workbook, { bookType: 'xlsx', type: 'buffer' }) as Buffer,
    };
  }
}
