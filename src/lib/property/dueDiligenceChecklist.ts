"use client";

/**
 * The Uncharted Checklist — device-only, zero-PII persistence for the report's
 * due-diligence workbook (founder direction 2026-07-20: the Uncharted items
 * become tickable checkboxes you can check off and have remembered).
 *
 * Same privacy posture as the property-evaluation drafts: state lives in
 * localStorage ON THIS DEVICE ONLY, keyed by property, never sent to a server,
 * clearable any time (untick, or clear the browser). We store only which
 * diligence items the visitor has marked done — booleans against item keys —
 * nothing about the person and nothing about the property beyond its id.
 */

const KEY = "furlong.diligence-checklist.v1";

type ChecklistStore = Record<string, Record<string, boolean>>;

function readAll(): ChecklistStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? (parsed as ChecklistStore) : {};
  } catch {
    return {};
  }
}

function writeAll(next: ChecklistStore): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* best effort only */
  }
}

/** The checked-item map for one property (empty when nothing is ticked yet). */
export function loadChecklist(propertyId: string): Record<string, boolean> {
  return readAll()[propertyId] ?? {};
}

/** Toggle one item and persist; returns the property's new checked map. */
export function setChecklistItem(
  propertyId: string,
  itemKey: string,
  checked: boolean
): Record<string, boolean> {
  const all = readAll();
  const current = { ...(all[propertyId] ?? {}) };
  if (checked) current[itemKey] = true;
  else delete current[itemKey];
  all[propertyId] = current;
  writeAll(all);
  return current;
}
