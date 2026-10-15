/* Play layer: J (the key that left the keyboard), the terminal, shortcuts, the keycap rain.
   With reduced motion on, everything here holds still. */
(function () {
  const root = document.documentElement;
  const isEN = () => root.classList.contains('lang-en');
  const T = (pt, en) => (isEN() ? en : pt);
  const moving = () => !matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = t => 1 - Math.pow(1 - t, 3);
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const NS = 'http://www.w3.org/2000/svg';
  const el = (tag, attrs = {}, parent) => {
    const n = tag.startsWith('svg:') ? document.createElementNS(NS, tag.slice(4)) : document.createElement(tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  };
  const shotMode = root.classList.contains('wd') && !/[?&]play=1/.test(location.search);

  /* =========================================================
     1. J, the mascot
     ========================================================= */
  const box = el('div', { class: 'jkey', 'aria-hidden': 'true' });
  const svg = el('svg:svg', { viewBox: '0 0 60 72', width: 60, height: 72 }, box);
  const gLegs = el('svg:g', { class: 'j-legs' }, svg);
  const legL = el('svg:path', {}, gLegs), legR = el('svg:path', {}, gLegs);
  const footL = el('svg:path', {}, gLegs), footR = el('svg:path', {}, gLegs);
  const gArms = el('svg:g', { class: 'j-arms' }, svg);
  const armL = el('svg:path', {}, gArms), armR = el('svg:path', {}, gArms);
  // the J keycap from the hero keyboard: satin black skirt, a darker dished top, rim light on the edges only
  const defs = el('svg:defs', {}, svg);
  const grad = (id, a, b, x2 = 0, y2 = 1) => {
    const g = el('svg:linearGradient', { id, x1: 0, y1: 0, x2, y2 }, defs);
    el('svg:stop', { offset: 0, 'stop-color': a }, g); el('svg:stop', { offset: 1, 'stop-color': b }, g);
  };
  grad('jSkirt', '#17181a', '#030303');
  grad('jTop', '#1f2123', '#08090a', 0.4, 1);
  const gBody = el('svg:g', { class: 'j-body' }, svg);
  el('svg:rect', { x: 11, y: 12, width: 38, height: 36, rx: 8.5, class: 'j-cap' }, gBody);
  el('svg:rect', { x: 15.5, y: 13.5, width: 29, height: 27, rx: 6, class: 'j-dish' }, gBody);
  el('svg:path', { d: 'M19.5 14.2h21', class: 'j-rim' }, gBody);
  el('svg:path', { d: 'M11.6 21v19', class: 'j-rim j-rim-s' }, gBody);
  const legend = el('svg:text', { x: 19, y: 23.2, class: 'j-legend' }, gBody); legend.textContent = 'J';
  el('svg:path', { d: 'M27 36.6h6', class: 'j-bump' }, gBody);
  const gEyes = el('svg:g', {}, gBody);
  const eyeL = el('svg:ellipse', { cx: 26, cy: 29, rx: 1.9, ry: 2.3, class: 'j-eye' }, gEyes);
  const eyeR = el('svg:ellipse', { cx: 34, cy: 29, rx: 1.9, ry: 2.3, class: 'j-eye' }, gEyes);
  const bubble = el('div', { class: 'j-say', role: 'status' }, box);
  document.body.appendChild(box);

  // perches: element + where along its top edge J stands (fraction of width) + side the bubble opens
  // four stops only: J is a guest, not a header ornament
  const PERCHES = [
    ['#about-code', 0.88], ['#p-tickets .win', 0.95], ['.win-git', 0.9], ['.foot', 0, true, '.term-btn']
  ].map(([sel, fx, finale, xsel]) => ({ sel, fx, finale, xsel, node: null, xnode: null }));
  const sobre = document.getElementById('sobre');

  const J = {
    x: -200, y: -200, vx: 0, vy: 0,     // screen position of the feet
    s: 1, sv: 0,                        // squash (1 = rest, <1 squashed, >1 stretched)
    tilt: 0,
    state: 'hidden',                    // hidden | perch | hop | chase
    perch: null, hop: null,
    shown: false, awake: false, idleT: 0, blinkT: 2.5, blink: 0, sit: 0, wave: 0,
    lookX: 0, lookY: 0, lastHop: 0, landedFinale: false, greeted: false
  };
  const S = () => (innerWidth < 720 ? 0.78 : 1);

  function perchPoint(p) {
    if (!p.node) p.node = document.querySelector(p.sel);
    if (!p.node) return null;
    const r = p.node.getBoundingClientRect();
    if (!r.width) return null;
    const pad = 24 * S();
    let x = r.left + r.width * p.fx;
    if (p.xsel) {   // stand on this element's top edge, above another element (the footer rule, over the terminal button)
      if (!p.xnode) p.xnode = document.querySelector(p.xsel);
      if (p.xnode) { const xr = p.xnode.getBoundingClientRect(); if (xr.width) x = xr.left + xr.width / 2; }
    }
    return { x: clamp(x, pad + 6, innerWidth - pad - 6), y: r.top - 1.5, top: r.top };
  }
  function pickPerch() {
    const aim = innerHeight * 0.4;
    let best = null, bestD = 1e9;
    for (const p of PERCHES) {
      const q = perchPoint(p);
      if (!q || q.top < 70 || q.top > innerHeight * 0.86) continue;
      const d = Math.abs(q.top - aim) - (p === J.perch ? 60 : 0);   // a little stickiness
      if (d < bestD) { bestD = d; best = p; }
    }
    // the footer wins at the very bottom of the page
    const atEnd = innerHeight + scrollY >= document.documentElement.scrollHeight - 4;
    if (atEnd) best = PERCHES[PERCHES.length - 1];
    return best;
  }

  let sayTimer = 0;
  function say(text, ms = 2600) {
    bubble.textContent = text;
    box.classList.add('saying');
    clearTimeout(sayTimer);
    sayTimer = setTimeout(() => box.classList.remove('saying'), ms);
  }

  function startHop(target) {
    const now = performance.now();
    const q = perchPoint(target);
    if (!q) return;
    J.perch = target; J.sit = 0; J.idleT = 0;
    if (!moving()) { J.x = q.x; J.y = q.y; J.state = 'perch'; return; }
    J.y = clamp(J.y, -90, innerHeight + 90);   // arrive from the edge, not from far away
    const dist = Math.hypot(q.x - J.x, q.y - J.y);
    J.hop = { x0: J.x, y0: J.y, t: 0, d: clamp(0.42 + dist / 2400, 0.42, 0.78), h: clamp(dist * 0.32, 50, 190), wind: 0.1 };
    J.state = 'hop'; J.lastHop = now;
    J.s = 0.8; J.sv = 0;   // anticipation
  }

  function land(finale) {
    J.state = 'perch';
    J.s = finale ? 0.62 : 0.78; J.sv = 0;
    if (finale && !J.landedFinale) {
      J.landedFinale = true;
      burst(J.x, J.y - 18 * S());
      setTimeout(() => say(finePointer ? T('fim da linha. o terminal está aqui embaixo (T).', 'end of the line. the terminal is right below (T).')
                                       : T('fim da linha. o terminal está aqui embaixo.', 'end of the line. the terminal is right below.'), 4200), 380);
    }
  }

  function burst(x, y) {
    if (!moving()) return;
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i - 4.5) * 0.3, d = 34 + (i % 3) * 12;
      const b = el('i', { class: 'j-spark' });
      b.style.left = x + 'px'; b.style.top = y + 'px';
      b.style.setProperty('--dx', Math.cos(a) * d + 'px'); b.style.setProperty('--dy', Math.sin(a) * d + 'px');
      b.style.setProperty('--r', (a * 57.3 + 90) + 'deg');
      document.body.appendChild(b);
      setTimeout(() => b.remove(), 800);
    }
  }

  // cursor play: a deliberate flick of the mouse starts a chase; stillness sends J home
  const ptr = { x: 0, y: 0, t: 0, travel: 0, lastMove: 0 };
  const TRAIL = ['{', '}', ';', '<', '/>', '=', '()', '[]'];
  let trailT = 0, trailI = 0;
  addEventListener('mousemove', e => {
    const now = performance.now();
    const dx = e.clientX - ptr.x, dy = e.clientY - ptr.y;
    ptr.travel = ptr.travel * Math.exp(-(now - ptr.lastMove) / 450) + Math.hypot(dx, dy);
    ptr.x = e.clientX; ptr.y = e.clientY; ptr.lastMove = now;
    wake();
    if (!finePointer || !moving() || !J.shown || J.state === 'hidden') return;
    if (J.state !== 'chase' && ptr.travel > 520 && !term.open) { J.state = 'chase'; J.hop = null; J.sit = 0; J.s = 1.15; }
  }, { passive: true });

  function spawnTrail(x, y) {
    const t = el('i', { class: 'j-trail' });
    t.textContent = TRAIL[trailI++ % TRAIL.length];
    t.style.left = x + 'px'; t.style.top = y + 'px';
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 900);
  }

  const LINES_PT = ['oi. sou a tecla J, de João.', 'aperte T e abra o terminal.', 'tente ↑ ↑ ↓ ↓ ← → ← → B A', 'eu saí do teclado lá do topo.', 'aperte ? para ver os atalhos.', 'arraste o cubo lá em cima.'];
  const LINES_EN = ['hi. I am the J key, for João.', 'press T to open the terminal.', 'try ↑ ↑ ↓ ↓ ← → ← → B A', 'I left the keyboard up top.', 'press ? for shortcuts.', 'go drag the cube up top.'];
  const LINES_TOUCH_PT = ['oi. sou a tecla J, de João.', 'toque em >_ terminal no rodapé.', 'eu saí do teclado lá do topo.', 'arraste o cubo lá em cima.'];
  const LINES_TOUCH_EN = ['hi. I am the J key, for João.', 'tap >_ terminal in the footer.', 'I left the keyboard up top.', 'go drag the cube up top.'];
  let lineI = 0;
  box.addEventListener('click', () => {
    const lines = finePointer ? T(LINES_PT, LINES_EN) : T(LINES_TOUCH_PT, LINES_TOUCH_EN);
    say(lines[lineI++ % lines.length]);
    if (moving()) { J.s = 0.66; J.sv = 0; J.sit = 0; J.idleT = 0; }
  });

  function wake() {
    if (J.awake) return;
    J.awake = true;
  }
  addEventListener('scroll', wake, { passive: true });
  addEventListener('touchstart', wake, { passive: true });
  if (/[?&]play=1/.test(location.search)) J.awake = true;

  function render() {
    const sc = S();
    const sy = J.s, sx = 1 + (1 - J.s) * 0.7;
    const sitDrop = J.sit * 7;
    box.style.transform = `translate3d(${(J.x - 30 * sc).toFixed(1)}px, ${(J.y - 68 * sc).toFixed(1)}px, 0) scale(${sc})`;
    box.classList.toggle('say-l', J.x > innerWidth * 0.55);
    // body squash around the hips
    const airborne = J.state === 'hop' || J.state === 'chase';
    const bodyLift = airborne ? -4 : 0;
    gBody.setAttribute('transform',
      `translate(30 ${48 + sitDrop + bodyLift}) rotate(${J.tilt.toFixed(2)}) scale(${sx.toFixed(3)} ${sy.toFixed(3)}) translate(-30 -48)`);
    // eyes: blink + look
    const ry = 2.3 * (1 - J.blink * 0.9);
    eyeL.setAttribute('ry', ry.toFixed(2)); eyeR.setAttribute('ry', ry.toFixed(2));
    gEyes.setAttribute('transform', `translate(${J.lookX.toFixed(2)} ${J.lookY.toFixed(2)})`);
    // legs: hips follow the body, feet plant on the perch or tuck in the air
    const hipY = 48 + sitDrop + bodyLift - (1 - sy) * 4;
    const hl = 30 - 6 * sx, hr = 30 + 6 * sx;
    let fl, fr, fy;
    if (airborne) { fl = 25; fr = 35; fy = 60 + (J.state === 'chase' ? 3 : 0); }
    else { fl = 22 - J.sit * 6; fr = 38 + J.sit * 6; fy = 68; }
    const kneeOut = 3 + J.sit * 6 + (1 - sy) * 10;
    legL.setAttribute('d', `M${hl} ${hipY} Q${hl - kneeOut} ${(hipY + fy) / 2} ${fl} ${fy}`);
    legR.setAttribute('d', `M${hr} ${hipY} Q${hr + kneeOut} ${(hipY + fy) / 2} ${fr} ${fy}`);
    footL.setAttribute('d', `M${fl} ${fy}h-4.5`);
    footR.setAttribute('d', `M${fr} ${fy}h4.5`);
    // arms: hang, swing in the air, wave on demand
    const shY = 31 + sitDrop + bodyLift;
    const swing = airborne ? -8 : 0;
    const w = Math.sin(J.wave * 18) * 6 * Math.min(1, J.wave);
    armL.setAttribute('d', `M${30 - 18 * sx} ${shY} q-5 ${4 + swing / 2} -7 ${9 + swing}`);
    armR.setAttribute('d', J.wave > 0
      ? `M${30 + 18 * sx} ${shY} q6 ${-6 - w} 8 ${-14 - w}`
      : `M${30 + 18 * sx} ${shY} q5 ${4 + swing / 2} 7 ${9 + swing}`);
  }

  let last = performance.now();
  function tick(now) {
    requestAnimationFrame(tick);
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    if (shotMode && !/[?&]play=1/.test(location.search)) return;
    const sobreTop = sobre ? sobre.getBoundingClientRect().top : 0;
    const inPage = sobreTop < innerHeight * 0.85;
    const want = J.awake && inPage;

    if (!want) {
      if (J.shown) { J.shown = false; box.classList.remove('on'); J.state = 'hidden'; J.perch = null; }
      return;
    }
    if (!J.shown) {
      J.shown = true; box.classList.add('on');
      const p = pickPerch();
      if (p) {
        const q = perchPoint(p);
        J.x = q ? q.x + 80 : innerWidth - 60; J.y = innerHeight + 80;
        J.state = 'perch'; startHop(p);
        if (!J.greeted) { J.greeted = true; setTimeout(() => say(T('oi! sou a tecla J. pulei do teclado lá de cima.', 'hi! I am the J key. I jumped off the keyboard up top.'), 3200), 650); }
      } else { J.shown = false; box.classList.remove('on'); }
      return;
    }

    const m = moving();
    const target = pickPerch();

    if (J.state === 'chase') {
      if (!m || now - ptr.lastMove > 1300 || term.open) { if (target) startHop(target); }
      else {
        const tx = ptr.x - 34, ty = ptr.y + 46;
        const k = 60, c = 11;
        for (let r = dt; r > 0; r -= 1 / 120) {
          const h = Math.min(r, 1 / 120);
          J.vx += ((tx - J.x) * k - J.vx * c) * h; J.vy += ((ty - J.y) * k - J.vy * c) * h;
          J.x += J.vx * h; J.y += J.vy * h;
        }
        J.tilt = clamp(J.vx * 0.02, -16, 16);
        trailT += dt * Math.min(1, Math.hypot(J.vx, J.vy) / 500);
        if (trailT > 0.11) { trailT = 0; spawnTrail(J.x, J.y - 40); }
      }
    } else if (target && target !== J.perch && (J.state === 'perch') && now - J.lastHop > 260) {
      startHop(target);
    } else if (target && J.state === 'perch' && !J.perch) {
      startHop(target);
    }

    if (J.state === 'hop' && J.hop) {
      const h = J.hop;
      if (h.wind > 0) { h.wind -= dt; J.s += (0.8 - J.s) * Math.min(1, dt * 18); }
      else {
        if (h.t === 0) { J.s = 1.16; J.sv = 0; }
        h.t = Math.min(1, h.t + dt / h.d);
        const q = J.perch && perchPoint(J.perch);
        const ex = q ? q.x : h.x0, ey = q ? q.y : h.y0;
        const t = h.t;
        J.x = lerp(h.x0, ex, ease(t));
        J.y = lerp(h.y0, ey, t) - Math.sin(Math.PI * t) * h.h;
        J.tilt = (ex - h.x0) > 0 ? 8 * Math.sin(Math.PI * t) : -8 * Math.sin(Math.PI * t);
        if (t >= 1) { J.hop = null; land(J.perch && J.perch.finale); }
      }
    } else if (J.state === 'perch' && J.perch) {
      const q = perchPoint(J.perch);
      if (q) { J.x = q.x; J.y = q.y; }
      J.tilt *= Math.pow(0.001, dt);
      J.vx = 0; J.vy = 0;
    }

    // squash spring
    if (m) {
      const k = 260, c = 14;
      for (let r = dt; r > 0; r -= 1 / 120) {
        const h = Math.min(r, 1 / 120);
        J.sv += ((1 - J.s) * k - J.sv * c) * h; J.s += J.sv * h;
      }
      J.s = clamp(J.s, 0.55, 1.3);
      if (J.state === 'perch') {
        J.idleT += dt;
        if (J.idleT > 7) J.sit = Math.min(1, J.sit + dt * 3);      // sits down after a while
      }
      J.blinkT -= dt;
      if (J.blinkT < 0) { J.blink = 1; J.blinkT = 4 + Math.random() * 4; }
      J.blink = Math.max(0, J.blink - dt * 7);
      J.wave = Math.max(0, J.wave - dt * 0.6);
      // glance at the cursor
      const dx = ptr.x - J.x, dy = ptr.y - (J.y - 40);
      const len = Math.hypot(dx, dy) || 1;
      J.lookX += ((dx / len) * 1.8 - J.lookX) * Math.min(1, dt * 8);
      J.lookY += ((dy / len) * 1.4 - J.lookY) * Math.min(1, dt * 8);
    } else {
      J.s = 1; J.sv = 0; J.blink = 0; J.tilt = 0; J.sit = 0; J.wave = 0;
      if (J.state !== 'perch' && target) { J.perch = target; J.state = 'perch'; J.hop = null; }
    }
    render();
  }
  requestAnimationFrame(tick);

  /* =========================================================
     2. The terminal (T or ` to open, Esc to close)
     ========================================================= */
  const term = { open: false, hist: [], hi: 0 };
  const tw = el('div', { class: 'term', role: 'dialog', 'aria-modal': 'false', 'aria-label': 'Terminal', hidden: '' });
  tw.innerHTML = `
    <div class="win term-win">
      <div class="win-bar"><i></i><i></i><i></i><span class="win-t">visitante@jpy: ~</span>
        <button type="button" class="term-x" aria-label="Fechar terminal">esc</button></div>
      <div class="term-out" aria-live="polite"></div>
      <label class="term-in"><span class="t-path">~</span> <span class="t-sign">$</span>
        <input type="text" spellcheck="false" autocomplete="off" autocapitalize="off" aria-label="Comando"></label>
    </div>`;
  document.body.appendChild(tw);
  const out = tw.querySelector('.term-out'), input = tw.querySelector('input');
  tw.querySelector('.term-x').addEventListener('click', () => closeTerm());
  tw.addEventListener('click', e => { if (e.target === tw) closeTerm(); });

  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function print(html, cls = '') { const p = el('div', { class: 'tl ' + cls }); p.innerHTML = html; out.appendChild(p); out.scrollTop = out.scrollHeight; }
  const PROJ = {
    studyenem: 'studyenem', 'easyland': 'easyland-mes', 'easyland-mes': 'easyland-mes', chamadopro: 'chamadopro',
    estoque: 'controle-de-estoque', 'controle-de-estoque': 'controle-de-estoque', sanitas: 'sanitas', reluzi: 'reluzi', 'quiz-tech': 'quiz-tech', quiztech: 'quiz-tech'
  };
  const SECS = { sobre: 'sobre', about: 'sobre', projetos: 'projetos', work: 'projetos', habilidades: 'habilidades', skills: 'habilidades', trajetoria: 'trajetoria', career: 'trajetoria', contato: 'contato', contact: 'contato', topo: 'top', top: 'top' };
  const CMDS = ['help', 'whoami', 'ls', 'cd', 'open', 'cat', 'stack', 'email', 'lang', 'sudo', 'clear', 'exit', 'cafe', 'coffee', 'date', 'echo', 'history', 'vim', 'konami', 'rm'];
  const go = id => { closeTerm(); const t = document.getElementById(id); if (t) t.scrollIntoView({ behavior: moving() ? 'smooth' : 'auto' }); };

  const run = {
    help() {
      print(T(
        `<span class="k">comandos</span>
  whoami            quem é o João
  ls [projetos]     o que tem aqui
  cd &lt;seção&gt;        sobre, projetos, habilidades, trajetoria, contato
  open &lt;projeto&gt;    abre o estudo de caso
  cat joao.ts       o resumo em código
  stack             as ferramentas
  email             o caminho mais curto
  lang pt|en        idioma
  clear · exit
<span class="c">e alguns que não estão na lista.</span>`,
        `<span class="k">commands</span>
  whoami            who João is
  ls [projects]     what lives here
  cd &lt;section&gt;      about, work, skills, career, contact
  open &lt;project&gt;    opens the case study
  cat joao.ts       the summary, as code
  stack             the tools
  email             the shortest route
  lang pt|en        language
  clear · exit
<span class="c">and a few that are not on the list.</span>`), 'pre');
    },
    whoami() { print(T('visitante. o dono da casa é o João Paulo Yudi: dev front-end, Angular e React, Full-Stack na Von Braun Labs.', 'a visitor. The owner is João Paulo Yudi: front-end dev, Angular and React, Full-Stack at Von Braun Labs.')); },
    ls(a) {
      if (/^(projetos|projects|work)/.test(a)) print('studyenem/  easyland-mes/  chamadopro/  controle-de-estoque/  sanitas/  reluzi/  quiz-tech/', 'pre');
      else print(T('sobre/  projetos/  habilidades/  trajetoria/  contato/  joao.ts', 'about/  work/  skills/  career/  contact/  joao.ts'), 'pre');
    },
    cd(a) {
      const k = (a || '').replace(/[\/~.]/g, '').toLowerCase();
      if (!k) return go('top');
      if (SECS[k]) return go(SECS[k]);
      print(T(`cd: não achei "${esc(a)}". tente: sobre, projetos, habilidades, trajetoria, contato`, `cd: no "${esc(a)}" here. try: about, work, skills, career, contact`), 'err');
    },
    open(a) {
      const k = (a || '').replace(/\/$/, '').toLowerCase();
      if (PROJ[k]) { print(T('abrindo ', 'opening ') + `<span class="s">${PROJ[k]}</span>…`); setTimeout(() => { location.href = `paginas/projetos/${PROJ[k]}.html`; }, 450); }
      else print(T('open: qual projeto? digite ls projetos', 'open: which project? type ls projects'), 'err');
    },
    cat(a) {
      if (/joao/.test(a || '')) print(document.getElementById('about-src') ? esc(document.getElementById('about-src').textContent || '') || T('o arquivo ainda está sendo digitado. role até Sobre.', 'still being typed. scroll to About.') : '', 'pre');
      else print(T(`cat: ${esc(a || '')}: arquivo não encontrado`, `cat: ${esc(a || '')}: no such file`), 'err');
    },
    stack() { print(`<span class="k">front</span>  Angular · React · JavaScript\n<span class="k">back</span>   C# · .NET · Node.js · SQL Server\n<span class="k">tools</span>  Docker · Git · Photoshop`, 'pre'); },
    email() { print(`<a class="s" href="mailto:joaopaulokuchiki@gmail.com">joaopaulokuchiki@gmail.com</a>  <span class="c">${T('clique para escrever', 'click to write')}</span>`); },
    lang(a) { const l = /en/.test(a) ? 'en' : /pt/.test(a) ? 'pt' : (isEN() ? 'pt' : 'en'); const b = document.querySelector(`[data-lang="${l}"]`); b && b.click(); print(l === 'en' ? 'language: english' : 'idioma: português'); },
    sudo(a) {
      if (/(contratar|hire|contrata)/i.test(a || '')) {
        print(T('[sudo] senha para visitante: ********', '[sudo] password for visitor: ********'));
        setTimeout(() => print(T('<span class="ok">permissão concedida.</span> abrindo um e-mail para o João…', '<span class="ok">access granted.</span> opening an email to João…')), 650);
        setTimeout(() => { stamp(); }, 1100);
        setTimeout(() => { location.href = 'mailto:joaopaulokuchiki@gmail.com?subject=' + encodeURIComponent(T('Vi seu portfólio (sudo contratar)', 'Saw your portfolio (sudo hire)')); }, 2300);
      } else if (/rm/.test(a || '')) run.rm(a);
      else print(T('visitante não está no arquivo sudoers. mas tente: sudo contratar', 'visitor is not in the sudoers file. but try: sudo hire'), 'err');
    },
    rm(a) { if (/-rf/.test(a || '')) { print(T('boa tentativa.', 'nice try.')); J.shown && say(T('ei! eu moro aqui.', 'hey! I live here.')); } else print('rm: ' + T('nada para apagar', 'nothing to remove'), 'err'); },
    clear() { out.innerHTML = ''; },
    exit() { closeTerm(); },
    cafe() { print('   ( (\n    ) )\n  ........\n  |      |]\n  \\      /\n   `----\'  ' + T('pausa de 5 min.', '5 minute break.'), 'pre'); },
    coffee() { run.cafe(); },
    date() { print(new Date().toLocaleString(isEN() ? 'en-US' : 'pt-BR')); },
    echo(a) { print(esc(a || '')); },
    history() { print(term.hist.map((h, i) => `${String(i + 1).padStart(3)}  ${esc(h)}`).join('\n') || '', 'pre'); },
    vim() { print(T('para sair: :q  de nada.', 'to quit: :q  you are welcome.')); },
    konami() { print(T('você sabe a sequência. ↑ ↑ ↓ ↓ ← → ← → B A, fora do terminal.', 'you know the sequence. ↑ ↑ ↓ ↓ ← → ← → B A, outside the terminal.')); }
  };
  run.ajuda = run.help; run.about = () => go('sobre'); run.contato = run.email; run.contact = run.email; run[':q'] = run.exit; run.quit = run.exit; run.sair = run.exit;

  function exec(line) {
    const raw = line.trim();
    print(`<span class="t-path">~</span> <span class="t-sign">$</span> ${esc(raw)}`, 'echo');
    if (!raw) return;
    term.hist.push(raw); term.hi = term.hist.length;
    const [cmd, ...rest] = raw.split(/\s+/);
    const f = run[cmd.toLowerCase()];
    if (f) f(rest.join(' '));
    else print(T(`comando não encontrado: ${esc(cmd)}. digite help`, `command not found: ${esc(cmd)}. type help`), 'err');
  }
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') { exec(input.value); input.value = ''; }
    else if (e.key === 'Escape') { closeTerm(); }
    else if (e.key === 'ArrowUp') { if (term.hi > 0) { term.hi--; input.value = term.hist[term.hi]; } e.preventDefault(); }
    else if (e.key === 'ArrowDown') { if (term.hi < term.hist.length) { term.hi++; input.value = term.hist[term.hi] || ''; } e.preventDefault(); }
    else if (e.key === 'Tab') {
      e.preventDefault();
      const v = input.value; const parts = v.split(/\s+/);
      const pool = parts.length > 1 ? (parts[0] === 'open' ? Object.keys(PROJ) : parts[0] === 'cd' ? Object.keys(SECS) : []) : CMDS;
      const hit = pool.filter(c => c.startsWith(parts[parts.length - 1]));
      if (hit.length === 1) { parts[parts.length - 1] = hit[0]; input.value = parts.join(' ') + ' '; }
      else if (hit.length > 1) print(hit.join('  '), 'pre dimmed');
    }
  });
  let lastFocus = null;
  function openTerm(cmd) {
    if (!term.open) {
      lastFocus = document.activeElement;
      tw.hidden = false; term.open = true;
      requestAnimationFrame(() => tw.classList.add('open'));
      if (!out.childElementCount) print(T('<span class="c">bem-vindo ao terminal do João. digite</span> help', '<span class="c">welcome to João\'s terminal. type</span> help'));
    }
    if (cmd) exec(cmd);
    setTimeout(() => input.focus({ preventScroll: true }), 30);
  }
  function closeTerm() {
    if (!term.open) return;
    term.open = false; tw.classList.remove("open"); input.blur();
    setTimeout(() => { if (!term.open) tw.hidden = true; }, 220);
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  window.JPY = { openTerm, closeTerm, say };
  document.querySelectorAll('[data-term]').forEach(b => b.addEventListener('click', e => { e.preventDefault(); openTerm(b.dataset.term || ''); }));

  /* the hanko, big, for sudo contratar */
  function stamp() {
    const s = el('div', { class: 'big-hanko', 'aria-hidden': 'true' });
    s.innerHTML = '<svg viewBox="0 0 64 64"><rect x="4" y="4" width="56" height="56" rx="6" fill="none" stroke="currentColor" stroke-width="3"/><rect x="9" y="9" width="46" height="46" rx="3" fill="none" stroke="currentColor" stroke-width="1"/><text x="32" y="44" text-anchor="middle" font-size="32" fill="currentColor" font-family="Kanji, serif">縁</text></svg>';
    document.body.appendChild(s);
    requestAnimationFrame(() => s.classList.add('in'));
    setTimeout(() => s.classList.add('out'), 1500);
    setTimeout(() => s.remove(), 2100);
  }

  /* =========================================================
     3. Shortcuts + Konami
     ========================================================= */
  const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  let kq = [], gWait = 0, typed = '';
  addEventListener('keydown', e => {
    const tag = (e.target && e.target.tagName) || '';
    if (/INPUT|TEXTAREA|SELECT/.test(tag) || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    kq.push(k); if (kq.length > KONAMI.length) kq.shift();
    if (kq.join() === KONAMI.join()) { kq = []; rain(); return; }
    typed = (typed + (k.length === 1 ? k : '')).slice(-4);
    if (typed === 'joao') { J.wave = 2; J.shown && say(T('esse sou eu. quer dizer, ele.', 'that is me. well, him.')); }
    if (k === '`' || e.code === 'Backquote') { e.preventDefault(); openTerm(); return; }
    if (k === '?') { e.preventDefault(); openTerm('help'); return; }
    if (k === 'g') { gWait = performance.now(); return; }
    if (performance.now() - gWait < 900) {
      const map = { s: 'sobre', p: 'projetos', h: 'habilidades', t: 'trajetoria', c: 'contato', i: 'top' };
      if (map[k]) { gWait = 0; const t = document.getElementById(map[k]); t && t.scrollIntoView({ behavior: moving() ? 'smooth' : 'auto' }); return; }
    }
    if (k === 't') { e.preventDefault(); openTerm(); return; }
    if (k === 'l') { const b = document.querySelector(`[data-lang="${isEN() ? 'pt' : 'en'}"]`); b && b.click(); }
  });

  /* keycap rain: 64 black keys fall, bounce, pile, and clear */
  let raining = false;
  function rain() {
    if (raining) return;
    J.wave = 2;
    if (J.shown) say(T('você achou. chuva de teclas!', 'you found it. keycap rain!'), 3000);
    if (window.__cube) window.__cube.spin(0.5);
    if (!moving()) return;
    raining = true;
    const cv = el('canvas', { class: 'rain', 'aria-hidden': 'true' });
    document.body.appendChild(cv);
    const dpr = Math.min(2, devicePixelRatio || 1);
    const W = innerWidth, H = innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    const c = cv.getContext('2d'); c.scale(dpr, dpr);
    const sz0 = W < 720 ? 30 : 40;
    const skirt = c.createLinearGradient(0, -sz0 / 2, 0, sz0 / 2); skirt.addColorStop(0, '#18191b'); skirt.addColorStop(1, '#030303');
    const top = c.createLinearGradient(0, -sz0 / 2, 0, sz0 / 2); top.addColorStop(0, '#222427'); top.addColorStop(1, '#0a0a0b');
    const LET = 'JOAOPAULOYUDIANGULAREACTJS{}<>;/'.split('');
    const sz = sz0;
    const keys = Array.from({ length: W < 720 ? 40 : 64 }, (_, i) => ({
      x: Math.random() * (W - sz) + sz / 2, y: -sz - Math.random() * H * 1.2, vy: Math.random() * 120, vx: (Math.random() - 0.5) * 60,
      r: (Math.random() - 0.5) * 1.2, vr: (Math.random() - 0.5) * 3, ch: LET[i % LET.length], floor: H - sz / 2 - Math.random() * sz * 2.2
    }));
    let t0 = performance.now(), lt = t0;
    function draw(now) {
      const dt = Math.min(0.04, (now - lt) / 1000); lt = now;
      const age = (now - t0) / 1000;
      c.clearRect(0, 0, W, H);
      const alpha = age > 4.2 ? Math.max(0, 1 - (age - 4.2) / 0.8) : 1;
      c.globalAlpha = alpha;
      for (const k of keys) {
        k.vy += 1800 * dt; k.y += k.vy * dt; k.x += k.vx * dt; k.r += k.vr * dt;
        if (k.y > k.floor) { k.y = k.floor; k.vy *= -0.32; k.vx *= 0.7; k.vr *= 0.5; if (Math.abs(k.vy) < 40) k.vy = 0; }
        c.save(); c.translate(k.x, k.y); c.rotate(k.r);
        const h = sz / 2;
        c.fillStyle = skirt; c.beginPath(); c.roundRect(-h, -h, sz, sz, 7); c.fill();
        c.strokeStyle = 'rgba(240,240,240,.55)'; c.lineWidth = 1; c.stroke();
        c.fillStyle = top; c.beginPath(); c.roundRect(-h + 5, -h + 3, sz - 10, sz - 11, 5); c.fill();
        c.strokeStyle = 'rgba(255,255,255,.85)'; c.beginPath(); c.moveTo(-h + 9, -h + 3.5); c.lineTo(h - 9, -h + 3.5); c.stroke();
        c.fillStyle = '#c9ccce'; c.font = `500 ${Math.round(sz * 0.28)}px 'JetBrains Mono', monospace`; c.textBaseline = 'top';
        c.fillText(k.ch, -h + 9, -h + 7);
        c.restore();
      }
      if (age < 5) requestAnimationFrame(draw); else { cv.remove(); raining = false; }
    }
    requestAnimationFrame(draw);
  }
  window.JPY.rain = rain; window.JPY.J = J;
})();
