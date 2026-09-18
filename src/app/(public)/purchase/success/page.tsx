import Link from "next/link";

import { PublicOrderStatus } from "@/components/public/PublicOrderStatus";
import styles from "@/components/public/FurlongExperience.module.css";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function PublicPurchaseSuccessPage(props: {
  searchParams: Promise<
    Record<string, string | string[] | undefined>
  >;
}) {
  const params = await props.searchParams;
  const value = params.order;
  const orderId = (
    Array.isArray(value) ? value[0] : value || ""
  ).trim();

  return (
    <main className={styles.page}>
      {UUID.test(orderId) ? (
        <PublicOrderStatus orderId={orderId} />
      ) : (
        <section className={styles.start}>
          <h1>We could not read the order reference.</h1>
          <p>No additional charge has been made from this page.</p>
        </section>
      )}
      <div className={styles.links}>
        <Link href="/">Return to Furlong</Link>
      </div>
    </main>
  );
}
