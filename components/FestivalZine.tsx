/**
 * The festival's daily programme as a cut zine, unfolding on a loop
 * (public/festival-zine/). It is a standalone WebGL page, so it runs in a frame
 * like the Halach book; the ground matches the zine's own #191919.
 */
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export default function FestivalZine() {
  return (
    <iframe
      src={`${BASE}/festival-zine/index.html`}
      title="Haifa International Film Festival — the daily programme zine"
      tabIndex={-1}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0, display: "block", background: "#191919", pointerEvents: "none" }}
    />
  );
}
