import type { Metadata } from "next";
import Link from "next/link";
import { FurlongStart } from "@/components/public/FurlongStart";
import { Disclosures } from "@/components/public/Disclosures";
import styles from "@/components/public/FurlongExperience.module.css";

export const metadata: Metadata = {
  title: "Furlong | Understand your property, project and next step",
  description: "Explore property and business possibilities, understand the evidence and missing information, and investigate financing paths with Furlong.",
};

/** TECH-UX-001, PUBLIC-CLAIMS-001; Sept 8 customer experience amendment.
 * Uses the existing governed Navigator and address resolution. No lead capture. */
export default function HomePage() {
  return <div className={styles.page}>
    <FurlongStart />
    <section className={styles.section} aria-labelledby="answer-intro">
      <h2 id="answer-intro">A useful answer. Not another pile of information.</h2>
      <p>The Furlong Answer brings your possibilities, available numbers, constraints, missing evidence, and next step together.
        A reason to pause is useful too. No property or financing outcome is guaranteed.</p>
      <div className={styles.grid}>
        <article className={styles.card}><h3>Understand the opportunity</h3><p>Bring a property you found anywhere, an existing business, or an idea. Start with what you want to figure out.</p></article>
        <article className={styles.card}><h3>See what needs checking</h3><p>Separate sourced facts from assumptions. Missing price, income, soil, or legal-use evidence stays visible—it does not become a confident answer.</p></article>
        <article className={styles.card}><h3>Choose your next step</h3><p>Investigate financing paths and professional help when relevant. Saving information is separate from authorizing a recipient to receive it.</p></article>
      </div>
      <div className={styles.links}><Link href="/compass">Explore Furlong’s capabilities</Link><Link href="/discover?mode=possibilities">Open the full Navigator</Link></div>
    </section>
    <section className={styles.section} aria-labelledby="practical-guides">
      <h2 id="practical-guides">Before you commit, know what to check.</h2>
      <p>Practical guides for business-property expansion, financing preparation, project economics and agricultural land.</p>
      <Link href="/guides">Find a guide for your next decision</Link>
    </section>
    <section className={styles.section} aria-labelledby="commercial-truth">
      <h2 id="commercial-truth">Clear about what is free—and what is not.</h2>
      <div className={styles.grid}>
        <article className={styles.card}><h3>Free core exploration</h3><p>Property intelligence, financing navigation, baseline readiness and customer-controlled case coordination are not sold as borrower financing access.</p></article>
        <article className={styles.card}><h3>Optional professional work</h3><p>A separately commissioned service has a defined scope, responsible professional, payer, fee and delivery terms before you authorize it. Free tools do not include unlimited personal consulting.</p><Link href="/explore">Explore services</Link></article>
        <article className={styles.card}><h3>Organizational workflows</h3><p>Institutions can discuss separately contracted workflow capacity, integrations and support. Payment cannot buy a lead, customer information, ranking preference or a financing outcome.</p><Link href="/professional-access">For institutions and professionals</Link></article>
      </div>
    </section>
    <section className={styles.section} aria-labelledby="keep-control">
      <h2 id="keep-control">Keep control of your project.</h2>
      <p>Explore without creating an account. Where saving is available, sign in and explicitly save your case.
        Each provider handoff requires its own authorization. A saved case is not a loan application.</p>
      <div className={styles.links}><Link href="/status">Check an existing request</Link><Link href="/trust">Trust and your data</Link><Link href="/about">About Furlong</Link></div>
    </section>
    <div className={styles.section}><Disclosures variant="compact" /></div>
  </div>;
}
