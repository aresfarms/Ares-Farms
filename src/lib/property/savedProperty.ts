/**
 * Saved properties — IN-SESSION, NO ACCOUNT, NO PII.
 *
 * The "Save" capability of the value loop (explore → find → SAVE → print / take it
 * with you). Saved properties live ONLY in the browser tab's sessionStorage:
 *   - no account, no sign-in, no cookie sent to any server,
 *   - no personal information collected,
 *   - ephemeral — cleared when the tab closes ("the map reveals opportunities,
 *     not the visitor").
 * A later step (4b, the anonymous token) lets a visitor CHOOSE to persist this
 * set under the data-rights regime — but by default nothing leaves the tab.
 *
 * Client-only: every function guards `typeof window`. The stored snapshot is the
 * PROPERTY's own public fields (government listing data) — never visitor data.
 */

export interface SavedProperty {
  id: string;
  town: string;
  county: string;
  state: string;
  propertyType: string;
  priceLabel: string;
  exactAddress: string | null;
  zip: string | null;
  sourceId: "usda" | "hud" | "treasury" | "gsa-realestate";
  sourceCitation: string;
  isCurrent: boolean;
  vintageStamp: string;
  listingUrl: string;
  /** Illustrative finance-pathway tags (e.g. USDA / FHA) — for the handoff. */
  pathways: string[];
}

const KEY = "furlong.saved.v1";
/** Fired on the window whenever the saved set changes (same-tab live updates). */
export const SAVED_EVENT = "furlong:saved-changed";

function read(): SavedProperty[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as SavedProperty[]) : [];
  } catch {
    return [];
  }
}

function write(list: SavedProperty[]): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* sessionStorage unavailable (private mode quota) — saving is best-effort */
  }
  window.dispatchEvent(new Event(SAVED_EVENT));
}

export function getSaved(): SavedProperty[] {
  return read();
}

export function isSaved(id: string): boolean {
  return read().some((p) => p.id === id);
}

/** Toggle a property in the saved set. Returns true if now saved, false if removed. */
export function toggleSaved(p: SavedProperty): boolean {
  const list = read();
  const idx = list.findIndex((x) => x.id === p.id);
  if (idx >= 0) {
    list.splice(idx, 1);
    write(list);
    return false;
  }
  list.push(p);
  write(list);
  return true;
}

export function removeSaved(id: string): void {
  write(read().filter((p) => p.id !== id));
}

/** Replace the whole saved set (e.g. after returning with an anonymous token). */
export function replaceSaved(list: SavedProperty[]): void {
  write(Array.isArray(list) ? list : []);
}
