# Etapa 1: Dependencias base
FROM node:20-alpine AS base
WORKDIR /app

# Instalar dependencias necesarias para node-gyp y prisma
RUN apk add --no-cache libc6-compat openssl

# Dependencias para instalación
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Etapa 2: Construcción
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variables de entorno (si es necesario forzar su existencia en build-time)
ARG DATABASE_URL="postgresql://postgres:postgres@localhost:5432/dummy"
ENV DATABASE_URL=$DATABASE_URL

# Generar cliente prisma y construir la app
RUN npx prisma generate
RUN npm run build

# Etapa 3: Runner de producción
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar archivos generados necesarios para producción
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json

# Se expone el puerto para Next
EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

USER nextjs

CMD ["node", "server.js"]
