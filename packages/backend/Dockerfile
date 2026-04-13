FROM oven/bun:1 AS base
WORKDIR /app

# Copy workspace manifests
COPY package.json bun.lock* ./
COPY packages/backend/package.json ./packages/backend/
COPY packages/shared/package.json ./packages/shared/

RUN bun install --frozen-lockfile

# Copy source
COPY packages/backend ./packages/backend
COPY packages/shared ./packages/shared

EXPOSE 8000

CMD ["sh", "-c", "cd /app/packages/backend && bunx drizzle-kit migrate && cd /app && bun run packages/backend/src/index.ts"]
