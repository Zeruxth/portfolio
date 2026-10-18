"use client";

import { useEffect, useRef, useState } from "react";

/**
 * PROTOCOL//POLYFLORA, the Blooming Riot film (vimeo.com/1103184489), playing
 * muted on a loop in its tile. Vimeo's background player covers the tile over
 * the film's opening still, and loads only once the tile is near. The film closes
 * on a grey end card from ~62s, so it is sent back to the start just before.
 */
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const SRC = "https://player.vimeo.com/video/1103184489?background=1&autoplay=1&muted=1&loop=1&autopause=0&dnt=1";
const END = 61.8; // progress arrives every ~0.25s, so this lands before 62
const RATIO = 1920 / 1230;

export default function PolyfloraFilm() {
  const box = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const [near, setNear] = useState(false);
  const [on, setOn] = useState(false);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setNear(true); io.disconnect(); }
    }, { rootMargin: "400px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!near) return;
    const send = (method: string, value?: unknown) =>
      frame.current?.contentWindow?.postMessage(JSON.stringify(value === undefined ? { method } : { method, value }), "https://player.vimeo.com");
    let rewinding = false;
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== "https://player.vimeo.com" || e.source !== frame.current?.contentWindow) return;
      let msg: { event?: string; data?: { seconds?: number } };
      try { msg = typeof e.data === "string" ? JSON.parse(e.data) : e.data; } catch { return; }
      if (msg.event === "ready") send("addEventListener", "timeupdate");
      // over the raw message protocol Vimeo reports time as playProgress
      if ((msg.event === "playProgress" || msg.event === "timeupdate") && (msg.data?.seconds ?? 0) >= END && !rewinding) {
        rewinding = true;
        send("setCurrentTime", 0);
        setTimeout(() => { rewinding = false; }, 1500);
      }
    };
    addEventListener("message", onMessage);
    return () => removeEventListener("message", onMessage);
  }, [near]);

  return (
    <div ref={box} style={{ position: "absolute", inset: 0, overflow: "hidden", background: "#000" }}>
      <img
        src={`${BASE}/projects/blooming-riot/sea.jpg`}
        alt=""
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
      />
      {near && (
        <iframe
          ref={frame}
          src={SRC}
          title="PROTOCOL//POLYFLORA"
          allow="autoplay; fullscreen; picture-in-picture"
          tabIndex={-1}
          onLoad={() => {
            frame.current?.contentWindow?.postMessage(JSON.stringify({ method: "addEventListener", value: "timeupdate" }), "https://player.vimeo.com");
            setTimeout(() => setOn(true), 900);
          }}
          style={{
            position: "absolute", left: "50%", top: "50%", width: "100%", aspectRatio: String(RATIO),
            translate: "-50% -50%", border: 0, pointerEvents: "none",
            opacity: on ? 1 : 0, transition: "opacity 1.2s ease",
          }}
        />
      )}
    </div>
  );
}
