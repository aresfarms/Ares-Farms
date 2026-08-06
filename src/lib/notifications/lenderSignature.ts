/**
 * The licensed lender's email signature block (founder-supplied 2026-08-06),
 * appended to customer-facing lender emails (document reminders, document
 * notices). Plain text by design — the portal's emails are text/plain and
 * minimum-disclosure; branding yes, images/attachments never.
 *
 */
export const LENDER_EMAIL_SIGNATURE =
  `--\n` +
  `Stuart Fraass | Principal — Domestic Commercial Debt Broker\n` +
  `Furlong Inc.\n` +
  `Direct: 212.203.6603 | finance@compasstocapital.com\n` +
  `www.furlongpathways.com | linkedin.com/in/stuart-fraass-8959755\n` +
  `Financing challenging commercial real estate nationwide.`;

const NAVY = "#1C2B45";
const GOLD = "#b8862f";
const INK_SOFT = "#4d596d";

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function linkify(escaped: string): string {
  return escaped.replace(
    /(https?:\/\/[^\s<]+)/g,
    (url) => `<a href="${url}" style="color:${GOLD};font-weight:600;text-decoration:none;">${url}</a>`
  );
}

/**
 * Wrap a plain-text lender email body in the branded HTML frame — restrained
 * navy-and-bronze, serif headline, hairline gold rule, signature card with
 * the Compass to Capital seal inline (cid:brand-logo; renders logo-less if
 * the asset is absent). Table layout + inline styles: email clients, not
 * browsers. The text/plain version always travels alongside.
 */
export function renderLenderEmailHtml(bodyText: string): string {
  const paragraphs = bodyText
    .split(/\n\n+/)
    .map((p) => `<p style="margin:0 0 14px;font-size:14.5px;line-height:1.65;color:${NAVY};">${linkify(escapeHtml(p.trim())).replace(/\n/g, "<br/>")}</p>`)
    .join("");
  return (
    `<div style="background:#f4f2ec;padding:28px 16px;">` +
    `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e3ddd0;border-radius:10px;">` +
    `<tr><td style="padding:26px 30px 6px;font-family:Georgia,'Times New Roman',serif;">` +
    `<div style="font-size:12px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${GOLD};">Compass to Capital</div>` +
    `<div style="height:1px;background:${GOLD};opacity:0.45;margin:12px 0 18px;"></div>` +
    `</td></tr>` +
    `<tr><td style="padding:0 30px;font-family:Georgia,'Times New Roman',serif;">${paragraphs}</td></tr>` +
    `<tr><td style="padding:14px 30px 30px;">` +
    // Engraved thick-thin rule — the stationery cue.
    `<div style="height:2px;background:${GOLD};opacity:0.55;"></div>` +
    `<div style="height:1px;background:${GOLD};opacity:0.35;margin-top:2px;margin-bottom:22px;"></div>` +
    // Old-money type: Didone stack for the name (Didot on Mac, Bodoni MT on
    // Windows Office, Garamond/Times beyond), Copperplate engraving for the
    // firm, serif caps — never sans — for the title.
    `<table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr>` +
    `<td style="vertical-align:middle;width:86px;padding-right:20px;"><img src="cid:brand-logo" width="80" height="80" alt="Furlong — Compass to Capital" style="display:block;border-radius:50%;"/></td>` +
    `<td style="vertical-align:middle;border-left:1px solid #e3ddd0;padding-left:20px;">` +
    `<div style="font-family:Didot,'Bodoni MT',Cochin,Garamond,'Times New Roman',serif;font-size:21px;letter-spacing:0.03em;color:#0F1D3A;">Stuart Fraass</div>` +
    `<div style="font-family:Didot,'Bodoni MT',Garamond,'Times New Roman',serif;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:${GOLD};margin-top:5px;white-space:nowrap;">Principal&nbsp;·&nbsp;Domestic&nbsp;Commercial&nbsp;Debt&nbsp;Broker</div>` +
    `<div style="font-family:Copperplate,'Copperplate Gothic Light',Georgia,serif;font-size:12px;letter-spacing:0.1em;color:${INK_SOFT};margin-top:9px;">Furlong Inc.</div>` +
    `<div style="font-family:Garamond,'Book Antiqua',Palatino,Georgia,serif;font-size:13px;color:${INK_SOFT};margin-top:9px;">212.203.6603` +
    `<span style="color:${GOLD};">&nbsp;&nbsp;·&nbsp;&nbsp;</span>` +
    `<a href="mailto:finance@compasstocapital.com" style="color:#0F1D3A;text-decoration:none;">finance@compasstocapital.com</a></div>` +
    `<div style="font-family:Garamond,'Book Antiqua',Palatino,Georgia,serif;font-size:13px;margin-top:2px;"><a href="https://www.furlongpathways.com" style="color:#0F1D3A;text-decoration:none;">furlongpathways.com</a>` +
    `<span style="color:${GOLD};">&nbsp;&nbsp;·&nbsp;&nbsp;</span>` +
    `<a href="https://www.linkedin.com/in/stuart-fraass-8959755/" style="color:#0F1D3A;text-decoration:none;">LinkedIn</a></div>` +
    `</td></tr></table>` +
    `<div style="font-family:Didot,'Bodoni MT',Garamond,'Times New Roman',serif;font-size:13.5px;font-style:italic;letter-spacing:0.02em;color:${GOLD};margin-top:18px;">Financing challenging commercial real estate nationwide.</div>` +
    `</td></tr></table>` +
    `<div style="max-width:560px;margin:10px auto 0;font-family:Georgia,serif;font-size:11px;color:#8a8577;text-align:center;">This message contains no account details by design — everything sensitive stays inside the portal.</div>` +
    `</div>`
  );
}
