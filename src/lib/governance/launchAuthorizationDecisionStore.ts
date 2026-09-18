import { createHash, createHmac } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { runtimeStatePath } from "@/lib/property/runtimeStatePath";
import { readRequiredSecret } from "@/lib/security/requestGuards";
import { launchAuthorizationRequirements, type HumanDecision } from "@/lib/governance/consolidatedLaunchAuthorizationLedger";
import { launchAuthorityAssignmentFor } from "@/lib/governance/launchAuthorityAssignmentRegistry";

export type RecordedLaunchDecision = {
  blockerId: string; authorityRole: string; decision: Exclude<HumanDecision, "PENDING">;
  decidedBy: string; decidedAtUtc: string; conditions: string[]; evidenceRef: string;
  statement: string;
};
export type StagingLaunchTestOverride = {
  blockerId: string; authorityRole: string; overriddenBy: string; overriddenAtUtc: string;
  expiresAtUtc: string; evidenceRef: string; statement: string;
};
type Store = { schemaVersion: "p6-launch-authorization-decisions-v1"; decisions: RecordedLaunchDecision[]; testOverrides?: StagingLaunchTestOverride[] };
const storePath = () => runtimeStatePath("governance", "launch-authorization-decisions.json");
const emptyStore = (): Store => ({ schemaVersion: "p6-launch-authorization-decisions-v1", decisions: [], testOverrides: [] });
export function readLaunchDecisionStore(): Store { try { return JSON.parse(readFileSync(storePath(), "utf8")) as Store; } catch { return emptyStore(); } }
function writeStore(store: Store) { mkdirSync(path.dirname(storePath()), { recursive: true }); const temp = `${storePath()}.tmp-${process.pid}`; writeFileSync(temp, JSON.stringify(store, null, 2)); renameSync(temp, storePath()); }

function assignments(): Record<string, string[]> {
  const defaults: Record<string, string[]> = {};
  for (const requirement of launchAuthorizationRequirements) {
    for (const role of requirement.authorityRoles) {
      const assignment = launchAuthorityAssignmentFor(role);
      if (assignment?.status === "ASSIGNED") {
        defaults[role] = [...assignment.identities];
      }
    }
  }
  try {
    const configured = JSON.parse(
      process.env.LAUNCH_AUTHORITY_ASSIGNMENTS_JSON ?? "{}"
    ) as Record<string, unknown>;
    for (const [role, values] of Object.entries(configured)) {
      if (!Array.isArray(values)) continue;
      defaults[role] = values
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean);
    }
  } catch {
    // Invalid runtime overrides fail closed to the governed registry.
  }
  return defaults;
}
export function actorMayDecide(email: string, authorityRole: string): boolean { return assignments()[authorityRole]?.includes(email.trim().toLowerCase()) ?? false; }
const STAGING_PROJECT = "furlong-staging-499102";
export function actorMayUseStagingUltimateAuthority(email: string, env: NodeJS.ProcessEnv = process.env): boolean {
  const enabled = env.LAUNCH_TEST_ULTIMATE_AUTHORITY_ENABLED === "true";
  const project = env.GOOGLE_CLOUD_PROJECT ?? env.GCLOUD_PROJECT ?? "";
  const allowed = (env.LAUNCH_TEST_ULTIMATE_AUTHORITY_EMAILS ?? "")
    .split(",").map((value) => value.trim().toLowerCase()).filter(Boolean);
  return enabled && project === STAGING_PROJECT && allowed.includes(email.trim().toLowerCase());
}
export function recordStagingUltimateAuthorityOverrides(input: { decidedBy: string; evidenceRef: string; ttlMinutes?: number }) {
  if (!actorMayUseStagingUltimateAuthority(input.decidedBy)) throw new Error("Staging ultimate-authority override is not enabled for this identity.");
  const ttl = Math.min(1440, Math.max(5, input.ttlMinutes ?? 480));
  const now = new Date();
  const expiresAtUtc = new Date(now.getTime() + ttl * 60_000).toISOString();
  const overrides = launchAuthorizationRequirements.flatMap((requirement) => requirement.authorityRoles.map((authorityRole) => ({
    blockerId: requirement.blockerId, authorityRole, overriddenBy: input.decidedBy.trim().toLowerCase(),
    overriddenAtUtc: now.toISOString(), expiresAtUtc, evidenceRef: input.evidenceRef.trim() || "staging-ultimate-authority-test",
    statement: "STAGING TEST OVERRIDE ONLY. This is not a genuine authority approval and cannot authorize production launch.",
  })));
  const store = readLaunchDecisionStore(); store.testOverrides = overrides; writeStore(store); return overrides;
}

export function recordLaunchDecision(input: Omit<RecordedLaunchDecision, "decidedAtUtc" | "statement">): RecordedLaunchDecision {
  const requirement = launchAuthorizationRequirements.find((x) => x.blockerId === input.blockerId && (x.authorityRoles as readonly string[]).includes(input.authorityRole));
  if (!requirement) throw new Error("Unknown blocker and authority role combination.");
  if (!actorMayDecide(input.decidedBy, input.authorityRole)) throw new Error("Authenticated identity is not assigned to this authority role.");
  if (input.decision === "APPROVE_WITH_CONDITIONS" && input.conditions.length === 0) throw new Error("Conditional approval requires at least one condition.");
  if (!input.evidenceRef.trim()) throw new Error("An evidence reference is required.");
  const decision: RecordedLaunchDecision = { ...input, decidedBy: input.decidedBy.toLowerCase(), decidedAtUtc: new Date().toISOString(), statement: "I personally made this decision within my assigned authority role; no proxy submitted it for me." };
  const store = readLaunchDecisionStore();
  store.decisions = store.decisions.filter((x) => !(x.blockerId === decision.blockerId && x.authorityRole === decision.authorityRole));
  store.decisions.push(decision); writeStore(store); return decision;
}
export function buildLaunchDecisionRollup() {
  const store = readLaunchDecisionStore();
  const slots = launchAuthorizationRequirements.flatMap((requirement) =>
    requirement.authorityRoles.map((authorityRole) => ({
      blockerId: requirement.blockerId,
      title: requirement.title,
      authorityRole,
      assignment: launchAuthorityAssignmentFor(authorityRole),
      testOverride: (store.testOverrides ?? []).find((override) => override.blockerId === requirement.blockerId && override.authorityRole === authorityRole && Date.parse(override.expiresAtUtc) > Date.now()) ?? null,
      decision:
        store.decisions.find(
          (decision) =>
            decision.blockerId === requirement.blockerId &&
            decision.authorityRole === authorityRole
        ) ?? null,
    }))
  );
  const approvalsComplete = slots.every((s) => s.decision && ["APPROVE", "APPROVE_WITH_CONDITIONS"].includes(s.decision.decision));
  const testApprovalsComplete = slots.every((s) => Boolean(s.testOverride) || Boolean(s.decision && ["APPROVE", "APPROVE_WITH_CONDITIONS"].includes(s.decision.decision)));
  const rejected = slots.some((s) => s.decision?.decision === "REJECT");
  const body = { schemaVersion: "p6-launch-authorization-rollup-v1", slots, required: slots.length, completed: slots.filter((s) => s.decision).length, approvalsComplete, testApprovalsComplete, testOverrideCount: slots.filter((s) => s.testOverride).length, rejected, finalLaunchHoldReleased: false, productionAuthorized: false, generatedAtUtc: new Date().toISOString() };
  const bytes = JSON.stringify(body); const digest = createHash("sha256").update(bytes).digest("hex"); const secret = readRequiredSecret("REPORT_SIGNING_SECRET");
  return { ...body, digest, signature: secret ? createHmac("sha256", secret).update(bytes).digest("base64url") : null };
}
