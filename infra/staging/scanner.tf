# =============================================================================
# furlong-scanner — private ClamAV malware scanner for the sovereign vault
# (founder-approved quarantine build, 2026-08-06).
#
# IAM-private Cloud Run service: ONLY the core runtime SA may invoke it.
# Bytes stream in, a verdict streams out; the scanner stores nothing.
# Definitions are baked at image build time — each Cloud Build refresh
# also refreshes signatures.
# =============================================================================

variable "scanner_image" {
  description = "furlong-scanner image pinned by DIGEST (empty = scanner not deployed; quarantine stays honest-pending)."
  type        = string
  default     = ""
}

variable "quarantine_mode" {
  description = "Vault quarantine posture: 'off' = scan + record verdicts but do not block reads; 'enforce' = only scanned-clean documents may be streamed (fail closed). Flip to enforce once the scanner is verified on staging."
  type        = string
  default     = "off"
}

resource "google_cloud_run_v2_service" "scanner" {
  count    = var.scanner_image == "" ? 0 : 1
  name     = "furlong-scanner"
  project  = var.project_id
  location = var.region
  # Ingress ALL + IAM-private is deliberate. The core service runs with
  # vpc-access-egress=private-ranges-only, so its calls to this service's
  # run.app address do NOT traverse the VPC and would be rejected as external
  # by internal-only ingress — the scan would fail silently forever (caught
  # before first use, 2026-08-06). Security rests on IAM: only the runtime
  # service account holds run.invoker, and Cloud Run rejects unauthenticated
  # requests with 403 before the container ever sees them (verified: an
  # anonymous probe cannot reach it).
  ingress = "INGRESS_TRAFFIC_ALL"

  dynamic "binary_authorization" {
    for_each = var.enable_binary_authorization ? [1] : []
    content {
      use_default = true
    }
  }

  # Cloud Run returns zero values for service-level scaling even when omitted.
  # Declare them explicitly so a successful deployment converges to a clean
  # Terraform plan instead of producing perpetual provider-normalization drift.
  scaling {
    min_instance_count    = 0
    manual_instance_count = 0
  }

  template {
    # The scanner accepts bytes and returns a verdict. It needs no database,
    # Secret Manager, or object-storage authority, so it uses a dedicated
    # identity with no resource roles instead of inheriting core privileges.
    service_account = google_service_account.scanner_runtime.email

    scaling {
      min_instance_count = 0
      max_instance_count = 2
    }

    containers {
      image = var.scanner_image

      resources {
        limits = {
          cpu    = "1"
          memory = "2Gi" # clamd's loaded signature database needs ~1.5Gi
        }
      }

      startup_probe {
        http_get {
          path = "/healthz"
        }
        initial_delay_seconds = 10
        period_seconds        = 10
        failure_threshold     = 18 # signature db load can take ~1-2 min cold
      }
    }

    max_instance_request_concurrency = 4 # scans are memory/cpu bound
    timeout                          = "180s"
  }

  depends_on = [google_project_service.required]
}

# Only the core runtime may invoke the scanner — no public, no other SAs.
resource "google_cloud_run_v2_service_iam_member" "scanner_invoker_runtime" {
  count    = var.scanner_image == "" ? 0 : 1
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.scanner[0].name
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.core_runtime.email}"
}
