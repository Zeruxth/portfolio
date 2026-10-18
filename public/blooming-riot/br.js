/*
 * Blooming Riot / Polyflora. Everything that moves:
 * - the hero gradient, redrawn as a shader from the Figma blob so it can breathe
 * - the intro (frame draws, brackets open the words) and the hero dissolving as you leave
 * - reveals as sections arrive, and the scroll-linked pieces (roadmap line, collage depth,
 *   the sea opening up, poster drift)
 * - the small hovers: poster tilt, tracking frames, swatch copy
 */
(() => {
  const root = document.documentElement;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

  /* one Figma pixel, measured without the scrollbar so nothing overflows. On
     desktop the 1920 frame fills 70% of the window, centred, as the original
     site sat at 1920; phones restack on their own unit */
  const SCALE = 0.7;
  let u = 1, vh = innerHeight;
  const measure = () => {
    const w = root.clientWidth;
    u = (w > 760 ? w * SCALE : w) / 1920;
    vh = innerHeight;
    root.style.setProperty("--u", `${u}px`);
  };
  measure();

  /* ---------- inline SVGs, so their parts can animate ---------- */

  // The hero words open from the inside: each bracket starts against the frame
  // and slides out to its place, and the letters appear in the space it opens.
  // The Figma export clipped its art to the frame, which cut the top of the ],
  // so that clip goes and a reveal clip of our own takes its place.
  const NS = "http://www.w3.org/2000/svg";
  const openers = [];
  const opener = (el, svg) => {
    svg.querySelectorAll("[clip-path]").forEach((g) => g.removeAttribute("clip-path"));
    svg.querySelector("defs")?.remove();
    const id = `reveal-${openers.length}`;
    const W = svg.viewBox.baseVal.width;
    const bracket = svg.querySelector("path");
    const box = bracket.getBBox();
    const left = box.x < W / 2; // [ opens leftwards, ] rightwards
    const letters = document.createElementNS(NS, "g");
    [...bracket.parentNode.children].filter((n) => n !== bracket).forEach((n) => letters.appendChild(n));
    bracket.parentNode.appendChild(letters);
    // the reveal edge is the bracket's inner stroke: the I sits inside the [ and
    // the T tucks under the slanted ], so the edge follows the slant
    const clip = document.createElementNS(NS, "clipPath");
    clip.id = id;
    const edge = document.createElementNS(NS, "path");
    clip.appendChild(edge);
    svg.prepend(clip);
    letters.setAttribute("clip-path", `url(#${id})`);
    const inner = left ? box.x + 4.86 : 0; // [ : right side of its upright
    const start = left ? W - inner : -(box.x + box.width);
    const set = (p, fade) => {
      const tx = start * (1 - p);
      bracket.setAttribute("transform", `translate(${tx} 0)`);
      bracket.style.opacity = fade;
      edge.setAttribute("d", left
        ? `M${inner + tx} -20H${W + 40}V120H${inner + tx}Z`
        : `M-40 -20H${374 + tx}L${337.6 + tx} 120H-40Z`);
    };
    set(reduced ? 1 : 0, reduced ? 1 : 0);
    return { set, delay: el.classList.contains("hero-lockup--a") ? 0.55 : 0.8 };
  };

  const inlined = Promise.all($$("[data-svg]").map(async (el) => {
    try {
      const res = await fetch(el.dataset.svg);
      el.innerHTML = await res.text();
      const svg = el.querySelector("svg");
      svg.removeAttribute("width");
      svg.removeAttribute("height");
      svg.setAttribute("aria-hidden", "true");
      if (el.classList.contains("hero-lockup")) openers.push(opener(el, svg));
    } catch (_) { /* the page still reads without the art */ }
  }));

  /* ---------- hero gradient ---------- */

  const canvas = $(".hero-gradient");
  const hero = $(".hero");
  const gradient = (() => {
    const gl = canvas.getContext("webgl", { antialias: false, premultipliedAlpha: false });
    if (!gl) return null;

    const vert = `attribute vec2 a; void main(){ gl_Position = vec4(a, 0.0, 1.0); }`;
    // the Figma blob: grey ground, a wide sage halo, two neon bodies, a sage shadow,
    // a lavender light and a white core. Each one orbits on its own beat, the space
    // between them is warped so the edges keep changing shape, the pointer bends the
    // field around itself, and on the way out the whole thing spreads and fades: made not to last.
    const frag = `
      precision highp float;
      uniform vec2 uRes; uniform float uTime; uniform vec2 uMouse;
      uniform float uIntro; uniform float uExit; uniform float uPresence;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
      vec2 orbit(float t, float k, float s){ return s * vec2(sin(t * 0.31 + k), cos(t * 0.23 + k * 1.7)); }
      vec3 blob(vec3 col, vec2 p, vec2 c, float r, vec3 tint, float a){
        vec2 q = p - c;
        return mix(col, tint, a * exp(-dot(q, q) / (r * r)));
      }
      void main(){
        vec2 uv = gl_FragCoord.xy / uRes;
        float asp = uRes.x / uRes.y;
        vec2 p = (uv - 0.5) * vec2(asp, 1.0);
        float t = uTime;
        p += 0.04 * vec2(sin(p.y * 4.0 + t * 0.42), sin(p.x * 3.4 - t * 0.36));
        p += 0.018 * vec2(sin(p.y * 9.0 - t * 0.66 + 1.3), cos(p.x * 8.0 + t * 0.58));
        // the pointer doesn't carry anything: it bends the field around it, pulling
        // the colour from further out in towards itself, with a slight turn, like a
        // finger drawn through wet paint. Resting, the field is left alone.
        vec2 m = (uMouse - 0.5) * vec2(asp, 1.0);
        vec2 q = p - m;
        float w = uPresence * exp(-dot(q, q) / 0.17);
        float a = 0.45 * w;
        q = mat2(cos(a), -sin(a), sin(a), cos(a)) * q * (1.0 + 0.5 * w);
        p = m + q;
        float g = uIntro * (1.0 + uExit * 0.9);
        float f = smoothstep(0.0, 1.0, uIntro) * (1.0 - uExit * 0.8);
        // a wide, soft field rather than a blob: every patch is broad and overlaps the next
        vec3 col = vec3(0.776);
        col = blob(col, p, vec2(-0.01, 0.0) + orbit(t, 0.0, 0.03), 0.62 * g, vec3(0.83, 0.85, 0.75), 0.8 * f);
        col = blob(col, p, vec2(-0.2, -0.16) + orbit(t, 2.1, 0.06), 0.24 * g, vec3(0.64, 0.77, 0.67), 0.8 * f);
        col = blob(col, p, vec2(-0.19, 0.07) + orbit(t, 4.2, 0.06), 0.18 * g, vec3(0.84, 1.0, 0.35), 0.88 * f);
        col = blob(col, p, vec2(0.09, -0.12) + orbit(t, 1.0, 0.06), 0.2 * g, vec3(0.85, 1.0, 0.4), 0.85 * f);
        col = blob(col, p, vec2(0.16, 0.28) + orbit(t, 3.3, 0.06), 0.26 * g, vec3(0.93, 0.915, 0.965), 0.85 * f);
        col = blob(col, p, vec2(0.04, 0.1) + orbit(t, 5.0, 0.045), 0.14 * g, vec3(0.965, 0.97, 0.94), 0.75 * f);
        // settle back to the page grey along the bottom, so the hero has no edge
        col = mix(vec3(0.776), col, smoothstep(0.0, 0.22, uv.y));
        col += (hash(gl_FragCoord.xy) - 0.5) * (3.0 / 255.0);
        gl_FragColor = vec4(col, 1.0);
      }`;
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, vert));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, frag));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const a = gl.getAttribLocation(prog, "a");
    gl.enableVertexAttribArray(a);
    gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
    const loc = (n) => gl.getUniformLocation(prog, n);
    const U = { res: loc("uRes"), time: loc("uTime"), mouse: loc("uMouse"), intro: loc("uIntro"), exit: loc("uExit"), presence: loc("uPresence") };

    // it is all soft light, so it renders at reduced resolution and the browser scales it up
    const resize = () => {
      const s = Math.min(devicePixelRatio || 1, 2) * 0.5;
      canvas.width = Math.max(2, Math.round(canvas.clientWidth * s));
      canvas.height = Math.max(2, Math.round(canvas.clientHeight * s));
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    canvas.classList.add("is-live");
    return {
      resize,
      draw(time, mouse, intro, exit, presence) {
        gl.uniform2f(U.res, canvas.width, canvas.height);
        gl.uniform1f(U.time, time);
        gl.uniform2f(U.mouse, mouse.x, mouse.y);
        gl.uniform1f(U.intro, intro);
        gl.uniform1f(U.exit, exit);
        gl.uniform1f(U.presence, presence);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      },
    };
  })();

  /* ---------- pointer (eased) ---------- */

  const pointer = { x: 0.5, y: 0.5, in: 0 }, eased = { x: 0.5, y: 0.5, in: 0 };
  hero.addEventListener("pointermove", (e) => {
    const r = hero.getBoundingClientRect();
    pointer.x = (e.clientX - r.left) / r.width;
    pointer.y = 1 - (e.clientY - r.top) / r.height;
    pointer.in = 1;
  });
  hero.addEventListener("pointerleave", () => { pointer.in = 0; });

  /* ---------- reveals ---------- */

  const reveal = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add("in");
      reveal.unobserve(e.target);
    }
  }, { rootMargin: "0px 0px -12% 0px", threshold: 0.15 });
  $$("[data-reveal], .problem, .designer, .identity").forEach((el) => reveal.observe(el));

  /* ---------- scroll-linked pieces ---------- */

  const roadmap = $(".roadmap"), problem = $(".problem"), drift = $(".drift"), driftWindow = $(".drift-window"), posters = $(".posters");
  const lockA = $(".hero-lockup--a"), lockB = $(".hero-lockup--b"), frame = $(".hero-frame");
  const phases = [["#problem", 0], ["#solution", 1], ["#identity", 2]].map(([id, i]) => [$(id), $$(".nav-link")[i]]);
  let heroExit = 0;

  const ease = (x) => 1 - Math.pow(1 - x, 3);
  let lastY = scrollY;
  const onScroll = () => {
    const y = scrollY;
    heroExit = clamp(y / hero.offsetHeight);
    // the header steps aside while you read down, and comes back as soon as you scroll up
    if (Math.abs(y - lastY) > 6) {
      root.classList.toggle("nav-away", y > lastY && y > vh * 0.5);
      lastY = y;
    }

    let r = roadmap.getBoundingClientRect();
    roadmap.style.setProperty("--draw", reduced ? 1 : clamp((vh * 0.9 - r.top) / (vh * 0.75)).toFixed(4));

    r = problem.getBoundingClientRect();
    problem.style.setProperty("--shift", reduced ? 0 : clamp((r.top + r.height / 2 - vh / 2) / vh, -1, 1).toFixed(4));

    // the sea opens while its own window crosses the screen, not the section around it
    r = driftWindow.getBoundingClientRect();
    const o = clamp((vh - r.top) / (vh * 0.9));
    drift.style.setProperty("--open", reduced ? 1 : (o * o * (3 - 2 * o)).toFixed(4));

    r = posters.getBoundingClientRect();
    posters.style.setProperty("--shift", reduced ? 0 : clamp((r.top + r.height / 2 - vh / 2) / vh, -1, 1).toFixed(4));

    // which phase the header points at
    let current = null;
    for (const [sec, link] of phases) if (sec.getBoundingClientRect().top <= vh * 0.5) current = link;
    for (const [, link] of phases) link.classList.toggle("is-current", link === current);
  };
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", () => { measure(); gradient?.resize(); onScroll(); });
  onScroll();

  /* ---------- the hero loop ---------- */

  let heroVisible = true, introStart = null, started = false, running = false;
  const loop = () => { if (started && !running) { running = true; requestAnimationFrame(tick); } };
  new IntersectionObserver(([e]) => { heroVisible = e.isIntersecting; if (heroVisible) loop(); }).observe(hero);

  function tick(now) {
    if (introStart === null) introStart = now;
    const t = (now - introStart) / 1000;
    const intro = reduced ? 1 : ease(clamp(t / 2.2));
    // the bend trails the pointer slowly and lets go gently when it leaves
    eased.x += (pointer.x - eased.x) * 0.06;
    eased.y += (pointer.y - eased.y) * 0.06;
    eased.in += (pointer.in - eased.in) * 0.04;

    if (!reduced) {
      for (const o of openers) {
        const k = clamp((t - o.delay - 0.35) / 1.5);
        o.set(k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2, clamp((t - o.delay) / 0.35));
      }
      // the two halves of the line drift apart as you leave
      const out = heroExit * 160;
      lockA.style.translate = `${-out * u}px 0`;
      lockB.style.translate = `${out * u}px 0`;
      frame.style.translate = `0 ${-heroExit * 60 * u}px`;
      frame.style.scale = `${1 - heroExit * 0.12}`;
    }
    gradient?.draw(reduced ? 8 : 8 + t, eased, intro, heroExit, reduced ? 0 : eased.in);

    if (heroVisible && !reduced) requestAnimationFrame(tick);
    else running = false;
  }

  const start = () => {
    root.classList.add("is-ready");
    started = true;
    loop();
  };
  // wait for the lettering (and the mono face, so nothing reflows mid-reveal), but never long
  Promise.race([
    Promise.all([inlined, document.fonts?.ready]),
    new Promise((r) => setTimeout(r, 1200)),
  ]).then(() => requestAnimationFrame(start));

  /* ---------- designer: the frames keep hunting their subject ---------- */

  const tracks = $$(".track");
  const designer = $(".designer");
  let hunting = null;
  if (!reduced) {
    new IntersectionObserver(([e]) => {
      clearInterval(hunting);
      if (!e.isIntersecting) return;
      hunting = setInterval(() => {
        tracks.forEach((el, i) => {
          const s = i ? 4 : 7;
          el.style.setProperty("--tx", ((Math.random() * 2 - 1) * s).toFixed(1));
          el.style.setProperty("--ty", ((Math.random() * 2 - 1) * s).toFixed(1));
        });
      }, 1400);
    }).observe(designer);
  }

  /* ---------- posters lean toward the pointer ---------- */

  if (!reduced) {
    $$(".poster").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        el.style.setProperty("--ry", `${(x * 7).toFixed(2)}deg`);
        el.style.setProperty("--rx", `${(-y * 7).toFixed(2)}deg`);
      });
      el.addEventListener("pointerleave", () => { el.style.setProperty("--rx", "0deg"); el.style.setProperty("--ry", "0deg"); });
    });
  }

  /* ---------- media load when near, play only while seen ---------- */

  // the film talks to Vimeo's player over postMessage; it starts muted, the button
  // turns the sound on and off, and it goes quiet again whenever it leaves the screen
  const film = $(".drift-video"), sound = $(".drift-sound");
  const player = (method, value) =>
    film.contentWindow?.postMessage(JSON.stringify(value === undefined ? { method } : { method, value }), "https://player.vimeo.com");
  const setSound = (on) => {
    player("setVolume", on ? 1 : 0);
    player("setMuted", !on);
    sound.setAttribute("aria-pressed", String(on));
    sound.textContent = on ? "mute;" : "unmute;";
  };
  sound.addEventListener("click", () => setSound(sound.getAttribute("aria-pressed") !== "true"));
  // the film closes on a grey end card from ~62s: loop back to the start just before it
  const FILM_END = 61.8; // progress arrives every ~0.25s, so this lands before 62
  let rewinding = false;
  addEventListener("message", (e) => {
    if (e.origin !== "https://player.vimeo.com" || e.source !== film.contentWindow) return;
    let msg;
    try { msg = typeof e.data === "string" ? JSON.parse(e.data) : e.data; } catch (_) { return; }
    if (msg.event === "ready") player("addEventListener", "timeupdate");
    // over the raw message protocol Vimeo reports time as playProgress
    if ((msg.event === "playProgress" || msg.event === "timeupdate") && msg.data?.seconds >= FILM_END && !rewinding) {
      rewinding = true;
      player("setCurrentTime", 0);
      setTimeout(() => { rewinding = false; }, 1500);
    }
  });
  new IntersectionObserver(([e], io) => {
    if (!e.isIntersecting) return;
    film.addEventListener("load", () => {
      player("addEventListener", "timeupdate");
      setTimeout(() => { film.classList.add("is-on"); sound.hidden = false; }, 900);
    }, { once: true });
    film.src = film.dataset.src;
    io.disconnect();
  }, { rootMargin: "400px 0px" }).observe(film);
  new IntersectionObserver(([e]) => {
    if (!e.isIntersecting && sound.getAttribute("aria-pressed") === "true") setSound(false);
  }).observe(film);

  $$("video.poster").forEach((v) => {
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        if (!v.src) { v.src = v.dataset.src; v.load(); }
        v.play().catch(() => {});
      } else v.pause();
    }, { rootMargin: "200px 0px" }).observe(v);
  });

  /* ---------- swatches copy their hex ---------- */

  $$(".swatch").forEach((el) => {
    const hex = $(".hex", el);
    let t;
    el.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(el.dataset.hex); } catch (_) { return; }
      hex.textContent = "COPIED;";
      clearTimeout(t);
      t = setTimeout(() => { hex.textContent = el.dataset.hex; }, 1200);
    });
  });
})();
