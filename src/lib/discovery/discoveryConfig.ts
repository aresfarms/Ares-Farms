/**
 * Discovery front-door configuration (feature flag).
 *
 * Caitlin (2026-06-11): run discovery-primary while the existing property
 * map / Explore / browse stays a fully-usable SECONDARY path, until she sees the
 * engine working — then decide the default. Nothing existing is removed.
 *
 * - DISCOVERY_PRIMARY=true (default): the Possibility Discovery Engine is the
 *   primary "What are your possibilities?" front door; browse stays one click away.
 * - DISCOVERY_PRIMARY=false: keep browse primary; discovery is still reachable
 *   at /discover but is not promoted as the front door.
 *
 * Env-overridable so the default can flip without a code change (Vol IV runbook).
 */

export function discoveryPrimary(): boolean {
  const v = process.env.DISCOVERY_PRIMARY;
  if (v == null) return true; // default ON — discovery-primary
  return v !== "false" && v !== "0";
}

/** The primary front door route. */
export const DISCOVERY_HREF = "/discover";
/** The preserved secondary browse route (the Crexi-style direct browser). */
export const BROWSE_HREF = "/explore?lane=property-land";
