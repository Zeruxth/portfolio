declare module "*.html" {
  const content: string;
  export default content;
}

// set with `wrangler secret put ADMIN_PASSWORD`, so `wrangler types` can't see it
interface Env {
  ADMIN_PASSWORD?: string;
}
