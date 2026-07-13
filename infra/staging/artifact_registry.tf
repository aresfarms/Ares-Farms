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

  depends_on = [google_project_service.required]
}
