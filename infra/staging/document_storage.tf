# =============================================================================
# Sovereign document storage (founder direction 2026-08-05): borrower
# financial/PII documents travel encrypted into an IAM-PRIVATE bucket via
# browser-direct resumable uploads — never through email, never through the
# application server's runtime.
#
# Security posture:
# - Uniform bucket-level access, public access prevention ENFORCED.
# - Only the runtime service account can read/write objects; humans reach
#   documents solely through the governed lender workspace, never the bucket.
# - Google-managed encryption at rest (CMEK is a production upgrade path).
# - Versioning ON: accidental overwrite/delete is recoverable (chain of
#   custody); lifecycle keeps noncurrent versions 30 days.
# - CORS allows the browser PUT from the service origin only.
# =============================================================================

# CMEK (founder 2026-08-05: sovereign standard, pennies cost): the vault's
# objects are encrypted under OUR key. Key access is itself audit-logged and
# revocable; destroying the key crypto-shreds the vault — the kill switch.
resource "google_kms_key_ring" "vault" {
  count      = var.core_image == "" ? 0 : 1
  name       = "furlong-vault"
  location   = var.region
  project    = var.project_id
  depends_on = [google_project_service.required]
}

resource "google_kms_crypto_key" "borrower_documents" {
  count           = var.core_image == "" ? 0 : 1
  name            = "borrower-documents"
  key_ring        = google_kms_key_ring.vault[0].id
  rotation_period = "7776000s" # 90 days — sovereign hygiene without ceremony

  lifecycle {
    prevent_destroy = true # destroying the key destroys ALL vault data — founder ceremony only
  }
}

data "google_storage_project_service_account" "gcs" {
  project = var.project_id
}

resource "google_kms_crypto_key_iam_member" "gcs_uses_vault_key" {
  count         = var.core_image == "" ? 0 : 1
  crypto_key_id = google_kms_crypto_key.borrower_documents[0].id
  role          = "roles/cloudkms.cryptoKeyEncrypterDecrypter"
  member        = "serviceAccount:${data.google_storage_project_service_account.gcs.email_address}"
}

resource "google_storage_bucket" "documents" {
  count      = var.core_image == "" ? 0 : 1
  name       = "${var.project_id}-borrower-documents"
  depends_on = [google_kms_crypto_key_iam_member.gcs_uses_vault_key]
  location   = var.region
  project    = var.project_id

  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"

  versioning {
    enabled = true
  }

  encryption {
    default_kms_key_name = google_kms_crypto_key.borrower_documents[0].id
  }

  lifecycle_rule {
    action {
      type = "Delete"
    }
    condition {
      num_newer_versions         = 3
      days_since_noncurrent_time = 30
      with_state                 = "ARCHIVED"
    }
  }

  cors {
    # Cloud Run serves the same service on TWO url formats — the legacy
    # revision-hash form (nextauth_url) and the deterministic project-number
    # form. Browsers upload from whichever the tester is on; allow both
    # (founder staging test 2026-08-05: "Failed to fetch" = CORS-blocked PUT).
    origin = distinct(compact([
      var.nextauth_url,
      "https://furlong-core-${data.google_project.staging.number}.${var.region}.run.app",
      try(google_cloud_run_v2_service.core[0].uri, ""),
      "http://localhost:3000",
    ]))
    method          = ["PUT", "OPTIONS"]
    response_header = ["Content-Type"]
    max_age_seconds = 3600
  }

  labels = {
    classification = "confidential"
    purpose        = "borrower-document-custody"
  }
}

# Runtime SA can create new document generations and read them for governed
# workspaces, but cannot alter object IAM, retention, or policy metadata.
resource "google_storage_bucket_iam_member" "runtime_documents" {
  count  = var.core_image == "" ? 0 : 1
  bucket = google_storage_bucket.documents[0].name
  role   = "roles/storage.objectViewer"
  member = "serviceAccount:${google_service_account.core_runtime.email}"
}

resource "google_storage_bucket_iam_member" "runtime_documents_creator" {
  count  = var.core_image == "" ? 0 : 1
  bucket = google_storage_bucket.documents[0].name
  role   = "roles/storage.objectCreator"
  member = "serviceAccount:${google_service_account.core_runtime.email}"
}

# Data Access audit logs for Cloud Storage (SCIF posture, founder 2026-08-05):
# every object read and write in this project's buckets is logged immutably —
# an intrusion cannot touch a document without leaving a fingerprint.
resource "google_project_iam_audit_config" "storage_data_access" {
  project = var.project_id
  service = "storage.googleapis.com"

  audit_log_config {
    log_type = "DATA_READ"
  }
  audit_log_config {
    log_type = "DATA_WRITE"
  }
}
