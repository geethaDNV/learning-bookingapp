/**
 * ItemController
 * 
 * Handles HTTP requests for Item operations.
 * Receives IItemService through constructor injection.
 * Validates requests using Zod schemas and handles errors.
 */

import { Request, Response, NextFunction } from 'express';
import { IItemService } from '../services/IItemService';
import {
  createItemSchema,
  updateItemSchema,
  itemIdSchema,
  listQuerySchema,
} from '../schemas/itemSchemas';

export class ItemController {
  constructor(private itemService: IItemService) {}

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
}
