# Furlong staging — Stage-1 bootstrap (Terraform)

**STAGING-DEPLOY P1.** This module stands up the *minimal* staging infrastructure
so the core can be deployed **IAM-private** in P2. It is Terraform so the future
production baseline extends the same code.

> **Posture (unchanged):** 10 blockers OPEN · `combinedProductionReady=false` ·
> no DNS · no PII · financing gated. This bootstrap deploys **nothing
> borrower-facing** and does **not** activate production.

## What Terraform DOES create
- Enables the required APIs (incl. `servicenetworking`).
- A VPC + one regional subnet (for Cloud Run **Direct VPC egress**) + **Private
  Services Access** peering (created *before* Cloud SQL).
- One Cloud SQL for PostgreSQL instance — **private IP only, no public IPv4** —
  plus the single application database `furlong`.
- An Artifact Registry Docker repo.
- Secret Manager **containers** (`DATABASE_URL`, `MIGRATOR_DATABASE_URL`,
  `NEXTAUTH_SECRET`) — **names only, no values**.
- Two least-privilege service accounts (`furlong-core-runtime`,
  `furlong-db-migrator`) with secret access scoped to exactly what each needs.

## What Terraform NEVER does (by design)
- **Never** creates database users, passwords, or grants.
- **Never** receives a database password or writes a secret *version*.
- **Never** creates the project (it confirms and uses the existing
  `furlong-staging`).

---

## Prerequisites (owner)
1. **Confirm the project exists** and its billing/budget (do not recreate):
   ```bash
   gcloud projects describe furlong-staging \
     --format="value(projectId,projectNumber,parent.id)"
   gcloud billing projects describe furlong-staging \
     --format="value(billingAccountName,billingEnabled)"
   ```
   Set a budget + alert (e.g. $50 warn / $100 alert) in the billing console.
   Verify the $300/90-day trial status in the billing console — treat it as
   something to check, not a deployment assumption.
2. **Authenticate as yourself** (no long-lived key):
   ```bash
   gcloud auth application-default login
   gcloud config set project furlong-staging
   ```
3. **Install Terraform** (>= 1.6): https://developer.hashicorp.com/terraform/install

---

## Stage 1 — bootstrap apply
```bash
cd infra/staging
cp terraform.tfvars.example terraform.tfvars   # adjust region/tier if needed
terraform init
terraform fmt -check
terraform validate
terraform plan -out staging.tfplan             # REVIEW the plan carefully
terraform apply staging.tfplan
```
**Success means:** APIs enabled; VPC + subnet + PSA up; Cloud SQL instance is
`RUNNABLE` with **no public IP**; database `furlong` exists; the three secret
*containers* exist (still empty); both SAs exist. Note the outputs — especially
`cloudsql_private_ip`, `core_runtime_sa_email`, `db_migrator_sa_email`,
`artifact_registry_repo`.

**If it fails:**
- *PSA / SQL ordering error* → re-run `apply`; Cloud SQL waits on the
  `google_service_networking_connection` (already wired via `depends_on`).
- *API not enabled yet* → APIs can take a minute to propagate; re-run `apply`.
- *Permission denied* → confirm your identity has project
  Owner/Editor + Service Networking Admin on `furlong-staging`.

---

## Stage 1.5 — OWNER manual steps (cannot be delegated)
The instance is private-IP only, so you do **not** open a psql session from your
laptop. Create the two principals via the **Cloud SQL control plane**:

1. **Create the two Postgres principals** (generate strong passwords locally;
   they never touch Terraform):
   ```bash
   gcloud sql users create furlong_migrator \
     --instance=furlong-staging-pg --password='<generated-migrator-password>'
   gcloud sql users create furlong_runtime \
     --instance=furlong-staging-pg --password='<generated-runtime-password>'
   ```
   > Object grants are **not** set here — `migrate:schema` applies them from
   > inside the VPC (gate P1.6). The runtime principal must not own the schema.

2. **Compose the connection strings and store them as secret VERSIONS.** Host =
   the `cloudsql_private_ip` output; db = `furlong`. (SSL: the instance enforces
   TLS; the exact `sslmode` / server-CA verification is finalized in P2 — start
   with `sslmode=require`.)
   ```bash
   printf 'postgresql://furlong_runtime:<runtime-pw>@<PRIVATE_IP>:5432/furlong?sslmode=require' \
     | gcloud secrets versions add DATABASE_URL --data-file=-
   printf 'postgresql://furlong_migrator:<migrator-pw>@<PRIVATE_IP>:5432/furlong?sslmode=require' \
     | gcloud secrets versions add MIGRATOR_DATABASE_URL --data-file=-
   openssl rand -base64 48 \
     | gcloud secrets versions add NEXTAUTH_SECRET --data-file=-
   ```
   Leave Stripe/GSA/etc. secrets **unset/dormant**.

3. **Confirm:** no real borrower PII in staging; single `furlong-staging` project.

---

## What's next (not in this module)
- **P2** — build + push the image (P2.1), run the `furlong-db-migrate` Job to
  apply `migrate:schema` (P2.2), deploy `furlong-core` **IAM-private** (P2.3).
- **Gate P1.6** — run `migrate:schema` (as migrator) + `verify:runtime-privileges`
  (as runtime) against this instance to prove the DML-only authority split.

## Cost note — PITR
`enable_point_in_time_recovery = true` retains write-ahead logs, and that WAL
storage **is billed** (not categorically free). If the cost estimate isn't yet
approved, set it `false` in `terraform.tfvars` to keep only daily backups.

## Teardown (deliberate only)
Cloud SQL has deletion protection at two layers. To tear down, set
`cloudsql_deletion_protection = false`, `terraform apply`, then
`terraform destroy`.
