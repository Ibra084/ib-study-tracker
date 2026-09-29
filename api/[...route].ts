import type {VercelRequest,VercelResponse} from '@vercel/node';
import {neon} from '@neondatabase/serverless';
import {z,ZodError} from 'zod';
import {createHmac,randomUUID} from 'node:crypto';
import {subjectSchema,activitySchema,sessionSchema,settingsSchema,timerSchema,exportSchema} from '../src/lib/schemas.js';
import {defaultSubjects,defaultActivities} from '../src/lib/defaults.js';
import {COOKIE,signToken,verifyToken,passcodeMatches,cookie} from './_lib/auth.js';
class HttpError extends Error{constructor(public status:number,message:string){super(message);}}
const idSchema=z.string().uuid();
const objectBody=(req:VercelRequest)=>typeof req.body==='string'?JSON.parse(req.body):req.body;
export default async function handler(req:VercelRequest,res:VercelResponse){
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
 try{
 const secret=process.env.AUTH_SECRET,passcode=process.env.APP_PASSCODE;
 if(!secret||secret.length<32||!passcode||!process.env.DATABASE_URL)throw new HttpError(503,'App setup is incomplete. Configure the database and authentication environment variables.');
 const path=(req.url||'').split('?')[0].replace(/^\/api\//,'').replace(/\/$/,'');
 const method=req.method||'GET';
 if(!['GET','POST','PUT','DELETE'].includes(method)){res.setHeader('Allow','GET, POST, PUT, DELETE');throw new HttpError(405,'Method not allowed');}
 if(method!=='GET'&&req.headers.origin){const origin=new URL(req.headers.origin);if(origin.host!==req.headers.host)throw new HttpError(403,'Cross-origin requests are not allowed');}
 const sql=neon(process.env.DATABASE_URL);
 if(path==='login'&&method==='POST'){
 const body=z.object({passcode:z.string().min(1).max(1024)}).strict().parse(objectBody(req));
 const ip=String(req.headers['x-vercel-forwarded-for']||req.headers['x-forwarded-for']||'local').split(',')[0].trim();
 const bucket=createHmac('sha256',secret).update(ip).digest('hex');
 const rows=await sql`INSERT INTO login_attempts(bucket,attempts,reset_at) VALUES(${bucket},1,now()+interval '15 minutes') ON CONFLICT(bucket) DO UPDATE SET attempts=CASE WHEN login_attempts.reset_at<now() THEN 1 ELSE login_attempts.attempts+1 END,reset_at=CASE WHEN login_attempts.reset_at<now() THEN now()+interval '15 minutes' ELSE login_attempts.reset_at END RETURNING attempts`;
 if(Number(rows[0].attempts)>10){res.setHeader('Retry-After','900');throw new HttpError(429,'Too many attempts. Try again in 15 minutes.');}
 if(!passcodeMatches(body.passcode,passcode)){await new Promise(r=>setTimeout(r,700));throw new HttpError(401,'Incorrect passcode');}
 await sql`DELETE FROM login_attempts WHERE bucket=${bucket} OR reset_at<now()`;
 res.setHeader('Set-Cookie',cookie(signToken(secret)));return res.status(200).json({ok:true});
 }
 if(!verifyToken(req.cookies?.[COOKIE],secret))throw new HttpError(401,'Please sign in');
 if(path==='logout'&&method==='POST'){z.object({}).strict().parse(objectBody(req));res.setHeader('Set-Cookie',cookie('',true));return res.status(200).json({ok:true});}
 const readData=async()=>{const [subjects,activity_types,sessions,settings,timer]=await sql.transaction([sql`SELECT * FROM subjects ORDER BY sort_order,name`,sql`SELECT * FROM activity_types ORDER BY sort_order,name`,sql`SELECT id,subject_id,activity_type_id,started_at,duration_minutes,notes,tags,focus_rating,is_sample FROM sessions ORDER BY started_at DESC`,sql`SELECT weekly_goal_minutes,theme,time_format FROM settings WHERE singleton=true`,sql`SELECT id,subject_id,activity_type_id,started_at,paused_at,accumulated_paused_ms FROM active_timer WHERE singleton=true`],{isolationLevel:'RepeatableRead',readOnly:true});
 if(!settings[0])throw new HttpError(503,'Run the database migration to finish setup.');return {version:1,subjects,activity_types,sessions,settings:settings[0],timer:timer[0]||null};};
 if((path==='state'||path==='export')&&method==='GET'){const state=await readData();if(path==='export'){const {timer: _timer,...backup}=state;void _timer;return res.status(200).json(backup);}return res.status(200).json(state);}
 if(path==='sessions'){
 if(method==='GET'){const query=z.object({from:z.string().datetime({offset:true}).optional(),to:z.string().datetime({offset:true}).optional()}).parse(req.query);return res.status(200).json(await sql`SELECT id,subject_id,activity_type_id,started_at,duration_minutes,notes,tags,focus_rating,is_sample FROM sessions WHERE (${query.from||null}::timestamptz IS NULL OR started_at>=${query.from||null}::timestamptz) AND (${query.to||null}::timestamptz IS NULL OR started_at<=${query.to||null}::timestamptz) ORDER BY started_at DESC`);}
 if(method==='DELETE'){const {id}=z.object({id:idSchema}).strict().parse(objectBody(req));const rows=await sql`DELETE FROM sessions WHERE id=${id} RETURNING id`;if(!rows.length)throw new HttpError(404,'Session not found');return res.status(200).json({ok:true});}
 if(method==='POST'||method==='PUT'){const s=sessionSchema.parse(objectBody(req));const rows=method==='POST'?await sql`INSERT INTO sessions(id,subject_id,activity_type_id,started_at,duration_minutes,notes,tags,focus_rating,is_sample) VALUES(${s.id},${s.subject_id},${s.activity_type_id},${s.started_at},${s.duration_minutes},${s.notes},${s.tags},${s.focus_rating},${s.is_sample}) ON CONFLICT(id) DO NOTHING RETURNING id`:await sql`UPDATE sessions SET subject_id=${s.subject_id},activity_type_id=${s.activity_type_id},started_at=${s.started_at},duration_minutes=${s.duration_minutes},notes=${s.notes},tags=${s.tags},focus_rating=${s.focus_rating},updated_at=now() WHERE id=${s.id} RETURNING id`;
 if(!rows.length)throw new HttpError(method==='POST'?409:404,method==='POST'?'Session already saved':'Session not found');return res.status(method==='POST'?201:200).json({ok:true});}
 }
 if(path==='subjects'||path==='activity-types'){
 if(method==='GET')return res.status(200).json(path==='subjects'?await sql`SELECT * FROM subjects ORDER BY sort_order`:await sql`SELECT * FROM activity_types ORDER BY sort_order`);
 if(method==='POST'||method==='PUT'){
 if(path==='subjects'){const s=subjectSchema.parse(objectBody(req));await sql`INSERT INTO subjects(id,name,color,archived,weekly_goal_minutes,sort_order) VALUES(${s.id},${s.name},${s.color},${s.archived},${s.weekly_goal_minutes},${s.sort_order}) ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name,color=EXCLUDED.color,archived=EXCLUDED.archived,weekly_goal_minutes=EXCLUDED.weekly_goal_minutes,sort_order=EXCLUDED.sort_order`;}
 else{const a=activitySchema.parse(objectBody(req));await sql`INSERT INTO activity_types(id,name,archived,sort_order) VALUES(${a.id},${a.name},${a.archived},${a.sort_order}) ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name,archived=EXCLUDED.archived,sort_order=EXCLUDED.sort_order`;}
 return res.status(200).json({ok:true});}
 }
 if(path==='settings'){
 if(method==='GET')return res.status(200).json((await sql`SELECT weekly_goal_minutes,theme,time_format FROM settings WHERE singleton=true`)[0]);
 if(method==='PUT'){const s=settingsSchema.parse(objectBody(req));await sql`UPDATE settings SET weekly_goal_minutes=${s.weekly_goal_minutes},theme=${s.theme},time_format=${s.time_format} WHERE singleton=true`;return res.status(200).json({ok:true});}
 }
 if(path==='timer'){
 if(method==='GET')return res.status(200).json((await sql`SELECT id,subject_id,activity_type_id,started_at,paused_at,accumulated_paused_ms FROM active_timer WHERE singleton=true`)[0]||null);
 if(method==='POST'){const b=timerSchema.parse(objectBody(req));let rows;
 if(b.action==='start')rows=await sql`INSERT INTO active_timer(singleton,id,subject_id,activity_type_id) SELECT true,${randomUUID()},${b.subject_id},${b.activity_type_id} WHERE EXISTS(SELECT 1 FROM subjects WHERE id=${b.subject_id} AND NOT archived) AND EXISTS(SELECT 1 FROM activity_types WHERE id=${b.activity_type_id} AND NOT archived) ON CONFLICT(singleton) DO NOTHING RETURNING id`;
 else if(b.action==='pause')rows=await sql`UPDATE active_timer SET paused_at=now() WHERE id=${b.id} AND paused_at IS NULL RETURNING id`;
 else if(b.action==='resume')rows=await sql`UPDATE active_timer SET accumulated_paused_ms=accumulated_paused_ms+EXTRACT(EPOCH FROM(now()-paused_at))*1000,paused_at=NULL WHERE id=${b.id} AND paused_at IS NOT NULL RETURNING id`;
 else {const s=b.session;rows=await sql`WITH stopped AS (DELETE FROM active_timer WHERE id=${b.id} RETURNING id) INSERT INTO sessions(id,subject_id,activity_type_id,started_at,duration_minutes,notes,tags,focus_rating) SELECT ${s.id},${s.subject_id},${s.activity_type_id},${s.started_at},${s.duration_minutes},${s.notes},${s.tags},${s.focus_rating} FROM stopped RETURNING id`;}
 if(!rows.length)throw new HttpError(409,'The timer changed on another device. Refresh and try again.');return res.status(200).json({ok:true});}
 }
 if(path==='import'&&method==='POST'){
 const b=exportSchema.parse(objectBody(req));await sql.transaction([sql`DELETE FROM active_timer`,sql`DELETE FROM sessions`,sql`DELETE FROM subjects`,sql`DELETE FROM activity_types`,...b.subjects.map(s=>sql`INSERT INTO subjects(id,name,color,archived,weekly_goal_minutes,sort_order) VALUES(${s.id},${s.name},${s.color},${s.archived},${s.weekly_goal_minutes},${s.sort_order})`),...b.activity_types.map(a=>sql`INSERT INTO activity_types(id,name,archived,sort_order) VALUES(${a.id},${a.name},${a.archived},${a.sort_order})`),...b.sessions.map(s=>sql`INSERT INTO sessions(id,subject_id,activity_type_id,started_at,duration_minutes,notes,tags,focus_rating,is_sample) VALUES(${s.id},${s.subject_id},${s.activity_type_id},${s.started_at},${s.duration_minutes},${s.notes},${s.tags},${s.focus_rating},${s.is_sample})`),sql`UPDATE settings SET weekly_goal_minutes=${b.settings.weekly_goal_minutes},theme=${b.settings.theme},time_format=${b.settings.time_format} WHERE singleton=true`]);return res.status(200).json({ok:true});
 }
 if(path==='data'&&method==='POST'){
 const b=z.object({action:z.enum(['sample','remove-sample','reset']),confirmation:z.string().optional()}).strict().parse(objectBody(req));
 if(b.action==='reset'){if(b.confirmation!=='RESET ALL DATA')throw new HttpError(400,'Reset confirmation required');await sql.transaction([sql`DELETE FROM active_timer`,sql`DELETE FROM sessions`,sql`DELETE FROM subjects`,sql`DELETE FROM activity_types`,...defaultSubjects.map(s=>sql`INSERT INTO subjects(id,name,color,sort_order) VALUES(${s.id},${s.name},${s.color},${s.sort_order})`),...defaultActivities.map(a=>sql`INSERT INTO activity_types(id,name,sort_order) VALUES(${a.id},${a.name},${a.sort_order})`),sql`UPDATE settings SET weekly_goal_minutes=1200,theme='system',time_format='24h' WHERE singleton=true`]);}
 else if(b.action==='remove-sample')await sql`DELETE FROM sessions WHERE is_sample=true`;
 else {const state=await readData();const subjects=state.subjects.filter(s=>!s.archived),activities=state.activity_types.filter(a=>!a.archived);if(!subjects.length||!activities.length)throw new HttpError(400,'Add an active subject and activity first');await sql.transaction([sql`DELETE FROM sessions WHERE is_sample=true`,...Array.from({length:45},(_,i)=>{const d=new Date();d.setUTCDate(d.getUTCDate()-Math.floor(i/2));d.setUTCHours(8+i%5,0,0,0);return sql`INSERT INTO sessions(id,subject_id,activity_type_id,started_at,duration_minutes,notes,tags,focus_rating,is_sample) VALUES(${randomUUID()},${subjects[i%subjects.length].id},${activities[i%activities.length].id},${d.toISOString()},${25+i%5*15},${'Sample study session'},${['sample']},${3+i%3},true)`;})]);}
 return res.status(200).json({ok:true});
 }
 if(['login','logout','state','export','sessions','subjects','activity-types','settings','timer','import','data'].includes(path))throw new HttpError(405,'Method not allowed');
 throw new HttpError(404,'API route not found');
 }catch(error){
 if(error instanceof ZodError)return res.status(400).json({error:{code:'VALIDATION_ERROR',message:error.issues.map(i=>`${i.path.join('.')}: ${i.message}`).join('; ')}});
 if(error instanceof SyntaxError)return res.status(400).json({error:{code:'INVALID_JSON',message:'Invalid JSON request'}});
 if(error instanceof HttpError)return res.status(error.status).json({error:{code:`HTTP_${error.status}`,message:error.message}});
 const code=(error as {code?:string}).code;
 if(code==='23503'||code==='23505')return res.status(409).json({error:{code:'CONFLICT',message:'The data changed. Refresh and try again.'}});
 console.error('Request failed',{code:code||'unknown'});return res.status(500).json({error:{code:'SERVER_ERROR',message:'Unable to complete the request. Check database setup and try again.'}});
 }
}
