/**
 * The site's arrow (components/icons.tsx) as a 3x PNG in ink, for the email:
 * mail clients won't show SVG. Rasterised from the same path and stroke.
 */
const ARROW_PNG_B64 =
  "iVBORw0KGgoAAAANSUhEUgAAAEIAAAAwCAYAAAClvqwiAAABrklEQVR4Aeza723CMBAF8Cg7tAPke4dox+kSwBCs00qdoZ8zQKfoeyZGiUgMSu7M3QHyIydhidwPiz8ObePg1nXdntE8VfMQA8AOCLuhRik/TEMMjRMhd66GYRZiBkEVwyxE7nrhKL4yzEL0fb8HwgFZGqIYZiHYfU0M0xA1McxD1MJwAVEDww2ENoYrCE0MdxBaGC4hNDDcQkhj3A2CjUhE6kuXewhiSmCEgJDACAOxFSMUxBaMcBBrMVrsBH05T9rYRQ/5eER9BMgL8ocsjcl+BlfEO2Z6Dvc0x/lEPzmvqEvjjEGI0sRHeCxhPCGGl/oJ0TQHfiEjxDdQcn5RX0ue6+FYerNEqycEFi00PkZ5Q30t4/lmazT3g5TeLNNKwJw0uCJSEekOH5+8FMBPkqW2JgicFA5iDUI4iJsQTheO2PskYVbEFgSKhIDYihACQgLBPYQUgmsISQS3ENIILiE0ENxBaCG4gtBEcAOhjeACogaCeYhaCKYhaiKYhuDJFXKxn1CYe9NDZn90YaeMmytz/7MUR6CUPgSfZWVmMFQQeHqmIXiCIww1BD7PPwAAAP//tHP1tgAAAAZJREFUAwDdDeY8Tc+xlAAAAABJRU5ErkJggg==";

export function arrowPng(): Response {
  const bytes = Uint8Array.from(atob(ARROW_PNG_B64), (c) => c.charCodeAt(0));
  return new Response(bytes, {
    headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=31536000, immutable" },
  });
}
