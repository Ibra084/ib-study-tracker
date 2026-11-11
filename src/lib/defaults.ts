import type {Subject,Activity} from '../types';
const names=['Math AA HL','Physics HL','Economics HL','Chemistry SL','French Ab Initio','English Language & Literature SL','SAT Reading & Writing','SAT Math'];
const colors=['#5366d9','#169b9a','#e29c36','#d9657b','#8b65bf','#498ec7','#0e9f6e','#b7791f'];
const subjectId=(n:number)=>`10000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
// The overall SAT subject (for full practice tests and mixed sessions) sorts just before the two section subjects.
export const satSubject:Subject={id:subjectId(9),name:'SAT',color:'#4b6584',archived:false,weekly_goal_minutes:0,sort_order:6};
export const defaultSubjects:Subject[]=[...names.map((name,i)=>({id:subjectId(i+1),name,color:colors[i],archived:false,weekly_goal_minutes:0,sort_order:i})),satSubject];
export const defaultActivities:Activity[]=['Note-taking','Reading / textbook','Practice problems','Past papers','Flashcards / memorisation','Revision','Homework','Lab work / write-up','Internal Assessment (IA)','Essay writing','Speaking / listening practice','Watching lessons / videos','Other','Active recall / blurting','Spaced review','Timed practice test','Question bank drills','Error log review'].map((name,i)=>({id:`20000000-0000-4000-8000-${String(i+1).padStart(12,'0')}`,name,archived:false,sort_order:i}));
export const SAT_RW_ID=subjectId(7),SAT_MATH_ID=subjectId(8),SAT_ID=satSubject.id;
export const isSatSubject=(id:string|null|undefined)=>id===SAT_ID||id===SAT_RW_ID||id===SAT_MATH_ID;
export const PROFILE_ID='30000000-0000-4000-8000-000000000001';
