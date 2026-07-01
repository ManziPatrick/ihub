# ─── Root Dockerfile for Dokploy / simple compose ────────────────
# Builds the backend from the project root context (build: .).
# Copies backend/ subdirectory into the image.
# ──────────────────────────────────────────────────────────────────

FROM node:22-alpine

ARG CACHE_BUST=1

WORKDIR /app

# Install wget for healthcheck
RUN apk add --no-cache wget

# Copy backend package files and install dependencies
COPY package.json package-lock.json ./
RUN npm install --legacy-peer-deps --no-audit --no-fund

# Copy backend source code
COPY . ./

RUN echo "build: $CACHE_BUST" && npm run build

RUN mkdir -p /app/uploads

ENV PORT=4000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=5 \
  CMD wget --quiet --tries=1 --spider http://localhost:${PORT}/health || exit 1

EXPOSE ${PORT}
CMD ["node", "dist/index.js"]
