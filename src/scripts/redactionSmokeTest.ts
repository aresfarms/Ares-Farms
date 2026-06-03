import { buildPublicSurfaceGatewayPayload } from "@/lib/dto/public";

/**
 * Public Redaction Smoke Test
 *
 * Verifies that public DTO payloads do not expose raw backend records, direct
 * identifiers, PII-like values, sovereign leakage, or internal-only module
 * manifests.
 */

const prohibitedKeys = [
  "borrower_id",
  "tenant_id",
  "application_id",
  "property_id",
  "ssn",
  "tax_id",
  "ein",
  "permissions",
  "dataDependencies",
  "eventsPublished",
  "eventsConsumed",
];

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function main() {
  const payload = buildPublicSurfaceGatewayPayload();
  const serialized = JSON.stringify(payload);

  for (const key of prohibitedKeys) {
    assert(
      !serialized.includes(`"${key}"`),
      `Public payload exposes prohibited key: ${key}`
    );
  }

  assert(
    !/[0-9]{3}-[0-9]{2}-[0-9]{4}/.test(serialized),
    "Public payload appears to contain an SSN-like value."
  );
  assert(
    payload.surfaces.every((surface) => !surface.audience.includes("internal")),
    "Public payload must not expose internal-only manifests."
  );
  assert(
    payload.surfaces.every((surface) => surface.productionBlocked),
    "Public payload must keep production block posture visible."
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        checkedAt: new Date().toISOString(),
        surfaceCount: payload.surfaces.length,
        prohibitedKeysChecked: prohibitedKeys.length,
        message: "Public redaction smoke test passed.",
      },
      null,
      2
    )
  );
}

main();
