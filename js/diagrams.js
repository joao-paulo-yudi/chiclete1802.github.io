/* Ink diagrams: built from data, drawn by scroll position (no pinning), packets run once drawn. */
(function(){
  const NS='http://www.w3.org/2000/svg';
  const W=180,H=66;
  const D={
    authentic:{vb:[1240,600],
      groups:[{x:470,y:34,w:440,h:532,pt:'EGC · uma por cliente',en:'EGC · one per client'}],
      nodes:[
        {id:'console',n:1,x:30,y:267,t:'Console',s:'Authentic · todas as EGCs',se:'Authentic · every EGC',key:1},
        {id:'prov',n:2,x:250,y:267,t:'Provisionamento',te:'Provisioning',s:'Docker · Kubernetes'},
        {id:'ws',n:2,x:500,y:90,t:'Webservices',s:'imagem · tamanho P/M/G',se:'image · size S/M/L'},
        {id:'pg',n:2,x:710,y:90,t:'PostgreSQL',s:'egcinternational'},
        {id:'org',n:3,x:500,y:267,t:'Organização',te:'Organization',s:'region · company · agreement'},
        {id:'eq',n:4,x:710,y:267,t:'Equipamentos',te:'Equipment',s:'vpn_cert · slt · ect · mcr'},
        {id:'rsa',n:6,x:500,y:444,t:'Chave RSA 2048',te:'RSA 2048 key',s:'privada cifrada',se:'private, encrypted'},
        {id:'rng',n:5,x:710,y:444,t:'Faixas e chaves',te:'Ranges and keys',s:'tid · obuid · gid'},
        {id:'vpn',n:4,x:960,y:90,w:120,t:'VPN',s:'10.8.0.x'},
        {id:'slt',n:4,x:1110,y:200,w:110,t:'SLT',s:'pista',se:'lane'},
        {id:'ect',n:4,x:1110,y:334,w:110,t:'ECT',s:'personaliza',se:'personalizes'},
        {id:'tag',n:5,x:1030,y:470,w:190,t:'Tag · app',s:'faixas · chave de grupo',se:'ranges · group key'}
      ],
      edges:[
        ['console','prov'],['prov','ws'],['ws','pg'],['pg','eq','v'],['pg','org','vx'],['org','rsa','v'],['eq','rng','v'],
        ['ws','vpn'],['vpn','slt','hv'],['vpn','ect','hv'],['ect','tag','v'],['slt','tag','soft'],['rng','tag','soft'],['rsa','ect','soft2']
      ],
      route:[['console','prov'],['prov','ws'],['ws','vpn'],['vpn','slt'],['slt','tag']]
    },
    studyenem:{vb:[1240,520],
      groups:[{x:610,y:30,w:236,h:460,pt:'Services',en:'Services'}],
      nodes:[
        {id:'spa',n:1,x:20,y:227,w:170,t:'Angular 17',s:'SPA · Chart.js',key:1},
        {id:'ngx',n:2,x:225,y:227,w:150,t:'nginx',s:'/api · /midia'},
        {id:'api',n:3,x:410,y:227,w:170,t:'ASP.NET Core 8',s:'5 controllers'},
        {id:'exam',n:4,x:630,y:52,w:196,h:60,t:'ExamService',s:'monta a prova',se:'builds the exam'},
        {id:'tri',n:4,x:630,y:140,w:196,h:60,t:'TriScorer',s:'nota pela TRI',se:'IRT score'},
        {id:'perf',n:4,x:630,y:228,w:196,h:60,t:'PerformanceCalc.',s:'métricas',se:'metrics'},
        {id:'dash',n:4,x:630,y:316,w:196,h:60,t:'DashboardService',s:'evolução',se:'trend'},
        {id:'plan',n:4,x:630,y:404,w:196,h:60,t:'StudyPlanService',s:'plano priorizado',se:'ranked plan'},
        {id:'ef',n:5,x:880,y:227,w:140,t:'EF Core 8',s:'migrations'},
        {id:'db',n:5,x:1055,y:227,w:165,t:'PostgreSQL 16',s:'ENEM 2022'},
        {id:'goo',n:6,x:225,y:60,w:150,t:'Google',s:'ID token'},
        {id:'inep',n:6,x:1055,y:404,w:165,t:'Importador',te:'Importer',s:'Python · INEP'}
      ],
      edges:[
        ['spa','ngx'],['ngx','api'],['api','exam','h2'],['api','tri','h2'],['api','perf'],['api','dash','h2'],['api','plan','h2'],
        ['exam','ef','h3'],['tri','ef','h3'],['perf','ef'],['dash','ef','h3'],['plan','ef','h3'],['ef','db'],['goo','api','soft'],['inep','db','soft']
      ],
      route:[['spa','ngx'],['ngx','api'],['api','tri'],['tri','ef'],['ef','db']]
    },
    easyland:{vb:[1240,560],
      groups:[{x:690,y:28,w:500,h:500,pt:'um banco por serviço',en:'one database per service'}],
      nodes:[
        {id:'op',n:1,x:20,y:110,w:180,t:'Operador',te:'Operator',s:'Angular · tablet',key:1},
        {id:'dsh',n:1,x:20,y:384,w:180,t:'Painel',te:'Dashboard',s:'React · gestão',se:'React · management',key:1},
        {id:'gw',n:2,x:250,y:247,w:170,t:'Gateway',s:'token · rotas',se:'token · routes'},
        {id:'orc',n:3,x:465,y:247,w:180,t:'Orchestrator',s:'ciclo da OP',se:'order lifecycle'},
        {id:'prd',n:4,x:715,y:52,w:200,h:62,t:'Produção',te:'Production',s:'ordens · etapas',se:'orders · steps'},
        {id:'qua',n:4,x:715,y:168,w:200,h:62,t:'Qualidade',te:'Quality',s:'inspeção · refugo',se:'inspection · scrap'},
        {id:'trc',n:4,x:715,y:284,w:200,h:62,t:'Rastreabilidade',te:'Traceability',s:'história da peça',se:'part history'},
        {id:'tel',n:4,x:715,y:400,w:200,h:62,t:'Telemetria',te:'Telemetry',s:'sensores',se:'sensors'},
        {id:'d1',n:4,x:950,y:62,w:84,h:42,t:'db',db:1},{id:'d2',n:4,x:950,y:178,w:84,h:42,t:'db',db:1},
        {id:'d3',n:4,x:950,y:294,w:84,h:42,t:'db',db:1},{id:'d4',n:4,x:950,y:410,w:84,h:42,t:'db',db:1},
        {id:'bus',n:5,x:1070,y:150,w:100,h:240,t:'Broker',s:'eventos',se:'events',tall:1}
      ],
      edges:[
        ['op','gw','hv'],['gw','dsh','vh'],['gw','orc'],['orc','prd','h2'],['orc','qua','h2'],['orc','trc','h2'],['orc','tel','h2'],
        ['prd','d1'],['qua','d2'],['trc','d3'],['tel','d4'],
        ['d1','bus','soft'],['d2','bus','soft'],['d3','bus','soft'],['d4','bus','soft']
      ],
      route:[['op','gw'],['gw','orc'],['orc','qua'],['qua','d2'],['d2','bus'],['d3','bus','rev'],['trc','d3','rev'],['orc','trc','rev'],['gw','orc','rev'],['gw','dsh']]
    }
  };

  const el=(n,a,p)=>{const e=document.createElementNS(NS,n);for(const k in a)e.setAttribute(k,a[k]);if(p)p.appendChild(e);return e;};
  const lang=()=>document.documentElement.lang.startsWith('en')?'en':'pt';

  function box(n){return {x:n.x,y:n.y,w:n.w||W,h:n.h||H};}
  function pathFor(a,b,mode){
    const A=box(a),B=box(b);
    const ax=A.x+A.w,ay=A.y+A.h/2,bx=B.x,by=B.y+B.h/2;
    if(mode==='v'){const x=A.x+A.w/2;return `M${x} ${A.y+A.h} V${B.y}`;}
    if(mode==='vx'){ // from pg (right col) down-left to org: go down then left
      const x1=A.x+A.w/2, y2=B.y+B.h/2; return `M${x1} ${A.y+A.h} V${y2-40} H${B.x+B.w/2} V${B.y}`;}
    if(mode==='hv'){ // horizontal then vertical into top/bottom of B
      const tx=B.x+B.w/2; const goDown=B.y>ay; return `M${ax} ${ay} H${tx} V${goDown?B.y:B.y+B.h}`;}
    if(mode==='vh'){ // vertical from A bottom/top then horizontal into B right side
      const sx=A.x+A.w/2, goDown=B.y>A.y; const ty=B.y+B.h/2; return `M${sx} ${goDown?A.y+A.h:A.y} V${ty} H${B.x+B.w}`;}
    if(mode==='soft2'){const sx=A.x+A.w; const sy=A.y+A.h/2+14; const ex=B.x+B.w/2; return `M${sx} ${sy} H${A.x+A.w+26} V${A.y+A.h+40} H${ex} V${B.y+B.h}`;}
    const mx=mode==='h2'||mode==='h3'?(mode==='h2'?ax+ (bx-ax)*0.5:ax+(bx-ax)*0.5):(ax+bx)/2;
    if(Math.abs(ay-by)<1)return `M${ax} ${ay} H${bx}`;
    return `M${ax} ${ay} H${mx} V${by} H${bx}`;
  }

  const diagrams=[];
  function build(host){
    const key=host.dataset.diagram, d=D[key]; if(!d)return;
    const svg=el('svg',{viewBox:`0 0 ${d.vb[0]} ${d.vb[1]}`,role:'img','aria-label':host.getAttribute('aria-label')||key});
    const defs=el('defs',{},svg);
    const f=el('filter',{id:'ink-'+key,x:'-5%',y:'-5%',width:'110%',height:'110%'},defs);
    el('feTurbulence',{type:'fractalNoise',baseFrequency:'.035',numOctaves:'2',seed:'7',result:'n'},f);
    el('feDisplacementMap',{in:'SourceGraphic',in2:'n',scale:'2.2'},f);
    const gG=el('g',{},svg), gE=el('g',{filter:`url(#ink-${key})`},svg), gN=el('g',{},svg), gP=el('g',{},svg);
    const groups=d.groups.map(g=>{
      const r=el('rect',{x:g.x,y:g.y,width:g.w,height:g.h,class:'dg-group',rx:2},gG);
      const t=el('text',{x:g.x+12,y:g.y+20,class:'dg-glabel'},gG); t.textContent=lang()==='en'?g.en:g.pt; t._pt=g.pt;t._en=g.en;
      return {r,t};
    });
    const byId={};
    const nodes=d.nodes.map((n,i)=>{
      const b=box(n); const g=el('g',{class:'dg-node'+(n.key?' key':'')},gN); g.dataset.n=n.n;
      el('rect',{x:b.x,y:b.y,width:b.w,height:b.h,rx:n.db?20:2,filter:`url(#ink-${key})`},g);
      if(n.db){const t=el('text',{x:b.x+b.w/2,y:b.y+b.h/2+4,'text-anchor':'middle',class:'s'},g);t.textContent='db';}
      else if(n.tall){
        const t=el('text',{x:b.x+b.w/2,y:b.y+b.h/2-4,'text-anchor':'middle',class:'t'},g);t.textContent=n.t;
        const s=el('text',{x:b.x+b.w/2,y:b.y+b.h/2+16,'text-anchor':'middle',class:'s'},g);s.textContent=lang()==='en'&&n.se?n.se:n.s;s._pt=n.s;s._en=n.se||n.s;
      } else {
        const k=el('text',{x:b.x+10,y:b.y+18,class:'k'},g);k.textContent=String(n.n).padStart(2,'0');
        const t=el('text',{x:b.x+12,y:b.y+b.h-24,class:'t'},g);t.textContent=lang()==='en'&&n.te?n.te:n.t;t._pt=n.t;t._en=n.te||n.t;
        const s=el('text',{x:b.x+12,y:b.y+b.h-9,class:'s'},g);s.textContent=lang()==='en'&&n.se?n.se:(n.s||'');s._pt=n.s||'';s._en=n.se||n.s||'';
      }
      g.style.opacity=0; byId[n.id]={n,g,b}; return {g,n};
    });
    const edges=d.edges.map(([a,b,m])=>{
      const p=el('path',{d:pathFor(byId[a].n,byId[b].n,m),class:'dg-edge'+(m&&m.startsWith('soft')?' soft':'')},gE);
      const L=p.getTotalLength(); if(!(m&&m.startsWith('soft'))){p.style.strokeDasharray=L;p.style.strokeDashoffset=L;} else p.style.opacity=0;
      return {p,L,a,b,soft:m&&m.startsWith('soft'),key:a+'>'+b};
    });
    host.appendChild(svg);
    // order: node then its outgoing edges, following the data order
    const seq=[];const seen=new Set();
    d.nodes.forEach(n=>{seq.push({type:'n',o:byId[n.id]});});
    edges.forEach(e=>{const ia=d.nodes.findIndex(n=>n.id===e.a), ib=d.nodes.findIndex(n=>n.id===e.b); e.at=Math.max(ia,ib)-0.5;});
    const pkt=el('circle',{r:6,class:'pkt',opacity:0},gP);
    const halo=el('circle',{r:14,fill:'none',stroke:'#C4412B','stroke-opacity':.35,opacity:0},gP);
    const routePaths=d.route.map(([a,b,rev])=>{const e=edges.find(x=>x.a===a&&x.b===b);return e?{e,rev:!!rev}:null;}).filter(Boolean);
    const notes=document.querySelector(`[data-notes="${key}"]`);
    const obj={host,svg,nodes,edges,count:d.nodes.length,pkt,halo,routePaths,notes,groups,q:0,shown:-1,visible:false,t0:0};
    new IntersectionObserver(es=>{obj.visible=es[0].isIntersecting;},{rootMargin:'100px'}).observe(host);
    if(notes){notes.querySelectorAll('li').forEach(li=>{
      li.addEventListener('mouseenter',()=>hi(obj,li.dataset.n));li.addEventListener('mouseleave',()=>hi(obj,null));
    });}
    nodes.forEach(({g})=>{g.addEventListener('mouseenter',()=>hi(obj,g.dataset.n));g.addEventListener('mouseleave',()=>hi(obj,null));});
    diagrams.push(obj);
  }
  function hi(o,n){
    o.nodes.forEach(({g})=>g.classList.toggle('hot',n!==null&&g.dataset.n===String(n)));
    if(o.notes)o.notes.querySelectorAll('li').forEach(li=>li.classList.toggle('lit',n!==null&&li.dataset.n===String(n)));
  }
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  function update(now){
    const vh=innerHeight;
    for(const o of diagrams){
      const r=o.host.getBoundingClientRect();
      if((r.bottom<-200||r.top>vh+200)&&(o.q>=1||r.top>vh+200)&&!o.dirty){continue;}
      let q=reduced?1:clamp((vh*0.92-r.top)/(r.height*0.75+vh*0.2));
      if(window.__settle)q=q>0?1:q;
      if(Math.abs(q-o.q)<0.0005&&o.q>=1&&!o.visible)continue;
      o.q=q; const N=o.count, s=q*(N+1.2);
      o.nodes.forEach(({g},i)=>{const a=clamp(s-i);g.style.opacity=a;g.style.transform=`translateY(${(1-a)*8}px)`;});
      o.edges.forEach(e=>{const a=clamp((s-e.at)*1.2); if(e.soft)e.p.style.opacity=a*.9; else e.p.style.strokeDashoffset=e.L*(1-a);});
      // packets
      if(q>=1&&o.visible&&!reduced&&o.routePaths.length){
        if(!o.t0)o.t0=now;
        const per=900, total=o.routePaths.length*per+900, t=(now-o.t0)%total, i=Math.floor(t/per);
        if(i<o.routePaths.length){const {e,rev}=o.routePaths[i];const f=(t%per)/per;const ef=f<.5?2*f*f:1-Math.pow(-2*f+2,2)/2;
          const pt=e.p.getPointAtLength(e.L*(rev?1-ef:ef));o.pkt.setAttribute('cx',pt.x);o.pkt.setAttribute('cy',pt.y);o.halo.setAttribute('cx',pt.x);o.halo.setAttribute('cy',pt.y);
          o.pkt.setAttribute('opacity',1);o.halo.setAttribute('opacity',.8);
          const nb=e.b; o.nodes.forEach(({g,n})=>{ if(!g.classList.contains('hot-k')) return; });
        } else {o.pkt.setAttribute('opacity',0);o.halo.setAttribute('opacity',0);}
      } else {o.pkt.setAttribute('opacity',0);o.halo.setAttribute('opacity',0);if(q<1)o.t0=0;}
    }
    // steps strip
    (window.__stepsEls||(window.__stepsEls=[...document.querySelectorAll('[data-steps]')])).forEach(ol=>{
      const r=ol.getBoundingClientRect(); const q=reduced?1:clamp((vh*0.85-r.top)/(vh*0.55));
      const lis=ol.children; const k=Math.round(q*lis.length);
      for(let i=0;i<lis.length;i++)lis[i].classList.toggle('on',i<k);
    });
    cycleUpdate(vh);
    requestAnimationFrame(update);
  }

  /* ---- Learning Analytics cycle ---- */
  let cyc=null;
  function buildCycle(host){
    const S=[['Capturar','Capture','respostas · tempo','answers · time'],['Reportar','Report','dashboard','dashboard'],['Predizer','Predict','nota pela TRI','IRT score'],['Agir','Act','plano de estudos','study plan'],['Refinar','Refine','novo simulado','next exam']];
    const svg=el('svg',{viewBox:'-90 -40 740 640',role:'img','aria-label':'Ciclo de Learning Analytics'});
    const cx=280,cy=280,R=200;
    el('circle',{cx,cy,r:R,class:'cy-ring'},svg);
    const arc=el('circle',{cx,cy,r:R,class:'cy-arc',transform:`rotate(-90 ${cx} ${cy})`},svg);
    const C=2*Math.PI*R; arc.style.strokeDasharray=C; arc.style.strokeDashoffset=C;
    const ct=el('text',{x:cx,y:cy-4,'text-anchor':'middle',class:'cy-center'},svg); ct.textContent='LEARNING';
    const ct2=el('text',{x:cx,y:cy+18,'text-anchor':'middle',class:'cy-center'},svg); ct2.textContent='ANALYTICS';
    const dots=S.map((s,i)=>{
      const a=-Math.PI/2+i*2*Math.PI/5, x=cx+R*Math.cos(a), y=cy+R*Math.sin(a);
      const d=el('circle',{cx:x,cy:y,r:11,class:'cy-dot'},svg);
      const out=1.26, tx=cx+R*out*Math.cos(a), ty=cy+R*out*Math.sin(a);
      const anchor=Math.abs(Math.cos(a))<.2?'middle':(Math.cos(a)>0?'start':'end');
      const t=el('text',{x:tx,y:ty-2,'text-anchor':anchor,class:'cy-t'},svg); t.textContent=lang()==='en'?s[1]:s[0]; t._pt=s[0];t._en=s[1];
      const u=el('text',{x:tx,y:ty+16,'text-anchor':anchor,class:'cy-s'},svg); u.textContent=lang()==='en'?s[3]:s[2]; u._pt=s[2];u._en=s[3];
      return d;
    });
    host.appendChild(svg); cyc={host,arc,C,dots};
  }
  function cycleUpdate(vh){
    if(!cyc)return; const r=cyc.host.getBoundingClientRect();
    const q=reduced?1:clamp((vh*0.88-r.top)/(r.height*0.8));
    cyc.arc.style.strokeDashoffset=cyc.C*(1-q);
    cyc.dots.forEach((d,i)=>d.classList.toggle('on',q>=i/5+0.001));
  }

  window.Diagrams={relabel(){document.querySelectorAll('.diagram text, .cycle text').forEach(t=>{if(t._pt!==undefined)t.textContent=lang()==='en'?t._en:t._pt;});
    diagrams.forEach(o=>o.groups.forEach(g=>{g.t.textContent=lang()==='en'?g.t._en:g.t._pt;}));}};
  function init(){
    document.querySelectorAll('[data-diagram]').forEach(build);
    const c=document.querySelector('[data-cycle]'); if(c)buildCycle(c);
    requestAnimationFrame(update);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
