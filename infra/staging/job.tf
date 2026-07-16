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

# =============================================================================
# infra/staging — runtime privilege verification Job (gate P1.6)
#
# Proves the live authority split from inside the VPC:
#   * runs AS the runtime principal (furlong-core-runtime@)
#   * reuses the migrator image because it contains tsx + src/scripts
#   * reads only the runtime connection secret
#   * executes `verify:runtime-privileges`, which must prove:
#       - runtime can perform governed DML
#       - runtime cannot perform DDL
#       - runtime owns no objects
#   * invoked MANUALLY as a gate, never on service boot
# =============================================================================

resource "google_cloud_run_v2_job" "runtime_verify" {
  count = var.migrator_image == "" ? 0 : 1

  name     = "furlong-runtime-verify"
  project  = var.project_id
  location = var.region
  labels   = var.labels

  deletion_protection = false

  template {
    task_count  = 1
    parallelism = 1

    template {
      service_account = google_service_account.core_runtime.email

      execution_environment = "EXECUTION_ENVIRONMENT_GEN2"

      max_retries = 0
      timeout     = "${var.verify_runtime_job_timeout_seconds}s"

      vpc_access {
        egress = "PRIVATE_RANGES_ONLY"
        network_interfaces {
          network    = google_compute_network.vpc.id
          subnetwork = google_compute_subnetwork.egress.id
        }
      }

      containers {
        image   = var.migrator_image
        command = ["npm"]
        args    = ["run", "verify:runtime-privileges"]

        resources {
          limits = {
            cpu    = "1"
            memory = "1Gi"
          }
        }

        env {
          name = "DATABASE_URL"
          value_source {
            secret_key_ref {
              secret  = google_secret_manager_secret.app["DATABASE_URL"].secret_id
              version = "latest"
            }
          }
        }
      }
    }
  }

  depends_on = [
    google_secret_manager_secret_iam_member.runtime_database_url,
  ]
}

# =============================================================================
# infra/staging — approved-source refresh Job
#
# Keeps the map inventory current without routing Cloud Scheduler through the
# browser-facing service edge. Scheduler calls the Cloud Run Jobs API directly,
# and the job performs the governed refresh inside the VPC as the runtime
# principal with the shared runtime-state bucket mounted.
# =============================================================================

resource "google_cloud_run_v2_job" "source_refresh" {
  count = var.migrator_image == "" || !var.enable_source_refresh_scheduler ? 0 : 1

  name     = "furlong-source-refresh"
  project  = var.project_id
  location = var.region
  labels   = var.labels

  deletion_protection = false

  template {
    task_count  = 1
    parallelism = 1

    template {
      service_account = google_service_account.core_runtime.email

      execution_environment = "EXECUTION_ENVIRONMENT_GEN2"

      max_retries = 0
      timeout     = "${var.source_refresh_job_timeout_seconds}s"

      volumes {
        name = "runtime-state"
        gcs {
          bucket    = google_storage_bucket.runtime_state.name
          read_only = false
        }
      }

      vpc_access {
        egress = "PRIVATE_RANGES_ONLY"
        network_interfaces {
          network    = google_compute_network.vpc.id
          subnetwork = google_compute_subnetwork.egress.id
        }
      }

      containers {
        image   = var.migrator_image
        command = ["npm"]
        args    = ["run", "run:source-refresh"]

        resources {
          limits = {
            cpu    = "1"
            memory = "1Gi"
          }
        }

        env {
          name  = "FURLONG_RUNTIME_STATE_DIR"
          value = "/var/furlong-state"
        }

        volume_mounts {
          name       = "runtime-state"
          mount_path = "/var/furlong-state"
        }
      }
    }
  }

  depends_on = [
    google_storage_bucket_iam_member.runtime_state_core_rw,
  ]
}
