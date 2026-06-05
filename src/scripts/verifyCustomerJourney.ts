import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  DISCLOSURE_REGISTRY,
  composeDisclosureAuditGate,
} from "@/lib/disclosure-audit/disclosureAuditGateRuntime";
import {
  PUBLIC_ALPHA_SURFACE_CONTENT_DOC_REF,
  PUBLIC_ALPHA_SURFACE_CONTENT_VERSION,
  PUBLIC_ALPHA_SURFACE_SECTIONS,
  publicAlphaSurfaceContentLineage,
  type SurfaceSection,
} from "@/lib/customer-journey/publicAlphaSurfaceContent";
import { moduleManifests } from "@/lib/modules/moduleRegistry";

/**
 * Build 41 — verify:customer-journey (Step 7 of the Public Alpha
 * Execution Runbook).
 *
 * Audits each of the 7 customer-facing routes against the canonical
 * surface content registry. Composes with Module 44 disclosure audit
 * to confirm visible-on-render disclosure coverage.
 *
 * Fail-closed semantics (mirrors Build 40 hardening):
 * - Cannot enumerate the registry → fail
 * - Page file not found → fail (route_loads)
 * - Required content token missing → fail (per-token finding)
 * - Required Module 44 disclosure missing → fail
 * - Banned token unexempted-by-negation → fail
 * - Scanned section count = 0 → fail (anti-vacuous-pass invariant)
 *
 * Exit code 0 only when all 7 routes pass all 5 checks
 * (route_loads, required_tokens, disclosures, banned_tokens,
 * verbatim_deletion_language).
 *
 * The CLI does NOT change any surface; it reads page.tsx files from
 * disk and reports gaps. Page content drops land separately.
 */

export const VERIFY_CUSTOMER_JOURNEY_RUNTIME_VERSION =
  "verify-customer-journey-runtime-v0.1.0";

// =============================================================================
// Per-section audit
// =============================================================================

type CheckStatus = "PASS" | "FAIL";

type SectionFinding = {
  route: string;
  ordinal: number;
  category:
    | "ROUTE_LOAD_FAIL"
    | "REQUIRED_CONTENT_MISSING"
    | "DISCLOSURE_MISSING"
    | "BANNED_TOKEN_PRESENT"
    | "REGISTRY_VACUOUS";
  detail: string;
};

type SectionResult = {
  route: string;
  ordinal: number;
  doctrineLabel: string;
  pageFilePath: string;
  routeLoads: CheckStatus;
  requiredContentPresent: number;
  requiredContentTotal: number;
  requiredContentMissing: string[];
  requiredDisclosuresPresent: number;
  requiredDisclosuresTotal: number;
  requiredDisclosuresMissing: string[];
  bannedTokenViolations: string[];
  overall: CheckStatus;
  reason: string;
};

function safeExec(command: string, fallback: string): string {
  try {
    return execSync(command, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
  } catch {
    return fallback;
  }
}

function readSurfaceText(absolutePath: string): string | null {
  try {
    return readFileSync(absolutePath, "utf-8");
  } catch {
    return null;
  }
}

function moduleIdForRoute(route: string): string | null {
  const m = moduleManifests.find((mm) => mm.route === route);
  return m?.id ?? null;
}

function auditSection(
  section: SurfaceSection,
  fsRoot: string,
  disclosurePack: ReturnType<typeof composeDisclosureAuditGate>,
  findings: SectionFinding[]
): SectionResult {
  const fullPath = path.join(fsRoot, section.pageFilePath);
  const text = existsSync(fullPath) ? readSurfaceText(fullPath) : null;
  const routeLoads: CheckStatus = text === null ? "FAIL" : "PASS";

  if (text === null) {
    findings.push({
      route: section.route,
      ordinal: section.ordinal,
      category: "ROUTE_LOAD_FAIL",
      detail: `page.tsx not found at ${section.pageFilePath}`,
    });
  }

  // Required content tokens
  const contentBody = text ?? "";
  const missingContent: string[] = [];
  let presentContent = 0;
  let totalContent = 0;
  for (const req of section.requiredContent) {
    totalContent += req.requiredPatterns.length;
    for (const pattern of req.requiredPatterns) {
      if (pattern.test(contentBody)) {
        presentContent += 1;
      } else {
        const label = `${req.id}::${pattern.source.slice(0, 60)}${pattern.source.length > 60 ? "…" : ""}`;
        missingContent.push(label);
        findings.push({
          route: section.route,
          ordinal: section.ordinal,
          category: "REQUIRED_CONTENT_MISSING",
          detail: `${req.label} (${req.sourceDoctrine}) — token not detected: /${label}/`,
        });
      }
    }
  }

  // Module 44 disclosures — checked directly against the page text
  // by running the canonical semantic_tokens from the Module 44
  // disclosure registry. This decouples the per-route surface-content
  // requirement from Module 44's per-surface-class `applies_to`
  // filter (which is correctly narrower at the broader audit level).
  // A required disclosure for this route is "present" if any of the
  // semantic tokens for that disclosure_id appears on the page.
  const missingDisclosures: string[] = [];
  let presentDisclosures = 0;
  const moduleId = moduleIdForRoute(section.route);
  // Acknowledge the disclosure pack output for record-keeping; the
  // canonical check runs against page text below.
  void disclosurePack;
  void moduleId;
  for (const id of section.requiredDisclosureIds) {
    const def = DISCLOSURE_REGISTRY.find((d) => d.disclosure_id === id);
    if (!def) {
      missingDisclosures.push(id);
      findings.push({
        route: section.route,
        ordinal: section.ordinal,
        category: "DISCLOSURE_MISSING",
        detail: `Disclosure id "${id}" is not declared in the Module 44 registry; cannot verify.`,
      });
      continue;
    }
    const present = def.semantic_tokens.some((re) => re.test(contentBody));
    if (present) {
      presentDisclosures += 1;
    } else {
      missingDisclosures.push(id);
      findings.push({
        route: section.route,
        ordinal: section.ordinal,
        category: "DISCLOSURE_MISSING",
        detail: `Module 44 disclosure "${id}" not detected on page text via semantic_tokens (${def.required_text_canonical.slice(0, 80)}${def.required_text_canonical.length > 80 ? "…" : ""}).`,
      });
    }
  }

  // Banned tokens
  const bannedViolations: string[] = [];
  for (const re of section.bannedTokens) {
    // Sentence-aware scan with negation exemption: split into
    // sentences; skip sentences that contain a "does/will not" /
    // "no" negation around the prohibited token.
    const sentences = contentBody.split(/(?<=[.!?])\s+|\n+/g);
    const negationGuard =
      /\bnot\s+an?\s+(approval|denial|rejection|commitment|guarantee|determination|decision)\b|\b(does\s+not|will\s+not|never|no)\s+(approve|deny|reject|guarantee|commit|decide|determine|verify|lend|underwrite|certify|authorize)\b/i;
    for (const s of sentences) {
      if (re.test(s) && !negationGuard.test(s)) {
        const violation = `${re.source.slice(0, 60)}`;
        bannedViolations.push(violation);
        findings.push({
          route: section.route,
          ordinal: section.ordinal,
          category: "BANNED_TOKEN_PRESENT",
          detail: `banned-token /${violation}/ matched unexempted-by-negation in ${section.pageFilePath}`,
        });
        break;
      }
    }
  }

  const passed =
    routeLoads === "PASS" &&
    missingContent.length === 0 &&
    missingDisclosures.length === 0 &&
    bannedViolations.length === 0;

  return {
    route: section.route,
    ordinal: section.ordinal,
    doctrineLabel: section.doctrineLabel,
    pageFilePath: section.pageFilePath,
    routeLoads,
    requiredContentPresent: presentContent,
    requiredContentTotal: totalContent,
    requiredContentMissing: missingContent,
    requiredDisclosuresPresent: presentDisclosures,
    requiredDisclosuresTotal: section.requiredDisclosureIds.length,
    requiredDisclosuresMissing: missingDisclosures,
    bannedTokenViolations: bannedViolations,
    overall: passed ? "PASS" : "FAIL",
    reason: passed
      ? "route loads, all required content tokens present, all required disclosures present, no unexempted banned tokens"
      : `${routeLoads !== "PASS" ? "route does not load; " : ""}${missingContent.length > 0 ? `${missingContent.length} required content token(s) missing; ` : ""}${missingDisclosures.length > 0 ? `${missingDisclosures.length} required disclosure(s) missing; ` : ""}${bannedViolations.length > 0 ? `${bannedViolations.length} banned token violation(s)` : ""}`.trim(),
  };
}

// =============================================================================
// Main
// =============================================================================

type RunResult = {
  ok: boolean;
  runtimeVersion: string;
  docRef: string;
  commit: string;
  branch: string;
  sectionCount: number;
  sectionsPass: number;
  sectionsFail: number;
  sectionsScanned: number;
  totalRequiredContentBlocks: number;
  totalContentTokensPresent: number;
  totalContentTokensMissing: number;
  totalRequiredDisclosures: number;
  totalDisclosuresPresent: number;
  totalDisclosuresMissing: number;
  totalBannedTokenViolations: number;
  findings: SectionFinding[];
  sectionResults: SectionResult[];
  exitCode: 0 | 1;
};

function main(): void {
  // `--check` (CI mode): run the identical live page.tsx audit but skip
  // the timestamped build-record write, so the gate can run on every PR
  // without committing dated artifacts. Still exits result.exitCode.
  const checkMode = process.argv.includes("--check");
  const commit = safeExec("git rev-parse HEAD", "unknown");
  const branch = safeExec("git rev-parse --abbrev-ref HEAD", "main");
  const fsRoot = process.cwd();

  // Anti-vacuous-pass invariant — fail if the registry is empty.
  if (PUBLIC_ALPHA_SURFACE_SECTIONS.length === 0) {
    console.log(
      JSON.stringify(
        {
          ok: false,
          runtimeVersion: VERIFY_CUSTOMER_JOURNEY_RUNTIME_VERSION,
          docRef: PUBLIC_ALPHA_SURFACE_CONTENT_DOC_REF,
          mode: "(registry-vacuous)",
          findings: [
            {
              category: "REGISTRY_VACUOUS",
              detail:
                "PUBLIC_ALPHA_SURFACE_SECTIONS is empty; refusing to declare PASS on an empty registry.",
            },
          ],
          exitCode: 1,
          message:
            "verify:customer-journey FAIL — registry vacuous (anti-vacuous-pass invariant).",
        },
        null,
        2
      )
    );
    process.exit(1);
  }

  const disclosurePack = composeDisclosureAuditGate();
  const findings: SectionFinding[] = [];
  const sectionResults: SectionResult[] = PUBLIC_ALPHA_SURFACE_SECTIONS.map(
    (s) => auditSection(s, fsRoot, disclosurePack, findings)
  );

  const sectionsPass = sectionResults.filter((r) => r.overall === "PASS").length;
  const sectionsFail = sectionResults.length - sectionsPass;
  const totalContentTokensPresent = sectionResults.reduce(
    (n, r) => n + r.requiredContentPresent,
    0
  );
  const totalContentTokensMissing = sectionResults.reduce(
    (n, r) => n + r.requiredContentMissing.length,
    0
  );
  const totalRequiredContentBlocks = sectionResults.reduce(
    (n, r) => n + r.requiredContentTotal,
    0
  );
  const totalDisclosuresPresent = sectionResults.reduce(
    (n, r) => n + r.requiredDisclosuresPresent,
    0
  );
  const totalDisclosuresMissing = sectionResults.reduce(
    (n, r) => n + r.requiredDisclosuresMissing.length,
    0
  );
  const totalRequiredDisclosures = sectionResults.reduce(
    (n, r) => n + r.requiredDisclosuresTotal,
    0
  );
  const totalBannedTokenViolations = sectionResults.reduce(
    (n, r) => n + r.bannedTokenViolations.length,
    0
  );

  const exitCode: 0 | 1 = sectionsFail > 0 ? 1 : 0;

  const result: RunResult = {
    ok: exitCode === 0,
    runtimeVersion: VERIFY_CUSTOMER_JOURNEY_RUNTIME_VERSION,
    docRef: PUBLIC_ALPHA_SURFACE_CONTENT_DOC_REF,
    commit,
    branch,
    sectionCount: PUBLIC_ALPHA_SURFACE_SECTIONS.length,
    sectionsPass,
    sectionsFail,
    sectionsScanned: sectionResults.length,
    totalRequiredContentBlocks,
    totalContentTokensPresent,
    totalContentTokensMissing,
    totalRequiredDisclosures,
    totalDisclosuresPresent,
    totalDisclosuresMissing,
    totalBannedTokenViolations,
    findings,
    sectionResults,
    exitCode,
  };

  // Write the build-record JSON for the archive (skipped in --check mode).
  const today = new Date().toISOString().slice(0, 10);
  const outDir = path.join("docs", "build-records", today);
  const jsonPath = path.join(outDir, "customer-journey.json");
  if (!checkMode) {
    mkdirSync(outDir, { recursive: true });
    writeFileSync(jsonPath, JSON.stringify(result, null, 2) + "\n", "utf8");
  }

  const lineage = publicAlphaSurfaceContentLineage();

  console.log(
    JSON.stringify(
      {
        ok: result.ok,
        runtimeVersion: VERIFY_CUSTOMER_JOURNEY_RUNTIME_VERSION,
        docRef: PUBLIC_ALPHA_SURFACE_CONTENT_DOC_REF,
        registryVersion: lineage.version,
        commit,
        branch,
        sectionCount: result.sectionCount,
        sectionsPass: result.sectionsPass,
        sectionsFail: result.sectionsFail,
        totalRequiredContentBlocks: result.totalRequiredContentBlocks,
        totalContentTokensPresent: result.totalContentTokensPresent,
        totalContentTokensMissing: result.totalContentTokensMissing,
        totalRequiredDisclosures: result.totalRequiredDisclosures,
        totalDisclosuresPresent: result.totalDisclosuresPresent,
        totalDisclosuresMissing: result.totalDisclosuresMissing,
        totalBannedTokenViolations: result.totalBannedTokenViolations,
        findingCount: result.findings.length,
        sectionResults: result.sectionResults.map((s) => ({
          route: s.route,
          ordinal: s.ordinal,
          overall: s.overall,
          routeLoads: s.routeLoads,
          content: `${s.requiredContentPresent}/${s.requiredContentTotal}`,
          disclosures: `${s.requiredDisclosuresPresent}/${s.requiredDisclosuresTotal}`,
          bannedHits: s.bannedTokenViolations.length,
          reason: s.reason,
        })),
        exitCode: result.exitCode,
        checkMode,
        jsonPath: checkMode ? "(--check: build-record not written)" : jsonPath,
        message:
          result.exitCode === 0
            ? `verify:customer-journey PASS — all ${result.sectionCount} customer-facing routes carry the canonical surface content.`
            : `verify:customer-journey FAIL — ${result.sectionsFail} of ${result.sectionCount} routes incomplete. Add the canonical content from ${PUBLIC_ALPHA_SURFACE_CONTENT_DOC_REF} and re-run.`,
      },
      null,
      2
    )
  );

  process.exit(result.exitCode);
}

if (
  process.argv[1] &&
  /verifyCustomerJourney(\.ts|\.js)?$/.test(process.argv[1])
) {
  main();
}

export { auditSection };
