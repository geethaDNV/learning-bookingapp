/**
 * Item Routes
 * 
 * Defines API endpoints for Item operations.
 * Controllers are resolved from the DI container.
 */

import { Router } from 'express';
import { Cradle } from '../di/types';
import { itemImageUpload, itemImportUpload } from '../middleware/itemFileUpload';

export function createItemRoutes(cradle: Cradle): Router {
  const router = Router();
  const controller = cradle.itemController;

  // POST /items
  router.post('/', (req, res, next) => controller.create(req, res, next));

  // GET /items
  router.get('/', (req, res, next) => controller.list(req, res, next));

  // GET /items/export?format=csv|xlsx
  router.get('/export', (req, res, next) => controller.exportItems(req, res, next));

  // POST /items/import/preview
  router.post('/import/preview', itemImportUpload.single('file'), (req, res, next) => controller.previewImport(req, res, next));

  // POST /items/import/confirm
  router.post('/import/confirm', itemImportUpload.single('file'), (req, res, next) => controller.confirmImport(req, res, next));

  // GET /items/:id
  router.get('/:id', (req, res, next) => controller.getById(req, res, next));

  // POST /items/:id/image
  router.post('/:id/image', itemImageUpload.single('image'), (req, res, next) => controller.uploadImage(req, res, next));

  // DELETE /items/:id/image
  router.delete('/:id/image', (req, res, next) => controller.deleteImage(req, res, next));

  // PUT /items/:id
  router.put('/:id', (req, res, next) => controller.update(req, res, next));

  // DELETE /items/:id
  router.delete('/:id', (req, res, next) => controller.delete(req, res, next));

  return router;
}
