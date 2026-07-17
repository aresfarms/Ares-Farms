/**
 * CompassDispatchHero — the actual Furlong Compass on the front page (founder
 * direction 2026-07-17: "change this to our actual compass" — the regional
 * weekly Dispatch leads the page as a living signal, the property picker sits
 * below it, and the old standalone "Compass" pathways link goes away).
 *
 * Renders "The Dispatch": a short, human note woven from sourced public facts —
 * NOT a card stack, NOT a designed newsletter. Deliberately reads like a note
 * from someone who knows your ground. Server component; the composed dispatch
 * is built in the page and passed in.
 */

import type { CompassDispatch } from "@/lib/newsletter/newsletterDispatch";

export function CompassDispatchHero({ dispatch }: { dispatch: CompassDispatch }) {
  return (
    <section aria-label="This week on the Furlong Compass" id="compass-this-week">
      <div
        style={{
          maxWidth: 640,
          margin: "0 auto",
          background: "var(--fl-card, #ffffff)",
          border: "1px solid #d6dfe5",
          borderLeft: "4px solid #0f766e",
          borderRadius: 14,
          padding: "22px 26px 20px",
          boxShadow: "0 1px 2px rgba(16,26,43,0.04)",
        }}
      >
        <p
          style={{
            margin: "0 0 14px",
            fontSize: 11,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#0f766e",
            fontWeight: 700,
          }}
        >
          {dispatch.stamp}
        </p>

        {dispatch.paragraphs.map((para, i) => (
          <p
            key={para.slice(0, 24)}
            style={{
              margin: i === 0 ? "0 0 13px" : "0 0 13px",
              fontSize: i === 0 ? 17 : 15.5,
              lineHeight: 1.6,
              color: "#14212b",
              fontWeight: i === 0 ? 600 : 400,
            }}
          >
            {para}
          </p>
        ))}

        {dispatch.economics && (
          <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid #d6dfe5" }}>
            <h4 style={{ margin: "0 0 3px", fontSize: 15, fontWeight: 700, color: "#14212b" }}>
              {dispatch.economics.heading}
            </h4>
            <p style={{ margin: "0 0 12px", fontSize: 12.5, lineHeight: 1.5, color: "#4a626f" }}>
              Two numbers per load (900 bushels): what you clear over cash costs, and what&apos;s left after
              land and equipment.
            </p>
            {dispatch.economics.crops.map((c) => (
              <div key={c.commodity} style={{ display: "grid", gap: 5, padding: "10px 0", borderBottom: "1px solid #e5ebef" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
                  <span style={{ fontSize: 14.5, fontWeight: 700, color: "#14212b" }}>
                    {c.label}{" "}
                    <span style={{ fontWeight: 500, fontSize: 12.5, color: "#708997" }}>
                      · ${c.pricePerBu.toFixed(2)}/bu · {c.bushelsPerLoad} bu
                    </span>
                  </span>
                  <span style={{ fontSize: 16, fontWeight: 750, color: "#14212b" }}>
                    ${c.gross.toLocaleString("en-US")}
                  </span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 650, padding: "2px 9px", borderRadius: 20, color: "#0f766e", background: "#e7f5f1" }}>
                    {c.netOverOperating >= 0 ? "+" : "−"}${Math.abs(c.netOverOperating).toLocaleString("en-US")} over cash cost
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 650, padding: "2px 9px", borderRadius: 20, color: "#c2410c", background: "#fbeee7" }}>
                    {c.netOverTotal >= 0 ? "+" : "−"}${Math.abs(c.netOverTotal).toLocaleString("en-US")} after land &amp; equipment
                  </span>
                </div>
              </div>
            ))}
            <p style={{ margin: "12px 0 0", fontSize: 12.5, lineHeight: 1.55, color: "#4a626f" }}>
              {dispatch.economics.poultryNote}
            </p>
            <p style={{ margin: "8px 0 0", fontSize: 11, lineHeight: 1.5, color: "#9aa6b6" }}>
              {dispatch.economics.provenanceNote}
            </p>
          </div>
        )}

        <p
          style={{
            margin: "16px 0 0",
            fontSize: 15,
            lineHeight: 1.5,
            color: "#14212b",
            fontWeight: 600,
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#0f766e",
              marginRight: 10,
            }}
          >
            Do this
          </span>
          {dispatch.move}
        </p>

        <p style={{ margin: "16px 0 0", fontSize: 12.5, fontStyle: "italic", color: "#6b8290", lineHeight: 1.5 }}>
          {dispatch.signoff}
        </p>
        <p style={{ margin: "12px 0 0", fontSize: 11, color: "#9aa6b6", lineHeight: 1.5 }}>
          {dispatch.disclaimer}
        </p>
      </div>
    </section>
  );
}
