FROM oven/bun:1 AS builder
WORKDIR /app

# Copy workspace manifests
COPY package.json bun.lock* ./
COPY packages/frontend/package.json ./packages/frontend/
COPY packages/backend/package.json ./packages/backend/
COPY packages/shared/package.json ./packages/shared/

RUN bun install --frozen-lockfile

# Copy source
COPY packages/frontend ./packages/frontend
COPY packages/backend/src ./packages/backend/src
COPY packages/shared ./packages/shared

ARG NUXT_PUBLIC_API_BASE
ARG NUXT_PUBLIC_WS_URL

ENV NUXT_PUBLIC_API_BASE=$NUXT_PUBLIC_API_BASE
ENV NUXT_PUBLIC_WS_URL=$NUXT_PUBLIC_WS_URL
ENV NODE_ENV=production

RUN cd packages/frontend && bun run build

# Production image
FROM oven/bun:1-slim AS runner
WORKDIR /app

COPY --from=builder /app/packages/frontend/.output ./.output

EXPOSE 3000

ENV PORT=3000
ENV HOST=0.0.0.0

CMD ["bun", ".output/server/index.mjs"]
