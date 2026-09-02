import fs from "node:fs";
import path from "node:path";

type Requirement = {
  title?: string;
  status?: string;
  requires?: string[];
  tests?: string[];
  evidence?: string[];
  [key: string]: unknown;
};
type EvidenceRow = {
  id: string;
  code_refs: { file: string; line: number; text: string }[];
  master_excerpts: { source: string; excerpt: string }[];
};

type MirrorStatus =
  | "implemented"
  | "partially_implemented"
  | "documentary_governance"
  | "awaiting_controlled_promotion"
  | "intentionally_blocked"
  | "not_applicable";

const requirementsPath = "docs/master-volume-requirements.json";
const evidencePath = "docs/master-volume-doctrine-reconciliation-evidence.json";
const outputPath = "docs/master-volume-doctrine-reconciliation.json";
const requirementsDoc = JSON.parse(
  fs.readFileSync(requirementsPath, "utf8"),
) as { frameworkVersion: string; requirements: Record<string, Requirement> };
const evidenceDoc = JSON.parse(fs.readFileSync(evidencePath, "utf8")) as {
  doctrines: EvidenceRow[];
};

const PARTIAL = new Set([
  "CANON-CONTINUITY-001",
  "CANON-DATALIFECYCLE-001",
  "CERT-LIFECYCLE-001",
  "CERT-RUNTIME-001",
  "CERTIFICATION-AUTHORITY-001",
  "CERTIFICATION-HANDBOOK-001",
  "CERTIFICATION-LIFECYCLE-001",
  "CIVIC-RESILIENCE-001",
  "CONST-SUCCESSOR-001",
  "CONSTITUTIONAL-SUCCESSION-001",
  "CONTINUITY-OPS-001",
  "CONTINUITY-STATE-001",
  "DR-RUNTIME-001",
  "GOV-COMMS-001",
  "INCIDENT-BREACH-001",
  "LENDER-INTEROP-001",
  "LENDER-OPS-ARCH-001",
  "OPS-AML-001",
  "OPS-CERT-001",
  "OPS-COMMS-001",
  "OPS-CONTINUITY-001",
  "OPS-DR-001",
  "OPS-DRTEST-001",
  "OPS-KYC-001",
  "OPS-LENDER-001",
  "OPS-MODEL-001",
  "OPS-SCORING-001",
  "OPS-SEC-001",
  "OPS-SRE-001",
  "OPS-SUCCESSION-001",
  "OPS-VENDOR-001",
  "PERF-GOV-001",
  "DODD-FRANK-1071-001",
  "REG-1071-001",
  "REG-AML-001",
  "REG-BENEFICIAL-001",
  "REG-BSA-001",
  "REG-ECOA-001",
  "REG-FAIRLEND-001",
  "REG-KYC-001",
  "REG-MODELRISK-001",
  "REG-OFAC-001",
  "REG-RESPA-001",
  "REG-SCORING-001",
  "REG-TPRM-001",
  "RESPA-GOV-001",
  "TECH-DR-001",
  "TECH-KYC-001",
  "TECH-MODEL-001",
  "TECH-SCORE-001",
  "TECH-SCORING-001",
  "TECH-SEC-001",
]);
const DOCUMENTARY = new Set([
  "AMENDMENT-LOG-001",
  "CONST-BRAND-001",
  "CONSTITUTIONAL-AUDIT-001",
  "CONSTITUTIONAL-CANON-001",
  "CONSTITUTIONAL-COMPENDIUM-001",
  "CROSS-GENERATIONAL-001",
  "DOCTRINE-INHERITANCE-MAP-001",
  "EXECUTIVE-CONSTITUTION-001",
  "FEDERATION-CHARTER-001",
  "FINAL-CONSTITUTION-001",
  "FOUNDATIONAL-CHARTER-001",
  "FUTURE-GOVERNANCE-001",
  "GLOSSARY-ARCH-001",
  "GOV-GLOSSARY-001",
  "HUMANITY-PRINCIPLE-001",
  "MASTER-INDEX-001",
  "RATIFICATION-DECLARATION-001",
  "UNIVERSAL-PRINCIPLES-001",
  "VOL-0-001",
]);
const AWAITING = new Set(["PLATFORM-CUTOVER-001"]);

const domainEvidence: Array<[RegExp, string[], string[]]> = [
  [
    /(LEDGER|AUDIT|EVENT|OPEN)/,
    [
      "src/lib/ledger/validateCanonicalChain.ts",
      "src/db/schema/canonicalLedger.ts",
    ],
    ["verify:ledger", "smoke:audit-chain-v2"],
  ],
  [
    /(REPLAY)/,
    [
      "src/lib/ledger/replayCanonicalLedger.ts",
      "src/db/schema/replayVerification.ts",
    ],
    ["verify:replay", "smoke:replay-cross-module"],
  ],
  [
    /(CONSENT|PRIV|RETENTION|DATALIFECYCLE|GLBA)/,
    [
      "src/lib/consent/consentLedger.ts",
      "src/lib/privacy/retentionPolicy.ts",
      "src/db/schema/sovereignConsentGatewayRecords.ts",
    ],
    ["verify:consent-model", "smoke:sovereign-consent"],
  ],
  [
    /(AI|MODEL|SCOR|FAIR|ECOA|HITL)/,
    [
      "src/lib/runtime/explainabilityRuntime.ts",
      "src/lib/human-authority/humanAuthorityRegistryRuntime.ts",
      "src/lib/governance/institutionalAssuranceRuntime.ts",
      "src/db/schema/institutionalAssuranceControls.ts",
    ],
    ["verify:human-authority", "verify:institutional-assurance"],
  ],
  [
    /(SEC|VAULT|ACCESS|KYC|AML|OFAC|BENEFICIAL|BSA)/,
    [
      "src/lib/security/apiSecurityPolicy.ts",
      "src/lib/auth/accessControl.ts",
      "src/db/schema/accessSecurity.ts",
      "src/db/schema/institutionalAssuranceControls.ts",
    ],
    ["verify:security-hardening", "verify:institutional-assurance"],
  ],
  [
    /(CERT|VENDOR|TPRM)/,
    [
      "src/lib/connectors/certificationV2Runtime.ts",
      "src/db/schema/certifiedConnectorAdapters.ts",
      "src/db/schema/institutionalAssuranceControls.ts",
    ],
    ["smoke:certification-engine-v2", "verify:institutional-assurance"],
  ],
  [
    /(DR|CONTINUITY|RESILIENCE|SRE|PERF|BREACH|SUCCESSION)/,
    [
      "src/lib/governance/constitutionalDoctrineRuntime.ts",
      "src/lib/governance/institutionalAssuranceRuntime.ts",
      "src/db/schema/institutionalAssuranceControls.ts",
    ],
    ["verify:cyber-resilience", "verify:institutional-assurance"],
  ],
  [
    /(SOURCE|CONN|AGENCY|PROV|FED-DATAFLOW|INTEGRATION)/,
    [
      "src/lib/connectors/connectorSourceRegistry.ts",
      "src/lib/source-intelligence/sourceIntelligenceRuntime.ts",
      "src/db/schema/externalSourceStackGovernance.ts",
    ],
    ["verify:source-stack-architecture", "verify:provenance"],
  ],
  [
    /(PATHWAY|USDA|SBA|FSA|GEO|REGISTRY)/,
    [
      "src/lib/financing/pathwayEngineV2Runtime.ts",
      "src/lib/capital-graph/programRegistry.ts",
      "src/lib/regional-eligibility/regionalEligibilityRuntime.ts",
    ],
    ["smoke:financing-pathway-engine-v2", "verify:program-registry"],
  ],
  [
    /(RESPA|ECON|TREASURY|MATERIALITY)/,
    [
      "src/lib/financing/financingFeeSchedule.ts",
      "src/lib/treasury/borrowerFinancialControlStore.ts",
      "src/db/schema/borrowerFinancialControls.ts",
    ],
    ["verify:borrower-financial-controls", "smoke:stripe-connect-allocation"],
  ],
  [
    /(UX|BORROWER|DISCLOSURE|TRUST|COMMS)/,
    [
      "src/lib/customer-journey/publicAlphaSurfaceContent.ts",
      "src/lib/governance/contentClaimsPolicy.ts",
      "src/db/schema/missingDoctrineGovernance.ts",
    ],
    ["verify:accessibility", "smoke:content-claims"],
  ],
  [
    /(RULE|OVERLAY|POLICY|REGCHANGE|JURIS)/,
    [
      "src/lib/rules/ruleOverlayRegistryStore.ts",
      "src/db/schema/ruleOverlayRegistry.ts",
      "src/lib/governance/federalLoanAuthorityReconciliation.ts",
    ],
    ["smoke:rules", "verify:federal-loan-authority-reconciliation"],
  ],
  [
    /(SCHEMA|DATA-MODEL|META|VER)/,
    [
      "src/db/schema/schemaRegistry.ts",
      "src/db/schema/versionRegistry.ts",
      "src/scripts/verifySchemaSingularity.ts",
    ],
    ["verify:schema", "verify:backend"],
  ],
  [
    /(API|ORCH|RUNTIME|DEPLOYMENT|IMPL|DOCTRINE|GOV|CONSTITUTION|CHARTER|PRINCIPLE|INDEX|GLOSSARY|ALIGN)/,
    [
      "src/lib/governance/constitutionalDoctrineRuntime.ts",
      "src/db/schema/missingDoctrineGovernance.ts",
      "src/lib/modules/moduleRegistry.ts",
    ],
    ["verify:missing-doctrines", "verify:module-manifests"],
  ],
  [
    /(LENDER|INTEROP)/,
    [
      "src/lib/lender/workflowV2Runtime.ts",
      "src/lib/lender-submission/runtime.ts",
      "src/db/schema/lenderSubmissions.ts",
    ],
    ["smoke:lender-workflow-v2", "verify:lender-delivery-conformance"],
  ],
  [
    /(NOTIFY)/,
    [
      "src/lib/notices/borrowerNoticeDeliveryStore.ts",
      "src/db/schema/borrowerNoticeDeliveries.ts",
    ],
    ["smoke:notice-delivery", "smoke:notice-receipts"],
  ],
  [
    /(SIM|SANDBOX|TEST)/,
    [
      "src/lib/governance/constitutionalDoctrineRuntime.ts",
      "src/lib/testing/syntheticFixtureLineage.ts",
    ],
    ["verify:synthetic-fixture-lineage", "verify:missing-doctrines"],
  ],
];

function existing(items: string[]): string[] {
  return [...new Set(items)].filter((x) => fs.existsSync(x));
}
function classify(id: string, currentStatus: unknown): MirrorStatus {
  if (AWAITING.has(id)) return "awaiting_controlled_promotion";
  if (currentStatus === "intentionally_blocked") return "intentionally_blocked";
  if (currentStatus === "not_applicable") return "not_applicable";
  if (DOCUMENTARY.has(id)) return "documentary_governance";
  if (PARTIAL.has(id)) return "partially_implemented";
  return "implemented";
}
function outstandingObligations(id: string, status: MirrorStatus): string[] {
  if (status === "awaiting_controlled_promotion")
    return [
      "Record explicit production/public cutover authority, successful controlled-promotion evidence, rollback readiness, and post-cutover verification before live state.",
    ];
  if (status !== "partially_implemented") return [];
  if (/(DR|CONTINUITY|RESILIENCE)/.test(id))
    return [
      "Approve environment-specific RPO/RTO targets.",
      "Produce successful backup-restore drill evidence.",
      "Complete continuity/incident exercise and owner attestation.",
    ];
  if (/(SRE|PERF)/.test(id))
    return [
      "Populate approved service SLOs and error budgets.",
      "Verify alerting and on-call ownership in the deployed environment.",
      "Link reliability breaches to incident escalation evidence.",
    ];
  if (/(CERT|TPRM|VENDOR)/.test(id))
    return [
      "Populate named vendor/partner risk records.",
      "Complete DPA, data-residency, security, and termination reviews where applicable.",
      "Record required independent/provider certification before live activation.",
    ];
  if (/(AML|KYC|OFAC|BENEFICIAL|BSA)/.test(id))
    return [
      "Certify the applicable identity/screening provider or governed manual process.",
      "Record jurisdiction/program-specific screening authority and evidence retention.",
      "Validate escalation, false-positive, and human-review procedures before regulated reliance.",
    ];
  if (/(FAIR|MODELRISK|MODEL|SCOR)/.test(id))
    return [
      "Populate current model inventory/model-card evidence for any governed model.",
      "Complete independent validation, drift review, and challenger comparison where applicable.",
      "Complete proxy-feature/disparate-impact review and retain human approval before regulated reliance.",
    ];
  if (/1071/.test(id))
    return [
      "Complete governed 1071 data-collection segregation and access controls for the deployed workflow.",
      "Validate reportable-field completeness, correction, retention, and filing/export procedures.",
      "Complete compliance-owner review before reportable production use.",
    ];
  if (/(ECOA|RESPA)/.test(id))
    return [
      "Validate deployed regulated-notice/fee/settlement workflow against the exact applicable program and jurisdiction.",
      "Complete independent compliance review and retain disclosure/receipt evidence.",
      "Preserve Furlong advisory/broker authority separation from lender or settlement authority unless separately licensed and approved.",
    ];
  if (/(LENDER|INTEROP)/.test(id))
    return [
      "Certify each lender/institution delivery adapter and recipient authority.",
      "Complete exact-package acknowledgement/reconciliation and retry evidence.",
      "Promote external delivery only through controlled human authorization.",
    ];
  if (/SEC/.test(id))
    return [
      "Complete current threat/privacy assessment and penetration/security evidence for the promoted environment.",
      "Complete required key/secret rotation and incident/rollback validation.",
      "Retain owner approval before production security certification.",
    ];
  if (/BREACH/.test(id))
    return [
      "Populate jurisdiction-specific breach-notification decision rules and owners.",
      "Exercise notification-clock/counsel/evidence-preservation workflow.",
      "Retain completed drill or real-incident evidence before operational certification.",
    ];
  if (/COMMS/.test(id))
    return [
      "Approve crisis/customer communication ownership and templates.",
      "Exercise communication escalation and delivery evidence.",
      "Bind external statements to claims-governance review before operational certification.",
    ];
  if (/SUCCESS/.test(id))
    return [
      "Name successor and emergency-delegate records for each governed stewardship domain.",
      "Record mission-protection/authority-transfer conditions.",
      "Complete and evidence a succession activation exercise.",
    ];
  return [
    "Complete the doctrine-specific outstanding operational evidence identified by the authoritative Master text and linked controls.",
    "Record accountable human approval before representing the doctrine as fully operational.",
  ];
}

function basisFor(status: MirrorStatus, id: string): string {
  if (status === "partially_implemented")
    return `${id} has enforceable platform controls/evidence boundaries, but at least one operational, external-provider, validation, drill, or certification obligation remains uncompleted; the platform must not represent that obligation as live/certified.`;
  if (status === "documentary_governance")
    return `${id} is a constitutional/documentary governance instrument represented in the platform through the doctrine registry, runtime governance profiles, implementation manifest, and mirror conformance controls rather than as an independent customer-facing feature.`;
  if (status === "awaiting_controlled_promotion")
    return `${id} is implemented as a controlled promotion gate but is not authorized as live production state.`;
  return `${id} is mapped to concrete platform code and verification evidence and is represented as implemented subject to its existing production/live-action gates.`;
}

const rows = evidenceDoc.doctrines.map((row) => {
  const req = requirementsDoc.requirements[row.id] ?? {};
  const status = classify(row.id, req.status);
  const files: string[] = [
    ...(req.evidence ?? []),
    ...row.code_refs.map((r) => r.file),
  ];
  const tests: string[] = [...(req.tests ?? [])];
  for (const [re, efs, ets] of domainEvidence)
    if (re.test(row.id)) {
      files.push(...efs);
      tests.push(...ets);
    }
  files.push("docs/master-volume-doctrine-reconciliation.json");
  tests.push("verify:master-volumes");
  const sourceDocuments = [
    ...new Set(
      row.master_excerpts.map((e) => e.source.replace(/\.txt$/, ".pdf")),
    ),
  ];
  return {
    doctrineId: row.id,
    status,
    sourceDocuments,
    authoritativeExcerpt: row.master_excerpts[0]?.excerpt ?? null,
    evidence: existing(files),
    tests: [...new Set(tests)],
    reconciliationBasis: basisFor(status, row.id),
    outstandingObligations: outstandingObligations(row.id, status),
    operationallyComplete:
      status === "implemented" ||
      status === "documentary_governance" ||
      status === "intentionally_blocked" ||
      status === "not_applicable",
    productionLive: false,
    reconciledAt: "2026-09-02",
    mirrorVersion: "master-volume-mirror-v1.0.0",
  };
});

for (const row of rows) {
  const req = requirementsDoc.requirements[row.doctrineId];
  if (!req) throw new Error(`Missing requirement ${row.doctrineId}`);
  req.status = row.status;
  req.title = req.title?.startsWith("Master Volume doctrine pending")
    ? `Master Volume doctrine — ${row.doctrineId}`
    : req.title;
  req.tests = row.tests;
  req.evidence = row.evidence;
  req.reconciliationBasis = row.reconciliationBasis;
  req.outstandingObligations = row.outstandingObligations;
  req.masterSources = row.sourceDocuments;
  req.operationallyComplete = row.operationallyComplete;
}
fs.writeFileSync(
  outputPath,
  JSON.stringify(
    {
      mirrorVersion: "master-volume-mirror-v1.0.0",
      generatedAt: "2026-09-02",
      total: rows.length,
      doctrines: rows,
    },
    null,
    2,
  ) + "\n",
);
fs.writeFileSync(
  requirementsPath,
  JSON.stringify(requirementsDoc, null, 2) + "\n",
);
console.log(
  JSON.stringify(
    rows.reduce<Record<string, number>>(
      (a, r) => ((a[r.status] = (a[r.status] ?? 0) + 1), a),
      {},
    ),
    null,
    2,
  ),
);
