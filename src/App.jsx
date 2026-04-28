import { useState, useEffect, useRef } from "react"

// ─── TOKENS ───────────────────────────────────────────────────────────────────
const C = {
  bg:'#080808', surf:'#111111', surf2:'#181818', surf3:'#202020',
  bor:'rgba(255,255,255,0.07)', bor2:'rgba(255,255,255,0.12)',
  txt:'#F5F5F5', mut:'rgba(255,255,255,0.38)', hint:'rgba(255,255,255,0.18)',
  grn:'#2DD48A', blu:'#5B9CF6', amb:'#F5A623', red:'#F06D6D', pur:'#9F7AEA',
}

// ─── SEMANA: LUNES PRIMERO ────────────────────────────────────────────────────
// JS: 0=Dom,1=Lun,...,6=Sab  →  nuevo índice: (getDay()+6)%7 → 0=Lun,...,6=Dom
const DKS    = ['lun','mar','mie','jue','vie','sab','dom']
const DNAMES = { lun:'Lunes', mar:'Martes', mie:'Miércoles', jue:'Jueves', vie:'Viernes', sab:'Sábado', dom:'Domingo' }
const gdk    = (d = new Date()) => DKS[(d.getDay() + 6) % 7]

// ─── HORARIO BASE ─────────────────────────────────────────────────────────────
const SCHED_DEFAULT = {
  lun:[
    { id:'lun1', s:'14:00', e:'18:00', t:'uni', a:'Base de Datos' },
    { id:'lun2', s:'18:00', e:'21:30', t:'gym', a:'Gym — Piernas' },
  ],
  mar:[
    { id:'mar1', s:'09:00', e:'13:00', t:'uni', a:'Ingeniería de Software' },
    { id:'mar2', s:'18:00', e:'21:30', t:'gym', a:'Gym — Empuje' },
  ],
  mie:[
    { id:'mie1', s:'07:00', e:'11:00', t:'uni', a:'Técnicas Digitales' },
    { id:'mie2', s:'14:00', e:'16:00', t:'uni', a:'Base de Datos' },
    { id:'mie3', s:'16:00', e:'18:00', t:'uni', a:'Inteligencia Artificial' },
    { id:'mie4', s:'18:00', e:'20:00', t:'uni', a:'Metodología Inv. Científica' },
  ],
  jue:[
    { id:'jue1', s:'11:00', e:'13:00', t:'uni', a:'Ingeniería de Software' },
    { id:'jue2', s:'18:00', e:'21:30', t:'gym', a:'Gym — Tracción' },
  ],
  vie:[
    { id:'vie1', s:'08:00', e:'10:00', t:'uni', a:'Inteligencia Artificial' },
    { id:'vie2', s:'18:00', e:'21:30', t:'gym', a:'Gym — Brazos/Hombros' },
  ],
  sab:[], dom:[],
}

const BCOL  = { uni:C.blu, gym:C.pur, personal:C.amb }
const BLBL  = { uni:'Universidad', gym:'Gym', personal:'Personal' }
const BTYPES = [
  { val:'uni', label:'Universidad', color:C.blu },
  { val:'gym', label:'Gym',         color:C.pur },
  { val:'personal', label:'Personal', color:C.amb },
]

const HABITS = [
  {id:'gym',label:'Gym'},{id:'agua',label:'Agua 2L'},
  {id:'desayuno',label:'Desayuno'},{id:'almuerzo',label:'Almuerzo'},
  {id:'cena',label:'Cena'},{id:'vendify',label:'Vendify'},{id:'sueno',label:'Sueño +7h'},
]
const GOALS0 = [
  {id:'peso', cat:'Gym',         label:'Peso corporal', unit:'kg', current:67, target:75,  start:67, color:C.pur},
  {id:'f1',   cat:'Vendify',     label:'F1 Discovery',  unit:'%',  current:0,  target:100, start:0,  color:C.grn},
  {id:'ciclo',cat:'Universidad', label:'Aprobar ciclo', unit:'%',  current:0,  target:100, start:0,  color:C.blu},
  {id:'ropa', cat:'Personal',    label:'Shopping S/800',unit:'%',  current:0,  target:100, start:0,  color:C.amb},
]

// ─── UTILS ────────────────────────────────────────────────────────────────────
const pt    = s => { if(!s)return 0; const[h,m]=s.split(':').map(Number); return h*60+(m||0) }
const fmt12 = t => { if(!t)return''; const[h,m]=t.split(':').map(Number); return`${h%12||12}:${String(m).padStart(2,'0')} ${h>=12?'PM':'AM'}` }
const ldk   = (d=new Date()) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
const bpct  = (b,nowM) => { const s=pt(b.s),e=pt(b.e); if(nowM<s||nowM>=e)return 0; return Math.min(100,Math.round(((nowM-s)/(e-s))*100)) }
const uid   = () => Math.random().toString(36).slice(2,9)
const dayKeyForDK = (dk, ref=new Date()) => {
  const d = new Date(ref)
  const curIdx = (d.getDay()+6)%7
  const tgtIdx = DKS.indexOf(dk)
  d.setDate(d.getDate()+(tgtIdx-curIdx))
  return ldk(d)
}
const pcolor = p => { if(!p)return C.mut; const l=p.toLowerCase(); if(l.includes('alta')||l.includes('high'))return C.red; if(l.includes('media'))return C.amb; return C.grn }
const scol   = s => { if(!s)return C.mut; const l=s.toLowerCase(); if(l.includes('complet'))return C.grn; if(l.includes('edic')||l.includes('progress'))return C.blu; if(l.includes('agenda'))return C.amb; return C.mut }

// ─── NOTION ───────────────────────────────────────────────────────────────────
const callNotion = async (prompt, maxT=1800) => {
  const res = await fetch('https://api.anthropic.com/v1/messages',{
    method:'POST', headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
      model:'claude-sonnet-4-20250514', max_tokens:maxT,
      messages:[{role:'user',content:prompt}],
      mcp_servers:[{type:'url',url:'https://mcp.notion.com/mcp',name:'notion'}]
    })
  })
  const d = await res.json()
  return (d.content||[]).filter(c=>c.type==='text').map(c=>c.text).join('')
}

// ─── ICONS ────────────────────────────────────────────────────────────────────
const Icon = ({name,size=22,color='currentColor',sw=1.7}) => {
  const p = {fill:'none',stroke:color,strokeWidth:sw,strokeLinecap:'round',strokeLinejoin:'round'}
  const s = {width:size,height:size,display:'block',flexShrink:0}
  const svg = ch => <svg style={s} viewBox="0 0 24 24" {...p}>{ch}</svg>
  switch(name){
    case 'clock':   return svg(<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>)
    case 'cal':     return svg(<><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>)
    case 'check':   return svg(<><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></>)
    case 'list':    return svg(<><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></>)
    case 'user':    return svg(<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>)
    case 'edit':    return svg(<><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>)
    case 'trash':   return svg(<><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></>)
    case 'plus':    return svg(<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>)
    case 'arrow':   return svg(<><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></>)
    case 'refresh': return svg(<><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></>)
    default: return null
  }
}

// ─── COMPONENTS ───────────────────────────────────────────────────────────────
const Pill = ({color,children}) => (
  <span style={{display:'inline-flex',alignItems:'center',fontSize:10,padding:'2px 8px',borderRadius:99,background:`${color}20`,color,fontWeight:600,letterSpacing:'0.02em',whiteSpace:'nowrap',lineHeight:'16px'}}>{children}</span>
)
const Sec = ({children}) => (
  <div style={{fontSize:10,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.1em',color:C.hint,marginBottom:8,marginTop:2}}>{children}</div>
)
const Card = ({children,accent,style={}}) => (
  <div style={{background:C.surf,borderRadius:14,padding:'13px 15px',border:`0.5px solid ${C.bor}`,borderLeft:accent?`3px solid ${accent}`:undefined,...style}}>{children}</div>
)
const Btn = ({onClick,disabled,children,variant='outline',style={}}) => {
  const base = {borderRadius:11,padding:'11px 16px',fontSize:13,cursor:disabled?'not-allowed':'pointer',fontWeight:500,border:'none',opacity:disabled?0.5:1,fontFamily:'inherit'}
  const v = {
    primary:{background:C.grn,color:'#000',fontWeight:700},
    outline:{background:'transparent',color:C.txt,border:`0.5px solid ${C.bor2}`},
    ghost:{background:'transparent',color:C.grn,border:`0.5px solid ${C.grn}30`},
  }
  return <button onClick={disabled?undefined:onClick} style={{...base,...v[variant],...style}}>{children}</button>
}

// ─── EDIT SCHEDULE PANEL ──────────────────────────────────────────────────────
function EditSchedulePanel({sched,onSave,onClose}) {
  const [local,setLocal] = useState(()=>JSON.parse(JSON.stringify(sched)))
  const [adding,setAdding] = useState(null)
  const [newBlk,setNewBlk] = useState({s:'',e:'',t:'uni',a:''})
  const inp = {width:'100%',padding:'9px 12px',borderRadius:9,border:`0.5px solid ${C.bor}`,background:C.surf2,color:C.txt,fontSize:13,outline:'none',fontFamily:'inherit'}

  const removeBlk = (dk,id) => setLocal(p=>({...p,[dk]:(p[dk]||[]).filter(b=>b.id!==id)}))
  const startAdd  = dk => { setAdding(dk); setNewBlk({s:'',e:'',t:'uni',a:''}) }
  const confirmAdd = () => {
    if(!newBlk.s||!newBlk.e||!newBlk.a) return
    const blk = {...newBlk,id:uid()}
    setLocal(p=>({...p,[adding]:[...(p[adding]||[]),blk].sort((a,b)=>pt(a.s)-pt(b.s))}))
    setAdding(null)
  }

  return (
    <div style={{position:'absolute',inset:0,background:C.bg,zIndex:50,display:'flex',flexDirection:'column'}}>
      <div style={{padding:'14px 18px',borderBottom:`0.5px solid ${C.bor}`,display:'flex',alignItems:'center',gap:12,flexShrink:0}}>
        <button onClick={onClose} style={{background:'none',border:'none',color:C.mut,cursor:'pointer',padding:4,display:'flex'}}>
          <Icon name="arrow" size={20} color={C.mut}/>
        </button>
        <span style={{fontSize:16,fontWeight:600,flex:1}}>Editar horario</span>
        <Btn variant="primary" onClick={()=>onSave(local)} style={{padding:'8px 18px',fontSize:12}}>Guardar</Btn>
      </div>

      <div style={{flex:1,overflowY:'auto',padding:'14px 18px',WebkitOverflowScrolling:'touch'}}>
        {DKS.map(dk=>(
          <div key={dk} style={{marginBottom:22}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
              <span style={{fontSize:14,fontWeight:600,color:C.txt}}>{DNAMES[dk]}</span>
              <button onClick={()=>startAdd(dk)} style={{background:'none',border:'none',color:C.grn,cursor:'pointer',display:'flex',alignItems:'center',gap:4,fontSize:11,fontWeight:600,fontFamily:'inherit'}}>
                <Icon name="plus" size={13} color={C.grn}/> Agregar
              </button>
            </div>

            {(local[dk]||[]).length===0&&(
              <div style={{fontSize:12,color:C.hint,padding:'6px 0'}}>Día libre</div>
            )}

            {[...(local[dk]||[])].sort((a,b)=>pt(a.s)-pt(b.s)).map(b=>(
              <div key={b.id} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 12px',background:C.surf,borderRadius:10,border:`0.5px solid ${C.bor}`,marginBottom:6}}>
                <div style={{width:3,height:28,borderRadius:2,background:BCOL[b.t]||C.amb,flexShrink:0}}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{b.a}</div>
                  <div style={{fontSize:11,color:C.mut,marginTop:1}}>{fmt12(b.s)} – {fmt12(b.e)}</div>
                </div>
                <Pill color={BCOL[b.t]||C.amb}>{BLBL[b.t]||'Personal'}</Pill>
                <button onClick={()=>removeBlk(dk,b.id)} style={{background:'none',border:'none',color:C.red,cursor:'pointer',padding:4,display:'flex',flexShrink:0}}>
                  <Icon name="trash" size={15} color={C.red}/>
                </button>
              </div>
            ))}

            {adding===dk&&(
              <div style={{background:C.surf2,borderRadius:11,padding:'12px 13px',border:`0.5px solid ${C.bor2}`,marginTop:6}}>
                <div style={{fontSize:12,fontWeight:500,color:C.grn,marginBottom:10}}>Nuevo bloque — {DNAMES[dk]}</div>
                <input placeholder="Nombre del bloque" value={newBlk.a} onChange={e=>setNewBlk(p=>({...p,a:e.target.value}))} style={{...inp,marginBottom:8}}/>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:8}}>
                  <div>
                    <div style={{fontSize:10,color:C.mut,marginBottom:3}}>Inicio</div>
                    <input type="time" value={newBlk.s} onChange={e=>setNewBlk(p=>({...p,s:e.target.value}))} style={inp}/>
                  </div>
                  <div>
                    <div style={{fontSize:10,color:C.mut,marginBottom:3}}>Fin</div>
                    <input type="time" value={newBlk.e} onChange={e=>setNewBlk(p=>({...p,e:e.target.value}))} style={inp}/>
                  </div>
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

        <Btn variant="ghost" onClick={()=>onSave(SCHED_DEFAULT)} style={{width:'100%',marginTop:4}}>
          Restaurar horario original
        </Btn>
      </div>
    </div>
  )
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function MyApp() {
  const [now,setNow]               = useState(new Date())
  const [tab,setTab]               = useState('hoy')
  const [selDay,setSelDay]         = useState(null)
  const [habits,setHabits]         = useState({})
  const [goals,setGoals]           = useState(GOALS0)
  const [localEvts,setLocalEvts]   = useState({})
  const [sched,setSched]           = useState(SCHED_DEFAULT)
  const [editingSched,setEditingSched] = useState(false)
  const [editGid,setEditGid]       = useState(null)
  const [editGval,setEditGval]     = useState('')
  const [showAddEvt,setShowAddEvt] = useState(false)
  const [evtTitle,setEvtTitle]     = useState('')
  const [evtStart,setEvtStart]     = useState('')
  const [evtEnd,setEvtEnd]         = useState('')
  const [tasks,setTasks]           = useState(null)
  const [loadT,setLoadT]           = useState(false)
  const [tFilter,setTFilter]       = useState('all')
  const [showAddT,setShowAddT]     = useState(false)
  const [ntTitle,setNtTitle]       = useState('')
  const [ntSrc,setNtSrc]           = useState('tareas')
  const [ntPrio,setNtPrio]         = useState('Media')
  const [ntDate,setNtDate]         = useState('')
  const [addingT,setAddingT]       = useState(false)
  const [nEvts,setNEvts]           = useState(null)
  const [loadE,setLoadE]           = useState(false)
  const [notifP,setNotifP]         = useState(typeof Notification!=='undefined'?Notification.permission:'denied')
  const lastNotif = useRef(null)

  // Clock
  useEffect(()=>{ const i=setInterval(()=>setNow(new Date()),1000); return()=>clearInterval(i) },[])

  // Load persisted data
  useEffect(()=>{
    ;(async()=>{
      try{const r=await window.storage.get('ma5_h');if(r)setHabits(JSON.parse(r.value))}catch{}
      try{const r=await window.storage.get('ma5_g');if(r)setGoals(JSON.parse(r.value))}catch{}
      try{const r=await window.storage.get('ma5_e');if(r)setLocalEvts(JSON.parse(r.value))}catch{}
      try{const r=await window.storage.get('ma5_s');if(r)setSched(JSON.parse(r.value))}catch{}
    })()
    if(typeof Notification!=='undefined'&&Notification.permission==='default'){
      Notification.requestPermission().then(p=>setNotifP(p))
    }
  },[])

  // Notifications — dispara al inicio EXACTO de cada bloque (revisa cada 20s)
  useEffect(()=>{
    const fire = () => {
      if(typeof Notification==='undefined'||Notification.permission!=='granted') return
      const n = new Date()
      const m = n.getHours()*60+n.getMinutes()
      const dk2 = gdk(n)
      const blk = (sched[dk2]||[]).find(b=>{ const s=pt(b.s),e=pt(b.e); return m>=s&&m<e })
      const key = blk ? `${ldk(n)}-${blk.id}` : `${ldk(n)}-none`
      if(blk&&lastNotif.current!==key){
        lastNotif.current=key
        try{ new Notification('My App — '+blk.a,{body:fmt12(blk.s)+' – '+fmt12(blk.e)}) }catch{}
      } else if(!blk){ lastNotif.current=key }
    }
    fire()
    const i = setInterval(fire,20000)
    return()=>clearInterval(i)
  },[sched])

  // Persist helpers
  const saveH = async h=>{setHabits(h);try{await window.storage.set('ma5_h',JSON.stringify(h))}catch{}}
  const saveG = async g=>{setGoals(g);try{await window.storage.set('ma5_g',JSON.stringify(g))}catch{}}
  const saveE = async e=>{setLocalEvts(e);try{await window.storage.set('ma5_e',JSON.stringify(e))}catch{}}
  const saveS = async s=>{setSched(s);try{await window.storage.set('ma5_s',JSON.stringify(s))}catch{}}
  const togH  = (hid,dk2=dateKey)=>{const c=habits[dk2]||{};saveH({...habits,[dk2]:{...c,[hid]:!c[hid]}})}

  // Derived
  const dk      = gdk(now)
  const dateKey = ldk(now)
  const nowM    = now.getHours()*60+now.getMinutes()
  const activeDay = selDay||dk
  const activeDK  = dayKeyForDK(activeDay,now)
  const todayH    = habits[dateKey]||{}
  const hDone     = HABITS.filter(h=>todayH[h.id]).length

  const todayAll = [...(sched[dk]||[]),...(localEvts[dateKey]||[])].sort((a,b)=>pt(a.s)-pt(b.s))
  const curBlock = todayAll.find(b=>{const s=pt(b.s),e=pt(b.e);return nowM>=s&&nowM<e})
  const upcoming = todayAll.filter(b=>pt(b.s)>nowM).slice(0,3)

  const activeAll = [
    ...(sched[activeDay]||[]).map(b=>({...b,_fixed:true})),
    ...(localEvts[activeDK]||[]).map(b=>({...b,t:'personal',_fixed:false})),
  ].sort((a,b)=>pt(a.s)-pt(b.s))
  const aCurIdx = activeDay===dk
    ? activeAll.findIndex(b=>{const s=pt(b.s),e=pt(b.e);return nowM>=s&&nowM<e})
    : -1

  const ftasks  = (tasks||[]).filter(t=>tFilter==='all'||t.source===tFilter)
  const tmrw    = new Date(now);tmrw.setDate(tmrw.getDate()+1)
  const tmrwKey = ldk(tmrw)
  const tToday  = ftasks.filter(t=>t.date===dateKey)
  const tTmrw   = ftasks.filter(t=>t.date===tmrwKey)
  const tUp     = ftasks.filter(t=>t.date&&t.date>tmrwKey)
  const tNone   = ftasks.filter(t=>!t.date)

  const days7 = Array.from({length:7},(_,i)=>{const d=new Date(now);d.setDate(d.getDate()-(6-i));return ldk(d)})
  const labs7 = days7.map(dk2=>new Date(dk2+'T12:00:00').toLocaleDateString('es-PE',{weekday:'short'}).slice(0,2).toUpperCase())

  // Notion fetchers
  const fetchTasks = async()=>{
    setLoadT(true)
    try{
      const txt=await callNotion(`Search my Notion workspace. Query these 3 databases:
1. "Entregas" (columns: Nombre, Estado, Fecha, Tipo, Clase) — university assignments
2. "Tareas" (columns: Status, Nombre, Fecha, Prioridad, Area) — work tasks
3. "Tareas Vendify" (columns: Status, Nombre, Fecha, Prioridad, Area) — startup tasks
Return ONLY raw JSON array, no markdown, no backticks.
Each item: {"title":string,"date":string_or_null,"priority":string_or_null,"status":string_or_null,"source":"entregas"_or_"tareas"_or_"vendify","area":string_or_null}
Dates ISO YYYY-MM-DD. Max 40 items. Return [] if nothing found.`)
      setTasks(JSON.parse(txt.replace(/```json|```/g,'').trim()))
    }catch{setTasks([])}
    setLoadT(false)
  }
  const fetchEvents = async()=>{
    setLoadE(true)
    try{
      const txt=await callNotion(`Search my Notion "Eventos AC" database (columns: Nombre, Fecha, Prioridad, Status, Assignee).
Return ONLY raw JSON array, no markdown, no backticks.
Each item: {"title":string,"date":string_or_null,"priority":string_or_null,"status":string_or_null}
Dates ISO YYYY-MM-DD. Max 20 items. Return [] if nothing.`)
      setNEvts(JSON.parse(txt.replace(/```json|```/g,'').trim()))
    }catch{setNEvts([])}
    setLoadE(false)
  }
  const addTask = async()=>{
    if(!ntTitle)return;setAddingT(true)
    const db=ntSrc==='entregas'?'Entregas':ntSrc==='vendify'?'Tareas Vendify':'Tareas'
    try{await callNotion(`Create a new page in my Notion "${db}" database: Nombre="${ntTitle}", Prioridad="${ntPrio}"${ntDate?`, Fecha="${ntDate}"`:''}.`,300)}catch{}
    setAddingT(false);setShowAddT(false);setNtTitle('');setNtDate('');fetchTasks()
  }

  const inp = {width:'100%',padding:'10px 13px',borderRadius:10,border:`0.5px solid ${C.bor}`,background:C.surf2,color:C.txt,fontSize:13,outline:'none',fontFamily:'inherit'}
  const timeStr = now.toLocaleTimeString('es-PE',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:true})
  const dateStr = now.toLocaleDateString('es-PE',{weekday:'long',day:'numeric',month:'long'})

  return (
    <div style={{background:C.bg,color:C.txt,height:'100dvh',fontFamily:'-apple-system,BlinkMacSystemFont,"SF Pro Text",system-ui,sans-serif',display:'flex',flexDirection:'column',overflow:'hidden',maxWidth:430,margin:'0 auto',position:'relative'}}>

      {/* Edit schedule panel (overlay) */}
      {editingSched&&(
        <EditSchedulePanel
          sched={sched}
          onSave={s=>{saveS(s);setEditingSched(false)}}
          onClose={()=>setEditingSched(false)}
        />
      )}

      {/* HEADER */}
      <div style={{padding:'14px 20px 13px',borderBottom:`0.5px solid ${C.bor}`,display:'flex',justifyContent:'space-between',alignItems:'center',flexShrink:0,background:C.bg}}>
        <div>
          <div style={{fontSize:10,color:C.mut,letterSpacing:'0.14em',textTransform:'uppercase',marginBottom:1}}>My App</div>
          <div style={{fontSize:20,fontWeight:600,letterSpacing:'-0.02em'}}>Mauricio</div>
        </div>
        <div style={{width:40,height:40,borderRadius:20,background:`${C.grn}15`,border:`1px solid ${C.grn}30`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:700,color:C.grn,flexShrink:0}}>M</div>
      </div>

      {/* CONTENT */}
      <div style={{flex:1,overflowY:'auto',padding:'16px 18px',WebkitOverflowScrolling:'touch'}}>

        {/* ══ HOY ══ */}
        {tab==='hoy'&&<>
          <div style={{marginBottom:20}}>
            <div style={{fontSize:11,color:C.mut,textTransform:'capitalize',marginBottom:4}}>{dateStr}</div>
            <div style={{fontSize:42,fontWeight:200,letterSpacing:'-0.04em',fontVariantNumeric:'tabular-nums',lineHeight:1}}>{timeStr}</div>
            <div style={{display:'flex',alignItems:'center',gap:8,marginTop:10}}>
              <div style={{display:'flex',gap:3}}>{HABITS.map(h=><div key={h.id} style={{width:5,height:5,borderRadius:'50%',background:todayH[h.id]?C.grn:'rgba(255,255,255,0.1)'}}/>)}</div>
              <span style={{fontSize:11,color:C.mut}}>{hDone}/{HABITS.length} hábitos completados</span>
            </div>
          </div>

          <Sec>Ahora mismo</Sec>
          {curBlock?(
            <Card accent={BCOL[curBlock.t]||C.grn} style={{marginBottom:12}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
                <div style={{flex:1,paddingRight:8}}>
                  <div style={{fontSize:16,fontWeight:500,marginBottom:3}}>{curBlock.a}</div>
                  <div style={{fontSize:12,color:C.mut}}>{fmt12(curBlock.s)} – {fmt12(curBlock.e)}</div>
                </div>
                <Pill color={BCOL[curBlock.t]||C.grn}>{BLBL[curBlock.t]||'Personal'}</Pill>
              </div>
              <div style={{height:3,background:'rgba(255,255,255,0.07)',borderRadius:2,overflow:'hidden'}}>
                <div style={{height:'100%',borderRadius:2,width:`${bpct(curBlock,nowM)}%`,background:BCOL[curBlock.t]||C.grn,transition:'width 1s linear'}}/>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',marginTop:5}}>
                <span style={{fontSize:11,color:C.mut}}>{fmt12(curBlock.s)}</span>
                <span style={{fontSize:11,color:BCOL[curBlock.t]||C.grn,fontWeight:600}}>{bpct(curBlock,nowM)}%</span>
                <span style={{fontSize:11,color:C.mut}}>{fmt12(curBlock.e)}</span>
              </div>
            </Card>
          ):(
            <Card style={{marginBottom:12,textAlign:'center'}}><span style={{fontSize:12,color:C.mut}}>Sin bloque activo en este momento</span></Card>
          )}

          {upcoming.length>0&&<>
            <Sec>A continuación</Sec>
            {upcoming.map((b,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 4px',borderBottom:`0.5px solid ${C.bor}`}}>
                <div style={{width:2,height:32,borderRadius:2,background:BCOL[b.t]||C.grn,flexShrink:0}}/>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:500}}>{b.a}</div>
                  <div style={{fontSize:11,color:C.mut,marginTop:2}}>{fmt12(b.s)} – {fmt12(b.e)}</div>
                </div>
                <Pill color={BCOL[b.t]||C.grn}>{BLBL[b.t]||'Personal'}</Pill>
              </div>
            ))}
          </>}

          <div style={{marginTop:18}}>
            <Sec>Hábitos de hoy</Sec>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
              {HABITS.map(h=>{const done=!!todayH[h.id];return(
                <div key={h.id} onClick={()=>togH(h.id)} style={{background:done?`${C.grn}10`:C.surf,border:`0.5px solid ${done?C.grn:C.bor}`,borderRadius:12,padding:'10px 12px',cursor:'pointer',display:'flex',alignItems:'center',gap:9}}>
                  <div style={{width:17,height:17,borderRadius:4,flexShrink:0,border:`1.5px solid ${done?C.grn:'rgba(255,255,255,0.2)'}`,background:done?C.grn:'transparent',display:'flex',alignItems:'center',justifyContent:'center'}}>
                    {done&&<span style={{color:'#000',fontSize:10,fontWeight:800,lineHeight:1}}>✓</span>}
                  </div>
                  <span style={{fontSize:12,color:done?C.grn:C.txt,fontWeight:done?500:400}}>{h.label}</span>
                </div>
              )})}
            </div>
          </div>
        </>}

        {/* ══ SEMANA ══ */}
        {tab==='semana'&&<>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
            <div style={{display:'flex',gap:5,overflowX:'auto',flex:1,paddingBottom:2,WebkitOverflowScrolling:'touch'}}>
              {DKS.map(d=>(
                <button key={d} onClick={()=>setSelDay(d)} style={{flexShrink:0,padding:'6px 11px',borderRadius:20,cursor:'pointer',border:`0.5px solid ${activeDay===d?C.grn:C.bor}`,background:activeDay===d?`${C.grn}15`:'transparent',color:activeDay===d?C.grn:C.mut,fontSize:12,fontWeight:activeDay===d?600:400,fontFamily:'inherit'}}>
                  {DNAMES[d].slice(0,3)}
                </button>
              ))}
            </div>
            <button onClick={()=>setEditingSched(true)} style={{flexShrink:0,display:'flex',alignItems:'center',gap:5,background:'transparent',border:`0.5px solid ${C.bor}`,borderRadius:9,padding:'6px 10px',color:C.mut,cursor:'pointer',fontSize:11,fontFamily:'inherit',whiteSpace:'nowrap'}}>
              <Icon name="edit" size={12} color={C.mut}/> Editar
            </button>
          </div>

          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14}}>
            <span style={{fontSize:17,fontWeight:500}}>{DNAMES[activeDay]}</span>
            {activeDay===dk&&<Pill color={C.grn}>hoy</Pill>}
          </div>

          {activeAll.length===0?(
            <Card style={{textAlign:'center'}}><span style={{fontSize:13,color:C.mut}}>Día libre 🎉</span></Card>
          ):activeAll.map((b,i)=>(
            <div key={b.id||i} style={{display:'flex',alignItems:'center',gap:11,padding:aCurIdx===i?'10px 13px':'9px 4px',background:aCurIdx===i?`${BCOL[b.t]||C.grn}10`:'transparent',borderBottom:`0.5px solid ${C.bor}`,borderRadius:aCurIdx===i?11:0,marginBottom:aCurIdx===i?2:0}}>
              <div style={{width:2,height:32,borderRadius:2,background:BCOL[b.t]||C.amb,flexShrink:0}}/>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:aCurIdx===i?500:400}}>{b.a}</div>
                <div style={{fontSize:11,color:C.mut,marginTop:2}}>{fmt12(b.s)} – {fmt12(b.e)}</div>
              </div>
              {!b._fixed&&(
                <button onClick={()=>{const evts={...localEvts};evts[activeDK]=(evts[activeDK]||[]).filter(e=>e.id!==b.id);saveE(evts)}} style={{background:'none',border:'none',color:C.mut,cursor:'pointer',fontSize:17,padding:'0 6px',lineHeight:1}}>×</button>
              )}
            </div>
          ))}

          {showAddEvt?(
            <Card style={{marginTop:12}}>
              <div style={{fontSize:13,fontWeight:500,marginBottom:12}}>Nuevo evento personal</div>
              <input placeholder="Nombre del evento" value={evtTitle} onChange={e=>setEvtTitle(e.target.value)} style={{...inp,marginBottom:10}}/>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:9,marginBottom:12}}>
                <div><div style={{fontSize:11,color:C.mut,marginBottom:4}}>Inicio</div><input type="time" value={evtStart} onChange={e=>setEvtStart(e.target.value)} style={inp}/></div>
                <div><div style={{fontSize:11,color:C.mut,marginBottom:4}}>Fin</div><input type="time" value={evtEnd} onChange={e=>setEvtEnd(e.target.value)} style={inp}/></div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:9}}>
                <Btn variant="outline" onClick={()=>{setShowAddEvt(false);setEvtTitle('');setEvtStart('');setEvtEnd('')}} style={{width:'100%'}}>Cancelar</Btn>
                <Btn variant="primary" onClick={()=>{if(!evtTitle||!evtStart||!evtEnd)return;const evts={...localEvts};evts[activeDK]=[...(evts[activeDK]||[]),{id:uid(),s:evtStart,e:evtEnd,a:evtTitle}];saveE(evts);setShowAddEvt(false);setEvtTitle('');setEvtStart('');setEvtEnd('')}} style={{width:'100%'}}>Agregar</Btn>
              </div>
            </Card>
          ):<Btn variant="ghost" onClick={()=>setShowAddEvt(true)} style={{width:'100%',marginTop:12}}>+ Agregar evento personal</Btn>}
        </>}

        {/* ══ TAREAS ══ */}
        {tab==='tareas'&&<>
          <div style={{display:'flex',gap:5,marginBottom:14,overflowX:'auto',paddingBottom:2}}>
            {[['all','Todas'],['entregas','Uni'],['tareas','Trabajo'],['vendify','Vendify']].map(([k,l])=>(
              <button key={k} onClick={()=>setTFilter(k)} style={{flexShrink:0,padding:'7px 13px',borderRadius:20,cursor:'pointer',border:`0.5px solid ${tFilter===k?C.grn:C.bor}`,background:tFilter===k?`${C.grn}15`:'transparent',color:tFilter===k?C.grn:C.mut,fontSize:12,fontWeight:tFilter===k?600:400,fontFamily:'inherit'}}>{l}</button>
            ))}
          </div>

          {tasks===null?(
            <div style={{textAlign:'center',paddingTop:32}}>
              <div style={{fontSize:32,marginBottom:12}}>📋</div>
              <div style={{fontSize:13,color:C.mut,marginBottom:16,lineHeight:1.6}}>Conecta Notion para ver tus tareas</div>
              <Btn variant="primary" onClick={fetchTasks} style={{width:'100%'}}>Cargar tareas de Notion</Btn>
            </div>
          ):loadT?(
            <div style={{textAlign:'center',padding:'40px 0',color:C.mut,fontSize:13}}>Cargando tareas...</div>
          ):<>
            {[['Hoy',tToday],['Mañana',tTmrw],['Próximas',tUp],['Sin fecha',tNone]].map(([label,items])=>items.length>0&&(
              <div key={label}>
                <Sec>{label}</Sec>
                {items.map((t,i)=>(
                  <Card key={i} style={{marginBottom:8}}>
                    <div style={{fontSize:13,fontWeight:500,marginBottom:7}}>{t.title}</div>
                    <div style={{display:'flex',gap:5,flexWrap:'wrap',alignItems:'center'}}>
                      <Pill color={t.source==='entregas'?C.blu:t.source==='vendify'?C.grn:C.amb}>{t.source==='entregas'?'Uni':t.source==='vendify'?'Vendify':'Trabajo'}</Pill>
                      {t.priority&&<Pill color={pcolor(t.priority)}>{t.priority}</Pill>}
                      {t.status&&<span style={{fontSize:11,color:C.mut}}>{t.status}</span>}
                    </div>
                  </Card>
                ))}
              </div>
            ))}
            {ftasks.length===0&&<div style={{textAlign:'center',padding:28,color:C.mut,fontSize:13}}>Sin tareas en esta categoría</div>}
          </>}

          {showAddT?(
            <Card style={{marginTop:10}}>
              <div style={{fontSize:13,fontWeight:500,marginBottom:12}}>Nueva tarea en Notion</div>
              <input placeholder="Nombre de la tarea" value={ntTitle} onChange={e=>setNtTitle(e.target.value)} style={{...inp,marginBottom:10}}/>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:9,marginBottom:10}}>
                <div><div style={{fontSize:11,color:C.mut,marginBottom:4}}>Base de datos</div>
                  <select value={ntSrc} onChange={e=>setNtSrc(e.target.value)} style={inp}><option value="tareas">Trabajo</option><option value="entregas">Uni</option><option value="vendify">Vendify</option></select>
                </div>
                <div><div style={{fontSize:11,color:C.mut,marginBottom:4}}>Prioridad</div>
                  <select value={ntPrio} onChange={e=>setNtPrio(e.target.value)} style={inp}><option value="Alta">Alta</option><option value="Media">Media</option><option value="Baja">Baja</option></select>
                </div>
              </div>
              <div style={{marginBottom:12}}><div style={{fontSize:11,color:C.mut,marginBottom:4}}>Fecha (opcional)</div><input type="date" value={ntDate} onChange={e=>setNtDate(e.target.value)} style={inp}/></div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:9}}>
                <Btn variant="outline" onClick={()=>{setShowAddT(false);setNtTitle('');setNtDate('')}} style={{width:'100%'}}>Cancelar</Btn>
                <Btn variant="primary" disabled={!ntTitle||addingT} onClick={addTask} style={{width:'100%'}}>{addingT?'Guardando...':'Guardar'}</Btn>
              </div>
            </Card>
          ):(
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:9,marginTop:10}}>
              <Btn variant="ghost" onClick={()=>setShowAddT(true)} style={{width:'100%'}}>+ Nueva tarea</Btn>
              {tasks!==null&&<Btn variant="outline" onClick={fetchTasks} style={{width:'100%'}}>↻ Actualizar</Btn>}
            </div>
          )}
        </>}

        {/* ══ EVENTOS ══ */}
        {tab==='eventos'&&<>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
            <span style={{fontSize:17,fontWeight:500}}>Eventos AC</span>
            {nEvts!==null&&!loadE&&<button onClick={fetchEvents} style={{background:'none',border:'none',color:C.mut,cursor:'pointer',padding:4,display:'flex'}}><Icon name="refresh" size={18} color={C.mut}/></button>}
          </div>
          {nEvts===null?(
            <div style={{textAlign:'center',paddingTop:32}}>
              <div style={{fontSize:32,marginBottom:12}}>🗓</div>
              <div style={{fontSize:13,color:C.mut,marginBottom:16}}>Carga tus eventos desde Notion</div>
              <Btn variant="primary" onClick={fetchEvents} style={{width:'100%'}}>Cargar eventos</Btn>
            </div>
          ):loadE?(<div style={{textAlign:'center',padding:'40px 0',color:C.mut,fontSize:13}}>Cargando...</div>
          ):nEvts.length===0?(<div style={{textAlign:'center',padding:28,color:C.mut,fontSize:13}}>No hay eventos próximos</div>
          ):nEvts.map((e,i)=>(
            <Card key={i} style={{marginBottom:9}}>
              <div style={{fontSize:14,fontWeight:500,marginBottom:6}}>{e.title}</div>
              {e.date&&<div style={{fontSize:12,color:C.mut,marginBottom:6}}>{e.date}</div>}
              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                {e.status&&<Pill color={scol(e.status)}>{e.status}</Pill>}
                {e.priority&&<Pill color={pcolor(e.priority)}>{e.priority}</Pill>}
              </div>
            </Card>
          ))}
        </>}

        {/* ══ PERFIL ══ */}
        {tab==='perfil'&&<>
          <Sec>Hábitos — últimos 7 días</Sec>
          <Card style={{marginBottom:14,overflowX:'auto'}}>
            <div style={{display:'grid',gridTemplateColumns:'68px repeat(7,1fr)',gap:4,marginBottom:6,minWidth:290}}>
              <div/>
              {labs7.map((l,i)=><div key={i} style={{textAlign:'center',fontSize:10,color:days7[i]===dateKey?C.grn:C.hint,fontWeight:days7[i]===dateKey?700:400}}>{l}</div>)}
            </div>
            {HABITS.map(h=>{
              let streak=0;for(let i=days7.length-1;i>=0;i--){if(habits[days7[i]]?.[h.id])streak++;else break}
              return(
                <div key={h.id} style={{display:'grid',gridTemplateColumns:'68px repeat(7,1fr)',gap:4,marginBottom:4,alignItems:'center',minWidth:290}}>
                  <div style={{display:'flex',alignItems:'center',gap:3,overflow:'hidden'}}>
                    <span style={{fontSize:11,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{h.label}</span>
                    {streak>1&&<span style={{fontSize:9,color:C.grn,fontWeight:700,flexShrink:0}}>{streak}d</span>}
                  </div>
                  {days7.map((dk2,i)=>(
                    <div key={i} onClick={()=>togH(h.id,dk2)} style={{height:22,borderRadius:5,cursor:'pointer',background:habits[dk2]?.[h.id]?C.grn:'rgba(255,255,255,0.05)',border:`0.5px solid ${habits[dk2]?.[h.id]?C.grn:'rgba(255,255,255,0.07)'}`,display:'flex',alignItems:'center',justifyContent:'center'}}>
                      {habits[dk2]?.[h.id]&&<span style={{color:'#000',fontSize:9,fontWeight:800}}>✓</span>}
                    </div>
                  ))}
                </div>
              )
            })}
          </Card>

          <Sec>Metas</Sec>
          {goals.map(g=>{
            const range=g.target-g.start;const pct=range===0?0:Math.min(100,Math.round(((g.current-g.start)/range)*100));
            return(
              <Card key={g.id} style={{marginBottom:9}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:11}}>
                  <div><Pill color={g.color}>{g.cat}</Pill><div style={{fontSize:13,fontWeight:500,marginTop:5}}>{g.label}</div></div>
                  {editGid===g.id?(
                    <div style={{display:'flex',gap:5,alignItems:'center',flexShrink:0}}>
                      <input type="number" value={editGval} onChange={e=>setEditGval(e.target.value)} style={{width:52,fontSize:13,padding:'5px 7px',borderRadius:7,border:`0.5px solid ${C.bor}`,background:C.surf2,color:C.txt,textAlign:'center'}} autoFocus/>
                      <button onClick={()=>{saveG(goals.map(x=>x.id===g.id?{...x,current:parseFloat(editGval)||x.current}:x));setEditGid(null)}} style={{fontSize:13,padding:'5px 9px',background:C.grn,color:'#000',border:'none',borderRadius:7,cursor:'pointer',fontWeight:700}}>✓</button>
                      <button onClick={()=>setEditGid(null)} style={{fontSize:13,padding:'5px 8px',background:'transparent',color:C.mut,border:`0.5px solid ${C.bor}`,borderRadius:7,cursor:'pointer'}}>✕</button>
                    </div>
                  ):(
                    <div onClick={()=>{setEditGid(g.id);setEditGval(String(g.current))}} style={{cursor:'pointer',textAlign:'right',flexShrink:0}}>
                      <span style={{fontSize:22,fontWeight:500}}>{g.current}</span>
                      <span style={{fontSize:11,color:C.mut}}>/{g.target} {g.unit}</span>
                    </div>
                  )}
                </div>
                <div style={{height:4,background:'rgba(255,255,255,0.07)',borderRadius:2,overflow:'hidden',marginBottom:5}}>
                  <div style={{height:'100%',width:`${pct}%`,background:g.color,borderRadius:2}}/>
                </div>
                <div style={{fontSize:11,color:C.mut}}>{pct}% completado</div>
              </Card>
            )
          })}

          <Card style={{marginBottom:9}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:10}}>
              <div>
                <div style={{fontSize:13,fontWeight:500,marginBottom:2}}>Notificaciones</div>
                <div style={{fontSize:11,color:C.mut}}>Aviso al inicio de cada bloque</div>
              </div>
              <Pill color={notifP==='granted'?C.grn:notifP==='denied'?C.red:C.amb}>
                {notifP==='granted'?'Activas':notifP==='denied'?'Bloqueadas':'Pendiente'}
              </Pill>
            </div>
            {notifP!=='granted'&&notifP!=='denied'&&(
              <Btn variant="primary" onClick={()=>Notification.requestPermission().then(p=>setNotifP(p))} style={{width:'100%',marginTop:12}}>Activar notificaciones</Btn>
            )}
            {notifP==='denied'&&(
              <div style={{fontSize:11,color:C.mut,marginTop:10,lineHeight:1.5}}>
                Ajustes → Safari → esta página → Notificaciones → Permitir.
              </div>
            )}
          </Card>
        </>}

      </div>

      {/* BOTTOM NAV */}
      <div style={{borderTop:`0.5px solid ${C.bor}`,background:'#0C0C0C',display:'flex',flexShrink:0,paddingBottom:'env(safe-area-inset-bottom,6px)'}}>
        {[['hoy','Hoy','clock'],['semana','Semana','cal'],['tareas','Tareas','check'],['eventos','Eventos','list'],['perfil','Perfil','user']].map(([id,lbl,ico])=>(
          <button key={id} onClick={()=>setTab(id)} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:3,padding:'9px 0',background:'none',border:'none',cursor:'pointer',color:tab===id?C.grn:'rgba(255,255,255,0.25)',fontFamily:'inherit'}}>
            <Icon name={ico} size={21} color={tab===id?C.grn:'rgba(255,255,255,0.25)'} sw={tab===id?2:1.5}/>
            <span style={{fontSize:10,fontWeight:tab===id?600:400}}>{lbl}</span>
          </button>
        ))}
      </div>
    </div>
  )
}