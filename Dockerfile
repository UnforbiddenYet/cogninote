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

# Build web app with empty VITE_API_URL so it uses relative URLs
RUN VITE_API_URL= bun run --cwd apps/web build


# ---- Runtime stage ----
FROM oven/bun:1-alpine
WORKDIR /app

# Copy workspace manifests + pre-built node_modules from builder
COPY package.json ./
COPY apps/api/package.json ./apps/api/
COPY --from=builder /app/node_modules ./node_modules

# Copy API source and drizzle config
COPY apps/api/src ./apps/api/src
COPY apps/api/drizzle.config.ts ./apps/api/

# Copy built web app
COPY --from=builder /app/apps/web/dist ./apps/web/dist

EXPOSE 3001

# Push DB schema then start the server
CMD ["sh", "-c", "bun run --cwd apps/api db:push && bun run --cwd apps/api start"]
