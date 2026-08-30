/**
 * DI Container Registration
 * 
 * Sets up the dependency container and resolves all dependencies.
 * This is the single place where concrete implementations are wired together.
 */

import { PrismaClient } from '@prisma/client';
import { Cradle } from './types';
import { ItemRepository } from '../repositories/ItemRepository';
import { ItemService } from '../services/ItemService';
import { ItemExportService } from '../services/ItemExportService';
import { ItemImageService } from '../services/ItemImageService';
import { ItemImportService } from '../services/ItemImportService';
import { ItemController } from '../controllers/ItemController';

export class Container {
  private static instance: Cradle;

  static initialize(prisma: PrismaClient): Cradle {
    if (!Container.instance) {
      // Create repository instances
      const itemRepository = new ItemRepository(prisma);

      // Create service instances (pass dependencies)
      const itemService = new ItemService(itemRepository);
      const itemImageService = new ItemImageService(itemRepository);
      const itemImportService = new ItemImportService(itemRepository);
      const itemExportService = new ItemExportService(itemRepository);

      // Create controller instances (pass services)
      const itemController = new ItemController(itemService, itemImageService, itemImportService, itemExportService);

      // Assemble cradle
      Container.instance = {
        itemRepository,
        itemService,
        itemImageService,
        itemImportService,
        itemExportService,
        itemController,
      };
    }

    return Container.instance;
  }

  static getCradle(): Cradle {
    if (!Container.instance) {
      throw new Error('Container not initialized. Call Container.initialize() first.');
    }
    return Container.instance;
  }
}
