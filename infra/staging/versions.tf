# =============================================================================
# infra/staging — Terraform + provider version pins (STAGING-DEPLOY P1)
# Vol III (Technical Infrastructure): deterministic, reproducible infra so the
# staging bootstrap and the future production baseline extend the SAME code.
#
# Pins are conservative major-version constraints; run `terraform init` to lock
# exact versions into .terraform.lock.hcl (COMMIT that lock file).
# =============================================================================

terraform {
  required_version = ">= 1.6.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 6.0"
    }
  }
}
