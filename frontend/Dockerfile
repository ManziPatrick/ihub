# ─── Stage 1: Builder ───────────────────────────────────────────
FROM node:22-alpine AS builder

# Build ARG for cache busting — pass --build-arg CACHE_BUST=$(date +%s) to force a clean build
ARG CACHE_BUST=1

WORKDIR /app

# Force NODE_ENV=development so npm installs devDependencies (typescript/vite/etc.)
COPY frontend/package.json frontend/package-lock.json ./
RUN npm install --legacy-peer-deps --no-audit --no-fund

# Copy source & build
COPY frontend/ ./
RUN npm run build

# ─── Stage 2: Production (nginx) ────────────────────────────────
FROM nginx:1.27-alpine AS production

# Install Node.js (needed for generate-env-config.js at runtime)
# nginx:alpine uses apk as package manager
RUN apk add --no-cache nodejs

WORKDIR /app

# Remove default nginx config files — we replace the main config entirely
RUN rm -f /etc/nginx/conf.d/default.conf /etc/nginx/nginx.conf

# Copy nginx config template (full config with worker_processes, events, http)
COPY frontend/nginx.conf /etc/nginx/templates/nginx.conf.template

# Copy built SPA from builder stage
COPY --from=builder /app/dist ./dist

# Copy runtime env injector
COPY frontend/generate-env-config.js ./
COPY frontend/package.json ./

# Runtime environment variables for nginx template substitution
ENV PORT=8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=5 \
  CMD wget --quiet --tries=1 --spider http://localhost:${PORT} || exit 1

# 1. Inject runtime VITE_* env vars into dist/env-config.js
# 2. Substitute ${PORT} in nginx template and write to main nginx.conf
#    (Writing to /etc/nginx/nginx.conf is required because the template
#     has top-level directives like worker_processes that
#     are NOT allowed inside http {} blocks — writing to
#     conf.d/ would nest them incorrectly.)
# 3. Start nginx in foreground
CMD node generate-env-config.js && \
    envsubst '\${PORT}' < /etc/nginx/templates/nginx.conf.template > /etc/nginx/nginx.conf && \
    nginx -g 'daemon off;'
