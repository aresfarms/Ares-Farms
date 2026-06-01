import { PlatformShell } from "@/components/platform/PlatformShell";

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
