export function probabilityOfDefault(score: number) {
  const normalized = Math.max(0, Math.min(1, (250 - score) / 250));
  return 0.1 + normalized * 0.6;
}

export function approvalProbability(score: number) {
  return Math.min(1, score / 250);
}
