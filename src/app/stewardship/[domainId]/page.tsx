import Link from "next/link";
import { notFound } from "next/navigation";

import {
  STEWARDSHIP_DOCTRINE_RULES,
  STEWARDSHIP_DOMAINS,
  stewardshipDomainById,
} from "@/lib/stewardship/stewardshipRegistry";

/**
 * Steward profile page (Build 44-A) — /stewardship/<domainId>.
 *
 * Uses stewardship language ("Steward of …"). Focuses on what pathways the
 * steward helps illuminate, what questions they help explore, and when human
 * review may be appropriate. No expert/guru/master/captain/salesperson framing,
 * no advisor-first positioning, no sales or approval/guarantee language.
 * The domain persists; the current steward may change.
 */

export function generateStaticParams() {
  return STEWARDSHIP_DOMAINS.map((d) => ({ domainId: d.domainId }));
}

const shell = {
  minHeight: "100vh",
  background: "#f6f8fb",
  color: "#162033",
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
} as const;

const container = {
  maxWidth: 820,
  margin: "0 auto",
  padding: "40px 24px 56px",
  display: "grid",
  gap: 22,
} as const;

const card = {
  background: "#ffffff",
  border: "1px solid #d7deea",
  borderRadius: 12,
  padding: 22,
} as const;

const muted = { color: "#5d687a", lineHeight: 1.6 } as const;

function List({ items }: { items: string[] }) {
  return (
    <ul style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 6 }}>
      {items.map((i) => (
        <li key={i} style={{ lineHeight: 1.6 }}>
          {i}
        </li>
      ))}
    </ul>
  );
}

export default async function StewardProfilePage({
  params,
}: {
  params: Promise<{ domainId: string }>;
}) {
  const { domainId } = await params;
  const domain = stewardshipDomainById(domainId);
  if (!domain) {
    notFound();
  }

  return (
    <main style={shell}>
      <div style={container}>
        <header style={{ display: "grid", gap: 8 }}>
          <Link href="/stewardship" style={{ color: "#0f766e", fontSize: 14, textDecoration: "none" }}>
            ← All stewardship domains
          </Link>
          <h1 style={{ margin: 0, fontSize: 32, lineHeight: 1.15 }}>
            {domain.stewardTitle}
          </h1>
          <p style={{ ...muted, margin: 0 }}>
            Current Steward: <strong>{domain.currentSteward}</strong>
          </p>
          <p style={{ ...muted, margin: 0 }}>{domain.description}</p>
        </header>

        <section style={card}>
          <h2 style={{ marginTop: 0, fontSize: 20 }}>
            Pathways this steward helps illuminate
          </h2>
          <List items={domain.helpsIlluminate} />
        </section>

        <section style={card}>
          <h2 style={{ marginTop: 0, fontSize: 20 }}>
            Questions this steward helps you explore
          </h2>
          <List items={domain.questionsExplored} />
        </section>

        <section style={card}>
          <h2 style={{ marginTop: 0, fontSize: 20 }}>
            When human review may be appropriate
          </h2>
          <List items={domain.whenHumanReviewAppropriate} />
          {domain.heldForAlphaNote && (
            <p style={{ ...muted, margin: "10px 0 0", fontSize: 13 }}>
              {domain.heldForAlphaNote}
            </p>
          )}
        </section>

        <section
          style={{
            ...card,
            background: "#f8fafc",
          }}
        >
          <h2 style={{ marginTop: 0, fontSize: 18 }}>How stewardship works</h2>
          <ul style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 6 }}>
            {STEWARDSHIP_DOCTRINE_RULES.map((rule) => (
              <li key={rule} style={{ lineHeight: 1.6 }}>
                {rule}
              </li>
            ))}
          </ul>
          <p style={{ ...muted, margin: "10px 0 0" }}>
            The journey remains yours. The decisions remain yours. We help you
            understand the map.
          </p>
        </section>

        <footer style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
          <Link href="/onboarding" style={{ color: "#0f766e", fontSize: 14, textDecoration: "none" }}>
            Tell us about your project
          </Link>
          <Link href="/trust" style={{ color: "#0f766e", fontSize: 14, textDecoration: "none" }}>
            How we handle your information
          </Link>
          <Link href="/stewardship" style={{ color: "#0f766e", fontSize: 14, textDecoration: "none" }}>
            All stewardship domains
          </Link>
        </footer>
      </div>
    </main>
  );
}
