set dotenv-load := true

# List all available recipes
default:
    @just --list

# Initial project setup
setup:
    pnpm install
    @if [ ! -f .env ]; then cp .env-example .env; echo "Created .env"; fi
    pnpm exec prisma generate

# Run dev server
dev:
    pnpm dev

# Build for production (ensures Prisma client is up to date first)
build:
    pnpm exec prisma generate
    pnpm build

# Sync schema to DB without migrations (best for prototyping)
db-push:
    pnpm exec prisma db push

# Generate a migration (requires a name: just db-migrate "add-user-table")
db-migrate name:
    pnpm exec prisma migrate dev --name {{name}}

# Clean, format, and verify the build
check:
    pnpm exec prettier --write .
    # -pnpm exec eslint --fix . --ignore-pattern "bruno/*"
    just build
    pnpm test

# Deep clean (removes node_modules for a fresh start)
reset-ignored:
    rm -rf dist/ logs/*.log node_modules/

db-seed:
    pnpm tsx ./prisma/seed.ts
