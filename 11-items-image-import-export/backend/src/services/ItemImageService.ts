import { IItemRepository } from '../repositories/IItemRepository';
import { AppError, NotFoundError } from '../errors/appError';
import { ItemImageUploadResult, ItemResponse } from '../types/index';
import { mapItemToResponse } from './itemMapper';
import { IItemImageService } from './IItemImageService';

export class ItemImageService implements IItemImageService {
  constructor(private readonly itemRepository: IItemRepository) {}

  async uploadImage(itemId: number, file: Express.Multer.File): Promise<ItemImageUploadResult> {
    const existing = await this.itemRepository.findById(itemId);
    if (!existing) {
      throw new NotFoundError('Item not found');
    }

    if (!file) {
      throw new AppError('Image file is required', 'IMAGE_REQUIRED', 400);
    }

    const item = await this.itemRepository.updateImage(itemId, {
      imageData: file.buffer,
      thumbnailData: file.buffer,
      imageMimeType: file.mimetype,
      imageFileName: file.originalname,
      imageSizeBytes: file.size,
    });
    const mapped = mapItemToResponse(item);

    if (!mapped.image) {
      throw new AppError('Image metadata could not be created', 'IMAGE_METADATA_FAILED', 500);
    }

    return {
      item: mapped,
      image: mapped.image,
    };
  }

  async deleteImage(itemId: number): Promise<ItemResponse> {
    const existing = await this.itemRepository.findById(itemId);
    if (!existing) {
      throw new NotFoundError('Item not found');
    }

    const item = await this.itemRepository.clearImage(itemId);
    return mapItemToResponse(item);
  }
}
