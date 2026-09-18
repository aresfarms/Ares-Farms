# Keyless GitHub -> Google Cloud build submission.
# Vol III / III-B / TECH-SEC-001: short-lived OIDC federation, exact repository
# and protected-branch conditions, dedicated submission identity, no JSON key.

resource "google_iam_workload_identity_pool" "github" {
  project                   = var.project_id
  workload_identity_pool_id = "github-actions"
  display_name              = "Furlong GitHub Actions"
  description               = "Keyless GitHub OIDC identities for governed Furlong builds."
}

resource "google_iam_workload_identity_pool_provider" "github" {
  project                            = var.project_id
  workload_identity_pool_id          = google_iam_workload_identity_pool.github.workload_identity_pool_id
  workload_identity_pool_provider_id = "ares-farms"
  display_name                       = "Ares Farms protected main"

  attribute_mapping = {
    "google.subject"       = "assertion.sub"
    "attribute.repository" = "assertion.repository"
    "attribute.ref"        = "assertion.ref"
    "attribute.actor"      = "assertion.actor"
  }

  attribute_condition = "assertion.repository == '${var.github_repository}' && assertion.ref == '${var.github_branch_ref}'"

  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }
}

resource "google_service_account" "github_build_submitter" {
  project      = var.project_id
  account_id   = "furlong-github-build"
  display_name = "Furlong GitHub keyless build submitter"
  description  = "Short-lived WIF target. May submit and inspect builds, upload source, and act as the dedicated build executor; no runtime or secret access."
}

resource "google_service_account_iam_member" "github_federation" {
  service_account_id = google_service_account.github_build_submitter.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.github.name}/attribute.repository/${var.github_repository}"
}

resource "google_project_iam_member" "submit_builds" {
  project = var.project_id
  role    = "roles/cloudbuild.builds.editor"
  member  = "serviceAccount:${google_service_account.github_build_submitter.email}"
}

resource "google_project_iam_member" "use_services" {
  project = var.project_id
  role    = "roles/serviceusage.serviceUsageConsumer"
  member  = "serviceAccount:${google_service_account.github_build_submitter.email}"
}

resource "google_service_account_iam_member" "act_as_build_executor" {
  service_account_id = "projects/${var.project_id}/serviceAccounts/${var.cloud_build_service_account}"
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${google_service_account.github_build_submitter.email}"
}

resource "google_storage_bucket_iam_member" "upload_build_source" {
  bucket = var.cloud_build_source_bucket
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.github_build_submitter.email}"
}
