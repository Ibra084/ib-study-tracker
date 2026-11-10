import {format,addDays,differenceInCalendarDays,parseISO} from 'date-fns';
import type {Item,ItemOf} from '../types';
import {isSatSubject,PROFILE_ID} from './defaults';
export type Topic=ItemOf<'topic'>;export type Mistake=ItemOf<'mistake'>;export type Profile=ItemOf<'profile'>['data'];
export const today=(now=new Date())=>format(now,'yyyy-MM-dd');
export const shift=(day:string,days:number)=>format(addDays(parseISO(day),days),'yyyy-MM-dd');
export const daysUntil=(day:string,now=new Date())=>differenceInCalendarDays(parseISO(day),now);
export const of=<K extends Item['kind']>(items:Item[],kind:K)=>items.filter((i):i is ItemOf<K>=>i.kind===kind);
export const emptyProfile:Profile={sat_target:null,sat_date:null,ib_exam_start:null,predicted:{},core_bonus:null};
export const profileOf=(items:Item[])=>of(items,'profile').find(p=>p.id===PROFILE_ID)?.data||emptyProfile;
export const ratings=[
 {value:1,label:'Forgot',hint:'I could not recall it'},
 {value:2,label:'Hard',hint:'I got there with real effort'},
 {value:3,label:'Good',hint:'I recalled it after some thought'},
 {value:4,label:'Easy',hint:'It came instantly and completely'},
] as const;
// Expanding gaps: a lapse restarts at one day, success multiplies the gap. Too-short gaps hurt
// retention more than slightly long ones (Cepeda et al., 2008), so growth is deliberately steady.
export function nextInterval(previous:number,rating:number){
 if(rating===1)return 1;
 if(previous===0)return rating===2?1:rating===3?2:4;
 const factor=rating===2?1.2:rating===3?2.5:3.5;
 return Math.min(180,Math.max(previous+1,Math.round(previous*factor)));
}
// Keep at least one review before the exam the topic belongs to.
export function examFor(subjectId:string,profile:Profile){return isSatSubject(subjectId)?profile.sat_date:profile.ib_exam_start;}
export function schedule(topic:Topic['data'],rating:number,profile:Profile,day=today()){
 const interval=nextInterval(topic.interval,rating);let due=shift(day,interval);const exam=examFor(topic.subject_id,profile);
 if(exam&&due>=exam&&daysUntil(exam,parseISO(day))>2)due=shift(exam,-2);
 return {...topic,interval,due,reviews:topic.reviews+1,lapses:topic.lapses+(rating===1?1:0),last_rating:rating,last_reviewed:day};
}
// Mistakes are redone after 2 days, then a week, then retired once solved twice in a row.
export function redo(mistake:Mistake['data'],correct:boolean,day=today()){
 if(!correct)return {...mistake,interval:2,due:shift(day,1)};
 if(mistake.interval>=7)return {...mistake,interval:mistake.interval,due:null};
 return {...mistake,interval:7,due:shift(day,7)};
}
export function dueQueue(items:Item[],day=today()){
 const topics=of(items,'topic').filter(t=>t.data.due<=day).sort((a,b)=>a.data.due.localeCompare(b.data.due)||a.data.interval-b.data.interval);
 const mistakes=of(items,'mistake').filter(m=>m.data.due&&m.data.due<=day).sort((a,b)=>(a.data.due||'').localeCompare(b.data.due||''));
 return [...mistakes,...topics];
}
// Spread a batch of new topics over several days so a big import never lands as one huge review pile.
export function staggered(count:number,perDay=3,day=today()){return Array.from({length:count},(_,i)=>shift(day,Math.floor(i/perDay)));}
export const when=(day:string,now=new Date())=>{const n=daysUntil(day,now);return n<0?`${-n} day${n===-1?'':'s'} overdue`:n===0?'today':n===1?'tomorrow':`in ${n} days`;};
