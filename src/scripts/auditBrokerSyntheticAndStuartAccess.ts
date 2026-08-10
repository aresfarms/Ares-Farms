import { and, eq, inArray, isNull, sql } from "drizzle-orm";

import {
  accessSecurityStates,
  serviceRequests,
  syntheticFixtureLineageRecords,
  users,
  webauthnCredentials,
} from "@/db/schema";
import {
  canOperateLenderDesk,
  internalLenderDeskRole,
  operatorByEmail,
} from "@/lib/auth/operatorRegistry";
import { professionalByEmail } from "@/lib/auth/professionalRegistry";
import { db } from "@/lib/db";
import {
  SYNTHETIC_PERSONAS,
  syntheticPersonaByHumanVisibleName,
} from "@/lib/testing/syntheticPersonaRegistry";

const STUART_EMAIL = "sfraas@aresfarmsinc.com";
const FIXTURE_OPERATOR_EMAIL = "chudson@aresfarmsinc.com";
const STRICT = process.argv.includes("--strict");

function iso(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null;
}

async function main() {
  const relation = await db.execute(sql`
    select to_regclass('public.synthetic_fixture_lineage_records') as relation
  `);
  const relationRows =
    (
      relation as unknown as {
        rows?: Array<{ relation?: string | null }>;
      }
    ).rows ?? [];
  if (!relationRows[0]?.relation) {
    console.log(
      JSON.stringify(
        {
          ok: false,
          migration0053Applied: false,
          error: "synthetic_fixture_lineage_records is not present",
        },
        null,
        2,
      ),
    );
    process.exitCode = 2;
    return;
  }

  const financing = await db
    .select({
      serviceRequestId: serviceRequests.serviceRequestId,
      contactName: serviceRequests.contactName,
      contactEmail: serviceRequests.contactEmail,
      status: serviceRequests.status,
      createdAt: serviceRequests.createdAt,
      occurredAt: serviceRequests.occurredAt,
    })
    .from(serviceRequests)
    .where(eq(serviceRequests.requestType, "financing_deal_intake"));

  const candidateRecords = financing.filter(
    (row) =>
      Boolean(syntheticPersonaByHumanVisibleName(row.contactName)) ||
      row.contactEmail?.trim().toLowerCase() === FIXTURE_OPERATOR_EMAIL,
  );
  const recordIds = candidateRecords.map((row) => row.serviceRequestId);
  const lineageRows = recordIds.length
    ? await db
        .select()
        .from(syntheticFixtureLineageRecords)
        .where(
          and(
            eq(syntheticFixtureLineageRecords.recordType, "service_request"),
            inArray(syntheticFixtureLineageRecords.recordId, recordIds),
          ),
        )
    : [];
  const lineageById = new Map(
    lineageRows.map((row) => [row.recordId, row] as const),
  );

  const brokerFixtures = candidateRecords.map((row) => {
    const persona = syntheticPersonaByHumanVisibleName(row.contactName);
    const lineage = lineageById.get(row.serviceRequestId) ?? null;
    return {
      serviceRequestId: row.serviceRequestId,
      humanVisibleName: row.contactName,
      status: row.status,
      registeredSyntheticPersona: Boolean(persona),
      expectedSyntheticPersonaId: persona?.syntheticPersonaId ?? null,
      fixtureActivationMode: persona?.activationMode ?? null,
      lineagePresent: Boolean(lineage),
      lineageMatchesRegistry:
        Boolean(lineage && persona) &&
        lineage?.syntheticPersonaId === persona?.syntheticPersonaId &&
        lineage?.humanVisibleName === persona?.humanVisibleName,
      testRunId: lineage?.testRunId ?? null,
      fixtureVersion: lineage?.fixtureVersion ?? null,
      environment: lineage?.environment ?? null,
      operatorIdentity: lineage?.operatorIdentity ?? null,
      fixtureCreatedAt: iso(lineage?.fixtureCreatedAt),
      scenarioId: lineage?.scenarioId ?? null,
      lineageSha256: lineage?.lineageSha256 ?? null,
      originalCreatedAt: iso(row.createdAt ?? row.occurredAt),
    };
  });

  const missingLineage = brokerFixtures.filter(
    (row) => row.registeredSyntheticPersona && !row.lineagePresent,
  );
  const mismatchedLineage = brokerFixtures.filter(
    (row) => row.lineagePresent && !row.lineageMatchesRegistry,
  );
  const unclassifiedOperatorRecords = brokerFixtures.filter(
    (row) => !row.registeredSyntheticPersona,
  );

  const stuartUsers = await db
    .select()
    .from(users)
    .where(eq(users.email, STUART_EMAIL));
  const stuartUser = stuartUsers[0] ?? null;
  const accessRows = stuartUser
    ? await db
        .select()
        .from(accessSecurityStates)
        .where(eq(accessSecurityStates.userId, stuartUser.id))
        .limit(1)
    : [];
  const access = accessRows[0] ?? null;
  const passkeys = stuartUser
    ? await db
        .select({ id: webauthnCredentials.id })
        .from(webauthnCredentials)
        .where(
          and(
            eq(webauthnCredentials.userId, stuartUser.id),
            isNull(webauthnCredentials.revokedAt),
          ),
        )
    : [];
  const professionalRows = await db
    .select({
      status: serviceRequests.status,
      reviewedAt: serviceRequests.reviewedAt,
      updatedAt: serviceRequests.updatedAt,
      metadata: serviceRequests.metadata,
    })
    .from(serviceRequests)
    .where(
      and(
        eq(
          serviceRequests.requestType,
          "professional_credential_verification_request",
        ),
        eq(serviceRequests.contactEmail, STUART_EMAIL),
      ),
    );
  const professionalCredentials = professionalRows.map((row) => {
    const metadata = (row.metadata ?? {}) as Record<string, unknown>;
    return {
      status: row.status,
      role:
        typeof metadata.professionalRole === "string"
          ? metadata.professionalRole
          : null,
      verificationMethod:
        typeof metadata.verificationMethod === "string"
          ? metadata.verificationMethod
          : null,
      credentialExpiresAt:
        typeof metadata.credentialExpiresAt === "string"
          ? metadata.credentialExpiresAt
          : null,
      reviewedAt: iso(row.reviewedAt),
      updatedAt: iso(row.updatedAt),
    };
  });
  const currentCredential = professionalCredentials.find(
    (row) =>
      row.status === "VERIFIED" &&
      row.role === "lender" &&
      Boolean(
        row.credentialExpiresAt &&
        Date.parse(row.credentialExpiresAt) >= Date.now(),
      ),
  );

  const output = {
    ok: missingLineage.length === 0 && mismatchedLineage.length === 0,
    checkedAt: new Date().toISOString(),
    migration0053Applied: true,
    syntheticRegistry: {
      totalPersonas: SYNTHETIC_PERSONAS.length,
      activePersonas: SYNTHETIC_PERSONAS.filter(
        (persona) => persona.activationMode === "ACTIVE",
      ).map((persona) => persona.humanVisibleName),
      legacyBackfillOnlyPersonas: SYNTHETIC_PERSONAS.filter(
        (persona) => persona.activationMode === "LEGACY_BACKFILL_ONLY",
      ).map((persona) => persona.humanVisibleName),
    },
    brokerFixtures,
    missingLineage,
    mismatchedLineage,
    unclassifiedOperatorRecords,
    stuartAccess: {
      email: STUART_EMAIL,
      operatorRegistered: Boolean(operatorByEmail(STUART_EMAIL)),
      lenderDeskCapability: canOperateLenderDesk(STUART_EMAIL),
      stagingLenderRole: internalLenderDeskRole(STUART_EMAIL, "staging"),
      productionStewardBridge: internalLenderDeskRole(
        STUART_EMAIL,
        "production",
      ),
      professionalRegistryRole: professionalByEmail(STUART_EMAIL)?.role ?? null,
      durableUserExists: Boolean(stuartUser),
      durableUserRole: stuartUser?.role ?? null,
      tenantBound: Boolean(stuartUser?.tenantId),
      accessStatus: access?.accessStatus ?? null,
      employmentStatus: access?.employmentStatus ?? null,
      sessionVersion: access?.sessionVersion ?? null,
      firstFactorConfigured: Boolean(access?.passwordHash),
      activePasskeyCount: passkeys.length,
      professionalCredentialCurrent: Boolean(currentCredential),
      professionalCredentials,
      cloudIapCheckedSeparately: true,
    },
  };

  console.log(JSON.stringify(output, null, 2));
  if (STRICT && !output.ok) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
