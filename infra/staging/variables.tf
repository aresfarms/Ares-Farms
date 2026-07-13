# =============================================================================
# infra/staging — input variables (STAGING-DEPLOY P1)
# Values live in terraform.tfvars (git-ignored) or -var flags. NO SECRETS here:
# Terraform never receives a database password (spec authority map).
# =============================================================================

variable "project_id" {
  description = "Existing GCP project id. Confirm it exists (do NOT recreate)."
  type        = string
  default     = "furlong-staging"
}

variable "region" {
  description = "Region for the subnet, Cloud SQL, Artifact Registry, and (later) Cloud Run. Prior decision was us-central1; confirm at apply time."
  type        = string
  default     = "us-central1"
}

# ---- Networking -------------------------------------------------------------

variable "network_name" {
  description = "VPC network name."
  type        = string
  default     = "furlong-staging-vpc"
}

variable "subnet_name" {
  description = "Regional subnet designated for Cloud Run Direct VPC egress (service + migrator Job attach here)."
  type        = string
  default     = "furlong-staging-subnet"
}

variable "subnet_cidr" {
  description = "Primary CIDR for the Direct VPC egress subnet. Must not overlap the Private Services Access range below."
  type        = string
  default     = "10.20.0.0/24"
}

variable "psa_range_name" {
  description = "Name of the reserved internal range peered to Google service producers (Private Services Access)."
  type        = string
  default     = "furlong-staging-psa-range"
}

variable "psa_prefix_length" {
  description = "Prefix length of the reserved PSA range (Google recommends /16; /24 is enough for one Cloud SQL instance and conserves space)."
  type        = number
  default     = 24
}

variable "psa_range_address" {
  description = "Optional explicit starting address for the PSA range. Leave null to let GCP allocate within the VPC."
  type        = string
  default     = null
}

# ---- Cloud SQL --------------------------------------------------------------

variable "database_version" {
  description = "Cloud SQL PostgreSQL engine version."
  type        = string
  default     = "POSTGRES_16"
}

variable "cloudsql_edition" {
  description = "Cloud SQL edition. ENTERPRISE is required for the small shared-core tiers below."
  type        = string
  default     = "ENTERPRISE"
}

variable "cloudsql_tier" {
  description = "Smallest viable machine tier. db-g1-small (shared core, 1.7GB) is a defensible minimum for staging. NOTE (P2.3): keep max_instances x pool_max BELOW this tier's max_connections."
  type        = string
  default     = "db-g1-small"
}

variable "cloudsql_instance_name" {
  description = "Cloud SQL instance name."
  type        = string
  default     = "furlong-staging-pg"
}

variable "app_db_name" {
  description = "The single application database created by Terraform (NO users/passwords/grants are created here)."
  type        = string
  default     = "furlong"
}

variable "cloudsql_availability_type" {
  description = "ZONAL (single zone, cheapest) for staging; REGIONAL (HA) is a production concern."
  type        = string
  default     = "ZONAL"
}

variable "cloudsql_disk_size_gb" {
  description = "Initial data disk size (GB). Autoresize is enabled so this is a floor."
  type        = number
  default     = 10
}

variable "backup_start_time" {
  description = "Daily automated-backup start time (UTC, HH:MM)."
  type        = string
  default     = "07:00"
}

variable "backup_retention_days" {
  description = "Number of automated backups retained (minimum defensible retention for staging)."
  type        = number
  default     = 7
}

variable "enable_point_in_time_recovery" {
  description = "Enable PITR (WAL archiving). COST NOTE (spec P1): retained WAL storage is billed and is NOT categorically free; record the estimated cost before enabling. Set false to keep only daily backups."
  type        = bool
  default     = true
}

variable "transaction_log_retention_days" {
  description = "Days of WAL retained for PITR (only meaningful when enable_point_in_time_recovery = true). Minimum defensible window."
  type        = number
  default     = 7
}

variable "cloudsql_deletion_protection" {
  description = "Block accidental instance deletion at the Cloud SQL layer. Keep true; flip to false only for an intentional teardown."
  type        = bool
  default     = true
}

# ---- Artifact Registry ------------------------------------------------------

variable "artifact_repo_id" {
  description = "Artifact Registry Docker repository id (holds the furlong-core image)."
  type        = string
  default     = "furlong"
}

# ---- Service accounts / IAM -------------------------------------------------

variable "grant_cloudsql_client" {
  description = "Grant roles/cloudsql.client to the runtime + migrator SAs. Direct private-IP PostgreSQL with a normal connection string does NOT use GCP IAM for DB authorization, so this defaults FALSE. Set true ONLY if you switch to the Cloud SQL Auth Proxy / connectors (spec P1)."
  type        = bool
  default     = false
}

# ---- Labels -----------------------------------------------------------------

variable "labels" {
  description = "Labels applied to labelable resources."
  type        = map(string)
  default = {
    environment = "staging"
    system      = "furlong"
    managed_by  = "terraform"
  }
}
