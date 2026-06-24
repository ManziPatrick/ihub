# ─── Single-stage Node.js SPA server ─────────────────────────────
# Builds the Vite SPA and serves it with vite preview (no nginx).
# Like running `npm run build && npm run preview` locally.
# ──────────────────────────────────────────────────────────────────

FROM node:22-alpine

ARG CACHE_BUST=1

WORKDIR /app

# Install wget for healthcheck (not included by default in node:alpine)
RUN apk add --no-cache wget

COPY frontend/package.json frontend/package-lock.json ./
RUN npm install --legacy-peer-deps --no-audit --no-fund

COPY frontend/ ./
RUN npm run build

# Inject runtime VITE_* env vars into dist/env-config.js at startup
ENV PORT=8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:${PORT} || exit 1

EXPOSE ${PORT}
CMD node generate-env-config.js && exec npx vite preview --host :: --port ${PORT}
