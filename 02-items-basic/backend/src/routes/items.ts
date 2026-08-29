import { Router } from 'express';
import { ItemsController } from '../controllers/itemsController';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();
const itemsController = new ItemsController();

router.get('/', asyncHandler((req, res) => itemsController.getItems(req, res)));
router.get('/:id', asyncHandler((req, res) => itemsController.getItem(req, res)));
router.post('/', asyncHandler((req, res) => itemsController.createItem(req, res)));
router.put('/:id', asyncHandler((req, res) => itemsController.updateItem(req, res)));
router.patch('/:id/status', asyncHandler((req, res) => itemsController.updateItemStatus(req, res)));
router.delete('/:id', asyncHandler((req, res) => itemsController.deleteItem(req, res)));

export default router;