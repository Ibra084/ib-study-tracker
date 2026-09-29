export type { Subject, Activity, Session, Settings, Backup } from '../lib/schemas';
import type {Backup} from '../lib/schemas';
export interface Timer {id:string; subject_id:string; activity_type_id:string; started_at:string; paused_at:string|null; accumulated_paused_ms:number}
export type State=Backup & {timer:Timer|null};
