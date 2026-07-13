# =============================================================================
# infra/staging — enable required Google APIs (STAGING-DEPLOY P1)
# Enabling these is necessary but NOT sufficient — Private Services Access still
# needs the peering resources in network.tf.
#
# disable_on_destroy = false: destroying this module must NOT disable APIs that
# other resources/projects may depend on.
# =============================================================================

locals {
  required_services = [
    "run.googleapis.com",             # Cloud Run (service + migrator Job, P2)
    "sqladmin.googleapis.com",        # Cloud SQL Admin
    "secretmanager.googleapis.com",   # Secret Manager
    "iap.googleapis.com",             # Identity-Aware Proxy (P3)
    "artifactregistry.googleapis.com",# Artifact Registry
    "compute.googleapis.com",         # VPC, subnet, addresses
    "vpcaccess.googleapis.com",       # VPC access (connector fallback if needed)
    "servicenetworking.googleapis.com", # Private Services Access peering
  ]
}

resource "google_project_service" "required" {
  for_each = toset(local.required_services)

  project            = var.project_id
  service            = each.value
  disable_on_destroy = false
}
