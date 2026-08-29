import { Prisma } from '@prisma/client';
import { ConflictError, NotFoundError } from '../errors/appError';
import { ItemFilters, ItemRepository } from '../repositories/itemRepository';
import { CreateItemBody, ListItemsQuery, UpdateItemBody } from '../schemas/itemSchemas';

export class ItemService {
  constructor(private readonly itemRepository: ItemRepository = new ItemRepository()) {}

  async search(query: ListItemsQuery) {
    const filters: ItemFilters = {
      search: query.search,
      status: query.status,
      itemType: query.itemType,
      code: query.code,
    };

    const [rows, total] = await Promise.all([
      this.itemRepository.findPaged(filters, query.page, query.pageSize),
      this.itemRepository.count(filters),
    ]);

    return { rows, total, page: query.page, pageSize: query.pageSize };
  }

  async getById(id: number) {
    const item = await this.itemRepository.findById(id);
    if (!item) {
      throw new NotFoundError(`Item ${id} was not found`);
    }
    return item;
  }

  async create(payload: CreateItemBody) {
    await this.ensureNameIsAvailable(payload.name);
    if (payload.sku) {
      await this.ensureSkuIsAvailable(payload.sku);
    }

    return this.itemRepository.create(payload);
  }

  async update(id: number, payload: UpdateItemBody) {
    await this.getById(id);

    if (payload.name) {
      await this.ensureNameIsAvailable(payload.name, id);
    }
    if (payload.sku) {
      await this.ensureSkuIsAvailable(payload.sku, id);
    }

    return this.itemRepository.update(id, payload as Prisma.ItemUpdateInput);
  }

  async setStatus(id: number, isActive: boolean) {
    await this.getById(id);
    return this.itemRepository.setStatus(id, isActive);
  }

  async delete(id: number) {
    await this.getById(id);
    return this.itemRepository.delete(id);
  }

  private async ensureNameIsAvailable(name: string, currentItemId?: number) {
    const existing = await this.itemRepository.findByName(name);
    if (existing && existing.id !== currentItemId) {
      throw new ConflictError(`An item named "${name}" already exists`);
    }
  }

  private async ensureSkuIsAvailable(sku: string, currentItemId?: number) {
    const existing = await this.itemRepository.findBySku(sku);
    if (existing && existing.id !== currentItemId) {
      throw new ConflictError(`An item with SKU "${sku}" already exists`);
    }
  }
}