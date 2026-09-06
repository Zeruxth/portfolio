/**
 * GitHub Pages serves this repo from /portfolio, not the domain root, so the
 * base path has to be baked in at build time. It comes from an env var rather
 * than being hardcoded, so `npm run dev` still serves from / locally.
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
