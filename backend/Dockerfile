# ─── Stage 1: Builder ───────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./

# Force NODE_ENV=development so npm installs devDependencies (typescript/tsc)
# even when Coolify injects NODE_ENV=production as a build ARG
RUN npm install --legacy-peer-deps

# Copy source & build
COPY . .
RUN npm run build

# ─── Stage 2: Production ────────────────────────────────────────
FROM node:22-alpine AS production

WORKDIR /app

COPY package.json package-lock.json ./

# Production deps only (no tsc needed at runtime)
RUN npm install --legacy-peer-deps --omit=dev

# Copy compiled output from builder
COPY --from=builder /app/dist ./dist

# Persistent directory for uploaded files
RUN mkdir -p /app/uploads





HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=5 \
  CMD wget --quiet --tries=1 --spider http://localhost:4000/health || exit 1

CMD ["node", "dist/index.js"]