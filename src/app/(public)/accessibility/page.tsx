import type { Metadata } from "next";
import Link from "next/link";

/**
 * /accessibility — Is Furlong ADA-Friendly? (Build 54)
 *
 * Plain-English rewrite. Organized by disability/need rather than by
 * technical feature. No raw ARIA attribute strings in visible text.
 * No hex color values as visible content. No contrast ratios as visible text.
 *
 * Required by verify:public-copy (approved copy gate):
 *   - "is furlong ada-friendly" (h1)
 *   - "built so you can actually use it" (subtitle)
 *   - "if you're blind" / "if you have low vision"
 *   - "if you're deaf or hard of hearing" / "if you're autistic"
 *   - "if you can't use a mouse"
 *
 * Required by verify:accessibility (structural gate):
 *   - I07: visible h1 ✓
 *   - I08: covers keyboard navigation, screen readers, reduced motion ✓
 *   - I09: contact/help section ✓
 *
 * Privacy: no personal data collected on this page.
 * Public Alpha remains PENDING.
 * "The map reveals opportunities, not the visitor."
 */

export const metadata: Metadata = {
  title: "Accessibility | Furlong",
  description:
    "Furlong is built so you can actually use it — keyboard, screen reader, any zoom level, motion preferences. Here is what works and what to do if something does not.",
};

// ── Shared tokens ──────────────────────────────────────────────────────────────

const container = {
  maxWidth: 760,
  margin:   "0 auto",
  padding:  "48px 24px 80px",
  display:  "grid",
  gap:      0,
} as const;

const muted = {
  margin:     0,
  fontSize:   16,
  color:      "#3b475a",
  lineHeight: 1.7,
} as const;

// ── Plain-English disability-category sections ─────────────────────────────────

const SECTIONS = [

  {
    id:      "blind",
    heading: "If you're blind or use a screen reader",
    paras: [
      "Screen Reader support on Furlong covers everything that matters — navigation, maps, forms, story content. Page regions, headings, buttons, and form fields are all labeled so your screen reader can announce them.",
      "The map on the homepage announces the current story card content automatically as it changes, so you always know what is on screen without needing to perceive the visual.",
      "Decorative images (background watermarks) are hidden from your screen reader so they do not interrupt your reading flow.",
      "All forms pair each input with a visible label. A \"Skip to main content\" link is the first thing you reach when you Tab into any page.",
    ],
  },

  {
    id:      "low-vision",
    heading: "If you have low vision",
    paras: [
      "You can increase text size to 200% in your browser without losing content or having to scroll horizontally. The layout reflows at all common zoom levels.",
      "Color contrast ratios across Furlong are tested against WCAG AA standards — body text, headings, and buttons all pass the minimum thresholds. No information is conveyed by color alone.",
      "Focus indicators — the visible ring around the element you are interacting with — are always visible and are never hidden.",
    ],
  },

  {
    id:      "deaf",
    heading: "If you're deaf or hard of hearing",
    paras: [
      "Furlong does not include audio or video on its public pages. There is nothing to hear.",
      "If audio or video is added in the future, captions and transcripts will be provided for anything informational. Purely decorative audio will be marked as such.",
    ],
  },

  {
    id:      "autistic",
    heading: "If you're autistic or sensitive to unexpected motion",
    paras: [
      "Reduced Motion settings are fully respected. If you have turned on \"reduce motion\" in your operating system, the map holds a static view, animations are suppressed, and only the content remains. Nothing important is hidden behind motion.",
      "The animated map on the homepage does not start automatically. It only moves when you press the \"Begin the journey\" button — so nothing plays without your choice.",
      "There are no auto-playing videos, blinking badges, or timed popups on public pages.",
    ],
  },

  {
    id:      "no-mouse",
    heading: "If you can't use a mouse",
    paras: [
      "Keyboard navigation is fully supported. Every button, link, form field, and navigation item on Furlong is reachable and usable with a keyboard alone. Tab moves forward, Shift + Tab moves backward. Enter and Space activate buttons and links. Escape closes open menus.",
      "The Stewardship navigation dropdown opens with Enter or Space and closes with Escape. Every item inside it is reachable by Tab.",
      "A \"Skip to main content\" link at the very top of every page lets you jump past the navigation bar with a single keypress.",
      "All interactive elements show a visible focus ring when you reach them by keyboard.",
    ],
  },

] as const;

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AccessibilityPage() {
  return (
    <>
      <style>{`
        .ac-hero {
          padding-bottom: 32px;
          border-bottom: 1px solid #d7deea;
          margin-bottom: 40px;
        }
        .ac-hero-label {
          margin: 0 0 10px;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #0f766e;
        }
        .ac-hero h1 {
          margin: 0 0 12px;
          font-size: clamp(28px, 4vw, 42px);
          font-weight: 800;
          letter-spacing: -0.02em;
          line-height: 1.1;
          color: #162033;
        }
        .ac-hero-sub {
          margin: 0;
          font-size: 17px;
          color: #5d687a;
          line-height: 1.65;
          max-width: 600px;
        }

        .ac-section {
          margin-bottom: 44px;
          display: grid;
          gap: 12px;
        }
        .ac-section h2 {
          margin: 0;
          font-size: clamp(18px, 2.5vw, 22px);
          font-weight: 800;
          letter-spacing: -0.01em;
          color: #162033;
          padding-bottom: 8px;
          border-bottom: 2px solid #e8edf5;
        }
        .ac-section p {
          margin: 0;
          font-size: 16px;
          line-height: 1.7;
          color: #3b475a;
        }

        .ac-contact-box {
          padding: 28px;
          background: #162033;
          border-radius: 14px;
          display: grid;
          gap: 14px;
          margin-top: 8px;
        }
        .ac-contact-box h2 {
          margin: 0;
          font-size: 20px;
          font-weight: 800;
          color: #c9a84c;
        }
        .ac-contact-box p {
          margin: 0;
          font-size: 16px;
          line-height: 1.65;
          color: #e8effa;
        }
        .ac-contact-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 48px;
          padding: 0 24px;
          border-radius: 999px;
          background: #0f766e;
          color: #ffffff;
          font-weight: 700;
          font-size: 15px;
          text-decoration: none;
          width: fit-content;
        }
        .ac-contact-link:hover { background: #0d6460; }
        .ac-contact-link:focus-visible {
          outline: 3px solid #c9a84c;
          outline-offset: 3px;
        }

        .ac-known {
          margin-bottom: 44px;
          padding: 20px 24px;
          background: #f8fafc;
          border: 1px solid #d7deea;
          border-radius: 12px;
          display: grid;
          gap: 10px;
        }
        .ac-known h2 {
          margin: 0;
          font-size: 15px;
          font-weight: 700;
          color: #162033;
        }
        .ac-known p {
          margin: 0;
          font-size: 14px;
          color: #5d687a;
          line-height: 1.65;
        }

        .ac-footer {
          margin-top: 52px;
          padding-top: 20px;
          border-top: 1px solid #d7deea;
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          align-items: center;
        }
        .ac-back-link {
          color: #0f766e;
          font-size: 14px;
          font-weight: 700;
          text-decoration: none;
        }
        .ac-back-link:hover { text-decoration: underline; }
        .ac-back-link:focus-visible {
          outline: 2px solid #0f766e;
          outline-offset: 3px;
          border-radius: 3px;
        }
        .ac-footer-sep { color: #d7deea; user-select: none; }
        .ac-footer-link {
          color: #5d687a;
          font-size: 14px;
          font-weight: 500;
          text-decoration: none;
        }
        .ac-footer-link:hover { color: #162033; }
        .ac-footer-link:focus-visible {
          outline: 2px solid #0f766e;
          outline-offset: 3px;
          border-radius: 3px;
        }

        @media (max-width: 640px) {
          .ac-contact-box { padding: 24px 20px; }
          .ac-known { padding: 16px; }
        }
      `}</style>

      <div style={container}>

        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <header className="ac-hero">
          <p className="ac-hero-label">Furlong</p>
          <h1>Is Furlong ADA-Friendly?</h1>
          <p className="ac-hero-sub">
            Yes. Furlong is built so you can actually use it — whether you use a keyboard,
            a screen reader, any zoom level, or have motion turned off. Here is what we
            support and how to tell us if something is not working.
          </p>
        </header>

        {/* ── Disability-category sections ───────────────────────────────── */}
        <main>
          {SECTIONS.map((section) => (
            <section
              key={section.id}
              id={section.id}
              className="ac-section"
              aria-labelledby={`${section.id}-heading`}
            >
              <h2 id={`${section.id}-heading`}>{section.heading}</h2>
              {section.paras.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </section>
          ))}

          {/* ── Known limitations ────────────────────────────────────────── */}
          <div className="ac-known">
            <h2>One thing that is not perfect yet</h2>
            <p>
              The map visualization on the homepage is richly interactive for mouse users.
              Keyboard users can navigate between story points but cannot drag or pan the
              map. The story card alongside it provides full text for everything the map shows.
              We plan to improve keyboard map interaction in a future build.
            </p>
          </div>

          {/* ── Contact box ──────────────────────────────────────────────── */}
          <div
            className="ac-contact-box"
            role="region"
            aria-label="How to get accessibility help"
          >
            <h2>Something is not working?</h2>
            <p>
              If a part of Furlong is not working with your assistive technology, or if you
              have hit a barrier of any kind, tell us. Describe what you were trying to do,
              what tool you were using, and which page or feature had the problem. We will
              respond as quickly as we can.
            </p>
            <p>
              Furlong is built by a small team. We take accessibility seriously because
              a tool you cannot use is not a tool.
            </p>
            <Link
              href="/accessibility-feedback"
              className="ac-contact-link"
              aria-label="Report an accessibility issue to Furlong"
            >
              Report an accessibility issue →
            </Link>
            <p style={{ marginTop: 12 }}>
              For general questions that are not about accessibility, you can also
              contact Furlong from the <Link href="/about">About Furlong</Link> page.
            </p>
          </div>
        </main>

        {/* ── Footer nav ────────────────────────────────────────────────── */}
        <nav className="ac-footer" aria-label="Page navigation">
          <Link href="/"            className="ac-back-link">← Back to Homepage</Link>
          <span className="ac-footer-sep" aria-hidden="true">|</span>
          <Link href="/trust"       className="ac-footer-link">The Furlong Promise</Link>
          <Link href="/data-rights" className="ac-footer-link">Your Data Rights</Link>
          <Link href="/about"       className="ac-footer-link">About Furlong</Link>
        </nav>

      </div>
    </>
  );
}
