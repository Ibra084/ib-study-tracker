import type {ReactNode} from 'react';
import {ExternalLink} from 'lucide-react';
import type {Subject} from '../types';
export function PageHeading({eyebrow,title,lead,children}:{eyebrow:string;title:ReactNode;lead?:ReactNode;children?:ReactNode}){return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1>{lead&&<p>{lead}</p>}</div>{children&&<div className="page-heading-actions">{children}</div>}</div>;}
export function Empty({title,children}:{title:string;children?:ReactNode}){return <div className="empty"><strong>{title}</strong>{children&&<p>{children}</p>}</div>;}
export function Source({href,children}:{href:string;children:ReactNode}){return <a className="source-link" href={href} target="_blank" rel="noreferrer">{children}<ExternalLink size={12} aria-hidden/><span className="sr-only"> (opens in a new tab)</span></a>;}
export function SubjectChip({subject}:{subject?:Subject}){return subject?<span className="subject-chip"><span className="color-dot" style={{background:subject.color}}/>{subject.name}</span>:null;}
export function SubjectSelect({subjects,name='subject',defaultValue,optional,label='Subject'}:{subjects:Subject[];name?:string;defaultValue?:string|null;optional?:boolean;label?:string}){return <label>{label}<select name={name} defaultValue={defaultValue||(optional?'':subjects[0]?.id)} required={!optional}>{optional&&<option value="">No subject</option>}{subjects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>;}
export const formText=(f:FormData,key:string)=>String(f.get(key)??'').trim();
export const formNumber=(f:FormData,key:string)=>{const v=formText(f,key);return v===''?null:Number(v);};
