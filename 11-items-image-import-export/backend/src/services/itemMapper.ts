import { Item } from '@prisma/client';
import { ItemImageMetadata, ItemResponse } from '../types/index';

type ItemWithImageFields = Item & {
  imageData: Buffer | null;
  thumbnailData: Buffer | null;
  imageMimeType: string | null;
  imageFileName: string | null;
  imageSizeBytes: number | null;
};

export function mapItemToResponse(item: ItemWithImageFields): ItemResponse {
  return {
    id: item.id,
    name: item.name,
    sku: item.sku,
    itemType: item.itemType,
    hsnCode: item.hsnCode,
    sacCode: item.sacCode,
    unit: item.unit,
    salesPrice: Number(item.salesPrice),
    isActive: item.isActive,
    image: mapImageMetadata(item),
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

function mapImageMetadata(item: ItemWithImageFields): ItemImageMetadata | null {
  if (!item.imageData || !item.thumbnailData || !item.imageMimeType || !item.imageFileName || item.imageSizeBytes === null) {
    return null;
  }

  return {
    fileName: item.imageFileName,
    mimeType: item.imageMimeType,
    sizeBytes: item.imageSizeBytes,
    imageDataUrl: `data:${item.imageMimeType};base64,${item.imageData.toString('base64')}`,
    thumbnailDataUrl: `data:${item.imageMimeType};base64,${item.thumbnailData.toString('base64')}`,
  };
}
