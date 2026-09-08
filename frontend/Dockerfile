FROM node:22-alpine AS build

ARG CACHE_BUST=1

WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --legacy-peer-deps --no-audit --no-fund
RUN --mount=type=cache,target=/root/.npm npm install --global serve --silent
COPY frontend/ . ./
ENV NODE_OPTIONS="--max-old-space-size=2048"
ENV UV_THREADPOOL_SIZE=2
RUN --mount=type=cache,target=/app/frontend/node_modules/.vite \
  echo "build: $CACHE_BUST" && npm run build:docker
RUN node generate-env-config.js

FROM node:22-alpine
RUN apk add --no-cache wget
WORKDIR /app
COPY --from=build /usr/local/lib/node_modules/serve /usr/local/lib/node_modules/serve
RUN ln -s /usr/local/lib/node_modules/serve/build/main.js /usr/local/bin/serve
COPY --from=build /app/frontend/dist ./dist
COPY --from=build /app/frontend/generate-env-config.js ./generate-env-config.js
COPY --from=build /app/frontend/serve.json ./serve.json
ENV PORT=8080
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:${PORT} || exit 1
EXPOSE ${PORT}
CMD node generate-env-config.js && exec serve -s dist -l tcp://0.0.0.0:${PORT} --config serve.json
