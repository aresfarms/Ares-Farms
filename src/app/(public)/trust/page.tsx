import type { Metadata } from "next";
import Link from "next/link";

import { Disclosures } from "@/components/public/Disclosures";

/**
 * /trust — How you know you can trust this (Build 54)
 *
 * Primary content: approved plain-English copy (verbatim).
 * Formal record section: carries the exact institutional strings
 * required by verify:customer-journey (publicAlphaSurfaceContent.ts
 * §Route 2 — FURLONG_WILL_DO ×10, FURLONG_WILL_NOT_DO ×12,
 * foundational-principle, trust-principle,
 * advisory-only, no-reliance, furlong-not-lender,
 * user-data-sovereignty).
 *
 * Do NOT render the "> Keep visible:" lines — those are author notes.
 * Page renders inside (public)/layout.tsx — no shell, no header here.
 *
 * Governance:
 *   "The map reveals opportunities, not the visitor."
 *   "We show pathways, not promises."
 *   Public Alpha remains PENDING.
 */

export const metadata: Metadata = {
  title: "How you can trust Furlong | The Furlong Promise",
  description:
    "Furlong does not approve or deny anything, does not make credit decisions, and does not sell your data. Here is exactly what we will and will not do.",
};

// ── Shared tokens ──────────────────────────────────────────────────────────────

const container = {
  maxWidth: 760,
  margin:   "0 auto",
  padding:  "48px 24px 80px",
  display:  "grid",
  gap:      32,
} as const;

const muted = {
  margin:     0,
  fontSize:   16,
  color:      "#3b475a",
  lineHeight: 1.7,
} as const;

const small = {
  margin:     0,
  fontSize:   14,
  color:      "#5d687a",
  lineHeight: 1.65,
} as const;

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TrustPage() {
  return (
    <main>
      <div style={container}>

        {/* ══════════════════════════════════════════════════════════════════
            APPROVED COPY — founder's warm "Proving the Promise" version
            (close to verbatim). The complete commitments list (WILL ALWAYS /
            WILL NEVER) and the full formal disclosure footer are preserved in the
            FORMAL RECORD section below so every checked token still renders.
            ══════════════════════════════════════════════════════════════ */}

        {/* ── Hero (#trust — how it works) ──────────────────────────────── */}
        <header id="trust" style={{ display: "grid", gap: 16, paddingBottom: 24, borderBottom: "1px solid #d7deea", scrollMarginTop: 80 }}>
          <h1 style={{
            margin:        0,
            fontSize:      "clamp(28px, 4.5vw, 42px)",
            fontWeight:    800,
            letterSpacing: "-0.02em",
            lineHeight:    1.12,
            color:         "#162033",
          }}>
            Proving the Promise: How You Know You Can Trust the Beacon
          </h1>
          <p style={{ ...muted, fontSize: 18, color: "#5d687a" }}>
            Most platforms ask you to blindly take their word for it. We'd rather keep the lantern
            glass clean and show you exactly how our light works. Trust isn't built by collecting
            your files — it's built by keeping you entirely in the loop.
          </p>
        </header>

        {/* ── Body ──────────────────────────────────────────────────────── */}
        <div style={{ display: "grid", gap: 20 }}>
          <p style={muted}>
            <strong>👥 A real person always makes the call.</strong> Our technology is purely a
            completeness checker. It scans your paperwork to see what's beautifully organized and
            points out what might be missing — that's it. It never decides who gets approved, it
            never scores your credit, and it never determines your eligibility. Every real, material
            decision is made exclusively by a credentialed person at your lender or agency. Our system
            logs exactly who made the call and when, so there are never any mystery choices.
          </p>

          <p style={muted}>
            <strong>🔒 No big data piles.</strong> Furlong does not pull everyone's private
            information into one giant, vulnerable cloud database. Your lender keeps your file, your
            agency keeps its records, and we simply act as the secure coordination channel between
            them. We don't build marketing profiles on you, we don't track your location, and your
            data is never handed to anyone outside your actual transaction.
          </p>

          <p style={muted}>
            <strong>✍️ Nothing is secretly changed.</strong> Every milestone, document upload, and
            review is written to a tamper-proof digital record that can't be edited or erased. If an
            entry ever needs correcting, the fix is added as a brand-new, dated note — the original
            stays right where it is. If you or your lender ever have a question about how a conclusion
            was reached, the full, unedited history is there to look at.
          </p>

          <p style={muted}>
            <strong>💵 Free for borrowers, with zero bias.</strong> We don't make a single cent based
            on whether your application succeeds or fails. Our baseline readiness mapping is entirely
            free for borrowers — which means we have zero hidden financial incentive to push you down
            one path over another. We show you the realistic landscape so you can make the smartest
            play for your business.
          </p>

          <p style={muted}>
            <strong>The Guiding Beacon boundaries:</strong> This platform provides advisory guidance
            to help you discover possibilities and organize your data before you spend your time or
            money. It is not a bank, not a lender, and does not authorize legal or official reliance.
            Your data belongs completely to you — no silent submissions, no information sales, and no
            exceptions.
          </p>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            FORMAL RECORD
            Required by verify:customer-journey (publicAlphaSurfaceContent.ts
            §Route 2 — FURLONG_WILL_DO + FURLONG_WILL_NOT_DO + foundational-
            principle + trust-principle).
            Visible on page, honest, consistent with the approved copy above.
            ══════════════════════════════════════════════════════════════ */}
        <section
          id="commitments"
          aria-label="Complete list of commitments — what Furlong will and will not do"
          style={{
            background:   "#f8fafc",
            border:       "1px solid #d7deea",
            borderRadius: 12,
            padding:      "24px 28px",
            display:      "grid",
            gap:          20,
            scrollMarginTop: 80,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#162033" }}>
            Complete list of commitments
          </h2>

          <p style={small}>
            Your information belongs to you. Not to Furlong. Not to lenders. Not to brokers.
            Furlong will always prioritize informed decision-making over hidden processes.
          </p>

          <div style={{ display: "grid", gap: 8 }}>
            <p style={{ ...small, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#0f766e", fontSize: 12 }}>
              Furlong will always:
            </p>
            <ul style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 4 }}>
              <li style={small}>Explain why information is requested.</li>
              <li style={small}>Explain how information is used.</li>
              <li style={small}>Explain which recommendations relied upon specific information.</li>
              <li style={small}>Explain when additional information is needed.</li>
              <li style={small}>Explain when information is shared.</li>
              <li style={small}>Explain when information is retained.</li>
              <li style={small}>Explain when information can be deleted.</li>
              <li style={small}>Explain when information can be exported.</li>
              <li style={small}>Preserve evidence lineage and recommendation traceability.</li>
              <li style={small}>Allow users to understand how conclusions were reached.</li>
            </ul>
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            <p style={{ ...small, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#8a2018", fontSize: 12 }}>
              Furlong will never:
            </p>
            <ul style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 4 }}>
              <li style={small}>Sell user information.</li>
              <li style={small}>Secretly submit user information to lenders.</li>
              <li style={small}>Secretly submit user information to agencies.</li>
              <li style={small}>Secretly submit user information to brokers.</li>
              <li style={small}>Secretly distribute user information to third parties.</li>
              <li style={small}>Generate undisclosed marketing leads.</li>
              <li style={small}>Hide recommendation logic.</li>
              <li style={small}>Hide pathway exclusions.</li>
              <li style={small}>Hide readiness limitations.</li>
              <li style={small}>Hide known conflicts.</li>
              <li style={small}>Hide known risks.</li>
              <li style={small}>Represent user information as verified when it has not been verified.</li>
            </ul>
          </div>

        </section>

        {/* ══════════════════════════════════════════════════════════════════
            #your-data — "You're in Control" (merged from the former /data-rights).
            Warm copy + the five rights + the honest truth about deletion.
            /data-rights redirects here (to /trust#your-data).
            ══════════════════════════════════════════════════════════════ */}
        <section id="your-data" aria-label="You're in control of your information" style={{ display: "grid", gap: 20, scrollMarginTop: 80, paddingTop: 12, borderTop: "1px solid #d7deea" }}>
          <header style={{ display: "grid", gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: "clamp(24px, 3.5vw, 34px)", fontWeight: 800, letterSpacing: "-0.02em", color: "#162033" }}>
              You're in Control of Your Information
            </h2>
            <p style={muted}>
              A lighthouse doesn't keep a copy of your cargo, and neither do we. Your information
              belongs entirely to you and the people you choose to work with — your lender, your local
              agency, or your grant office. Furlong is simply here to help you coordinate between them.
              We don't own your data, and we don't lock it behind a paywall. From the second you start
              using our map, you hold the controls. No fees, no hidden loops, and no explanations required.
            </p>
          </header>

          <div style={{ display: "grid", gap: 12 }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#162033" }}>🎛️ Your Five Ultimate Data Rights</h3>
            <ul style={{ margin: 0, paddingLeft: 24, display: "grid", gap: 10 }}>
              <li style={muted}><strong>🤔 Request an Explanation</strong> — a clear, plain-English breakdown of exactly why our map showed you a specific pathway and what data it relied on.</li>
              <li style={muted}><strong>📦 Request an Export</strong> — download a complete, cleanly organized copy of every piece of information we hold about your project, so you can take it with you.</li>
              <li style={muted}><strong>👥 Request a Human Review</strong> — freeze the automated completeness checks and ask a real, credentialed professional to look over any step before it goes anywhere.</li>
              <li style={muted}><strong>🛑 Request a Hold</strong> — pause the system. We never silently advance your file to the next stage until you explicitly say you're ready.</li>
              <li style={muted}><strong>🗑️ Request Deletion</strong> — tell us to clear your footprint and remove your personal details from our active system.</li>
            </ul>
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#162033" }}>🔍 The Honest Truth About Deletion</h3>
            <p style={muted}>When you ask us to delete your footprint, two things happen:</p>
            <ol style={{ margin: 0, paddingLeft: 24, display: "grid", gap: 10 }}>
              <li style={muted}><strong>Your personal details are wiped</strong> — all personal information, project details, and sensitive identifiers are erased from our live system (unless your lender or agency is legally required to keep them for their own compliance).</li>
              <li style={muted}><strong>The process log stays</strong> — the tamper-proof ledger showing that a step happened (who authorized a review, when a file was uploaded, when a pathway was checked) remains in our audit trail.</li>
            </ol>
            <p style={muted}>
              In plain terms: we remove your personal details, but the proof that the process was handled
              fairly stays behind. That permanent log exists strictly to protect you, your lender, and
              your agency from fraud or hidden changes.
            </p>
          </div>

          {/* ── The formal record ──────────────────────────────────────────────
              The canonical data-rights record, merged here from the former
              /data-rights page (which now 308-redirects to /trust#your-data).
              These are the exact, plain canonical terms — required verbatim by
              verify:customer-journey (Route 3). Kept visible, in a quieter
              register beneath the warm copy above. */}
          <div style={{ display: "grid", gap: 12, borderTop: "1px solid #eef2f7", paddingTop: 16 }}>
            <h3 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "#5d687a", letterSpacing: "0.05em", textTransform: "uppercase" }}>
              The formal record
            </h3>
            <p style={{ ...muted, fontSize: 14 }}>
              Your information belongs to you. You may exercise any of these data rights at any time,
              without giving a reason:
            </p>
            <ul style={{ margin: 0, paddingLeft: 22, display: "grid", gap: 8 }}>
              <li style={{ ...muted, fontSize: 14 }}><strong>REQUEST_EXPLANATION</strong> — &ldquo;Tell me why I&apos;m seeing this and what it relied on.&rdquo;</li>
              <li style={{ ...muted, fontSize: 14 }}><strong>REQUEST_DELETION</strong> — &ldquo;Delete what you have about me.&rdquo;</li>
              <li style={{ ...muted, fontSize: 14 }}><strong>REQUEST_EXPORT</strong> — &ldquo;Give me a copy of what you have about me, in a usable form.&rdquo;</li>
              <li style={{ ...muted, fontSize: 14 }}><strong>REQUEST_HUMAN_REVIEW</strong> — &ldquo;Have a human look at this before it goes anywhere.&rdquo;</li>
              <li style={{ ...muted, fontSize: 14 }}><strong>REQUEST_HOLD_ON_ESCALATION</strong> — &ldquo;Don&apos;t move my information to the next stage yet.&rdquo;</li>
            </ul>
            <p style={{ ...muted, fontSize: 14 }}>
              When you request deletion, Furlong will delete your information from the live system, preserve
              only the audit log required for regulatory traceability, and confirm what happened. We will
              explain when information can be deleted and what information can be deleted, and what we keep
              for traceability.
            </p>
          </div>
        </section>

        {/* ── Contextual CTA ────────────────────────────────────────────────
            Team ("Guiding Beacon") page is publish-gated (dark until Furlong Inc
            is registered). Point "Learn More About Our Team" at /about until that
            page is live — do NOT link a live Trust page to the dark team page. */}
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <Link
            href="/compass"
            style={{ color: "#0f766e", fontWeight: 700, textDecoration: "none", fontSize: 14 }}
          >
            What We Do →
          </Link>
          <Link
            href="/about"
            style={{ color: "#0f766e", fontWeight: 700, textDecoration: "none", fontSize: 14 }}
          >
            Our Story →
          </Link>
        </div>

        {/* Canonical disclosures — single source of truth, rendered ONCE at the
            bottom of the merged Trust & Your Data page (see Disclosures.tsx). */}
        <Disclosures variant="full" />

      </div>
    </main>
  );
}
