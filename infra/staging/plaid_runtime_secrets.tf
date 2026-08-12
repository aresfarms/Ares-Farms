# Plaid runtime credentials are owner-created and versioned out of band.
# Terraform governs access only; values never enter Terraform state.

resource "google_secret_manager_secret_iam_member" "runtime_plaid_client_id" {
  project   = var.project_id
  secret_id = "PLAID_CLIENT_ID"
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.core_runtime.email}"
}

resource "google_secret_manager_secret_iam_member" "runtime_plaid_api_secret" {
  project   = var.project_id
  secret_id = "PlaidSecret"
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.core_runtime.email}"
}
