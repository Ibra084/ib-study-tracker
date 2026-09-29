import type {Subject,Activity} from '../types';
const names=['Math AA HL','Physics HL','Economics HL','Chemistry SL','French Ab Initio','English Language & Literature SL'];
const colors=['#5366d9','#169b9a','#e29c36','#d9657b','#8b65bf','#498ec7'];
export const defaultSubjects:Subject[]=names.map((name,i)=>({id:`10000000-0000-4000-8000-${String(i+1).padStart(12,'0')}`,name,color:colors[i],archived:false,weekly_goal_minutes:0,sort_order:i}));
export const defaultActivities:Activity[]=['Note-taking','Reading / textbook','Practice problems','Past papers','Flashcards / memorisation','Revision','Homework','Lab work / write-up','Internal Assessment (IA)','Essay writing','Speaking / listening practice','Watching lessons / videos','Other'].map((name,i)=>({id:`20000000-0000-4000-8000-${String(i+1).padStart(12,'0')}`,name,archived:false,sort_order:i}));
