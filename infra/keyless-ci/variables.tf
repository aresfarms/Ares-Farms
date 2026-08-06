variable "project_id" {
  type        = string
  description = "Furlong staging project receiving keyless GitHub build requests."
  default     = "furlong-staging-499102"
}

variable "github_repository" {
  type        = string
  description = "Exact GitHub owner/repository allowed to federate."
  default     = "aresfarms/Ares-Farms"
}

variable "github_branch_ref" {
  type        = string
  description = "Exact protected branch ref allowed to federate."
  default     = "refs/heads/main"
}

variable "cloud_build_service_account" {
  type        = string
  description = "Existing least-privilege service account that executes Cloud Build steps."
  default     = "furlong-build@furlong-staging-499102.iam.gserviceaccount.com"
}

variable "cloud_build_source_bucket" {
  type        = string
  description = "Existing Cloud Build source-upload bucket; access is scoped to this bucket only."
  default     = "furlong-staging-499102_cloudbuild"
}
