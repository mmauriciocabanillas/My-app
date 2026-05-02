import { useState, useEffect, useRef } from "react"

// ─── TOKENS ───────────────────────────────────────────────────────────────────
const C = {
  bg:'#080808', surf:'#111111', surf2:'#181818',
  bor:'rgba(255,255,255,0.07)', bor2:'rgba(255,255,255,0.12)',
  txt:'#F5F5F5', mut:'rgba(255,255,255,0.38)', hint:'rgba(255,255,255,0.18)',
  grn:'#2DD48A', blu:'#5B9CF6', amb:'#F5A623', red:'#F06D6D', pur:'#9F7AEA',
}

// ─── STORAGE ──────────────────────────────────────────────────────────────────
const S = {
  get: k => { try { const v=localStorage.getItem(k); return v?JSON.parse(v):null } catch { return null } },
  set: (k,v) => { try { localStorage.setItem(k,JSON.stringify(v)) } catch {} },
}

// ─── SEMANA ───────────────────────────────────────────────────────────────────
const DKS    = ['lun','mar','mie','jue','vie','sab','dom']
const DNAMES = { lun:'Lunes',mar:'Martes',mie:'Miércoles',jue:'Jueves',vie:'Viernes',sab:'Sábado',dom:'Domingo' }
const gdk    = (d=new Date()) => DKS[(d.getDay()+6)%7]
const ldk    = (d=new Date()) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
const pt     = s => { if(!s)return 0; const[h,m]=s.split(':').map(Number); return h*60+(m||0) }
const fmt12  = t => { if(!t)return''; const[h,m]=t.split(':').map(Number); return`${h%12||12}:${String(m).padStart(2,'0')} ${h>=12?'PM':'AM'}` }
const uid    = () => Math.random().toString(36).slice(2,9)
const bpct   = (b,nowM) => { const s=pt(b.s),e=pt(b.e); if(nowM<s||nowM>=e)return 0; return Math.min(100,Math.round(((nowM-s)/(e-s))*100)) }
const dayKeyForDK = (dk,ref=new Date()) => { const d=new Date(ref),ci=(d.getDay()+6)%7,ti=DKS.indexOf(dk); d.setDate(d.getDate()+(ti-ci)); return ldk(d) }
const pcolor = p => { if(!p)return C.mut; const l=p.toLowerCase(); if(l.includes('urgen')||l.includes('alta'))return C.red; if(l.includes('media'))return C.amb; return C.grn }
const scol   = s => { if(!s)return C.mut; const l=s.toLowerCase(); if(l.includes('complet')||l.includes('realiz')||l.includes('acabada'))return C.grn; if(l.includes('progres')||l.includes('curso'))return C.blu; if(l.includes('agenda')||l.includes('revision'))return C.amb; return C.mut }

// ─── HORARIO ──────────────────────────────────────────────────────────────────
const SCHED_DEFAULT = {
  lun:[{id:'lun1',s:'14:00',e:'18:00',t:'uni',a:'Base de Datos'},{id:'lun2',s:'18:00',e:'21:30',t:'gym',a:'Gym — Piernas'}],
  mar:[{id:'mar1',s:'09:00',e:'13:00',t:'uni',a:'Ingeniería de Software'},{id:'mar2',s:'18:00',e:'21:30',t:'gym',a:'Gym — Empuje'}],
  mie:[{id:'mie1',s:'07:00',e:'11:00',t:'uni',a:'Técnicas Digitales'},{id:'mie2',s:'14:00',e:'16:00',t:'uni',a:'Base de Datos'},{id:'mie3',s:'16:00',e:'18:00',t:'uni',a:'Inteligencia Artificial'},{id:'mie4',s:'18:00',e:'20:00',t:'uni',a:'Metodología Inv. Científica'}],
  jue:[{id:'jue1',s:'11:00',e:'13:00',t:'uni',a:'Ingeniería de Software'},{id:'jue2',s:'18:00',e:'21:30',t:'gym',a:'Gym — Tracción'}],
  vie:[{id:'vie1',s:'08:00',e:'10:00',t:'uni',a:'Inteligencia Artificial'},{id:'vie2',s:'18:00',e:'21:30',t:'gym',a:'Gym — Brazos/Hombros'}],
  sab:[],dom:[],
}
const BCOL  = {uni:C.blu,gym:C.pur,personal:C.amb}
const BLBL  = {uni:'Universidad',gym:'Gym',personal:'Personal'}
const BTYPES= [{val:'uni',label:'Universidad',color:C.blu},{val:'gym',label:'Gym',color:C.pur},{val:'personal',label:'Personal',color:C.amb}]

// ─── HÁBITOS & METAS ──────────────────────────────────────────────────────────
const HABITS_DEFAULT = [
  {id:'gym',label:'Gym'},{id:'agua',label:'Agua 2L'},
  {id:'desayuno',label:'Desayuno'},{id:'almuerzo',label:'Almuerzo'},
  {id:'cena',label:'Cena'},{id:'vendify',label:'Vendify'},{id:'sueno',label:'Sueño +7h'},
]
const GOALS0 = [
  {id:'peso', cat:'Gym',        label:'Peso corporal', unit:'kg', current:67, target:75,  start:67, color:C.pur},
  {id:'f1',   cat:'Vendify',    label:'F1 Discovery',  unit:'%',  current:0,  target:100, start:0,  color:C.grn},
  {id:'ciclo',cat:'Universidad',label:'Aprobar ciclo', unit:'%',  current:0,  target:100, start:0,  color:C.blu},
]
const CAT_COLORS = {Gym:C.pur,Vendify:C.grn,Universidad:C.blu,Personal:C.amb}

// ─── CI PHASES ────────────────────────────────────────────────────────────────
const CI_CYCLE_IDS = ['C1','C2','C3']
const CI_CYCLE_PHASES = {
  C1: [{slug:'f0',label:'Fase 0'},{slug:'f1',label:'Fase 1'},{slug:'f2',label:'Fase 2'},{slug:'f3',label:'Fase 3'},{slug:'f5',label:'Fase 5'},{slug:'f6',label:'Fase 6'},{slug:'f7',label:'Fase 7'},{slug:'f8',label:'Fase 8'}],
  C2: [{slug:'f9',label:'Fase 9'},{slug:'f10',label:'Fase 10'},{slug:'f11',label:'Fase 11'},{slug:'f12',label:'Fase 12'},{slug:'f13',label:'Fase 13'}],
  C3: [{slug:'f14',label:'Fase 14'},{slug:'f15',label:'Fase 15'},{slug:'f16',label:'Fase 16'},{slug:'f17',label:'Fase 17'},{slug:'f18',label:'Fase 18'}],
}
const phaseKey = (cycle,slug) => `${cycle.toLowerCase()}${slug}`

// ─── NOTION ───────────────────────────────────────────────────────────────────
const DB = {
  entregas:'312fa6d36749815592bef82e1b68cd97',
  tareas:  '312fa6d367498156a513c581584086f4',
  vendify: '323fa6d3674980dd97e9cd1063089d0d',
}
const notionCall   = async(endpoint,body={},method='POST') => { const r=await fetch('/api/notion',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({endpoint,body,method})}); return r.json() }
const notionQuery  = dbId       => notionCall(`databases/${dbId}/query`,{page_size:100})
const notionCreate = (dbId,props)=> notionCall('pages',{parent:{database_id:dbId},properties:props})
const notionArchive= pageId     => notionCall(`pages/${pageId}`,{archived:true},'PATCH')

const getTitle = (props,key='Nombre') => props[key]?.title?.map(t=>t.plain_text).join('')||''
const getDate  = props => { for(const k of ['Fecha','fecha']) if(props[k]?.date?.start)return props[k].date.start.slice(0,10); return null }
const getSel   = (props,key) => props[key]?.select?.name||props[key]?.status?.name||null

const parseEntregas = rs => rs.map(p=>({id:p.id,title:getTitle(p.properties,'Nombre'),date:getDate(p.properties),status:getSel(p.properties,'Estado'),tipo:getSel(p.properties,'Tipo'),source:'entregas'})).filter(t=>t.title)
const parseTareas   = (rs,src) => rs.map(p=>({id:p.id,title:getTitle(p.properties,'Nombre'),date:getDate(p.properties),status:getSel(p.properties,'Status'),priority:getSel(p.properties,'Prioridad'),source:src})).filter(t=>t.title)
const isCompleted   = t => t.source==='entregas'?t.status==='Acabada':t.status==='Completado'

// ─── DIETA ────────────────────────────────────────────────────────────────────
const MEAL_ORDER  = ['Breakfast','Snack','Lunch','Afternoon snack','Dinner']
const MEAL_ES     = {Breakfast:'Desayuno',Snack:'Media mañana',Lunch:'Almuerzo','Afternoon snack':'Snack tarde',Dinner:'Cena'}
const MEAL_COL    = {Breakfast:'#E879A0',Snack:C.amb,Lunch:C.blu,'Afternoon snack':C.pur,Dinner:C.grn}

const DIET_SEMANAL = {
  lun:[
    {type:'Breakfast',      meal:'Avena con leche, tortilla de huevo revuelto y pan integral tostado'},
    {type:'Snack',          meal:'Batido proteico con un puñado de frutos secos y 1 o 2 plátano'},
    {type:'Lunch',          meal:'Pechuga de pollo a la plancha con arroz y verduras al vapor'},
    {type:'Afternoon snack',meal:'Batido proteico y 1 o 2 plátanos'},
    {type:'Dinner',         meal:'Pescado con papa y menestra con ensalada y lonche (Café, Té, Quaker, etc.)'},
  ],
  mar:[
    {type:'Breakfast',      meal:'Un vaso de leche y huevo revuelto con un batido proteico'},
    {type:'Snack',          meal:'Yogurt natural y 1 o 2 plátanos'},
    {type:'Lunch',          meal:'Carne de res a la plancha con quinua y verduras al vapor'},
    {type:'Afternoon snack',meal:'Batido proteico y un puñado de maní'},
    {type:'Dinner',         meal:'Pollo desmenuzado con tortilla con claras de huevo y lonche (Café, Té, Quaker, etc.)'},
  ],
  mie:[
    {type:'Breakfast',      meal:'Taza de Quaker o avena con leche con huevo revuelto y rebanadas de pan integral tostado con palta'},
    {type:'Snack',          meal:'Batido proteico y un puñado de maní'},
    {type:'Lunch',          meal:'Atún blanco con arroz, puré de lenteja o lenteja sola con ensalada de zanahoria rallada y lechuga'},
    {type:'Afternoon snack',meal:'Yogurt con granola y 1 cucharada de semillas de chía'},
    {type:'Dinner',         meal:'Pescado asado con arroz con papa con ensalada de espinaca y tomate con lonche (Café, Té, Quaker, etc.)'},
  ],
  jue:[
    {type:'Breakfast',      meal:'Batido proteico y huevo revuelto'},
    {type:'Snack',          meal:'Yogurt con frutos secos o frutas y 1 fruta (manzana o pera)'},
    {type:'Lunch',          meal:'Pollo al horno con arroz con quinoa y ensalada de zanahoria, lechuga y tomate'},
    {type:'Afternoon snack',meal:'Batido proteico y 1 o 2 plátanos'},
    {type:'Dinner',         meal:'Tortilla de atún, lonche (Café, Té, Quaker, etc.) y pan integral o tostadas'},
  ],
  vie:[
    {type:'Breakfast',      meal:'Un vaso de leche y huevo revuelto con un batido proteico'},
    {type:'Snack',          meal:'Batido proteico y 2 tostadas con crema de maní'},
    {type:'Lunch',          meal:'Carne de res a la plancha con quinua y verduras al vapor'},
    {type:'Afternoon snack',meal:'Yogurt con frutas y 1 puñado de maní'},
    {type:'Dinner',         meal:'Pescado asado con arroz con papa con ensalada de espinaca y tomate con lonche (Café, Té, Quaker, etc.)'},
  ],
  sab:[
    {type:'Breakfast',      meal:'1 vaso de leche con 2 panes integrales con queso fresco y 1 o 2 plátanos'},
    {type:'Snack',          meal:'Batido proteico y un puñado de maní'},
    {type:'Lunch',          meal:'Pechuga de pollo a la plancha con arroz y verduras al vapor'},
    {type:'Afternoon snack',meal:'Yogurt con frutas y 1 puñado de maní'},
    {type:'Dinner',         meal:'Pescado asado con arroz con papa con ensalada de espinaca y tomate con lonche (Café, Té, Quaker, etc.)'},
  ],
  dom:[
    {type:'Breakfast',      meal:'Jugo de naranja con panes integrales con queso y palta, tortilla de huevo'},
    {type:'Snack',          meal:'Batido proteico y un puñado de maní'},
    {type:'Lunch',          meal:'Pechuga de pollo a la plancha con arroz y verduras al vapor'},
    {type:'Afternoon snack',meal:'Batido proteico y un puñado de maní'},
    {type:'Dinner',         meal:'Tortilla de atún con ensalada de espinaca y tomate, lonche (Café, Té, Quaker, etc.) y pan integral o tostadas'},
  ],
}

const OPCIONES_COMIDA = {
  Breakfast:[
    'Jugo de naranja con panes integrales con queso y palta, tortilla de huevo',
    'Taza de Quaker o avena con leche con huevo revuelto y rebanadas de pan integral tostado con palta',
    'Avena con leche, tortilla de huevo revuelto y pan integral tostado',
    'Batido proteico y huevo revuelto',
    'Un vaso de leche y huevo revuelto con un batido proteico',
    '1 vaso de leche con 2 panes integrales con queso fresco y 1 o 2 plátanos',
  ],
  Dinner:[
    'Tortilla de atún con ensalada de espinaca y tomate, lonche (Café, Té, Quaker, etc.) y pan integral o tostadas',
    'Pollo desmenuzado con tortilla con claras de huevo y lonche (Café, Té, Quaker, etc.)',
    'Pescado con papa y menestra con ensalada y lonche (Café, Té, Quaker, etc.)',
    'Tortilla de atún, lonche (Café, Té, Quaker, etc.) y pan integral o tostadas',
    'Pescado asado con arroz con papa con ensalada de espinaca y tomate con lonche (Café, Té, Quaker, etc.)',
  ],
  Lunch:[
    'Carne de res a la plancha con quinua y verduras al vapor',
    'Pechuga de pollo a la plancha con arroz y verduras al vapor',
    'Pollo al horno con arroz con quinoa y ensalada de zanahoria, lechuga y tomate',
    'Atún blanco con arroz, puré de lenteja o lenteja sola con ensalada de zanahoria rallada y lechuga',
  ],
  Snack:[
    'Batido proteico con un puñado de frutos secos y 1 o 2 plátano',
    'Yogurt con frutas y 1 puñado de maní',
    'Yogurt natural y 1 o 2 plátanos',
    'Batido proteico y un puñado de maní',
    'Yogurt con frutos secos o frutas y 1 fruta (manzana o pera)',
  ],
  'Afternoon snack':[
    'Batido proteico y 1 o 2 plátanos',
    'Batido proteico y un puñado de maní',
    'Batido proteico y 2 tostadas con crema de maní',
    'Yogurt con frutas y 1 puñado de maní',
    'Yogurt con granola y 1 cucharada de semillas de chía',
  ],
}

// ─── NOTION FIELDS ────────────────────────────────────────────────────────────
const ENTREGAS_STATUS = ['Sin empezar','En planificacion','En progreso','En revision','Acabada']
const ENTREGAS_TIPO   = ['Edición Video','Edición Foto','Investigación','Trabajo']
const TAREAS_STATUS   = ['Proxima accion','Esta semana no','Algún día','Agenda','En curso','A la espera','Completado']
const PRIORIDAD_OPTS  = ['Baja','Media','Alta','Urgente']

// ─── ICONS ────────────────────────────────────────────────────────────────────
const Icon = ({name,size=22,color='currentColor',sw=1.7}) => {
  const p = {fill:'none',stroke:color,strokeWidth:sw,strokeLinecap:'round',strokeLinejoin:'round'}
  const s = {width:size,height:size,display:'block',flexShrink:0}
  const svg = ch => <svg style={s} viewBox="0 0 24 24" {...p}>{ch}</svg>
  switch(name){
    case 'clock':   return svg(<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>)
    case 'cal':     return svg(<><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>)
    case 'check':   return svg(<><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></>)
    case 'leaf':    return svg(<><path d="M2 22l10-10"/><path d="M16.67 8.33a6 6 0 0 1-6.67 9.95A6 6 0 0 1 16.67 8.33z"/><path d="M22 2c-2 0-5 1-7 4-1.5 2-1.5 5 0 7"/></>)
    case 'user':    return svg(<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>)
    case 'edit':    return svg(<><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>)
    case 'trash':   return svg(<><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></>)
    case 'plus':    return svg(<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>)
    case 'arrow':   return svg(<><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></>)
    case 'refresh': return svg(<><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></>)
    case 'bell':    return svg(<><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></>)
    case 'bellOn':  return svg(<><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" fill={`${color}25`}/><path d="M13.73 21a2 2 0 0 1-3.46 0"/><circle cx="17" cy="5" r="3" fill={color} stroke="none"/></>)
    case 'chevD':   return svg(<polyline points="6 9 12 15 18 9"/>)
    case 'chevU':   return svg(<polyline points="18 15 12 9 6 15"/>)
    case 'history': return svg(<><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.95"/></>)
    default:        return null
  }
}

// ─── BASE COMPONENTS ──────────────────────────────────────────────────────────
const Pill = ({color,children}) => (
  <span style={{display:'inline-flex',alignItems:'center',fontSize:10,padding:'2px 7px',borderRadius:99,background:`${color}20`,color,fontWeight:600,letterSpacing:'0.02em',whiteSpace:'nowrap',lineHeight:'16px'}}>{children}</span>
)
const Sec = ({children,style={}}) => (
  <div style={{fontSize:10,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.1em',color:C.hint,marginBottom:6,marginTop:2,...style}}>{children}</div>
)
const Card = ({children,accent,style={}}) => (
  <div style={{background:C.surf,borderRadius:12,padding:'11px 13px',border:`0.5px solid ${C.bor}`,borderLeft:accent?`3px solid ${accent}`:undefined,...style}}>{children}</div>
)
const Btn = ({onClick,disabled,children,variant='outline',style={}}) => {
  const base = {borderRadius:10,padding:'10px 14px',fontSize:13,cursor:disabled?'not-allowed':'pointer',fontWeight:500,border:'none',opacity:disabled?0.5:1,fontFamily:'inherit'}
  const v = {
    primary:{background:C.grn,color:'#000',fontWeight:700},
    outline:{background:'transparent',color:C.txt,border:`0.5px solid ${C.bor2}`},
    ghost:  {background:'transparent',color:C.grn,border:`0.5px solid ${C.grn}30`},
    sm:     {background:'transparent',color:C.mut,border:`0.5px solid ${C.bor}`,padding:'5px 10px',fontSize:11,borderRadius:8},
  }
  return <button onClick={disabled?undefined:onClick} style={{...base,...v[variant],...style}}>{children}</button>
}

// ─── CIRCLE GAUGE ─────────────────────────────────────────────────────────────
function CircleGauge({balance,initial}){
  const pct   = initial>0?Math.max(0,Math.min(100,Math.round((balance/initial)*100))):0
  const isLow = balance<20
  const color = isLow?C.red:pct>50?C.grn:C.amb
  const r=38,circ=2*Math.PI*r,dash=(pct/100)*circ
  return(
    <svg width="96" height="96" viewBox="0 0 96 96" style={{flexShrink:0}}>
      <circle cx="48" cy="48" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="7"/>
      <circle cx="48" cy="48" r={r} fill="none" stroke={color} strokeWidth="7"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform="rotate(-90 48 48)" style={{transition:'all 0.5s ease'}}/>
      <text x="48" y="44" textAnchor="middle" fill={isLow?C.red:C.txt} fontSize="13" fontWeight="600" fontFamily="-apple-system,sans-serif">S/{balance}</text>
      <text x="48" y="59" textAnchor="middle" fill={C.mut} fontSize="10" fontFamily="-apple-system,sans-serif">{pct}%</text>
    </svg>
  )
}

// ─── EDIT SCHEDULE PANEL ──────────────────────────────────────────────────────
function EditSchedulePanel({sched,onSave,onClose}){
  const [local,setLocal]   = useState(()=>JSON.parse(JSON.stringify(sched)))
  const [adding,setAdding] = useState(null)
  const [newBlk,setNewBlk] = useState({s:'',e:'',t:'uni',a:''})
  const inp = {width:'100%',padding:'9px 11px',borderRadius:9,border:`0.5px solid ${C.bor}`,background:C.surf2,color:C.txt,fontSize:13,outline:'none',fontFamily:'inherit',boxSizing:'border-box'}
  const removeBlk  = (dk,id) => setLocal(p=>({...p,[dk]:(p[dk]||[]).filter(b=>b.id!==id)}))
  const startAdd   = dk => { setAdding(dk); setNewBlk({s:'',e:'',t:'uni',a:''}) }
  const confirmAdd = () => {
    if(!newBlk.s||!newBlk.e||!newBlk.a)return
    setLocal(p=>({...p,[adding]:[...(p[adding]||[]),{...newBlk,id:uid()}].sort((a,b)=>pt(a.s)-pt(b.s))}))
    setAdding(null)
  }
  return(
    <div style={{position:'absolute',inset:0,background:C.bg,zIndex:50,display:'flex',flexDirection:'column'}}>
      <div style={{padding:'11px 16px',borderBottom:`0.5px solid ${C.bor}`,display:'flex',alignItems:'center',gap:10,flexShrink:0}}>
        <button onClick={onClose} style={{background:'none',border:'none',color:C.mut,cursor:'pointer',padding:4,display:'flex'}}><Icon name="arrow" size={19} color={C.mut}/></button>
        <span style={{fontSize:15,fontWeight:600,flex:1}}>Editar horario</span>
        <Btn variant="primary" onClick={()=>onSave(local)} style={{padding:'7px 16px',fontSize:12}}>Guardar</Btn>
      </div>
      <div style={{flex:1,overflowY:'auto',padding:'12px 16px',WebkitOverflowScrolling:'touch'}}>
        {DKS.map(dk=>(
          <div key={dk} style={{marginBottom:18}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:7}}>
              <span style={{fontSize:13,fontWeight:600}}>{DNAMES[dk]}</span>
              <button onClick={()=>startAdd(dk)} style={{background:'none',border:'none',color:C.grn,cursor:'pointer',display:'flex',alignItems:'center',gap:4,fontSize:11,fontWeight:600,fontFamily:'inherit'}}>
                <Icon name="plus" size={12} color={C.grn}/> Agregar
              </button>
            </div>
            {(local[dk]||[]).length===0&&<div style={{fontSize:12,color:C.hint,padding:'4px 0'}}>Día libre</div>}
            {[...(local[dk]||[])].sort((a,b)=>pt(a.s)-pt(b.s)).map(b=>(
              <div key={b.id} style={{display:'flex',alignItems:'center',gap:9,padding:'8px 11px',background:C.surf,borderRadius:9,border:`0.5px solid ${C.bor}`,marginBottom:5}}>
                <div style={{width:3,height:26,borderRadius:2,background:BCOL[b.t]||C.amb,flexShrink:0}}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{b.a}</div>
                  <div style={{fontSize:11,color:C.mut,marginTop:1}}>{fmt12(b.s)} – {fmt12(b.e)}</div>
                </div>
                <Pill color={BCOL[b.t]||C.amb}>{BLBL[b.t]||'Personal'}</Pill>
                <button onClick={()=>removeBlk(dk,b.id)} style={{background:'none',border:'none',color:C.red,cursor:'pointer',padding:4,display:'flex',flexShrink:0}}><Icon name="trash" size={14} color={C.red}/></button>
              </div>
            ))}
            {adding===dk&&(
              <div style={{background:C.surf2,borderRadius:10,padding:'11px 12px',border:`0.5px solid ${C.bor2}`,marginTop:5}}>
                <div style={{fontSize:12,fontWeight:500,color:C.grn,marginBottom:9}}>Nuevo bloque — {DNAMES[dk]}</div>
                <input placeholder="Nombre del bloque" value={newBlk.a} onChange={e=>setNewBlk(p=>({...p,a:e.target.value}))} style={{...inp,marginBottom:8}}/>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:8}}>
                  <div><div style={{fontSize:10,color:C.mut,marginBottom:3}}>Inicio</div><input type="time" value={newBlk.s} onChange={e=>setNewBlk(p=>({...p,s:e.target.value}))} style={inp}/></div>
                  <div><div style={{fontSize:10,color:C.mut,marginBottom:3}}>Fin</div><input type="time" value={newBlk.e} onChange={e=>setNewBlk(p=>({...p,e:e.target.value}))} style={inp}/></div>
                </div>
                <div style={{marginBottom:10}}>
                  <div style={{fontSize:10,color:C.mut,marginBottom:3}}>Tipo</div>
                  <select value={newBlk.t} onChange={e=>setNewBlk(p=>({...p,t:e.target.value}))} style={inp}>
                    {BTYPES.map(bt=><option key={bt.val} value={bt.val}>{bt.label}</option>)}
                  </select>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                  <Btn variant="outline" onClick={()=>setAdding(null)} style={{width:'100%'}}>Cancelar</Btn>
                  <Btn variant="primary" disabled={!newBlk.s||!newBlk.e||!newBlk.a} onClick={confirmAdd} style={{width:'100%'}}>Agregar</Btn>
                </div>
              </div>
            )}
          </div>
        ))}
        <Btn variant="ghost" onClick={()=>onSave(SCHED_DEFAULT)} style={{width:'100%',marginTop:4}}>Restaurar horario original</Btn>
      </div>
    </div>
  )
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function MyApp(){
  const [now,setNow]             = useState(new Date())
  const [tab,setTab]             = useState('hoy')
  const [selDay,setSelDay]       = useState(null)
  const [editingSched,setEditingSched] = useState(false)
  const lastNotif = useRef(null)

  // Persisted state
  const [habits,setHabits]         = useState(()=>S.get('ma_habits')||{})
  const [habitList,setHabitList]   = useState(()=>S.get('ma_habit_list')||HABITS_DEFAULT)
  const [goals,setGoals]           = useState(()=>S.get('ma_goals')||GOALS0)
  const [ciPhases,setCiPhases]     = useState(()=>S.get('ma_ci_v2')||{})
  const [ciCycles,setCiCycles]     = useState(()=>S.get('ma_ci_cycles_v2')||['C1'])
  const [ciExpanded,setCiExpanded] = useState(false)
  const [finance,setFinance]       = useState(()=>S.get('ma_finance')||{balance:200,initial:200,history:[]})
  const [localEvts,setLocalEvts]   = useState(()=>S.get('ma_evts')||{})
  const [sched,setSched]           = useState(()=>S.get('ma_sched')||SCHED_DEFAULT)

  // Perfil edit modes
  const [editingProfile,setEditingProfile] = useState(false)   // hábitos
  const [editingMetas,setEditingMetas]     = useState(false)   // meta label/target
  const [editGid,setEditGid]               = useState(null)    // progress inline
  const [editGval,setEditGval]             = useState('')
  const [editGoalMeta,setEditGoalMeta]     = useState(null)
  const [goalMetaForm,setGoalMetaForm]     = useState({})
  const [showAddGoal,setShowAddGoal]       = useState(false)
  const [newGoal,setNewGoal]               = useState({label:'',cat:'Personal',unit:'%',target:100})
  const [newHabitLabel,setNewHabitLabel]   = useState('')
  const [finHistOpen,setFinHistOpen]       = useState(false)
  const [editFinance,setEditFinance]       = useState(false)
  const [finInput,setFinInput]             = useState({type:'add',val:'',note:''})

  // Semana
  const [showAddEvt,setShowAddEvt] = useState(false)
  const [evtTitle,setEvtTitle]     = useState('')
  const [evtStart,setEvtStart]     = useState('')
  const [evtEnd,setEvtEnd]         = useState('')

  // Tareas
  const [tasks,setTasks]             = useState(null)
  const [loadT,setLoadT]             = useState(false)
  const [errT,setErrT]               = useState(false)
  const [tFilter,setTFilter]         = useState('all')
  const [showAddT,setShowAddT]       = useState(false)
  const [addingT,setAddingT]         = useState(false)
  const [ntTitle,setNtTitle]         = useState('')
  const [ntSrc,setNtSrc]             = useState('tareas')
  const [ntStatus,setNtStatus]       = useState('Proxima accion')
  const [ntTipo,setNtTipo]           = useState('')
  const [ntPrio,setNtPrio]           = useState('Media')
  const [ntDate,setNtDate]           = useState('')
  const [showCompleted,setShowCompleted] = useState(false)
  const [deletingId,setDeletingId]       = useState(null)

  // Dieta
  const [dietView,setDietView]     = useState('semanal')
  const [dietSelDay,setDietSelDay] = useState(null)

  // Notif
  const [notifP,setNotifP] = useState(typeof Notification!=='undefined'?Notification.permission:'denied')

  // ── Reloj ──────────────────────────────────────────────────────────────────
  useEffect(()=>{ const i=setInterval(()=>setNow(new Date()),1000); return()=>clearInterval(i) },[])

  // ── Auto-fetch mount + 3min refresh ────────────────────────────────────────
  useEffect(()=>{ fetchTasks() },[]) // eslint-disable-line
  useEffect(()=>{ const i=setInterval(fetchTasks,3*60*1000); return()=>clearInterval(i) },[]) // eslint-disable-line

  // ── Notificaciones bloque ───────────────────────────────────────────────────
  useEffect(()=>{
    const fire=()=>{
      if(typeof Notification==='undefined'||Notification.permission!=='granted')return
      const n=new Date(),m=n.getHours()*60+n.getMinutes(),dk2=gdk(n)
      const blk=(sched[dk2]||[]).find(b=>{ const s=pt(b.s),e=pt(b.e); return m>=s&&m<e })
      const key=blk?`${ldk(n)}-${blk.id}`:`${ldk(n)}-none`
      if(blk&&lastNotif.current!==key){ lastNotif.current=key; try{new Notification('My App — '+blk.a,{body:fmt12(blk.s)+' – '+fmt12(blk.e)})}catch{} }
      else if(!blk){lastNotif.current=key}
    }
    fire(); const i=setInterval(fire,20000); return()=>clearInterval(i)
  },[sched])

  // ── Reset status al cambiar fuente ──────────────────────────────────────────
  useEffect(()=>{
    setNtStatus(ntSrc==='entregas'?'Sin empezar':'Proxima accion')
    setNtTipo('')
  },[ntSrc])

  // ── Persist helpers ─────────────────────────────────────────────────────────
  const saveH  = h  => { setHabits(h);    S.set('ma_habits',h) }
  const saveHL = hl => { setHabitList(hl);S.set('ma_habit_list',hl) }
  const saveG  = g  => { setGoals(g);     S.set('ma_goals',g) }
  const saveCI = ci => { setCiPhases(ci); S.set('ma_ci_v2',ci) }
  const saveCC = cc => { setCiCycles(cc); S.set('ma_ci_cycles_v2',cc) }
  const saveF  = f  => { setFinance(f);   S.set('ma_finance',f) }
  const saveE  = e  => { setLocalEvts(e); S.set('ma_evts',e) }
  const saveS  = s  => { setSched(s);     S.set('ma_sched',s) }

  const togH  = (hid,dk2=dateKey) => { const c=habits[dk2]||{}; saveH({...habits,[dk2]:{...c,[hid]:!c[hid]}}) }
  const togCI = (cycle,slug) => { const k=phaseKey(cycle,slug); saveCI({...ciPhases,[k]:!ciPhases[k]}) }

  // ── Derived ─────────────────────────────────────────────────────────────────
  const dk        = gdk(now)
  const dateKey   = ldk(now)
  const nowM      = now.getHours()*60+now.getMinutes()
  const activeDay = selDay||dk
  const activeDK  = dayKeyForDK(activeDay,now)
  const todayH    = habits[dateKey]||{}
  const hDone     = habitList.filter(h=>todayH[h.id]).length

  const todayAll  = [...(sched[dk]||[]),...(localEvts[dateKey]||[])].sort((a,b)=>pt(a.s)-pt(b.s))
  const curBlock  = todayAll.find(b=>{ const s=pt(b.s),e=pt(b.e); return nowM>=s&&nowM<e })
  const upcoming  = todayAll.filter(b=>pt(b.s)>nowM).slice(0,3)
  const activeAll = [...(sched[activeDay]||[]).map(b=>({...b,_fixed:true})),...(localEvts[activeDK]||[]).map(b=>({...b,t:'personal',_fixed:false}))].sort((a,b)=>pt(a.s)-pt(b.s))
  const aCurIdx   = activeDay===dk?activeAll.findIndex(b=>{ const s=pt(b.s),e=pt(b.e); return nowM>=s&&nowM<e }):-1

  const totalCIPhases = ciCycles.reduce((acc,c)=>acc+(CI_CYCLE_PHASES[c]||[]).length,0)
  const validCIKeys   = new Set(ciCycles.flatMap(c=>(CI_CYCLE_PHASES[c]||[]).map(({slug})=>phaseKey(c,slug))))
  const doneCIPhases  = Object.entries(ciPhases).filter(([k,v])=>v&&validCIKeys.has(k)).length
  const ciPct         = totalCIPhases>0?Math.round((doneCIPhases/totalCIPhases)*100):0

  const activeTasks    = (tasks||[]).filter(t=>!isCompleted(t))
  const completedTasks = (tasks||[]).filter(t=>isCompleted(t))

  const srcForFilter = f => f==='all'?null:f==='universidad'?'entregas':f
  const filterFn     = t => { const src=srcForFilter(tFilter); return !src||t.source===src }
  const ftasks       = activeTasks.filter(filterFn)
  const tmrw         = new Date(now); tmrw.setDate(tmrw.getDate()+1)
  const tmrwKey      = ldk(tmrw)
  const tToday       = ftasks.filter(t=>t.date===dateKey)
  const tTmrw        = ftasks.filter(t=>t.date===tmrwKey)
  const tUp          = ftasks.filter(t=>t.date&&t.date>tmrwKey)
  const tNone        = ftasks.filter(t=>!t.date)

  const days7  = Array.from({length:7},(_,i)=>{ const d=new Date(now);d.setDate(d.getDate()-(6-i));return ldk(d) })
  const labs7  = days7.map(dk2=>new Date(dk2+'T12:00:00').toLocaleDateString('es-PE',{weekday:'short'}).slice(0,2).toUpperCase())

  const dietDay = dietSelDay||(DIET_SEMANAL[dk]?dk:'lun')
  const timeStr = now.toLocaleTimeString('es-PE',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:true})
  const dateStr = now.toLocaleDateString('es-PE',{weekday:'long',day:'numeric',month:'long'})

  // ── Notion ──────────────────────────────────────────────────────────────────
  const fetchTasks = async() => {
    setLoadT(true); setErrT(false)
    try{
      const [rE,rT,rV] = await Promise.all([notionQuery(DB.entregas),notionQuery(DB.tareas),notionQuery(DB.vendify)])
      if(rE.status===401){setErrT(true);setTasks([]);return}
      setTasks([...parseEntregas(rE.results||[]),...parseTareas(rT.results||[],'tareas'),...parseTareas(rV.results||[],'vendify')])
    }catch{setErrT(true);setTasks([])}
    setLoadT(false)
  }

  const deleteTask = async t => {
    setDeletingId(t.id)
    try{await notionArchive(t.id)}catch{}
    setTasks(prev=>prev.filter(x=>x.id!==t.id))
    setDeletingId(null)
  }

  const addTask = async() => {
    if(!ntTitle)return; setAddingT(true)
    let dbId,props
    if(ntSrc==='entregas'){
      dbId=DB.entregas
      props={
        Nombre:{title:[{text:{content:ntTitle}}]},
        Estado:{select:{name:ntStatus||'Sin empezar'}},
        ...(ntTipo?{Tipo:{select:{name:ntTipo}}}:{}),
        ...(ntDate?{Fecha:{date:{start:ntDate}}}:{}),
      }
    } else {
      dbId=ntSrc==='vendify'?DB.vendify:DB.tareas
      props={
        Nombre:{title:[{text:{content:ntTitle}}]},
        Status:{status:{name:ntStatus||'Proxima accion'}},
        Prioridad:{select:{name:ntPrio||'Media'}},
        ...(ntDate?{Fecha:{date:{start:ntDate}}}:{}),
      }
    }
    try{await notionCreate(dbId,props)}catch(e){console.error(e)}
    setAddingT(false);setShowAddT(false);setNtTitle('');setNtDate('');setNtTipo('')
    fetchTasks()
  }

  const openAddTask = () => {
    if(tFilter==='universidad') setNtSrc('entregas')
    else if(tFilter==='tareas') setNtSrc('tareas')
    else if(tFilter==='vendify')setNtSrc('vendify')
    else                        setNtSrc('tareas')
    setShowAddT(true)
  }

  const applyFinance = () => {
    const amt=parseFloat(finInput.val)||0; if(amt<0)return
    const nb={...finance,history:[...(finance.history||[])]}
    if(finInput.type==='set'){
      nb.balance=amt; nb.initial=amt
    } else {
      const entry={id:uid(),type:finInput.type,amount:amt,note:finInput.note,date:ldk(new Date())}
      nb.history=[entry,...nb.history]
      nb.balance=finInput.type==='add'?finance.balance+amt:Math.max(0,finance.balance-amt)
    }
    saveF(nb); setEditFinance(false); setFinInput({type:'add',val:'',note:''})
  }

  const handleBell = () => {
    if(typeof Notification==='undefined')return
    if(Notification.permission==='default') Notification.requestPermission().then(p=>setNotifP(p))
  }

  const inp = {width:'100%',padding:'9px 12px',borderRadius:9,border:`0.5px solid ${C.bor}`,background:C.surf2,color:C.txt,fontSize:13,outline:'none',fontFamily:'inherit',boxSizing:'border-box'}

  // ─────────────────────────────────────────────────────────────────────────────
  return(
    <div style={{background:C.bg,color:C.txt,height:'100dvh',fontFamily:'-apple-system,BlinkMacSystemFont,"SF Pro Text",system-ui,sans-serif',display:'flex',flexDirection:'column',overflow:'hidden',maxWidth:430,margin:'0 auto',position:'relative'}}>
      {editingSched&&<EditSchedulePanel sched={sched} onSave={s=>{saveS(s);setEditingSched(false)}} onClose={()=>setEditingSched(false)}/>}

      {/* HEADER */}
      <div style={{padding:'10px 18px 9px',borderBottom:`0.5px solid ${C.bor}`,display:'flex',justifyContent:'space-between',alignItems:'center',flexShrink:0,background:C.bg}}>
        <div>
          <div style={{fontSize:9,color:C.hint,letterSpacing:'0.14em',textTransform:'uppercase',marginBottom:1}}>My App</div>
          <div style={{fontSize:18,fontWeight:600,letterSpacing:'-0.02em',display:'flex',alignItems:'center',gap:8}}>
            Mauricio
            {tab==='perfil'&&(
              <button onClick={handleBell} style={{background:'none',border:'none',cursor:'pointer',padding:2,display:'flex',color:notifP==='granted'?C.grn:C.mut}}>
                <Icon name={notifP==='granted'?'bellOn':'bell'} size={16} color={notifP==='granted'?C.grn:C.mut} sw={1.5}/>
              </button>
            )}
          </div>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          {tab==='semana'&&<button onClick={()=>setEditingSched(true)} style={{display:'flex',alignItems:'center',gap:5,background:'transparent',border:`0.5px solid ${C.bor}`,borderRadius:8,padding:'6px 11px',color:C.mut,cursor:'pointer',fontSize:11,fontFamily:'inherit'}}><Icon name="edit" size={12} color={C.mut}/> Editar</button>}
          {tab==='perfil'&&<button onClick={()=>{setEditingProfile(e=>!e);setEditGoalMeta(null)}} style={{display:'flex',alignItems:'center',gap:5,background:editingProfile?`${C.grn}15`:'transparent',border:`0.5px solid ${editingProfile?C.grn:C.bor}`,borderRadius:8,padding:'6px 11px',color:editingProfile?C.grn:C.mut,cursor:'pointer',fontSize:11,fontFamily:'inherit'}}><Icon name="edit" size={12} color={editingProfile?C.grn:C.mut}/>{editingProfile?'Listo':'Editar'}</button>}
          {tab==='tareas'&&<button onClick={fetchTasks} style={{background:'none',border:'none',color:loadT?C.grn:C.mut,cursor:'pointer',padding:4,display:'flex'}}><Icon name="refresh" size={17} color={loadT?C.grn:C.mut}/></button>}
        </div>
      </div>

      {/* SCROLL AREA */}
      <div style={{flex:1,overflowY:'auto',padding:'13px 16px',WebkitOverflowScrolling:'touch'}}>

        {/* ═══════════════════════ HOY ═══════════════════════════════════════ */}
        {tab==='hoy'&&<>
          <div style={{marginBottom:16}}>
            <div style={{fontSize:11,color:C.mut,textTransform:'capitalize',marginBottom:3}}>{dateStr}</div>
            <div style={{fontSize:36,fontWeight:200,letterSpacing:'-0.04em',fontVariantNumeric:'tabular-nums',lineHeight:1}}>{timeStr}</div>
            <div style={{display:'flex',alignItems:'center',gap:7,marginTop:8}}>
              <div style={{display:'flex',gap:3}}>{habitList.map(h=><div key={h.id} style={{width:5,height:5,borderRadius:'50%',background:todayH[h.id]?C.grn:'rgba(255,255,255,0.1)'}}/>)}</div>
              <span style={{fontSize:11,color:C.mut}}>{hDone}/{habitList.length} hábitos completados</span>
            </div>
          </div>
          <Sec>Ahora mismo</Sec>
          {curBlock?(
            <Card accent={BCOL[curBlock.t]||C.grn} style={{marginBottom:10}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
                <div style={{flex:1,paddingRight:8}}>
                  <div style={{fontSize:15,fontWeight:500,marginBottom:2}}>{curBlock.a}</div>
                  <div style={{fontSize:11,color:C.mut}}>{fmt12(curBlock.s)} – {fmt12(curBlock.e)}</div>
                </div>
                <Pill color={BCOL[curBlock.t]||C.grn}>{BLBL[curBlock.t]||'Personal'}</Pill>
              </div>
              <div style={{height:3,background:'rgba(255,255,255,0.07)',borderRadius:2,overflow:'hidden'}}>
                <div style={{height:'100%',borderRadius:2,width:`${bpct(curBlock,nowM)}%`,background:BCOL[curBlock.t]||C.grn,transition:'width 1s linear'}}/>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',marginTop:4}}>
                <span style={{fontSize:10,color:C.mut}}>{fmt12(curBlock.s)}</span>
                <span style={{fontSize:10,color:BCOL[curBlock.t]||C.grn,fontWeight:600}}>{bpct(curBlock,nowM)}%</span>
                <span style={{fontSize:10,color:C.mut}}>{fmt12(curBlock.e)}</span>
              </div>
            </Card>
          ):<Card style={{marginBottom:10,textAlign:'center'}}><span style={{fontSize:12,color:C.mut}}>Sin bloque activo en este momento</span></Card>}
          {upcoming.length>0&&<>
            <Sec>A continuación</Sec>
            {upcoming.map((b,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',gap:11,padding:'8px 4px',borderBottom:`0.5px solid ${C.bor}`}}>
                <div style={{width:2,height:28,borderRadius:2,background:BCOL[b.t]||C.grn,flexShrink:0}}/>
                <div style={{flex:1}}><div style={{fontSize:13,fontWeight:500}}>{b.a}</div><div style={{fontSize:11,color:C.mut,marginTop:1}}>{fmt12(b.s)} – {fmt12(b.e)}</div></div>
                <Pill color={BCOL[b.t]||C.grn}>{BLBL[b.t]||'Personal'}</Pill>
              </div>
            ))}
          </>}
          <div style={{marginTop:14}}>
            <Sec>Hábitos de hoy</Sec>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:7}}>
              {habitList.map(h=>{ const done=!!todayH[h.id]; return(
                <div key={h.id} onClick={()=>togH(h.id)} style={{background:done?`${C.grn}10`:C.surf,border:`0.5px solid ${done?C.grn:C.bor}`,borderRadius:11,padding:'9px 11px',cursor:'pointer',display:'flex',alignItems:'center',gap:8}}>
                  <div style={{width:16,height:16,borderRadius:4,flexShrink:0,border:`1.5px solid ${done?C.grn:'rgba(255,255,255,0.2)'}`,background:done?C.grn:'transparent',display:'flex',alignItems:'center',justifyContent:'center'}}>
                    {done&&<span style={{color:'#000',fontSize:10,fontWeight:800,lineHeight:1}}>✓</span>}
                  </div>
                  <span style={{fontSize:12,color:done?C.grn:C.txt,fontWeight:done?500:400}}>{h.label}</span>
                </div>
              )})}
            </div>
          </div>
        </>}

        {/* ═══════════════════════ SEMANA ════════════════════════════════════ */}
        {tab==='semana'&&<>
          <div style={{display:'flex',gap:5,overflowX:'auto',marginBottom:11,paddingBottom:2,WebkitOverflowScrolling:'touch'}}>
            {DKS.map(d=>(
              <button key={d} onClick={()=>setSelDay(d)} style={{flexShrink:0,padding:'6px 10px',borderRadius:20,cursor:'pointer',border:`0.5px solid ${activeDay===d?C.grn:C.bor}`,background:activeDay===d?`${C.grn}15`:'transparent',color:activeDay===d?C.grn:C.mut,fontSize:12,fontWeight:activeDay===d?600:400,fontFamily:'inherit'}}>
                {DNAMES[d].slice(0,3)}
              </button>
            ))}
          </div>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
            <span style={{fontSize:16,fontWeight:500}}>{DNAMES[activeDay]}</span>
            {activeDay===dk&&<Pill color={C.grn}>hoy</Pill>}
          </div>
          {activeAll.length===0
            ?<Card style={{textAlign:'center'}}><span style={{fontSize:13,color:C.mut}}>Día libre 🎉</span></Card>
            :activeAll.map((b,i)=>(
              <div key={b.id||i} style={{display:'flex',alignItems:'center',gap:11,padding:aCurIdx===i?'9px 12px':'8px 4px',background:aCurIdx===i?`${BCOL[b.t]||C.grn}10`:'transparent',borderBottom:`0.5px solid ${C.bor}`,borderRadius:aCurIdx===i?10:0,marginBottom:aCurIdx===i?2:0}}>
                <div style={{width:2,height:28,borderRadius:2,background:BCOL[b.t]||C.amb,flexShrink:0}}/>
                <div style={{flex:1}}><div style={{fontSize:13,fontWeight:aCurIdx===i?500:400}}>{b.a}</div><div style={{fontSize:11,color:C.mut,marginTop:1}}>{fmt12(b.s)} – {fmt12(b.e)}</div></div>
                <Pill color={BCOL[b.t]||C.amb}>{BLBL[b.t]||'Personal'}</Pill>
                {!b._fixed&&<button onClick={()=>{ const evts={...localEvts};evts[activeDK]=(evts[activeDK]||[]).filter(e=>e.id!==b.id);saveE(evts) }} style={{background:'none',border:'none',color:C.mut,cursor:'pointer',fontSize:16,padding:'0 5px',lineHeight:1}}>×</button>}
              </div>
            ))
          }
          {showAddEvt?(
            <Card style={{marginTop:11}}>
              <div style={{fontSize:13,fontWeight:500,marginBottom:10}}>Nuevo evento personal</div>
              <input placeholder="Nombre del evento" value={evtTitle} onChange={e=>setEvtTitle(e.target.value)} style={{...inp,marginBottom:9}}/>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:11}}>
                <div><div style={{fontSize:10,color:C.mut,marginBottom:3}}>Inicio</div><input type="time" value={evtStart} onChange={e=>setEvtStart(e.target.value)} style={inp}/></div>
                <div><div style={{fontSize:10,color:C.mut,marginBottom:3}}>Fin</div><input type="time" value={evtEnd} onChange={e=>setEvtEnd(e.target.value)} style={inp}/></div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                <Btn variant="outline" onClick={()=>{setShowAddEvt(false);setEvtTitle('');setEvtStart('');setEvtEnd('')}} style={{width:'100%'}}>Cancelar</Btn>
                <Btn variant="primary" onClick={()=>{
                  if(!evtTitle||!evtStart||!evtEnd)return
                  const evts={...localEvts};evts[activeDK]=[...(evts[activeDK]||[]),{id:uid(),s:evtStart,e:evtEnd,a:evtTitle}]
                  saveE(evts);setShowAddEvt(false);setEvtTitle('');setEvtStart('');setEvtEnd('')
                }} style={{width:'100%'}}>Agregar</Btn>
              </div>
            </Card>
          ):<Btn variant="ghost" onClick={()=>setShowAddEvt(true)} style={{width:'100%',marginTop:11}}>+ Agregar evento personal</Btn>}
        </>}

        {/* ═══════════════════════ TAREAS ════════════════════════════════════ */}
        {tab==='tareas'&&<>
          {/* Filtros + botón completadas */}
          <div style={{display:'flex',alignItems:'center',gap:5,marginBottom:12,overflowX:'auto',paddingBottom:2}}>
            {[['all','Todas'],['universidad','Universidad'],['tareas','Trabajo'],['vendify','Vendify']].map(([k,l])=>(
              <button key={k} onClick={()=>{setTFilter(k);setShowAddT(false);setShowCompleted(false)}} style={{flexShrink:0,padding:'6px 12px',borderRadius:20,cursor:'pointer',border:`0.5px solid ${tFilter===k?C.grn:C.bor}`,background:tFilter===k?`${C.grn}15`:'transparent',color:tFilter===k?C.grn:C.mut,fontSize:12,fontWeight:tFilter===k?600:400,fontFamily:'inherit'}}>{l}</button>
            ))}
            <button onClick={()=>setShowCompleted(c=>!c)} style={{marginLeft:'auto',flexShrink:0,display:'flex',alignItems:'center',gap:4,padding:'6px 10px',borderRadius:20,cursor:'pointer',border:`0.5px solid ${showCompleted?C.grn:C.bor}`,background:showCompleted?`${C.grn}15`:'transparent',color:showCompleted?C.grn:C.mut,fontSize:11,fontFamily:'inherit',whiteSpace:'nowrap'}}>
              <Icon name="check" size={12} color={showCompleted?C.grn:C.mut}/> Hechas
            </button>
          </div>

          {/* Completadas panel */}
          {showCompleted&&(
            <Card style={{marginBottom:12,border:`0.5px solid ${C.grn}30`}}>
              <div style={{fontSize:12,fontWeight:600,color:C.grn,marginBottom:10}}>Tareas completadas</div>
              {['entregas','tareas','vendify'].map(src=>{
                const label=src==='entregas'?'Universidad':src==='tareas'?'Trabajo':'Vendify'
                const items=completedTasks.filter(t=>t.source===src)
                if(!items.length)return null
                return(
                  <div key={src} style={{marginBottom:10}}>
                    <div style={{fontSize:10,fontWeight:600,letterSpacing:'0.1em',color:C.hint,textTransform:'uppercase',marginBottom:5}}>{label}</div>
                    {items.map((t,i)=>(
                      <div key={i} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 0',borderBottom:`0.5px solid ${C.bor}`}}>
                        <div style={{width:14,height:14,borderRadius:3,background:`${C.grn}30`,border:`0.5px solid ${C.grn}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                          <span style={{color:C.grn,fontSize:9,fontWeight:800}}>✓</span>
                        </div>
                        <span style={{fontSize:12,color:C.mut,flex:1,textDecoration:'line-through'}}>{t.title}</span>
                      </div>
                    ))}
                  </div>
                )
              })}
              {completedTasks.length===0&&<div style={{fontSize:12,color:C.mut,textAlign:'center',padding:'8px 0'}}>No hay tareas completadas</div>}
            </Card>
          )}

          {/* Lista activa */}
          {loadT&&tasks===null&&<div style={{textAlign:'center',padding:'36px 0',color:C.mut,fontSize:13}}>Cargando tareas...</div>}
          {errT&&<Card accent={C.red} style={{marginBottom:12,textAlign:'center'}}><div style={{fontSize:12,color:C.mut,marginBottom:8}}>Error al conectar con Notion.</div><Btn variant="outline" onClick={fetchTasks} style={{fontSize:12,padding:'7px 14px'}}>Reintentar</Btn></Card>}
          {!loadT&&!errT&&tasks!==null&&<>
            {[['Hoy',tToday],['Mañana',tTmrw],['Próximas',tUp],['Sin fecha',tNone]].map(([label,items])=>items.length>0&&(
              <div key={label}>
                <Sec>{label}</Sec>
                {items.map((t,i)=>(
                  <Card key={i} style={{marginBottom:7}}>
                    <div style={{display:'flex',alignItems:'flex-start',gap:8}}>
                      <div style={{flex:1}}>
                        <div style={{fontSize:13,fontWeight:500,marginBottom:6}}>{t.title}</div>
                        <div style={{display:'flex',gap:5,flexWrap:'wrap',alignItems:'center'}}>
                          <Pill color={t.source==='entregas'?C.blu:t.source==='vendify'?C.grn:C.amb}>
                            {t.source==='entregas'?'Universidad':t.source==='vendify'?'Vendify':'Trabajo'}
                          </Pill>
                          {t.priority&&<Pill color={pcolor(t.priority)}>{t.priority}</Pill>}
                          {t.status&&<span style={{fontSize:11,color:scol(t.status)}}>{t.status}</span>}
                          {t.date&&<span style={{fontSize:11,color:C.mut,marginLeft:'auto'}}>{t.date}</span>}
                        </div>
                      </div>
                      <button onClick={()=>deleteTask(t)} disabled={deletingId===t.id} style={{background:'none',border:'none',color:deletingId===t.id?C.hint:C.red,cursor:'pointer',padding:'2px 4px',display:'flex',flexShrink:0,marginTop:1}}>
                        {deletingId===t.id?<span style={{fontSize:11,color:C.hint}}>…</span>:<Icon name="trash" size={14} color={C.red}/>}
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            ))}
            {ftasks.length===0&&<div style={{textAlign:'center',padding:24,color:C.mut,fontSize:13}}>Sin tareas activas en esta categoría</div>}
          </>}

          {/* Add task */}
          {showAddT?(
            <Card style={{marginTop:9}}>
              <div style={{fontSize:13,fontWeight:500,marginBottom:10}}>Nueva tarea en Notion</div>
              <input placeholder="Nombre de la tarea" value={ntTitle} onChange={e=>setNtTitle(e.target.value)} style={{...inp,marginBottom:9}}/>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:9}}>
                <div>
                  <div style={{fontSize:10,color:C.mut,marginBottom:3}}>Base de datos</div>
                  <select value={ntSrc} onChange={e=>setNtSrc(e.target.value)} style={{...inp,opacity:tFilter!=='all'?0.5:1}} disabled={tFilter!=='all'}>
                    <option value="tareas">Trabajo</option>
                    <option value="entregas">Universidad</option>
                    <option value="vendify">Vendify</option>
                  </select>
                </div>
                {ntSrc!=='entregas'?(
                  <div>
                    <div style={{fontSize:10,color:C.mut,marginBottom:3}}>Prioridad</div>
                    <select value={ntPrio} onChange={e=>setNtPrio(e.target.value)} style={inp}>
                      {PRIORIDAD_OPTS.map(o=><option key={o}>{o}</option>)}
                    </select>
                  </div>
                ):(
                  <div>
                    <div style={{fontSize:10,color:C.mut,marginBottom:3}}>Tipo</div>
                    <select value={ntTipo} onChange={e=>setNtTipo(e.target.value)} style={inp}>
                      <option value="">Sin tipo</option>
                      {ENTREGAS_TIPO.map(o=><option key={o}>{o}</option>)}
                    </select>
                  </div>
                )}
              </div>
              <div style={{marginBottom:9}}>
                <div style={{fontSize:10,color:C.mut,marginBottom:3}}>{ntSrc==='entregas'?'Estado':'Status'}</div>
                <select value={ntStatus} onChange={e=>setNtStatus(e.target.value)} style={inp}>
                  {(ntSrc==='entregas'?ENTREGAS_STATUS:TAREAS_STATUS).map(o=><option key={o}>{o}</option>)}
                </select>
              </div>
              <div style={{marginBottom:10}}>
                <div style={{fontSize:10,color:C.mut,marginBottom:3}}>Fecha (opcional)</div>
                <input type="date" value={ntDate} onChange={e=>setNtDate(e.target.value)} style={inp}/>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                <Btn variant="outline" onClick={()=>{setShowAddT(false);setNtTitle('');setNtDate('')}} style={{width:'100%'}}>Cancelar</Btn>
                <Btn variant="primary" disabled={!ntTitle||addingT} onClick={addTask} style={{width:'100%'}}>{addingT?'Guardando...':'Guardar'}</Btn>
              </div>
            </Card>
          ):<Btn variant="ghost" onClick={openAddTask} style={{width:'100%',marginTop:9}}>+ Nueva tarea</Btn>}
        </>}

        {/* ═══════════════════════ DIETA ═════════════════════════════════════ */}
        {tab==='dieta'&&<>
          {/* Sub-tabs */}
          <div style={{display:'flex',gap:6,marginBottom:14}}>
            {[['semanal','Dieta semanal'],['opciones','Opciones de comida']].map(([k,l])=>(
              <button key={k} onClick={()=>setDietView(k)} style={{flex:1,padding:'8px 0',borderRadius:10,cursor:'pointer',border:`0.5px solid ${dietView===k?C.grn:C.bor}`,background:dietView===k?`${C.grn}15`:'transparent',color:dietView===k?C.grn:C.mut,fontSize:12,fontWeight:dietView===k?600:400,fontFamily:'inherit'}}>{l}</button>
            ))}
          </div>

          {/* Dieta semanal */}
          {dietView==='semanal'&&<>
            <div style={{display:'flex',gap:4,overflowX:'auto',marginBottom:14,paddingBottom:2,WebkitOverflowScrolling:'touch'}}>
              {DKS.map(d=>(
                <button key={d} onClick={()=>setDietSelDay(d)} style={{flexShrink:0,padding:'5px 9px',borderRadius:18,cursor:'pointer',border:`0.5px solid ${dietDay===d?C.grn:C.bor}`,background:dietDay===d?`${C.grn}15`:'transparent',color:dietDay===d?C.grn:C.mut,fontSize:11,fontWeight:dietDay===d?600:400,fontFamily:'inherit'}}>
                  {DNAMES[d].slice(0,3)}{d===dk&&<span style={{marginLeft:3,fontSize:9,color:C.grn}}>●</span>}
                </button>
              ))}
            </div>
            <div style={{fontSize:14,fontWeight:500,marginBottom:12}}>{DNAMES[dietDay]}</div>
            {(DIET_SEMANAL[dietDay]||[]).map((item,i)=>{
              const mc=MEAL_COL[item.type]
              return(
                <div key={i} style={{display:'flex',gap:12,padding:'10px 0',borderBottom:`0.5px solid ${C.bor}`}}>
                  <div style={{width:3,borderRadius:2,background:mc,flexShrink:0,alignSelf:'stretch',minHeight:36}}/>
                  <div style={{flex:1}}>
                    <div style={{marginBottom:5}}><Pill color={mc}>{MEAL_ES[item.type]}</Pill></div>
                    <div style={{fontSize:13,color:C.txt,lineHeight:1.55}}>{item.meal}</div>
                  </div>
                </div>
              )
            })}
          </>}

          {/* Opciones de comida */}
          {dietView==='opciones'&&<>
            {MEAL_ORDER.map(type=>{
              const mc=MEAL_COL[type]
              return(
                <div key={type} style={{marginBottom:18}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:9}}>
                    <div style={{width:3,height:16,borderRadius:2,background:mc,flexShrink:0}}/>
                    <span style={{fontSize:11,fontWeight:700,color:mc,textTransform:'uppercase',letterSpacing:'0.09em'}}>{MEAL_ES[type]}</span>
                  </div>
                  {(OPCIONES_COMIDA[type]||[]).map((meal,i)=>(
                    <div key={i} style={{display:'flex',alignItems:'flex-start',gap:10,padding:'8px 0',borderBottom:`0.5px solid ${C.bor}`}}>
                      <div style={{width:5,height:5,borderRadius:'50%',background:mc,flexShrink:0,marginTop:6}}/>
                      <span style={{fontSize:12,color:C.txt,lineHeight:1.6,flex:1}}>{meal}</span>
                    </div>
                  ))}
                </div>
              )
            })}
          </>}
        </>}

        {/* ═══════════════════════ PERFIL ════════════════════════════════════ */}
        {tab==='perfil'&&<>
          {/* Hábitos histórico */}
          <Sec>Hábitos — últimos 7 días</Sec>
          <Card style={{marginBottom:editingProfile?8:12,overflowX:'auto'}}>
            <div style={{display:'grid',gridTemplateColumns:'64px repeat(7,1fr)',gap:3,marginBottom:5,minWidth:280}}>
              <div/>
              {labs7.map((l,i)=><div key={i} style={{textAlign:'center',fontSize:10,color:days7[i]===dateKey?C.grn:C.hint,fontWeight:days7[i]===dateKey?700:400}}>{l}</div>)}
            </div>
            {habitList.map(h=>{
              let streak=0; for(let i=days7.length-1;i>=0;i--){if(habits[days7[i]]?.[h.id])streak++;else break}
              return(
                <div key={h.id} style={{display:'grid',gridTemplateColumns:'64px repeat(7,1fr)',gap:3,marginBottom:4,alignItems:'center',minWidth:280}}>
                  <div style={{display:'flex',alignItems:'center',gap:3,overflow:'hidden'}}>
                    <span style={{fontSize:10,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{h.label}</span>
                    {streak>1&&<span style={{fontSize:9,color:C.grn,fontWeight:700,flexShrink:0}}>{streak}d</span>}
                  </div>
                  {days7.map((dk2,i)=>(
                    <div key={i} onClick={()=>togH(h.id,dk2)} style={{height:20,borderRadius:4,cursor:'pointer',background:habits[dk2]?.[h.id]?C.grn:'rgba(255,255,255,0.05)',border:`0.5px solid ${habits[dk2]?.[h.id]?C.grn:'rgba(255,255,255,0.07)'}`,display:'flex',alignItems:'center',justifyContent:'center'}}>
                      {habits[dk2]?.[h.id]&&<span style={{color:'#000',fontSize:9,fontWeight:800}}>✓</span>}
                    </div>
                  ))}
                </div>
              )
            })}
          </Card>

          {/* Edición hábitos (modo editar) */}
          {editingProfile&&(
            <Card style={{marginBottom:12,border:`0.5px solid ${C.grn}30`}}>
              <div style={{fontSize:12,fontWeight:600,color:C.grn,marginBottom:10}}>Editar hábitos</div>
              {habitList.map(h=>(
                <div key={h.id} style={{display:'flex',alignItems:'center',gap:8,marginBottom:7}}>
                  <input value={h.label} onChange={e=>saveHL(habitList.map(x=>x.id===h.id?{...x,label:e.target.value}:x))} style={{...inp,flex:1}}/>
                  <button onClick={()=>saveHL(habitList.filter(x=>x.id!==h.id))} style={{background:'none',border:'none',color:C.red,cursor:'pointer',padding:4,display:'flex',flexShrink:0}}><Icon name="trash" size={15} color={C.red}/></button>
                </div>
              ))}
              <div style={{display:'flex',gap:8,marginTop:4}}>
                <input placeholder="Nuevo hábito..." value={newHabitLabel} onChange={e=>setNewHabitLabel(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter'&&newHabitLabel){saveHL([...habitList,{id:uid(),label:newHabitLabel}]);setNewHabitLabel('')} }} style={{...inp,flex:1}}/>
                <Btn variant="primary" disabled={!newHabitLabel} onClick={()=>{saveHL([...habitList,{id:uid(),label:newHabitLabel}]);setNewHabitLabel('')}} style={{whiteSpace:'nowrap',padding:'9px 14px'}}>+ Agregar</Btn>
              </div>
            </Card>
          )}

          {/* Metas header — dos botones: Editar metas | + Agregar */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8,marginTop:6}}>
            <Sec style={{marginBottom:0,marginTop:0}}>Metas</Sec>
            <div style={{display:'flex',gap:6}}>
              <Btn variant="sm" onClick={()=>{setEditingMetas(m=>!m);setEditGoalMeta(null)}}
                style={{color:editingMetas?C.grn:C.mut,border:`0.5px solid ${editingMetas?C.grn:C.bor}`,background:editingMetas?`${C.grn}10`:'transparent'}}>
                {editingMetas?'Listo':<span style={{display:'flex',alignItems:'center',gap:4}}><Icon name="edit" size={11} color={C.mut}/>Editar</span>}
              </Btn>
              <Btn variant="sm" onClick={()=>setShowAddGoal(g=>!g)}>+ Agregar</Btn>
            </div>
          </div>

          {showAddGoal&&(
            <Card style={{marginBottom:10,border:`0.5px solid ${C.grn}30`}}>
              <div style={{fontSize:12,fontWeight:600,color:C.grn,marginBottom:10}}>Nueva meta</div>
              <input placeholder="Nombre de la meta" value={newGoal.label} onChange={e=>setNewGoal(g=>({...g,label:e.target.value}))} style={{...inp,marginBottom:8}}/>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:8}}>
                <div>
                  <div style={{fontSize:10,color:C.mut,marginBottom:3}}>Categoría</div>
                  <select value={newGoal.cat} onChange={e=>setNewGoal(g=>({...g,cat:e.target.value}))} style={inp}>
                    <option>Gym</option><option>Vendify</option><option>Universidad</option><option>Personal</option>
                  </select>
                </div>
                <div>
                  <div style={{fontSize:10,color:C.mut,marginBottom:3}}>Unidad</div>
                  <input value={newGoal.unit} onChange={e=>setNewGoal(g=>({...g,unit:e.target.value}))} style={inp} placeholder="kg, %, sem..."/>
                </div>
              </div>
              <div style={{marginBottom:10}}>
                <div style={{fontSize:10,color:C.mut,marginBottom:3}}>Progreso inicial</div>
                <input type="number" placeholder="0" value={newGoal.current||0} onChange={e=>setNewGoal(g=>({...g,current:parseFloat(e.target.value)||0}))} style={{...inp,marginBottom:8}}/>
                <div style={{fontSize:10,color:C.mut,marginBottom:3}}>Target</div>
                <input type="number" value={newGoal.target} onChange={e=>setNewGoal(g=>({...g,target:parseFloat(e.target.value)||100}))} style={inp}/>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                <Btn variant="outline" onClick={()=>setShowAddGoal(false)} style={{width:'100%'}}>Cancelar</Btn>
                <Btn variant="primary" disabled={!newGoal.label} onClick={()=>{
                  saveG([...goals,{id:uid(),...newGoal,start:newGoal.current||0,color:CAT_COLORS[newGoal.cat]||C.amb}])
                  setShowAddGoal(false);setNewGoal({label:'',cat:'Personal',unit:'%',target:100})
                }} style={{width:'100%'}}>Agregar</Btn>
              </div>
            </Card>
          )}

          {/* Goals list */}
          {goals.map(g=>{
            const range  = g.target-g.start
            const isVend = g.cat==='Vendify'
            const pct    = isVend ? ciPct : (range===0?0:Math.min(100,Math.round(((g.current-g.start)/range)*100)))
            return(
              <Card key={g.id} style={{marginBottom:8}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
                  <div style={{flex:1,paddingRight:8}}>
                    <Pill color={g.color}>{g.cat}</Pill>
                    {editGoalMeta===g.id?(
                      <div style={{marginTop:8}}>
                        <input placeholder="Nombre" value={goalMetaForm.label||''} onChange={e=>setGoalMetaForm(f=>({...f,label:e.target.value}))} style={{...inp,marginBottom:6,fontSize:12}}/>
                        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,marginBottom:6}}>
                          <input placeholder="Target" type="number" value={goalMetaForm.target||''} onChange={e=>setGoalMetaForm(f=>({...f,target:e.target.value}))} style={{...inp,fontSize:12}}/>
                          <input placeholder="Unidad" value={goalMetaForm.unit||''} onChange={e=>setGoalMetaForm(f=>({...f,unit:e.target.value}))} style={{...inp,fontSize:12}}/>
                        </div>
                        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
                          <Btn variant="outline" onClick={()=>setEditGoalMeta(null)} style={{width:'100%',padding:'6px'}}>Cancelar</Btn>
                          <Btn variant="primary" onClick={()=>{
                            saveG(goals.map(x=>x.id===g.id?{...x,label:goalMetaForm.label||x.label,target:parseFloat(goalMetaForm.target)||x.target,unit:goalMetaForm.unit||x.unit}:x))
                            setEditGoalMeta(null)
                          }} style={{width:'100%',padding:'6px'}}>Guardar</Btn>
                        </div>
                      </div>
                    ):<div style={{fontSize:13,fontWeight:500,marginTop:4}}>{g.label}</div>}
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:5,flexShrink:0}}>
                    {/* Editar/borrar — solo en modo editingMetas */}
                    {editingMetas&&editGoalMeta!==g.id&&(
                      <>
                        <button onClick={()=>{setEditGoalMeta(g.id);setGoalMetaForm({label:g.label,target:String(g.target),unit:g.unit})}} style={{background:'none',border:'none',cursor:'pointer',color:C.mut,padding:2,display:'flex'}}><Icon name="edit" size={13} color={C.mut}/></button>
                        <button onClick={()=>saveG(goals.filter(x=>x.id!==g.id))} style={{background:'none',border:'none',cursor:'pointer',color:C.red,padding:2,display:'flex'}}><Icon name="trash" size={13} color={C.red}/></button>
                      </>
                    )}
                    {/* Progreso — solo si no es Vendify y no estamos editando la meta */}
                    {!isVend&&editGoalMeta!==g.id&&(
                      editGid===g.id?(
                        <div style={{display:'flex',gap:5,alignItems:'center'}}>
                          <input type="number" value={editGval} onChange={e=>setEditGval(e.target.value)} style={{width:52,fontSize:13,padding:'4px 6px',borderRadius:7,border:`0.5px solid ${C.bor}`,background:C.surf2,color:C.txt,textAlign:'center'}} autoFocus/>
                          <button onClick={()=>{saveG(goals.map(x=>x.id===g.id?{...x,current:parseFloat(editGval)||x.current}:x));setEditGid(null)}} style={{fontSize:13,padding:'4px 8px',background:C.grn,color:'#000',border:'none',borderRadius:7,cursor:'pointer',fontWeight:700}}>✓</button>
                          <button onClick={()=>setEditGid(null)} style={{fontSize:13,padding:'4px 7px',background:'transparent',color:C.mut,border:`0.5px solid ${C.bor}`,borderRadius:7,cursor:'pointer'}}>✕</button>
                        </div>
                      ):(
                        <div onClick={()=>{setEditGid(g.id);setEditGval(String(g.current))}} style={{cursor:'pointer',textAlign:'right'}}>
                          <span style={{fontSize:20,fontWeight:500}}>{g.current}</span>
                          <span style={{fontSize:11,color:C.mut}}>/{g.target} {g.unit}</span>
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* Vendify CI rollup */}
                {isVend&&editGoalMeta!==g.id&&(
                  <div>
                    <div onClick={()=>setCiExpanded(e=>!e)} style={{display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer',borderTop:`0.5px solid ${C.bor}`,paddingTop:8,marginBottom:ciExpanded?10:0}}>
                      <div style={{display:'flex',alignItems:'center',gap:8}}>
                        <span style={{fontSize:11,fontWeight:600,color:C.grn}}>Implementación Tecnológica</span>
                        {!ciExpanded&&<Pill color={C.grn}>{doneCIPhases}/{totalCIPhases} · {ciPct}%</Pill>}
                      </div>
                      <Icon name={ciExpanded?'chevU':'chevD'} size={14} color={C.mut}/>
                    </div>
                    {ciExpanded&&(
                      <div>
                        {ciCycles.map(cycle=>(
                          <div key={cycle} style={{marginBottom:10}}>
                            <div style={{fontSize:10,fontWeight:600,color:C.hint,letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:6}}>{cycle}</div>
                            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:5}}>
                              {(CI_CYCLE_PHASES[cycle]||[]).map(({slug,label})=>{
                                const k=phaseKey(cycle,slug),done=!!ciPhases[k]
                                return(
                                  <div key={slug} onClick={()=>togCI(cycle,slug)} style={{display:'flex',alignItems:'center',gap:7,padding:'7px 9px',borderRadius:8,border:`0.5px solid ${done?C.grn:C.bor}`,background:done?`${C.grn}10`:C.surf2,cursor:'pointer'}}>
                                    <div style={{width:14,height:14,borderRadius:3,flexShrink:0,border:`1.5px solid ${done?C.grn:'rgba(255,255,255,0.2)'}`,background:done?C.grn:'transparent',display:'flex',alignItems:'center',justifyContent:'center'}}>
                                      {done&&<span style={{color:'#000',fontSize:9,fontWeight:800}}>✓</span>}
                                    </div>
                                    <span style={{fontSize:11,color:done?C.grn:C.txt,fontWeight:done?500:400}}>{label}</span>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        ))}
                        {ciCycles.length<CI_CYCLE_IDS.length&&(
                          <button onClick={()=>saveCC([...ciCycles,CI_CYCLE_IDS[ciCycles.length]])} style={{width:'100%',padding:'8px',borderRadius:9,border:`0.5px dashed ${C.grn}60`,background:'transparent',color:C.grn,cursor:'pointer',fontSize:11,fontFamily:'inherit',fontWeight:600,marginTop:4}}>
                            + Agregar {CI_CYCLE_IDS[ciCycles.length]}
                          </button>
                        )}
                        <button onClick={()=>{saveCI({});saveCC(['C1'])}} style={{width:'100%',marginTop:6,padding:'6px',borderRadius:9,border:`0.5px solid ${C.red}40`,background:'transparent',color:C.red,cursor:'pointer',fontSize:10,fontFamily:'inherit'}}>
                          Reiniciar progreso CI
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Barra de progreso */}
                {editGoalMeta!==g.id&&(
                  <>
                    <div style={{height:3,background:'rgba(255,255,255,0.07)',borderRadius:2,overflow:'hidden',marginBottom:4,marginTop:isVend&&ciExpanded?8:0}}>
                      <div style={{height:'100%',width:`${pct}%`,background:g.color,borderRadius:2,transition:'width 0.4s ease'}}/>
                    </div>
                    <div style={{fontSize:11,color:C.mut}}>{pct}% completado{isVend&&<span style={{color:C.hint}}> · {doneCIPhases}/{totalCIPhases} fases</span>}</div>
                  </>
                )}
              </Card>
            )
          })}

          {/* Finanzas */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8,marginTop:14}}>
            <Sec style={{marginBottom:0,marginTop:0}}>Finanzas</Sec>
            <button onClick={()=>setEditFinance(e=>!e)} style={{display:'flex',alignItems:'center',gap:5,background:editFinance?`${C.grn}10`:'transparent',border:`0.5px solid ${editFinance?C.grn:C.bor}`,borderRadius:8,padding:'5px 10px',color:editFinance?C.grn:C.mut,cursor:'pointer',fontSize:11,fontFamily:'inherit'}}>
              <Icon name="edit" size={11} color={editFinance?C.grn:C.mut}/>{editFinance?'Cerrar':'Editar'}
            </button>
          </div>
          <Card style={{marginBottom:12}}>
            <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:14}}>
              <CircleGauge balance={finance.balance} initial={finance.initial}/>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:500,marginBottom:3}}>Balance disponible</div>
                <div style={{fontSize:11,color:finance.balance<20?C.red:C.mut}}>
                  {finance.balance<20?'⚠ Bajo presupuesto':`Inicial: S/${finance.initial}`}
                </div>
              </div>
            </div>
            <div style={{display:'flex',gap:5,marginBottom:8}}>
              {[['add','+ Ingreso'],['sub','− Egreso'],...(editFinance?[['set','Fijar total']]:[])] .map(([t,l])=>(
                <button key={t} onClick={()=>setFinInput(f=>({...f,type:t,val:''}))} style={{flex:1,padding:'6px 0',fontSize:10,borderRadius:8,border:`0.5px solid ${finInput.type===t?C.grn:C.bor}`,background:finInput.type===t?`${C.grn}20`:'transparent',color:finInput.type===t?C.grn:C.mut,cursor:'pointer',fontFamily:'inherit',fontWeight:600}}>{l}</button>
              ))}
            </div>
            {finInput.type==='set'&&<div style={{fontSize:10,color:C.hint,marginBottom:6,textAlign:'center'}}>Fija el balance total y reinicia el monto inicial de referencia</div>}
            <input type="number" placeholder="Monto S/." value={finInput.val} onChange={e=>setFinInput(f=>({...f,val:e.target.value}))} style={{...inp,marginBottom:7,fontSize:15,textAlign:'center'}}/>
            {finInput.type!=='set'&&<input placeholder="Nota (opcional)" value={finInput.note||''} onChange={e=>setFinInput(f=>({...f,note:e.target.value}))} style={{...inp,marginBottom:8,fontSize:12}}/>}
            <Btn variant="primary" disabled={!finInput.val||parseFloat(finInput.val)<0} onClick={applyFinance} style={{width:'100%',padding:'9px'}}>
              {finInput.type==='add'?'Registrar ingreso':finInput.type==='sub'?'Registrar egreso':'Fijar balance'}
            </Btn>


            {/* Historial desplegable */}
            <div style={{marginTop:12}}>
              <button onClick={()=>setFinHistOpen(o=>!o)} style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',background:'none',border:'none',color:C.mut,cursor:'pointer',padding:'6px 0',borderTop:`0.5px solid ${C.bor}`,fontFamily:'inherit',fontSize:12}}>
                <span style={{display:'flex',alignItems:'center',gap:6}}><Icon name="history" size={13} color={C.mut}/> Historial</span>
                <Icon name={finHistOpen?'chevU':'chevD'} size={13} color={C.mut}/>
              </button>
              {finHistOpen&&(
                <div style={{marginTop:8}}>
                  {(!finance.history||finance.history.length===0)
                    ?<div style={{fontSize:12,color:C.hint,textAlign:'center',padding:'8px 0'}}>Sin movimientos aún</div>
                    :(finance.history||[]).map(h=>(
                      <div key={h.id} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 0',borderBottom:`0.5px solid ${C.bor}`}}>
                        <span style={{fontSize:13,fontWeight:700,color:h.type==='add'?C.grn:C.red,minWidth:20,textAlign:'center'}}>{h.type==='add'?'+':'−'}</span>
                        <span style={{fontSize:13,fontWeight:500,color:h.type==='add'?C.grn:C.red,minWidth:54}}>S/{h.amount}</span>
                        <span style={{fontSize:11,color:C.mut,flex:1}}>{h.note||''}</span>
                        <span style={{fontSize:10,color:C.hint,flexShrink:0}}>{h.date}</span>
                      </div>
                    ))
                  }
                  <button onClick={()=>saveF({balance:0,initial:0,history:[]})} style={{width:'100%',marginTop:10,padding:'7px',borderRadius:9,border:`0.5px solid ${C.red}40`,background:'transparent',color:C.red,cursor:'pointer',fontSize:11,fontFamily:'inherit',fontWeight:500}}>
                    Reiniciar balance e historial
                  </button>
                </div>
              )}
            </div>
          </Card>

        </>}

      </div>

      {/* BOTTOM NAV */}
      <div style={{borderTop:`0.5px solid ${C.bor}`,background:'#0C0C0C',display:'flex',flexShrink:0,paddingBottom:'env(safe-area-inset-bottom,6px)'}}>
        {[['hoy','Hoy','clock'],['semana','Semana','cal'],['tareas','Tareas','check'],['dieta','Dieta','leaf'],['perfil','Perfil','user']].map(([id,lbl,ico])=>(
          <button key={id} onClick={()=>setTab(id)} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:3,padding:'8px 0',background:'none',border:'none',cursor:'pointer',color:tab===id?C.grn:'rgba(255,255,255,0.25)',fontFamily:'inherit'}}>
            <Icon name={ico} size={20} color={tab===id?C.grn:'rgba(255,255,255,0.25)'} sw={tab===id?2:1.5}/>
            <span style={{fontSize:9,fontWeight:tab===id?600:400}}>{lbl}</span>
          </button>
        ))}
      </div>
    </div>
  )
}