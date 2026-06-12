const nextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  turbopack: {
    root: process.cwd(),
  },
  // Security headers (control H). FIX 2026-06-12 (Step 3 rendered-crash class):
  // the original `script-src 'self'` silently broke Next.js client hydration —
  // Next App Router emits inline bootstrap <script>s (always) and dev needs
  // 'unsafe-eval' (turbopack/React Refresh). With hydration dead, interactive
  // components (the Navigator) rendered HTML but no handlers fired. The
  // governance gate checks header PRESENCE; this keeps every directive while
  // making script-src functional. TODO (production hardening, under the SEC
  // blockers / GCP migration): replace 'unsafe-inline' with nonce-based CSP at
  // the edge/middleware. HSTS also belongs at the GCP load balancer in prod.
  async headers() {
    const isDev = process.env.NODE_ENV !== "production";
    const csp = [
      "default-src 'self'",
      isDev ? "script-src 'self' 'unsafe-eval' 'unsafe-inline'" : "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join("; ");
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "geolocation=(), microphone=(), camera=()" },
        ],
      },
    ];
  },
  // Build 56 consolidation (4-page IA) — don't break inbound links.
  async redirects() {
    return [
      // Data Rights merged into Trust & Your Data.
      { source: "/data-rights", destination: "/trust#your-data", permanent: true },
      // Stewardship (gateway + per-domain) folded into What We Do.
      { source: "/stewardship", destination: "/compass", permanent: true },
      { source: "/stewardship/:domainId", destination: "/compass", permanent: true },
    ];
  },
};

export default nextConfig;
