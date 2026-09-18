/**
 * Production startup boundary for synthetic fixtures.
 *
 * Staging deliberately supports obvious fake identities so the founder can
 * exercise the real workflow. Production must refuse to boot when either
 * synthetic-fixture switch is active; a hidden runtime fallback is not an
 * acceptable control for this boundary.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "edge") return;

  const environment =
    process.env.FURLONG_DEPLOYMENT_ENVIRONMENT?.trim().toLowerCase();
  if (environment !== "production") return;

  const enabled = [
    "SYNTHETIC_FIXTURES_ENABLED",
    "PROFESSIONAL_TEST_PERSONAS_ENABLED",
  ].filter((key) => process.env[key] === "true");

  if (enabled.length > 0) {
    throw new Error(
      `Production startup refused: synthetic test controls are enabled (${enabled.join(", ")}).`,
    );
  }
}
