| ID | User Story | Priority | Est. | API Endpoint |
| --- | --- | --- | --- | --- |
| US-078 | As a **User**, I want to **upload ảnh minh chứng (JPG/PNG/WEBP)**, so that **tôi chứng minh hoạt động/đóng góp**. | HIGH | M | `POST /upload/image` |
| US-079 | As a **User**, I want to **upload tài liệu (PDF/DOC/XLS)**, so that **tôi lưu trữ kế hoạch/báo cáo**. | HIGH | M | `POST /upload/document` |

---

## API Specifications

### US-078: Upload ảnh minh chứng

**Endpoint:** `POST /upload/image`

**Description:** Upload image files (JPG, PNG, WEBP) for proof/evidence of activities or donations. Maximum file size is 5MB. Files are stored locally on the server.

**Authentication:** Required (Bearer Token)

**Content-Type:** `multipart/form-data`

#### Storage Configuration

- **Storage Type:** Local filesystem
- **Base Path:** `/uploads/images/`
- **Public URL Pattern:** `/static/images/<filename>`

#### Request

| Field | Type | Required | Description | Constraints |
| --- | --- | --- | --- | --- |
| file | File | Yes | Image file to upload | Max size: 5MB, Allowed: JPG/PNG/WEBP |

#### Response

**Success (200 OK):**

```json
{
  "success": true,
  "data": {
    "url": "/static/images/<uuid>.jpg",
    "filename": "<uuid>.jpg",
    "originalName": "proof.jpg",
    "mimeType": "image/jpeg",
    "size": 2097152,
    "path": "/uploads/images/<uuid>.jpg"
  }
}
```

| Field | Type | Description |
| --- | --- | --- |
| success | boolean | Request status |
| data.url | string | Public URL to access the uploaded file (relative path) |
| data.filename | string | Generated unique filename |
| data.originalName | string | Original filename from client |
| data.mimeType | string | MIME type of the file |
| data.size | number | File size in bytes |
| data.path | string | Absolute file path on server |

**Error (400 Bad Request - Invalid File Type):**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Chỉ chấp nhận file ảnh JPG, PNG, WEBP"
  }
}
```

**Error (400 Bad Request - File Too Large):**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Kích thước file không được vượt quá 5MB"
  }
}
```

**Error (400 Bad Request - Missing File):**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "File là bắt buộc"
  }
}
```

**Error (401 Unauthorized):**

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Unauthorized"
  }
}
```

**Error (500 Internal Server Error - Storage Error):**

```json
{
  "success": false,
  "error": {
    "code": "STORAGE_ERROR",
    "message": "Không thể lưu trữ file"
  }
}
```

#### Test Scenarios

```gherkin
Feature: Upload Image

Scenario: Upload ảnh JPG thành công
    Given tôi đã đăng nhập
    When tôi gửi POST /upload/image với multipart/form-data:
        | file | "proof.jpg" (Content-Type: image/jpeg, size: 2MB) |
    Then response status là 200
    And response data chứa:
        | url | "/static/images/<uuid>.jpg" |
        | path | "/uploads/images/<uuid>.jpg" |
    And file được lưu trữ tại "/uploads/images/<uuid>.jpg"

Scenario: Upload ảnh PNG thành công
    Given tôi đã đăng nhập
    When tôi gửi POST /upload/image với multipart/form-data:
        | file | "proof.png" (Content-Type: image/png) |
    Then response status là 200
    And response data chứa URL hợp lệ

Scenario: Upload ảnh WEBP thành công
    Given tôi đã đăng nhập
    When tôi gửi POST /upload/image với multipart/form-data:
        | file | "proof.webp" (Content-Type: image/webp) |
    Then response status là 200

Scenario: Upload thất bại khi file không phải ảnh
    Given tôi đã đăng nhập
    When tôi gửi POST /upload/image với multipart/form-data:
        | file | "document.pdf" (Content-Type: application/pdf) |
    Then response status là 400
    And response error code là "VALIDATION_ERROR"
    And response message là "Chỉ chấp nhận file ảnh JPG, PNG, WEBP"

Scenario: Upload thất bại khi file quá lớn
    Given tôi đã đăng nhập
    When tôi gửi POST /upload/image với file size 6MB
    Then response status là 400
    And response error code là "VALIDATION_ERROR"
    And response message là "Kích thước file không được vượt quá 5MB"

Scenario: Upload thất bại khi không có file
    Given tôi đã đăng nhập
    When tôi gửi POST /upload/image với body rỗng
    Then response status là 400
    And response error code là "VALIDATION_ERROR"
    And response message là "File là bắt buộc"

Scenario: Upload thất bại khi chưa đăng nhập
    When tôi gửi POST /upload/image không có token
    Then response status là 401
    And response error code là "UNAUTHORIZED"
```

---

### US-079: Upload tài liệu

**Endpoint:** `POST /upload/document`

**Description:** Upload document files (PDF, DOC, DOCX, XLS, XLSX) for plans, reports, and other documents. Maximum file size is 10MB. Files are stored locally on the server.

**Authentication:** Required (Bearer Token)

**Content-Type:** `multipart/form-data`

#### Storage Configuration

- **Storage Type:** Local filesystem
- **Base Path:** `/uploads/documents/`
- **Public URL Pattern:** `/static/documents/<filename>`

#### Request

| Field | Type | Required | Description | Constraints |
| --- | --- | --- | --- | --- |
| file | File | Yes | Document file to upload | Max size: 10MB, Allowed: PDF/DOC/DOCX/XLS/XLSX |

#### Response

**Success (200 OK):**

```json
{
  "success": true,
  "data": {
    "url": "/static/documents/<uuid>.pdf",
    "filename": "<uuid>.pdf",
    "originalName": "plan.pdf",
    "mimeType": "application/pdf",
    "size": 3145728,
    "path": "/uploads/documents/<uuid>.pdf"
  }
}
```

| Field | Type | Description |
| --- | --- | --- |
| success | boolean | Request status |
| data.url | string | Public URL to access the uploaded file (relative path) |
| data.filename | string | Generated unique filename |
| data.originalName | string | Original filename from client |
| data.mimeType | string | MIME type of the file |
| data.size | number | File size in bytes |
| data.path | string | Absolute file path on server |

**Error (400 Bad Request - Invalid File Type):**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Chỉ chấp nhận file PDF, DOC, DOCX, XLS, XLSX"
  }
}
```

**Error (400 Bad Request - File Too Large):**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Kích thước file không được vượt quá 10MB"
  }
}
```

**Error (400 Bad Request - Missing File):**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "File là bắt buộc"
  }
}
```

**Error (401 Unauthorized):**

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Unauthorized"
  }
}
```

**Error (500 Internal Server Error - Storage Error):**

```json
{
  "success": false,
  "error": {
    "code": "STORAGE_ERROR",
    "message": "Không thể lưu trữ file"
  }
}
```

#### Test Scenarios

```gherkin
Feature: Upload Document

Scenario: Upload PDF thành công
    Given tôi đã đăng nhập
    When tôi gửi POST /upload/document với multipart/form-data:
        | file | "plan.pdf" (Content-Type: application/pdf, size: 3MB) |
    Then response status là 200
    And response data chứa URL hợp lệ
    And file được lưu trữ tại "/uploads/documents/<uuid>.pdf"

Scenario: Upload DOCX thành công
    Given tôi đã đăng nhập
    When tôi gửi POST /upload/document với multipart/form-data:
        | file | "plan.docx" |
    Then response status là 200

Scenario: Upload XLSX thành công
    Given tôi đã đăng nhập
    When tôi gửi POST /upload/document với multipart/form-data:
        | file | "budget.xlsx" |
    Then response status là 200

Scenario: Upload thất bại khi file không đúng định dạng
    Given tôi đã đăng nhập
    When tôi gửi POST /upload/document với multipart/form-data:
        | file | "image.jpg" (Content-Type: image/jpeg) |
    Then response status là 400
    And response error code là "VALIDATION_ERROR"
    And response message là "Chỉ chấp nhận file PDF, DOC, DOCX, XLS, XLSX"

Scenario: Upload thất bại khi file quá lớn
    Given tôi đã đăng nhập
    When tôi gửi POST /upload/document với file size 15MB
    Then response status là 400
    And response error code là "VALIDATION_ERROR"
    And response message là "Kích thước file không được vượt quá 10MB"
```

---

## Local Storage Configuration

### Environment Variables

| Variable | Description | Default |
| --- | --- | --- |
| `UPLOAD_BASE_PATH` | Base directory for all uploads | `/uploads` |
| `UPLOAD_IMAGE_PATH` | Subdirectory for images | `/uploads/images` |
| `UPLOAD_DOCUMENT_PATH` | Subdirectory for documents | `/uploads/documents` |
| `STATIC_URL_PREFIX` | URL prefix for serving static files | `/static` |

### Directory Structure

```
/uploads/
├── images/         # Image files (JPG, PNG, WEBP)
│   ├── <uuid>.jpg
│   ├── <uuid>.png
│   └── <uuid>.webp
└── documents/      # Document files (PDF, DOC, DOCX, XLS, XLSX)
    ├── <uuid>.pdf
    ├── <uuid>.docx
    └── <uuid>.xlsx
```

### Static File Serving

The application should serve uploaded files as static content:

- **Images:** `GET /static/images/<filename>` → serves from `/uploads/images/`
- **Documents:** `GET /static/documents/<filename>` → serves from `/uploads/documents/`

### Security Considerations

1. **File Access Control:** Implement middleware to check authentication before serving sensitive documents
2. **Path Traversal Protection:** Validate filenames to prevent directory traversal attacks
3. **File Type Validation:** Verify MIME type matches file extension
4. **Storage Quota:** Implement per-user storage limits
5. **Virus Scanning:** Optional integration with antivirus for document uploads
