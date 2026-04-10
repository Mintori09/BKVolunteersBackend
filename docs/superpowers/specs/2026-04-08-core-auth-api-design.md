# BKVolunteers Backend API Design - Core & Auth Modules

**Date**: 2026-04-08
**Scope**: Authentication system and Core modules (Faculty, User, Student, Club)
**Approach**: Modular Migration from existing auth module

---

## Context

Project cần triển khai lại các API phù hợp với database schema mới. Schema đã có các model:

- **Faculty**: Danh mục khoa
- **User**: Tài khoản quản lý (Admin, Đoàn trường, LCD, CLB) với role UserRole enum
- **Student**: Sinh viên tham gia hoạt động tình nguyện với MSSV
- **Club**: Câu lạc bộ tình nguyện, thuộc khoa hoặc cấp trường
- **Auth models**: Account, RefreshToken, ResetToken, EmailVerificationToken

Existing auth module có:

- signup, login, logout, refresh, me, change-password endpoints
- Validation với Zod
- JWT access + refresh token flow
- Email verification flow

---

## Architecture Overview

```
src/features/
├── auth/                    # ✅ Migrated (update only)
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── auth.repository.ts
│   ├── auth.route.ts
│   ├── auth.validation.ts
│   └── types.ts
├── faculty/                 # 🆕 New
│   ├── faculty.controller.ts
│   ├── faculty.service.ts
│   ├── faculty.repository.ts
│   ├── faculty.route.ts
│   ├── faculty.validation.ts
│   └── types.ts
├── user/                    # 🆕 New (admin management)
│   ├── user.controller.ts
│   ├── user.service.ts
│   ├── user.repository.ts
│   ├── user.route.ts
│   ├── user.validation.ts
│   └── types.ts
├── student/                 # 🆕 New
│   ├── student.controller.ts
│   ├── student.service.ts
│   ├── student.repository.ts
│   ├── student.route.ts
│   ├── student.validation.ts
│   └── types.ts
└── club/                    # 🆕 New
    ├── club.controller.ts
    ├── club.service.ts
    ├── club.repository.ts
    ├── club.route.ts
    ├── club.validation.ts
    └── types.ts
```

---

## 1. Auth Module (Migrate Existing)

### Unified Authentication System

**Key Design Decision**: User và Student dùng cùng hệ thống auth, phân biệt bằng `userType` trong JWT payload.

#### Auth Types

```typescript
// src/features/auth/types.ts
export type UserType = 'user' | 'student'

export interface UserSignUpCredentials {
    username: string
    email: string // @sv1.dut.udn.vn domain
    password: string
    passwordConfirmed: string
    facultyId?: number // optional, LCD/CLB must have facultyId
    role?: UserRole // default: LCD
}

export interface StudentSignUpCredentials {
    mssv: string
    email: string // mssv@sv1.dut.udn.vn (auto-generated)
    password: string
    passwordConfirmed: string
    fullName: string
    facultyId: number
    className?: string
    phone?: string
}

export interface LoginCredentials {
    email: string
    password: string
}

export interface JwtPayload {
    userId: string
    userType: UserType
    role: string
    iat: number
    exp: number
}
```

#### Auth Endpoints

| Method | Endpoint                | Description              | Auth     |
| ------ | ----------------------- | ------------------------ | -------- |
| POST   | `/auth/signup`          | Register new User        | Public   |
| POST   | `/auth/students/signup` | Register new Student     | Public   |
| POST   | `/auth/login`           | Login (User or Student)  | Public   |
| POST   | `/auth/logout`          | Logout                   | Required |
| POST   | `/auth/refresh`         | Refresh access token     | Cookie   |
| GET    | `/auth/me`              | Get current user/student | Required |
| PATCH  | `/auth/change-password` | Change password          | Required |

#### Signup Flow

**User Signup**:

1. Validate email ends with `@sv1.dut.udn.vn`
2. Check email not exists in User table
3. Create User with role (default: LCD)
4. Create email verification token
5. Send verification email

**Student Signup**:

1. Validate MSSV format
2. Auto-generate email: `{mssv}@sv1.dut.udn.vn`
3. Check MSSV not exists in Student table
4. Validate facultyId exists
5. Create Student record
6. Create email verification token
7. Send verification email

#### Permission System

**Hierarchical Permissions** (via `restrictTo` middleware):

| Role       | Scope         | Permissions                                               |
| ---------- | ------------- | --------------------------------------------------------- |
| DOANTRUONG | Campus-wide   | All faculties, all clubs, approve campaigns               |
| LCD        | Faculty-level | Own faculty, clubs in faculty, manage students in faculty |
| CLB        | Club-level    | Own club, campaigns for own club                          |

**Implementation**:

```typescript
// src/common/middleware/restrictTo.ts
export const restrictTo = (...allowedRoles: UserRole[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (req.payload?.userType !== 'user') {
            throw new ApiError(HttpStatus.FORBIDDEN, 'Access denied')
        }
        if (!allowedRoles.includes(req.payload.role)) {
            throw new ApiError(HttpStatus.FORBIDDEN, 'Insufficient permissions')
        }
        next()
    }
}

// Check faculty access for LCD/CLB
export const restrictToFaculty = () => {
    return async (req: Request, res: Response, next: NextFunction) => {
        const userFacultyId = req.user?.facultyId
        const targetFacultyId = parseInt(
            req.params.facultyId || req.body.facultyId
        )

        if (req.payload?.role === 'DOANTRUONG') {
            return next() // Campus-wide access
        }

        if (userFacultyId !== targetFacultyId) {
            throw new ApiError(
                HttpStatus.FORBIDDEN,
                'Access denied for this faculty'
            )
        }
        next()
    }
}
```

---

## 2. Faculty Module

### Faculty Endpoints

| Method | Endpoint         | Description         | Auth     | Role       |
| ------ | ---------------- | ------------------- | -------- | ---------- |
| GET    | `/faculties`     | List all faculties  | Public   | -          |
| GET    | `/faculties/:id` | Get faculty by ID   | Public   | -          |
| POST   | `/faculties`     | Create faculty      | Required | DOANTRUONG |
| PATCH  | `/faculties/:id` | Update faculty      | Required | DOANTRUONG |
| DELETE | `/faculties/:id` | Soft delete faculty | Required | DOANTRUONG |

### Faculty Types

```typescript
// src/features/faculty/types.ts
export interface CreateFacultyDto {
    code: string // e.g., "CNTT", "DT"
    name: string // e.g., "Công nghệ thông tin"
}

export interface UpdateFacultyDto {
    code?: string
    name?: string
}
```

---

## 3. User Module (Admin Management)

### User Endpoints

| Method | Endpoint     | Description                      | Auth     | Role            |
| ------ | ------------ | -------------------------------- | -------- | --------------- |
| GET    | `/users`     | List users (filtered by faculty) | Required | DOANTRUONG, LCD |
| GET    | `/users/:id` | Get user by ID                   | Required | -               |
| POST   | `/users`     | Create user (admin-created)      | Required | DOANTRUONG, LCD |
| PATCH  | `/users/:id` | Update user                      | Required | -               |
| DELETE | `/users/:id` | Soft delete user                 | Required | DOANTRUONG      |

### Permission Rules

- **DOANTRUONG**: Can manage all users across all faculties
- **LCD**: Can only manage users in own faculty
- **Self-update**: Users can update their own profile (limited fields)

### User Types

```typescript
// src/features/user/types.ts
export interface CreateUserDto {
    username: string
    email: string
    password: string
    role: UserRole
    facultyId?: number // Required for LCD/CLB
}

export interface UpdateUserDto {
    username?: string
    email?: string
    role?: UserRole
    facultyId?: number
}
```

---

## 4. Student Module

### Student Endpoints

| Method | Endpoint               | Description                         | Auth     | Role            |
| ------ | ---------------------- | ----------------------------------- | -------- | --------------- |
| GET    | `/students`            | List students (filtered by faculty) | Required | DOANTRUONG, LCD |
| GET    | `/students/:id`        | Get student by ID                   | Required | -               |
| GET    | `/students/mssv/:mssv` | Get student by MSSV                 | Required | DOANTRUONG, LCD |
| PATCH  | `/students/:id`        | Update student                      | Required | -               |
| DELETE | `/students/:id`        | Soft delete student                 | Required | DOANTRUONG      |

### Permission Rules

- **DOANTRUONG**: Can view/manage all students
- **LCD**: Can only view/manage students in own faculty
- **Self**: Students can view/update own profile via `/auth/me`

### Student Types

```typescript
// src/features/student/types.ts
export interface UpdateStudentDto {
    fullName?: string
    className?: string
    phone?: string
    facultyId?: number
}
```

---

## 5. Club Module

### Club Endpoints

| Method | Endpoint     | Description                      | Auth     | Role            |
| ------ | ------------ | -------------------------------- | -------- | --------------- |
| GET    | `/clubs`     | List clubs (filtered by faculty) | Public   | -               |
| GET    | `/clubs/:id` | Get club by ID                   | Public   | -               |
| POST   | `/clubs`     | Create club                      | Required | DOANTRUONG, LCD |
| PATCH  | `/clubs/:id` | Update club                      | Required | LCD, CLB (own)  |
| DELETE | `/clubs/:id` | Soft delete club                 | Required | DOANTRUONG      |

### Permission Rules

- **DOANTRUONG**: Can create/manage all clubs (including campus-level clubs with null facultyId)
- **LCD**: Can create/manage clubs in own faculty
- **CLB Leader**: Can update own club only (leaderId matches userId)

### Club Types

```typescript
// src/features/club/types.ts
export interface CreateClubDto {
    name: string
    facultyId?: number // null = campus-level club
    leaderId?: string // assign leader later
}

export interface UpdateClubDto {
    name?: string
    facultyId?: number
    leaderId?: string
}
```

---

## Error Handling

All errors use `ApiError` utility with appropriate HTTP status codes:

| Status | Code                  | Scenario                                   |
| ------ | --------------------- | ------------------------------------------ |
| 400    | BAD_REQUEST           | Validation errors, missing required fields |
| 401    | UNAUTHORIZED          | Invalid credentials, token expired         |
| 403    | FORBIDDEN             | Insufficient permissions                   |
| 404    | NOT_FOUND             | Resource not found                         |
| 409    | CONFLICT              | Duplicate email/MSSV/username              |
| 500    | INTERNAL_SERVER_ERROR | Unexpected errors                          |

---

## Testing Strategy

### Unit Tests

- Co-located with features: `src/features/*/tests/*.test.ts`
- Use Jest with supertest for controller tests
- Mock Prisma client for repository layer

### Integration Tests

- Test auth flow end-to-end
- Test permission boundaries
- Test CRUD operations with real database (test DB)

---

## Files to Modify

### Existing Files (Update)

| File                                   | Changes                                        |
| -------------------------------------- | ---------------------------------------------- |
| `src/features/auth/types.ts`           | Add Student credentials, UserType              |
| `src/features/auth/auth.validation.ts` | Add student signup schema, update email domain |
| `src/features/auth/auth.repository.ts` | Add Student CRUD, update User creation         |
| `src/features/auth/auth.service.ts`    | Add Student signup logic, unified JWT          |
| `src/features/auth/auth.controller.ts` | Add student signup endpoint, update login      |
| `src/features/auth/auth.route.ts`      | Add student signup route                       |
| `src/common/middleware/restrictTo.ts`  | Add faculty-level restrictions                 |
| `src/utils/generateTokens.util.ts`     | Add userType to JWT payload                    |
| `src/common/routes.ts`                 | Add new feature routes                         |

### New Files (Create)

- `src/features/faculty/` - All files
- `src/features/user/` - All files
- `src/features/student/` - All files
- `src/features/club/` - All files

---

## Verification Plan

1. **Build**: `pnpm build` - Ensure TypeScript compiles
2. **Lint**: `pnpm lint` - Check formatting
3. **Tests**: `pnpm test` - Run existing and new tests
4. **Manual Testing**:
    - Student signup with MSSV → verify email sent
    - User signup with @sv1.dut.udn.vn → verify email sent
    - Login as User → check JWT has userType: 'user'
    - Login as Student → check JWT has userType: 'student'
    - LCD create club in own faculty → success
    - LCD create club in other faculty → forbidden
    - DOANTRUONG create campus-level club → uccess
