#!/usr/bin/env bash
set -euo pipefail

PROJECT="${PROJECT:-furlong-staging-499102}"
BUCKET="${IAC_SOURCE_BUCKET:-${PROJECT}-iac-source}"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

stamp="$(date -u +%Y%m%dT%H%M%SZ)"
git_short="$(git rev-parse --short=12 HEAD)"
source_id="staging-${stamp}-${git_short}"
archive="/tmp/${source_id}.tgz"
object="sources/${source_id}.tgz"

terraform fmt -check -recursive infra/staging infra/governance
tar -czf "$archive" \
  --exclude='*/.terraform' \
  --exclude='*/.terraform/*' \
  --exclude='*.tfstate' \
  --exclude='*.tfstate.*' \
  infra/staging infra/governance infra/pipeline

if tar -tzf "$archive" | grep -E '(^|/)terraform\.tfstate|(^|/)\.terraform/' >/dev/null; then
  echo "FATAL: local Terraform state/provider cache entered controlled source" >&2
  exit 1
fi
sha="$(shasum -a 256 "$archive" | awk '{print $1}')"
gcloud storage cp "$archive" "gs://${BUCKET}/${object}" >/dev/null
generation="$(gcloud storage objects describe "gs://${BUCKET}/${object}" --format='value(generation)')"

mkdir -p artifacts/iac-source
cat > artifacts/iac-source/latest.json <<JSON
{
  "schemaVersion": "furlong-controlled-iac-source-v1",
  "projectId": "${PROJECT}",
  "bucket": "${BUCKET}",
  "object": "${object}",
  "generation": "${generation}",
  "sha256": "${sha}",
  "gitCommit": "$(git rev-parse HEAD)",
  "createdAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
JSON
cat artifacts/iac-source/latest.json
rm -f "$archive"