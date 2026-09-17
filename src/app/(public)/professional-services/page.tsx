import type { Metadata } from "next";
import Link from "next/link";

import { ProfessionalServicesIntake } from "@/components/public/ProfessionalServicesIntake";
import styles from "@/components/public/FurlongExperience.module.css";

export const metadata: Metadata = {
  title: "Professional services scope review | Furlong",
  description:
    "Request separately scoped environmental, engineering, remediation, site-supervision, custom-concept, or professional-referral work.",
};

type SearchParams = Promise<
  Record<string, string | string[] | undefined>
>;

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value || "").trim();
}

export default async function ProfessionalServicesPage(props: {
  searchParams: SearchParams;
}) {
  const params = await props.searchParams;
  const initialAddress = first(params.address).slice(0, 300);
  return (
    <main className={styles.page}>
      <Link href="/" className={styles.secondary}>
        Return to property search
      </Link>
      <ProfessionalServicesIntake initialAddress={initialAddress} />
    </main>
  );
}
