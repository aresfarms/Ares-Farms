# =============================================================================
# infra/staging — furlong-core Cloud Run service (STAGING-DEPLOY P2.3)
#
# Access posture — IAM-PRIVATE (precise, per spec):
#   * ingress stays "all" so authenticated P2 verification can use the default
#     run.app URL (do NOT set internal for this milestone — it would block the
#     owner's browser verification; P3 adds direct IAP on the service).
#   * The Cloud Run invoker IAM check stays ENABLED; NEITHER allUsers NOR
#     allAuthenticatedUsers is ever bound (variable validation enforces this).
#     Only var.invoker_principals (owner / deploy verifier) can invoke.
#   Reachable at the network edge, NOT anonymously invokable.
#
# Created ONLY when var.core_image is set (digest-pinned) — a Stage-1 apply
# with no image produces no Cloud Run resources.
# =============================================================================

resource "google_cloud_run_v2_service" "core" {
  count = var.core_image == "" ? 0 : 1

  name     = "furlong-core"
  project  = var.project_id
  location = var.region
  labels   = var.labels

  # Recreatable from Terraform in minutes; protection here would only block
  # deliberate teardown. The DATABASE carries deletion protection instead.
  deletion_protection = false

  # Network-reachable; the invoker IAM check is the lock (see header).
  ingress = "INGRESS_TRAFFIC_ALL"

  template {
    service_account = google_service_account.core_runtime.email

    # 2nd-generation execution environment — recommended for Direct VPC egress;
    # scales networking to zero with the workload (spec Rev 3 hardening).
    execution_environment = "EXECUTION_ENVIRONMENT_GEN2"

    scaling {
      min_instance_count = 0
      max_instance_count = var.core_max_instances
    }

    # Direct VPC egress on the designated subnet (no Serverless VPC connector).
    # PRIVATE_RANGES_ONLY: only RFC-1918 traffic (the private-IP Cloud SQL)
    # routes through the VPC; other egress goes direct.
    vpc_access {
      egress = "PRIVATE_RANGES_ONLY"
      network_interfaces {
        network    = google_compute_network.vpc.id
        subnetwork = google_compute_subnetwork.egress.id
      }
    }

    containers {
      # Pinned by DIGEST, never a tag (validated in variables.tf).
      image = var.core_image

      ports {
        container_port = 8080
      }

      resources {
        limits = {
          cpu    = var.core_cpu
          memory = var.core_memory
        }
        cpu_idle = true
      }

      # ---- Secrets by REFERENCE (no plaintext env, no baked secrets) --------
      env {
        name = "DATABASE_URL"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.app["DATABASE_URL"].secret_id
            version = "latest"
          }
        }
      }
      env {
        name = "NEXTAUTH_SECRET"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.app["NEXTAUTH_SECRET"].secret_id
            version = "latest"
          }
        }
      }

      # Non-secret revision forcer: incrementing var.secret_revision_epoch
      # after a rotation mints a new revision so `latest` is re-resolved.
      env {
        name  = "SECRET_REVISION_EPOCH"
        value = tostring(var.secret_revision_epoch)
      }

      dynamic "env" {
        for_each = var.nextauth_url == "" ? [] : [var.nextauth_url]
        content {
          name  = "NEXTAUTH_URL"
          value = env.value
        }
      }

      # ---- Health (spec P2.3: three distinct concepts) ----------------------
      # Startup probe: Node process initialized (NO DB).
      startup_probe {
        http_get {
          path = "/health/live"
          port = 8080
        }
        initial_delay_seconds = 3
        period_seconds        = 5
        timeout_seconds       = 3
        failure_threshold     = 10
      }

      # Liveness: process answers HTTP (NO DB) — DB blips must not recycle
      # containers. /health/ready (bounded DB check) is the P2.4 verification
      # and diagnostic signal; Cloud Run has no readiness probe concept, so it
      # is deliberately NOT wired here.
      liveness_probe {
        http_get {
          path = "/health/live"
          port = 8080
        }
        period_seconds    = 30
        timeout_seconds   = 3
        failure_threshold = 3
      }
    }
  }

  # The first revision resolves secrets at startup — the runtime SA's accessor
  # bindings must exist before the service does.
  depends_on = [
    google_secret_manager_secret_iam_member.runtime_database_url,
    google_secret_manager_secret_iam_member.runtime_nextauth_secret,
  ]
}

# ---- Invoker IAM: explicit principals ONLY (never allUsers) ------------------
resource "google_cloud_run_v2_service_iam_member" "invokers" {
  for_each = var.core_image == "" ? toset([]) : toset(var.invoker_principals)

  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.core[0].name
  role     = "roles/run.invoker"
  member   = each.value
}
