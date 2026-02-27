import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { fetchPosts, savePost, deletePost, isSupabaseConfigured, fetchCms, saveCms as saveCmsCloud, subscribeToPosts } from "@/lib/supabase-queries";
import {
  T,
  T_DARK,
  T_LIGHT,
  setThemeTokens,
  THEME_STORAGE_KEY,
  COLUMNS,
  POST_TYPES,
  PILLARS,
  USERS,
  CMS_STORAGE_KEY,
  POSTS_STORAGE_KEY,  GEMINI_KEY_STORAGE,
  defaultCms,
  loadCms,
  saveCms,
  loadPosts,
  savePosts,
  genId,
  fmtDate,
  fmtNum,
  CARD_FORM_FIELDS,
  DAY_NAMES,
  DAY_NAMES_CAL,
  getWeekDates,
  CSS,
} from "@/lib/theme-tokens";
import ImportIdeasModal from "./ImportIdeasModal";

// ============================================================================
// PILATESPOST v4 — Board + Calendar + AI + Metrics + Trends + CRM + STORIES
// ============================================================================

// --- STORY TYPES & TEMPLATES ---
const STORY_TYPES=[
  {id:"text",label:"Texto",icon:"📝",color:"#FF6B35"},
  {id:"poll",label:"Enquete",icon:"📊",color:"#F7C948"},
  {id:"quiz",label:"Quiz",icon:"❓",color:"#A78BFA"},
  {id:"question",label:"Caixinha",icon:"💬",color:"#4ECDC4"},
  {id:"countdown",label:"Contagem",icon:"⏰",color:"#FF5757"},
  {id:"link",label:"Link",icon:"🔗",color:"#45B7D1"},
  {id:"photo",label:"Foto",icon:"📷",color:"#5DE8A0"},
  {id:"video",label:"Vídeo",icon:"🎥",color:"#FF8FAB"},
  {id:"repost",label:"Repost",icon:"🔄",color:"#C0C0C0"},
];

const STORY_TEMPLATES=[
  {id:"t1",name:"Enquete Provocativa",desc:"Gancho + Enquete + Resultado + CTA",color:"#FF6B35",slides:[
    {type:"text",content:"Pergunta provocativa para gerar curiosidade",bg:"gradient-fire"},
    {type:"poll",content:"Enquete: Opção A vs Opção B",bg:"gradient-dark"},
    {type:"text",content:"Revelação do resultado + sua opinião",bg:"gradient-fire"},
    {type:"link",content:"CTA: Link para post/conteúdo completo",bg:"gradient-dark"},
  ]},
  {id:"t2",name:"Bastidores do Studio",desc:"Dia a dia + humanização",color:"#5DE8A0",slides:[
    {type:"photo",content:"Foto chegando no studio (manhã)",bg:"gradient-green"},
    {type:"video",content:"Vídeo curto de uma aula/exercício",bg:"gradient-green"},
    {type:"text",content:"Reflexão ou aprendizado do dia",bg:"gradient-dark"},
    {type:"question",content:"Caixinha: O que vocês querem ver?",bg:"gradient-green"},
  ]},
  {id:"t3",name:"Lançamento / Countdown",desc:"Antecipação + escassez + CTA",color:"#FF5757",slides:[
    {type:"text",content:"Teaser: Algo grande vem aí...",bg:"gradient-purple"},
    {type:"countdown",content:"Contagem regressiva para o lançamento",bg:"gradient-fire"},
    {type:"text",content:"Detalhes + benefícios",bg:"gradient-dark"},
    {type:"link",content:"Link de inscrição / compra",bg:"gradient-fire"},
  ]},
  {id:"t4",name:"Educativo Rápido",desc:"Dica + demonstração + save",color:"#4ECDC4",slides:[
    {type:"text",content:"Título: Dica rápida sobre [tema]",bg:"gradient-cyan"},
    {type:"video",content:"Demonstração prática (15-30s)",bg:"gradient-dark"},
    {type:"text",content:"Explicação técnica simplificada",bg:"gradient-cyan"},
    {type:"poll",content:"Enquete: Você já sabia disso?",bg:"gradient-dark"},
  ]},
  {id:"t5",name:"Q&A / Caixinha",desc:"Perguntas + respostas + autoridade",color:"#A78BFA",slides:[
    {type:"question",content:"Caixinha: Me pergunte sobre [tema]",bg:"gradient-purple"},
    {type:"text",content:"Resposta 1 (texto ou foto com resposta)",bg:"gradient-dark"},
    {type:"text",content:"Resposta 2",bg:"gradient-purple"},
    {type:"text",content:"Resposta 3 + encerramento",bg:"gradient-dark"},
  ]},
];

// --- STORY SEQUENCES DATA ---
const INITIAL_STORIES=[
  {id:"s1",title:"Bastidores segunda-feira",status:"published",scheduledDate:"2026-02-24",pillar:"bastidores",assignee:"rafael",
    slides:[
      {id:"sl1",type:"photo",content:"Chegando no studio às 6h ☀️",notes:"Foto da fachada com luz da manhã"},
      {id:"sl2",type:"video",content:"Exercício do dia: Reformer footwork",notes:"15 segundos, vertical"},
      {id:"sl3",type:"text",content:"Cada dia é uma chance de ser melhor que ontem 🧠",notes:"Fundo gradiente escuro"},
      {id:"sl4",type:"question",content:"O que vocês querem aprender essa semana?",notes:"Caixinha de perguntas"},
    ],
    metrics:{views:3200,replies:45,shares:23,exits:890,taps_forward:1200,taps_back:340,completion:"72%"},
  },
  {id:"s2",title:"Enquete: Preço de aula",status:"scheduled",scheduledDate:"2026-02-25",pillar:"provocativo",assignee:"rafael",
    slides:[
      {id:"sl5",type:"text",content:"QUANTO VOCÊ COBRA POR AULA? 🤔",notes:"Bold, fundo vermelho/laranja"},
      {id:"sl6",type:"poll",content:"Enquete: Menos de R$80 vs Mais de R$80",notes:"Engajar antes do reel"},
      {id:"sl7",type:"text",content:"85% dos instrutores cobram MENOS que deveriam",notes:"Dado provocativo"},
      {id:"sl8",type:"link",content:"👆 Veja o reel completo sobre precificação",notes:"Linkar pro reel agendado"},
    ],
    metrics:null,
  },
  {id:"s3",title:"Quiz: Pilates para gestantes",status:"draft",scheduledDate:null,pillar:"gestante",assignee:"editor",
    slides:[
      {id:"sl9",type:"text",content:"VOCÊ SABE ADAPTAR PARA GESTANTES? 🤰",notes:"Título impactante"},
      {id:"sl10",type:"quiz",content:"Quiz: Qual exercício é CONTRAINDICADO no 3º trimestre?",notes:"4 opções, 1 correta"},
      {id:"sl11",type:"text",content:"Resposta + explicação técnica",notes:""},
      {id:"sl12",type:"link",content:"Assista o reel completo sobre gestantes",notes:"Linkar pro reel"},
    ],
    metrics:null,
  },
  {id:"s4",title:"Contagem: MBA Turma 8",status:"idea",scheduledDate:null,pillar:"mba",assignee:"rafael",
    slides:[
      {id:"sl13",type:"text",content:"ÚLTIMAS VAGAS ⚡",notes:"Urgência"},
      {id:"sl14",type:"countdown",content:"Contagem regressiva: Inscrições encerram em 3 dias",notes:""},
      {id:"sl15",type:"text",content:"O que você vai aprender na turma 8",notes:"3 bullets"},
      {id:"sl16",type:"link",content:"Link de inscrição com desconto",notes:""},
    ],
    metrics:null,
  },
];

const AI_ALERTS=[{id:1,icon:"🔥",text:"\"Pilates Wall\" trending — ninguém cobriu!",urgency:"alta",act:"Criar"},{id:2,icon:"⚠️",text:"Pilar Gestante sem post há 14 dias.",urgency:"alta",act:"Ver ideias"},{id:3,icon:"👁",text:"Concorrente postou sobre precificação.",urgency:"média",act:"Ver"}];

const HOOK_BANK=[{id:1,text:"Eu sei que dói ouvir isso. Mas...",cat:"provocativo",score:95,uses:3},{id:2,text:"A verdade que ninguém te conta...",cat:"provocativo",score:89,uses:5},{id:3,text:"O erro mais caro que já cometi",cat:"storytelling",score:93,uses:1},{id:4,text:"Se eu pudesse voltar no tempo...",cat:"storytelling",score:91,uses:1},{id:5,text:"Por que [crença] está ERRADA",cat:"provocativo",score:88,uses:4},{id:6,text:"Eu demiti meu melhor instrutor",cat:"storytelling",score:94,uses:0}];

const TRENDS=[{id:1,topic:"Pilates Wall Challenge",source:"TikTok",urgency:"alta",time:"2h",views:"2.3M",growth:"+340%",desc:"Trend viral. Nenhum creator cobriu com profundidade.",opp:"Primeiro a trazer visão profissional."},{id:2,topic:"Pilates reduz ansiedade em 40%",source:"PubMed",urgency:"média",time:"5h",desc:"Estudo com n=500. Dados robustos.",opp:"Carrossel educativo com dados."},{id:3,topic:"#PilatesReformer em alta",source:"Instagram",urgency:"média",time:"30min",growth:"+89%",desc:"Hashtag subiu 89% na semana.",opp:"Reel de bastidores no Reformer."},{id:4,topic:"Concorrente: precificação",source:"Instagram",urgency:"alta",time:"1h",desc:"@pilatesbusiness postou sobre preços.",opp:"Seu reel agendado é a resposta perfeita."}];

const METRICS={kpis:{followers:{val:"48.2k",change:"+1.2k",pct:"+2.5%"},engagement:{val:"6.7%",change:"+1.3%",pct:"+24%"},reach:{val:"156k",change:"+32k",pct:"+26%"},saves:{val:"3.2k",change:"+890",pct:"+38%"}},byDay:[{d:"Seg",v:4.2},{d:"Ter",v:5.8},{d:"Qua",v:3.9},{d:"Qui",v:6.2},{d:"Sex",v:5.5},{d:"Sáb",v:3.8},{d:"Dom",v:2.9}],byType:[{t:"Reel",eng:"7.8%",saves:1890,c:"#FF6B35"},{t:"Carrossel",eng:"5.4%",saves:2340,c:"#F7C948"},{t:"Imagem",eng:"2.1%",saves:320,c:"#4ECDC4"}],topPosts:[{title:"3 studios e fechei 1",t:"Reel",eng:"9.2%",saves:678},{title:"R$50 vai falir",t:"Reel",eng:"8.4%",saves:521},{title:"Neuromarketing",t:"Carrossel",eng:"6.1%",saves:456}]};

const DEFAULT_CRM=[{id:"lead",label:"Lead",icon:"🎯",color:"#FF6B35"},{id:"contact",label:"Contato",icon:"📩",color:"#F7C948"},{id:"negotiation",label:"Negociação",icon:"🤝",color:"#4ECDC4"},{id:"proposal",label:"Proposta",icon:"📋",color:"#45B7D1"},{id:"closed",label:"Fechado",icon:"🏆",color:"#5DE8A0"}];
const CRM_CARDS=[{id:"c1",stage:"lead",title:"Parceria @fisio.moderna",desc:"25k seguidores. Collab.",value:"Collab",priority:"alta",contact:"DM",tags:["collab"]},{id:"c2",stage:"contact",title:"Pilates Summit 2026",desc:"Palestra em SP.",value:"Autoridade",priority:"alta",contact:"Ana Lima",tags:["evento"]},{id:"c3",stage:"negotiation",title:"Curso online plataforma X",desc:"Hospedar curso gestão.",value:"R$15k+",priority:"alta",contact:"Reunião 28/02",tags:["curso"]},{id:"c4",stage:"closed",title:"Publi Reformer",desc:"Post patrocinado.",value:"R$2.500",priority:"média",contact:"Contrato assinado",tags:["publi"]}];

const today=new Date("2026-02-24");
const WEEK_TPL=[{day:0,time:"07:00",type:"reel",label:"Reel Provocativo"},{day:1,time:"07:00",type:"carrossel",label:"Carrossel Educativo"},{day:2,time:"12:00",type:"reel",label:"Reel Bastidores"},{day:3,time:"07:00",type:"carrossel",label:"Carrossel MBA"},{day:4,time:"18:00",type:"reel",label:"Reel Storytelling"},{day:5,time:"10:00",type:"static",label:"Post Reflexão"}];

// MICRO COMPONENTS
function Badge({children,color=T.accent,style={}}){return<span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"2px 8px",borderRadius:6,fontSize:11,fontWeight:600,color,background:`${color}18`,border:`1px solid ${color}25`,whiteSpace:"nowrap",lineHeight:"18px",...style}}>{children}</span>}
function Avatar({user,users,size=22}){const list=users&&users.length?users:USERS;const u=list.find(x=>x.id===user);if(!u)return null;return<div title={u.name}style={{width:size,height:size,borderRadius:"50%",background:`linear-gradient(135deg,${u.color},${u.color}99)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.42,fontWeight:700,color:"#fff",flexShrink:0,border:`2px solid ${T.bg}`}}>{u.avatar}</div>}
function IconBtn({children,onClick,title,active,small,style={}}){const[h,setH]=useState(false);const sz=small?26:32;return<button type="button"aria-label={title||undefined}title={title}onClick={onClick}onMouseEnter={()=>setH(true)}onMouseLeave={()=>setH(false)}style={{width:sz,height:sz,borderRadius:7,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:small?12:14,transition:"all 0.15s",background:active?T.accentGlow:h?"rgba(255,255,255,0.06)":"transparent",color:active?T.accent:h?T.text:T.textMuted,...style}}>{children}</button>}
function AIS({score,size="sm"}){if(!score)return null;const c=score>=90?T.green:score>=75?T.yellow:T.accent;const s=size==="lg"?38:26;return<div title={`Score: ${score}`}style={{width:s,height:s,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",background:`${c}15`,border:`2px solid ${c}40`,color:c,fontSize:s>30?13:10,fontWeight:800,fontFamily:T.mono,flexShrink:0}}>{score}</div>}

// ============================================================================
// STORIES MODULE (NEW - FASE 4)
// ============================================================================

function StorySlidePreview({slide,index,total,isActive,onClick}){
  const st=STORY_TYPES.find(t=>t.id===slide.type);
  const bgs={"gradient-fire":"linear-gradient(135deg,#FF6B35,#F7C948)","gradient-dark":"linear-gradient(135deg,#1a1a2e,#2d2d4e)","gradient-green":"linear-gradient(135deg,#0d9488,#5DE8A0)","gradient-purple":"linear-gradient(135deg,#7c3aed,#A78BFA)","gradient-cyan":"linear-gradient(135deg,#0891b2,#4ECDC4)"};
  return(
    <div onClick={onClick}style={{
      width:72,height:128,borderRadius:10,overflow:"hidden",cursor:"pointer",flexShrink:0,
      background:bgs[slide.bg]||"linear-gradient(135deg,#1a1a2e,#2d2d4e)",
      border:isActive?`2px solid ${T.accent}`:`2px solid ${T.border}`,
      display:"flex",flexDirection:"column",justifyContent:"space-between",padding:6,
      transition:"all 0.2s",transform:isActive?"scale(1.05)":"scale(1)",
      boxShadow:isActive?"0 4px 15px rgba(255,107,53,0.3)":"none",
      position:"relative",
    }}>
      <div style={{fontSize:8,color:"rgba(255,255,255,0.5)",textAlign:"center"}}>{index+1}/{total}</div>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:18,marginBottom:2}}>{st?.icon}</div>
        <div style={{fontSize:7.5,color:"rgba(255,255,255,0.8)",fontWeight:600,lineHeight:1.3,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:3,WebkitBoxOrient:"vertical"}}>{slide.content}</div>
      </div>
      <div style={{fontSize:7,color:"rgba(255,255,255,0.4)",textAlign:"center",fontWeight:600}}>{st?.label}</div>
    </div>
  );
}

function StorySequenceCard({story,onEdit}){
  const[h,setH]=useState(false);
  const pillar=PILLARS.find(p=>p.id===story.pillar);
  const statusColors={idea:T.accent,draft:T.yellow,scheduled:T.cyan,published:T.green};
  const statusLabels={idea:"Ideia",draft:"Rascunho",scheduled:"Agendado",published:"Publicado"};
  return(
    <div onClick={()=>onEdit(story)}onMouseEnter={()=>setH(true)}onMouseLeave={()=>setH(false)}
      style={{background:h?T.cardHover:T.card,border:`1px solid ${h?T.borderHover:T.border}`,borderRadius:14,padding:14,cursor:"pointer",transition:"all 0.2s",animation:"fadeIn 0.3s",transform:h?"translateY(-2px)":"none",boxShadow:h?"0 8px 25px rgba(0,0,0,0.3)":"none"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <Badge color={statusColors[story.status]}style={{fontSize:10}}>{statusLabels[story.status]}</Badge>
        <div style={{display:"flex",alignItems:"center",gap:5}}>
          {story.scheduledDate&&<span style={{fontSize:10,color:T.textDim}}>{fmtDate(story.scheduledDate)}</span>}
          {story.assignee&&<Avatar user={story.assignee}size={18}/>}
        </div>
      </div>
      <div style={{fontSize:14,fontWeight:700,color:T.text,marginBottom:8,lineHeight:1.4}}>{story.title}</div>
      {/* Slide previews */}
      <div style={{display:"flex",gap:5,marginBottom:8,overflowX:"auto",paddingBottom:4}}>
        {story.slides.map((slide,i)=><StorySlidePreview key={slide.id}slide={slide}index={i}total={story.slides.length}/>)}
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",gap:4}}>
          {pillar&&<span style={{fontSize:9,color:pillar.color,padding:"1px 6px",borderRadius:4,background:`${pillar.color}12`,fontWeight:500}}>#{pillar.label}</span>}
          <span style={{fontSize:9,color:T.textDim,padding:"1px 6px",borderRadius:4,background:"rgba(255,255,255,0.04)"}}>{story.slides.length} slides</span>
        </div>
        {story.metrics&&(
          <div style={{display:"flex",gap:8,fontSize:10,color:T.textMuted}}>
            <span>👁 {fmtNum(story.metrics.views)}</span>
            <span>💬 {story.metrics.replies}</span>
            <span>✅ {story.metrics.completion}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function StoryEditor({story,onSave,onClose,onDelete}){
  const[f,setF]=useState(JSON.parse(JSON.stringify(story)));
  const[activeSlide,setActiveSlide]=useState(0);
  const[tab,setTab]=useState("slides");

  const updateSlide=(idx,key,val)=>{setF(prev=>{const n={...prev,slides:[...prev.slides]};n.slides[idx]={...n.slides[idx],[key]:val};return n})};
  const addSlide=(type)=>{setF(prev=>({...prev,slides:[...prev.slides,{id:genId(),type,content:"",notes:"",bg:"gradient-dark"}]}));setActiveSlide(f.slides.length)};
  const removeSlide=(idx)=>{if(f.slides.length<=1)return;setF(prev=>({...prev,slides:prev.slides.filter((_,i)=>i!==idx)}));if(activeSlide>=f.slides.length-1)setActiveSlide(Math.max(0,f.slides.length-2))};
  const moveSlide=(idx,dir)=>{setF(prev=>{const s=[...prev.slides];if((dir===-1&&idx<=0)||(dir===1&&idx>=s.length-1))return prev;[s[idx],s[idx+dir]]=[s[idx+dir],s[idx]];return{...prev,slides:s}});setActiveSlide(idx+dir)};

  const bgs=["gradient-fire","gradient-dark","gradient-green","gradient-purple","gradient-cyan"];
  const bgColors={"gradient-fire":"#FF6B35","gradient-dark":"#2d2d4e","gradient-green":"#0d9488","gradient-purple":"#7c3aed","gradient-cyan":"#0891b2"};
  const cs=f.slides[activeSlide];

  return<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(6px)"}}onClick={e=>{if(e.target===e.currentTarget)onClose()}}role="presentation">
      <div role="dialog"aria-modal="true"aria-label="Editar sequência de stories"style={{width:"min(860px,97vw)",maxHeight:"92vh",background:T.surface,borderRadius:18,display:"flex",flexDirection:"column",border:`1px solid ${T.border}`,boxShadow:"0 30px 90px rgba(0,0,0,0.5)",animation:"scaleIn 0.2s",overflow:"hidden"}}onKeyDown={e=>e.key==="Escape"&&onClose()}>
        {/* Header */}
        <div style={{padding:"14px 20px",borderBottom:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:18}}>📱</span>
            <input value={f.title}onChange={e=>setF(p=>({...p,title:e.target.value}))}placeholder="Nome da sequência..."style={{background:"transparent",border:"none",color:T.text,fontSize:16,fontWeight:700,fontFamily:T.font,outline:"none",width:300}}/>
          </div>
          <div style={{display:"flex",gap:4,alignItems:"center"}}>
            <Badge color={({idea:T.accent,draft:T.yellow,scheduled:T.cyan,published:T.green})[f.status]}>{({idea:"Ideia",draft:"Rascunho",scheduled:"Agendado",published:"Publicado"})[f.status]}</Badge>
            <IconBtn onClick={()=>{if(confirm("Excluir?")){onDelete(f.id);onClose()}}}>🗑️</IconBtn>
            <IconBtn onClick={onClose}>✕</IconBtn>
          </div>
        </div>
        {/* Tabs */}
        <div style={{display:"flex",padding:"0 20px",borderBottom:`1px solid ${T.border}`}}>
          {[{id:"slides",l:"📱 Slides"},{id:"settings",l:"⚙️ Config"},{id:"metrics",l:"📊 Métricas"}].map(t=><button key={t.id}onClick={()=>setTab(t.id)}style={{padding:"9px 14px",fontSize:12,fontWeight:tab===t.id?700:500,color:tab===t.id?T.accent:T.textMuted,background:"transparent",border:"none",cursor:"pointer",borderBottom:tab===t.id?`2px solid ${T.accent}`:"2px solid transparent",fontFamily:T.font}}>{t.l}</button>)}
        </div>
        <div style={{flex:1,overflowY:"auto",padding:20}}>
          {tab==="slides"&&(
            <div style={{display:"flex",gap:20}}>
              {/* Slide list (left) */}
              <div style={{width:100,flexShrink:0}}>
                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                  {f.slides.map((slide,i)=><StorySlidePreview key={slide.id}slide={slide}index={i}total={f.slides.length}isActive={activeSlide===i}onClick={()=>setActiveSlide(i)}/>)}
                </div>
                {/* Add slide */}
                <div style={{marginTop:10}}>
                  <div style={{fontSize:10,color:T.textMuted,fontWeight:600,marginBottom:5,textTransform:"uppercase"}}>Adicionar</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:3}}>
                    {STORY_TYPES.slice(0,6).map(st=><button key={st.id}onClick={()=>addSlide(st.id)}style={{width:30,height:30,borderRadius:6,border:`1px solid ${T.border}`,background:"transparent",cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center"}}title={st.label}onMouseEnter={e=>e.currentTarget.style.borderColor=st.color}onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}>{st.icon}</button>)}
                  </div>
                </div>
              </div>
              {/* Slide editor (right) */}
              {cs&&<div style={{flex:1,animation:"slideRight 0.2s"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <Badge color={STORY_TYPES.find(t=>t.id===cs.type)?.color}>{STORY_TYPES.find(t=>t.id===cs.type)?.icon} {STORY_TYPES.find(t=>t.id===cs.type)?.label}</Badge>
                    <span style={{fontSize:11,color:T.textDim}}>Slide {activeSlide+1} de {f.slides.length}</span>
                  </div>
                  <div style={{display:"flex",gap:3}}>
                    <IconBtn small title="Mover ←"onClick={()=>moveSlide(activeSlide,-1)}>◂</IconBtn>
                    <IconBtn small title="Mover →"onClick={()=>moveSlide(activeSlide,1)}>▸</IconBtn>
                    <IconBtn small title="Remover"onClick={()=>removeSlide(activeSlide)}>✕</IconBtn>
                  </div>
                </div>
                {/* Type selector */}
                <div style={{marginBottom:12}}>
                  <label style={{fontSize:10,color:T.textMuted,fontWeight:700,display:"block",marginBottom:5,textTransform:"uppercase"}}>Tipo</label>
                  <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{STORY_TYPES.map(st=><button key={st.id}onClick={()=>updateSlide(activeSlide,"type",st.id)}style={{padding:"4px 10px",borderRadius:7,fontSize:11,fontWeight:600,border:cs.type===st.id?`1px solid ${st.color}60`:`1px solid ${T.border}`,background:cs.type===st.id?`${st.color}15`:"transparent",color:cs.type===st.id?st.color:T.textMuted,cursor:"pointer",fontFamily:T.font}}>{st.icon} {st.label}</button>)}</div>
                </div>
                {/* Content */}
                <div style={{marginBottom:12}}>
                  <label style={{fontSize:10,color:T.textMuted,fontWeight:700,display:"block",marginBottom:5,textTransform:"uppercase"}}>Conteúdo do Slide</label>
                  <textarea value={cs.content}onChange={e=>updateSlide(activeSlide,"content",e.target.value)}placeholder="Texto, pergunta, opções..."rows={3}style={{width:"100%",background:"rgba(255,255,255,0.03)",border:`1px solid ${T.border}`,borderRadius:9,padding:"10px 12px",color:T.text,fontSize:13,fontFamily:T.font,lineHeight:1.6,outline:"none",resize:"vertical"}}onFocus={e=>e.target.style.borderColor=T.accentBorder}onBlur={e=>e.target.style.borderColor=T.border}/>
                </div>
                {/* Background */}
                <div style={{marginBottom:12}}>
                  <label style={{fontSize:10,color:T.textMuted,fontWeight:700,display:"block",marginBottom:5,textTransform:"uppercase"}}>Fundo</label>
                  <div style={{display:"flex",gap:5}}>{bgs.map(bg=><button key={bg}onClick={()=>updateSlide(activeSlide,"bg",bg)}style={{width:36,height:36,borderRadius:8,background:`linear-gradient(135deg,${bgColors[bg]},${bgColors[bg]}cc)`,border:cs.bg===bg?`2px solid #fff`:`2px solid transparent`,cursor:"pointer",opacity:cs.bg===bg?1:0.5,transition:"all 0.15s"}}/>)}</div>
                </div>
                {/* Notes */}
                <div>
                  <label style={{fontSize:10,color:T.textMuted,fontWeight:700,display:"block",marginBottom:5,textTransform:"uppercase"}}>Notas de produção</label>
                  <input value={cs.notes||""}onChange={e=>updateSlide(activeSlide,"notes",e.target.value)}placeholder="Instruções, referências..."style={{width:"100%",background:"rgba(255,255,255,0.03)",border:`1px solid ${T.border}`,borderRadius:8,padding:"8px 12px",color:T.textMuted,fontSize:12,fontFamily:T.font,outline:"none"}}/>
                </div>
              </div>}
            </div>
          )}
          {tab==="settings"&&(
            <div>
              <div style={{display:"flex",gap:12,marginBottom:16}}>
                <div><label style={{fontSize:10,color:T.textMuted,fontWeight:700,display:"block",marginBottom:5,textTransform:"uppercase"}}>Status</label><div style={{display:"flex",gap:4}}>{["idea","draft","scheduled","published"].map(s=><button key={s}onClick={()=>setF(p=>({...p,status:s}))}style={{padding:"5px 12px",borderRadius:7,fontSize:11,fontWeight:600,border:f.status===s?`1px solid ${({idea:T.accent,draft:T.yellow,scheduled:T.cyan,published:T.green})[s]}60`:`1px solid ${T.border}`,background:f.status===s?`${({idea:T.accent,draft:T.yellow,scheduled:T.cyan,published:T.green})[s]}15`:"transparent",color:f.status===s?({idea:T.accent,draft:T.yellow,scheduled:T.cyan,published:T.green})[s]:T.textMuted,cursor:"pointer",fontFamily:T.font,textTransform:"capitalize"}}>{({idea:"💡 Ideia",draft:"✍️ Rascunho",scheduled:"📅 Agendado",published:"🚀 Publicado"})[s]}</button>)}</div></div>
                <div><label style={{fontSize:10,color:T.textMuted,fontWeight:700,display:"block",marginBottom:5,textTransform:"uppercase"}}>Data</label><input type="date"value={f.scheduledDate||""}onChange={e=>setF(p=>({...p,scheduledDate:e.target.value}))}style={{background:"rgba(255,255,255,0.03)",border:`1px solid ${T.border}`,borderRadius:8,padding:"8px 12px",color:T.text,fontSize:13,fontFamily:T.font,outline:"none",colorScheme:"dark"}}/></div>
              </div>
              <div style={{display:"flex",gap:12,marginBottom:16}}>
                <div><label style={{fontSize:10,color:T.textMuted,fontWeight:700,display:"block",marginBottom:5,textTransform:"uppercase"}}>Pilar</label><div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{pils.map(p=><button key={p.id}onClick={()=>setF(prev=>({...prev,pillar:p.id}))}style={{padding:"4px 10px",borderRadius:7,fontSize:11,fontWeight:600,border:f.pillar===p.id?`1px solid ${p.color}50`:`1px solid ${T.border}`,background:f.pillar===p.id?`${p.color}15`:"transparent",color:f.pillar===p.id?p.color:T.textDim,cursor:"pointer",fontFamily:T.font}}>#{p.label}</button>)}</div></div>
                <div><label style={{fontSize:10,color:T.textMuted,fontWeight:700,display:"block",marginBottom:5,textTransform:"uppercase"}}>Responsável</label><div style={{display:"flex",gap:4}}>{uList.map(u=><button key={u.id}onClick={()=>setF(p=>({...p,assignee:u.id}))}style={{padding:"4px 9px",borderRadius:7,fontSize:11,border:f.assignee===u.id?`1px solid ${u.color}60`:`1px solid ${T.border}`,background:f.assignee===u.id?`${u.color}15`:"transparent",color:f.assignee===u.id?u.color:T.textMuted,cursor:"pointer",fontFamily:T.font,display:"flex",alignItems:"center",gap:4}}><Avatar user={u.id}users={uList}size={15}/>{u.name}</button>)}</div></div>
              </div>
              {/* Templates */}
              <div><label style={{fontSize:10,color:T.textMuted,fontWeight:700,display:"block",marginBottom:8,textTransform:"uppercase"}}>Aplicar Template</label>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  {STORY_TEMPLATES.map(tpl=>(
                    <button key={tpl.id}onClick={()=>setF(p=>({...p,slides:tpl.slides.map(s=>({...s,id:genId()}))}))}style={{padding:"12px 14px",borderRadius:10,textAlign:"left",background:T.card,border:`1px solid ${T.border}`,cursor:"pointer",transition:"all 0.15s"}}onMouseEnter={e=>e.currentTarget.style.borderColor=tpl.color}onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}>
                      <div style={{fontSize:13,fontWeight:700,color:tpl.color,marginBottom:3}}>{tpl.name}</div>
                      <div style={{fontSize:11,color:T.textMuted,lineHeight:1.4}}>{tpl.desc}</div>
                      <div style={{display:"flex",gap:3,marginTop:6}}>{tpl.slides.map((s,i)=><span key={i}style={{fontSize:11}}>{STORY_TYPES.find(t=>t.id===s.type)?.icon}</span>)}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          {tab==="metrics"&&(
            <div>
              {f.metrics?(
                <div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:16}}>
                    {[{l:"Views",v:f.metrics.views,i:"👁"},{l:"Respostas",v:f.metrics.replies,i:"💬"},{l:"Shares",v:f.metrics.shares,i:"↗️"},{l:"Conclusão",v:f.metrics.completion,i:"✅"}].map((m,i)=><div key={i}style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"14px",textAlign:"center"}}><div style={{fontSize:16,marginBottom:4}}>{m.i}</div><div style={{fontSize:20,fontWeight:800,color:T.text,fontFamily:T.mono}}>{typeof m.v==="number"?fmtNum(m.v):m.v}</div><div style={{fontSize:10,color:T.textMuted,marginTop:2}}>{m.l}</div></div>)}
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                    <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:16}}>
                      <div style={{fontSize:12,fontWeight:700,color:T.text,marginBottom:10}}>Navegação</div>
                      {[{l:"Taps avançar",v:f.metrics.taps_forward,c:T.green},{l:"Taps voltar",v:f.metrics.taps_back,c:T.yellow},{l:"Saídas",v:f.metrics.exits,c:T.red}].map((m,i)=><div key={i}style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:i<2?`1px solid ${T.border}`:"none"}}><span style={{fontSize:12,color:T.textMuted}}>{m.l}</span><span style={{fontSize:12,fontWeight:700,color:m.c,fontFamily:T.mono}}>{fmtNum(m.v)}</span></div>)}
                    </div>
                    <div style={{background:T.purpleBg,border:`1px solid ${T.purpleBorder}`,borderRadius:12,padding:16}}>
                      <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:8}}><span>🧠</span><span style={{fontSize:12,fontWeight:700,color:T.purple}}>Análise da IA</span></div>
                      <div style={{fontSize:12,color:"rgba(255,255,255,0.6)",lineHeight:1.6}}>Taxa de conclusão de {f.metrics.completion} está acima da média (65%). Os taps pra trás indicam que o slide 2 gerou interesse. Sugiro replicar o formato enquete no início das próximas sequências.</div>
                    </div>
                  </div>
                </div>
              ):(
                <div style={{textAlign:"center",padding:40,color:T.textDim}}>
                  <div style={{fontSize:40,marginBottom:10}}>📊</div>
                  <div style={{fontSize:14,fontWeight:600,color:T.textMuted}}>Métricas disponíveis após publicação</div>
                </div>
              )}
            </div>
          )}
        </div>
        <div style={{padding:"12px 20px",borderTop:`1px solid ${T.border}`,display:"flex",justifyContent:"flex-end",gap:8}}>
          <button onClick={onClose}style={{padding:"7px 16px",borderRadius:9,fontSize:12,fontWeight:600,border:`1px solid ${T.border}`,background:"transparent",color:T.textMuted,cursor:"pointer",fontFamily:T.font}}>Cancelar</button>
          <button onClick={()=>{onSave(f);onClose()}}style={{padding:"7px 20px",borderRadius:9,fontSize:12,fontWeight:700,border:"none",background:`linear-gradient(135deg,${T.accent},${T.yellow})`,color:T.accentText,cursor:"pointer",fontFamily:T.font}}>Salvar</button>
        </div>
      </div>
    </div>
}

function StoriesView(){
  const[stories,setStories]=useState(INITIAL_STORIES);
  const[editing,setEditing]=useState(null);
  const[viewMode,setViewMode]=useState("all");
  const[showTpl,setShowTpl]=useState(false);

  const save=(s)=>setStories(prev=>prev.find(x=>x.id===s.id)?prev.map(x=>x.id===s.id?s:x):[...prev,s]);
  const del=(id)=>setStories(prev=>prev.filter(x=>x.id!==id));
  const newStory=(tpl)=>{
    const ns={id:genId(),title:tpl?tpl.name:"Nova Sequência",status:"idea",scheduledDate:null,pillar:null,assignee:"rafael",slides:tpl?tpl.slides.map(s=>({...s,id:genId()})):[{id:genId(),type:"text",content:"",notes:"",bg:"gradient-dark"}],metrics:null};
    setEditing(ns);
  };

  const filtered=viewMode==="all"?stories:stories.filter(s=>s.status===viewMode);
  const statuses=[{id:"all",l:"Todos",c:T.text},{id:"idea",l:"Ideias",c:T.accent},{id:"draft",l:"Rascunho",c:T.yellow},{id:"scheduled",l:"Agendado",c:T.cyan},{id:"published",l:"Publicado",c:T.green}];

  // Story metrics summary
  const publishedStories=stories.filter(s=>s.status==="published"&&s.metrics);
  const avgCompletion=publishedStories.length?publishedStories.reduce((s,st)=>s+parseFloat(st.metrics.completion),0)/publishedStories.length:0;
  const totalViews=publishedStories.reduce((s,st)=>s+(st.metrics?.views||0),0);

  return<div style={{padding:"18px 20px",animation:"fadeIn 0.3s"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      <div>
        <h2 style={{fontSize:17,fontWeight:800,color:T.text,margin:0}}>📱 Stories — Sequências</h2>
        <div style={{fontSize:11,color:T.textMuted,marginTop:3}}>Planeje, organize e analise seus stories</div>
      </div>
      <div style={{display:"flex",gap:8,alignItems:"center"}}>
        {publishedStories.length>0&&<><Badge color={T.green}style={{fontSize:11,padding:"4px 10px"}}>👁 {fmtNum(totalViews)} views</Badge><Badge color={T.purple}style={{fontSize:11,padding:"4px 10px"}}>✅ {avgCompletion.toFixed(0)}% conclusão</Badge></>}
        <button onClick={()=>setShowTpl(!showTpl)}style={{padding:"6px 14px",borderRadius:8,fontSize:12,fontWeight:600,border:`1px solid ${T.border}`,background:"transparent",color:T.textMuted,cursor:"pointer",fontFamily:T.font}}>{showTpl?"✕ Fechar":"📋 Templates"}</button>
        <button onClick={()=>newStory()}style={{padding:"6px 14px",borderRadius:8,fontSize:12,fontWeight:700,border:"none",background:`linear-gradient(135deg,${T.accent},${T.yellow})`,color:T.accentText,cursor:"pointer",fontFamily:T.font}}>+ Nova Sequência</button>
      </div>
    </div>

    {/* Templates panel */}
    {showTpl&&<div style={{marginBottom:16,animation:"fadeIn 0.2s"}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8}}>
        {STORY_TEMPLATES.map(tpl=>(
          <button key={tpl.id}onClick={()=>{newStory(tpl);setShowTpl(false)}}style={{padding:"14px 12px",borderRadius:12,textAlign:"left",background:T.card,border:`1px solid ${T.border}`,cursor:"pointer",transition:"all 0.15s"}}onMouseEnter={e=>e.currentTarget.style.borderColor=tpl.color}onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}>
            <div style={{fontSize:13,fontWeight:700,color:tpl.color,marginBottom:3}}>{tpl.name}</div>
            <div style={{fontSize:10.5,color:T.textMuted,lineHeight:1.4,marginBottom:6}}>{tpl.desc}</div>
            <div style={{display:"flex",gap:3}}>{tpl.slides.map((s,i)=><span key={i}style={{fontSize:12}}>{STORY_TYPES.find(t=>t.id===s.type)?.icon}</span>)}</div>
          </button>
        ))}
      </div>
    </div>}

    {/* Filter tabs */}
    <div style={{display:"flex",gap:4,marginBottom:14}}>
      {statuses.map(s=><button key={s.id}onClick={()=>setViewMode(s.id)}style={{padding:"5px 12px",borderRadius:7,fontSize:11,fontWeight:600,border:viewMode===s.id?`1px solid ${s.c}50`:`1px solid ${T.border}`,background:viewMode===s.id?`${s.c}12`:"transparent",color:viewMode===s.id?s.c:T.textMuted,cursor:"pointer",fontFamily:T.font}}>{s.l} ({s.id==="all"?stories.length:stories.filter(x=>x.status===s.id).length})</button>)}
    </div>

    {/* Story cards grid */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:12}}>
      {filtered.map(s=><StorySequenceCard key={s.id}story={s}onEdit={setEditing}/>)}
    </div>

    {filtered.length===0&&<div style={{textAlign:"center",padding:50,color:T.textDim}}><div style={{fontSize:40,marginBottom:8}}>📱</div><div style={{fontSize:14}}>Nenhuma sequência {viewMode!=="all"?"nesse status":""}</div></div>}

    {editing&&<StoryEditor story={editing}onSave={save}onClose={()=>setEditing(null)}onDelete={del}/>}
  </div>}

// ============================================================================
// REUSE PREVIOUS MODULES (simplified for space)
// ============================================================================

// Post Card
function PostCard({post,onEdit,onDragStart,isDragging,postTypes,pillars,users}){const[h,setH]=useState(false);const types=postTypes||POST_TYPES;const pils=pillars||PILLARS;const u=users||USERS;const ti=types.find(t=>t.id===post.type);const tags=post.tags.map(t=>pils.find(p=>p.id===t)).filter(Boolean);
  return<div draggable onDragStart={e=>{e.dataTransfer.effectAllowed="move";onDragStart(post)}}onMouseEnter={()=>setH(true)}onMouseLeave={()=>setH(false)}onClick={()=>onEdit(post)}style={{background:h?T.cardHover:T.card,border:`1px solid ${h?T.borderHover:T.border}`,borderRadius:12,padding:"11px 13px",cursor:"grab",transition:"all 0.2s",marginBottom:6,opacity:isDragging?0.4:1,transform:h?"translateY(-1px)":"none",animation:"fadeIn 0.25s",boxShadow:h?"0 4px 12px rgba(0,0,0,0.06)":"none"}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:5}}><div style={{display:"flex",alignItems:"center",gap:4}}><Badge color={ti?.color}style={{fontSize:9.5}}>{ti?.icon}{ti?.label}</Badge>{post.scheduledDate&&<span style={{fontSize:9.5,color:T.textDim}}>{fmtDate(post.scheduledDate)}</span>}</div><div style={{display:"flex",alignItems:"center",gap:4}}><AIS score={post.aiScore}/>{post.assignee&&<Avatar user={post.assignee}users={u}size={18}/>}</div></div>
    <div style={{color:T.text,fontWeight:650,fontSize:12.5,lineHeight:1.4,marginBottom:4}}>{post.title}</div>
    {tags.length>0&&<div style={{display:"flex",gap:3,flexWrap:"wrap"}}>{tags.map(p=><span key={p.id}style={{fontSize:9,color:p.color,padding:"1px 5px",borderRadius:3,background:`${p.color}12`,fontWeight:500}}>#{p.label}</span>)}</div>}
    {post.engagement&&<div style={{display:"flex",gap:2,background:"rgba(255,255,255,0.02)",borderRadius:6,padding:"4px 2px",marginTop:5}}>{[{i:"♥",v:post.engagement.likes},{i:"💬",v:post.engagement.comments},{i:"💾",v:post.engagement.saves}].map((m,i)=><div key={i}style={{flex:1,textAlign:"center"}}><div style={{fontSize:8,opacity:0.5}}>{m.i}</div><div style={{color:T.text,fontSize:10,fontWeight:700,fontFamily:T.mono}}>{fmtNum(m.v)}</div></div>)}</div>}
    {post.aiSuggestion&&<div style={{marginTop:5,background:T.purpleBg,border:`1px solid ${T.purpleBorder}`,borderRadius:6,padding:"5px 8px",display:"flex",gap:5}}><span style={{fontSize:10}}>🧠</span><span style={{color:"rgba(255,255,255,0.5)",fontSize:10,lineHeight:1.4}}>{post.aiSuggestion}</span></div>}
  </div>}

function KanbanCol({col,posts,onEdit,onDragStart,onDrop,dp,onNew,users,postTypes,pillars}){const[dg,setDg]=useState(false);
  return<div onDragOver={e=>{e.preventDefault();setDg(true)}}onDragLeave={()=>setDg(false)}onDrop={e=>{e.preventDefault();setDg(false);onDrop(col.id)}}style={{minWidth:272,maxWidth:272,display:"flex",flexDirection:"column",borderRadius:14,border:dg&&dp?.column!==col.id?`1px dashed ${T.accentBorder}`:`1px solid ${T.border}`,transition:"all 0.2s",background:dg&&dp?.column!==col.id?"rgba(255,107,53,0.03)":T.card}}>
    <div style={{padding:"10px 10px 8px",borderBottom:`2px solid ${col.color}40`,marginBottom:6,display:"flex",alignItems:"center",justifyContent:"space-between"}}><div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:13}}>{col.icon}</span><div style={{fontWeight:700,fontSize:12,color:T.text}}>{col.label}</div></div><span style={{background:`${col.color}15`,color:col.color,fontSize:10,fontWeight:800,width:20,height:20,borderRadius:5,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:T.mono}}>{posts.length}</span></div>
    <div style={{flex:1,overflowY:"auto",padding:"0 6px 6px"}}>{posts.map(p=><PostCard key={p.id}post={p}onEdit={onEdit}onDragStart={onDragStart}isDragging={dp?.id===p.id}users={users}postTypes={postTypes}pillars={pillars}/>)}</div>
    {col.id!=="publicado"&&<button onClick={()=>onNew(col.id)}style={{margin:"4px 6px 8px",padding:8,background:"transparent",border:`1px dashed ${T.border}`,borderRadius:8,color:T.textDim,fontSize:11,cursor:"pointer",fontFamily:T.font}}onMouseEnter={e=>{e.target.style.borderColor=T.accentBorder;e.target.style.color=T.accent}}onMouseLeave={e=>{e.target.style.borderColor=T.border;e.target.style.color=T.textDim}}>+ Novo</button>}
  </div>}

// Post Editor (full modal: rascunho, links, anexos, métricas, CMS-visibility)
function PostEditor({post,onSave,onClose,onDelete,visibleFields=[],columns,postTypes,pillars,users}){
  const cols=columns?.length?columns:COLUMNS;const types=postTypes?.length?postTypes:POST_TYPES;const pils=pillars?.length?pillars:PILLARS;const uList=users?.length?users:USERS;
  const norm={...post,links:post.links||[],attachments:post.attachments||[],engagement:post.engagement?{likes:post.engagement.likes||0,comments:post.engagement.comments||0,saves:post.engagement.saves||0,shares:post.engagement.shares||0,reach:post.engagement.reach||0}:{likes:0,comments:0,saves:0,shares:0,reach:0}};
  const[f,setF]=useState(norm);
  const up=(k,v)=>setF(p=>({...p,[k]:v}));
  const vis=useMemo(()=>new Set(visibleFields.length?visibleFields:CARD_FORM_FIELDS.map(x=>x.id)),[visibleFields]);
  const addLink=()=>setF(p=>({...p,links:[...p.links,""]}));
  const setLink=(i,url)=>setF(p=>({...p,links:p.links.map((l,j)=>j===i?url:l)}));
  const removeLink=(i)=>setF(p=>({...p,links:p.links.filter((_,j)=>j!==i)}));
  const addAttachment=()=>setF(p=>({...p,attachments:[...p.attachments,""]}));
  const setAttachment=(i,url)=>setF(p=>({...p,attachments:p.attachments.map((a,j)=>j===i?url:a)}));
  const removeAttachment=(i)=>setF(p=>({...p,attachments:p.attachments.filter((_,j)=>j!==i)}));
  const setEng=(key,val)=>setF(p=>({...p,engagement:{...p.engagement,[key]:isNaN(Number(val))?0:Number(val)}}));
  return<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(6px)"}}onClick={e=>{if(e.target===e.currentTarget)onClose()}}role="presentation"><div role="dialog"aria-modal="true"aria-label="Editar post"style={{width:"min(700px,95vw)",maxHeight:"90vh",display:"flex",flexDirection:"column",background:T.surface,borderRadius:16,border:`1px solid ${T.border}`,boxShadow:"0 24px 60px rgba(0,0,0,0.2)",animation:"scaleIn 0.2s",overflow:"hidden"}}onKeyDown={e=>e.key==="Escape"&&onClose()}>
    <div style={{flexShrink:0,padding:"12px 18px",borderBottom:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}><Badge color={cols.find(c=>c.id===f.column)?.color}>{cols.find(c=>c.id===f.column)?.icon} {cols.find(c=>c.id===f.column)?.label}</Badge><div style={{display:"flex",gap:4}}><AIS score={f.aiScore}size="lg"/><IconBtn onClick={()=>{if(confirm("Excluir?")){onDelete(f.id);onClose()}}}>🗑️</IconBtn><IconBtn onClick={onClose}>✕</IconBtn></div></div>
    <div style={{flex:1,minHeight:0,maxHeight:"calc(90vh - 120px)",overflowY:"auto",WebkitOverflowScrolling:"touch",padding:18}}>
      {vis.has("title")&&<div style={{marginBottom:14}}><input value={f.title}onChange={e=>up("title",e.target.value)}placeholder="Título (ex.: CARROSSEL: 'Seu studio...')"style={{width:"100%",background:"transparent",border:"none",color:T.text,fontSize:16,fontWeight:700,fontFamily:T.font,outline:"none",borderBottom:`1px solid ${T.border}`,paddingBottom:8}}/></div>}
      {vis.has("notes")&&<div style={{marginBottom:14}}><div style={{fontSize:10,fontWeight:700,color:T.textMuted,textTransform:"uppercase",marginBottom:6}}>RASCUNHO (SEMPRE VISÍVEL NO CARD)</div><textarea value={f.notes}onChange={e=>up("notes",e.target.value)}placeholder="Notas internas..."rows={3}style={{width:"100%",background:"rgba(255,255,255,0.03)",border:`1px solid ${T.border}`,borderRadius:8,padding:"10px 12px",color:T.text,fontSize:12,fontFamily:T.font,outline:"none",resize:"vertical"}}/></div>}
      {vis.has("type")&&<div style={{marginBottom:14}}><div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{types.map(pt=><button key={pt.id}onClick={()=>up("type",pt.id)}style={{padding:"5px 10px",borderRadius:8,fontSize:11,fontWeight:600,border:f.type===pt.id?`1px solid ${pt.color}60`:`1px solid ${T.border}`,background:f.type===pt.id?`${pt.color}18`:"transparent",color:f.type===pt.id?pt.color:T.textMuted,cursor:"pointer",fontFamily:T.font}}>{pt.icon} {pt.label}</button>)}</div></div>}
      {vis.has("tags")&&<div style={{marginBottom:14}}><div style={{display:"flex",gap:3,flexWrap:"wrap"}}>{pils.map(p=><button key={p.id}onClick={()=>setF(prev=>({...prev,tags:prev.tags.includes(p.id)?prev.tags.filter(x=>x!==p.id):[...prev.tags,p.id]}))}style={{padding:"4px 10px",borderRadius:8,fontSize:11,fontWeight:600,border:f.tags.includes(p.id)?`1px solid ${p.color}50`:`1px solid ${T.border}`,background:f.tags.includes(p.id)?`${p.color}15`:"transparent",color:f.tags.includes(p.id)?p.color:T.textDim,cursor:"pointer",fontFamily:T.font}}>#{p.label}</button>)}</div></div>}
      {vis.has("caption")&&<div style={{marginBottom:14}}><textarea value={f.caption}onChange={e=>up("caption",e.target.value)}placeholder="Legenda..."rows={4}style={{width:"100%",background:"rgba(255,255,255,0.02)",border:`1px solid ${T.border}`,borderRadius:8,padding:"10px 12px",color:T.text,fontSize:12.5,fontFamily:T.font,lineHeight:1.6,outline:"none",resize:"vertical"}}/></div>}
      {vis.has("links")&&<div style={{marginBottom:14}}><div style={{fontSize:10,fontWeight:700,color:T.textMuted,textTransform:"uppercase",marginBottom:6}}>LINKS (EX.: MATERIAL PARA QUEM COMENTA)</div><div style={{display:"flex",flexDirection:"column",gap:6}}>{f.links.map((url,i)=><div key={i}style={{display:"flex",gap:6}}><input value={url}onChange={e=>setLink(i,e.target.value)}placeholder="https://..."style={{flex:1,background:"rgba(255,255,255,0.03)",border:`1px solid ${T.border}`,borderRadius:7,padding:"7px 10px",color:T.text,fontSize:12,fontFamily:T.font,outline:"none"}}/><button type="button"onClick={()=>removeLink(i)}style={{padding:"6px 10px",borderRadius:6,fontSize:11,border:`1px solid ${T.border}`,background:"transparent",color:T.textMuted,cursor:"pointer"}}>Remover</button></div>)}<button type="button"onClick={addLink}style={{padding:"6px 12px",borderRadius:6,fontSize:11,fontWeight:600,border:`1px dashed ${T.border}`,background:"transparent",color:T.accent,cursor:"pointer",alignSelf:"flex-start"}}>🔗 + Adicionar link</button></div></div>}
      {vis.has("attachments")&&<div style={{marginBottom:14}}><div style={{fontSize:10,fontWeight:700,color:T.textMuted,textTransform:"uppercase",marginBottom:6}}>ANEXOS (LINK PARA ARQUIVO/DRIVE)</div><div style={{display:"flex",flexDirection:"column",gap:6}}>{f.attachments.map((url,i)=><div key={i}style={{display:"flex",gap:6}}><input value={url}onChange={e=>setAttachment(i,e.target.value)}placeholder="https://drive.google.com/..."style={{flex:1,background:"rgba(255,255,255,0.03)",border:`1px solid ${T.border}`,borderRadius:7,padding:"7px 10px",color:T.text,fontSize:12,fontFamily:T.font,outline:"none"}}/><button type="button"onClick={()=>removeAttachment(i)}style={{padding:"6px 10px",borderRadius:6,fontSize:11,border:`1px solid ${T.border}`,background:"transparent",color:T.textMuted,cursor:"pointer"}}>Remover</button></div>)}<button type="button"onClick={addAttachment}style={{padding:"6px 12px",borderRadius:6,fontSize:11,fontWeight:600,border:`1px dashed ${T.border}`,background:"transparent",color:T.accent,cursor:"pointer",alignSelf:"flex-start"}}>📎 + Adicionar anexo</button></div></div>}
      {vis.has("scheduledDate")&&<div style={{marginBottom:14}}><div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}><input type="date"value={f.scheduledDate||""}onChange={e=>up("scheduledDate",e.target.value)}style={{background:"rgba(255,255,255,0.03)",border:`1px solid ${T.border}`,borderRadius:7,padding:"8px 12px",color:T.text,fontSize:12,fontFamily:T.font,outline:"none",colorScheme:"dark"}}/><input type="time"value={f.scheduledTime||""}onChange={e=>up("scheduledTime",e.target.value)}style={{background:"rgba(255,255,255,0.03)",border:`1px solid ${T.border}`,borderRadius:7,padding:"8px 12px",color:T.text,fontSize:12,fontFamily:T.font,outline:"none",colorScheme:"dark"}}/></div></div>}
      {vis.has("metrics")&&<div style={{marginBottom:14}}><div style={{fontSize:10,fontWeight:700,color:T.textMuted,textTransform:"uppercase",marginBottom:8}}>MÉTRICAS (INSTAGRAM)</div><div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}>{[{k:"likes",icon:"♥"},{k:"comments",icon:"💬"},{k:"saves",icon:"💾"},{k:"shares",icon:"↗"},{k:"reach",icon:"👁 Alcance"}].map(({k,icon})=><div key={k}style={{display:"flex",alignItems:"center",gap:4}}><span style={{fontSize:12,color:T.textMuted}}>{icon}</span><input type="number"min={0}value={f.engagement[k]||0}onChange={e=>setEng(k,e.target.value)}style={{width:64,background:"rgba(255,255,255,0.03)",border:`1px solid ${T.border}`,borderRadius:6,padding:"5px 8px",color:T.text,fontSize:12,fontFamily:T.mono,outline:"none"}}/></div>)}</div></div>}
      {vis.has("column")&&<div style={{marginBottom:6}}><div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{cols.map(c=><button key={c.id}onClick={()=>up("column",c.id)}style={{padding:"5px 12px",borderRadius:8,fontSize:11,fontWeight:600,border:f.column===c.id?`1px solid ${c.color}60`:`1px solid ${T.border}`,background:f.column===c.id?`${c.color}18`:"transparent",color:f.column===c.id?c.color:T.textMuted,cursor:"pointer",fontFamily:T.font}}>{c.icon} {c.label}</button>)}</div></div>}
    </div>
    <div style={{flexShrink:0,padding:"12px 18px",borderTop:`1px solid ${T.border}`,display:"flex",justifyContent:"flex-end",gap:8}}><button onClick={onClose}style={{padding:"8px 16px",borderRadius:8,fontSize:12,border:`1px solid ${T.border}`,background:"transparent",color:T.textMuted,cursor:"pointer",fontFamily:T.font}}>Cancelar</button><button onClick={()=>{onSave(f);onClose()}}style={{padding:"8px 20px",borderRadius:8,fontSize:12,fontWeight:700,border:"none",background:`linear-gradient(135deg,${T.accent},${T.yellow})`,color:T.accentText,cursor:"pointer",fontFamily:T.font}}>Salvar</button></div>
  </div></div>}

// Calendar — sidebar "+ Criar" + MEUS CALENDÁRIOS + grade mensal
function CalView({posts,onEdit,onNewCard,postTypes,specialDates=[]}){
  const now=new Date();
  const types=postTypes?.length?postTypes:POST_TYPES;
  const[currentMonth,setCurrentMonth]=useState(()=>new Date(now.getFullYear(),now.getMonth(),1));
  const[showScheduled,setShowScheduled]=useState(true);
  const[showSpecialDates,setShowSpecialDates]=useState(true);
  const year=currentMonth.getFullYear();
  const month=currentMonth.getMonth();
  const monthName=currentMonth.toLocaleDateString("pt-BR",{month:"long",year:"numeric"});
  const firstDay=new Date(year,month,1);
  const lastDay=new Date(year,month+1,0);
  const startPad=(firstDay.getDay()+7)%7;
  const daysInMonth=lastDay.getDate();
  const totalCells=startPad+daysInMonth;
  const rows=Math.ceil(totalCells/7);
  const cellList=Array.from({length:rows*7},(_,i)=>i>=startPad&&i<startPad+daysInMonth?new Date(year,month,i-startPad+1):null);
  const prevMonth=()=>setCurrentMonth(d=>new Date(d.getFullYear(),d.getMonth()-1,1));
  const nextMonth=()=>setCurrentMonth(d=>new Date(d.getFullYear(),d.getMonth()+1,1));
  const goToday=()=>setCurrentMonth(new Date(now.getFullYear(),now.getMonth(),1));
  const isToday=(d)=>d&&d.getDate()===now.getDate()&&d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();
  const isPast=(d)=>d&&!isToday(d)&&d.getTime()<new Date(now.getFullYear(),now.getMonth(),now.getDate()).getTime();
  const toYMD=(d)=>d?d.toISOString().split("T")[0]:null;
  return<div style={{display:"flex",minHeight:"calc(100vh - 102px)",animation:"fadeIn 0.3s"}}>
    <aside style={{width:200,flexShrink:0,padding:"20px 14px",borderRight:`1px solid ${T.border}`,display:"flex",flexDirection:"column",gap:20}}>
      <button type="button"onClick={onNewCard}style={{padding:"12px 18px",borderRadius:10,fontSize:14,fontWeight:700,border:"none",background:`linear-gradient(135deg,${T.accent},${T.yellow})`,color:T.accentText,cursor:"pointer",fontFamily:T.font}}>+ Criar</button>
      <div><div style={{fontSize:11,fontWeight:700,color:T.textMuted,textTransform:"uppercase",marginBottom:12}}>MEUS CALENDÁRIOS</div>
        <label style={{display:"flex",alignItems:"center",gap:10,marginBottom:10,cursor:"pointer",fontSize:13,color:T.text}}><input type="checkbox"checked={showScheduled}onChange={e=>setShowScheduled(e.target.checked)}style={{accentColor:T.accent}}/><span style={{width:12,height:12,borderRadius:2,background:T.accent}}/><span>Posts agendados</span></label>
        <label style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",fontSize:13,color:T.text}}><input type="checkbox"checked={showSpecialDates}onChange={e=>setShowSpecialDates(e.target.checked)}style={{accentColor:T.green}}/><span style={{width:12,height:12,borderRadius:2,background:T.green}}/><span>Datas especiais</span></label>
      </div>
    </aside>
    <div style={{flex:1,padding:"16px 20px",overflow:"auto"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:10}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}><IconBtn onClick={prevMonth}>←</IconBtn><h2 style={{fontSize:18,fontWeight:800,color:T.text,margin:0,textTransform:"capitalize"}}>{monthName}</h2><IconBtn onClick={nextMonth}>→</IconBtn></div>
        <button type="button"onClick={goToday}style={{padding:"6px 14px",borderRadius:8,fontSize:12,fontWeight:600,border:`1px solid ${T.accentBorder}`,background:T.accentGlow,color:T.accent,cursor:"pointer",fontFamily:T.font}}>Hoje</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4}}>
        {DAY_NAMES_CAL.map((d,i)=><div key={i}style={{textAlign:"center",paddingBottom:8,fontSize:11,fontWeight:700,color:T.textMuted,textTransform:"uppercase"}}>{d}</div>)}
        {cellList.map((d,i)=>{const ds=toYMD(d);const dayPosts=showScheduled&&ds?posts.filter(p=>p.scheduledDate===ds):[];const isT=d&&isToday(d);return<div key={i}style={{minHeight:100,borderRadius:10,padding:8,background:isT?"rgba(255,107,53,0.08)":T.card,border:isT?`1px solid ${T.accentBorder}`:`1px solid ${T.border}`,opacity:!d?0.35:isPast(d)?0.6:1}}>
          {d&&<div style={{fontSize:13,fontWeight:800,color:isT?T.accent:T.text,marginBottom:6,fontFamily:T.mono}}>{d.getDate()}</div>}
          {showScheduled&&dayPosts.map(p=>{const ti=types.find(t=>t.id===p.type);return<div key={p.id}onClick={()=>onEdit(p)}style={{padding:"5px 6px",borderRadius:6,cursor:"pointer",background:`${ti?.color}15`,border:`1px solid ${ti?.color}30`,marginBottom:4,fontSize:10.5,fontWeight:600,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}><span style={{color:T.textMuted,fontSize:9}}>{p.scheduledTime||""}</span> {p.title.length>20?p.title.slice(0,20)+"…":p.title}</div>})}
          {showSpecialDates&&ds&&specialDates.filter(sd=>sd.date===ds).map(sd=><div key={sd.id}style={{fontSize:9.5,color:T.green,padding:"2px 4px",background:T.greenBg,borderRadius:4,marginTop:2}}>🎉 {sd.name}</div>)}
        </div>})}
      </div>
    </div>
  </div>}

// AI Mentor
const AI_R={ideias:`5 ideias de reel:\n\n**1. 🔥 "Seu studio vai fechar em 2 anos"** Score: 93\n**2. 💣 "A mentira sobre certificação"** Score: 90\n**3. 🎯 "Pilates Wall: trend nova"** Score: 88 ⚡Ninguém cobriu!\n**4. ⚡ "3 erros com gestantes"** Score: 86 ⚠️14 dias sem post\n**5. 🧠 "Joseph Pilates odiaria 90% dos studios"** Score: 91`,semana:`**Plano 24-28/02:**\n✅ Seg 07h: "R$50/aula" (95) AGENDADO\n💡 Ter 07h: "Checklist 30 itens" (92)\n🆕 Qua 12h: "Pilates Wall" (88)\n🆕 Qui 07h: "Buyology Pt2" (85)\n🆕 Sex 18h: "Quase desisti" (90)\n⚠️ Gestante sem post há 14 dias!`,stories_ideias:`📱 **5 ideias de sequência de Stories:**\n\n**1. Enquete "Quanto você cobra?"** — Engajar antes do reel de precificação\n**2. Quiz Gestantes** — 4 perguntas + revelação + link pro reel\n**3. Bastidores da gravação** — Humanizar o processo de criar conteúdo\n**4. Countdown MBA Turma 8** — 3 dias de antecipação\n**5. Q&A sobre abertura de studio** — Caixinha + respostas em vídeo\n\nQuer que eu monte a sequência de slides de alguma?`};
function AIMentor({onClose}){const[msgs,setMsgs]=useState([{role:"ai",text:`Oi Rafael! 👋\n\n📊 8 posts + 4 sequências de stories no pipeline\n🏆 Engajamento: 6.7% (2x acima da média)\n⚠️ Gestante sem post há 14 dias\n🔥 "Pilates Wall" trending\n📱 Story publicado hoje: 72% conclusão (acima da média!)\n\nUse os botões ou pergunte qualquer coisa.`}]);const[inp,setInp]=useState("");const[typ,setTyp]=useState(false);const ref=useRef(null);
  const acts=[{l:"💡 Ideias Reel",k:"ideias"},{l:"📅 Plano semana",k:"semana"},{l:"📱 Ideias Stories",k:"stories_ideias"},{l:"📊 Performance",k:"ideias"},{l:"🎣 Ganchos",k:"ideias"},{l:"👁 Concorrentes",k:"semana"}];
  useEffect(()=>{if(ref.current)ref.current.scrollTop=ref.current.scrollHeight},[msgs,typ]);
  const send=(text,key)=>{const m=text||inp;if(!m.trim()&&!key)return;setMsgs(p=>[...p,{role:"user",text:m}]);setInp("");setTyp(true);setTimeout(()=>{setTyp(false);setMsgs(p=>[...p,{role:"ai",text:AI_R[key]||AI_R.ideias}])},700+Math.random()*500)};
  const fmt=(t)=>t.split('\n').map((l,i)=><div key={i}dangerouslySetInnerHTML={{__html:l.replace(/\*\*(.+?)\*\*/g,'<strong style="color:#fff">$1</strong>')||'&nbsp;'}}style={{marginBottom:l?2:6}}/>);
  return<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(5px)"}}onClick={e=>{if(e.target===e.currentTarget)onClose()}}role="presentation"><div role="dialog"aria-modal="true"aria-label="IA Mentor"style={{width:"min(660px,96vw)",height:"84vh",background:T.bg,borderRadius:16,display:"flex",flexDirection:"column",border:`1px solid ${T.accentBorder}`,boxShadow:"0 30px 90px rgba(0,0,0,0.6)",animation:"scaleIn 0.2s",overflow:"hidden"}}onKeyDown={e=>e.key==="Escape"&&onClose()}>
    <div style={{padding:"12px 16px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",background:"rgba(255,107,53,0.03)"}}><div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:34,height:34,borderRadius:9,background:`linear-gradient(135deg,${T.accent},${T.yellow})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17}}>🧠</div><div><div style={{color:T.text,fontWeight:800,fontSize:13}}>IA Mentor</div><div style={{color:T.green,fontSize:10}}>● Online</div></div></div><IconBtn onClick={onClose}>✕</IconBtn></div>
    <div ref={ref}style={{flex:1,overflowY:"auto",padding:"12px 16px",display:"flex",flexDirection:"column",gap:8}}>{msgs.map((m,i)=><div key={i}style={{alignSelf:m.role==="user"?"flex-end":"flex-start",maxWidth:"88%",animation:"fadeIn 0.25s"}}>{m.role==="ai"&&<div style={{display:"flex",alignItems:"center",gap:4,marginBottom:3}}><span style={{fontSize:10}}>🧠</span><span style={{fontSize:10,fontWeight:700,color:T.accent}}>IA</span></div>}<div style={{background:m.role==="user"?`linear-gradient(135deg,${T.accent},#e85d2c)`:"rgba(255,255,255,0.04)",padding:"10px 14px",color:T.text,fontSize:12,lineHeight:1.6,borderRadius:m.role==="user"?"13px 13px 3px 13px":"13px 13px 13px 3px",border:m.role==="ai"?`1px solid ${T.border}`:"none"}}>{m.role==="ai"?fmt(m.text):m.text}</div></div>)}{typ&&<div style={{alignSelf:"flex-start"}}><div style={{background:"rgba(255,255,255,0.04)",padding:"10px 14px",borderRadius:"13px 13px 13px 3px",border:`1px solid ${T.border}`,display:"flex",gap:4}}>{[0,1,2].map(i=><span key={i}style={{width:6,height:6,borderRadius:"50%",background:T.accent,animation:`typing 1.2s infinite ${i*0.2}s`}}/>)}</div></div>}</div>
    <div style={{padding:"7px 16px 10px",borderTop:`1px solid ${T.border}`}}><div style={{display:"flex",flexWrap:"wrap",gap:3,marginBottom:7}}>{acts.map((a,i)=><button key={i}onClick={()=>send(a.l,a.k)}style={{background:"rgba(255,107,53,0.08)",border:`1px solid ${T.accentBorder}`,color:T.accent,padding:"3px 9px",borderRadius:6,fontSize:10.5,cursor:"pointer",fontFamily:T.font,fontWeight:600}}>{a.l}</button>)}</div><div style={{display:"flex",gap:6}}><input value={inp}onChange={e=>setInp(e.target.value)}onKeyDown={e=>e.key==="Enter"&&send()}placeholder="Pergunte..."style={{flex:1,background:"rgba(255,255,255,0.04)",border:`1px solid ${T.border}`,borderRadius:9,padding:"9px 12px",color:T.text,fontSize:12.5,fontFamily:T.font,outline:"none"}}onFocus={e=>e.target.style.borderColor=T.accentBorder}onBlur={e=>e.target.style.borderColor=T.border}/><button onClick={()=>send()}style={{background:`linear-gradient(135deg,${T.accent},${T.yellow})`,border:"none",borderRadius:9,padding:"0 18px",color:T.accentText,fontWeight:800,cursor:"pointer",fontSize:14}}>→</button></div></div>
  </div></div>}

// Metrics
function MetricsView(){const mx=Math.max(...METRICS.byDay.map(d=>d.v));return<div style={{padding:"16px 18px",animation:"fadeIn 0.3s"}}><h2 style={{fontSize:16,fontWeight:800,color:T.text,margin:"0 0 14px"}}>📊 Performance</h2><div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:16}}>{Object.entries(METRICS.kpis).map(([k,d])=><div key={k}style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:11,padding:12}}><div style={{fontSize:9.5,color:T.textMuted,textTransform:"uppercase",letterSpacing:"0.04em",marginBottom:4}}>{k==="followers"?"Seguidores":k==="engagement"?"Engajamento":k==="reach"?"Alcance":"Saves"}</div><div style={{fontSize:20,fontWeight:800,color:T.text,fontFamily:T.mono}}>{d.val}</div><div style={{fontSize:10,color:T.green,marginTop:2}}>↑ {d.change} ({d.pct})</div></div>)}</div><div style={{display:"grid",gridTemplateColumns:"1.4fr 1fr",gap:10}}><div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:16}}><div style={{fontSize:12,fontWeight:700,color:T.text,marginBottom:14}}>Engajamento/Dia</div><div style={{display:"flex",alignItems:"flex-end",gap:8,height:120}}>{METRICS.byDay.map((d,i)=><div key={i}style={{flex:1,textAlign:"center"}}><div style={{height:`${(d.v/mx)*100}px`,background:d.v===mx?`linear-gradient(to top,${T.accent},${T.yellow})`:`${T.accent}50`,borderRadius:"5px 5px 0 0",position:"relative"}}><span style={{position:"absolute",top:-16,left:"50%",transform:"translateX(-50%)",fontSize:10,fontWeight:700,color:d.v===mx?T.yellow:"rgba(255,255,255,0.4)",fontFamily:T.mono}}>{d.v}%</span></div><div style={{marginTop:5,fontSize:9,color:d.v===mx?T.accent:T.textMuted}}>{d.d}</div></div>)}</div></div><div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:16}}><div style={{fontSize:12,fontWeight:700,color:T.text,marginBottom:12}}>Top Posts</div>{METRICS.topPosts.map((p,i)=><div key={i}style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:i<2?`1px solid ${T.border}`:"none"}}><span style={{width:18,height:18,borderRadius:"50%",background:i<3?[T.yellow,"#C0C0C0","#CD7F32"][i]:"rgba(255,255,255,0.1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:800,color:T.bg,flexShrink:0}}>{i+1}</span><div style={{flex:1,fontSize:11,fontWeight:600,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.title}</div><span style={{fontSize:11,fontWeight:700,color:T.green,fontFamily:T.mono}}>{p.eng}</span></div>)}</div></div></div>}

// Trends
function TrendsView(){return<div style={{padding:"16px 18px",animation:"fadeIn 0.3s"}}><h2 style={{fontSize:16,fontWeight:800,color:T.text,margin:"0 0 14px"}}>🔥 Tendências</h2><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>{TRENDS.map((t,i)=><div key={t.id}style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:14,animation:`fadeIn 0.3s ease ${i*0.05}s both`}}onMouseEnter={e=>e.currentTarget.style.borderColor=T.borderHover}onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}><div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><Badge color={t.urgency==="alta"?T.accent:T.yellow}style={{fontSize:9}}>{t.urgency==="alta"?"🔥URGENTE":"📌RELEVANTE"}</Badge><span style={{fontSize:9,color:T.textDim}}>{t.time}</span></div><div style={{fontSize:14,fontWeight:700,color:T.text,marginBottom:5}}>{t.topic}</div><div style={{fontSize:11,color:T.textMuted,lineHeight:1.5,marginBottom:8}}>{t.desc}</div>{(t.views||t.growth)&&<div style={{display:"flex",gap:6,marginBottom:8}}>{t.views&&<Badge color={T.cyan}style={{fontSize:9}}>👁{t.views}</Badge>}{t.growth&&<Badge color={T.green}style={{fontSize:9}}>📈{t.growth}</Badge>}</div>}<div style={{background:T.accentGlow,border:`1px solid ${T.accentBorder}`,borderRadius:8,padding:"6px 10px",fontSize:11,color:"rgba(255,255,255,0.6)"}}><span style={{fontWeight:700,color:T.accent}}>💡</span> {t.opp}</div></div>)}</div></div>}

// CRM
function CRMView(){const[stages,setStages]=useState(DEFAULT_CRM);const[cards,setCards]=useState(CRM_CARDS);const[dc,setDc]=useState(null);const[hs,setHs]=useState(null);const[ec,setEc]=useState(null);const[showAdd,setShowAdd]=useState(false);const[nl,setNl]=useState("");const[ni,setNi]=useState("📌");const[nc,setNc]=useState("#45B7D1");
  const addStage=()=>{if(!nl.trim())return;setStages(p=>[...p.slice(0,-1),{id:"s"+Date.now(),label:nl,icon:ni,color:nc},p[p.length-1]]);setNl("");setShowAdd(false)};
  const drop=(sid)=>{if(dc&&dc.stage!==sid)setCards(p=>p.map(c=>c.id===dc.id?{...c,stage:sid}:c));setDc(null);setHs(null)};
  const saveCard=(card)=>{setCards(p=>p.find(c=>c.id===card.id)?p.map(c=>c.id===card.id?card:c):[...p,card]);setEc(null)};
  return<div style={{padding:"16px 14px",animation:"fadeIn 0.3s"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}><div><h2 style={{fontSize:16,fontWeight:800,color:T.text,margin:0}}>🤝 CRM Pipeline</h2><div style={{fontSize:11,color:T.textMuted,marginTop:2}}>Arraste cards · Crie etapas</div></div><div style={{display:"flex",gap:6}}><Badge color={T.green}style={{fontSize:11,padding:"4px 10px"}}>📊 {cards.length} oportunidades</Badge><button onClick={()=>setShowAdd(true)}style={{padding:"5px 12px",borderRadius:8,fontSize:11,fontWeight:700,border:`1px solid ${T.accentBorder}`,background:T.accentGlow,color:T.accent,cursor:"pointer",fontFamily:T.font}}>+ Etapa</button></div></div>
    {showAdd&&<div style={{marginBottom:12,background:T.card,border:`1px solid ${T.accentBorder}`,borderRadius:10,padding:14,animation:"fadeIn 0.2s"}}><div style={{display:"flex",gap:8,alignItems:"flex-end",flexWrap:"wrap"}}><div><label style={{fontSize:9,color:T.textMuted,display:"block",marginBottom:3,fontWeight:600,textTransform:"uppercase"}}>Nome</label><input value={nl}onChange={e=>setNl(e.target.value)}placeholder="Ex: Follow-up"style={{background:"rgba(255,255,255,0.03)",border:`1px solid ${T.border}`,borderRadius:7,padding:"7px 10px",color:T.text,fontSize:12,fontFamily:T.font,outline:"none",width:180}}onKeyDown={e=>e.key==="Enter"&&addStage()}/></div><div><label style={{fontSize:9,color:T.textMuted,display:"block",marginBottom:3,fontWeight:600,textTransform:"uppercase"}}>Ícone</label><div style={{display:"flex",gap:2}}>{"🎯📩🤝📋🏆💎🚀⭐📌💰".split("").filter((_,i)=>i%2===0||true).slice(0,6).map(ic=><button key={ic}onClick={()=>setNi(ic)}style={{width:26,height:26,borderRadius:5,border:ni===ic?`2px solid ${T.accent}`:`1px solid ${T.border}`,background:ni===ic?T.accentGlow:"transparent",cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center"}}>{ic}</button>)}</div></div><div><label style={{fontSize:9,color:T.textMuted,display:"block",marginBottom:3,fontWeight:600,textTransform:"uppercase"}}>Cor</label><div style={{display:"flex",gap:2}}>{"#FF6B35,#F7C948,#4ECDC4,#45B7D1,#5DE8A0,#A78BFA".split(",").map(c=><button key={c}onClick={()=>setNc(c)}style={{width:20,height:20,borderRadius:5,background:c,border:nc===c?"2px solid #fff":"2px solid transparent",cursor:"pointer",opacity:nc===c?1:0.5}}/>)}</div></div><button onClick={addStage}style={{padding:"7px 14px",borderRadius:7,fontSize:11,fontWeight:700,border:"none",background:`linear-gradient(135deg,${T.accent},${T.yellow})`,color:T.bg,cursor:"pointer",fontFamily:T.font}}>Criar</button><button onClick={()=>setShowAdd(false)}style={{padding:"7px 10px",borderRadius:7,fontSize:11,border:`1px solid ${T.border}`,background:"transparent",color:T.textMuted,cursor:"pointer",fontFamily:T.font}}>✕</button></div></div>}
    <div style={{display:"flex",gap:8,overflowX:"auto",minHeight:"calc(100vh - 180px)",paddingBottom:40}}>
      {stages.map((stage,si)=>{const sc=cards.filter(c=>c.stage===stage.id);const isT=dc&&dc.stage!==stage.id;
        return<div key={stage.id}onDragOver={e=>{e.preventDefault();setHs(stage.id)}}onDragLeave={()=>setHs(null)}onDrop={e=>{e.preventDefault();drop(stage.id)}}style={{minWidth:240,maxWidth:240,display:"flex",flexDirection:"column",borderRadius:10,border:hs===stage.id&&isT?`1px dashed ${T.accentBorder}`:"1px solid transparent",background:hs===stage.id&&isT?"rgba(255,107,53,0.03)":"transparent",transition:"all 0.2s"}}>
          <div style={{padding:"8px 8px 7px",borderBottom:`2px solid ${stage.color}40`,marginBottom:5,display:"flex",alignItems:"center",justifyContent:"space-between"}}><div style={{display:"flex",alignItems:"center",gap:5}}><span style={{fontSize:12}}>{stage.icon}</span><span style={{fontWeight:700,fontSize:11.5,color:T.text}}>{stage.label}</span><span style={{background:`${stage.color}15`,color:stage.color,fontSize:9,fontWeight:800,width:18,height:18,borderRadius:4,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:T.mono}}>{sc.length}</span></div><div style={{display:"flex",gap:1}}>{si>0&&<IconBtn small onClick={()=>{setStages(p=>{const n=[...p];[n[si],n[si-1]]=[n[si-1],n[si]];return n})}}>◂</IconBtn>}{si<stages.length-1&&<IconBtn small onClick={()=>{setStages(p=>{const n=[...p];[n[si],n[si+1]]=[n[si+1],n[si]];return n})}}>▸</IconBtn>}{stages.length>2&&<IconBtn small onClick={()=>{if(confirm(`Remover "${stage.label}"?`)){setCards(p=>p.map(c=>c.stage===stage.id?{...c,stage:stages[0].id}:c));setStages(p=>p.filter(s=>s.id!==stage.id))}}}>✕</IconBtn>}</div></div>
          <div style={{flex:1,overflowY:"auto",padding:"0 4px 4px"}}>{sc.map(card=><div key={card.id}draggable onDragStart={e=>{e.dataTransfer.effectAllowed="move";setDc(card)}}onClick={()=>setEc(card)}style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:9,padding:"9px 10px",cursor:"grab",marginBottom:5,transition:"all 0.2s"}}onMouseEnter={e=>{e.currentTarget.style.borderColor=T.borderHover;e.currentTarget.style.transform="translateY(-1px)"}}onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.transform="none"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><Badge color={card.priority==="alta"?T.accent:T.yellow}style={{fontSize:8.5}}>{card.priority==="alta"?"🔴Alta":"🟡Média"}</Badge>{card.value&&<span style={{fontSize:10,fontWeight:700,color:card.value.includes("R$")?T.green:T.cyan,fontFamily:T.mono}}>{card.value}</span>}</div><div style={{fontSize:12,fontWeight:650,color:T.text,lineHeight:1.35,marginBottom:3}}>{card.title}</div>{card.desc&&<div style={{fontSize:10,color:T.textMuted,lineHeight:1.4,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{card.desc}</div>}</div>)}</div>
          <button onClick={()=>setEc({id:genId(),stage:stage.id,title:"",desc:"",value:"",priority:"média",contact:"",tags:[]})}style={{margin:"2px 4px 7px",padding:7,background:"transparent",border:`1px dashed ${T.border}`,borderRadius:7,color:T.textDim,fontSize:10.5,cursor:"pointer",fontFamily:T.font}}onMouseEnter={e=>{e.target.style.borderColor=stage.color;e.target.style.color=stage.color}}onMouseLeave={e=>{e.target.style.borderColor=T.border;e.target.style.color=T.textDim}}>+ Novo</button>
        </div>})}
    </div>
    {ec&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(6px)"}}onClick={e=>{if(e.target===e.currentTarget)setEc(null)}}role="presentation"><div role="dialog"aria-modal="true"aria-label="Editar card do CRM"style={{width:"min(520px,94vw)",maxHeight:"80vh",background:T.surface,borderRadius:14,display:"flex",flexDirection:"column",border:`1px solid ${T.border}`,animation:"scaleIn 0.2s",overflow:"hidden"}}onKeyDown={e=>e.key==="Escape"&&setEc(null)}><div style={{padding:"12px 18px",borderBottom:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between"}}><Badge color={stages.find(s=>s.id===ec.stage)?.color}>{stages.find(s=>s.id===ec.stage)?.icon}{stages.find(s=>s.id===ec.stage)?.label}</Badge><div style={{display:"flex",gap:3}}><IconBtn onClick={()=>{setCards(p=>p.filter(c=>c.id!==ec.id));setEc(null)}} title="Excluir">🗑️</IconBtn><IconBtn onClick={()=>setEc(null)} title="Fechar">✕</IconBtn></div></div><div style={{flex:1,overflowY:"auto",padding:16}}><input value={ec.title}onChange={e=>setEc(p=>({...p,title:e.target.value}))}placeholder="Título..."style={{width:"100%",background:"transparent",border:"none",color:T.text,fontSize:16,fontWeight:700,fontFamily:T.font,outline:"none",marginBottom:12,borderBottom:`1px solid ${T.border}`,paddingBottom:8}}/><div style={{display:"flex",gap:8,marginBottom:12}}><div style={{flex:1}}><label style={{fontSize:9,color:T.textMuted,fontWeight:700,display:"block",marginBottom:4,textTransform:"uppercase"}}>Valor</label><input value={ec.value}onChange={e=>setEc(p=>({...p,value:e.target.value}))}placeholder="R$5.000"style={{width:"100%",background:"rgba(255,255,255,0.03)",border:`1px solid ${T.border}`,borderRadius:7,padding:"7px 10px",color:T.text,fontSize:12,fontFamily:T.font,outline:"none"}}/></div><div><label style={{fontSize:9,color:T.textMuted,fontWeight:700,display:"block",marginBottom:4,textTransform:"uppercase"}}>Prioridade</label><div style={{display:"flex",gap:3}}>{"alta,média".split(",").map(p=><button key={p}onClick={()=>setEc(prev=>({...prev,priority:p}))}style={{padding:"4px 10px",borderRadius:6,fontSize:10.5,fontWeight:600,border:ec.priority===p?`1px solid ${p==="alta"?T.accent:T.yellow}60`:`1px solid ${T.border}`,background:ec.priority===p?`${p==="alta"?T.accent:T.yellow}15`:"transparent",color:ec.priority===p?p==="alta"?T.accent:T.yellow:T.textMuted,cursor:"pointer",fontFamily:T.font}}>{p==="alta"?"🔴":"🟡"}{p}</button>)}</div></div></div><textarea value={ec.desc}onChange={e=>setEc(p=>({...p,desc:e.target.value}))}placeholder="Descrição..."rows={2}style={{width:"100%",background:"rgba(255,255,255,0.03)",border:`1px solid ${T.border}`,borderRadius:7,padding:"8px 10px",color:T.text,fontSize:12,fontFamily:T.font,lineHeight:1.5,outline:"none",resize:"vertical",marginBottom:10}}/><input value={ec.contact}onChange={e=>setEc(p=>({...p,contact:e.target.value}))}placeholder="Contato..."style={{width:"100%",background:"rgba(255,255,255,0.03)",border:`1px solid ${T.border}`,borderRadius:7,padding:"7px 10px",color:T.text,fontSize:12,fontFamily:T.font,outline:"none",marginBottom:10}}/><div style={{display:"flex",gap:3,flexWrap:"wrap"}}>{stages.map(s=><button key={s.id}onClick={()=>setEc(p=>({...p,stage:s.id}))}style={{padding:"3px 9px",borderRadius:6,fontSize:10.5,fontWeight:600,border:ec.stage===s.id?`1px solid ${s.color}60`:`1px solid ${T.border}`,background:ec.stage===s.id?`${s.color}15`:"transparent",color:ec.stage===s.id?s.color:T.textMuted,cursor:"pointer",fontFamily:T.font}}>{s.icon}{s.label}</button>)}</div></div><div style={{padding:"10px 16px",borderTop:`1px solid ${T.border}`,display:"flex",justifyContent:"flex-end",gap:6}}><button onClick={()=>setEc(null)}style={{padding:"6px 12px",borderRadius:7,fontSize:11,border:`1px solid ${T.border}`,background:"transparent",color:T.textMuted,cursor:"pointer",fontFamily:T.font}}>Cancelar</button><button onClick={()=>saveCard(ec)}style={{padding:"6px 16px",borderRadius:7,fontSize:11,fontWeight:700,border:"none",background:`linear-gradient(135deg,${T.accent},${T.yellow})`,color:T.accentText,cursor:"pointer",fontFamily:T.font}}>Salvar</button></div></div></div>}
  </div>}

// Hooks
function HooksView(){const sorted=[...HOOK_BANK].sort((a,b)=>b.score-a.score);return<div style={{padding:"16px 18px",animation:"fadeIn 0.3s",maxWidth:700}}><h2 style={{fontSize:16,fontWeight:800,color:T.text,margin:"0 0 14px"}}>🎣 Banco de Ganchos</h2>{sorted.map((h,i)=>{const p=PILLARS.find(x=>x.id===h.cat);return<div key={h.id}style={{padding:"10px 14px",marginBottom:5,borderRadius:9,background:T.card,border:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:12,animation:`fadeIn 0.3s ease ${i*0.04}s both`}}><span style={{fontSize:13,fontWeight:800,color:i<3?[T.yellow,"#C0C0C0","#CD7F32"][i]:T.textDim,fontFamily:T.mono,width:20,textAlign:"center"}}>{i<3?["🥇","🥈","🥉"][i]:i+1}</span><div style={{flex:1}}><div style={{fontSize:12.5,fontWeight:650,color:T.text,marginBottom:2}}>"{h.text}"</div><div style={{display:"flex",gap:5}}><Badge color={p?.color}style={{fontSize:9}}>#{p?.label}</Badge><span style={{fontSize:9.5,color:T.textDim}}>Usado {h.uses}x</span></div></div><AIS score={h.score}size="lg"/></div>})}</div>}

const slug=(s)=>String(s).toLowerCase().replace(/\s+/g,"_").replace(/[^a-z0-9_]/g,"");
// CMS — full config: etapas, tipos, tags, usuários, campos, avisos, contador, CSV, datas especiais, Gemini
function CMSView({cms,setCms,columns,postTypes,pillars,users,cardFormFieldIds,setCardFormFieldIds,setPosts}){
  const[modal,setModal]=useState(null);
  const toggle=(id)=>{setCardFormFieldIds(prev=>prev.includes(id)?prev.filter(x=>x!==id):[...prev,id].sort((a,b)=>CARD_FORM_FIELDS.findIndex(f=>f.id===a)-CARD_FORM_FIELDS.findIndex(f=>f.id===b)))};
  const moveCol=(idx,delta)=>{const arr=[...columns];const to=Math.max(0,Math.min(arr.length-1,idx+delta));if(to===idx)return;[arr[idx],arr[to]]=[arr[to],arr[idx]];setCms(prev=>({...prev,columns:arr}))};
  const addOrUpdateColumn=(v)=>{const arr=v.id?columns.map(c=>c.id===v.id?v:c):[...columns,{...v,id:v.id||slug(v.label)}];if(!v.id)arr[arr.length-1].id=arr[arr.length-1].id||slug(arr[arr.length-1].label);setCms(prev=>({...prev,columns:arr}));setModal(null)};
  const deleteColumn=(id)=>{if(!confirm("Excluir etapa? Posts nesta coluna podem ser movidos para a primeira."))return;const first=columns[0]?.id;setCms(prev=>({...prev,columns:prev.columns.filter(c=>c.id!==id)}));if(setPosts&&first)setPosts(prev=>prev.map(p=>p.column===id?{...p,column:first}:p))};
  const addOrUpdatePostType=(v)=>{const arr=v.id?postTypes.map(p=>p.id===v.id?v:p):[...postTypes,{...v,id:v.id||slug(v.label)}];if(!v.id)arr[arr.length-1].id=arr[arr.length-1].id||slug(arr[arr.length-1].label);setCms(prev=>({...prev,postTypes:arr}));setModal(null)};
  const deletePostType=(id)=>{if(!confirm("Excluir tipo?"))return;const first=postTypes[0]?.id;setCms(prev=>({...prev,postTypes:prev.postTypes.filter(p=>p.id!==id)}));if(setPosts&&first)setPosts(prev=>prev.map(p=>p.type===id?{...p,type:first}:p))};
  const addOrUpdatePillar=(v)=>{const arr=v.id?pillars.map(p=>p.id===v.id?v:p):[...pillars,{...v,id:v.id||slug(v.label)}];if(!v.id)arr[arr.length-1].id=arr[arr.length-1].id||slug(arr[arr.length-1].label);setCms(prev=>({...prev,pillars:arr}));setModal(null)};
  const deletePillar=(id)=>{if(!confirm("Excluir pilar?"))return;setCms(prev=>({...prev,pillars:prev.pillars.filter(p=>p.id!==id)}))};
  const addOrUpdateUser=(v)=>{const id=v.id||("user_"+Date.now());const arr=v.id?users.map(u=>u.id===v.id?v:u):[...users,{...v,id,avatar:(v.avatar||(v.name||"?").slice(0,1).toUpperCase())}];if(!v.id)arr[arr.length-1].id=id;setCms(prev=>({...prev,users:arr}));setModal(null)};
  const deleteUser=(id)=>{if(!confirm("Excluir usuário?"))return;setCms(prev=>({...prev,users:prev.users.filter(u=>u.id!==id)}))};
  const addOrUpdateSpecialDate=(v)=>{const id=v.id||genId();const arr=v.id?cms.specialDates.map(s=>s.id===v.id?v:s):[...(cms.specialDates||[]),{...v,id,date:v.date}];if(!v.id)arr[arr.length-1].id=id;setCms(prev=>({...prev,specialDates:arr}));setModal(null)};
  const deleteSpecialDate=(id)=>{setCms(prev=>({...prev,specialDates:(prev.specialDates||[]).filter(s=>s.id!==id)}))};
  const readyColumnIds=cms.readyColumnIds??["agendado"];const setReady=(ids)=>{setCms(prev=>({...prev,readyColumnIds:ids}))};const toggleReady=(colId)=>{setReady(readyColumnIds.includes(colId)?readyColumnIds.filter(x=>x!==colId):[...readyColumnIds,colId])};
  const alertConfig=cms.alertConfig||{scheduledEnabled:true,scheduledDaysAfter:1,draftEnabled:true,draftDaysStale:7,specialDatesDaysBefore:12};const setAlert=(key,val)=>{setCms(prev=>({...prev,alertConfig:{...prev.alertConfig,[key]:val}}))};
  const csvRef=useRef(null);
  const onCsvFile=(e)=>{const file=e.target?.files?.[0];if(!file||!setPosts)return;const reader=new FileReader();reader.onload=()=>{const text=reader.result;const sep=text.includes(";")?";":",";const lines=text.split(/\r?\n/).filter(Boolean);if(lines.length<2)return;const head=lines[0].toLowerCase().split(sep).map(h=>h.trim());const get=(row,k)=>{const i=head.findIndex(h=>h.includes(k));return i>=0&&row[i]!==undefined?String(row[i]).trim():null};setPosts(prev=>{const next=prev.slice();for(let i=1;i<lines.length;i++){const row=lines[i].split(sep);const postId=get(row,"post_id")||get(row,"id")||get(row,"post");const title=get(row,"title");const likes=parseInt(get(row,"like")||get(row,"likes")||"0",10)||0;const comments=parseInt(get(row,"comment")||get(row,"comments")||"0",10)||0;const saves=parseInt(get(row,"save")||get(row,"saves")||"0",10)||0;const shares=parseInt(get(row,"share")||get(row,"shares")||"0",10)||0;const reach=parseInt(get(row,"reach")||"0",10)||0;const engagement={likes,comments,saves,shares,reach};const idx2=next.findIndex(p=>p.id===postId||(title&&p.title===title));if(idx2>=0)next[idx2]={...next[idx2],engagement}}return next})};reader.readAsText(file,"utf-8");e.target.value=""};
  const section=(title,children)=><div style={{marginBottom:28}}><div style={{fontSize:12,fontWeight:700,color:T.textMuted,textTransform:"uppercase",marginBottom:10}}>{title}</div>{children}</div>;
  return<div style={{padding:"24px 20px",animation:"fadeIn 0.3s",maxWidth:620,overflowY:"auto",maxHeight:"calc(100vh - 90px)"}}>
    <h2 style={{fontSize:18,fontWeight:800,color:T.text,margin:"0 0 8px"}}>📋 CMS</h2>
    <p style={{fontSize:13,color:T.textMuted,lineHeight:1.6,marginBottom:24}}>Configure etapas, tipos, tags, usuários e avisos. Tudo salvo no navegador.</p>
    {section("Etapas do board (colunas)",<><div style={{display:"flex",flexDirection:"column",gap:6}}>{columns.map((c,i)=><div key={c.id}style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",background:T.card,borderRadius:8,border:`1px solid ${T.border}`}}><span style={{fontSize:16}}>{c.icon}</span><span style={{flex:1,fontSize:13,fontWeight:600,color:T.text}}>{c.label}</span><span style={{fontSize:10,color:T.textDim,fontFamily:T.mono}}>{c.id}</span><div style={{width:16,height:16,borderRadius:4,background:c.color}}/><div style={{display:"flex",gap:2}}><button type="button"onClick={()=>moveCol(i,-1)}style={{padding:2,borderRadius:4,border:"none",background:T.border,color:T.text,cursor:"pointer",fontSize:10}} disabled={i===0}>↑</button><button type="button"onClick={()=>moveCol(i,1)}style={{padding:2,borderRadius:4,border:"none",background:T.border,color:T.text,cursor:"pointer",fontSize:10}} disabled={i===columns.length-1}>↓</button></div><button type="button"onClick={()=>setModal({kind:"column",edit:c})}style={{padding:"4px 10px",borderRadius:6,fontSize:10,border:"none",background:T.accentGlow,color:T.accent,cursor:"pointer"}}>Editar</button><button type="button"onClick={()=>deleteColumn(c.id)}style={{padding:"4px 10px",borderRadius:6,fontSize:10,border:"none",background:"rgba(255,87,87,0.2)",color:T.red,cursor:"pointer"}}>Excluir</button></div>)}</div><button type="button"onClick={()=>setModal({kind:"column",edit:null})}style={{padding:"8px 14px",borderRadius:8,fontSize:12,fontWeight:600,border:`1px dashed ${T.border}`,background:"transparent",color:T.accent,cursor:"pointer",marginTop:6}}>+ Etapa</button></>)}
    {section("Tipos de post",<><div style={{display:"flex",flexDirection:"column",gap:6}}>{postTypes.map(pt=>(<div key={pt.id}style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",background:T.card,borderRadius:8,border:`1px solid ${T.border}`}}><span style={{fontSize:16}}>{pt.icon}</span><span style={{flex:1,fontSize:13,fontWeight:600,color:T.text}}>{pt.label}</span><span style={{fontSize:10,color:T.textDim,fontFamily:T.mono}}>{pt.id}</span><div style={{width:16,height:16,borderRadius:4,background:pt.color}}/><button type="button"onClick={()=>setModal({kind:"postType",edit:pt})}style={{padding:"4px 10px",borderRadius:6,fontSize:10,border:"none",background:T.accentGlow,color:T.accent,cursor:"pointer"}}>Editar</button><button type="button"onClick={()=>deletePostType(pt.id)}style={{padding:"4px 10px",borderRadius:6,fontSize:10,border:"none",background:"rgba(255,87,87,0.2)",color:T.red,cursor:"pointer"}}>Excluir</button></div>))}</div><button type="button"onClick={()=>setModal({kind:"postType",edit:null})}style={{padding:"8px 14px",borderRadius:8,fontSize:12,fontWeight:600,border:`1px dashed ${T.border}`,background:"transparent",color:T.accent,cursor:"pointer",marginTop:6}}>+ Tipo</button></>)}
    {section("# Pilares / Tags",<><div style={{display:"flex",flexDirection:"column",gap:6}}>{pillars.map(p=>(<div key={p.id}style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",background:T.card,borderRadius:8,border:`1px solid ${T.border}`}}><span style={{fontSize:12,fontWeight:600,color:p.color}}>#{p.label}</span><span style={{fontSize:10,color:T.textDim,fontFamily:T.mono}}>{p.id}</span><div style={{width:16,height:16,borderRadius:4,background:p.color}}/><button type="button"onClick={()=>setModal({kind:"pillar",edit:p})}style={{padding:"4px 10px",borderRadius:6,fontSize:10,border:"none",background:T.accentGlow,color:T.accent,cursor:"pointer"}}>Editar</button><button type="button"onClick={()=>deletePillar(p.id)}style={{padding:"4px 10px",borderRadius:6,fontSize:10,border:"none",background:"rgba(255,87,87,0.2)",color:T.red,cursor:"pointer"}}>Excluir</button></div>))}</div><button type="button"onClick={()=>setModal({kind:"pillar",edit:null})}style={{padding:"8px 14px",borderRadius:8,fontSize:12,fontWeight:600,border:`1px dashed ${T.border}`,background:"transparent",color:T.accent,cursor:"pointer",marginTop:6}}>+ Pilar</button></>)}
    {section("Usuários",<><div style={{display:"flex",flexDirection:"column",gap:6}}>{users.map(u=>(<div key={u.id}style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",background:T.card,borderRadius:8,border:`1px solid ${T.border}`}}><Avatar user={u.id}users={users}size={24}/><span style={{flex:1,fontSize:13,fontWeight:600,color:T.text}}>{u.name}</span><span style={{fontSize:11,color:T.textMuted}}>{u.email||"—"}</span><span style={{fontSize:10,color:u.color}}>{u.role||"editor"}</span><button type="button"onClick={()=>setModal({kind:"user",edit:u})}style={{padding:"4px 10px",borderRadius:6,fontSize:10,border:"none",background:T.accentGlow,color:T.accent,cursor:"pointer"}}>Editar</button><button type="button"onClick={()=>deleteUser(u.id)}style={{padding:"4px 10px",borderRadius:6,fontSize:10,border:"none",background:"rgba(255,87,87,0.2)",color:T.red,cursor:"pointer"}}>Excluir</button></div>))}</div><button type="button"onClick={()=>setModal({kind:"user",edit:null})}style={{padding:"8px 14px",borderRadius:8,fontSize:12,fontWeight:600,border:`1px dashed ${T.border}`,background:"transparent",color:T.accent,cursor:"pointer",marginTop:6}}>+ Usuário</button></>)}
    {section("Campos do card (criar/editar)",<div style={{display:"flex",flexDirection:"column",gap:10}}>{CARD_FORM_FIELDS.map(({id,label})=><div key={id}style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",background:T.card,borderRadius:10,border:`1px solid ${T.border}`}}><span style={{fontSize:13,fontWeight:600,color:T.text}}>{label}</span><button type="button"onClick={()=>toggle(id)}style={{padding:"4px 12px",borderRadius:6,fontSize:11,fontWeight:600,border:"none",cursor:"pointer",fontFamily:T.font,background:cardFormFieldIds.includes(id)?T.accent:"rgba(255,255,255,0.08)",color:cardFormFieldIds.includes(id)?T.accentText:T.textMuted}}>{cardFormFieldIds.includes(id)?"Visível":"Oculto"}</button></div>)}</div>)}
    {section("Contador de posts prontos",<><p style={{fontSize:12,color:T.textMuted,marginBottom:10}}>O footer da home mostra &quot;X posts prontos&quot;. Marque as colunas que contam como pronto:</p><div style={{display:"flex",flexWrap:"wrap",gap:8}}>{columns.map(c=><label key={c.id}style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",fontSize:13,color:T.text}}><input type="checkbox"checked={readyColumnIds.includes(c.id)}onChange={()=>toggleReady(c.id)}style={{accentColor:T.accent}}/><span>{c.icon} {c.label}</span></label>)}</div></>)}
    {section("Central de avisos",<><p style={{fontSize:12,color:T.textMuted,marginBottom:10}}>Configure quando o sistema deve alertar.</p><div style={{display:"flex",flexDirection:"column",gap:12}}><label style={{display:"flex",alignItems:"center",flexWrap:"wrap",gap:8}}><input type="checkbox"checked={!!alertConfig.scheduledEnabled}onChange={e=>setAlert("scheduledEnabled",e.target.checked)}style={{accentColor:T.accent}}/><span style={{fontSize:13,color:T.text}}>Alerta quando post agendado passou da data e não foi publicado</span><input type="number"min={0}value={alertConfig.scheduledDaysAfter??1}onChange={e=>setAlert("scheduledDaysAfter",parseInt(e.target.value,10)||0)}style={{width:48,background:T.card,border:`1px solid ${T.border}`,borderRadius:6,padding:"4px 8px",color:T.text,fontSize:12}}/>dias após a data</label><label style={{display:"flex",alignItems:"center",flexWrap:"wrap",gap:8}}><input type="checkbox"checked={!!alertConfig.draftEnabled}onChange={e=>setAlert("draftEnabled",e.target.checked)}style={{accentColor:T.accent}}/><span style={{fontSize:13,color:T.text}}>Alerta quando rascunho está parado há</span><input type="number"min={0}value={alertConfig.draftDaysStale??7}onChange={e=>setAlert("draftDaysStale",parseInt(e.target.value,10)||0)}style={{width:48,background:T.card,border:`1px solid ${T.border}`,borderRadius:6,padding:"4px 8px",color:T.text,fontSize:12}}/>dias</label><label style={{display:"flex",alignItems:"center",flexWrap:"wrap",gap:8}}><span style={{fontSize:13,color:T.text}}>Lembrete de datas especiais com</span><input type="number"min={0}value={alertConfig.specialDatesDaysBefore??12}onChange={e=>setAlert("specialDatesDaysBefore",parseInt(e.target.value,10)||0)}style={{width:48,background:T.card,border:`1px solid ${T.border}`,borderRadius:6,padding:"4px 8px",color:T.text,fontSize:12}}/>dias de antecedência</label></div></>)}
    {section("Datas especiais",<><p style={{fontSize:12,color:T.textMuted,marginBottom:10}}>O sistema lembra com antecedência (dias configurados acima).</p><div style={{display:"flex",flexDirection:"column",gap:6}}>{(cms.specialDates||[]).map(sd=>(<div key={sd.id}style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",background:T.card,borderRadius:8,border:`1px solid ${T.border}`}}><span style={{fontSize:13,fontWeight:600,color:T.text}}>{sd.name}</span><span style={{fontSize:11,color:T.textMuted}}>{sd.date?new Date(sd.date).toLocaleDateString("pt-BR"):""}</span><button type="button"onClick={()=>setModal({kind:"specialDate",edit:sd})}style={{padding:"4px 10px",borderRadius:6,fontSize:10,border:"none",background:T.accentGlow,color:T.accent,cursor:"pointer"}}>Editar</button><button type="button"onClick={()=>deleteSpecialDate(sd.id)}style={{padding:"4px 10px",borderRadius:6,fontSize:10,border:"none",background:"rgba(255,87,87,0.2)",color:T.red,cursor:"pointer"}}>Excluir</button></div>))}</div><button type="button"onClick={()=>setModal({kind:"specialDate",edit:null})}style={{padding:"8px 14px",borderRadius:8,fontSize:12,fontWeight:600,border:`1px dashed ${T.border}`,background:"transparent",color:T.accent,cursor:"pointer",marginTop:6}}>+ Data especial</button></>)}
    {section("Importar métricas (CSV)",<><p style={{fontSize:12,color:T.textMuted,marginBottom:10}}>Cabeçalho: post_id ou title, likes, comments, saves, shares, reach. Separador vírgula ou ponto-e-vírgula.</p><input ref={csvRef}type="file"accept=".csv"style={{display:"none"}}onChange={onCsvFile}/><button type="button"onClick={()=>csvRef.current?.click()}style={{padding:"8px 14px",borderRadius:8,fontSize:12,fontWeight:600,border:`1px solid ${T.accentBorder}`,background:T.accentGlow,color:T.accent,cursor:"pointer"}}>Enviar CSV</button></>)}
    {section("IA (Gemini)",<><p style={{fontSize:12,color:T.textMuted,marginBottom:10}}>As chamadas à IA usam a rota <code style={{fontSize:11,background:T.card,padding:"2px 6px",borderRadius:4}}>/api/gemini</code>. Configure a variável de ambiente <strong>GEMINI_API_KEY</strong> no servidor (ex.: Vercel) para que a chave não fique no navegador.</p></>)}
    {modal&&<CMSModal modal={modal}onClose={()=>setModal(null)}onSaveColumn={addOrUpdateColumn}onSavePostType={addOrUpdatePostType}onSavePillar={addOrUpdatePillar}onSaveUser={addOrUpdateUser}onSaveSpecialDate={addOrUpdateSpecialDate}/>}
  </div>}
function CMSModal({modal,onClose,onSaveColumn,onSavePostType,onSavePillar,onSaveUser,onSaveSpecialDate}){
  const[form,setForm]=useState(modal.edit||{});
  useEffect(()=>{setForm(modal.edit||{})},[modal]);
  const update=(k,v)=>setForm(prev=>({...prev,[k]:v}));
  const save=()=>{if(modal.kind==="column")onSaveColumn({id:form.id,label:form.label,icon:form.icon||"📌",color:form.color||T.accent,desc:form.desc});else if(modal.kind==="postType")onSavePostType({id:form.id,label:form.label,icon:form.icon||"📄",color:form.color||T.accent});else if(modal.kind==="pillar")onSavePillar({id:form.id,label:form.label,color:form.color||T.accent});else if(modal.kind==="user")onSaveUser({id:form.id,name:form.name,email:form.email||"",role:form.role||"editor",avatar:form.avatar,color:form.color||T.accent});else if(modal.kind==="specialDate")onSaveSpecialDate({id:form.id,name:form.name,date:form.date});else onClose()};
  const isCol=modal.kind==="column";const isPT=modal.kind==="postType";const isPillar=modal.kind==="pillar";const isUser=modal.kind==="user";const isSD=modal.kind==="specialDate";
  return<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(4px)"}}onClick={e=>{if(e.target===e.currentTarget)onClose()}}><div style={{background:T.surface,borderRadius:14,border:`1px solid ${T.border}`,padding:24,minWidth:320,maxWidth:400,animation:"scaleIn 0.2s",boxShadow:"0 20px 50px rgba(0,0,0,0.15)"}}onClick={e=>e.stopPropagation()}>
    <h3 style={{fontSize:16,fontWeight:800,color:T.text,margin:"0 0 16px"}}>{isCol?"Etapa" :isPT?"Tipo" :isPillar?"Pilar" :isUser?"Usuário" :isSD?"Data especial" :""}</h3>
    {(isCol||isPT)&&<><label style={{display:"block",fontSize:11,color:T.textMuted,marginBottom:4}}>ID (slug)</label><input value={form.id||""}onChange={e=>update("id",e.target.value)}style={{width:"100%",background:T.card,border:`1px solid ${T.border}`,borderRadius:6,padding:"6px 10px",color:T.text,fontSize:12,marginBottom:10}}placeholder="ex: agendado"/><label style={{display:"block",fontSize:11,color:T.textMuted,marginBottom:4}}>Label</label><input value={form.label||""}onChange={e=>update("label",e.target.value)}style={{width:"100%",background:T.card,border:`1px solid ${T.border}`,borderRadius:6,padding:"6px 10px",color:T.text,fontSize:12,marginBottom:10}}/><label style={{display:"block",fontSize:11,color:T.textMuted,marginBottom:4}}>Ícone (emoji)</label><input value={form.icon||""}onChange={e=>update("icon",e.target.value)}style={{width:"100%",background:T.card,border:`1px solid ${T.border}`,borderRadius:6,padding:"6px 10px",color:T.text,fontSize:12,marginBottom:10}}placeholder="📅"/><label style={{display:"block",fontSize:11,color:T.textMuted,marginBottom:4}}>Cor</label><input type="color"value={form.color||T.accent}onChange={e=>update("color",e.target.value)}style={{width:"100%",height:36,borderRadius:6,border:`1px solid ${T.border}`,padding:2,marginBottom:10}}/></>}
    {isPillar&&<><label style={{display:"block",fontSize:11,color:T.textMuted,marginBottom:4}}>ID</label><input value={form.id||""}onChange={e=>update("id",e.target.value)}style={{width:"100%",background:T.card,border:`1px solid ${T.border}`,borderRadius:6,padding:"6px 10px",color:T.text,fontSize:12,marginBottom:10}}/><label style={{display:"block",fontSize:11,color:T.textMuted,marginBottom:4}}>Label</label><input value={form.label||""}onChange={e=>update("label",e.target.value)}style={{width:"100%",background:T.card,border:`1px solid ${T.border}`,borderRadius:6,padding:"6px 10px",color:T.text,fontSize:12,marginBottom:10}}/><label style={{display:"block",fontSize:11,color:T.textMuted,marginBottom:4}}>Cor</label><input type="color"value={form.color||T.accent}onChange={e=>update("color",e.target.value)}style={{width:"100%",height:36,borderRadius:6,border:`1px solid ${T.border}`,padding:2,marginBottom:10}}/></>}
    {isUser&&<><label style={{display:"block",fontSize:11,color:T.textMuted,marginBottom:4}}>Nome</label><input value={form.name||""}onChange={e=>update("name",e.target.value)}style={{width:"100%",background:T.card,border:`1px solid ${T.border}`,borderRadius:6,padding:"6px 10px",color:T.text,fontSize:12,marginBottom:10}}/><label style={{display:"block",fontSize:11,color:T.textMuted,marginBottom:4}}>Email (opcional)</label><input type="email"value={form.email||""}onChange={e=>update("email",e.target.value)}style={{width:"100%",background:T.card,border:`1px solid ${T.border}`,borderRadius:6,padding:"6px 10px",color:T.text,fontSize:12,marginBottom:10}}/><label style={{display:"block",fontSize:11,color:T.textMuted,marginBottom:4}}>Role</label><select value={form.role||"editor"}onChange={e=>update("role",e.target.value)}style={{width:"100%",background:T.card,border:`1px solid ${T.border}`,borderRadius:6,padding:"6px 10px",color:T.text,fontSize:12,marginBottom:10}}><option value="owner">Dono</option><option value="editor">Editor</option></select><label style={{display:"block",fontSize:11,color:T.textMuted,marginBottom:4}}>Inicial (avatar)</label><input value={form.avatar||""}onChange={e=>update("avatar",e.target.value)}style={{width:48,background:T.card,border:`1px solid ${T.border}`,borderRadius:6,padding:"6px 10px",color:T.text,fontSize:12,marginBottom:10}}placeholder="R"/><label style={{display:"block",fontSize:11,color:T.textMuted,marginBottom:4}}>Cor</label><input type="color"value={form.color||T.accent}onChange={e=>update("color",e.target.value)}style={{width:"100%",height:36,borderRadius:6,border:`1px solid ${T.border}`,padding:2,marginBottom:10}}/></>}
    {isSD&&<><label style={{display:"block",fontSize:11,color:T.textMuted,marginBottom:4}}>Nome</label><input value={form.name||""}onChange={e=>update("name",e.target.value)}style={{width:"100%",background:T.card,border:`1px solid ${T.border}`,borderRadius:6,padding:"6px 10px",color:T.text,fontSize:12,marginBottom:10}}placeholder="Dia dos Namorados"/><label style={{display:"block",fontSize:11,color:T.textMuted,marginBottom:4}}>Data</label><input type="date"value={form.date||""}onChange={e=>update("date",e.target.value)}style={{width:"100%",background:T.card,border:`1px solid ${T.border}`,borderRadius:6,padding:"6px 10px",color:T.text,fontSize:12,marginBottom:10}}/></>}
    <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:16}}><button type="button"onClick={onClose}style={{padding:"8px 14px",borderRadius:8,fontSize:12,border:`1px solid ${T.border}`,background:"transparent",color:T.textMuted,cursor:"pointer"}}>Cancelar</button><button type="button"onClick={save}style={{padding:"8px 14px",borderRadius:8,fontSize:12,fontWeight:600,border:"none",background:T.accent,color:T.accentText,cursor:"pointer"}}>Salvar</button></div>
  </div></div>}

// ============================================================================
// MAIN APP
// ============================================================================
export default function App(){
  const[theme,setTheme]=useState(()=>{try{return typeof localStorage!=="undefined"?localStorage.getItem(THEME_STORAGE_KEY)||"dark":"dark"}catch(e){return"dark"}});
  setThemeTokens(theme);
  useEffect(()=>{try{typeof localStorage!=="undefined"&&localStorage.setItem(THEME_STORAGE_KEY,theme)}catch(e){}},[theme]);
  const[cms,setCms]=useState(loadCms);
  const[syncLoading,setSyncLoading]=useState(!!isSupabaseConfigured());
  const[syncError,setSyncError]=useState(null);
  const[saveError,setSaveError]=useState(()=>{try{return typeof localStorage!=="undefined"?localStorage.getItem("pilatespost_last_save_error"):null}catch(e){return null}});

  useEffect(()=>{
    if(!isSupabaseConfigured()){ setSyncLoading(false); return; }
    let cancelled=false;
    setSyncError(null);
    Promise.all([fetchCms(),fetchPosts()])
      .then(([cmsData,postsData])=>{
        if(cancelled)return;
        if(cmsData&&typeof cmsData==="object"&&(cmsData.columns?.length>0||cmsData.postTypes?.length>0||cmsData.pillars?.length>0||cmsData.users?.length>0))setCms(prev=>({...defaultCms(),...prev,...cmsData,columns:cmsData.columns?.length?cmsData.columns:prev.columns,postTypes:cmsData.postTypes?.length?cmsData.postTypes:prev.postTypes,pillars:cmsData.pillars?.length?cmsData.pillars:prev.pillars,users:cmsData.users?.length?cmsData.users:prev.users}));
        if(isSupabaseConfigured())setPosts(Array.isArray(postsData)?postsData:[]);
      })
      .catch(err=>{ if(!cancelled)setSyncError(err?.message||"Falha ao carregar dados"); })
      .finally(()=>{ if(!cancelled)setSyncLoading(false); });
    return ()=>{ cancelled=true; };
  },[]);

  useEffect(()=>{saveCms(cms);if(isSupabaseConfigured())saveCmsCloud(cms).catch(err=>setSaveError(err?.message||"Erro ao salvar CMS"))},[cms]);
  const[posts,setPosts]=useState([]);
  const postsHydratedRef=useRef(false);
  const skipFirstLocalPersistRef=useRef(true);
  const[realtimeConnected,setRealtimeConnected]=useState(false);
  useEffect(()=>{
    if(!isSupabaseConfigured()){
      const loaded=loadPosts();
      setPosts(prev=>{
        const prevLen=Array.isArray(prev)?prev.length:0;
        const loadedLen=Array.isArray(loaded)?loaded.length:0;
        const applied=prevLen===0;
        // #region agent log
        fetch('http://127.0.0.1:7294/ingest/5b75fc16-6a12-4d36-ad74-8d75554109c6',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'448216'},body:JSON.stringify({sessionId:'448216',runId:'pre-fix',hypothesisId:'H_local_race',location:'PilatesPost.jsx:postsHydrate',message:'hydrate local posts',data:{prevLen,loadedLen,applied},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        return applied?loaded:prev;
      });
      postsHydratedRef.current=true;
    }
  },[]);
  useEffect(()=>{
    if(!isSupabaseConfigured()&&postsHydratedRef.current){
      const len=Array.isArray(posts)?posts.length:0;
      if(skipFirstLocalPersistRef.current&&len===0){
        skipFirstLocalPersistRef.current=false;
        // #region agent log
        fetch('http://127.0.0.1:7294/ingest/5b75fc16-6a12-4d36-ad74-8d75554109c6',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'448216'},body:JSON.stringify({sessionId:'448216',runId:'pre-fix',hypothesisId:'H_local_wipe',location:'PilatesPost.jsx:savePostsEffect',message:'skip initial empty persist',data:{len},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        return;
      }
      skipFirstLocalPersistRef.current=false;
      savePosts(posts);
    }
  },[posts]);
  useEffect(()=>{
    if(typeof document==="undefined")return;
    // #region agent log
    try{
      const styles=Array.from(document.querySelectorAll("style"));
      const links=Array.from(document.querySelectorAll("link"));
      const hasMinified=styles.some(s=>String(s.textContent||"").includes("slideRight{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:translateX(0)}}"));
      const fontsStyle=styles.find(s=>String(s.textContent||"").includes("fonts.googleapis.com"));
      const fontsStyleText=String(fontsStyle?.textContent||"");
      const fontsStyleHasEntities=fontsStyleText.includes("&amp;")||fontsStyleText.includes("&#x27;");
      const headLinkFonts=links.some(l=>String(l.getAttribute("href")||"").includes("fonts.googleapis.com"));
      fetch('http://127.0.0.1:7294/ingest/5b75fc16-6a12-4d36-ad74-8d75554109c6',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'448216'},body:JSON.stringify({sessionId:'448216',runId:'post-fix',hypothesisId:'H_hydration_style',location:'PilatesPost.jsx:styleScan',message:'scan style/link tags',data:{styleCount:styles.length,hasMinified,fontsStylePresent:!!fontsStyle,fontsStyleHasEntities,headLinkFonts},timestamp:Date.now()})}).catch(()=>{});
    }catch(e){}
    // #endregion
  },[]);
  useEffect(()=>{
    if(!isSupabaseConfigured()||syncLoading) return;
    const unsub=subscribeToPosts(setPosts, setRealtimeConnected);
    return ()=>{ setRealtimeConnected(false); unsub(); };
  },[syncLoading]);
  const[view,setView]=useState("board");
  const users=cms.users?.length?cms.users:USERS;const columns=cms.columns?.length?cms.columns:COLUMNS;const postTypes=cms.postTypes?.length?cms.postTypes:POST_TYPES;const pillars=cms.pillars?.length?cms.pillars:PILLARS;
  const[user,setUser]=useState(()=>{const L=loadCms();return L.users?.length?L.users[0]:USERS[0]});
  useEffect(()=>{if(users.length&&!users.some(u=>u.id===user.id))setUser(users[0])},[users.map(u=>u.id).join(",")]);
  const[editPost,setEditPost]=useState(null);const[dp,setDp]=useState(null);const[showAI,setShowAI]=useState(false);const[showImportIdeas,setShowImportIdeas]=useState(false);const[filter,setFilter]=useState({type:null});const[search,setSearch]=useState("");
  const cardFormFieldIds=cms.cardFormFieldIds??CARD_FORM_FIELDS.map(f=>f.id);const setCardFormFieldIds=useCallback(ids=>setCms(prev=>({...prev,cardFormFieldIds:ids})),[]);
  const[lastSaveStatus,setLastSaveStatus]=useState(null);
  const save=useCallback(p=>{
    // #region agent log
    const _d={postId:p?.id,column:p?.column,isSupabase:!!isSupabaseConfigured()};
    fetch('http://127.0.0.1:7294/ingest/5b75fc16-6a12-4d36-ad74-8d75554109c6',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'448216'},body:JSON.stringify({sessionId:'448216',location:'PilatesPost.jsx:save',message:'save() called',data:_d,timestamp:Date.now(),hypothesisId:'H1_H2'})}).catch(()=>{});
    // #endregion
    setSaveError(null);
    if(!isSupabaseConfigured()) postsHydratedRef.current=true;
    setPosts(prev=>prev.find(x=>x.id===p.id)?prev.map(x=>x.id===p.id?p:x):[...prev,p]);
    if(isSupabaseConfigured()){ setLastSaveStatus("enviando"); savePost(p).then(()=>{ setLastSaveStatus("ok"); try{localStorage.removeItem("pilatespost_last_save_error")}catch(e){} setTimeout(()=>setLastSaveStatus(null),2500); }).catch(err=>{ const msg=err?.message||"Erro ao salvar"; setSaveError(msg); setLastSaveStatus("erro"); try{localStorage.setItem("pilatespost_last_save_error",msg)}catch(e){} }); } else setLastSaveStatus(null);
  },[]);
  const del=useCallback(id=>{
    setSaveError(null);
    setPosts(prev=>prev.filter(x=>x.id!==id));
    if(isSupabaseConfigured())deletePost(id).catch(err=>setSaveError(err?.message||"Erro ao excluir"));
  },[]);
  const drop=useCallback(colId=>{
    if(dp&&dp.column!==colId){
      setSaveError(null);
      const updated={...dp,column:colId};
      setPosts(prev=>prev.map(p=>p.id===dp.id?updated:p));
      if(isSupabaseConfigured())savePost(updated).catch(err=>setSaveError(err?.message||"Erro ao mover"));
    }
    setDp(null);
  },[dp]);
  const newP=useCallback(colId=>{setEditPost({id:genId(),column:colId,type:"reel",title:"",caption:"",tags:[],assignee:user.id,createdBy:user.id,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),scheduledDate:null,scheduledTime:null,engagement:null,notes:"",links:[],attachments:[],aiScore:null,aiSuggestion:null})},[user.id]);
  const filtered=useMemo(()=>posts.filter(p=>{if(search&&!p.title.toLowerCase().includes(search.toLowerCase())&&!p.caption.toLowerCase().includes(search.toLowerCase()))return false;if(filter.type&&p.type!==filter.type)return false;return true}),[posts,filter,search]);
  const readyColumnIds=cms.readyColumnIds??["agendado"];const readyCount=useMemo(()=>posts.filter(p=>readyColumnIds.includes(p.column)).length,[posts,readyColumnIds]);
  const navs=[{id:"board",l:"Board",i:"◻"},{id:"calendar",l:"Calendário",i:"◫"},{id:"cms",l:"CMS",i:"📋"}];
  return<div data-theme={theme}style={{minHeight:"100vh",background:T.bg,fontFamily:T.font,color:T.text}}>
    {(syncError||saveError)&&<div style={{padding:"6px 16px",background:(syncError?T.red:T.yellow)+"22",color:syncError?T.red:T.yellow,fontSize:11,display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}} role="alert"><span>{syncError||saveError}</span><button type="button"aria-label="Fechar mensagem"onClick={()=>{setSyncError(null);setSaveError(null);try{localStorage.removeItem("pilatespost_last_save_error")}catch(e){}}}style={{background:"transparent",border:"none",color:"inherit",cursor:"pointer",fontSize:14}}>✕</button></div>}
    {syncLoading&&<div style={{height:3,background:T.border,overflow:"hidden"}} aria-hidden="true"><div style={{height:"100%",width:"30%",background:T.accent,animation:"pulse 1.5s ease-in-out infinite"}}/></div>}
    <header style={{height:48,padding:"0 16px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${T.border}`,background:T.surface,backdropFilter:"blur(12px)",position:"sticky",top:0,zIndex:100,boxShadow:"0 1px 0 0 "+T.border}}>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:28,height:28,borderRadius:8,background:`linear-gradient(135deg,${T.accent},${T.yellow})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:900,color:T.logoText||"#FFF",fontFamily:T.mono}}>C</div><span style={{fontSize:14,fontWeight:800,background:`linear-gradient(135deg,${T.accent},${T.yellow})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>CORATERIA</span></div>
        <div style={{width:1,height:18,background:T.border,opacity:0.8}}/>
        <div style={{display:"flex",gap:2,background:T.card,borderRadius:8,padding:3}} role="tablist">{navs.map(v=><button key={v.id}type="button"role="tab"aria-selected={view===v.id}aria-label={`Ver ${v.l}`}onClick={()=>setView(v.id)}style={{padding:"5px 12px",borderRadius:6,fontSize:11,fontWeight:600,border:"none",cursor:"pointer",fontFamily:T.font,background:view===v.id?T.accentGlow:"transparent",color:view===v.id?T.accent:T.textMuted,transition:"all 0.15s"}}>{v.i} {v.l}</button>)}</div>
        <button onClick={()=>setShowImportIdeas(true)}style={{padding:"5px 12px",borderRadius:6,fontSize:11,fontWeight:600,border:`1px solid ${T.accentBorder}`,background:"transparent",color:T.accent,cursor:"pointer",fontFamily:T.font}}>Importar ideias</button>
      </div>
      <div style={{flex:1,maxWidth:240,margin:"0 16px"}}><input value={search}onChange={e=>setSearch(e.target.value)}placeholder="Buscar..."style={{width:"100%",background:T.card,border:`1px solid ${T.border}`,borderRadius:8,padding:"6px 12px",color:T.text,fontSize:11.5,fontFamily:T.font,outline:"none"}}onFocus={e=>e.target.style.borderColor=T.accentBorder}onBlur={e=>e.target.style.borderColor=T.border}/></div>
      <div style={{display:"flex",alignItems:"center",gap:6}}>{isSupabaseConfigured()&&realtimeConnected&&<span title="Sync em tempo real ativo" style={{display:"flex",alignItems:"center",gap:5,padding:"4px 8px",borderRadius:6,background:"#22c55e18",color:"#22c55e",fontSize:10,fontWeight:600}}><span style={{width:6,height:6,borderRadius:"50%",background:"#22c55e",boxShadow:"0 0 0 2px #22c55e40"}} aria-hidden="true"/><span>Ao vivo</span></span>}<div style={{display:"flex",gap:2}}>{postTypes.map(pt=><IconBtn key={pt.id}small active={filter.type===pt.id}onClick={()=>setFilter(f=>({type:f.type===pt.id?null:pt.id}))}>{pt.icon}</IconBtn>)}</div><div style={{width:1,height:16,background:T.border,opacity:0.8}}/><button type="button"aria-label={theme==="light"?"Modo escuro":"Modo claro"}title={theme==="light"?"Modo escuro":"Modo claro"}onClick={()=>setTheme(t=>t==="light"?"dark":"light")}style={{width:30,height:30,borderRadius:6,border:`1px solid ${T.border}`,background:"transparent",color:T.textMuted,cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center"}}>{theme==="light"?"🌙":"☀️"}</button><button type="button"aria-label="Notificações"title="Notificações"style={{width:30,height:30,borderRadius:6,border:`1px solid ${T.border}`,background:"transparent",color:T.textMuted,cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center"}}>🔔</button><div style={{display:"flex",gap:2,background:T.card,borderRadius:6,padding:2}}>{users.map(u=><button key={u.id}onClick={()=>setUser(u)}style={{display:"flex",alignItems:"center",gap:3,padding:"3px 8px",borderRadius:4,fontSize:10.5,fontWeight:600,border:user.id===u.id?`1px solid ${u.color}50`:"1px solid transparent",background:user.id===u.id?`${u.color}12`:"transparent",color:user.id===u.id?u.color:T.textMuted,cursor:"pointer",fontFamily:T.font}}><Avatar user={u.id}users={users}size={14}/>{u.name}</button>)}</div></div>
    </header>
    <main>{view==="board"&&<div style={{display:"flex",gap:14,padding:"16px 20px",overflowX:"auto",minHeight:"calc(100vh - 96px)",alignItems:"flex-start"}}>{columns.map(c=><KanbanCol key={c.id}col={c}posts={filtered.filter(p=>p.column===c.id)}onEdit={setEditPost}onDragStart={setDp}onDrop={drop}dp={dp}onNew={newP}users={users}postTypes={postTypes}pillars={pillars}/>)}</div>}{view==="calendar"&&<CalView posts={posts}onEdit={setEditPost}onNewCard={()=>newP("agendado")}postTypes={postTypes}specialDates={cms.specialDates}/>}{view==="cms"&&<CMSView cms={cms}setCms={setCms}columns={columns}postTypes={postTypes}pillars={pillars}users={users}cardFormFieldIds={cardFormFieldIds}setCardFormFieldIds={setCardFormFieldIds}setPosts={setPosts}/>}</main>
    {editPost&&<PostEditor post={editPost}onSave={p=>{save(p);setEditPost(null)}}onClose={()=>setEditPost(null)}onDelete={id=>{del(id);setEditPost(null)}}visibleFields={cardFormFieldIds}columns={columns}postTypes={postTypes}pillars={pillars}users={users}/>}
    {showAI&&<AIMentor onClose={()=>setShowAI(false)}/>}
    {showImportIdeas&&<ImportIdeasModal onClose={()=>setShowImportIdeas(false)} setPosts={setPosts} user={user} savePostToBackend={isSupabaseConfigured()?savePost:null}/>}
    <div style={{position:"fixed",bottom:0,left:0,right:0,height:24,background:T.surface,backdropFilter:"blur(10px)",borderTop:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"center",gap:12,fontSize:9,color:T.textDim,zIndex:90}}>
      <span>{posts.length} posts</span><span title="Prontos agora">✓ {readyCount} prontos</span><span>💡{posts.filter(p=>p.column==="ideias_rascunhos").length}</span><span>✍️{posts.filter(p=>p.column==="prod").length}</span><span>📅{posts.filter(p=>p.column==="agendado").length}</span><span>🚀{posts.filter(p=>p.column==="publicado").length}</span><span style={{color:T.border}}>|</span>{lastSaveStatus==="enviando"&&<span style={{color:T.accent}}>Salvando…</span>}{lastSaveStatus==="ok"&&<span style={{color:"#22c55e"}}>Salvo</span>}{lastSaveStatus==="erro"&&<span style={{color:T.red}}>Erro ao salvar (veja acima)</span>}{!isSupabaseConfigured()&&<span title="Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY para salvar na nuvem" style={{color:T.yellow}}>Salvamento local</span>}<span style={{color:T.border}}>|</span><span><span style={{color:user.color,fontWeight:700}}>{user.name}</span> {user.role==="owner"?"👑":"✏️"}</span>
    </div>
  </div>}
