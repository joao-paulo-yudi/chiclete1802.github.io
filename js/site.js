/* Sections: i18n, nav, reveals, and one live graphic per section. */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const isEN = () => root.classList.contains('lang-en');
  const T = (pt, en) => (isEN() ? en : pt);
  const moving = () => !window.Motion || window.Motion.moving;
  const clamp01 = v => Math.max(0, Math.min(1, v));
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------- widget registry: one rAF for every section loop ---------- */
  const widgets = [];
  function widget(el, w) {
    w.el = el; w.visible = false;
    new IntersectionObserver(es => {
      w.visible = es[es.length - 1].isIntersecting;
      if (w.visible && !w.started) { w.started = true; w.start && w.start(); }
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.15 }).observe(el);
    widgets.push(w);
    return w;
  }
  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    // one thing moves at a time: of the visible live windows, only the one nearest the centre runs
    let lead = null, best = 1e9;
    for (const w of widgets) {
      if (!w.visible) continue;
      const r = w.el.getBoundingClientRect(), d = Math.abs(r.top + r.height / 2 - innerHeight / 2);
      if (d < best) { best = d; lead = w; }
    }
    for (const w of widgets) {
      if (w.scroll) w.scroll();
      if (!w.visible || !w.started || w !== lead) continue;
      if (moving()) w.tick && w.tick(dt);
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  // simple sequencer: a list of [delaySeconds, fn] steps that repeats
  function seq(steps) {
    let i = 0, wait = 0;
    return {
      tick(dt) { wait -= dt; let guard = 0; while (wait <= 0 && guard++ < 20) { const [d, fn] = steps[i]; fn && fn(); i = (i + 1) % steps.length; wait += d; } },
      reset() { i = 0; wait = 0; }
    };
  }

  /* ---------- language ---------- */
  function setLang(l) {
    root.classList.toggle('lang-en', l === 'en');
    root.lang = l === 'en' ? 'en' : 'pt-BR';
    try { localStorage.setItem('jpy-lang', l); } catch (e) {}
    $$('.lang button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === l)));
    widgets.forEach(w => w.lang && w.lang());
  }
  $$('.lang button').forEach(b => b.addEventListener('click', () => setLang(b.dataset.lang)));
  $$('.lang button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === (isEN() ? 'en' : 'pt'))));

  /* ---------- in-page links glide (instant in Off) ---------- */
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href').slice(1);
    const t = id === 'top' ? document.body : document.getElementById(id);
    if (!t) return;
    e.preventDefault();
    const y = id === 'top' ? 0 : t.getBoundingClientRect().top + scrollY - (id === 'contato' || id === 'sobre' ? 0 : 0);
    scrollTo({ top: y, behavior: moving() ? 'smooth' : 'auto' });
    history.replaceState(null, '', '#' + id);
  });

  /* ---------- phones: the motion pill steps aside while scrolling ---------- */
  // the motion switch docks into the nav, so it never sits on content
  const dock = () => { const pill = $('.ms-pill'), host = $('.nav-r'); if (pill && host && pill.parentElement !== host) host.insertBefore(pill, host.firstChild); };
  dock(); setTimeout(dock, 0); document.addEventListener('DOMContentLoaded', dock);

  /* ---------- nav ---------- */
  const nav = $('#nav');
  const navLinks = $$('.links a');
  addEventListener('scroll', () => nav.classList.toggle('scrolled', scrollY > 24), { passive: true });
  const secIO = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) navLinks.forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  $$('main .sec').forEach(s => secIO.observe(s));

  /* ---------- reveals ---------- */
  const revealEls = $$('.sec .sec-head > *, .sec .col-copy > *, .sec .win, .proj-copy > *, .card, .graph, .more-head');
  revealEls.forEach(el => el.classList.add('reveal'));
  const rIO = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const sibs = [...e.target.parentElement.children].filter(c => c.classList.contains('reveal'));
    e.target.style.transitionDelay = (Math.max(0, sibs.indexOf(e.target)) * 0.08).toFixed(2) + 's';
    e.target.classList.add('in');
    rIO.unobserve(e.target);
  }), { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  revealEls.forEach(el => rIO.observe(el));

  /* ---------- window tabs ---------- */
  $$('.win-app').forEach(win => {
    const tabs = $$('.tabs button', win);
    tabs.forEach(b => b.addEventListener('click', () => {
      tabs.forEach(t => t.setAttribute('aria-selected', String(t === b)));
      $$('[data-pane]', win).forEach(p => { p.hidden = p.dataset.pane !== b.dataset.tab; });
    }));
  });

  /* =========================================================
     1. SOBRE · joao.ts types itself
     ========================================================= */
  (function about() {
    const out = $('#about-src');
    if (!out) return;
    const tokens = () => {
      const k = t => ['k', t], s = t => ['s', '"' + t + '"'], p = t => ['p', t], n = t => ['n', t], c = t => ['c', t], x = t => ['', t];
      return [
        k('const '), x('joao'), p(' = {\n'),
        x('  nome'), p(': '), s('João Paulo Yudi'), p(',\n'),
        x('  cargo'), p(': '), s(T('Desenvolvedor front-end', 'Front-end developer')), p(',\n'),
        x('  agora'), p(': '), s('Full-Stack @ Von Braun Labs'), p(',\n'),
        x('  stack'), p(': ['), s('Angular'), p(', '), s('React'), p(', '), s('JavaScript'), p('],\n'),
        x('  backend'), p(': ['), s('C#'), p(', '), s('.NET'), p(', '), s('Node.js'), p(', '), s('SQL Server'), p('],\n'),
        x('  formacao'), p(': [\n'),
        p('    '), s(T('Ciência da Computação · IFSP · 12/2026', 'Computer Science · IFSP · 12/2026')), p(',\n'),
        p('    '), s(T('Desenv. de Sistemas · Etec · 11/2022', 'Systems Development · Etec · 11/2022')), p(',\n'),
        p('  ],\n'),
        x('  idiomas'), p(': ['), s(T('português', 'Portuguese')), p(', '), s(T('inglês', 'English')), p('],\n'),
        x('  deuAula'), p(': '), n('true'), p(', '), c(T('// inglês e informática\n', '// English and computing\n')),
        p('};\n\n'),
        k('export default '), x('joao'), p(';')
      ];
    };
    let shown = 0, total = 0, toks = tokens();
    total = toks.reduce((a, t) => a + t[1].length, 0);
    function render(nChars) {
      // typed text sits over a faint ghost of the whole file, so the window is never empty
      let left = nChars, html = '', ghost = '';
      for (const [cls, txt] of toks) {
        const part = left > 0 ? txt.slice(0, left) : '';
        const rest = txt.slice(part.length);
        left -= txt.length;
        if (part) html += cls ? `<span class="${cls}">${esc(part)}</span>` : esc(part);
        if (rest) ghost += esc(rest);
      }
      out.innerHTML = html + '<span class="caret"></span>' + (ghost ? `<span class="ghost">${ghost}</span>` : '');
    }
    const w = widget($('#about-code'), {
      start() { if (!moving()) { shown = total; render(total); } },
      tick(dt) { if (shown >= total) return; shown = Math.min(total, shown + dt * 260); render(Math.floor(shown)); },
      lang() { toks = tokens(); total = toks.reduce((a, t) => a + t[1].length, 0); if (shown >= total - 40 || !moving()) shown = total; render(Math.floor(shown)); }
    });
    render(0);
    if (window.Motion) Motion.on(m => { if (m === 'off' && w.started) { shown = total; render(total); } });
  })();

  /* =========================================================
     2a. STUDYENEM · answer, score, recommend
     ========================================================= */
  (function study() {
    const el = $('#ui-study');
    if (!el) return;
    const AREAS = [['hum', 'Ciências Humanas', 'Humanities'], ['lin', 'Linguagens', 'Languages'], ['nat', 'Ciências da Natureza', 'Natural Sciences'], ['mat', 'Matemática', 'Mathematics']];
    const score = { hum: 88, lin: 81, nat: 59, mat: 50 };
    const QS = [
      { area: 'mat', n: 37, q: ['Uma caixa d’água de 2 000 L perde 4% do volume por dia. Quanto resta após 2 dias?', 'A 2,000 L water tank loses 4% of its volume per day. How much is left after 2 days?'],
        a: ['1 840 L', '1 843,2 L', '1 920 L', '1 600 L', '1 880 L'], right: 1, pick: 0, d: -2 },
      { area: 'lin', n: 12, q: ['Em “Mal chegou, já saiu”, a palavra “mal” indica:', 'In “Mal chegou, já saiu”, the word “mal” expresses:'],
        a: [['tempo', 'time'], ['modo', 'manner'], ['intensidade', 'intensity'], ['causa', 'cause'], ['negação', 'negation']], right: 0, pick: 0, d: 1 },
      { area: 'nat', n: 98, q: ['Qual organela é responsável pela respiração celular?', 'Which organelle carries out cellular respiration?'],
        a: [['Ribossomo', 'Ribosome'], ['Mitocôndria', 'Mitochondrion'], ['Lisossomo', 'Lysosome'], ['Complexo de Golgi', 'Golgi apparatus'], ['Núcleo', 'Nucleus']], right: 1, pick: 1, d: 2 },
      { area: 'mat', n: 41, q: ['Se 3x + 5 = 20, então x vale:', 'If 3x + 5 = 20, then x equals:'], a: ['3', '4', '5', '6', '15'], right: 2, pick: 2, d: 3 }
    ];
    let qi = 0, hover = -1, state = 'idle';
    const areaName = id => { const a = AREAS.find(x => x[0] === id); return T(a[1], a[2]); };
    const lowest = () => Object.entries(score).sort((a, b) => a[1] - b[1])[0][0];
    function build() {
      const Q = QS[qi];
      const alts = Q.a.map((a, i) => {
        const txt = Array.isArray(a) ? T(a[0], a[1]) : a;
        let cls = 'alt';
        if (state === 'hover' && i === hover) cls += ' pick';
        if (state === 'result') { if (i === Q.right) cls += ' right'; else if (i === Q.pick) cls += ' wrong'; }
        return `<div class="${cls}"><b>${'ABCDE'[i]}</b>${esc(txt)}</div>`;
      }).join('');
      const low = lowest();
      el.innerHTML = `
        <div class="q">
          <div class="q-k"><span>${esc(areaName(Q.area))} · ${T('questão', 'question')} ${Q.n}</span><span>${T('simulado', 'exam')} 9</span></div>
          <div class="q-t">${esc(T(Q.q[0], Q.q[1]))}</div>
          ${alts}
        </div>
        <div class="side">
          <div class="card-mini">
            <div class="q-k"><span>${T('desempenho por área', 'score by area')}</span></div>
            ${AREAS.map(([id]) => `<div class="bar"><span>${esc(areaName(id))}</span><span class="n ${id === low ? 'low' : ''}">${score[id]}%</span><span class="track"><span class="fill ${id === low ? 'low' : ''}" style="transform:scaleX(${score[id] / 100})"></span></span></div>`).join('')}
          </div>
          <div class="card-mini tip"><span class="mono">${T('recomendação', 'recommendation')}</span>${T('Foque em', 'Focus on')} ${esc(areaName(low))}: ${score[low]}% ${T('de acerto. Plano de estudo atualizado.', 'correct. Study plan updated.')}</div>
        </div>`;
    }
    const s = seq([
      [0.7, () => { state = 'hover'; hover = 0; build(); }],
      [0.45, () => { hover = 1; build(); }],
      [0.45, () => { hover = 2; build(); }],
      [0.6, () => { hover = QS[qi].pick; build(); }],
      [1.3, () => { state = 'result'; const Q = QS[qi]; score[Q.area] = Math.max(0, Math.min(100, score[Q.area] + Q.d)); build(); }],
      [2.2, () => {}],
      [0.01, () => { qi = (qi + 1) % QS.length; state = 'idle'; hover = -1; build(); }]
    ]);
    function still() { qi = 0; state = 'result'; build(); }
    widget(el.closest('.win'), { start() { moving() ? build() : still(); }, tick: dt => s.tick(dt), lang: build });
    still();
    if (window.Motion) Motion.on(m => { if (m === 'off') still(); });
  })();

  /* =========================================================
     2b. EASYLAND MES · production orders flow
     ========================================================= */
  (function mes() {
    const el = $('#ui-mes');
    if (!el) return;
    const NAMES = [
      ['OP-39325', 'Esteira mult. 1M', 'Multi conveyor 1M'], ['OP-39366', 'Kit sensor ultrassônico', 'Ultrasonic sensor kit'],
      ['OP-39367', 'Master 5500 DH', 'Master 5500 DH'], ['OP-39368', 'Car. tras. master', 'Rear carriage, master'],
      ['OP-39369', 'Prot. distribuidor de adubo', 'Fertiliser spreader guard'], ['OP-39370', 'Cubo compl. do disco', 'Disc hub assembly'],
      ['OP-39371', 'Grade niveladora', 'Levelling harrow'], ['OP-39372', 'Suporte do eixo', 'Axle bracket']
    ];
    let seqN = 0;
    const mk = (lane) => { const [id, pt, en] = NAMES[seqN % NAMES.length]; seqN++; return { id: id.replace(/\d+$/, d => String(+d + Math.floor((seqN - 1) / NAMES.length) * 10)), pt, en, lane, prog: 0, qty: 200 + ((seqN * 137) % 6) * 50 }; };
    let ops = [mk('plan'), mk('plan'), mk('plan'), mk('run'), mk('run'), mk('done')];
    ops[3].prog = 0.55; ops[4].prog = 0.2; ops[5].prog = 1;
    const kpi = { plan: 2584, ontime: 1181, late: 1409, doneToday: 37 };
    el.innerHTML = `
      <div class="kpis">
        <div class="kpi"><div class="q-k"><span>${'<span class="pt">OPs ativas</span><span class="en">active orders</span>'}</span><i class="dot" style="background:var(--info)"></i></div><div class="kpi-v" data-k="run">0</div></div>
        <div class="kpi"><div class="q-k"><span><span class="pt">planejadas</span><span class="en">planned</span></span></div><div class="kpi-v" data-k="plan">0</div></div>
        <div class="kpi"><div class="q-k"><span><span class="pt">no prazo</span><span class="en">on time</span></span><i class="dot dot-ok"></i></div><div class="kpi-v" data-k="ontime">0</div></div>
        <div class="kpi"><div class="q-k"><span><span class="pt">concluídas hoje</span><span class="en">done today</span></span></div><div class="kpi-v" data-k="doneToday">0</div></div>
      </div>
      <div class="lanes">
        <div class="lane" data-lane="plan"><div class="lane-h"><i class="dot"></i><span class="pt">Planejada</span><span class="en">Planned</span></div></div>
        <div class="lane" data-lane="run"><div class="lane-h"><i class="dot" style="background:var(--info)"></i><span class="pt">Em execução</span><span class="en">Running</span></div></div>
        <div class="lane" data-lane="done"><div class="lane-h"><i class="dot dot-ok"></i><span class="pt">Concluída</span><span class="en">Done</span></div></div>
      </div>`;
    const lanes = Object.fromEntries($$('.lane', el).map(l => [l.dataset.lane, l]));
    const nodes = new Map();
    function card(o) {
      let n = nodes.get(o);
      if (!n) {
        n = document.createElement('div'); n.className = 'op';
        n.innerHTML = `<div class="op-h"><span>${o.id}</span><span class="op-q"></span></div><div class="op-n"><span class="pt">${esc(o.pt)}</span><span class="en">${esc(o.en)}</span></div><div class="op-bar"><i></i></div>`;
        nodes.set(o, n);
      }
      const q = Math.round(o.prog * o.qty / 5) * 5;
      if (q !== o.shownQ) {
        o.shownQ = q;
        n.classList.toggle('done', o.lane === 'done');
        $('.op-q', n).textContent = `${q}/${o.qty}`;
        $('.op-bar i', n).style.transform = `scaleX(${(q / o.qty).toFixed(3)})`;
      }
      return n;
    }
    function place(o, animate) {
      const n = card(o);
      if (n.parentElement !== lanes[o.lane]) {
        if (animate) n.classList.add('enter');
        lanes[o.lane].insertBefore(n, lanes[o.lane].children[1] || null);
        if (animate) requestAnimationFrame(() => requestAnimationFrame(() => n.classList.remove('enter')));
      }
    }
    function kpis() {
      const run = ops.filter(o => o.lane === 'run').length;
      $$('.kpi-v', el).forEach(v => { const k = v.dataset.k; v.textContent = (k === 'run' ? run : kpi[k]).toLocaleString(isEN() ? 'en-US' : 'pt-BR'); });
    }
    ops.forEach(o => place(o, false)); kpis();
    let acc = 0;
    function tick(dt) {
      acc += dt;
      ops.filter(o => o.lane === 'run').forEach(o => {
        o.prog = Math.min(1, o.prog + dt * 0.16);
        card(o);
        if (o.prog >= 1) { o.lane = 'done'; o.shownQ = -1; card(o); place(o, true); kpi.doneToday++; kpi.ontime++; kpis(); }
      });
      if (acc > 2.6) {
        acc = 0;
        const next = ops.filter(o => o.lane === 'plan').pop();
        if (next && ops.filter(o => o.lane === 'run').length < 3) { next.lane = 'run'; next.prog = 0; place(next, true); kpi.plan--; ops.push(mk('plan')); place(ops[ops.length - 1], true); kpis(); }
        const done = ops.filter(o => o.lane === 'done');
        if (done.length > 2) { const old = done[0]; const n = nodes.get(old); n.classList.add('leave'); setTimeout(() => { n.remove(); nodes.delete(old); }, 500); ops = ops.filter(o => o !== old); }
      }
    }
    widget(el.closest('.win'), { tick, lang: kpis });
  })();

  /* =========================================================
     2c. CHAMADOPRO · a ticket's life
     ========================================================= */
  (function tickets() {
    const el = $('#ui-tix');
    if (!el) return;
    el.innerHTML = ['open', 'doing', 'done'].map(c => `<div class="col" data-col="${c}"><div class="lane-h"><i class="dot" style="background:${c === 'open' ? 'var(--mute-2)' : c === 'doing' ? 'var(--info)' : 'var(--ok)'}"></i>${
      c === 'open' ? '<span class="pt">Aberto</span><span class="en">Open</span>' : c === 'doing' ? '<span class="pt">Em andamento</span><span class="en">In progress</span>' : '<span class="pt">Resolvido</span><span class="en">Resolved</span>'}</div></div>`).join('');
    const cols = Object.fromEntries($$('.col', el).map(c => [c.dataset.col, c]));
    const POOL = [
      ['Impressora do RH offline', 'HR printer offline', 'high'], ['Sem acesso à VPN', 'No VPN access', 'crit'],
      ['E-mail não sincroniza', 'Email not syncing', 'med'], ['Notebook não liga', 'Laptop won’t boot', 'high'],
      ['Sistema de ponto lento', 'Time-clock app is slow', 'med'], ['Servidor de arquivos fora', 'File server down', 'crit']
    ];
    const SLA = { crit: 120, high: 240, med: 480 };
    let id = 1041, pi = 0, list = [];
    function newTicket() {
      const [pt, en, pr] = POOL[pi++ % POOL.length];
      return { id: '#' + (id++), pt, en, pr, sla: SLA[pr], lvl: 1, col: 'open', age: 0 };
    }
    function prLabel(pr) { return pr === 'crit' ? T('CRÍTICA', 'CRITICAL') : pr === 'high' ? T('ALTA', 'HIGH') : T('MÉDIA', 'MEDIUM'); }
    const fmt = m => { m = Math.max(0, Math.round(m)); return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
    function render(t) {
      if (!t.node) { t.node = document.createElement('div'); t.node.className = 'tk enter'; t.key = ''; }
      const n = t.node;
      const slaTxt = t.col === 'done' ? 'ok' : fmt(t.sla);
      const key = [t.col, t.lvl, slaTxt, isEN()].join('|');
      if (key !== t.key) {
        t.key = key;
        n.classList.toggle('hot', t.col === 'doing');
        const sla = t.col === 'done' ? `<span class="sla" style="color:var(--ok)">${T('SLA ok', 'SLA met')}</span>` : `<span class="sla ${t.sla < 60 ? 'warn' : ''}">${slaTxt}</span>`;
        n.innerHTML = `<div class="tk-h"><span>${t.id}</span>${sla}</div><div class="tk-t">${esc(T(t.pt, t.en))}</div>
        <div class="tk-m"><span class="badge ${t.pr === 'crit' ? 'crit' : t.pr === 'high' ? 'high' : ''}">${prLabel(t.pr)}</span><span class="badge lvl">N${t.lvl}</span></div>`;
      }
      if (n.parentElement !== cols[t.col]) {
        n.classList.add('enter');
        cols[t.col].insertBefore(n, cols[t.col].children[1] || null);
        requestAnimationFrame(() => requestAnimationFrame(() => n.classList.remove('enter')));
      }
    }
    // a believable starting board
    list = [newTicket(), newTicket(), newTicket(), newTicket(), newTicket(), newTicket()];
    list[0].col = 'done'; list[1].col = 'done'; list[2].col = 'doing'; list[2].sla = 95; list[3].col = 'doing'; list[3].lvl = 2; list[3].sla = 40;
    list.forEach(render);
    function relang() { list.forEach(render); }
    // a steady conveyor: two open, two in progress, two resolved, always
    let step = 2.4;
    function tick(dt) {
      step -= dt;
      for (const t of list) {
        if (t.col === 'done') continue;
        t.sla -= dt * 9;
        t.age += dt;
        if (t.col === 'doing' && t.lvl === 1 && t.age > 1.4 && t.pr !== 'med') t.lvl = 2;
        render(t);
      }
      if (step <= 0) {
        step = 2.4;
        const by = c => list.filter(t => t.col === c);
        const old = by('done')[0];
        if (old) { old.node.classList.add('leave'); setTimeout(() => old.node.remove(), 500); list = list.filter(t => t !== old); }
        const d = by('doing')[0]; if (d) { d.col = 'done'; render(d); }
        const o = by('open')[0]; if (o) { o.col = 'doing'; o.age = 0; render(o); }
        const n = newTicket(); list.push(n); render(n);
      }
    }
    widget(el.closest('.win'), { tick, lang: relang });
  })();

  /* =========================================================
     3. HABILIDADES · skills wired to projects
     ========================================================= */
  (function graph() {
    const svg = $('#graph-svg'), cap = $('#graph-cap');
    if (!svg) return;
    const NS = 'http://www.w3.org/2000/svg';
    const SK = ['Angular', 'React', 'Java', 'C# · .NET', 'SQL Server', 'HTML · CSS', 'JavaScript', 'Node.js', 'SQLite', 'WordPress'];
    const PR = ['Easyland MES', 'ChamadoPro', 'StudyEnem', ['Controle de Estoque', 'Inventory Control'], 'Sanitas', 'Quiz Tech', 'Reluzi'];
    const E = [[0, 0], [0, 1], [0, 2], [1, 0], [2, 1], [3, 2], [3, 3], [4, 3], [5, 4], [6, 4], [6, 5], [7, 5], [8, 5], [9, 6]];
    const TOOLS = ['Git', 'Docker', 'Photoshop'];
    let mob = false, edges = [], skillNodes = [], projNodes = [], active = 0, hoverLock = false, pulses = [];
    const pname = p => Array.isArray(p) ? T(p[0], p[1]) : p;
    function node(x, y, w, label, cls) {
      const g = document.createElementNS(NS, 'g'); g.setAttribute('class', 'g-node ' + cls);
      g.setAttribute('transform', `translate(${x},${y})`);
      const r = document.createElementNS(NS, 'rect'); r.setAttribute('x', 0); r.setAttribute('y', -16); r.setAttribute('width', w); r.setAttribute('height', 32); r.setAttribute('rx', 6);
      const t = document.createElementNS(NS, 'text'); t.setAttribute('x', 14); t.setAttribute('y', 4.5); t.textContent = label;
      g.append(r, t); svg.appendChild(g); return g;
    }
    function build() {
      svg.textContent = '';
      mob = svg.clientWidth < 600;
      const W = mob ? 430 : 1000, rowS = mob ? 40 : 40, H = SK.length * rowS + 40;
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      const sx = 0, sw = mob ? 140 : 190, px = mob ? 250 : 760, pw = mob ? 180 : 240;
      const sy = i => 36 + i * rowS;
      const py = i => 36 + (SK.length - 1) * rowS * (i / (PR.length - 1));
      const head = (x, txt) => { const t = document.createElementNS(NS, 'text'); t.setAttribute('class', 'g-col'); t.setAttribute('x', x); t.setAttribute('y', 0); t.textContent = txt; svg.appendChild(t); };
      head(0, T('habilidade', 'skill')); head(px, T('projeto', 'project'));
      edges = E.map(([s, p]) => {
        const path = document.createElementNS(NS, 'path');
        const x1 = sx + sw, y1 = sy(s), x2 = px, y2 = py(p), mx = (x1 + x2) / 2;
        path.setAttribute('d', `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`);
        path.setAttribute('class', 'g-edge');
        svg.appendChild(path);
        return { s, p, path, len: 0 };
      });
      skillNodes = SK.map((s, i) => { const g = node(sx, sy(i), sw, s, 'skill'); g.addEventListener('mouseenter', () => { hoverLock = true; pick(i); }); g.addEventListener('mouseleave', () => { hoverLock = false; }); g.addEventListener('click', () => pick(i)); return g; });
      projNodes = PR.map((p, i) => node(px, py(i), pw, pname(p), 'proj'));
      // tools: a quiet row with no wires
      const ty = H - 2;
      const tl = document.createElementNS(NS, 'text'); tl.setAttribute('class', 'g-col'); tl.setAttribute('x', 0); tl.setAttribute('y', ty + 30); tl.textContent = T('ferramentas', 'tools'); svg.appendChild(tl);
      TOOLS.forEach((t, i) => mob ? node(i * 140, ty + 62, 126, t, 'tool') : node(130 + i * 150, ty + 26, 130, t, 'tool'));
      svg.setAttribute('viewBox', `0 -24 ${W} ${H + (mob ? 110 : 70)}`);
      edges.forEach(e => { e.len = e.path.getTotalLength(); e.path.style.strokeDasharray = e.len; e.path.style.strokeDashoffset = drawn ? 0 : e.len; });
      pulses = [];
      pick(active, true);
    }
    let drawn = false;
    function pick(i, silent) {
      active = i;
      skillNodes.forEach((g, k) => g.classList.toggle('on', k === i));
      const ps = new Set();
      edges.forEach(e => { const on = e.s === i; e.path.classList.toggle('on', on); if (on) ps.add(e.p); });
      projNodes.forEach((g, k) => g.classList.toggle('on', ps.has(k)));
      cap.innerHTML = `<b>${esc(SK[i])}</b> → ${[...ps].map(k => esc(pname(PR[k]))).join(', ')}`;
      // pulses along lit edges
      pulses.forEach(p => p.c.remove());
      pulses = edges.filter(e => e.s === i).map(e => { const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle'); c.setAttribute('r', 3); c.setAttribute('class', 'g-pulse'); svg.appendChild(c); return { e, c, t: 0 }; });
      if (!moving()) pulses.forEach(p => { const pt = p.e.path.getPointAtLength(p.e.len); p.c.setAttribute('cx', pt.x); p.c.setAttribute('cy', pt.y); });
    }
    let cycle = 0;
    const w = widget($('#graph'), {
      start() {
        drawn = true;
        edges.forEach((e, k) => { e.path.style.transition = `stroke-dashoffset 1.1s cubic-bezier(.16,1,.3,1) ${(k * 0.05).toFixed(2)}s, stroke .35s`; e.path.style.strokeDashoffset = 0; });
      },
      tick(dt) {
        if (!hoverLock) { cycle += dt; if (cycle > 2.6) { cycle = 0; pick((active + 1) % SK.length); } }
        pulses.forEach(p => { p.t = (p.t + dt * 0.7) % 1; const pt = p.e.path.getPointAtLength(p.t * p.e.len); p.c.setAttribute('cx', pt.x); p.c.setAttribute('cy', pt.y); });
      },
      lang: build
    });
    build();
    let rw = svg.clientWidth;
    new ResizeObserver(() => { if (Math.abs(svg.clientWidth - rw) > 40) { rw = svg.clientWidth; build(); } }).observe(svg);
    if (window.Motion) Motion.on(m => { if (m === 'off') { drawn = true; edges.forEach(e => { e.path.style.transition = 'none'; e.path.style.strokeDashoffset = 0; }); pick(0); } });
  })();

  /* =========================================================
     4. TRAJETÓRIA · git log --graph, drawn by the scroll
     ========================================================= */
  (function git() {
    const ol = $('#git');
    if (!ol) return;
    // lane 0 = main (work), lane 1 = school branches. Newest first, like git log.
    const ROWS = [
      { lane: 1, hash: '5a7e210', ref: 'ifsp', pt: ['Ciência da Computação, IFSP', 'conclusão prevista 12/2026, em andamento'], en: ['Computer Science, IFSP', 'expected 12/2026, in progress'], rails: [0, 1] },
      { lane: 0, hash: '7d41b0a', ref: 'HEAD -> main', head: true, pt: ['Desenvolvedor Full-Stack', 'Von Braun Labs · 2025'], en: ['Full-Stack Developer', 'Von Braun Labs · 2025'], rails: [0, 1] },
      { lane: 0, hash: 'c2e9a11', pt: ['Estagiário de TI', 'Jungux Tecnologia · 2024'], en: ['IT Intern', 'Jungux Tecnologia · 2024'], rails: [0, 1] },
      { lane: 0, hash: '9b03f4e', pt: ['Professor de Informática', 'Microlins · 2023'], en: ['Computing Teacher', 'Microlins · 2023'], rails: [0], fork: true },
      { lane: 0, hash: '1f8c3d2', ref: 'etec', merge: true, pt: ['Merge: Técnico em Desenvolvimento de Sistemas', 'Etec Fernando Prestes · 11/2022'], en: ['Merge: Systems Development technical degree', 'Etec Fernando Prestes · 11/2022'], rails: [0] },
      { lane: 0, hash: '3c6b9a0', pt: ['Professor de Inglês', 'Via Certa · 2022'], en: ['English Teacher', 'Via Certa · 2022'], rails: [0, 1] },
      { lane: 0, hash: 'e41d07b', pt: ['Assistente de Marketing Digital', 'Kazza Art · 2022 · primeiro commit'], en: ['Digital Marketing Assistant', 'Kazza Art · 2022 · first commit'], rails: [0], first: true, etecFork: true }
    ];
    const X = [14, 38];
    function rail(r) {
      // draws the lanes that pass through this row, the dot, and any fork/merge curves
      const h = 64, cy = 11;
      let s = `<svg viewBox="0 0 54 ${h}" preserveAspectRatio="none" aria-hidden="true">`;
      const line = (x, y1, y2, c) => `<line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" stroke="${c}" stroke-width="1.5" ${c === '#a1a4a5' ? 'stroke-dasharray="3 3"' : ''} vector-effect="non-scaling-stroke"/>`;
      const main = '#6e727a', branch = '#a1a4a5', etec = '#464a4d';
      // main lane
      s += line(X[0], r.hash === ROWS[1].hash || r === ROWS[0] ? (r === ROWS[0] ? cy : cy) : 0, r.first ? cy : h, main);
      if (r === ROWS[0]) s = s.replace(line(X[0], cy, h, main), line(X[0], cy + 6, h, main));
      // branch lane
      if (r === ROWS[0]) s += line(X[1], cy, h, branch);
      else if (r === ROWS[1] || r === ROWS[2]) s += line(X[1], 0, h, branch);
      if (r.fork) s += `<path d="M${X[0]},${h} C${X[0]},${h - 26} ${X[1]},${h - 30} ${X[1]},0" fill="none" stroke="${branch}" stroke-width="1.5" stroke-dasharray="3 3" vector-effect="non-scaling-stroke"/>`;
      if (r.merge) s += `<path d="M${X[1]},${h} C${X[1]},${cy + 20} ${X[0]},${cy + 14} ${X[0]},${cy}" fill="none" stroke="${etec}" stroke-width="1.5" vector-effect="non-scaling-stroke"/>`;
      if (r === ROWS[5]) s += line(X[1], 0, h, etec);
      if (r.etecFork) s += `<path d="M${X[0]},${cy} C${X[0]},${cy + 20} ${X[1]},${cy + 10} ${X[1]},0" fill="none" stroke="${etec}" stroke-width="1.5" vector-effect="non-scaling-stroke"/>`;
      const dx = X[r.lane];
      const col = r.lane ? branch : r.head ? '#ffffff' : '#a1a4a5';
      // nodes live in their own fixed-height svg so they stay round when a row grows
      let n = `<svg class="nodes" viewBox="0 0 54 22" aria-hidden="true"><circle cx="${dx}" cy="${cy}" r="${r.merge ? 5 : 4.5}" fill="#000" stroke="${col}" stroke-width="1.5"/>`;
      if (r.head) n += `<circle cx="${dx}" cy="${cy}" r="2" fill="${col}"/>`;
      return s + '</svg>' + n + '</svg>';
    }
    function build() {
      ol.innerHTML = ROWS.map((r, i) => {
        const [a, b] = isEN() ? r.en : r.pt;
        const ref = r.ref ? `<span class="ref ${r.head ? 'is-head' : ''}">(${esc(r.ref)})</span> ` : '';
        return `<li data-i="${i}"><span class="rail">${rail(r)}</span><span class="hash">${r.hash}</span><span class="msg">${ref}${esc(a)}<small>${esc(b)}</small></span></li>`;
      }).join('');
      paint(true);
    }
    let shownN = -1;
    function paint(force) {
      const lis = $$('li', ol);
      const r = ol.getBoundingClientRect();
      // reveal oldest first (bottom of the list) as the list rises through the viewport
      const p = moving() ? clamp01((innerHeight * 0.95 - r.top) / (r.height * 0.55)) : 1;
      const n = Math.round(p * lis.length * 1.15);
      if (n === shownN && !force) return;
      shownN = n;
      lis.forEach((li, i) => li.classList.toggle('in', lis.length - 1 - i < n));
    }
    widget($('.win-git'), { scroll: () => paint(false), lang: build });
    build();
    if (window.Motion) Motion.on(() => paint(true));
  })();

  /* =========================================================
     5. CONTATO · write, send, stamp
     ========================================================= */
  (function mail() {
    const from = $('#m-from'), subj = $('#m-subj'), body = $('#m-body'), status = $('#m-status'), st = $('#m-status-t'), hanko = $('#hanko');
    if (!from) return;
    const MSGS = [
      { f: ['recrutamento@empresa.com.br', 'talent@company.com'], s: ['Vaga de front-end', 'Front-end role'], b: ['Oi, João! Vimos o StudyEnem e o Easyland MES.\nVocê tem 20 minutos esta semana para uma conversa?', 'Hi João! We saw StudyEnem and Easyland MES.\nDo you have 20 minutes this week for a call?'] },
      { f: ['contato@fabrica.ind.br', 'ops@factory.com'], s: ['Freela: painel de produção', 'Freelance: production dashboard'], b: ['Precisamos de um painel em React para o chão de fábrica.\nBora conversar?', 'We need a React dashboard for the factory floor.\nCan we talk?'] },
      { f: ['dev@startup.io', 'dev@startup.io'], s: ['Sobre o cubo', 'About the cube'], b: ['Girei o cubo umas dez vezes.\nComo você fez o teclado digitar sozinho?', 'I spun the cube about ten times.\nHow did you get the keyboard to type by itself?'] }
    ];
    let mi = 0, typed = 0, phase = 'hold', wait = 2.6;
    const full = () => { const m = MSGS[mi]; return { f: T(m.f[0], m.f[1]), s: T(m.s[0], m.s[1]), b: T(m.b[0], m.b[1]) }; };
    function show(n) {
      const m = full(); let left = n;
      const take = str => { const part = str.slice(0, Math.max(0, left)); left -= str.length; return part; };
      from.textContent = take(m.f); subj.textContent = take(m.s); body.textContent = take(m.b);
    }
    function setStatus(kind) {
      status.className = 'status ' + (kind || '');
      st.textContent = kind === 'sending' ? T('enviando…', 'sending…') : kind === 'sent' ? T('entregue', 'delivered') : T('rascunho', 'draft');
      hanko.classList.toggle('on', kind === 'sent');
    }
    function still() { mi = 0; const m = full(); show(m.f.length + m.s.length + m.b.length); setStatus('sent'); phase = 'type'; typed = 0; }
    function tick(dt) {
      wait -= dt;
      if (wait > 0) return;
      const m = full(), total = m.f.length + m.s.length + m.b.length;
      if (phase === 'type') {
        if (typed === 0) setStatus('');
        typed = Math.min(total, typed + 3); show(typed);
        wait = 0.03;
        if (typed >= total) { phase = 'send'; wait = 0.9; }
      } else if (phase === 'send') { setStatus('sending'); phase = 'sent'; wait = 1.1; }
      else if (phase === 'sent') { setStatus('sent'); phase = 'hold'; wait = 5.5; }
      else { mi = (mi + 1) % MSGS.length; typed = 0; show(0); setStatus(''); phase = 'type'; wait = 0.5; }
    }
    widget($('.win-mail'), {
      start() { still(); phase = 'hold'; wait = 4.5; },
      tick, lang() { if (!moving() || phase !== 'type') { const m = full(); show(m.f.length + m.s.length + m.b.length); } setStatus(status.classList.contains('sent') ? 'sent' : status.classList.contains('sending') ? 'sending' : ''); }
    });
    still();
    if (window.Motion) Motion.on(md => { if (md === 'off') still(); });
  })();

  /* ---------- dev contract ---------- */
  const go = () => window.MotionEngine ? MotionEngine.ready() : (window.__ready = true);
  const sceneReady = () => window.__sceneReady || root.classList.contains('no-webgl');
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
    const wait = (n = 0) => (sceneReady() || n > 120 ? go() : setTimeout(() => wait(n + 1), 50));
    wait();
  });
})();
