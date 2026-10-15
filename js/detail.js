/* Project pages: language, nav hairline, reveals. Same behaviour as the index (site.js). */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const isEN = () => root.classList.contains('lang-en');

  /* ---------- language ---------- */
  function setLang(l) {
    root.classList.toggle('lang-en', l === 'en');
    root.lang = l === 'en' ? 'en' : 'pt-BR';
    try { localStorage.setItem('jpy-lang', l); } catch (e) {}
    $$('.lang button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === l)));
  }
  $$('.lang button').forEach(b => b.addEventListener('click', () => setLang(b.dataset.lang)));
  $$('.lang button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === (isEN() ? 'en' : 'pt'))));

  /* ---------- nav ---------- */
  const nav = $('#nav');
  const onScroll = () => nav.classList.toggle('scrolled', scrollY > 24);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- reveals ---------- */
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  const revealEls = $$('.sec .sec-head > *, .sec .col-copy > *, .sec .win, .more-head, .np, .pp-cta > *');
  revealEls.forEach(el => el.classList.add('reveal'));
  const rIO = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const sibs = [...e.target.parentElement.children].filter(c => c.classList.contains('reveal'));
    e.target.style.transitionDelay = (Math.max(0, sibs.indexOf(e.target)) * 0.08).toFixed(2) + 's';
    e.target.classList.add('in');
    rIO.unobserve(e.target);
  }), { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  revealEls.forEach(el => rIO.observe(el));
})();
