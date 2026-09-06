# Launch Hygiene Checklist (Tier 4 — 2026-07-28)

The small, easy-to-forget switches that separate "staging that testers poke at"
from "the thing the public sees." Every step is a founder (or founder-directed)
action at **launch freeze** — none of them should be flipped early, and none of
them require code changes.

Governance basis: Vol IV (Operational Runbooks) — launch readiness; Vol III-B
(Governance Runtime) — replay-safe activation.

## L1 — Re-pin the consolidated launch gate

The launch gate verifies "target revision is live" against
`LAUNCH_LEDGER_REVISION`. At launch freeze:

1. Deploy the frozen release build; note the new revision name
   (`gcloud run services describe furlong-core --region us-central1
   --format='value(status.latestReadyRevisionName)'`).
2. Set `LAUNCH_LEDGER_REVISION=<that revision>` in the gate environment and
   re-run `npm run deploy:verify-manifest` — expect 11/11.
3. Commit the manifest **from the repo root** (running git from
   `infra/staging` is the recurring trap).

## L2 — Turn tier previews off

Staging previews paid tiers so testers can see everything
(`FURLONG_TIER_PREVIEW_MODE` unset). At launch freeze set in
`infra/staging/terraform.tfvars` (or the production tfvars):

```
tier_preview_mode = "off"
```

then `terraform apply`. The app honors it immediately
(`process.env.FURLONG_TIER_PREVIEW_MODE !== "off"` gates every preview).

## L3 — Bless the stable rollback tag

The `stable` traffic tag is the rollback anchor. It was re-blessed
2026-07-28 from the ancient `furlong-core-00017-t7d` to the
post-redesign revision. At launch freeze, point it at the frozen release
revision via `stable_revision` in tfvars, then `terraform apply`. Rollback is
then one tfvars edit (serve `stable` at 100%) instead of an archaeology dig.

## L4 — Evidence-recomputation scheduler stays PAUSED (deliberate)

`furlong-evidence-recomputation` (Cloud Scheduler, every 15 min) is PAUSED **by
design** and has never run. Its route refuses work until BOTH:

- the service env `EVIDENCE_RECOMPUTATION_ALLOW_OIDC_SCHEDULER=true` is set, and
- the recomputation activation ceremony (schedulerReleaseAuthorized +
  recomputationActivationFinalized) is completed in-app.

Do **not** resume the job without those — it would fail every 15 minutes and
page nobody. Activating it is a post-launch governance decision, not a launch
blocker. The job is currently NOT terraform-managed (created out-of-band);
if it is ever activated, import it into terraform first.

## L5 — Standing pre-launch gates (tracked elsewhere, listed for one view)

- Rotate ALL keys before go-live (#33) — SendGrid known-exposed; Anthropic key
  expires ~2026-08-27 (rotation reminder scheduled 2026-08-24).
- Independent financing-compliance review of regulated financing surfaces (#34).
- Payments / Guild billing stays OFF until the governed billing model passes independent compliance testing (#35).
- VEDP stays DARK for launch (founder decision 2026-07-29 — legal comfort not
  reached). Not a launch step; revisit only if counsel clears it in the independent financing-compliance
  review (#34).
