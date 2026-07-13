# =============================================================================
# infra/staging — provider + project data (STAGING-DEPLOY P1)
#
# The provider authenticates with the OPERATOR's own credentials
# (`gcloud auth application-default login`) — NO long-lived service-account key
# (spec P1.5 / owner-only-secrets rule). The project must already exist; this
# module CONFIRMS and USES furlong-staging, it does not create it.
# =============================================================================

provider "google" {
  project = var.project_id
  region  = var.region
}

# Confirms the project exists and surfaces its number/billing in outputs so the
# operator can verify org placement + billing linkage (spec P1.5) before apply.
data "google_project" "staging" {
  project_id = var.project_id
}
