/**
 * ItemService Implementation
 * 
 * Business logic for Item operations.
 * Handles validation, error checking, and coordination between repositories.
 */

import { IItemService } from './IItemService';
import { IItemRepository } from '../repositories/IItemRepository';
import { CreateItemPayload, UpdateItemPayload, ItemResponse, ItemListResponse } from '../types/index';
import { mapItemToResponse } from './itemMapper';

export class ItemService implements IItemService {
  constructor(private itemRepository: IItemRepository) {}

  async createItem(payload: CreateItemPayload): Promise<ItemResponse> {
    // Check for duplicate name
    const existingByName = await this.itemRepository.findByName(payload.name);
    if (existingByName) {
      const error = new Error('Item with this name already exists');
      Object.assign(error, { code: 'DUPLICATE_NAME' });
      throw error;
    }

    // Check for duplicate SKU
    const existingBySku = await this.itemRepository.findBySku(payload.sku);
    if (existingBySku) {
      const error = new Error('Item with this SKU already exists');
      Object.assign(error, { code: 'DUPLICATE_SKU' });
      throw error;
    }

    const item = await this.itemRepository.create(payload);
    return this.mapToResponse(item);
  }

  async getItemById(id: number): Promise<ItemResponse> {
    const item = await this.itemRepository.findById(id);
    if (!item) {
      const error = new Error('Item not found');
      Object.assign(error, { code: 'NOT_FOUND', statusCode: 404 });
      throw error;
    }
    return this.mapToResponse(item);
  }

  async updateItem(id: number, payload: UpdateItemPayload): Promise<ItemResponse> {
    // Verify item exists
    const existing = await this.itemRepository.findById(id);
    if (!existing) {
      const error = new Error('Item not found');
      Object.assign(error, { code: 'NOT_FOUND', statusCode: 404 });
      throw error;
    }

    // Check for duplicate name (if updating name)
    if (payload.name && payload.name !== existing.name) {
      const duplicate = await this.itemRepository.findByName(payload.name);
      if (duplicate) {
        const error = new Error('Item with this name already exists');
        Object.assign(error, { code: 'DUPLICATE_NAME' });
        throw error;
      }
    }

    // Check for duplicate SKU (if updating SKU)
    if (payload.sku && payload.sku !== existing.sku) {
      const duplicate = await this.itemRepository.findBySku(payload.sku);
      if (duplicate) {
        const error = new Error('Item with this SKU already exists');
        Object.assign(error, { code: 'DUPLICATE_SKU' });
        throw error;
      }
    }

    const updated = await this.itemRepository.update(id, payload);
    return this.mapToResponse(updated);
  }

  async deleteItem(id: number): Promise<void> {
    const existing = await this.itemRepository.findById(id);
    if (!existing) {
      const error = new Error('Item not found');
      Object.assign(error, { code: 'NOT_FOUND', statusCode: 404 });
      throw error;
    }

    const success = await this.itemRepository.delete(id);
    if (!success) {
      throw new Error('Failed to delete item');
    }
  }

  async listItems(page: number, pageSize: number): Promise<ItemListResponse> {
    const { items, total } = await this.itemRepository.list(page, pageSize);
    const totalPages = Math.ceil(total / pageSize);

    return {
      items: items.map(item => this.mapToResponse(item)),
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  private mapToResponse(item: Parameters<typeof mapItemToResponse>[0]): ItemResponse {
    return mapItemToResponse(item);
  }
}
