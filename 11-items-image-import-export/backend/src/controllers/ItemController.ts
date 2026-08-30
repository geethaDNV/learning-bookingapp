/**
 * ItemController
 * 
 * Handles HTTP requests for Item operations.
 * Receives IItemService through constructor injection.
 * Validates requests using Zod schemas and handles errors.
 */

import { Request, Response, NextFunction } from 'express';
import { IItemService } from '../services/IItemService';
import { IItemImageService } from '../services/IItemImageService';
import { IItemImportService } from '../services/IItemImportService';
import { IItemExportService } from '../services/IItemExportService';
import {
  createItemSchema,
  exportQuerySchema,
  importOptionsSchema,
  updateItemSchema,
  itemIdSchema,
  listQuerySchema,
} from '../schemas/itemSchemas';
import { AppError } from '../errors/appError';

export class ItemController {
  constructor(
    private itemService: IItemService,
    private itemImageService: IItemImageService,
    private itemImportService: IItemImportService,
    private itemExportService: IItemExportService
  ) {}

  /**
   * POST /items
   * Create a new item
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = createItemSchema.parse(req.body);
      const item = await this.itemService.createItem(validatedData);
      res.status(201).json(item);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /items/:id
   * Get a single item by ID
   */
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = itemIdSchema.parse(req.params);
      const item = await this.itemService.getItemById(id);
      res.json(item);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /items/:id
   * Update an existing item
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = itemIdSchema.parse(req.params);
      const validatedData = updateItemSchema.parse(req.body);
      const item = await this.itemService.updateItem(id, validatedData);
      res.json(item);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /items/:id
   * Delete an item
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = itemIdSchema.parse(req.params);
      await this.itemService.deleteItem(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /items
   * List all items with pagination
   */
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, pageSize } = listQuerySchema.parse(req.query);
      const result = await this.itemService.listItems(page, pageSize);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async uploadImage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = itemIdSchema.parse(req.params);
      if (!req.file) {
        throw new AppError('Image file is required', 'IMAGE_REQUIRED', 400);
      }

      const result = await this.itemImageService.uploadImage(id, req.file);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async deleteImage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = itemIdSchema.parse(req.params);
      const item = await this.itemImageService.deleteImage(id);
      res.json(item);
    } catch (error) {
      next(error);
    }
  }

  async previewImport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        throw new AppError('Import file is required', 'IMPORT_FILE_REQUIRED', 400);
      }

      const options = importOptionsSchema.parse(this.parseJsonBody(req.body.options));
      const result = await this.itemImportService.preview(req.file, options);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async confirmImport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        throw new AppError('Import file is required', 'IMPORT_FILE_REQUIRED', 400);
      }

      const options = importOptionsSchema.parse(this.parseJsonBody(req.body.options));
      const result = await this.itemImportService.confirm(req.file, options);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async exportItems(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { format, ...filters } = exportQuerySchema.parse(req.query);
      const result = await this.itemExportService.exportItems(format, filters);
      res.setHeader('Content-Type', result.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.fileName}"`);
      res.send(result.buffer);
    } catch (error) {
      next(error);
    }
  }

  private parseJsonBody(value: unknown): unknown {
    if (!value) {
      return {};
    }

    if (typeof value === 'string') {
      return JSON.parse(value);
    }

    return value;
  }
}
