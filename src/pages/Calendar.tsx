import {useMemo,useState} from 'react';
import {useSearchParams} from 'react-router-dom';
import {format,parseISO,addMonths} from 'date-fns';
import {ChevronLeft,ChevronRight,Plus,AlertTriangle,Sparkles,School} from 'lucide-react';
import {useData,useItemSave} from '../hooks/useData';
import {today,shift,profileOf,of,when} from '../lib/review';
import {entriesOf,weekDays,monthCells,heavyDays,suggestRevision,blockToTask,type Entry} from '../lib/planner';
import {PROFILE_ID} from '../lib/defaults';
import {WeekView,MonthView,UpcomingView} from '../components/CalendarViews';
import {EntryDialog,type Draft} from '../components/EntryDialog';
import {PageHeading,formText} from '../components/Ui';
import {Modal} from '../components/Modal';
type View='week'|'month'|'upcoming';
const views:{value:View;label:string}[]=[{value:'week',label:'Week'},{value:'month',label:'Month'},{value:'upcoming',label:'Upcoming'}];
export default function Calendar(){
 const data=useData(),save=useItemSave(),[params,setParams]=useSearchParams(),day=today();
 const view=(views.some(v=>v.value===params.get('view'))?params.get('view'):'week') as View,anchor=params.get('date')||day;
 const go=(next:{view?:View;date?:string})=>setParams({view:next.view||view,date:next.date||anchor},{replace:true});
 const [open,setOpen]=useState<Entry>(),[draft,setDraft]=useState<Draft>(),[schoolOpen,setSchoolOpen]=useState(false),[showAll,setShowAll]=useState(false),[error,setError]=useState('');
 const profile=profileOf(data.items),entries=useMemo(()=>entriesOf(data.items),[data.items]);
 const heavy=heavyDays(entries,day),heavySet=new Set(heavy.map(h=>h.date));
 const suggestions=suggestRevision(data.items,profile,day);
 // A dismissed or far-off test can still be planned on request.
 const planFor=(id:string)=>suggestRevision(data.items.map(i=>i.id===id&&i.kind==='event'?{...i,data:{...i.data,plan_dismissed:false}}:i),profile,day,365).find(s=>s.test.id===id);
 const run=async(action:()=>Promise<unknown>)=>{setError('');try{await action();}catch(e){setError((e as Error).message);}};
 const addPlan=(id:string)=>{const s=planFor(id);if(s)void run(()=>save.put(s.blocks.map(blockToTask)));};
 const blocksFor=(id:string)=>entries.filter(e=>e.source==='task'&&of(data.items,'task').some(t=>t.id===e.id&&t.data.event_id===id));
 const days=weekDays(anchor),cells=monthCells(anchor);
 const step=(n:number)=>go({date:view==='month'?format(addMonths(parseISO(anchor),n),'yyyy-MM-dd'):shift(anchor,7*n)});
 const range=view==='month'?format(parseISO(anchor),'MMMM yyyy'):view==='week'?`${format(parseISO(days[0]),'d MMM')} – ${format(parseISO(days[6]),'d MMM yyyy')}`:'Next six weeks';
 return <>
 <PageHeading eyebrow="Plan ahead" title="Calendar" lead="Tests, deadlines and study blocks in one place. Click an empty slot to plan a study block."><button className="primary" onClick={()=>setDraft({type:'test',date:anchor>=day?anchor:day})}><Plus size={16}/> Add</button></PageHeading>
 {error&&<p className="error-banner" role="alert">{error}</p>}
 {heavy.length>0&&<div className="notice heavy-notice"><AlertTriangle size={18}/><div><strong>Busy days ahead.</strong> Start revising early so the night before stays light.<ul>{heavy.map(h=><li key={h.date}><button className="text-link" onClick={()=>go({view:'week',date:h.date})}>{format(parseISO(h.date),'EEE d MMM')}</button> · {h.tests.length} tests, {when(h.date)}: {h.tests.map(t=>t.title).join(', ')}</li>)}</ul></div></div>}
 {suggestions.length>0&&<section className="card suggest-card"><div className="card-heading"><div><h2><Sparkles size={18}/> Suggested revision</h2><p>Spaced blocks before each test: recall, then practice, then a light review the night before. Times avoid school and each other.</p></div><button className="primary" disabled={save.isPending} onClick={()=>void run(()=>save.put(suggestions.flatMap(s=>s.blocks.map(blockToTask))))}>Add all ({suggestions.reduce((n,s)=>n+s.blocks.length,0)})</button></div>
 <div className="suggest-list">{suggestions.slice(0,showAll?undefined:3).map(s=>{const subject=data.subjects.find(x=>x.id===s.test.data.subject_id);return <div key={s.test.id} className="suggest-item" style={{borderLeftColor:subject?.color}}>
  <div className="suggest-head"><strong>{s.test.data.title}</strong><span className="muted">{format(parseISO(s.test.data.date),'EEE d MMM')}{s.test.data.period?` · ${s.test.data.period}`:''} · {when(s.test.data.date)}</span></div>
  <ul>{s.blocks.map(b=><li key={b.date+b.start}><span>{format(parseISO(b.date),'EEE d')} · {b.start}–{b.end}</span><strong>{b.title.replace(/:.*$/,'')}</strong></li>)}</ul>
  <div className="suggest-actions"><button className="secondary" disabled={save.isPending} onClick={()=>void run(()=>save.put(s.blocks.map(blockToTask)))}>Add {s.blocks.length}</button><button className="text-link" onClick={()=>void run(()=>save.put({...s.test,data:{...s.test.data,plan_dismissed:true}}))}>Not needed</button></div>
 </div>;})}</div>{suggestions.length>3&&<button className="text-link suggest-more" aria-expanded={showAll} onClick={()=>setShowAll(v=>!v)}>{showAll?'Show fewer':`Show all ${suggestions.length} tests`}</button>}</section>}
 <section className="card calendar-card">
 <div className="cal-toolbar">
  <div className="segmented" role="tablist" aria-label="Calendar view">{views.map(v=><button key={v.value} role="tab" aria-selected={view===v.value} className={view===v.value?'active':''} onClick={()=>go({view:v.value})}>{v.label}</button>)}</div>
  {view!=='upcoming'&&<div className="cal-nav"><button className="icon-button" aria-label={`Previous ${view}`} onClick={()=>step(-1)}><ChevronLeft size={18}/></button><button className="secondary small" onClick={()=>go({date:day})}>Today</button><button className="icon-button" aria-label={`Next ${view}`} onClick={()=>step(1)}><ChevronRight size={18}/></button></div>}
  <h2 className="cal-range">{range}</h2>
  <button className="text-link school-link" onClick={()=>setSchoolOpen(true)}><School size={15}/> School {profile.school_start}–{profile.school_end}</button>
 </div>
 {view==='week'&&<WeekView days={days} entries={entries} subjects={data.subjects} onOpen={setOpen} today={day} profile={profile} heavy={heavySet} onSlot={(date,start)=>setDraft({type:'study',date,start})}/>}
 {view==='month'&&<MonthView month={anchor} cells={cells} entries={entries} subjects={data.subjects} onOpen={setOpen} today={day} heavy={heavySet} onDay={d=>go({view:'week',date:d})}/>}
 {view==='upcoming'&&<UpcomingView entries={entries} subjects={data.subjects} onOpen={setOpen} today={day} blocksFor={blocksFor} onPlan={addPlan} canPlan={id=>!!planFor(id)} onAdd={()=>setDraft({type:'test',date:day})}/>}
 <div className="cal-legend" aria-hidden><span className="cal-chip cal-test">Test</span><span className="cal-chip cal-deadline">Deadline</span><span className="cal-chip cal-event">Other</span><span className="cal-chip cal-study">Study block</span></div>
 </section>
 {(open||draft)&&<EntryDialog key={open?.id||'new'} entry={open} draft={draft} onClose={()=>{setOpen(undefined);setDraft(undefined);}} onPlan={addPlan} canPlan={id=>!!planFor(id)}/>}
 {schoolOpen&&<Modal title="School hours" onClose={()=>setSchoolOpen(false)}><form onSubmit={e=>{e.preventDefault();const f=new FormData(e.currentTarget);const start=formText(f,'start'),end=formText(f,'end');if(end<=start){setError('School must end after it starts.');return;}void run(()=>save.put({id:PROFILE_ID,kind:'profile',data:{...profile,school_start:start,school_end:end}})).then(()=>setSchoolOpen(false));}}>
  <p className="muted">Shaded Monday to Friday. Suggested revision starts about 40 minutes after school ends.</p>
  <div className="form-grid"><label>Starts<input name="start" type="time" required defaultValue={profile.school_start}/></label><label>Ends<input name="end" type="time" required defaultValue={profile.school_end}/></label></div>
  <div className="dialog-actions"><button type="button" className="secondary" onClick={()=>setSchoolOpen(false)}>Cancel</button><button className="primary" disabled={save.isPending}>Save</button></div></form></Modal>}
 </>;
}
