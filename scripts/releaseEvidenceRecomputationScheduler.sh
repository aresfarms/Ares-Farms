#!/bin/sh
set -eu
PROJECT="${PROJECT:-furlong-staging-499102}"
REGION="${REGION:-us-central1}"
JOB="${JOB:-furlong-evidence-recomputation}"
BUCKET="${BUCKET:-${PROJECT}-runtime-state}"
STATE="gs://${BUCKET}/official-evidence/recomputation-scheduler-release.json"

latest_action() {
  gcloud storage cat "$STATE" 2>/dev/null | jq -r '.receipts[-1].action // "MISSING"'
}

if [ "$(latest_action)" != "AUTHORIZE" ]; then
  echo "Scheduler release is not currently authorized." >&2
  exit 1
fi

gcloud scheduler jobs update http "$JOB" --project="$PROJECT" --location="$REGION" --message-body='{"canary":true}' --headers='Content-Type=application/json,x-cloudscheduler=true' >/dev/null
gcloud scheduler jobs run "$JOB" --project="$PROJECT" --location="$REGION" >/dev/null

attempt=0
while [ "$attempt" -lt 30 ]; do
  action="$(latest_action)"
  case "$action" in
    CANARY_PASS) break ;;
    CANARY_FAIL|REVOKE)
      gcloud scheduler jobs pause "$JOB" --project="$PROJECT" --location="$REGION" >/dev/null || true
      echo "Scheduler canary did not pass: $action" >&2
      exit 1
      ;;
  esac
  attempt=$((attempt + 1))
  sleep 2
done

if [ "$(latest_action)" != "CANARY_PASS" ]; then
  gcloud scheduler jobs pause "$JOB" --project="$PROJECT" --location="$REGION" >/dev/null || true
  echo "Scheduler canary timed out; job remains paused." >&2
  exit 1
fi

gcloud scheduler jobs update http "$JOB" --project="$PROJECT" --location="$REGION" --message-body='{}' --headers='Content-Type=application/json,x-cloudscheduler=true' >/dev/null
gcloud scheduler jobs resume "$JOB" --project="$PROJECT" --location="$REGION" >/dev/null
echo "Scheduler resumed after governed authorization and successful canary."
