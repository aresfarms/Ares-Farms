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

# ---- Secret access: runtime SA -> DATABASE_URL + NEXTAUTH_SECRET ------------

resource "google_secret_manager_secret_iam_member" "runtime_database_url" {
  project   = var.project_id
  secret_id = google_secret_manager_secret.app["DATABASE_URL"].secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.core_runtime.email}"
}

resource "google_secret_manager_secret_iam_member" "runtime_nextauth_secret" {
  project   = var.project_id
  secret_id = google_secret_manager_secret.app["NEXTAUTH_SECRET"].secret_id
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
