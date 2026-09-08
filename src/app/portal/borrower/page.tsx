import type { Metadata } from "next";

import { MyFurlongDashboard } from "@/components/borrower/MyFurlongDashboard";
import { Disclosures } from "@/components/public/Disclosures";

export const metadata: Metadata = {
  title: "My Furlong | Properties, Readiness & Capital",
  description: "Keep the properties you are exploring, reopen analysis, compare verified providers, and control any financing handoff.",
};

export default function BorrowerPortalPage() {
  return (
    <main style={{ maxWidth: 1040, margin: "0 auto", padding: "42px 24px 80px", display: "grid", gap: 28 }}>
      <MyFurlongDashboard />
      <Disclosures variant="full" />
    </main>
  );
}
