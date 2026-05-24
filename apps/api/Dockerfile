# syntax=docker/dockerfile:1.7
ARG NODE_VERSION=20.18.0
ARG PNPM_VERSION=9.0.0

############################
# Stage 1 — base toolchain
############################
FROM node:${NODE_VERSION}-alpine AS base
ENV PNPM_HOME="/pnpm" PATH="/pnpm:${PATH}"
RUN npm install -g corepack@latest \
 && corepack enable \
 && corepack prepare pnpm@${PNPM_VERSION} --activate
# Toolchain for argon2 native build + Prisma runtime libraries
RUN apk add --no-cache python3 make g++ openssl libc6-compat
WORKDIR /repo

############################
# Stage 2 — install + build + deploy
############################
FROM base AS build
# 1. Bring in lock + manifests first to maximize cache reuse
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

# 2. Source
COPY tsconfig.base.json ./
COPY packages/shared packages/shared
COPY apps/api apps/api

# 3. Generate Prisma client (uses musl engine via binaryTargets in schema)
RUN pnpm --filter @app/api db:generate

# 4. Bundle the API with tsup (path aliases + workspace deps resolved here)
RUN pnpm --filter @app/api build

# 5. Flatten into a self-contained production tree at /deploy
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm --filter @app/api deploy --prod /deploy

############################
# Stage 3 — minimal runtime
############################
FROM node:${NODE_VERSION}-alpine AS runtime
RUN apk add --no-cache openssl libc6-compat tini wget
ENV NODE_ENV=production \
    PORT=4000

# Non-root user
RUN addgroup -S app && adduser -S -G app app

WORKDIR /app
COPY --from=build --chown=app:app /deploy ./

USER app
EXPOSE 4000

HEALTHCHECK --interval=15s --timeout=3s --start-period=15s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:${PORT}/healthz || exit 1

# tini forwards signals for graceful shutdown
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/server.js"]
