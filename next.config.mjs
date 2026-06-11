const nextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  turbopack: {
    root: process.cwd(),
  },
  // Security headers (control H). CSP is conservative; 'unsafe-inline' for styles
  // only (the app uses inline style objects, no inline <script>). HSTS also
  // belongs at the GCP load balancer in production.
  async headers() {
    const csp = [
      "default-src 'self'",
      "script-src 'self'",
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
