import test from 'node:test';
import assert from 'node:assert/strict';
import {dailyDay,nextDailyReset,previousDay} from '../build/time.js';
import {dailyKey} from '../../wordbridge/engine.js';

test('all games use the New York date at winter and summer midnight, independently of player timezone',()=>{
 for(const [instant,day] of [
  ['2026-10-22T00:00:01Z','2026-10-21'],
  ['2026-07-02T03:59:59Z','2026-07-01'],['2026-07-02T04:00:00Z','2026-07-02'],
  ['2026-01-02T04:59:59Z','2026-01-01'],['2026-01-02T05:00:00Z','2026-01-02'],
  ['2026-07-02T12:59:59+09:00','2026-07-01'],
 ]) {assert.equal(dailyDay(new Date(instant)),day);assert.equal(dailyKey(new Date(instant)),day);}
});
test('countdowns target the next New York midnight including 23 and 25 hour days',()=>{
 for(const [instant,reset,hours] of [
  ['2026-03-08T05:00:00Z','2026-03-09T04:00:00Z',23],
  ['2026-11-01T04:00:00Z','2026-11-02T05:00:00Z',25],
  ['2026-01-02T05:00:00Z','2026-01-03T05:00:00Z',24],
  ['2026-07-02T04:00:00Z','2026-07-03T04:00:00Z',24],
 ]) {
  const next=nextDailyReset(new Date(instant));assert.equal(next,Date.parse(reset));assert.equal((next-Date.parse(instant))/3600000,hours);
  assert.equal(nextDailyReset(new Date(next-1)),next);
 }
});
test('streak calendar arithmetic handles leap days and year boundaries without timezone shifts',()=>{
 assert.equal(previousDay('2028-03-01'),'2028-02-29');assert.equal(previousDay('2027-01-01'),'2026-12-31');
});
