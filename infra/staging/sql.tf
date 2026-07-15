# =============================================================================
# infra/staging — Cloud SQL for PostgreSQL (STAGING-DEPLOY P1)
#
# Terraform creates the INSTANCE and the application DATABASE ONLY.
# It NEVER creates users, passwords, or grants (spec authority map):
#   * the two password-auth principals (furlong_runtime, furlong_migrator) are
#     created by the OWNER via the Cloud SQL control plane (console/Admin API)
#     between Stage 1 and Stage 2;
#   * object grants + default privileges are applied later by `migrate:schema`
#     running as the migrator from inside the VPC (P2.2 / gate P1.6).
#
# Posture: PRIVATE IP ONLY (no public IPv4), reachable only over the VPC peering.
# =============================================================================

resource "google_sql_database_instance" "pg" {
  name             = var.cloudsql_instance_name
  project          = var.project_id
  region           = var.region
  database_version = var.database_version

  # Terraform-level guard against accidental `terraform destroy`.
  deletion_protection = var.cloudsql_deletion_protection

  # The private-IP instance cannot be created until the PSA peering exists.
  depends_on = [
    google_service_networking_connection.psa,
    google_project_service.required,
  ]

  settings {
    tier              = var.cloudsql_tier
    edition           = var.cloudsql_edition
    availability_type = var.cloudsql_availability_type
    disk_type         = "PD_SSD"
    disk_size         = var.cloudsql_disk_size_gb
    disk_autoresize   = true

    # API-level deletion protection (independent of the Terraform flag above).
    deletion_protection_enabled = var.cloudsql_deletion_protection

    user_labels = var.labels

    ip_configuration {
      # PRIVATE IP ONLY — no public IPv4 endpoint.
      ipv4_enabled    = false
      private_network = google_compute_network.vpc.id
      # Enforce TLS on every connection.
      ssl_mode = "ENCRYPTED_ONLY"
    }

    backup_configuration {
      enabled    = true
      start_time = var.backup_start_time
      # PITR (WAL archiving). COST: retained WAL storage is billed — see README.
      point_in_time_recovery_enabled = var.enable_point_in_time_recovery
      transaction_log_retention_days = var.transaction_log_retention_days
      backup_retention_settings {
        retained_backups = var.backup_retention_days
        retention_unit   = "COUNT"
      }
    }
  }
}

# The single application database. NO owner/users set here (Terraform has no DB
# credentials); the migrator principal (created by the owner) owns objects.
resource "google_sql_database" "app" {
  name     = var.app_db_name
  project  = var.project_id
  instance = google_sql_database_instance.pg.name
}
