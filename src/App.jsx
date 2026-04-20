import { useState, useEffect } from "react"

const ACCENT = '#059669'
const TC = { sleep:'#475569',routine:'#64748b',meal:'#d97706',transport:'#6b7280',uni:'#3b82f6',gym:'#8b5cf6',vendify:'#059669',personal:'#6b7280',free:'#10b981',photo:'#f59e0b' }
const TL = { sleep:'Sueño',routine:'Rutina',meal:'Comida',transport:'Transporte',uni:'Universidad',gym:'Gym',vendify:'Vendify',personal:'Personal',free:'Libre',photo:'Fotografía' }
const DK = ['dom','lun','mar','mie','jue','vie','sab']
const DN = { dom:'Domingo',lun:'Lunes',mar:'Martes',mie:'Miércoles',jue:'Jueves',vie:'Viernes',sab:'Sábado' }
const HABITS = [{id:'gym',l:'Gym'},{id:'agua',l:'Agua 2L'},{id:'desayuno',l:'Desayuno'},{id:'almuerzo',l:'Almuerzo'},{id:'cena',l:'Cena'},{id:'vendify',l:'Vendify ≥2h'},{id:'sueno',l:'Sueño >7h'}]
const GC = { Gym:'#8b5cf6',Vendify:'#059669',Universidad:'#3b82f6',Personal:'#f59e0b' }

const SCHED = {
  lun:[
    {s:'06:30',e:'07:00',t:'routine',a:'Despertar + rutina',n:'Ducha, hidratación, mochila'},
    {s:'07:00',e:'07:30',t:'meal',a:'Desayuno',n:'Avena + 3 huevos + café negro'},
    {s:'07:30',e:'13:00',t:'vendify',a:'Vendify — Deep Work',n:'F1 Discovery, SPEC, producto. Tu bloque más valioso.'},
    {s:'13:00',e:'13:30',t:'meal',a:'Almuerzo',n:'Pollo + arroz + camote'},
    {s:'13:30',e:'14:00',t:'transport',a:'Transporte → UNT',n:'~30 min'},
    {s:'14:00',e:'17:00',t:'uni',a:'Base de Datos',n:'PostgreSQL, RLS, índices'},
    {s:'17:00',e:'17:30',t:'transport',a:'Transporte ← Casa',n:''},
    {s:'17:30',e:'19:00',t:'personal',a:'Pre-entreno + snack',n:'Cambio ropa, maní + plátano'},
    {s:'19:00',e:'22:00',t:'gym',a:'Gym — Piernas',n:'Sentadillas, leg press, femoral'},
    {s:'22:00',e:'22:30',t:'routine',a:'Ducha',n:''},
    {s:'22:30',e:'23:00',t:'meal',a:'Cena post-entreno',n:'Tortilla atún + pan integral + palta'},
    {s:'23:00',e:'23:59',t:'sleep',a:'Sueño',n:'7.5h'},
  ],
  mar:[
    {s:'07:00',e:'07:30',t:'routine',a:'Despertar + rutina',n:''},
    {s:'07:30',e:'08:00',t:'meal',a:'Desayuno rápido',n:'Avena prep noche anterior + huevos'},
    {s:'08:00',e:'08:30',t:'transport',a:'Transporte → UNT',n:'Buffer antes de las 9am'},
    {s:'09:00',e:'13:00',t:'uni',a:'Ingeniería de Software',n:'4h. DDD, patrones, arquitectura'},
    {s:'13:00',e:'13:30',t:'transport',a:'Transporte ← Casa',n:''},
    {s:'13:30',e:'14:00',t:'meal',a:'Almuerzo',n:'Comida principal'},
    {s:'14:00',e:'18:00',t:'vendify',a:'Vendify — Trabajo',n:'Figma, docs, sync M+K'},
    {s:'18:00',e:'19:00',t:'personal',a:'Pre-entreno',n:'Snack, cambio, hidratación'},
    {s:'19:00',e:'22:00',t:'gym',a:'Gym — Empuje',n:'Pecho, hombros, tríceps'},
    {s:'22:00',e:'22:30',t:'routine',a:'Ducha',n:''},
    {s:'22:30',e:'23:00',t:'meal',a:'Cena post-entreno',n:'Prepara avena en frío para mañana'},
    {s:'23:00',e:'23:59',t:'sleep',a:'Sueño',n:'8h'},
  ],
  mie:[
    {s:'05:45',e:'06:15',t:'routine',a:'Despertar mínimo',n:'El día más duro. Desayuno prep noche anterior.'},
    {s:'06:15',e:'06:30',t:'meal',a:'Desayuno rápido',n:'Avena fría + plátano'},
    {s:'06:30',e:'07:00',t:'transport',a:'Transporte → UNT',n:'Sale 6:30 en punto'},
    {s:'07:00',e:'11:00',t:'uni',a:'Técnicas Digitales para Computación',n:'4h'},
    {s:'11:00',e:'13:00',t:'free',a:'Break libre',n:'Descansa. No abras Vendify.'},
    {s:'13:00',e:'14:00',t:'meal',a:'RECESO — Almuerzo',n:'Come bien — único break largo'},
    {s:'14:00',e:'15:00',t:'uni',a:'Base de Datos',n:'1h'},
    {s:'15:00',e:'16:00',t:'free',a:'Break',n:'Repaso activo'},
    {s:'16:00',e:'18:00',t:'uni',a:'Inteligencia Artificial',n:'2h'},
    {s:'18:00',e:'20:00',t:'uni',a:'Metodología de la Investigación',n:'2h. Última.'},
    {s:'20:00',e:'20:30',t:'transport',a:'Transporte ← Casa',n:''},
    {s:'20:30',e:'21:00',t:'meal',a:'Cena',n:'Ligera'},
    {s:'21:00',e:'22:00',t:'personal',a:'Wind down',n:'Prepara desayuno del jueves'},
    {s:'22:00',e:'23:59',t:'sleep',a:'Sueño',n:'~7.75h'},
  ],
  jue:[
    {s:'07:30',e:'08:00',t:'routine',a:'Despertar + rutina',n:''},
    {s:'08:00',e:'08:30',t:'meal',a:'Desayuno',n:'Avena + huevos + café'},
    {s:'08:30',e:'10:30',t:'vendify',a:'Vendify — Trabajo',n:'PR review, docs, planificación F2'},
    {s:'10:30',e:'11:00',t:'transport',a:'Transporte → UNT',n:''},
    {s:'11:00',e:'13:00',t:'uni',a:'Ingeniería de Software',n:'2h'},
    {s:'13:00',e:'13:30',t:'transport',a:'Transporte ← Casa',n:''},
    {s:'13:30',e:'14:00',t:'meal',a:'Almuerzo',n:'Comida principal'},
    {s:'14:00',e:'18:00',t:'vendify',a:'Vendify — Deep Work',n:'Mejor bloque de la tarde'},
    {s:'18:00',e:'19:00',t:'personal',a:'Pre-entreno',n:'Snack, cambio'},
    {s:'19:00',e:'22:00',t:'gym',a:'Gym — Tracción',n:'Espalda, bíceps, remo, jalón'},
    {s:'22:00',e:'22:30',t:'routine',a:'Ducha',n:''},
    {s:'22:30',e:'23:00',t:'meal',a:'Cena post-entreno',n:''},
    {s:'23:00',e:'23:59',t:'sleep',a:'Sueño',n:'8.5h'},
  ],
  vie:[
    {s:'07:00',e:'07:15',t:'routine',a:'Despertar',n:'Clase a las 8am. Rápido.'},
    {s:'07:15',e:'07:30',t:'meal',a:'Desayuno mínimo',n:'Avena fría + plátano + café'},
    {s:'07:30',e:'08:00',t:'transport',a:'Transporte → UNT',n:''},
    {s:'08:00',e:'10:00',t:'uni',a:'Inteligencia Artificial',n:'2h. Aplica al stack de IA de Vendify.'},
    {s:'10:00',e:'10:30',t:'transport',a:'Transporte ← Casa',n:''},
    {s:'10:30',e:'13:30',t:'vendify',a:'Vendify — Deep Work',n:'3h. Segundo mejor bloque.'},
    {s:'13:30',e:'14:00',t:'meal',a:'Almuerzo',n:''},
    {s:'14:00',e:'18:00',t:'vendify',a:'Vendify — Trabajo',n:'Weekly review, reuniones, ops'},
    {s:'18:00',e:'19:00',t:'personal',a:'Pre-entreno',n:''},
    {s:'19:00',e:'22:00',t:'gym',a:'Gym — Brazos/Hombros',n:'Bíceps, tríceps, hombros'},
    {s:'22:00',e:'22:30',t:'routine',a:'Ducha',n:''},
    {s:'22:30',e:'23:00',t:'meal',a:'Cena + relax',n:'Fin de semana'},
    {s:'23:00',e:'23:59',t:'sleep',a:'Sueño',n:'8h'},
  ],
  sab:[
    {s:'07:30',e:'08:00',t:'routine',a:'Despertar libre',n:'Sin alarma si puedes'},
    {s:'08:00',e:'09:00',t:'meal',a:'Desayuno tranquilo',n:''},
    {s:'09:00',e:'14:00',t:'photo',a:'Fotografía / Videografía',n:'Si hay trabajo'},
    {s:'14:00',e:'15:00',t:'meal',a:'Almuerzo',n:''},
    {s:'15:00',e:'18:00',t:'photo',a:'Edición fotos/video',n:'RAW D800 + RTX 4050'},
    {s:'18:00',e:'23:00',t:'free',a:'Tiempo libre / social',n:'Recuperación mental'},
    {s:'23:00',e:'23:59',t:'sleep',a:'Sueño',n:'8.5h'},
  ],
  dom:[
    {s:'08:00',e:'08:30',t:'routine',a:'Despertar libre',n:''},
    {s:'08:30',e:'09:00',t:'meal',a:'Desayuno tranquilo',n:''},
    {s:'09:00',e:'12:30',t:'free',a:'Tiempo personal',n:'Sal. No trabajes. Obligatorio.'},
    {s:'12:30',e:'14:00',t:'meal',a:'Meal prep semanal',n:'Pollo + arroz + camote para la semana'},
    {s:'14:00',e:'14:30',t:'meal',a:'Almuerzo',n:''},
    {s:'14:30',e:'15:30',t:'vendify',a:'Weekly review — Vendify',n:'Notion + Discord async al equipo'},
    {s:'15:30',e:'16:00',t:'personal',a:'Planificación personal',n:'3 prioridades de la semana'},
    {s:'16:00',e:'22:00',t:'free',a:'Libre total',n:''},
    {s:'22:00',e:'23:59',t:'sleep',a:'Sueño',n:'8.5h'},
  ],
}

const INIT_GOALS = [
  {id:'peso',cat:'Gym',label:'Peso corporal',unit:'kg',current:67,target:75,start:67},
  {id:'f1',cat:'Vendify',label:'F1 Discovery completado',unit:'%',current:0,target:100,start:0},
  {id:'piloto',cat:'Vendify',label:'Hotel piloto — semana objetivo',unit:'sem',current:2,target:18,start:0},
  {id:'ciclo',cat:'Universidad',label:'Aprobar todos los cursos',unit:'%',current:0,target:100,start:0},
  {id:'ropa',cat:'Personal',label:'Shopping list ropa S/800',unit:'%',current:0,target:100,start:0},
]

function pt(s) { if (!s) return 0; const [h,m]=s.split(':').map(Number); return h*60+(m||0) }
function tdk(d) { return d.toISOString().split('T')[0] }
function gdk(d) { return DK[d.getDay()] }
function blockPct(b, nowM) { const s=pt(b.s),e=b.e==='23:59'?1440:pt(b.e); return Math.min(100,Math.max(0,Math.round(((nowM-s)/(e-s))*100))) }
function getCurIdx(dayKey, now) { const m=now.getHours()*60+now.getMinutes(); return (SCHED[dayKey]||[]).findIndex(b=>{ const s=pt(b.s),e=b.e==='23:59'?1440:pt(b.e); return m>=s&&m<e }) }

export default function PersonalOS() {
  const [tab, setTab] = useState('hoy')
  const [now, setNow] = useState(new Date())
  const [habits, setHabits] = useState({})
  const [goals, setGoals] = useState(INIT_GOALS)
  const [selDay, setSelDay] = useState(null)
  const [editId, setEditId] = useState(null)
  const [editVal, setEditVal] = useState('')
  const [notionTasks, setNotionTasks] = useState(null)
  const [notionLoading, setNotionLoading] = useState(false)
  const [notionErr, setNotionErr] = useState(null)

  const todayKey = gdk(now)
  const dateKey = tdk(now)
  const nowMins = now.getHours()*60+now.getMinutes()

  useEffect(() => { const i=setInterval(()=>setNow(new Date()),1000); return ()=>clearInterval(i) }, [])
  useEffect(() => {
    ;(async()=>{
      try{ const r=await window.storage.get('ac_habits2'); if(r) setHabits(JSON.parse(r.value)) }catch{}
      try{ const r=await window.storage.get('ac_goals2'); if(r) setGoals(JSON.parse(r.value)) }catch{}
    })()
  }, [])

  const saveH = async h => { setHabits(h); try{ await window.storage.set('ac_habits2',JSON.stringify(h)) }catch{} }
  const saveG = async g => { setGoals(g); try{ await window.storage.set('ac_goals2',JSON.stringify(g)) }catch{} }
  const toggleH = (hid, dk=dateKey) => { const c=habits[dk]||{}; saveH({...habits,[dk]:{...c,[hid]:!c[hid]}}) }

  const todayBlocks = SCHED[todayKey]||[]
  const curIdx = getCurIdx(todayKey, now)
  const curBlock = todayBlocks[curIdx]
  const nextBlocks = curIdx>=0 ? todayBlocks.slice(curIdx+1,curIdx+4) : []
  const todayH = habits[dateKey]||{}
  const hDone = HABITS.filter(h=>todayH[h.id]).length
  const activeDay = selDay||todayKey
  const activeBlocks = SCHED[activeDay]||[]
  const activeCurIdx = activeDay===todayKey ? curIdx : -1

  const timeStr = now.toLocaleTimeString('es-PE',{hour:'2-digit',minute:'2-digit',second:'2-digit'})
  const dateStr = now.toLocaleDateString('es-PE',{weekday:'long',day:'numeric',month:'long'})

  const fetchNotion = async () => {
    setNotionLoading(true); setNotionErr(null)
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages',{
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          model:'claude-sonnet-4-20250514', max_tokens:1000,
          messages:[{role:'user',content:'Search my Notion workspace for tasks and to-do items. Return ONLY a valid JSON array, no markdown, no explanation. Each item: {title, status, category}. Max 15 items. Return [] if nothing found.'}],
          mcp_servers:[{type:'url',url:'https://mcp.notion.com/mcp',name:'notion'}]
        })
      })
      const data = await res.json()
      const txt = data.content?.filter(c=>c.type==='text').map(c=>c.text).join('')||'[]'
      setNotionTasks(JSON.parse(txt.replace(/```json|```/g,'').trim()))
    } catch { setNotionErr('No se pudo conectar. Verifica que Notion esté conectado en tu cuenta de Claude.') }
    setNotionLoading(false)
  }

  const pill = (c, text) => (
    <span style={{fontSize:10,padding:'2px 8px',borderRadius:99,background:`${c}18`,color:c,fontWeight:600,whiteSpace:'nowrap'}}>{text}</span>
  )

  return (
    <div style={{fontFamily:'var(--font-sans)',maxWidth:680,margin:'0 auto',paddingBottom:24}}>

      {/* ── HEADER ── */}
      <div style={{padding:'14px 16px 12px',borderBottom:'0.5px solid var(--color-border-tertiary)',display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
        <div>
          <div style={{fontSize:10,color:ACCENT,fontWeight:600,letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:3}}>Alexander Cabanillas · CEO Vendify</div>
          <div style={{fontSize:28,fontWeight:500,color:'var(--color-text-primary)',lineHeight:1,letterSpacing:'-0.02em',fontVariantNumeric:'tabular-nums'}}>{timeStr}</div>
          <div style={{fontSize:12,color:'var(--color-text-secondary)',marginTop:4}}>{dateStr}</div>
        </div>
        <div style={{textAlign:'right'}}>
          <div style={{fontSize:10,color:'var(--color-text-secondary)',marginBottom:5}}>hábitos hoy</div>
          <div style={{fontSize:22,fontWeight:500,color:hDone===HABITS.length?ACCENT:'var(--color-text-primary)',lineHeight:1}}>
            {hDone}<span style={{fontSize:12,color:'var(--color-text-secondary)',fontWeight:400}}>/{HABITS.length}</span>
          </div>
          <div style={{display:'flex',gap:2,justifyContent:'flex-end',marginTop:5}}>
            {HABITS.map(h=><div key={h.id} style={{width:8,height:8,borderRadius:2,background:todayH[h.id]?ACCENT:'var(--color-border-secondary)'}}/>)}
          </div>
        </div>
      </div>

      {/* ── NAV ── */}
      <div style={{display:'flex',borderBottom:'0.5px solid var(--color-border-tertiary)'}}>
        {[['hoy','Hoy'],['semana','Semana'],['habitos','Hábitos'],['metas','Metas'],['notion','Notion']].map(([id,lbl])=>(
          <button key={id} onClick={()=>setTab(id)} style={{flex:1,padding:'9px 2px',fontSize:11,border:'none',borderBottom:tab===id?`2px solid ${ACCENT}`:'2px solid transparent',background:'transparent',color:tab===id?ACCENT:'var(--color-text-secondary)',cursor:'pointer',fontWeight:tab===id?600:400}}>
            {lbl}
          </button>
        ))}
      </div>

      <div style={{padding:'14px 16px'}}>

        {/* ══════ HOY ══════ */}
        {tab==='hoy'&&(
          <div>
            {curBlock ? (
              <>
                <div style={{fontSize:10,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.1em',color:'var(--color-text-secondary)',marginBottom:8}}>Ahora mismo</div>
                <div style={{background:'var(--color-background-secondary)',borderRadius:10,padding:'12px 14px',borderLeft:`3px solid ${TC[curBlock.t]}`,marginBottom:16}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8,marginBottom:10}}>
                    <div style={{flex:1}}>
                      <div style={{fontSize:16,fontWeight:500,color:'var(--color-text-primary)'}}>{curBlock.a}</div>
                      {curBlock.n&&<div style={{fontSize:12,color:'var(--color-text-secondary)',marginTop:3}}>{curBlock.n}</div>}
                    </div>
                    {pill(TC[curBlock.t], TL[curBlock.t])}
                  </div>
                  <div style={{height:4,background:'var(--color-border-tertiary)',borderRadius:2,overflow:'hidden',marginBottom:6}}>
                    <div style={{height:'100%',width:`${blockPct(curBlock,nowMins)}%`,background:TC[curBlock.t],borderRadius:2,transition:'width 1s linear'}}/>
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between'}}>
                    <span style={{fontSize:11,color:'var(--color-text-secondary)'}}>{curBlock.s}</span>
                    <span style={{fontSize:11,color:TC[curBlock.t],fontWeight:600}}>{blockPct(curBlock,nowMins)}%</span>
                    <span style={{fontSize:11,color:'var(--color-text-secondary)'}}>{curBlock.e==='23:59'?'00:00':curBlock.e}</span>
                  </div>
                </div>
                {nextBlocks.length>0&&(
                  <>
                    <div style={{fontSize:10,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.1em',color:'var(--color-text-secondary)',marginBottom:8}}>A continuación</div>
                    {nextBlocks.map((b,i)=>(
                      <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'7px 0',borderBottom:'0.5px solid var(--color-border-tertiary)'}}>
                        <span style={{fontSize:11,color:'var(--color-text-secondary)',minWidth:90,whiteSpace:'nowrap',fontVariantNumeric:'tabular-nums'}}>{b.s} – {b.e==='23:59'?'00:00':b.e}</span>
                        <span style={{width:8,height:8,borderRadius:'50%',background:TC[b.t],flexShrink:0}}/>
                        <span style={{fontSize:13,color:'var(--color-text-primary)',flex:1}}>{b.a}</span>
                      </div>
                    ))}
                  </>
                )}
              </>
            ) : (
              <div style={{textAlign:'center',padding:'32px 0',color:'var(--color-text-secondary)'}}>
                <div style={{fontSize:32,opacity:.3,marginBottom:8}}>—</div>
                <div style={{fontSize:13}}>Hora de descanso. El sistema se reanuda mañana.</div>
              </div>
            )}
            <div style={{marginTop:20}}>
              <div style={{fontSize:10,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.1em',color:'var(--color-text-secondary)',marginBottom:8}}>Hábitos de hoy</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
                {HABITS.map(h=>{
                  const done=!!todayH[h.id]
                  return(
                    <div key={h.id} onClick={()=>toggleH(h.id)} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 12px',background:'var(--color-background-secondary)',borderRadius:8,cursor:'pointer',border:`0.5px solid ${done?ACCENT:'var(--color-border-tertiary)'}`}}>
                      <div style={{width:17,height:17,borderRadius:4,border:`1.5px solid ${done?ACCENT:'var(--color-border-secondary)'}`,background:done?ACCENT:'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                        {done&&<span style={{color:'white',fontSize:11,fontWeight:700,lineHeight:1}}>✓</span>}
                      </div>
                      <span style={{fontSize:12,color:done?ACCENT:'var(--color-text-primary)',fontWeight:done?500:400}}>{h.l}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ══════ SEMANA ══════ */}
        {tab==='semana'&&(
          <div>
            <div style={{display:'flex',gap:4,flexWrap:'wrap',marginBottom:14}}>
              {DK.map(d=>(
                <button key={d} onClick={()=>setSelDay(d)} style={{padding:'5px 10px',fontSize:12,borderRadius:7,border:`0.5px solid ${activeDay===d?ACCENT:'var(--color-border-secondary)'}`,background:activeDay===d?ACCENT:'var(--color-background-primary)',color:activeDay===d?'white':'var(--color-text-secondary)',cursor:'pointer',fontWeight:activeDay===d?500:400}}>
                  {DN[d].slice(0,3)}
                </button>
              ))}
            </div>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
              <span style={{fontSize:16,fontWeight:500,color:'var(--color-text-primary)'}}>{DN[activeDay]}</span>
              {activeDay===todayKey&&pill(ACCENT,'hoy')}
            </div>
            {activeBlocks.map((b,i)=>(
              <div key={i} style={{display:'flex',alignItems:'flex-start',gap:10,padding:i===activeCurIdx?'8px 10px':'7px 2px',borderBottom:'0.5px solid var(--color-border-tertiary)',borderRadius:i===activeCurIdx?6:0,background:i===activeCurIdx?`${TC[b.t]}12`:'transparent'}}>
                <span style={{fontSize:11,color:'var(--color-text-secondary)',minWidth:86,paddingTop:2,whiteSpace:'nowrap',fontVariantNumeric:'tabular-nums',flexShrink:0}}>{b.s}–{b.e==='23:59'?'00:00':b.e}</span>
                <span style={{width:9,height:9,borderRadius:'50%',background:TC[b.t],flexShrink:0,marginTop:3}}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:i===activeCurIdx?500:400,color:'var(--color-text-primary)'}}>{b.a}</div>
                  {b.n&&<div style={{fontSize:11,color:'var(--color-text-secondary)',marginTop:1}}>{b.n}</div>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ══════ HÁBITOS ══════ */}
        {tab==='habitos'&&(()=>{
          const days7=Array.from({length:7},(_,i)=>{const d=new Date(now);d.setDate(d.getDate()-(6-i));return tdk(d)})
          const labs=days7.map(dk=>{ const d=new Date(dk); return d.toLocaleDateString('es-PE',{weekday:'short'}).slice(0,2) })
          return(
            <div>
              <div style={{fontSize:10,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.1em',color:'var(--color-text-secondary)',marginBottom:10}}>Últimos 7 días — toca para marcar</div>
              <div style={{display:'grid',gridTemplateColumns:'100px repeat(7,1fr)',gap:3,marginBottom:4}}>
                <div/>
                {labs.map((l,i)=><div key={i} style={{textAlign:'center',fontSize:11,color:days7[i]===dateKey?ACCENT:'var(--color-text-secondary)',fontWeight:days7[i]===dateKey?600:400}}>{l}</div>)}
              </div>
              {HABITS.map(h=>{
                let streak=0
                for(let i=days7.length-1;i>=0;i--){if(habits[days7[i]]?.[h.id])streak++;else break}
                return(
                  <div key={h.id} style={{display:'grid',gridTemplateColumns:'100px repeat(7,1fr)',gap:3,marginBottom:3,alignItems:'center'}}>
                    <div style={{fontSize:11,color:'var(--color-text-primary)',display:'flex',alignItems:'center',gap:4,overflow:'hidden'}}>
                      <span style={{whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{h.l}</span>
                      {streak>1&&<span style={{fontSize:10,color:ACCENT,fontWeight:700,flexShrink:0}}>{streak}d</span>}
                    </div>
                    {days7.map((dk,i)=>(
                      <div key={i} onClick={()=>toggleH(h.id,dk)} style={{height:26,borderRadius:4,background:habits[dk]?.[h.id]?ACCENT:'var(--color-background-secondary)',border:`0.5px solid ${habits[dk]?.[h.id]?ACCENT:'var(--color-border-tertiary)'}`,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                        {habits[dk]?.[h.id]&&<span style={{color:'white',fontSize:10,fontWeight:700}}>✓</span>}
                      </div>
                    ))}
                  </div>
                )
              })}
              <div style={{marginTop:12,fontSize:11,color:'var(--color-text-tertiary)'}}>El número junto al hábito es tu racha de días consecutivos.</div>
            </div>
          )
        })()}

        {/* ══════ METAS ══════ */}
        {tab==='metas'&&(
          <div>
            <div style={{fontSize:10,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.1em',color:'var(--color-text-secondary)',marginBottom:10}}>Objetivos — toca el valor para actualizar</div>
            {goals.map(g=>{
              const range=g.target-g.start
              const pct=range===0?0:Math.min(100,Math.max(0,Math.round(((g.current-g.start)/range)*100)))
              const gc=GC[g.cat]||ACCENT
              return(
                <div key={g.id} style={{background:'var(--color-background-secondary)',borderRadius:10,padding:'12px 14px',marginBottom:10}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8,marginBottom:10}}>
                    <div>
                      {pill(gc,g.cat)}
                      <div style={{fontSize:14,fontWeight:500,color:'var(--color-text-primary)',marginTop:5}}>{g.label}</div>
                    </div>
                    {editId===g.id?(
                      <div style={{display:'flex',gap:4,alignItems:'center',flexShrink:0}}>
                        <input type="number" value={editVal} onChange={e=>setEditVal(e.target.value)} style={{width:55,fontSize:13,padding:'3px 6px',textAlign:'center'}} autoFocus/>
                        <button onClick={()=>{const ng=goals.map(x=>x.id===g.id?{...x,current:parseFloat(editVal)||x.current}:x);saveG(ng);setEditId(null)}} style={{fontSize:12,padding:'3px 8px',background:ACCENT,color:'white',border:'none',borderRadius:4,cursor:'pointer'}}>OK</button>
                        <button onClick={()=>setEditId(null)} style={{fontSize:12,padding:'3px 6px',background:'transparent',color:'var(--color-text-secondary)',border:'0.5px solid var(--color-border-secondary)',borderRadius:4,cursor:'pointer'}}>✕</button>
                      </div>
                    ):(
                      <div onClick={()=>{setEditId(g.id);setEditVal(String(g.current))}} style={{cursor:'pointer',textAlign:'right',flexShrink:0}}>
                        <span style={{fontSize:20,fontWeight:500,color:'var(--color-text-primary)'}}>{g.current}</span>
                        <span style={{fontSize:11,color:'var(--color-text-secondary)'}}> / {g.target} {g.unit}</span>
                      </div>
                    )}
                  </div>
                  <div style={{height:5,background:'var(--color-border-tertiary)',borderRadius:3,overflow:'hidden',marginBottom:5}}>
                    <div style={{height:'100%',width:`${pct}%`,background:gc,borderRadius:3}}/>
                  </div>
                  <div style={{fontSize:11,color:'var(--color-text-secondary)'}}>{pct}% completado</div>
                </div>
              )
            })}
          </div>
        )}

        {/* ══════ NOTION ══════ */}
        {tab==='notion'&&(
          <div>
            <div style={{background:'var(--color-background-secondary)',borderRadius:10,padding:'12px 14px',borderLeft:`3px solid ${ACCENT}`,marginBottom:12}}>
              <div style={{fontSize:14,fontWeight:500,color:'var(--color-text-primary)',marginBottom:4}}>Sync con Notion</div>
              <div style={{fontSize:12,color:'var(--color-text-secondary)',lineHeight:1.6}}>Extrae tus tareas directamente desde tu workspace de Notion usando tu cuenta conectada en Claude.</div>
            </div>
            <button onClick={fetchNotion} disabled={notionLoading} style={{width:'100%',padding:11,background:notionLoading?'var(--color-background-secondary)':ACCENT,color:notionLoading?'var(--color-text-secondary)':'white',border:notionLoading?'0.5px solid var(--color-border-secondary)':'none',borderRadius:8,fontSize:13,cursor:notionLoading?'not-allowed':'pointer',fontWeight:500,marginBottom:12}}>
              {notionLoading?'Conectando con Notion...':'Cargar tareas de Notion'}
            </button>
            {notionErr&&<div style={{fontSize:12,color:'#ef4444',padding:'10px 12px',background:'var(--color-background-secondary)',borderRadius:8,borderLeft:'3px solid #ef4444',marginBottom:12}}>{notionErr}</div>}
            {notionTasks!==null&&!notionErr&&(
              notionTasks.length===0?(
                <div style={{textAlign:'center',padding:24,color:'var(--color-text-secondary)',fontSize:13}}>No se encontraron tareas en tu workspace de Notion.</div>
              ):(
                <div>
                  <div style={{fontSize:11,color:'var(--color-text-secondary)',marginBottom:10}}>{notionTasks.length} tareas encontradas</div>
                  {notionTasks.map((task,i)=>(
                    <div key={i} style={{display:'flex',alignItems:'flex-start',gap:10,padding:'9px 0',borderBottom:'0.5px solid var(--color-border-tertiary)'}}>
                      <div style={{width:10,height:10,borderRadius:2,border:`1.5px solid ${ACCENT}`,marginTop:3,flexShrink:0}}/>
                      <div style={{flex:1}}>
                        <div style={{fontSize:13,fontWeight:500,color:'var(--color-text-primary)'}}>{task.title}</div>
                        <div style={{display:'flex',gap:8,marginTop:3,flexWrap:'wrap'}}>
                          {task.status&&<span style={{fontSize:11,color:'var(--color-text-secondary)'}}>{task.status}</span>}
                          {task.category&&<span style={{fontSize:11,color:ACCENT}}>{task.category}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        )}

      </div>
    </div>
  )
}