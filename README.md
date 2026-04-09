# Express TypeScript Starter Kit

## Overview

The **Express TypeScript Starter Kit** is a production-ready boilerplate designed for building scalable and maintainable RESTful APIs. It leverages a modern tech stack and follows a clean **Controller-Service-Model** architecture to ensure separation of concerns and high testability.

## Features

- **TypeScript**: Full type safety across the application.
- **Layered Architecture (Modular)**:
  - **Controllers**: Handle request/response logic using `catchAsync`.
  - **Services**: Contain core business logic, agnostic of HTTP layer.
  - **Repositories**: Abstract database operations (Prisma) from services.
- **Centralized Error Handling**: Custom `ApiError` class for operational errors and a global error middleware.
- **Standardized Responses**: Consistent JSON structure using the `ApiResponse` utility.
- **Winston Logging**: Production-grade logging system with file transports.
- **Prisma ORM**: Modern database toolkit for type-safe database access.
- **JWT Authentication**: Secure authentication using Access and Refresh tokens (with token reuse detection).
- **Zod Validation**: Robust request validation with automatic type inference.
- **Unit Testing**: Pre-configured Jest/Babel environment with co-located feature tests.
- **Security**: Pre-integrated Helmet, CORS, and XSS protection.
- **Absolute Imports**: Clean import paths starting with `src/`.

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [pnpm](https://pnpm.io/) (v10+)
- A MariaDB or MySQL instance

### Setup

1. **Clone the repository:**

   ```bash

   git clone <repository-url>

   cd express-ts-starter-kit

   ```

2. **Install dependencies:**

   ```bash

   pnpm install

   ```

3. **Configure environment variables:**

   ```bash

   cp .env-example .env
   # Edit .env with your database and JWT credentials
   ```

4. **Generate Prisma Client:**

   ```bash

   pnpm exec prisma generate

   ```

5. **Start development server:**

   ```bash

   pnpm dev

   ```

## Usage

### Adding a New Feature

1. Create a new folder in `src/features/`.
2. Define the domain types in `types.ts`.
3. Abstract DB operations in `*.repository.ts`.
4. Implement the business logic in `*.service.ts`.
5. Handle requests in `*.controller.ts` using `catchAsync` and `ApiResponse`.
6. Register routes in `*.route.ts` and add them to `src/common/routes.ts`.
7. Add unit tests in a `tests/` subdirectory.

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm exec jest --watch
```

### Testing SMTP

You can verify your SMTP configuration by running the built-in test script:

```bash
npx tsx src/utils/test-smtp.ts
```

This script will attempt to verify the connection and send a test email to the `EMAIL_FROM` address specified in your `.env`.

## Configuration

The application uses Zod to validate environment variables defined in `.env`.

| Variable | Description | Default |
| :-- | :-- | :-- |
| `NODE_ENV` | Environment (development, test, production) | `development` |
| `PORT` | Server listening port | `4000` |
| `DATABASE_URL` | Prisma database connection string | `mysql://...` |
| `ACCESS_TOKEN_SECRET` | Secret for Access JWT (min 8 chars) | - |
| `REFRESH_TOKEN_SECRET` | Secret for Refresh JWT (min 8 chars) | - |
| `SMTP_HOST` | SMTP server for emails | `localhost` |
| `SMTP_PORT` | SMTP server port (465 for SSL/TLS, 587 for STARTTLS) | `587` |
| `SMTP_USERNAME` | SMTP authentication username | `test_user` |
| `SMTP_PASSWORD` | SMTP authentication password | - |
| `EMAIL_FROM` | Sender address for outgoing emails | - |

## Examples

### User Registration

**POST** `/api/v1/auth/signup`

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securePassword123",
  "passwordConfirmed": "securePassword123",
  "role": "user"
}
```

### Refreshing Access Token

**POST** `/api/v1/auth/refresh`

- _Note: Requires the `refresh_token` cookie to be present._

## Troubleshooting

### Prisma Initialization

If you encounter `@prisma/client did not initialize yet`, run:

```bash
pnpm exec prisma generate
```

### Module Not Found

If absolute imports (e.g., `src/...`) fail, ensure `tsconfig.json` contains:

```json
"baseUrl": ".",
"paths": { "src/*": ["src/*"] }
```

### ESM vs CommonJS

If you face `ReferenceError: module is not defined`, ensure Babel config is named `babel.config.cjs` and `package.json` has `"type": "module"`.

## Contributing

1. Fork the project.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

## License

Distributed under the **ISC License**. See `LICENSE` for more information.
