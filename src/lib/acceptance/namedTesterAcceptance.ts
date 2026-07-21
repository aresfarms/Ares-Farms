import { createHash, createHmac } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { runtimeStatePath } from "@/lib/property/runtimeStatePath";
import { readRequiredSecret } from "@/lib/security/requestGuards";

export const TARGET_REVISION = "furlong-core-00094-b5b";
export const TARGET_IMAGE_DIGEST = "sha256:10e00056b431a7a0d437698ca58f89d836f7242f88a2a89f5c45b63e93755ca6";
export const TARGET_APPLICATION_ID = "staging-p4-furlong-core-00094-b5b-application";
export const TESTERS = {
  "chudson@aresfarmsinc.com": "Caitlin Hudson",
  "stuart@aresfarmsinc.com": "Stuart Fraass",
} as const;
export type TesterEmail = keyof typeof TESTERS;
export type Verdict = "PASS" | "PASS_WITH_FINDINGS" | "FAIL";
export type Finding = { category: "USABILITY" | "GOVERNANCE" | "DATA" | "SECURITY"; severity: "LOW" | "MEDIUM" | "HIGH" | "BLOCKER"; summary: string; route?: string };
export type Attestation = { testerEmail: TesterEmail; testerName: string; targetRevision: string; targetImageDigest: string; targetApplicationId: string; verdict: Verdict; findings: Finding[]; attestedAtUtc: string; statement: string };
type Store = { schemaVersion: "p6-named-tester-acceptance-v1"; targetRevision: string; targetImageDigest: string; targetApplicationId: string; attestations: Partial<Record<TesterEmail, Attestation>> };

const filePath = () => runtimeStatePath("acceptance", `${TARGET_REVISION}-named-testers.json`);
function emptyStore(): Store { return { schemaVersion: "p6-named-tester-acceptance-v1", targetRevision: TARGET_REVISION, targetImageDigest: TARGET_IMAGE_DIGEST, targetApplicationId: TARGET_APPLICATION_ID, attestations: {} }; }
export function readStore(): Store { try { return JSON.parse(readFileSync(filePath(), "utf8")) as Store; } catch { return emptyStore(); } }
function writeStore(store: Store) { mkdirSync(path.dirname(filePath()), { recursive: true }); const temp = `${filePath()}.tmp-${process.pid}`; writeFileSync(temp, JSON.stringify(store, null, 2)); renameSync(temp, filePath()); }
export function normalizeTester(value: string | null): TesterEmail | null { const email = value?.trim().toLowerCase() ?? ""; return email in TESTERS ? email as TesterEmail : null; }
export function recordAttestation(input: { testerEmail: TesterEmail; verdict: Verdict; findings: Finding[] }): Attestation {
  if (input.verdict !== "PASS" && input.findings.length === 0) throw new Error("Findings are required unless the verdict is PASS.");
  const attestation: Attestation = { testerEmail: input.testerEmail, testerName: TESTERS[input.testerEmail], targetRevision: TARGET_REVISION, targetImageDigest: TARGET_IMAGE_DIGEST, targetApplicationId: TARGET_APPLICATION_ID, verdict: input.verdict, findings: input.findings, attestedAtUtc: new Date().toISOString(), statement: "I personally reviewed the named P6 staging workflow and this verdict is my own; I did not submit for the other named tester." };
  const store = readStore(); store.attestations[input.testerEmail] = attestation; writeStore(store); return attestation;
}
export function buildRollup() {
  const store = readStore(); const submitted = Object.values(store.attestations).filter(Boolean) as Attestation[];
  const complete = submitted.length === 2; const blockerClosed = complete && submitted.every((a) => a.verdict !== "FAIL");
  const body = { schemaVersion: "p6-named-tester-rollup-v1", targetRevision: TARGET_REVISION, targetImageDigest: TARGET_IMAGE_DIGEST, targetApplicationId: TARGET_APPLICATION_ID, submittedTesters: submitted.map((a) => a.testerEmail).sort(), attestations: submitted, p5Blocker: { id: "P5-B01", status: blockerClosed ? "CLOSED" : "OPEN" }, productionAuthorized: false, generatedAtUtc: new Date().toISOString() };
  const bytes = JSON.stringify(body); const digest = createHash("sha256").update(bytes).digest("hex"); const secret = readRequiredSecret("REPORT_SIGNING_SECRET");
  return { ...body, digest, signature: secret ? createHmac("sha256", secret).update(bytes).digest("base64url") : null, keyId: secret ? "REPORT_SIGNING_SECRET" : null };
}
