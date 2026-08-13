# ─── Multi-stage build ────────────────────────────────────────────
# Stage 1: install deps (npm ci) + build the Vite SPA.
# Stage 2: slim runtime that only serves the static dist/ with SPA fallback.
# ──────────────────────────────────────────────────────────────────

FROM node:22-alpine AS build

ARG CACHE_BUST=1

WORKDIR /app

COPY package.json package-lock.json ./
# Cache the npm tarball cache across builds so `npm ci` stays fast even
# when package-lock.json changes (BuildKit cache mount, requires BuildKit).
RUN --mount=type=cache,target=/root/.npm npm ci --legacy-peer-deps --no-audit --no-fund

COPY . ./
# build:docker = vite build + version file, WITHOUT `tsc -b`. tsc is a pure
# type-check (noEmit) and adds ~15 min to every deploy; type-checking belongs
# in CI/local (`npm run typecheck`), not in the deploy image.
RUN --mount=type=cache,target=/app/node_modules/.vite \
  echo "build: $CACHE_BUST" && npm run build:docker

# ─── Runtime ──────────────────────────────────────────────────────
FROM node:22-alpine

# Install wget for healthcheck + serve for static SPA hosting
RUN apk add --no-cache wget && npm install --global serve --silent

WORKDIR /app

# Copy only the built assets + env injector script
COPY --from=build /app/dist ./dist
COPY generate-env-config.js ./

# Inject runtime VITE_* env vars into dist/env-config.js at startup
ENV PORT=8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:${PORT} || exit 1

EXPOSE ${PORT}
CMD node generate-env-config.js && exec serve -s dist -l tcp://0.0.0.0:${PORT}
