"use client";

import { useEffect, useRef } from "react";
import s from "./FestivalBracelets.module.css";

/**
 * The Haifa film festival wristbands as three linked loops, after the chain of
 * bands in the brief's reference. Seven designs, three on the wrist at a time.
 *
 * The chain hangs still. One band at a time turns a little more than once
 * round its own loop to a new resting place, then everything holds. The new
 * design comes out of one fixed point on the loop, where the band is edge-on
 * to you, carried round by the turn itself: by the time the band has gone all
 * the way round it is the next design throughout. The turn is in held frames
 * at ~15fps, like the Zoo logo and syrup labels, so it moves like the rest of
 * the portfolio's tiles rather than like a physics toy.
 *
 * Every turn stops on a different part of the print (the logo head, or a
 * stretch of the gradient), never where it last stopped, so the three never
 * settle into the same picture; at the start the top band shows you its logo.
 * The loops are a touch oval rather than true circles, the print is grained
 * with a paper texture, and the bands never show the same design twice at once.
 *
 * Drawn in WebGL as one continuous strip per band, so the prints bend smoothly,
 * the bands pass through each other on a depth buffer and the light is worked
 * out per pixel. The prints are flat renders of the strips on the print sheet
 * (gradient, black head, wave tab), see public/festival-bracelets.
 */
const DESIGNS = 7;
const ON_WRIST = 3;

const HOLD_MS = 1800;
const TURN_MS = 1500;
/** ~15fps, the same held-frame rate as the Zoo logo and labels */
const FRAMES = 22;
/** points along each band; plenty for a smooth curve */
const SEG = 180;
/** the festival's black, from the print sheet */
const GROUND = [11 / 255, 11 / 255, 11 / 255];

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const TAU = Math.PI * 2;
/** a gentle in-out: a full turn and more is a lot of travel, so no sharp middle */
const ease = (t: number) => (1 - Math.cos(Math.PI * t)) / 2;

type V = [number, number, number];
type M = [V, V, V]; // rows

const mul = (m: M, v: V): V => [
  m[0][0] * v[0] + m[0][1] * v[1] + m[0][2] * v[2],
  m[1][0] * v[0] + m[1][1] * v[1] + m[1][2] * v[2],
  m[2][0] * v[0] + m[2][1] * v[1] + m[2][2] * v[2],
];
const mm = (a: M, b: M): M =>
  [0, 1, 2].map((r) => [0, 1, 2].map((c) => a[r][0] * b[0][c] + a[r][1] * b[1][c] + a[r][2] * b[2][c])) as M;
const rx = (t: number): M => [[1, 0, 0], [0, Math.cos(t), -Math.sin(t)], [0, Math.sin(t), Math.cos(t)]];
const ry = (t: number): M => [[Math.cos(t), 0, Math.sin(t)], [0, 1, 0], [-Math.sin(t), 0, Math.cos(t)]];
const rz = (t: number): M => [[Math.cos(t), -Math.sin(t), 0], [Math.sin(t), Math.cos(t), 0], [0, 0, 1]];
const unit = (v: V): V => {
  const n = Math.hypot(...v);
  return [v[0] / n, v[1] / n, v[2] / n];
};
const wrap = (a: number) => ((a % TAU) + TAU) % TAU;

/**
 * The chain, in loop radii, y down. Links alternate between perpendicular
 * planes, 1.1 radii apart, so each passes through its neighbour's hole. Each
 * has its own slight oval (`shape`) so none looks machined.
 */
const LINKS: { c: V; frame: M; shape: number }[] = [
  { c: [0, -1.1, 0], frame: mm(rx(0.12), rz(0.1)), shape: 0.4 },
  { c: [0, 0, 0], frame: mm(ry(Math.PI / 2), rx(-0.14)), shape: 2.2 },
  { c: [0, 1.1, 0], frame: mm(rx(-0.1), rz(-0.12)), shape: 1.3 },
];
/** how the chain hangs in the tile */
const POSE = mm(rz(-0.42), mm(rx(0.42), ry(0.8)));
/**
 * Where a band can come to rest: the part of its print, 0..1 along the strip,
 * that ends up nearest the eye. 0.86 is the middle of the black head (gradient
 * 1987px, head 334px of the 2503px strip); the rest are stretches of gradient.
 */
const STOPS = [0.86, 0.12, 0.36, 0.6];
/** where each band starts: the top one on its logo, the others on gradient */
const FIRST = [0, 2, 3];
/** the angle round each loop nearest the eye */
const FRONT = LINKS.map(({ frame }) => {
  const m = mm(POSE, frame);
  return Math.atan2(-m[2][1], m[2][0]);
});
/**
 * Where the new design comes out: a quarter round from the front, where the
 * band is edge-on to you and its edge is all you see of it.
 */
const GATE = FRONT.map((a) => a + Math.PI / 2);
/** how far a band is turned on its loop to bring stop `i` to the front */
const restAt = (band: number, i: number) => FRONT[band] - STOPS[i] * TAU;
/** the chain fills this much of the tile, the larger way */
const FILL = 0.84;
/** how strongly the paper's grain shows, and how many band widths one paper sheet spans */
const GRAIN = 1.8;
const SHEET = 7;
const LIGHT = unit([-0.45, -0.65, 0.62]);
/** halfway between the light and the eye, for the sheen */
const HALF = unit([LIGHT[0], LIGHT[1], LIGHT[2] + 1]);

const VERT = `#version 300 es
in vec3 aPos;
in vec3 aNor;
in vec2 aUv;
in float aTh;
uniform vec2 uHalf;   // half the tile, in px
uniform float uFocal;
uniform float uDepth;
out vec3 vNor;
out vec2 vUv;
out float vTh;
void main() {
  float s = uFocal / (uFocal - aPos.z);
  gl_Position = vec4(aPos.x * s / uHalf.x, -aPos.y * s / uHalf.y, -aPos.z / uDepth, 1.0);
  vNor = aNor;
  vUv = aUv;
  vTh = aTh;
}`;

const FRAG = `#version 300 es
precision highp float;
in vec3 vNor;
in vec2 vUv;
in float vTh;
uniform sampler2D uCur;
uniform sampler2D uNext;
uniform float uFrom;   // where the band started this turn, in radians
uniform float uGone;   // how far it has turned since; -1 while holding
uniform float uGate;   // where on the loop the new design comes out
uniform vec3 uLight;
uniform vec3 uHalfV;
uniform sampler2D uPaper;
uniform vec2 uSheet;   // print uv to paper uv
out vec4 outColor;
const float TAU = 6.28318531;
void main() {
  // the outside when its face is toward us, otherwise the inside (the strip
  // winds clockwise on screen when we see its outside)
  bool front = !gl_FrontFacing;
  // this part of the band has been carried past the gate: it's the new design
  bool fresh = uGone >= 0.0 && mod(uGate - vTh - uFrom, TAU) < uGone;
  vec3 c;
  if (front) {
    c = fresh ? texture(uNext, vUv).rgb : texture(uCur, vUv).rgb;
  } else {
    // the same print inside, at a small fixed blur: the gradients come through
    // whole, the head's type and the tab's waves just soften rather than
    // showing backwards
    c = fresh ? textureLod(uNext, vUv, 3.0).rgb : textureLod(uCur, vUv, 3.0).rgb;
  }
  // only the paper's fine grain, not its tone: the sheet less a blur of itself
  vec2 pu = vUv * uSheet;
  c *= 1.0 + (texture(uPaper, pu).r - texture(uPaper, pu, 4.0).r) * ${GRAIN.toFixed(2)};
  vec3 n = normalize(vNor);
  vec3 f = front ? n : -n;
  float lit = max(0.0, dot(f, uLight));
  float shade = (front ? 0.0 : 0.12) + 0.14 * (1.0 - lit);
  float sheen = pow(max(0.0, dot(f, uHalfV)), 28.0) * (front ? 0.2 : 0.08);
  outColor = vec4(c * (1.0 - shade) + sheen, 1.0);
}`;

const reduced = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

interface Band {
  cur: number;
  next: number;
  /** which of STOPS it rests on, and how far it's turned on its loop to get there */
  stop: number;
  rest: number;
  /** the current turn: from where, and by how much */
  from: number;
  by: number;
  /** when the current turn began; null while holding */
  since: number | null;
}

function program(gl: WebGL2RenderingContext) {
  const shader = (type: number, src: string) => {
    const sh = gl.createShader(type)!;
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    return sh;
  };
  const p = gl.createProgram()!;
  gl.attachShader(p, shader(gl.VERTEX_SHADER, VERT));
  gl.attachShader(p, shader(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(p);
  return p;
}

export default function FestivalBracelets() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const gl = canvas?.getContext("webgl2", { antialias: true });
    if (!canvas || !gl) return;

    const prog = program(gl);
    gl.useProgram(prog);
    const u = (n: string) => gl.getUniformLocation(prog, n);
    const U = {
      half: u("uHalf"),
      focal: u("uFocal"),
      depth: u("uDepth"),
      cur: u("uCur"),
      next: u("uNext"),
      from: u("uFrom"),
      gone: u("uGone"),
      gate: u("uGate"),
      light: u("uLight"),
      halfV: u("uHalfV"),
      paper: u("uPaper"),
      sheet: u("uSheet"),
    };
    gl.uniform1i(U.cur, 0);
    gl.uniform1i(U.next, 1);
    gl.uniform1i(U.paper, 2);
    gl.uniform3fv(U.light, LIGHT);
    gl.uniform3fv(U.halfV, HALF);

    // one interleaved strip per band: position, normal, uv, angle along the band
    const STRIDE = 9;
    const verts = SEG + 1;
    const data = new Float32Array(verts * 2 * STRIDE);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, data.byteLength, gl.DYNAMIC_DRAW);
    const attr = (n: string, size: number, off: number) => {
      const loc = gl.getAttribLocation(prog, n);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, STRIDE * 4, off * 4);
    };
    attr("aPos", 3, 0);
    attr("aNor", 3, 3);
    attr("aUv", 2, 6);
    attr("aTh", 1, 8);
    gl.enable(gl.DEPTH_TEST);

    let aspect = 160 / 2503; // band width / length, until the prints say otherwise
    let loaded = 0;
    const NEEDED = DESIGNS + 1;
    const texture = (src: string, unit: number, wrapMode: number, done: (im: HTMLImageElement) => void) => {
      const tex = gl.createTexture()!;
      const im = new Image();
      im.onload = () => {
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapMode);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrapMode);
        done(im);
        if (++loaded === NEEDED) draw();
      };
      im.src = `${BASE}/festival-bracelets/${src}`;
      return tex;
    };
    const textures = Array.from({ length: DESIGNS }, (_, i) =>
      texture(`${i + 1}.jpg`, 0, gl.CLAMP_TO_EDGE, (im) => {
        aspect = im.naturalHeight / im.naturalWidth;
      }),
    );
    // the paper sits on its own unit for good; one sheet spans SHEET band widths
    texture("paper.jpg", 2, gl.REPEAT, (im) => {
      gl.uniform2f(U.sheet, 1 / aspect / SHEET, im.naturalWidth / im.naturalHeight / SHEET);
    });

    /**
     * The chain's outline, in loop radii and after perspective, so it can be
     * sized and centred in the tile.
     */
    let box: { x: number; y: number; w: number; h: number } | null = null;
    const measure = () => {
      const half = Math.PI * aspect;
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      LINKS.forEach(({ c, frame: f }) => {
        const m = mm(POSE, f);
        const ax = mul(m, [0, 0, 1]);
        const centre = mul(POSE, c);
        for (let i = 0; i < 96; i++) {
          const a = (i / 96) * TAU;
          const rad = mul(m, [Math.cos(a), -Math.sin(a), 0]);
          for (const side of [-half, half]) {
            const z = centre[2] + rad[2] + ax[2] * side;
            const sc = 6 / (6 - z);
            const x = (centre[0] + rad[0] + ax[0] * side) * sc;
            const y = (centre[1] + rad[1] + ax[1] * side) * sc;
            x0 = Math.min(x0, x); x1 = Math.max(x1, x);
            y0 = Math.min(y0, y); y1 = Math.max(y1, y);
          }
        }
      });
      return { x: (x0 + x1) / 2, y: (y0 + y1) / 2, w: x1 - x0, h: y1 - y0 };
    };

    const bands: Band[] = Array.from({ length: ON_WRIST }, (_, i) => ({
      cur: i,
      next: i,
      stop: FIRST[i],
      rest: restAt(i, FIRST[i]),
      from: 0,
      by: 0,
      since: null,
    }));
    let queue = ON_WRIST; // next design to go on
    let turn = 0; // next band to change
    let w = 0;
    let h = 0;
    let raf = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let running = false;
    /** the held frame each band is on, so nothing redraws between frames */
    let shown = "";

    const size = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = r.width;
      h = r.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    /** each band's progress through its turn, in held frames: 0..1, or -1 while holding */
    const progress = (now: number) =>
      bands.map((b) =>
        b.since === null ? -1 : Math.min(1, Math.floor(((now - b.since) / TURN_MS) * FRAMES) / FRAMES),
      );

    const draw = (now = performance.now()) => {
      gl.clearColor(GROUND[0], GROUND[1], GROUND[2], 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      if (loaded < NEEDED) return;
      box ??= measure();
      const R = Math.min((w * FILL) / box.w, (h * FILL) / box.h);
      const half = Math.PI * R * aspect;
      // centred on the chain's own outline, not on its middle link
      const dx = -box.x * R;
      const dy = -box.y * R;
      gl.uniform2f(U.half, w / 2, h / 2);
      gl.uniform1f(U.focal, R * 6);
      gl.uniform1f(U.depth, R * 6);
      const ks = progress(now);

      bands.forEach((band, bi) => {
        const { c, frame: f, shape } = LINKS[bi];
        const m = mm(POSE, f);
        const ax = mul(m, [0, 0, 1]);
        const centre = mul(POSE, [c[0] * R, c[1] * R, c[2] * R]);
        centre[0] += dx;
        centre[1] += dy;
        const k = ks[bi];
        const gone = k < 0 ? -1 : ease(k) * band.by;
        const turned = k < 0 ? band.rest : band.from + gone;

        for (let i = 0; i < verts; i++) {
          const th = (i / SEG) * TAU;
          const a = th + turned;
          const r = R * (1 + 0.025 * Math.cos(2 * th + shape));
          // the print runs round the loop this way so its type reads right way round from outside
          const rad = mul(m, [Math.cos(a), -Math.sin(a), 0]);
          for (let e = 0; e < 2; e++) {
            const side = e ? half : -half;
            const o = (i * 2 + e) * STRIDE;
            data[o] = centre[0] + rad[0] * r + ax[0] * side;
            data[o + 1] = centre[1] + rad[1] * r + ax[1] * side;
            data[o + 2] = centre[2] + rad[2] * r + ax[2] * side;
            data[o + 3] = rad[0];
            data[o + 4] = rad[1];
            data[o + 5] = rad[2];
            data[o + 6] = i / SEG;
            data[o + 7] = e ? 0 : 1;
            data[o + 8] = th;
          }
        }

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, textures[band.cur]);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, textures[band.next]);
        gl.uniform1f(U.from, band.from);
        gl.uniform1f(U.gone, gone);
        gl.uniform1f(U.gate, GATE[bi]);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, data);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, verts * 2);
      });
    };

    const loop = (now: number) => {
      bands.forEach((b) => {
        if (b.since !== null && now - b.since >= TURN_MS) {
          b.cur = b.next;
          b.rest = wrap(b.from + b.by);
          b.since = null;
        }
      });
      // draw only when some band has stepped to a new frame
      const key = progress(now).join();
      if (key !== shown) {
        shown = key;
        draw(now);
      }
      raf = requestAnimationFrame(loop);
    };

    // one band at a time takes the next design off the queue, in turn
    const change = () => {
      const b = bands[turn];
      b.next = queue;
      // one full turn, so every part passes the gate, then on to the next stop
      // or the one after, so it doesn't always land the same distance on
      const ahead = STOPS.map((_, i) => i)
        .filter((i) => i !== b.stop)
        .map((i) => ({ i, by: wrap(restAt(turn, i) - b.rest) }))
        .sort((x, y) => x.by - y.by);
      const pick = ahead[Math.floor(Math.random() * 2)];
      b.stop = pick.i;
      b.from = b.rest;
      b.by = TAU + pick.by;
      b.since = performance.now();
      queue = (queue + 1) % DESIGNS;
      turn = (turn + 1) % ON_WRIST;
      timer = setTimeout(change, TURN_MS + HOLD_MS);
    };

    const start = () => {
      if (running) return;
      running = true;
      draw();
      if (reduced()) return;
      raf = requestAnimationFrame(loop);
      timer = setTimeout(change, HOLD_MS);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };

    size();
    const ro = new ResizeObserver(() => {
      size();
      draw();
    });
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()));
    io.observe(canvas);
    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className={s.stage}
      role="img"
      aria-label="Haifa International Film Festival wristbands, three linked, changing through seven designs"
    />
  );
}
