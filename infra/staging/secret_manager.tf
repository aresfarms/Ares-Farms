# =============================================================================
# infra/staging — Secret Manager RESOURCES ONLY (STAGING-DEPLOY P1)
#
# Terraform declares the secret CONTAINERS (names + replication). It does NOT
# create secret VERSIONS — the owner (Caitlin) places the values between Stage 1
# and Stage 2 (spec authority map). Terraform never sees a DB password.
#
# Values the owner adds later, as versions:
#   DATABASE_URL           -> furlong_runtime connection string (runtime SA reads)
#   MIGRATOR_DATABASE_URL  -> furlong_migrator connection string (migrator SA reads)
#   NEXTAUTH_SECRET        -> strong random >=32 chars (runtime SA reads)
#   REPORT_SIGNING_SECRET  -> strong random >=32 chars (runtime SA reads; signs
#                             the short-lived report-export attestations)
# Optional owner-operated ingestion credentials (NASS, EIA, FCC, MARS,
# Smithsonian, licensed listing sources) are created and versioned out of band.
# They are governed by config/security/external-secret-inventory.json and are
# never passed through Terraform state. Stripe/GSA/etc. stay unset/dormant.
# =============================================================================

locals {
  # Secret container names only. NO values.
  secret_names = [
    "DATABASE_URL",
    "MIGRATOR_DATABASE_URL",
    "NEXTAUTH_SECRET",
    "REPORT_SIGNING_SECRET",
  ]
}

resource "google_secret_manager_secret" "app" {
  for_each = toset(local.secret_names)

  project   = var.project_id
  secret_id = each.value
  labels    = var.labels

  replication {
    auto {}
  }

  depends_on = [google_project_service.required]
}
