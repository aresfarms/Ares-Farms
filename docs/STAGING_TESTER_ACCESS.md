# Staging tester access (P3 — IAP)

**Volume III (Technical Infrastructure) / P3.** The staging service sits behind
Google Identity-Aware Proxy (IAP): the URL itself is not a secret anymore, but
only the named people below can get past the Google sign-in wall. Everyone else
gets a Google login prompt and, if they sign in with an unlisted account, a
"You don't have access" page — never the app, never an error.

## The URL

The staging app: **https://furlong-core-859763772114.us-central1.run.app**

You may now share this URL with anyone on the tester list. Sharing it with
someone NOT on the list is harmless (they hit the sign-in wall) but pointless.

## Who has access today

Defined in `infra/staging/terraform.tfvars` → `iap_tester_principals`:

- `user:chudson@aresfarmsinc.com` (Caitlin)
- `user:stuart@aresfarmsinc.com` (Stuart)

(Plus the `furlong-verify` service account, which the deploy gate uses to prove
health through IAP — leave it alone.)

## What a tester does (tell them this)

1. Open the URL in a normal browser.
2. Sign in with the **exact Google account on the list** (their
   aresfarmsinc.com account). A personal Gmail will be refused.
3. That's it — the app loads. If they see "You don't have access", they signed
   in with the wrong account: click their avatar on the error page → switch
   account.

## Adding or removing a tester (operator: Caitlin)

1. Edit `infra/staging/terraform.tfvars` — add or remove an entry in
   `iap_tester_principals`. Named `user:` principals ONLY (Terraform rejects
   groups/domains/allUsers by design):

   ```hcl
   iap_tester_principals = [
     "user:chudson@aresfarmsinc.com",
     "user:stuart@aresfarmsinc.com",
     "user:newtester@example.com",
   ]
   ```

2. From `infra/staging/`, run:

   ```
   terraform plan -out staging.tfplan
   terraform apply staging.tfplan
   ```

   **What success looks like:** the plan shows only
   `google_iap_web_cloud_run_service_iam_member.testers[...]` additions or
   removals — nothing else. If anything else shows as changing, stop and ask.

3. Access takes effect within a minute or two. Removal is immediate on apply.

**If the command fails:** run `gcloud auth login` (auth expires), then retry
the plan/apply pair. Never edit the IAP policy in the console by hand — it
would drift from Terraform and the next apply would revert it.

## How this is verified

Every deploy, `npm run deploy:verify-manifest` runs the P3 checks and refuses
to emit a manifest if they fail:

- IAP enabled on the service (`run.googleapis.com/iap-enabled=true`),
- the allowlist holds only named `user:` principals + the verify SA (no
  allUsers / allAuthenticatedUsers / groups / domains),
- an unlisted visitor is redirected (302) to the Google sign-in wall.

The emitted manifest records the tester list at deploy time
(`p3TesterPrincipals`) for the audit trail.

## What P3 does NOT change

- The database posture, PII posture (`piiPermitted: false`), and the 10-blocker
  model are untouched.
- Production/DNS cutover stays unauthorized (`dnsCutoverAuthorized: false`).
- This is tester access, not a public alpha.
