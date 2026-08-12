/**
 * verify:public-api-surface — every route under /api/public is a DECISION.
 *
 * Sweep finding S-1 (2026-08-11): `/api/public` was a bare prefix in
 * apiSecurityPolicy, so a route left the API perimeter because of where its
 * file sat. 26 routes were public by directory layout rather than by anyone
 * choosing it, and nothing would have noticed the 27th.
 *
 * This gate closes that in both directions:
 *   · a NEW file under src/app/api/public/ that nobody enumerated -> FAIL,
 *     because it would otherwise be exposed silently;
 *   · an enumerated entry whose route no longer exists -> FAIL, because a
 *     stale allowlist entry is a hole waiting for someone to re-create the
 *     path later with different behaviour.
 */
import fs from "node:fs";
import path from "node:path";

import { PUBLIC_API_ROUTES } from "@/lib/security/apiSecurityPolicy";

const ROOT = path.join(process.cwd(), "src", "app", "api", "public");

function routesOnDisk(dir: string, prefix = "/api/public"): string[] {
  const found: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      found.push(...routesOnDisk(full, `${prefix}/${entry.name}`));
    } else if (entry.name === "route.ts") {
      // A dynamic segment is covered by its parent entry, matching the
      // policy's own sub-path rule.
      found.push(prefix.replace(/\/\[[^\]]*\]$/, ""));
    }
  }
  return found;
}

const onDisk = [...new Set(routesOnDisk(ROOT))].sort();
const declared = [...PUBLIC_API_ROUTES].sort();

const undeclared = onDisk.filter((r) => !PUBLIC_API_ROUTES.has(r));
const stale = declared.filter((r) => !onDisk.includes(r));

for (const route of undeclared) {
  console.error(
    `  UNDECLARED  ${route}\n` +
      "      exists under src/app/api/public/ but is NOT in PUBLIC_API_ROUTES.\n" +
      "      Either enumerate it deliberately (with a comment saying why it is\n" +
      "      anonymous and what guards it), or move it out of /api/public."
  );
}
for (const route of stale) {
  console.error(
    `  STALE       ${route}\n` +
      "      declared public but has no route file. Remove it — a stale entry\n" +
      "      silently pre-approves whatever is created at that path next."
  );
}

if (undeclared.length || stale.length) {
  console.error(
    `\n✗ verify:public-api-surface FAIL — ${undeclared.length} undeclared, ${stale.length} stale.`
  );
  process.exit(1);
}

console.log(
  `✓ verify:public-api-surface PASS — ${onDisk.length} public routes, each explicitly declared; no stale entries.`
);
