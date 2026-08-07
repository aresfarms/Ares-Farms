# Dedicated public ingress for Stripe webhooks only.
# The main furlong-core service remains IAM-private + IAP protected.
resource "google_service_account" "stripe_webhook_runtime" {
  count        = var.stripe_webhook_enabled ? 1 : 0
  project      = var.project_id
  account_id   = "furlong-stripe-webhook"
  display_name = "Furlong Stripe webhook ingress"
  description  = "Least-privilege runtime for signed Stripe webhook ingestion."
  depends_on   = [google_project_service.required]
}

resource "google_secret_manager_secret_iam_member" "stripe_webhook_database" {
  count     = var.stripe_webhook_enabled ? 1 : 0
  project   = var.project_id
  secret_id = google_secret_manager_secret.app["DATABASE_URL"].secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.stripe_webhook_runtime[0].email}"
}

resource "google_secret_manager_secret_iam_member" "stripe_webhook_signing_secret" {
  count     = var.stripe_webhook_enabled ? 1 : 0
  project   = var.project_id
  secret_id = "STRIPE_WEBHOOK_SECRET"
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.stripe_webhook_runtime[0].email}"
}

resource "google_cloud_run_v2_service" "stripe_webhook" {
  count               = var.stripe_webhook_enabled && var.core_image != "" ? 1 : 0
  name                = "furlong-stripe-webhook"
  project             = var.project_id
  location            = var.region
  labels              = var.labels
  deletion_protection = false
  ingress             = "INGRESS_TRAFFIC_ALL"

  template {
    service_account       = google_service_account.stripe_webhook_runtime[0].email
    execution_environment = "EXECUTION_ENVIRONMENT_GEN2"

    scaling {
      min_instance_count = 0
      max_instance_count = 2
    }

    vpc_access {
      egress = "PRIVATE_RANGES_ONLY"
      network_interfaces {
        network    = google_compute_network.vpc.id
        subnetwork = google_compute_subnetwork.egress.id
      }
    }

    containers {
      image = var.core_image

      ports {
        container_port = 8080
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "1Gi"
        }
        cpu_idle          = true
        startup_cpu_boost = true
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

      env {
        name = "STRIPE_WEBHOOK_SECRET"
        value_source {
          secret_key_ref {
            secret  = "STRIPE_WEBHOOK_SECRET"
            version = "latest"
          }
        }
      }

      env {
        name  = "STRIPE_WEBHOOK_INGRESS_ONLY"
        value = "true"
      }

      env {
        name  = "API_RATE_LIMIT_WINDOW_SECONDS"
        value = tostring(var.api_rate_limit_window_seconds)
      }

      env {
        name  = "API_RATE_LIMIT_MAX"
        value = tostring(var.api_rate_limit_max)
      }

      startup_probe {
        tcp_socket { port = 8080 }
        period_seconds    = 10
        timeout_seconds   = 3
        failure_threshold = 24
      }
      liveness_probe {
        tcp_socket { port = 8080 }
        period_seconds    = 30
        timeout_seconds   = 3
        failure_threshold = 3
      }
    }
  }

  depends_on = [
    google_secret_manager_secret_iam_member.stripe_webhook_database,
    google_secret_manager_secret_iam_member.stripe_webhook_signing_secret,
  ]
}

resource "google_cloud_run_v2_service_iam_member" "stripe_webhook_public" {
  count    = var.stripe_webhook_enabled && var.core_image != "" ? 1 : 0
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.stripe_webhook[0].name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

output "stripe_webhook_url" {
  description = "Public Stripe-only webhook ingress URL. All non-webhook paths return 404."
  value       = try(google_cloud_run_v2_service.stripe_webhook[0].uri, null)
}
