/**
 * Broker Setup — the ONE link Stuart opens to do everything (founder ask
 * 2026-08-06: "one link that he can go to to do everything at once").
 * Staging sits entirely behind IAP, so reaching this page already proves
 * the Google sign-in worked; the page then walks the remaining steps in
 * order. Deliberately NO secrets and NO customer data here — it's an
 * instruction surface, safe at any access tier (credential sign-in itself
 * happens on the desk, and the passphrase is handed over person-to-person,
 * never written anywhere).
 */

const NAVY = "#1C2B45";
const GOLD = "#b8862f";
const INK = "#101a2b";
const MUTED = "#4d596d";

const stepCard = {
  border: "1px solid #d7deea",
  borderRadius: 14,
  background: "#fff",
  padding: "18px 20px",
  display: "grid",
  gap: 8,
} as const;

const stepNumber = {
  fontSize: 11.5,
  fontWeight: 800,
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
  color: GOLD,
};

const button = {
  justifySelf: "start" as const,
  borderRadius: 10,
  padding: "10px 18px",
  fontSize: 14,
  fontWeight: 800,
  color: "#fff",
  background: "#1c5aa0",
  textDecoration: "none",
};

export default function BrokerSetupPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#f6f8fb", padding: "40px 20px 60px", fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif' }}>
      <div style={{ maxWidth: 640, margin: "0 auto", display: "grid", gap: 16 }}>
        <header style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: GOLD }}>
            Compass to Capital
          </span>
          <h1 style={{ margin: 0, fontSize: 28, color: NAVY, fontFamily: "Georgia,serif" }}>
            Broker desk setup — everything in one place
          </h1>
          <p style={{ margin: 0, fontSize: 14.5, color: MUTED, lineHeight: 1.65 }}>
            Five steps, about fifteen minutes, in order. The fact that you can read this page
            means step zero (your Google sign-in) already worked.
          </p>
        </header>

        <section style={stepCard}>
          <span style={stepNumber}>Step 1 · Sign in to your desk</span>
          <p style={{ margin: 0, fontSize: 13.5, color: INK, lineHeight: 1.65 }}>
            The button below opens your Deal Desk. The first time, a &quot;Farm Login&quot; screen
            asks for your email (<strong>sfraas@aresfarmsinc.com</strong>) and a passphrase —
            Caitlin gives you the passphrase on your call, and your browser will offer to
            remember it. It is never sent by email.
          </p>
          <a href="/lender-desk" style={button}>Open my Deal Desk →</a>
        </section>

        <section style={stepCard}>
          <span style={stepNumber}>Step 2 · Create your booking page</span>
          <p style={{ margin: 0, fontSize: 13.5, color: INK, lineHeight: 1.65 }}>
            Customers schedule calls with you instead of cold-calling — but the booking page
            must be created from <em>your</em> Google Calendar. In the tab the button opens:
            click <strong>Create</strong> (top left) → <strong>Appointment schedule</strong> →
            name it, set 30-minute slots and your available hours → <strong>Save</strong>.
            Then click the new schedule on your calendar → <strong>Open booking page</strong> →
            copy that link and send it to Caitlin. She wires it into the portal in two minutes.
          </p>
          <a href="https://calendar.google.com/calendar/u/0/r" target="_blank" rel="noopener noreferrer" style={button}>
            Open Google Calendar →
          </a>
        </section>

        <section style={stepCard}>
          <span style={stepNumber}>Step 3 · Confirm your professional title</span>
          <p style={{ margin: 0, fontSize: 13.5, color: INK, lineHeight: 1.65 }}>
            Every customer surface currently describes you as a{" "}
            <strong>commercial debt broker</strong> (Principal — Domestic Commercial Debt
            Broker). Tell Caitlin the exact wording you want — and whether you hold any
            license or registration we should cite. If you do, the word
            &quot;licensed&quot; goes back into the copy with the citation; if not, it stays
            out. Accuracy here is a compliance line, not a style choice.
          </p>
        </section>

        <section style={stepCard}>
          <span style={stepNumber}>Step 4 · Judge your email signature</span>
          <p style={{ margin: 0, fontSize: 13.5, color: INK, lineHeight: 1.65 }}>
            Every email the portal sends customers on your behalf closes with your signature
            block — seal, name, title, direct line. Preview below. If it isn&apos;t elegant
            enough, say so; it is one conversation to change.
          </p>
          <div style={{ border: "1px solid #e3ddd0", borderRadius: 10, background: "#FDFBF7", padding: "16px 18px" }}>
            <table role="presentation" cellPadding="0" cellSpacing="0"><tbody><tr>
              <td style={{ verticalAlign: "middle", width: 70, paddingRight: 16 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/brand/compasstocapital-email-logo.jpg" width={64} height={64} alt="Compass to Capital seal" style={{ display: "block", borderRadius: "50%" }} />
              </td>
              <td style={{ verticalAlign: "middle", borderLeft: "1px solid #e3ddd0", paddingLeft: 16 }}>
                <div style={{ fontFamily: "Didot,'Bodoni MT',Cochin,Garamond,'Times New Roman',serif", fontSize: 19, letterSpacing: "0.03em", color: "#0F1D3A" }}>Stuart Fraass</div>
                <div style={{ fontFamily: "Didot,'Bodoni MT',Garamond,'Times New Roman',serif", fontSize: 9.5, letterSpacing: "0.14em", textTransform: "uppercase", color: GOLD, marginTop: 4, whiteSpace: "nowrap" }}>Principal · Domestic Commercial Debt Broker</div>
                <div style={{ fontFamily: "Copperplate,'Copperplate Gothic Light',Georgia,serif", fontSize: 11.5, letterSpacing: "0.1em", color: MUTED, marginTop: 7 }}>Furlong Inc.</div>
                <div style={{ fontFamily: "Garamond,'Book Antiqua',Palatino,Georgia,serif", fontSize: 12.5, color: MUTED, marginTop: 7 }}>212.203.6603 · finance@compasstocapital.com</div>
              </td>
            </tr></tbody></table>
          </div>
        </section>

        <section style={stepCard}>
          <span style={stepNumber}>Step 5 · Walk one deal end to end</span>
          <p style={{ margin: 0, fontSize: 13.5, color: INK, lineHeight: 1.65 }}>
            On your desk you&apos;ll find test deals already waiting. Pick one and try the
            full loop: open its documents, download one, set a status and a customer note,
            set the closing timeline, send a document back, request a signature. Everything
            you do lands on the customer&apos;s status page instantly — and every document
            action is recorded in the audit trail. If anything feels wrong or confusing,
            that&apos;s exactly the feedback this stage exists to catch.
          </p>
          <a href="/lender-desk" style={button}>Back to the desk →</a>
        </section>

        <p style={{ margin: 0, fontSize: 12, color: "#8090a0", lineHeight: 1.6 }}>
          After setup, the only link you ever need again is your Deal Desk — bookmark it.
          Documents never travel by email; reminders send themselves; customers book calls
          through your page. That&apos;s the point.
        </p>
      </div>
    </main>
  );
}
