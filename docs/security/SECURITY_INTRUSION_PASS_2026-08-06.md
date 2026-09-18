# Furlong Security and Intrusion Pass — 2026-08-06

**Scope:** Furlong portal repository and `furlong-staging-499102` only. The
`furlong-dev`, `furlong-prod`, and unrelated projects were not modified.

**Master Volume authority:** Vol II regulated custody and minimum disclosure;
Vol III technical infrastructure; Vol III-B governance runtime; Vol IV incident
and recovery runbooks; Vol V provenance, observability, and evidence;
TECH-SEC-001.

## Outcome

No evidence of a successful intrusion was found in the reviewed seven-day
runtime window and thirty-day administrative window. Specifically:

- no user-managed Google service-account keys exist;
- organization policy blocks service-account key creation and upload;
- no service-account key-creation audit events were present;
- no unexpected Secret Manager reads were present;
- no Cloud SQL password-authentication failures were present;
- no Furlong core 5xx responses were present in the reviewed seven days;
- no public IAM bindings were present on Furlong Cloud Run services or storage
  buckets;
- the database has private IP only, encrypted-only transport, PITR, backups,
  and deletion protection;
- The release-candidate dependency tree has zero npm vulnerabilities and CodeQL
  has zero open alerts. GitHub populated 26 Dependabot alerts against the old
  default-branch lockfile after dependency-graph enablement; they remain open
  until the patched release candidate reaches the default branch. The single
  secret-scanning alert was a third-party public GSA browser key preserved in
  source-rights evidence, not a Furlong credential.

This is an evidence-based security pass, not a claim that compromise is
impossible and not a substitute for a pre-launch independent penetration test.

## Corrected findings

1. **CI container gate could not run.** A malformed Docker ignore character
   class caused Docker to fail before building. Corrected to a valid pattern.
2. **Credential-shaped placeholder.** The dormant Stripe webhook verifier used
   a Stripe-key-shaped sentinel. It was not a live credential, but Trivy
   correctly failed it. Replaced with a non-credential sentinel; invalid or
   missing webhook secrets still fail closed.
3. **Runtime image carried an unused package-manager toolchain.** Once the
   Docker parser defect was removed, Trivy found high/critical advisories in
   the global npm bundled by the Node base image. The final runtime launches
   `node server.js` directly and does not use npm/npx, so both were removed from
   the runtime layer. Trivy then exposed the pinned base image's GnuTLS deb12u6
   advisories; the final layer now installs Debian's exact patched deb12u7
   package. Build and migration stages retain their required tools.
4. **False intrusion alert noise.** A public analysis page polled an
   operator-only recommendation-review endpoint every minute. The endpoint
   correctly returned 403, but the browser continued indefinitely. Polling now
   stops on 401/403.
5. **Keyless GitHub identity absent.** A repository- and protected-main-bound
   Workload Identity Federation provider and dedicated submission account were
   provisioned. It has no Secret Manager, database, runtime, or borrower-vault
   access. The manual GitHub workflow prevents surprise build spend.
6. **Government connector auth not centrally classified.** All 23 governed
   external credentials are now classified as provider API key/token, provider
   identity header, or internal signing material. Public/keyless sources are
   recorded separately; downloaded Google service-account keys are forbidden.
7. **Artifact retention remained observation-only.** The Docker repository had
   grown to approximately 103 GB. The reviewed policy is now active: delete
   untagged versions older than 30 days while retaining the latest ten versions
   per package. This implements the founder-authorized historical build-artifact
   cleanup and should materially reduce storage cost.
8. **Cloud Build source bucket inherited public-access posture.** Public access
   prevention is now explicitly enforced; its existing seven-day `source/`
   lifecycle remains active.
9. **GitHub dependency review was unavailable.** Dependency graph and automatic
   security fixes were enabled. Dependency review now passes on the release
   candidate. The candidate has zero npm vulnerabilities; the 26 default-branch
   Dependabot alerts remain visible until the release candidate is promoted.

## Reviewed but not changed

- The malware scanner uses all-ingress plus IAM-private invocation because the
  core service currently uses private-ranges-only VPC egress. Changing the
  scanner to internal ingress would break scanning unless all egress is routed
  through the VPC and Cloud NAT is added. IAM currently permits only the core
  runtime to invoke it; no anonymous binding exists.
- The forensics API and deployment buckets have 400-day retention, but their
  retention policies are not locked. Locking is irreversible and requires a
  separate founder retention decision.
- The stopped PITR drill clone remains deletion-protected. It should be retained
  only if required as recovery evidence; deletion needs explicit approval.
- Major-version dependency changes (`cookie` 2, ESLint 10, Framer Motion 13,
  PDFKit 0.19, TypeScript 7) were not forced because the current tree has zero
  known vulnerabilities and those upgrades require compatibility testing.

## Verification evidence

- `npm audit` — zero vulnerabilities (production and full tree)
- `verify:secret-scan` — pass
- `verify:repo-secrets` — pass
- `verify:cloud-upload-context` — pass
- `verify:external-connector-auth` — 23/23 classified; Google keys forbidden
- `verify:secret-rotation-workflow` — pass
- security-critical ESLint — pass
- `npx tsc --noEmit` — pass
- production `npm run build` — pass
- keyless-CI Terraform — 8 resources added, zero destroyed; post-apply plan has
  no changes

Local Docker is not installed on the operator machine, so container and Trivy
verification must complete in GitHub Actions after this change is pushed. No
production activation, DNS cutover, secret value access, or credential rotation
was performed.
