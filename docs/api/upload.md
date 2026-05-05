# Upload API

> Base URLs: `/api/v1/upload`, `/api/v1/files`

## Overview

Upload endpoints return file metadata and a public URL. File-serving endpoints stream stored files back to authenticated callers.

## Endpoints

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/image` | Yes | Upload an image file |
| `POST` | `/document` | Yes | Upload a document file |
| `GET` | `/images/:filename` | Yes | Serve an uploaded image |
| `GET` | `/documents/:filename` | Yes | Serve an uploaded document |

## Common Errors

- `400 Bad Request` when the file is missing or the filename is invalid.
- `401 Unauthorized` when the caller is not authenticated for file-serving routes.
- `404 Not Found` when the requested file does not exist.

## Upload Image

`POST /api/v1/upload/image`

Content type: `multipart/form-data`

Input

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| `file` | file | Yes | JPG, PNG, WEBP; max 5MB |

Output

```json
{
  "url": "string",
  "filename": "string",
  "originalName": "string",
  "mimeType": "string",
  "size": 0,
  "path": "string"
}
```

Errors

- `400` if the file is missing or invalid.

## Upload Document

`POST /api/v1/upload/document`

Content type: `multipart/form-data`

Input

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| `file` | file | Yes | PDF, DOC, DOCX, XLS, XLSX; max 10MB |

Output

```json
{
  "url": "string",
  "filename": "string",
  "originalName": "string",
  "mimeType": "string",
  "size": 0,
  "path": "string"
}
```

Errors

- `400` if the file is missing or invalid.

## Serve Files

`GET /api/v1/files/images/:filename`

`GET /api/v1/files/documents/:filename`

Both file-serving routes require authentication and stream files from the local upload directory.

Input

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| `filename` | string | Yes | The stored file name |

Errors

- `400` if the filename is missing or attempts path traversal.
- `404` if the file does not exist.
