# =============================================================================
# infra/staging — service accounts + least-privilege IAM (STAGING-DEPLOY P1)
#
# Two SAs, each scoped to ONLY the secrets it needs (spec authority map):
#   furlong-core-runtime  -> DATABASE_URL + NEXTAUTH_SECRET   (Cloud Run service)
#   furlong-db-migrator   -> MIGRATOR_DATABASE_URL            (migrator Job)
#
# Separate GCP SAs do not by themselves create separate Postgres authority under
# password auth — the DB principals + credentials (owner-created) enforce that.
# These SAs enforce SECRET-ACCESS separation.
#
# No SA keys are created (Workload Identity / attached SA only; owner-only-secrets
# rule). roles/cloudsql.client is granted ONLY if var.grant_cloudsql_client
# (Direct private-IP + normal connection string does not need it).
# =============================================================================

# ---- Service accounts -------------------------------------------------------

resource "google_service_account" "core_runtime" {
  project      = var.project_id
  account_id   = "furlong-core-runtime"
  display_name = "Furlong core runtime (Cloud Run service)"
  description  = "Runtime SA for furlong-core. Reads DATABASE_URL + NEXTAUTH_SECRET only."

  depends_on = [google_project_service.required]
}

resource "google_service_account" "db_migrator" {
  project      = var.project_id
  account_id   = "furlong-db-migrator"
  display_name = "Furlong DB migrator (Cloud Run Job)"
  description  = "Migrator SA for furlong-db-migrate. Reads MIGRATOR_DATABASE_URL only."

  depends_on = [google_project_service.required]
}

resource "google_service_account" "scanner_runtime" {
  project      = var.project_id
  account_id   = "furlong-scanner-runtime"
  display_name = "Furlong malware scanner runtime (Cloud Run service)"
  description  = "Isolated runtime SA for furlong-scanner. No Secret Manager, database, or storage access."

  depends_on = [google_project_service.required]
}

# ---- Secret access: runtime SA -> DATABASE_URL + NEXTAUTH_SECRET ------------

resource "google_secret_manager_secret_iam_member" "runtime_database_url" {
  project   = var.project_id
  secret_id = google_secret_manager_secret.app["DATABASE_URL"].secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.core_runtime.email}"
}

# SENDGRID_API_KEY is created + versioned out of band by the owner (not TF), so
# it is referenced by literal name. Grant the runtime SA read access only when
# notifications are configured (EMAIL_FROM set).
resource "google_secret_manager_secret_iam_member" "runtime_sendgrid_api_key" {
  count     = var.email_from == "" ? 0 : 1
  project   = var.project_id
  secret_id = "SENDGRID_API_KEY"
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.core_runtime.email}"
}

# NASS_API_KEY is created + versioned out of band by the owner (not TF). The daily
# source-refresh job runs as core_runtime; grant it read access only when the
# commodity/livestock auto-refresh is enabled.
resource "google_secret_manager_secret_iam_member" "runtime_nass_api_key" {
  count     = var.nass_api_key_enabled ? 1 : 0
  project   = var.project_id
  secret_id = "NASS_API_KEY"
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.core_runtime.email}"
}

# AUTH_CREDENTIAL_SHARED_SECRET — created out of band by the owner; grant the
# runtime SA read access only when operator credential login is enabled.
resource "google_secret_manager_secret_iam_member" "runtime_auth_shared_secret" {
  count     = var.auth_credentials_mode == "" ? 0 : 1
  project   = var.project_id
  secret_id = "AUTH_CREDENTIAL_SHARED_SECRET"
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.core_runtime.email}"
}

resource "google_secret_manager_secret_iam_member" "runtime_nextauth_secret" {
  project   = var.project_id
  secret_id = google_secret_manager_secret.app["NEXTAUTH_SECRET"].secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.core_runtime.email}"
}

# Keyless Gmail domain-wide delegation: the runtime SA signs JWTs AS ITSELF
# via the IAM Credentials API (no downloaded key files ever). Pairs with the
# owner's one-time Admin-console domain-wide-delegation entry.
resource "google_service_account_iam_member" "core_runtime_self_token_creator" {
  service_account_id = google_service_account.core_runtime.name
  role               = "roles/iam.serviceAccountTokenCreator"
  member             = "serviceAccount:${google_service_account.core_runtime.email}"
}

# EVIDENCE_REPLAY_SIGNING_SECRET (+ rotation variant _V1) — created + versioned
# out of band by the owner. Required by the evidence-lineage replay signer,
# which the customer financing intake calls on every submission.
resource "google_secret_manager_secret_iam_member" "runtime_evidence_replay_signing" {
  project   = var.project_id
  secret_id = "EVIDENCE_REPLAY_SIGNING_SECRET"
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.core_runtime.email}"
}

resource "google_secret_manager_secret_iam_member" "runtime_evidence_replay_signing_v1" {
  project   = var.project_id
  secret_id = "EVIDENCE_REPLAY_SIGNING_SECRET_V1"
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.core_runtime.email}"
}

resource "google_secret_manager_secret_iam_member" "runtime_report_signing" {
  project   = var.project_id
  secret_id = google_secret_manager_secret.app["REPORT_SIGNING_SECRET"].secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.core_runtime.email}"
}

# ---- Secret access: migrator SA -> MIGRATOR_DATABASE_URL only ---------------

resource "google_secret_manager_secret_iam_member" "migrator_database_url" {
  project   = var.project_id
  secret_id = google_secret_manager_secret.app["MIGRATOR_DATABASE_URL"].secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.db_migrator.email}"
}

# ---- Optional: Cloud SQL client (only if a connector/proxy path is chosen) --

resource "google_project_iam_member" "runtime_cloudsql_client" {
  count   = var.grant_cloudsql_client ? 1 : 0
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.core_runtime.email}"
}

resource "google_project_iam_member" "migrator_cloudsql_client" {
  count   = var.grant_cloudsql_client ? 1 : 0
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.db_migrator.email}"
}

# STAGING_SEED_SHARED_SECRET is created and versioned out of band. It grants
# one-purpose access to the fixed P4 seed route allowlist; it is not a user login.
resource "google_secret_manager_secret_iam_member" "runtime_staging_seed_secret" {
  count     = var.staging_seed_enabled ? 1 : 0
  project   = var.project_id
  secret_id = "STAGING_SEED_SHARED_SECRET"
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.core_runtime.email}"
}

# ANTHROPIC_API_KEY is created + versioned out of band by the owner (not TF).
# Grant the runtime SA read access only when the AI seams are enabled.
resource "google_secret_manager_secret_iam_member" "runtime_anthropic_api_key" {
  count     = var.anthropic_api_key_enabled ? 1 : 0
  project   = var.project_id
  secret_id = "ANTHROPIC_API_KEY"
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.core_runtime.email}"
}

# DATA_GOV_API_KEY is created + versioned out of band by the owner (not TF).
# Grant the runtime SA read access only when the data.gov lookups are enabled.
resource "google_secret_manager_secret_iam_member" "runtime_data_gov_api_key" {
  count     = var.data_gov_api_key_enabled ? 1 : 0
  project   = var.project_id
  secret_id = "DATA_GOV_API_KEY"
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.core_runtime.email}"
}

# NOAA_CDO_TOKEN is created + versioned out of band by the owner (not TF).
# Grant the runtime SA read access only when the climate lookup is enabled.
resource "google_secret_manager_secret_iam_member" "runtime_noaa_cdo_token" {
  count     = var.noaa_cdo_token_enabled ? 1 : 0
  project   = var.project_id
  secret_id = "NOAA_CDO_TOKEN"
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.core_runtime.email}"
}
