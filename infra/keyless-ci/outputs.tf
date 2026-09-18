output "workload_identity_provider" {
  value       = google_iam_workload_identity_pool_provider.github.name
  description = "Provider resource name used by google-github-actions/auth."
}

output "github_build_service_account" {
  value       = google_service_account.github_build_submitter.email
  description = "Dedicated short-lived GitHub build-submission identity."
}
