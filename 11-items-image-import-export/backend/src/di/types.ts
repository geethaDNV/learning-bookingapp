/**
 * DI Container Types
 * 
 * Defines the dependency container interface.
 * All services and repositories are resolved through this container.
 */

import { IItemRepository } from '../repositories/IItemRepository';
import { IItemExportService } from '../services/IItemExportService';
import { IItemImageService } from '../services/IItemImageService';
import { IItemImportService } from '../services/IItemImportService';
import { IItemService } from '../services/IItemService';
import { ItemController } from '../controllers/ItemController';

export interface Cradle {
  itemRepository: IItemRepository;
  itemService: IItemService;
  itemImageService: IItemImageService;
  itemImportService: IItemImportService;
  itemExportService: IItemExportService;
  itemController: ItemController;
}
