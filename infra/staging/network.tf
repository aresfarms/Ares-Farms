# =============================================================================
# infra/staging — VPC, subnet, and Private Services Access (STAGING-DEPLOY P1)
#
# Order matters (spec P1): the servicenetworking connection MUST exist BEFORE
# the Cloud SQL instance, or the private-IP instance cannot be created. Cloud
# SQL depends_on the connection in sql.tf.
# =============================================================================

# Custom-mode VPC (no auto subnets) — we declare exactly the one subnet we need.
resource "google_compute_network" "vpc" {
  name                    = var.network_name
  auto_create_subnetworks = false
  routing_mode            = "REGIONAL"

  depends_on = [google_project_service.required]
}

# Regional subnet designated for Cloud Run Direct VPC egress (the furlong-core
# service and the furlong-db-migrate Job attach here in P2).
resource "google_compute_subnetwork" "egress" {
  name                     = var.subnet_name
  region                   = var.region
  network                  = google_compute_network.vpc.id
  ip_cidr_range            = var.subnet_cidr
  private_ip_google_access = true
}

# Reserved internal range peered to Google service producers (Cloud SQL lives
# in the producer network reached over this peering).
resource "google_compute_global_address" "psa_range" {
  name          = var.psa_range_name
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = var.psa_prefix_length
  address       = var.psa_range_address
  network       = google_compute_network.vpc.id
}

# Private Services Access connection (servicenetworking peering). Created BEFORE
# the SQL instance (see sql.tf depends_on).
resource "google_service_networking_connection" "psa" {
  network                 = google_compute_network.vpc.id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.psa_range.name]

  # Clean up the peering on destroy so the range can be released.
  deletion_policy = "ABANDON"

  depends_on = [google_project_service.required]
}
