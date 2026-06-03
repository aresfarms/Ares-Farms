import Link from "next/link";
import { notFound } from "next/navigation";

import {
  ADVISORY_ONLY_DISCLOSURE,
  BORROWER_PORTABILITY_DISCLOSURE,
  LENDER_READY_DISCLOSURE,
  evaluateContentClaims,
} from "@/lib/claims";
import {
  PortableSurfaceAudience,
  portableSurfaceById,
  publicSurfaceDisclosureMessages,
  portableSurfacesByAudience,
} from "@/lib/modules";

/**
 * Portable Vertical Surface Page
 *
 * Master Volume Governance:
 * - Vol 0: translates platform purpose by audience without changing doctrine.
 * - Vol I: keeps constitutional boundaries visible on every surface.
 * - Vol II: blocks final decisions, notices, payments, official reports, and
 *   regulated reliance claims.
 * - Vol III: points each vertical at governed backend surfaces.
 * - Vol III-B: displays claims, permission, classification, and evidence needs.
 * - Vol IV: supports operational handoff and escalation.
 * - Vol V: keeps content claims, portability, controlled disclosure, replay,
 *   and human review visible.
 */

const shellStyle = {
  minHeight: "100vh",
  background: "#f5f7fb",
  color: "#172033",
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
} as const;

const containerStyle = {
  maxWidth: 1160,
  margin: "0 auto",
  padding: 24,
  display: "grid",
  gap: 18,
} as const;

const panelStyle = {
  border: "1px solid #d5dce8",
  borderRadius: 8,
  background: "#ffffff",
} as const;

function titleForAudience(audience: PortableSurfaceAudience): string {
  if (audience === "borrower") {
    return "Borrower Portal";
  }

  if (audience === "lender") {
    return "Lender Portal";
  }

  if (audience === "sponsor") {
    return "Sponsor Portal";
  }

  return "Internal Module";
}

function statusTone(ok: boolean) {
  return ok
    ? { background: "#e6f4ee", color: "#047857" }
    : { background: "#fff1f0", color: "#b42318" };
}

function StatusPill(props: { ok: boolean; children: string }) {
  const tone = statusTone(props.ok);

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        minHeight: 28,
        padding: "0 10px",
        borderRadius: 999,
        background: tone.background,
        color: tone.color,
        fontSize: 12,
        fontWeight: 800,
        whiteSpace: "nowrap",
      }}
    >
      {props.children}
    </span>
  );
}

function ListPanel(props: { title: string; items: string[] }) {
  return (
    <section style={{ ...panelStyle, padding: 16, display: "grid", gap: 10 }}>
      <h2 style={{ margin: 0, fontSize: 20 }}>{props.title}</h2>
      <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.6 }}>
        {props.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

export function PortableVerticalSurfacePage(props: { surfaceId: string }) {
  const surface = portableSurfaceById(props.surfaceId);

  if (!surface) {
    notFound();
  }

  const claims = evaluateContentClaims({
    text: [
      surface.label,
      surface.purpose,
      surface.primaryStatus,
      ...surface.safeMessages,
      ADVISORY_ONLY_DISCLOSURE,
      BORROWER_PORTABILITY_DISCLOSURE,
      LENDER_READY_DISCLOSURE,
    ],
    context: {
      borrowerPortabilityAvailable: true,
      freeTierBaselineReadinessAvailable: true,
      lenderReadyDisclosurePresent: true,
    },
  });
  const peerSurfaces = portableSurfacesByAudience(surface.audience);

  return (
    <main style={shellStyle}>
      <div style={containerStyle}>
        <header style={{ display: "grid", gap: 12, padding: "16px 0 4px" }}>
          <p
            style={{
              margin: 0,
              color: "#596579",
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: 0,
              textTransform: "uppercase",
            }}
          >
            {titleForAudience(surface.audience)}
          </p>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
              alignItems: "start",
            }}
          >
            <div style={{ display: "grid", gap: 8, maxWidth: 820 }}>
              <h1 style={{ margin: 0, fontSize: 32, lineHeight: 1.15 }}>
                {surface.label}
              </h1>
              <p style={{ margin: 0, color: "#334155", lineHeight: 1.5 }}>
                {surface.purpose}
              </p>
            </div>
            <StatusPill ok={claims.ok}>
              {claims.ok ? "Claims Gate Pass" : "Claims Review"}
            </StatusPill>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {surface.moduleRefs.map((moduleRef) => (
              <span
                key={moduleRef}
                style={{
                  minHeight: 30,
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "0 10px",
                  borderRadius: 999,
                  background: "#e7eef7",
                  color: "#25344d",
                  fontSize: 13,
                  fontWeight: 800,
                }}
              >
                {moduleRef}
              </span>
            ))}
            <span
              style={{
                minHeight: 30,
                display: "inline-flex",
                alignItems: "center",
                padding: "0 10px",
                borderRadius: 999,
                background: "#fff7ed",
                color: "#9a3412",
                fontSize: 13,
                fontWeight: 800,
              }}
            >
              Human Review Boundary
            </span>
          </div>
        </header>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 12,
          }}
        >
          {[
            ["Audience", titleForAudience(surface.audience)],
            ["Primary Status", surface.primaryStatus],
            ["Backend Surfaces", String(surface.requiredBackendSurfaces.length)],
            ["Production Blocks", String(surface.productionBlocks.length)],
          ].map(([label, value]) => (
            <div
              key={label}
              style={{
                ...panelStyle,
                minHeight: 96,
                padding: 16,
                display: "grid",
                alignContent: "space-between",
              }}
            >
              <span style={{ color: "#596579", fontSize: 13, fontWeight: 800 }}>
                {label}
              </span>
              <strong
                style={{
                  color: "#172033",
                  fontSize: label === "Primary Status" ? 18 : 24,
                  lineHeight: 1.15,
                  overflowWrap: "anywhere",
                }}
              >
                {value}
              </strong>
            </div>
          ))}
        </section>

        <section
          style={{
            ...panelStyle,
            padding: 16,
            display: "grid",
            gap: 12,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 20 }}>Safe Status Language</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 10,
            }}
          >
            {surface.safeMessages.map((message) => (
              <div
                key={message}
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  padding: 12,
                  lineHeight: 1.45,
                  background: "#f8fafc",
                  fontWeight: 800,
                }}
              >
                {message}
              </div>
            ))}
          </div>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 12,
          }}
        >
          <ListPanel
            title="Governance Requirements"
            items={surface.governanceRequirements}
          />
          <ListPanel
            title="Governed Backend Surfaces"
            items={surface.requiredBackendSurfaces}
          />
          <ListPanel title="Active Production Blocks" items={surface.productionBlocks} />
        </section>

        <section style={{ ...panelStyle, padding: 16, display: "grid", gap: 12 }}>
          <h2 style={{ margin: 0, fontSize: 20 }}>Adjacent Surfaces</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 10,
            }}
          >
            {[...surface.adjacentRoutes, ...peerSurfaces.map((item) => item.route)]
              .filter((route, index, routes) => route !== surface.route && routes.indexOf(route) === index)
              .map((route) => (
                <Link
                  key={route}
                  href={route}
                  style={{
                    border: "1px solid #d5dce8",
                    borderRadius: 8,
                    padding: 12,
                    color: "#172033",
                    textDecoration: "none",
                    background: "#ffffff",
                    fontWeight: 800,
                    overflowWrap: "anywhere",
                  }}
                >
                  {route}
                </Link>
              ))}
          </div>
        </section>
      </div>
    </main>
  );
}

export function PortableSurfaceIndexPage(props: {
  audience: PortableSurfaceAudience;
  title: string;
  subtitle: string;
}) {
  const surfaces = portableSurfacesByAudience(props.audience);

  return (
    <main style={shellStyle}>
      <div style={containerStyle}>
        <header style={{ display: "grid", gap: 8, padding: "16px 0 4px" }}>
          <p
            style={{
              margin: 0,
              color: "#596579",
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: 0,
              textTransform: "uppercase",
            }}
          >
            Portable Vertical Surface
          </p>
          <h1 style={{ margin: 0, fontSize: 32 }}>{props.title}</h1>
          <p style={{ margin: 0, color: "#334155", lineHeight: 1.5 }}>
            {props.subtitle}
          </p>
        </header>

        <section
          style={{
            ...panelStyle,
            padding: 16,
            display: "grid",
            gap: 10,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 20 }}>Disclosure Boundary</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 10,
            }}
          >
            {publicSurfaceDisclosureMessages.map((message) => (
              <div
                key={message}
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  padding: 12,
                  lineHeight: 1.45,
                  background: "#f8fafc",
                  fontWeight: 800,
                }}
              >
                {message}
              </div>
            ))}
          </div>
        </section>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 12,
          }}
        >
          {surfaces.map((surface) => (
            <Link
              key={surface.id}
              href={surface.route}
              style={{
                ...panelStyle,
                padding: 16,
                display: "grid",
                gap: 10,
                color: "#172033",
                textDecoration: "none",
              }}
            >
              <strong style={{ fontSize: 18 }}>{surface.label}</strong>
              <span style={{ color: "#475569", lineHeight: 1.45 }}>
                {surface.primaryStatus}
              </span>
              <span style={{ color: "#64748b", fontSize: 13 }}>
                {surface.moduleRefs.join(" / ")}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
