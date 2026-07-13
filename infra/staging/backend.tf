# =============================================================================
# infra/staging — Terraform state backend (STAGING-DEPLOY P1)
#
# By DEFAULT this module uses LOCAL state (the `.tfstate` file stays on the
# operator's machine). That is acceptable for a single-operator bootstrap, but
# state can contain sensitive resolved values, so:
#   * never commit *.tfstate / *.tfstate.backup (see .gitignore in this dir);
#   * if more than one person will run Terraform, switch to the GCS backend
#     below so state is shared AND access-controlled.
#
# To use a remote, access-controlled GCS backend (spec P1.5 "access-control it
# tightly"): create a bucket with uniform bucket-level access + versioning,
# grant ONLY the Terraform operator identity objectAdmin on it, then uncomment
# and `terraform init -migrate-state`.
#
# terraform {
#   backend "gcs" {
#     bucket = "furlong-staging-tfstate"   # pre-create; versioning ON; UBLA ON
#     prefix = "staging/bootstrap"
#   }
# }
# =============================================================================
