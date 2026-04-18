# DANH SÁCH THƯ VIỆN VÀ CÔNG CỤ SỬ DỤNG

> **Lưu ý:** Vì bảng có nhiều cột nội dung dài, nên xoay ngang trang khi in hoặc xuất PDF.

## 1. Ngôn ngữ lập trình & Runtime

<!-- xoay ngang trang khi in -->

| STT | Mục đích | Công cụ | Phiên bản | Địa chỉ URL |
| --- | --- | --- | --- | --- |
| 1 | Ngôn ngữ lập trình chính | TypeScript | ^5.9.3 | https://www.typescriptlang.org/ |
| 2 | Môi trường runtime | Node.js | >= 18 (khuyến nghị) | https://nodejs.org/ |

## 2. Framework & Thư viện chính

| STT | Mục đích | Công cụ | Phiên bản | Địa chỉ URL |
| --- | --- | --- | --- | --- |
| 1 | Web framework, xử lý HTTP routing & middleware | Express.js | ^5.2.1 | https://expressjs.com/ |
| 2 | Package manager (quản lý thư viện) | pnpm | 10.30.3 | https://pnpm.io/ |
| 3 | TypeScript runtime (watch mode) cho development | tsx | ^4.21.0 | https://github.com/privatenumber/tsx |
| 4 | ORM, truy vấn cơ sở dữ liệu type-safe | Prisma Client | ^7.4.2 | https://www.prisma.io/ |
| 5 | Adapter Prisma cho cơ sở dữ liệu MariaDB | @prisma/adapter-mariadb | ^7.4.2 | https://www.prisma.io/ |

## 3. Cơ sở dữ liệu

| STT | Mục đích | Công cụ | Phiên bản | Địa chỉ URL |
| --- | --- | --- | --- | --- |
| 1 | Hệ quản trị cơ sở dữ liệu | MariaDB | (tùy môi trường) | https://mariadb.org/ |
| 2 | Công cụ CLI (migration, generate, studio) | Prisma CLI | ^7.4.2 | https://www.prisma.io/ |

## 4. Bảo mật & Xác thực

| STT | Mục đích | Công cụ | Phiên bản | Địa chỉ URL |
| --- | --- | --- | --- | --- |
| 1 | Băm mật khẩu (thuật toán Argon2) | argon2 | ^0.44.0 | https://github.com/ranisalt/node-argon2 |
| 2 | Tạo và xác thực JWT token | jsonwebtoken | ^9.0.3 | https://github.com/auth0/node-jsonwebtoken |
| 3 | Thiết lập HTTP security headers (CSP, HSTS, …) | helmet | ^8.1.0 | https://helmetjs.github.io/ |
| 4 | Middleware Cross-Origin Resource Sharing | cors | ^2.8.6 | https://github.com/expressjs/cors |
| 5 | Sanitize đầu vào, chống Cross-Site Scripting | xss | ^1.0.15 | https://github.com/leizongmin/js-xss |
| 6 | Giới hạn số request từ client (chống brute-force) | express-rate-limit | ^8.2.1 | https://github.com/express-rate-limit/express-rate-limit |
| 7 | Nén gzip cho response HTTP | compression | ^1.8.1 | https://github.com/expressjs/compression |

## 5. Validation

| STT | Mục đích | Công cụ | Phiên bản | Địa chỉ URL |
| --- | --- | --- | --- | --- |
| 1 | Schema validation type-safe cho request input | Zod | ^4.3.6 | https://zod.dev/ |

## 6. Gửi email

| STT | Mục đích | Công cụ | Phiên bản | Địa chỉ URL |
| --- | --- | --- | --- | --- |
| 1 | Gửi email (xác thực tài khoản, quên mật khẩu, thông báo) | nodemailer | ^8.0.1 | https://nodemailer.com/ |

## 7. Tài liệu API

| STT | Mục đích | Công cụ | Phiên bản | Địa chỉ URL |
| --- | --- | --- | --- | --- |
| 1 | Sinh OpenAPI spec từ JSDoc comments | swagger-jsdoc | ^6.2.8 | https://github.com/Surnet/swagger-jsdoc |
| 2 | Render giao diện Swagger UI | swagger-ui-express | ^5.0.1 | https://github.com/scottie1984/swagger-ui-express |

## 8. Tiện ích

| STT | Mục đích | Công cụ | Phiên bản | Địa chỉ URL |
| --- | --- | --- | --- | --- |
| 1 | Load biến môi trường từ file `.env` | dotenv | ^17.3.1 | https://github.com/motdotla/dotenv |
| 2 | Parse HTTP cookies | cookie-parser | ^1.4.7 | https://github.com/expressjs/cookie-parser |
| 3 | Hằng số mã trạng thái HTTP | http-status | ^2.1.0 | https://github.com/wellcomecollection/http-status-types |
| 4 | Parse & stringify query strings | qs | ^6.15.0 | https://github.com/ljharb/qs |
| 5 | Utility types bổ trợ cho TypeScript | utility-types | ^3.11.0 | https://github.com/piotrwitek/utility-types |
| 6 | Logging framework (ghi log ứng dụng) | winston | ^3.19.0 | https://github.com/winstonjs/winston |

## 9. Kiểm thử (Testing)

| STT | Mục đích | Công cụ | Phiên bản | Địa chỉ URL |
| --- | --- | --- | --- | --- |
| 1 | Framework test unit & integration | Jest | ^30.2.0 | https://jestjs.io/ |
| 2 | Transformer Babel cho Jest | babel-jest | ^30.2.0 | https://github.com/jestjs/jest |
| 3 | Core transpiler Babel | @babel/core | ^7.29.0 | https://babeljs.io/ |
| 4 | Babel preset cho môi trường mục tiêu | @babel/preset-env | ^7.29.0 | https://babeljs.io/ |
| 5 | Babel preset cho TypeScript | @babel/preset-typescript | ^7.28.5 | https://babeljs.io/ |

## 10. Kiểm tra chất lượng mã nguồn (Linting & Formatting)

| STT | Mục đích | Công cụ | Phiên bản | Địa chỉ URL |
| --- | --- | --- | --- | --- |
| 1 | Linter cho TypeScript/JavaScript | ESLint | ^10.0.3 | https://eslint.org/ |
| 2 | Parser TypeScript cho ESLint | @typescript-eslint/parser | ^8.57.0 | https://typescript-eslint.io/ |
| 3 | Bộ rule ESLint cho TypeScript | @typescript-eslint/eslint-plugin | ^8.57.0 | https://typescript-eslint.io/ |
| 4 | Meta-package cấu hình TypeScript ESLint | typescript-eslint | ^8.57.0 | https://typescript-eslint.io/ |
| 5 | Formatter mã nguồn | Prettier | (qua script `pnpm lint`) | https://prettier.io/ |
| 6 | Git hooks (pre-commit, pre-push) | Husky | ^9.1.7 | https://github.com/typicode/husky |
| 7 | Chạy linter trên tệp đã staged | lint-staged | ^16.3.3 | https://github.com/lint-staged/lint-staged |

## 11. Type Definitions (`@types/*`)

| STT | Mục đích | Công cụ | Địa chỉ URL |
| --- | --- | --- | --- |
| 1 | TypeScript types cho Express | @types/express | https://www.npmjs.com/package/@types/express |
| 2 | TypeScript types cho Express static core | @types/express-serve-static-core | https://www.npmjs.com/package/@types/express-serve-static-core |
| 3 | TypeScript types cho cookie-parser | @types/cookie-parser | https://www.npmjs.com/package/@types/cookie-parser |
| 4 | TypeScript types cho cors | @types/cors | https://www.npmjs.com/package/@types/cors |
| 5 | TypeScript types cho jsonwebtoken | @types/jsonwebtoken | https://www.npmjs.com/package/@types/jsonwebtoken |
| 6 | TypeScript types cho argon2 | @types/argon2 | https://www.npmjs.com/package/@types/argon2 |
| 7 | TypeScript types cho nodemailer | @types/nodemailer | https://www.npmjs.com/package/@types/nodemailer |
| 8 | TypeScript types cho compression | @types/compression | https://www.npmjs.com/package/@types/compression |
| 9 | TypeScript types cho qs | @types/qs | https://www.npmjs.com/package/@types/qs |
| 10 | TypeScript types cho swagger-jsdoc | @types/swagger-jsdoc | https://www.npmjs.com/package/@types/swagger-jsdoc |
| 11 | TypeScript types cho swagger-ui-express | @types/swagger-ui-express | https://www.npmjs.com/package/@types/swagger-ui-express |
| 12 | TypeScript types cho Jest | @types/jest | https://www.npmjs.com/package/@types/jest |
| 13 | TypeScript types cho Node.js | @types/node | https://www.npmjs.com/package/@types/node |
| 14 | TypeScript types cho winston | @types/winston | https://www.npmjs.com/package/@types/winston |

## 12. Công cụ phát triển (IDE & Version Control)

| STT | Mục đích | Công cụ | Phiên bản | Địa chỉ URL |
| --- | --- | --- | --- | --- |
| 1 | Trình soạn thảo mã nguồn (IDE) | Visual Studio Code | Mới nhất | https://code.visualstudio.com/ |
| 2 | Hệ thống quản lý phiên bản | Git | Mới nhất | https://git-scm.com/ |
| 3 | Nền tảng lưu trữ mã nguồn | GitHub | — | https://github.com/ |
