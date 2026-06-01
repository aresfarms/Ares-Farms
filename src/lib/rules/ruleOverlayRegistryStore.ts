import { eq } from "drizzle-orm";

import {
  applications,
  overlayDefinitions,
  ruleDefinitions,
  ruleEvaluationRuns,
} from "@/db/schema";
import { db } from "@/lib/db";
import {
  resolveOverlays,
  type OverlayEffect,
  type OverlayRule,
  type OverlayTier,
} from "@/lib/runtime/overlayRuntime";

/**
 * Canonical Rule and Overlay Registry Runtime
 *
 * Master Volume Governance:
 * - Vol I: Preserves constitutional rule and overlay authority.
 * - Vol II: Keeps regulated eligibility, fair-lending, adverse-action,
 *   and human-review boundaries out of ungoverned heuristics.
 * - Vol III: Records replay-safe rule and overlay evaluation state.
 * - Vol IV: Supports operator review, escalation, exception handling,
 *   amendment review, and audit preparation.
 * - Vol V: Enforces rule versioning, overlay precedence, explainability,
 *   classification, replay, observability, and source authority.
 */

const GOVERNANCE_VERSION = "master-volumes-runtime-v0.1.0";
const CLASSIFICATION = "CONFIDENTIAL";
const REGISTRY_SOURCE = "rule-overlay-registry-runtime";

type CanonicalRule = {
  id: string;
  ruleName: string;
  ruleDomain: string;
  ruleType: string;
  ruleVersion: string;
  authorityLevel: string;
  decisionUse: string;
  metadata: Record<string, unknown>;
};

type CanonicalOverlay = {
  id: string;
  overlayName: string;
  overlayTier: OverlayTier;
  overlayScope: string;
  effect: OverlayEffect;
  priority: number;
  overlayVersion: string;
  ruleId: string;
  authorityLevel: string;
  rationale: string;
  metadata: Record<string, unknown>;
};

export type EvaluateRuleOverlayInput = {
  traceId: string;
  operation: string;
  subjectId?: string | null;
  applicationId?: string | null;
  borrowerId?: string | null;
  tenantId?: string | null;
  actorId?: string | null;
  requestedRuleIds?: string[];
  requestedOverlayIds?: string[];
  facts?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

export type RuleOverlayEvaluationResult = {
  application: typeof applications.$inferSelect | null;
  ruleEvaluation: typeof ruleEvaluationRuns.$inferSelect;
  rules: Array<typeof ruleDefinitions.$inferSelect>;
  overlays: Array<typeof overlayDefinitions.$inferSelect>;
  evaluation: Record<string, unknown>;
};

const CANONICAL_RULES: CanonicalRule[] = [
  {
    id: "RULE-REGULATED-DECISION-HUMAN-REVIEW",
    ruleName: "Regulated Decision Human Review Gate",
    ruleDomain: "governance",
    ruleType: "human_review_gate",
    ruleVersion: "rule-regulated-decision-human-review-v0.1.0",
    authorityLevel: "constitutional",
    decisionUse: "advisory_until_reviewed",
    metadata: {
      purpose:
        "All regulated decision outputs remain advisory until reviewed by authorized human workflow.",
    },
  },
  {
    id: "RULE-USDA-REGION-VERIFICATION",
    ruleName: "USDA Region Verification Gate",
    ruleDomain: "usda",
    ruleType: "source_verification",
    ruleVersion: "rule-usda-region-verification-v0.1.0",
    authorityLevel: "regulatory",
    decisionUse: "advisory_until_verified",
    metadata: {
      purpose:
        "USDA-related eligibility context requires governed region/source verification before reliance.",
    },
  },
  {
    id: "RULE-SBA-AGRICULTURAL-SCALE-REVIEW",
    ruleName: "SBA Agricultural Scale Review Gate",
    ruleDomain: "sba",
    ruleType: "program_review",
    ruleVersion: "rule-sba-agricultural-scale-review-v0.1.0",
    authorityLevel: "regulatory",
    decisionUse: "advisory_until_reviewed",
    metadata: {
      purpose:
        "SBA agricultural eligibility context requires program review before reliance.",
    },
  },
  {
    id: "RULE-ADVERSE-ACTION-NOTICE-GATE",
    ruleName: "Adverse Action Notice Gate",
    ruleDomain: "adverse_action",
    ruleType: "borrower_protection",
    ruleVersion: "rule-adverse-action-notice-gate-v0.1.0",
    authorityLevel: "regulatory",
    decisionUse: "blocked_until_workflow_exists",
    metadata: {
      purpose:
        "No output may be treated as adverse action until notice, reason-code, appeal, and human-review workflows exist.",
    },
  },
];

const CANONICAL_OVERLAYS: CanonicalOverlay[] = [
  {
    id: "OVERLAY-CONSTITUTIONAL-HUMAN-REVIEW",
    overlayName: "Constitutional Human Review Overlay",
    overlayTier: "constitutional",
    overlayScope: "regulated_decisioning",
    effect: "ESCALATE",
    priority: 1000,
    overlayVersion: "overlay-constitutional-human-review-v0.1.0",
    ruleId: "RULE-REGULATED-DECISION-HUMAN-REVIEW",
    authorityLevel: "constitutional",
    rationale:
      "Regulated borrower-impacting outputs must remain advisory until reviewed through an authorized human workflow.",
    metadata: {
      humanReviewRequired: true,
      advisoryOnly: true,
    },
  },
  {
    id: "OVERLAY-REGULATORY-SOURCE-VERIFICATION",
    overlayName: "Regulatory Source Verification Overlay",
    overlayTier: "regulatory",
    overlayScope: "external_source_reliance",
    effect: "CONSTRAIN",
    priority: 900,
    overlayVersion: "overlay-regulatory-source-verification-v0.1.0",
    ruleId: "RULE-USDA-REGION-VERIFICATION",
    authorityLevel: "regulatory",
    rationale:
      "USDA, SBA, and property-source context must be verified through governed source authority before regulatory reliance.",
    metadata: {
      sourceVerificationRequired: true,
      liveConnectorCertificationRequired: true,
    },
  },
  {
    id: "OVERLAY-REGULATORY-ADVERSE-ACTION-BLOCK",
    overlayName: "Regulatory Adverse Action Workflow Block",
    overlayTier: "regulatory",
    overlayScope: "adverse_action",
    effect: "ESCALATE",
    priority: 950,
    overlayVersion: "overlay-regulatory-adverse-action-block-v0.1.0",
    ruleId: "RULE-ADVERSE-ACTION-NOTICE-GATE",
    authorityLevel: "regulatory",
    rationale:
      "Potential adverse-action outputs must escalate until notice, reason-code, appeal, and human-review persistence exists.",
    metadata: {
      adverseActionWorkflowRequired: true,
      borrowerExplanationRequired: true,
    },
  },
];

function normalizeText(value: unknown): string | null {
  if (typeof value !== "string") {
    return value === null || value === undefined ? null : String(value);
  }

  const normalized = value.trim();

  return normalized.length > 0 ? normalized : null;
}

function normalizeIdList(ids?: string[]): string[] {
  if (!ids || ids.length === 0) {
    return [];
  }

  return ids
    .map((id) => normalizeText(id))
    .filter((id): id is string => Boolean(id));
}

function numericFact(facts: Record<string, unknown>, keys: string[]): number | null {
  for (const key of keys) {
    const value = facts[key];
    const numeric = Number(value);

    if (Number.isFinite(numeric)) {
      return numeric;
    }
  }

  return null;
}

function textFact(facts: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const normalized = normalizeText(facts[key]);

    if (normalized) {
      return normalized;
    }
  }

  return null;
}

async function loadApplication(applicationId?: string | null) {
  const normalizedApplicationId = normalizeText(applicationId);

  if (!normalizedApplicationId) {
    return null;
  }

  const rows = await db
    .select()
    .from(applications)
    .where(eq(applications.id, normalizedApplicationId))
    .limit(1);

  if (rows.length === 0) {
    throw new Error("Application not found for rule overlay evaluation.");
  }

  return rows[0];
}

async function upsertCanonicalRule(
  rule: CanonicalRule,
  traceId: string
): Promise<typeof ruleDefinitions.$inferSelect> {
  const now = new Date();
  const rows = await db
    .insert(ruleDefinitions)
    .values({
      id: rule.id,
      ruleName: rule.ruleName,
      ruleDomain: rule.ruleDomain,
      ruleType: rule.ruleType,
      ruleVersion: rule.ruleVersion,
      status: "ACTIVE",
      authorityLevel: rule.authorityLevel,
      decisionUse: rule.decisionUse,
      humanReviewRequired: true,
      governanceVersion: GOVERNANCE_VERSION,
      classification: CLASSIFICATION,
      replayRef: traceId,
      source: "Master Volume Series",
      metadata: rule.metadata,
      effectiveAt: now,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: ruleDefinitions.id,
      set: {
        ruleName: rule.ruleName,
        ruleDomain: rule.ruleDomain,
        ruleType: rule.ruleType,
        ruleVersion: rule.ruleVersion,
        status: "ACTIVE",
        authorityLevel: rule.authorityLevel,
        decisionUse: rule.decisionUse,
        humanReviewRequired: true,
        governanceVersion: GOVERNANCE_VERSION,
        classification: CLASSIFICATION,
        replayRef: traceId,
        source: "Master Volume Series",
        metadata: rule.metadata,
        updatedAt: now,
      },
    })
    .returning();

  return rows[0];
}

async function upsertCanonicalOverlay(
  overlay: CanonicalOverlay,
  traceId: string
): Promise<typeof overlayDefinitions.$inferSelect> {
  const now = new Date();
  const rows = await db
    .insert(overlayDefinitions)
    .values({
      id: overlay.id,
      overlayName: overlay.overlayName,
      overlayTier: overlay.overlayTier,
      overlayScope: overlay.overlayScope,
      effect: overlay.effect,
      priority: overlay.priority,
      overlayVersion: overlay.overlayVersion,
      status: "ACTIVE",
      ruleId: overlay.ruleId,
      authorityLevel: overlay.authorityLevel,
      rationale: overlay.rationale,
      governanceVersion: GOVERNANCE_VERSION,
      classification: CLASSIFICATION,
      replayRef: traceId,
      source: "Master Volume Series",
      metadata: overlay.metadata,
      effectiveAt: now,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: overlayDefinitions.id,
      set: {
        overlayName: overlay.overlayName,
        overlayTier: overlay.overlayTier,
        overlayScope: overlay.overlayScope,
        effect: overlay.effect,
        priority: overlay.priority,
        overlayVersion: overlay.overlayVersion,
        status: "ACTIVE",
        ruleId: overlay.ruleId,
        authorityLevel: overlay.authorityLevel,
        rationale: overlay.rationale,
        governanceVersion: GOVERNANCE_VERSION,
        classification: CLASSIFICATION,
        replayRef: traceId,
        source: "Master Volume Series",
        metadata: overlay.metadata,
        updatedAt: now,
      },
    })
    .returning();

  return rows[0];
}

function selectRules(
  requestedRuleIds: string[],
  rules: Array<typeof ruleDefinitions.$inferSelect>
) {
  if (requestedRuleIds.length === 0) {
    return rules;
  }

  const requested = new Set(requestedRuleIds);

  return rules.filter((rule) => requested.has(rule.id));
}

function selectOverlays(
  requestedOverlayIds: string[],
  overlays: Array<typeof overlayDefinitions.$inferSelect>
) {
  if (requestedOverlayIds.length === 0) {
    return overlays;
  }

  const requested = new Set(requestedOverlayIds);

  return overlays.filter((overlay) => requested.has(overlay.id));
}

function createFindings(
  facts: Record<string, unknown>,
  rules: Array<typeof ruleDefinitions.$inferSelect>
): string[] {
  const findings = [
    "Rule evaluation is advisory governance output only.",
    "Human review is required before regulatory, credit, eligibility, or adverse-action reliance.",
  ];
  const state = textFact(facts, ["state", "propertyState"]);
  const county = textFact(facts, ["county", "propertyCounty"]);
  const acreage = numericFact(facts, ["acreage", "acres"]);
  const revenue = numericFact(facts, ["revenue", "annualRevenue"]);
  const ruleIds = new Set(rules.map((rule) => rule.id));

  if (ruleIds.has("RULE-USDA-REGION-VERIFICATION")) {
    findings.push(
      state && county
        ? "USDA regional context is present but still requires governed source verification."
        : "USDA regional context is incomplete and requires verification before reliance."
    );
  }

  if (ruleIds.has("RULE-SBA-AGRICULTURAL-SCALE-REVIEW")) {
    findings.push(
      acreage !== null && acreage < 10
        ? "SBA agricultural scale context indicates review pressure; no eligibility conclusion is final."
        : "SBA agricultural scale context requires program review before reliance."
    );
  }

  if (ruleIds.has("RULE-ADVERSE-ACTION-NOTICE-GATE")) {
    findings.push(
      "Any denial, restriction, or materially adverse borrower outcome must wait for adverse-action workflow persistence."
    );
  }

  if (revenue !== null) {
    findings.push("Revenue was captured as context, not as a final eligibility determinant.");
  }

  return findings;
}

function toOverlayRules(
  overlays: Array<typeof overlayDefinitions.$inferSelect>,
  traceId: string
): OverlayRule[] {
  return overlays.map((overlay) => ({
    overlayId: overlay.id,
    tier: overlay.overlayTier as OverlayTier,
    effect: overlay.effect as OverlayEffect,
    priority: overlay.priority,
    version: overlay.overlayVersion,
    source: overlay.source ?? REGISTRY_SOURCE,
    rationale: overlay.rationale,
    replayRef: traceId,
    metadata:
      typeof overlay.metadata === "object" && overlay.metadata !== null
        ? (overlay.metadata as Record<string, unknown>)
        : {},
  }));
}

function resultStatus(effect: string): string {
  if (effect === "ESCALATE") {
    return "ESCALATED_FOR_HUMAN_REVIEW";
  }

  if (effect === "CONSTRAIN") {
    return "CONSTRAINED_PENDING_VERIFICATION";
  }

  return "ADVISORY_REVIEW_REQUIRED";
}

export async function persistRuleOverlayEvaluation(
  input: EvaluateRuleOverlayInput
): Promise<RuleOverlayEvaluationResult> {
  const application = await loadApplication(input.applicationId);
  const requestedRuleIds = normalizeIdList(input.requestedRuleIds);
  const requestedOverlayIds = normalizeIdList(input.requestedOverlayIds);
  const rules = await Promise.all(
    CANONICAL_RULES.map((rule) => upsertCanonicalRule(rule, input.traceId))
  );
  const overlays = await Promise.all(
    CANONICAL_OVERLAYS.map((overlay) => upsertCanonicalOverlay(overlay, input.traceId))
  );
  const selectedRules = selectRules(requestedRuleIds, rules);
  const selectedOverlays = selectOverlays(requestedOverlayIds, overlays);

  if (selectedRules.length === 0) {
    throw new Error("No governed rules were available for evaluation.");
  }

  if (selectedOverlays.length === 0) {
    throw new Error("No governed overlays were available for evaluation.");
  }

  const facts = input.facts ?? {};
  const findings = createFindings(facts, selectedRules);
  const overlayResolution = resolveOverlays({
    operation: input.operation,
    subjectId: input.subjectId ?? input.applicationId ?? null,
    overlays: toOverlayRules(selectedOverlays, input.traceId),
    traceId: input.traceId,
  });
  const finalEffect = overlayResolution.effect;
  const now = new Date();

  const evaluation = {
    advisoryOnly: true,
    humanReviewRequired: true,
    resultStatus: resultStatus(finalEffect),
    finalEffect,
    ruleIds: selectedRules.map((rule) => rule.id),
    overlayIds: selectedOverlays.map((overlay) => overlay.id),
    appliedOverlayId: overlayResolution.appliedOverlay?.overlayId ?? null,
    findings,
    overlayResolution,
  };

  const inserted = await db
    .insert(ruleEvaluationRuns)
    .values({
      operation: input.operation,
      subjectId: normalizeText(input.subjectId),
      applicationId: normalizeText(input.applicationId),
      borrowerId: normalizeText(input.borrowerId) ?? application?.borrowerId ?? null,
      tenantId: normalizeText(input.tenantId) ?? application?.tenantId ?? null,
      actorId: normalizeText(input.actorId),
      ruleIds: selectedRules.map((rule) => rule.id),
      overlayIds: selectedOverlays.map((overlay) => overlay.id),
      appliedOverlayId: overlayResolution.appliedOverlay?.overlayId ?? null,
      finalEffect,
      resultStatus: resultStatus(finalEffect),
      advisoryOnly: true,
      humanReviewRequired: true,
      inputSnapshot: facts,
      evaluationResult: evaluation,
      governanceVersion: GOVERNANCE_VERSION,
      classification: CLASSIFICATION,
      replayRef: input.traceId,
      traceId: input.traceId,
      source: REGISTRY_SOURCE,
      metadata: {
        ...(input.metadata ?? {}),
        registryRuntimeVersion: "rule-overlay-registry-runtime-v0.1.0",
        applicationFound: Boolean(application),
      },
      evaluatedAt: now,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return {
    application,
    ruleEvaluation: inserted[0],
    rules: selectedRules,
    overlays: selectedOverlays,
    evaluation,
  };
}
