import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // app.voxaris.io ("Voxaris Command") is a fully auth-gated internal app —
  // every unauthenticated request is redirected to /login by middleware, so
  // there is zero public content to rank. Search engines were indexing the
  // login gate (Bing flagged /overview for missing-h1 / thin content / short
  // title). Serve X-Robots-Tag: noindex on every response so crawlers drop
  // any already-indexed app URLs. The header (vs a robots.txt Disallow) is
  // deliberate: crawlers must be able to FETCH the page to SEE the noindex
  // and de-index it — a Disallow would block the crawl and strand stale
  // entries in the index.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
