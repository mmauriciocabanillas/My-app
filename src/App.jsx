import { useState, useEffect, useRef } from "react"

// ─── TOKENS ───────────────────────────────────────────────────────────────────
const C = {
  bg:'#080808', surf:'#111111', surf2:'#181818',
  bor:'rgba(255,255,255,0.07)', bor2:'rgba(255,255,255,0.12)',
  txt:'#F5F5F5', mut:'rgba(255,255,255,0.38)', hint:'rgba(255,255,255,0.18)',
  grn:'#2DD48A', blu:'#5B9CF6', amb:'#F5A623', red:'#F06D6D', pur:'#9F7AEA',
}

const S = {
  get: k => { try { const v=localStorage.getItem(k); return v?JSON.parse(v):null } catch { return null } },
  set: (k,v) => { try { localStorage.setItem(k,JSON.stringify(v)) } catch {} },
}

const DKS    = ['lun','mar','mie','jue','vie','sab','dom']
const DNAMES = { lun:'Lunes', mar:'Martes', mie:'Miércoles', jue:'Jueves', vie:'Viernes', sab:'Sábado', dom:'Domingo' }
const gdk    = (d=new Date()) => DKS[(d.getDay()+6)%7]

const SCHED_DEFAULT = {
  lun:[
    {id:'lun1',s:'14:00',e:'18:00',t:'uni',a:'Base de Datos'},
    {id:'lun2',s:'18:00',e:'21:30',t:'gym',a:'Gym — Piernas'},
  ],
  mar:[
    {id:'mar1',s:'09:00',e:'13:00',t:'uni',a:'Ingeniería de Software'},
    {id:'mar2',s:'18:00',e:'21:30',t:'gym',a:'Gym — Empuje'},
  ],
  mie:[
    {id:'mie1',s:'07:00',e:'11:00',t:'uni',a:'Técnicas Digitales'},
    {id:'mie2',s:'14:00',e:'16:00',t:'uni',a:'Base de Datos'},
    {id:'mie3',s:'16:00',e:'18:00',t:'uni',a:'Inteligencia Artificial'},
    {id:'mie4',s:'18:00',e:'20:00',t:'uni',a:'Metodología Inv. Científica'},
  ],
  jue:[
    {id:'jue1',s:'11:00',e:'13:00',t:'uni',a:'Ingeniería de Software'},
    {id:'jue2',s:'18:00',e:'21:30',t:'gym',a:'Gym — Tracción'},
  ],
  vie:[
    {id:'vie1',s:'08:00',e:'10:00',t:'uni',a:'Inteligencia Artificial'},
    {id:'vie2',s:'18:00',e:'21:30',t:'gym',a:'Gym — Brazos/Hombros'},
  ],
  sab:[],dom:[],
}

const BCOL  = {uni:C.blu,gym:C.pur,personal:C.amb}
const BLBL  = {uni:'Universidad',gym:'Gym',personal:'Personal'}
const BTYPES = [
  {val:'uni',label:'Universidad',color:C.blu},
  {val:'gym',label:'Gym',color:C.pur},
  {val:'personal',label:'Personal',color:C.amb},
]

const HABITS_DEFAULT = [
  {id:'gym',label:'Gym'},{id:'agua',label:'Agua 2L'},
  {id:'desayuno',label:'Desayuno'},{id:'almuerzo',label:'Almuerzo'},
  {id:'cena',label:'Cena'},{id:'vendify',label:'Vendify'},{id:'sueno',label:'Sueño +7h'},
]

const CI_C1 = [
  {id:'f0',label:'Fase 0'},{id:'f1',label:'Fase 1'},{id:'f2',label:'Fase 2'},
  {id:'f3',label:'Fase 3'},{id:'f5',label:'Fase 5'},{id:'f6',label:'Fase 6'},
  {id:'f7',label:'Fase 7'},{id:'f8',label:'Fase 8'},
]

const GOALS0 = [
  {id:'peso',    cat:'Gym',         label:'Peso corporal',     unit:'kg', current:67, target:75,  start:67, color:C.pur, type:'progress'},
  {id:'vendify', cat:'Vendify',     label:'F1 Discovery — C1', unit:'',   current:0,  target:0,   start:0,  color:C.grn, type:'ci'},
  {id:'ciclo',   cat:'Universidad', label:'Aprobar ciclo',     unit:'%',  current:0,  target:100, start:0,  color:C.blu, type:'progress'},
  {id:'finanzas',cat:'Finanzas',    label:'Balance',           unit:'S/', current:0,  target:500, start:0,  color:C.amb, type:'finanzas'},
]

const DB = {
  entregas:'312fa6d36749815592bef82e1b68cd97',
  tareas:  '312fa6d367498156a513c581584086f4',
  vendify: '323fa6d3674980dd97e9cd1063089d0d',
  eventos: '314fa6d3674980f0b60be274e1a5d12a',
  clases:  '312fa6d3674981d8a2c2d1befc5d7a19',
  areas:   '312fa6d36749813b8702f2bbe80c8021',
  diet:    '312fa6d36749810ba045e3b2b50f609e',
}

const STATUS_ENTREGAS = ['Sin empezar','En planificacion','En progreso','En revision','Acabada']
const TIPO_ENTREGAS   = ['Edición Video','Edición Foto','Investigación','Trabajo']
const STATUS_TAREAS   = ['Proxima accion','Esta semana no','Algún día','Agenda','En curso','A la espera','Completado']
const STATUS_EVENTOS  = ['Agendada','Realizada','En edicion','Completada']
const PRIO_TAREAS     = ['Baja','Media','Alta','Urgente']
const PRIO_EVENTOS    = ['Media','Alta']

// ─── UTILS ────────────────────────────────────────────────────────────────────
const pt    = s => { if(!s)return 0; const[h,m]=s.split(':').map(Number); return h*60+(m||0) }
const fmt12 = t => { if(!t)return''; const[h,m]=t.split(':').map(Number); return `${h%12||12}:${String(m).padStart(2,'0')} ${h>=12?'PM':'AM'}` }
const ldk   = (d=new Date()) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
const bpct  = (b,nowM) => { const s=pt(b.s),e=pt(b.e); if(nowM<s||nowM>=e)return 0; return Math.min(100,Math.round(((nowM-s)/(e-s))*100)) }
const uid   = () => Math.random().toString(36).slice(2,9)
const dayKeyForDK = (dk,ref=new Date()) => { const d=new Date(ref),ci=(d.getDay()+6)%7,ti=DKS.indexOf(dk); d.setDate(d.getDate()+(ti-ci)); return ldk(d) }
const pcolor = p => { if(!p)return C.mut; const l=p.toLowerCase(); if(l.includes('alta')||l.includes('urgente'))return C.red; if(l.includes('media'))return C.amb; return C.grn }
const scol   = s => { if(!s)return C.mut; const l=s.toLowerCase(); if(l.includes('complet')||l.includes('acabada')||l.includes('realizada'))return C.grn; if(l.includes('edic')||l.includes('progreso')||l.includes('curso'))return C.blu; if(l.includes('agenda'))return C.amb; return C.mut }

// ─── VAPID ────────────────────────────────────────────────────────────────────
const VAPID_PUBLIC_KEY = typeof import.meta !== 'undefined' ? (import.meta.env?.VITE_VAPID_PUBLIC_KEY || '') : ''

function urlBase64ToUint8Array(b64) {
  const pad = '='.repeat((4-b64.length%4)%4)
  const base64 = (b64+pad).replace(/-/g,'+').replace(/_/g,'/')
  const raw = atob(base64)
  return new Uint8Array([...raw].map(c=>c.charCodeAt(0)))
}

// ─── NOTION API ───────────────────────────────────────────────────────────────
const nFetch = async (endpoint, body={}, method='POST') => {
  const res = await fetch('/api/notion', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({endpoint, body, method}),
  })
  return res.json()
}
const notionQuery  = dbId  => nFetch(`databases/${dbId}/query`, {page_size:100})
const notionCreate = (dbId,props) => nFetch('pages', {parent:{database_id:dbId}, properties:props})
const notionUpdate = (pageId,props) => nFetch(`pages/${pageId}`, {properties:props}, 'PATCH')
const notionBlocks = pageId => nFetch(`blocks/${pageId}/children`, {}, 'GET')

// ─── PARSERS ──────────────────────────────────────────────────────────────────
const getTitle = (props,key='Nombre') => props[key]?.title?.map(t=>t.plain_text).join('') || ''
const getDate  = props => { for(const k of ['Fecha','fecha']) if(props[k]?.date?.start) return props[k].date.start.slice(0,10); return null }
const getSel   = (props,key) => props[key]?.select?.name || props[key]?.status?.name || null

const parseRelOpts = results => (results||[]).map(p => {
  const props = p.properties
  const name =
    getTitle(props,'Nombre') || getTitle(props,'Name') ||
    Object.values(props).find(v=>v.type==='title')?.title?.map(t=>t.plain_text).join('') || ''
  return {id:p.id, name}
}).filter(o=>o.name)

const parseEntregas = rs => rs.map(p=>({id:p.id, title:getTitle(p.properties,'Nombre'), date:getDate(p.properties), status:getSel(p.properties,'Estado'), tipo:getSel(p.properties,'Tipo'), priority:null, source:'entregas'})).filter(t=>t.title)
const parseTareas   = (rs,src) => rs.map(p=>({id:p.id, title:getTitle(p.properties,'Nombre'), date:getDate(p.properties), status:getSel(p.properties,'Status'), priority:getSel(p.properties,'Prioridad'), source:src})).filter(t=>t.title)
const parseEventos  = rs => rs.map(p=>({id:p.id, title:getTitle(p.properties,'Nombre'), date:getDate(p.properties), status:getSel(p.properties,'Status'), priority:getSel(p.properties,'Prioridad')})).filter(e=>e.title)

const parseBlocks = blocks => (blocks||[]).map((b,i)=>{
  const t = b.type
  const rich = b[t]?.rich_text||[]
  const text = rich.map(r=>r.plain_text).join('')
  if(t==='heading_1') return {key:i,type:'h1',text}
  if(t==='heading_2') return {key:i,type:'h2',text}
  if(t==='heading_3') return {key:i,type:'h3',text}
  if(t==='bulleted_list_item') return {key:i,type:'bullet',text}
  if(t==='numbered_list_item') return {key:i,type:'num',text}
  if(t==='paragraph') return text?{key:i,type:'p',text}:{key:i,type:'spacer'}
  if(t==='divider') return {key:i,type:'divider'}
  if(t==='child_database') return {key:i,type:'db',title:b.child_database?.title||'Tabla'}
  return text?{key:i,type:'p',text}:null
}).filter(Boolean)

// ─── ICONS ────────────────────────────────────────────────────────────────────
const Icon = ({name,size=22,color='currentColor',sw=1.7}) => {
  const p = {fill:'none',stroke:color,strokeWidth:sw,strokeLinecap:'round',strokeLinejoin:'round'}
  const s = {width:size,height:size,display:'block',flexShrink:0}
  const svg = ch => <svg style={s} viewBox="0 0 24 24" {...p}>{ch}</svg>
  switch(name){
    case 'clock':    return svg(<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>)
    case 'cal':      return svg(<><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>)
    case 'check':    return svg(<><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></>)
    case 'list':     return svg(<><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></>)
    case 'user':     return svg(<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>)
    case 'edit':     return svg(<><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>)
    case 'trash':    return svg(<><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></>)
    case 'plus':     return svg(<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>)
    case 'arrow':    return svg(<><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></>)
    case 'refresh':  return svg(<><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></>)
    case 'bell':     return svg(<><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></>)
    case 'chevron':  return svg(<polyline points="6 9 12 15 18 9"/>)
    case 'chevup':   return svg(<polyline points="18 15 12 9 6 15"/>)
    case 'x':        return svg(<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>)
    case 'salad':    return svg(<><path d="M2.27 21.7s9.87-3.5 12.73-6.36a4.5 4.5 0 0 0-6.36-6.37C5.77 11.84 2.27 21.7 2.27 21.7z"/><path d="M8.64 14.36c0 0 2.36-4.4 7.41-4.84"/><path d="M20.73 6.09a4.5 4.5 0 0 0-6.36 0c-2.86 2.87-6.36 12.73-6.36 12.73s9.87-3.5 12.73-6.36a4.5 4.5 0 0 0-.01-6.37z"/></>)
    default: return null
  }
}

// ─── SMALL COMPONENTS ────────────────────────────────────────────────────────
const Pill = ({color,children}) => (
  <span style={{display:'inline-flex',alignItems:'center',fontSize:10,padding:'2px 7px',borderRadius:99,background:`${color}20`,color,fontWeight:600,letterSpacing:'0.02em',whiteSpace:'nowrap',lineHeight:'16px'}}>{children}</span>
)
const Sec = ({children,action}) => (
  <div style={{fontSize:10,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.1em',color:C.hint,marginBottom:6,marginTop:2,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
    <span>{children}</span>
    {action&&<span>{action}</span>}
  </div>
)
const Card = ({children,accent,style={}}) => (
  <div style={{background:C.surf,borderRadius:12,padding:'11px 13px',border:`0.5px solid ${C.bor}`,borderLeft:accent?`3px solid ${accent}`:undefined,...style}}>{children}</div>
)
const Btn = ({onClick,disabled,children,variant='outline',style={}}) => {
  const base = {borderRadius:10,padding:'10px 14px',fontSize:13,cursor:disabled?'not-allowed':'pointer',fontWeight:500,border:'none',opacity:disabled?0.5:1,fontFamily:'inherit',transition:'opacity 0.15s'}
  const v = {
    primary:{background:C.grn,color:'#000',fontWeight:700},
    outline:{background:'transparent',color:C.txt,border:`0.5px solid ${C.bor2}`},
    ghost:{background:'transparent',color:C.grn,border:`0.5px solid ${C.grn}30`},
    danger:{background:'transparent',color:C.red,border:`0.5px solid ${C.red}30`},
  }
  return <button onClick={disabled?undefined:onClick} style={{...base,...v[variant],...style}}>{children}</button>
}
const inp = (extra={}) => ({width:'100%',padding:'9px 11px',borderRadius:9,border:`0.5px solid ${C.bor}`,background:C.surf2,color:'#F5F5F5',fontSize:13,outline:'none',fontFamily:'inherit',boxSizing:'border-box',...extra})
const Inp = ({style,...props}) => <input style={inp(style)} {...props}/>
const Sel = ({style,children,...props}) => (
  <select style={inp({...style,appearance:'none',WebkitAppearance:'none'})} {...props}>{children}</select>
)

// ─── CIRCULAR PROGRESS (Finanzas) ─────────────────────────────────────────────
const CircularProgress = ({value,max=500,size=92,color=C.amb,warn=20}) => {
  const r = (size-12)/2
  const circ = 2*Math.PI*r
  const pct = max===0 ? 0 : Math.min(1,Math.max(0,value/max))
  const dash = circ*(1-pct)
  const col = value < warn ? C.red : color
  return (
    <div style={{position:'relative',width:size,height:size,flexShrink:0}}>
      <svg width={size} height={size} style={{transform:'rotate(-90deg)'}}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={6}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={col} strokeWidth={6}
          strokeDasharray={circ} strokeDashoffset={dash} strokeLinecap="round"
          style={{transition:'stroke-dashoffset 0.6s ease,stroke 0.3s'}}/>
      </svg>
      <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
        <span style={{fontSize:value>=1000?13:17,fontWeight:700,color:col,lineHeight:1}}>{value}</span>
        <span style={{fontSize:9,color:C.mut,marginTop:1}}>S/</span>
      </div>
    </div>
  )
}

// ─── EDIT SCHEDULE PANEL ──────────────────────────────────────────────────────
function EditSchedulePanel({sched,onSave,onClose}) {
  const [local,setLocal] = useState(()=>JSON.parse(JSON.stringify(sched)))
  const [adding,setAdding] = useState(null)
  const [newBlk,setNewBlk] = useState({s:'',e:'',t:'uni',a:''})

  const removeBlk = (dk,id) => setLocal(p=>({...p,[dk]:(p[dk]||[]).filter(b=>b.id!==id)}))
  const startAdd  = dk => { setAdding(dk); setNewBlk({s:'',e:'',t:'uni',a:''}) }
  const confirmAdd = () => {
    if(!newBlk.s||!newBlk.e||!newBlk.a) return
    setLocal(p=>({...p,[adding]:[...(p[adding]||[]),{...newBlk,id:uid()}].sort((a,b)=>pt(a.s)-pt(b.s))}))
    setAdding(null)
  }

  return (
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
                <Inp placeholder="Nombre" value={newBlk.a} onChange={e=>setNewBlk(p=>({...p,a:e.target.value}))} style={{marginBottom:8}}/>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:8}}>
                  <div><div style={{fontSize:10,color:C.mut,marginBottom:3}}>Inicio</div><Inp type="time" value={newBlk.s} onChange={e=>setNewBlk(p=>({...p,s:e.target.value}))}/></div>
                  <div><div style={{fontSize:10,color:C.mut,marginBottom:3}}>Fin</div><Inp type="time" value={newBlk.e} onChange={e=>setNewBlk(p=>({...p,e:e.target.value}))}/></div>
                </div>
                <div style={{marginBottom:10}}>
                  <div style={{fontSize:10,color:C.mut,marginBottom:3}}>Tipo</div>
                  <Sel value={newBlk.t} onChange={e=>setNewBlk(p=>({...p,t:e.target.value}))}>
                    {BTYPES.map(bt=><option key={bt.val} value={bt.val}>{bt.label}</option>)}
                  </Sel>
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

// ─── EDIT HABITS PANEL ────────────────────────────────────────────────────────
function EditHabitsPanel({habitsList,onSave,onClose}) {
  const [local,setLocal] = useState([...habitsList])
  const [newName,setNewName] = useState('')

  const add = () => {
    if(!newName.trim()) return
    setLocal(p=>[...p,{id:uid(),label:newName.trim()}])
    setNewName('')
  }
  const remove = id => setLocal(p=>p.filter(h=>h.id!==id))
  const update = (id,label) => setLocal(p=>p.map(h=>h.id===id?{...h,label}:h))

  return (
    <div style={{position:'absolute',inset:0,background:C.bg,zIndex:50,display:'flex',flexDirection:'column'}}>
      <div style={{padding:'11px 16px',borderBottom:`0.5px solid ${C.bor}`,display:'flex',alignItems:'center',gap:10,flexShrink:0}}>
        <button onClick={onClose} style={{background:'none',border:'none',color:C.mut,cursor:'pointer',padding:4,display:'flex'}}><Icon name="arrow" size={19} color={C.mut}/></button>
        <span style={{fontSize:15,fontWeight:600,flex:1}}>Editar hábitos</span>
        <Btn variant="primary" onClick={()=>onSave(local)} style={{padding:'7px 16px',fontSize:12}}>Guardar</Btn>
      </div>
      <div style={{flex:1,overflowY:'auto',padding:'12px 16px',WebkitOverflowScrolling:'touch'}}>
        {local.map(h=>(
          <div key={h.id} style={{display:'flex',alignItems:'center',gap:9,marginBottom:8}}>
            <Inp value={h.label} onChange={e=>update(h.id,e.target.value)} style={{flex:1}}/>
            <button onClick={()=>remove(h.id)} style={{background:'none',border:'none',color:C.red,cursor:'pointer',padding:4,display:'flex',flexShrink:0}}><Icon name="trash" size={15} color={C.red}/></button>
          </div>
        ))}
        <div style={{display:'flex',gap:8,marginTop:8}}>
          <Inp placeholder="Nuevo hábito..." value={newName} onChange={e=>setNewName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&add()} style={{flex:1}}/>
          <Btn variant="primary" onClick={add} style={{padding:'9px 14px',flexShrink:0}}>+</Btn>
        </div>
        <Btn variant="ghost" onClick={()=>onSave(HABITS_DEFAULT)} style={{width:'100%',marginTop:14}}>Restaurar por defecto</Btn>
      </div>
    </div>
  )
}

// ─── EDIT GOAL PANEL ──────────────────────────────────────────────────────────
function EditGoalPanel({goal,onSave,onClose}) {
  const [local,setLocal] = useState({...goal})
  const f = k => e => setLocal(p=>({...p,[k]:e.target.value}))
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',zIndex:100,display:'flex',alignItems:'flex-end'}}>
      <div style={{background:C.surf,width:'100%',borderRadius:'16px 16px 0 0',padding:'16px',maxHeight:'80vh',overflowY:'auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
          <span style={{fontSize:14,fontWeight:600}}>Editar meta</span>
          <button onClick={onClose} style={{background:'none',border:'none',color:C.mut,cursor:'pointer'}}><Icon name="x" size={18} color={C.mut}/></button>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:9}}>
          <div><div style={{fontSize:10,color:C.mut,marginBottom:3}}>Nombre</div><Inp value={local.label} onChange={f('label')}/></div>
          <div><div style={{fontSize:10,color:C.mut,marginBottom:3}}>Categoría</div><Inp value={local.cat} onChange={f('cat')}/></div>
          {local.type==='progress'&&<>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8}}>
              <div><div style={{fontSize:10,color:C.mut,marginBottom:3}}>Actual</div><Inp type="number" value={local.current} onChange={f('current')}/></div>
              <div><div style={{fontSize:10,color:C.mut,marginBottom:3}}>Inicio</div><Inp type="number" value={local.start} onChange={f('start')}/></div>
              <div><div style={{fontSize:10,color:C.mut,marginBottom:3}}>Meta</div><Inp type="number" value={local.target} onChange={f('target')}/></div>
            </div>
            <div><div style={{fontSize:10,color:C.mut,marginBottom:3}}>Unidad</div><Inp value={local.unit} onChange={f('unit')}/></div>
          </>}
          {local.type==='finanzas'&&<>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
              <div><div style={{fontSize:10,color:C.mut,marginBottom:3}}>Balance actual (S/)</div><Inp type="number" value={local.current} onChange={f('current')}/></div>
              <div><div style={{fontSize:10,color:C.mut,marginBottom:3}}>Referencia máx (S/)</div><Inp type="number" value={local.target} onChange={f('target')}/></div>
            </div>
          </>}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginTop:4}}>
            <Btn variant="outline" onClick={onClose} style={{width:'100%'}}>Cancelar</Btn>
            <Btn variant="primary" onClick={()=>onSave({...local,current:parseFloat(local.current)||0,target:parseFloat(local.target)||0,start:parseFloat(local.start)||0})} style={{width:'100%'}}>Guardar</Btn>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── EDIT ITEM PANEL (Tareas/Eventos) ─────────────────────────────────────────
function EditItemPanel({item,onSave,onClose}) {
  const [title,setTitle] = useState(item.title||'')
  const [date,setDate]   = useState(item.date||'')
  const [status,setStatus] = useState(item.status||'')
  const [prio,setPrio]   = useState(item.priority||'')

  const statusOpts = item.source==='entregas' ? STATUS_ENTREGAS : item.source==='eventos' ? STATUS_EVENTOS : STATUS_TAREAS
  const prioOpts   = item.source==='eventos'  ? PRIO_EVENTOS    : PRIO_TAREAS

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',zIndex:100,display:'flex',alignItems:'flex-end'}}>
      <div style={{background:C.surf,width:'100%',borderRadius:'16px 16px 0 0',padding:'16px',maxHeight:'80vh',overflowY:'auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
          <span style={{fontSize:14,fontWeight:600}}>Editar en Notion</span>
          <button onClick={onClose} style={{background:'none',border:'none',color:C.mut,cursor:'pointer'}}><Icon name="x" size={18} color={C.mut}/></button>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:9}}>
          <div><div style={{fontSize:10,color:C.mut,marginBottom:3}}>Nombre</div><Inp value={title} onChange={e=>setTitle(e.target.value)}/></div>
          <div><div style={{fontSize:10,color:C.mut,marginBottom:3}}>Fecha</div><Inp type="date" value={date} onChange={e=>setDate(e.target.value)}/></div>
          <div>
            <div style={{fontSize:10,color:C.mut,marginBottom:3}}>Estado</div>
            <Sel value={status} onChange={e=>setStatus(e.target.value)}>
              <option value="">— Sin estado —</option>
              {statusOpts.map(s=><option key={s} value={s}>{s}</option>)}
            </Sel>
          </div>
          {item.source!=='entregas'&&(
            <div>
              <div style={{fontSize:10,color:C.mut,marginBottom:3}}>Prioridad</div>
              <Sel value={prio} onChange={e=>setPrio(e.target.value)}>
                <option value="">— Sin prioridad —</option>
                {prioOpts.map(p=><option key={p} value={p}>{p}</option>)}
              </Sel>
            </div>
          )}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginTop:4}}>
            <Btn variant="outline" onClick={onClose} style={{width:'100%'}}>Cancelar</Btn>
            <Btn variant="primary" onClick={()=>onSave({title,date,status,priority:prio})} style={{width:'100%'}}>Guardar en Notion</Btn>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── BELL MODAL ───────────────────────────────────────────────────────────────
function BellModal({onClose}) {
  const [perm,setPerm] = useState(typeof Notification!=='undefined'?Notification.permission:'denied')
  const [loading,setLoading] = useState(false)

  const subscribe = async () => {
    setLoading(true)
    try {
      const p = await Notification.requestPermission()
      setPerm(p)
      if(p==='granted' && 'serviceWorker' in navigator && VAPID_PUBLIC_KEY) {
        const reg = await navigator.serviceWorker.ready
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly:true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        })
        await fetch('/api/save-subscription', {
          method:'POST',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({subscription:sub})
        })
      }
    } catch(e){console.error(e)}
    setLoading(false)
  }

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',zIndex:100,display:'flex',alignItems:'flex-end'}} onClick={onClose}>
      <div style={{background:C.surf,width:'100%',borderRadius:'16px 16px 0 0',padding:'20px 16px 32px'}} onClick={e=>e.stopPropagation()}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <div style={{display:'flex',alignItems:'center',gap:9}}>
            <Icon name="bell" size={20} color={perm==='granted'?C.grn:C.mut}/>
            <span style={{fontSize:14,fontWeight:600}}>Notificaciones</span>
          </div>
          <button onClick={onClose} style={{background:'none',border:'none',color:C.mut,cursor:'pointer'}}><Icon name="x" size={18} color={C.mut}/></button>
        </div>

        {perm==='granted'&&(
          <div style={{background:`${C.grn}10`,border:`0.5px solid ${C.grn}30`,borderRadius:10,padding:'12px 14px',marginBottom:10}}>
            <div style={{fontSize:13,color:C.grn,fontWeight:500,marginBottom:3}}>✓ Notificaciones activas</div>
            <div style={{fontSize:11,color:C.mut}}>Recibirás avisos al inicio de cada bloque del horario.</div>
          </div>
        )}
        {perm==='denied'&&(
          <div style={{background:`${C.red}10`,border:`0.5px solid ${C.red}30`,borderRadius:10,padding:'12px 14px',marginBottom:10}}>
            <div style={{fontSize:13,color:C.red,fontWeight:500,marginBottom:3}}>✕ Notificaciones bloqueadas</div>
            <div style={{fontSize:11,color:C.mut,lineHeight:1.6}}>Ve a Ajustes → Safari → esta página → Notificaciones → Permitir.</div>
          </div>
        )}
        {perm==='default'&&(
          <>
            <div style={{fontSize:12,color:C.mut,marginBottom:14,lineHeight:1.6}}>
              Activa las notificaciones para recibir avisos al inicio de cada bloque.<br/>
              <span style={{color:C.hint,fontSize:11}}>Requiere la app instalada en pantalla de inicio (iOS).</span>
            </div>
            <Btn variant="primary" onClick={subscribe} disabled={loading} style={{width:'100%'}}>
              {loading ? 'Activando...' : 'Activar notificaciones'}
            </Btn>
          </>
        )}
      </div>
    </div>
  )
}

// ─── CI GOAL CARD ─────────────────────────────────────────────────────────────
function CIGoalCard({goal,ciPhases,onTogglePhase,onEdit,onDelete}) {
  const [open,setOpen] = useState(false)
  const done  = CI_C1.filter(f=>ciPhases[f.id]).length
  const total = CI_C1.length
  const pct   = Math.round((done/total)*100)

  return (
    <Card style={{marginBottom:8}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
        <div style={{flex:1}}>
          <Pill color={goal.color}>{goal.cat}</Pill>
          <div style={{fontSize:13,fontWeight:500,marginTop:4}}>{goal.label}</div>
        </div>
        <div style={{display:'flex',gap:4,alignItems:'center',flexShrink:0}}>
          <button onClick={onEdit} style={{background:'none',border:'none',color:C.mut,cursor:'pointer',padding:4,display:'flex'}}><Icon name="edit" size={13} color={C.mut}/></button>
          <button onClick={onDelete} style={{background:'none',border:'none',color:C.red,cursor:'pointer',padding:4,display:'flex'}}><Icon name="trash" size={13} color={C.red}/></button>
        </div>
      </div>
      <div style={{height:3,background:'rgba(255,255,255,0.07)',borderRadius:2,overflow:'hidden',marginBottom:6}}>
        <div style={{height:'100%',width:`${pct}%`,background:goal.color,borderRadius:2,transition:'width 0.4s'}}/>
      </div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <span style={{fontSize:11,color:C.mut}}>{done}/{total} fases — {pct}%</span>
        <button onClick={()=>setOpen(o=>!o)} style={{background:'none',border:'none',color:C.grn,cursor:'pointer',display:'flex',alignItems:'center',gap:3,fontSize:11,fontWeight:600,fontFamily:'inherit',padding:'2px 4px'}}>
          {open?'Cerrar':'Ver fases'}
          <Icon name={open?'chevup':'chevron'} size={13} color={C.grn}/>
        </button>
      </div>
      {open&&(
        <div style={{marginTop:10,borderTop:`0.5px solid ${C.bor}`,paddingTop:10,display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
          {CI_C1.map(f=>{
            const done2 = !!ciPhases[f.id]
            return (
              <div key={f.id} onClick={()=>onTogglePhase(f.id)} style={{display:'flex',alignItems:'center',gap:7,padding:'6px 8px',background:done2?`${C.grn}10`:C.surf2,border:`0.5px solid ${done2?C.grn:C.bor}`,borderRadius:8,cursor:'pointer'}}>
                <div style={{width:14,height:14,borderRadius:3,flexShrink:0,border:`1.5px solid ${done2?C.grn:'rgba(255,255,255,0.2)'}`,background:done2?C.grn:'transparent',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  {done2&&<span style={{color:'#000',fontSize:9,fontWeight:800,lineHeight:1}}>✓</span>}
                </div>
                <span style={{fontSize:11,color:done2?C.grn:C.txt,fontWeight:done2?500:400}}>{f.label}</span>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}

// ─── FINANZAS CARD ────────────────────────────────────────────────────────────
function FinanzasCard({goal,onSave,onEdit,onDelete}) {
  const [tx,setTx]         = useState('')
  const [txAmt,setTxAmt]   = useState('')
  const [showAdd,setShowAdd] = useState(false)
  const bal = Number(goal.current)||0
  const max = Number(goal.target)||500

  const applyTx = (sign) => {
    const amt = parseFloat(txAmt)
    if(!amt||isNaN(amt)) return
    const newBal = Math.max(0, bal + sign*amt)
    onSave({...goal, current: newBal})
    setTx(''); setTxAmt(''); setShowAdd(false)
  }

  return (
    <Card style={{marginBottom:8}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
        <div style={{flex:1}}>
          <Pill color={goal.color}>{goal.cat}</Pill>
          <div style={{fontSize:13,fontWeight:500,marginTop:4}}>{goal.label}</div>
        </div>
        <div style={{display:'flex',gap:4,alignItems:'center',flexShrink:0}}>
          <button onClick={onEdit} style={{background:'none',border:'none',color:C.mut,cursor:'pointer',padding:4,display:'flex'}}><Icon name="edit" size={13} color={C.mut}/></button>
          <button onClick={onDelete} style={{background:'none',border:'none',color:C.red,cursor:'pointer',padding:4,display:'flex'}}><Icon name="trash" size={13} color={C.red}/></button>
        </div>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:10}}>
        <CircularProgress value={bal} max={max} color={goal.color}/>
        <div style={{flex:1}}>
          <div style={{fontSize:11,color:C.mut,marginBottom:6}}>de S/ {max} de referencia</div>
          {bal<20&&<div style={{fontSize:11,color:C.red,fontWeight:600,marginBottom:4}}>⚠ Balance bajo</div>}
          <div style={{display:'flex',gap:5}}>
            <button onClick={()=>setShowAdd(s=>!s)} style={{background:`${C.grn}15`,border:`0.5px solid ${C.grn}30`,borderRadius:7,padding:'5px 10px',color:C.grn,cursor:'pointer',fontSize:11,fontWeight:600,fontFamily:'inherit'}}>+ Ingresar</button>
            <button onClick={()=>setShowAdd(s=>!s)} style={{background:`${C.red}15`,border:`0.5px solid ${C.red}30`,borderRadius:7,padding:'5px 10px',color:C.red,cursor:'pointer',fontSize:11,fontWeight:600,fontFamily:'inherit'}}>− Gasto</button>
          </div>
        </div>
      </div>
      {showAdd&&(
        <div style={{borderTop:`0.5px solid ${C.bor}`,paddingTop:10}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr auto auto',gap:7,alignItems:'center'}}>
            <Inp placeholder="Monto S/" type="number" value={txAmt} onChange={e=>setTxAmt(e.target.value)} style={{padding:'8px 10px',fontSize:13}}/>
            <button onClick={()=>applyTx(1)}  style={{background:`${C.grn}15`,border:`0.5px solid ${C.grn}40`,borderRadius:8,padding:'8px 12px',color:C.grn,cursor:'pointer',fontWeight:700,fontFamily:'inherit',fontSize:13}}>+</button>
            <button onClick={()=>applyTx(-1)} style={{background:`${C.red}15`,border:`0.5px solid ${C.red}40`,borderRadius:8,padding:'8px 12px',color:C.red,cursor:'pointer',fontWeight:700,fontFamily:'inherit',fontSize:13}}>−</button>
          </div>
        </div>
      )}
    </Card>
  )
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function MyApp() {
  const [now,setNow]   = useState(new Date())
  const [tab,setTab]   = useState('hoy')
  const [selDay,setSelDay] = useState(null)

  const [habits,setHabits]         = useState(() => S.get('ma_habits')      || {})
  const [habitsList,setHabitsList] = useState(() => S.get('ma_hlist')       || HABITS_DEFAULT)
  const [goals,setGoals]           = useState(() => S.get('ma_goals')       || GOALS0)
  const [ciPhases,setCiPhases]     = useState(() => S.get('ma_ci')          || {})
  const [localEvts,setLocalEvts]   = useState(() => S.get('ma_evts')        || {})
  const [sched,setSched]           = useState(() => S.get('ma_sched')        || SCHED_DEFAULT)

  const [editingSched,setEditingSched]   = useState(false)
  const [editingHabits,setEditingHabits] = useState(false)
  const [editGoal,setEditGoal]           = useState(null)
  const [editItem,setEditItem]           = useState(null)
  const [showBell,setShowBell]           = useState(false)
  const [showAddGoal,setShowAddGoal]     = useState(false)
  const [newGoalType,setNewGoalType]     = useState('progress')

  const [showAddEvt,setShowAddEvt] = useState(false)
  const [evtTitle,setEvtTitle]     = useState('')
  const [evtStart,setEvtStart]     = useState('')
  const [evtEnd,setEvtEnd]         = useState('')

  const [tasks,setTasks]   = useState(null)
  const [loadT,setLoadT]   = useState(false)
  const [tFilter,setTFilter] = useState('all')
  const [showAddT,setShowAddT] = useState(false)
  const [ntTitle,setNtTitle]   = useState('')
  const [ntSrc,setNtSrc]       = useState('tareas')
  const [ntPrio,setNtPrio]     = useState('Media')
  const [ntDate,setNtDate]     = useState('')
  const [ntStatus,setNtStatus] = useState('')
  const [ntTipo,setNtTipo]     = useState('')
  const [ntClase,setNtClase]   = useState('')
  const [ntArea,setNtArea]     = useState('')
  const [addingT,setAddingT]   = useState(false)
  const [clases,setClases]     = useState([])
  const [areas,setAreas]       = useState([])

  const [nEvts,setNEvts]   = useState(null)
  const [loadE,setLoadE]   = useState(false)
  const [showAddNEvt,setShowAddNEvt] = useState(false)
  const [nevtTitle,setNevtTitle]     = useState('')
  const [nevtDate,setNevtDate]       = useState('')
  const [nevtStatus,setNevtStatus]   = useState('Agendada')
  const [nevtPrio,setNevtPrio]       = useState('Media')
  const [addingE,setAddingE]         = useState(false)

  const [dietBlocks,setDietBlocks] = useState(null)
  const [loadDiet,setLoadDiet]     = useState(false)
  const [dietOpen,setDietOpen]     = useState(false)

  const lastNotif = useRef(null)

  // ── Reloj ─────────────────────────────────────────────────────────────────
  useEffect(() => { const i=setInterval(()=>setNow(new Date()),1000); return()=>clearInterval(i) }, [])

  // ── Auto-load al montar ───────────────────────────────────────────────────
  useEffect(() => {
    fetchTasks()
    fetchEvents()
    registerSW()
  }, [])

  // ── Auto-refresh cada 5 min ───────────────────────────────────────────────
  useEffect(() => {
    const i = setInterval(() => { fetchTasks(); fetchEvents() }, 5*60*1000)
    return () => clearInterval(i)
  }, [])

  // ── Notificaciones locales (bloque activo) ─────────────────────────────
  useEffect(() => {
    const fire = () => {
      if(typeof Notification==='undefined'||Notification.permission!=='granted') return
      const n=new Date(),m=n.getHours()*60+n.getMinutes(),dk2=gdk(n)
      const blk=(sched[dk2]||[]).find(b=>{const s=pt(b.s),e=pt(b.e);return m>=s&&m<e})
      const key=blk?`${ldk(n)}-${blk.id}`:`${ldk(n)}-none`
      if(blk&&lastNotif.current!==key){ lastNotif.current=key; try{new Notification('My App — '+blk.a,{body:fmt12(blk.s)+' – '+fmt12(blk.e)})}catch{} }
      else if(!blk){ lastNotif.current=key }
    }
    fire(); const i=setInterval(fire,20000); return()=>clearInterval(i)
  },[sched])

  // ── Service Worker ────────────────────────────────────────────────────────
  const registerSW = async () => {
    if(!('serviceWorker' in navigator)) return
    try { await navigator.serviceWorker.register('/sw.js') } catch(e){ console.error('SW error',e) }
  }

  // ── Persist helpers ───────────────────────────────────────────────────────
  const saveH  = h  => { setHabits(h);      S.set('ma_habits',h) }
  const saveHL = hl => { setHabitsList(hl); S.set('ma_hlist',hl) }
  const saveG  = g  => { setGoals(g);       S.set('ma_goals',g) }
  const saveE  = e  => { setLocalEvts(e);   S.set('ma_evts',e) }
  const saveS  = s  => { setSched(s);        S.set('ma_sched',s) }
  const saveCI = ci => { setCiPhases(ci);    S.set('ma_ci',ci) }
  const togH   = (hid,dk2=dateKey) => { const c=habits[dk2]||{}; saveH({...habits,[dk2]:{...c,[hid]:!c[hid]}}) }
  const togCI  = fid => saveCI({...ciPhases,[fid]:!ciPhases[fid]})

  // ── Derived ───────────────────────────────────────────────────────────────
  const dk        = gdk(now)
  const dateKey   = ldk(now)
  const nowM      = now.getHours()*60+now.getMinutes()
  const activeDay = selDay||dk
  const activeDK  = dayKeyForDK(activeDay,now)
  const todayH    = habits[dateKey]||{}
  const hDone     = habitsList.filter(h=>todayH[h.id]).length

  const todayAll  = [...(sched[dk]||[]),...(localEvts[dateKey]||[])].sort((a,b)=>pt(a.s)-pt(b.s))
  const curBlock  = todayAll.find(b=>{const s=pt(b.s),e=pt(b.e);return nowM>=s&&nowM<e})
  const upcoming  = todayAll.filter(b=>pt(b.s)>nowM).slice(0,3)

  const activeAll = [
    ...(sched[activeDay]||[]).map(b=>({...b,_fixed:true})),
    ...(localEvts[activeDK]||[]).map(b=>({...b,t:'personal',_fixed:false})),
  ].sort((a,b)=>pt(a.s)-pt(b.s))
  const aCurIdx   = activeDay===dk
    ? activeAll.findIndex(b=>{const s=pt(b.s),e=pt(b.e);return nowM>=s&&nowM<e})
    : -1

  const ftasks  = (tasks||[]).filter(t=>tFilter==='all'||t.source===tFilter)
  const tmrw    = new Date(now); tmrw.setDate(tmrw.getDate()+1)
  const tmrwKey = ldk(tmrw)
  const tToday  = ftasks.filter(t=>t.date===dateKey)
  const tTmrw   = ftasks.filter(t=>t.date===tmrwKey)
  const tUp     = ftasks.filter(t=>t.date&&t.date>tmrwKey)
  const tNone   = ftasks.filter(t=>!t.date)

  const days7 = Array.from({length:7},(_,i)=>{const d=new Date(now);d.setDate(d.getDate()-(6-i));return ldk(d)})
  const labs7 = days7.map(dk2=>new Date(dk2+'T12:00:00').toLocaleDateString('es-PE',{weekday:'short'}).slice(0,2).toUpperCase())

  // ── Notion fetchers ───────────────────────────────────────────────────────
  const fetchTasks = async () => {
    setLoadT(true)
    try {
      const [rE,rT,rV] = await Promise.all([notionQuery(DB.entregas),notionQuery(DB.tareas),notionQuery(DB.vendify)])
      setTasks([...parseEntregas(rE.results||[]),...parseTareas(rT.results||[],'tareas'),...parseTareas(rV.results||[],'vendify')])
    } catch { setTasks([]) }
    setLoadT(false)
  }

  const fetchEvents = async () => {
    setLoadE(true)
    try { const r=await notionQuery(DB.eventos); setNEvts(parseEventos(r.results||[])) }
    catch { setNEvts([]) }
    setLoadE(false)
  }

  const fetchRelOpts = async () => {
    if(clases.length===0) {
      try { const r=await notionQuery(DB.clases); setClases(parseRelOpts(r.results||[])) } catch {}
    }
    if(areas.length===0) {
      try { const r=await notionQuery(DB.areas); setAreas(parseRelOpts(r.results||[])) } catch {}
    }
  }

  const fetchDiet = async () => {
    setLoadDiet(true)
    try { const r=await notionBlocks(DB.diet); setDietBlocks(parseBlocks(r.results||[])) }
    catch { setDietBlocks([]) }
    setLoadDiet(false)
  }

  const openAddTask = () => { setShowAddT(true); fetchRelOpts() }

  // ── Add task ──────────────────────────────────────────────────────────────
  const addTask = async () => {
    if(!ntTitle) return; setAddingT(true)
    const dbId = ntSrc==='entregas'?DB.entregas:ntSrc==='vendify'?DB.vendify:DB.tareas
    let props = { Nombre:{ title:[{text:{content:ntTitle}}] } }

    if(ntSrc==='entregas') {
      if(ntStatus) props.Estado = { status:{name:ntStatus} }
      if(ntTipo)   props.Tipo   = { select:{name:ntTipo} }
      if(ntDate)   props.Fecha  = { date:{start:ntDate} }
      if(ntClase)  props.Clase  = { relation:[{id:ntClase}] }
    } else {
      if(ntStatus) props.Status    = { status:{name:ntStatus} }
      if(ntPrio)   props.Prioridad = { select:{name:ntPrio} }
      if(ntDate)   props.Fecha     = { date:{start:ntDate} }
      if(ntArea)   props.Area      = { relation:[{id:ntArea}] }
    }

    try { await notionCreate(dbId,props) } catch {}
    setAddingT(false); setShowAddT(false)
    setNtTitle(''); setNtDate(''); setNtStatus(''); setNtTipo(''); setNtClase(''); setNtArea('')
    fetchTasks()
  }

  // ── Add evento Notion ─────────────────────────────────────────────────────
  const addNEvt = async () => {
    if(!nevtTitle) return; setAddingE(true)
    const props = {
      Nombre:    { title:[{text:{content:nevtTitle}}] },
      Status:    { status:{name:nevtStatus} },
      Prioridad: { select:{name:nevtPrio} },
      ...(nevtDate ? { Fecha:{date:{start:nevtDate}} } : {}),
    }
    try { await notionCreate(DB.eventos,props) } catch {}
    setAddingE(false); setShowAddNEvt(false)
    setNevtTitle(''); setNevtDate(''); setNevtStatus('Agendada'); setNevtPrio('Media')
    fetchEvents()
  }

  // ── Update item in Notion ─────────────────────────────────────────────────
  const saveEditItem = async ({title,date,status,priority}) => {
    if(!editItem?.id) return
    const props = {}
    if(title)    props.Nombre    = { title:[{text:{content:title}}] }
    if(date)     props.Fecha     = { date:{start:date} }
    if(editItem.source==='entregas') {
      if(status)   props.Estado    = { status:{name:status} }
    } else if(editItem.source==='eventos') {
      if(status)   props.Status    = { status:{name:status} }
      if(priority) props.Prioridad = { select:{name:priority} }
    } else {
      if(status)   props.Status    = { status:{name:status} }
      if(priority) props.Prioridad = { select:{name:priority} }
    }
    try { await notionUpdate(editItem.id, props) } catch {}
    setEditItem(null)
    fetchTasks(); fetchEvents()
  }

  // ── Goal helpers ──────────────────────────────────────────────────────────
  const updateGoal = (updated) => saveG(goals.map(g=>g.id===updated.id?updated:g))
  const deleteGoal = (id) => saveG(goals.filter(g=>g.id!==id))
  const addGoal = () => {
    const ng = {id:uid(),cat:'Personal',label:'Nueva meta',unit:'%',current:0,target:100,start:0,color:C.mut,type:newGoalType}
    saveG([...goals,ng])
    setEditGoal(ng)
    setShowAddGoal(false)
  }

  const timeStr = now.toLocaleTimeString('es-PE',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:true})
  const dateStr = now.toLocaleDateString('es-PE',{weekday:'long',day:'numeric',month:'long'})
  const notifPerm = typeof Notification!=='undefined' ? Notification.permission : 'denied'

  return (
    <div style={{background:C.bg,color:C.txt,height:'100dvh',fontFamily:'-apple-system,BlinkMacSystemFont,"SF Pro Text",system-ui,sans-serif',display:'flex',flexDirection:'column',overflow:'hidden',maxWidth:430,margin:'0 auto',position:'relative'}}>

      {/* PANELS */}
      {editingSched  && <EditSchedulePanel sched={sched} onSave={s=>{saveS(s);setEditingSched(false)}} onClose={()=>setEditingSched(false)}/>}
      {editingHabits && <EditHabitsPanel habitsList={habitsList} onSave={hl=>{saveHL(hl);setEditingHabits(false)}} onClose={()=>setEditingHabits(false)}/>}
      {editGoal      && <EditGoalPanel goal={editGoal} onSave={g=>{updateGoal(g);setEditGoal(null)}} onClose={()=>setEditGoal(null)}/>}
      {editItem      && <EditItemPanel item={editItem} onSave={saveEditItem} onClose={()=>setEditItem(null)}/>}
      {showBell      && <BellModal onClose={()=>setShowBell(false)}/>}

      {/* HEADER */}
      <div style={{padding:'10px 18px 9px',borderBottom:`0.5px solid ${C.bor}`,display:'flex',justifyContent:'space-between',alignItems:'center',flexShrink:0,background:C.bg}}>
        <div>
          <div style={{fontSize:9,color:C.hint,letterSpacing:'0.14em',textTransform:'uppercase',marginBottom:1}}>My App</div>
          <div style={{fontSize:18,fontWeight:600,letterSpacing:'-0.02em'}}>Mauricio</div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          {tab==='semana'&&(
            <button onClick={()=>setEditingSched(true)} style={{display:'flex',alignItems:'center',gap:5,background:'transparent',border:`0.5px solid ${C.bor}`,borderRadius:8,padding:'6px 11px',color:C.mut,cursor:'pointer',fontSize:11,fontFamily:'inherit',whiteSpace:'nowrap'}}>
              <Icon name="edit" size={12} color={C.mut}/> Editar
            </button>
          )}
          {tab==='perfil'&&(
            <button onClick={()=>setShowBell(true)} style={{background:'none',border:'none',cursor:'pointer',padding:6,display:'flex',position:'relative'}}>
              <Icon name="bell" size={20} color={notifPerm==='granted'?C.grn:C.mut}/>
              {notifPerm!=='granted'&&<span style={{position:'absolute',top:5,right:5,width:6,height:6,borderRadius:'50%',background:C.amb}}/>}
            </button>
          )}
        </div>
      </div>

      {/* CONTENT */}
      <div style={{flex:1,overflowY:'auto',padding:'13px 16px',WebkitOverflowScrolling:'touch'}}>

        {/* ══ HOY ══ */}
        {tab==='hoy'&&<>
          <div style={{marginBottom:16}}>
            <div style={{fontSize:11,color:C.mut,textTransform:'capitalize',marginBottom:3}}>{dateStr}</div>
            <div style={{fontSize:36,fontWeight:200,letterSpacing:'-0.04em',fontVariantNumeric:'tabular-nums',lineHeight:1}}>{timeStr}</div>
            <div style={{display:'flex',alignItems:'center',gap:7,marginTop:8}}>
              <div style={{display:'flex',gap:3}}>{habitsList.map(h=><div key={h.id} style={{width:5,height:5,borderRadius:'50%',background:todayH[h.id]?C.grn:'rgba(255,255,255,0.1)'}}/>)}</div>
              <span style={{fontSize:11,color:C.mut}}>{hDone}/{habitsList.length} hábitos completados</span>
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
          ):(
            <Card style={{marginBottom:10,textAlign:'center'}}><span style={{fontSize:12,color:C.mut}}>Sin bloque activo en este momento</span></Card>
          )}

          {upcoming.length>0&&<>
            <Sec>A continuación</Sec>
            {upcoming.map((b,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',gap:11,padding:'8px 4px',borderBottom:`0.5px solid ${C.bor}`}}>
                <div style={{width:2,height:28,borderRadius:2,background:BCOL[b.t]||C.grn,flexShrink:0}}/>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:500}}>{b.a}</div>
                  <div style={{fontSize:11,color:C.mut,marginTop:1}}>{fmt12(b.s)} – {fmt12(b.e)}</div>
                </div>
                <Pill color={BCOL[b.t]||C.grn}>{BLBL[b.t]||'Personal'}</Pill>
              </div>
            ))}
          </>}

          <div style={{marginTop:14}}>
            <Sec>Hábitos de hoy</Sec>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:7}}>
              {habitsList.map(h=>{const done=!!todayH[h.id];return(
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

        {/* ══ SEMANA ══ */}
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
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:aCurIdx===i?500:400}}>{b.a}</div>
                  <div style={{fontSize:11,color:C.mut,marginTop:1}}>{fmt12(b.s)} – {fmt12(b.e)}</div>
                </div>
                <Pill color={BCOL[b.t]||C.amb}>{BLBL[b.t]||'Personal'}</Pill>
                {!b._fixed&&(
                  <button onClick={()=>{const evts={...localEvts};evts[activeDK]=(evts[activeDK]||[]).filter(e=>e.id!==b.id);saveE(evts)}} style={{background:'none',border:'none',color:C.mut,cursor:'pointer',fontSize:16,padding:'0 5px',lineHeight:1}}>×</button>
                )}
              </div>
          ))}
          {showAddEvt?(
            <Card style={{marginTop:11}}>
              <div style={{fontSize:13,fontWeight:500,marginBottom:10}}>Nuevo evento local</div>
              <Inp placeholder="Nombre del evento" value={evtTitle} onChange={e=>setEvtTitle(e.target.value)} style={{marginBottom:9}}/>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:11}}>
                <div><div style={{fontSize:10,color:C.mut,marginBottom:3}}>Inicio</div><Inp type="time" value={evtStart} onChange={e=>setEvtStart(e.target.value)}/></div>
                <div><div style={{fontSize:10,color:C.mut,marginBottom:3}}>Fin</div><Inp type="time" value={evtEnd} onChange={e=>setEvtEnd(e.target.value)}/></div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                <Btn variant="outline" onClick={()=>{setShowAddEvt(false);setEvtTitle('');setEvtStart('');setEvtEnd('')}} style={{width:'100%'}}>Cancelar</Btn>
                <Btn variant="primary" onClick={()=>{
                  if(!evtTitle||!evtStart||!evtEnd)return
                  const evts={...localEvts}; evts[activeDK]=[...(evts[activeDK]||[]),{id:uid(),s:evtStart,e:evtEnd,a:evtTitle}]
                  saveE(evts);setShowAddEvt(false);setEvtTitle('');setEvtStart('');setEvtEnd('')
                }} style={{width:'100%'}}>Agregar</Btn>
              </div>
            </Card>
          ):<Btn variant="ghost" onClick={()=>setShowAddEvt(true)} style={{width:'100%',marginTop:11}}>+ Agregar evento local</Btn>}
        </>}

        {/* ══ TAREAS ══ */}
        {tab==='tareas'&&<>
          <div style={{display:'flex',gap:5,marginBottom:12,overflowX:'auto',paddingBottom:2}}>
            {[['all','Todas'],['entregas','Uni'],['tareas','Trabajo'],['vendify','Vendify']].map(([k,l])=>(
              <button key={k} onClick={()=>setTFilter(k)} style={{flexShrink:0,padding:'6px 12px',borderRadius:20,cursor:'pointer',border:`0.5px solid ${tFilter===k?C.grn:C.bor}`,background:tFilter===k?`${C.grn}15`:'transparent',color:tFilter===k?C.grn:C.mut,fontSize:12,fontWeight:tFilter===k?600:400,fontFamily:'inherit'}}>{l}</button>
            ))}
          </div>

          {loadT?(
            <div style={{textAlign:'center',padding:'36px 0',color:C.mut,fontSize:13}}>Cargando tareas...</div>
          ):<>
            {[['Hoy',tToday],['Mañana',tTmrw],['Próximas',tUp],['Sin fecha',tNone]].map(([label,items])=>items.length>0&&(
              <div key={label}>
                <Sec>{label}</Sec>
                {items.map((t,i)=>(
                  <Card key={i} style={{marginBottom:7,cursor:'pointer'}} onClick={()=>setEditItem(t)}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:5}}>
                      <div style={{fontSize:13,fontWeight:500,flex:1,paddingRight:8}}>{t.title}</div>
                      <button onClick={e=>{e.stopPropagation();setEditItem(t)}} style={{background:'none',border:'none',color:C.mut,cursor:'pointer',padding:'2px 4px',display:'flex',flexShrink:0}}>
                        <Icon name="edit" size={12} color={C.mut}/>
                      </button>
                    </div>
                    <div style={{display:'flex',gap:5,flexWrap:'wrap',alignItems:'center'}}>
                      <Pill color={t.source==='entregas'?C.blu:t.source==='vendify'?C.grn:C.amb}>{t.source==='entregas'?'Uni':t.source==='vendify'?'Vendify':'Trabajo'}</Pill>
                      {t.priority&&<Pill color={pcolor(t.priority)}>{t.priority}</Pill>}
                      {t.status&&<span style={{fontSize:11,color:scol(t.status)}}>{t.status}</span>}
                      {t.date&&<span style={{fontSize:11,color:C.hint}}>{t.date}</span>}
                    </div>
                  </Card>
                ))}
              </div>
            ))}
            {ftasks.length===0&&!loadT&&<div style={{textAlign:'center',padding:24,color:C.mut,fontSize:13}}>Sin tareas en esta categoría</div>}
          </>}

          {showAddT?(
            <Card style={{marginTop:9}}>
              <div style={{fontSize:13,fontWeight:500,marginBottom:10}}>Nueva tarea en Notion</div>
              <Inp placeholder="Nombre de la tarea" value={ntTitle} onChange={e=>setNtTitle(e.target.value)} style={{marginBottom:9}}/>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:9}}>
                <div>
                  <div style={{fontSize:10,color:C.mut,marginBottom:3}}>Base de datos</div>
                  <Sel value={ntSrc} onChange={e=>{setNtSrc(e.target.value);setNtStatus('');setNtClase('');setNtArea('')}}>
                    <option value="tareas">Trabajo</option>
                    <option value="entregas">Uni (Entregas)</option>
                    <option value="vendify">Vendify</option>
                  </Sel>
                </div>
                {ntSrc==='entregas'?(
                  <div>
                    <div style={{fontSize:10,color:C.mut,marginBottom:3}}>Tipo</div>
                    <Sel value={ntTipo} onChange={e=>setNtTipo(e.target.value)}>
                      <option value="">— Tipo —</option>
                      {TIPO_ENTREGAS.map(t=><option key={t} value={t}>{t}</option>)}
                    </Sel>
                  </div>
                ):(
                  <div>
                    <div style={{fontSize:10,color:C.mut,marginBottom:3}}>Prioridad</div>
                    <Sel value={ntPrio} onChange={e=>setNtPrio(e.target.value)}>
                      {PRIO_TAREAS.map(p=><option key={p} value={p}>{p}</option>)}
                    </Sel>
                  </div>
                )}
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:9}}>
                <div>
                  <div style={{fontSize:10,color:C.mut,marginBottom:3}}>Estado</div>
                  <Sel value={ntStatus} onChange={e=>setNtStatus(e.target.value)}>
                    <option value="">— Estado —</option>
                    {(ntSrc==='entregas'?STATUS_ENTREGAS:STATUS_TAREAS).map(s=><option key={s} value={s}>{s}</option>)}
                  </Sel>
                </div>
                <div>
                  <div style={{fontSize:10,color:C.mut,marginBottom:3}}>Fecha</div>
                  <Inp type="date" value={ntDate} onChange={e=>setNtDate(e.target.value)}/>
                </div>
              </div>
              {ntSrc==='entregas'&&clases.length>0&&(
                <div style={{marginBottom:9}}>
                  <div style={{fontSize:10,color:C.mut,marginBottom:3}}>Clase</div>
                  <Sel value={ntClase} onChange={e=>setNtClase(e.target.value)}>
                    <option value="">— Clase —</option>
                    {clases.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                  </Sel>
                </div>
              )}
              {(ntSrc==='tareas'||ntSrc==='vendify')&&areas.length>0&&(
                <div style={{marginBottom:9}}>
                  <div style={{fontSize:10,color:C.mut,marginBottom:3}}>Área</div>
                  <Sel value={ntArea} onChange={e=>setNtArea(e.target.value)}>
                    <option value="">— Área —</option>
                    {areas.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
                  </Sel>
                </div>
              )}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                <Btn variant="outline" onClick={()=>{setShowAddT(false);setNtTitle('');setNtDate('')}} style={{width:'100%'}}>Cancelar</Btn>
                <Btn variant="primary" disabled={!ntTitle||addingT} onClick={addTask} style={{width:'100%'}}>{addingT?'Guardando...':'Guardar'}</Btn>
              </div>
            </Card>
          ):(
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginTop:9}}>
              <Btn variant="ghost" onClick={openAddTask} style={{width:'100%'}}>+ Nueva tarea</Btn>
              <Btn variant="outline" onClick={fetchTasks} style={{width:'100%'}}>↻ Actualizar</Btn>
            </div>
          )}
        </>}

        {/* ══ EVENTOS ══ */}
        {tab==='eventos'&&<>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
            <span style={{fontSize:16,fontWeight:500}}>Eventos AC</span>
            {!loadE&&<button onClick={fetchEvents} style={{background:'none',border:'none',color:C.mut,cursor:'pointer',padding:4,display:'flex'}}><Icon name="refresh" size={17} color={C.mut}/></button>}
          </div>
          {loadE?(
            <div style={{textAlign:'center',padding:'36px 0',color:C.mut,fontSize:13}}>Cargando...</div>
          ):(nEvts||[]).length===0?(
            <div style={{textAlign:'center',padding:24,color:C.mut,fontSize:13}}>No hay eventos</div>
          ):(nEvts||[]).map((e,i)=>(
            <Card key={i} style={{marginBottom:8,cursor:'pointer'}} onClick={()=>setEditItem(e)}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:5}}>
                <div style={{fontSize:14,fontWeight:500,flex:1,paddingRight:8}}>{e.title}</div>
                <button onClick={evt=>{evt.stopPropagation();setEditItem(e)}} style={{background:'none',border:'none',color:C.mut,cursor:'pointer',padding:'2px 4px',display:'flex',flexShrink:0}}>
                  <Icon name="edit" size={12} color={C.mut}/>
                </button>
              </div>
              {e.date&&<div style={{fontSize:12,color:C.mut,marginBottom:5}}>{e.date}</div>}
              <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
                {e.status&&<Pill color={scol(e.status)}>{e.status}</Pill>}
                {e.priority&&<Pill color={pcolor(e.priority)}>{e.priority}</Pill>}
              </div>
            </Card>
          ))}

          {showAddNEvt?(
            <Card style={{marginTop:9}}>
              <div style={{fontSize:13,fontWeight:500,marginBottom:10}}>Nuevo evento en Notion</div>
              <Inp placeholder="Nombre del evento" value={nevtTitle} onChange={e=>setNevtTitle(e.target.value)} style={{marginBottom:9}}/>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:9}}>
                <div>
                  <div style={{fontSize:10,color:C.mut,marginBottom:3}}>Estado</div>
                  <Sel value={nevtStatus} onChange={e=>setNevtStatus(e.target.value)}>
                    {STATUS_EVENTOS.map(s=><option key={s} value={s}>{s}</option>)}
                  </Sel>
                </div>
                <div>
                  <div style={{fontSize:10,color:C.mut,marginBottom:3}}>Prioridad</div>
                  <Sel value={nevtPrio} onChange={e=>setNevtPrio(e.target.value)}>
                    {PRIO_EVENTOS.map(p=><option key={p} value={p}>{p}</option>)}
                  </Sel>
                </div>
              </div>
              <div style={{marginBottom:10}}>
                <div style={{fontSize:10,color:C.mut,marginBottom:3}}>Fecha</div>
                <Inp type="date" value={nevtDate} onChange={e=>setNevtDate(e.target.value)}/>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                <Btn variant="outline" onClick={()=>setShowAddNEvt(false)} style={{width:'100%'}}>Cancelar</Btn>
                <Btn variant="primary" disabled={!nevtTitle||addingE} onClick={addNEvt} style={{width:'100%'}}>{addingE?'Guardando...':'Guardar'}</Btn>
              </div>
            </Card>
          ):(
            <Btn variant="ghost" onClick={()=>setShowAddNEvt(true)} style={{width:'100%',marginTop:9}}>+ Nuevo evento</Btn>
          )}
        </>}

        {/* ══ PERFIL ══ */}
        {tab==='perfil'&&<>

          {/* HÁBITOS */}
          <Sec action={
            <button onClick={()=>setEditingHabits(true)} style={{background:'none',border:'none',color:C.grn,cursor:'pointer',display:'flex',alignItems:'center',gap:4,fontSize:10,fontWeight:600,fontFamily:'inherit',padding:'0 2px'}}>
              <Icon name="edit" size={11} color={C.grn}/> Editar
            </button>
          }>Hábitos — últimos 7 días</Sec>
          <Card style={{marginBottom:12,overflowX:'auto'}}>
            <div style={{display:'grid',gridTemplateColumns:'64px repeat(7,1fr)',gap:3,marginBottom:5,minWidth:280}}>
              <div/>
              {labs7.map((l,i)=><div key={i} style={{textAlign:'center',fontSize:10,color:days7[i]===dateKey?C.grn:C.hint,fontWeight:days7[i]===dateKey?700:400}}>{l}</div>)}
            </div>
            {habitsList.map(h=>{
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

          {/* METAS */}
          <Sec action={
            <button onClick={()=>setShowAddGoal(s=>!s)} style={{background:'none',border:'none',color:C.grn,cursor:'pointer',display:'flex',alignItems:'center',gap:4,fontSize:10,fontWeight:600,fontFamily:'inherit',padding:'0 2px'}}>
              <Icon name="plus" size={11} color={C.grn}/> Agregar
            </button>
          }>Metas</Sec>

          {showAddGoal&&(
            <Card style={{marginBottom:9}}>
              <div style={{fontSize:12,fontWeight:500,marginBottom:8}}>Tipo de meta</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:6,marginBottom:10}}>
                {[['progress','Progreso'],['ci','CI Fases'],['finanzas','Finanzas']].map(([val,lbl])=>(
                  <button key={val} onClick={()=>setNewGoalType(val)} style={{padding:'7px 6px',borderRadius:8,cursor:'pointer',border:`0.5px solid ${newGoalType===val?C.grn:C.bor}`,background:newGoalType===val?`${C.grn}15`:'transparent',color:newGoalType===val?C.grn:C.mut,fontSize:11,fontFamily:'inherit'}}>
                    {lbl}
                  </button>
                ))}
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                <Btn variant="outline" onClick={()=>setShowAddGoal(false)} style={{width:'100%'}}>Cancelar</Btn>
                <Btn variant="primary" onClick={addGoal} style={{width:'100%'}}>Crear meta</Btn>
              </div>
            </Card>
          )}

          {goals.map(g=>{
            if(g.type==='ci') return (
              <CIGoalCard key={g.id} goal={g} ciPhases={ciPhases} onTogglePhase={togCI}
                onEdit={()=>setEditGoal(g)} onDelete={()=>deleteGoal(g.id)}/>
            )
            if(g.type==='finanzas') return (
              <FinanzasCard key={g.id} goal={g}
                onSave={updateGoal}
                onEdit={()=>setEditGoal(g)}
                onDelete={()=>deleteGoal(g.id)}/>
            )
            // progress
            const range=g.target-g.start; const pct=range===0?0:Math.min(100,Math.round(((g.current-g.start)/range)*100))
            return(
              <Card key={g.id} style={{marginBottom:8}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:9}}>
                  <div>
                    <Pill color={g.color}>{g.cat}</Pill>
                    <div style={{fontSize:13,fontWeight:500,marginTop:4}}>{g.label}</div>
                  </div>
                  <div style={{display:'flex',gap:4,alignItems:'center',flexShrink:0}}>
                    <div onClick={()=>setEditGoal(g)} style={{cursor:'pointer',textAlign:'right'}}>
                      <span style={{fontSize:20,fontWeight:500}}>{g.current}</span>
                      <span style={{fontSize:11,color:C.mut}}>/{g.target} {g.unit}</span>
                    </div>
                    <button onClick={()=>setEditGoal(g)} style={{background:'none',border:'none',color:C.mut,cursor:'pointer',padding:4,display:'flex'}}><Icon name="edit" size={13} color={C.mut}/></button>
                    <button onClick={()=>deleteGoal(g.id)} style={{background:'none',border:'none',color:C.red,cursor:'pointer',padding:4,display:'flex'}}><Icon name="trash" size={13} color={C.red}/></button>
                  </div>
                </div>
                <div style={{height:3,background:'rgba(255,255,255,0.07)',borderRadius:2,overflow:'hidden',marginBottom:4}}>
                  <div style={{height:'100%',width:`${pct}%`,background:g.color,borderRadius:2}}/>
                </div>
                <div style={{fontSize:11,color:C.mut}}>{pct}% completado</div>
              </Card>
            )
          })}

          {/* DIETA */}
          <div style={{marginTop:6}}>
            <Sec action={
              <button onClick={()=>{setDietOpen(o=>!o);if(!dietBlocks&&!dietOpen)fetchDiet()}} style={{background:'none',border:'none',color:C.grn,cursor:'pointer',display:'flex',alignItems:'center',gap:4,fontSize:10,fontWeight:600,fontFamily:'inherit',padding:'0 2px'}}>
                <Icon name={dietOpen?'chevup':'chevron'} size={11} color={C.grn}/> {dietOpen?'Cerrar':'Ver plan'}
              </button>
            }>
              <span style={{display:'flex',alignItems:'center',gap:5}}>
                <Icon name="salad" size={12} color={C.hint}/>
                Dieta — Plan semanal
              </span>
            </Sec>
            {dietOpen&&(
              <Card style={{marginBottom:10}}>
                {loadDiet?(
                  <div style={{textAlign:'center',padding:'20px 0',color:C.mut,fontSize:13}}>Cargando plan de Notion...</div>
                ):dietBlocks&&dietBlocks.length===0?(
                  <div style={{textAlign:'center',padding:'16px 0',color:C.mut,fontSize:12}}>No se encontró contenido en la página de Notion.</div>
                ):(dietBlocks||[]).map(b=>{
                  if(b.type==='h1') return <div key={b.key} style={{fontSize:15,fontWeight:600,marginTop:10,marginBottom:4,color:C.txt}}>{b.text}</div>
                  if(b.type==='h2') return <div key={b.key} style={{fontSize:13,fontWeight:600,marginTop:8,marginBottom:3,color:C.txt}}>{b.text}</div>
                  if(b.type==='h3') return <div key={b.key} style={{fontSize:12,fontWeight:600,marginTop:6,marginBottom:2,color:C.grn}}>{b.text}</div>
                  if(b.type==='bullet') return <div key={b.key} style={{fontSize:12,color:C.mut,paddingLeft:10,marginBottom:3}}>• {b.text}</div>
                  if(b.type==='num') return <div key={b.key} style={{fontSize:12,color:C.mut,paddingLeft:10,marginBottom:3}}>{b.text}</div>
                  if(b.type==='p') return <div key={b.key} style={{fontSize:12,color:C.mut,marginBottom:4,lineHeight:1.6}}>{b.text}</div>
                  if(b.type==='divider') return <div key={b.key} style={{height:1,background:C.bor,margin:'8px 0'}}/>
                  if(b.type==='db') return <div key={b.key} style={{fontSize:11,color:C.hint,padding:'6px 0'}}>📊 {b.title}</div>
                  if(b.type==='spacer') return <div key={b.key} style={{height:6}}/>
                  return null
                })}
                {dietBlocks&&<button onClick={fetchDiet} style={{background:'none',border:'none',color:C.mut,cursor:'pointer',display:'flex',alignItems:'center',gap:4,fontSize:11,marginTop:8,fontFamily:'inherit',padding:0}}>
                  <Icon name="refresh" size={12} color={C.mut}/> Actualizar desde Notion
                </button>}
              </Card>
            )}
          </div>

        </>}
      </div>

      {/* BOTTOM NAV */}
      <div style={{borderTop:`0.5px solid ${C.bor}`,background:'#0C0C0C',display:'flex',flexShrink:0,paddingBottom:'env(safe-area-inset-bottom,6px)'}}>
        {[['hoy','Hoy','clock'],['semana','Semana','cal'],['tareas','Tareas','check'],['eventos','Eventos','list'],['perfil','Perfil','user']].map(([id,lbl,ico])=>(
          <button key={id} onClick={()=>setTab(id)} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:3,padding:'8px 0',background:'none',border:'none',cursor:'pointer',color:tab===id?C.grn:'rgba(255,255,255,0.25)',fontFamily:'inherit'}}>
            <Icon name={ico} size={20} color={tab===id?C.grn:'rgba(255,255,255,0.25)'} sw={tab===id?2:1.5}/>
            <span style={{fontSize:9,fontWeight:tab===id?600:400}}>{lbl}</span>
          </button>
        ))}
      </div>
    </div>
  )
}