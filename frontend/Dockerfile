# ─── Stage 1: Builder ───────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Install all dependencies (including devDeps for build tools)
COPY package.json package-lock.json ./
RUN npm ci --include=dev

# Copy source & build
COPY . .
RUN npm run build

# ─── Stage 2: Production ────────────────────────────────────────
FROM node:22-alpine AS production

WORKDIR /app

# Copy built SPA + runtime env injector + package.json (needed for "type":"module")
COPY --from=builder /app/dist ./dist
COPY generate-env-config.js ./
COPY package.json ./

ENV HOST=::
ENV NODE_ENV=production

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=5 \
  CMD wget --quiet --tries=1 --spider http://localhost:8080 || exit 1

# 1. Inject runtime VITE_* env vars into dist/env-config.js
# 2. Serve SPA with --single flag so React Router handles all routes
CMD node generate-env-config.js && \
    npx --yes serve -s dist -l 8080 --single
