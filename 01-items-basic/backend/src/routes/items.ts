import { Router } from 'express';
import { ItemsController } from '../controllers/itemsController';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();
const itemsController = new ItemsController();

router.get('/', asyncHandler((req, res) => itemsController.getItems(req, res)));
router.post('/', asyncHandler((req, res) => itemsController.createItem(req, res)));

export default router;
