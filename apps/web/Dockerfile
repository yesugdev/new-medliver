# ── Stage 1: Build ─────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

COPY package.json package-lock.json ./
COPY packages/shared/package.json   ./packages/shared/
COPY apps/web/package.json          ./apps/web/

# --ignore-scripts: source not copied yet, skip postinstall; build shared manually after
RUN npm ci --ignore-scripts

COPY packages/shared ./packages/shared
RUN npm run build:shared

COPY apps/web ./apps/web
RUN npm --workspace apps/web run build

# ── Stage 2: Production ────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

COPY package.json package-lock.json ./
COPY packages/shared/package.json   ./packages/shared/
COPY apps/web/package.json          ./apps/web/

# --ignore-scripts: skip postinstall (which would try to run tsc, a devDep)
RUN npm ci --omit=dev --ignore-scripts

# Copy shared source + pre-built dist from builder (no need to rerun tsc)
COPY packages/shared               ./packages/shared
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist

COPY --from=builder /app/apps/web/.next  ./apps/web/.next
COPY --from=builder /app/apps/web/public ./apps/web/public

EXPOSE 3000
CMD ["npm", "--workspace", "apps/web", "run", "start"]
