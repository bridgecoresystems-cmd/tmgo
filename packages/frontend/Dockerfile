FROM oven/bun:1 AS builder
WORKDIR /app

COPY package.json bun.lock* ./
COPY packages/frontend/package.json ./packages/frontend/
COPY packages/shared/package.json ./packages/shared/

RUN bun install

COPY packages/frontend ./packages/frontend
COPY packages/shared ./packages/shared

WORKDIR /app/packages/frontend

RUN bun run build

FROM oven/bun:1-slim AS runner
WORKDIR /app

COPY --from=builder /app/packages/frontend/.output ./.output

EXPOSE 3000
ENV PORT=3000
ENV HOST=0.0.0.0

CMD ["bun", "run", ".output/server/index.mjs"]
