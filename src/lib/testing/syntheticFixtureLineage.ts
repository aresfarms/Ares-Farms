import {
  createHash,
  createHmac,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";

import {
  SYNTHETIC_FIXTURE_REGISTRY_VERSION,
  syntheticPersonaById,
  syntheticScenarioAllowed,
  type SyntheticProviderTarget,
  type SyntheticScenarioId,
} from "@/lib/testing/syntheticPersonaRegistry";

export const SYNTHETIC_FIXTURE_COOKIE = "furlong-synthetic-fixture" as const;
export const SYNTHETIC_FIXTURE_LINEAGE_VERSION =
  "synthetic-fixture-lineage-v1.0.0" as const;
export const SYNTHETIC_FIXTURE_SESSION_MAX_AGE_SECONDS = 4 * 60 * 60;

export type SyntheticFixtureEnvironment =
  "development" | "staging" | "sandbox" | "test";

export type SyntheticFixtureContext = Readonly<{
  testOnly: true;
  syntheticPersonaId: string;
  humanVisibleName: string;
  testRunId: string;
  fixtureVersion: string;
  registryVersion: typeof SYNTHETIC_FIXTURE_REGISTRY_VERSION;
  lineageVersion: typeof SYNTHETIC_FIXTURE_LINEAGE_VERSION;
  environment: SyntheticFixtureEnvironment;
  operatorIdentity: string;
  createdAt: string;
  scenarioId: SyntheticScenarioId;
  providerTargets: readonly SyntheticProviderTarget[];
}>;

export type BoundSyntheticFixtureLineage = SyntheticFixtureContext &
  Readonly<{
    recordType: string;
    recordId: string;
    lineageSha256: string;
  }>;

type SessionPayload = SyntheticFixtureContext & { exp: number };

function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, child]) => [key, stable(child)]),
    );
  }
  return value;
}

export function canonicalSyntheticFixtureJson(value: unknown): string {
  return JSON.stringify(stable(value));
}

export function deploymentEnvironment(
  env: NodeJS.ProcessEnv = process.env,
): "development" | "staging" | "production" | "sandbox" | "test" {
  const value = env.FURLONG_DEPLOYMENT_ENVIRONMENT?.trim().toLowerCase();
  if (
    value === "production" ||
    value === "staging" ||
    value === "sandbox" ||
    value === "test"
  ) {
    return value;
  }
  return "development";
}

export function syntheticFixtureRuntimeEnabled(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  const environment = deploymentEnvironment(env);
  if (environment === "production") return false;
  return (
    env.SYNTHETIC_FIXTURES_ENABLED === "true" ||
    env.PROFESSIONAL_TEST_PERSONAS_ENABLED === "true"
  );
}

export function normalizedOperatorIdentity(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (!normalized)
    throw new Error("Synthetic fixture operator identity is required.");
  return normalized.startsWith("user:") ? normalized : `user:${normalized}`;
}

export function allowedSyntheticFixtureOperators(
  env: NodeJS.ProcessEnv = process.env,
): ReadonlySet<string> {
  const configured = (
    env.SYNTHETIC_FIXTURE_OPERATOR_ALLOWLIST ?? "chudson@aresfarmsinc.com"
  )
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .map(normalizedOperatorIdentity);
  return new Set(configured);
}

export function syntheticFixtureOperatorMayActivate(
  operatorIdentity: string,
  syntheticPersonaId: string,
): boolean {
  const operator = normalizedOperatorIdentity(operatorIdentity);
  if (operator === "user:chudson@aresfarmsinc.com") return true;
  return (
    operator === "user:sfraas@aresfarmsinc.com" &&
    syntheticPersonaId === "syn-blue-moose-001"
  );
}

export function createSyntheticFixtureContext(input: {
  syntheticPersonaId: string;
  scenarioId: string;
  operatorIdentity: string;
  environment?: string | null;
  testRunId?: string | null;
  createdAt?: string | null;
  allowLegacyBackfill?: boolean;
}): SyntheticFixtureContext {
  const persona = syntheticPersonaById(input.syntheticPersonaId);
  if (!persona) throw new Error("Unknown synthetic persona id.");
  if (!syntheticScenarioAllowed(persona, input.scenarioId)) {
    throw new Error(
      "Synthetic persona is not authorized for the requested scenario.",
    );
  }
  if (
    persona.activationMode === "LEGACY_BACKFILL_ONLY" &&
    input.allowLegacyBackfill !== true
  ) {
    throw new Error(
      "Legacy synthetic persona is restricted to founder-authorized backfill.",
    );
  }
  const rawEnvironment = (input.environment ?? deploymentEnvironment())
    .trim()
    .toLowerCase();
  if (rawEnvironment === "production") {
    throw new Error("Synthetic fixtures are forbidden in production.");
  }
  if (!["development", "staging", "sandbox", "test"].includes(rawEnvironment)) {
    throw new Error("Synthetic fixture environment is invalid.");
  }
  const operatorIdentity = normalizedOperatorIdentity(input.operatorIdentity);
  if (
    !allowedSyntheticFixtureOperators().has(operatorIdentity) ||
    !syntheticFixtureOperatorMayActivate(
      operatorIdentity,
      persona.syntheticPersonaId,
    )
  ) {
    throw new Error(
      "Operator is not authorized to activate this synthetic persona.",
    );
  }
  const createdAt = input.createdAt?.trim() || new Date().toISOString();
  if (Number.isNaN(Date.parse(createdAt)))
    throw new Error("Synthetic fixture creation timestamp is invalid.");
  const testRunId =
    input.testRunId?.trim() ||
    `synth-${persona.syntheticPersonaId.replace(/^syn-/, "")}-${Date.now()}-${randomUUID().slice(0, 8)}`;
  if (!/^[a-zA-Z0-9:_-]{12,180}$/.test(testRunId)) {
    throw new Error("Synthetic fixture test-run id is invalid.");
  }
  return Object.freeze({
    testOnly: true,
    syntheticPersonaId: persona.syntheticPersonaId,
    humanVisibleName: persona.humanVisibleName,
    testRunId,
    fixtureVersion: persona.fixtureVersion,
    registryVersion: SYNTHETIC_FIXTURE_REGISTRY_VERSION,
    lineageVersion: SYNTHETIC_FIXTURE_LINEAGE_VERSION,
    environment: rawEnvironment as SyntheticFixtureEnvironment,
    operatorIdentity,
    createdAt,
    scenarioId: input.scenarioId as SyntheticScenarioId,
    providerTargets: [...persona.providerTargets],
  });
}

export function bindSyntheticFixtureLineage(
  context: SyntheticFixtureContext,
  recordType: string,
  recordId: string,
): BoundSyntheticFixtureLineage {
  const normalizedRecordType = recordType.trim();
  const normalizedRecordId = recordId.trim();
  if (!normalizedRecordType || !normalizedRecordId) {
    throw new Error("Synthetic fixture record type and id are required.");
  }
  const bound = {
    testOnly: true as const,
    syntheticPersonaId: context.syntheticPersonaId,
    humanVisibleName: context.humanVisibleName,
    testRunId: context.testRunId,
    fixtureVersion: context.fixtureVersion,
    registryVersion: context.registryVersion,
    lineageVersion: context.lineageVersion,
    environment: context.environment,
    operatorIdentity: context.operatorIdentity,
    createdAt: context.createdAt,
    scenarioId: context.scenarioId,
    providerTargets: [...context.providerTargets],
    recordType: normalizedRecordType,
    recordId: normalizedRecordId,
  };
  const lineageSha256 = createHash("sha256")
    .update(canonicalSyntheticFixtureJson(bound))
    .digest("hex");
  return Object.freeze({ ...bound, lineageSha256 });
}

export function assertSyntheticFixtureLineage(
  lineage: BoundSyntheticFixtureLineage,
): void {
  const rebound = bindSyntheticFixtureLineage(
    lineage,
    lineage.recordType,
    lineage.recordId,
  );
  if (rebound.lineageSha256 !== lineage.lineageSha256) {
    throw new Error("Synthetic fixture lineage hash mismatch.");
  }
  if (lineage.environment === ("production" as SyntheticFixtureEnvironment)) {
    throw new Error("Synthetic fixture lineage may not target production.");
  }
}

function hmac(body: string, secret: string): string {
  return createHmac("sha256", secret).update(body).digest("base64url");
}

export function issueSyntheticFixtureSessionToken(
  context: SyntheticFixtureContext,
  secret: string,
  maxAgeSeconds = SYNTHETIC_FIXTURE_SESSION_MAX_AGE_SECONDS,
): string {
  if (!secret.trim())
    throw new Error("Synthetic fixture session signing secret is required.");
  if (deploymentEnvironment() === "production") {
    throw new Error("Synthetic fixture sessions are forbidden in production.");
  }
  const payload: SessionPayload = {
    ...context,
    exp: Math.floor(Date.now() / 1000) + maxAgeSeconds,
  };
  const body = Buffer.from(
    canonicalSyntheticFixtureJson(payload),
    "utf8",
  ).toString("base64url");
  return `${body}.${hmac(body, secret)}`;
}

export function verifySyntheticFixtureSessionToken(
  token: string | null | undefined,
  secret: string,
  expectedOperatorIdentity?: string | null,
): SyntheticFixtureContext | null {
  try {
    if (!token || !secret.trim()) return null;
    const [body, signature] = token.split(".");
    if (!body || !signature) return null;
    const expected = hmac(body, secret);
    const actualBytes = Buffer.from(signature, "utf8");
    const expectedBytes = Buffer.from(expected, "utf8");
    if (
      actualBytes.length !== expectedBytes.length ||
      !timingSafeEqual(actualBytes, expectedBytes)
    )
      return null;
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    ) as SessionPayload;
    if (!payload.testOnly || payload.exp < Math.floor(Date.now() / 1000))
      return null;
    const rebuilt = createSyntheticFixtureContext({
      syntheticPersonaId: payload.syntheticPersonaId,
      scenarioId: payload.scenarioId,
      operatorIdentity: payload.operatorIdentity,
      environment: payload.environment,
      testRunId: payload.testRunId,
      createdAt: payload.createdAt,
    });
    const currentEnvironment = deploymentEnvironment();
    if (
      currentEnvironment === "production" ||
      (currentEnvironment !== "development" &&
        rebuilt.environment !== currentEnvironment)
    ) {
      return null;
    }
    if (
      expectedOperatorIdentity &&
      rebuilt.operatorIdentity !==
        normalizedOperatorIdentity(expectedOperatorIdentity)
    ) {
      return null;
    }
    return rebuilt;
  } catch {
    return null;
  }
}

export function syntheticFixtureContextFromBoundLineage(
  value: unknown,
): SyntheticFixtureContext | null {
  try {
    if (!value || typeof value !== "object" || Array.isArray(value))
      return null;
    const record = value as Record<string, unknown>;
    const text = (key: string) =>
      typeof record[key] === "string" ? String(record[key]) : "";
    const context = createSyntheticFixtureContext({
      syntheticPersonaId: text("syntheticPersonaId"),
      scenarioId: text("scenarioId"),
      operatorIdentity: text("operatorIdentity"),
      environment: text("environment"),
      testRunId: text("testRunId"),
      createdAt: text("createdAt"),
    });
    const recordType = text("recordType");
    const recordId = text("recordId");
    const lineageSha256 = text("lineageSha256");
    if (!recordType || !recordId || !lineageSha256) return null;
    const rebound = bindSyntheticFixtureLineage(context, recordType, recordId);
    return rebound.lineageSha256 === lineageSha256 ? context : null;
  } catch {
    return null;
  }
}

export type SyntheticStripeMethodExpectation =
  "card" | "apple_pay" | "google_pay" | null;

export function expectedStripeMethodForSyntheticScenario(
  scenarioId: string | null | undefined,
): SyntheticStripeMethodExpectation {
  if (scenarioId === "stripe-card" || scenarioId === "negative-payment-risk") {
    return "card";
  }
  if (scenarioId === "stripe-apple-pay") return "apple_pay";
  if (scenarioId === "stripe-google-pay") return "google_pay";
  return null;
}

export function syntheticStripeMethodMatches(
  scenarioId: string | null | undefined,
  walletType: string | null | undefined,
): boolean {
  const expected = expectedStripeMethodForSyntheticScenario(scenarioId);
  if (!expected) return true;
  if (expected === "card") return !walletType;
  return walletType === expected;
}

export function syntheticFixtureProviderMetadata(
  context: SyntheticFixtureContext,
): Record<string, string> {
  return {
    syntheticTest: "true",
    syntheticPersonaId: context.syntheticPersonaId,
    syntheticTestRunId: context.testRunId,
    syntheticFixtureVersion: context.fixtureVersion,
    syntheticRegistryVersion: context.registryVersion,
    syntheticEnvironment: context.environment,
    syntheticOperatorIdentity: context.operatorIdentity,
    syntheticCreatedAt: context.createdAt,
    syntheticScenarioId: context.scenarioId,
  };
}

export function syntheticFixtureContextFromProviderMetadata(
  metadata: Record<string, unknown> | null | undefined,
): SyntheticFixtureContext | null {
  if (!metadata || metadata.syntheticTest !== "true") return null;
  const currentEnvironment = deploymentEnvironment();
  if (currentEnvironment === "production") {
    throw new Error("Synthetic provider metadata is forbidden in production.");
  }
  const text = (key: string) =>
    typeof metadata[key] === "string" ? String(metadata[key]) : "";
  const context = createSyntheticFixtureContext({
    syntheticPersonaId: text("syntheticPersonaId"),
    scenarioId: text("syntheticScenarioId"),
    operatorIdentity: text("syntheticOperatorIdentity"),
    environment: text("syntheticEnvironment"),
    testRunId: text("syntheticTestRunId"),
    createdAt: text("syntheticCreatedAt"),
  });
  if (
    currentEnvironment !== "development" &&
    context.environment !== currentEnvironment
  ) {
    throw new Error(
      "Synthetic provider metadata crossed environment boundaries.",
    );
  }
  return context;
}
