FROM oven/bun:1 AS base
WORKDIR /app

# Copy root package files for workspace
COPY package.json bun.lock* ./
COPY packages/backend/package.json ./packages/backend/
COPY packages/shared/package.json ./packages/shared/ 2>/dev/null || true

# Install all dependencies from root
RUN bun install

# Copy source code
COPY packages/backend ./packages/backend
COPY packages/shared ./packages/shared 2>/dev/null || true

WORKDIR /app/packages/backend

EXPOSE 3000

CMD ["bun", "run", "src/index.ts"]
