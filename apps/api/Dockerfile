# ── Stage 1: Build ─────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/shared/package.json    ./packages/shared/
COPY apps/api/package.json           ./apps/api/

# --ignore-scripts: source not copied yet, skip postinstall; build shared manually after
RUN npm ci --ignore-scripts

COPY packages/shared ./packages/shared
# Build shared types, then rebuild native addons (bcrypt etc.) skipped by --ignore-scripts
RUN npm run build:shared && npm rebuild

COPY apps/api ./apps/api
RUN npm --workspace apps/api run build

# ── Stage 2: Production ────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy node_modules from builder so native addons (bcrypt) are pre-compiled
# for the same node:20-alpine environment — no npm install needed here.
COPY --from=builder /app/node_modules ./node_modules

COPY package.json ./
COPY packages/shared/package.json    ./packages/shared/
COPY apps/api/package.json           ./apps/api/

# Copy shared source + pre-built dist
COPY packages/shared ./packages/shared
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist

COPY --from=builder /app/apps/api/dist ./apps/api/dist

EXPOSE 4000
CMD ["node", "apps/api/dist/main"]
