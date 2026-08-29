import { Request, Response } from 'express';
import {
  createItemBodySchema,
  itemIdParamSchema,
  listItemsQuerySchema,
  updateItemBodySchema,
  updateItemStatusBodySchema,
} from '../schemas/itemSchemas';
import { ItemService } from '../services/itemService';
import { sendMessageResponse, sendPaginatedResponse, sendResponse } from '../utils/apiResponse';

export class ItemsController {
  constructor(private readonly itemService: ItemService = new ItemService()) {}

  async getItems(req: Request, res: Response) {
    const query = listItemsQuerySchema.parse(req.query);
    const result = await this.itemService.search(query);
    sendPaginatedResponse(res, {
      message: 'Items fetched successfully',
      data: result.rows,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
    });
  }

  async getItem(req: Request, res: Response) {
    const { id } = itemIdParamSchema.parse(req.params);
    const item = await this.itemService.getById(id);
    sendResponse(res, { message: 'Item fetched successfully', data: item });
  }

  async createItem(req: Request, res: Response) {
    const body = createItemBodySchema.parse(req.body);
    const item = await this.itemService.create(body);
    sendResponse(res, { message: 'Item created successfully', data: item }, 201);
  }

  async updateItem(req: Request, res: Response) {
    const { id } = itemIdParamSchema.parse(req.params);
    const body = updateItemBodySchema.parse(req.body);
    const item = await this.itemService.update(id, body);
    sendResponse(res, { message: 'Item updated successfully', data: item });
  }

  async updateItemStatus(req: Request, res: Response) {
    const { id } = itemIdParamSchema.parse(req.params);
    const { isActive } = updateItemStatusBodySchema.parse(req.body);
    const item = await this.itemService.setStatus(id, isActive);
    sendResponse(res, {
      message: isActive ? 'Item reactivated successfully' : 'Item inactivated successfully',
      data: item,
    });
  }

  async deleteItem(req: Request, res: Response) {
    const { id } = itemIdParamSchema.parse(req.params);
    await this.itemService.delete(id);
    sendMessageResponse(res, 'Item deleted successfully');
  }
}