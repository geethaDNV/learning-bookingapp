/**
 * Item Routes
 * 
 * Defines API endpoints for Item operations.
 * Controllers are resolved from the DI container.
 */

import { Router } from 'express';
import { Cradle } from '../di/types';

export function createItemRoutes(cradle: Cradle): Router {
  const router = Router();
  const controller = cradle.itemController;

  // POST /items
  router.post('/', (req, res, next) => controller.create(req, res, next));

  // GET /items
  router.get('/', (req, res, next) => controller.list(req, res, next));

  // GET /items/:id
  router.get('/:id', (req, res, next) => controller.getById(req, res, next));

  // PUT /items/:id
  router.put('/:id', (req, res, next) => controller.update(req, res, next));

  // DELETE /items/:id
  router.delete('/:id', (req, res, next) => controller.delete(req, res, next));

  return router;
}
