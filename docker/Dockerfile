# ---- Build stage ----
FROM oven/bun:1-alpine AS builder
WORKDIR /app

# Install dependencies (all workspaces)
COPY package.json bun.lock* ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
RUN bun install --frozen-lockfile

# Copy source
COPY . .

# Build API declarations (required by web typecheck)
RUN bun run --cwd apps/api build

# Build web app — VITE_ vars passed as build args from docker-compose
ARG VITE_API_URL
ARG VITE_BETTER_AUTH_BASE_URL
RUN bun run --cwd apps/web build


# ---- Runtime stage ----
FROM oven/bun:1-alpine
WORKDIR /app

# Production-only install (no devDependencies)
COPY package.json bun.lock* ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
RUN bun install --frozen-lockfile --production && rm -rf /tmp/*

# Copy API source and drizzle config
COPY apps/api/src ./apps/api/src
COPY apps/api/drizzle.config.ts ./apps/api/

# Copy built web app
COPY --from=builder /app/apps/web/dist ./apps/web/dist

# Copy entrypoint
COPY docker/docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["bun", "apps/api/src/index.ts"]
