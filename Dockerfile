# syntax=docker/dockerfile:1.7

# -----------------------------------------------------------------------------
# Stage 1 — deps: install all dependencies (incl. dev) for the build
# -----------------------------------------------------------------------------
FROM node:20-alpine AS deps

RUN apk add --no-cache python3 make g++ openssl libc6-compat

WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --prefer-offline --network-timeout 600000

# -----------------------------------------------------------------------------
# Stage 2 — builder: generate prisma client + compile TS
# -----------------------------------------------------------------------------
FROM node:20-alpine AS builder

RUN apk add --no-cache openssl libc6-compat

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN yarn generate
RUN yarn build

# Prune to production deps for the runtime image
RUN yarn install --frozen-lockfile --production --prefer-offline --network-timeout 600000 \
 && yarn cache clean

# -----------------------------------------------------------------------------
# Stage 3 — runtime: small image, non-root user
# -----------------------------------------------------------------------------
FROM node:20-alpine AS runtime

RUN apk add --no-cache openssl libc6-compat tini wget \
 && addgroup -g 1001 -S nodejs \
 && adduser -S -u 1001 -G nodejs nestjs

WORKDIR /app

ENV NODE_ENV=production \
    HUSKY=0 \
    NODE_OPTIONS=--enable-source-maps

# Copy production node_modules + compiled dist + prisma + package.json
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nestjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nestjs:nodejs /app/yarn.lock ./yarn.lock

USER nestjs

EXPOSE 3001

# tini reaps zombies + forwards SIGTERM cleanly to node
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/main"]
