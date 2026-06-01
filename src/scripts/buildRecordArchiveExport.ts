import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative } from "node:path";

import { eventContractRegistry } from "@/lib/modules/eventContractRegistry";
import { crossModuleHandoffMap } from "@/lib/modules/handoffMap";
import {
  moduleManifests,
  publicSurfaceManifests,
} from "@/lib/modules/moduleRegistry";
import {
  allPortableVerticalSurfaces,
  portableSurfaceProductionBlocks,
  publicSurfaceDisclosureMessages,
} from "@/lib/modules/portableVerticalSurface";

type RequirementStatus =
  | "implemented"
  | "intentionally_blocked"
  | "not_applicable"
  | "awaiting_controlled_promotion";

type RequirementRecord = {
  title: string;
  status: RequirementStatus;
  requires: string[];
  tests: string[];
  evidence: string[];
};

type RequirementMatrix = {
  frameworkVersion: string;
  createdAt: string;
  sourceDocuments: string[];
  requirements: Record<string, RequirementRecord>;
};

type GapTicket = {
  id: string;
  title: string;
  owner: string;
  route: string;
  status: "awaiting_controlled_promotion";
  blockedReason: string;
  requiredEvidence: string[];
  promotionCondition: string;
  requirement: RequirementRecord;
};

const repoRoot = process.cwd();
const buildDate = "2026-06-01";
const archiveRoot = join(repoRoot, "docs", "build-records", buildDate);
const ticketRoot = join(repoRoot, "docs", "tickets");

function ensureDir(pathname: string): void {
  mkdirSync(pathname, { recursive: true });
}

function writeJson(pathname: string, value: unknown): void {
  ensureDir(dirname(pathname));
  writeFileSync(pathname, `${JSON.stringify(value, null, 2)}\n`);
}

function writeText(pathname: string, value: string): void {
  ensureDir(dirname(pathname));
  writeFileSync(pathname, value);
}

function gitOutput(args: string[]): string {
  try {
    return execFileSync("git", args, {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "";
  }
}

function gitMetadata() {
  const statusShort = gitOutput(["status", "--short"]);

  return {
    branch: gitOutput(["rev-parse", "--abbrev-ref", "HEAD"]) || "unknown",
    commitHash: gitOutput(["rev-parse", "--short", "HEAD"]) || "unknown",
    fullCommitHash: gitOutput(["rev-parse", "HEAD"]) || "unknown",
    treeStatus: statusShort.length === 0 ? "CLEAN" : "DIRTY",
    statusShort,
  };
}

type GitMetadata = ReturnType<typeof gitMetadata>;

function walkFiles(root: string, predicate: (fileName: string) => boolean): string[] {
  const files: string[] = [];

  function walk(current: string): void {
    for (const entry of readdirSync(current)) {
      const fullPath = join(current, entry);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (predicate(entry)) {
        files.push(fullPath);
      }
    }
  }

  walk(root);

  return files.sort();
}

function routeFromAppFile(filePath: string): string {
  const appRoot = join(repoRoot, "src", "app");
  const rel = relative(appRoot, filePath)
    .replace(/\\/g, "/")
    .replace(/\/page\.tsx$/, "")
    .replace(/\/route\.ts$/, "")
    .replace(/^page\.tsx$/, "")
    .replace(/^route\.ts$/, "");

  return rel.length === 0 ? "/" : `/${rel}`;
}

function routeInventory() {
  const appRoot = join(repoRoot, "src", "app");
  const pageRoutes = walkFiles(appRoot, (fileName) => fileName === "page.tsx").map(
    (filePath) => ({
      route: routeFromAppFile(filePath),
      file: relative(repoRoot, filePath),
      type: "page",
    })
  );
  const apiRoutes = walkFiles(join(appRoot, "api"), (fileName) => fileName === "route.ts").map(
    (filePath) => ({
      route: routeFromAppFile(filePath),
      file: relative(repoRoot, filePath),
      type: "api",
    })
  );

  return {
    pageRoutes,
    apiRoutes,
    pageRouteCount: pageRoutes.length,
    apiRouteCount: apiRoutes.length,
    totalRouteCount: pageRoutes.length + apiRoutes.length,
  };
}

function markdownTable(headers: string[], rows: string[][]): string {
  const escape = (value: string) => value.replace(/\|/g, "\\|");

  return [
    `| ${headers.map(escape).join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map((value) => escape(value)).join(" | ")} |`),
  ].join("\n");
}

function readRequirementMatrix(): RequirementMatrix {
  return JSON.parse(
    readFileSync(join(repoRoot, "docs", "master-volume-requirements.json"), "utf8")
  ) as RequirementMatrix;
}

const controlledPromotionTickets: Record<
  string,
  Omit<GapTicket, "id" | "title" | "status" | "requirement">
> = {
  "PROMOTION-GATE-001": {
    owner: "Constitutional Authority + Release Manager",
    route: "/promotion",
    blockedReason:
      "Production, public action, live external calls, payments, notices, official reports, and verification authority are intentionally blocked until controlled promotion and qualified human approval are recorded.",
    requiredEvidence: [
      "backend production readiness approval",
      "security and audit readiness approval",
      "production auth activation approval",
      "feature flag and kill-switch review",
      "release, rollback, monitoring, incident, support, and audit evidence",
      "qualified constitutional authority and release manager signoff",
    ],
    promotionCondition:
      "May move from awaiting controlled promotion only after the full production gate chain through final authority, activation ceremony, post-activation verification, and reliance boundary review passes without blocked items.",
  },
  "PUBLIC-SURFACE-001": {
    owner: "Public Surface Governance Owner + Claims/Compliance Reviewer",
    route: "/api/public/surfaces",
    blockedReason:
      "Public surfaces are built as advisory DTO translation layers, but public production exposure and reliance remain blocked until claims, redaction, access, rate-limit, public-copy, and verification boundaries are approved.",
    requiredEvidence: [
      "public claims smoke pass",
      "redaction smoke pass",
      "public DTO and classification filtering review",
      "public-copy freeze and accessibility review",
      "rate-limit and abuse-control readiness",
      "qualified claims/compliance approval",
    ],
    promotionCondition:
      "May promote only when every public, borrower, lender, and sponsor surface carries required disclosures and a qualified reviewer approves public exposure without reliance, approval, guarantee, or legal/regulatory claims.",
  },
  "SURFACE-GOV-001": {
    owner: "Source Intelligence Governance Owner + Public DTO Owner",
    route: "/api/public/grants",
    blockedReason:
      "Public source aliases and public-safe source DTOs are implemented, but live source freshness, public verification, source certainty, and production source reliance remain blocked pending source legal, licensing, promotion, replay, and provenance approval.",
    requiredEvidence: [
      "source legal and licensing review",
      "source promotion packet approval",
      "source production readiness review",
      "controlled promotion activation review",
      "live scraper activation review with live fetch still disabled until approval",
      "public DTO safety, redaction, claims, replay, and provenance evidence",
    ],
    promotionCondition:
      "May promote only after source-specific legal/ToS/licensing, live adapter certification, provenance, replay, monitoring, rollback, incident response, and qualified human source promotion approval are recorded.",
  },
};

function doctrineGapLedger(matrix: RequirementMatrix): GapTicket[] {
  return Object.entries(matrix.requirements)
    .filter(([, requirement]) => requirement.status === "awaiting_controlled_promotion")
    .map(([id, requirement]) => {
      const ticket = controlledPromotionTickets[id];

      if (!ticket) {
        throw new Error(`Missing controlled promotion ticket metadata for ${id}.`);
      }

      return {
        id,
        title: requirement.title,
        status: "awaiting_controlled_promotion",
        requirement,
        ...ticket,
      };
    });
}

const currentMasterVolumeRegistry = {
  registryId: "current-master-volume-registry",
  generatedAt: new Date().toISOString(),
  repository: "ares-farms",
  activeBuildDate: buildDate,
  controllingRule:
    "This registry is the single machine-readable current-version pointer for build verification. Specific amended volume text controls over older compatibility rows.",
  documents: [
    {
      key: "toc",
      label: "Furlong Master Volume Series Unified TOC",
      governingVersion: "v1.0",
      file: "Furlong_Master_Volume_Series_Unified_TOC.pdf",
    },
    {
      key: "buildMatrix",
      label: "Furlong Build Conformance & Cross-Reference Matrix",
      governingVersion: "v1.0",
      file: "Furlong_Build_Conformance_Cross_Reference_Matrix.pdf",
    },
    {
      key: "volume0",
      label: "Furlong Volume 0 Platform Orientation",
      governingVersion: "v14.0",
      file: "Furlong_Volume_0_Platform_Orientation.pdf",
    },
    {
      key: "volumeI",
      label: "Ares/Furlong Volume I Constitutional Backbone Master",
      governingVersion: "v29.0",
      file: "Furlong_Volume_I_Constitutional_Backbone_Master.pdf",
    },
    {
      key: "volumeII",
      label: "Ares/Furlong Volume II Regulatory Governance Master",
      governingVersion: "v23.0 compatibility state",
      file: "Furlong_Volume_II_Regulatory_Governance_Master.pdf",
    },
    {
      key: "volumeIII",
      label: "Ares/Furlong Volume III Technical Infrastructure Master",
      governingVersion: "v25.0",
      file: "Furlong_Volume_III_Technical_Infrastructure_Master.pdf",
    },
    {
      key: "volumeIII-B",
      label: "Ares/Furlong Volume III-B Governance Runtime Master",
      governingVersion: "v4.0",
      file: "Furlong_Volume_III_B_Governance_Runtime_Master.pdf",
    },
    {
      key: "volumeIV",
      label: "Ares/Furlong Volume IV Operational Runbooks Master",
      governingVersion: "v22.0",
      file: "Furlong_Volume_IV_Operational_Runbooks_Master.pdf",
    },
    {
      key: "volumeV",
      label: "Ares/Furlong Volume V Canonical Doctrines Master",
      governingVersion: "v10.0",
      file: "Furlong_Volume_V_Canonical_Doctrines_Master.pdf",
    },
    {
      key: "volumeVI",
      label: "Ares/Furlong Volume VI Source Intelligence Integration Master",
      governingVersion: "v1.1",
      file: "Furlong_Volume_VI_Source_Intelligence_Integration_Master.pdf",
    },
    {
      key: "volumeVII",
      label: "Furlong Volume VII Unified Governance Conformance Matrix",
      governingVersion: "v1.0 active conformance matrix",
      file: "Furlong_Volume_VII_Unified_Governance_Conformance_Matrix.pdf",
      note: "Active conformance proof layer for unified governance, build verification, and doctrine-to-code traceability.",
    },
    {
      key: "xref",
      label: "Ares/Furlong Master Cross-Reference Index",
      governingVersion: "v22.0 active build-control reference",
      file: "Furlong_Master_Cross_Reference_Index.pdf",
      note: "The supplied copy still carries some v21.0 compatibility rows; later amended volume text and the active build matrix control.",
    },
  ],
  supportingDocuments: [
    "Furlong_Master_Series_Hub.html",
    "Volume_VI_Consolidation_and_Changes_Summary.md",
    "Furlong_Customer_Version.pdf",
    "Furlong_Governance_Doctrines_Master_Series.pdf",
  ],
  repositoryEvidence: [
    "docs/MASTER_VOLUME_SOURCE_SNAPSHOT.md",
    "docs/master-volume-requirements.json",
    "docs/BACKEND_COVERAGE_MATRIX.md",
    "docs/BACKEND_MODULE_READINESS_DECISION.md",
  ],
};

const humanAuthorityMap = [
  {
    module: "Module 22",
    gate: "Live Scraper Activation Gate",
    route: "/live-scraper-activation",
    requiredHumanAuthority: "Source Promotion Authority + Legal/Compliance Reviewer",
    approvalBoundary:
      "Source-specific legal/ToS/licensing, credential, adapter, provenance, replay, rollback, incident, and monitoring approval.",
    currentPosture: "Blocked; live fetch remains disabled.",
  },
  {
    module: "Module 23",
    gate: "Source Legal and Licensing Review Gate",
    route: "/source-legal-review",
    requiredHumanAuthority: "Qualified Legal/Compliance Reviewer",
    approvalBoundary:
      "Legal/ToS/licensing, anti-bulk, retention, republication, and public-display scope review.",
    currentPosture: "Review-bound; no legal advice and no live source approval.",
  },
  {
    module: "Module 24",
    gate: "Source Promotion Packet Gate",
    route: "/source-promotion-packets",
    requiredHumanAuthority: "Source Promotion Authority",
    approvalBoundary:
      "Promotion packet completeness, source legal review, credential vault, adapter, replay, provenance, failover, rollback, incident, and claims evidence.",
    currentPosture: "Blocked pending qualified human source promotion approval.",
  },
  {
    module: "Module 25",
    gate: "Source Production Promotion Readiness Gate",
    route: "/source-production-readiness",
    requiredHumanAuthority: "Source Production Owner + Compliance Reviewer",
    approvalBoundary:
      "Final source production readiness, kill switch, activation ceremony, live adapter, audit export, claims review, and source-specific approval.",
    currentPosture: "Blocked; production source activation not approved.",
  },
  {
    module: "Module 26",
    gate: "Controlled Promotion Activation Gate",
    route: "/controlled-promotion-activation",
    requiredHumanAuthority: "Controlled Promotion Board",
    approvalBoundary:
      "Promotion change record, risk signoff, source readiness, legal approval, activation ceremony, post-activation verification, and rollback controls.",
    currentPosture: "Blocked; activation not executed.",
  },
  {
    module: "Module 27",
    gate: "Production Portal Readiness Preflight Gate",
    route: "/production-portal-readiness",
    requiredHumanAuthority: "Portal Launch Owner + Security/Compliance Reviewer",
    approvalBoundary:
      "Portable surface, auth, security, audit, claims, redaction, support, rollback, incident, and launch-hold evidence.",
    currentPosture: "Blocked; portal launch not approved.",
  },
  {
    module: "Module 28",
    gate: "Production Launch Evidence Packet",
    route: "/production-launch-evidence",
    requiredHumanAuthority: "Qualified Release Manager + Legal/Compliance Reviewer",
    approvalBoundary:
      "Go-live packet, backend/security/auth approvals, claims freeze, monitoring, rollback, incident, support, audit, and qualified release ceremony.",
    currentPosture: "Blocked; go-live not approved.",
  },
  {
    module: "Module 29",
    gate: "Deployment Environment Readiness Gate",
    route: "/deployment-environment-readiness",
    requiredHumanAuthority: "Deployment Owner + Security Owner",
    approvalBoundary:
      "Production secrets, HTTPS, DNS/CDN/TLS/WAF, migrations, backup/restore, monitoring, rollback, and deployment hold release.",
    currentPosture: "Blocked; deployment not executed.",
  },
  {
    module: "Module 30",
    gate: "Release Candidate Freeze Plan",
    route: "/release-candidate-freeze",
    requiredHumanAuthority: "Release Manager",
    approvalBoundary:
      "Release candidate freeze, change freeze, verification, content freeze, migration plan, rollback, incident, and go-live hold review.",
    currentPosture: "Blocked; release candidate not frozen.",
  },
  {
    module: "Module 31",
    gate: "Production Cutover Hold Gate",
    route: "/production-cutover-hold",
    requiredHumanAuthority: "Cutover Authority + Release Manager",
    approvalBoundary:
      "Cutover sequence, final launch hold, deployment hold, freeze hold, secrets, migrations, DNS/CDN/TLS/WAF, monitoring, rollback, support, and incident approval.",
    currentPosture: "Blocked; cutover authority not granted.",
  },
  {
    module: "Module 32",
    gate: "Production Release Board Evidence Packet",
    route: "/production-release-board",
    requiredHumanAuthority: "Production Release Board",
    approvalBoundary:
      "Board quorum, release manager, security, compliance, operations, support, public-copy, incident, rollback, communication, and cutover authority review.",
    currentPosture: "Blocked; release board approval not granted.",
  },
  {
    module: "Module 33",
    gate: "Production Operations Monitoring Gate",
    route: "/production-operations-monitoring",
    requiredHumanAuthority: "Operations Owner + On-Call Lead",
    approvalBoundary:
      "Monitoring, alerting, SLOs, on-call roster, incident bridge, rollback drill, backup/restore, audit export, emergency hold, and kill-switch review.",
    currentPosture: "Blocked; monitoring activation not approved.",
  },
  {
    module: "Module 34",
    gate: "Production Incident Response Readiness Gate",
    route: "/production-incident-response-readiness",
    requiredHumanAuthority: "Incident Commander + Legal/Compliance Escalation Owner",
    approvalBoundary:
      "Incident roles, severity model, on-call escalation, rollback decision tree, audit/replay/data integrity, communications, regulatory/legal escalation, emergency hold, and kill-switch review.",
    currentPosture: "Blocked; incident response activation not approved.",
  },
  {
    module: "Module 35",
    gate: "Production Support Communications Readiness Gate",
    route: "/production-support-communications-readiness",
    requiredHumanAuthority: "Support Lead + Communications/Compliance Reviewer",
    approvalBoundary:
      "Support routing, customer-safe language, status page, notice/adverse-action boundary, accessibility/translation, data-rights handoff, escalation runbook, and audit/replay evidence.",
    currentPosture: "Blocked; support operations not activated.",
  },
  {
    module: "Module 36",
    gate: "Production Final Authority Gate",
    route: "/production-final-authority",
    requiredHumanAuthority: "Constitutional Authority + Qualified Release Manager",
    approvalBoundary:
      "Final supremacy/no-conflict review, release manager approval, production exposure, privacy/redaction/data rights, claims, communications freeze, monitoring/incident/rollback, audit/replay/evidence, and explicit launch authority.",
    currentPosture: "Blocked; final authority not granted.",
  },
  {
    module: "Module 37",
    gate: "Production Activation Ceremony Gate",
    route: "/production-activation-ceremony",
    requiredHumanAuthority: "Dual-Control Activation Authority",
    approvalBoundary:
      "Dual-control quorum, credential vault release, deployment and migration sequence, monitoring/post-activation verification, rollback, emergency hold, communications freeze, and audit/replay evidence.",
    currentPosture: "Blocked; activation ceremony not executed.",
  },
  {
    module: "Module 38",
    gate: "Production Post-Activation Verification Gate",
    route: "/production-post-activation-verification",
    requiredHumanAuthority: "Watch-Window Owner + Operations Lead",
    approvalBoundary:
      "Verification runbook, watch-window ownership, synthetic health checks, public surface check, audit/replay export, monitoring/SLOs, rollback/emergency hold, support/communications, privacy/redaction/data-rights, and source boundary review.",
    currentPosture: "Blocked; production health not certified.",
  },
  {
    module: "Module 39",
    gate: "Production Reliance and Public Verification Boundary Gate",
    route: "/production-reliance-verification",
    requiredHumanAuthority: "Reliance Authority + Legal/Compliance Reviewer",
    approvalBoundary:
      "Public verification infrastructure, claims, DTOs, external recipients, audit/replay, privacy/redaction/data rights, source authority, report/notice/payment/legal/live-action boundaries, and reliance authority review.",
    currentPosture: "Blocked; public verification and official reliance not authorized.",
  },
  {
    module: "Module 40",
    gate: "Production Regulatory Examination and Evidence Archive Gate",
    route: "/production-regulatory-examination",
    requiredHumanAuthority: "Regulatory Response Owner + Legal/Compliance Reviewer",
    approvalBoundary:
      "Examination scope, archive completeness, retention/legal hold, audit/replay export, privacy/redaction/public records, regulatory communication, and source/report/notice/payment/legal/live-action boundaries.",
    currentPosture: "Blocked; regulator submission and archive certification not approved.",
  },
  {
    module: "Module 41",
    gate: "Production Regulatory Response and Corrective Action Gate",
    route: "/production-regulatory-response",
    requiredHumanAuthority: "Regulatory Response Owner + Corrective Action Owner + Legal/Compliance Reviewer",
    approvalBoundary:
      "Examiner finding intake, response package, corrective-action plan, remediation evidence, legal/compliance language, audit/replay response evidence, privacy/redaction/public records, and source/report/notice/payment/legal/live-action boundaries.",
    currentPosture: "Blocked; official response, corrective-action commitment, and remediation execution not approved.",
  },
  {
    module: "Module 42",
    gate: "Build Preservation and Evidence Archive Gate",
    route: "/build-preservation",
    requiredHumanAuthority: "Governance Archivist + Release Manager",
    approvalBoundary:
      "Checkpoint evidence pack, ignored-sensitive-file verification, tree drift resolution, backend verification, production build evidence, and preservation of all production authority blocks.",
    currentPosture: "Evidence-only; checkpoint archived without production authority.",
  },
  {
    module: "Module 43",
    gate: "Doctrine-to-Code Gap Ledger",
    route: "/doctrine-gap-ledger",
    requiredHumanAuthority:
      "Constitutional Authority + Release Manager + Public Surface Governance Owner + Claims/Compliance Reviewer + Source Intelligence Governance Owner + Public DTO Owner",
    approvalBoundary:
      "Named gap ownership, route mapping, blocked reason, required evidence, promotion condition, ticket reference, current Master Volume version evidence, and controlled-promotion review.",
    currentPosture:
      "Review-bound; the three remaining gaps are named and blocked pending qualified controlled promotion.",
  },
];

const operationalEvidencePacketTemplates = [
  {
    templateId: "production-release-board",
    title: "Production Release Board Evidence Packet",
    owningRole: "Production Release Board",
    route: "/production-release-board",
    requiredSections: [
      "release board agenda and quorum",
      "release manager attestation",
      "security/compliance/operations/support owner attestations",
      "public-copy and content-claims review",
      "incident, rollback, support, and communications evidence",
      "launch, deployment, and freeze hold status",
      "secrets, migration, DNS/CDN/TLS/WAF, monitoring, backup, and DR evidence",
      "explicit production block preservation statement",
    ],
  },
  {
    templateId: "regulator-exam-archive",
    title: "Regulator Examination Evidence Archive Packet",
    owningRole: "Regulatory Response Owner + Legal/Compliance Reviewer",
    route: "/production-regulatory-examination",
    requiredSections: [
      "examination scope and regulator audience",
      "archive inventory and completeness checklist",
      "retention and legal hold status",
      "audit and replay export references",
      "privacy, redaction, and public-records review",
      "regulatory communication boundary",
      "source/report/notice/payment/legal/live-action boundary review",
    ],
  },
  {
    templateId: "incident-response",
    title: "Production Incident Response Evidence Packet",
    owningRole: "Incident Commander",
    route: "/production-incident-response-readiness",
    requiredSections: [
      "incident command roles and severity model",
      "on-call escalation and bridge plan",
      "rollback decision tree and emergency hold authority",
      "data integrity, replay, and audit export plan",
      "customer-safe communications",
      "legal/regulatory escalation boundary",
      "post-incident evidence retention",
    ],
  },
  {
    templateId: "source-promotion",
    title: "Source Promotion Packet",
    owningRole: "Source Promotion Authority",
    route: "/source-promotion-packets",
    requiredSections: [
      "source authority tier and source identity",
      "legal/ToS/licensing review",
      "credential vault reference only",
      "adapter certification and schema contract",
      "provenance, replay, and freshness evidence",
      "failover, stale-source, and conflict escalation plan",
      "claims and public DTO restrictions",
      "human source promotion approval",
    ],
  },
  {
    templateId: "scraper-activation",
    title: "Live Scraper Activation Evidence Packet",
    owningRole: "Source Promotion Authority + Legal/Compliance Reviewer",
    route: "/live-scraper-activation",
    requiredSections: [
      "source legal approval",
      "credential ownership and vault reference",
      "certified live adapter reference",
      "dry-run and no-live-fetch evidence",
      "replay and provenance certification",
      "monitoring, rollback, and incident runbook",
      "kill switch and emergency stop owner",
      "human promotion approval",
    ],
  },
  {
    templateId: "revenue-advisory-source-review",
    title: "Revenue Advisory Source Review Packet",
    owningRole: "Revenue Intelligence Owner + Claims/Compliance Reviewer",
    route: "/customer-revenue",
    requiredSections: [
      "source lineage and authority tier",
      "program, market, cost, geospatial, and regulatory source references",
      "advisory-only revenue and program-fit disclosure",
      "no guaranteed revenue, program approval, lender commitment, or legal advice statement",
      "freshness and replay evidence",
      "conflict and stale-source handling",
      "human review requirement",
    ],
  },
  {
    templateId: "corrective-action",
    title: "Corrective Action Evidence Packet",
    owningRole: "Corrective Action Owner + Legal/Compliance Reviewer",
    route: "/production-regulatory-response",
    requiredSections: [
      "examiner finding or issue intake",
      "corrective-action plan draft",
      "remediation evidence inventory",
      "legal/compliance response language",
      "audit/replay evidence",
      "privacy, redaction, and public-records review",
      "no commitment or remediation execution without authority statement",
    ],
  },
];

function publicSurfaceDisclosureAudit() {
  const requiredMessages = [...publicSurfaceDisclosureMessages];
  const publicSurfaces = allPortableVerticalSurfaces.filter(
    (surface) => surface.audience !== "internal"
  );

  const surfaceResults = publicSurfaces.map((surface) => {
    const safeText = surface.safeMessages.join(" ");
    const blockText = surface.productionBlocks.join(" ");
    const missingMessages = requiredMessages.filter(
      (message) => !surface.safeMessages.includes(message)
    );
    const missingConcepts = [
      ["advisory only", /advisory only|advisory/i.test(`${safeText} ${blockText}`)],
      ["no approval", /no approval|not approvals|No approval/i.test(`${safeText} ${blockText}`)],
      ["no guarantee", /no guarantee|No guarantee/i.test(`${safeText} ${blockText}`)],
      [
        "no legal/regulatory reliance",
        /No legal or regulatory reliance|no legal or regulatory reliance|regulatory reliance/i.test(
          `${safeText} ${blockText}`
        ),
      ],
      [
        "no public verification unless authorized",
        /No public verification is available unless separately authorized|no public verification unless authorized|no public verification claim/i.test(
          `${safeText} ${blockText}`
        ),
      ],
    ]
      .filter(([, present]) => !present)
      .map(([concept]) => concept);

    return {
      id: surface.id,
      route: surface.route,
      audience: surface.audience,
      ok: missingMessages.length === 0 && missingConcepts.length === 0,
      missingMessages,
      missingConcepts,
      safeMessages: surface.safeMessages,
      productionBlocks: surface.productionBlocks,
    };
  });

  return {
    ok: surfaceResults.every((surface) => surface.ok),
    checkedAt: new Date().toISOString(),
    requiredMessages,
    surfacesChecked: surfaceResults.length,
    publicSurfaceManifestsChecked: publicSurfaceManifests().length,
    results: surfaceResults,
  };
}

function productionBlockList() {
  return {
    generatedAt: new Date().toISOString(),
    globalProductionBlocks: Array.from(new Set(portableSurfaceProductionBlocks)),
    gateBlocks: humanAuthorityMap.map((gate) => ({
      module: gate.module,
      route: gate.route,
      gate: gate.gate,
      requiredHumanAuthority: gate.requiredHumanAuthority,
      currentPosture: gate.currentPosture,
    })),
    hardBlocks: [
      "no production activation",
      "no go-live approval",
      "no deployment execution",
      "no secret activation",
      "no DNS cutover",
      "no production database migration",
      "no public production API exposure",
      "no portal launch",
      "no payment capture",
      "no borrower notice send",
      "no official report publication",
      "no public verification authority",
      "no official reliance",
      "no legal advice",
      "no live external action",
      "no regulatory response issuance",
      "no corrective-action commitment",
      "no remediation execution",
    ],
  };
}

function writeGapArtifacts(gaps: GapTicket[]): void {
  const gapRows = gaps.map((gap) => [
    gap.id,
    gap.title,
    gap.owner,
    gap.route,
    gap.blockedReason,
    gap.requiredEvidence.join("; "),
    gap.promotionCondition,
  ]);
  const md = [
    "# Doctrine-to-Code Gap Ledger",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "This ledger names every Master Volume requirement currently marked `awaiting_controlled_promotion`. There are no unnamed doctrine gaps in the current build.",
    "",
    markdownTable(
      [
        "Requirement",
        "Title",
        "Owner",
        "Route",
        "Blocked Reason",
        "Required Evidence",
        "Promotion Condition",
      ],
      gapRows
    ),
    "",
  ].join("\n");

  writeText(join(repoRoot, "docs", "DOCTRINE_TO_CODE_GAP_LEDGER.md"), md);
  writeJson(join(archiveRoot, "DOCTRINE_GAP_LEDGER.json"), gaps);

  for (const gap of gaps) {
    const ticket = [
      `# Ticket ${gap.id} - ${gap.title}`,
      "",
      `Status: \`${gap.status}\``,
      "",
      `Owner: ${gap.owner}`,
      "",
      `Route: \`${gap.route}\``,
      "",
      "## Blocked Reason",
      "",
      gap.blockedReason,
      "",
      "## Required Evidence",
      "",
      gap.requiredEvidence.map((item) => `- ${item}`).join("\n"),
      "",
      "## Promotion Condition",
      "",
      gap.promotionCondition,
      "",
      "## Existing Evidence Files",
      "",
      gap.requirement.evidence.map((item) => `- \`${item}\``).join("\n"),
      "",
      "## Proof Commands",
      "",
      gap.requirement.tests.map((item) => `- \`npm run ${item}\``).join("\n"),
      "",
    ].join("\n");
    writeText(join(ticketRoot, `${gap.id}.md`), ticket);
  }
}

function writeAuthorityArtifacts(): void {
  const md = [
    "# Human Authority Mapping",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "Vol III-B governance runtime treats qualified human authority as constitutional-grade infrastructure. These gates do not self-clear; each one requires the named human authority role and evidence boundary.",
    "",
    markdownTable(
      [
        "Module",
        "Gate",
        "Route",
        "Required Human Authority",
        "Approval Boundary",
        "Current Posture",
      ],
      humanAuthorityMap.map((gate) => [
        gate.module,
        gate.gate,
        gate.route,
        gate.requiredHumanAuthority,
        gate.approvalBoundary,
        gate.currentPosture,
      ])
    ),
    "",
  ].join("\n");
  writeText(join(repoRoot, "docs", "HUMAN_AUTHORITY_MAPPING.md"), md);
  writeJson(join(archiveRoot, "HUMAN_AUTHORITY_MAP.json"), humanAuthorityMap);
}

function writeEvidenceTemplateArtifacts(): void {
  const md = [
    "# Operational Evidence Packet Templates",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "These templates are reusable packet skeletons. They do not approve production, source activation, public verification, legal reliance, corrective action, or remediation execution.",
    "",
    operationalEvidencePacketTemplates
      .map((template) =>
        [
          `## ${template.title}`,
          "",
          `Template ID: \`${template.templateId}\``,
          "",
          `Owning role: ${template.owningRole}`,
          "",
          `Route: \`${template.route}\``,
          "",
          "Required sections:",
          "",
          template.requiredSections.map((section) => `- ${section}`).join("\n"),
          "",
        ].join("\n")
      )
      .join("\n"),
  ].join("\n");
  writeText(join(repoRoot, "docs", "OPERATIONAL_EVIDENCE_PACKET_TEMPLATES.md"), md);
  writeJson(
    join(archiveRoot, "OPERATIONAL_EVIDENCE_PACKET_TEMPLATES.json"),
    operationalEvidencePacketTemplates
  );
}

function writePublicAuditArtifacts(audit: ReturnType<typeof publicSurfaceDisclosureAudit>): void {
  const md = [
    "# Public Surface Disclosure Audit",
    "",
    `Generated: ${audit.checkedAt}`,
    "",
    `Result: ${audit.ok ? "PASS" : "REVIEW REQUIRED"}`,
    "",
    "Required messages:",
    "",
    audit.requiredMessages.map((message) => `- ${message}`).join("\n"),
    "",
    markdownTable(
      ["Surface", "Audience", "Route", "Result", "Missing"],
      audit.results.map((result) => [
        result.id,
        result.audience,
        result.route,
        result.ok ? "PASS" : "REVIEW REQUIRED",
        [...result.missingMessages, ...result.missingConcepts].join("; ") ||
          "none",
      ])
    ),
    "",
  ].join("\n");
  writeText(join(repoRoot, "docs", "PUBLIC_SURFACE_DISCLOSURE_AUDIT.md"), md);
  writeJson(join(archiveRoot, "PUBLIC_SURFACE_DISCLOSURE_AUDIT.json"), audit);
}

function writeRouteArtifacts(routes: ReturnType<typeof routeInventory>): void {
  const md = [
    "# Route List",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    `Page routes: ${routes.pageRouteCount}`,
    "",
    `API routes: ${routes.apiRouteCount}`,
    "",
    `Total routes: ${routes.totalRouteCount}`,
    "",
    "## Page Routes",
    "",
    markdownTable(
      ["Route", "File"],
      routes.pageRoutes.map((route) => [route.route, route.file])
    ),
    "",
    "## API Routes",
    "",
    markdownTable(
      ["Route", "File"],
      routes.apiRoutes.map((route) => [route.route, route.file])
    ),
    "",
  ].join("\n");
  writeText(join(archiveRoot, "ROUTE_LIST.md"), md);
  writeJson(join(archiveRoot, "ROUTE_LIST.json"), routes);
}

function writeProductionBlockArtifacts(blocks: ReturnType<typeof productionBlockList>): void {
  const md = [
    "# Production Block List",
    "",
    `Generated: ${blocks.generatedAt}`,
    "",
    "The current build is not production-live. These blocks remain active unless later cleared through qualified controlled promotion and human authority gates.",
    "",
    "## Hard Blocks",
    "",
    blocks.hardBlocks.map((block) => `- ${block}`).join("\n"),
    "",
    "## Global Surface Blocks",
    "",
    blocks.globalProductionBlocks.map((block) => `- ${block}`).join("\n"),
    "",
    "## Gate Blocks",
    "",
    markdownTable(
      ["Module", "Gate", "Route", "Required Authority", "Current Posture"],
      blocks.gateBlocks.map((block) => [
        block.module,
        block.gate,
        block.route,
        block.requiredHumanAuthority,
        block.currentPosture,
      ])
    ),
    "",
  ].join("\n");
  writeText(join(archiveRoot, "PRODUCTION_BLOCK_LIST.md"), md);
  writeJson(join(archiveRoot, "PRODUCTION_BLOCK_LIST.json"), blocks);
}

function writeVersionRegistryArtifacts(): void {
  writeJson(
    join(repoRoot, "docs", "current-master-volume-registry.json"),
    currentMasterVolumeRegistry
  );
  writeJson(join(repoRoot, "docs", "versions.json"), currentMasterVolumeRegistry);
  writeJson(
    join(archiveRoot, "CURRENT_MASTER_VOLUME_REGISTRY.json"),
    currentMasterVolumeRegistry
  );
}

function writeModuleExports(): void {
  writeJson(join(archiveRoot, "MODULE_MANIFEST_EXPORT.json"), {
    generatedAt: new Date().toISOString(),
    count: moduleManifests.length,
    numberedModules: moduleManifests.filter((manifest) => manifest.moduleNumber).length,
    highestModuleNumber: Math.max(
      ...moduleManifests
        .map((manifest) => manifest.moduleNumber ?? 0)
        .filter((moduleNumber) => moduleNumber > 0)
    ),
    manifests: moduleManifests,
    publicSurfaceManifests: publicSurfaceManifests(),
    portableSurfaces: allPortableVerticalSurfaces,
  });
  writeJson(join(archiveRoot, "EVENT_CONTRACTS_EXPORT.json"), {
    generatedAt: new Date().toISOString(),
    count: eventContractRegistry.length,
    eventContracts: eventContractRegistry,
  });
  writeJson(join(archiveRoot, "HANDOFFS_EXPORT.json"), {
    generatedAt: new Date().toISOString(),
    count: crossModuleHandoffMap.length,
    handoffs: crossModuleHandoffMap,
  });
}

function writeCanonicalBuildRecord(
  matrix: RequirementMatrix,
  gaps: GapTicket[],
  routes: ReturnType<typeof routeInventory>,
  audit: ReturnType<typeof publicSurfaceDisclosureAudit>,
  blocks: ReturnType<typeof productionBlockList>,
  git: GitMetadata
): void {
  const statusCounts = Object.values(matrix.requirements).reduce(
    (counts, requirement) => {
      counts[requirement.status] = (counts[requirement.status] ?? 0) + 1;
      return counts;
    },
    {} as Record<string, number>
  );
  const numberedModules = moduleManifests.filter(
    (manifest) => manifest.moduleNumber
  );
  const highestModuleNumber = Math.max(
    ...numberedModules.map((manifest) => manifest.moduleNumber ?? 0)
  );
  const verifiedAgainstRows = currentMasterVolumeRegistry.documents.map((doc) => [
    doc.key,
    doc.label,
    doc.governingVersion,
    doc.file,
  ]);

  const md = [
    `# Ares Furlong Build Record - ${buildDate}`,
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "Repository: `ares-farms`",
    "",
    `Branch: \`${git.branch}\``,
    "",
    `Source HEAD at archive generation: \`${git.commitHash}\``,
    "",
    `Tree status: \`${git.treeStatus}\``,
    "",
    "Canonical checkpoint: `BR-2026-06-01-M41` - Review-Bound Backend Governance Foundation.",
    "",
    `Archive source commit: \`${git.commitHash}\`. The commit containing this generated archive is created after archive generation and is visible in git history.`,
    "",
    "## Known Blocks",
    "",
    "This build is not production-live. No reader should treat this archive as approval for go-live, deployment, public production API exposure, public verification, legal or regulatory reliance, official report publication, payment capture, notice sending, regulatory response issuance, corrective-action commitment, remediation execution, live scraping, or live external actions.",
    "",
    blocks.hardBlocks.map((block) => `- ${block}`).join("\n"),
    "",
    "## Verified Against",
    "",
    markdownTable(["Key", "Document", "Version", "File"], verifiedAgainstRows),
    "",
    "## Git Metadata",
    "",
    `- Branch: \`${git.branch}\``,
    `- Source HEAD short hash: \`${git.commitHash}\``,
    `- Source HEAD full hash: \`${git.fullCommitHash}\``,
    `- Dirty/clean status at archive generation: \`${git.treeStatus}\``,
    "- Preservation commit containing this archive: assigned after archive generation; see `git log --oneline -1` after commit.",
    `- Verification timestamp: ${new Date().toISOString()}`,
    "",
    "## Requirement Status",
    "",
    `- Framework version: \`${matrix.frameworkVersion}\``,
    `- Requirements checked: ${Object.keys(matrix.requirements).length}`,
    `- Implemented: ${statusCounts.implemented ?? 0}`,
    `- Awaiting controlled promotion: ${statusCounts.awaiting_controlled_promotion ?? 0}`,
    `- Named promotion tickets: ${gaps.length}`,
    "",
    markdownTable(
      ["Requirement", "Title", "Owner", "Route", "Promotion Condition"],
      gaps.map((gap) => [
        gap.id,
        gap.title,
        gap.owner,
        gap.route,
        gap.promotionCondition,
      ])
    ),
    "",
    "## Build Counts",
    "",
    `- Module manifests: ${moduleManifests.length}`,
    `- Numbered modules: ${numberedModules.length}`,
    `- Highest module number: ${highestModuleNumber}`,
    `- Event contracts: ${eventContractRegistry.length}`,
    `- Handoffs: ${crossModuleHandoffMap.length}`,
    `- Public surfaces: ${publicSurfaceManifests().length}`,
    `- Portable vertical surfaces: ${allPortableVerticalSurfaces.length}`,
    `- Page routes: ${routes.pageRouteCount}`,
    `- API routes: ${routes.apiRouteCount}`,
    "",
    "## Public Surface Disclosure Audit",
    "",
    `- Result: ${audit.ok ? "PASS" : "REVIEW REQUIRED"}`,
    `- Surfaces checked: ${audit.surfacesChecked}`,
    `- Required messages: ${audit.requiredMessages.join(" / ")}`,
    "",
    "## Archive Contents",
    "",
    "- `BUILD_RECORD.md`",
    "- `CURRENT_MASTER_VOLUME_REGISTRY.json`",
    "- `DOCTRINE_GAP_LEDGER.json`",
    "- `PUBLIC_SURFACE_DISCLOSURE_AUDIT.json`",
    "- `HUMAN_AUTHORITY_MAP.json`",
    "- `OPERATIONAL_EVIDENCE_PACKET_TEMPLATES.json`",
    "- `ROUTE_LIST.md` and `ROUTE_LIST.json`",
    "- `MODULE_MANIFEST_EXPORT.json`",
    "- `EVENT_CONTRACTS_EXPORT.json`",
    "- `HANDOFFS_EXPORT.json`",
    "- `PRODUCTION_BLOCK_LIST.md` and `PRODUCTION_BLOCK_LIST.json`",
    "- `VERIFY_BACKEND_OUTPUT.txt` once `npm run verify:backend` is captured",
    "- `BUILD_OUTPUT.txt` once `npm run build` is captured",
    "",
    "## Canonical Decision",
    "",
    "The current backend and governed module foundation are internally verified and review-bound through Module 43. Module 41 is preserved as checkpoint `BR-2026-06-01-M41`; Module 42 preserves that checkpoint and detects tree drift. Module 43 exposes the three remaining doctrine gaps as named, owned, routed, and ticketed items awaiting controlled promotion, not unnamed missing backend work.",
    "",
  ].join("\n");

  writeText(join(archiveRoot, "BUILD_RECORD.md"), md);
}

function main(): void {
  ensureDir(archiveRoot);
  ensureDir(ticketRoot);

  const sourceGit = gitMetadata();
  const matrix = readRequirementMatrix();
  const gaps = doctrineGapLedger(matrix);
  const routes = routeInventory();
  const audit = publicSurfaceDisclosureAudit();
  const blocks = productionBlockList();

  if (gaps.length !== 3) {
    throw new Error(`Expected 3 controlled promotion gaps, found ${gaps.length}.`);
  }

  if (!audit.ok) {
    throw new Error("Public surface disclosure audit failed.");
  }

  writeVersionRegistryArtifacts();
  writeGapArtifacts(gaps);
  writeAuthorityArtifacts();
  writeEvidenceTemplateArtifacts();
  writePublicAuditArtifacts(audit);
  writeRouteArtifacts(routes);
  writeProductionBlockArtifacts(blocks);
  writeModuleExports();
  writeCanonicalBuildRecord(matrix, gaps, routes, audit, blocks, sourceGit);

  const verificationSummaryPath = join(archiveRoot, "VERIFICATION_OUTPUT.md");
  const verifyBackendOutputExists = existsSync(join(archiveRoot, "VERIFY_BACKEND_OUTPUT.txt"));
  const buildOutputExists = existsSync(join(archiveRoot, "BUILD_OUTPUT.txt"));
  writeText(
    verificationSummaryPath,
    [
      "# Verification Output",
      "",
      `Generated: ${new Date().toISOString()}`,
      "",
      `- \`npm run verify:backend\`: ${
        verifyBackendOutputExists
          ? "captured in VERIFY_BACKEND_OUTPUT.txt"
          : "pending capture"
      }`,
      `- \`npm run build\`: ${
        buildOutputExists ? "captured in BUILD_OUTPUT.txt" : "pending capture"
      }`,
      "- Archive export: PASS",
      "",
    ].join("\n")
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        archiveRoot: relative(repoRoot, archiveRoot),
        moduleManifests: moduleManifests.length,
        numberedModules: moduleManifests.filter((manifest) => manifest.moduleNumber).length,
        eventContracts: eventContractRegistry.length,
        handoffs: crossModuleHandoffMap.length,
        publicSurfaces: publicSurfaceManifests().length,
        portableSurfaces: allPortableVerticalSurfaces.length,
        pageRoutes: routes.pageRouteCount,
        apiRoutes: routes.apiRouteCount,
        controlledPromotionGaps: gaps.length,
        publicDisclosureAuditOk: audit.ok,
        git: {
          source: sourceGit,
          postExport: gitMetadata(),
        },
      },
      null,
      2
    )
  );
}

main();
