import {useState} from 'react';
import {Link} from 'react-router-dom';
import {format} from 'date-fns';
import {Plus,Trash2,Check,Target,TrendingUp,ListChecks,BookMarked,AlertTriangle} from 'lucide-react';
import {useData,useItemSave} from '../hooks/useData';
import {today,shift,of,profileOf,staggered,when,daysUntil,type Profile} from '../lib/review';
import {satFacts,satTips,satDates,satDomains,satResources,mistakeReasonInfo,sources} from '../lib/content';
import {SAT_RW_ID,SAT_MATH_ID,PROFILE_ID} from '../lib/defaults';
import {mistakeReasons} from '../lib/schemas';
import {ScoreChart} from '../components/Charts';
import {PageHeading,Empty,Source,formText,formNumber} from '../components/Ui';
const nice=(d:string)=>format(new Date(d+'T00:00:00'),'d MMM yyyy');
export default function Sat(){
 const data=useData(),save=useItemSave(),[error,setError]=useState(''),[customDate,setCustomDate]=useState(false);
 const day=today(),profile=profileOf(data.items),scores=of(data.items,'score').filter(s=>s.data.test==='sat').sort((a,b)=>a.data.date.localeCompare(b.data.date));
 const mistakes=of(data.items,'mistake').filter(m=>m.data.subject_id===SAT_RW_ID||m.data.subject_id===SAT_MATH_ID).sort((a,b)=>b.data.date.localeCompare(a.data.date));
 const topics=of(data.items,'topic'),totals=scores.map(s=>({date:format(new Date(s.data.date+'T00:00:00'),'d MMM'),total:(s.data.rw||0)+(s.data.math||0),rw:s.data.rw,math:s.data.math}));
 const latest=totals.at(-1),best=totals.reduce((m,s)=>Math.max(m,s.total),0),reasonCounts=mistakeReasons.map(r=>({reason:r,count:mistakes.filter(m=>m.data.reason===r).length})).sort((a,b)=>b.count-a.count),top=reasonCounts[0]?.count?reasonCounts[0]:null;
 const run=async(action:()=>Promise<unknown>)=>{setError('');try{await action();return true;}catch(e){setError((e as Error).message);return false;}};
 const saveProfile=(change:Partial<Profile>)=>run(()=>save.put({id:PROFILE_ID,kind:'profile',data:{...profile,...change}}));
 const isOfficial=!profile.sat_date||satDates.some(d=>d.date===profile.sat_date);
 const addSkills=(domains:typeof satDomains)=>{const missing=domains.flatMap(d=>d.skills.map(skill=>({subject_id:d.subject_id,name:`${d.domain}: ${skill}`}))).filter(s=>!topics.some(t=>t.data.subject_id===s.subject_id&&t.data.name===s.name));const dues=staggered(missing.length,3,day);return run(()=>missing.length?save.put(missing.map((s,i)=>({id:crypto.randomUUID(),kind:'topic' as const,data:{...s,notes:'',interval:0,due:dues[i],reviews:0,lapses:0,last_rating:null,last_reviewed:null}}))):Promise.resolve());};
 return <>
 <PageHeading eyebrow="Digital SAT" title="SAT prep" lead="Timed practice, an honest error log and spaced review of every skill.">{profile.sat_date&&daysUntil(profile.sat_date)>=0&&<span className="count-pill"><strong>{daysUntil(profile.sat_date)}</strong><span>days to test day</span></span>}</PageHeading>
 {error&&<p className="error-banner" role="alert">{error}</p>}
 <section className="card goal-strip">
 <form className="goal-form" key={JSON.stringify(profile)} onSubmit={e=>{e.preventDefault();const f=new FormData(e.currentTarget);void saveProfile({sat_date:formText(f,'date')||null,sat_target:formNumber(f,'target')});}}>
 <label>Test date{customDate||!isOfficial?<input name="date" type="date" defaultValue={profile.sat_date||''}/>:<select name="date" defaultValue={profile.sat_date||''}><option value="">Not chosen yet</option>{satDates.filter(d=>d.date>=day).map(d=><option key={d.date} value={d.date}>{nice(d.date)} · {d.note}</option>)}</select>}</label>
 <label>Target score<input name="target" type="number" min={400} max={1600} step={10} placeholder="e.g. 1500" defaultValue={profile.sat_target??''}/></label>
 <button className="primary" disabled={save.isPending}>Save goal</button>
 <button type="button" className="text-link" onClick={()=>setCustomDate(c=>!c)}>{customDate||!isOfficial?'Pick an official date':'Use another date'}</button>
 </form>
 <div className="goal-stats">
 <div><span>Latest</span><strong>{latest?.total||'—'}</strong></div><div><span>Best</span><strong>{best||'—'}</strong></div>
 <div><span>To target</span><strong>{profile.sat_target&&latest?Math.max(0,profile.sat_target-latest.total)||'Reached':'—'}</strong></div>
 <div><span>Open mistakes</span><strong>{mistakes.filter(m=>m.data.due).length}</strong></div>
 </div>
 <p className="muted small-text">Official dates from the College Board. <Source href={sources.satDates}>Check deadlines</Source></p>
 </section>
 <div className="fact-grid">{satFacts.map(f=><div className="fact" key={f.label}><span>{f.label}</span><strong>{f.value}</strong><p>{f.detail}</p></div>)}</div>
 <div className="two-columns">
 <section className="card"><div className="card-heading"><div><h2>Practice test scores</h2><p>Log every full Bluebook test</p></div><TrendingUp size={20}/></div>
 {totals.length?<ScoreChart scores={totals} target={profile.sat_target}/>:<Empty title="No practice tests yet">Take a full test in Bluebook, then log your section scores here.</Empty>}
 <form className="inline-form" onSubmit={async e=>{e.preventDefault();const form=e.currentTarget,f=new FormData(form);if(await run(()=>save.put({id:crypto.randomUUID(),kind:'score',data:{test:'sat',date:formText(f,'date'),label:formText(f,'label'),subject_id:null,rw:formNumber(f,'rw'),math:formNumber(f,'math'),percent:null}})))form.reset();}}>
 <label>Date<input name="date" type="date" defaultValue={day} max={day} required/></label><label>Test<input name="label" maxLength={120} placeholder="Bluebook Practice Test 4"/></label><label>Reading & Writing<input name="rw" type="number" min={200} max={800} step={10} required/></label><label>Math<input name="math" type="number" min={200} max={800} step={10} required/></label>
 <button className="primary" disabled={save.isPending}><Plus size={16}/> Log score</button></form>
 {scores.length>0&&<ul className="score-list">{[...scores].reverse().slice(0,6).map(s=><li key={s.id}><div><strong>{(s.data.rw||0)+(s.data.math||0)}</strong><span>{s.data.label||'Practice test'} · {nice(s.data.date)}</span></div><span className="muted">R&W {s.data.rw} · Math {s.data.math}</span><button className="icon-button" aria-label="Delete score" onClick={()=>run(()=>save.remove(s.id))}><Trash2 size={15}/></button></li>)}</ul>}
 </section>
 <section className="card"><div className="card-heading"><div><h2>Where your points go</h2><p>From your error log</p></div><AlertTriangle size={20}/></div>
 {top?<><div className="reason-bars">{reasonCounts.map(r=><div key={r.reason}><span>{mistakeReasonInfo[r.reason].label}</span><div className="bar"><i style={{width:`${r.count/top.count*100}%`}}/></div><strong>{r.count}</strong></div>)}</div><div className="advice"><strong>Your biggest leak: {mistakeReasonInfo[top.reason].label.toLowerCase()}</strong><p>{mistakeReasonInfo[top.reason].advice}</p></div></>:<Empty title="No mistakes logged yet">After each practice set, log every question you missed or guessed. Patterns show up after about 10.</Empty>}
 </section>
 </div>
 <section className="card"><div className="card-heading"><div><h2>Error log</h2><p>Each mistake comes back in your review queue until you solve it twice in a row.</p></div><BookMarked size={20}/></div>
 <form className="mistake-form" onSubmit={async e=>{e.preventDefault();const form=e.currentTarget,f=new FormData(form);const [subject_id,area]=formText(f,'area').split('|');if(await run(()=>save.put({id:crypto.randomUUID(),kind:'mistake',data:{subject_id,area,source:formText(f,'source'),question:formText(f,'question'),reason:formText(f,'reason') as typeof mistakeReasons[number],fix:formText(f,'fix'),date:day,due:shift(day,2),interval:2}})))form.reset();}}>
 <label>Skill area<select name="area" required>{satDomains.map(d=><option key={d.domain} value={`${d.subject_id}|${d.domain}`}>{d.section} · {d.domain}</option>)}</select></label>
 <label>Source<input name="source" maxLength={120} placeholder="Practice Test 4, Module 2, Q14"/></label>
 <label className="span-2">The question (or what it tested)<textarea name="question" rows={2} required maxLength={500} placeholder="Paste the question, or describe it so you can redo it"/></label>
 <label>Why I missed it<select name="reason" required>{mistakeReasons.map(r=><option key={r} value={r}>{mistakeReasonInfo[r].label}</option>)}</select></label>
 <label>What I’ll do next time<input name="fix" maxLength={1000} placeholder="e.g. Plug the answer back into the original equation"/></label>
 <button className="primary" disabled={save.isPending}><Plus size={16}/> Add to error log</button>
 </form>
 {mistakes.length>0&&<ul className="mistake-list">{mistakes.slice(0,8).map(m=><li key={m.id}><span className={`badge ${m.data.due?'badge-sat':'badge-done'}`}>{m.data.due?(m.data.due<=day?'Redo now':`Redo ${when(m.data.due)}`):'Solved'}</span><div><strong>{m.data.question}</strong><span>{[m.data.area,mistakeReasonInfo[m.data.reason].label,m.data.source].filter(Boolean).join(' · ')}</span></div><button className="icon-button" aria-label="Delete mistake" onClick={()=>run(()=>save.remove(m.id))}><Trash2 size={15}/></button></li>)}</ul>}
 {mistakes.some(m=>m.data.due&&m.data.due<=day)&&<Link className="text-link" to="/review">Redo due questions in Review</Link>}
 </section>
 <section className="card"><div className="card-heading"><div><h2>Skills map</h2><p>The official domains and skills. Add them to your review queue to cycle through every one.</p></div><button className="secondary" disabled={save.isPending} onClick={()=>addSkills(satDomains)}><ListChecks size={16}/> Add all to review</button></div>
 <div className="domain-grid">{satDomains.map(d=>{const added=d.skills.filter(skill=>topics.some(t=>t.data.subject_id===d.subject_id&&t.data.name===`${d.domain}: ${skill}`)).length;return <div className="domain" key={d.domain}><div className="domain-head"><span className="eyebrow">{d.section}{'count' in d?` · ${d.count}`:''}</span><h3>{d.domain}</h3></div><ul>{d.skills.map(skill=><li key={skill}>{topics.some(t=>t.data.subject_id===d.subject_id&&t.data.name===`${d.domain}: ${skill}`)&&<Check size={13} aria-label="In review"/>}{skill}</li>)}</ul>{added<d.skills.length?<button className="text-link" onClick={()=>addSkills([d])}>Add {d.skills.length-added} to review</button>:<span className="muted small-text">All in review</span>}</div>;})}</div>
 <p className="muted small-text">Sources: <Source href={sources.satRw}>Reading & Writing</Source> · <Source href={sources.satMath}>Math</Source></p>
 </section>
 <div className="two-columns">
 <section className="card"><div className="card-heading"><h2>How to train</h2><Target size={20}/></div><ul className="tip-list">{satTips.map(t=><li key={t}>{t}</li>)}</ul><div className="week-plan"><span className="eyebrow">A balanced SAT week</span><p>One timed module or full test · review its mistakes the same week · 2–3 short drills on your weakest domain · daily spaced review.</p></div></section>
 <section className="card"><h2>Free official resources</h2><ul className="resource-list">{satResources.map(r=><li key={r.name}><Source href={r.href}>{r.name}</Source><span>{r.detail}</span></li>)}</ul><p className="muted small-text">Structure facts: <Source href={sources.satStructure}>College Board</Source></p></section>
 </div>
 </>;
}
