(function(){
  const Q=new URLSearchParams(location.search), JUMP=Q.get('jump');
  if(JUMP!==null)history.scrollRestoration='manual';
  const html=document.documentElement;

  /* ---------- projects (one list, same weight for all) ---------- */
  const P=[
    {n:'Authentic',y:'2026',k:'Plataforma web',ke:'Web platform',st:'Angular · TypeScript · PostgreSQL · Docker',
     d:'Plataforma white-label da Beontag para criar e gerir EGCs (Entidades Gestoras de Chaves), as instâncias que guardam as chaves das tags de pedágio free-flow. Cada cliente recebe uma EGC isolada, com banco, VPN e chaves próprios.',
     de:'A white-label platform by Beontag to create and manage EGCs (key management entities), the instances that hold the keys behind free-flow toll tags. Each client gets an isolated EGC with its own database, VPN and keys.',
     flow:['Console','Provisionamento','EGC','VPN','SLT · ECT','Tags'],flowe:['Console','Provisioning','EGC','VPN','SLT · ECT','Tags'],
     pts:['Criar uma EGC sobe uma instância em Docker ou Kubernetes, com imagem dos webservices, PostgreSQL próprio, sub-rede de VPN e endereço público.',
          'O cadastro segue a ordem do script de população: organização (região, empresas, acordos), equipamentos (SLT, ECT, MCR), tags e faixas e chaves de grupo.',
          'White-label: o que muda de um cliente para outro é dado, não código. A empresa titular, as regiões, as faixas e os acordos ficam na própria EGC.',
          'Par RSA 2048 gerado no provisionamento. A chave privada fica cifrada e nunca aparece em tela; as chaves de grupo aparecem mascaradas.'],
     ptse:['Creating an EGC starts an instance on Docker or Kubernetes, with the web services image, its own PostgreSQL, a VPN subnet and a public address.',
          'Setup follows the seed script order: organization (regions, companies, agreements), equipment (SLT, ECT, MCR), tags, then ranges and group keys.',
          'White-label: what changes between clients is data, not code. The owning company, regions, ranges and agreements live inside each EGC.',
          'An RSA 2048 pair is generated at provisioning. The private key stays encrypted and never shows on screen; group keys are always masked.']},
    {n:'StudyENEM',y:'2026',k:'TCC · plataforma web',ke:'Capstone · web platform',st:'Angular 17 · ASP.NET Core 8 · EF Core · PostgreSQL 16',link:'https://github.com/joao-paulo-yudi/StudyENEM',
     d:'Plataforma de simulados do ENEM baseada em Learning Analytics, feita como TCC de Ciência da Computação no IFSP. Mede o desempenho por área e conteúdo e gera um plano de estudos priorizado pelo índice de dificuldade.',
     de:'An ENEM practice exam platform based on Learning Analytics, built as my Computer Science capstone at IFSP. It measures performance per area and topic and builds a study plan ranked by a difficulty index.',
     flow:['Angular','nginx','ASP.NET Core','Services','EF Core','PostgreSQL'],flowe:['Angular','nginx','ASP.NET Core','Services','EF Core','PostgreSQL'],
     pts:['Controllers Auth, Questions, Attempts, Dashboard e StudyPlan; serviços ExamService, TriScorer, PerformanceCalculator e StudyPlanService.',
          'Banco com a prova completa do ENEM 2022 (185 questões), criado por migrations do EF Core a partir de dados públicos do INEP.',
          'Nota estimada pela TRI (modelo de três parâmetros), validada nos testes contra 48 notas oficiais.',
          'Ciclo de Learning Analytics: capturar, reportar, predizer, agir e refinar. Desenvolvido com Design Centrado no Usuário e avaliado com especialistas.'],
     ptse:['Controllers Auth, Questions, Attempts, Dashboard and StudyPlan; services ExamService, TriScorer, PerformanceCalculator and StudyPlanService.',
          'Database with the full ENEM 2022 exam (185 questions), created by EF Core migrations from public INEP data.',
          'Score estimated with IRT (three-parameter model), validated in tests against 48 official scores.',
          'Learning Analytics loop: capture, report, predict, act and refine. Built with User-Centered Design and evaluated with experts.']},
    {n:'Easyland',y:'2025',k:'MES · indústria',ke:'MES · manufacturing',st:'React · Angular · TypeScript',
     d:'Front-end do MES de uma fábrica de peças agrícolas, dividido em microsserviços. Um painel em React para a gestão e um app em Angular para o operador apontar produção, refugo e etapas.',
     de:'Front end of the MES for an agricultural parts factory, split into microservices. A React dashboard for management and an Angular app where operators log output, scrap and steps.',
     flow:['UI','Gateway','Orchestrator','Serviços','Broker'],flowe:['UI','Gateway','Orchestrator','Services','Broker'],
     pts:['Gateway: entrada única, confere o token e roteia cada chamada para o serviço certo.',
          'Orchestrator: conduz a ordem de produção (liberar, etapas, apontamento, inspeção, encerramento).',
          'Serviços de produção, qualidade, rastreabilidade e telemetria, cada um com o próprio banco, trocando eventos por um broker.',
          'O registro de inspeção caiu de 15 para 2 minutos para mais de 50 operadores.'],
     ptse:['Gateway: single entry point that checks the token and routes each call to the right service.',
          'Orchestrator: runs the production order (release, steps, logging, inspection, close).',
          'Production, quality, traceability and telemetry services, each with its own database, exchanging events through a broker.',
          'Inspection logging went from 15 to 2 minutes for 50+ operators.']},
    {n:'ChamadoPro',y:'2026',k:'Sistema web',ke:'Web system',st:'Angular · Java',
     d:'Gestão de chamados para uma empresa de suporte de TI: fila por prioridade, escalonamento N1, N2 e N3 e SLA por prioridade.',
     de:'Ticketing for an IT support company: a priority queue, N1, N2 and N3 escalation and SLA per priority.'},
    {n:'J&R Motos',y:'2026',k:'Site',ke:'Website',st:'HTML · CSS · JavaScript · Vercel',
     d:'Site de um guincho de motos 24h em Sorocaba, com contato direto pelo WhatsApp e animações 3D leves.',
     de:'Website for a 24-hour motorcycle tow service in Sorocaba, with direct WhatsApp contact and light 3D animation.'},
    {n:'Tasca Beach Club',y:'2026',k:'Site · reservas',ke:'Website · bookings',st:'HTML · CSS · JavaScript · Supabase',
     d:'Site de um clube com seis quadras de areia, com reserva de horário online e painel administrativo.',
     de:'Website for a club with six sand courts, with online court booking and an admin panel.'},
    {n:'Conceito Pet Store',y:'2026',k:'Site · agendamento',ke:'Website · scheduling',st:'HTML · CSS · JavaScript · Supabase',
     d:'Site de pet shop em Votorantim com agendamento de banho e tosa confirmado pelo WhatsApp.',
     de:'Pet shop website in Votorantim with grooming booking confirmed over WhatsApp.'},
    {n:'Bella Formosa',y:'2026',k:'Catálogo',ke:'Catalog',st:'HTML · CSS · JavaScript · Supabase',
     d:'Catálogo de uma loja de moda em Sorocaba, com pedido pelo WhatsApp e painel para a loja editar as peças.',
     de:'Catalog for a clothing store in Sorocaba, with ordering over WhatsApp and a panel for the store to edit items.'},
    {n:'Vila da Praia',y:'2026',k:'Site',ke:'Website',st:'HTML · CSS · JavaScript',
     d:'Site de um espaço de esportes de areia e bar, com agenda de eventos, mapa e contato pelo WhatsApp.',
     de:'Website for a beach sports venue and bar, with an events calendar, a map and WhatsApp contact.'}
  ];
  const box=document.getElementById('proj');
  function renderProjects(){
    const en=html.lang==='en', open=[...box.querySelectorAll('.p.open')].map(e=>e.dataset.i);
    box.innerHTML=P.map((p,i)=>`
      <div class="p${open.includes(String(i))?' open':''}" data-i="${i}">
        <button class="ph" type="button" aria-expanded="${open.includes(String(i))}" aria-controls="pb${i}">
          <span class="pn">${p.n}</span><span class="pk mono">${en?p.ke:p.k}</span><span class="py mono">${p.y}</span><span class="px" aria-hidden="true"></span>
        </button>
        <div class="pb" id="pb${i}"><div class="pin">
          <p>${en?p.de:p.d}</p>
          <p class="mono pst">${p.st}</p>
          ${p.flow?`<p class="mono plab">${en?'Architecture':'Arquitetura'}</p><ol class="flow">${(en?p.flowe:p.flow).map(f=>`<li>${f}</li>`).join('')}</ol><ul class="pts">${(en?p.ptse:p.pts).map(t=>`<li>${t}</li>`).join('')}</ul>`:''}
          ${p.link?`<a class="btn ghost sm" href="${p.link}" target="_blank" rel="noopener">${en?'Code on GitHub':'Código no GitHub'} ↗</a>`:''}
        </div></div>
      </div>`).join('');
  }
  const OPEN=Q.get('open'); if(OPEN!==null){setTimeout(()=>{OPEN.split(',').forEach(i=>{const p=box.querySelector(`.p[data-i="${i}"]`); if(p){p.classList.add('open');p.querySelector('.ph').setAttribute('aria-expanded','true');}});},0);}
  box.addEventListener('click',e=>{const b=e.target.closest('.ph');if(!b)return;const p=b.parentElement;const o=!p.classList.contains('open');p.classList.toggle('open',o);b.setAttribute('aria-expanded',o);});

  /* ---------- i18n ---------- */
  const nodes=[...document.querySelectorAll('[data-en]')]; nodes.forEach(n=>n.dataset.pt=n.innerHTML);
  const lb=document.getElementById('lang');
  function setLang(l){html.lang=l==='en'?'en':'pt-BR';nodes.forEach(n=>n.innerHTML=l==='en'?n.dataset.en:n.dataset.pt);lb.textContent=l==='en'?'PT':'EN';lb.setAttribute('aria-label',l==='en'?'Mudar para português':'Switch to English');renderProjects();try{localStorage.setItem('jpy-lang',l)}catch(e){}}
  lb.addEventListener('click',()=>setLang(html.lang==='en'?'pt':'en'));
  let saved=null;try{saved=localStorage.getItem('jpy-lang')}catch(e){}
  setLang(Q.get('lang')||saved||(navigator.language&&!navigator.language.startsWith('pt')?'en':'pt'));

  /* ---------- header + reveal ---------- */
  const top=document.getElementById('top'); let lastY=0;
  const ct=document.getElementById('contato');
  addEventListener('scroll',()=>{const y=scrollY;const ctop=ct.getBoundingClientRect().top; document.body.classList.toggle('night',ctop<innerHeight*.55); if(innerWidth<860){const sc=document.getElementById('scene'); const hero=Math.max(0,1-y/(innerHeight*.28)); const end=Math.max(0,Math.min(1,(innerHeight*.75-ctop)/(innerHeight*.4))); sc.style.opacity=String(Math.max(hero,end));} else document.getElementById('scene').style.opacity='1';top.classList.toggle('scrolled',y>20);if(Math.abs(y-lastY)>6){top.classList.toggle('away',y>lastY&&y>innerHeight*.8);lastY=y;}},{passive:true});
  const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}}),{rootMargin:'0px 0px -8% 0px',threshold:.06});
  document.querySelectorAll('.rv').forEach(n=>io.observe(n));

  /* ---------- dev contract ---------- */
  const ready=()=>{ if(JUMP!==null){window.__settle=true;scrollTo(0,+JUMP||0);document.querySelectorAll('.rv').forEach(n=>n.classList.add('in'));}
    requestAnimationFrame(()=>requestAnimationFrame(()=>{window.__ready=true;}));};
  const wait=()=>window.__sceneReady?ready():setTimeout(wait,50);
  (document.fonts?document.fonts.ready:Promise.resolve()).then(wait);
})();
