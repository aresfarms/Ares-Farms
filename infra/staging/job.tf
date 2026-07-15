# =============================================================================
# infra/staging — furlong-db-migrate Cloud Run Job (STAGING-DEPLOY P2.2)
#
# The ONLY path that applies schema to the staging database:
#   * runs as furlong-db-migrator@ reading MIGRATOR_DATABASE_URL only;
#   * image = the Dockerfile `migrator` target, whose CMD is the STRICT
#     `migrate:schema` (refuses to run without MIGRATOR_DATABASE_URL, applies
#     the canonical schema + runtime grants + default privileges, exits
#     non-zero on any failure);
#   * invoked MANUALLY (gcloud run jobs execute) — never auto-run on core boot;
#   * no retries (migrations are idempotent, but a failure should surface to a
#     human, not silently re-run); one task, no parallelism; bounded timeout.
#
# Created ONLY when var.migrator_image is set (digest-pinned).
# =============================================================================

resource "google_cloud_run_v2_job" "db_migrate" {
  count = var.migrator_image == "" ? 0 : 1

  name     = "furlong-db-migrate"
  project  = var.project_id
  location = var.region
  labels   = var.labels

  deletion_protection = false

  template {
    task_count  = 1
    parallelism = 1

    template {
      service_account = google_service_account.db_migrator.email

      # 2nd-gen execution environment + its own Direct VPC egress on the
      # designated subnet (spec Rev 3: the Job gets its own VPC config).
      execution_environment = "EXECUTION_ENVIRONMENT_GEN2"

      max_retries = 0
      timeout     = "${var.migrate_job_timeout_seconds}s"

      vpc_access {
        egress = "PRIVATE_RANGES_ONLY"
        network_interfaces {
          network    = google_compute_network.vpc.id
          subnetwork = google_compute_subnetwork.egress.id
        }
      }

      containers {
        image = var.migrator_image

        resources {
          limits = {
            cpu    = "1"
            memory = "1Gi"
          }
        }

        # The migrator principal's connection string — the ONLY secret this
        # job can read (per-secret IAM in iam.tf).
        env {
          name = "MIGRATOR_DATABASE_URL"
          value_source {
            secret_key_ref {
              secret  = google_secret_manager_secret.app["MIGRATOR_DATABASE_URL"].secret_id
              version = "latest"
            }
          }
        }
      }
    }
  }

  depends_on = [
    google_secret_manager_secret_iam_member.migrator_database_url,
  ]
}
