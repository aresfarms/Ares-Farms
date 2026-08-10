/**
 * Canonical synthetic-persona registry.
 *
 * Human-visible names are deliberately unmistakable. Authorization never relies
 * on the name: immutable fixture lineage carries the technical boundary.
 */

export const SYNTHETIC_FIXTURE_REGISTRY_VERSION =
  "synthetic-fixture-registry-v1.0.0" as const;

export type SyntheticScenarioId =
  | "professional-lender"
  | "professional-attorney"
  | "professional-auditor"
  | "professional-sponsor"
  | "lender-intake"
  | "lender-proforma-review"
  | "lender-document-upload"
  | "lender-signature"
  | "lender-dispatch-sandbox"
  | "plaid-link"
  | "plaid-account-ownership"
  | "stripe-card"
  | "stripe-apple-pay"
  | "stripe-google-pay"
  | "stripe-connect-allocation"
  | "negative-payment-risk"
  | "identity-recovery"
  | "full-lender-lifecycle";

export type SyntheticProviderTarget =
  | "PLAID_SANDBOX"
  | "STRIPE_TEST_CARD"
  | "STRIPE_TEST_APPLE_PAY"
  | "STRIPE_TEST_GOOGLE_PAY"
  | "STRIPE_CONNECT_TEST"
  | "LENDER_SANDBOX_ADAPTER"
  | "GOOGLE_CALENDAR_TEST"
  | "SIGNATURE_OFFLINE_TEST";

export type SyntheticPersonaDefinition = Readonly<{
  syntheticPersonaId: string;
  humanVisibleName: string;
  fixtureVersion: string;
  purpose: string;
  scenarioIds: readonly SyntheticScenarioId[];
  providerTargets: readonly SyntheticProviderTarget[];
}>;

export const SYNTHETIC_PERSONAS: readonly SyntheticPersonaDefinition[] = [
  {
    syntheticPersonaId: "syn-pocohantus-smith-001",
    humanVisibleName: "Pocohantus Smith",
    fixtureVersion: "pocohantus-smith-v1.0.0",
    purpose: "Professional-access lane and least-privilege boundary testing.",
    scenarioIds: [
      "professional-lender",
      "professional-attorney",
      "professional-auditor",
      "professional-sponsor",
    ],
    providerTargets: [],
  },
  {
    syntheticPersonaId: "syn-tree-frog-001",
    humanVisibleName: "Tree Frog",
    fixtureVersion: "tree-frog-v1.0.0",
    purpose:
      "Stuart broker intake, pro forma, document, signature, and delivery testing.",
    scenarioIds: [
      "lender-intake",
      "lender-proforma-review",
      "lender-document-upload",
      "lender-signature",
      "lender-dispatch-sandbox",
    ],
    providerTargets: [
      "LENDER_SANDBOX_ADAPTER",
      "GOOGLE_CALENDAR_TEST",
      "SIGNATURE_OFFLINE_TEST",
    ],
  },
  {
    syntheticPersonaId: "syn-tuna-fish-001",
    humanVisibleName: "Tuna Fish",
    fixtureVersion: "tuna-fish-v1.0.0",
    purpose: "Plaid and Stripe end-to-end payment and ownership testing.",
    scenarioIds: [
      "lender-intake",
      "plaid-link",
      "plaid-account-ownership",
      "stripe-card",
      "stripe-apple-pay",
      "stripe-google-pay",
      "stripe-connect-allocation",
    ],
    providerTargets: [
      "PLAID_SANDBOX",
      "STRIPE_TEST_CARD",
      "STRIPE_TEST_APPLE_PAY",
      "STRIPE_TEST_GOOGLE_PAY",
      "STRIPE_CONNECT_TEST",
    ],
  },
  {
    syntheticPersonaId: "syn-purple-cow-001",
    humanVisibleName: "Purple Cow",
    fixtureVersion: "purple-cow-v1.0.0",
    purpose:
      "Negative-control, fraud hold, mismatch, and recovery-path testing.",
    scenarioIds: [
      "negative-payment-risk",
      "identity-recovery",
      "lender-intake",
    ],
    providerTargets: ["PLAID_SANDBOX", "STRIPE_TEST_CARD"],
  },
  {
    syntheticPersonaId: "syn-rainbow-trout-001",
    humanVisibleName: "Rainbow Trout",
    fixtureVersion: "rainbow-trout-v1.0.0",
    purpose: "Positive full lender lifecycle and reconciliation testing.",
    scenarioIds: [
      "full-lender-lifecycle",
      "lender-intake",
      "lender-proforma-review",
      "lender-document-upload",
      "lender-signature",
      "lender-dispatch-sandbox",
    ],
    providerTargets: [
      "LENDER_SANDBOX_ADAPTER",
      "GOOGLE_CALENDAR_TEST",
      "SIGNATURE_OFFLINE_TEST",
    ],
  },
] as const;

export function syntheticPersonaById(
  syntheticPersonaId: string | null | undefined,
): SyntheticPersonaDefinition | null {
  const id = syntheticPersonaId?.trim();
  if (!id) return null;
  return (
    SYNTHETIC_PERSONAS.find((persona) => persona.syntheticPersonaId === id) ??
    null
  );
}

export function syntheticPersonaByHumanVisibleName(
  name: string | null | undefined,
): SyntheticPersonaDefinition | null {
  const normalized = name?.trim().toLowerCase();
  if (!normalized) return null;
  return (
    SYNTHETIC_PERSONAS.find(
      (persona) => persona.humanVisibleName.toLowerCase() === normalized,
    ) ?? null
  );
}

export function syntheticScenarioAllowed(
  persona: SyntheticPersonaDefinition,
  scenarioId: string,
): scenarioId is SyntheticScenarioId {
  return persona.scenarioIds.includes(scenarioId as SyntheticScenarioId);
}
