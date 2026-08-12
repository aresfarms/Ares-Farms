import { notFound } from "next/navigation";

import { Disclosures } from "@/components/public/Disclosures";
import { canonicalProviderAuthority } from "@/lib/platform/authorities/provider";

/**
 * Provider Page (public, no account) — reusable across lanes.
 *
 * Neutral-directory model: provider branding + their OWN claims/disclosures
 * (clearly attributed, under their license), a "separate company" label, the
 * transparent license-to-operate statement, and a single PORTAL-OUT CTA to the
 * provider's own site/intake. Furlong passes NO personal data (link-out only —
 * no embedded form, no backend submission). Furlong's own disclosures still
 * render; Furlong makes NONE of the provider's lending/eligibility claims.
 */

const muted = { color: "#5d687a", lineHeight: 1.65 } as const;
const container = { maxWidth: 820, margin: "0 auto", padding: "32px 24px 72px", display: "grid", gap: 22 } as const;
const card = { background: "#ffffff", border: "1px solid #d7deea", borderRadius: 12, padding: "20px 24px", display: "grid", gap: 10 } as const;

export default async function ProviderPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const provider = canonicalProviderAuthority.bySlug(slug);
  if (!provider) notFound();

  return (
    <main>
      <div style={container}>
        <header style={{ display: "grid", gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", color: "#0f766e" }}>
            Provider directory · no account needed
          </span>
          <h1 style={{ margin: 0, fontSize: "clamp(26px, 4vw, 36px)", fontWeight: 800, letterSpacing: "-0.02em", color: "#162033" }}>
            {provider.name}
          </h1>
          <p style={{ margin: 0, fontSize: 17, ...muted }}>{provider.tagline}</p>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#9a3412" }}>{provider.separateCompanyLabel}</p>
          {provider.affiliationNote && (
            <p style={{ margin: 0, fontSize: 13, ...muted }}>{provider.affiliationNote}</p>
          )}
        </header>

        {/* What they offer / who they serve (the provider's description). */}
        <section style={card}>
          <strong style={{ fontSize: 15, color: "#162033" }}>What {provider.name} offers</strong>
          <ul style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 6 }}>
            {provider.whatTheyDo.map((w) => <li key={w} style={{ ...muted, fontSize: 15 }}>{w}</li>)}
          </ul>
          <p style={{ margin: 0, ...muted, fontSize: 14 }}><strong>Who they serve:</strong> {provider.whoTheyServe}</p>
          <p style={{ margin: 0, fontSize: 13, color: "#7a8aa0" }}>{provider.licenseStatement}</p>
        </section>

        {/* Provider's OWN claims + disclosures — clearly attributed, never Furlong's. */}
        <section style={{ ...card, borderColor: "#cbd5e1", background: "#f8fafc" }}>
          <strong style={{ fontSize: 15, color: "#162033" }}>
            {provider.name}&apos;s own statements (made under its license — not Furlong&apos;s)
          </strong>
          <ul style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 6 }}>
            {provider.providerClaims.map((c) => <li key={c} style={{ ...muted, fontSize: 15 }}>{c}</li>)}
          </ul>
          {provider.providerDisclosures.map((d) => (
            <p key={d} style={{ margin: 0, fontSize: 12, color: "#7a8aa0", lineHeight: 1.55 }}>{d}</p>
          ))}
        </section>

        {/* Portal-out CTA — opens the provider's OWN site. Furlong passes no data. */}
        <section style={{ ...card, borderColor: "#0f766e", textAlign: "center", gap: 12 }}>
          <p style={{ margin: 0, ...muted, fontSize: 14 }}>
            Ready to talk to them? You&apos;ll go to {provider.name}&apos;s own website and engage them
            directly — Furlong does not submit or share your information.
          </p>
          <a
            href={provider.portalOutUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ justifySelf: "center", display: "inline-flex", alignItems: "center", gap: 6, minHeight: 48, padding: "0 24px", borderRadius: 999, background: "#0f766e", color: "#fff", fontWeight: 800, fontSize: 16, textDecoration: "none" }}
          >
            {provider.portalOutLabel} ↗
          </a>
        </section>

        {/* The transparent license-to-operate model (verbatim; fee amount never shown). */}
        <p style={{ margin: 0, fontSize: 13, ...muted, fontStyle: "italic", borderLeft: "3px solid #c9a84c", paddingLeft: 14 }}>
          {canonicalProviderAuthority.licenseModelStatement(provider.name)}
        </p>

        {/* Furlong's own canonical disclosures (advisory only; not a lender/broker/agency). */}
        <Disclosures variant="full" />
      </div>
    </main>
  );
}
