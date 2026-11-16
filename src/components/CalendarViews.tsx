import {useEffect,useRef} from 'react';
import {format,parseISO,isSameMonth} from 'date-fns';
import {AlertTriangle,CheckCircle2,Circle,Plus} from 'lucide-react';
import type {Subject} from '../types';
import {type Entry,layoutDay,toMin,fromMin,isWeekend,timeRange} from '../lib/planner';
import {when,shift,type Profile} from '../lib/review';
const START=7,END=22,HOUR=48;
const nice=(d:string,f='EEE d MMM')=>format(parseISO(d),f);
const tint=(color?:string)=>color?`${color}26`:'rgba(61,90,128,.12)';
export type ViewProps={entries:Entry[];subjects:Subject[];onOpen:(e:Entry)=>void;today:string};
const colorOf=(subjects:Subject[],id:string|null)=>subjects.find(s=>s.id===id)?.color;
// A compact chip for untimed items (tests, deadlines, milestones) in the all-day lane and month grid.
export function Chip({entry,subjects,onOpen,compact}:{entry:Entry;subjects:Subject[];onOpen:(e:Entry)=>void;compact?:boolean}){
 const color=colorOf(subjects,entry.subject_id);
 return <button className={`cal-chip cal-${entry.category}${entry.done?' is-done':''}`} style={{borderLeftColor:color||undefined}} onClick={e=>{e.stopPropagation();onOpen(entry);}} title={`${entry.label}: ${entry.title}${entry.period?` · ${entry.period}`:''}`}>
 {!compact&&<span className="cal-chip-kind">{entry.label}</span>}<span className="cal-chip-title">{entry.title}</span>{entry.period&&<span className="cal-chip-period">{entry.period.replace(/^Period\s*/i,'P')}</span>}</button>;
}
export function WeekView({days,entries,subjects,onOpen,today,profile,onSlot,heavy}:ViewProps&{days:string[];profile:Profile;onSlot:(date:string,time:string)=>void;heavy:Set<string>}){
 const scroller=useRef<HTMLDivElement>(null),[schoolFrom,schoolTo]=[toMin(profile.school_start),toMin(profile.school_end)];
 const now=new Date(),nowMin=now.getHours()*60+now.getMinutes();
 useEffect(()=>{if(scroller.current)scroller.current.scrollTop=(Math.max(START,Math.floor(schoolTo/60)-2)-START)*HOUR;},[schoolTo]);
 const y=(m:number)=>(m-START*60)/60*HOUR;
 return <div className="week">
 <div className="week-head"><div className="gutter"/>{days.map(d=>{const todos=entries.filter(e=>e.date===d&&e.category==='todo'&&!e.done).length;return <div key={d} className={`week-day${d===today?' is-today':''}`}><span>{nice(d,'EEE')}</span><strong>{nice(d,'d')}</strong>{heavy.has(d)&&<em className="heavy-dot" title="More than one test">!</em>}{todos>0&&<small>{todos} to-do{todos===1?'':'s'}</small>}</div>;})}</div>
 <div className="week-allday"><div className="gutter">All day</div>{days.map(d=><div key={d} className="allday-cell">{entries.filter(e=>e.date===d&&!e.start&&e.category!=='todo').map(e=><Chip key={e.id} entry={e} subjects={subjects} onOpen={onOpen} compact/>)}</div>)}</div>
 <div className="week-scroll" ref={scroller}><div className="week-grid" style={{height:(END-START)*HOUR}}>
 <div className="gutter hours">{Array.from({length:END-START},(_,i)=><span key={i} style={{top:i*HOUR}}>{String(START+i).padStart(2,'0')}:00</span>)}</div>
 {days.map(d=>{const dayEntries=entries.filter(e=>e.date===d);return <div key={d} className={`week-col${d===today?' is-today':''}`} role="button" tabIndex={-1} aria-label={`Add a study block on ${nice(d,'EEEE d MMMM')}`}
  onClick={e=>{const rect=e.currentTarget.getBoundingClientRect();const m=Math.round(((e.clientY-rect.top)/HOUR*60+START*60)/15)*15;onSlot(d,fromMin(Math.min(END*60-30,Math.max(START*60,m))));}}>
  {Array.from({length:END-START},(_,i)=><i key={i} className="hour-line" style={{top:i*HOUR}}/>)}
  {!isWeekend(d)&&<div className="school-band" style={{top:y(schoolFrom),height:y(schoolTo)-y(schoolFrom)}}><span>School {profile.school_start}–{profile.school_end}</span></div>}
  {layoutDay(dayEntries).map(({entry,from,to,lane,lanes})=>{const color=colorOf(subjects,entry.subject_id),height=Math.max(22,y(to)-y(from)-2);
   // Revision blocks are titled "Stage: Test"; lead with the test name, which is what you scan for.
   const split=entry.category==='study'?entry.title.match(/^([^:]{1,30}):\s+(.+)$/):null,name=split?split[2]:entry.title,detail=[split?.[1],timeRange(entry)].filter(Boolean).join(' · ');
   return <button key={entry.id} title={`${entry.title} · ${timeRange(entry)}`} className={`cal-block cal-${entry.category}${entry.done?' is-done':''}${height<40?' is-short':''}`} style={{top:y(from),height,left:`calc(${lane/lanes*100}% + 2px)`,width:`calc(${100/lanes}% - 4px)`,borderLeftColor:color,background:entry.category==='study'?tint(color):undefined}} onClick={e=>{e.stopPropagation();onOpen(entry);}}>
   <strong>{name}</strong><span>{detail}</span></button>;})}
  {d===today&&nowMin>=START*60&&nowMin<=END*60&&<div className="now-line" style={{top:y(nowMin)}}/>}
 </div>;})}
 </div></div>
 </div>;
}
export function MonthView({month,cells,entries,subjects,onOpen,today,onDay,heavy}:ViewProps&{month:string;cells:string[];onDay:(d:string)=>void;heavy:Set<string>}){
 const ref=parseISO(month);
 return <div className="month">
 {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d=><div key={d} className="month-dow">{d}</div>)}
 {cells.map(d=>{const list=entries.filter(e=>e.date===d&&e.category!=='todo'&&e.category!=='study'),study=entries.filter(e=>e.date===d&&e.category==='study').length;
  return <div key={d} className={`month-cell${isSameMonth(parseISO(d),ref)?'':' is-out'}${d===today?' is-today':''}${heavy.has(d)?' is-heavy':''}`} role="button" tabIndex={0} aria-label={`${nice(d,'EEEE d MMMM')}: ${list.length} item${list.length===1?'':'s'}. Open week`} onClick={()=>onDay(d)} onKeyDown={e=>{if(e.key==='Enter')onDay(d);}}>
  <span className="month-num">{nice(d,'d')}</span>
  <div className="month-items">{list.slice(0,3).map(e=><Chip key={e.id} entry={e} subjects={subjects} onOpen={onOpen} compact/>)}{list.length>3&&<span className="more">+{list.length-3} more</span>}</div>
  {study>0&&<span className="month-study">{study} study block{study===1?'':'s'}</span>}
 </div>;})}
 </div>;
}
export function UpcomingView({entries,subjects,onOpen,today,blocksFor,onPlan,canPlan,onAdd}:ViewProps&{blocksFor:(id:string)=>Entry[];onPlan:(id:string)=>void;canPlan:(id:string)=>boolean;onAdd:()=>void}){
 const until=shift(today,42),list=entries.filter(e=>(e.category==='test'||e.category==='deadline'||e.category==='event')&&e.date>=today&&e.date<=until&&!e.done);
 const days=[...new Set(list.map(e=>e.date))];
 if(!days.length)return <div className="empty"><strong>Nothing coming up in the next six weeks</strong><p>Add tests and deadlines as soon as they’re announced.</p><button className="primary" onClick={onAdd}><Plus size={16}/> Add a test or deadline</button></div>;
 return <div className="upcoming">{days.map(d=>{const items=list.filter(e=>e.date===d),tests=items.filter(e=>e.category==='test').length;return <section key={d} className="upcoming-day">
 <div className="upcoming-date"><strong>{nice(d,'EEEE d MMMM')}</strong><span>{when(d)}</span>{tests>1&&<span className="badge badge-exam"><AlertTriangle size={12}/>&nbsp;{tests} tests</span>}</div>
 <ul>{items.map(e=>{const blocks=blocksFor(e.id),done=blocks.filter(b=>b.done).length,subject=subjects.find(s=>s.id===e.subject_id);return <li key={e.id} style={{borderLeftColor:subject?.color}}>
  <button className="upcoming-main" onClick={()=>onOpen(e)}><span className={`badge cal-badge-${e.category}`}>{e.label}</span><strong>{e.title}</strong><span className="muted">{[subject?.name,timeRange(e)].filter(Boolean).join(' · ')}</span></button>
  {e.notes&&<details><summary>What’s on it</summary><p>{e.notes}</p></details>}
  {e.category==='test'&&(blocks.length?<div className="revision-progress">{blocks.map(b=>b.done?<CheckCircle2 key={b.id} size={15} aria-label={`${b.title} done`}/>:<Circle key={b.id} size={15} aria-label={`${b.title} not done`}/>)}<span>{done} of {blocks.length} revision blocks done</span></div>:canPlan(e.id)?<button className="text-link" onClick={()=>onPlan(e.id)}>Plan revision for this test</button>:<span className="muted small-text">No revision planned</span>)}
 </li>;})}</ul></section>;})}</div>;
}
