/**
 * Discovery flow-state resolver (ISOMORPHIC, pure).
 *
 * `/discover` serves several DISTINCT journeys. The generic persona-first
 * "possibilities" interview must NOT be the default when the route, query,
 * entrypoint, or prior state signals a PLACE/PROPERTY-facts journey — a person
 * arriving from an Opportunity Zone or place-facts link should land on a
 * PLACE-FIRST card (address / parcel / county / state → verified OZ / rural /
 * tract facts), with persona only as a later, secondary step.
 *
 * Governance basis: Master Volume VI separates Property Discovery & Canonical
 * Property Governance from general customer/revenue intelligence. This resolver
 * is the UI flow-state machine that reflects that separation — it runs BEFORE
 * the card renders, so the right journey is chosen up front.
 */

export type DiscoveryFlow =
  | "place-facts"
  | "opportunity-zone"
  | "property-discovery"
  | "possibilities-persona";

/** The place/property-first journeys (everything except the persona interview). */
export const PLACE_FIRST_FLOWS: DiscoveryFlow[] = ["place-facts", "opportunity-zone", "property-discovery"];

export function isPlaceFirstFlow(flow: DiscoveryFlow): boolean {
  return PLACE_FIRST_FLOWS.includes(flow);
}

export interface FlowResolverInput {
  /** The pathname, e.g. "/discover" or "/discover/opportunity-zone". */
  route?: string;
  /** Parsed query params (e.g. { mode, topic }). Values may be string | string[]. */
  query?: Record<string, string | string[] | undefined>;
  /** Where the visitor came from (a link id, referrer hint, campaign tag). */
  entrypoint?: string;
  /** Any prior resolved flow carried in session/app state. */
  priorState?: { flow?: DiscoveryFlow } | null;
}

const ALL_FLOWS: DiscoveryFlow[] = ["place-facts", "opportunity-zone", "property-discovery", "possibilities-persona"];

const first = (v: string | string[] | undefined): string =>
  (Array.isArray(v) ? v[0] : v ?? "").toLowerCase().trim();

/** Map a free-form token (query value, path segment, entrypoint) to a flow. */
function flowFromToken(token: string): DiscoveryFlow | null {
  const t = token.replace(/_/g, "-");
  if (!t) return null;
  if (ALL_FLOWS.includes(t as DiscoveryFlow)) return t as DiscoveryFlow;
  if (/opportunity-?zone|(^|[^a-z])oz([^a-z]|$)|qoz/.test(t)) return "opportunity-zone";
  if (/place-?fact/.test(t)) return "place-facts";
  if (/property|parcel|address|listing|land-?facts/.test(t)) return "property-discovery";
  if (/possibilit|persona|who-are-you|general/.test(t)) return "possibilities-persona";
  return null;
}

/**
 * Resolve the discovery flow. Precedence (strongest first):
 *   1. explicit ?mode=  2. ?topic=  3. path segment under /discover/
 *   4. entrypoint hint  5. prior state  6. default → possibilities-persona.
 * Returns the persona interview ONLY when nothing indicates place/property.
 */
export function resolveDiscoveryFlow(input: FlowResolverInput = {}): DiscoveryFlow {
  const q = input.query ?? {};

  // 1 + 2 — explicit query intent.
  for (const key of ["mode", "topic", "flow", "journey"]) {
    const f = flowFromToken(first(q[key]));
    if (f) return f;
  }

  // 3 — path segment after /discover/.
  const seg = (input.route ?? "").replace(/^\/+|\/+$/g, "").split("/");
  const idx = seg.indexOf("discover");
  if (idx >= 0 && seg[idx + 1]) {
    const f = flowFromToken(seg[idx + 1]);
    if (f) return f;
  }

  // 4 — entrypoint hint (came from an OZ / place-facts / property link).
  const fromEntry = flowFromToken((input.entrypoint ?? "").toLowerCase());
  if (fromEntry) return fromEntry;

  // 5 — prior resolved state.
  if (input.priorState?.flow && ALL_FLOWS.includes(input.priorState.flow)) return input.priorState.flow;

  // 6 — default.
  return "possibilities-persona";
}
