import { createHash } from "node:crypto";

export const FEDERAL_LOAN_AUTHORITY_CHANGE_TRIAGE_RULE =
  "FEDERAL-LOAN-AUTHORITY-CHANGE-TRIAGE-001" as const;

export type FederalAuthorityChangeMateriality =
  | "COSMETIC"
  | "INFORMATIONAL"
  | "LENDING_RELEVANT"
  | "LEGALLY_MATERIAL";

export interface FederalAuthoritySemanticFingerprint {
  semanticHash: string;
  semanticText: string;
  clauses: string[];
  materiality: Exclude<FederalAuthorityChangeMateriality, "COSMETIC">;
  reasonCodes: string[];
}

const LENDING_RELEVANT = /\b(?:loan|borrower|lender|credit|debt|interest|rate|fee|guarant|collateral|repay|maturity|term|eligib|ineligib|application|form|handbook|notice|regulation|require|must|shall|maximum|minimum|amount|percent|refinanc|equity|ownership|contribution|delinquen|default|servic|farm ownership|farm operating|emergency loan|microloan|7\(a\)|504|business and industry|community facilities|rural energy)\b/i;
const LEGALLY_MATERIAL = /\b(?:eligib|ineligib|credit elsewhere|collateral|required guarant|personal guarant|citizen|residen|criminal|debar|default|delinquen|environmental|flood|size standard|affiliat|ownership|control|loan purpose|use of proceeds|refinanc|equity injection|borrower contribution|adverse action|prohibited|not eligible|shall not|must not)\b/i;
const STRUCTURED_AUTHORITY = /(?:\$\s*[\d,.]+|\b\d+(?:\.\d+)?\s*%|\b(?:effective|revised|revision date|dated)\b|\b(?:SBA|FSA|RD)\s+Form\s+[A-Z0-9-]+)/i;

function sha(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function normalizeClause(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u2013\u2014]/g, "-")
    .trim();
}

export function buildFederalAuthoritySemanticFingerprint(text: string): FederalAuthoritySemanticFingerprint {
  const normalized = normalizeClause(text);
  const clauses = normalized
    .split(/(?<=[.!?;])\s+|\s+(?=(?:Eligibility|Requirements?|Rates?|Fees?|Terms?|Forms?|Maximum|Minimum)\s*[:\-])/i)
    .map(normalizeClause)
    .filter((clause) => clause.length >= 20)
    .filter((clause) => LENDING_RELEVANT.test(clause) || STRUCTURED_AUTHORITY.test(clause))
    .map((clause) => clause.slice(0, 1200));
  const unique = [...new Set(clauses)].sort((a, b) => a.localeCompare(b));
  const semanticText = unique.join("\n");
  const materiality = unique.some((clause) => LEGALLY_MATERIAL.test(clause))
    ? "LEGALLY_MATERIAL"
    : unique.length > 0
      ? "LENDING_RELEVANT"
      : "INFORMATIONAL";
  const reasonCodes = [
    materiality === "LEGALLY_MATERIAL" ? "MATERIAL_AUTHORITY_LANGUAGE_PRESENT" : null,
    unique.some((clause) => STRUCTURED_AUTHORITY.test(clause)) ? "STRUCTURED_PROGRAM_FACT_PRESENT" : null,
    unique.length === 0 ? "NO_LENDING_AUTHORITY_CLAUSES" : null,
  ].filter((value): value is string => Boolean(value));
  return { semanticHash: sha(semanticText), semanticText, clauses: unique, materiality, reasonCodes };
}

export function classifyFederalAuthorityChange(input: {
  previousText: string | null | undefined;
  nextText: string | null | undefined;
}): {
  materiality: FederalAuthorityChangeMateriality;
  disposition: "AUTO_CLEARED" | "REVIEW_REQUIRED";
  previousSemanticHash: string | null;
  nextSemanticHash: string;
  reasonCodes: string[];
} {
  const next = buildFederalAuthoritySemanticFingerprint(input.nextText ?? "");
  if (!input.previousText) {
    return {
      materiality: next.materiality,
      disposition: "REVIEW_REQUIRED",
      previousSemanticHash: null,
      nextSemanticHash: next.semanticHash,
      reasonCodes: ["PRIOR_SEMANTIC_BASELINE_MISSING", ...next.reasonCodes],
    };
  }
  const previous = buildFederalAuthoritySemanticFingerprint(input.previousText);
  if (previous.semanticHash === next.semanticHash) {
    const noAuthorityClauses = previous.clauses.length === 0 && next.clauses.length === 0;
    return {
      materiality: noAuthorityClauses ? "INFORMATIONAL" : "COSMETIC",
      disposition: "AUTO_CLEARED",
      previousSemanticHash: previous.semanticHash,
      nextSemanticHash: next.semanticHash,
      reasonCodes: noAuthorityClauses
        ? ["NO_LENDING_AUTHORITY_CLAUSES", "INFORMATIONAL_CHANGE_ISOLATED"]
        : ["SEMANTIC_AUTHORITY_UNCHANGED"],
    };
  }
  if (next.materiality === "INFORMATIONAL") {
    return {
      materiality: "INFORMATIONAL",
      disposition: "AUTO_CLEARED",
      previousSemanticHash: previous.semanticHash,
      nextSemanticHash: next.semanticHash,
      reasonCodes: ["NO_LENDING_AUTHORITY_CLAUSES", "INFORMATIONAL_CHANGE_ISOLATED"],
    };
  }
  return {
    materiality: next.materiality,
    disposition: "REVIEW_REQUIRED",
    previousSemanticHash: previous.semanticHash,
    nextSemanticHash: next.semanticHash,
    reasonCodes: next.reasonCodes,
  };
}
