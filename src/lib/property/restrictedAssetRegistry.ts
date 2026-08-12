export type RestrictedAssetCategory =
  | "government-civic"
  | "public-safety"
  | "healthcare"
  | "energy-grid"
  | "critical-infrastructure"
  | "military-corrections";

export type RestrictedAssetMatch = {
  category: RestrictedAssetCategory;
  label: string;
};

const RESTRICTED_ASSET_RULES: Array<{
  category: RestrictedAssetCategory;
  label: string;
  pattern: RegExp;
}> = [
  {
    category: "government-civic",
    label: "government or civic facility",
    pattern: /\b(?:white\s+house|u\.?s\.?\s+capitol|supreme\s+court|pentagon|smithsonian|library\s+of\s+congress|federal\s+reserve|treasury\s+building|executive\s+office\s+building|city\s+hall|courthouse|post\s+office|federal\s+building|municipal\s+building|county\s+building|state\s+house|governor'?s\s+mansion|embassy|consulate)\b/i,
  },
  {
    category: "public-safety",
    label: "public-safety facility",
    pattern: /\b(?:fire\s+station|firehouse|police\s+station|sheriff'?s\s+office|public\s+safety\s+building|emergency\s+operations\s+center|dispatch\s+center)\b/i,
  },
  {
    category: "healthcare",
    label: "healthcare or care facility",
    pattern: /\b(?:hospital|medical\s+center|clinic|urgent\s+care|surgery\s+center|dialysis\s+center|healthcare\s+facility|nursing\s+home|assisted\s+living)\b/i,
  },
  {
    category: "energy-grid",
    label: "energy or grid facility",
    pattern: /\b(?:substation|electrical?\s+substation|transfer\s+station|electric\s+transfer\s+station|switchyard|grid\s+station|grid\s+facility|transformer\s+yard|power\s+distribution\s+facility)\b/i,
  },
  {
    category: "critical-infrastructure",
    label: "critical infrastructure facility",
    pattern: /\b(?:nuclear\s+(?:plant|facility|reactor|station)|power\s+plant|water\s+treatment|wastewater\s+treatment|sewage\s+treatment|\bdam\b|rail\s*yard|telecom\s+(?:hub|facility)|pipeline|refinery|chemical\s+plant)\b/i,
  },
  {
    category: "military-corrections",
    label: "military or corrections facility",
    pattern: /\b(?:military\s+(?:base|site|installation)|air\s+force\s+base|naval\s+base|army\s+base|prison|correctional\s+facility|penitentiary|jail)\b/i,
  },
];

export function matchRestrictedAsset(text: string): RestrictedAssetMatch | null {
  for (const rule of RESTRICTED_ASSET_RULES) {
    if (rule.pattern.test(text)) {
      return { category: rule.category, label: rule.label };
    }
  }
  return null;
}

export function isHealthcareRestrictedCategory(match: RestrictedAssetMatch | null): boolean {
  return match?.category === "healthcare";
}
