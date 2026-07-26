import { createHash } from "node:crypto";

import type { UltimateProformaInput } from "@/lib/pdf/ultimateProformaTemplate";
import type {
  FederalLoanAuthorityDocument,
  FederalLoanAuthorityMonitorState,
} from "@/lib/governance/federalLoanAuthorityMonitor";

export const FEDERAL_LOAN_AUTHORITY_RECONCILIATION_RULE =
  "FEDERAL-LOAN-AUTHORITY-AUTOMATIC-RECONCILIATION-001" as const;

export type ProgramFactType =
  | "FORM_VERSION"
  | "EFFECTIVE_DATE"
  | "MAXIMUM_LOAN_AMOUNT"
  | "GUARANTY_PERCENTAGE"
  | "INTEREST_RATE"
  | "FEE"
  | "OWNERSHIP_THRESHOLD"
  | "REQUIRED_DOCUMENT"
  | "PROGRAM_REQUIREMENT";

export interface ProgramFact {
  factId: string;
  agency: FederalLoanAuthorityDocument["agency"];
  type: ProgramFactType;
  label: string;
  value: string;
  sourceUrl: string;
  sourceContentHash: string;
  extractedAt: string;
  confidence: "DETERMINISTIC" | "REVIEW_REQUIRED";
}

export interface FederalLoanAuthorityOverlay {
  rule: typeof FEDERAL_LOAN_AUTHORITY_RECONCILIATION_RULE;
  status: "AUTO_APPLIED" | "REVIEW_REQUIRED" | "NO_APPLICABLE_CHANGE";
  facts: ProgramFact[];
  autoAppliedFactIds: string[];
  reviewRequiredFactIds: string[];
  blockers: string[];
  sourceHashes: Record<string, string>;
  overlaySha256: string;
}

const MATERIAL_TERMS = /\b(?:eligib|ineligib|credit elsewhere|collateral|required guarant|personal guarant|citizen|residen|criminal|debar|default|delinquen|environmental|flood|size standard|affiliat|ownership|control|loan purpose|use of proceeds|refinanc|equity injection|borrower contribution)\b/i;

function sha(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function clean(value: string): string {
  return value.replace(/<[^>]*>/g, " ").replace(/&nbsp;|&#160;/gi, " ").replace(/&amp;/gi, "&").replace(/\s+/g, " ").trim();
}

function fact(input: Omit<ProgramFact, "factId">): ProgramFact {
  return { ...input, factId: `fact-${sha([input.type, input.value, input.sourceUrl]).slice(0, 20)}` };
}

export function extractDeterministicProgramFacts(input: {
  document: FederalLoanAuthorityDocument;
  content: string;
  extractedAt: string;
}): ProgramFact[] {
  const text = clean(input.content);
  const out: ProgramFact[] = [];
  const base = {
    agency: input.document.agency,
    sourceUrl: input.document.url,
    sourceContentHash: input.document.contentHash,
    extractedAt: input.extractedAt,
  } as const;

  const form = text.match(/\b(?:SBA|FSA|RD)\s+Form\s+([A-Z0-9-]+)(?:[^\d]{0,30}(\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2}))?/i);
  if (form) out.push(fact({ ...base, type: "FORM_VERSION", label: "Current official form", value: `${form[0]}`, confidence: "DETERMINISTIC" }));

  const effective = text.match(/\b(?:effective|revised|revision date|dated)\s*[:\-]?\s*(January|February|March|April|May|June|July|August|September|October|November|December)?\s*\d{1,2}?,?\s*20\d{2}|\b20\d{2}-\d{2}-\d{2}\b/i);
  if (effective) out.push(fact({ ...base, type: "EFFECTIVE_DATE", label: "Authority effective or revision date", value: effective[0], confidence: "DETERMINISTIC" }));

  const maxLoan = text.match(/(?:maximum|max(?:imum)? loan amount|loans? (?:up to|cannot exceed))[^$]{0,45}\$\s*([\d,.]+)\s*(million|billion)?/i);
  if (maxLoan) out.push(fact({ ...base, type: "MAXIMUM_LOAN_AMOUNT", label: "Maximum loan amount", value: maxLoan[0], confidence: "DETERMINISTIC" }));

  for (const match of text.matchAll(/(?:guaranty|guarantee)[^.%]{0,65}(\d{1,3})\s*%/gi)) {
    out.push(fact({ ...base, type: "GUARANTY_PERCENTAGE", label: "Guaranty percentage", value: match[0], confidence: "DETERMINISTIC" }));
  }

  for (const match of text.matchAll(/(?:interest rate|base rate|maximum rate|rate may not exceed)[^.%]{0,80}(\d+(?:\.\d+)?)\s*%/gi)) {
    out.push(fact({ ...base, type: "INTEREST_RATE", label: "Interest-rate term", value: match[0], confidence: "DETERMINISTIC" }));
  }

  for (const match of text.matchAll(/(?:guaranty fee|annual service fee|packaging fee|fee)[^.%$]{0,60}(?:\$\s*[\d,.]+|\d+(?:\.\d+)?\s*%)/gi)) {
    out.push(fact({ ...base, type: "FEE", label: "Program fee", value: match[0], confidence: "DETERMINISTIC" }));
  }

  for (const match of text.matchAll(/(?:owner|ownership)[^.%]{0,55}(\d{1,3})\s*%/gi)) {
    out.push(fact({ ...base, type: "OWNERSHIP_THRESHOLD", label: "Ownership threshold", value: match[0], confidence: "DETERMINISTIC" }));
  }

  for (const match of text.matchAll(/(?:must|required to|shall)\s+(?:submit|provide|complete|include|retain)[^.]{3,180}\./gi)) {
    const value = match[0];
    out.push(fact({
      ...base,
      type: /form|schedule|statement|certificate|documentation|report/i.test(value) ? "REQUIRED_DOCUMENT" : "PROGRAM_REQUIREMENT",
      label: "Current program requirement",
      value,
      confidence: MATERIAL_TERMS.test(value) ? "REVIEW_REQUIRED" : "DETERMINISTIC",
    }));
  }

  return [...new Map(out.map((item) => [`${item.type}:${item.value}`, item])).values()];
}

export function reconcileFederalLoanAuthority(input: {
  proforma: UltimateProformaInput;
  state: FederalLoanAuthorityMonitorState;
  extractedFacts: readonly ProgramFact[];
  now: string;
}): { proforma: UltimateProformaInput; overlay: FederalLoanAuthorityOverlay } {
  const blockers: string[] = [];
  const facts = [...input.extractedFacts];
  const sourceHashes: Record<string, string> = {};
  for (const ref of input.proforma.authority.officialSourceRefs) {
    const doc = input.state.documents.find((candidate) => candidate.url === ref);
    if (!doc || !doc.contentHash) blockers.push(`AUTHORITY_BASELINE_REQUIRED:${ref}`);
    else sourceHashes[ref] = doc.contentHash;
    if (doc?.status === "FETCH_FAILED") blockers.push(`AUTHORITY_FETCH_FAILED:${ref}`);
  }

  const reviewRequired = facts.filter((item) => item.confidence === "REVIEW_REQUIRED");
  const deterministic = facts.filter((item) => item.confidence === "DETERMINISTIC");
  if (reviewRequired.length > 0) blockers.push("MATERIAL_OR_AMBIGUOUS_PROGRAM_CHANGE_REQUIRES_REVIEW");

  const formFacts = deterministic.filter((item) => item.type === "FORM_VERSION");
  const programNotes = deterministic
    .filter((item) => item.type !== "FORM_VERSION")
    .map((item) => `${item.label}: ${item.value} [${item.sourceUrl}]`);

  const proforma = structuredClone(input.proforma);
  proforma.authority.reviewedAt = input.now;
  proforma.authority.reviewedContentHashes = sourceHashes;
  proforma.authority.formVersion = formFacts.map((item) => item.value).join("; ") || proforma.authority.formVersion;
  proforma.authority.programTermsNote = [
    "Automatically reconciled from monitored official federal-loan authorities.",
    ...programNotes,
    "Material or ambiguous legal/eligibility changes remain blocked for attributed human review.",
  ].join(" ");
  proforma.authority.automaticProgramUpdates = deterministic.map((item) => ({
    factId: item.factId,
    label: item.label,
    value: item.value,
    sourceUrl: item.sourceUrl,
    sourceContentHash: item.sourceContentHash,
  }));

  const status = blockers.length > 0
    ? "REVIEW_REQUIRED"
    : deterministic.length > 0
      ? "AUTO_APPLIED"
      : "NO_APPLICABLE_CHANGE";
  const core = {
    rule: FEDERAL_LOAN_AUTHORITY_RECONCILIATION_RULE,
    status,
    facts,
    autoAppliedFactIds: deterministic.map((item) => item.factId),
    reviewRequiredFactIds: reviewRequired.map((item) => item.factId),
    blockers,
    sourceHashes,
  } satisfies Omit<FederalLoanAuthorityOverlay, "overlaySha256">;
  return { proforma, overlay: { ...core, overlaySha256: sha(core) } };
}
