import { ItemFilters, ItemRepository } from '../repositories/itemRepository';
import { CreateItemBody, ListItemsQuery } from '../schemas/itemSchemas';
import { AppError } from '../errors/appError';

// Class-based, matching the production service pattern: business logic composed over an injected repository.
export class ItemService {
  constructor(private readonly itemRepository: ItemRepository = new ItemRepository()) {}

  async search(query: ListItemsQuery) {
    const filters: ItemFilters = { search: query.search, status: query.status };
    const [rows, total] = await Promise.all([
      this.itemRepository.findMany(filters, query.page, query.pageSize),
      this.itemRepository.count(filters),
    ]);

    return { rows, total, page: query.page, pageSize: query.pageSize };
  }

  async create(payload: CreateItemBody) {
    try {
      return await this.itemRepository.create(payload);
    } catch (error: unknown) {
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
        throw new AppError(`An item named "${payload.name}" already exists`, 409, 'DUPLICATE_ITEM');
      }
      throw error;
    }
  }
}
