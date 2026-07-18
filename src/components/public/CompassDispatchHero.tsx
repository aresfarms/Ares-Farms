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
              Two numbers per load — what you clear over cash costs (feels like profit), and what&apos;s left
              after land and equipment (whether the whole thing pays for itself).
            </p>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ textAlign: "right", color: "#708997" }}>
                    <th style={{ textAlign: "left", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em", padding: "0 0 7px" }}>
                      Per 900-bu load
                    </th>
                    <th style={{ fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em", padding: "0 0 7px 12px" }}>Gross</th>
                    <th style={{ fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em", padding: "0 0 7px 12px" }}>Over cash</th>
                    <th style={{ fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em", padding: "0 0 7px 12px" }}>After land &amp; equip</th>
                  </tr>
                </thead>
                <tbody style={{ fontVariantNumeric: "tabular-nums" }}>
                  {dispatch.economics.crops.map((c) => (
                    <tr key={c.commodity} style={{ borderTop: "1px solid #e5ebef" }}>
                      <td style={{ padding: "9px 0", color: "#14212b" }}>
                        <strong style={{ fontWeight: 700 }}>{c.label}</strong>{" "}
                        <span style={{ color: "#708997", fontSize: 12 }}>${c.pricePerBu.toFixed(2)}/bu</span>
                      </td>
                      <td style={{ padding: "9px 0 9px 12px", textAlign: "right", fontWeight: 700 }}>
                        ${c.gross.toLocaleString("en-US")}
                      </td>
                      <td style={{ padding: "9px 0 9px 12px", textAlign: "right", fontWeight: 650, color: "#0f766e" }}>
                        {c.netOverOperating >= 0 ? "+" : "−"}${Math.abs(c.netOverOperating).toLocaleString("en-US")}
                      </td>
                      <td style={{ padding: "9px 0 9px 12px", textAlign: "right", fontWeight: 650, color: "#c2410c" }}>
                        {c.netOverTotal >= 0 ? "+" : "−"}${Math.abs(c.netOverTotal).toLocaleString("en-US")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ margin: "14px 0 0", padding: "12px 14px", background: "#f1f5f8", borderRadius: 9, display: "grid", gap: 8 }}>
              {dispatch.economics.poultryNote.split("\n\n").map((para, i) => (
                <p key={para.slice(0, 24)} style={{ margin: 0, fontSize: 12.5, lineHeight: 1.55, color: i === 0 ? "#14212b" : "#4a626f" }}>
                  {para}
                </p>
              ))}
            </div>
            <p style={{ margin: "10px 0 0", fontSize: 11, lineHeight: 1.5, color: "#9aa6b6" }}>
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
