import {readFile} from 'node:fs/promises';
import {neon} from '@neondatabase/serverless';
import {defaultSubjects,defaultActivities} from '../src/lib/defaults';
if(!process.env.DATABASE_URL)throw new Error('DATABASE_URL is required. Pull Vercel environment variables into .env.local first.');
const sql=neon(process.env.DATABASE_URL);
const schema=await readFile(new URL('../db/schema.sql',import.meta.url),'utf8');
await sql.transaction(schema.split(';').map(s=>s.trim()).filter(Boolean).map(s=>sql.query(s,[])));
await sql.transaction([
 ...defaultSubjects.map(s=>sql`INSERT INTO subjects (id,name,color,sort_order) VALUES (${s.id},${s.name},${s.color},${s.sort_order}) ON CONFLICT DO NOTHING`),
 ...defaultActivities.map(a=>sql`INSERT INTO activity_types (id,name,sort_order) VALUES (${a.id},${a.name},${a.sort_order}) ON CONFLICT DO NOTHING`),
 sql`INSERT INTO settings(singleton) VALUES(true) ON CONFLICT DO NOTHING`,
]);
console.log('Schema and default subjects / activities are ready.');
