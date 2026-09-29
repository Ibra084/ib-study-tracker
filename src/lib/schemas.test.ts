import {describe,it,expect} from 'vitest';
import {sessionSchema,subjectSchema,settingsSchema,exportSchema,timerSchema} from './schemas';
import {defaultSubjects,defaultActivities} from './defaults';
const session={id:crypto.randomUUID(),subject_id:defaultSubjects[0].id,activity_type_id:defaultActivities[0].id,started_at:'2026-09-29T10:00:00Z',duration_minutes:45};
const backup={version:1,subjects:defaultSubjects,activity_types:defaultActivities,sessions:[session],settings:{weekly_goal_minutes:1200,theme:'system',time_format:'24h'}};
describe('validation',()=>{
 it('accepts complete backups and fills optional fields',()=>{expect(exportSchema.parse(backup).sessions[0].tags).toEqual([]);});
 it.each([0,-1,1441,NaN,Infinity])('rejects invalid duration %s',duration_minutes=>{expect(sessionSchema.safeParse({...session,duration_minutes}).success).toBe(false);});
 it('rejects invalid dates, foreign references, duplicate IDs, and unknown fields',()=>{expect(sessionSchema.safeParse({...session,started_at:'yesterday'}).success).toBe(false);expect(exportSchema.safeParse({...backup,sessions:[{...session,subject_id:crypto.randomUUID()}]}).success).toBe(false);expect(exportSchema.safeParse({...backup,subjects:[...defaultSubjects,defaultSubjects[0]]}).success).toBe(false);expect(exportSchema.safeParse({...backup,secret:'not allowed'}).success).toBe(false);});
 it('validates colors, focus ratings, settings and timer transitions',()=>{expect(subjectSchema.safeParse({...defaultSubjects[0],color:'red'}).success).toBe(false);expect(sessionSchema.safeParse({...session,focus_rating:6}).success).toBe(false);expect(settingsSchema.safeParse({...backup.settings,weekly_goal_minutes:-1}).success).toBe(false);expect(timerSchema.safeParse({action:'pause'}).success).toBe(false);});
 it('requires at least one active subject and activity on import',()=>{expect(exportSchema.safeParse({...backup,subjects:defaultSubjects.map(s=>({...s,archived:true}))}).success).toBe(false);});
});
