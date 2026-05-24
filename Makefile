# Aurora — common workflows.
# Run `make help` for the full list. Targets are tab-indented (not spaces).

SHELL := /bin/bash
.DEFAULT_GOAL := help
.ONESHELL:
.SHELLFLAGS := -eu -o pipefail -c

COMPOSE       ?= docker compose
COMPOSE_DEV   ?= $(COMPOSE) -f docker-compose.yml -f docker-compose.dev.yml
PNPM          ?= pnpm
API_FILTER    := --filter @app/api
WEB_FILTER    := --filter @app/web

# ---------------------------------------------------------------------------
# Help — auto-generates target list from `## comment` after each target
# ---------------------------------------------------------------------------
.PHONY: help
help: ## Show this help
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z0-9_.-]+:.*?## / {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# ---------------------------------------------------------------------------
# Local dev (host node + dockerized DB)
# ---------------------------------------------------------------------------
.PHONY: install
install: ## Install all workspace dependencies
	$(PNPM) install

.PHONY: dev
dev: ## Start API + web in dev mode (DB must be up — `make db-up`)
	$(PNPM) dev

.PHONY: dev-api
dev-api: ## Start only the API in dev mode
	$(PNPM) $(API_FILTER) dev

.PHONY: dev-web
dev-web: ## Start only the web app in dev mode
	$(PNPM) $(WEB_FILTER) dev

# ---------------------------------------------------------------------------
# Database (dockerized)
# ---------------------------------------------------------------------------
.PHONY: db-up
db-up: ## Start MySQL only (foreground-detached)
	$(COMPOSE) up -d mysql

.PHONY: db-down
db-down: ## Stop the database container
	$(COMPOSE) stop mysql

.PHONY: migrate
migrate: ## Apply Prisma migrations against the running DB
	$(PNPM) $(API_FILTER) prisma migrate deploy

.PHONY: migrate-dev
migrate-dev: ## Create + apply a new migration (interactive name prompt)
	$(PNPM) $(API_FILTER) prisma migrate dev

.PHONY: seed
seed: ## Seed the database with demo data
	$(PNPM) $(API_FILTER) db:seed

.PHONY: studio
studio: ## Open Prisma Studio against the dev DB
	$(PNPM) $(API_FILTER) prisma studio

.PHONY: db-shell
db-shell: ## MySQL CLI shell inside the running container
	$(COMPOSE) exec mysql mysql -uapp -papppw ecommerce

# ---------------------------------------------------------------------------
# Full dockerized stack
# ---------------------------------------------------------------------------
.PHONY: up
up: ## Build + start the full stack (db + migrate + api + web)
	$(COMPOSE) up -d --build

.PHONY: up-dev
up-dev: ## Same as `up` but with source mounted + hot reload
	$(COMPOSE_DEV) up -d --build

.PHONY: down
down: ## Stop and remove all containers
	$(COMPOSE) down

.PHONY: nuke
nuke: ## Stop containers AND drop volumes (destroys DB data!)
	$(COMPOSE) down -v

.PHONY: logs
logs: ## Tail logs from all services
	$(COMPOSE) logs -f --tail=100

.PHONY: ps
ps: ## Show running services
	$(COMPOSE) ps

# ---------------------------------------------------------------------------
# Build / type-check / lint / test
# ---------------------------------------------------------------------------
.PHONY: build
build: ## Build all apps (host-side, not docker)
	$(PNPM) build

.PHONY: typecheck
typecheck: ## TypeScript type-check across the monorepo
	$(PNPM) --recursive typecheck

.PHONY: lint
lint: ## Run linters
	$(PNPM) --recursive lint

.PHONY: test
test: ## Run all test suites
	$(PNPM) --recursive test

.PHONY: test-unit
test-unit: ## Run unit tests only (excludes integration/)
	$(PNPM) $(API_FILTER) vitest run --exclude 'tests/integration/**'

.PHONY: test-int
test-int: ## Run integration tests (requires a running DB)
	$(PNPM) $(API_FILTER) vitest run tests/integration

# ---------------------------------------------------------------------------
# CI / Docker images
# ---------------------------------------------------------------------------
.PHONY: ci
ci: install typecheck lint test ## Full local CI pipeline

.PHONY: docker-build
docker-build: ## Build the production API + web images
	docker build -f apps/api/Dockerfile -t aurora-api:latest .
	docker build -f apps/web/Dockerfile -t aurora-web:latest .

# ---------------------------------------------------------------------------
# Cleanup
# ---------------------------------------------------------------------------
.PHONY: clean
clean: ## Remove build outputs (keeps node_modules)
	rm -rf apps/api/dist apps/web/dist packages/shared/dist

.PHONY: clean-all
clean-all: clean ## Also remove node_modules across the monorepo
	find . -name node_modules -type d -prune -exec rm -rf {} +
