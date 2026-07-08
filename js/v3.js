/* ============================================================
   Portfólio JPY v3 — rolagem horizontal, tinta sumi-ê e PT/EN
   ============================================================ */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var motion = !reduced;

  var track = document.getElementById('track');
  var spacer = document.getElementById('spacer');
  var viewport = document.getElementById('viewport');
  var fill = document.getElementById('progress-fill');
  var indicator = document.getElementById('section-indicator');

  if (!track || !spacer || !viewport) return;

  var vw = 0, maxScroll = 0;
  var offsets = {};
  var panels = [];
  var plx = [];
  var cur = window.scrollY || 0;
  var skew = 0;
  var lastSectionId = '';
  var tlPath = document.querySelector('.tl-axis path');
  var tlOff = 0, tlW = 1;
  var finePointer = window.matchMedia('(pointer: fine)').matches;
  var touchCapable = window.matchMedia('(pointer: coarse)').matches || ('ontouchstart' in window);

  // agrupamento das marcas: os quatro painéis de projetos acendem a mesma marca
  var tickGroups = {
    'panel-p1': 'panel-p1',
    'panel-p2': 'panel-p1',
    'panel-p3': 'panel-p1',
    'panel-outros': 'panel-p1'
  };

  /* ---------- idioma ---------- */
  function currentLang() {
    return document.documentElement.classList.contains('lang-en') ? 'en' : 'pt';
  }

  function refreshIndicator() {
    if (!indicator || !lastSectionId) return;
    var p = document.getElementById(lastSectionId);
    if (!p) return;
    var attr = currentLang() === 'en' ? 'data-nav-en' : 'data-nav-pt';
    indicator.textContent = p.getAttribute(attr) || '';
  }

  function setLang(l) {
    document.documentElement.classList.toggle('lang-en', l === 'en');
    document.documentElement.setAttribute('lang', l === 'en' ? 'en' : 'pt-BR');
    try { localStorage.setItem('jpy-lang', l); } catch (e) { /* sem storage */ }
    var bPt = document.getElementById('lang-pt');
    var bEn = document.getElementById('lang-en');
    if (bPt) bPt.classList.toggle('on', l !== 'en');
    if (bEn) bEn.classList.toggle('on', l === 'en');
    refreshIndicator();
  }

  var savedLang = null;
  try { savedLang = localStorage.getItem('jpy-lang'); } catch (e) { /* sem storage */ }
  setLang(savedLang === 'en' ? 'en' : 'pt');

  var btnPt = document.getElementById('lang-pt');
  var btnEn = document.getElementById('lang-en');
  if (btnPt) btnPt.addEventListener('click', function () { setLang('pt'); });
  if (btnEn) btnEn.addEventListener('click', function () { setLang('en'); });

  /* ---------- medição e navegação ---------- */
  function measure() {
    vw = window.innerWidth;
    var trackW = track.scrollWidth;
    maxScroll = Math.max(0, trackW - vw);
    spacer.style.height = (maxScroll + window.innerHeight) + 'px';

    panels = [];
    var children = track.children;
    for (var i = 0; i < children.length; i++) {
      if (children[i].tagName === 'SECTION') panels.push(children[i]);
    }
    offsets = {};
    panels.forEach(function (p) { offsets[p.id] = p.offsetLeft; });

    plx = [];
    document.querySelectorAll('[data-depth]').forEach(function (el) {
      var panel = el.closest('section');
      plx.push({
        el: el,
        depth: parseFloat(el.getAttribute('data-depth')) || 0.2,
        off: panel ? panel.offsetLeft : 0,
        w: panel ? panel.offsetWidth : vw
      });
    });

    document.querySelectorAll('.tick').forEach(function (t) {
      var off = offsets[t.getAttribute('data-tick')] || 0;
      var ratio = maxScroll > 0 ? off / maxScroll : 0;
      t.style.left = (3 + ratio * 94) + '%';
    });

    var tlPanel = document.getElementById('panel-trajetoria');
    if (tlPanel) { tlOff = tlPanel.offsetLeft; tlW = tlPanel.offsetWidth || 1; }

  }

  function goToPanel(id) {
    var p = offsets[id];
    if (p == null) return;
    window.scrollTo({ top: Math.min(p, maxScroll), behavior: 'auto' });
  }

  measure();
  window.addEventListener('resize', measure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  window.addEventListener('load', measure);

  // o navegador tenta rolar o container escondido (hash, foco via Tab);
  // neutraliza e converte no nosso scroll horizontal
  function resetViewportScroll() {
    if (viewport.scrollLeft) viewport.scrollLeft = 0;
    if (viewport.scrollTop) viewport.scrollTop = 0;
  }
  resetViewportScroll();
  viewport.addEventListener('scroll', resetViewportScroll);
  track.addEventListener('focusin', function (e) {
    // só foco via teclado (Tab); clique não deve provocar salto de painel
    try { if (!e.target.matches(':focus-visible')) return; } catch (err) { return; }
    var p = e.target.closest && e.target.closest('section');
    if (p && offsets[p.id] != null) goToPanel(p.id);
  });

  // permite links profundos: index.html#panel-outros etc.
  // guarda o hash e o remove da URL para o navegador não re-ancorar após o load
  var deepLink = location.hash ? location.hash.slice(1) : '';
  if (deepLink && history.replaceState) {
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* file:// */ }
  }
  window.addEventListener('load', function () {
    resetViewportScroll();
    if (!deepLink || offsets[deepLink] == null) return;
    // o navegador pode re-ancorar o fragmento após o load; salta e repete para vencer a corrida
    var jump = function () { resetViewportScroll(); goToPanel(deepLink); };
    jump();
    setTimeout(jump, 60);
    setTimeout(jump, 250);
  });

  document.querySelectorAll('[data-goto]').forEach(function (el) {
    el.addEventListener('click', function () { goToPanel(el.getAttribute('data-goto')); });
  });

  /* ---------- abertura caligráfica ---------- */
  (function () {
    var intro = document.getElementById('intro');
    var root = document.documentElement;
    if (!intro) return;
    if (!root.classList.contains('introing')) { intro.parentNode.removeChild(intro); return; }
    try { sessionStorage.setItem('jpy-seen', '1'); } catch (e) { /* sem storage */ }

    setTimeout(function () { intro.classList.add('intro-out'); }, 1950);
    setTimeout(function () {
      root.classList.remove('introing');
      if (intro.parentNode) intro.parentNode.removeChild(intro);
    }, 2650);
  })();

  /* ---------- título vivo: letra a letra ---------- */
  document.querySelectorAll('.hero-title .rise').forEach(function (sp) {
    Array.prototype.slice.call(sp.childNodes).forEach(function (n) {
      if (n.nodeType !== 3) return;
      var frag = document.createDocumentFragment();
      n.textContent.split('').forEach(function (ch) {
        if (ch.trim() === '') { frag.appendChild(document.createTextNode(ch)); return; }
        var s = document.createElement('span');
        s.className = 'ltr';
        s.textContent = ch;
        frag.appendChild(s);
      });
      sp.replaceChild(frag, n);
    });
  });

  /* ---------- cursor-pincel ---------- */
  var curDot = document.getElementById('cursor-dot');
  var curRing = document.getElementById('cursor-ring');
  var cursorOn = motion && finePointer && curDot && curRing;
  var ringPos = null;
  if (cursorOn) {
    document.documentElement.classList.add('has-cursor');
    window.addEventListener('pointerover', function (e) {
      var t = e.target;
      curRing.classList.toggle('hot', !!(t.closest && t.closest('a, button, [data-tilt]')));
    });
    window.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'touch') curRing.classList.add('press');
    });
    window.addEventListener('pointerup', function () { curRing.classList.remove('press'); });
  }

  /* ---------- ensō do hero: tinta que cede ao pincel ---------- */
  // os círculos viram paths construídos por uma coroa de pontos com física de
  // mola: o cursor perto do traço empurra a tinta radialmente (por dentro
  // avoluma pra fora, por fora amassa pra dentro) e, ao sair, o traço volta
  // oscilando até assentar. o filtro sumi-ê continua por cima da geometria.
  var ensoDeform = null;
  if (motion && finePointer) {
    (function () {
      var svg = document.querySelector('.enso-hero');
      if (!svg || !svg.querySelector) return;
      var SVGNS = 'http://www.w3.org/2000/svg';
      var rings = [];
      [
        { cls: 'enso-main', start: -84 },
        { cls: 'enso-echo', start: -58 }
      ].forEach(function (cfg) {
        var c = svg.querySelector('.' + cfg.cls);
        if (!c) return;
        var r = parseFloat(c.getAttribute('r'));
        var path = document.createElementNS(SVGNS, 'path');
        ['pathLength', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'opacity', 'filter']
          .forEach(function (a) {
            var v = c.getAttribute(a);
            if (v != null) path.setAttribute(a, v);
          });
        path.setAttribute('class', cfg.cls);
        // a rotação do círculo original vira o ângulo inicial dos pontos,
        // preservando onde o traço começa a se desenhar
        path.style.transform = 'none';
        var pts = [];
        var N = 52;
        var start = cfg.start * Math.PI / 180;
        for (var i = 0; i < N; i++) {
          pts.push({ a: start + i * Math.PI * 2 / N, r: r, base: r, v: 0 });
        }
        path.setAttribute('d', ensoPathD(pts));
        c.parentNode.replaceChild(path, c);
        rings.push({ path: path, pts: pts });
      });
      if (rings.length) ensoDeform = { svg: svg, rings: rings };
    })();
  }

  // coroa de pontos -> curva fechada suave (Catmull-Rom em béziers)
  function ensoPathD(pts) {
    var n = pts.length, xs = [], ys = [], i;
    for (i = 0; i < n; i++) {
      xs.push(390 + Math.cos(pts[i].a) * pts[i].r);
      ys.push(390 + Math.sin(pts[i].a) * pts[i].r);
    }
    var d = 'M' + xs[0].toFixed(1) + ' ' + ys[0].toFixed(1);
    for (i = 0; i < n; i++) {
      var i0 = (i - 1 + n) % n, i2 = (i + 1) % n, i3 = (i + 2) % n;
      d += 'C' + (xs[i] + (xs[i2] - xs[i0]) / 6).toFixed(1) + ' ' + (ys[i] + (ys[i2] - ys[i0]) / 6).toFixed(1) +
        ' ' + (xs[i2] - (xs[i3] - xs[i]) / 6).toFixed(1) + ' ' + (ys[i2] - (ys[i3] - ys[i]) / 6).toFixed(1) +
        ' ' + xs[i2].toFixed(1) + ' ' + ys[i2].toFixed(1);
    }
    return d + 'Z';
  }

  /* ---------- botões magnéticos ---------- */
  if (motion && finePointer) {
    document.querySelectorAll('[data-magnetic]').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        if (e.pointerType === 'touch') return;
        var r = el.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2);
        var dy = e.clientY - (r.top + r.height / 2);
        el.style.transform = 'translate(' + (dx * 0.22).toFixed(1) + 'px,' + (dy * 0.22).toFixed(1) + 'px)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });

    /* ---------- tilt 3D com brilho ---------- */
    document.querySelectorAll('[data-tilt]').forEach(function (el) {
      el.addEventListener('pointerenter', function (e) {
        if (e.pointerType === 'touch') return;
        el.style.transition = 'transform 0.12s ease-out';
      });
      el.addEventListener('pointermove', function (e) {
        if (e.pointerType === 'touch') return;
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = 'perspective(900px) rotateX(' + (-py * 7).toFixed(2) + 'deg) rotateY(' + (px * 9).toFixed(2) + 'deg)';
        el.style.setProperty('--gx', ((px + 0.5) * 100).toFixed(1) + '%');
        el.style.setProperty('--gy', ((py + 0.5) * 100).toFixed(1) + '%');
      });
      el.addEventListener('pointerleave', function () {
        el.style.transition = 'transform 0.6s cubic-bezier(0.2, 0.7, 0.2, 1)';
        el.style.transform = '';
      });
    });
  }

  /* ---------- reveals ---------- */
  var revealed = [];
  if (motion) {
    document.querySelectorAll('[data-reveal]').forEach(function (el) {
      el.style.opacity = '0';
      el.style.transform = 'translateY(26px)';
    });
  }

  function panelRevealed(p) { return revealed.indexOf(p) !== -1; }

  function checkReveals() {
    if (!motion) return;
    for (var i = 0; i < panels.length; i++) {
      var p = panels[i];
      if (!panelRevealed(p) && p.offsetLeft < cur + vw * 0.86 && p.offsetLeft + p.offsetWidth > cur) {
        revealed.push(p);
        p.classList.add('revealed');
        var els = p.querySelectorAll('[data-reveal]');
        for (var j = 0; j < els.length; j++) {
          var el = els[j];
          el.style.transition =
            'opacity .9s cubic-bezier(.2,.6,.2,1) ' + (j * 90) + 'ms, ' +
            'transform .9s cubic-bezier(.2,.6,.2,1) ' + (j * 90) + 'ms';
          el.style.opacity = '1';
          el.style.transform = 'none';
        }
      }
    }
  }

  /* ---------- arrastar para rolar ---------- */
  var mouse = null;

  var dragStart = null, dragged = false;

  viewport.addEventListener('pointerdown', function (e) {
    if (e.button !== 0) return;
    if (e.pointerType === 'touch') return; // toque tratado abaixo (gesto lateral)
    if (e.target.closest('a, button, input, textarea')) return;
    dragStart = { x: e.clientX, y: e.clientY };
    dragged = false;
  });

  /* ---------- toque: deslizar para o lado navega os painéis ---------- */
  if (touchCapable) {
    document.documentElement.classList.add('touch-mode');
    var tStart = null, tAxis = null, tMoved = false;

    viewport.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1) { tStart = null; return; }
      var t = e.touches[0];
      tStart = { x: t.clientX, y: t.clientY, s: Math.min(window.scrollY, maxScroll) };
      tAxis = null; tMoved = false;
    }, { passive: true });

    viewport.addEventListener('touchmove', function (e) {
      if (!tStart) return;
      var t = e.touches[0];
      var dx = t.clientX - tStart.x, dy = t.clientY - tStart.y;
      if (!tAxis) {
        if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return;
        tAxis = Math.abs(dx) >= Math.abs(dy) ? 'x' : 'y';
      }
      // ambos os eixos empurram o scroll lateral: o portfólio nunca rola pra baixo
      var delta = tAxis === 'x' ? dx : dy;
      if (Math.abs(delta) > 4) tMoved = true;
      e.preventDefault();
      window.scrollTo(0, Math.max(0, Math.min(maxScroll, tStart.s - delta)));
    }, { passive: false });

    viewport.addEventListener('touchend', function () { tStart = null; });

    // suprime o clique fantasma que dispararia após um arraste
    viewport.addEventListener('click', function (e) {
      if (tMoved) { e.preventDefault(); e.stopPropagation(); tMoved = false; }
    }, true);
  }

  window.addEventListener('pointermove', function (e) {
    // guarda o alvo; o loop suaviza o anel do cursor
    if (cursorOn && e.pointerType !== 'touch') {
      mouse = { x: e.clientX, y: e.clientY };
      document.documentElement.classList.add('cursor-on');
    }
    if (!dragStart) return;
    var dx = e.clientX - dragStart.x, dy = e.clientY - dragStart.y;
    if (!dragged && Math.abs(dx) + Math.abs(dy) > 7) {
      dragged = true;
      document.body.style.userSelect = 'none';
    }
    if (dragged) window.scrollBy(0, -e.movementX);
  }, { passive: true });

  window.addEventListener('pointerup', function () {
    dragStart = null;
    document.body.style.userSelect = '';
    setTimeout(function () { dragged = false; }, 0);
  });

  window.addEventListener('click', function () {
    if (!cursorOn || dragged) return;
    curRing.classList.remove('burst');
    void curRing.offsetWidth; // reinicia a animação
    curRing.classList.add('burst');
  });

  /* ---------- teclado ---------- */
  window.addEventListener('keydown', function (e) {
    if (e.target.closest && e.target.closest('input, textarea')) return;
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    var offs = panels.map(function (p) { return p.offsetLeft; });
    var idx = 0;
    for (var i = 0; i < offs.length; i++) { if (offs[i] <= cur + 10) idx = i; }
    var next = Math.max(0, Math.min(offs.length - 1, idx + (e.key === 'ArrowRight' ? 1 : -1)));
    window.scrollTo({ top: Math.min(offs[next], maxScroll), behavior: 'auto' });
  });

  /* ---------- laço principal ---------- */
  function updateTicks(activeId) {
    var activeTick = tickGroups[activeId] || activeId;
    document.querySelectorAll('.tick').forEach(function (t) {
      t.classList.toggle('on', t.getAttribute('data-tick') === activeTick);
    });
    document.querySelectorAll('.nav-link').forEach(function (b) {
      b.classList.toggle('on', b.getAttribute('data-goto') === activeTick);
    });
  }

  var k = motion ? (touchCapable ? 0.34 : 0.09) : 1;

  function loop() {
    requestAnimationFrame(loop);

    var target = Math.min(window.scrollY, maxScroll);
    var vel = target - cur;
    cur += vel * k;
    if (Math.abs(target - cur) < 0.05) cur = target;

    // inclinação sutil proporcional à velocidade (a página "cede" ao movimento)
    if (motion) {
      skew += (Math.max(-5, Math.min(5, vel * 0.006)) - skew) * 0.12;
      if (Math.abs(skew) < 0.005) skew = 0;
    }
    track.style.transform = 'translate3d(' + (-cur).toFixed(2) + 'px,0,0) skewX(' + skew.toFixed(3) + 'deg)';
    if (fill) fill.style.transform = 'scaleX(' + (maxScroll > 0 ? cur / maxScroll : 0).toFixed(4) + ')';

    // cursor-pincel: ponto imediato, anel com inércia
    if (cursorOn && mouse) {
      curDot.style.transform = 'translate3d(' + mouse.x + 'px,' + mouse.y + 'px,0)';
      if (!ringPos) ringPos = { x: mouse.x, y: mouse.y };
      ringPos.x += (mouse.x - ringPos.x) * 0.18;
      ringPos.y += (mouse.y - ringPos.y) * 0.18;
      curRing.style.transform = 'translate3d(' + ringPos.x.toFixed(1) + 'px,' + ringPos.y.toFixed(1) + 'px,0)';
    }

    // ensō do hero: o cursor empurra a tinta do traço (só enquanto o painel é visível)
    if (ensoDeform && mouse && cur < vw) {
      var er = ensoDeform.svg.getBoundingClientRect();
      var scl = er.width > 0 ? 780 / er.width : 1;
      var emx = (mouse.x - er.left) * scl;
      var emy = (mouse.y - er.top) * scl;
      var INF = 175;   // raio de influência do pincel (unidades do viewBox)
      var STR = 60;    // força máxima do empurrão
      for (var ri = 0; ri < ensoDeform.rings.length; ri++) {
        var ring = ensoDeform.rings[ri];
        for (var pi = 0; pi < ring.pts.length; pi++) {
          var pt = ring.pts[pi];
          var rx = Math.cos(pt.a), ry = Math.sin(pt.a);
          var pxx = 390 + rx * pt.r, pyy = 390 + ry * pt.r;
          var ddx = pxx - emx, ddy = pyy - emy;
          var dd = Math.sqrt(ddx * ddx + ddy * ddy);
          var push = 0;
          if (dd < INF) {
            var f = 1 - dd / INF;
            // componente radial do "sopro" do pincel: afasta o traço do cursor
            push = f * f * STR * ((ddx * rx + ddy * ry) / (dd || 1));
          }
          pt.v += (pt.base + push - pt.r) * 0.14;
          pt.v *= 0.8;
          pt.r += pt.v;
        }
        ring.path.setAttribute('d', ensoPathD(ring.pts));
      }
    }

    // eixo da trajetória se desenha conforme o painel entra em cena
    if (tlPath && motion) {
      var tp = Math.max(0, Math.min(1, (cur + vw * 0.92 - tlOff) / tlW));
      tlPath.style.strokeDashoffset = (100 - tp * 100).toFixed(2);
    }

    // parallax
    if (motion) {
      var vc = cur + vw / 2;
      for (var i = 0; i < plx.length; i++) {
        var p = plx[i];
        var dist = vc - (p.off + p.w / 2);
        p.el.style.translate = (dist * p.depth).toFixed(1) + 'px 0';
      }
    }

    // seção ativa
    var secId = '';
    for (var s = 0; s < panels.length; s++) {
      if (panels[s].offsetLeft <= cur + vw * 0.55) secId = panels[s].id;
    }
    if (secId && secId !== lastSectionId) {
      lastSectionId = secId;
      refreshIndicator();
      updateTicks(secId);
    }

    checkReveals();

  }

  requestAnimationFrame(loop);
})();
