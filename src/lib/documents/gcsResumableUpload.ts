/**
 * gcsResumableUpload — real byte custody for the sovereign upload link
 * (founder direction 2026-08-05), with ZERO new dependencies.
 *
 * Pattern: the API runtime never touches file bytes (documentStore doctrine).
 * Instead, the Cloud Run service account initiates a GCS *resumable upload
 * session* for the governed object key via the metadata-server token, and
 * hands the session URI to the borrower's browser, which PUTs the bytes
 * straight to Google Cloud Storage over TLS. The session URI is single-object,
 * write-only, and expires; it grants no read or list capability on anything.
 * At rest, GCS encrypts by default; the bucket is IAM-private (no public
 * access, uniform bucket-level access) per the terraform definition.
 *
 * Environments without a metadata server or bucket (local dev) return null
 * and the flow degrades honestly to metadata-only custody with status
 * PENDING_PROVIDER_CONFIGURATION — never a fake success.
 */

const METADATA_TOKEN_URL =
  "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token";

export const DOCUMENT_STORAGE_PROVIDER = "gcs-resumable-v1";

export function documentStorageBucket(): string | null {
  const bucket = process.env.DOCUMENT_STORAGE_BUCKET;
  return bucket && bucket.trim() ? bucket.trim() : null;
}

async function serviceAccountToken(): Promise<string | null> {
  try {
    const res = await fetch(METADATA_TOKEN_URL, {
      headers: { "Metadata-Flavor": "Google" },
      signal: AbortSignal.timeout(3_000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { access_token?: string };
    return data.access_token ?? null;
  } catch {
    return null;
  }
}

/**
 * Initiate a resumable upload session for one governed object. Returns the
 * browser-usable session URI, or null when the provider is not configured
 * in this environment (dev) — callers must degrade honestly.
 */
export async function initResumableUpload(args: {
  objectKey: string;
  mimeType: string | null;
  originForCors: string | null;
}): Promise<string | null> {
  const bucket = documentStorageBucket();
  if (!bucket) return null;
  const token = await serviceAccountToken();
  if (!token) return null;
  try {
    const url =
      `https://storage.googleapis.com/upload/storage/v1/b/${encodeURIComponent(bucket)}/o` +
      `?uploadType=resumable&name=${encodeURIComponent(args.objectKey)}`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json; charset=UTF-8",
        "X-Upload-Content-Type": args.mimeType ?? "application/octet-stream",
        ...(args.originForCors ? { Origin: args.originForCors } : {}),
      },
      body: JSON.stringify({
        contentType: args.mimeType ?? "application/octet-stream",
        metadata: { governed: "true", classification: "CONFIDENTIAL" },
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return null;
    return res.headers.get("location");
  } catch {
    return null;
  }
}
