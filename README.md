# BKVolunteers Backend API

Backend API cho nền tảng quản lý tình nguyện viên và tổ chức sự kiện tình nguyện.

## Giới thiệu

**BKVolunteers** là một nền tảng kết nối tình nguyện viên với các tổ chức từ thiện. API được xây dựng trên kiến trúc modular với TypeScript, Express và Prisma ORM.

### Đặc điểm chính

- **Ngôn ngữ**: TypeScript với kiểu dữ liệu chặt chẽ
- **Kiến trúc**: Controller-Service-Repository pattern
- **Database**: Prisma ORM + MariaDB
- **Xác thực**: JWT (Access + Refresh tokens)
- **Validation**: Zod schema validation
- **Testing**: Jest với Babel
- **Containerized**: Docker + Docker Compose

## Công nghệ

| Thành phần | Công nghệ |
|------------|-----------|
| Runtime | Node.js 18+ |
| Framework | Express.js |
| Language | TypeScript |
| Database | MariaDB 11 |
| ORM | Prisma |
| Validation | Zod |
| Testing | Jest |
| Package Manager | pnpm |
| Container | Docker |

## Cấu trúc Project

```
src/
├── features/           # Domain modules
│   ├── auth/          # Xác thực (login, register, refresh)
│   ├── users/         # Quản lý người dùng
│   ├── events/        # Quản lý sự kiện
│   └── ...
├── common/            # Shared middleware & routes
├── config/            # Configuration (Prisma, JWT, SMTP)
├── utils/             # Utilities (ApiError, ApiResponse)
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

Server chạy tại: `http://localhost:3000`

### Các lệnh thường dùng

| Lệnh | Mô tả |
|------|-------|
| `pnpm dev` | Chạy development với hot reload |
| `pnpm build` | Build TypeScript sang JavaScript |
| `pnpm start` | Chạy production build |
| `pnpm test` | Chạy tất cả tests |
| `pnpm lint` | Kiểm tra code format |
| `pnpm exec prisma migrate dev` | Tạo database migration |
| `pnpm exec prisma studio` | Mở Prisma Studio |

## API Endpoints

### Authentication

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/v1/auth/signup` | Đăng ký tài khoản |
| POST | `/api/v1/auth/login` | Đăng nhập |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| POST | `/api/v1/auth/logout` | Đăng xuất |

### Users

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/v1/users` | Lấy danh sách users |
| GET | `/api/v1/users/:id` | Lấy chi tiết user |
| PATCH | `/api/v1/users/:id` | Cập nhật user |
| DELETE | `/api/v1/users/:id` | Xóa user |

### Events (sắp triển khai)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/v1/events` | Danh sách sự kiện |
| POST | `/api/v1/events` | Tạo sự kiện |
| GET | `/api/v1/events/:id` | Chi tiết sự kiện |
| PATCH | `/api/v1/events/:id` | Cập nhật sự kiện |
| DELETE | `/api/v1/events/:id` | Xóa sự kiện |

## Biến môi trường

| Variable | Mô tả | Default |
|----------|-------|---------|
| `NODE_ENV` | Môi trường | `development` |
| `PORT` | Cổng server | `3000` |
| `DATABASE_URL` | Connection string | `mariadb://...` |
| `ACCESS_TOKEN_SECRET` | JWT access secret | - |
| `REFRESH_TOKEN_SECRET` | JWT refresh secret | - |
| `SMTP_HOST` | SMTP server | `localhost` |
| `SMTP_PORT` | SMTP port | `587` |
| `SMTP_USERNAME` | SMTP user | - |
| `SMTP_PASSWORD` | SMTP password | - |
| `EMAIL_FROM` | Email gửi đi | - |

## Thêm Feature mới

1. Tạo folder trong `src/features/<feature>/`
2. Định nghĩa types trong `types.ts`
3. Viết repository trong `*.repository.ts`
4. Viết service trong `*.service.ts`
5. Viết controller trong `*.controller.ts`
6. Đăng ký routes trong `*.route.ts` và `src/common/routes.ts`
7. Viết tests trong `tests/`

## License

ISC License
