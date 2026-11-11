import {useState} from 'react';
import {Link} from 'react-router-dom';
import {format} from 'date-fns';
import {CalendarClock,Check,Lightbulb,Plus,Repeat2,Target,Trash2,Sparkles,ArrowRight,Play} from 'lucide-react';
import {useData,useItemSave} from '../hooks/useData';
import {hours,periods} from '../lib/stats';
import {today,shift,of,profileOf,dueQueue,when,daysUntil} from '../lib/review';
import {tipOfTheDay} from '../lib/content';
import {focusActivity} from '../components/Timer';
import {PageHeading,SubjectChip,SubjectSelect,Empty,formText,formNumber} from '../components/Ui';
import type {ItemOf} from '../types';
type Task=ItemOf<'task'>;
const greeting=(h=new Date().getHours())=>h<12?'Good morning':h<18?'Good afternoon':'Good evening';
export function Countdowns(){const data=useData(),profile=profileOf(data.items);const pill=(label:string,date:string|null,to:string)=>{if(!date)return <Link className="count-pill muted-pill" to={to}><CalendarClock size={16}/>Set {label} date</Link>;const n=daysUntil(date);return n<0?null:<Link className="count-pill" to={to}><strong>{n}</strong><span>{n===1?'day':'days'} to {label}</span></Link>;};return <div className="countdowns">{pill('IB exams',profile.ib_exam_start,'/ib')}{pill('the SAT',profile.sat_date,'/sat')}</div>;}
export default function Today(){
 const data=useData(),save=useItemSave(),[view,setView]=useState<'today'|'tomorrow'>('today'),[error,setError]=useState('');
 const day=today(),planDay=view==='today'?day:shift(day,1);const tasks=of(data.items,'task'),list=tasks.filter(t=>t.data.date===planDay).sort((a,b)=>Number(a.data.done)-Number(b.data.done));
 const carry=tasks.filter(t=>t.data.date<day&&!t.data.done),queue=dueQueue(data.items,day),totals=periods(data.sessions),goal=data.settings.weekly_goal_minutes,pct=goal?Math.min(100,Math.round(totals.week/goal*100)):0;
 const subjects=data.subjects.filter(s=>!s.archived),deadlines=of(data.items,'milestone').filter(m=>!m.data.done&&m.data.date>=day).sort((a,b)=>a.data.date.localeCompare(b.data.date)).slice(0,4);
 const tip=tipOfTheDay(),done=list.filter(t=>t.data.done).length;
 const run=async(action:()=>Promise<unknown>)=>{setError('');try{await action();return true;}catch(e){setError((e as Error).message);return false;}};
 const add=(title:string,extra:Partial<Task['data']>={})=>run(()=>save.put({id:crypto.randomUUID(),kind:'task',data:{date:planDay,title,cue:'',subject_id:null,minutes:null,done:false,logged_minutes:0,...extra}}));
 // Starting from a task links the timer to it: the session is saved under the task's subject and its minutes are credited to the task.
 const start=(t:Task)=>run(async()=>{const subject=subjects.find(s=>s.id===t.data.subject_id)||subjects[0];await save.mutateAsync({path:'timer',body:{action:'start',subject_id:subject.id,activity_type_id:focusActivity(data),task_id:t.id}});window.scrollTo({top:0,behavior:'smooth'});});
 const progress=(t:Task)=>{const logged=Math.round(t.data.logged_minutes??0);return logged?(t.data.minutes?`${logged} of ${t.data.minutes} min focused`:`${logged} min focused`):t.data.minutes?`${t.data.minutes} min`:'';};
 const suggestions=[queue.length&&{title:`Review ${queue.length} due item${queue.length===1?'':'s'}`,minutes:Math.min(45,Math.max(10,queue.length*3))},deadlines[0]&&daysUntil(deadlines[0].data.date)<=14&&{title:`Next step on: ${deadlines[0].data.title}`,minutes:45,subject_id:deadlines[0].data.subject_id},{title:'Timed past-paper questions, then mark with the markscheme',minutes:40}].filter(Boolean).filter(s=>s&&!list.some(t=>t.data.title===s.title)).slice(0,3) as {title:string;minutes:number;subject_id?:string|null}[];
 return <>
 <PageHeading eyebrow={format(new Date(),'EEEE, MMMM d')} title={`${greeting()}.`} lead={queue.length||list.length?`${queue.length} review${queue.length===1?'':'s'} due · ${list.length-done} task${list.length-done===1?'':'s'} left ${view==='today'?'today':'for tomorrow'}`:'Plan one small, specific thing and start there.'}><Countdowns/></PageHeading>
 {error&&<p className="error-banner" role="alert">{error}</p>}
 <div className="today-grid">
 <section className="card plan-card" aria-labelledby="plan-title">
 <div className="card-heading"><div><h2 id="plan-title">{view==='today'?'Today’s plan':'Tomorrow’s plan'}</h2><p>{list.length?`${done} of ${list.length} done`:'Small, specific tasks with a clear “when” get done.'}</p></div><div className="segmented" role="group" aria-label="Plan day">{(['today','tomorrow'] as const).map(v=><button key={v} className={view===v?'active':''} aria-pressed={view===v} onClick={()=>setView(v)}>{v==='today'?'Today':'Tomorrow'}</button>)}</div></div>
 {list.length>0&&<div className="progress-track plan-progress" aria-hidden><span style={{width:`${done/list.length*100}%`}}/></div>}
 {view==='today'&&carry.length>0&&<div className="notice"><span>{carry.length} unfinished task{carry.length===1?'':'s'} from earlier days.</span><button className="text-link" disabled={save.isPending} onClick={()=>run(()=>save.put(carry.map(t=>({...t,data:{...t.data,date:day}}))))}>Move to today</button></div>}
 <ul className="task-list">{list.map(t=><li key={t.id} className={t.data.done?'done':''}><button className="check" role="checkbox" aria-checked={t.data.done} aria-label={`Mark “${t.data.title}” ${t.data.done?'not done':'done'}`} onClick={()=>run(()=>save.put({...t,data:{...t.data,done:!t.data.done}}))}>{t.data.done&&<Check size={15}/>}</button><div className="task-body"><strong>{t.data.title}</strong><span>{[t.data.cue,progress(t)].filter(Boolean).join(' · ')}</span><SubjectChip subject={data.subjects.find(s=>s.id===t.data.subject_id)}/></div>{data.timer?.task_id===t.id?<span className="badge badge-live">In focus</span>:!data.timer&&!t.data.done&&view==='today'&&subjects.length>0&&<button className="task-start" disabled={save.isPending} aria-label={`Start focus timer for “${t.data.title}”`} onClick={()=>start(t)}><Play size={14}/>Start</button>}<button className="icon-button" aria-label={`Delete “${t.data.title}”`} onClick={()=>run(()=>save.remove(t.id))}><Trash2 size={16}/></button></li>)}</ul>
 {!list.length&&<Empty title={view==='today'?'Nothing planned yet':'Plan tomorrow tonight'}>Add a task below or start from a suggestion.</Empty>}
 {suggestions.length>0&&<div className="suggestions"><span><Sparkles size={15}/> Suggested</span>{suggestions.map(s=><button key={s.title} className="chip-button" onClick={()=>add(s.title,{minutes:s.minutes,subject_id:s.subject_id||null})}><Plus size={14}/>{s.title} · {s.minutes} min</button>)}</div>}
 <form className="task-form" onSubmit={e=>{e.preventDefault();const form=e.currentTarget,f=new FormData(form);void add(formText(f,'title'),{cue:formText(f,'cue'),subject_id:formText(f,'subject')||null,minutes:formNumber(f,'minutes')}).then(ok=>{if(ok)form.reset();});}}>
 <label className="span-2">I will…<input name="title" required maxLength={200} placeholder="e.g. 15 Advanced Math questions from the Question Bank"/></label>
 <label><span>When & where <span className="muted">· optional</span></span><input name="cue" maxLength={120} placeholder="After dinner, at my desk"/></label>
 <SubjectSelect subjects={subjects} optional/>
 <label>Minutes<input name="minutes" type="number" min={5} max={600} step={5} placeholder="30"/></label>
 <button className="primary" disabled={save.isPending}><Plus size={16}/> Add to {view==='today'?'today':'tomorrow'}</button>
 </form>
 </section>
 <div className="today-side">
 <section className={`card review-callout${queue.length?' has-due':''}`}><Repeat2 size={22}/><div><h2>{queue.length?`${queue.length} due for review`:'Reviews all done'}</h2><p>{queue.length?'Short, spaced recall beats long rereading.':'Add topics as you learn them and they’ll come back at the right time.'}</p></div><Link className={queue.length?'primary':'secondary'} to="/review">{queue.length?'Start review':'Open review'}<ArrowRight size={16}/></Link></section>
 <section className="card week-card"><div className="card-heading"><h2>This week</h2><Target size={18}/></div><div className="mini-goal"><div className="goal-ring small" style={{background:`conic-gradient(var(--accent) ${pct}%,var(--track) 0)`}}><div><strong>{pct}<small>%</small></strong></div></div><div><strong>{hours(totals.week)}</strong><span className="muted"> of {hours(goal)}</span><p className="muted">{!goal?'Set a weekly goal in Settings.':totals.week>=goal?'Goal reached. Protect your rest too.':`${hours(goal-totals.week)} to go.`}</p><span className="muted">Today: {hours(totals.today)}</span></div></div></section>
 <section className="card"><div className="card-heading"><h2>Coming up</h2><Link className="text-link" to="/ib">All deadlines</Link></div>{deadlines.length?<ul className="deadline-list">{deadlines.map(m=><li key={m.id}><span className={`badge badge-${m.data.category.toLowerCase()}`}>{m.data.category}</span><div><strong>{m.data.title}</strong><span>{format(new Date(m.data.date+'T00:00:00'),'EEE d MMM')} · {when(m.data.date)}</span></div></li>)}</ul>:<p className="muted small-text">Add IA, EE, TOK and SAT deadlines on the IB and SAT pages.</p>}</section>
 <section className="card tip-card"><div className="card-heading"><h2><Lightbulb size={18}/> {tip.name}</h2><span className={`evidence evidence-${tip.evidence.toLowerCase()}`}>{tip.evidence} evidence</span></div><p>{tip.summary}</p><Link className="text-link" to={`/playbook#${tip.id}`}>How to do it</Link></section>
 </div>
 </div>
 </>;
}
