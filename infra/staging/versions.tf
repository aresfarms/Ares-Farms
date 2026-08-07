# =============================================================================
# infra/staging — Terraform + provider pins + state backend (STAGING-DEPLOY P1)
# Vol III (Technical Infrastructure): deterministic, reproducible infra so the
# staging bootstrap and the future production baseline extend the SAME code.
#
# Pins are conservative major-version constraints; run `terraform init` to lock
# exact versions into .terraform.lock.hcl (COMMIT that lock file).
#
# STATE: this module uses LOCAL state by default. Local `.tfstate` can contain
# sensitive resolved values, so never commit it (see .gitignore). If more than
# one person will run Terraform, switch to the access-controlled GCS backend
# below: pre-create a bucket (uniform bucket-level access + versioning ON),
# grant ONLY the Terraform operator objectAdmin, then uncomment and
# `terraform init -migrate-state`.
# =============================================================================

terraform {
  required_version = ">= 1.6.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 6.0"
    }
  }

  # backend "gcs" {
  #   bucket = "furlong-staging-tfstate"   # pre-create; versioning ON; UBLA ON
  #   prefix = "staging/bootstrap"
  # }
}
