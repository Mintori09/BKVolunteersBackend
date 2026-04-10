# Express TS Starter Kit - Documentation

This document outlines the architecture, error handling standards, and logic workflows for the features.

---

## 1. Layered Architecture

The project follows a **Controller-Service-Repository** pattern:

1. **Controllers**:
    - Handle incoming HTTP requests.
    - Wrapped in `catchAsync` to automate error propagation to the global error handler.
    - Use `ApiResponse` for consistent JSON responses.
2. **Services**:
    - Contain the core business logic.
    - Agnostic of the HTTP layer (no `req`/`res` objects).
    - Throw `ApiError` for operational failures.
3. **Repositories**:
    - Abstract database operations (Prisma).
    - Provide a clean interface for data persistence.

---

## 2. Error Handling & Standardization

- **ApiError**: A custom class for operational errors (e.g., 404, 400).
- **Global Error Handler**: Catches all errors, logs them using `winston`, and returns a standardized JSON response.
- **ApiResponse**: Utility to ensure all success responses have a consistent `{ success, message, data }` structure.
- **Paginate**: A generic utility for Prisma that handles `page`, `limit`, `sortBy`, `sortOrder`, and `search` parameters.

---

## 3. Database Models (Prisma)

The system uses a relational database (MySQL/MariaDB) with the following models:

| Model                      | Description                                                       | Key Effects                                                                     |
| :------------------------- | :---------------------------------------------------------------- | :------------------------------------------------------------------------------ |
| **User**                   | The central entity representing a registered user.                | Stores hashed passwords and `emailVerified` status. Cascades to `Account`.      |
| **Account**                | Stores third-party OAuth provider details (e.g., Google, GitHub). | Links multiple authentication methods to a single `User`.                       |
| **RefreshToken**           | Stores active session tokens.                                     | Enables long-lived sessions and token rotation. Linked to `User` via `userId`.  |
| **ResetToken**             | Stores temporary tokens for password recovery.                    | Validates password change requests; includes an `expiresAt` field for security. |
| **EmailVerificationToken** | Stores temporary tokens for email verification.                   | Used to confirm user email ownership before allowing full account access.       |

---

## 4. API Workflows

### A. Authentication Feature (`src/features/auth`)

#### 1. Login (`POST /login`)

1. **Credential Check:** Validates email existence and verifies the Argon2 password hash.
2. **Verification Check:** Blocks login if `emailVerified` is null.
3. **Session Management:**
    - If an old refresh token exists in cookies, it detects potential reuse or simply rotates the session.
    - Deletes existing tokens if a security conflict is detected.
4. **Token Issuance:** Generates a new Access Token (JWT) and Refresh Token.
5. **Persistence:** Saves the new `RefreshToken` to the DB and sets it as an `HttpOnly` cookie.

#### 2. Logout (`POST /logout`)

1. **Token Cleanup:** Identifies the `RefreshToken` from the request cookie.
2. **DB Removal:** Deletes the corresponding record from the `RefreshToken` table.
3. **Cookie Removal:** Clears the refresh token cookie from the client.

#### 3. Token Refresh (`POST /refresh`)

1. **Verification:** Validates the `RefreshToken` from the cookie against the database.
2. **Rotation:** Deletes the used token and issues a brand new Access/Refresh token pair (Token Rotation pattern).
3. **Security:** If a token is reused or invalid, it invalidates all sessions for that user.

---

### B. Email Verification Feature (`src/features/verifyEmail`)

#### 1. Send Verification Email (`POST /send-verification-email`)

1. **Status Check:** Ensures the user exists and is not already verified.
2. **Rate Limiting (Token based):** Checks if a valid, unexpired token already exists to prevent spam.
3. **Generation:** Creates a new `EmailVerificationToken` and dispatches the email.

#### 2. Verify Email (`GET /verify-email/:token`)

1. **Token Validation:** Checks if the token exists in the DB and has not expired.
2. **Activation:** Updates the `User` record by setting `emailVerified` to the current timestamp.
3. **Cleanup:** Deletes all verification tokens associated with the user.
4. **UI Response:** Returns a polished HTML success or failure landing page with a "Go to Login" button.

---

### C. Forgot Password Feature (`src/features/forgotPassword`)

#### 1. Forgot Password (`POST /forgot-password`)

1. **User Lookup:** Finds the user by email.
2. **Token Creation:** Generates a `ResetToken` with a 1-hour expiration.
3. **Communication:** Sends the password reset link via email.
   _(Note: Current implementation contains a logic check that restricts this to unverified users; typically this is corrected to allow verified users to reset)._

#### 2. Reset Password (`POST /reset-password/:token`)

1. **Token Validation:** Verifies the token is valid and not expired.
2. **Update:** Hashes the new password and updates the `User` record.
3. **Security Flush:** Deletes all `ResetToken` and `RefreshToken` records for the user, forcing a re-login on all devices.
