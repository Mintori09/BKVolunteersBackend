set dotenv-load := true

# Liệt kê tất cả các recipe có sẵn
default:
    @just --list

# Thiết lập ban đầu cho dự án
setup:
    pnpm install
    @if [ ! -f .env ]; then cp .env-example .env; echo "Created .env"; fi
    pnpm exec prisma generate
    pnpx husky init

# Chạy server dev
dev:
    pnpm dev

# Build cho production (đảm bảo Prisma client được cập nhật trước)
build:
    pnpm exec prisma generate
    pnpm build

# Đồng bộ schema vào DB không cần migration (tốt nhất cho prototyping)
db-push:
    pnpm exec prisma db push

# Tạo migration (cần tên: just db-migrate "add-user-table")
db-migrate name:
    pnpm exec prisma migrate dev --name {{name}}

# Dọn dẹp, format và kiểm tra build
check:
    pnpm exec prettier --write .
    # -pnpm exec eslint --fix . --ignore-pattern "bruno/*"
    just build
    pnpm test

# Dọn dẹp sâu (xóa node_modules để bắt đầu lại từ đầu)
reset-ignored:
    rm -rf dist/ logs/*.log node_modules/

# Seed dữ liệu trực tiếp qua tsx
db-seed:
    pnpm tsx ./prisma/seed/index.ts

# Reset DB và dùng chính lệnh db-seed ở trên để nạp dữ liệu
db-reset:
    pnpm prisma migrate dev --name init
    just db-seed

up:
    docker-compose up -d

# Chạy test suite
test:
    pnpm test

# Xem log của các container (hữu ích khi debug DB)
logs:
    docker-compose logs -f

# Tắt các container và xóa volume (dùng khi muốn xóa sạch data Docker)
down:
    docker-compose down -v

# Kiểm tra code với ESLint
lint:
    pnpm exec eslint . --ignore-pattern "bruno/*"
