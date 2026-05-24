# syntax=docker/dockerfile:1.7
ARG NODE_VERSION=20.18.0
ARG PNPM_VERSION=9.0.0
ARG NGINX_VERSION=1.27-alpine

############################
# Stage 1 — base
############################
FROM node:${NODE_VERSION}-alpine AS base
ENV PNPM_HOME="/pnpm" PATH="/pnpm:${PATH}"
RUN npm install -g corepack@latest \
 && corepack enable \
 && corepack prepare pnpm@${PNPM_VERSION} --activate
WORKDIR /repo

############################
# Stage 2 — install deps
############################
FROM base AS deps
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

############################
# Stage 3 — build static assets
############################
FROM deps AS build
ARG VITE_API_BASE_URL=http://localhost:4000
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
COPY tsconfig.base.json ./
COPY packages/shared packages/shared
COPY apps/web apps/web
RUN pnpm --filter @app/web build

############################
# Stage 4 — runtime (nginx)
############################
FROM nginx:${NGINX_VERSION} AS runtime
RUN apk add --no-cache wget
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/apps/web/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=15s --timeout=3s --retries=3 \
  CMD wget -q --spider http://127.0.0.1/ || exit 1
CMD ["nginx", "-g", "daemon off;"]
