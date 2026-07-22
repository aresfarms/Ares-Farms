const nextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  // Vol III (Technical Infrastructure) / Vol IV (Operational Runbooks):
  // STAGING-DEPLOY P0.3 — deterministic container. `output: "standalone"`
  // emits `.next/standalone` (minimal server.js + traced node_modules) so the
  // runtime image installs NOTHING and carries no build toolchain or secrets.
  // The Dockerfile copies `.next/standalone`, then `.next/static` and `public`
  // into it (standalone does not bundle those by design). Runtime honors PORT
  // and HOSTNAME env, so the container binds 0.0.0.0:$PORT for Cloud Run.
  output: "standalone",
  turbopack: {
    root: process.cwd(),
  },
  // Security headers (control H). NONCE-CSP HARDENING 2026-06-12: the CSP no
  // longer lives here — a static config header cannot carry a per-request
  // nonce. src/proxy.ts now generates a cryptographically random nonce per
  // page request and sets the CSP on the request (so Next tags its inline
  // hydration scripts) and the response. PRODUCTION script-src has NO
  // 'unsafe-inline' (nonce + 'strict-dynamic'); dev stays relaxed, gated to
  // NODE_ENV=development. verify:csp-hydration proves the EFFECT (hydration
  // under the strict policy), not just header presence. The non-CSP headers
  // below remain static. HSTS also belongs at the GCP load balancer in prod.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-DNS-Prefetch-Control", value: "off" },
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
