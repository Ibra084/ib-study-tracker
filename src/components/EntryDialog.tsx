import {useState} from 'react';
import {Link} from 'react-router-dom';
import {format,parseISO} from 'date-fns';
import {Play,Check,Pencil,Trash2,CalendarPlus} from 'lucide-react';
import {useData,useItemSave} from '../hooks/useData';
import {of,when,today} from '../lib/review';
import {timeRange,toMin,type Entry,type CalEvent,type Task} from '../lib/planner';
import {focusActivity} from './Timer';
import {Modal} from './Modal';
import {SubjectChip,formText} from './Ui';
export type Draft={type:'test'|'deadline'|'event'|'study';date:string;start?:string;eventId?:string};
const types=[{value:'test',label:'Test'},{value:'deadline',label:'Deadline'},{value:'study',label:'Study block'},{value:'event',label:'Other'}] as const;
const placeholders={test:'Chemistry Paper 1a (MCQ)',deadline:'Gatsby essay',event:'Parents’ evening',study:'Practice questions: moles'};
const nice=(d:string)=>format(parseISO(d),'EEEE d MMMM');
const plus=(t:string,m:number)=>{const n=Math.min(23*60+59,toMin(t)+m);return `${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;};
// One dialog for the whole calendar: view details, then edit, or add something new.
export function EntryDialog({entry,draft,onClose,onPlan,canPlan}:{entry?:Entry;draft?:Draft;onClose:()=>void;onPlan:(id:string)=>void;canPlan:(id:string)=>boolean}){
 const data=useData(),save=useItemSave(),[editing,setEditing]=useState(!entry),[error,setError]=useState(''),[confirmDelete,setConfirmDelete]=useState(false);
 const event=entry?.source==='event'?of(data.items,'event').find(e=>e.id===entry.id):undefined,task=entry?.source==='task'?of(data.items,'task').find(t=>t.id===entry.id):undefined,milestone=entry?.source==='milestone'?of(data.items,'milestone').find(m=>m.id===entry.id):undefined;
 const initialType:Draft['type']=draft?.type||(task?'study':event?event.data.category:'event');
 const [type,setType]=useState<Draft['type']>(initialType),[mode,setMode]=useState<'allday'|'period'|'time'>(event?.data.start?'time':event?.data.period?'period':draft?.start?'time':'allday');
 const subjects=data.subjects.filter(s=>!s.archived||s.id===entry?.subject_id),day=today();
 const tests=of(data.items,'event').filter(e=>e.data.category==='test'&&(e.data.date>=day||e.id===task?.data.event_id)).sort((a,b)=>a.data.date.localeCompare(b.data.date));
 const linkedBlocks=event?of(data.items,'task').filter(t=>t.data.event_id===event.id).sort((a,b)=>a.data.date.localeCompare(b.data.date)||(a.data.start||'').localeCompare(b.data.start||'')):[];
 const run=async(action:()=>Promise<unknown>,close=true)=>{setError('');try{await action();if(close)onClose();}catch(e){setError((e as Error).message);}};
 const remove=()=>run(async()=>{if(entry){await save.remove(entry.id);for(const b of linkedBlocks)await save.remove(b.id);}});
 if(entry&&!editing)return <Modal title={entry.title} onClose={onClose}>
 <div className="entry-meta"><span className={`badge cal-badge-${entry.category}`}>{entry.label}</span><SubjectChip subject={data.subjects.find(s=>s.id===entry.subject_id)}/></div>
 <p className="entry-when"><strong>{nice(entry.date)}</strong>{timeRange(entry)&&` · ${timeRange(entry)}`} <span className="muted">· {when(entry.date)}</span></p>
 {entry.notes&&<div className="reveal-notes"><span className="eyebrow">{task?'Plan':'What’s on it'}</span><p>{entry.notes}</p></div>}
 {event?.data.category==='test'&&<div className="entry-blocks"><span className="eyebrow">Revision blocks</span>{linkedBlocks.length?<ul>{linkedBlocks.map(b=><li key={b.id} className={b.data.done?'done':''}><button className="check" role="checkbox" aria-checked={b.data.done} aria-label={`Mark ${b.data.title} ${b.data.done?'not done':'done'}`} onClick={()=>run(()=>save.put({...b,data:{...b.data,done:!b.data.done}}),false)}>{b.data.done&&<Check size={13}/>}</button><span>{format(parseISO(b.data.date),'EEE d MMM')} · {timeRange(b.data)}</span><strong>{b.data.title.replace(/:.*$/,'')}</strong></li>)}</ul>:<p className="muted small-text">None yet.</p>}
  {!linkedBlocks.length&&canPlan(event.id)&&<button className="secondary" onClick={()=>{onPlan(event.id);onClose();}}><CalendarPlus size={16}/> Plan revision</button>}</div>}
 {task&&(task.data.logged_minutes??0)>0&&<p className="muted small-text">{Math.round(task.data.logged_minutes)} min focused so far.</p>}
 {error&&<p className="error" role="alert">{error}</p>}
 <div className="dialog-actions wrap">
  {confirmDelete?<><span className="muted small-text">{linkedBlocks.length?`Also deletes its ${linkedBlocks.length} revision block${linkedBlocks.length===1?'':'s'}.`:'This can’t be undone.'}</span><button className="secondary" onClick={()=>setConfirmDelete(false)}>Keep</button><button className="danger" disabled={save.isPending} onClick={remove}>Delete</button></>:<>
  <button className="icon-button" aria-label="Delete" onClick={()=>setConfirmDelete(true)}><Trash2 size={17}/></button>
  {milestone?<><Link className="secondary" to="/ib" onClick={onClose}>Open IB prep</Link><button className="primary" onClick={()=>run(()=>save.put({...milestone,data:{...milestone.data,done:!milestone.data.done}}))}><Check size={16}/>{milestone.data.done?'Mark not done':'Mark done'}</button></>:<>
  <button className="secondary" onClick={()=>setEditing(true)}><Pencil size={15}/> Edit</button>
  {task&&<button className="secondary" onClick={()=>run(()=>save.put({...task,data:{...task.data,done:!task.data.done}}))}><Check size={16}/>{task.data.done?'Mark not done':'Mark done'}</button>}
  {task&&!task.data.done&&task.data.date===day&&!data.timer&&<button className="primary" onClick={()=>run(async()=>{const subject=subjects.find(s=>s.id===task.data.subject_id&&!s.archived)||subjects.find(s=>!s.archived);if(!subject)throw new Error('Add a subject first');await save.mutateAsync({path:'timer',body:{action:'start',subject_id:subject.id,activity_type_id:focusActivity(data),task_id:task.id}});window.scrollTo({top:0,behavior:'smooth'});})}><Play size={15}/> Start focus</button>}</>}</>}
 </div></Modal>;
 return <Modal title={entry?'Edit':'Add to calendar'} onClose={onClose}><form onSubmit={e=>{e.preventDefault();const f=new FormData(e.currentTarget);const start=formText(f,'start').slice(0,5)||null,end=formText(f,'end').slice(0,5)||null;
  if(start&&end&&end<=start){setError('End time must be after the start time.');return;}
  if(type==='study'){if(!start||!end){setError('Choose a start and end time.');return;}const base:Task['data']=task?.data||{date:'',title:'',cue:'',subject_id:null,minutes:null,done:false,logged_minutes:0,start:null,end:null,event_id:null};
   void run(()=>save.put({id:task?.id||crypto.randomUUID(),kind:'task',data:{...base,title:formText(f,'title'),date:formText(f,'date'),start,end,minutes:Math.max(5,Math.min(600,toMin(end)-toMin(start))),subject_id:formText(f,'subject')||null,cue:formText(f,'notes').slice(0,120),event_id:formText(f,'test')||null}}));return;}
  const base:CalEvent['data']=event?.data||{title:'',date:'',start:null,end:null,period:'',category:'test',subject_id:null,notes:'',plan_dismissed:false};
  void run(()=>save.put({id:event?.id||crypto.randomUUID(),kind:'event',data:{...base,title:formText(f,'title'),date:formText(f,'date'),category:type,subject_id:formText(f,'subject')||null,notes:formText(f,'notes'),start:mode==='time'?start:null,end:mode==='time'?end:null,period:mode==='period'?formText(f,'period'):''}}));}}>
 {!entry&&<div className="type-tabs" role="radiogroup" aria-label="What are you adding?">{types.map(t=><button type="button" key={t.value} role="radio" aria-checked={type===t.value} className={type===t.value?'active':''} onClick={()=>{setType(t.value);if(t.value==='study')setMode('time');}}>{t.label}</button>)}</div>}
 <label>{type==='study'?'What will you do?':'Title'}<input name="title" required maxLength={type==='study'?200:160} defaultValue={entry?.title} placeholder={placeholders[type]} autoFocus/></label>
 <div className="form-grid"><label>Subject<select name="subject" defaultValue={entry?.subject_id||''}><option value="">No subject</option>{subjects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label><label>Date<input name="date" type="date" required defaultValue={entry?.date||draft?.date}/></label></div>
 {type!=='study'&&<div className="segmented when-toggle" role="radiogroup" aria-label="When">{([['allday','All day'],['period','School period'],['time','Set time']] as const).map(([v,l])=><button type="button" key={v} role="radio" aria-checked={mode===v} className={mode===v?'active':''} onClick={()=>setMode(v)}>{l}</button>)}</div>}
 {type!=='study'&&mode==='period'&&<label>Period<input name="period" maxLength={30} defaultValue={event?.data.period||''} placeholder="Period 5" required/></label>}
 {(type==='study'||mode==='time')&&<div className="form-grid"><label>Start<input name="start" type="time" required defaultValue={entry?.start||draft?.start||(type==='deadline'?'23:59':'16:00')}/></label><label>End {type!=='study'&&<span className="muted">· optional</span>}<input name="end" type="time" required={type==='study'} defaultValue={entry?.end||(type==='study'?plus(entry?.start||draft?.start||'16:00',45):'')}/></label></div>}
 {type==='study'&&<label>For which test? <span className="muted">· optional</span><select name="test" defaultValue={task?.data.event_id||draft?.eventId||''}><option value="">Not linked</option>{tests.map(t=><option key={t.id} value={t.id}>{t.data.title} · {format(parseISO(t.data.date),'d MMM')}</option>)}</select></label>}
 <label>{type==='study'?'Notes':'What’s on it'} <span className="muted">· optional</span><textarea name="notes" rows={type==='study'?2:4} maxLength={type==='study'?120:4000} defaultValue={entry?.notes} placeholder={type==='study'?'e.g. Blurt, then check notes':'Topics, paper format, what to bring'}/></label>
 {error&&<p className="error" role="alert">{error}</p>}
 <div className="dialog-actions"><button type="button" className="secondary" onClick={()=>entry?setEditing(false):onClose()}>Cancel</button><button className="primary" disabled={save.isPending}>{entry?'Save changes':'Add'}</button></div>
 </form></Modal>;
}
