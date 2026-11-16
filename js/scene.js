// 3D scene: 74 cubes with spring physics. They take a new shape per section, draw a pictogram per project,
// move away from the pointer, scatter on click and press like keys when you type. Nothing pins the scroll.
import * as THREE from 'three';
import { RoundedBoxGeometry } from '../vendor/RoundedBoxGeometry.js';
import { RoomEnvironment } from '../vendor/RoomEnvironment.js';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, innerWidth < 860 ? 1.5 : 1.75));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 200);
camera.position.set(0, 1.2, 34);
const key = new THREE.DirectionalLight(0xffffff, 1.6);
key.position.set(-8, 14, 10); key.castShadow = true;
key.shadow.mapSize.set(1024, 1024); key.shadow.camera.left = -16; key.shadow.camera.right = 16;
key.shadow.camera.top = 16; key.shadow.camera.bottom = -16; key.shadow.radius = 6; key.shadow.bias = -0.0005;
scene.add(key, new THREE.HemisphereLight(0xffffff, 0xd8d4cc, 0.6));
const floor = new THREE.Mesh(new THREE.PlaneGeometry(90, 90), new THREE.ShadowMaterial({ opacity: 0.13 }));
floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
const group = new THREE.Group(); scene.add(group);

/* ---------- formations: each is N slots {p, s, c}; c is '#' dark, 'o' white, 'a' section accent ---------- */
const N = 74, GAP = 1.05;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const ONE = V(1, 1, 1), ZERO = V(0.001, 0.001, 0.001);
function bitmap(rows, depth = 1) {
  const out = [], h = rows.length, w = Math.max(...rows.map(r => r.length));
  rows.forEach((row, r) => [...row].forEach((ch, c) => {
    if (ch === '.' || ch === ' ') return;
    for (let d = 0; d < depth; d++) out.push({ p: V((c - (w - 1) / 2) * GAP, ((h - 1) / 2 - r) * GAP, (d - (depth - 1) / 2) * GAP), s: ONE, c: ch });
  }));
  return out;
}
function stairs() {
  const out = [];
  for (let step = 0; step < 4; step++) for (let x = 0; x < 2; x++) for (let z = 0; z < 4; z++) for (let y = 0; y <= step; y++)
    out.push({ p: V((step * 2 + x - 3.5) * 1.04, (y - 1.8) * 1.04, (z - 1.5) * 1.04), s: ONE, c: y === step ? 'a' : 'o' });
  return out.sort((a, b) => b.p.y - a.p.y).slice(-N);
}
function keyboard() {
  const out = [];
  [15, 15, 15, 15, 14].forEach((n, r) => { for (let i = 0; i < n; i++) {
    const x = (i - (n - 1) / 2) * 1.05, z = (r - 2) * 1.08;
    const edge = Math.abs(x) > 6.2 || (r === 4 && Math.abs(x) > 1.5);
    out.push({ p: V(x, -1.6, z), s: V(0.92, 0.42, 0.92), c: edge ? '#' : ((r * 7 + i * 3) % 23 === 0 ? 'a' : 'o') });
  } });
  return out;
}
function towers() {
  const out = [], pat = ['o', '#', 'o', 'a', 'o', '#', 'o', '#', 'o'];
  for (let gx = 0; gx < 3; gx++) for (let gz = 0; gz < 3; gz++) for (let x = 0; x < 2; x++) for (let z = 0; z < 2; z++) for (let y = 0; y < 2; y++)
    out.push({ p: V((gx - 1) * 3.4 + (x - 0.5) * 1.03, (y - 1.2) * 1.03, (gz - 1) * 3.4 + (z - 0.5) * 1.03), s: ONE, c: pat[gx * 3 + gz] });
  return out;
}
const fit = f => {
  f = f.slice(0, N); while (f.length < N) f.push({ p: V(0, 0, 0), s: ZERO, c: 'o' });
  return f.sort((m, n) => (m.p.x - n.p.x) || (m.p.y - n.p.y));
};
const JPY = ['..###.####..#...#', '...#..#...#.#...#', '...#..#...#..#.#.', '...#..####....#..', '#..#..#.......#..', '#..#..#.......#..', '.##...#.......#..'];
const ME = ['..#####..', '.#######.', '.#ooooo#.', '.o#ooo#o.', '.ooooooo.', '..o###o..', '...ooo...', '.ggggggg.', 'ggggggggg'];
const MAIL = ['ooooooooo', 'oa.....ao', 'o.a...a.o', 'o..a.a..o', 'o...a...o', 'o.......o', 'ooooooooo'];
const F = [bitmap(JPY, 2), bitmap(ME, 1), stairs(), keyboard(), towers(), bitmap(MAIL, 2)].map(fit);
// one pictogram per project, in the order of the list
const ICONS = [
  ['..###....', '.#...#...', '.#...#...', '..###....', '...#.....', '...#.....', '...#aa...', '...#.....', '...#aa...'],              // key
  ['......aa.', '......aa.', '...##.aa.', '...##.aa.', 'oo.##.aa.', 'oo.##.aa.', '#########'],                                       // bars
  ['...###...', '.#.###.#.', '.#######.', '###...###', '###.a.###', '###...###', '.#######.', '.#.###.#.', '...###...'],              // gear
  ['.#######.', '#.......#', '#.a.a.a.#', '#.......#', '.#######.', '..##.....', '.#.......'],                                       // chat
  ['......##.', '...####..', '..######.', '.##.#.##.', '#aa#.#aa#', '#aa#.#aa#', '.##...##.'],                                       // motorcycle
  ['..####...', '.#....#..', '......#..', '.....#...', '....#....', '....#....', '.........', '....a....'],                          // question mark
  ['......aa.', '......aa.', '.........', '#########', '#.#.#.#.#', '#########', '#.......#', '#.......#'],                          // net and ball
  ['..##.##..', '..##.##..', '##.....##', '##.aaa.##', '..aaaaa..', '.aaaaaaa.', '.aaaaaaa.', '..aa.aa..'],                          // paw
  ['..#...#..', '..#...#..', '..#####..', '...###...', '..aaaaa..', '.aaaaaaa.', '.aaaaaaa.', 'aaaaaaaaa'],                          // dress
  ['...aaa...', '..aaaaa..', '..aaaaa..', '...aaa...', '.........', '#..##..##', '.##..##..', '#..##..##', '.##..##..'],              // sun and sea
  ['..#####..', '..#...#..', '#########', '#.......#', '#.aaaaa.#', '#.......#', '#.aaaaa.#', '#.......#', '#########']               // order form
].map(b => fit(bitmap(b, 1)));
const POSE = [
  { rx: 0.1, ry: -0.34, s: 0.66, x: 7.0, y: 0.4 },
  { rx: 0.06, ry: -0.38, s: 1.0, x: 7.6, y: 0.4 },
  { rx: 0.3, ry: -0.5, s: 0.74, x: 0, y: 5.4 },
  { rx: 0.62, ry: -0.42, s: 0.84, x: 0.6, y: 4.0, fy: -2.6 },
  { rx: 0.5, ry: 0.62, s: 0.9, x: -8.2, y: 0 },
  { rx: 0.08, ry: -0.4, s: 0.95, x: 7.0, y: 0.4 }
];
const ICON_POSE = { rx: 0.08, ry: 0.36, s: 0.95, x: -8.0, y: 0.6 };
const ACC = ['#8BE87A', '#48C25A', '#FF9A3D', '#8F86FF', '#35C4E6', '#FFE600'].map(c => new THREE.Color(c));
const WHITE = new THREE.Color('#F6F5F1'), BLACK = new THREE.Color('#161616');

/* ---------- instances + physics state ---------- */
const mesh = new THREE.InstancedMesh(new RoundedBoxGeometry(1, 1, 1, 4, 0.17), new THREE.MeshStandardMaterial({ roughness: 0.62 }), N);
mesh.castShadow = true; mesh.receiveShadow = true; mesh.frustumCulled = false; group.add(mesh);

// Separate layer placed just in front of the "Quem sou" face.
const glassesLayer = new THREE.Group();
const glassesFrameMaterial = new THREE.MeshStandardMaterial({ color: 0x161616, roughness: 0.42, transparent: true, opacity: 0 });
const glassesLensMaterial = new THREE.MeshStandardMaterial({ color: 0x8fb4c2, roughness: 0.2, transparent: true, opacity: 0, depthWrite: false });
const glassesGeometry = new RoundedBoxGeometry(1, 1, 1, 4, 0.17);
const glassesPart = (x, y, w, h, d, material) => {
  const part = new THREE.Mesh(glassesGeometry, material);
  part.position.set(x, y, material === glassesLensMaterial ? 0.61 : 0.72);
  part.scale.set(w, h, d);
  part.castShadow = material === glassesFrameMaterial;
  glassesLayer.add(part);
};
glassesPart(-2.1, 1.05, 2.1, 1.25, 0.08, glassesLensMaterial);
glassesPart( 2.1, 1.05, 2.1, 1.25, 0.08, glassesLensMaterial);
[
  [-2.1, 1.75, 2.35, 0.18], [-2.1, 0.35, 2.35, 0.18],
  [ 2.1, 1.75, 2.35, 0.18], [ 2.1, 0.35, 2.35, 0.18],
  [-3.25, 1.05, 0.18, 1.58], [-0.95, 1.05, 0.18, 1.58],
  [ 0.95, 1.05, 0.18, 1.58], [ 3.25, 1.05, 0.18, 1.58],
  [ 0, 1.12, 1.9, 0.16],
  [-3.72, 1.55, 0.95, 0.16], [3.72, 1.55, 0.95, 0.16]
].forEach(([x, y, w, h]) => glassesPart(x, y, w, h, 0.18, glassesFrameMaterial));
glassesLayer.visible = false;
group.add(glassesLayer);

const P = new Float32Array(N * 3), Vl = new Float32Array(N * 3), S = new Float32Array(N * 3), C = new Float32Array(N * 3);
for (let i = 0; i < N; i++) { // start above the page and fall into place
  const t = F[0][i];
  P[i * 3] = t.p.x + (Math.random() - 0.5) * 30; P[i * 3 + 1] = t.p.y + 26 + Math.random() * 30; P[i * 3 + 2] = t.p.z + (Math.random() - 0.5) * 20;
  S[i * 3] = S[i * 3 + 1] = S[i * 3 + 2] = 1; C[i * 3] = C[i * 3 + 1] = C[i * 3 + 2] = 0.1;
  mesh.setColorAt(i, BLACK);
}

/* ---------- scroll → formation ---------- */
const sections = [...document.querySelectorAll('[data-form]')];
function measure() {
  const mid = innerHeight * 0.5; let f = 0;
  for (let k = 0; k < sections.length; k++) {
    const r = sections[k].getBoundingClientRect(), a = +sections[k].dataset.form;
    if (r.top <= mid) {
      const next = sections[k + 1];
      if (next) {
        const rn = next.getBoundingClientRect(), b = +next.dataset.form, span = Math.max(1, rn.top - r.top);
        f = a + (b - a) * Math.min(1, Math.max(0, (mid - r.top - span * 0.62) / (span * 0.38)));
      } else f = a;
    }
  }
  return f;
}

/* ---------- input ---------- */
const ndc = new THREE.Vector2(9, 9); let px = 0, py = 0, tx = 0, ty = 0, hover = false;
addEventListener('pointermove', e => {
  tx = e.clientX / innerWidth - 0.5; ty = e.clientY / innerHeight - 0.5;
  hover = e.pointerType === 'mouse'; ndc.set(tx * 2, -ty * 2);
}, { passive: true });
document.addEventListener('pointerleave', () => { hover = false; });
let burst = false;
addEventListener('click', e => { if (!e.target.closest('a,button,input,.p')) burst = true; });
const presses = [];
addEventListener('keydown', e => { if (!e.metaKey && !e.ctrlKey && e.key.length === 1) presses.push(e.key.toLowerCase().charCodeAt(0)); });

let W = 0, H = 0, mobile = false;
function resize() { W = innerWidth; H = innerHeight; mobile = W < 860; renderer.setSize(W, H, false); camera.aspect = W / H; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();

const m4 = new THREE.Matrix4(), inv = new THREE.Matrix4(), q = new THREE.Quaternion(), eul = new THREE.Euler();
const pos = new THREE.Vector3(), scl = new THREE.Vector3(), tp = new THREE.Vector3(), ts = new THREE.Vector3(), cp = new THREE.Vector3();
const tc = new THREE.Color(), acc = new THREE.Color(), col = new THREE.Color(), ray = new THREE.Raycaster();
const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const GREEN = new THREE.Color('#48C25A');
const colorOf = (ch, out) => out.copy(ch === '#' ? BLACK : ch === 'a' ? acc : ch === 'g' ? GREEN : WHITE);
let cur = 0, t0 = performance.now(), first = true, icon = -1, iconMix = 0;
const G = { rx: POSE[0].rx, ry: POSE[0].ry, s: POSE[0].s, x: POSE[0].x, y: POSE[0].y, fy: -6.2 };

function frame(now) {
  const dt = Math.max(0.001, Math.min(0.4, (now - t0) / 1000)); t0 = now; // slow frames take more physics steps, not slower motion
  const snap = reduced || window.__settle;
  cur = clamp(lerp(cur, measure(), snap ? 1 : 1 - Math.pow(0.0018, dt)), 0, F.length - 1);
  px += (tx - px) * (snap ? 1 : 1 - Math.pow(0.02, dt)); py += (ty - py) * (snap ? 1 : 1 - Math.pow(0.02, dt));
  const a = Math.floor(cur), b = Math.min(F.length - 1, a + 1), f = cur - a, et = ease(f);
  acc.copy(ACC[a]).lerp(ACC[b], et);
  const glassesMix = ease(clamp(1 - Math.abs(cur - 1) * 2, 0, 1));
  glassesLayer.visible = glassesMix > 0.001;
  glassesFrameMaterial.opacity = glassesMix;
  glassesLensMaterial.opacity = glassesMix * 0.24;

  // a hovered project draws its own pictogram while the projects section is on screen
  const want = (window.__icon ?? -1); const inProj = Math.abs(cur - 4) < 0.45 && !mobile;
  if (want >= 0 && inProj) icon = want;
  iconMix = lerp(iconMix, want >= 0 && inProj ? 1 : 0, snap ? 1 : 1 - Math.pow(0.0005, dt));
  const I = icon >= 0 ? ICONS[icon] : null;

  // pointer ray in the group's own space
  group.updateMatrixWorld(); inv.copy(group.matrixWorld).invert();
  ray.setFromCamera(ndc, camera); ray.ray.applyMatrix4(inv);
  const typing = Math.abs(cur - 3) < 0.4;
  while (presses.length) { const k = presses.pop(); if (typing) { const i = (k * 37) % N; Vl[i * 3 + 1] -= 11; } }

  const sub = Math.ceil(dt / 0.016), h = dt / sub;
  for (let i = 0; i < N; i++) {
    const A = F[a][i], B = F[b][i], t = ease(clamp(f * 1.45 - (i / N) * 0.45)), j = i * 3;
    tp.lerpVectors(A.p, B.p, t); ts.lerpVectors(A.s, B.s, t);
    colorOf(A.c, tc); tc.lerp(colorOf(B.c, col), t);
    if (a === 3 || b === 3) { // keys press in a slow ripple
      const kw = (a === 3 ? 1 - t : 0) + (b === 3 ? t : 0);
      if (!snap) tp.y -= kw * 0.2 * Math.max(0, Math.sin(now / 420 - tp.x * 0.55 - tp.z * 0.9)) ** 6;
    }
    if (I && iconMix > 0.001) { tp.lerp(I[i].p, iconMix); ts.lerp(I[i].s, iconMix); tc.lerp(colorOf(I[i].c, col), iconMix); }
    if (snap) { P[j] = tp.x; P[j + 1] = tp.y; P[j + 2] = tp.z; Vl[j] = Vl[j + 1] = Vl[j + 2] = 0; }
    else {
      pos.set(P[j], P[j + 1], P[j + 2]);
      if (burst) { cp.copy(pos).normalize(); const k = 16 + Math.random() * 14; Vl[j] += cp.x * k + (Math.random() - 0.5) * 10; Vl[j + 1] += cp.y * k + Math.random() * 12; Vl[j + 2] += cp.z * k + (Math.random() - 0.5) * 16; }
      let fx = 0, fy = 0, fz = 0;
      if (hover) { // cubes step away from the pointer
        ray.ray.closestPointToPoint(pos, cp); const d = pos.distanceTo(cp), R = 2.4;
        if (d < R && d > 0.0001) { const k = (1 - d / R) * 190 / d; fx = (pos.x - cp.x) * k; fy = (pos.y - cp.y) * k; fz = (pos.z - cp.z) * k; }
      }
      for (let n = 0; n < sub; n++) {
        Vl[j] += ((tp.x - P[j]) * 95 - Vl[j] * 12.5 + fx) * h; Vl[j + 1] += ((tp.y - P[j + 1]) * 95 - Vl[j + 1] * 12.5 + fy) * h; Vl[j + 2] += ((tp.z - P[j + 2]) * 95 - Vl[j + 2] * 12.5 + fz) * h;
        P[j] += Vl[j] * h; P[j + 1] += Vl[j + 1] * h; P[j + 2] += Vl[j + 2] * h;
      }
    }
    const kS = snap ? 1 : 1 - Math.pow(0.0008, dt);
    S[j] = lerp(S[j], ts.x, kS); S[j + 1] = lerp(S[j + 1], ts.y, kS); S[j + 2] = lerp(S[j + 2], ts.z, kS);
    C[j] = lerp(C[j], tc.r, kS); C[j + 1] = lerp(C[j + 1], tc.g, kS); C[j + 2] = lerp(C[j + 2], tc.b, kS);
    eul.set(clamp(Vl[j + 1] * 0.06, -1.5, 1.5), clamp(Vl[j] * 0.06, -1.5, 1.5), clamp(Vl[j + 2] * 0.04, -1, 1));
    m4.compose(pos.set(P[j], P[j + 1], P[j + 2]), q.setFromEuler(eul), scl.set(S[j], S[j + 1], S[j + 2]));
    mesh.setMatrixAt(i, m4); mesh.setColorAt(i, col.setRGB(C[j], C[j + 1], C[j + 2]));
  }
  burst = false;
  mesh.instanceMatrix.needsUpdate = true; mesh.instanceColor.needsUpdate = true;

  // group pose: scrubbed by scroll, eased toward the pictogram pose when one is showing
  const A = POSE[a], B = POSE[b], kG = snap ? 1 : 1 - Math.pow(0.0006, dt);
  const goal = k => lerp(lerp(A[k] ?? -6.2, B[k] ?? -6.2, et), ICON_POSE[k] ?? -6.2, iconMix);
  for (const k of ['rx', 'ry', 's', 'x', 'y', 'fy']) G[k] = lerp(G[k], goal(k), kG);
  const idle = snap ? 0 : Math.sin(now / 2600) * 0.06, s = G.s * (mobile ? 0.62 : 1);
  group.rotation.set(G.rx + py * 0.18, G.ry + px * 0.35 + idle, 0);
  group.scale.setScalar(s);
  group.position.set(mobile ? 0 : G.x, mobile ? 4.6 : G.y, 0);
  floor.position.y = group.position.y + G.fy * s;

  renderer.render(scene, camera);
  if (first) { first = false; requestAnimationFrame(() => { window.__sceneReady = true; }); }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
