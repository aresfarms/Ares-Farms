# syntax=docker/dockerfile:1
# =============================================================================
# Ares/Furlong — deterministic staging container (STAGING-DEPLOY P0.3)
#
# Master Volume traceability:
#   Vol III  (Technical Infrastructure) — deterministic, reproducible runtime.
#   Vol III-B (Governance Runtime)       — runtime posture identical local/prod.
#   Vol IV   (Operational Runbooks)      — the image the staging deploy runs.
#
# Design contract (each line maps to a P0.3 requirement):
#   * Node major pinned EXACTLY (24.15.0) — same across build + runtime stages.
#   * Multi-stage; the runtime layer installs NOTHING and carries NO toolchain.
#   * Consumes Next.js `output: "standalone"` (see next.config.mjs). standalone
#     does NOT bundle `public` or `.next/static`, so we copy them in explicitly.
#   * Runs as a FIXED non-root UID/GID (1001:1001).
#   * Binds 0.0.0.0 on $PORT (Cloud Run sends PORT; default 8080 here).
#   * NO secrets baked in. `.env*` is excluded by .dockerignore, so the
#     in-container build cannot trace a secret into `.next/standalone/.env`.
#     All config arrives at RUN time from Secret Manager -> process env.
#
# Reproducibility: the base image is pinned to an exact version tag. For full
# determinism the deploy pins the base by DIGEST (recorded in the deployment
# manifest alongside the resolved package-lock and the pushed image digest);
# Terraform pins the *pushed* image by digest, never by tag (P2.1).
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1 — deps: install the exact locked dependency tree once.
# -----------------------------------------------------------------------------
FROM node:24.15.0-bookworm-slim AS deps
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
# Only the manifests, so this layer caches on lockfile changes alone.
COPY package.json package-lock.json ./
# `npm ci` is deterministic: it installs exactly package-lock.json or fails.
RUN npm ci --no-audit --no-fund

# -----------------------------------------------------------------------------
# Stage 2 — builder: produce the standalone server output.
# The build runs OFFLINE with NO secrets and NO database. `.env*` is excluded
# from the context (.dockerignore), so `.next/standalone/.env` is never created.
# -----------------------------------------------------------------------------
FROM node:24.15.0-bookworm-slim AS builder
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build \
    # Defense in depth: even though .dockerignore keeps .env* out of the
    # context, assert the standalone bundle carries no env file before it can
    # ever reach the runtime stage. Fail the build loudly if one appears.
    && if ls .next/standalone/.env* >/dev/null 2>&1; then \
         echo "FATAL: .env leaked into standalone output"; exit 1; \
       fi

# -----------------------------------------------------------------------------
# Stage 3 — migrator: the furlong-db-migrate Job image (STAGING-DEPLOY P2.2).
# The runner image deliberately CANNOT run migrations (no tsx, no src/, no
# migration SQL) — that is the authority split at the image layer. This stage
# carries the full locked node_modules + source so `migrate:schema` runs under
# the migrator principal via MIGRATOR_DATABASE_URL (Secret Manager -> env).
# Build with: docker build --target migrator -t furlong-db-migrate .
# -----------------------------------------------------------------------------
FROM node:24.15.0-bookworm-slim AS migrator
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN groupadd --system --gid 1001 nodejs \
 && useradd  --system --uid 1001 --gid nodejs migrator

# Full locked dependency tree (includes tsx) + the source the scripts need.
# No .env* can enter (excluded by .dockerignore); credentials arrive at RUN
# time as MIGRATOR_DATABASE_URL from Secret Manager.
COPY --from=deps --chown=migrator:nodejs /app/node_modules ./node_modules
COPY --chown=migrator:nodejs package.json package-lock.json tsconfig.json ./
COPY --chown=migrator:nodejs src ./src

USER migrator

# STRICT path (no --allow-database-url): refuses to run unless
# MIGRATOR_DATABASE_URL is set, then applies schema + runtime grants and exits
# non-zero on any failure (Cloud Run Job exit-code honesty).
CMD ["npm", "run", "migrate:schema"]

# -----------------------------------------------------------------------------
# Stage 4 — runner: minimal production runtime. No npm, no source, no toolchain.
# -----------------------------------------------------------------------------
FROM node:24.15.0-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Cloud Run injects PORT; standalone server.js honors PORT + HOSTNAME.
ENV PORT=8080
ENV HOSTNAME=0.0.0.0

# Fixed, non-root system account (stable UID/GID for reproducibility).
RUN groupadd --system --gid 1001 nodejs \
 && useradd  --system --uid 1001 --gid nodejs nextjs

# Copy ONLY the standalone runtime, owned by the non-root user.
#   * .next/standalone -> /app  (includes the traced server.js + node_modules)
#   * .next/static     -> /app/.next/static   (not bundled by standalone)
#   * public           -> /app/public         (not bundled by standalone)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 8080

# The minimal standalone server. Reads PORT/HOSTNAME + all app config from env.
CMD ["node", "server.js"]
