# 02 - Image Upload Basics

Normal create/update item requests send JSON. Image upload sends `multipart/form-data`, which means the backend needs upload middleware before the controller can read the file.

In this module, the route is:

```http
POST /api/v1/items/:itemId/image
```

The form field name is `image`.

## Validation Rules

The learning module accepts:

| Rule | Value |
| --- | --- |
| MIME types | `image/jpeg`, `image/png`, `image/webp` |
| Max size | 2 MB |
| Storage | item image bytes plus metadata |

MIME type checks are a boundary check, not a complete security system. Production systems may also inspect magic bytes, strip metadata, virus-scan uploads, and store images in object storage.

## Example

A valid upload for item `12`:

```http
POST /api/v1/items/12/image
Content-Type: multipart/form-data
image = notebook.webp
```

The backend stores the image buffer, thumbnail buffer, MIME type, original filename, and size. The response returns enough metadata for the UI to show the image immediately.