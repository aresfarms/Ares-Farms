# Scheduled jobs — Railway cron services

Railway crons are configured as SEPARATE services in the same project (one per
schedule), each pointing at this repo with a cron expression + start command.
The web service (railway.json) is untouched.

Create two services in the Railway dashboard (or `railway add`):

1. **source-refresh** (daily, 06:00 UTC)
   - Cron schedule: `0 6 * * *`
   - Start command: `npm run run:source-refresh`
   - What it does: re-pulls every Module 22/23-APPROVED live property feed
     (HUD/Treasury/GSA), diffs adds/removes, recomputes auction-date freshness,
     resolves place-facts for newly added properties, writes audit-ledger events.
     Never activates a source.

2. **listing-freshness** (weekly, Mondays 06:30 UTC)
   - Cron schedule: `30 6 * * 1`
   - Start command: `npm run run:listing-freshness`
   - What it does: direct-listing weekly job — auto-expires past-date auctions,
     suspends non-reconfirmed listings, re-checks lister license posture
     (auto-suspend on lapse), flags listers due for license re-verification,
     writes one ledger event per run.

Both commands exist in package.json and exit after one run (cron-friendly).
Local equivalent (launchd/cron): same two commands on the same schedules.
