import { signatureCanonicalJson, signatureSha256 } from "../canonical";

export const MOCK_SIGNATURE_ADAPTER = {
  id: "signature-mock-v1", mode: "OFFLINE_TEST", networkAllowed: false, productionCertified: false,
} as const;

export type MockSignatureCapture = { adapterId: typeof MOCK_SIGNATURE_ADAPTER.id; mode: "OFFLINE_TEST"; captureId: string; evidenceSha256: string };

export function captureMockSignature(input: { executionId: string; documentSha256: string; signerName: string; capacity: string; authorizedAt: string }): MockSignatureCapture {
  const evidenceSha256 = signatureSha256(signatureCanonicalJson(input));
  return { adapterId: MOCK_SIGNATURE_ADAPTER.id, mode: "OFFLINE_TEST", captureId: `mock-${evidenceSha256.slice(0, 24)}`, evidenceSha256 };
}
