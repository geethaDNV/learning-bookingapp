import multer from 'multer';
import {
  ITEM_IMAGE_ALLOWED_MIME_TYPES,
  ITEM_IMAGE_UPLOAD_LIMITS,
  ITEM_IMPORT_ALLOWED_MIME_TYPES,
} from '../constants/itemFileConstants';

const storage = multer.memoryStorage();

export const itemImageUpload = multer({
  storage,
  limits: {
    fileSize: ITEM_IMAGE_UPLOAD_LIMITS.MAX_SIZE_BYTES,
  },
  fileFilter: (_req, file, callback) => {
    if (!ITEM_IMAGE_ALLOWED_MIME_TYPES.includes(file.mimetype as typeof ITEM_IMAGE_ALLOWED_MIME_TYPES[number])) {
      callback(new Error('Only JPEG, PNG, and WebP item images are allowed'));
      return;
    }

    callback(null, true);
  },
});

export const itemImportUpload = multer({
  storage,
  limits: {
    fileSize: 1 * 1024 * 1024,
  },
  fileFilter: (_req, file, callback) => {
    if (!ITEM_IMPORT_ALLOWED_MIME_TYPES.includes(file.mimetype as typeof ITEM_IMPORT_ALLOWED_MIME_TYPES[number])) {
      callback(new Error('Only CSV and XLSX item import files are allowed'));
      return;
    }

    callback(null, true);
  },
});
