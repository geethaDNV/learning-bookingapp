/**
 * IItemService Interface
 * 
 * Defines the contract for business logic operations on Items.
 * Services provide higher-level operations than repositories,
 * including validation, error handling, and business rules.
 */

import { CreateItemPayload, UpdateItemPayload, ItemResponse, ItemListResponse } from '../types/index';

export interface IItemService {
  /**
   * Create a new item with validation
   * @throws Error if name or SKU is duplicate
   */
  createItem(payload: CreateItemPayload): Promise<ItemResponse>;

  /**
   * Get item by ID
   * @throws Error if item not found
   */
  getItemById(id: number): Promise<ItemResponse>;

  /**
   * Update an existing item with validation
   * @throws Error if item not found or duplicate name/SKU
   */
  updateItem(id: number, payload: UpdateItemPayload): Promise<ItemResponse>;

  /**
   * Delete an item
   * @throws Error if item not found
   */
  deleteItem(id: number): Promise<void>;

  /**
   * List items with pagination
   */
  listItems(page: number, pageSize: number): Promise<ItemListResponse>;
}
