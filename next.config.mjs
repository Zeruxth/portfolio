/**
 * The site lives at the root of akiwip.work, so the base path is empty. It stays
 * an env var so a build can still be served from a subpath (e.g. a bare
 * github.io/portfolio deploy) without touching the code.
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // the badge defaults to bottom-left, right on top of the contact block
  devIndicators: { position: "bottom-right" },
  // Pages is a static host: no Node server, so the whole site is pre-rendered
  output: "export",
  basePath,
  assetPrefix: basePath || undefined,
  // the export target has no image optimiser
  images: { unoptimized: true },
  // /about/index.html rather than /about.html, so Pages resolves it without a 404
  trailingSlash: true,
};

export default nextConfig;
