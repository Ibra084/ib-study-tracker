import {useState} from 'react';
import {format} from 'date-fns';
import {useData} from '../hooks/useData';
import {hours,minutes} from '../lib/stats';
import {Filters,initialFilters,filterSessions} from '../components/Filters';
import {SessionList} from '../components/SessionList';
import type {Session} from '../types';
export default function History(){const data=useData(),[filters,setFilters]=useState(initialFilters);const sessions=filterSessions(data.sessions,filters);const groups=sessions.reduce<Record<string,Session[]>>((a,s)=>{const key=format(new Date(s.started_at),'yyyy-MM-dd');(a[key]||=[]).push(s);return a;},{});return <><div className="page-heading"><div><div className="eyebrow">THE WORK BEHIND YOUR PROGRESS</div><h1>Study log</h1><p>{sessions.length} sessions · {hours(minutes(sessions))} of focused time</p></div></div><Filters value={filters} onChange={setFilters}/>{sessions.length?Object.entries(groups).map(([day,items])=><section className="card" key={day}><div className="card-heading"><h2>{format(new Date(day+'T00:00:00'),'EEEE, MMMM d, yyyy')}</h2><span className="muted">{hours(minutes(items))} total</span></div><SessionList sessions={items}/></section>):<section className="card"><SessionList sessions={[]}/></section>}</>;}
