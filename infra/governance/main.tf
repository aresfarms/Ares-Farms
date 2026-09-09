locals {
  keyring_name  = "furlong-infra-governance"
  state_bucket  = "${var.project_id}-tfstate"
  source_bucket = "${var.project_id}-iac-source"
  plan_bucket   = "${var.project_id}-iac-plans"
  labels = {
    system     = "furlong"
    managed_by = "terraform"
    authority  = "infra-governance"
  }
}

resource "google_kms_key_ring" "infra" {
  project  = var.project_id
  name     = local.keyring_name
  location = var.region
}

resource "google_kms_crypto_key" "state" {
  name            = "terraform-state"
  key_ring        = google_kms_key_ring.infra.id
  rotation_period = "7776000s"
  lifecycle { prevent_destroy = true }
}
resource "google_kms_crypto_key" "source" {
  name            = "iac-source"
  key_ring        = google_kms_key_ring.infra.id
  rotation_period = "7776000s"
  lifecycle { prevent_destroy = true }
}
resource "google_kms_crypto_key" "plans" {
  name            = "iac-plan-artifacts"
  key_ring        = google_kms_key_ring.infra.id
  rotation_period = "7776000s"
  lifecycle { prevent_destroy = true }
}

resource "google_kms_crypto_key_iam_member" "gcs_state" {
  crypto_key_id = google_kms_crypto_key.state.id
  role          = "roles/cloudkms.cryptoKeyEncrypterDecrypter"
  member        = "serviceAccount:${data.google_storage_project_service_account.gcs.email_address}"
}
resource "google_kms_crypto_key_iam_member" "gcs_source" {
  crypto_key_id = google_kms_crypto_key.source.id
  role          = "roles/cloudkms.cryptoKeyEncrypterDecrypter"
  member        = "serviceAccount:${data.google_storage_project_service_account.gcs.email_address}"
}
resource "google_kms_crypto_key_iam_member" "gcs_plans" {
  crypto_key_id = google_kms_crypto_key.plans.id
  role          = "roles/cloudkms.cryptoKeyEncrypterDecrypter"
  member        = "serviceAccount:${data.google_storage_project_service_account.gcs.email_address}"
}

resource "google_storage_bucket" "state" {
  name                        = local.state_bucket
  project                     = var.project_id
  location                    = var.region
  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"
  force_destroy               = false
  labels                      = local.labels
  versioning { enabled = true }
  encryption { default_kms_key_name = google_kms_crypto_key.state.id }
  lifecycle { prevent_destroy = true }
  depends_on = [google_kms_crypto_key_iam_member.gcs_state]
}

resource "google_storage_bucket" "source" {
  name                        = local.source_bucket
  project                     = var.project_id
  location                    = var.region
  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"
  force_destroy               = false
  labels                      = local.labels
  versioning { enabled = true }
  encryption { default_kms_key_name = google_kms_crypto_key.source.id }
  lifecycle { prevent_destroy = true }
  depends_on = [google_kms_crypto_key_iam_member.gcs_source]
}
resource "google_storage_bucket" "plans" {
  name                        = local.plan_bucket
  project                     = var.project_id
  location                    = var.region
  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"
  force_destroy               = false
  labels                      = local.labels
  versioning { enabled = true }
  encryption { default_kms_key_name = google_kms_crypto_key.plans.id }
  lifecycle { prevent_destroy = true }
  depends_on = [google_kms_crypto_key_iam_member.gcs_plans]
}

resource "google_service_account" "plan" {
  project      = var.project_id
  account_id   = "furlong-infra-plan"
  display_name = "Furlong infrastructure plan authority"
  description  = "Read-only infrastructure planning identity. Cannot apply or approve plans."
}

resource "google_service_account" "apply" {
  project      = var.project_id
  account_id   = "furlong-infra-apply"
  display_name = "Furlong infrastructure apply authority"
  description  = "Infrastructure apply identity. Requires a separately authored human approval artifact."
}
resource "google_storage_bucket_iam_member" "plan_state_read" {
  bucket = google_storage_bucket.state.name
  role   = "roles/storage.objectViewer"
  member = "serviceAccount:${google_service_account.plan.email}"
}
resource "google_storage_bucket_iam_member" "plan_source_read" {
  bucket = google_storage_bucket.source.name
  role   = "roles/storage.objectViewer"
  member = "serviceAccount:${google_service_account.plan.email}"
}
resource "google_storage_bucket_iam_member" "plan_artifact_create" {
  bucket = google_storage_bucket.plans.name
  role   = "roles/storage.objectCreator"
  member = "serviceAccount:${google_service_account.plan.email}"
  condition {
    title       = "plan_artifacts_only"
    description = "Plan identity may write only immutable plan artifacts; never approvals."
    expression  = "resource.name.startsWith('projects/_/buckets/${local.plan_bucket}/objects/plans/')"
  }
}
resource "google_storage_bucket_iam_member" "apply_state_admin" {
  bucket = google_storage_bucket.state.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.apply.email}"
}
resource "google_storage_bucket_iam_member" "apply_source_read" {
  bucket = google_storage_bucket.source.name
  role   = "roles/storage.objectViewer"
  member = "serviceAccount:${google_service_account.apply.email}"
}
resource "google_storage_bucket_iam_member" "apply_plan_read" {
  bucket = google_storage_bucket.plans.name
  role   = "roles/storage.objectViewer"
  member = "serviceAccount:${google_service_account.apply.email}"
}
resource "google_storage_bucket_iam_member" "apply_live_create" {
  bucket = google_storage_bucket.plans.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.apply.email}"
  condition {
    title       = "apply_live_evidence_only"
    description = "Apply authority may write/update live verification evidence; approval remains a Cloud Build control-plane action."
    expression  = "resource.name.startsWith('projects/_/buckets/${local.plan_bucket}/objects/live/')"
  }
}
resource "google_storage_bucket_iam_member" "operator_plan_read" {
  bucket = google_storage_bucket.plans.name
  role   = "roles/storage.objectViewer"
  member = var.operator_principal
}

resource "google_storage_bucket_iam_member" "operator_approval_create" {
  bucket = google_storage_bucket.plans.name
  role   = "roles/storage.objectCreator"
  member = var.operator_principal
  condition {
    title       = "human_approvals_only"
    description = "The named human infrastructure governor may create immutable approval artifacts only."
    expression  = "resource.name.startsWith('projects/_/buckets/${local.plan_bucket}/objects/approvals/')"
  }
}


locals {
  plan_project_roles = toset([
    "roles/viewer",
    "roles/iam.securityReviewer",
    "roles/logging.logWriter",
  ])
  apply_project_roles = toset([
    "roles/editor",
    "roles/resourcemanager.projectIamAdmin",
    "roles/iam.serviceAccountAdmin",
    "roles/iam.serviceAccountUser",
    "roles/iap.admin",
    "roles/cloudkms.admin",
    "roles/storage.admin",
    "roles/serviceusage.serviceUsageAdmin",
    "roles/binaryauthorization.policyAdmin",
    "roles/logging.logWriter",
  ])
}

resource "google_project_iam_member" "plan_roles" {
  for_each = local.plan_project_roles
  project  = var.project_id
  role     = each.value
  member   = "serviceAccount:${google_service_account.plan.email}"
}
resource "google_project_iam_member" "apply_roles" {
  for_each = local.apply_project_roles
  project  = var.project_id
  role     = each.value
  member   = "serviceAccount:${google_service_account.apply.email}"
}

resource "google_service_account_iam_member" "apply_can_act_as_plan" {
  service_account_id = google_service_account.plan.name
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${google_service_account.apply.email}"
}

resource "google_storage_bucket_iam_member" "app_build_live_manifest_read" {
  bucket = google_storage_bucket.plans.name
  role   = "roles/storage.objectViewer"
  member = "serviceAccount:furlong-build@${var.project_id}.iam.gserviceaccount.com"
}
# The plan identity must be able to read the asymmetric release-attestor
# public key so Terraform can evaluate Binary Authorization configuration.
# Keep this key-scoped; planning authority does not receive signing rights.
resource "google_kms_crypto_key_iam_member" "plan_release_attestor_public_key" {
  crypto_key_id = "projects/${var.project_id}/locations/${var.region}/keyRings/furlong-security/cryptoKeys/furlong-release-attestor"
  role          = "roles/cloudkms.publicKeyViewer"
  member        = "serviceAccount:${google_service_account.plan.email}"
}

# The apply identity performs a post-apply drift plan in the governed pipeline.
# That verification refreshes the same Binary Authorization public-key data
# source, so it needs the same key-scoped read permission (never signer rights).
resource "google_kms_crypto_key_iam_member" "apply_release_attestor_public_key" {
  crypto_key_id = "projects/${var.project_id}/locations/${var.region}/keyRings/furlong-security/cryptoKeys/furlong-release-attestor"
  role          = "roles/cloudkms.publicKeyViewer"
  member        = "serviceAccount:${google_service_account.apply.email}"
}
