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
