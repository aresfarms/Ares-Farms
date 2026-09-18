import Link from "next/link";

import { PublicOrderCheckoutAgreement } from "@/components/public/PublicOrderCheckoutAgreement";
import styles from "@/components/public/FurlongExperience.module.css";
import {
  publicCheckoutDecision,
  publicProduct,
  publicProductDeliveryPromise,
} from "@/lib/billing/publicProductCatalog";

type SearchParams = Promise<
  Record<string, string | string[] | undefined>
>;

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value || "").trim();
}

function unavailable(message: string) {
  return (
    <main className={styles.page}>
      <section className={styles.start}>
        <p className={styles.eyebrow}>Public reports</p>
        <h1>Checkout is not available yet.</h1>
        <p>{message}</p>
        <Link href="/" className={styles.primary}>
          Return to property search
        </Link>
      </section>
    </main>
  );
}

export default async function PublicPurchasePage(props: {
  searchParams: SearchParams;
}) {
  const params = await props.searchParams;
  const product = publicProduct(first(params.product));
  if (!product) {
    return unavailable(
      "Choose a report from a verified Furlong property analysis.",
    );
  }

  const release = publicCheckoutDecision(product);
  if (!release.allowed || product.unitAmountCents === null) {
    return unavailable(
      "Furlong has not opened this report for payment. No charge has been made.",
    );
  }

  const exactAddress = first(params.address).slice(0, 300);
  const propertyId = first(params.propertyId).slice(0, 200) || null;
  const upgradeFromOrderId =
    product.code === "custom_property_analysis"
      ? first(params.upgradeFrom).slice(0, 100) || null
      : null;
  if (
    !product.targetTypes.includes("PROPERTY") ||
    exactAddress.length < 8
  ) {
    return unavailable(
      "A verified property address is required before checkout.",
    );
  }

  return (
    <main className={styles.page}>
      <PublicOrderCheckoutAgreement
        productCode={product.code}
        productName={product.publicName || "Furlong property analysis"}
        productDescription={product.description}
        targetLabel={exactAddress}
        target={{
          type: "PROPERTY",
          exactAddress,
          propertyId,
        }}
        amountCents={product.unitAmountCents}
        currency={product.currency}
        deliveryPromise={publicProductDeliveryPromise(
          product,
          release.deliveryBusinessDays,
        )}
        included={product.included}
        excluded={product.excluded}
        upgradeFromOrderId={upgradeFromOrderId}
      />
      <p className={styles.note}>
        Payment is processed by Stripe. Do not enter a Social Security
        number or personal financial account information for this report.
      </p>
    </main>
  );
}
