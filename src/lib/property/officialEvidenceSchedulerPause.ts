import type { SchedulerResumeEvidence } from "./officialEvidencePostResumeWatchdog";

async function metadataToken(): Promise<string> {
  const response = await fetch(
    "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token",
    {
      headers: { "Metadata-Flavor": "Google" },
      cache: "no-store",
    },
  );
  if (!response.ok)
    throw new Error(`Metadata token request failed with ${response.status}.`);
  const body = (await response.json()) as { access_token?: string };
  if (!body.access_token)
    throw new Error("Metadata token response did not include an access token.");
  return body.access_token;
}
export async function pauseEvidenceRecomputationScheduler(
  evidence: SchedulerResumeEvidence,
): Promise<void> {
  const token = await metadataToken();
  const url = `https://cloudscheduler.googleapis.com/v1/projects/${encodeURIComponent(evidence.project)}/locations/${encodeURIComponent(evidence.region)}/jobs/${encodeURIComponent(evidence.job)}:pause`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: "{}",
  });
  if (!response.ok)
    throw new Error(
      `Cloud Scheduler pause failed with ${response.status}: ${await response.text()}`,
    );
}
