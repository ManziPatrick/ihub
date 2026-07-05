# ─── Bootskills Docker Development Commands ──────────────────────────
# These targets auto-pass the current git commit hash as CACHE_BUST
# so Docker always rebuilds the frontend when code changes.
# ─────────────────────────────────────────────────────────────────────

# ── Git commit hash used to bust the Docker build cache ────────────
GIT_HASH := $(shell git rev-parse --short HEAD 2>/dev/null || echo "dev")
NOW       := $(shell date +%s)

# ── Build images without starting containers ───────────────────────
.PHONY: build
build:
	CACHE_BUST=$(GIT_HASH)-$(NOW) docker-compose build

.PHONY: build-frontend
build-frontend:
	CACHE_BUST=$(GIT_HASH)-$(NOW) docker-compose build frontend

.PHONY: build-backend
build-backend:
	CACHE_BUST=$(GIT_HASH)-$(NOW) docker-compose build backend

# ── Build & start containers ───────────────────────────────────────
.PHONY: up
up:
	CACHE_BUST=$(GIT_HASH)-$(NOW) docker-compose up --build -d

.PHONY: up-frontend
up-frontend:
	CACHE_BUST=$(GIT_HASH)-$(NOW) docker-compose up --build -d frontend

.PHONY: up-backend
up-backend:
	docker-compose up --build -d backend

# ── Start containers (no rebuild, uses existing image) ─────────────
.PHONY: start
start:
	docker-compose up -d

# ── Stop containers ────────────────────────────────────────────────
.PHONY: stop
stop:
	docker-compose stop

.PHONY: down
down:
	docker-compose down

# ── View logs ──────────────────────────────────────────────────────
.PHONY: logs
logs:
	docker-compose logs -f

.PHONY: logs-frontend
logs-frontend:
	docker-compose logs -f frontend

.PHONY: logs-backend
logs-backend:
	docker-compose logs -f backend

# ── Rebuild frontend while containers are running ───────────────────
# Useful when you make frontend changes and don't want to restart everything.
.PHONY: rebuild-frontend
rebuild-frontend:
	CACHE_BUST=$(GIT_HASH)-$(NOW) docker-compose build frontend
	docker-compose up -d --no-deps frontend

# ── Clean up ────────────────────────────────────────────────────────
# Removes containers, networks, and local-images for this project only.
# Use --volumes if you also want to delete persistent data (uploads, etc.)
.PHONY: clean
clean:
	docker-compose down --rmi local

.PHONY: clean-all
clean-all:
	docker-compose down -v --rmi all

# ── Development helpers ────────────────────────────────────────────
.PHONY: dev-frontend
dev-frontend:
	cd frontend && npm run dev

# ── Show current git hash and timestamp (debug) ────────────────────
.PHONY: info
info:
	@echo "Git hash:  $(GIT_HASH)"
	@echo "Timestamp: $(NOW)"
	@echo "CACHE_BUST: $(GIT_HASH)-$(NOW)"
