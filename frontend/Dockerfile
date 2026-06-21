# ─── Stage 1: Builder ───────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Force NODE_ENV=development so npm installs devDependencies (typescript/vite/etc.)
COPY frontend/package.json frontend/package-lock.json ./
RUN npm install --legacy-peer-deps

# Copy source & build
COPY frontend/ ./
RUN npm run build

# ─── Stage 2: Production (nginx) ────────────────────────────────
FROM nginx:1.27-alpine AS production

# Install Node.js (needed for generate-env-config.js at runtime)
# nginx:alpine uses apk as package manager
RUN apk add --no-cache nodejs

WORKDIR /app

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy nginx config with brotli/gzip pre-compressed asset support
COPY frontend/nginx.conf /etc/nginx/templates/default.conf.template

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
# 2. Substitute ${PORT} in nginx template (nginx's envsubst)
# 3. Start nginx in foreground
CMD node generate-env-config.js && \
    envsubst '\${PORT}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && \
    nginx -g 'daemon off;'
