/* Lab de IA: three small models that run in the browser, delivery-themed.
   1. semantic search over a menu (concept vectors + cosine similarity)
   2. ETA regression trained here by gradient descent on synthetic orders
   3. an LLM agent trace that calls 1 and 2 as tools (the LLM is scripted, the tools are real) */
(function () {
  const J = window.JPY;
  if (!J || !document.getElementById('ia')) return;
  const { widget, T, esc, moving, isEN } = J;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const brl = v => 'R$ ' + v.toLocaleString(isEN() ? 'en-US' : 'pt-BR');
  const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

  /* =========================================================
     shared data: concept space and the menu
     ========================================================= */
  const DIMS = [['leve', 'light'], ['indulgente', 'comfort'], ['doce', 'sweet'], ['picante', 'spicy'], ['japonês', 'Japanese'], ['italiano', 'Italian'],
    ['brasileiro', 'Brazilian'], ['árabe', 'Middle Eastern'], ['vegetariano', 'vegetarian'], ['barato', 'cheap'], ['carne', 'meat'], ['peixe', 'seafood'], ['lanche', 'snack']];
  const D = Object.fromEntries(['leve', 'indul', 'doce', 'pic', 'jap', 'ita', 'bra', 'ara', 'veg', 'bar', 'car', 'pei', 'lan'].map((k, i) => [k, i]));
  const vec = o => { const v = new Array(DIMS.length).fill(0); for (const k in o) v[D[k]] = o[k]; return v; };

  // dist = km from the customer, prep = kitchen minutes, queue = open orders at the restaurant
  const MENU = [
    ['Poke de salmão', 'Salmon poke', 'Aloha Poke', 42, 2.1, 10, 3, { leve: .9, jap: .6, pei: .9 }],
    ['Combinado 20 peças', '20-piece sushi set', 'Kaizen Sushi', 69, 3.4, 18, 6, { jap: 1, pei: .8, leve: .4 }],
    ['Temaki de salmão', 'Salmon temaki', 'Kaizen Sushi', 29, 3.4, 8, 6, { jap: .9, pei: .8, bar: .4, lan: .3 }],
    ['Lámen tonkotsu', 'Tonkotsu ramen', 'Hachi Lámen', 46, 5.2, 14, 4, { jap: .8, indul: .6, car: .6, pic: .2 }],
    ['Pizza margherita', 'Margherita pizza', 'Forno Nonna', 52, 4.0, 20, 8, { ita: 1, veg: .7, indul: .6 }],
    ['Lasanha à bolonhesa', 'Lasagna bolognese', 'Forno Nonna', 44, 4.0, 15, 8, { ita: .9, indul: .9, car: .7 }],
    ['Salada caesar com frango', 'Chicken caesar salad', 'Verde Vivo', 34, 1.6, 7, 2, { leve: 1, car: .3 }],
    ['Bowl vegano de grão-de-bico', 'Vegan chickpea bowl', 'Verde Vivo', 32, 1.6, 8, 2, { leve: .8, veg: 1, bar: .3, ara: .3 }],
    ['PF de frango grelhado', 'Grilled chicken plate', 'Cozinha da Dona Zica', 24, 2.6, 9, 5, { bra: 1, leve: .5, bar: .8, car: .6 }],
    ['Feijoada completa', 'Feijoada', 'Cozinha da Dona Zica', 39, 2.6, 12, 5, { bra: 1, indul: .9, car: .9 }],
    ['X-bacon artesanal', 'Craft bacon burger', 'Brasa Burger', 36, 3.0, 13, 7, { indul: 1, car: .9, lan: .7 }],
    ['Coxinha (6 un.)', 'Coxinha, 6 pcs', 'Salgaderia Central', 18, 1.2, 6, 3, { bra: .7, lan: 1, bar: .8, indul: .5 }],
    ['Açaí 500 ml', 'Açaí bowl, 500 ml', 'Point do Açaí', 26, 1.9, 5, 4, { doce: .8, leve: .3, bra: .5 }],
    ['Brigadeiros (caixa)', 'Brigadeiros, box of 6', 'Doce Dia', 22, 3.8, 4, 1, { doce: 1, bra: .5, bar: .3 }],
    ['Petit gâteau', 'Petit gâteau', 'Forno Nonna', 28, 4.0, 10, 8, { doce: 1, indul: .8 }],
    ['Frango coreano picante', 'Spicy Korean chicken', 'Seoul Bites', 38, 4.6, 12, 4, { pic: 1, car: .7, indul: .5 }],
    ['Esfiha de carne (4 un.)', 'Meat sfiha, 4 pcs', 'Habib & Filhos', 20, 2.2, 7, 6, { ara: 1, bar: .8, lan: .6, car: .6 }],
    ['Shawarma de falafel', 'Falafel shawarma', 'Habib & Filhos', 30, 2.2, 9, 6, { ara: 1, veg: 1, pic: .3, leve: .3 }],
    ['Tacos al pastor', 'Tacos al pastor', 'La Calaca', 35, 5.8, 11, 3, { pic: .7, car: .8, lan: .3 }],
    ['Pão de queijo e café', 'Cheese bread and coffee', 'Padaria Aurora', 15, 0.8, 4, 2, { lan: 1, bra: .7, bar: .8, veg: .6 }],
    ['Curry vegano apimentado', 'Spicy vegan curry', 'Masala House', 33, 3.6, 12, 3, { pic: 1, veg: 1, leve: .3 }]
  ].map(([pt, en, rest, price, dist, prep, queue, v], id) => ({ id, pt, en, rest, price, dist, prep, queue, v: vec(v) }));
  const dname = d => T(d.pt, d.en);

  // words -> concept weights. Prefix match (>= 4 chars) or exact match for short words. PT and EN.
  const LEX = [
    [['leve', 'light', 'saudav', 'health', 'fit', 'salad', 'dieta', 'diet'], { leve: 1 }],
    [['gordice', 'besteira', 'junk', 'comfort', 'pesad', 'heavy', 'larica', 'queijo', 'cheese', 'bacon'], { indul: 1 }],
    [['hamburg', 'burger'], { indul: .8, car: .7, lan: .6 }],
    [['doce', 'sweet', 'sobremesa', 'dessert', 'chocolate', 'acucar', 'sugar'], { doce: 1 }],
    [['acai'], { doce: .7, leve: .3, bra: .4 }],
    [['picante', 'apimentad', 'pimenta', 'spicy', 'hot', 'ardid'], { pic: 1 }],
    [['japones', 'japa', 'japanese', 'sushi', 'temaki', 'oriental', 'asiat', 'asian'], { jap: 1 }],
    [['ramen', 'lamen'], { jap: .8, indul: .4 }],
    [['poke'], { jap: .6, leve: .6, pei: .6 }],
    [['italian', 'massa', 'pasta', 'pizza', 'lasanh', 'lasagn'], { ita: 1 }],
    [['brasileir', 'brazil', 'caseir', 'homemade', 'feijo', 'arroz', 'pf', 'marmita'], { bra: 1 }],
    [['arab', 'esfih', 'sfiha', 'falafel', 'shawarm', 'kebab', 'kibe'], { ara: 1 }],
    [['vegetarian', 'vegan', 'veggie', 'plant'], { veg: 1 }],
    [['barat', 'cheap', 'econom', 'budget', 'promo'], { bar: 1 }],
    [['carne', 'meat', 'bife', 'beef', 'churrasc', 'bbq', 'porco', 'pork'], { car: 1 }],
    [['frango', 'chicken'], { car: .8, leve: .2 }],
    [['peixe', 'fish', 'salmao', 'salmon', 'seafood', 'camar', 'shrimp'], { pei: 1 }],
    [['lanche', 'snack', 'petisco', 'salgad', 'cafe', 'coffee', 'breakfast', 'manha'], { lan: 1 }]
  ];
  const NEG = new Set(['sem', 'without', 'nao', 'not', 'zero']);
  const STOP = new Set(['de', 'do', 'da', 'com', 'e', 'pra', 'para', 'um', 'uma', 'algo', 'quero', 'something', 'some', 'a', 'and', 'with', 'i', 'want']);
  function lookup(tok) {
    for (const [words, w] of LEX) for (const p of words) if (p.length < 4 ? tok === p : tok.startsWith(p)) return w;
    return null;
  }
  // query text -> { v, hits, priceMax }
  function embed(text) {
    const s = norm(text);
    const v = new Array(DIMS.length).fill(0), hits = [];
    let sign = 1;
    for (const tok of s.split(/[^a-z0-9]+/).filter(Boolean)) {
      if (NEG.has(tok)) { sign = -1; continue; }
      if (STOP.has(tok)) continue;
      const w = lookup(tok);
      if (w) { for (const k in w) v[D[k]] += sign * w[k]; hits.push(tok); }
      sign = 1;
    }
    const m = s.match(/(?:^|[^a-z])(?:ate|under|below|max(?:imo)?|menos de|less than|<)\s*(?:r\$\s*)?(\d{1,3})/);
    return { v, hits, priceMax: m ? +m[1] : null };
  }
  const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
  const len = a => Math.sqrt(dot(a, a)) || 1;
  // rank the menu by cosine similarity, optional hard price filter
  function search(q, k = 4, priceMax = q.priceMax) {
    if (!q.v.some(x => x)) return [];
    const ql = len(q.v);
    return MENU.map(d => ({ d, s: dot(q.v, d.v) / (ql * len(d.v)) }))
      .filter(r => r.s > 0.05 && (priceMax == null || r.d.price <= priceMax))
      .sort((a, b) => b.s - a.s).slice(0, k);
  }

  /* =========================================================
     shared model: ETA regression
     ========================================================= */
  // deterministic synthetic orders: the "true" world has an interaction (rain hurts more on long trips)
  // that a linear model cannot capture, so the error you see is honest.
  function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const R = rng(1802);
  const gauss = () => { const u = R() || 1e-9, v = R(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  const FEAT = [['distância', 'distance', 'min/km'], ['chuva', 'rain', 'min'], ['horário de pico', 'peak hour', 'min'], ['fila do restaurante', 'restaurant queue', 'min/pedido', 'min/order'], ['preparo', 'prep time', 'min/min']];
  const ROWS = Array.from({ length: 600 }, () => {
    const dist = 0.5 + R() * 7.5, rain = R() < 0.25 ? 1 : 0, peak = R() < 0.35 ? 1 : 0, queue = Math.floor(R() * 13), prep = 4 + R() * 22;
    const y = 5 + 3.1 * dist + 4 * rain + 0.9 * rain * dist + 5.5 * peak + 0.85 * queue + 0.95 * prep + gauss() * 2.6;
    return { x: [dist, rain, peak, queue, prep], y };
  });
  const TRAIN = ROWS.slice(0, 500), TEST = ROWS.slice(500);
  const mu = FEAT.map((_, j) => TRAIN.reduce((s, r) => s + r.x[j], 0) / TRAIN.length);
  const sd = FEAT.map((_, j) => Math.sqrt(TRAIN.reduce((s, r) => s + (r.x[j] - mu[j]) ** 2, 0) / TRAIN.length) || 1);
  const Z = rows => rows.map(r => ({ z: r.x.map((x, j) => (x - mu[j]) / sd[j]), y: r.y }));
  const ZT = Z(TRAIN), ZV = Z(TEST);
  const mkModel = () => ({ w: new Array(FEAT.length).fill(0), b: 0, epoch: 0, hist: [], EPOCHS: 220, lr: 0.06 });
  const predZ = (m, z) => m.b + dot(m.w, z);
  const predictM = (m, x) => predZ(m, x.map((v, j) => (v - mu[j]) / sd[j]));
  const rmse = (m, set) => Math.sqrt(set.reduce((s, r) => s + (predZ(m, r.z) - r.y) ** 2, 0) / set.length);
  const mae = (m, set) => set.reduce((s, r) => s + Math.abs(predZ(m, r.z) - r.y), 0) / set.length;
  function step(m) {
    // one epoch of full-batch gradient descent on mean squared error
    const g = new Array(FEAT.length).fill(0); let gb = 0;
    for (const r of ZT) { const e = predZ(m, r.z) - r.y; gb += e; r.z.forEach((z, j) => { g[j] += e * z; }); }
    const n = ZT.length;
    m.b -= m.lr * 2 * gb / n;
    m.w = m.w.map((w, j) => w - m.lr * 2 * g[j] / n);
    m.epoch++;
    m.hist.push([rmse(m, ZT), rmse(m, ZV)]);
  }
  function trainAll(m) { while (m.epoch < m.EPOCHS) step(m); return m; }
  // the window below animates its own training; the agent uses the same model, already trained
  // (same data, same seed, same steps: identical weights at the end)
  const model = mkModel();
  const served = trainAll(mkModel());
  const predict = x => predictM(model, x);
  const resetModel = () => Object.assign(model, mkModel());
  const etaOf = (d, ctx) => Math.max(8, predictM(served, [d.dist, ctx.rain ? 1 : 0, ctx.peak ? 1 : 0, d.queue, d.prep]));
  const listeners = [];
  const onModel = fn => listeners.push(fn);
  const modelChanged = () => listeners.forEach(fn => fn());

  /* =========================================================
     1. busca semântica
     ========================================================= */
  (function searchDemo() {
    const el = $('#ui-search');
    if (!el) return;
    const EX = [['algo leve e saudável', 'something light and healthy'], ['japonês até R$ 30', 'Japanese under R$30'], ['doce pra sobremesa', 'a sweet dessert'],
      ['comida caseira barata', 'cheap homemade food'], ['picante sem carne', 'spicy, without meat'], ['lanche rápido com queijo', 'a quick cheesy snack']];
    el.innerHTML = `
      <label class="s-in"><svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="4.6" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="m10.5 10.5 3.5 3.5" stroke="currentColor" stroke-width="1.3"/></svg>
        <input type="search" id="s-q" autocomplete="off" spellcheck="false"></label>
      <div class="s-chips" role="group"></div>
      <div class="s-vec mono" aria-live="polite"></div>
      <ol class="s-res"></ol>`;
    const input = $('#s-q', el), chips = $('.s-chips', el), vecEl = $('.s-vec', el), res = $('.s-res', el);
    let user = false, ex = 0, typed = 0, wait = 0.8, phase = 'type', lastKey = '', shownIds = new Set();
    function chipsHTML() { chips.innerHTML = EX.map((e, i) => `<button type="button" data-i="${i}">${esc(T(e[0], e[1]))}</button>`).join(''); }
    function relabel() {
      input.placeholder = T('o que você quer comer?', 'what do you feel like eating?');
      input.setAttribute('aria-label', T('Buscar no cardápio por descrição', 'Search the menu by description'));
      chips.setAttribute('aria-label', T('Exemplos de busca', 'Example searches'));
      chipsHTML();
    }
    function render() {
      const q = embed(input.value);
      const top = q.v.map((x, i) => [i, x]).filter(([, x]) => x).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).slice(0, 4);
      const f = q.priceMax != null ? ` <span class="s-f">${T('filtro', 'filter')}: ${T('preço', 'price')} ≤ ${brl(q.priceMax)}</span>` : '';
      vecEl.innerHTML = top.length
        ? `<span class="dim">${T('vetor da consulta', 'query vector')}</span> ` + top.map(([i, x]) => `<span class="${x < 0 ? 'neg' : ''}">${esc(T(DIMS[i][0], DIMS[i][1]))} ${x > 0 ? '+' : '−'}${Math.abs(x).toFixed(1)}</span>`).join(' ') + f
        : `<span class="dim">${input.value.trim() && (user || phase !== 'type') ? T('nenhum conceito reconhecido. tente “leve”, “japonês”, “doce”…', 'no concept recognised. try “light”, “Japanese”, “sweet”…') : T('digite ou escolha um exemplo', 'type or pick an example')}</span>`;
      const r = search(q);
      // rebuild only when the ranking changes, and animate only the dishes that just entered it
      const key = r.map(x => x.d.id + ':' + x.s.toFixed(2)).join() + '|' + isEN() + '|' + (q.v.some(x => x) ? 1 : 0);
      if (key === lastKey) return;
      lastKey = key;
      const prev = shownIds; shownIds = new Set(r.map(x => x.d.id));
      res.innerHTML = r.map(({ d, s }, i) => {
        const why = d.v.map((x, j) => [j, x * q.v[j]]).filter(([, x]) => x > 0).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([j]) => T(DIMS[j][0], DIMS[j][1]));
        return `<li class="${i === 0 ? 'top' : ''}${prev.has(d.id) ? '' : ' new'}"><span class="s-n">${esc(dname(d))}<small>${esc(d.rest)} · ${brl(d.price)}</small></span>
          <span class="s-why">${why.map(w => `<i>${esc(w)}</i>`).join('')}</span>
          <span class="s-sc"><b>${s.toFixed(2)}</b><span class="track"><span class="fill" style="transform:scaleX(${Math.max(0, s).toFixed(3)})"></span></span></span></li>`;
      }).join('') || (q.v.some(x => x) ? `<li class="s-empty">${T('nada no cardápio com esse perfil e preço.', 'nothing on the menu matches that profile and price.')}</li>` : '');
    }
    const take = () => { if (!user) { user = true; el.classList.add('user'); } };
    input.addEventListener('input', () => { take(); render(); });
    input.addEventListener('focus', take);
    chips.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; take(); input.value = T(EX[+b.dataset.i][0], EX[+b.dataset.i][1]); render(); });
    function tick(dt) {
      if (user) return;
      wait -= dt; if (wait > 0) return;
      const full = T(EX[ex][0], EX[ex][1]);
      if (phase === 'type') { typed++; input.value = full.slice(0, typed); render(); wait = 0.055; if (typed >= full.length) { phase = 'hold'; wait = 2.8; } }
      else { ex = (ex + 1) % EX.length; typed = 0; phase = 'type'; input.value = ''; render(); wait = 0.35; }
    }
    function still() { input.value = T(EX[0][0], EX[0][1]); render(); }
    relabel(); still();
    widget(el.closest('.win'), {
      start() { if (moving() && !user) { input.value = ''; typed = 0; phase = 'type'; wait = 0.4; render(); } },
      tick,
      lang() { relabel(); if (!user) { const full = T(EX[ex][0], EX[ex][1]); typed = Math.min(typed, full.length); input.value = moving() ? full.slice(0, typed) : full; } render(); }
    });
  })();

  /* =========================================================
     2. previsão de entrega
     ========================================================= */
  (function etaDemo() {
    const el = $('#ui-eta');
    if (!el) return;
    const ctl = { dist: 3.2, queue: 4, prep: 12, rain: false, peak: true };
    el.innerHTML = `
      <div class="eta-ctl">
        <div class="eta-out">
          <div class="q-k"><span><span class="pt">chega em</span><span class="en">arrives in</span></span><span class="eta-ep"></span></div>
          <div class="eta-v"><span class="eta-n">–</span> <small>min</small></div>
          <div class="eta-band mono"></div>
          <div class="eta-sum mono"></div>
        </div>
        <label class="rng"><span class="rng-k"><span class="pt">distância</span><span class="en">distance</span><b data-o="dist"></b></span><input type="range" min="0.5" max="8" step="0.1" data-k="dist"></label>
        <label class="rng"><span class="rng-k"><span class="pt">fila do restaurante</span><span class="en">restaurant queue</span><b data-o="queue"></b></span><input type="range" min="0" max="12" step="1" data-k="queue"></label>
        <label class="rng"><span class="rng-k"><span class="pt">preparo</span><span class="en">prep time</span><b data-o="prep"></b></span><input type="range" min="4" max="26" step="1" data-k="prep"></label>
        <div class="tog-row">
          <button type="button" class="tog" data-t="rain" aria-pressed="false"><i></i><span class="pt">chuva</span><span class="en">rain</span></button>
          <button type="button" class="tog" data-t="peak" aria-pressed="true"><i></i><span class="pt">horário de pico</span><span class="en">peak hour</span></button>
        </div>
      </div>
      <div class="eta-side">
        <div class="card-mini">
          <div class="q-k"><span><span class="pt">erro (RMSE) por época</span><span class="en">error (RMSE) per epoch</span></span><span class="eta-leg"><i class="l-tr"></i><span class="pt">treino</span><span class="en">train</span> <i class="l-te"></i><span class="pt">teste</span><span class="en">test</span></span></div>
          <svg class="eta-curve" viewBox="0 0 300 96" preserveAspectRatio="none" aria-hidden="true"><path class="c-te" d=""/><path class="c-tr" d=""/></svg>
          <div class="eta-met mono"></div>
        </div>
        <div class="card-mini">
          <div class="q-k"><span><span class="pt">o que o modelo aprendeu</span><span class="en">what the model learned</span></span><button type="button" class="mini-btn" data-retrain><span class="pt">retreinar</span><span class="en">retrain</span></button></div>
          <div class="eta-w"></div>
        </div>
      </div>`;
    const rngs = $$('input[type=range]', el);
    rngs.forEach(r => { r.value = ctl[r.dataset.k]; r.addEventListener('input', () => { ctl[r.dataset.k] = +r.value; out(); }); });
    $$('.tog', el).forEach(b => b.addEventListener('click', () => { ctl[b.dataset.t] = !ctl[b.dataset.t]; b.setAttribute('aria-pressed', String(ctl[b.dataset.t])); out(); }));
    $('[data-retrain]', el).addEventListener('click', () => { resetModel(); if (!moving()) trainAll(model); training = true; modelChanged(); });
    const curveTr = $('.c-tr', el), curveTe = $('.c-te', el), met = $('.eta-met', el), wEl = $('.eta-w', el);
    const fmt1 = v => v.toLocaleString(isEN() ? 'en-US' : 'pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    function out() {
      $('[data-o=dist]', el).textContent = fmt1(ctl.dist) + ' km';
      $('[data-o=queue]', el).textContent = ctl.queue + ' ' + T(ctl.queue === 1 ? 'pedido' : 'pedidos', ctl.queue === 1 ? 'order' : 'orders');
      $('[data-o=prep]', el).textContent = ctl.prep + ' min';
      const p = predict([ctl.dist, ctl.rain ? 1 : 0, ctl.peak ? 1 : 0, ctl.queue, ctl.prep]);
      const h = model.hist[model.hist.length - 1];
      $('.eta-n', el).textContent = model.epoch ? Math.max(0, Math.round(p)) : '–';
      $('.eta-ep', el).textContent = T('época', 'epoch') + ' ' + model.epoch + '/' + model.EPOCHS;
      // 80% band from test RMSE, assuming roughly normal residuals
      // per-prediction breakdown: intercept + coefficient × value, in minutes
      const xs = [ctl.dist, ctl.rain ? 1 : 0, ctl.peak ? 1 : 0, ctl.queue, ctl.prep], base = predict([0, 0, 0, 0, 0]);
      const SH = [['dist', 'dist'], ['chuva', 'rain'], ['pico', 'peak'], ['fila', 'queue'], ['preparo', 'prep']];
      const parts = xs.map((x, j) => [j, model.w[j] / sd[j] * x]).filter(([, c]) => Math.abs(c) >= 0.05);
      $('.eta-sum', el).innerHTML = model.epoch ? `= ${fmt1(base)} <span>${T('base', 'base')}</span>` + parts.map(([j, c]) => ` ${c >= 0 ? '+' : '−'} ${fmt1(Math.abs(c))} <span>${T(SH[j][0], SH[j][1])}</span>`).join('') : '';
      $('.eta-band', el).textContent = h ? T(`80% das entregas: ${Math.max(0, Math.round(p - 1.28 * h[1]))}–${Math.round(p + 1.28 * h[1])} min`, `80% of orders: ${Math.max(0, Math.round(p - 1.28 * h[1]))}–${Math.round(p + 1.28 * h[1])} min`) : T('treinando…', 'training…');
    }
    function curve() {
      const H = model.hist, n = model.EPOCHS;
      if (!H.length) { curveTr.setAttribute('d', ''); curveTe.setAttribute('d', ''); met.textContent = ''; return; }
      const top = Math.max(...H[0]) * 1.02, lo = 0;
      const path = k => H.map((h, i) => `${i ? 'L' : 'M'}${(i / (n - 1) * 300).toFixed(1)},${(96 - (h[k] - lo) / (top - lo) * 92 - 2).toFixed(1)}`).join('');
      curveTr.setAttribute('d', path(0)); curveTe.setAttribute('d', path(1));
      const h = H[H.length - 1];
      met.innerHTML = `RMSE ${T('teste', 'test')} <b>${fmt1(h[1])} min</b> · MAE ${T('teste', 'test')} <b>${fmt1(mae(model, ZV))} min</b> · ${TRAIN.length}/${TEST.length} ${T('entregas', 'orders')}`;
    }
    function weights() {
      const coef = model.w.map((w, j) => w / sd[j]);
      const impact = model.w.map(Math.abs), mx = Math.max(...impact, 1e-6);
      wEl.innerHTML = FEAT.map((f, j) => `<div class="w-row"><span>${esc(T(f[0], f[1]))}</span><span class="w-v">${coef[j] >= 0 ? '+' : '−'}${fmt1(Math.abs(coef[j]))} ${esc(T(f[2], f[3] || f[2]))}</span><span class="track"><span class="fill" style="transform:scaleX(${(impact[j] / mx).toFixed(3)})"></span></span></div>`).join('')
        + `<div class="w-row base"><span>${T('base', 'intercept')}</span><span class="w-v">${fmt1(predict([0, 0, 0, 0, 0]))} min</span></div>`;
    }
    const all = () => { out(); curve(); weights(); };
    onModel(all);
    let training = false, acc = 0;
    widget(el.closest('.win'), {
      start() { if (!moving()) { trainAll(model); modelChanged(); } else training = true; },
      tick(dt) {
        if (!training) return;
        acc += dt;
        // ~70 epochs per second: slow enough to watch the error fall
        while (acc > 1 / 70 && model.epoch < model.EPOCHS) { step(model); acc -= 1 / 70; }
        if (model.epoch >= model.EPOCHS) training = false;
        modelChanged();
      },
      lang: all
    });
    all();
  })();

  /* =========================================================
     3. agente com tool calling
     ========================================================= */
  (function agentDemo() {
    const el = $('#ui-agent');
    if (!el) return;
    // the LLM's side is scripted: what it would extract from the message. Everything after the tool calls is computed.
    const PROMPTS = [
      { u: ['quero um almoço leve até R$ 40 que chegue em 30 min', 'a light lunch under R$40, here within 30 min'], ctx: { rain: false, peak: true, hour: '12:30' },
        args: { consulta: ['leve saudável', 'light healthy'], preco_max: 40, prazo_max: 30 }, sort: 'score' },
      { u: ['tá chovendo e bateu vontade de japonês. o que chega mais rápido?', 'it’s raining and I want Japanese food. what gets here fastest?'], ctx: { rain: true, peak: false, hour: '20:10' },
        args: { consulta: ['japonês', 'Japanese'], preco_max: null, prazo_max: null }, sort: 'eta' },
      { u: ['algo doce e barato pra sobremesa, sem pressa', 'something sweet and cheap for dessert, no rush'], ctx: { rain: false, peak: false, hour: '21:40' },
        args: { consulta: ['doce barato', 'sweet cheap'], preco_max: null, prazo_max: null }, sort: 'score' }
    ];
    el.innerHTML = `
      <div class="ag-top"><div class="s-chips ag-chips" role="group"></div><button type="button" class="mini-btn" data-replay>↻ <span class="pt">rodar de novo</span><span class="en">run again</span></button></div>
      <div class="ag-grid">
        <div class="ag-chat"><div class="q-k"><span><span class="pt">conversa</span><span class="en">chat</span></span><span class="ag-ctx"></span></div><div class="ag-msgs"></div></div>
        <div class="ag-trace"><div class="q-k"><span>trace</span><span class="ag-n"></span></div><ol class="ag-log"></ol></div>
      </div>`;
    const chips = $('.ag-chips', el), msgs = $('.ag-msgs', el), log = $('.ag-log', el), ctxEl = $('.ag-ctx', el), nEl = $('.ag-n', el);
    let pi = 0, steps = [], si = 0, wait = 0.6, hold = false, user = false, tallest = 0;
    let lastW = innerWidth;
    addEventListener('resize', () => { if (Math.abs(innerWidth - lastW) > 40) { lastW = innerWidth; tallest = 0; el.style.minHeight = ''; } }, { passive: true });
    const J2 = o => esc(JSON.stringify(o)).replace(/&quot;([^&]+?)&quot;:/g, '<span class="k">"$1"</span>:').replace(/:(&quot;[^&]*?&quot;)/g, ':<span class="s">$1</span>');
    function plan(P) {
      // run the real tools for this prompt and turn the run into display steps
      const q = embed(T(P.args.consulta[0], P.args.consulta[1]));
      const found = search(q, 5, P.args.preco_max);
      const withEta = found.map(r => ({ ...r, eta: Math.round(etaOf(r.d, P.ctx)) }));
      const kept = withEta.filter(r => P.args.prazo_max == null || r.eta <= P.args.prazo_max);
      const ranked = P.sort === 'eta' ? [...kept].sort((a, b) => a.eta - b.eta) : kept;
      const pick = ranked[0];
      const callArgs = { consulta: T(P.args.consulta[0], P.args.consulta[1]) }; if (P.args.preco_max != null) callArgs.preco_max = P.args.preco_max; callArgs.k = 5;
      const etaArgs = { ids: found.map(r => r.d.id), chuva: P.ctx.rain, pico: P.ctx.peak };
      const S = [];
      S.push({ chat: 'user', html: esc(T(P.u[0], P.u[1])) });
      S.push({ log: 'llm', html: `${T('plano', 'plan')}: buscar_pratos → estimar_entrega → ${P.args.prazo_max != null ? T('filtrar prazo', 'filter by time') + ' → ' : ''}${P.sort === 'eta' ? T('ordenar por ETA', 'sort by ETA') + ' → ' : ''}${T('responder', 'answer')}`, tag: T('roteiro', 'scripted') });
      S.push({ log: 'tool', html: `buscar_pratos(${J2(callArgs)})` });
      S.push({ log: 'ret', html: found.length ? found.map(r => `${esc(dname(r.d))} <span class="dim">${r.s.toFixed(2)}</span>`).join(' · ') : T('nenhum prato', 'no dishes') });
      if (found.length) {
        S.push({ log: 'tool', html: `estimar_entrega(${J2(etaArgs)})` });
        S.push({ log: 'ret', html: withEta.map(r => `${r.d.id}: <b>${r.eta}</b> min`).join(' · ') });
      }
      if (P.args.prazo_max != null) S.push({ log: 'llm', html: T(`prazo ≤ ${P.args.prazo_max} min → ${kept.length} de ${withEta.length} ficam`, `time ≤ ${P.args.prazo_max} min → ${kept.length} of ${withEta.length} remain`), tag: T('roteiro', 'scripted') });
      const okPrice = !pick || P.args.preco_max == null || pick.d.price <= P.args.preco_max;
      const okTime = !pick || P.args.prazo_max == null || pick.eta <= P.args.prazo_max;
      const outJ = pick ? { prato_id: pick.d.id, prato: dname(pick.d), preco: pick.d.price, eta_min: pick.eta, alternativas: ranked.slice(1, 3).map(r => r.d.id) } : { prato_id: null, motivo: 'sem_opcoes' };
      S.push({ log: 'guard', html: `${T('validar_saida', 'validate_output')}: schema ✓ · ${T('preço', 'price')} ${okPrice ? '✓' : '×'} · ${T('prazo', 'time')} ${okTime ? '✓' : '×'} · ${T('id existe no cardápio', 'id exists on menu')} ✓` });
      S.push({ log: 'out', html: J2(outJ) });
      let reply;
      if (!pick) reply = T('Não encontrei nada que caiba nesse prazo e preço. Quer que eu aumente o prazo para 40 min?', 'Nothing fits that time and price. Want me to stretch the window to 40 min?');
      else {
        const alts = ranked.slice(1, 3).map(r => `${dname(r.d)} (${brl(r.d.price)}, ~${r.eta} min)`);
        reply = T(`Sugiro <b>${esc(dname(pick.d))}</b> do ${esc(pick.d.rest)}: ${brl(pick.d.price)}, chega em ~${pick.eta} min${P.ctx.rain ? ' mesmo com a chuva' : ''}.`, `I’d go with <b>${esc(dname(pick.d))}</b> from ${esc(pick.d.rest)}: ${brl(pick.d.price)}, about ${pick.eta} min${P.ctx.rain ? ' even with the rain' : ''}.`)
          + (alts.length ? `<small>${T('Outras opções', 'Also')}: ${esc(alts.join(' · '))}</small>` : '');
      }
      S.push({ chat: 'bot', html: reply });
      return S;
    }
    const ICON = { llm: '◆', tool: '⚙', ret: '←', guard: '✓', out: '⇢' };
    const LBL = { llm: 'llm', tool: 'tool', ret: '', guard: 'guard', out: 'json' };
    function show(s) {
      if (s.chat) {
        const m = document.createElement('div'); m.className = 'msg ' + s.chat; m.innerHTML = s.html; msgs.appendChild(m);
        const typing = $('.msg.typing', msgs); if (typing && s.chat === 'bot') typing.remove();
        if (s.chat === 'user') { const t = document.createElement('div'); t.className = 'msg bot typing'; t.innerHTML = '<i></i><i></i><i></i>'; msgs.appendChild(t); }
      } else {
        const li = document.createElement('li'); li.className = 'lg-' + s.log;
        li.innerHTML = `<span class="ic">${ICON[s.log]}</span><span class="lb">${LBL[s.log]}</span><span class="tx">${s.html}${s.tag ? ` <em>${esc(s.tag)}</em>` : ''}</span>`;
        log.appendChild(li);
      }
      nEl.textContent = $$('.lg-tool', log).length + ' ' + T('chamadas', 'calls');
    }
    function chipsHTML() { chips.innerHTML = PROMPTS.map((p, i) => `<button type="button" data-i="${i}" aria-pressed="${i === pi}">${esc(T(p.u[0], p.u[1]))}</button>`).join(''); chips.setAttribute('aria-label', T('Pedidos de exemplo', 'Example requests')); }
    function begin(i, instant) {
      pi = i; steps = plan(PROMPTS[pi]); si = 0; hold = false; wait = 0.5;
      // keep the tallest height seen so clearing the run never makes the page jump
      tallest = Math.max(tallest, el.offsetHeight); el.style.minHeight = tallest + 'px';
      msgs.innerHTML = ''; log.innerHTML = ''; nEl.textContent = '';
      const c = PROMPTS[pi].ctx;
      ctxEl.textContent = `${c.hour} · ${c.rain ? T('chuva', 'rain') : T('seco', 'dry')}${c.peak ? ' · ' + T('pico', 'peak') : ''}`;
      $$('button', chips).forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.i === pi)));
      if (instant) { steps.forEach(show); si = steps.length; hold = true; wait = 7; }
    }
    chips.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; user = true; begin(+b.dataset.i, !moving()); });
    $('[data-replay]', el).addEventListener('click', () => begin(pi, !moving()));
    let primed = false;
    function tick(dt) {
      if (!primed) { primed = true; begin(pi, false); }
      wait -= dt; if (wait > 0) return;
      if (si < steps.length) { show(steps[si]); const s = steps[si++]; wait = s.chat === 'user' ? 1.1 : s.log === 'ret' ? 0.9 : s.log === 'out' ? 1.1 : 0.75; return; }
      if (!hold) { hold = true; wait = 6.5; return; }
      if (!user) begin((pi + 1) % PROMPTS.length, false); else { hold = true; wait = 1e9; }
    }
    function still() { begin(pi, true); }
    widget(el.closest('.win'), {
      start() { if (!moving()) still(); },
      tick,
      lang() { chipsHTML(); begin(pi, true); }
    });
    // a complete, static run so the window is never empty before it scrolls into view
    chipsHTML();
    begin(pi, true);
    requestAnimationFrame(() => { tallest = Math.max(tallest, el.offsetHeight); el.style.minHeight = tallest + 'px'; });
  })();
})();
