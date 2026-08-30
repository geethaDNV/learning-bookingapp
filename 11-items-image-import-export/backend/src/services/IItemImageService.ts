import { ItemImageUploadResult, ItemResponse } from '../types/index';

export interface IItemImageService {
  uploadImage(itemId: number, file: Express.Multer.File): Promise<ItemImageUploadResult>;
  deleteImage(itemId: number): Promise<ItemResponse>;
}
