# 04 - Image Compression And Storage

The module stores both `imageData` and `thumbnailData` fields so learners can see why production apps often keep two versions of an image.

| Version | Use |
| --- | --- |
| Full image | item detail or edit view |
| Thumbnail | table/list view |

This learning implementation keeps thumbnail generation simple. Production code can replace the helper with a real processor such as Sharp to resize and convert images.

## Numeric Example

If a user uploads a 1.8 MB product photo, showing that photo in every table row is wasteful. A 20 KB thumbnail is enough for the item list.

For 100 items:

| Strategy | Approx list payload |
| --- | ---: |
| Full images | 180 MB |
| Thumbnails | 2 MB |

The lesson is not only storage. Smaller thumbnails also make the UI faster and less likely to block the item list.