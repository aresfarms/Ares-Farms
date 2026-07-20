import type { Metadata } from "next";

import { PlatformShell } from "@/components/platform/PlatformShell";

// Default document title for every route — client-component pages (e.g. the
// homepage and /financing-pathways) cannot export their own metadata, so this
// root default guarantees a <title> on them (WCAG 2.4.2 / axe document-title).
// Pages that DO export a metadata.title get "<title> | Furlong" via the template.
export const metadata: Metadata = {
  title: {
    default: "Furlong — Compass to Capital",
    template: "%s | Furlong",
  },
  description:
    "Furlong — bring the property, we bring the analysis. A guide through property, financing, farms, and environmental decisions.",
};

// NONCE-CSP REQUIREMENT (GCP readiness 2026-06-12): per-request CSP nonces are
// only possible under DYNAMIC rendering — a statically prerendered page cannot
// carry a nonce minted per request, so Next would leave its inline bootstrap
// scripts untagged and the strict production CSP would block hydration. This
// forces per-request rendering app-wide; the production proxy (src/proxy.ts)
// mints the nonce and Next tags every inline script with it.
export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <PlatformShell>{children}</PlatformShell>
    </html>
  );
}
