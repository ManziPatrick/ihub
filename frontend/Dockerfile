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

# Install the static-server binary HERE (in the cached build stage) instead of
# in the runtime stage. The runtime stage's RUN layers are never layer-cached
# in Dokploy, so `npm install --global serve` re-downloaded on every deploy
# (~90s). In this stage it's cheap (npm cache mount) and layer-cached.
RUN --mount=type=cache,target=/root/.npm npm install --global serve --silent

COPY . ./
# build:docker = vite build + version file, WITHOUT `tsc -b`. tsc is a pure
# type-check (noEmit) and adds ~15 min to every deploy; type-checking belongs
# in CI/local (`npm run typecheck`), not in the deploy image.
# NODE_OPTIONS caps the heap so the build can't balloon RAM and get OOM-killed
# mid-deploy (which Dokploy shows as "cancelled"). Adjust to your VPS RAM.
ENV NODE_OPTIONS="--max-old-space-size=2048"
RUN --mount=type=cache,target=/app/node_modules/.vite \
  echo "build: $CACHE_BUST" && npm run build:docker

# ─── Runtime ──────────────────────────────────────────────────────
FROM node:22-alpine

# wget only — serve is copied from the build stage (no npm in the runtime)
RUN apk add --no-cache wget

WORKDIR /app

# Copy the serve module from the build stage and recreate its bin symlink.
# (Docker COPY resolves symlinks into regular files, which would break Node's
# module resolution — serve would look for its deps relative to /usr/local/bin.)
COPY --from=build /usr/local/lib/node_modules/serve /usr/local/lib/node_modules/serve
RUN ln -s /usr/local/lib/node_modules/serve/build/main.js /usr/local/bin/serve

# Copy only the built assets + env injector script
COPY --from=build /app/dist ./dist
COPY generate-env-config.js ./

# Inject runtime VITE_* env vars into dist/env-config.js at startup
ENV PORT=8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:${PORT} || exit 1

EXPOSE ${PORT}
CMD node generate-env-config.js && exec serve -s dist -l tcp://0.0.0.0:${PORT}
