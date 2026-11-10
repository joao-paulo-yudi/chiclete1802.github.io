// 3D scene: one set of cubes that changes shape as you move through the page (no pinning).
import * as THREE from 'three';
import { RoundedBoxGeometry } from '../vendor/RoundedBoxGeometry.js';
import { RoomEnvironment } from '../vendor/RoomEnvironment.js';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 200);
camera.position.set(0, 1.2, 34);

const key = new THREE.DirectionalLight(0xffffff, 1.6);
key.position.set(-8, 14, 10); key.castShadow = true;
key.shadow.mapSize.set(1024, 1024); key.shadow.camera.left = -14; key.shadow.camera.right = 14;
key.shadow.camera.top = 14; key.shadow.camera.bottom = -14; key.shadow.radius = 6; key.shadow.bias = -0.0005;
scene.add(key);
scene.add(new THREE.HemisphereLight(0xffffff, 0xd8d4cc, 0.6));

const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.ShadowMaterial({ opacity: 0.13 }));
floor.rotation.x = -Math.PI / 2; floor.position.y = -6.2; floor.receiveShadow = true;
scene.add(floor);

const group = new THREE.Group(); scene.add(group);

/* ---------- formations (each returns N slots: position + scale) ---------- */
const N = 74;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
function letters() {
  const G = {
    J: ['..###', '...#.', '...#.', '...#.', '#..#.', '#..#.', '.##..'],
    P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
    Y: ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..']
  };
  const out = []; const word = 'JPY'; const gap = 1.05;
  for (let w = 0; w < 3; w++) {
    const rows = G[word[w]];
    for (let r = 0; r < 7; r++) for (let c = 0; c < 5; c++) if (rows[r][c] === '#')
      for (let d = 0; d < 2; d++) out.push({ p: V((w * 6 + c - 8) * gap, (3 - r) * gap, (d - 0.5) * gap), s: V(1, 1, 1) });
  }
  return out;
}
function stairs() {
  const out = [];
  for (let step = 0; step < 4; step++) for (let x = 0; x < 2; x++) for (let z = 0; z < 4; z++) for (let y = 0; y <= step; y++)
    out.push({ p: V((step * 2 + x - 3.5) * 1.04, (y - 1.8) * 1.04, (z - 1.5) * 1.04), s: V(1, 1, 1) });
  out.sort((a, b) => b.p.y - a.p.y); // drop from the top if too many
  return out.slice(out.length - N).sort((a, b) => a.p.x - b.p.x);
}
function keyboard() {
  const rows = [15, 15, 15, 15, 14]; const out = [];
  rows.forEach((n, r) => { for (let i = 0; i < n; i++) {
    const wide = r === 4 && i === 6; // space bar
    out.push({ p: V((i - (n - 1) / 2) * 1.05 + (r === 4 && i > 6 ? 0 : 0), -1.6, (r - 2) * 1.08), s: V(wide ? 0.95 : 0.92, 0.42, 0.92), key: true });
  } });
  return out;
}
function towers() {
  const out = [];
  for (let gx = 0; gx < 3; gx++) for (let gz = 0; gz < 3; gz++) for (let x = 0; x < 2; x++) for (let z = 0; z < 2; z++) for (let y = 0; y < 2; y++)
    out.push({ p: V((gx - 1) * 3.4 + (x - 0.5) * 1.03, (y - 1.2) * 1.03, (gz - 1) * 3.4 + (z - 0.5) * 1.03), s: V(1, 1, 1) });
  while (out.length < N) out.push({ p: V(0, -1.2, 0), s: V(0.001, 0.001, 0.001) });
  return out;
}
function block() {
  const out = [];
  for (let x = 0; x < 4; x++) for (let y = 0; y < 4; y++) for (let z = 0; z < 4; z++)
    out.push({ p: V((x - 1.5) * 1.02, (y - 1.5) * 1.02, (z - 1.5) * 1.02), s: V(1, 1, 1) });
  while (out.length < N) out.push({ p: V(0, 0, 0), s: V(0.001, 0.001, 0.001) });
  return out;
}
const sortX = a => a.sort((m, n) => (m.p.x - n.p.x) || (m.p.y - n.p.y));
const F = [letters(), stairs(), stairs(), keyboard(), towers(), block()].map(f => sortX(f.slice(0, N)));
const C_W = '#F6F5F1', C_B = '#141414', C_M = '#C9F5BE';
const hash = i => Math.abs((Math.sin(i * 12.9898) * 43758.5453) % 1);
// one colour per slot in each formation
F[0].forEach((s, i) => s.c = s.p.z > 0 ? C_B : '#2A2A2A');
F[1].forEach((s, i) => { const top = !F[1].some(o => Math.abs(o.p.x - s.p.x) < .1 && Math.abs(o.p.z - s.p.z) < .1 && o.p.y > s.p.y + .5); s.c = top ? C_M : C_W; });
F[2].forEach((s, i) => s.c = F[1][i].c);
F[3].forEach((s, i) => s.c = (Math.abs(s.p.x) > 6.2 || (s.p.z > 1.5 && Math.abs(s.p.x) > 1.5)) ? C_B : (hash(i) < .06 ? C_M : C_W));
F[4].forEach((s, i) => { const gx = Math.round(s.p.x / 3.4), gz = Math.round(s.p.z / 3.4); const k = (gx + 1) * 3 + (gz + 1); s.c = [C_W, C_B, C_W, C_M, C_W, C_B, C_W, C_B, C_W][k] || C_W; });
F[5].forEach((s, i) => s.c = hash(i + 7) < .18 ? C_B : (hash(i + 3) < .08 ? C_M : C_W));
F.forEach(f => f.forEach(s => s.col = new THREE.Color(s.c)));
// group pose per formation: rotation and scale
const POSE = [
  { rx: 0.1, ry: -0.34, s: 0.66, x: 7.0, y: 0.4 },
  { rx: 0.28, ry: 0.32, s: 1.1, x: 7.4, y: 0.2 },
  { rx: 0.3, ry: -0.5, s: 0.74, x: 0, y: 5.4 },
  { rx: 0.62, ry: -0.42, s: 0.84, x: 0.6, y: 4.0, fy: -2.6 },
  { rx: 0.5, ry: 0.62, s: 0.9, x: -8.2, y: 0 },
  { rx: 0.5, ry: 0.78, s: 1.4, x: 7.4, y: 0.3 }
];

/* ---------- instances ---------- */
const geo = new RoundedBoxGeometry(1, 1, 1, 4, 0.17);
const mat = new THREE.MeshStandardMaterial({ roughness: 0.62, metalness: 0.0 });
const mesh = new THREE.InstancedMesh(geo, mat, N);
mesh.castShadow = true; mesh.receiveShadow = true;
const WHITE = new THREE.Color('#F6F5F1'), BLACK = new THREE.Color('#141414'), MINT = new THREE.Color('#C9F5BE');
for (let i = 0; i < N; i++) mesh.setColorAt(i, F[0][i].col);
const tmpC = new THREE.Color();
group.add(mesh);

/* ---------- scroll → formation ---------- */
const sections = [...document.querySelectorAll('[data-form]')];
let target = 0, cur = 0;
function measure() {
  const mid = innerHeight * 0.5; let f = 0;
  for (let k = 0; k < sections.length; k++) {
    const r = sections[k].getBoundingClientRect();
    const a = +sections[k].dataset.form;
    if (r.top <= mid) {
      const next = sections[k + 1];
      if (next) {
        const rn = next.getBoundingClientRect(); const b = +next.dataset.form;
        const span = Math.max(1, rn.top - r.top); const t = Math.min(1, Math.max(0, (mid - r.top - span * 0.62) / (span * 0.38)));
        f = a + (b - a) * t;
      } else f = a;
    }
  }
  return f;
}

/* ---------- pointer ---------- */
let px = 0, py = 0, tx = 0, ty = 0;
addEventListener('pointermove', e => { tx = (e.clientX / innerWidth - 0.5); ty = (e.clientY / innerHeight - 0.5); }, { passive: true });

/* ---------- layout ---------- */
let W = 0, H = 0, mobile = false;
function resize() {
  W = innerWidth; H = innerHeight; mobile = W < 860;
  renderer.setSize(W, H, false); camera.aspect = W / H; camera.updateProjectionMatrix();
}
addEventListener('resize', resize); resize();

const eul = new THREE.Euler(); const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), pos = new THREE.Vector3(), scl = new THREE.Vector3();
const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
let t0 = performance.now(), first = true;

function frame(now) {
  const dt = Math.max(0, Math.min(0.25, (now - t0) / 1000)); t0 = now;
  target = measure();
  const k = reduced || window.__settle ? 1 : 1 - Math.pow(0.0018, dt);
  cur += (target - cur) * k; cur = clamp(cur, 0, F.length - 1);
  px += (tx - px) * (reduced ? 1 : 1 - Math.pow(0.02, dt)); py += (ty - py) * (reduced ? 1 : 1 - Math.pow(0.02, dt));

  const a = Math.floor(cur), b = Math.min(F.length - 1, a + 1), f = cur - a;
  for (let i = 0; i < N; i++) {
    const stagger = (i / N) * 0.45; const t = ease(clamp(f * 1.45 - stagger));
    const A = F[a][i], B = F[b][i];
    pos.lerpVectors(A.p, B.p, t);
    // a small lift in the middle of the move so cubes do not cut through each other
    pos.y += Math.sin(Math.PI * t) * 1.4 * (a !== b ? 1 : 0);
    // keys press in a slow ripple while the keyboard is on screen
    const kw = (a === 3 ? 1 - t : 0) + (b === 3 ? t : 0);
    if (kw > 0 && !reduced) pos.y -= kw * 0.2 * Math.max(0, Math.sin(now / 420 - pos.x * 0.55 - pos.z * 0.9)) ** 6;
    scl.lerpVectors(A.s, B.s, t);
    const spin = Math.sin(Math.PI * t) * 1.2 * (i % 2 ? 1 : -1);
    q.setFromEuler(eul.set(spin * 0.5, spin, 0));
    m4.compose(pos, q, scl); mesh.setMatrixAt(i, m4);
    tmpC.copy(A.col).lerp(B.col, t); mesh.setColorAt(i, tmpC);
  }
  mesh.instanceMatrix.needsUpdate = true; mesh.instanceColor.needsUpdate = true;

  const P = POSE[a], Q = POSE[b], et = ease(f);
  const idle = reduced ? 0 : Math.sin(now / 2600) * 0.06;
  group.rotation.x = lerp(P.rx, Q.rx, et) + py * 0.18;
  group.rotation.y = lerp(P.ry, Q.ry, et) + px * 0.35 + idle;
  const s = lerp(P.s, Q.s, et) * (mobile ? 0.62 : 1);
  group.scale.setScalar(s);
  // desktop: the object lives in the right half; phone: upper part of the screen
  group.position.x = mobile ? 0 : lerp(P.x, Q.x, et);
  group.position.y = mobile ? 5.2 : lerp(P.y, Q.y, et);
  const fyA = P.fy ?? -6.2, fyB = Q.fy ?? -6.2;
  floor.position.y = group.position.y + lerp(fyA, fyB, et) * s;

  renderer.render(scene, camera);
  if (first) { first = false; requestAnimationFrame(() => { window.__sceneReady = true; }); }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
