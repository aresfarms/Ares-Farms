import { and, eq, inArray } from "drizzle-orm";

import {
  applicationDocuments,
  applications,
  customerSubmissionConsents,
  deliveryAttempts,
  deliveryOutbox,
  deliveryReceipts,
  dispatchAuthorizations,
  documentStorageHandoffs,
  lenderSubmissionCases,
  recipientVerifications,
  serviceRequests,
  submissionFailures,
  submissionPackageItems,
  submissionPackageVersions,
  syntheticFixtureLineageRecords,
} from "@/db/schema";
import { writeAuditEvent } from "@/lib/audit/writeAuditEvent";
import { db } from "@/lib/db";
import {
  bindSyntheticFixtureLineage,
  createSyntheticFixtureContext,
  deploymentEnvironment,
  type BoundSyntheticFixtureLineage,
  type SyntheticFixtureContext,
} from "@/lib/testing/syntheticFixtureLineage";

const EXECUTE = process.argv.includes("--execute");
const OPERATOR_EMAIL = "chudson@aresfarmsinc.com";
const GOVERNANCE_VERSION = "master-volumes-runtime-v0.1.0";
const SOURCE = "synthetic-fixture-founder-authorized-backfill-2026-08-09";

const EXACT_PERSONAS = new Map([
  [
    "Caitlin Hudson",
    {
      syntheticPersonaId: "syn-founder-smoke-legacy-001",
      scenarioId: "lender-intake",
    },
  ],
  [
    "Sam Oranutang",
    {
      syntheticPersonaId: "syn-sam-oranutang-legacy-001",
      scenarioId: "lender-intake",
    },
  ],
  [
    "Sammy Snake",
    {
      syntheticPersonaId: "syn-sammy-snake-legacy-001",
      scenarioId: "lender-intake",
    },
  ],
  [
    "Frank Furter",
    {
      syntheticPersonaId: "syn-frank-furter-legacy-001",
      scenarioId: "lender-intake",
    },
  ],
  [
    "Tree Frog",
    {
      syntheticPersonaId: "syn-tree-frog-001",
      scenarioId: "lender-intake",
    },
  ],
  [
    "Tuna Fish",
    {
      syntheticPersonaId: "syn-tuna-fish-001",
      scenarioId: "lender-intake",
    },
  ],
  [
    "Hound Dog",
    {
      syntheticPersonaId: "syn-hound-dog-legacy-001",
      scenarioId: "lender-intake",
    },
  ],
  [
    "Shark Bait",
    {
      syntheticPersonaId: "syn-shark-bait-legacy-001",
      scenarioId: "lender-intake",
    },
  ],
]);

type RootFixture = {
  serviceRequestId: string;
  contactName: string;
  context: SyntheticFixtureContext;
};

type Target = RootFixture & {
  recordType: string;
  recordId: string;
};

function key(recordType: string, recordId: string): string {
  return `${recordType}:${recordId}`;
}

function lineageValues(lineage: BoundSyntheticFixtureLineage) {
  return {
    syntheticPersonaId: lineage.syntheticPersonaId,
    humanVisibleName: lineage.humanVisibleName,
    testRunId: lineage.testRunId,
    fixtureVersion: lineage.fixtureVersion,
    registryVersion: lineage.registryVersion,
    lineageVersion: lineage.lineageVersion,
    environment: lineage.environment,
    operatorIdentity: lineage.operatorIdentity,
    fixtureCreatedAt: new Date(lineage.createdAt),
    scenarioId: lineage.scenarioId,
    providerTargets: [...lineage.providerTargets],
    recordType: lineage.recordType,
    recordId: lineage.recordId,
    lineageSha256: lineage.lineageSha256,
    lineagePayload: lineage,
    governanceVersion: GOVERNANCE_VERSION,
    classification: "RESTRICTED",
    replayRef: lineage.testRunId,
    traceId: lineage.testRunId,
    source: SOURCE,
  };
}

async function roots(environment: string): Promise<RootFixture[]> {
  const rows = await db
    .select({
      serviceRequestId: serviceRequests.serviceRequestId,
      contactName: serviceRequests.contactName,
      contactEmail: serviceRequests.contactEmail,
      createdAt: serviceRequests.createdAt,
      occurredAt: serviceRequests.occurredAt,
    })
    .from(serviceRequests)
    .where(
      and(
        eq(serviceRequests.requestType, "financing_deal_intake"),
        eq(serviceRequests.contactEmail, OPERATOR_EMAIL),
        inArray(serviceRequests.contactName, [...EXACT_PERSONAS.keys()]),
      ),
    );

  return rows.map((row) => {
    const contactName = row.contactName ?? "";
    const persona = EXACT_PERSONAS.get(contactName);
    if (!persona) throw new Error("Unexpected synthetic broker name.");
    const createdAt = (
      row.createdAt ??
      row.occurredAt ??
      new Date()
    ).toISOString();
    return {
      serviceRequestId: row.serviceRequestId,
      contactName,
      context: createSyntheticFixtureContext({
        syntheticPersonaId: persona.syntheticPersonaId,
        scenarioId: persona.scenarioId,
        operatorIdentity: OPERATOR_EMAIL,
        environment,
        testRunId: `legacy-broker-${persona.syntheticPersonaId.replace(/^syn-/, "")}-${row.serviceRequestId.toLowerCase()}`,
        createdAt,
        allowLegacyBackfill: true,
      }),
    };
  });
}

async function collectTargets(rootRecords: RootFixture[]): Promise<Target[]> {
  const targets: Target[] = rootRecords.map((root) => ({
    ...root,
    recordType: "service_request",
    recordId: root.serviceRequestId,
  }));
  const rootByApplication = new Map<string, RootFixture>(
    rootRecords.map(
      (root) => [`finintake-${root.serviceRequestId}`, root] as const,
    ),
  );
  const applicationIds = [...rootByApplication.keys()];
  if (!applicationIds.length) return targets;

  const applicationRows = await db
    .select({ id: applications.id })
    .from(applications)
    .where(inArray(applications.id, applicationIds));
  for (const row of applicationRows) {
    const root = rootByApplication.get(row.id);
    if (root) {
      targets.push({ ...root, recordType: "application", recordId: row.id });
    }
  }

  const existingApplicationIds = applicationRows.map((row) => row.id);
  if (!existingApplicationIds.length) return targets;

  const [documents, handoffs, cases] = await Promise.all([
    db
      .select({
        id: applicationDocuments.id,
        applicationId: applicationDocuments.applicationId,
      })
      .from(applicationDocuments)
      .where(
        inArray(applicationDocuments.applicationId, existingApplicationIds),
      ),
    db
      .select({
        id: documentStorageHandoffs.id,
        applicationId: documentStorageHandoffs.applicationId,
      })
      .from(documentStorageHandoffs)
      .where(
        inArray(documentStorageHandoffs.applicationId, existingApplicationIds),
      ),
    db
      .select({
        id: lenderSubmissionCases.id,
        applicationId: lenderSubmissionCases.applicationId,
      })
      .from(lenderSubmissionCases)
      .where(
        inArray(lenderSubmissionCases.applicationId, existingApplicationIds),
      ),
  ]);

  for (const row of documents) {
    const root = rootByApplication.get(row.applicationId);
    if (root) {
      targets.push({
        ...root,
        recordType: "application_document",
        recordId: row.id,
      });
    }
  }
  for (const row of handoffs) {
    const root = rootByApplication.get(row.applicationId);
    if (root) {
      targets.push({
        ...root,
        recordType: "document_storage_handoff",
        recordId: row.id,
      });
    }
  }
  for (const row of cases) {
    const root = rootByApplication.get(row.applicationId);
    if (root) {
      targets.push({
        ...root,
        recordType: "lender_submission_case",
        recordId: row.id,
      });
    }
  }

  const rootByCase = new Map(
    cases.flatMap((row) => {
      const root = rootByApplication.get(row.applicationId);
      return root ? [[row.id, root] as const] : [];
    }),
  );
  const caseIds = [...rootByCase.keys()];
  if (!caseIds.length) return targets;

  const [versions, consents, authorizations, outboxes, failures] =
    await Promise.all([
      db
        .select({
          id: submissionPackageVersions.id,
          caseId: submissionPackageVersions.caseId,
        })
        .from(submissionPackageVersions)
        .where(inArray(submissionPackageVersions.caseId, caseIds)),
      db
        .select({
          id: customerSubmissionConsents.id,
          caseId: customerSubmissionConsents.caseId,
        })
        .from(customerSubmissionConsents)
        .where(inArray(customerSubmissionConsents.caseId, caseIds)),
      db
        .select({
          id: dispatchAuthorizations.id,
          caseId: dispatchAuthorizations.caseId,
          recipientVerificationId:
            dispatchAuthorizations.recipientVerificationId,
        })
        .from(dispatchAuthorizations)
        .where(inArray(dispatchAuthorizations.caseId, caseIds)),
      db
        .select({ id: deliveryOutbox.id, caseId: deliveryOutbox.caseId })
        .from(deliveryOutbox)
        .where(inArray(deliveryOutbox.caseId, caseIds)),
      db
        .select({
          id: submissionFailures.id,
          caseId: submissionFailures.caseId,
        })
        .from(submissionFailures)
        .where(inArray(submissionFailures.caseId, caseIds)),
    ]);

  for (const row of versions) {
    const root = rootByCase.get(row.caseId);
    if (root) {
      targets.push({
        ...root,
        recordType: "submission_package_version",
        recordId: row.id,
      });
    }
  }
  for (const row of consents) {
    const root = rootByCase.get(row.caseId);
    if (root) {
      targets.push({
        ...root,
        recordType: "customer_submission_consent",
        recordId: row.id,
      });
    }
  }
  for (const row of authorizations) {
    const root = rootByCase.get(row.caseId);
    if (root) {
      targets.push({
        ...root,
        recordType: "dispatch_authorization",
        recordId: row.id,
      });
      targets.push({
        ...root,
        recordType: "recipient_verification",
        recordId: row.recipientVerificationId,
      });
    }
  }
  for (const row of outboxes) {
    const root = rootByCase.get(row.caseId);
    if (root) {
      targets.push({
        ...root,
        recordType: "delivery_outbox",
        recordId: row.id,
      });
    }
  }
  for (const row of failures) {
    const root = rootByCase.get(row.caseId);
    if (root) {
      targets.push({
        ...root,
        recordType: "submission_failure",
        recordId: row.id,
      });
    }
  }

  const rootByVersion = new Map(
    versions.flatMap((row) => {
      const root = rootByCase.get(row.caseId);
      return root ? [[row.id, root] as const] : [];
    }),
  );
  const versionIds = [...rootByVersion.keys()];
  if (versionIds.length) {
    const items = await db
      .select({
        id: submissionPackageItems.id,
        packageVersionId: submissionPackageItems.packageVersionId,
      })
      .from(submissionPackageItems)
      .where(inArray(submissionPackageItems.packageVersionId, versionIds));
    for (const row of items) {
      const root = rootByVersion.get(row.packageVersionId);
      if (root) {
        targets.push({
          ...root,
          recordType: "submission_package_item",
          recordId: row.id,
        });
      }
    }
  }

  const rootByOutbox = new Map(
    outboxes.flatMap((row) => {
      const root = rootByCase.get(row.caseId);
      return root ? [[row.id, root] as const] : [];
    }),
  );
  const outboxIds = [...rootByOutbox.keys()];
  if (outboxIds.length) {
    const [attempts, receipts] = await Promise.all([
      db
        .select({
          id: deliveryAttempts.id,
          outboxId: deliveryAttempts.outboxId,
        })
        .from(deliveryAttempts)
        .where(inArray(deliveryAttempts.outboxId, outboxIds)),
      db
        .select({
          id: deliveryReceipts.id,
          outboxId: deliveryReceipts.outboxId,
        })
        .from(deliveryReceipts)
        .where(inArray(deliveryReceipts.outboxId, outboxIds)),
    ]);
    for (const row of attempts) {
      const root = rootByOutbox.get(row.outboxId);
      if (root) {
        targets.push({
          ...root,
          recordType: "delivery_attempt",
          recordId: row.id,
        });
      }
    }
    for (const row of receipts) {
      const root = rootByOutbox.get(row.outboxId);
      if (root) {
        targets.push({
          ...root,
          recordType: "delivery_receipt",
          recordId: row.id,
        });
      }
    }
  }

  return [
    ...new Map(
      targets.map((target) => [
        key(target.recordType, target.recordId),
        target,
      ]),
    ).values(),
  ];
}

async function main() {
  const environment = deploymentEnvironment();
  if (environment === "production") {
    throw new Error("Synthetic fixture backfill is forbidden in production.");
  }
  if (EXECUTE && environment !== "staging") {
    throw new Error("Executing the broker-fixture backfill requires staging.");
  }

  const rootRecords = await roots(environment);
  const targets = await collectTargets(rootRecords);
  const ids = targets.map((target) => target.recordId);
  const existing = ids.length
    ? await db
        .select({
          recordType: syntheticFixtureLineageRecords.recordType,
          recordId: syntheticFixtureLineageRecords.recordId,
        })
        .from(syntheticFixtureLineageRecords)
        .where(inArray(syntheticFixtureLineageRecords.recordId, ids))
    : [];
  const alreadyBound = new Set(
    existing.map((row) => key(row.recordType, row.recordId)),
  );
  const pending = targets
    .filter(
      (target) => !alreadyBound.has(key(target.recordType, target.recordId)),
    )
    .map((target) => ({
      ...target,
      lineage: bindSyntheticFixtureLineage(
        target.context,
        target.recordType,
        target.recordId,
      ),
    }));

  const byRun = new Map<string, typeof pending>();
  for (const target of pending) {
    const rows = byRun.get(target.context.testRunId) ?? [];
    rows.push(target);
    byRun.set(target.context.testRunId, rows);
  }

  if (!EXECUTE) {
    console.log(
      JSON.stringify(
        {
          ok: true,
          mode: "PLAN_ONLY",
          environment,
          roots: rootRecords.length,
          discoveredRecords: targets.length,
          alreadyBound: alreadyBound.size,
          pending: pending.map(
            ({ serviceRequestId, contactName, lineage }) => ({
              serviceRequestId,
              humanVisibleName: contactName,
              recordType: lineage.recordType,
              recordId: lineage.recordId,
              syntheticPersonaId: lineage.syntheticPersonaId,
              testRunId: lineage.testRunId,
              fixtureVersion: lineage.fixtureVersion,
              environment: lineage.environment,
              operatorIdentity: lineage.operatorIdentity,
              createdAt: lineage.createdAt,
              lineageSha256: lineage.lineageSha256,
            }),
          ),
        },
        null,
        2,
      ),
    );
    return;
  }

  const completed: Array<{
    testRunId: string;
    inserted: number;
    auditId: string;
  }> = [];
  for (const [testRunId, records] of byRun) {
    await db.transaction(async (tx) => {
      await tx
        .insert(syntheticFixtureLineageRecords)
        .values(records.map(({ lineage }) => lineageValues(lineage)));
    });
    const audit = await writeAuditEvent({
      userId: OPERATOR_EMAIL,
      actorRef: `user:${OPERATOR_EMAIL}`,
      eventType: "SYNTHETIC_FIXTURE_LINEAGE_BACKFILLED",
      entityType: "synthetic_test_run",
      entityId: testRunId,
      classification: "RESTRICTED",
      source: "synthetic-fixture-backfill",
      moduleId: "licensed-lending-spoke",
      traceId: testRunId,
      target: { type: "synthetic_test_run", id: testRunId },
      payload: {
        founderAuthorizationDate: "2026-08-09",
        reason:
          "Founder confirmed the exact human-visible names are synthetic staging test records.",
        records: records.map(({ lineage }) => ({
          recordType: lineage.recordType,
          recordId: lineage.recordId,
          lineageSha256: lineage.lineageSha256,
        })),
      },
      metadata: { replayRef: testRunId },
    });
    completed.push({
      testRunId,
      inserted: records.length,
      auditId: audit.auditId,
    });
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        mode: "EXECUTED",
        environment,
        roots: rootRecords.length,
        inserted: pending.length,
        completed,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
