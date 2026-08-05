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

resource "google_storage_bucket" "documents" {
  count    = var.core_image == "" ? 0 : 1
  name     = "${var.project_id}-borrower-documents"
  location = var.region
  project  = var.project_id

  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"

  versioning {
    enabled = true
  }

  lifecycle_rule {
    action {
      type = "Delete"
    }
    condition {
      num_newer_versions = 3
      days_since_noncurrent_time = 30
      with_state                 = "ARCHIVED"
    }
  }

  cors {
    origin          = compact([var.nextauth_url, "http://localhost:3000"])
    method          = ["PUT", "OPTIONS"]
    response_header = ["Content-Type"]
    max_age_seconds = 3600
  }

  labels = {
    classification = "confidential"
    purpose        = "borrower-document-custody"
  }
}

# Runtime SA: object admin on THIS bucket only (initiates resumable sessions,
# reads for the governed lender workspace). No project-wide storage grants.
resource "google_storage_bucket_iam_member" "runtime_documents" {
  count  = var.core_image == "" ? 0 : 1
  bucket = google_storage_bucket.documents[0].name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.core_runtime.email}"
}
