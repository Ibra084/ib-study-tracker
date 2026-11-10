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
// Planner, review and prep records share one table and are told apart by `kind`.
const day=z.string().regex(/^\d{4}-\d{2}-\d{2}$/,'Use a YYYY-MM-DD date');
const text=(max:number)=>z.string().trim().max(max).default('');
const optionalRef=z.string().uuid().nullable().default(null);
export const mistakeReasons=['content','misread','careless','time','trap'] as const;
export const milestoneCategories=['IA','EE','TOK','Exam','SAT','Other'] as const;
export const topicData=z.object({subject_id:z.string().uuid(),name:z.string().trim().min(1).max(120),notes:text(2000),interval:z.number().int().min(0).max(365).default(0),due:day,reviews:z.number().int().min(0).default(0),lapses:z.number().int().min(0).default(0),last_rating:z.number().int().min(1).max(4).nullable().default(null),last_reviewed:day.nullable().default(null)}).strict();
export const mistakeData=z.object({subject_id:z.string().uuid(),area:text(120),source:text(120),question:z.string().trim().min(1).max(500),reason:z.enum(mistakeReasons),fix:text(1000),date:day,due:day.nullable().default(null),interval:z.number().int().min(0).max(365).default(2)}).strict();
export const scoreData=z.object({test:z.enum(['sat','ib']),date:day,label:text(120),subject_id:optionalRef,rw:z.number().int().min(200).max(800).nullable().default(null),math:z.number().int().min(200).max(800).nullable().default(null),percent:z.number().min(0).max(100).nullable().default(null)}).strict()
 .refine(s=>s.test==='sat'?s.rw!==null&&s.math!==null:s.percent!==null&&s.subject_id!==null,{message:'SAT scores need both sections; IB scores need a subject and a percentage'});
export const taskData=z.object({date:day,title:z.string().trim().min(1).max(200),cue:text(120),subject_id:optionalRef,minutes:z.number().int().min(5).max(600).nullable().default(null),done:z.boolean().default(false)}).strict();
export const milestoneData=z.object({title:z.string().trim().min(1).max(160),date:day,category:z.enum(milestoneCategories),subject_id:optionalRef,done:z.boolean().default(false)}).strict();
export const profileData=z.object({sat_target:z.number().int().min(400).max(1600).nullable().default(null),sat_date:day.nullable().default(null),ib_exam_start:day.nullable().default(null),predicted:z.record(z.string().uuid(),z.number().int().min(1).max(7)).default({}),core_bonus:z.number().int().min(0).max(3).nullable().default(null)}).strict();
const item=<K extends string,T extends z.ZodTypeAny>(kind:K,data:T)=>z.object({id:z.string().uuid(),kind:z.literal(kind),data}).strict();
export const itemSchema=z.discriminatedUnion('kind',[item('topic',topicData),item('mistake',mistakeData),item('score',scoreData),item('task',taskData),item('milestone',milestoneData),item('profile',profileData)]);
export const itemsChangeSchema=z.union([itemSchema,z.array(itemSchema).min(1).max(200)]);
const itemSubjects=(i:z.infer<typeof itemSchema>)=>i.kind==='profile'?Object.keys(i.data.predicted):'subject_id' in i.data&&i.data.subject_id?[i.data.subject_id]:[];
export const exportSchema = z.object({version:z.literal(1),subjects:z.array(subjectSchema).max(1000),activity_types:z.array(activitySchema).max(1000),sessions:z.array(sessionSchema).max(100000),settings:settingsSchema,items:z.array(itemSchema).max(20000).default([])}).strict().superRefine((data,ctx)=>{
 for(const key of ['subjects','activity_types','sessions','items'] as const) if(new Set(data[key].map(x=>x.id)).size!==data[key].length)ctx.addIssue({code:'custom',message:`Duplicate ${key} IDs`});
 const subjects=new Set(data.subjects.map(x=>x.id)),activities=new Set(data.activity_types.map(x=>x.id));
 if(!data.subjects.some(x=>!x.archived)||!data.activity_types.some(x=>!x.archived))ctx.addIssue({code:'custom',message:'At least one active subject and activity are required'});
 if(data.sessions.some(s=>!subjects.has(s.subject_id)||!activities.has(s.activity_type_id)))ctx.addIssue({code:'custom',message:'Session references an unknown subject or activity'});
 if(data.items.some(i=>itemSubjects(i).some(id=>!subjects.has(id))))ctx.addIssue({code:'custom',message:'A planner or review item references an unknown subject'});
});
export type Subject=z.infer<typeof subjectSchema>;
export type Activity=z.infer<typeof activitySchema>;
export type Session=z.infer<typeof sessionSchema>;
export type Settings=z.infer<typeof settingsSchema>;
export type Backup=z.infer<typeof exportSchema>;
export type Item=z.infer<typeof itemSchema>;
export type ItemKind=Item['kind'];
export type ItemOf<K extends ItemKind>=Extract<Item,{kind:K}>;
