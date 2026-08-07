# =============================================================================
# infra/staging — shared runtime state bucket + scheduler (property refresh)
#
# Purpose:
#   - Persist source activation state + refreshed property-live overlays outside
#     ephemeral Cloud Run instance storage.
#   - Let Cloud Scheduler invoke the IAM-private core service's internal refresh
#     route so approved sources can refresh automatically without weekly manual
#     intervention.
# =============================================================================

resource "google_storage_bucket" "runtime_state" {
  name                        = "${var.project_id}-runtime-state"
  project                     = var.project_id
  location                    = var.region
  labels                      = var.labels
  uniform_bucket_level_access = true
  force_destroy               = false

  public_access_prevention = "enforced"
}

resource "google_service_account" "source_refresh_scheduler" {
  project      = var.project_id
  account_id   = "furlong-source-refresh"
  display_name = "Furlong source refresh scheduler"
  description  = "Invokes the private source-refresh route on the Cloud Run service."

  depends_on = [google_project_service.required]
}

resource "google_storage_bucket_iam_member" "runtime_state_core_rw" {
  bucket = google_storage_bucket.runtime_state.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.core_runtime.email}"
}

resource "google_cloud_run_v2_job_iam_member" "scheduler_source_refresh_executor" {
  count = var.migrator_image == "" || !var.enable_source_refresh_scheduler ? 0 : 1

  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_job.source_refresh[0].name
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.source_refresh_scheduler.email}"
}

resource "google_cloud_scheduler_job" "source_refresh" {
  count = var.migrator_image == "" || !var.enable_source_refresh_scheduler ? 0 : 1

  project     = var.project_id
  region      = var.region
  name        = "furlong-source-refresh"
  description = "Refreshes approved property sources and shared map inventory."
  schedule    = var.source_refresh_schedule
  time_zone   = var.source_refresh_time_zone

  http_target {
    http_method = "POST"
    uri         = "https://run.googleapis.com/v2/projects/${var.project_id}/locations/${var.region}/jobs/${google_cloud_run_v2_job.source_refresh[0].name}:run"

    body = base64encode("{}")

    headers = {
      "Content-Type" = "application/json"
    }

    oauth_token {
      service_account_email = google_service_account.source_refresh_scheduler.email
    }
  }

  depends_on = [
    google_cloud_run_v2_job_iam_member.scheduler_source_refresh_executor,
  ]
}
