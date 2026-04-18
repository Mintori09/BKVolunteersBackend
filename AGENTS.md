# AGENTS.md

Guidelines for agentic coding agents working in this Express/TypeScript codebase.

## Commands

### Development

- `pnpm dev` - Start development server with hot reload (tsx watch)
- `pnpm build` - Compile TypeScript to dist/
- `pnpm start` - Run production build (node dist/server.ts)

### Testing

- `pnpm test` - Run all tests with coverage
- `pnpm exec jest <file_path>` - Run single test file
  - Example: `pnpm exec jest src/features/auth/tests/auth.controller.test.ts`
- `pnpm exec jest --watch` - Run tests in watch mode

### Linting & Formatting

- `pnpm lint` - Check formatting with Prettier

### Database (Prisma)

- `pnpm exec prisma generate` - Generate Prisma client
- `pnpm exec prisma migrate dev --name <name>` - Create migration
- `pnpm exec prisma studio` - Open database GUI

## Architecture

**Modular Layered Architecture (Controller-Service-Repository)**

```
src/
├── features/<feature>/
│   ├── *.controller.ts    # HTTP request/response handling
│   ├── *.service.ts       # Business logic (HTTP-agnostic)
│   ├── *.repository.ts    # Database access (Prisma)
│   ├── *.route.ts         # Route definitions
│   ├── *.validation.ts    # Zod schemas
│   ├── types.ts           # Domain types
│   └── tests/             # Co-located tests
├── common/                # Shared middleware, constants
├── config/                # Configuration files
├── utils/                 # ApiError, ApiResponse, catchAsync
└── types/                 # Global TypeScript types
```

## Code Style

### Formatting (Prettier)

- Tab width: 4 spaces
- Single quotes for strings
- No semicolons
- Trailing commas: ES5

### Imports

- Use absolute paths with `src/` prefix
- Group imports: external → internal
- Import entire modules with `* as` for services/repositories

```typescript
import { HttpStatus } from "src/common/constants";
import * as authService from "./auth.service";
import { catchAsync } from "src/utils/catchAsync";
```

### Naming Conventions

- **Files**: kebab-case for multi-word, feature-prefixed (e.g., `auth.controller.ts`)
- **Variables/Functions**: camelCase
- **Types/Interfaces**: PascalCase
- **Constants**: UPPER_SNAKE_CASE for global, camelCase for local
- **Export functions**: Use `export const` arrow functions

```typescript
export const handleLogin = catchAsync(async (req, res) => { ... })
export const getUserById = async (userId: string) => { ... }
```

### Types

- Use interfaces for object shapes (Input/Output types)
- Use type for unions and computed types
- Separate Input and Output types in types.ts

```typescript
// types.ts structure
export interface LoginInput {
  username: string;
  password: string;
}
export interface LoginOutput {
  accessToken: string;
}
export type UserRole = "CLB" | "LCD" | "DOANTRUONG" | "SINHVIEN";
```

### Error Handling

- Throw `ApiError` for operational errors
- Always wrap controller handlers with `catchAsync`

```typescript
throw new ApiError(HttpStatus.UNAUTHORIZED, 'Invalid credentials')

export const handleLogin = catchAsync(async (req, res) => { ... })
```

### Responses

- Use `ApiResponse` class for consistent JSON output

```typescript
ApiResponse.success<LoginOutput>(res, { accessToken });
ApiResponse.success(res, null, "Password changed successfully");
res.sendStatus(HttpStatus.NO_CONTENT);
```

### Validation

- Define Zod schemas in `*.validation.ts`
- Use `validate` middleware in routes

```typescript
export const loginSchema: RequestValidationSchema = {
  body: z.object({
    username: z.string().min(9).max(40),
    password: z.string().min(6).max(50),
  }),
};

authRouter.post("/login", validate(loginSchema), authController.handleLogin);
```

### Controllers

- Extract validated body params directly from `req.body`
- Use `TypedRequest` for type-safe request bodies
- Return responses using `ApiResponse` methods

```typescript
export const handleLogin = catchAsync(
  async (req: TypedRequest<LoginInput>, res: Response) => {
    const { username, password } = req.body;
    // ... business logic via service calls
    return ApiResponse.success<LoginOutput>(res, { accessToken });
  },
);
```

### Services

- Keep HTTP-agnostic (no req/res objects)
- Call repository functions for database operations
- Throw `ApiError` for business rule violations

### Repositories

- Use `prismaClient` from `src/config`
- Return raw Prisma results or null

```typescript
export const getUserByEmail = async (email: string) => {
  return prismaClient.user.findUnique({ where: { email } });
};
```

## Testing

### Test File Location

- Place tests in `src/features/<feature>/tests/`
- Name pattern: `<feature>.<layer>.test.ts`

### Test Structure

```typescript
jest.mock('../auth.service')
jest.mock('src/config', () => ({ ... }))

describe('Auth Controller', () => {
    let req: any
    let res: any
    let next: NextFunction

    beforeEach(() => {
        req = { body: {}, cookies: {}, params: {} }
        res = { status: jest.fn().mockReturnThis(), json: jest.fn() }
        next = jest.fn()
        jest.clearAllMocks()
    })

    describe('handleLogin', () => {
        it('should return error if username missing', async () => {
            // ...
        })
    })
})
```

### Mocking

- Mock services/repositories at top of test file
- Mock config to avoid real DB connections
- Use `jest.clearAllMocks()` in `beforeEach`

## Database

- Use Prisma client (`prismaClient`) for all DB operations
- Never write raw SQL unless absolutely necessary
- Run `pnpm exec prisma generate` after schema changes

## Security

- Never expose or log secrets/keys
- Never commit .env or credentials
- Use `argon2` for password hashing
- Use JWT for authentication (access + refresh tokens)

## Notes

- This is an ESM project (`"type": "module"` in package.json)
- Use `.js` extensions in imports only when required by tooling
- Vietnamese comments are used in validation messages
- Role-based access: CLB, LCD, DOANTRUONG, SINHVIEN
