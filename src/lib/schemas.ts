import { z } from 'zod';
export const subjectSchema = z.object({id:z.string().uuid(),name:z.string().trim().min(1).max(100),color:z.string().regex(/^#[0-9a-f]{6}$/i),archived:z.boolean().default(false),weekly_goal_minutes:z.number().int().min(0).max(10080).default(0),sort_order:z.number().int().min(0).default(0)}).strict();
export const activitySchema = z.object({id:z.string().uuid(),name:z.string().trim().min(1).max(100),sort_order:z.number().int().min(0).default(0),archived:z.boolean().default(false)}).strict();
export const sessionSchema = z.object({id:z.string().uuid(),subject_id:z.string().uuid(),activity_type_id:z.string().uuid(),started_at:z.string().datetime({offset:true}),duration_minutes:z.number().positive().max(1440),notes:z.string().max(10000).default(''),tags:z.array(z.string().trim().min(1).max(50)).max(20).default([]),focus_rating:z.number().int().min(1).max(5).nullable().default(null),is_sample:z.boolean().default(false)}).strict();
export const settingsSchema = z.object({weekly_goal_minutes:z.number().int().min(0).max(10080),theme:z.enum(['light','dark','system']),time_format:z.enum(['12h','24h'])}).strict();
export const timerSchema = z.discriminatedUnion('action',[
 z.object({action:z.literal('start'),subject_id:z.string().uuid(),activity_type_id:z.string().uuid()}).strict(),
 z.object({action:z.literal('pause'),id:z.string().uuid()}).strict(),z.object({action:z.literal('resume'),id:z.string().uuid()}).strict(),
 z.object({action:z.literal('stop'),id:z.string().uuid(),session:sessionSchema}).strict(),
]);
export const exportSchema = z.object({version:z.literal(1),subjects:z.array(subjectSchema).max(1000),activity_types:z.array(activitySchema).max(1000),sessions:z.array(sessionSchema).max(100000),settings:settingsSchema}).strict().superRefine((data,ctx)=>{
 for(const key of ['subjects','activity_types','sessions'] as const) if(new Set(data[key].map(x=>x.id)).size!==data[key].length)ctx.addIssue({code:'custom',message:`Duplicate ${key} IDs`});
 const subjects=new Set(data.subjects.map(x=>x.id)),activities=new Set(data.activity_types.map(x=>x.id));
 if(!data.subjects.some(x=>!x.archived)||!data.activity_types.some(x=>!x.archived))ctx.addIssue({code:'custom',message:'At least one active subject and activity are required'});
 if(data.sessions.some(s=>!subjects.has(s.subject_id)||!activities.has(s.activity_type_id)))ctx.addIssue({code:'custom',message:'Session references an unknown subject or activity'});
});
export type Subject=z.infer<typeof subjectSchema>;
export type Activity=z.infer<typeof activitySchema>;
export type Session=z.infer<typeof sessionSchema>;
export type Settings=z.infer<typeof settingsSchema>;
export type Backup=z.infer<typeof exportSchema>;
