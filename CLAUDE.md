# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- **Development**: `pnpm dev` (runs `tsx watch src/server.ts`)
- **Build**: `pnpm build` (runs `pnpm tsc`)
- **Production Start**: `pnpm start` (runs `node dist/server.ts`)
- **Testing**:
  - All tests: `pnpm test`
  - Single test: `pnpm exec jest <file_path>` (e.g., `pnpm exec jest src/features/auth/tests/auth.controller.test.ts`)
  - Watch mode: `pnpm exec jest --watch`
- **Linting**: `pnpm lint` (currently checks formatting with Prettier)
- **Database (Prisma)**:
  - Generate client: `pnpm exec prisma generate`
  - Create migration: `pnpm exec prisma migrate dev --name <name>`
  - Open Studio: `pnpm exec prisma studio`
- **Utilities**:
  - Test SMTP: `npx tsx src/utils/test-smtp.ts`

## Code Architecture

The project follows a **Modular Layered Architecture (Controller-Service-Repository)** pattern, organized by domain features in `src/features/`.

### Directory Structure
- `src/features/<feature>/`: Contains domain-specific logic.
  - `*.controller.ts`: Handles request/response using `catchAsync` and `ApiResponse`.
  - `*.service.ts`: Core business logic, agnostic of the HTTP layer.
  - `*.repository.ts`: Data access layer (Prisma).
  - `*.route.ts`: Feature-specific routes.
  - `*.validation.ts`: Zod schemas for request validation.
  - `types.ts`: Domain-specific TypeScript types.
  - `tests/`: Co-located unit tests.
- `src/common/`: Shared middleware, constants, and global router.
- `src/config/`: Configuration for Prisma, JWT, SMTP, CORS, Helmet, etc.
- `src/utils/`: Shared utilities like `ApiError`, `ApiResponse`, and helpers.
- `src/types/`: Global/shared TypeScript types and declarations.

### Key Patterns
- **Error Handling**: Use `ApiError` for operational errors; they are handled by the global `errorHandler` middleware.
- **Async Handling**: Wrap controller methods with `catchAsync` to avoid manual try-catch for errors.
- **Responses**: Always use the `ApiResponse` utility for consistent JSON output.
- **Validation**: Use Zod schemas in `*.validation.ts` with the `validate` middleware in routes.
- **Database**: Use Prisma client (initialized in `src/config/prisma.ts`) for all DB interactions.
- **Imports**: Use absolute paths starting with `src/`.
