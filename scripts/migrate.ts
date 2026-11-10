import {neon} from '@neondatabase/serverless';
import {migrate} from '../api/_lib/schema';
if(!process.env.DATABASE_URL)throw new Error('DATABASE_URL is required. Pull Vercel environment variables into .env.local first.');
await migrate(neon(process.env.DATABASE_URL));
console.log('Schema and default subjects / activities are ready.');
