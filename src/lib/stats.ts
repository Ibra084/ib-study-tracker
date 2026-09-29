import {format,startOfWeek,startOfMonth,startOfDay,subDays,addDays,differenceInCalendarDays,isWithinInterval} from 'date-fns';
import type {Session,Timer} from '../types';
export const minutes=(sessions:Session[])=>sessions.reduce((n,s)=>n+s.duration_minutes,0);
export const hours=(n:number)=>`${Math.floor(Math.round(n)/60)}h ${Math.round(n)%60}m`;
export function between(sessions:Session[],from:Date,to:Date){return sessions.filter(s=>isWithinInterval(new Date(s.started_at),{start:from,end:to}));}
export function periods(sessions:Session[],now=new Date()){return {today:minutes(between(sessions,startOfDay(now),now)),week:minutes(between(sessions,startOfWeek(now,{weekStartsOn:1}),now)),month:minutes(between(sessions,startOfMonth(now),now))};}
export function breakdown(sessions:Session[],key:'subject_id'|'activity_type_id'){return sessions.reduce<Record<string,number>>((a,s)=>{a[s[key]]=(a[s[key]]||0)+s.duration_minutes;return a;},{});}
export function daily(sessions:Session[],days:number,now=new Date()){return Array.from({length:days},(_,i)=>{const date=subDays(now,days-1-i);const items=sessions.filter(s=>format(new Date(s.started_at),'yyyy-MM-dd')===format(date,'yyyy-MM-dd'));return {date:format(date,'MMM d'),...Object.fromEntries(Object.entries(breakdown(items,'subject_id')).map(([k,v])=>[k,v/60]))};});}
export function weekly(sessions:Session[],now=new Date()){return Array.from({length:8},(_,i)=>{const from=addDays(startOfWeek(now,{weekStartsOn:1}),-7*(7-i));return {date:format(from,'MMM d'),hours:minutes(sessions.filter(s=>new Date(s.started_at)>=from&&new Date(s.started_at)<addDays(from,7)))/60};});}
export function streaks(sessions:Session[],now=new Date()){
 const days=[...new Set(sessions.filter(s=>new Date(s.started_at)<=now).map(s=>format(new Date(s.started_at),'yyyy-MM-dd')))].sort();
 let longest=0,run=0;days.forEach((d,i)=>{run=i&&differenceInCalendarDays(new Date(d+'T00:00:00'),new Date(days[i-1]+'T00:00:00'))===1?run+1:1;longest=Math.max(longest,run);});
 let current=0,cursor=startOfDay(now);const set=new Set(days);if(!set.has(format(cursor,'yyyy-MM-dd')))cursor=subDays(cursor,1);
 while(set.has(format(cursor,'yyyy-MM-dd'))){current++;cursor=subDays(cursor,1);}return {current,longest};
}
export function elapsed(timer:Timer,now=Date.now()){return Math.max(0,(timer.paused_at?Date.parse(timer.paused_at):now)-Date.parse(timer.started_at)-Number(timer.accumulated_paused_ms));}
