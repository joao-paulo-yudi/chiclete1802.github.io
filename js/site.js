/* Stage: the lantern unfolds behind the page while it scrolls normally (nothing is pinned). */
(function(){
  const Q=new URLSearchParams(location.search), JUMP=Q.get('jump');
  if(JUMP!==null)history.scrollRestoration='manual';
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  const ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
  const easeOut=t=>1-Math.pow(1-t,3);

  /* ---------- i18n ---------- */
  const html=document.documentElement;
  const nodes=[...document.querySelectorAll('[data-en]')];
  nodes.forEach(n=>n.dataset.pt=n.innerHTML);
  const langBtn=document.getElementById('lang');
  function setLang(l){
    html.lang=l==='en'?'en':'pt-BR';
    nodes.forEach(n=>{n.innerHTML=l==='en'?n.dataset.en:n.dataset.pt;});
    langBtn.textContent=l==='en'?'PT':'EN';
    langBtn.setAttribute('aria-label',l==='en'?'Mudar para português':'Switch to English');
    window.Diagrams&&Diagrams.relabel(); fanInfo&&fanInfo();
    try{localStorage.setItem('jpy-lang',l);}catch(e){}
  }
  langBtn.addEventListener('click',()=>setLang(html.lang==='en'?'pt':'en'));
  let saved=null; try{saved=localStorage.getItem('jpy-lang');}catch(e){}
  const startLang=Q.get('lang')||saved||(navigator.language&&!navigator.language.startsWith('pt')?'en':'pt');

  /* ---------- stage ---------- */
  const stage=document.getElementById('stage'), cv=document.getElementById('stageCanvas'), ctx=cv.getContext('2d');
  const hanko=document.getElementById('hanko'), vid=document.getElementById('stageVideo'), wash=document.getElementById('stageWash'), shade=document.getElementById('stageShade');
  const off=document.createElement('canvas'), octx=off.getContext('2d');
  const N=7;
  // focal point of each frame (0..1): lantern centre
  const F=[[.735,.46],[.735,.46],[.735,.46],[.735,.5],[.5,.47],[.5,.47],[.5,.47]];
  let W=0,H=0,dpr=1,portrait=false;
  const big=()=>Math.max(innerWidth,innerHeight)*Math.min(devicePixelRatio||1,1.25)>2000;
  const imgs=[];let loaded=0;
  for(let i=0;i<N;i++){const im=new Image();im.decoding='async';im.src=`img/hero/k${i+1}-${big()?2400:1280}.webp`;im.onload=()=>{loaded++;need=true;};imgs.push(im);}
  function resize(){
    dpr=Math.min(devicePixelRatio||1,1.25); W=innerWidth;H=innerHeight; portrait=W/H<.9;
    cv.width=off.width=Math.round(W*dpr); cv.height=off.height=Math.round(H*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0); octx.setTransform(dpr,0,0,dpr,0,0); need=true;
    vid.classList.toggle('portrait',portrait);
  }
  // returns {s,x,y} placement of image i at camera zoom z
  function place(i,z){
    const im=imgs[i], iw=im.naturalWidth||2400, ih=im.naturalHeight||1340, [fx,fy]=F[i];
    if(portrait&&i<4){
      const s0=H*.5/ih, s=s0*z; const fsx=W/2, fsy=H-ih*s0+fy*ih*s0- H*.02;
      return {s,x:fsx-fx*iw*s,y:fsy-fy*ih*s,fsx,fsy,iw,ih};
    }
    const s0=Math.max(W/iw,H/ih), s=s0*z;
    let fsx=(W-iw*s0)/2+fx*iw*s0, fsy=(H-ih*s0)/2+fy*ih*s0;
    if(!portrait&&i<4){fsx=W*.68;} // keep the lantern right of the copy
    let x=fsx-fx*iw*s, y=fsy-fy*ih*s;
    x=Math.min(0,Math.max(W-iw*s,x)); y=Math.min(0,Math.max(H-ih*s,y));
    return {s,x,y,fsx,fsy,iw,ih};
  }
  function draw(c,i,z){
    const im=imgs[i]; if(!im.complete||!im.naturalWidth)return null;
    const p=place(i,z);
    if(portrait&&i<4){c.fillStyle='#0E0F0D';c.fillRect(0,0,W,H);}
    c.drawImage(im,p.x,p.y,p.iw*p.s,p.ih*p.s);
    if(portrait&&i<4){const g=c.createLinearGradient(0,p.y,0,p.y+H*.18);g.addColorStop(0,'rgba(14,15,13,1)');g.addColorStop(1,'rgba(14,15,13,0)');c.fillStyle=g;c.fillRect(0,p.y-2,W,H*.18+2);}
    return p;
  }
  // per-segment camera zoom for frame i at local t (0..1 of its life)
  function zoomOf(i,t){
    if(i===4)return 1+.314*ease(t);   // kf05 grows into kf06's size
    if(i===5)return 1+1.25*ease(t);   // kf06 pushes into the paper
    return 1+.03*t;
  }
  let P=0,Pt=0,need=true,span=1;
  function measure(){
    const open=document.getElementById('open'); span=Math.max(1,open.offsetHeight-innerHeight);
  }
  // piecewise timeline: frames 1-4 while the copy is on screen, 5-7 once it has gone
  function tmap(p){return p<.64?p/.64*3.62:Math.min(6,3.62+(p-.64)/.24*2.38);}
  function render(){
    // timeline: frames 0..6; each of 6 segments has a hold (0..h) and a handoff (h..1)
    const segs=N-1, x=tmap(clamp(P)), i=Math.min(segs-1,Math.floor(x)), t=x-i, h=.58;
    ctx.clearRect(0,0,W,H);
    const hold=t<h?t/h:1, k=t<h?0:(t-h)/(1-h);
    const zi=zoomOf(i,hold);
    const pa=draw(ctx,i,zi);
    if(k>0&&pa){
      const j=i+1;
      octx.clearRect(0,0,W,H); const pb=draw(octx,j,zoomOf(j,0));
      if(pb){
        const e=ease(k);
        if(i>=4){ // aligned geometry: a soft bloom carries the handoff
          ctx.globalAlpha=e; ctx.drawImage(off,0,0,W,H); ctx.globalAlpha=1;
          const b=Math.sin(Math.PI*k)*.35; if(b>0){ctx.fillStyle=`rgba(255,236,214,${b})`;ctx.fillRect(0,0,W,H);}
        } else { // iris from the lantern's heart
          const cx=pa.fsx, cy=pa.fsy, R=Math.hypot(Math.max(cx,W-cx),Math.max(cy,H-cy))*1.05, r=R*e, fe=Math.max(40,R*.22);
          octx.globalCompositeOperation='destination-in';
          const g=octx.createRadialGradient(cx,cy,Math.max(0,r-fe),cx,cy,r+1);
          g.addColorStop(0,'rgba(0,0,0,1)');g.addColorStop(1,'rgba(0,0,0,0)');
          octx.fillStyle=g;octx.fillRect(0,0,W,H);octx.globalCompositeOperation='source-over';
          ctx.drawImage(off,0,0,W,H);
          // warm ring of light at the front of the iris
          const ring=ctx.createRadialGradient(cx,cy,Math.max(0,r-fe*.9),cx,cy,r+fe*.2);
          const a=Math.sin(Math.PI*k)*.22;
          ring.addColorStop(0,'rgba(255,214,170,0)');ring.addColorStop(.75,`rgba(255,214,170,${a})`);ring.addColorStop(1,'rgba(255,214,170,0)');
          ctx.globalCompositeOperation='lighter';ctx.fillStyle=ring;ctx.fillRect(0,0,W,H);ctx.globalCompositeOperation='source-over';
        }
      }
    }
    // shade follows the copy: strong while the hero/en copy is on screen, gone over the bright sheet
    shade.style.opacity=String(1-clamp((P-.62)/.1));
    wash.style.opacity=String(clamp((P-.86)/.12));
    const hk=clamp((P-.93)/.07); hanko.style.opacity=String(hk); hanko.style.transform=`translate(-50%,-50%) scale(${1.5-.5*easeOut(hk)}) rotate(-6deg)`;
    vid.style.opacity=P<.012?'1':'0';
    if(P<.012&&!reduced&&vid.paused&&document.visibilityState==='visible')vid.play().catch(()=>{});
    if(P>=.02&&!vid.paused)vid.pause();
  }
  function loop(){
    const y=scrollY, target=y/span;
    Pt=target;
    const dP=Pt-P;
    if(reduced||window.__settle)P=Pt; else P+=dP*.14;
    if(Math.abs(dP)<.0002)P=Pt;
    const visible=y<span+innerHeight*1.2;
    stage.style.visibility=visible?'visible':'hidden';
    if(visible&&(Math.abs(dP)>1e-5||need)){render();need=false;}
    header();
    requestAnimationFrame(loop);
  }

  /* ---------- header colour ---------- */
  let lastY=0; const openers=[...document.querySelectorAll('.opener')]; const darks=[...document.querySelectorAll('.opener,.contact')]; const foldLine=document.getElementById('foldLine'); const top=document.getElementById('top'), paper=document.querySelector('.paper'), contact=document.getElementById('contato');
  function header(){
    const a=paper.getBoundingClientRect(), c=contact.getBoundingClientRect();
    const p=scrollY/span; let dark=p<.78; if(p>=.78){dark=false; for(const d of darks){const r=d.getBoundingClientRect(); if(r.top<40&&r.bottom>40){dark=true;break;}}} const onPaper=!dark;
    top.classList.toggle('on-paper',onPaper);
    top.classList.toggle('solid',scrollY>24&&!(p>.6&&p<.95));
    for(const o of openers){const r=o.getBoundingClientRect(); if(r.bottom>0&&r.top<innerHeight){const q=clamp(1-(r.bottom)/(r.height+innerHeight)); o.firstElementChild.style.setProperty('--z',(1.1-.1*q).toFixed(4));}}
    const dy=scrollY-lastY; if(Math.abs(dy)>6){top.classList.toggle('away',dy>0&&scrollY>innerHeight*.9&&!(p>.6&&p<1.05));lastY=scrollY;}
    foldLine.style.opacity=String(clamp((p-.95)/.05)*(1-clamp((p-1.08)/.1)));
  }

  /* ---------- kanji draw (tied to scroll) ---------- */
  const kd=document.getElementById('kanjiDraw'), enSec=document.getElementById('en');
  function kanji(){
    const r=enSec.getBoundingClientRect(), q=reduced?1:clamp((innerHeight*.95-r.top)/(innerHeight*.9));
    kd.style.strokeDashoffset=String(1400*(1-easeOut(q)));
    kd.style.fill=`rgba(241,233,218,${clamp((q-.7)/.3)*.92})`;
    requestAnimationFrame(kanji);
  }

  /* ---------- reveal ---------- */
  const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}}),{rootMargin:'0px 0px -10% 0px',threshold:.08});
  document.querySelectorAll('.rv').forEach(n=>io.observe(n));

  /* ---------- timeline ---------- */
  const tl=document.getElementById('timeline'), rail=tl.querySelector('.rail i'), tlis=[...tl.querySelectorAll('li')];
  function timeline(){
    const r=tl.getBoundingClientRect(), q=reduced?1:clamp((innerHeight*.75-r.top)/(r.height));
    rail.style.height=(q*100)+'%';
    tlis.forEach(li=>{li.classList.toggle('on',(li.offsetTop+8)/tl.offsetHeight<=q+.001);});
    requestAnimationFrame(timeline);
  }

  /* ---------- contact: the lantern again ---------- */
  const cvid=document.getElementById('contactVideo');
  new IntersectionObserver(es=>{const e=es[0];
    if(e.isIntersecting){if(cvid.preload==='none'){cvid.preload='auto';cvid.load();}
      if(!reduced)cvid.play().then(()=>{cvid.style.opacity=1;}).catch(()=>{cvid.style.opacity=1;}); else cvid.style.opacity=1;}
    else cvid.pause();
  },{threshold:.25}).observe(contact);
  cvid.style.objectPosition='72% 50%';

  /* ---------- fan of other projects ---------- */
  const WORK=[
    {n:'J&R Motos',k:'Site · guincho 24h',ke:'Site · 24h tow truck',img:'img/work/jr-motos.webp',y:'2026',st:'HTML · CSS · JS · Vercel',
     d:'Guincho de motos em Sorocaba. O botão do WhatsApp é a maior coisa da tela, porque quem chega aqui está com a moto parada.',
     de:'A motorcycle tow service in Sorocaba. The WhatsApp button is the biggest thing on screen, because whoever lands here has a broken bike.'},
    {n:'Bella Formosa',k:'Catálogo · moda',ke:'Catalog · fashion',img:'img/work/bella-formosa.webp',y:'2026',st:'HTML · CSS · JS · Supabase',
     d:'Catálogo de moda evangélica com pedido pelo WhatsApp e um painel para a própria loja editar as peças.',
     de:'A modest-fashion catalog with ordering over WhatsApp and a panel where the store edits its own items.'},
    {n:'Conceito Pet',k:'Site · pet shop',ke:'Site · pet shop',img:'img/work/conceito-pet.webp',y:'2026',st:'HTML · CSS · JS · Supabase',
     d:'Pet shop em Votorantim. Agenda de banho e tosa em menos de um minuto, confirmada pelo WhatsApp.',
     de:'A pet shop in Votorantim. Grooming booked in under a minute, confirmed over WhatsApp.'},
    {n:'Vila da Praia',k:'Site · esportes de areia',ke:'Site · beach sports',img:'img/work/vila-da-praia.webp',y:'2026',st:'HTML · CSS · JS',
     d:'Quadras de areia e bar. Torneios, aulas e o caminho até lá, tudo terminando numa mensagem.',
     de:'Sand courts and a bar. Tournaments, classes and directions, all ending in one message.'},
    {n:'Tasca Beach Club',k:'Site · reservas',ke:'Site · bookings',img:null,y:'2026',st:'HTML · CSS · JS · Supabase',
     d:'Seis quadras de areia. Reserva de horário online e um painel para o clube cuidar da agenda.',
     de:'Six sand courts. Online court booking and a panel for the club to run its schedule.'},
    {n:'ChamadoPro',k:'Sistema · suporte de TI',ke:'System · IT support',img:'img/work/chamadopro.webp',y:'2026',st:'Angular · Java',
     d:'Gestão de chamados para uma empresa de suporte: fila por prioridade, escalonamento N1, N2 e N3 e SLA por prioridade.',
     de:'Ticketing for an IT support company: a priority queue, N1, N2 and N3 escalation and SLA per priority.'}
  ];
  const fan=document.getElementById('fan'), wrapF=document.getElementById('fanWrap');
  const cards=WORK.map((w,i)=>{
    const c=document.createElement('div'); c.className='card'; c.setAttribute('role','group'); c.setAttribute('aria-label',w.n);
    c.innerHTML=(w.img?`<div class="ph"><img decoding="async" src="${w.img}" alt="Captura do site ${w.n}" loading="lazy"></div>`:`<div class="ph type"><span>Tasca<br>Beach<br>Club</span></div>`)+
      `<div class="cn"><b>${w.n}</b><span>${w.y}</span></div><div class="kind" data-k="${i}"></div><span class="hk" aria-hidden="true">縁</span>`;
    c.addEventListener('click',()=>{if(!moved)go(i);});
    fan.appendChild(c); return c;
  });
  let idx=2, cur=2, moved=false;
  function fanInfo(){
    const w=WORK[Math.round(idx)], en=html.lang==='en';
    document.getElementById('fanName').textContent=w.n;
    document.getElementById('fanDesc').textContent=en?w.de:w.d;
    document.getElementById('fanMeta').textContent=`${en?w.ke:w.k} · ${w.st} · ${w.y}`;
    document.getElementById('fanCount').textContent=`${Math.round(idx)+1} / ${WORK.length}`;
    cards.forEach((c,i)=>{c.classList.toggle('on',i===Math.round(idx));c.querySelector('.kind').textContent=en?WORK[i].ke:WORK[i].k;});
  }
  window.fanInfo=fanInfo;
  function go(i){idx=clamp(i,0,WORK.length-1);fanInfo();}
  document.getElementById('fanPrev').onclick=()=>go(Math.round(idx)-1);
  document.getElementById('fanNext').onclick=()=>go(Math.round(idx)+1);
  wrapF.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'){go(Math.round(idx)-1);e.preventDefault();}if(e.key==='ArrowRight'){go(Math.round(idx)+1);e.preventDefault();}});
  let sx=0,si=0,drag=false;
  wrapF.addEventListener('pointerdown',e=>{drag=true;moved=false;sx=e.clientX;si=idx;wrapF.classList.add('drag');wrapF.setPointerCapture(e.pointerId);});
  wrapF.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-sx;if(Math.abs(dx)>6)moved=true;idx=clamp(si-dx/(cards[0].offsetWidth*.75),-.4,WORK.length-.6);});
  const end=()=>{if(!drag)return;drag=false;wrapF.classList.remove('drag');go(Math.round(idx));setTimeout(()=>moved=false,0);};
  wrapF.addEventListener('pointerup',end);wrapF.addEventListener('pointercancel',end);
  wrapF.addEventListener('wheel',e=>{if(Math.abs(e.deltaX)>Math.abs(e.deltaY)&&Math.abs(e.deltaX)>2){e.preventDefault();idx=clamp(idx+e.deltaX/400,0,WORK.length-1);clearTimeout(wrapF._t);wrapF._t=setTimeout(()=>go(Math.round(idx)),140);}},{passive:false});
  cards.forEach(c=>c.style.transition='border-color .3s');
  function fanTick(){
    cur+= (idx-cur)*(reduced||window.__settle?1:.14);
    cards.forEach((c,i)=>{const d=i-cur, ad=Math.abs(d);
      c.style.transform=`rotate(${d*10.5}deg) translateY(${ad*6}px)`;
      c.style.zIndex=String(100-Math.round(ad*10)); c.style.opacity=String(clamp(1.35-ad*.32,0,1));});
    requestAnimationFrame(fanTick);
  }

  /* ---------- boot ---------- */
  setLang(startLang==='en'?'en':'pt');
  addEventListener('resize',()=>{resize();measure();});
  resize(); measure(); fanInfo();
  requestAnimationFrame(loop); requestAnimationFrame(kanji); requestAnimationFrame(timeline); requestAnimationFrame(fanTick);
  // jank meter
  const J={d:[],l:performance.now()};(function j(n){J.d.push(n-J.l);J.l=n;if(J.d.length>240)J.d.shift();requestAnimationFrame(j);})(performance.now());
  window.__jank=()=>{const d=[...J.d].sort((a,b)=>a-b);return{p95:d[Math.floor(d.length*.95)]|0,max:d[d.length-1]|0};};
  const ready=()=>{
    if(JUMP!==null){window.__settle=true;scrollTo(0,+JUMP||0);document.querySelectorAll('.rv').forEach(n=>{const r=n.getBoundingClientRect();if(r.top<innerHeight)n.classList.add('in');});}
    P=Pt=scrollY/span; need=true; render();
    requestAnimationFrame(()=>requestAnimationFrame(()=>{window.__ready=true;}));
  };
  Promise.all([document.fonts?document.fonts.ready:0,new Promise(r=>{const c=()=>loaded>=N?r():setTimeout(c,60);c();})]).then(ready);
})();
