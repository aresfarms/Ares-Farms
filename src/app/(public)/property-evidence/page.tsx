import Link from "next/link";
import { PropertyComparisonFrontDoor } from "@/components/public/PropertyComparisonFrontDoor";
import { publicCheckoutDecision, publicProduct } from "@/lib/billing/publicProductCatalog";
import styles from "@/components/public/FurlongExperience.module.css";

export default async function PropertyEvidencePage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await props.searchParams;
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value ?? "").trim();
  const address = first(params.address).slice(0, 300);
  const comparisonId = first(params.comparisonId).slice(0, 64);
  const product = publicProduct("focused_property_report")!;
  return <main className={styles.page}>
    <h1>Property report preparation</h1>
    <PropertyComparisonFrontDoor initialAddress={address} comparisonId={comparisonId || undefined}
      reportSalesOpen={publicCheckoutDecision(product).allowed} />
    <Link href="/">Return to property search</Link>
  </main>;
}
