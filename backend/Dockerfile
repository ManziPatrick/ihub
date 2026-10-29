# ─── Single-stage Node.js API server ─────────────────────────────
# Builds TypeScript and runs the compiled server directly.
# Like running `npm run build && npm start` locally.
#
# Build context is the backend/ directory (docker-compose and Dokploy
# when this file is used with context ./backend). For repo-root
# context, use the root Dockerfile instead.
# ──────────────────────────────────────────────────────────────────

FROM node:22-alpine

ARG CACHE_BUST=1

WORKDIR /app/backend

RUN apk add --no-cache wget

COPY package.json package-lock.json ./
RUN npm install --legacy-peer-deps --no-audit --no-fund
COPY . ./
RUN echo "build: $CACHE_BUST" && npm run build
RUN mkdir -p /app/backend/uploads

ENV PORT=10000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=5 \
  CMD wget --quiet --tries=1 --spider http://localhost:${PORT}/health || exit 1

EXPOSE ${PORT}
CMD ["node", "dist/index.js"]
