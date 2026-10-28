# Vidkryto — production image with a persistent SQLite volume.
FROM node:24-bookworm-slim AS deps
WORKDIR /app
COPY package.json ./
RUN npm install --no-audit --no-fund

FROM node:24-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN node scripts/assemble-db.mjs && npm run build && npm prune --omit=dev

FROM node:24-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/data/clarity.db ./data/seed.db
COPY --from=builder /app/scripts/init-db.mjs ./scripts/init-db.mjs
ENV DB_FILE=/data/clarity.db
ENV SEED_DB=/app/data/seed.db
EXPOSE 3000
CMD ["sh", "-c", "node scripts/init-db.mjs && node node_modules/next/dist/bin/next start -p ${PORT:-3000}"]
