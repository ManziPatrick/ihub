# ─── Stage 1: Builder ───────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies first (layer-cached)
COPY package.json package-lock.json ./
RUN npm install --legacy-peer-deps

# Copy source & build
COPY . .
RUN npm run build

# ─── Stage 2: Production ────────────────────────────────────────
FROM node:22-alpine AS production

WORKDIR /app

# Install only production dependencies
COPY package.json package-lock.json ./
RUN npm install --legacy-peer-deps --omit=dev

# Copy compiled output from builder
COPY --from=builder /app/dist ./dist

# Persistent directory for uploaded files
RUN mkdir -p /app/uploads

# Runtime environment
ENV HOST=::
ENV PORT=4000
ENV NODE_ENV=production

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=5 \
  CMD wget --quiet --tries=1 --spider http://localhost:4000/health || exit 1

CMD ["node", "dist/index.js"]
