/**
 * sessionAuthority — the ONE place a request's privilege level is decided.
 *
 * FOUNDER-CAUGHT 2026-08-06. Twenty admin API routes read their caller's role
 * straight out of the query string:
 *
 *     role: params.get("role") ?? "user"          // ← anyone can type this
 *     privilegedRole(role) → role === "admin" || role === "governance"
 *
 * A query parameter is a CLAIM, not a credential. `?role=governance` on a URL
 * is something any caller can write, so those routes were granting privilege
 * on the caller's own say-so. The API perimeter caught the console doing it
 * ("Caller-claimed authority conflicts with session") and blocked the request —
 * which is why the governance console showed zeros rather than data. The 403
 * was the control working, not the bug.
 *
 * THE RULE: authority is DERIVED, never accepted. It comes from the session
 * email the proxy verified (x-ares-authenticated-email) resolved against a
 * server-side registry. A client may state which lane it wants; it may never
 * state what it is.
 *
 * This mirrors the pattern already applied to the lender desk
 * (api/lender/deal-desk resolveIdentity) and generalizes it, so the twenty
 * routes stop each inventing their own answer.
 *
 * Master Volume Governance: Vol II (authority is granted, never asserted),
 * Vol III-B (GOV-RUNTIME-001 runtime guard boundary), Vol V (replay-safe —
 * the derived role is a pure function of session identity plus registry).
 */

import type { NextRequest } from "next/server";

import { operatorByEmail } from "@/lib/auth/operatorRegistry";
import { professionalRole } from "@/lib/auth/professionalRegistry";
import { apiAuthEnforcementRequired } from "@/lib/security/apiSecurityPolicy";

export interface SessionAuthority {
  /** The role the SERVER concluded. Never a client claim. */
  role: string;
  /** Stable actor identity for audit — the session email where we have one. */
  actorId: string | null;
  /** How the role was reached, for the audit trail. */
  basis:
    | "operator-registry"
    | "professional-registry"
    | "session-header"
    | "dev-unenforced"
    | "anonymous";
}

export function sessionAuthority(req: NextRequest): SessionAuthority {
  const email = req.headers.get("x-ares-authenticated-email")?.trim() || null;
  const sessionActor =
    req.headers.get("x-ares-authenticated-user-id")?.trim() || email;

  // 1. Internal operators — the founder-operator carries governance authority;
  //    everyone else in the registry is a plain operator.
  const operator = operatorByEmail(email);
  if (operator) {
    return {
      role: operator.role === "founder-operator" ? "governance" : "operator",
      actorId: email ?? operator.id,
      basis: "operator-registry",
    };
  }

  // 2. Named outside counterparties (Module 45 grants). Never privileged on
  //    the admin consoles — a lender or auditor grant is its own lane.
  const granted = professionalRole(email);
  if (granted) {
    return { role: granted, actorId: email ?? sessionActor, basis: "professional-registry" };
  }

  // 3. A role the PROXY itself stamped after verifying the session. This is a
  //    server-set header on an internal hop, not a caller-supplied value —
  //    the perimeter strips inbound copies before this is ever read.
  const sessionRole = req.headers.get("x-ares-authenticated-role")?.trim();
  if (sessionRole) {
    return { role: sessionRole, actorId: sessionActor, basis: "session-header" };
  }

  // 4. Local development with enforcement off. NEVER reachable in staging or
  //    production, where API_AUTH_ENFORCEMENT=required.
  if (!apiAuthEnforcementRequired()) {
    return { role: "governance", actorId: sessionActor ?? "dev-console", basis: "dev-unenforced" };
  }

  // 5. Default deny. An unrecognised session is an ordinary user, which the
  //    admin routes treat as unprivileged and scope to nothing.
  return { role: "user", actorId: sessionActor, basis: "anonymous" };
}

/** Convenience for the common `role:` field on the admin query objects. */
export function effectiveRole(req: NextRequest): string {
  return sessionAuthority(req).role;
}
