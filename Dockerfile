# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

FROM base AS dependencies
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

FROM base AS builder
ENV NODE_ENV=production \
    DATABASE_URL=mysql://build:build@127.0.0.1:3306/build
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN ./node_modules/.bin/prisma generate \
    && npm run build

# Imagen one-shot para sincronizar schema en entornos sin historial de migraciones.
# OnlyCars actualmente no contiene prisma/migrations, por eso migrate deploy no crea tablas.
FROM base AS database-migrate
ENV NODE_ENV=production
COPY --from=dependencies /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY prisma ./prisma
CMD ["sh", "-c", "./node_modules/.bin/prisma generate && ./node_modules/.bin/prisma db push"]

# Imagen para inicialización y seed inicial idempotente.
# Después del seed se fuerzan los usuarios definidos por entorno y se valida todo el circuito auth.
FROM database-migrate AS database-init
COPY scripts ./scripts
CMD ["sh", "-c", "./node_modules/.bin/prisma generate && ./node_modules/.bin/prisma db push && node scripts/seed-saas.mjs && node scripts/ensure-auth-users.mjs && node scripts/check-auth-bootstrap.mjs"]

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000 \
    TZ=America/Argentina/Buenos_Aires

RUN groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
