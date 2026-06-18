# ── Stage 1: Build ─────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/shared/package.json    ./packages/shared/
COPY apps/api/package.json           ./apps/api/

RUN npm ci

COPY packages/shared ./packages/shared
RUN npm run build:shared

COPY apps/api ./apps/api
RUN npm --workspace apps/api run build

# ── Stage 2: Production ────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY packages/shared/package.json    ./packages/shared/
COPY apps/api/package.json           ./apps/api/

# --ignore-scripts: skip postinstall (which would try to run tsc, a devDep)
RUN npm ci --omit=dev --ignore-scripts

# Copy shared source + pre-built dist from builder (no need to rerun tsc)
COPY packages/shared ./packages/shared
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist

COPY --from=builder /app/apps/api/dist ./apps/api/dist

EXPOSE 4000
CMD ["node", "apps/api/dist/main"]
