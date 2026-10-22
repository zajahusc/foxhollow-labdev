const zone = 'America/New_York';
const calendar = new Intl.DateTimeFormat('en-US', {timeZone:zone, year:'numeric', month:'2-digit', day:'2-digit'});
const clock = new Intl.DateTimeFormat('en-US', {timeZone:zone, year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', second:'2-digit', hourCycle:'h23'});
export function dailyDay(date = new Date()):string {
 const parts = calendar.formatToParts(date);
 const get = (type:string) => parts.find(p=>p.type===type)!.value;
 return `${get('year')}-${get('month')}-${get('day')}`;
}
// Calendar arithmetic is deliberately separate from timezone conversion.
export const previousDay = (day:string):string => new Date(Date.parse(day+'T00:00:00Z')-86400000).toISOString().slice(0,10);
export function nextDailyReset(date = new Date()):number {
 const target = Date.parse(dailyDay(date)+'T00:00:00Z')+86400000;
 let instant = target;
 for(let i=0;i<3;i++) {
  const parts = clock.formatToParts(new Date(instant));
  const get = (type:string) => Number(parts.find(p=>p.type===type)!.value);
  const wall = Date.UTC(get('year'),get('month')-1,get('day'),get('hour'),get('minute'),get('second'));
  instant += target-wall;
 }
 return instant;
}
