import { Request, Response } from 'express';
import { ItemService } from '../services/itemService';
import { createItemBodySchema, listItemsQuerySchema } from '../schemas/itemSchemas';
import { sendPaginatedResponse, sendResponse } from '../utils/apiResponse';

// Class-based, matching the production controller pattern: thin orchestration over an injected service.
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

  async createItem(req: Request, res: Response) {
    const body = createItemBodySchema.parse(req.body);
    const item = await this.itemService.create(body);
    sendResponse(res, { message: 'Item created successfully', data: item }, 201);
  }
}
