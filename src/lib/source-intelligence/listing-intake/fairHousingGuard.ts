/**
 * Fair-housing advertising guard (SOURCE-INTELLIGENCE unit).
 *
 * Every residential/land listing must pass this before approval; commercial runs
 * it too (lower risk). Scans listing text for language that expresses a
 * preference, limitation, or discrimination based on a Fair Housing Act protected
 * class (race, color, religion, sex, disability, familial status, national
 * origin) — 42 U.S.C. §3604(c). Deterministic + explainable; flags for human
 * review, never auto-publishes flagged text.
 *
 * This is a guard, not legal advice — it catches common ad violations; a human
 * reviewer still signs off. Conservative: any hit → not clear.
 */

export interface FairHousingFinding {
  term: string;
  category: string;
  message: string;
}

export interface FairHousingResult {
  clear: boolean;
  findings: FairHousingFinding[];
}

// Patterns drawn from HUD advertising guidance on phrases that imply a protected-
// class preference/limitation. Word-boundaried; case-insensitive.
const RULES: { category: string; patterns: RegExp[] }[] = [
  { category: "familial status", patterns: [
    /\bno\s+(?:kids|children)\b/i, /\badults?\s+only\b/i, /\bno\s+families\b/i,
    /\bperfect\s+for\s+(?:a\s+)?(?:single|couple)\b/i, /\bempty[-\s]?nesters?\b/i, /\bmature\s+(?:person|couple|individual)\b/i,
  ]},
  { category: "religion", patterns: [
    /\bchristian\b/i, /\bcatholic\b/i, /\bjewish\b/i, /\bmuslim\b/i, /\bchurch[-\s]?going\b/i, /\bno\s+\w+\s+faith\b/i,
  ]},
  { category: "race / color / national origin", patterns: [
    /\bwhites?\s+only\b/i, /\bno\s+(?:blacks?|hispanics?|asians?|latinos?)\b/i, /\bexclusive\s+(?:white|ethnic)\b/i,
    /\bpreferred\s+(?:race|ethnicity|nationality)\b/i,
  ]},
  { category: "sex / gender", patterns: [/\b(?:male|female)\s+only\b/i, /\bno\s+(?:men|women)\b/i, /\bbachelor\s+pad\b/i] },
  { category: "disability", patterns: [
    /\bno\s+(?:disabled|handicap(?:ped)?)\b/i, /\bable[-\s]?bodied\b/i, /\bno\s+wheelchair\b/i, /\bmust\s+be\s+able\s+to\s+walk\b/i,
  ]},
];

export function fairHousingScan(text: string): FairHousingResult {
  const findings: FairHousingFinding[] = [];
  const t = (text ?? "").replace(/\s+/g, " ");
  for (const rule of RULES) {
    for (const re of rule.patterns) {
      const g = new RegExp(re.source, re.flags.includes("g") ? re.flags : `${re.flags}g`);
      let m: RegExpExecArray | null;
      while ((m = g.exec(t))) {
        findings.push({
          term: m[0],
          category: rule.category,
          message: `Possible Fair Housing Act violation (${rule.category}): "${m[0].trim()}". Remove protected-class preference/limitation before approval.`,
        });
      }
    }
  }
  return { clear: findings.length === 0, findings };
}
