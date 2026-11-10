import {useState} from 'react';
import {format} from 'date-fns';
import {Plus,Trash2,Check,GraduationCap,CalendarCheck,FileText,Search} from 'lucide-react';
import {useData,useItemSave} from '../hooks/useData';
import {today,shift,of,profileOf,when,daysUntil,type Profile} from '../lib/review';
import {ibFacts,ibTips,commandTerms,mistakeReasonInfo,sources} from '../lib/content';
import {isSatSubject,PROFILE_ID} from '../lib/defaults';
import {milestoneCategories,mistakeReasons} from '../lib/schemas';
import {PageHeading,Empty,Source,SubjectSelect,SubjectChip,formText,formNumber} from '../components/Ui';
const nice=(d:string)=>format(new Date(d+'T00:00:00'),'EEE d MMM yyyy');
const REPORTED_START='2027-04-23';
export default function Ib(){
 const data=useData(),save=useItemSave(),[error,setError]=useState(''),[term,setTerm]=useState(''),[showDone,setShowDone]=useState(false);
 const day=today(),profile=profileOf(data.items),ibSubjects=data.subjects.filter(s=>!s.archived&&!isSatSubject(s.id)),subject=(id:string|null)=>data.subjects.find(s=>s.id===id);
 const milestones=of(data.items,'milestone').sort((a,b)=>a.data.date.localeCompare(b.data.date)),open=milestones.filter(m=>!m.data.done),done=milestones.filter(m=>m.data.done);
 const papers=of(data.items,'score').filter(s=>s.data.test==='ib').sort((a,b)=>b.data.date.localeCompare(a.data.date));
 const run=async(action:()=>Promise<unknown>)=>{setError('');try{await action();return true;}catch(e){setError((e as Error).message);return false;}};
 const saveProfile=(change:Partial<Profile>)=>run(()=>save.put({id:PROFILE_ID,kind:'profile',data:{...profile,...change}}));
 const predicted=ibSubjects.reduce((n,s)=>n+(profile.predicted[s.id]||0),0)+(profile.core_bonus||0),graded=ibSubjects.filter(s=>profile.predicted[s.id]).length;
 const terms=commandTerms.filter(t=>!term||`${t.term} ${t.meaning}`.toLowerCase().includes(term.toLowerCase()));
 return <>
 <PageHeading eyebrow="IB Diploma Programme" title="IB prep" lead="Deadlines, past papers and the exam skills that earn marks.">{profile.ib_exam_start&&daysUntil(profile.ib_exam_start)>=0&&<span className="count-pill"><strong>{daysUntil(profile.ib_exam_start)}</strong><span>days to exams</span></span>}</PageHeading>
 {error&&<p className="error-banner" role="alert">{error}</p>}
 <section className="card goal-strip">
 <form className="goal-form" key={profile.ib_exam_start||'none'} onSubmit={e=>{e.preventDefault();void saveProfile({ib_exam_start:formText(new FormData(e.currentTarget),'start')||null});}}>
 <label>First exam day<input name="start" type="date" defaultValue={profile.ib_exam_start||''}/></label>
 <button className="primary" disabled={save.isPending}>Save date</button>
 {!profile.ib_exam_start&&<button type="button" className="text-link" onClick={()=>saveProfile({ib_exam_start:REPORTED_START})}>Use 23 Apr 2027 (May session)</button>}
 </form>
 <p className="muted small-text">The May 2027 session reportedly starts on 23 April. Confirm your own papers with your IB coordinator. Reviews are timed to land before this date.</p>
 </section>
 <div className="fact-grid">{ibFacts.map(f=><div className="fact" key={f.label}><span>{f.label}</span><strong>{f.value}</strong><p>{f.detail}</p></div>)}</div>
 <div className="two-columns">
 <section className="card"><div className="card-heading"><div><h2>Deadlines</h2><p>IA drafts, EE checkpoints, TOK, mocks</p></div><CalendarCheck size={20}/></div>
 <form className="inline-form" onSubmit={async e=>{e.preventDefault();const form=e.currentTarget,f=new FormData(form);if(await run(()=>save.put({id:crypto.randomUUID(),kind:'milestone',data:{title:formText(f,'title'),date:formText(f,'date'),category:formText(f,'category') as typeof milestoneCategories[number],subject_id:formText(f,'subject')||null,done:false}})))form.reset();}}>
 <label className="span-2">What’s due<input name="title" required maxLength={160} placeholder="Physics IA first draft"/></label><label>Date<input name="date" type="date" required defaultValue={shift(day,14)}/></label><label>Type<select name="category">{milestoneCategories.map(c=><option key={c}>{c}</option>)}</select></label><SubjectSelect subjects={ibSubjects} optional/><button className="primary" disabled={save.isPending}><Plus size={16}/> Add deadline</button></form>
 {open.length?<ul className="deadline-list">{open.map(m=><li key={m.id} className={m.data.date<day?'late':''}><button className="check" role="checkbox" aria-checked={false} aria-label={`Mark “${m.data.title}” done`} onClick={()=>run(()=>save.put({...m,data:{...m.data,done:true}}))}/><span className={`badge badge-${m.data.category.toLowerCase()}`}>{m.data.category}</span><div><strong>{m.data.title}</strong><span>{[nice(m.data.date),when(m.data.date),subject(m.data.subject_id)?.name].filter(Boolean).join(' · ')}</span></div><button className="icon-button" aria-label={`Delete ${m.data.title}`} onClick={()=>run(()=>save.remove(m.id))}><Trash2 size={15}/></button></li>)}</ul>:<Empty title="No deadlines yet">Break big pieces (IA, EE, TOK essay) into dated steps: research question, outline, first draft, final.</Empty>}
 {done.length>0&&<button className="text-link" onClick={()=>setShowDone(v=>!v)}>{showDone?'Hide':'Show'} {done.length} completed</button>}
 {showDone&&<ul className="deadline-list done">{done.map(m=><li key={m.id}><button className="check" role="checkbox" aria-checked aria-label={`Mark “${m.data.title}” not done`} onClick={()=>run(()=>save.put({...m,data:{...m.data,done:false}}))}><Check size={14}/></button><div><strong>{m.data.title}</strong><span>{nice(m.data.date)}</span></div></li>)}</ul>}
 </section>
 <section className="card"><div className="card-heading"><div><h2>Points predictor</h2><p>Your predicted or target grades</p></div><GraduationCap size={20}/></div>
 <form key={JSON.stringify(profile)} onSubmit={e=>{e.preventDefault();const f=new FormData(e.currentTarget);const next:Record<string,number>={};for(const s of ibSubjects){const v=formNumber(f,s.id);if(v)next[s.id]=v;}void saveProfile({predicted:next,core_bonus:formNumber(f,'core')});}}>
 <div className="predictor">{ibSubjects.map(s=><label key={s.id}><span><span className="color-dot" style={{background:s.color}}/>{s.name}</span><select name={s.id} defaultValue={profile.predicted[s.id]||''}><option value="">—</option>{[7,6,5,4,3,2,1].map(n=><option key={n}>{n}</option>)}</select></label>)}<label><span>TOK + EE bonus</span><select name="core" defaultValue={profile.core_bonus??''}><option value="">—</option>{[3,2,1,0].map(n=><option key={n}>{n}</option>)}</select></label></div>
 <div className="points-total"><strong>{predicted}</strong><span>/ 45{graded<ibSubjects.length?` · ${ibSubjects.length-graded} subject${ibSubjects.length-graded===1?'':'s'} not set`:''}</span></div>
 <button className="primary" disabled={save.isPending}>Save grades</button></form>
 <p className="muted small-text">The diploma needs at least 24 points plus other conditions, such as no E in TOK or the EE.</p>
 </section>
 </div>
 <section className="card"><div className="card-heading"><div><h2>Past papers</h2><p>Log each paper after marking it strictly with the markscheme</p></div><FileText size={20}/></div>
 <div className="two-columns flush">
 <form className="inline-form" onSubmit={async e=>{e.preventDefault();const form=e.currentTarget,f=new FormData(form);if(await run(()=>save.put({id:crypto.randomUUID(),kind:'score',data:{test:'ib',date:formText(f,'date'),label:formText(f,'label'),subject_id:formText(f,'subject'),rw:null,math:null,percent:formNumber(f,'percent')}})))form.reset();}}>
 <SubjectSelect subjects={ibSubjects}/><label>Paper<input name="label" maxLength={120} placeholder="May 2024 Paper 2 TZ1"/></label><label>Date<input name="date" type="date" defaultValue={day} max={day} required/></label><label>Score %<input name="percent" type="number" min={0} max={100} step={0.5} required/></label><button className="primary" disabled={save.isPending}><Plus size={16}/> Log paper</button></form>
 <form className="inline-form" onSubmit={async e=>{e.preventDefault();const form=e.currentTarget,f=new FormData(form);if(await run(()=>save.put({id:crypto.randomUUID(),kind:'mistake',data:{subject_id:formText(f,'subject'),area:'',source:formText(f,'source'),question:formText(f,'question'),reason:formText(f,'reason') as typeof mistakeReasons[number],fix:formText(f,'fix'),date:day,due:shift(day,2),interval:2}})))form.reset();}}>
 <SubjectSelect subjects={ibSubjects}/><label>Source<input name="source" maxLength={120} placeholder="Paper 1 Q6b"/></label><label className="span-2">Question to redo<input name="question" required maxLength={500} placeholder="What lost the marks?"/></label><label>Why<select name="reason">{mistakeReasons.map(r=><option key={r} value={r}>{mistakeReasonInfo[r].label}</option>)}</select></label><label>Fix<input name="fix" maxLength={1000} placeholder="What the markscheme wanted"/></label><button className="secondary" disabled={save.isPending}><Plus size={16}/> Add lost marks to redo</button></form>
 </div>
 {papers.length?<div className="paper-summary">{ibSubjects.filter(s=>papers.some(p=>p.data.subject_id===s.id)).map(s=>{const list=papers.filter(p=>p.data.subject_id===s.id),avg=list.reduce((n,p)=>n+(p.data.percent||0),0)/list.length;return <div key={s.id} className="paper-subject"><SubjectChip subject={s}/><strong>{list[0].data.percent}%</strong><span className="muted">latest · avg {Math.round(avg)}% over {list.length}</span><ul>{list.slice(0,4).map(p=><li key={p.id}><span>{p.data.label||'Past paper'}</span><span>{p.data.percent}%</span><button className="icon-button" aria-label="Delete paper" onClick={()=>run(()=>save.remove(p.id))}><Trash2 size={14}/></button></li>)}</ul></div>;})}</div>:<Empty title="No papers logged yet">Percentages let you spot weak papers. Check grade boundaries for your subject, as they change each session.</Empty>}
 </section>
 <div className="two-columns">
 <section className="card"><div className="card-heading"><div><h2>Command terms</h2><p>What each instruction word wants</p></div><label className="search-mini"><Search size={15}/><span className="sr-only">Search command terms</span><input type="search" placeholder="Search" value={term} onChange={e=>setTerm(e.target.value)}/></label></div>
 <dl className="terms">{terms.map(t=><div key={t.term}><dt>{t.term}</dt><dd>{t.meaning}<span>{t.tip}</span></dd></div>)}</dl>{!terms.length&&<p className="muted">No match.</p>}
 <p className="muted small-text">Plain-language summaries. Your subject guide has the official list.</p></section>
 <section className="card"><h2>How to train for IB exams</h2><ul className="tip-list">{ibTips.map(t=><li key={t}>{t}</li>)}</ul><p className="muted small-text"><Source href={sources.ibAssessment}>IB assessment overview</Source></p></section>
 </div>
 </>;
}
