const nextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  turbopack: {
    root: process.cwd(),
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
