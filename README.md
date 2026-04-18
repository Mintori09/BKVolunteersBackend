# BKVolunteers Backend API

Backend API cho nền tảng quản lý tình nguyện viên và tổ chức sự kiện tình nguyện.

## Giới thiệu

**BKVolunteers** là một nền tảng kết nối tình nguyện viên với các tổ chức từ thiện. API được xây dựng trên kiến trúc modular với TypeScript, Express và Prisma ORM.

### Đặc điểm chính

- **Ngôn ngữ**: TypeScript với kiểu dữ liệu chặt chẽ
- **Kiến trúc**: Controller-Service-Repository pattern
- **Database**: Prisma ORM + MariaDB
- **Xác thực**: JWT (Access + Refresh tokens), Argon2 password hashing
- **Email**: Nodemailer (SMTP) cho password reset
- **Validation**: Zod schema validation
- **Testing**: Jest với Babel
- **API Docs**: Swagger/OpenAPI
- **Containerized**: Docker + Docker Compose

## Công nghệ

| Thành phần      | Công nghệ   |
| --------------- | ----------- |
| Runtime         | Node.js 18+ |
| Framework       | Express.js  |
| Language        | TypeScript  |
| Database        | MariaDB 11  |
| ORM             | Prisma      |
| Validation      | Zod         |
| Testing         | Jest        |
| Package Manager | pnpm        |
| Container       | Docker      |

## Cấu trúc Project

```
src/
├── features/           # Domain modules
│   ├── auth/          # Xác thực (login, logout, refresh, me, changePassword)
│   ├── forgotPassword/ # Quên mật khẩu (forgot-password, reset-password)
│   └── ...            # (Sắp triển khai: users, students, campaigns, clubs)
├── common/            # Shared middleware & routes
│   └── middleware/    # isAuth, restrictTo, validate, authLimiter, xss, errorHandler
├── config/            # Configuration (Prisma, JWT, SMTP, CORS, Helmet, Swagger)
├── utils/             # Utilities (ApiError, ApiResponse, catchAsync, sendEmail)
└── types/             # Global TypeScript types
```

## Bắt đầu

### Yêu cầu

- Node.js 18+
- pnpm 10+
- Docker & Docker Compose (tùy chọn)

### Cài đặt

1. **Clone repository:**

   ```bash

   git clone <repository-url>

   cd BKVolunteersBackend

   ```

2. **Cài dependencies:**

   ```bash

   pnpm install

   ```

3. **Setup môi trường:**

   ```bash

   cp .env-example .env
   # Sửa .env với thông tin database và JWT secrets
   ```

4. **Generate Prisma Client:**

   ```bash

   pnpm exec prisma generate

   ```

### Chạy Development

**Cách 1: Local**

```bash
pnpm dev
```

**Cách 2: Docker Compose**

```bash
docker-compose up -d
```

Server chạy tại: `http://localhost:4000`

### Các lệnh thường dùng

| Lệnh                           | Mô tả                            |
| ------------------------------ | -------------------------------- |
| `pnpm dev`                     | Chạy development với hot reload  |
| `pnpm build`                   | Build TypeScript sang JavaScript |
| `pnpm start`                   | Chạy production build            |
| `pnpm test`                    | Chạy tất cả tests                |
| `pnpm lint`                    | Kiểm tra code format             |
| `pnpm exec prisma migrate dev` | Tạo database migration           |
| `pnpm exec prisma studio`      | Mở Prisma Studio                 |

## API Endpoints

### Authentication

| Method | Endpoint | Mô tả | Auth Required |
| --- | --- | --- | --- |
| POST | `/api/v1/auth/login` | Đăng nhập (username hoặc MSSV) | No |
| POST | `/api/v1/auth/logout` | Đăng xuất | Yes |
| POST | `/api/v1/auth/refresh` | Refresh access token | No (cookie) |
| GET | `/api/v1/auth/me` | Lấy thông tin user hiện tại | Yes |
| PATCH | `/api/v1/auth/change-password` | Đổi mật khẩu | Yes |

### Password Reset

| Method | Endpoint | Mô tả | Auth Required |
| --- | --- | --- | --- |
| POST | `/api/v1/password/forgot-password` | Yêu cầu reset mật khẩu | No |
| POST | `/api/v1/password/reset-password/:token` | Reset mật khẩu với token | No |

### Users (chưa triển khai)

| Method | Endpoint            | Mô tả               |
| ------ | ------------------- | ------------------- |
| GET    | `/api/v1/users`     | Lấy danh sách users |
| GET    | `/api/v1/users/:id` | Lấy chi tiết user   |
| PATCH  | `/api/v1/users/:id` | Cập nhật user       |
| DELETE | `/api/v1/users/:id` | Xóa user            |

### Students (chưa triển khai)

| Method | Endpoint               | Mô tả                  |
| ------ | ---------------------- | ---------------------- |
| GET    | `/api/v1/students`     | Lấy danh sách students |
| GET    | `/api/v1/students/:id` | Lấy chi tiết student   |
| POST   | `/api/v1/students`     | Đăng ký student mới    |

### Campaigns (chưa triển khai)

| Method | Endpoint                | Mô tả               |
| ------ | ----------------------- | ------------------- |
| GET    | `/api/v1/campaigns`     | Danh sách campaigns |
| POST   | `/api/v1/campaigns`     | Tạo campaign mới    |
| GET    | `/api/v1/campaigns/:id` | Chi tiết campaign   |
| PATCH  | `/api/v1/campaigns/:id` | Cập nhật campaign   |
| DELETE | `/api/v1/campaigns/:id` | Xóa campaign        |

## Database Models

### Core Models

| Model     | Mô tả                                  |
| --------- | -------------------------------------- |
| `Faculty` | Khoa/đơn vị với mã và tên              |
| `User`    | Tài khoản admin (CLB, LCD, DOANTRUONG) |
| `Student` | Sinh viên tình nguyện viên (SINHVIEN)  |

### Campaign System

| Model                   | Mô tả                                    |
| ----------------------- | ---------------------------------------- |
| `Campaign`              | Base campaign với status, approval flow  |
| `MoneyDonationCampaign` | Campaign quyên góp tiền                  |
| `ItemDonationCampaign`  | Campaign quyên góp hiện vật              |
| `EventCampaign`         | Sự kiện tình nguyện với participant mgmt |

### Other Models

| Model                 | Mô tả                                   |
| --------------------- | --------------------------------------- |
| `Club`                | CLB (khoa hoặc trường)                  |
| `Title`               | Danh hiệu thành tựu với point threshold |
| `Donation`            | Ghi nhận donation từ student            |
| `Participant`         | Tham gia event với check-in status      |
| `RefreshToken`        | User refresh tokens                     |
| `StudentRefreshToken` | Student refresh tokens                  |
| `ResetToken`          | Password reset tokens                   |

## Biến môi trường

| Variable               | Mô tả              | Default         |
| ---------------------- | ------------------ | --------------- |
| `NODE_ENV`             | Môi trường         | `development`   |
| `PORT`                 | Cổng server        | `4000`          |
| `DATABASE_URL`         | Connection string  | `mariadb://...` |
| `ACCESS_TOKEN_SECRET`  | JWT access secret  | -               |
| `REFRESH_TOKEN_SECRET` | JWT refresh secret | -               |
| `SMTP_HOST`            | SMTP server        | `localhost`     |
| `SMTP_PORT`            | SMTP port          | `587`           |
| `SMTP_USERNAME`        | SMTP user          | -               |
| `SMTP_PASSWORD`        | SMTP password      | -               |
| `EMAIL_FROM`           | Email gửi đi       | -               |

## Thêm Feature mới

1. Tạo folder trong `src/features/<feature>/`
2. Định nghĩa types trong `types.ts`
3. Viết repository trong `*.repository.ts`
4. Viết service trong `*.service.ts`
5. Viết controller trong `*.controller.ts`
6. Đăng ký routes trong `*.route.ts` và `src/common/routes.ts`
7. Viết tests trong `tests/`

## Testing

Project có **16 test files** covering:

- Auth feature (controller, service, repository, integration)
- ForgotPassword feature (controller, integration)
- Middleware (validate, isAuth, restrictTo, xss, errorHandler)
- Utilities (sendEmail, generateTokens, sanitize, paginate)

```bash
pnpm test                           # Chạy tất cả tests
pnpm exec jest <file_path>          # Chạy test file cụ thể
pnpm exec jest --watch              # Watch mode
```

## License

None License
