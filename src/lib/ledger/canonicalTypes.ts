export type CanonicalStatus =
  | "VALID"
  | "BROKEN"
  | "GENESIS"
  | "WARNING";

export type CanonicalSeverity = "LOW" | "MEDIUM" | "CRITICAL";

export type CanonicalMeta = {
  status: CanonicalStatus;
  severity: CanonicalSeverity;
  reason?: string;
  isGenesis: boolean;
  expectedPrevHash: string | null;
  computedHash: string | null;
};
