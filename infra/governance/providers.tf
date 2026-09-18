provider "google" {
  project = var.project_id
  region  = var.region
}

data "google_project" "current" {
  project_id = var.project_id
}

data "google_storage_project_service_account" "gcs" {
  project = var.project_id
}
