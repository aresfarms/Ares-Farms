/**
 * Governed Federated Module Ecosystem — REGISTRY (constitutional doctrine,
 * Caitlin 2026-06-12). Doc: docs/doctrine/GOVERNED_FEDERATED_MODULE_ECOSYSTEM.md
 *
 * CORE RULE: Furlong is not a banker web portal. It is a governed Decision
 * Intelligence Platform built from separate, interoperable modules. The public
 * hub informs, compares, explains, and routes; professional modules perform
 * specialized work only when intentionally activated.
 *
 * HARD DISTINCTION:
 *  - Furlong Core MAY provide: property intelligence, pathway discovery,
 *    ownership reality, transaction reality, financing intelligence, risk
 *    comparison, due-diligence categories, program awareness, alternatives,
 *    constraints, known/unknown/cannot-determine outputs.
 *  - Furlong Core does NOT: underwrite, approve, qualify, broker loans, submit
 *    applications, make legal/tax/financial determinations, decide for the
 *    user, or force a transaction path.
 *  - Five Borough Capital is NOT Furlong — it may CONNECT as a professional
 *    financing module under its own professional authority. The build must
 *    never merge those two layers.
 *
 * FEDERATION RULE: orchestration over ownership; connection over absorption;
 * references over duplication; module contracts over monolith logic;
 * professional handoff over hidden platform advice; independent operability
 * over central dependency. Each spoke must degrade gracefully.
 *
 * CONSTITUTIONAL LOCK: Furlong is the map. Modules are optional guided routes.
 * Professionals are separate service providers. The user chooses the path.
 */

export type ModuleKind = "core_intelligence" | "professional" | "licensed_professional" | "future";
export type ModuleActivation = "active" | "gated" | "inactive" | "deferred";

export interface EcosystemModule {
  id: string;
  name: string;
  kind: ModuleKind;
  /** §4 — every module carries its own doctrine reference. */
  doctrine: string;
  activation: ModuleActivation;
  /** §4 — public/private boundary. */
  publicSurface: boolean;
  /** §4 — input/output contracts (reference to the owning contract module/doc). */
  inputContract: string;
  outputContract: string;
  /** §4 — eligibility gate (what must be true before activation). */
  eligibilityGate: string;
  /** §4 — review gate for professional/licensed modules. */
  reviewGate: string | null;
  /** §4 — audit/replay record location. */
  auditReplay: string;
  /** §4 + §9 — graceful fallback when inactive. */
  fallback: string;
  /** §4 — no hard dependency on the public hub unless explicitly required. */
  dependsOnHub: boolean;
}

/** §9 — required fallback language when a professional module is inactive. */
export const PROFESSIONAL_MODULE_INACTIVE_FALLBACK =
  "Furlong can explain the pathway and what information matters, but this professional service is not active " +
  "here yet. You may continue with general decision intelligence or consult a qualified professional.";

/** §7 — anti-drift: shapes Furlong must never be reduced to. */
export const ANTI_DRIFT_FORBIDDEN_SHAPES = [
  "loan portal", "listing portal", "calculator portal", "lead-generation funnel",
  "100% financing sales page", "bank intake form", "standard real estate website",
  "broker CRM", "single-product sales funnel",
] as const;

export const CONSTITUTIONAL_LOCK =
  "Furlong is the map. Modules are optional guided routes. Professionals are separate service providers. The user chooses the path.";

const STANDARD_FALLBACK = PROFESSIONAL_MODULE_INACTIVE_FALLBACK;

/** The Furlong Hub module spine (Caitlin 2026-06-12) under the federation doctrine. */
export const MODULE_ECOSYSTEM: EcosystemModule[] = [
  {
    id: "property-intelligence", name: "Property Intelligence Module", kind: "core_intelligence",
    doctrine: "place-facts verified-only + claims policy", activation: "active", publicSurface: true,
    inputContract: "address/parcel/listing reference (scrubbed)", outputContract: "verified place-facts + honest counts + ranges-with-basis",
    eligibilityGate: "source approved via Module 22/23 review", reviewGate: null,
    auditReplay: "discovery-interview-ledger + source review ledger", fallback: "honest can't-determine + confirm-with sources", dependsOnHub: false,
  },
  {
    id: "ownership-intelligence", name: "Ownership Intelligence Module", kind: "core_intelligence",
    doctrine: "ownership REALITY (costs/experience over time) — NEVER owner-identity lookup (CONST-PROPERTY-PRIVACY-001)",
    activation: "deferred", publicSurface: true,
    inputContract: "property + path context", outputContract: "ownership cost/scenario ranges + stress points",
    eligibilityGate: "Transaction & Ownership Reality Layer build (deferred post-merge)", reviewGate: null,
    auditReplay: "reality-security replay", fallback: STANDARD_FALLBACK, dependsOnHub: false,
  },
  {
    id: "transaction-reality", name: "Transaction Reality Module", kind: "core_intelligence",
    doctrine: "capital-at-risk before ownership, liquidity/collateral usability, deal-closing risk — paths not decisions",
    activation: "deferred", publicSurface: true,
    inputContract: "property + acquisition path", outputContract: "pre-closing exposure categories + diligence cost/time ranges",
    eligibilityGate: "Transaction & Ownership Reality Layer build (deferred post-merge)", reviewGate: null,
    auditReplay: "reality-security replay", fallback: STANDARD_FALLBACK, dependsOnHub: false,
  },
  {
    id: "environmental", name: "Environmental Module", kind: "professional",
    doctrine: "environmental compliance/risk runtimes (backend governed)", activation: "gated", publicSurface: false,
    inputContract: "property/site reference", outputContract: "high-level diligence categories publicly; full review under module",
    eligibilityGate: "backend readiness gates", reviewGate: "human review for material findings",
    auditReplay: "module ledgers + replay conformance", fallback: STANDARD_FALLBACK, dependsOnHub: false,
  },
  {
    id: "compliance", name: "Compliance Module", kind: "core_intelligence",
    doctrine: "Master Volume regulatory governance; conformance suites", activation: "active", publicSurface: false,
    inputContract: "governed module outputs", outputContract: "conformance verdicts + gates",
    eligibilityGate: "verify suites green", reviewGate: "human review for production gates",
    auditReplay: "ledger/replay conformance tests", fallback: "fail-closed (gates block)", dependsOnHub: false,
  },
  {
    id: "financing-intelligence", name: "Financing Intelligence Module", kind: "core_intelligence",
    doctrine: "property-anchored program comparison; informational only; program-fits ≠ you-qualify (financingNodeContract)",
    activation: "gated", publicSurface: true,
    inputContract: "property + intended use → derived project-cost RANGE", outputContract: "program comparison as ranges + basis + as-of; disclaimer",
    eligibilityGate: "FINANCING_NODE_LIVE=false until property+ordinance layers live AND counsel clears disclaimer", reviewGate: "counsel sign-off",
    auditReplay: "reality-security replay", fallback: STANDARD_FALLBACK, dependsOnHub: false,
  },
  {
    id: "five-borough-capital", name: "Five Borough Capital Module", kind: "licensed_professional",
    doctrine: "Stuart Fraass's LICENSED financing module — separate professional authority; NOT Furlong; never merged into core",
    activation: "inactive", publicSurface: false,
    inputContract: "explicit user opt-in handoff + user-provided financials (never silent submission)",
    outputContract: "professional structuring under its own authority and disclosures",
    eligibilityGate: "licensing + counsel + founders' economics session (membership/monetization shelved until then)",
    reviewGate: "licensed human professional review", auditReplay: "module-owned audit (separate from core)",
    fallback: STANDARD_FALLBACK, dependsOnHub: false,
  },
  {
    id: "source-intelligence", name: "Source Intelligence Module", kind: "core_intelligence",
    doctrine: "scraper/source stack governance; licensed-partnership-not-scraping; verified-only rendering",
    activation: "active", publicSurface: false,
    inputContract: "approved public/licensed sources", outputContract: "canonical properties + provenance",
    eligibilityGate: "source review + activation registry", reviewGate: "operator source review",
    auditReplay: "source review + scraper replay ledgers", fallback: "stale-labeled or withheld data", dependsOnHub: false,
  },
  {
    id: "risk-intelligence", name: "Risk Intelligence Module", kind: "core_intelligence",
    doctrine: "risk comparison as paths/tradeoffs — never decisions (NO_DECISION_FOR_USER gate)", activation: "deferred", publicSurface: true,
    inputContract: "property + path context", outputContract: "risk flags + ranges + alternatives",
    eligibilityGate: "post-merge iteration", reviewGate: null,
    auditReplay: "reality-security replay", fallback: STANDARD_FALLBACK, dependsOnHub: false,
  },
  {
    id: "climate", name: "Climate Module", kind: "core_intelligence",
    doctrine: "FEMA flood + hazard place-facts (verified-only) as the seed", activation: "gated", publicSurface: true,
    inputContract: "address/parcel", outputContract: "verified hazard place-facts + can't-determine honesty",
    eligibilityGate: "per-source approval", reviewGate: null,
    auditReplay: "place-fact ledgers", fallback: "can't-determine + who-to-confirm", dependsOnHub: false,
  },
  {
    id: "historic-property", name: "Historic Property Module", kind: "core_intelligence",
    doctrine: "NPS historic place-facts seed; incentives WITH hidden-risk honesty", activation: "gated", publicSurface: true,
    inputContract: "address/parcel", outputContract: "verified historic facts + diligence categories",
    eligibilityGate: "per-source approval", reviewGate: null,
    auditReplay: "place-fact ledgers", fallback: "can't-determine + who-to-confirm", dependsOnHub: false,
  },
  {
    id: "agricultural", name: "Agricultural Module", kind: "core_intelligence",
    doctrine: "ag/livestock/apiculture classification + USDA program awareness (Furlong's base)", activation: "active", publicSurface: true,
    inputContract: "goal/animal/land context", outputContract: "ag routes + program awareness (fits ≠ qualify)",
    eligibilityGate: "live on discovery branch (merges with it)", reviewGate: null,
    auditReplay: "discovery-interview ledger", fallback: STANDARD_FALLBACK, dependsOnHub: false,
  },
  {
    id: "future-modules", name: "Future Modules", kind: "future",
    doctrine: "must enter through this registry with all §4 fields; anti-drift checked", activation: "inactive", publicSurface: false,
    inputContract: "TBD per module", outputContract: "TBD per module",
    eligibilityGate: "doctrine + Caitlin approval", reviewGate: "per module", auditReplay: "per module",
    fallback: STANDARD_FALLBACK, dependsOnHub: false,
  },
];

/** §10 — turning a module off must not break the others (independent operability). */
export function moduleById(id: string): EcosystemModule | undefined {
  return MODULE_ECOSYSTEM.find((m) => m.id === id);
}

/** A professional/licensed module is renderable ONLY when active + review-gated. */
export function professionalModuleRenderable(id: string): boolean {
  const m = moduleById(id);
  if (!m) return false;
  if (m.kind === "core_intelligence") return m.activation === "active";
  return m.activation === "active" && m.reviewGate !== null;
}
