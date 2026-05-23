export type LedgerEntry = {
  id: string;
  userId: string;
  eventType: string;
  decision: string;

  compositeScore: string | number;
  riskScore: string | number;

  input: Record<string, any>;
  output: Record<string, any>;
  trace: Record<string, any>;

  hash: string | null;
  prevHash: string | null;
  eventHash: string | null;

  createdAt: string | Date;
};

export type LedgerIssue =
  | "MISSING_HASH"
  | "MISSING_EVENT_HASH"
  | "CHAIN_BREAK"
  | "INVALID_EVENT_HASH";

export type LedgerValidationIssue = {
  id: string;
  issue: LedgerIssue;
};

export type CanonicalLedgerResult =
  | {
      ok: true;
      mode: "canonical";
      entries: LedgerEntry[];
      issues: [];
      brokenIndex: null;
    }
  | {
      ok: false;
      mode: "canonical";
      entries: LedgerEntry[];
      issues: LedgerValidationIssue[];
      brokenIndex: number | null;
    };
