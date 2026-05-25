# BKVolunteers Backend

Backend spec-first cho nền tảng quản lý hoạt động tình nguyện trong môi trường đại học, bao gồm chiến dịch, quyên góp, sự kiện, chứng nhận, thông báo và báo cáo.

Repository này là lớp API cho đợt pilot reset của BKVolunteers. Hệ thống hiện dùng route tree canonical, tài liệu Swagger, dữ liệu seed demo và codebase TypeScript theo kiến trúc module trên Express và Prisma.

## BKVolunteers Là Gì

BKVolunteers được xây cho bài toán vận hành hoạt động tình nguyện ở cấp trường và cấp khoa.

Hệ thống hiện xoay quanh 3 nhóm actor chính:

- `Sinh viên`: đăng ký hoạt động, quyên góp, theo dõi lịch sử tham gia và xem chứng nhận.
- `Điều phối viên`: tạo và vận hành chiến dịch, duyệt luồng phê duyệt, xác minh donation và xem báo cáo.
- `Tổ chức`: đơn vị sở hữu chiến dịch và tài khoản operator.

Mô hình dữ liệu trung tâm của API:

- `campaign` là container chính.
- `campaign module` là bề mặt triển khai nghiệp vụ.
- Module hiện có gồm `fundraising`, `item donations` và `events`.
- Các mảng hỗ trợ gồm `approvals`, `certificates`, `notifications`, `reports` và `admin`.

## Tính Năng Chính

- Xác thực spec-first với access token, refresh token và `/auth/me` theo principal mới
- Danh sách và chi tiết chiến dịch public qua `/public/campaigns` và slug
- Luồng vận hành campaign cho operator: submit, review, approve, publish, end
- Fundraising chạy trên canonical tables `campaign_modules + money_donations + payment_transactions`
- Quyên góp hiện vật chạy trên `item_targets + item_pledges`
- Đăng ký và duyệt tham gia sự kiện trên `event_registrations`
- Bề mặt self-service cho sinh viên: dashboard, activities, donations, titles, certificates
- Tạo, render, revoke, reissue và verify certificate
- Approval queue, audit logs và reports theo canonical schema
- Swagger UI để duyệt contract API

## API Surface

Toàn bộ route public được mount dưới `/api/v1`:

- `/auth`
- `/public`
- `/organizations`
- `/campaigns`
- `/approvals`
- `/fundraising`
- `/item-donations`
- `/events`
- `/students`
- `/certificates`
- `/notifications`
- `/reports`
- `/admin`

Swagger UI có tại:

- `/api-docs`

## Công Nghệ Sử Dụng

- `Node.js`
- `TypeScript`
- `Express 5`
- `Prisma`
- `MariaDB`
- `Zod`
- `JWT`
- `Argon2`
- `Jest`
- `Swagger / OpenAPI`

## Kiến Trúc

Codebase theo kiến trúc module nhiều lớp:

```text
src/
├── features/<feature>/
│   ├── *.route.ts
│   ├── *.controller.ts
│   ├── *.service.ts
│   ├── *.repository.ts
│   ├── *.validation.ts
│   ├── types.ts
│   └── tests/
├── common/
├── config/
├── types/
└── utils/
```

Các feature spec-first mới được tổ chức quanh endpoint contract tường minh và route-level Swagger docs. Các phần dùng chung như middleware auth, serializer, API envelope và pagination helper được đặt ngoài feature folders.

## Bắt Đầu Nhanh

### Yêu Cầu

- `Node.js 18+`
- `pnpm 10+`
- `MariaDB`

### Cài Đặt

```bash
git clone <repository-url>
cd BKVolunteersBackend
pnpm install
```

### Cấu Hình Môi Trường

Tạo file `.env` cục bộ từ file mẫu rồi điền cấu hình database, JWT và mail.

Mẫu production hiện có tại:

- `BKVolunteersBackend/.env.production.example`

Các biến môi trường thường dùng:

- `NODE_ENV`
- `PORT`
- `DATABASE_URL`
- `ACCESS_TOKEN_SECRET`
- `REFRESH_TOKEN_SECRET`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USERNAME`
- `SMTP_PASSWORD`
- `EMAIL_FROM`
- `SEPAY_WEBHOOK_SECRET`

### Generate Prisma Client

```bash
pnpm exec prisma generate
```

### Chạy API

```bash
pnpm dev
```

Mặc định server chạy tại:

- `http://localhost:4000`

## Database Và Seed

Pilot hiện được thiết kế để chạy trên canonical schema sạch.

Entrypoint seed hiện tại:

- [prisma/seed/index.ts](/home/mintori/Projects/Personal/BKVolunteersBackend/fix-implement/prisma/seed/index.ts)

Dữ liệu demo hiện được seed gồm:

- faculties
- titles
- organizations
- operator accounts
- students
- demo campaign và modules

### Tài Khoản Demo

Tài khoản operator:

- `operator@bkv.local` / `Password123`
- `club@bkvolunteers.local` / `Password123`

Tài khoản sinh viên:

- `102210001@sv1.dut.udn.vn` / `102210001`
- `102210002@sv1.dut.udn.vn` / `102210002`

### Campaign Demo

Seed hiện tạo một campaign đã publish:

- slug: `pilot-canonical-campaign`
- modules:
  - `FUNDRAISING`
  - `EVENT`

Campaign này phù hợp để kiểm tra public campaign listing, module detail APIs, reporting và certificate flows.

## Các Lệnh Thường Dùng

```bash
pnpm dev
pnpm build
pnpm start
pnpm test
pnpm lint
pnpm exec prisma generate
pnpm exec prisma migrate dev --name <name>
pnpm exec prisma studio
```

## Testing

Repository hiện có test cho middleware, utilities và các feature spec-first chính.

Chạy toàn bộ test:

```bash
pnpm test
```

Chạy một file test cụ thể:

```bash
pnpm exec jest src/features/fundraising/tests/fundraising.service.test.ts
```

## Swagger

Swagger/OpenAPI được generate từ JSDoc trong các file route của feature.

Sau khi app chạy, mở:

- `http://localhost:4000/api-docs`

Docs hiện phản ánh route tree spec-first và các named schema cho request/response contract của từng feature.

## Trạng Thái Hiện Tại

Repository này đã đi qua một đợt hard-cut spec-first cho pilot.

Điều đó có nghĩa là:

- canonical tables và APIs là source of truth
- router public đã được mount quanh các route group mới
- compatibility với API legacy không còn là mục tiêu
- seed dữ liệu giả định pilot reset sạch, không backfill dữ liệu cũ

Một số phần vẫn còn ở mức thin slice so với production platform hoàn chỉnh, nhưng kiến trúc hiện tại đã được dọn lại để tiếp tục mở rộng theo cùng hướng.

## Đóng Góp

Nếu thêm mới hoặc rewrite feature, nên giữ đúng convention của repo:

- khai báo tường minh input/output types cho endpoint
- đặt validation trong `*.validation.ts`
- giữ truy cập Prisma trong `*.repository.ts`
- giữ business rules trong `*.service.ts`
- khai báo route và Swagger trong `*.route.ts`
- thêm test co-located trong `tests/`

## License

`package.json` hiện chưa khai báo license cho dự án. Nếu cần public rộng hơn, nên bổ sung license rõ ràng.
