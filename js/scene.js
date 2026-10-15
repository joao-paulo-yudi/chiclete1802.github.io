/* Da tecla ao cubo: the hero scene, drawn live in Three.js.
   A keyboard types real commands; the camera pulls back with the scroll to the whole studio,
   a hairline glass cube closes around it, and the cube becomes draggable. */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const film = document.getElementById('film');
const stage = document.getElementById('stage');
const canvas = document.getElementById('scene');
const Q = new URLSearchParams(location.search);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- renderer ---------- */
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
} catch (e) {
  document.documentElement.classList.add('no-webgl');
  window.__sceneReady = true;
  throw e;
}
renderer.setClearColor(0x000000, 1);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;

const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.22;

const camera = new THREE.PerspectiveCamera(30, 1, 0.05, 400);
scene.fog = new THREE.Fog(0x000000, 10, 40);

/* ---------- palette ---------- */
const C = {
  black: 0x0b0b0c, cap: 0x121315, capTop: 0x16171a, line: 0x676d74, lineSoft: 0x24282b,
  violet: 0x9281f7, white: 0xffffff
};
const mBlack = new THREE.MeshStandardMaterial({ color: 0x08080a, roughness: 0.7, metalness: 0.2 });
const mSatin = new THREE.MeshStandardMaterial({ color: 0x0b0c0e, roughness: 0.42, metalness: 0.5 });
const mCap = new THREE.MeshStandardMaterial({ color: 0x0c0d0f, roughness: 0.24, metalness: 0.6 });
const mLine = new THREE.LineBasicMaterial({ color: C.line, transparent: true, opacity: 0.85 });
const LINE_HI = new THREE.Color(0x9aa0a6);
const mLineSoft = new THREE.LineBasicMaterial({ color: C.lineSoft, transparent: true, opacity: 0.9 });

function edges(mesh, mat = mLine, angle = 28) {
  const l = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, angle), mat);
  l.raycast = () => {};
  mesh.add(l);
  return mesh;
}
function box(w, h, d, mat = mBlack, x = 0, y = 0, z = 0, lines = true, parent) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  if (lines) edges(m);
  (parent || world).add(m);
  return m;
}
function rbox(w, h, d, r, mat = mBlack, x = 0, y = 0, z = 0, parent) {
  const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, r), mat);
  m.position.set(x, y, z);
  (parent || world).add(m);
  return m;
}

/* ---------- the world (everything that lives inside the cube) ---------- */
const S = 16;                      // cube side
const FLOOR = -7.5;                // desk top is y = 0
const CENTER = new THREE.Vector3(0, FLOOR + S / 2, 0);
const pivot = new THREE.Group();   // rotates when the cube is dragged
pivot.position.copy(CENTER);
scene.add(pivot);
const world = new THREE.Group();
world.position.copy(CENTER).multiplyScalar(-1);
pivot.add(world);

// lights
scene.add(new THREE.HemisphereLight(0x9aa3ad, 0x000000, 0.08));
const key = new THREE.DirectionalLight(0xffffff, 0.22);
key.position.set(-6, 14, 10);
scene.add(key);
const rim = new THREE.DirectionalLight(0xe8ecff, 4.2);
rim.position.set(9, 5, -14);
const rim2 = new THREE.DirectionalLight(0xffffff, 2.6);
rim2.position.set(-12, 4, -10);
scene.add(rim2);
const rimTop = new THREE.DirectionalLight(0xffffff, 1.8);
rimTop.position.set(2, 20, -16);
scene.add(rimTop);
scene.add(rim);
const fill = new THREE.DirectionalLight(0xffffff, 0.18);
fill.position.set(12, 2, 14);
scene.add(fill);

// room: floor + two walls (the cube supplies the rest); near-black, read through their edges
const mShell = new THREE.MeshBasicMaterial({ color: 0x010101 });
const mFloor = new THREE.MeshBasicMaterial({ color: 0x010101 });
box(S, 0.4, S, mFloor, 0, FLOOR - 0.2, 0);
edges(box(S, S, 0.4, mShell, 0, FLOOR + S / 2, -S / 2 - 0.2, false), mLineSoft);
edges(box(0.4, S, S, mShell, -S / 2 - 0.2, FLOOR + S / 2, 0, false), mLineSoft);
{ // floor grid
  const g = new THREE.GridHelper(S, 16, C.lineSoft, C.lineSoft);
  g.position.y = FLOOR + 0.005;
  g.material.transparent = true; g.material.opacity = 0.22;
  g.visible = false;
  world.add(g);
}

// desk
const DESK_Z = -4.5;
const mDesk = new THREE.MeshBasicMaterial({ color: 0x020202 });
box(14, 0.28, 6.6, mDesk, 0.6, -0.14, DESK_Z);
for (const lx of [-5.9, 7.1]) {
  for (const lz of [DESK_Z - 2.7, DESK_Z + 2.7]) box(0.22, 7.3, 0.22, mSatin, lx, FLOOR + 3.65, lz);
  box(0.22, 0.22, 5.6, mSatin, lx, FLOOR + 0.11, DESK_Z);
  box(0.22, 0.22, 5.6, mSatin, lx, -0.42, DESK_Z);
}
box(12.8, 0.18, 0.18, mSatin, 0.6, -0.42, DESK_Z - 2.7);

// soft bias light behind the monitors
{
  const strip = new THREE.Mesh(new THREE.BoxGeometry(9, 0.05, 0.05), new THREE.MeshBasicMaterial({ color: 0xcfd3d8 }));
  strip.position.set(0.6, 1.2, -7.75);
  world.add(strip);
  const glow = new THREE.PointLight(0xdfe4ff, 5, 6, 1.8);
  glow.position.set(0.6, 3.2, -7.7);
  world.add(glow);
}

/* monitors with real code */
function codeTexture(kind) {
  const cv = document.createElement('canvas');
  cv.width = 1024; cv.height = 600;
  const g = cv.getContext('2d');
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.userData.draw = (state) => {
    g.fillStyle = '#0e1013'; g.fillRect(0, 0, 1024, 600);
    g.fillStyle = '#0c0d0f'; g.fillRect(0, 0, 1024, 44);
    ['#3a3f44', '#3a3f44', '#3a3f44'].forEach((c, i) => { g.fillStyle = c; g.beginPath(); g.arc(28 + i * 22, 22, 6, 0, 7); g.fill(); });
    g.font = '500 22px "JetBrains Mono", monospace';
    g.fillStyle = '#6e727a';
    g.fillText(kind === 'code' ? 'src/app/ordens.component.ts' : 'terminal', 110, 30);
    g.font = '500 27px "JetBrains Mono", monospace';
    if (kind === 'code') {
      const L = [
        [['#6e727a', '1  '], ['#f0f0f0', '@Component({ selector: '], ['#9281f7', "'app-ordens'"], ['#f0f0f0', ' })']],
        [['#6e727a', '2  '], ['#f0f0f0', 'export class OrdensComponent {']],
        [['#6e727a', '3  '], ['#a1a4a5', '  ordens = signal<Ordem[]>([]);']],
        [['#6e727a', '4  '], ['#a1a4a5', '  atrasadas = computed(() =>']],
        [['#6e727a', '5  '], ['#a1a4a5', '    this.ordens().filter(o => o.atraso > 0));']],
        [['#6e727a', '6  '], ['#f0f0f0', '  apontar(op: Ordem, qtd: number) {']],
        [['#6e727a', '7  '], ['#a1a4a5', '    this.api.post('], ['#9281f7', "'/apontamentos'"], ['#a1a4a5', ', { op, qtd });']],
        [['#6e727a', '8  '], ['#f0f0f0', '  }']],
        [['#6e727a', '9  '], ['#f0f0f0', '}']],
      ];
      L.forEach((row, i) => { let x = 30; row.forEach(([c, t]) => { g.fillStyle = c; g.fillText(t, x, 100 + i * 50); x += g.measureText(t).width; }); });
      if (state.caret) { g.fillStyle = '#f0f0f0'; g.fillRect(52 + g.measureText('9  }').width, 100 + 8 * 50 - 22, 13, 28); }
    } else {
      const lines = state.lines || [];
      lines.slice(-9).forEach((ln, i) => {
        let x = 30;
        ln.forEach(([c, t]) => { g.fillStyle = c; g.fillText(t, x, 100 + i * 50); x += g.measureText(t).width; });
      });
    }
    tex.needsUpdate = true;
  };
  return tex;
}
const texCode = codeTexture('code');
const texTerm = codeTexture('term');
function monitor(x, rotY, tex) {
  const g = new THREE.Group();
  g.position.set(x, 0, -6.6);
  g.rotation.y = rotY;
  world.add(g);
  const body = rbox(6.2, 3.7, 0.22, 0.08, mSatin, 0, 3.55, 0, g);
  edges(body, mLine, 40);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(5.9, 3.42), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, fog: false }));
  scr.position.set(0, 3.55, 0.115);
  g.add(scr);
  box(0.5, 1.7, 0.3, mSatin, 0, 1.0, -0.25, true, g);
  box(2.0, 0.08, 1.3, mSatin, 0, 0.04, -0.1, true, g);
  return g;
}
monitor(-2.65, 0.14, texCode);
monitor(3.85, -0.14, texTerm);
{
  const s1 = new THREE.PointLight(0xdfe6ff, 5, 7, 1.4); s1.position.set(-2.4, 3.2, -5.4); world.add(s1);
  const s2 = new THREE.PointLight(0xdfe6ff, 5, 7, 1.4); s2.position.set(3.6, 3.2, -5.4); world.add(s2);
}

/* keyboard: 60%, real legends, keys press when the hero types */
const U = 0.19;
const KB = new THREE.Group();
KB.position.set(0.2, 0.0, -2.35);
KB.rotation.x = -0.05;
world.add(KB);
const ROWS = [
  [['`', 1], ['1', 1], ['2', 1], ['3', 1], ['4', 1], ['5', 1], ['6', 1], ['7', 1], ['8', 1], ['9', 1], ['0', 1], ['-', 1], ['=', 1], ['⌫', 2]],
  [['tab', 1.5], ['Q', 1], ['W', 1], ['E', 1], ['R', 1], ['T', 1], ['Y', 1], ['U', 1], ['I', 1], ['O', 1], ['P', 1], ['[', 1], [']', 1], ['\\', 1.5]],
  [['caps', 1.75], ['A', 1], ['S', 1], ['D', 1], ['F', 1], ['G', 1], ['H', 1], ['J', 1], ['K', 1], ['L', 1], [';', 1], ["'", 1], ['enter', 2.25]],
  [['shift', 2.25], ['Z', 1], ['X', 1], ['C', 1], ['V', 1], ['B', 1], ['N', 1], ['M', 1], [',', 1], ['.', 1], ['/', 1], ['shift ', 2.75]],
  [['ctrl', 1.25], ['⌘', 1.25], ['alt', 1.25], [' ', 6.25], ['alt ', 1.25], ['fn', 1.25], ['☰', 1.25], ['ctrl ', 1.25]]
];
const caseW = 15 * U + 0.16, caseD = 5 * U + 0.16;
{
  const c = rbox(caseW, 0.12, caseD, 0.03, mSatin, 0, 0.06, 0, KB);
  edges(c, mLine, 40);
}
const keys = new Map();
const capGeo = {};
function capGeometry(w) {
  if (!capGeo[w]) capGeo[w] = new RoundedBoxGeometry(w * U - 0.024, 0.085, U - 0.024, 2, 0.018);
  return capGeo[w];
}
function legendMaterial(label, w) {
  const px = 128;
  const cv = document.createElement('canvas');
  cv.width = Math.round(px * w); cv.height = px;
  const g = cv.getContext('2d');
  g.clearRect(0, 0, cv.width, cv.height);
  const isWord = label.trim().length > 1;
  g.font = `${isWord ? 500 : 500} ${isWord ? 30 : 46}px "JetBrains Mono", monospace`;
  g.fillStyle = '#c9ccce';
  g.textBaseline = 'middle';
  if (isWord) { g.textAlign = 'left'; g.fillText(label.trim(), 22, px / 2); }
  else { g.textAlign = 'center'; g.fillText(label, cv.width / 2, px / 2); }
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, toneMapped: false, opacity: 0.92 });
}
ROWS.forEach((row, r) => {
  let x = -7.5 * U;
  row.forEach(([label, w]) => {
    const cx = x + (w * U) / 2;
    const g = new THREE.Group();
    g.position.set(cx, 0.12 + 0.045, -2 * U + r * U);
    const cap = new THREE.Mesh(capGeometry(w), mCap);
    g.add(cap);
    let lg = null;
    if (label.trim() !== '') {
      lg = new THREE.Mesh(new THREE.PlaneGeometry(w * U - 0.05, U - 0.05), legendMaterial(label, w));
      lg.rotation.x = -Math.PI / 2;
      lg.position.y = 0.0435;
      g.add(lg);
    }
    KB.add(g);
    keys.set(label, { g, down: 0, lg });
    x += w * U;
  });
});
// the J key leaves the keyboard (it becomes the mascot); the camera keeps aiming at its empty socket
const jKey = keys.get('J');
const jSocket = new THREE.Object3D();
jSocket.position.copy(jKey.g.position);
KB.add(jSocket);
const J_BASE_Y = jKey.g.position.y;
{
  const stemMat = new THREE.MeshStandardMaterial({ color: 0x2b2f33, roughness: 0.35, metalness: 0.6 });
  const s1 = new THREE.Mesh(new THREE.BoxGeometry(0.044, 0.026, 0.012), stemMat);
  const s2 = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.026, 0.044), stemMat);
  const housing = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.02, 0.15), mBlack);
  housing.position.set(jKey.g.position.x, 0.13, jKey.g.position.z);
  s1.position.set(jKey.g.position.x, 0.152, jKey.g.position.z); s2.position.copy(s1.position);
  KB.add(housing, s1, s2);
  edges(housing, mLine, 40);
}
// a soft light over the keys
{
  const kl = new THREE.PointLight(0xffffff, 0.0, 5, 1.6);
  kl.position.set(-0.4, 2.2, -3.6);
  world.add(kl);
}
// mouse + pad
{
  const pad = box(2.4, 0.02, 2.0, new THREE.MeshBasicMaterial({ color: 0x030303 }), 2.75, 0.01, -2.2);
  const mouse = new THREE.Mesh(new THREE.SphereGeometry(0.5, 32, 20, 0, Math.PI * 2, 0, Math.PI / 2), mSatin);
  mouse.scale.set(0.42, 0.3, 0.62); mouse.position.set(2.75, 0.02, -2.2);
  mouse.material = new THREE.MeshStandardMaterial({ color: 0x0c0d0f, roughness: 0.45, metalness: 0.5 });
  world.add(mouse);
}
// mug
{
  const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.34, 0.9, 40), mSatin);
  mug.position.set(-4.3, 0.45, -4.6);
  edges(mug, mLine, 50);
  world.add(mug);
  const h = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.05, 10, 24, Math.PI), mSatin);
  h.position.set(-3.92, 0.48, -4.6);
  h.rotation.z = -Math.PI / 2;
  world.add(h);
}
// desk lamp
{
  const L = new THREE.Group();
  L.position.set(-5.9, 0, -3.4);
  L.rotation.y = 0.15;
  world.add(L);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.65, 0.12, 40), mSatin);
  base.position.y = 0.06; edges(base, mLine, 50); L.add(base);
  const a1 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3.2, 10), mSatin);
  a1.position.set(0.5, 1.6, 0); a1.rotation.z = -0.32; L.add(a1);
  const a2 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.6, 10), mSatin);
  a2.position.set(1.8, 3.15, 0); a2.rotation.z = -1.25; L.add(a2);
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.8, 32, 1, true), mSatin);
  head.position.set(3.05, 3.25, 0); head.rotation.z = 0.5; edges(head, mLine, 50); L.add(head);
  const bulb = new THREE.Mesh(new THREE.CircleGeometry(0.36, 32), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  bulb.position.set(3.24, 2.92, 0); bulb.rotation.x = -Math.PI / 2; bulb.rotation.y = 0.5; L.add(bulb);
  const spot = new THREE.SpotLight(0xffffff, 5, 12, 0.8, 1.0, 1.6);
  spot.position.set(3.2, 3.0, 0);
  const tgt = new THREE.Object3D(); tgt.position.set(4.5, -1, 1.8); L.add(tgt);
  spot.target = tgt; L.add(spot);
}
// bonsai (a quiet nod)
{
  const B = new THREE.Group();
  B.position.set(6.0, 0, -5.4);
  world.add(B);
  const pot = rbox(1.6, 0.5, 1.0, 0.06, mSatin, 0, 0.25, 0, B);
  edges(pot, mLine, 40);
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.45, 0), new THREE.Vector3(0.25, 1.0, 0.05), new THREE.Vector3(-0.2, 1.55, 0),
    new THREE.Vector3(0.15, 2.05, -0.05), new THREE.Vector3(0.55, 2.35, 0)
  ]);
  const trunk = new THREE.Mesh(new THREE.TubeGeometry(curve, 40, 0.09, 8), mSatin);
  B.add(trunk);
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x0e0f10, roughness: 0.4, metalness: 0.35 });
  const leafGeo = new THREE.IcosahedronGeometry(1, 1);
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const pads = [[0.55, 2.45, 0, 0.62], [-0.45, 1.75, 0.1, 0.48], [0.45, 1.35, -0.05, 0.4], [0.05, 2.75, 0, 0.42]];
  const count = pads.length * 60;
  const leaves = new THREE.InstancedMesh(leafGeo, leafMat, count);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), sc = new THREE.Vector3();
  let k = 0;
  pads.forEach(([x, y, z, r]) => {
    for (let i = 0; i < 60; i++) {
      const a = rnd() * Math.PI * 2, rr = Math.sqrt(rnd()) * r * 1.5;
      v.set(x + Math.cos(a) * rr, y + (rnd() - 0.2) * r * 0.28 - (rr / (r * 1.5)) * r * 0.18, z + Math.sin(a) * rr * 0.75);
      const s = 0.06 + rnd() * 0.05;
      sc.set(s * 1.6, s * 0.6, s);
      q.setFromEuler(e.set(rnd() * 0.6, rnd() * Math.PI, rnd() * 0.6));
      leaves.setMatrixAt(k++, m4.compose(v, q, sc));
    }
  });
  B.add(leaves);
}
// chair: rounded shell, tilted back, arms, gas lift, five-star base with casters
{
  const Ch = new THREE.Group();
  Ch.position.set(0.9, FLOOR, 2.0);
  Ch.rotation.y = -0.28;
  world.add(Ch);
  const seat = rbox(3.3, 0.55, 3.1, 0.24, mSatin, 0, 3.75, 0, Ch); edges(seat, mLine, 60);
  const back = rbox(3.1, 3.9, 0.42, 0.2, mSatin, 0, 6.15, 1.62, Ch); back.rotation.x = 0.16; edges(back, mLine, 60);
  const lumbar = rbox(2.6, 0.5, 0.3, 0.12, mBlack, 0, 4.45, 1.5, Ch);
  for (const sx of [-1, 1]) {
    box(0.16, 1.3, 0.16, mSatin, sx * 1.55, 4.45, 0.35, false, Ch);
    const pad = rbox(0.42, 0.16, 1.6, 0.07, mSatin, sx * 1.55, 5.15, 0.25, Ch); edges(pad, mLine, 60);
  }
  const lift = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 2.9, 18), mSatin);
  lift.position.set(0, 2.05, 0); Ch.add(lift);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.4, 0.3, 24), mSatin);
  hub.position.set(0, 0.62, 0); Ch.add(hub);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + 0.3;
    const leg = rbox(2.0, 0.16, 0.26, 0.06, mSatin, Math.cos(a) * 1.05, 0.5, Math.sin(a) * 1.05, Ch);
    leg.rotation.y = -a; leg.rotation.z = 0.0;
    edges(leg, mLine, 60);
    const wheel = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 10), mBlack);
    wheel.position.set(Math.cos(a) * 2.0, 0.16, Math.sin(a) * 2.0);
    Ch.add(wheel);
  }
}
// shelf + books on the left wall
{
  box(0.9, 0.12, 6, mSatin, -7.5, 4.0, -2.0);
  let z = -4.6;
  [[0.8, 1.5], [0.7, 1.3], [0.75, 1.6], [0.6, 1.2], [0.75, 1.45]].forEach(([d, h], i) => {
    const b = box(0.7, h, 0.32, mBlack, -7.5, 4.06 + h / 2, z);
    if (i === 4) b.rotation.x = -0.22;
    z += 0.38;
  });
  const obj = rbox(0.7, 0.7, 0.7, 0.08, mSatin, -7.5, 4.41, 0.4);
  edges(obj, mLine, 40);
}
// ensō on the back wall
{
  const fr = rbox(3.4, 3.4, 0.12, 0.03, mSatin, 0.6, 6.7, -7.92); edges(fr, mLine, 40);
  const mat = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 3.0), new THREE.MeshBasicMaterial({ color: 0x0b0c0d }));
  mat.position.set(0.6, 6.7, -7.85); world.add(mat);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.03, 8, 96, Math.PI * 1.82),
    new THREE.MeshBasicMaterial({ color: 0xd8dadb, transparent: true, opacity: 0.6 }));
  ring.position.set(0.6, 6.7, -7.83);
  ring.rotation.z = 1.9;
  world.add(ring);
}

/* ---------- the glass cube ---------- */
const cube = new THREE.Group();
cube.position.copy(CENTER);
world.add(cube);
const cubeGeo = new THREE.BoxGeometry(S + 0.9, S + 0.9, S + 0.9);
const cubeEdges = new THREE.LineSegments(new THREE.EdgesGeometry(cubeGeo),
  new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 }));
cube.add(cubeEdges);
const frameMat = new THREE.MeshStandardMaterial({ color: 0x6d7379, roughness: 0.18, metalness: 0.95, envMapIntensity: 3.2, transparent: true, opacity: 0 });
const caseFrame = new THREE.Group();
cube.add(caseFrame);
{
  const h = (S + 0.9) / 2, t = 0.07, L = S + 0.9 + t;
  for (const a of [-1, 1]) for (const b of [-1, 1]) {
    const bx = new THREE.Mesh(new THREE.BoxGeometry(L, t, t), frameMat); bx.position.set(0, a * h, b * h); caseFrame.add(bx);
    const by = new THREE.Mesh(new THREE.BoxGeometry(t, L, t), frameMat); by.position.set(a * h, 0, b * h); caseFrame.add(by);
    const bz = new THREE.Mesh(new THREE.BoxGeometry(t, t, L), frameMat); bz.position.set(a * h, b * h, 0); caseFrame.add(bz);
  }
}
const glassMat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, side: THREE.DoubleSide,
  uniforms: { uO: { value: 0 }, uSmoke: { value: 0 }, uH: { value: (S + 0.9) / 2 }, uTint: { value: new THREE.Color(0xe9eaf0) } },
  vertexShader: `varying vec3 vN; varying vec3 vV; varying vec3 vP; varying vec3 vON;
    void main(){ vP = position; vON = normal; vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`,
  fragmentShader: `uniform float uO; uniform float uSmoke; uniform float uH; uniform vec3 uTint; varying vec3 vN; varying vec3 vV; varying vec3 vP; varying vec3 vON;
    void main(){
      float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.6);
      float sheen = smoothstep(0.15, 1.0, f) * 0.34 * uO;
      float front = gl_FrontFacing ? 1.0 : 0.0;
      float smoke = uSmoke * front;
      // smoked black glass: the top face catches a little more light than the sides
      vec3 n = abs(vON);
      float face = vON.y > 0.5 ? 0.05 : (n.x > 0.5 ? 0.026 : 0.014);
      // a thin lit bevel along every edge of the face (rim light on edges, never on surfaces)
      vec3 q = abs(vP) / uH;
      float e1 = n.x > 0.5 ? max(q.y, q.z) : (n.y > 0.5 ? max(q.x, q.z) : max(q.x, q.y));
      float grazing = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 1.4);
      float bevel = smoothstep(0.986, 0.999, e1) * (vON.y > 0.5 ? 1.2 : 0.7) * (0.5 + 0.9 * grazing) * smoke;
      vec3 R = reflect(-normalize(vV), normalize(vN));
      float spec = pow(max(dot(R, normalize(vec3(-0.45, 0.62, 0.64))), 0.0), 18.0);
      float broad = pow(max(dot(R, normalize(vec3(0.5, 0.75, 0.42))), 0.0), 5.0);
      vec3 refl = (vec3(0.573, 0.506, 0.969) * spec * 0.35 + vec3(0.85) * broad * 0.08) * smoke;
      float ra = max(max(refl.r, refl.g), refl.b);
      float a = clamp(smoke + sheen - smoke * sheen + bevel + ra, 0.0, 1.0);
      vec3 col = uTint * sheen + vec3(face) * smoke * (1.0 - sheen) + vec3(0.9) * bevel + refl;
      gl_FragColor = vec4(col / max(a, 0.001), a);
    }`
});
const glass = new THREE.Mesh(cubeGeo, glassMat);
glass.renderOrder = 10;
cube.add(glass);
// corner ticks, like a technical drawing
const ticks = new THREE.Group();
cube.add(ticks);
{
  const h = (S + 0.9) / 2, t = 1.1;
  const pts = [];
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) {
    const o = new THREE.Vector3(sx * (h + 0.35), sy * (h + 0.35), sz * (h + 0.35));
    pts.push(o, o.clone().add(new THREE.Vector3(-sx * t, 0, 0)));
    pts.push(o, o.clone().add(new THREE.Vector3(0, -sy * t, 0)));
    pts.push(o, o.clone().add(new THREE.Vector3(0, 0, -sz * t)));
  }
  const tg = new THREE.BufferGeometry().setFromPoints(pts);
  ticks.add(new THREE.LineSegments(tg, new THREE.LineBasicMaterial({ color: 0xa1a4a5, transparent: true, opacity: 0 })));
}

/* ---------- typing (the hero terminal drives the keyboard) ---------- */
const CMDS = [
  { cmd: 'ng serve', out: [[['#a1a4a5', '✔ '], ['#a1a4a5', 'Compiled successfully.']], [['#a1a4a5', '  Local: '], ['#9281f7', 'http://localhost:4200/']]] },
  { cmd: 'npm run build', out: [[['#a1a4a5', '> vite build']], [['#a1a4a5', '✓ '], ['#a1a4a5', '214 modules transformed.']]] },
  { cmd: 'dotnet watch run', out: [[['#a1a4a5', 'dotnet watch ⌚ Started']], [['#70b8ff', 'info: '], ['#a1a4a5', 'Now listening on '], ['#9281f7', 'https://localhost:7043']]] },
  { cmd: 'git push origin main', out: [[['#a1a4a5', 'To github.com:joao-paulo-yudi/portfolio.git']], [['#a1a4a5', '   '], ['#a1a4a5', 'a3f9c2e..7d41b0a  main -> main']]] }
];
const typedEl = document.getElementById('typed');
let termLines = [[['#6e727a', '~/joao '], ['#9281f7', '$ ']]];
let ci = 0, chi = CMDS[0].cmd.length, wait = 1.4, phase = 'type';
function keyFor(ch) {
  if (ch === ' ') return ' ';
  return ch.toUpperCase();
}
function press(label) {
  if (label === 'J' && progress > 0.03) return;   // J is busy leaving
  const k = keys.get(label);
  if (k) k.down = 1;
}
function stepTyping(dt) {
  wait -= dt;
  if (wait > 0) return;
  const c = CMDS[ci];
  if (phase === 'type') {
    if (chi < c.cmd.length) {
      const ch = c.cmd[chi++];
      press(keyFor(ch));
      if (typedEl) typedEl.textContent = c.cmd.slice(0, chi);
      termLines[termLines.length - 1] = [['#6e727a', '~/joao '], ['#9281f7', '$ '], ['#f0f0f0', c.cmd.slice(0, chi)]];
      wait = 0.07 + Math.random() * 0.1;
    } else {
      press('enter');
      phase = 'out';
      wait = 0.5;
    }
  } else if (phase === 'out') {
    c.out.forEach(l => termLines.push(l));
    termLines.push([['#6e727a', '~/joao '], ['#9281f7', '$ ']]);
    phase = 'clear'; wait = 2.2;
  } else if (phase === 'clear') {
    ci = (ci + 1) % CMDS.length; chi = 0;
    press('J');   // J twitches between commands: it wants out
    if (typedEl) typedEl.textContent = '';
    phase = 'type'; wait = 0.5;
  }
  texTerm.userData.draw({ lines: termLines });
}
function staticTyping(full) {
  if (typedEl) typedEl.textContent = CMDS[0].cmd;
  termLines = [[['#6e727a', '~/joao '], ['#9281f7', '$ '], ['#f0f0f0', CMDS[0].cmd]], ...(full ? CMDS[0].out : [])];
  texTerm.userData.draw({ lines: termLines });
}

/* ---------- camera path ---------- */
const KB_WORLD = new THREE.Vector3();
const tmp = new THREE.Vector3();
const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = v => Math.max(0, Math.min(1, v));
const smooth = t => t * t * (3 - 2 * t);
const easeInOut = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
let mobile = false;

const J_WORLD = new THREE.Vector3();
function cameraAt(p, out) {
  // p in [0,1]: from one keycap to the whole cube along one smooth path
  const t = easeInOut(clamp01(p / 0.86));
  jSocket.getWorldPosition(J_WORLD);
  const a = J_WORLD.clone().add(new THREE.Vector3(0.02, 0.02, 0.0));
  const b = new THREE.Vector3(0.6, 4.0, -6.4);
  const c = CENTER.clone().add(new THREE.Vector3(0, -0.6, 0));
  const u = Math.pow(smooth(t), 1.35);
  // quadratic bezier for the target: the key -> desk and screens -> the room's centre
  const target = a.multiplyScalar((1 - u) * (1 - u)).add(b.multiplyScalar(2 * u * (1 - u))).add(c.multiplyScalar(u * u));
  const d0 = mobile ? 2.0 : 1.08, d1 = mobile ? 104 : 66;
  const dist = d0 * Math.pow(d1 / d0, Math.pow(t, 0.8));
  const yaw = lerp(0.5, 0.54, t);
  const pitch = t < 0.5 ? lerp(0.72, 0.4, smooth(t / 0.5)) : lerp(0.4, 0.5, smooth((t - 0.5) / 0.5));
  out.pos.set(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)).multiplyScalar(dist).add(target);
  out.target.copy(target);
  out.t = t;
  return out;
}

/* ---------- sizing ---------- */
let W = 0, H = 0;
function resize() {
  const r = stage.getBoundingClientRect();
  W = Math.max(2, r.width); H = Math.max(2, r.height);
  mobile = W < 760;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, mobile ? 1.6 : 1.75));
  renderer.setSize(W, H, false);
  camera.aspect = W / H;
  camera.fov = mobile ? 38 : 30;
  camera.updateProjectionMatrix();
  dirty = true;
}

/* ---------- drag the cube ---------- */
const drag = { on: false, x: 0, y: 0, vx: 0, vy: 0, rx: 0, ry: 0, enabled: false, touched: false };
canvas.addEventListener('pointerdown', e => {
  if (!drag.enabled) return;
  drag.on = true; drag.x = e.clientX; drag.y = e.clientY; drag.touched = true;
  canvas.setPointerCapture(e.pointerId);
  document.documentElement.classList.add('cube-grab');
});
canvas.addEventListener('pointermove', e => {
  if (!drag.on) return;
  const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
  drag.x = e.clientX; drag.y = e.clientY;
  drag.vy = dx * 0.006; drag.vx = dy * 0.004;
  drag.ry += drag.vy; drag.rx = Math.max(-0.5, Math.min(0.5, drag.rx + drag.vx));
  dirty = true;
});
const endDrag = () => { drag.on = false; document.documentElement.classList.remove('cube-grab'); };
canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', endDrag);
canvas.addEventListener('dblclick', () => { if (drag.enabled) drag.vy += 0.42; });
window.__cube = { spin(v = 0.4) { drag.vy += v; dirty = true; } };

/* ---------- beats (copy over the scene) ---------- */
const beats = [...document.querySelectorAll('[data-beat]')].map(el => {
  const [a, b, c, d] = el.dataset.beat.split(',').map(Number);
  return { el, a, b, c, d };
});
const readout = document.getElementById('readout');
function beatsAt(p) {
  for (const B of beats) {
    let o = 0;
    if (p >= B.a && p <= B.d) o = p < B.b ? (p - B.a) / (B.b - B.a) : p > B.c ? 1 - (p - B.c) / (B.d - B.c) : 1;
    if (B.a === 0 && p < B.b) o = 1;
    if (B.d === 1 && p > B.c) o = 1;
    o = clamp01(o);
    B.el.style.opacity = o.toFixed(3);
    B.el.style.transform = `translate3d(0, ${((1 - o) * (p < (B.b + B.c) / 2 ? 18 : -18)).toFixed(1)}px, 0)`;
    B.el.style.visibility = o < 0.01 ? 'hidden' : 'visible';
  }
  if (readout) readout.textContent = String(Math.round(p * 100)).padStart(3, '0');
}

/* ---------- loop ---------- */
let progress = 0, shown = -1, dirty = true, visible = true, last = performance.now(), time = 0;
const cam = { pos: new THREE.Vector3(), target: new THREE.Vector3(), t: 0 };
const camPos = new THREE.Vector3(), camTgt = new THREE.Vector3();
let first = true;

function measure() {
  const r = film.getBoundingClientRect();
  const span = r.height - innerHeight;
  return span <= 0 ? 0 : clamp01(-r.top / span);
}
new IntersectionObserver(es => { visible = es[es.length - 1].isIntersecting; }, { rootMargin: "100px" }).observe(film);

function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000); last = now;
  if (!visible) return;
  const live = !reduced;
  time += dt;
  progress = measure();
  const lerpK = first || !live ? 1 : 1 - Math.pow(0.0008, dt);   // smooth follow
  cameraAt(progress, cam);
  if (first) { camPos.copy(cam.pos); camTgt.copy(cam.target); first = false; }
  camPos.lerp(cam.pos, lerpK); camTgt.lerp(cam.target, lerpK);
  if (camPos.distanceToSquared(cam.pos) > 1e-6) dirty = true;

  // typing + key travel
  if (live) stepTyping(dt);
  for (const k of keys.values()) {
    if (k.down > 0 || k.g.position.y < 0.165) {
      k.down = Math.max(0, k.down - dt * 9);
      const target = 0.165 - (k.down > 0 ? 0.07 : 0);
      k.g.position.y += (target - k.g.position.y) * Math.min(1, dt * 30);
      if (k.lg) { const f = 1 + 0.9 * k.down; k.lg.material.color.setScalar(f); }
      dirty = true;
    }
  }
  // J jumps off the keyboard just after the hero
  {
    const pop = clamp01((progress - 0.035) / 0.12);
    const e = pop * pop;
    jKey.g.visible = pop < 1;
    if (pop > 0) {
      // a small hop out of the switch, then a long arc off to the right
      jKey.g.position.y = J_BASE_Y + Math.sin(Math.min(1, pop * 2.2) * Math.PI * 0.5) * 0.28 + e * 2.2;
      jKey.g.position.x = jSocket.position.x + e * 1.9;
      jKey.g.position.z = jSocket.position.z + e * 0.5;
      jKey.g.rotation.set(-pop * 0.5, pop * 1.4, -e * 1.2);
      dirty = true;
    } else if (jKey.g.rotation.y !== 0 || !jKey.g.visible) { jKey.g.visible = true; jKey.g.rotation.set(0, 0, 0); jKey.g.position.copy(jSocket.position); dirty = true; }
  }
  // monitor caret
  const caret = Math.floor(time * 1.6) % 2 === 0;
  if (live && caret !== texCode.userData.caret) { texCode.userData.caret = caret; texCode.userData.draw({ caret }); dirty = true; }

  // the cube closes around the studio
  const close = smooth(clamp01((progress - 0.62) / 0.24));
  const wide = smooth(clamp01((progress - 0.4) / 0.4));
  mLine.color.setHex(0x676d74).lerp(LINE_HI, wide); mLine.opacity = 0.85 + 0.15 * wide;
  scene.environmentIntensity = 0.22 + 0.33 * wide;
  rim.intensity = 4.2 + 2.0 * wide; rimTop.intensity = 1.8 + 1.6 * wide;
  cubeEdges.material.opacity = 0.0; cubeEdges.visible = false;
  frameMat.opacity = close; caseFrame.visible = close > 0.01;
  glassMat.uniforms.uO.value = close;
  // the case smokes over into one black glass cube; hold it to see the studio again
  const smokeGoal = 0.52 * smooth(clamp01((progress - 0.82) / 0.16)) * (drag.on ? 0.3 : 1);
  const sm = glassMat.uniforms.uSmoke;
  const ns = live ? sm.value + (smokeGoal - sm.value) * Math.min(1, dt * 7) : smokeGoal;
  if (Math.abs(ns - sm.value) > 1e-4) dirty = true;
  sm.value = ns;
  ticks.visible = false;

  // drag + idle spin at the end
  drag.enabled = progress > 0.84;
  document.documentElement.classList.toggle('cube-live', drag.enabled);
  if (!drag.on) {
    drag.vy *= Math.pow(0.04, dt); drag.vx *= Math.pow(0.04, dt);
    drag.ry += drag.vy; drag.rx += drag.vx;
    drag.rx *= Math.pow(0.35, dt);
    if (live && progress > 0.9) drag.ry += dt * 0.06 * smooth(clamp01((progress - 0.9) / 0.1));
    if (Math.abs(drag.vy) > 1e-5 || (live && progress > 0.9)) dirty = true;
  }
  if (!drag.enabled && !drag.on) { drag.ry *= Math.pow(0.02, dt); drag.rx *= Math.pow(0.02, dt); if (Math.abs(drag.ry) > 1e-4) dirty = true; }
  const turn = -0.42 * smooth(clamp01((progress - 0.8) / 0.2));
  pivot.rotation.set(drag.rx, drag.ry + turn, 0);

  // composition: subject sits right of the copy on desktop, below it on phones, centred at the end
  // the subject sits beside the copy at both ends of the film, centred in between
  if (mobile) {
    const sideA = 1 - smooth(clamp01((progress - 0.04) / 0.16));
    camera.setViewOffset(W, H, -W * 0.1 * sideA, -H * 0.2 * sideA + H * 0.13 * (1 - sideA), W, H);
  } else camera.setViewOffset(W, H, -W * 0.2, 0, W, H);

  camera.position.copy(camPos);
  camera.lookAt(camTgt);
  const dNow = camPos.distanceTo(camTgt);
  const fogT = smooth(clamp01(cam.t / 0.22)), fogE = smooth(clamp01((cam.t - 0.75) / 0.25));
  scene.fog.near = dNow * lerp(lerp(0.62, 0.95, fogT), 0.8, fogE);
  scene.fog.far = dNow * lerp(lerp(1.3, 2.2, fogT), 1.6, fogE);

  if (progress !== shown) { beatsAt(progress); shown = progress; dirty = true; }
  if (dirty) { renderer.render(scene, camera); dirty = false; }
}

addEventListener('resize', resize);
new ResizeObserver(resize).observe(stage);
document.fonts && document.fonts.ready.then(() => { texCode.userData.draw({ caret: true }); texTerm.userData.draw({ lines: termLines }); dirty = true; });
texCode.userData.draw({ caret: true });
staticTyping(reduced);
// debug switches for lighting checks (?dbg=noglass,nolights,noenv)
{
  const D = (Q.get('dbg') || '').split(',');
  if (D.includes('noglass')) glass.visible = false;
  if (D.includes('nolights')) scene.traverse(o => { if (o.isLight) o.visible = false; });
  if (D.includes('noenv')) scene.environment = null;
}
resize();
renderer.setAnimationLoop(frame);
window.__scene = { get progress() { return progress; }, get visible() { return visible; }, get dirty() { return dirty; }, renderer, scene, poke() { dirty = true; } };
requestAnimationFrame(() => requestAnimationFrame(() => { window.__sceneReady = true; }));
