# 03 - Image Preview Form Integration

The frontend preview uses the browser's selected `File` before the backend saves anything. That is why preview state is separate from the item record.

## Flow

1. User opens create or edit item form.
2. User chooses `notebook.png`.
3. The form calls `URL.createObjectURL(file)` and shows a preview.
4. User saves the item.
5. The page uploads the image after the item has an `id`.

Create mode must save the item first because the image route needs `:itemId`.

## Edit Mode

Edit mode may already have an image. The form receives `existingImage`. If the user chooses a new file, the preview switches to the pending file. If the user removes the image, the page calls:

```http
DELETE /api/v1/items/:itemId/image
```

This teaches a useful distinction: form state can represent a future change, while the database still holds the current saved image until submit.