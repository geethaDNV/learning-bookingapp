/**
 * DI Container Types
 * 
 * Defines the dependency container interface.
 * All services and repositories are resolved through this container.
 */

import { IItemRepository } from '../repositories/IItemRepository';
import { IItemService } from '../services/IItemService';
import { ItemController } from '../controllers/ItemController';

export interface Cradle {
  itemRepository: IItemRepository;
  itemService: IItemService;
  itemController: ItemController;
}
