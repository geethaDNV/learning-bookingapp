/**
 * IItemRepository Interface
 * 
 * Defines the contract for all Item data access operations.
 * Implementations must provide these methods regardless of data source.
 */

import { CreateItemPayload, UpdateItemPayload } from '../types/index';
import { Item } from '@prisma/client';

export interface IItemRepository {
  /**
   * Create a new item
   */
  create(payload: CreateItemPayload): Promise<Item>;

  /**
   * Find item by ID
   */
  findById(id: number): Promise<Item | null>;

  /**
   * Find item by name (for duplicate checking)
   */
  findByName(name: string): Promise<Item | null>;

  /**
   * Find item by SKU (for duplicate checking)
   */
  findBySku(sku: string): Promise<Item | null>;

  /**
   * Update an existing item
   */
  update(id: number, payload: UpdateItemPayload): Promise<Item>;

  /**
   * Delete an item
   */
  delete(id: number): Promise<boolean>;

  /**
   * List all items with pagination
   */
  list(page: number, pageSize: number): Promise<{ items: Item[]; total: number }>;
}
