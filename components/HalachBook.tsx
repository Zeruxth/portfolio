/**
 * The interactive book (public/halach-alenu/), set into its tile. It is a
 * standalone page with its own controls, so it runs in a frame rather than
 * being rebuilt here; the tile's shape decides how big the book is.
 */
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export default function HalachBook() {
  return (
    <iframe
      src={`${BASE}/halach-alenu/index.html`}
      title="We Are Screwed — the interactive book"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0, display: "block", background: "#222222" }}
    />
  );
}
