/** Browser recovery credentials stay out of URLs. The API remains the ownership
 * authority; this store only preserves access across navigation and reloads.
 */
const LAST_KEY = "furlong:property-comparison-access:v1";
const key = (id: string) => `${LAST_KEY}:${id}`;
export type SavedComparisonAccess = {
  comparisonId: string; accessToken: string; propertyCount: number;
  requestedResultCount: number; expiresAt: string;
};
export function readComparisonAccess(storage: Pick<Storage, "getItem">, id?: string | null): SavedComparisonAccess | null {
  try {
    const raw = (id ? storage.getItem(key(id)) : null) ?? storage.getItem(LAST_KEY);
    const value = raw ? JSON.parse(raw) as SavedComparisonAccess : null;
    if (!value || typeof value.comparisonId !== "string" || (id && value.comparisonId !== id) ||
        typeof value.accessToken !== "string" || !/^furlong-comparison-[A-Za-z0-9_-]{43}$/.test(value.accessToken) ||
        !Number.isFinite(Date.parse(value.expiresAt)) || Date.parse(value.expiresAt) <= Date.now()) return null;
    return value;
  } catch { return null; }
}
export function saveComparisonAccess(storage: Pick<Storage, "setItem">, value: SavedComparisonAccess) {
  storage.setItem(key(value.comparisonId), JSON.stringify(value));
  storage.setItem(LAST_KEY, JSON.stringify(value));
}
