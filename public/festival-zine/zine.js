/*
 * The daily programme as an eight-page cut zine, opening out on a loop.
 *
 * The sheet is one continuous piece of paper, not hinged cards: every vertex
 * is carried from the flat sheet through the folds, and each fold is a bend
 * with a radius (tight when creased flat, relaxed when opened), so the paper
 * curves, stacks and wraps around itself the way the real thing does. The
 * folds are driven through springs, so the paper overshoots a touch and
 * settles instead of stopping dead.
 *
 * Model space is side A flat, landscape (side-a.jpg): four panels by two rows,
 * x to the right and y down, one panel = 1 wide. side-b.jpg is the poster as
 * seen once the sheet is turned over left-to-right. Making the zine:
 *   A. fold the rows together, the bottom row behind (the poster goes inside)
 *   B. the middle two panels are cut apart along that fold; push the ends in
 *      and the cut opens into a cross, top row out front, bottom row out back
 *   C. collapse the cross into a booklet: the front and back wings swing
 *      over, and the last panel wraps round the spine as the cover (K)
 * The loop: open the cover, glance at the spread, open out to the programme,
 * turn over to the poster, keep turning back to the programme, fold it up.
 */
import {
  WebGLRenderer, Scene, PerspectiveCamera, BufferGeometry, BufferAttribute, Mesh, Group, PlaneGeometry,
  MeshPhongMaterial, ShadowMaterial, TextureLoader, SRGBColorSpace, RepeatWrapping, HemisphereLight,
  DirectionalLight, FrontSide, BackSide, DoubleSide, PCFShadowMap, Quaternion, Vector3, Color,
} from "./three.min.js";

const H = Math.SQRT2;                         // panel height; panels are 1 wide
const NX = 44, NY = 62;                       // grid per panel across, per row down
const T = 0.0026;                             // paper thickness
const R_TIGHT = 0.0034, R_OPEN = 0.13;        // bend radius of a crease, folded / opened
const REST_A = 0.035, REST_B = 0.05;          // opened paper keeps a little of each fold
const FLEX = 0.045, LEAD = 0.05;              // moving panels bow behind; a pulled edge leads

const stage = document.getElementById("stage");
// the canvas is transparent: the page behind it is the backdrop
const renderer = new WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = PCFShadowMap;
renderer.setClearColor(new Color("#000000"), 0);
stage.append(renderer.domElement);

// ---- light: a soft key from the upper left, a warmer one low from the right ----
// (light units are physical: a white page facing the key comes out at about its printed value)
const scene = new Scene();
const camera = new PerspectiveCamera(26, 1, 0.3, 60);
scene.add(new HemisphereLight("#ffffff", "#8a8a8a", 0.4 * Math.PI));
const sun = new DirectionalLight("#ffffff", 0.66 * Math.PI);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -3.4, right: 3.4, top: 3.4, bottom: -3.4, near: 0.5, far: 26 });
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.012;
sun.shadow.radius = 5;
const warm = new DirectionalLight("#ffe3c6", 0.18 * Math.PI);
scene.add(sun, sun.target, warm, warm.target);

// the surface it lies on: only its shadow shows
const table = new Mesh(new PlaneGeometry(40, 40), new ShadowMaterial({ opacity: 0.45 }));
table.receiveShadow = true;
scene.add(table);

// ---- the paper ----
const loader = new TextureLoader();
const art = (src) => { const t = loader.load(src); t.colorSpace = SRGBColorSpace; t.anisotropy = 8; return t; };
const grain = loader.load("paper-234.jpg");
grain.wrapS = grain.wrapT = RepeatWrapping;
grain.repeat.set(2.6, 2.75);
grain.anisotropy = 8;

// The print is ink on paper: the paper's relief comes through (bump), its fibres
// lift the black a touch, the ink has a faint satin sheen at a glancing angle,
// it has cracked white along the creases, and the sheet's corners are worn round.
const printed = (map, side) => {
  const m = new MeshPhongMaterial({ map, side, bumpMap: grain, bumpScale: 1.6, specular: "#ffffff", shininess: 60 });
  m.onBeforeCompile = (sh) => {
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <map_fragment>", `#include <map_fragment>
        vec2 sp = vec2( vMapUv.x * 4.0, vMapUv.y * 2.828427 );
        vec2 q = min( sp, vec2( 4.0, 2.828427 ) - sp );
        if ( q.x < 0.014 && q.y < 0.014 && length( vec2( 0.014 ) - q ) > 0.014 ) discard;
        float fibre = texture2D( bumpMap, vBumpMapUv ).g;
        diffuseColor.rgb = diffuseColor.rgb * mix( 1.0, fibre / 0.86, 0.75 ) + 0.007 * fibre * ( 1.0 - diffuseColor.rgb );
        float dv = min( min( abs( sp.x - 1.0 ), abs( sp.x - 2.0 ) ), abs( sp.x - 3.0 ) );
        float dh = ( sp.x < 1.0 || sp.x > 3.0 ) ? abs( sp.y - 1.414214 ) : 1.0;
        float crack = max(
          ( 1.0 - smoothstep( 0.0005, 0.0024, dv ) ) * smoothstep( 0.86, 0.93, texture2D( bumpMap, vec2( sp.y * 3.1, sp.x * 0.37 ) ).g ),
          ( 1.0 - smoothstep( 0.0005, 0.0024, dh ) ) * smoothstep( 0.86, 0.93, texture2D( bumpMap, vec2( sp.x * 3.1, sp.y * 0.41 ) ).g ) );
        float ink = 1.0 - dot( diffuseColor.rgb, vec3( 0.3333 ) );
        diffuseColor.rgb += crack * ink * 0.32 * vec3( 0.93, 0.91, 0.87 );`)
      .replace("#include <specularmap_fragment>", `#include <specularmap_fragment>
        specularStrength = 0.035 * smoothstep( 0.55, 1.0, ink ) * ( 0.55 + 0.6 * fibre );`);
  };
  return m;
};
const front = printed(art("side-a.jpg"), FrontSide);
front.shadowSide = DoubleSide;
const back = printed(art("side-b.jpg"), BackSide);
const edge = new MeshPhongMaterial({ color: "#d9d4cb", side: DoubleSide, specular: "#000000" });

const sheet = new Group();                    // turns over about its centre for the poster
const body = new Group();
sheet.add(body);
scene.add(sheet);

// each row is its own sheet of mesh: joined along the fold at the end panels and
// cut apart in the middle two; the vertices carry them either way. The printed
// faces sit half a thickness either side of the paper's middle, with an edge
// strip all round showing the paper's core.
const rows = [0, 1].map((r) => {
  const cols = 4 * NX + 1, n = cols * (NY + 1);
  const mid = new BufferGeometry();
  const base = new BufferAttribute(new Float32Array(n * 3), 3);
  const nrm = new BufferAttribute(new Float32Array(n * 3), 3);
  const posA = new BufferAttribute(new Float32Array(n * 3), 3), posB = new BufferAttribute(new Float32Array(n * 3), 3);
  const uvA = new Float32Array(n * 2), uvB = new Float32Array(n * 2);
  const fx = new Float32Array(n), fy = new Float32Array(n);
  for (let j = 0; j <= NY; j++) for (let i = 0; i < cols; i++) {
    const k = j * cols + i, x = i / NX, y = r * H + (j / NY) * H;
    fx[k] = x; fy[k] = y;
    uvA[2 * k] = x / 4; uvB[2 * k] = 1 - x / 4;
    uvA[2 * k + 1] = uvB[2 * k + 1] = 1 - y / (2 * H);
  }
  const idx = [];
  for (let j = 0; j < NY; j++) for (let i = 0; i < cols - 1; i++) {
    const a = j * cols + i, b = a + 1, c = a + cols, d = c + 1;
    idx.push(a, c, b, b, c, d);
  }
  mid.setAttribute("position", base); mid.setAttribute("normal", nrm); mid.setIndex(idx);

  const make = (pos, uv, mat) => {
    const g = new BufferGeometry();
    g.setAttribute("position", pos);
    g.setAttribute("normal", nrm);
    g.setAttribute("uv", new BufferAttribute(uv, 2));
    g.setIndex(idx);
    const mesh = new Mesh(g, mat);
    mesh.frustumCulled = false;
    mesh.receiveShadow = true;
    body.add(mesh);
    return mesh;
  };
  make(posA, uvA, front).castShadow = true;
  make(posB, uvB, back);

  // the edge: walk the row's outline, a strip one thickness wide
  const loop = [];
  for (let i = 0; i < cols; i++) loop.push(i);
  for (let j = 1; j <= NY; j++) loop.push(j * cols + cols - 1);
  for (let i = cols - 2; i >= 0; i--) loop.push(NY * cols + i);
  for (let j = NY - 1; j >= 1; j--) loop.push(j * cols);
  const m = loop.length, ePos = new BufferAttribute(new Float32Array(m * 6), 3), eIdx = [];
  for (let l = 0; l < m; l++) { const a = 2 * l, b = 2 * ((l + 1) % m); eIdx.push(a, a + 1, b + 1, a, b + 1, b); }
  const eg = new BufferGeometry();
  eg.setAttribute("position", ePos); eg.setIndex(eIdx);
  const em = new Mesh(eg, edge);
  em.frustumCulled = false;
  body.add(em);
  return { r, n, fx, fy, mid, base, nrm, posA, posB, loop, ePos, eg };
});

// ---- the folds ----
// a crease relaxes as it opens: tight at 180°, soft and wide when nearly flat
const radius = (turn) => R_TIGHT + (R_OPEN - R_TIGHT) * Math.pow(1 - Math.min(1, Math.abs(turn) / Math.PI), 3);

// fold A, the rows: a profile down the bottom row (distance past the fold → y, z)
const NA = 2400, Ay = new Float32Array(NA + 1), Az = new Float32Array(NA + 1);
function profileA(theta, lag) {
  const R = radius(theta), h = H / NA;
  let y = 0, z = 0;
  for (let k = 1; k <= NA; k++) {
    const d = (k - 0.5) * h, t = d / H;
    const phi = Math.min(d / R, theta) + lag * t * t;      // the free edge trails
    y += Math.cos(phi) * h; z -= Math.sin(phi) * h;
    Ay[k] = y; Az[k] = z;
  }
}

// folds B and C run across the strip, so each row is a path in plan (x, z):
// four panels, each heading its own way, joined by bends
const NS = 4800;
const mkPath = () => ({ X: new Float32Array(NS + 1), Z: new Float32Array(NS + 1), nX: new Float32Array(NS + 1), nZ: new Float32Array(NS + 1) });
const top = mkPath(), bottom = mkPath();
function trace(p, dirs, flex, bow) {
  const turns = [0, dirs[1] - dirs[0], dirs[2] - dirs[1], dirs[3] - dirs[2]];
  const radii = turns.map(radius);
  const h = 4 / NS;
  const heading = (s) => {
    const k = Math.min(3, Math.floor(s)), u = s - k;
    let phi = dirs[0];
    if (k > 0) phi = dirs[k - 1] + Math.sign(turns[k]) * Math.min(Math.abs(turns[k]), u / radii[k]);
    // bowing: the cover's free edge leads, the middle panels belly out behind
    phi += k === 3 ? flex[3] * u * u : k > 0 ? flex[k] * Math.sin(Math.PI * u) : 0;
    return phi + bow * (s - 2) / 2;
  };
  let x = 0, z = 0;
  for (let i = 0; i <= NS; i++) {
    const phi = heading(Math.min(4 - 1e-9, i * h));
    p.nX[i] = -Math.sin(phi); p.nZ[i] = Math.cos(phi);
    p.X[i] = x; p.Z[i] = z;
    const m = heading(Math.min(4 - 1e-9, (i + 0.5) * h));
    x += Math.cos(m) * h; z += Math.sin(m) * h;
  }
}

// no two creases were folded alike: each keeps its own bit of the fold once
// opened, and wanders a little along its length
const quirk = [0, 0.022, -0.017, 0.03];
const wander = (y, j) => Math.sin(y * 2.3 + j * 1.7) * 0.6 + Math.sin(y * 5.9 + j * 4.1) * 0.4;

// ---- the motion ----
// k: cover closed, c: wings collapsed, b: cut pushed into a cross, a: rows folded;
// all 1 = the closed booklet. flip runs 0 → 1 (poster) → 2 (programme again).
const spring = (x, w, z) => ({ x, v: 0, w, z });
const sp = { k: spring(1, 9, 0.5), c: spring(1, 8.5, 0.52), b: spring(1, 8.5, 0.55), a: spring(1, 9.5, 0.42), flip: spring(0, 6.4, 0.72) };

const ease = (t) => t * t * (3 - 2 * t);
const sine = (t) => 0.5 - 0.5 * Math.cos(Math.PI * t);
const clamp = (x, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, x));
const lerp = (x, y, t) => x + (y - x) * t;
const lookup = (arr, f) => { f = Math.max(0, f); const i = Math.floor(f), t = f - i; return arr[i] + (arr[Math.min(i + 1, arr.length - 1)] - arr[i]) * t; };

const shown = {};                              // what the paper is actually doing
function shape() {
  const k = sp.k.x, c = sp.c.x, b = sp.b.x, a = sp.a.x, open = 1 - b;
  const theta = Math.PI * lerp(REST_A, 1, a);
  const al = (Math.PI / 2) * lerp(REST_B, 1, b), ps = (Math.PI / 2) * c;
  profileA(theta, -FLEX * Math.PI * sp.a.v * 1.4);

  const wB = -FLEX * (Math.PI / 2) * sp.b.v, wC = -FLEX * (Math.PI / 2) * sp.c.v;
  const lead = LEAD * Math.PI * sp.k.v;
  const turnover = sp.flip.v * (Math.floor(sp.flip.x) % 2 ? -1 : 1);
  const bow = -FLEX * Math.PI * turnover * 0.8;
  const q = quirk.map((v) => v * open);
  trace(top, [0, al + ps + q[1], -al + ps - q[2], Math.PI * k + q[3]], [0, 0.6 * (wB + wC), 0.6 * (-wB + wC), lead], bow);
  trace(bottom, [0, -al - ps - q[1], al - ps + q[2], Math.PI * k], [0, 0.6 * (-wB - wC), 0.6 * (wB - wC), lead], bow);

  // the back wing meets the cover round the spine: close the gap at that join
  const j = Math.round((3 * NS) / 4), from = Math.round((2.86 * NS) / 4);
  const gx = top.X[j] - bottom.X[j], gz = top.Z[j] - bottom.Z[j];
  for (let i = from; i <= j; i++) { const t = ease((i - from) / (j - from)); bottom.X[i] += gx * t; bottom.Z[i] += gz * t; }

  const box = { x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity, z0: Infinity, z1: -Infinity };
  const rip = 0.0045 * open;
  for (const row of rows) {
    const P = row.base.array;
    for (let i = 0; i < row.n; i++) {
      const x = row.fx[i], y = row.fy[i];
      let ya = y, za = 0;
      if (row.r === 1) { const f = ((y - H) / H) * NA; ya = H + lookup(Ay, f); za = lookup(Az, f); }
      // a crease that has been opened doesn't lie quite straight
      if (rip) {
        const jx = Math.round(x), dx = x - jx;
        if (jx > 0 && jx < 4 && Math.abs(dx) < 0.12) za += rip * Math.exp(-(dx * dx) / 0.0018) * wander(y, jx);
        const dy = y - H;
        if ((x < 1 || x > 3) && Math.abs(dy) < 0.12) za += rip * Math.exp(-(dy * dy) / 0.0018) * wander(x * 1.3, 5);
      }
      const path = row.r === 1 && x > 1 && x < 3 ? bottom : top;
      const f = (x / 4) * NS;
      const px = lookup(path.X, f) + lookup(path.nX, f) * za;
      const pz = lookup(path.Z, f) + lookup(path.nZ, f) * za;
      P[3 * i] = px; P[3 * i + 1] = -ya; P[3 * i + 2] = pz;
      if (px < box.x0) box.x0 = px; if (px > box.x1) box.x1 = px;
      if (-ya < box.y0) box.y0 = -ya; if (-ya > box.y1) box.y1 = -ya;
      if (pz < box.z0) box.z0 = pz; if (pz > box.z1) box.z1 = pz;
    }
    row.mid.computeVertexNormals();
    // the two printed faces, half a thickness out from the middle
    const N = row.nrm.array, A = row.posA.array, B = row.posB.array, h = T / 2;
    for (let i = 0; i < P.length; i++) { A[i] = P[i] + N[i] * h; B[i] = P[i] - N[i] * h; }
    const E = row.ePos.array;
    for (let l = 0; l < row.loop.length; l++) {
      const v = 3 * row.loop[l];
      for (let d = 0; d < 3; d++) { E[6 * l + d] = A[v + d]; E[6 * l + 3 + d] = B[v + d]; }
    }
    row.posA.needsUpdate = row.posB.needsUpdate = row.ePos.needsUpdate = true;
    row.eg.computeVertexNormals();
  }
  return box;
}

// ---- camera: follows the paper loosely, leans in while it is three-dimensional ----
const look = { x: 1.5, y: -0.7, z: 0, d: 6 }, aim = { ...look };
const qa = new Quaternion(), qb = new Quaternion(), Y = new Vector3(0, 1, 0), Z = new Vector3(0, 0, 1);
let ground = 0;

function frame(box, dt, sec, time) {
  // turning over: lift it off the table, over, and stand it up as the poster;
  // the second half turns on round, back to the programme
  const fl = sp.flip.x, up = Math.min(fl, 2 - fl), lift = 2.2 * Math.sin(Math.PI * clamp(fl - Math.floor(fl)));
  sheet.position.set(2, -H, fl > 0.002 && fl < 1.998 ? lift : 0); body.position.set(-2, H, 0);
  qa.setFromAxisAngle(Z, (-Math.PI / 2) * up); qb.setFromAxisAngle(Y, Math.PI * fl);
  sheet.quaternion.copy(qa.multiply(qb));

  const f = clamp(up), w = box.x1 - box.x0, h = box.y1 - box.y0;
  aim.x = lerp((box.x0 + box.x1) / 2, 2, f);
  aim.y = lerp((box.y0 + box.y1) / 2, -H, f);
  aim.z = ((box.z0 + box.z1) / 2) * (1 - f) + sheet.position.z * 0.5;
  const fw = lerp(w, h, f), fh = lerp(h, w, f), t = Math.tan((camera.fov * Math.PI) / 360);
  aim.d = Math.max(fh / (2 * t), fw / (2 * t * camera.aspect)) * 1.28 + (box.z1 - box.z0) * 0.5;

  const kk = dt ? 1 - Math.exp(-dt * 3.2) : 1;
  for (const key in look) look[key] = lerp(look[key], aim[key], kk);

  // lean in while it stands up off the page, less while we read the first spread;
  // the closed booklet is seen straight on, and the lean only comes in after (see tracks.lean)
  const lean = target("lean", time);
  const depth = lean * ease(Math.min(1, sp.b.x * 1.2)) * (1 - 0.45 * (1 - clamp(sp.k.x)) * clamp(sp.c.x));
  const el = 0.24 * depth + 0.018 * lean * Math.sin(sec * 0.5);
  const az = -0.38 * depth + 0.028 * lean * Math.sin(sec * 0.33 + 1);
  camera.position.set(
    look.x + look.d * Math.sin(az) * Math.cos(el),
    look.y + look.d * Math.sin(el),
    look.z + look.d * Math.cos(az) * Math.cos(el),
  );
  camera.lookAt(look.x, look.y, look.z);
  sun.position.set(look.x - 2.6, look.y + 3.6, look.z + 5.2);
  sun.target.position.set(look.x, look.y, look.z);
  warm.position.set(look.x + 4, look.y - 0.8, look.z + 2.2);
  warm.target.position.set(look.x, look.y, look.z);

  // the table stays just under the paper (it doesn't follow it up when lifted)
  const want = box.z0 - 0.02;
  ground = dt ? lerp(ground, want, 1 - Math.exp(-dt * 6)) : want;
  table.position.set(look.x, look.y, Math.min(ground, want));
}

function resize() {
  const w = stage.clientWidth, h = stage.clientHeight;
  renderer.setSize(w, h);
  camera.aspect = w / h; camera.updateProjectionMatrix();
}
addEventListener("resize", resize);
resize();

// ---- the loop ----
// [start, end, from, to] in seconds; between moves a value holds
const tracks = {
  k: [[1.2, 2.5, 1, 0], [19.3, 20.4, 0, 1]],              // open the cover … close it last
  c: [[3.4, 4.9, 1, 0], [18.1, 19.4, 0, 1]],              // (a glance at the spread first)
  b: [[4.5, 6.1, 1, 0], [16.9, 18.4, 0, 1]],
  a: [[5.7, 7.1, 1, 0], [16.1, 17.2, 0, 1]],
  flip: [[8.7, 10.8, 0, 1], [13.6, 15.6, 1, 2]],          // to the poster, then on round
  lean: [[0.3, 1.5, 0, 1], [19.0, 20.7, 1, 0]],           // folded up, it settles face on before leaning in again
};
const LOOP = 21.6;
function target(key, t) {
  let v = tracks[key][0][2];
  for (const [p, q, from, to] of tracks[key]) {
    if (t >= q) v = to;
    else if (t > p) return lerp(from, to, sine((t - p) / (q - p)));
  }
  return v;
}

function step(dt, t) {
  // small steps keep the springs steady whatever the frame rate
  const n = Math.max(1, Math.ceil(dt / (1 / 240))), h = dt / n;
  for (const key in sp) {
    const s = sp[key], goal = target(key, t);
    if (key === "flip" && goal < s.x - 1) s.x -= 2;        // round once: 2 is 0 again
    for (let i = 0; i < n; i++) {
      s.v += (s.w * s.w * (goal - s.x) - 2 * s.z * s.w * s.v) * h;
      s.x += s.v * h;
      if (key !== "flip" && s.x > 1) { s.x = 1; s.v = Math.min(0, s.v); }  // paper can't fold through itself
    }
  }
}

// ?t= holds one moment of the loop (seconds), for stills; reduced motion holds the open programme
const hold = parseFloat(new URLSearchParams(location.search).get("t"));
const still = !Number.isNaN(hold) || matchMedia("(prefers-reduced-motion: reduce)").matches;
let clock = 0, last = 0, seen = true, started = false;
// only run while the tile is on screen
new IntersectionObserver(([e]) => { seen = e.isIntersecting; }).observe(stage);

function tick(now) {
  requestAnimationFrame(tick);
  const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
  last = now;
  if (started && (still || !seen || document.hidden)) return;
  const t = Number.isNaN(hold) ? 8 : hold;
  if (still) {
    for (const key in sp) { sp[key].x = target(key, t); sp[key].v = 0; }
  } else {
    clock = (clock + dt) % LOOP;
    step(dt, clock);
  }
  frame(shape(), dt, now / 1000, still ? t : clock);
  renderer.render(scene, camera);
  if (!started) { started = true; stage.classList.add("live"); }
}
// start once the art is in, so the first frame is the finished cover
loader.manager.onLoad = () => requestAnimationFrame(tick);
