import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {defaultSubjects,defaultActivities} from '../src/lib/defaults.ts';
const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'msedge',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1050}});
const state={version:1,subjects:defaultSubjects,activity_types:defaultActivities,settings:{weekly_goal_minutes:1200,theme:'light',time_format:'24h'},items:[],timer:null,sessions:Array.from({length:26},(_,i)=>{const date=new Date();date.setDate(date.getDate()-Math.floor(i/3));date.setHours(8+i%5,0,0,0);return {id:crypto.randomUUID(),subject_id:defaultSubjects[i%6].id,activity_type_id:defaultActivities[i%13].id,started_at:date.toISOString(),duration_minutes:30+i%4*15,notes:['Integration by parts','Mechanics: momentum','Market structures','Organic chemistry review'][i%4],tags:['practice'],focus_rating:4,is_sample:true};})};
let authenticated=false;
await context.route('**/api/**',async route=>{const req=route.request();const path=new URL(req.url()).pathname.split('/').at(-1);let body;try{body=req.postDataJSON();}catch{body=null;}
 const send=(data,status=200)=>route.fulfill({status,json:data});
 if(path==='login'){authenticated=true;return send({ok:true});}
 if(!authenticated)return send({error:{message:'Please sign in',code:'HTTP_401'}},401);
 if(path==='logout'){authenticated=false;return send({ok:true});}
 if(path==='state')return send(state);
 if(path==='items'){if(req.method()==='DELETE')state.items=state.items.filter(i=>i.id!==body.id);else for(const i of [].concat(body))state.items=[...state.items.filter(x=>x.id!==i.id),i];return send({ok:true});}
 if(path==='sessions'){if(req.method()==='DELETE')state.sessions=state.sessions.filter(s=>s.id!==body.id);else state.sessions=[body,...state.sessions.filter(s=>s.id!==body.id)];return send({ok:true});}
 if(path==='timer'){if(body.action==='start')state.timer={id:crypto.randomUUID(),subject_id:body.subject_id,activity_type_id:body.activity_type_id,started_at:new Date().toISOString(),paused_at:null,accumulated_paused_ms:0};if(body.action==='pause')state.timer.paused_at=new Date().toISOString();if(body.action==='resume'){state.timer.accumulated_paused_ms+=Date.now()-Date.parse(state.timer.paused_at);state.timer.paused_at=null;}if(body.action==='stop'){state.sessions.unshift(body.session);state.timer=null;}return send({ok:true});}
 if(path==='settings'){state.settings=body;return send({ok:true});}return send({ok:true});
});
const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await mkdir('test-results',{recursive:true});
 await page.goto('http://127.0.0.1:5173');
 await page.getByLabel('Passcode',{exact:true}).fill('test-only');await page.getByRole('button',{name:'Open my study space'}).click();
 await page.getByRole('heading',{name:'Today’s plan'}).waitFor();
 await page.getByLabel('I will…').fill('Browser-tested task');await page.getByRole('button',{name:'Add to today'}).click();await page.getByText('Browser-tested task',{exact:true}).waitFor();assert(state.items.some(i=>i.kind==='task'&&i.data.title==='Browser-tested task'));
 await page.screenshot({path:'test-results/desktop.png',fullPage:true});
 await page.getByRole('button',{name:'Log session',exact:true}).click();
 const dialog=page.getByRole('dialog');await dialog.getByRole('textbox',{name:'Notes',exact:true}).fill('Browser-tested session');await dialog.getByRole('button',{name:'Save session',exact:true}).click();await dialog.waitFor({state:'hidden'});
 assert(state.sessions.some(s=>s.notes==='Browser-tested session'));
 await page.getByRole('button',{name:'Start focus'}).click();await page.getByRole('button',{name:'Pause',exact:true}).waitFor();
 await page.reload();await page.getByRole('button',{name:'Pause',exact:true}).click();await page.getByRole('button',{name:'Resume',exact:true}).waitFor();
 await page.getByRole('button',{name:'Stop and review session'}).click();await page.getByRole('dialog').getByRole('button',{name:'Save session'}).click();await page.getByRole('button',{name:'Start focus'}).waitFor();assert.equal(state.timer,null);
 await page.getByRole('link',{name:'Study log',exact:true}).click();await page.getByLabel('Search notes').fill('Browser-tested session');await page.getByRole('cell',{name:'Browser-tested session',exact:true}).waitFor();
 await page.getByRole('button',{name:/Edit Math AA HL session/}).click();await page.getByRole('dialog').getByRole('textbox',{name:'Notes',exact:true}).fill('Edited in browser');await page.getByRole('dialog').getByRole('button',{name:'Save session'}).click();await page.getByRole('dialog').waitFor({state:'hidden'});assert(state.sessions.some(s=>s.notes==='Edited in browser'));
 await page.getByRole('link',{name:'Review',exact:true}).click();await page.getByLabel('Topics',{exact:true}).fill('Vectors: scalar product');await page.getByRole('button',{name:'Add to review'}).click();await page.getByRole('button',{name:/I’ve recalled it/}).click();await page.getByRole('button',{name:/^Good/}).click();await page.getByRole('heading',{name:'Nothing due right now'}).waitFor();assert.equal(state.items.find(i=>i.kind==='topic').data.reviews,1);
 await page.getByRole('link',{name:'Settings',exact:true}).click();await page.getByRole('button',{name:'Save preferences'}).click();await page.getByText('Changes saved.',{exact:true}).waitFor();assert.equal(state.settings.theme,'light');
 await page.getByRole('link',{name:'Insights',exact:true}).click();await page.getByRole('heading',{name:'Insights',exact:true}).waitFor();
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'test-results/mobile.png',fullPage:true});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),'Mobile viewport must not overflow');
 await page.goto('http://127.0.0.1:5173/does-not-exist');await page.getByRole('heading',{name:'That page took a study break.'}).waitFor();
 assert.deepEqual(errors,[]);console.log('Browser checks passed: login, daily plan, spaced review, manual log/edit, timer refresh/pause/stop, history filtering, settings, insights, mobile layout, 404.');
}catch(error){await page.screenshot({path:'test-results/failure.png',fullPage:true}).catch(()=>{});throw error;}finally{await browser.close();}
