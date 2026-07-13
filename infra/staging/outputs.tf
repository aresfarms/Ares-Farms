# =============================================================================
# infra/staging — outputs (STAGING-DEPLOY P1)
# These are infrastructure FACTS the owner needs for Stage 1.5 (composing the
# secret values) and P2. NONE of these are secrets — no passwords, no secret
# versions are ever output.
# =============================================================================

output "project_id" {
  description = "Confirmed project id."
  value       = data.google_project.staging.project_id
}

output "project_number" {
  description = "Project number (verify org placement + billing linkage)."
  value       = data.google_project.staging.number
}

output "region" {
  description = "Region used for regional resources."
  value       = var.region
}

output "vpc_network" {
  description = "VPC network self link (Cloud Run Direct VPC egress target)."
  value       = google_compute_network.vpc.id
}

output "egress_subnet" {
  description = "Regional subnet self link for Cloud Run Direct VPC egress."
  value       = google_compute_subnetwork.egress.id
}

output "cloudsql_instance_name" {
  description = "Cloud SQL instance name."
  value       = google_sql_database_instance.pg.name
}

output "cloudsql_connection_name" {
  description = "Cloud SQL connection name (project:region:instance)."
  value       = google_sql_database_instance.pg.connection_name
}

output "cloudsql_private_ip" {
  description = "Cloud SQL PRIVATE IP — the host for DATABASE_URL / MIGRATOR_DATABASE_URL. Not a secret; the password (owner-set) is."
  value       = google_sql_database_instance.pg.private_ip_address
}

output "app_database_name" {
  description = "Application database name."
  value       = google_sql_database.app.name
}

output "core_runtime_sa_email" {
  description = "Runtime service account email (Cloud Run service runs as this in P2)."
  value       = google_service_account.core_runtime.email
}

output "db_migrator_sa_email" {
  description = "Migrator service account email (Cloud Run Job runs as this in P2)."
  value       = google_service_account.db_migrator.email
}

output "artifact_registry_repo" {
  description = "Artifact Registry Docker repo path for the image push (P2.1)."
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.docker.repository_id}"
}

output "secret_ids" {
  description = "Secret CONTAINER ids created (owner adds versions in Stage 1.5)."
  value       = [for s in google_secret_manager_secret.app : s.secret_id]
}

output "pitr_enabled" {
  description = "Whether PITR (billed WAL retention) is enabled on the instance."
  value       = var.enable_point_in_time_recovery
}
