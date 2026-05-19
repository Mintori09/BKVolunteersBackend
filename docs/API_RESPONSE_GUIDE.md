# API Response & Error Handling Guide

This project uses a standardized response and error handling system to ensure consistency across all API endpoints.

## 1. Successful Responses (`ApiResponse.success`)

Always use the `ApiResponse.success` method to return data. This ensures the frontend always receives the same JSON structure.

### Usage

```typescript
import { ApiResponse } from "src/utils/ApiResponse";
import { HttpStatus } from "src/common/constants";

// Simple success message
return ApiResponse.success(res, null, "Operation successful");

// Success with data
const user = { id: 1, name: "John" };
return ApiResponse.success(res, user, "User retrieved successfully");

// Custom Status Code (Default is 200 OK)
return ApiResponse.success(res, newUser, "User created", HttpStatus.CREATED);
```

### Response Format

```json
{
  "success": true,
  "message": "User retrieved successfully",
  "data": {
    "id": 1,
    "name": "John"
  }
}
```

---

## 2. Error Handling (`ApiError` & `errorHandler`)

Errors should be handled by throwing an `ApiError`. These are automatically caught by the `catchAsync` wrapper and processed by the central `errorHandler` middleware.

### Usage

```typescript
import { ApiError } from "src/utils/ApiError";
import { HttpStatus } from "src/common/constants";

// Standard Error
throw new ApiError(HttpStatus.NOT_FOUND, "User not found");

// Validation Error (Structured)
const validationErrors = [{ field: "email", message: "Invalid email format" }];
throw new ApiError(
  HttpStatus.BAD_REQUEST,
  "Validation failed",
  true,
  validationErrors,
);
```

### Response Format (Production)

```json
{
  "success": false,
  "message": "User not found",
  "errors": null
}
```

### Response Format (Development)

In development mode (`NODE_ENV=development`), the response includes the stack trace for easier debugging:

```json
{
  "success": false,
  "message": "User not found",
  "errors": null,
  "stack": "Error: User not found\n    at handleRequest (controller.ts:10:15)..."
}
```

---

## 3. Async Wrapper (`catchAsync`)

To avoid repetitive `try-catch` blocks, wrap your controller functions with `catchAsync`. This automatically forwards any thrown errors to the `errorHandler`.

```typescript
export const getMe = catchAsync(async (req: Request, res: Response) => {
  const user = await service.getUser(req.userId);
  if (!user) {
    throw new ApiError(HttpStatus.NOT_FOUND, "User not found");
  }
  return ApiResponse.success(res, user);
});
```

---

## 4. Automatic Validation

The `validate` middleware uses `ApiError` internally. If a Zod schema validation fails, it will automatically return a `400 Bad Request` with the structured `errors` array.

```typescript
// Example of a validation error response
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "body.email",
      "message": "Invalid email"
    }
  ]
}
```
