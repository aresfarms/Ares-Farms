output "state_bucket" {
  value = google_storage_bucket.state.name
}
output "source_bucket" {
  value = google_storage_bucket.source.name
}
output "plan_bucket" {
  value = google_storage_bucket.plans.name
}
output "plan_service_account" {
  value = google_service_account.plan.email
}
output "apply_service_account" {
  value = google_service_account.apply.email
}
output "state_kms_key" {
  value = google_kms_crypto_key.state.id
}
output "source_kms_key" {
  value = google_kms_crypto_key.source.id
}
output "plan_kms_key" {
  value = google_kms_crypto_key.plans.id
}