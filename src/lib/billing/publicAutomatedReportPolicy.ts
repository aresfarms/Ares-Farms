/** Server-owned proof connecting one paid order to one frozen report. */
export const AUTOMATED_REPORT_BINDING_VERSION = "automated-report-binding-v1.0.0";
function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
const SHA256 = /^[a-f0-9]{64}$/;
export function verifiedAutomatedReportForOrder(order: {
  id: string; targetRef: string; productCode: string; fulfillmentMode: string;
  targetSnapshot: unknown; metadata: unknown;
}): boolean {
  const metadata = record(order.metadata);
  const artifact = record(metadata.reportArtifact);
  const binding = record(metadata.automatedReport);
  const snapshot = record(record(order.targetSnapshot).reportArtifact);
  return order.productCode === "focused_property_report" && order.fulfillmentMode === "AUTOMATED" &&
    binding.version === AUTOMATED_REPORT_BINDING_VERSION && binding.orderId === order.id &&
    binding.targetRef === order.targetRef && binding.artifactId === artifact.artifactId &&
    binding.evidenceSha256 === record(artifact.verification).evidenceSha256 &&
    SHA256.test(String(binding.evidenceSha256 ?? "")) && SHA256.test(String(binding.modelSha256 ?? "")) &&
    artifact.status === "VERIFIED" && artifact.expectedSha256 === artifact.verifiedSha256 &&
    SHA256.test(String(artifact.verifiedSha256 ?? "")) &&
    /^[0-9]+$/.test(String(artifact.storageGeneration ?? "")) &&
    artifact.mimeType === "application/pdf" && Number.isSafeInteger(artifact.byteSize) &&
    Number(artifact.byteSize) > 0 && Number(artifact.byteSize) <= 25 * 1024 * 1024 &&
    String(artifact.objectKey ?? "").startsWith(`public-orders/${order.id}/`) &&
    record(artifact.verification).malwareStatus === "clean" &&
    record(artifact.verification).structuralSafety === true &&
    snapshot.reference === artifact.artifactId && snapshot.digest === `sha256:${artifact.verifiedSha256}` &&
    typeof snapshot.generatedAt === "string" && Number.isFinite(Date.parse(snapshot.generatedAt));
}
