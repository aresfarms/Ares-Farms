import Link from "next/link";

import styles from "@/components/public/FurlongExperience.module.css";

export default function PublicPurchaseCanceledPage() {
  return (
    <main className={styles.page}>
      <section className={styles.start}>
        <p className={styles.eyebrow}>Checkout canceled</p>
        <h1>Furlong has not started the analysis.</h1>
        <p>
          Furlong begins only after the payment processor confirms
          payment. You can return to the property and order later.
        </p>
        <Link href="/" className={styles.primary}>
          Return to Furlong
        </Link>
      </section>
    </main>
  );
}
