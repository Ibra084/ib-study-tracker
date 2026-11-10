import {useState} from 'react';
import {Link} from 'react-router-dom';
import {format} from 'date-fns';
import {Eye,PartyPopper,Pencil,Trash2,Plus,Brain,Clock} from 'lucide-react';
import {useData,useItemSave} from '../hooks/useData';
import {today,shift,of,profileOf,dueQueue,schedule,redo,ratings,staggered,when,type Topic,type Mistake} from '../lib/review';
import {mistakeReasonInfo} from '../lib/content';
import {PageHeading,SubjectChip,SubjectSelect,Empty,formText} from '../components/Ui';
import {Modal} from '../components/Modal';
const strength=(interval:number)=>interval>=21?{label:'Strong',tone:'good'}:interval>=7?{label:'Getting there',tone:'mid'}:{label:'Learning',tone:'new'};
export default function Review(){
 const data=useData(),save=useItemSave(),[revealed,setRevealed]=useState(false),[count,setCount]=useState(0),[filter,setFilter]=useState(''),[edit,setEdit]=useState<Topic>(),[error,setError]=useState('');
 const day=today(),profile=profileOf(data.items),queue=dueQueue(data.items,day),current=queue[0],topics=of(data.items,'topic'),subjects=data.subjects.filter(s=>!s.archived);
 const upcoming=[...topics.map(t=>t.data.due),...of(data.items,'mistake').map(m=>m.data.due)].filter((d):d is string=>!!d&&d>day).sort()[0];
 const run=async(action:()=>Promise<unknown>)=>{setError('');try{await action();return true;}catch(e){setError((e as Error).message);return false;}};
 const answer=(next:Topic|Mistake)=>run(async()=>{await save.put(next);setRevealed(false);setCount(c=>c+1);});
 const shown=topics.filter(t=>!filter||t.data.subject_id===filter).sort((a,b)=>a.data.due.localeCompare(b.data.due));
 const subject=(id:string)=>data.subjects.find(s=>s.id===id);
 return <>
 <PageHeading eyebrow="Spaced retrieval" title="Review" lead={queue.length?`${queue.length} due now. Recall first, then check.`:'You’re all caught up.'}>{count>0&&<span className="count-pill"><strong>{count}</strong><span>reviewed this session</span></span>}</PageHeading>
 {error&&<p className="error-banner" role="alert">{error}</p>}
 <section className="card review-stage" aria-live="polite">
 {current?current.kind==='topic'?<div className="flashcard">
 <div className="flashcard-meta"><SubjectChip subject={subject(current.data.subject_id)}/><span className="muted">{current.data.reviews?`Last seen ${current.data.last_reviewed?format(new Date(current.data.last_reviewed+'T00:00:00'),'d MMM'):''}`:'First review'}</span></div>
 <h2 className="flashcard-title">{current.data.name}</h2>
 {!revealed?<><ol className="steps"><li>Close your notes.</li><li>Write or say everything you remember: definitions, steps, examples, diagrams.</li><li>Then reveal and check what you missed.</li></ol><button className="primary large" onClick={()=>setRevealed(true)}><Eye size={18}/> I’ve recalled it, check now</button></>:<>
 {current.data.notes?<div className="reveal-notes"><span className="eyebrow">Your notes</span><p>{current.data.notes}</p></div>:<p className="muted">No notes saved for this topic. Check against your class notes or textbook.</p>}
 <p className="rate-prompt">How well did you remember it?</p>
 <div className="rating-grid">{ratings.map(r=>{const next=schedule(current.data,r.value,profile,day);return <button key={r.value} className={`rating rating-${r.value}`} disabled={save.isPending} onClick={()=>answer({...current,data:next})}><strong>{r.label}</strong><span>{r.hint}</span><small>Next: {when(next.due)}</small></button>;})}</div></>}
 <button className="text-link skip-card" onClick={()=>answer({...current,data:{...current.data,due:shift(day,1)}})}>Skip until tomorrow</button>
 </div>:<div className="flashcard">
 <div className="flashcard-meta"><SubjectChip subject={subject(current.data.subject_id)}/><span className="badge badge-sat">Error log</span>{current.data.area&&<span className="muted">{current.data.area}</span>}</div>
 <h2 className="flashcard-title">Redo this question</h2><p className="question-text">{current.data.question}</p>{current.data.source&&<p className="muted">From {current.data.source}</p>}
 {!revealed?<button className="primary large" onClick={()=>setRevealed(true)}><Eye size={18}/> I’ve solved it, show my fix</button>:<>
 <div className="reveal-notes"><span className="eyebrow">Why you missed it · {mistakeReasonInfo[current.data.reason].label}</span><p>{current.data.fix||mistakeReasonInfo[current.data.reason].advice}</p></div>
 <div className="rating-grid two">{[false,true].map(ok=>{const next=redo(current.data,ok,day);return <button key={String(ok)} className={`rating rating-${ok?3:1}`} disabled={save.isPending} onClick={()=>answer({...current,data:next})}><strong>{ok?'Got it right':'Still wrong'}</strong><small>{next.due?`Again ${when(next.due)}`:'Retire this mistake'}</small></button>;})}</div></>}
 </div>
 :<div className="all-done"><PartyPopper size={34}/><h2>Nothing due right now</h2><p className="muted">{upcoming?`Your next review is ${when(upcoming)}.`:'Add the topics you’re learning below. They’ll come back just before you’d forget them.'}</p><Link className="text-link" to="/playbook#spacing">Why spacing works</Link></div>}
 </section>
 <div className="two-columns review-library">
 <section className="card"><div className="card-heading"><div><h2>Add topics</h2><p>One per line. Paste straight from your syllabus.</p></div><Brain size={20}/></div>
 <form onSubmit={async e=>{e.preventDefault();const form=e.currentTarget,f=new FormData(form);const names=formText(f,'names').split('\n').map(s=>s.trim()).filter(Boolean).slice(0,200);if(!names.length)return;const dues=staggered(names.length,5,day);
 if(await run(()=>save.put(names.map((name,i)=>({id:crypto.randomUUID(),kind:'topic' as const,data:{subject_id:formText(f,'subject'),name:name.slice(0,120),notes:names.length===1?formText(f,'notes'):'',interval:0,due:dues[i],reviews:0,lapses:0,last_rating:null,last_reviewed:null}})))))form.reset();}}>
 <SubjectSelect subjects={subjects}/>
 <label>Topics<textarea name="names" rows={4} required placeholder={'Vectors: scalar product\nKinematics: SUVAT\nMarket failure: externalities'}/></label>
 <label><span>Key points to check against <span className="muted">· optional, for a single topic</span></span><textarea name="notes" rows={2} maxLength={2000}/></label>
 <button className="primary" disabled={save.isPending}><Plus size={16}/> Add to review</button>
 <p className="muted small-text">Large batches are spread across the next few days, five a day.</p>
 </form></section>
 <section className="card"><div className="card-heading"><div><h2>Your topics</h2><p>{topics.length} topic{topics.length===1?'':'s'} in rotation</p></div><label className="compact-label"><span className="sr-only">Filter by subject</span><select value={filter} onChange={e=>setFilter(e.target.value)}><option value="">All subjects</option>{data.subjects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label></div>
 {shown.length?<ul className="topic-list">{shown.map(t=>{const s=strength(t.data.interval);return <li key={t.id}><span className="color-dot" style={{background:subject(t.data.subject_id)?.color}}/><div><strong>{t.data.name}</strong><span><Clock size={12}/> {t.data.due<=day?'Due now':when(t.data.due)} · <em className={`strength strength-${s.tone}`}>{s.label}</em></span></div><button className="icon-button" aria-label={`Edit ${t.data.name}`} onClick={()=>setEdit(t)}><Pencil size={15}/></button><button className="icon-button" aria-label={`Delete ${t.data.name}`} onClick={()=>run(()=>save.remove(t.id))}><Trash2 size={15}/></button></li>;})}</ul>:<Empty title="No topics yet">Add what you learned this week, or load the official SAT skill list from the <Link to="/sat">SAT page</Link>.</Empty>}
 </section>
 </div>
 {edit&&<Modal title="Edit topic" onClose={()=>setEdit(undefined)}><form onSubmit={async e=>{e.preventDefault();const f=new FormData(e.currentTarget);if(await run(()=>save.put({...edit,data:{...edit.data,name:formText(f,'name'),notes:formText(f,'notes'),subject_id:formText(f,'subject'),...(f.get('reset')?{interval:0,due:day}:{})}})))setEdit(undefined);}}>
 <label>Topic<input name="name" defaultValue={edit.data.name} required maxLength={120}/></label><SubjectSelect subjects={data.subjects} defaultValue={edit.data.subject_id}/><label>Key points<textarea name="notes" rows={4} maxLength={2000} defaultValue={edit.data.notes}/></label><label className="checkbox-label"><input type="checkbox" name="reset"/>Start this topic over and review it today</label>
 {error&&<p className="error" role="alert">{error}</p>}<div className="dialog-actions"><button type="button" className="secondary" onClick={()=>setEdit(undefined)}>Cancel</button><button className="primary" disabled={save.isPending}>Save topic</button></div></form></Modal>}
 </>;
}
