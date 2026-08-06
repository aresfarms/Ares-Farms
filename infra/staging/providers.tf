# =============================================================================
# infra/staging — provider, project data, and API enablement (STAGING-DEPLOY P1)
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

# ---- Required Google APIs ---------------------------------------------------
# Enabling these is necessary but NOT sufficient — Private Services Access still
# needs the peering resources in network.tf. disable_on_destroy = false so a
# destroy of this module never disables APIs other resources depend on.

locals {
  required_services = [
    "run.googleapis.com",                  # Cloud Run (service + migrator Job, P2)
    "cloudscheduler.googleapis.com",       # Cloud Scheduler (source refresh automation)
    "sqladmin.googleapis.com",             # Cloud SQL Admin
    "secretmanager.googleapis.com",        # Secret Manager
    "logging.googleapis.com",              # Cloud Logging (audit + forensics)
    "monitoring.googleapis.com",           # Cloud Monitoring (alerts)
    "iap.googleapis.com",                  # Identity-Aware Proxy (P3)
    "cloudresourcemanager.googleapis.com", # IAP policy inspection / management
    "artifactregistry.googleapis.com",     # Artifact Registry
    "compute.googleapis.com",              # VPC, subnet, addresses
    "storage.googleapis.com",              # Shared runtime state bucket
    "vpcaccess.googleapis.com",            # VPC access (connector fallback if needed)
    "gmail.googleapis.com",                # Workspace-native portal email (free; replaces paid SendGrid)
    "iamcredentials.googleapis.com",       # Keyless signJwt for Gmail domain-wide delegation
    "cloudkms.googleapis.com",             # Cloud KMS (CMEK for the sovereign document vault)
    "servicenetworking.googleapis.com",    # Private Services Access peering
    "cloudbuild.googleapis.com",           # P2.1 image build (owner has no local Docker)
    "billingbudgets.googleapis.com",       # Existing monthly billing alert inspection/maintenance
  ]
}

resource "google_project_service" "required" {
  for_each = toset(local.required_services)

  project            = var.project_id
  service            = each.value
  disable_on_destroy = false
}
