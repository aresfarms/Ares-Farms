import { PlatformShell } from "@/components/platform/PlatformShell";

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
