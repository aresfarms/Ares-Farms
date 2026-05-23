export type ReplayVerifyResponse = {
  ok: boolean;
  verified: boolean;

  error: string | null;
  message: string | null;

  total_rows: number;
  mismatch_count: number;

  rows: any[];
};
