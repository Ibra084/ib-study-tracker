import {parseISO,startOfWeek,startOfMonth,format,addDays,getDay} from 'date-fns';
import type {Item,ItemOf} from '../types';
import {of,shift,type Profile} from './review';
export type CalEvent=ItemOf<'event'>;export type Task=ItemOf<'task'>;export type Milestone=ItemOf<'milestone'>;
export const toMin=(t:string)=>{const [h,m]=t.split(':').map(Number);return h*60+m;};
export const fromMin=(n:number)=>`${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;
const iso=(d:Date)=>format(d,'yyyy-MM-dd');
export const weekDays=(day:string)=>{const start=startOfWeek(parseISO(day),{weekStartsOn:1});return Array.from({length:7},(_,i)=>iso(addDays(start,i)));};
// Six Monday-first weeks that cover the month, padded with the neighbouring months' days.
export const monthCells=(day:string)=>{const start=startOfWeek(startOfMonth(parseISO(day)),{weekStartsOn:1});return Array.from({length:42},(_,i)=>iso(addDays(start,i)));};
export const isWeekend=(day:string)=>[0,6].includes(getDay(parseISO(day)));
// One shape for everything the calendar draws: events, milestones and planner tasks.
export type Entry={id:string;source:'event'|'milestone'|'task';title:string;date:string;start:string|null;end:string|null;period:string;category:'test'|'deadline'|'event'|'study'|'todo';label:string;subject_id:string|null;done:boolean;notes:string};
export function entriesOf(items:Item[]):Entry[]{
 const events=of(items,'event').map((e):Entry=>({id:e.id,source:'event',title:e.data.title,date:e.data.date,start:e.data.start,end:e.data.end,period:e.data.period,category:e.data.category,label:e.data.category==='test'?'Test':e.data.category==='deadline'?'Due':'Event',subject_id:e.data.subject_id,done:false,notes:e.data.notes}));
 const milestones=of(items,'milestone').map((m):Entry=>({id:m.id,source:'milestone',title:m.data.title,date:m.data.date,start:null,end:null,period:'',category:'deadline',label:m.data.category,subject_id:m.data.subject_id,done:m.data.done,notes:''}));
 const tasks=of(items,'task').map((t):Entry=>({id:t.id,source:'task',title:t.data.title,date:t.data.date,start:t.data.start??null,end:t.data.end??null,period:'',category:t.data.start?'study':'todo',label:t.data.start?'Study':'To-do',subject_id:t.data.subject_id,done:t.data.done,notes:t.data.cue}));
 const rank={test:0,deadline:1,event:2,study:3,todo:4};
 return [...events,...milestones,...tasks].sort((a,b)=>a.date.localeCompare(b.date)||rank[a.category]-rank[b.category]||(a.start||'99').localeCompare(b.start||'99')||a.title.localeCompare(b.title));
}
// Timed blocks for one day, split into side-by-side lanes where they overlap.
export function layoutDay(entries:Entry[]){
 const timed=entries.filter(e=>e.start).map(e=>({entry:e,from:toMin(e.start!),to:e.end?toMin(e.end):toMin(e.start!)+45})).sort((a,b)=>a.from-b.from||b.to-a.to);
 const placed:{entry:Entry;from:number;to:number;lane:number;lanes:number}[]=[];let cluster:typeof placed=[],clusterEnd=-1;
 const close=()=>{const lanes=Math.max(1,...cluster.map(c=>c.lane+1));cluster.forEach(c=>c.lanes=lanes);cluster=[];};
 for(const t of timed){if(t.from>=clusterEnd)close();const ends:number[]=[];for(const c of cluster)ends[c.lane]=Math.max(ends[c.lane]??0,c.to);let lane=ends.findIndex(e=>e<=t.from);if(lane<0)lane=ends.length;const p={...t,lane,lanes:1};cluster.push(p);placed.push(p);clusterEnd=Math.max(clusterEnd,t.to);}
 close();return placed;
}
// Days with two or more tests coming up: worth flagging early.
export function heavyDays(entries:Entry[],from:string,days=21){const until=shift(from,days);const counts=new Map<string,Entry[]>();for(const e of entries)if(e.category==='test'&&e.date>=from&&e.date<=until)counts.set(e.date,[...(counts.get(e.date)||[]),e]);return [...counts].filter(([,list])=>list.length>1).map(([date,list])=>({date,tests:list}));}
export type Block={title:string;cue:string;date:string;start:string;end:string;minutes:number;subject_id:string|null;event_id:string};
export type Suggestion={test:CalEvent;blocks:Block[]};
// Spaced revision before each test: retrieval first, then exam-style practice, then a short final review
// the evening before. Blocks go after school (10:00 at weekends) in the first free slot, never overlapping.
// A day holds at most 4 blocks (5 at weekends) ending by 21:00; a full day pushes the block a day or two earlier.
const stages=[{prefix:'Blurt & check',cue:'Recall everything first, then check your notes',minutes:45,slide:2},{prefix:'Practice questions',cue:'Past-paper or textbook questions, marked strictly',minutes:45,slide:2},{prefix:'Final review',cue:'Redo mistakes, light recap, early night',minutes:30,slide:1}];
const LAST_END=21*60;
export function suggestRevision(items:Item[],profile:Profile,day:string,horizon=21):Suggestion[]{
 const taken=new Map<string,[number,number][]>();const occupy=(date:string,from:number,to:number)=>taken.set(date,[...(taken.get(date)||[]),[from,to]]);
 const cap=(date:string)=>isWeekend(date)?5:4;
 for(const t of of(items,'task'))if(t.data.start)occupy(t.data.date,toMin(t.data.start),t.data.end?toMin(t.data.end):toMin(t.data.start)+(t.data.minutes||45));
 for(const e of of(items,'event'))if(e.data.start&&(e.data.end||e.data.start)>profile.school_end)occupy(e.data.date,toMin(e.data.start),e.data.end?toMin(e.data.end):toMin(e.data.start)+60);
 const linked=new Set(of(items,'task').map(t=>t.data.event_id).filter(Boolean));
 const afterSchool=Math.ceil((toMin(profile.school_end)+30)/30)*30;
 const tests=of(items,'event').filter(e=>e.data.category==='test'&&!e.data.plan_dismissed&&!linked.has(e.id)&&e.data.date>day&&e.data.date<=shift(day,horizon)).sort((a,b)=>a.data.date.localeCompare(b.data.date));
 return tests.map(test=>{
  const dates=[6,3,1].map(n=>shift(test.data.date,-n)).filter(d=>d>=day);
  const plan=stages.slice(stages.length-dates.length);
  const blocks=dates.flatMap((ideal,i)=>{const {prefix,cue,minutes,slide}=plan[i];
   for(let back=0;back<=slide;back++){const date=shift(ideal,-back);if(date<day)break;if((taken.get(date)||[]).length>=cap(date))continue;
    let from=isWeekend(date)?600:afterSchool;const busy=()=>(taken.get(date)||[]).some(([a,b])=>from<b+10&&from+minutes+10>a);
    while(busy()&&from+minutes<=LAST_END)from+=15;
    if(from+minutes>LAST_END)continue;occupy(date,from,from+minutes);
    return [{title:`${prefix}: ${test.data.title}`,cue,date,start:fromMin(from),end:fromMin(from+minutes),minutes,subject_id:test.data.subject_id,event_id:test.id}];}
   return [];});
  return {test,blocks};
 }).filter(s=>s.blocks.length);
}
export const blockToTask=(b:Block):Task=>({id:crypto.randomUUID(),kind:'task',data:{date:b.date,title:b.title.slice(0,200),cue:b.cue,subject_id:b.subject_id,minutes:b.minutes,done:false,logged_minutes:0,start:b.start,end:b.end,event_id:b.event_id}});
export const timeRange=(e:{start:string|null;end:string|null;period?:string})=>e.start?`${e.start}${e.end?`–${e.end}`:''}`:e.period||'';
