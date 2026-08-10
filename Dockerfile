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
#   * Node build toolchain pinned EXACTLY (24.15.0); runtime pinned by
#     content-addressed distroless Node 24 digest.
#   * Multi-stage; the runtime layer installs NOTHING and carries NO toolchain.
#   * Consumes Next.js `output: "standalone"` (see next.config.mjs). standalone
#     does NOT bundle `public` or `.next/static`, so we copy them in explicitly.
#   * Runs as the FIXED distroless non-root UID/GID (65532:65532).
#   * Binds 0.0.0.0 on $PORT (Cloud Run sends PORT; default 8080 here).
#   * NO secrets baked in. `.env*` is excluded by .dockerignore, so the
#     in-container build cannot trace a secret into `.next/standalone/.env`.
#     All config arrives at RUN time from Secret Manager -> process env.
#
# Reproducibility: build stages use an exact Node patch tag and final runtime
# stages use immutable base digests. The deployment manifest records the
# resolved package-lock and the pushed image digest.
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
# Defense in depth: even though .dockerignore keeps .env* out of the context,
# assert the standalone bundle carries no env file before it can ever reach the
# runtime stage. Fail the build loudly if one appears.
RUN npm run build \
 && if ls .next/standalone/.env* >/dev/null 2>&1; then \
      echo "FATAL: .env leaked into standalone output"; exit 1; \
    fi

# Bundle the two migration and two bounded operations programs during build.
# The final migrator carries only these bundles plus canonical SQL - no npm,
# tsx, esbuild, Go tool binaries, or development dependency tree.
RUN mkdir -p /migrator \
 && npx --no-install esbuild src/scripts/applyCanonicalGovernanceMigration.ts \
      --bundle --platform=node --target=node24 --format=cjs \
      --outfile=/migrator/applyCanonicalGovernanceMigration.cjs \
 && npx --no-install esbuild src/scripts/applyRuntimeDatabaseGrants.ts \
      --bundle --platform=node --target=node24 --format=cjs \
      --outfile=/migrator/applyRuntimeDatabaseGrants.cjs \
 && npx --no-install esbuild src/scripts/verifyRuntimePrivileges.ts \
      --bundle --platform=node --target=node24 --format=cjs \
      --outfile=/migrator/verifyRuntimePrivileges.cjs \
 && npx --no-install esbuild src/scripts/runSourceRefresh.ts \
      --bundle --platform=node --target=node24 --format=cjs \
      --outfile=/migrator/runSourceRefresh.cjs

# -----------------------------------------------------------------------------
# Stage 3 — migrator: the furlong-db-migrate Job image (STAGING-DEPLOY P2.2).
# The runner image deliberately CANNOT run migrations (no tsx, no src/, no
# migration SQL) — that is the authority split at the image layer. This stage
# carries only pre-bundled migration programs and canonical SQL; it runs under
# the migrator principal via MIGRATOR_DATABASE_URL (Secret Manager -> env).
# Build with: docker build --target migrator -t furlong-db-migrate .
# -----------------------------------------------------------------------------
FROM gcr.io/distroless/nodejs24-debian13@sha256:2e3b3a96d1d7286c3e4727f9c84b4dc32b6b33e7d7d4425c5a5c8186ad85fa93 AS migrator
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Only executable migration bundles, the sequential entrypoint, and canonical
# SQL enter the privileged image. Credentials arrive at run time from Secret
# Manager; no package manager, shell, source tree, or build tool is present.
COPY --from=builder --chown=65532:65532 /migrator/ ./
COPY --from=builder --chown=65532:65532 /app/src/scripts/migratorEntrypoint.mjs ./
COPY --from=builder --chown=65532:65532 /app/src/lib/db/migrations ./src/lib/db/migrations

USER 65532:65532

# Distroless Node supplies the node entrypoint. The wrapper runs structure then
# grants sequentially and propagates the first non-zero exit code.
CMD ["migratorEntrypoint.mjs"]

# -----------------------------------------------------------------------------
# Stage 4 — runner: minimal production runtime. No npm, no source, no toolchain.
# -----------------------------------------------------------------------------
FROM gcr.io/distroless/nodejs24-debian13@sha256:2e3b3a96d1d7286c3e4727f9c84b4dc32b6b33e7d7d4425c5a5c8186ad85fa93 AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Cloud Run injects PORT; standalone server.js honors PORT + HOSTNAME.
ENV PORT=8080
ENV HOSTNAME=0.0.0.0

# Distroless supplies the pinned Node runtime and CA certificates only: no
# shell, package manager, OS administration tools, or mutable install layer.

# Copy ONLY the standalone runtime, owned by the non-root user.
#   * .next/standalone -> /app  (includes the traced server.js + node_modules)
#   * .next/static     -> /app/.next/static   (not bundled by standalone)
#   * public           -> /app/public         (not bundled by standalone)
COPY --from=builder --chown=65532:65532 /app/.next/standalone ./
COPY --from=builder --chown=65532:65532 /app/.next/static ./.next/static
COPY --from=builder --chown=65532:65532 /app/public ./public
# Next/Turbopack rewrites PDFKit's module directory to /ROOT in the compiled
# server chunk. Preserve PDFKit's built-in AFM/ICC assets at that traced path
# as well as under /app/node_modules, or report rendering fails at runtime.
COPY --from=builder --chown=65532:65532 /app/node_modules/pdfkit/js/data /ROOT/node_modules/pdfkit/js/data

USER 65532:65532
EXPOSE 8080

# Distroless Node supplies the node entrypoint; server.js reads all config from env.
CMD ["server.js"]
