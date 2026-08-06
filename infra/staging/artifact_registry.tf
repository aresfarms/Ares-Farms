# =============================================================================
# infra/staging — Artifact Registry (STAGING-DEPLOY P1)
# Docker repository that holds the furlong-core image. The image is built +
# pushed in P2.1 and pinned by DIGEST (not tag) in the Cloud Run resources.
# =============================================================================

resource "google_artifact_registry_repository" "docker" {
  project       = var.project_id
  location      = var.region
  repository_id = var.artifact_repo_id
  format        = "DOCKER"
  description   = "Furlong staging container images (furlong-core)."
  labels        = var.labels

  # Observe cleanup matches before permitting deletion. This is intentionally
  # left in dry-run mode until the retained versions have been audited.
  cleanup_policy_dry_run = true

  cleanup_policies {
    id     = "delete-untagged-after-30-days"
    action = "DELETE"

    condition {
      tag_state  = "UNTAGGED"
      older_than = "2592000s"
    }
  }

  cleanup_policies {
    id     = "keep-latest-ten"
    action = "KEEP"

    most_recent_versions {
      keep_count = 10
    }
  }

  depends_on = [google_project_service.required]
}
