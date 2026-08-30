import { read, utils } from 'xlsx';
import { IItemRepository } from '../repositories/IItemRepository';
import { AppError } from '../errors/appError';
import {
  CreateItemPayload,
  ItemImportOptions,
  ItemImportPreviewResult,
  ItemImportResult,
  ItemImportRowError,
  ParsedImportRow,
} from '../types/index';
import { DEFAULT_IMPORT_FIELD_MAPPING, REQUIRED_IMPORT_FIELDS } from '../constants/itemFileConstants';
import { IItemImportService } from './IItemImportService';

type SheetRow = Record<string, string | number | boolean | null | undefined>;

export class ItemImportService implements IItemImportService {
  constructor(private readonly itemRepository: IItemRepository) {}

  async preview(file: Express.Multer.File, options: ItemImportOptions): Promise<ItemImportPreviewResult> {
    if (!file) {
      throw new AppError('Import file is required', 'IMPORT_FILE_REQUIRED', 400);
    }

    const { headers, rows } = this.parseRows(file);
    const fieldMapping = this.resolveFieldMapping(options.fieldMapping);
    const errors: ItemImportRowError[] = [];
    const validRows: ParsedImportRow[] = [];

    rows.forEach((row, index) => {
      const rowNumber = index + 2;
      const rowErrors: ItemImportRowError[] = [];
      const item = this.mapRowToPayload(row, fieldMapping, rowNumber, rowErrors);

      if (rowErrors.length > 0) {
        errors.push(...rowErrors);
        return;
      }

      validRows.push({
        rowNumber,
        source: this.stringifyRow(row),
        item,
      });
    });

    return {
      fileName: file.originalname,
      headers,
      validRows,
      errors,
      summary: {
        totalRows: rows.length,
        validRows: validRows.length,
        invalidRows: rows.length - validRows.length,
      },
    };
  }

  async confirm(file: Express.Multer.File, options: ItemImportOptions): Promise<ItemImportResult> {
    const preview = await this.preview(file, options);
    let created = 0;
    let updated = 0;
    let skipped = 0;
    const errors = [...preview.errors];

    for (const row of preview.validRows) {
      const duplicate = options.uniqueKey === 'sku'
        ? await this.itemRepository.findBySku(row.item.sku)
        : await this.itemRepository.findByName(row.item.name);

      if (duplicate && options.duplicateHandling === 'skip') {
        skipped += 1;
        continue;
      }

      const result = await this.itemRepository.upsertImportedItem(row.item, options.uniqueKey);
      if (result.created) {
        created += 1;
      } else {
        updated += 1;
      }
    }

    return {
      created,
      updated,
      skipped,
      failed: errors.length,
      errors,
      errorReportCsv: this.buildErrorReport(errors),
    };
  }

  private parseRows(file: Express.Multer.File): { headers: string[]; rows: SheetRow[] } {
    const workbook = read(file.buffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      throw new AppError('Import file does not contain a worksheet', 'IMPORT_EMPTY_WORKBOOK', 400);
    }

    const sheet = workbook.Sheets[firstSheetName];
    const rows = utils.sheet_to_json<SheetRow>(sheet, { defval: '' });
    const headers = rows.length > 0 ? Object.keys(rows[0]) : [];

    if (headers.length === 0) {
      throw new AppError('Import file must contain a header row', 'IMPORT_HEADERS_REQUIRED', 400);
    }

    return { headers, rows };
  }

  private resolveFieldMapping(mapping: Record<string, string>): Record<string, string> {
    return {
      ...DEFAULT_IMPORT_FIELD_MAPPING,
      ...mapping,
    };
  }

  private mapRowToPayload(
    row: SheetRow,
    mapping: Record<string, string>,
    rowNumber: number,
    errors: ItemImportRowError[]
  ): CreateItemPayload {
    const name = this.readText(row, mapping.name);
    const sku = this.readText(row, mapping.sku);
    const itemType = this.readText(row, mapping.itemType).toUpperCase();
    const unit = this.readText(row, mapping.unit) || 'PCS';
    const salesPrice = this.readNumber(row, mapping.salesPrice, rowNumber, errors);
    const hsnCode = this.readOptionalText(row, mapping.hsnCode);
    const sacCode = this.readOptionalText(row, mapping.sacCode);
    const isActive = this.readBoolean(row, mapping.isActive);

    const requiredValues: Record<string, string> = { name, sku, itemType };
    REQUIRED_IMPORT_FIELDS.forEach((field) => {
      if (!requiredValues[field]) {
        errors.push({ rowNumber, field, message: `${field} is required` });
      }
    });

    if (itemType && !['GOODS', 'SERVICES', 'CONSUMABLE'].includes(itemType)) {
      errors.push({ rowNumber, field: 'itemType', message: 'Item type must be GOODS, SERVICES, or CONSUMABLE', rawValue: itemType });
    }

    return {
      name,
      sku,
      itemType,
      unit,
      salesPrice,
      hsnCode,
      sacCode,
      isActive,
    };
  }

  private readText(row: SheetRow, header: string): string {
    const value = row[header];
    return value === undefined || value === null ? '' : String(value).trim();
  }

  private readOptionalText(row: SheetRow, header: string): string | null {
    const value = this.readText(row, header);
    return value ? value : null;
  }

  private readNumber(row: SheetRow, header: string, rowNumber: number, errors: ItemImportRowError[]): number {
    const rawValue = this.readText(row, header);
    if (!rawValue) {
      return 0;
    }

    const value = Number(rawValue);
    if (Number.isNaN(value) || value < 0) {
      errors.push({ rowNumber, field: 'salesPrice', message: 'Sales price must be a positive number or zero', rawValue });
      return 0;
    }

    return value;
  }

  private readBoolean(row: SheetRow, header: string): boolean {
    const rawValue = this.readText(row, header).toLowerCase();
    if (!rawValue) {
      return true;
    }

    return ['true', 'yes', 'y', '1', 'active'].includes(rawValue);
  }

  private stringifyRow(row: SheetRow): Record<string, string> {
    return Object.fromEntries(
      Object.entries(row).map(([key, value]) => [key, value === undefined || value === null ? '' : String(value)])
    );
  }

  private buildErrorReport(errors: ItemImportRowError[]): string {
    const header = 'Row,Field,Message,Raw Value';
    const lines = errors.map((error) => [
      error.rowNumber,
      error.field,
      error.message,
      error.rawValue || '',
    ].map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','));

    return [header, ...lines].join('\n');
  }
}
