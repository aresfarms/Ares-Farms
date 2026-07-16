# =============================================================================
# infra/staging — security observability, forensic exports, and baseline alerts
#
# Purpose:
#   - turn on Data Access audit logs for the sensitive control plane surfaces
#   - create retained export destinations + sinks for forensic evidence classes
#   - add a minimum viable alert set for intrusion / abuse / failure signals
# =============================================================================

locals {
  expected_secret_reader_principals = concat(
    [
      google_service_account.core_runtime.email,
      google_service_account.db_migrator.email,
    ],
    var.expected_secret_reader_emails
  )

  unexpected_secret_access_filter = join(
    " AND ",
    concat(
      [
        "protoPayload.serviceName=\"secretmanager.googleapis.com\"",
        "protoPayload.methodName=\"google.cloud.secretmanager.v1.SecretManagerService.AccessSecretVersion\"",
      ],
      [
        for email in local.expected_secret_reader_principals :
        format("protoPayload.authenticationInfo.principalEmail!=\"%s\"", email)
      ]
    )
  )

  edge_403_filter = join(
    " AND ",
    [
      "resource.type=\"cloud_run_revision\"",
      format("resource.labels.service_name=\"%s\"", google_cloud_run_v2_service.core[0].name),
      "httpRequest.status=403",
    ]
  )

  app_5xx_filter = join(
    " AND ",
    [
      "resource.type=\"cloud_run_revision\"",
      format("resource.labels.service_name=\"%s\"", google_cloud_run_v2_service.core[0].name),
      "httpRequest.status>=500",
    ]
  )

  sql_auth_failure_filter = join(
    " AND ",
    [
      "resource.type=\"cloudsql_database\"",
      "textPayload:\"password authentication failed\"",
    ]
  )

  privileged_job_failure_filter = join(
    " AND ",
    [
      "resource.type=\"cloud_run_job\"",
      "(resource.labels.job_name=\"furlong-db-migrate\" OR resource.labels.job_name=\"furlong-runtime-verify\")",
      "(severity>=ERROR OR textPayload:\"Container called exit(1).\")",
    ]
  )
}

resource "google_project_iam_audit_config" "secretmanager" {
  count = var.enable_security_observability ? 1 : 0

  project = var.project_id
  service = "secretmanager.googleapis.com"

  audit_log_config {
    log_type = "DATA_READ"
  }

  audit_log_config {
    log_type = "DATA_WRITE"
  }
}

resource "google_project_iam_audit_config" "run" {
  count = var.enable_security_observability ? 1 : 0

  project = var.project_id
  service = "run.googleapis.com"

  audit_log_config {
    log_type = "DATA_READ"
  }

  audit_log_config {
    log_type = "DATA_WRITE"
  }
}

resource "google_logging_project_bucket_config" "forensics_runtime" {
  count = var.enable_security_observability ? 1 : 0

  project        = var.project_id
  location       = "global"
  bucket_id      = "furlong-forensics-runtime-logs"
  retention_days = var.forensics_retention_days
  description    = "Retained runtime log bucket for FORENSICS-001 runtime-logs evidence."

  depends_on = [google_project_service.required]
}

resource "google_storage_bucket" "forensics_api_logs" {
  count = var.enable_security_observability ? 1 : 0

  name                        = "${var.project_id}-forensics-api-logs"
  project                     = var.project_id
  location                    = var.region
  labels                      = var.labels
  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"
  force_destroy               = false

  retention_policy {
    retention_period = var.forensics_retention_days * 24 * 60 * 60
  }

  depends_on = [google_project_service.required]
}

resource "google_storage_bucket" "forensics_deployment_events" {
  count = var.enable_security_observability ? 1 : 0

  name                        = "${var.project_id}-forensics-deployment-events"
  project                     = var.project_id
  location                    = var.region
  labels                      = var.labels
  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"
  force_destroy               = false

  retention_policy {
    retention_period = var.forensics_retention_days * 24 * 60 * 60
  }

  depends_on = [google_project_service.required]
}

resource "google_logging_project_sink" "forensics_runtime_logs" {
  count = var.enable_security_observability ? 1 : 0

  project                = var.project_id
  name                   = "furlong-forensics-runtime-logs"
  destination            = "logging.googleapis.com/projects/${var.project_id}/locations/global/buckets/${google_logging_project_bucket_config.forensics_runtime[0].bucket_id}"
  filter                 = "resource.type=\"cloud_run_revision\" AND severity>=DEFAULT"
  unique_writer_identity = true
}

resource "google_logging_project_sink" "forensics_api_logs" {
  count = var.enable_security_observability ? 1 : 0

  project                = var.project_id
  name                   = "furlong-forensics-api-logs"
  destination            = "storage.googleapis.com/${google_storage_bucket.forensics_api_logs[0].name}"
  filter                 = "resource.type=\"cloud_run_revision\" AND jsonPayload.channel=\"api-perimeter\""
  unique_writer_identity = true
}

resource "google_logging_project_sink" "forensics_deployment_events" {
  count = var.enable_security_observability ? 1 : 0

  project                = var.project_id
  name                   = "furlong-forensics-deployment-events"
  destination            = "storage.googleapis.com/${google_storage_bucket.forensics_deployment_events[0].name}"
  filter                 = "logName:\"cloudaudit.googleapis.com\" AND protoPayload.serviceName=\"run.googleapis.com\""
  unique_writer_identity = true
}

resource "google_storage_bucket_iam_member" "forensics_api_logs_writer" {
  count = var.enable_security_observability ? 1 : 0

  bucket = google_storage_bucket.forensics_api_logs[0].name
  role   = "roles/storage.objectCreator"
  member = google_logging_project_sink.forensics_api_logs[0].writer_identity
}

resource "google_storage_bucket_iam_member" "forensics_deployment_events_writer" {
  count = var.enable_security_observability ? 1 : 0

  bucket = google_storage_bucket.forensics_deployment_events[0].name
  role   = "roles/storage.objectCreator"
  member = google_logging_project_sink.forensics_deployment_events[0].writer_identity
}

resource "google_monitoring_alert_policy" "edge_403_probe" {
  count = var.enable_security_observability && var.core_image != "" ? 1 : 0

  project               = var.project_id
  display_name          = "Furlong staging edge 403 probe activity"
  combiner              = "OR"
  enabled               = true
  notification_channels = var.security_alert_notification_channels

  conditions {
    display_name = "Cloud Run 403 response observed"
    condition_matched_log {
      filter = local.edge_403_filter
    }
  }

  documentation {
    mime_type = "text/markdown"
    content   = "A 403 reached the staging Cloud Run edge. Expected during verification, but repeated hits can indicate probing against the private preview URL."
  }

  alert_strategy {
    notification_rate_limit {
      period = "300s"
    }
    auto_close = "1800s"
  }
}

resource "google_monitoring_alert_policy" "app_5xx" {
  count = var.enable_security_observability && var.core_image != "" ? 1 : 0

  project               = var.project_id
  display_name          = "Furlong staging app 5xx responses"
  combiner              = "OR"
  enabled               = true
  notification_channels = var.security_alert_notification_channels

  conditions {
    display_name = "Cloud Run 5xx response observed"
    condition_matched_log {
      filter = local.app_5xx_filter
    }
  }

  documentation {
    mime_type = "text/markdown"
    content   = "The staging app returned a 5xx response. Treat repeated hits as application health degradation or a bad deploy."
  }

  alert_strategy {
    notification_rate_limit {
      period = "300s"
    }
    auto_close = "1800s"
  }
}

resource "google_monitoring_alert_policy" "sql_auth_failure" {
  count = var.enable_security_observability ? 1 : 0

  project               = var.project_id
  display_name          = "Furlong staging SQL authentication failure"
  combiner              = "OR"
  enabled               = true
  notification_channels = var.security_alert_notification_channels

  conditions {
    display_name = "Cloud SQL authentication failure observed"
    condition_matched_log {
      filter = local.sql_auth_failure_filter
    }
  }

  documentation {
    mime_type = "text/markdown"
    content   = "Cloud SQL logged an authentication failure. Review recent secret rotations, runtime credentials, and any unauthorized connection attempts."
  }

  alert_strategy {
    notification_rate_limit {
      period = "300s"
    }
    auto_close = "1800s"
  }
}

resource "google_monitoring_alert_policy" "privileged_job_failure" {
  count = var.enable_security_observability && var.migrator_image != "" ? 1 : 0

  project               = var.project_id
  display_name          = "Furlong staging privileged job failure"
  combiner              = "OR"
  enabled               = true
  notification_channels = var.security_alert_notification_channels

  conditions {
    display_name = "Migration or runtime verification job failure observed"
    condition_matched_log {
      filter = local.privileged_job_failure_filter
    }
  }

  documentation {
    mime_type = "text/markdown"
    content   = "A privileged Cloud Run job failed. This covers the schema migrator and runtime privilege verifier that underpin deployment safety."
  }

  alert_strategy {
    notification_rate_limit {
      period = "300s"
    }
    auto_close = "1800s"
  }
}

resource "google_monitoring_alert_policy" "unexpected_secret_access" {
  count = var.enable_security_observability ? 1 : 0

  project               = var.project_id
  display_name          = "Furlong staging unexpected secret access"
  combiner              = "OR"
  enabled               = true
  notification_channels = var.security_alert_notification_channels

  conditions {
    display_name = "Unexpected Secret Manager access observed"
    condition_matched_log {
      filter = local.unexpected_secret_access_filter
    }
  }

  documentation {
    mime_type = "text/markdown"
    content   = "A Secret Manager read occurred from a principal outside the expected staging runtime, migrator, or operator set. Review immediately."
  }

  alert_strategy {
    notification_rate_limit {
      period = "300s"
    }
    auto_close = "1800s"
  }
}
