# ── Stage 1: Build ─────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

COPY package.json package-lock.json ./
COPY packages/shared/package.json   ./packages/shared/
COPY apps/web/package.json          ./apps/web/

RUN npm ci

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

RUN npm ci --omit=dev

COPY packages/shared               ./packages/shared
RUN npm run build:shared

COPY --from=builder /app/apps/web/.next  ./apps/web/.next
COPY --from=builder /app/apps/web/public ./apps/web/public

EXPOSE 3000
CMD ["npm", "--workspace", "apps/web", "run", "start"]
