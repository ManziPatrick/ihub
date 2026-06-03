# ─── Stage 1: Builder ───────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Force NODE_ENV=development so npm installs devDependencies (typescript/vite/etc.)
COPY frontend/package.json frontend/package-lock.json ./
RUN npm install --legacy-peer-deps

# Copy source & build
COPY frontend/ ./
RUN npm run build

# ─── Stage 2: Production ────────────────────────────────────────
FROM node:22-alpine AS production

WORKDIR /app

# Copy built SPA + runtime env injector + package.json (needed for "type":"module")
COPY --from=builder /app/dist ./dist
COPY frontend/generate-env-config.js ./
COPY frontend/package.json ./





HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=5 \
  CMD wget --quiet --tries=1 --spider http://localhost:8080 || exit 1

# 1. Inject runtime VITE_* env vars into dist/env-config.js
# 2. Serve SPA with --single flag so React Router handles all routes
CMD node generate-env-config.js && \
  npx --yes serve -s dist -l 8080 --single
