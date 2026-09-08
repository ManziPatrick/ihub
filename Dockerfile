# ─── Root Dockerfile — BACKEND (Dokploy / simple compose) ─────────
# IMPORTANT: Dokploy builds with the REPO ROOT as the build context.
# All COPY paths must therefore be relative to the repo root, with the
# backend sources under ./backend/. (Previously this file assumed the
# backend/ dir as context, which broke Dokploy builds with
# "/package.json": not found.)
# ──────────────────────────────────────────────────────────────────

FROM node:22-alpine

ARG CACHE_BUST=1

WORKDIR /app/backend

# Install wget for healthcheck
RUN apk add --no-cache wget

# Copy backend source code and install dependencies
COPY backend/ ./
RUN npm install --legacy-peer-deps --no-audit --no-fund
RUN echo "build: $CACHE_BUST" && npm run build
RUN mkdir -p /app/uploads

ENV PORT=10000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=5 \
  CMD wget --quiet --tries=1 --spider http://localhost:${PORT}/health || exit 1

EXPOSE ${PORT}
CMD ["node", "dist/index.js"]
