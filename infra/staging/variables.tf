# =============================================================================
# infra/staging — input variables (STAGING-DEPLOY P1)
# Values live in terraform.tfvars (git-ignored) or -var flags. NO SECRETS here:
# Terraform never receives a database password (spec authority map).
# =============================================================================

variable "project_id" {
  description = "Existing GCP project id. Confirm it exists (do NOT recreate). NOTE: the bare 'furlong-staging' ID was taken globally — the real project is furlong-staging-499102 (display name 'furlong-staging')."
  type        = string
  default     = "furlong-staging-499102"
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
  description = "Number of automated backups retained."
  type        = number
  default     = 7
}

variable "maintenance_window_day" {
  description = "Cloud SQL maintenance day, 1=Monday through 7=Sunday."
  type        = number
  default     = 7

  validation {
    condition     = var.maintenance_window_day >= 1 && var.maintenance_window_day <= 7
    error_message = "maintenance_window_day must be between 1 and 7."
  }
}

variable "maintenance_window_hour_utc" {
  description = "Cloud SQL maintenance start hour in UTC."
  type        = number
  default     = 8

  validation {
    condition     = var.maintenance_window_hour_utc >= 0 && var.maintenance_window_hour_utc <= 23
    error_message = "maintenance_window_hour_utc must be between 0 and 23."
  }
}

variable "maintenance_update_track" {
  description = "Cloud SQL maintenance update track."
  type        = string
  default     = "stable"

  validation {
    condition     = contains(["stable", "canary"], var.maintenance_update_track)
    error_message = "maintenance_update_track must be stable or canary."
  }
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

variable "enable_staging_dast" {
  description = "Provision the staging-only GitHub OIDC identity used for authenticated passive DAST. Never creates a production identity."
  type        = bool
  default     = true
}

variable "github_actions_principal_set" {
  description = "Repository-scoped GitHub Actions Workload Identity principal allowed to impersonate the staging DAST service account."
  type        = string
  default     = "principalSet://iam.googleapis.com/projects/859763772114/locations/global/workloadIdentityPools/github-actions/attribute.repository/aresfarms/Ares-Farms"
}

variable "enable_binary_authorization" {
  description = "Opt Cloud Run services and jobs into the enforcing project Binary Authorization policy. Keep false until every target digest is scanned and attested."
  type        = bool
  default     = false
}

variable "binary_authorization_signer_principals" {
  description = "Principals allowed to sign explicitly approved image digests with the staging release-attestor KMS key."
  type        = set(string)
  default     = ["user:chudson@aresfarmsinc.com"]
}

# ---- Cloud Run (P2 — Stage 2) ----------------------------------------------
# Both images default to "" so a Stage-1 apply (before any image exists) creates
# NO Cloud Run resources. Set them to DIGEST-pinned refs after the P2.1 push:
#   us-central1-docker.pkg.dev/furlong-staging/furlong/furlong-core@sha256:...

variable "core_image" {
  description = "Digest-pinned image ref for the furlong-core service (pin by @sha256 digest, never a tag). Empty = service not created."
  type        = string
  default     = ""

  validation {
    condition     = var.core_image == "" || can(regex("@sha256:[a-f0-9]{64}$", var.core_image))
    error_message = "core_image must be pinned by digest (…@sha256:<64 hex chars>), not a tag."
  }
}

variable "migrator_image" {
  description = "Digest-pinned image ref for the furlong-db-migrate Job (the Dockerfile `migrator` target). Empty = job not created."
  type        = string
  default     = ""

  validation {
    condition     = var.migrator_image == "" || can(regex("@sha256:[a-f0-9]{64}$", var.migrator_image))
    error_message = "migrator_image must be pinned by digest (…@sha256:<64 hex chars>), not a tag."
  }
}

variable "founder_testing_lane_enabled" {
  description = "Staging-only founder testing lane. While true, Cloud Run keeps authenticated direct ingress available for Caitlin's licensed and authority pathway testing. Set false only after Caitlin explicitly confirms the complete test program is closed. Production forbids this exception."
  type        = bool
  default     = true
}

variable "enable_edge_security" {
  description = "Provision the Cloud Armor policy and external managed load-balancer backend. DNS and HTTPS front-end activation remain separately gated by edge_hostname."
  type        = bool
  default     = false
}

variable "edge_hostname" {
  description = "Founder-approved staging hostname for the managed certificate and HTTPS edge. Empty preserves the DNS/cutover hold while still allowing the WAF backend to be provisioned."
  type        = string
  default     = ""
}

variable "invoker_principals" {
  description = "Explicit staging identities granted roles/run.invoker on furlong-core during licensed-pathway and authority testing (e.g. [\"user:chudson@aresfarmsinc.com\"]). Recorded in the deployment manifest as p2InvokerPrincipals. Caitlin's direct testing lane remains until she explicitly confirms every licensed and authority pathway is complete; never carry this exception into production. NEVER allUsers/allAuthenticatedUsers."
  type        = list(string)
  default     = []

  validation {
    condition = alltrue([
      for p in var.invoker_principals :
      p != "allUsers" && p != "allAuthenticatedUsers"
    ])
    error_message = "allUsers / allAuthenticatedUsers must never receive invoke authority (IAM-private posture)."
  }
}

variable "secret_revision_epoch" {
  description = "Non-secret audit counter retained for release evidence. Numeric Secret Manager version pins create revision diffs directly."
  type        = number
  default     = 1
}

variable "secret_versions" {
  description = "Approved numeric Secret Manager versions keyed by secret id. Release resources must never reference the moving latest alias."
  type        = map(string)
  default     = {}

  validation {
    condition = alltrue([
      for version in values(var.secret_versions) : can(regex("^[1-9][0-9]*$", version))
    ])
    error_message = "Every secret_versions value must be a positive numeric Secret Manager version."
  }
}

variable "nextauth_url" {
  description = "Public base URL for NextAuth (the service's run.app URL). Unknown before the first deploy: leave empty, deploy, read the URL output, set this, re-apply."
  type        = string
  default     = ""
}

variable "webauthn_rp_id" {
  description = "Canonical WebAuthn relying-party hostname only (no scheme or path). Passkeys are cryptographically bound to this hostname."
  type        = string
  default     = ""

  validation {
    condition     = var.webauthn_rp_id == "" || (!strcontains(var.webauthn_rp_id, "://") && !strcontains(var.webauthn_rp_id, "/"))
    error_message = "webauthn_rp_id must be a hostname only, without a URL scheme or path."
  }
}

variable "webauthn_origin" {
  description = "Canonical HTTPS browser origin used to verify WebAuthn registration and authentication responses."
  type        = string
  default     = ""

  validation {
    condition     = var.webauthn_origin == "" || can(regex("^https://[^/]+$", var.webauthn_origin))
    error_message = "webauthn_origin must be a single HTTPS origin without a path."
  }
}

variable "core_max_instances" {
  description = "Max Cloud Run instances. CONNECTION BUDGET (spec P2.3): max_instances x per-instance pool (10, src/lib/db/index.ts) must stay BELOW the SQL tier's connection limit (db-g1-small ~50). 2 x 10 = 20 leaves headroom for the migrator + operators."
  type        = number
  default     = 2
}

variable "core_cpu" {
  description = "CPU limit per instance."
  type        = string
  default     = "1"
}

variable "core_memory" {
  description = "Memory limit per instance."
  type        = string
  default     = "1Gi"
}

variable "api_auth_enforcement" {
  description = "API perimeter mode for the deployed Cloud Run service. `required` enforces the deny-by-default session wall."
  type        = string
  default     = "required"
}

variable "rate_limiting_enabled" {
  description = "Enable API rate limiting at the perimeter proxy."
  type        = bool
  default     = true
}

variable "api_rate_limit_window_seconds" {
  description = "Rate-limit window for the perimeter proxy."
  type        = number
  default     = 60
}

variable "api_rate_limit_max" {
  description = "Max API requests per client+route within the perimeter rate-limit window."
  type        = number
  default     = 120
}

variable "migrate_job_timeout_seconds" {
  description = "Bounded task timeout for the furlong-db-migrate Job (spec P2.2)."
  type        = number
  default     = 900
}

variable "verify_runtime_job_timeout_seconds" {
  description = "Bounded task timeout for the runtime privilege verification Job (gate P1.6)."
  type        = number
  default     = 300
}

variable "source_refresh_job_timeout_seconds" {
  description = "Bounded task timeout for the automatic approved-source refresh Job."
  type        = number
  default     = 900
}

variable "enable_source_refresh_scheduler" {
  description = "Create the shared runtime-state bucket and daily Cloud Scheduler job that refreshes approved property sources automatically."
  type        = bool
  default     = true
}

variable "source_refresh_schedule" {
  description = "Cron schedule for automatic approved-source property refreshes."
  type        = string
  default     = "0 9 * * *"
}

variable "source_refresh_time_zone" {
  description = "Time zone for the automatic source refresh schedule."
  type        = string
  default     = "Etc/UTC"
}

variable "enable_security_observability" {
  description = "Provision audit-log coverage, forensic export sinks, and baseline alert policies."
  type        = bool
  default     = true
}

variable "forensics_retention_days" {
  description = "Retention window for forensic export destinations."
  type        = number
  default     = 400
}

variable "security_alert_notification_channels" {
  description = "Monitoring notification channel resource names for security alerts. Empty keeps policies active but un-routed."
  type        = list(string)
  default     = []
}

variable "security_alert_email_addresses" {
  description = "Email recipients to create as Monitoring notification channels for staging security alerts."
  type        = list(string)
  default     = ["chudson@aresfarmsinc.com"]
}

variable "expected_secret_reader_emails" {
  description = "Human principals allowed to read runtime secrets without triggering the unexpected-secret-access alert."
  type        = list(string)
  default     = ["chudson@aresfarmsinc.com"]
}

variable "enable_iap" {
  description = "Enable Cloud Run direct IAP for the staging service."
  type        = bool
  default     = true
}

variable "iap_tester_principals" {
  description = "Principals granted IAP access to the staging Cloud Run service."
  type        = list(string)
  default     = ["user:chudson@aresfarmsinc.com"]

  validation {
    condition = alltrue([
      for p in var.iap_tester_principals :
      startswith(p, "user:") &&
      p != "allUsers" &&
      p != "allAuthenticatedUsers"
    ])
    error_message = "iap_tester_principals must be explicitly named user: principals only; groups, domains, and broad public principals are not allowed."
  }
}

variable "amenity_live_lookup_enabled" {
  description = "Founder activation: live OSM amenity lookups for manually typed addresses (bounded per-request Overpass query)."
  type        = bool
  default     = false
}

variable "stable_revision" {
  description = "Revision pinned to the 'stable' traffic tag (0% traffic, own URL) so testers keep a blessed build while latest churns. Empty = no tag."
  type        = string
  default     = ""
}

variable "deployment_environment" {
  description = "Explicit runtime environment boundary. Test fixtures are permitted only outside production."
  type        = string
  default     = "staging"

  validation {
    condition     = contains(["development", "staging", "production"], var.deployment_environment)
    error_message = "deployment_environment must be development, staging, or production."
  }
}

variable "professional_test_personas_enabled" {
  description = "Enable unmistakably synthetic professional personas for authorized owner testing in non-production environments."
  type        = bool
  default     = false

  validation {
    condition     = !(var.deployment_environment == "production" && var.professional_test_personas_enabled)
    error_message = "Professional test personas are forbidden in production."
  }
}

variable "synthetic_fixtures_enabled" {
  description = "Enable signed synthetic test sessions and immutable fixture lineage in non-production environments."
  type        = bool
  default     = false

  validation {
    condition     = !(var.deployment_environment == "production" && var.synthetic_fixtures_enabled)
    error_message = "Synthetic fixtures are forbidden in production."
  }
}

variable "synthetic_fixture_operator_allowlist" {
  description = "Comma-separated operator identities allowed to activate synthetic fixtures. This is authorization metadata, not a secret."
  type        = string
  default     = "chudson@aresfarmsinc.com"

  validation {
    condition     = length(trimspace(var.synthetic_fixture_operator_allowlist)) > 0
    error_message = "synthetic_fixture_operator_allowlist must contain at least one operator identity."
  }
}

variable "role_provisioning_mode" {
  description = "Role-provisioning enforcement mode. Production and staging privileged access use governed-admin-only."
  type        = string
  default     = "locked"

  validation {
    condition     = contains(["locked", "development-headers", "governed-admin-only"], var.role_provisioning_mode)
    error_message = "role_provisioning_mode must be locked, development-headers, or governed-admin-only."
  }
}

variable "stripe_3ds_policy" {
  description = "Stripe request_three_d_secure policy: automatic, any, or challenge."
  type        = string
  default     = "automatic"

  validation {
    condition     = contains(["automatic", "any", "challenge"], var.stripe_3ds_policy)
    error_message = "stripe_3ds_policy must be automatic, any, or challenge."
  }
}

variable "tester_feedback_email" {
  description = "When set, the app renders the staging tester banner (build stamp + mailto feedback). Never set in production."
  type        = string
  default     = ""
}

# ---- Response notifications (email) -----------------------------------------
# Recipients + sender for the "a human needs to respond" notifier. Non-secret;
# the SendGrid API key is added separately as a secret when notifications go
# live (see docs). Until EMAIL_FROM + SENDGRID_API_KEY are both present, the
# notifier records attempts but sends nothing.
variable "notify_pe_email" {
  description = "Recipient for new environmental orders (the licensed PE)."
  type        = string
  default     = "chudson@aresfarmsinc.com"
}

variable "notify_lender_email" {
  description = "Recipient for new financing deals (the licensed lender)."
  type        = string
  # The Financial module's brand address (founder 2026-08-05):
  # finance@compasstocapital.com — isolated external-broker workspace lane; no Furlong governance authority.
  default = "finance@compasstocapital.com"
}

variable "lender_booking_url" {
  description = "The licensed lender's appointment-scheduling page (e.g. Google Workspace booking link). Surfaced on the customer status page, intake success, and reminder emails so customers schedule calls instead of cold-calling. Empty = booking links stay hidden."
  type        = string
  default     = ""
}

variable "gmail_delegated_user" {
  description = "Workspace mailbox the portal sends email AS via Gmail API domain-wide delegation (free Workspace-native sending; replaces paid SendGrid). Empty = Gmail provider off."
  type        = string
  default     = ""
}

variable "lender_calendar_embed_src" {
  description = "Google Calendar id embedded as the agenda panel on the lender desk (renders only for Google sessions with access to that calendar). Empty = panel hidden."
  type        = string
  default     = "sfraas@aresfarmsinc.com"
}

variable "email_from" {
  description = "Verified sender address for outbound notifications. Empty = notifications stay off (recorded, not sent)."
  type        = string
  default     = ""
}

variable "nass_api_key_enabled" {
  description = "When true, the daily source-refresh job reads NASS_API_KEY (an out-of-band Secret Manager secret) to auto-refresh grain + livestock prices. Requires the secret to exist. Default false = prices stay on the committed snapshot."
  type        = bool
  default     = false
}

# ---- Operator credential login -----------------------------------------------
# Enables the email + shared-secret operator login (internal/approval screens).
# The AUTH_CREDENTIAL_SHARED_SECRET secret is created out of band by the owner.
variable "auth_credentials_mode" {
  description = "Set to 'email-allowlist' to enable operator credential login. Empty = login stays blocked (dev-open in prod-like)."
  type        = string
  default     = ""
}

variable "auth_credential_email_allowlist" {
  description = "Comma-separated operator emails allowed to log in with the shared secret."
  type        = string
  default     = ""
}


variable "staging_seed_enabled" {
  description = "Enable the one-purpose P4 staging seed authority. Never enable in production."
  type        = bool
  default     = false
}

variable "named_tester_acceptance_backend" {
  description = "Durable backend for named tester attestations. PostgreSQL is required before P5-B01 can close."
  type        = string
  default     = "postgres"
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

variable "anthropic_api_key_enabled" {
  description = "When true, the core service reads ANTHROPIC_API_KEY (an out-of-band Secret Manager secret) to activate the governed AI seams (interview phrasing + import image extraction). Requires the secret to hold at least one enabled version. Default false = deterministic fallbacks only."
  type        = bool
  default     = false
}

variable "stripe_payments_enabled" {
  description = "When true, the core service reads STRIPE_SECRET_KEY from an out-of-band Secret Manager secret."
  type        = bool
  default     = false
}

variable "stripe_webhook_enabled" {
  description = "When true, the core service reads STRIPE_WEBHOOK_SECRET from an out-of-band Secret Manager secret."
  type        = bool
  default     = false
}

variable "tier_preview_mode" {
  description = "FURLONG_TIER_PREVIEW_MODE for the core service. Empty (default) leaves the env unset — the app previews paid tiers, correct for staging/testing. Set to \"off\" at LAUNCH FREEZE so paid tiers stop previewing (see docs/LAUNCH_HYGIENE_CHECKLIST.md)."
  type        = string
  default     = ""
  validation {
    condition     = contains(["", "off"], var.tier_preview_mode)
    error_message = "tier_preview_mode must be \"\" (previews on) or \"off\"."
  }
}

variable "data_gov_api_key_enabled" {
  description = "When true, the core service reads DATA_GOV_API_KEY (an out-of-band Secret Manager secret) to activate api.data.gov-keyed live lookups (NREL PVWatts solar estimate). Requires the secret to hold at least one enabled version. Default false = the solar fact simply does not render."
  type        = bool
  default     = false
}

variable "noaa_cdo_token_enabled" {
  description = "When true, the core service reads NOAA_CDO_TOKEN (an out-of-band Secret Manager secret) to activate the NOAA NCEI climate-normals lookup. Requires the secret to hold at least one enabled version. Default false = the climate fact simply does not render."
  type        = bool
  default     = false
}
