import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Privacy Policy | Furlong" };

export default function PrivacyPolicyPage() {
  return <main style={{maxWidth:820,margin:"0 auto",padding:"48px 24px 80px",lineHeight:1.7,color:"#162033"}}>
    <p style={{fontWeight:800,letterSpacing:".08em",fontSize:12}}>ARES FARMS INC. / FURLONG</p>
    <h1>Privacy Policy</h1>
    <p><strong>Effective:</strong> August 8, 2026 · <strong>Review cycle:</strong> at least annually and whenever our data practices or applicable requirements materially change.</p>
    <h2>What we collect and why</h2>
    <p>Furlong collects only information needed to coordinate the financing, property, document, identity, and professional workflows you choose to use. We do not sell personal information or use private financial information to build advertising profiles.</p>
    <h2>Plaid and financial account information</h2>
    <p>If you choose to connect a financial account, Plaid provides the account information you authorize for the stated financing purpose. Furlong does not receive your online-banking password. Plaid-derived consumer data and access tokens are treated as restricted financial information and are stored only through Furlong&apos;s encrypted data store.</p>
    <h2>Consent and sharing</h2>
    <p>We obtain purpose-specific consent before collecting or using sensitive financial-account information and before sharing an exact package with a named lender or professional. You can withdraw future access before dispatch or disconnect a linked account.</p>
    <h2>Security</h2>
    <p>Furlong uses encryption in transit and at rest, role-based access controls, phishing-resistant multi-factor authentication for privileged access, audit logging, vulnerability scanning, and governed incident-response controls. Sensitive Plaid data is encrypted before database persistence.</p>
    <h2>Retention and deletion</h2>
    <p>We keep personal information only for the active purpose for which it was collected and any documented legal, regulatory, dispute, or audit obligation. Plaid access is revoked when a linked account is disconnected or no longer needed. Plaid-derived consumer data is scheduled for deletion after the financing purpose ends unless a documented hold applies. Data-rights requests are reviewed and fulfilled through governed deletion, restriction, correction, and export procedures.</p>
    <h2>Your choices and rights</h2>
    <p>You may request access, export, correction, restriction, deletion, or human review of information Furlong holds about you. Immutable audit records may retain non-identifying evidence needed to prove what happened without retaining the underlying personal content.</p>
    <h2>Service providers</h2>
    <p>We use service providers only for defined functions such as financial-account connectivity, identity verification, payment processing, hosting, and secure communications. Providers receive only the information necessary for their assigned function and remain subject to Furlong&apos;s access, purpose, and retention controls.</p>
    <h2>Changes and contact</h2>
    <p>Material changes to this policy are versioned and reviewed before becoming effective. Questions or data-rights requests may be submitted through the Furlong data-rights process.</p>
    <p><Link href="/trust#your-data">View your data rights →</Link></p>
  </main>;
}
