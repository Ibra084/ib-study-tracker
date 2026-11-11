import type {NeonQueryFunction} from '@neondatabase/serverless';
import {defaultSubjects,defaultActivities,satSubject} from '../../src/lib/defaults.js';
// Canonical schema. db/schema.sql is generated from this list (see src/lib/schema.test.ts).
export const schemaStatements=[
 `CREATE TABLE IF NOT EXISTS subjects (id uuid PRIMARY KEY, name text NOT NULL CHECK(length(name) BETWEEN 1 AND 100), color text NOT NULL CHECK(color ~ '^#[0-9a-fA-F]{6}$'), archived boolean NOT NULL DEFAULT false, weekly_goal_minutes integer NOT NULL DEFAULT 0 CHECK(weekly_goal_minutes BETWEEN 0 AND 10080), sort_order integer NOT NULL DEFAULT 0)`,
 `CREATE TABLE IF NOT EXISTS activity_types (id uuid PRIMARY KEY, name text NOT NULL, sort_order integer NOT NULL DEFAULT 0, archived boolean NOT NULL DEFAULT false)`,
 `CREATE TABLE IF NOT EXISTS sessions (id uuid PRIMARY KEY, subject_id uuid NOT NULL REFERENCES subjects(id), activity_type_id uuid NOT NULL REFERENCES activity_types(id), started_at timestamptz NOT NULL, duration_minutes double precision NOT NULL CHECK(duration_minutes > 0 AND duration_minutes <= 1440), notes text NOT NULL DEFAULT '', tags text[] NOT NULL DEFAULT '{}', focus_rating integer CHECK(focus_rating BETWEEN 1 AND 5), is_sample boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now())`,
 `CREATE INDEX IF NOT EXISTS sessions_started_at_idx ON sessions(started_at)`,
 `CREATE TABLE IF NOT EXISTS active_timer (singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton), id uuid NOT NULL UNIQUE, subject_id uuid NOT NULL REFERENCES subjects(id), activity_type_id uuid NOT NULL REFERENCES activity_types(id), started_at timestamptz NOT NULL DEFAULT now(), paused_at timestamptz, accumulated_paused_ms double precision NOT NULL DEFAULT 0)`,
 `ALTER TABLE active_timer ADD COLUMN IF NOT EXISTS task_id uuid`,
 `CREATE TABLE IF NOT EXISTS settings (singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton), weekly_goal_minutes integer NOT NULL DEFAULT 1200 CHECK(weekly_goal_minutes BETWEEN 0 AND 10080), theme text NOT NULL DEFAULT 'system' CHECK(theme IN ('light','dark','system')), time_format text NOT NULL DEFAULT '24h' CHECK(time_format IN ('12h','24h')))`,
 `CREATE TABLE IF NOT EXISTS login_attempts (bucket text PRIMARY KEY, attempts integer NOT NULL, reset_at timestamptz NOT NULL)`,
 `CREATE TABLE IF NOT EXISTS items (id uuid PRIMARY KEY, kind text NOT NULL CHECK(kind IN ('topic','mistake','score','task','milestone','profile')), data jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now())`,
 `CREATE TABLE IF NOT EXISTS app_meta (key text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())`,
];
type Sql=NeonQueryFunction<false,false>;
const SEED='defaults_v2',SAT_SEED='sat_overall_v1';
// One transaction: create tables, then seed defaults once per database (recorded in app_meta), so an
// imported or reset subject list is never re-seeded and a failed seed is retried on the next request.
export async function migrate(sql:Sql){
 await sql.transaction([
 ...schemaStatements.map(s=>sql.query(s,[])),
 ...defaultSubjects.map(s=>sql`INSERT INTO subjects(id,name,color,sort_order) SELECT ${s.id}::uuid,${s.name},${s.color},${s.sort_order}::int WHERE NOT EXISTS(SELECT 1 FROM app_meta WHERE key=${SEED}) ON CONFLICT DO NOTHING`),
 ...defaultActivities.map(a=>sql`INSERT INTO activity_types(id,name,sort_order) SELECT ${a.id}::uuid,${a.name},${a.sort_order}::int WHERE NOT EXISTS(SELECT 1 FROM app_meta WHERE key=${SEED}) ON CONFLICT DO NOTHING`),
 sql`INSERT INTO settings(singleton) VALUES(true) ON CONFLICT DO NOTHING`,
 sql`INSERT INTO subjects(id,name,color,sort_order) SELECT ${satSubject.id}::uuid,${satSubject.name},${satSubject.color},${satSubject.sort_order}::int WHERE NOT EXISTS(SELECT 1 FROM app_meta WHERE key=${SAT_SEED}) ON CONFLICT DO NOTHING`,
 sql`INSERT INTO app_meta(key) VALUES(${SEED}),(${SAT_SEED}) ON CONFLICT DO NOTHING`,
 ]);
}
let ready:Promise<void>|null=null;
// The API prepares its own database on first use, so a fresh Neon database needs no manual SQL.
export function ensureSchema(sql:Sql){return ready??=migrate(sql).catch(error=>{ready=null;throw error;});}
export function resetSchemaCache(){ready=null;}
