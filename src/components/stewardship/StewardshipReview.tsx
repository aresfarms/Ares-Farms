import Link from "next/link";

import {
  STEWARDSHIP_REVIEW_PROMPT,
  stewardshipDomainsForExplorationModule,
  type StewardshipDomain,
} from "@/lib/stewardship/stewardshipRegistry";

/**
 * Stewardship Review prompt (Build 44-A).
 *
 * Shown in an exploration flow only AFTER exploratory value has been provided,
 * when human review becomes appropriate. The customer always retains control:
 * "You may continue exploring on your own or request stewardship review."
 *
 * Pass either an explicit list of domains or an exploration moduleId (the
 * relevant stewardship domains are looked up from the registry).
 */

const muted = { color: "#5d687a", lineHeight: 1.6 } as const;

export function StewardshipReview({
  moduleId,
  domains,
}: {
  moduleId?: string;
  domains?: StewardshipDomain[];
}) {
  const resolved =
    domains ??
    (moduleId ? stewardshipDomainsForExplorationModule(moduleId) : []);

  if (resolved.length === 0) {
    return null;
  }

  return (
    <section
      aria-label="Stewardship review options"
      style={{
        display: "grid",
        gap: 12,
        padding: 20,
        border: "1px solid #d7deea",
        borderRadius: 12,
        background: "#f8fafc",
      }}
    >
      <h3 style={{ margin: 0, fontSize: 20 }}>
        {STEWARDSHIP_REVIEW_PROMPT.heading}
      </h3>
      <p style={{ ...muted, margin: 0 }}>{STEWARDSHIP_REVIEW_PROMPT.body}</p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        {resolved.map((domain) => (
          <Link
            key={domain.domainId}
            href={domain.profileRoute}
            style={{
              display: "inline-flex",
              alignItems: "center",
              minHeight: 44,
              padding: "0 16px",
              borderRadius: 8,
              border: "1px solid #0f766e",
              background: "#ffffff",
              color: "#0f766e",
              fontWeight: 700,
              fontSize: 14,
              textDecoration: "none",
            }}
          >
            {domain.domainName} Stewardship
          </Link>
        ))}
      </div>

      <p style={{ ...muted, margin: 0, fontSize: 13 }}>
        You are in control. Keep exploring on your own whenever you like —
        stewardship review is always optional.
      </p>
    </section>
  );
}
