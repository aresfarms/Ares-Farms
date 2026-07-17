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

  # Service-level floor across revisions. Cloud Run persists this separately
  # from the revision template scaling block, so declare it explicitly to keep
  # Terraform state aligned with the API response.
  scaling {
    min_instance_count = 0
  }

  template {
    service_account = google_service_account.core_runtime.email

    volumes {
      name = "runtime-state"
      gcs {
        bucket    = google_storage_bucket.runtime_state.name
        read_only = false
      }
    }

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
      env {
        name = "REPORT_SIGNING_SECRET"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.app["REPORT_SIGNING_SECRET"].secret_id
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

      env {
        name  = "FURLONG_RUNTIME_STATE_DIR"
        value = "/var/furlong-state"
      }

      env {
        name  = "API_AUTH_ENFORCEMENT"
        value = var.api_auth_enforcement
      }

      env {
        name  = "AMENITY_LIVE_LOOKUP_ENABLED"
        value = var.amenity_live_lookup_enabled ? "true" : "false"
      }

      dynamic "env" {
        for_each = var.tester_feedback_email == "" ? [] : [var.tester_feedback_email]
        content {
          name  = "FURLONG_TESTER_FEEDBACK_EMAIL"
          value = env.value
        }
      }

      env {
        name  = "RATE_LIMITING_ENABLED"
        value = var.rate_limiting_enabled ? "true" : "false"
      }

      env {
        name  = "API_RATE_LIMIT_WINDOW_SECONDS"
        value = tostring(var.api_rate_limit_window_seconds)
      }

      env {
        name  = "API_RATE_LIMIT_MAX"
        value = tostring(var.api_rate_limit_max)
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

      volume_mounts {
        name       = "runtime-state"
        mount_path = "/var/furlong-state"
      }
    }
  }

  # Traffic: latest serves 100%; an optional "stable" tag pins a blessed
  # revision on its own URL (0% of default traffic) so testers keep a known
  # build while the owner iterates on latest (P3, founder 2026-07-17).
  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }
  dynamic "traffic" {
    for_each = var.stable_revision == "" ? [] : [var.stable_revision]
    content {
      type     = "TRAFFIC_TARGET_ALLOCATION_TYPE_REVISION"
      revision = traffic.value
      tag      = "stable"
      percent  = 0
    }
  }

  # The first revision resolves secrets at startup — the runtime SA's accessor
  # bindings must exist before the service does.
  depends_on = [
    google_secret_manager_secret_iam_member.runtime_database_url,
    google_secret_manager_secret_iam_member.runtime_nextauth_secret,
    google_secret_manager_secret_iam_member.runtime_report_signing,
    google_storage_bucket_iam_member.runtime_state_core_rw,
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

resource "google_cloud_run_v2_service_iam_member" "iap_invoker" {
  count = var.core_image == "" || !var.enable_iap ? 0 : 1

  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.core[0].name
  role     = "roles/run.invoker"
  member   = "serviceAccount:service-${data.google_project.staging.number}@gcp-sa-iap.iam.gserviceaccount.com"
}

resource "terraform_data" "enable_iap" {
  count = var.core_image == "" || !var.enable_iap ? 0 : 1

  triggers_replace = {
    project = var.project_id
    region  = var.region
    service = google_cloud_run_v2_service.core[0].name
    mode    = "enabled"
  }

  lifecycle {
    replace_triggered_by = [google_cloud_run_v2_service.core]
  }

  provisioner "local-exec" {
    command = "gcloud run services update ${self.triggers_replace.service} --project ${self.triggers_replace.project} --region ${self.triggers_replace.region} --iap --quiet"
  }

  depends_on = [
    google_cloud_run_v2_service.core,
    google_cloud_run_v2_service_iam_member.iap_invoker,
  ]
}

resource "google_iap_web_cloud_run_service_iam_member" "testers" {
  for_each = var.core_image == "" || !var.enable_iap ? toset([]) : toset(var.iap_tester_principals)

  project                = var.project_id
  location               = var.region
  cloud_run_service_name = google_cloud_run_v2_service.core[0].name
  role                   = "roles/iap.httpsResourceAccessor"
  member                 = each.value

  depends_on = [terraform_data.enable_iap]
}

# ---- P2.4 deploy-verify identity (IAP-aware) --------------------------------
# The deploy:verify-manifest gate must reach the app THROUGH IAP to prove
# health. A user credential cannot mint an IAP-audience token, so a dedicated
# least-privilege service account holds roles/iap.httpsResourceAccessor and the
# operator self-signs a short-lived JWT AS it (aud = service URL, direct Cloud
# Run IAP has no OAuth brand). This SA has NO other capability — it can only be
# authenticated-read through IAP.
resource "google_service_account" "verify" {
  count = var.core_image == "" || !var.enable_iap ? 0 : 1

  project      = var.project_id
  account_id   = "furlong-verify"
  display_name = "Furlong P2.4 deploy-verify (IAP-aware, read-through-IAP only)"
}

resource "google_iap_web_cloud_run_service_iam_member" "verify" {
  count = var.core_image == "" || !var.enable_iap ? 0 : 1

  project                = var.project_id
  location               = var.region
  cloud_run_service_name = google_cloud_run_v2_service.core[0].name
  role                   = "roles/iap.httpsResourceAccessor"
  member                 = "serviceAccount:${google_service_account.verify[0].email}"

  depends_on = [terraform_data.enable_iap]
}

# Operator principals may self-sign a JWT AS the verify SA (signJwt) to run the
# gate locally. Scoped to this ONE service account — not project-wide token
# creation.
resource "google_service_account_iam_member" "verify_token_creator" {
  for_each = var.core_image == "" || !var.enable_iap ? toset([]) : toset(var.invoker_principals)

  service_account_id = google_service_account.verify[0].name
  role               = "roles/iam.serviceAccountTokenCreator"
  member             = each.value
}
