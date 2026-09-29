import {describe,it,expect} from 'vitest';
import {minutes,periods,streaks,weekly,daily,breakdown,elapsed,hours} from './stats';
import type {Session} from '../types';
const s=(date:string,duration=30,subject='a'):Session=>({id:crypto.randomUUID(),subject_id:subject,activity_type_id:'reading',started_at:new Date(date).toISOString(),duration_minutes:duration,notes:'',tags:[],focus_rating:null,is_sample:false});
describe('study statistics',()=>{
 it('handles empty data',()=>{expect(minutes([])).toBe(0);expect(streaks([])).toEqual({current:0,longest:0});});
 it('aggregates today, Monday week, and month in local time',()=>{const now=new Date('2026-09-29T18:00:00');const sessions=[s('2026-09-29T10:00:00',45),s('2026-09-28T10:00:00',60),s('2026-09-27T10:00:00',30),s('2026-08-31T10:00:00',20)];expect(periods(sessions,now)).toEqual({today:45,week:105,month:135});});
 it('does not double count multiple sessions in a streak',()=>{const list=[s('2026-09-25T10:00:00'),s('2026-09-26T10:00:00'),s('2026-09-26T11:00:00'),s('2026-09-27T10:00:00'),s('2026-09-29T10:00:00')];expect(streaks(list,new Date('2026-09-29T20:00:00'))).toEqual({current:1,longest:3});expect(streaks(list,new Date('2026-09-28T20:00:00'))).toEqual({current:3,longest:3});expect(streaks(list,new Date('2026-10-01T20:00:00'))).toEqual({current:0,longest:3});});
 it('groups Sunday and Monday into separate weeks',()=>{const rows=weekly([s('2026-09-27T22:00:00',60),s('2026-09-28T00:00:00',90)],new Date('2026-09-29T12:00:00'));expect(rows.at(-2)?.hours).toBe(1);expect(rows.at(-1)?.hours).toBe(1.5);});
 it('fills missing days and breaks down subjects',()=>{const list=[s('2026-09-28T10:00:00',90,'a'),s('2026-09-28T12:00:00',30,'b')];expect(daily(list,7,new Date('2026-09-29T12:00:00'))).toHaveLength(7);expect(breakdown(list,'subject_id')).toEqual({a:90,b:30});});
 it('restores active and paused elapsed time',()=>{const timer={id:'a',subject_id:'a',activity_type_id:'b',started_at:'2026-09-29T10:00:00Z',paused_at:null,accumulated_paused_ms:60000};expect(elapsed(timer,Date.parse('2026-09-29T10:10:00Z'))).toBe(540000);expect(elapsed({...timer,paused_at:'2026-09-29T10:05:00Z'},Date.parse('2026-09-30T10:10:00Z'))).toBe(240000);});
 it('formats durations without a 60-minute remainder',()=>{expect(hours(119.9)).toBe('2h 0m');});
});
