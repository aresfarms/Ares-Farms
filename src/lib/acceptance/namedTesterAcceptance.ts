import { createHash, createHmac } from "node:crypto";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { readRequiredSecret } from "@/lib/security/requestGuards";

export const TARGET_REVISION = process.env.P6_NAMED_TESTER_TARGET_REVISION ?? "furlong-core-00107-6z7";
export const TARGET_IMAGE_DIGEST = process.env.P6_NAMED_TESTER_TARGET_IMAGE_DIGEST ?? "sha256:070a56b808ced75447266e4eeb3ff2819c0c423b1dc5608e065751f6145baf11";
export const TARGET_APPLICATION_ID = process.env.P6_NAMED_TESTER_TARGET_APPLICATION_ID ?? "staging-p4-furlong-core-00107-6z7-application";
export const TESTERS = {
  "chudson@aresfarmsinc.com": "Caitlin Hudson",
  "sfraas@aresfarmsinc.com": "Stuart Fraass",
} as const;
export type TesterEmail = keyof typeof TESTERS;
export type Verdict = "PASS" | "PASS_WITH_FINDINGS" | "FAIL";
export type Finding = { category: "USABILITY" | "GOVERNANCE" | "DATA" | "SECURITY"; severity: "LOW" | "MEDIUM" | "HIGH" | "BLOCKER"; summary: string; route?: string };
export type Attestation = { testerEmail: TesterEmail; testerName: string; targetRevision: string; targetImageDigest: string; targetApplicationId: string; verdict: Verdict; findings: Finding[]; attestedAtUtc: string; statement: string };
const memoryAttestations = new Map<TesterEmail, Attestation>();
export function normalizeTester(value: string | null): TesterEmail | null { const email = value?.trim().toLowerCase() ?? ""; return email in TESTERS ? email as TesterEmail : null; }
function requireDatabaseStore(): void { if (process.env.NAMED_TESTER_ACCEPTANCE_BACKEND !== "postgres" && process.env.NAMED_TESTER_ACCEPTANCE_BACKEND !== "memory-test") throw new Error("Named-tester acceptance is unavailable until its durable PostgreSQL store is configured."); }
export async function recordAttestation(input: { testerEmail: TesterEmail; verdict: Verdict; findings: Finding[] }): Promise<Attestation> {
  requireDatabaseStore();
  if (input.verdict !== "PASS" && input.findings.length === 0) throw new Error("Findings are required unless the verdict is PASS.");
  const attestation: Attestation = { testerEmail: input.testerEmail, testerName: TESTERS[input.testerEmail], targetRevision: TARGET_REVISION, targetImageDigest: TARGET_IMAGE_DIGEST, targetApplicationId: TARGET_APPLICATION_ID, verdict: input.verdict, findings: input.findings, attestedAtUtc: new Date().toISOString(), statement: "I personally reviewed the named P6 staging workflow and this verdict is my own; I did not submit for the other named tester." };
  if (process.env.NAMED_TESTER_ACCEPTANCE_BACKEND === "memory-test") { if (memoryAttestations.has(attestation.testerEmail)) throw new Error("This tester has already submitted an immutable attestation for the governed target."); memoryAttestations.set(attestation.testerEmail, attestation); return attestation; }
  const result = await db.execute(sql`INSERT INTO named_tester_attestations (target_revision,target_image_digest,target_application_id,tester_email,tester_name,verdict,findings,statement,attested_at_utc) VALUES (${attestation.targetRevision},${attestation.targetImageDigest},${attestation.targetApplicationId},${attestation.testerEmail},${attestation.testerName},${attestation.verdict},${JSON.stringify(attestation.findings)}::jsonb,${attestation.statement},${attestation.attestedAtUtc}::timestamptz) ON CONFLICT (target_revision,tester_email) DO NOTHING RETURNING tester_email`);
  if (!result.rows.length) throw new Error("This tester has already submitted an immutable attestation for the governed target.");
  return attestation;
}
export async function buildRollup() {
  requireDatabaseStore();
  if (process.env.NAMED_TESTER_ACCEPTANCE_BACKEND === "memory-test") return buildSignedRollup([...memoryAttestations.values()]);
  const result = await db.execute(sql`SELECT tester_email, tester_name, verdict, findings, statement, attested_at_utc FROM named_tester_attestations WHERE target_revision = ${TARGET_REVISION} ORDER BY tester_email`);
  const submitted = result.rows.map((row: any) => ({ testerEmail: row.tester_email as TesterEmail, testerName: row.tester_name, targetRevision: TARGET_REVISION, targetImageDigest: TARGET_IMAGE_DIGEST, targetApplicationId: TARGET_APPLICATION_ID, verdict: row.verdict as Verdict, findings: row.findings ?? [], attestedAtUtc: new Date(row.attested_at_utc).toISOString(), statement: row.statement })) as Attestation[];
  return buildSignedRollup(submitted);
}
function buildSignedRollup(submitted: Attestation[]) {
  const complete = submitted.length === 2; const blockerClosed = complete && submitted.every((a) => a.verdict !== "FAIL");
  const body = { schemaVersion: "p6-named-tester-rollup-v1", targetRevision: TARGET_REVISION, targetImageDigest: TARGET_IMAGE_DIGEST, targetApplicationId: TARGET_APPLICATION_ID, submittedTesters: submitted.map((a) => a.testerEmail).sort(), attestations: submitted, p5Blocker: { id: "P5-B01", status: blockerClosed ? "CLOSED" : "OPEN" }, productionAuthorized: false, generatedAtUtc: new Date().toISOString() };
  const bytes = JSON.stringify(body); const digest = createHash("sha256").update(bytes).digest("hex"); const secret = readRequiredSecret("REPORT_SIGNING_SECRET");
  return { ...body, digest, signature: secret ? createHmac("sha256", secret).update(bytes).digest("base64url") : null, keyId: secret ? "REPORT_SIGNING_SECRET" : null };
}
