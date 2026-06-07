# Phân Tích Cấu Trúc Project BKVolunteersBackend

## 1. Tổng Quan Project

Đây là một backend API viết bằng TypeScript + Express, dùng Prisma để kết nối MariaDB. Project này không có frontend riêng trong source hiện tại. Trong repo chỉ thấy backend, tài liệu API, bộ test, collection Bruno, schema database và một số artifact coverage/logs.

Mục tiêu nghiệp vụ của hệ thống là quản lý nền tảng tình nguyện BKVolunteers: tài khoản sinh viên, tài khoản quản trị, chiến dịch tình nguyện, quyên góp tiền/hàng, sự kiện, chứng nhận, thông báo, tổ chức và báo cáo.

Kiến trúc hiện tại nghiêng về kiểu modular monolith. Các domain chính nằm trong `src/features/`, còn phần dùng chung nằm trong `src/common/`, `src/config/`, `src/utils/` và `src/types/`.

Điểm cần lưu ý nhất: không phải toàn bộ feature đều đã nối DB thật. `auth` và `users` dùng Prisma/MariaDB thật, nhưng nhiều module khác đang dùng dữ liệu catalog hoặc bộ nhớ tạm trong service để mô phỏng nghiệp vụ. Vì vậy project hiện tại ở trạng thái pha trộn giữa backend thật và layer dữ liệu mô phỏng.

## 2. Công Nghệ Sử Dụng

- Runtime: Node.js.
- Language: TypeScript.
- Framework: Express.js 5.
- ORM/DB: Prisma + MariaDB 11.
- Validation: Zod.
- Auth: JWT + Argon2.
- Email: Nodemailer.
- Security middleware: Helmet, CORS, XSS sanitize, rate limit.
- Compression: compression.
- Upload: Multer ở mức utility/config, nhưng chưa thấy feature upload trong source hiện tại.
- Documentation: Swagger/OpenAPI + Bruno collection.
- Testing: Jest + Babel + Supertest.
- Container: Docker + Docker Compose.
- Package manager: pnpm.

## 3. Cấu Trúc Thư Mục

### Tổng quan nhanh

- `src/`: mã nguồn backend chính.
- `prisma/`: schema, migration, seed dữ liệu.
- `bruno/`: collection để test API thủ công.
- `docs/api/`: tài liệu API.
- `__test__/`: test ở cấp root cho middleware và utils.
- `coverage/`, `coverage-auth/`: báo cáo coverage sinh tự động.
- `logs/`: log runtime.
- `ECC/`, `Class-AI-Agent/`: các thư mục tooling/tài liệu phụ, không phải source runtime chính của backend.

### Cấu trúc trong `src/`

- `src/app.ts`: ghép middleware, swagger, health check và routes.
- `src/server.ts`: entrypoint khởi động server.
- `src/common/`: middleware chung, constants và router tổng.
- `src/config/`: cấu hình môi trường, CORS, Helmet, Prisma, Nodemailer, Swagger, cookie, upload.
- `src/features/`: các module nghiệp vụ theo domain.
- `src/types/`: type augmentation và kiểu chung.
- `src/utils/`: các helper dùng lại.
- `src/views/404.html`: file 404 HTML cũ/legacy, hiện chưa thấy app sử dụng trực tiếp.

## 4. Giải Thích Từng Folder

### `src/`

Đây là toàn bộ source backend. Nếu muốn thêm API mới, sửa middleware, thêm validation, hoặc chỉnh luồng auth thì đều bắt đầu từ đây.

### `src/common/`

Chứa phần dùng chung cho nhiều module.

- `constants/`: hằng số HTTP status.
- `middleware/`: auth, role guard, validation, XSS sanitize, error handler, logger, rate limit.
- `routes.ts`: nơi đăng ký toàn bộ route của hệ thống.

Khi thêm API mới, gần như chắc chắn phải chạm `src/common/routes.ts`.

### `src/config/`

Chứa các file cấu hình runtime.

- `config.ts`: đọc và validate biến môi trường.
- `prisma.ts`: khởi tạo Prisma client.
- `cors.ts`: whitelist CORS.
- `helmetConfig.ts`: cấu hình security header.
- `cookieConfig.ts`: cấu hình cookie refresh token.
- `nodemailer.ts`: cấu hình SMTP/test mail.
- `swagger.ts`: cấu hình OpenAPI.
- `upload.ts`: cấu hình file upload.

Nếu hệ thống không chạy được, nhóm file này là nơi đầu tiên cần kiểm tra.

### `src/features/`

Đây là nơi tổ chức theo domain. Mỗi feature thường có route/controller/service, một số feature có repository, validation, types, data hoặc tests.

Các feature hiện có:

- `auth/`: đăng nhập, logout, refresh token, lấy thông tin user, đổi hồ sơ, đổi mật khẩu.
- `users/`: quản lý tài khoản quản trị và sinh viên.
- `campaigns/`: quản lý chiến dịch.
- `approvals/`: luồng duyệt chiến dịch.
- `certificates/`: template, tạo, render, verify, revoke/reissue chứng nhận.
- `events/`: cấu hình và đăng ký sự kiện.
- `fundraising/`: quyên góp tiền và đối soát giao dịch.
- `notifications/`: danh sách và trạng thái đọc thông báo.
- `organizations/`: danh sách tổ chức và chi tiết tổ chức.
- `reports/`: báo cáo tổng quan, chiến dịch, đối soát.
- `students/`: dashboard, hoạt động, donations, certificates của sinh viên.
- `locations/`: danh sách địa điểm.
- `public/`: các endpoint public như campaign và verify certificate.
- `catalog/`: dữ liệu catalog, service mock/in-memory cho campaign, organization, report, student activity, approval.

Các folder `src/features/forgotPassword/` và `src/features/upload/` hiện không thấy trong source thực tế, dù README và coverage cũ vẫn nhắc tới. Đây là điểm lệch tài liệu cần lưu ý.

### `src/types/`

Chứa các kiểu TypeScript toàn cục và augmentation cho Express/JWT/request. Khi `req.payload` hoặc kiểu request body/query được dùng trong controller, rất có thể nó dựa vào đây.

### `src/utils/`

Chứa helper dùng chung:

- `ApiError.ts`: class lỗi chuẩn hóa.
- `ApiResponse.ts`: format response success/error.
- `catchAsync.ts`: wrapper bắt lỗi async.
- `generateTokens.util.ts`: tạo access token và refresh token.
- `sanitize.util.ts`: sanitize chống XSS.
- `paginate.ts`: helper phân trang Prisma.
- `sendEmail.util.ts`: gửi email reset/verify.
- `qr-generator.ts`: tạo URL VietQR.
- `upload.ts`: helper Multer upload proof.
- `compressFilter.util.ts`: filter cho compression.
- `dirname.util.ts`: helper lấy `__dirname` trong ESM.

### `prisma/`

Chứa toàn bộ schema và dữ liệu seed.

- `schema.prisma`: mô hình dữ liệu lớn nhất của hệ thống.
- `migrations/`: lịch sử migration.
- `seed/`: seed faculties và students.
- `students.csv`: dữ liệu đầu vào cho seed.

### `bruno/`

Chứa collection test API thủ công. Đây là nơi rất hữu ích khi muốn xác nhận endpoint hoạt động mà không cần viết test mới.

### `docs/api/`

Chứa tài liệu API và OpenAPI YAML. Phù hợp cho người mới đọc tổng quan endpoint hoặc đối chiếu contract.

### `__test__/`

Chứa test ở cấp root cho middleware và utils. Các test theo feature lại nằm trong `src/features/**/tests`.

### `coverage/` và `coverage-auth/`

Đây là artifact coverage sinh tự động, không phải source để sửa thủ công.

## 5. Giải Thích Các File Quan Trọng

### [package.json](package.json)

File điều phối toàn bộ project.

- `dev`: chạy `tsx watch src/server.ts`.
- `build`: chạy TypeScript compiler.
- `start`: đang là `node dist/server.ts`.
- `test`: chạy Jest.
- `lint`: chạy prettier check.

Điểm cần chú ý: `start` đang không khớp với output build từ `tsconfig.json`. Với cấu hình hiện tại, output build nhiều khả năng nằm ở `dist/src/server.js`, nên script `start` có rủi ro sai đường dẫn.

### [tsconfig.json](tsconfig.json)

- `moduleResolution: Bundler`.
- `paths`: alias `src/*` trỏ về `./src/*`.
- `outDir`: `./dist`.
- `strict: true`.

Đây là file quyết định output khi build. Nếu sửa cấu trúc source hoặc build path, phải xem lại file này đầu tiên.

### [.env-example](.env-example)

Đây là template biến môi trường. Một số biến quan trọng:

- `NODE_ENV`
- `PORT`
- `CORS_ORIGIN`
- `ACCESS_TOKEN_SECRET`
- `REFRESH_TOKEN_SECRET`
- `DATABASE_URL`
- `SMTP_*`
- `EMAIL_FROM`

File `.env` thực tế là file local của máy dev. Mình chỉ đọc được dấu hiệu `PORT=4000` từ search, còn các secret không nên phụ thuộc vào tài liệu.

### [src/server.ts](src/server.ts)

Đây là entrypoint thật để khởi động HTTP server.

- Import `app` từ `src/app.ts`.
- Lắng nghe cổng từ `config.server.port`.
- Ghi log bằng `logger`.
- Có handler cho `uncaughtException`, `unhandledRejection`, `SIGTERM`.

Nếu app không lên, file này là nơi đầu tiên kiểm tra trạng thái boot.

### [src/app.ts](src/app.ts)

Đây là file ghép toàn bộ middleware và routes.

Trình tự chính:

1. `helmet`
2. `express.json` và `express.urlencoded`
3. `xssMiddleware`
4. `cookieParser`
5. `cors`
6. `compression`
7. static `/uploads`
8. Swagger tại `/api-docs`
9. health endpoints
10. route `/api/locations`
11. mount toàn bộ router `/api/v1`
12. 404 handler
13. `errorHandler`

Đây là file runtime quan trọng nhất của hệ thống. Nếu muốn thêm middleware toàn cục hoặc route gốc, gần như chắc chắn phải sửa file này.

### [src/common/routes.ts](src/common/routes.ts)

File router tổng, đăng ký các domain route vào `/api/v1`.

- `auth` có rate limit ở production.
- `users`, `campaigns`, `organizations`, `admin/organizations`, `public`, `reports`, `notifications`, `students`, `certificates`, `events`, `fundraising`, `approvals`, `locations`.

Nếu thêm một feature mới, cần import router ở đây và thêm vào danh sách `defaultRoutes`.

### [src/common/middleware/isAuth.ts](src/common/middleware/isAuth.ts)

Middleware xác thực JWT.

- Chấp nhận header `Bearer` hoặc `Apikey`.
- Verify bằng access token secret.
- Gọi `authService.getUserById()` để kiểm tra user còn ACTIVE không.
- Gắn payload vào `req.payload`.

Middleware này là cổng vào cho hầu hết API cần đăng nhập.

### [src/common/middleware/restrictTo.ts](src/common/middleware/restrictTo.ts)

Middleware phân quyền theo role.

- Chặn nếu `req.payload.role` không nằm trong danh sách cho phép.
- Dùng nhiều trong `users`, `certificates`, `reports`, `approvals`.

### [src/common/middleware/validate.ts](src/common/middleware/validate.ts)

Validate request bằng Zod.

- Nhận schema cho `body`, `query`, `params`.
- Tạo lỗi `ApiError(400)` nếu schema fail.

Đây là cách validate thống nhất trong project.

### [src/common/middleware/errorHandler.ts](src/common/middleware/errorHandler.ts)

Middleware xử lý lỗi cuối cùng.

- Chuẩn hóa lỗi sang JSON qua `ApiResponse.error()`.
- Ở môi trường dev sẽ trả stack.
- Nếu lỗi 500 sẽ log bằng `logger`.

### [src/config/config.ts](src/config/config.ts)

Đọc và validate `.env` bằng Zod.

- Có default cho nhiều biến.
- `NODE_ENV` chỉ nhận `development | test | production`.
- `DATABASE_URL`, JWT secrets, SMTP, upload path đều được gom vào object `config`.

Nếu biến môi trường sai, project sẽ fail sớm. Đây là cơ chế tốt để phát hiện lỗi cấu hình ngay từ đầu.

### [src/config/prisma.ts](src/config/prisma.ts)

Khởi tạo `PrismaClient` với adapter MariaDB.

- Dùng `process.env.DATABASE_URL`.
- Non-production thì gắn vào `globalThis.prisma` để tái sử dụng.

Đây là điểm kết nối DB thật của hệ thống.

### [src/config/nodemailer.ts](src/config/nodemailer.ts)

Chọn chiến lược gửi mail theo môi trường.

- `test`: dùng JSON transport.
- Nếu SMTP thật có cấu hình: tạo transporter thật.
- Nếu dev không có SMTP thật: tạo test account.

### [src/config/swagger.ts](src/config/swagger.ts)

Cấu hình OpenAPI.

- API docs đặt ở `./src/features/**/*.route.ts` và `./src/features/**/*.types.ts`.
- Server URL lấy từ `config.server.url + '/api/v1'`.

### [src/config/cors.ts](src/config/cors.ts)

CORS whitelist dựa trên `CORS_ORIGIN`.

- `*` hoặc origin khớp whitelist thì cho phép.
- Có `credentials: true`.

### [src/config/helmetConfig.ts](src/config/helmetConfig.ts)

Security header cho Swagger và email HTML. Một số directive vẫn cho phép `unsafe-inline` và `unsafe-eval` để phục vụ Swagger UI và template email.

### [src/config/cookieConfig.ts](src/config/cookieConfig.ts)

Cookie refresh token là `httpOnly`, có `sameSite` và `secure` theo môi trường.

### [prisma/schema.prisma](prisma/schema.prisma)

Đây là file mô hình dữ liệu lớn nhất của hệ thống.

Những model chính đã thấy:

- `Faculty`
- `User`
- `ManagerAccount`
- `Student`
- `Title`, `StudentTitle`
- `Club`, `ClubMembership`
- `File`
- `Campaign`, `Tag`, `CampaignDocument`, `CampaignReviewRequest`, `CampaignReviewComment`, `CampaignStatusHistory`
- `CampaignModule`, `VolunteerModuleConfig`, `FundraisingModuleConfig`, `ItemDonationModuleConfig`, `ItemDonationTarget`, `EventModuleConfig`
- `OrganizerPaymentAccount`, `PaymentProviderConfig`
- `ModuleRegistration`, `Checkin`
- `MoneyContribution`, `MoneyContributionTransaction`
- `ItemContribution`, `ItemContributionLine`
- `CertificateTemplate`, `CertificateTemplateVersion`, `CertificateIssuancePolicy`, `Certificate`, `CertificateSnapshot`, `CertificateRenderJob`, `CertificateAuditLog`, `CertificateVerificationLog`, `CertificateSigningProfile`, `CertificateDigitalSignature`
- `CampaignMedia`
- `ManagerNotification`, `StudentNotification`
- `UserOAuthAccount`, `UserRefreshToken`, `UserResetToken`, `UserEmailVerificationToken`

Điểm quan trọng: schema rất đầy đủ, nhưng chưa phải toàn bộ model đã được gắn chặt vào feature route thật. Có phần đang ở trạng thái thiết kế hoặc chuẩn bị triển khai.

### [prisma/seed/index.ts](prisma/seed/index.ts)

Seed script khởi tạo dữ liệu ban đầu cho `Faculty` và `Student`.

## 6. Luồng Hoạt Động Của Hệ Thống

### Khi người dùng mở website hoặc gọi API

Project hiện tại là backend API, nên “người dùng mở website” thực tế là client khác gọi vào backend. Client có thể là frontend riêng ở nơi khác, Swagger UI, hoặc Bruno.

Luồng khởi động backend:

`User / Client` → `src/server.ts` → `src/app.ts` → middleware chung → router tổng → feature route → controller → service → repository / catalog service / in-memory store → response JSON

### Luồng frontend gọi API

Trong source hiện tại không có frontend riêng, nên không thấy `src/components`, `src/pages`, `src/services` giao diện.

Nếu có frontend bên ngoài gọi vào đây, flow sẽ là:

`Frontend Page` → `API Service` → `Backend Route` → `Controller` → `Service` → `Repository / Prisma` hoặc `catalog service` → `Response` → `UI`

### Luồng auth thật

Ví dụ login:

`Client` → `POST /api/v1/auth/login` → `validate(loginSchema)` → `handleLogin()` → `authService.getUserbyUsernameOrMssv()` → `authRepository` → `Prisma` → verify password bằng Argon2 → tạo access/refresh token → lưu refresh token vào DB → set cookie → trả JSON.

### Luồng các module catalog/in-memory

Ví dụ campaigns/certificates/events/fundraising/notifications:

`Client` → route feature → controller → service trong feature → đọc/ghi store trong memory hoặc catalog data → trả JSON.

Tức là các module này chưa dùng persistence thật như auth/users.

### Luồng dữ liệu DB

Chỉ một số module đang chạm DB thật rõ ràng:

- `auth/`: đọc user, refresh token, reset token, student profile.
- `users/`: CRUD tài khoản qua Prisma.
- `prisma/seed`: nạp dữ liệu mẫu.

### Luồng response

Hệ thống trả response thông qua `ApiResponse.success()` hoặc `ApiResponse.error()` nên JSON có format khá đồng nhất:

- success: `true/false`
- message
- data hoặc errors

## 7. Cách Chạy Project

### Cài đặt

1. Cài Node.js và pnpm.
2. Chạy `pnpm install`.
3. Copy `.env-example` thành `.env`.
4. Điền `DATABASE_URL`, JWT secrets, SMTP và các biến liên quan.
5. Chạy Prisma generate: `pnpm exec prisma generate`.
6. Nếu cần dữ liệu ban đầu, chạy migration và seed.

### Chạy backend local

- Development: `pnpm dev`
- Build: `pnpm build`
- Production start: `pnpm start`

### Chạy bằng Docker

- `docker-compose up -d`

Lưu ý: Docker config hiện tại có điểm lệch port và start script, nên nếu chạy container mà không sửa cấu hình thì có thể lên db nhưng app không nghe đúng cổng mong đợi.

### Cấu hình `.env`

Các biến tối thiểu nên có:

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

### Kết nối database

- Schema dùng MariaDB.
- Prisma client lấy `DATABASE_URL` từ môi trường.
- Nếu chạy local bằng Docker Compose, db service là MariaDB 11.

### Kiểm tra API

Có 3 cách chính:

- Swagger UI tại `/api-docs`.
- Health check tại `/health`, `/api/health`, `/api/v1/health`.
- Bruno collection trong `bruno/`.

### Dấu hiệu project chạy thành công

- Log từ `src/server.ts` báo server đang chạy.
- Health endpoint trả JSON có `service: BKVolunteersBackend` và `status: ok`.

### Lỗi thường gặp

- `.env` thiếu `DATABASE_URL` hoặc JWT secrets.
- DB MariaDB không reachable.
- CORS origin sai khi chạy frontend khác domain.
- SMTP chưa cấu hình nên mail chỉ chạy bằng test account hoặc không gửi thật.
- Build/start script lệch output của TypeScript.

## 8. Hiện Trạng Và Vấn Đề Đang Có

### Đang làm tốt

- Có cấu trúc modular rõ ràng theo domain.
- Có middleware chung cho auth, validate, error handling, XSS và rate limit.
- Có Swagger + Bruno để test API.
- Có Prisma schema khá đầy đủ cho domain tình nguyện.
- `users` và `auth` đã đi theo controller-service-repository tương đối chuẩn.

### Còn thiếu hoặc chưa hoàn chỉnh

- Không có frontend riêng trong source hiện tại.
- Nhiều feature đang dùng dữ liệu mô phỏng/in-memory thay vì DB thật.
- Một số domain lớn trong Prisma schema chưa được triển khai thành repo/service thật tương xứng.
- `src/features/forgotPassword/` và `src/features/upload/` được nhắc trong README/coverage cũ nhưng không còn thấy trong source hiện tại.

### Vấn đề cấu trúc đáng chú ý

- [package.json](package.json) có `start: node dist/server.ts`, nhưng output build từ [tsconfig.json](tsconfig.json) không khớp đường dẫn này.
- [Dockerfile](Dockerfile) `EXPOSE 3000`, nhưng [src/config/config.ts](src/config/config.ts) và [.env-example](.env-example) mặc định `PORT=4000`.
- `docker-compose.yml` cũng map `3000:3000`, nên cần thống nhất port với app.
- [src/utils/sendEmail.util.ts](src/utils/sendEmail.util.ts) có `console.log` reset/verify link, không nên để y nguyên khi lên production.
- `package-lock.json` tồn tại song song với `pnpm-lock.yaml`, trong khi package manager chính là pnpm. Nên tránh mix lockfile.

### Rủi ro bảo mật / cấu hình

- `CORS_ORIGIN=*` trong môi trường không phù hợp có thể mở quá rộng.
- `unsafe-inline` và `unsafe-eval` trong Helmet là chấp nhận được cho Swagger/email HTML, nhưng không nên mở rộng thêm bừa bãi.
- Cookie refresh token phụ thuộc mạnh vào `sameSite` và `secure`; nếu chạy qua proxy/HTTPS không đúng, refresh flow có thể lỗi.
- Send email test/console log có thể làm lộ token/link nếu dùng sai môi trường.

## 9. Đề Xuất Hướng Phát Triển Tiếp Theo

### Nên làm tiếp gì trước

1. Chuẩn hóa lại luồng chạy: sửa `start` script, Docker port và build output cho khớp nhau.
2. Chốt lại backend thật cho các module đang in-memory, ưu tiên `campaigns`, `certificates`, `events`, `fundraising`, `notifications`.
3. Khôi phục hoặc xóa hẳn tài liệu liên quan đến `forgotPassword` và `upload` để tránh lệch code với docs.
4. Hoàn thiện test cho các flow có DB thật và các flow domain quan trọng.

### Khi thêm một API mới ở backend

Quy trình chuẩn nên là:

- Tạo folder `src/features/<feature>/`.
- Viết `types.ts` nếu cần type rõ ràng.
- Viết `validation.ts` bằng Zod.
- Viết `service.ts` chứa logic nghiệp vụ.
- Viết `controller.ts` chỉ xử lý request/response.
- Viết `route.ts` để khai báo endpoint.
- Đăng ký router trong `src/common/routes.ts`.
- Thêm test ở `src/features/<feature>/tests`.

### Khi thêm bảng hoặc sửa database

- Sửa [prisma/schema.prisma](prisma/schema.prisma).
- Chạy migration Prisma.
- Cập nhật repository/service liên quan.
- Cập nhật seed nếu dữ liệu mẫu bị ảnh hưởng.
- Kiểm tra lại `auth`/`users` nếu thay đổi các model trung tâm như `User`, `Student`, `Faculty`, `RefreshToken`.

### Khi muốn làm frontend sau này

Hiện tại repo chưa có frontend, nên nếu thêm UI thì nên tách workspace hoặc package riêng.

Một màn hình mới ở frontend thường cần:

- Page / route component.
- Component tái sử dụng.
- API service gọi backend.
- State/loading/error handling.
- Đồng bộ contract với backend response.

### Nguyên tắc để project không bị rối

- Domain nào có DB thật thì giữ controller-service-repository rõ ràng.
- Domain mock/in-memory nên được ghi chú rõ để không bị hiểu nhầm là persistence thật.
- Không trộn dữ liệu demo vào module production mà không gắn cờ rõ ràng.
- Luôn cập nhật README và Swagger khi thêm endpoint.
- Đừng để script chạy, Docker, và biến môi trường mỗi nơi một kiểu.

## 10. Checklist Cho Người Mới Tiếp Tục Project

- Đọc [src/app.ts](src/app.ts) và [src/common/routes.ts](src/common/routes.ts) trước.
- Đọc [src/config/config.ts](src/config/config.ts) để hiểu biến môi trường.
- Đọc [src/server.ts](src/server.ts) để hiểu startup/shutdown.
- Đọc [src/features/auth/](src/features/auth/) và [src/features/users/](src/features/users/) để nắm luồng DB thật.
- Đọc [src/features/catalog/](src/features/catalog/) và các feature in-memory để hiểu dữ liệu mô phỏng.
- Mở [prisma/schema.prisma](prisma/schema.prisma) để nắm mô hình dữ liệu.
- Dùng Swagger ở `/api-docs` hoặc Bruno trong `bruno/` để test API.
- Kiểm tra `pnpm start`, `Dockerfile` và `docker-compose.yml` trước khi deploy.
- Nếu thấy nhắc tới `forgotPassword` hoặc `upload`, đối chiếu với source hiện tại vì chúng không còn là folder runtime rõ ràng trong repo này.
