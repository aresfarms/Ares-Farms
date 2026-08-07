"use client";

/**
 * NewsletterDownloadButton — a small client control that prints/saves the current
 * newsletter (founder direction 2026-07-20: "something someone would want to
 * download"). Uses the browser's print-to-PDF; the newsletter page ships a print
 * stylesheet that isolates the document (logo, masthead, watermark, body) and
 * hides the site chrome, so the saved PDF looks like a real newsletter.
 */

export function NewsletterDownloadButton({ accent = "#0f766e" }: { accent?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="nl-no-print"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        fontSize: 13,
        fontWeight: 800,
        color: "#ffffff",
        background: accent,
        border: "none",
        borderRadius: 999,
        padding: "9px 18px",
        cursor: "pointer",
        width: "fit-content",
      }}
    >
      ↓ Download / print this edition
    </button>
  );
}
