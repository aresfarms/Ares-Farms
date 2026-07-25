#!/bin/sh
set -eu
PROJECT="${PROJECT:-furlong-staging-499102}"
REGION="${REGION:-us-central1}"
JOB="${JOB:-furlong-evidence-recomputation}"
BUCKET="${BUCKET:-${PROJECT}-runtime-state}"
STATE="gs://${BUCKET}/official-evidence/recomputation-scheduler-release.json"
TRANSCRIPTS="gs://${BUCKET}/official-evidence/canary-execution-transcripts.json"
RESUME_DIR="gs://${BUCKET}/official-evidence/scheduler-resume-evidence"

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

release_run="$(gcloud storage cat "$STATE" | jq -r '.receipts[-1].canaryRunId // empty')"
transcript="$(gcloud storage cat "$TRANSCRIPTS" | jq -c --arg run "$release_run" '[.[] | select(.canaryRunId == $run and .status == "PASSED")][-1] // empty')"
if [ -z "$release_run" ] || [ -z "$transcript" ]; then
  gcloud scheduler jobs pause "$JOB" --project="$PROJECT" --location="$REGION" >/dev/null || true
  echo "Matching passed canary transcript is missing; job remains paused." >&2
  exit 1
fi
final_packet="$(printf '%s' "$transcript" | jq -r '.finalPacketId')"
resume_uri="${RESUME_DIR}/${release_run}.json"
if gcloud storage ls "$resume_uri" >/dev/null 2>&1; then
  echo "Resume evidence already exists for this canary run." >&2
  exit 1
fi

gcloud scheduler jobs update http "$JOB" --project="$PROJECT" --location="$REGION" --message-body='{}' --headers='Content-Type=application/json,x-cloudscheduler=true' >/dev/null
gcloud scheduler jobs resume "$JOB" --project="$PROJECT" --location="$REGION" >/dev/null
state="$(gcloud scheduler jobs describe "$JOB" --project="$PROJECT" --location="$REGION" --format='value(state)')"
now="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
tmp="$(mktemp)"
jq -n --arg project "$PROJECT" --arg region "$REGION" --arg job "$JOB" --arg run "$release_run" --arg packet "$final_packet" --arg at "$now" --arg state "$state" '{project:$project,region:$region,job:$job,canaryRunId:$run,finalPacketId:$packet,resumedAt:$at,schedulerState:$state}' > "$tmp"
gcloud storage cp "$tmp" "$resume_uri" >/dev/null
rm -f "$tmp"
echo "Scheduler resumed after governed authorization and matching canary transcript."
