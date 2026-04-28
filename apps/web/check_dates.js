const { startOfWeek, addWeeks, formatISO } = require('date-fns');

// Simulate the code
const now = new Date();
const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
const weekEnd = startOfWeek(addWeeks(now, 1), { weekStartsOn: 1 });
const weekKey = formatISO(weekStart, { representation: 'date' });

console.log('now:', now);
console.log('weekStart:', weekStart);
console.log('weekEnd:', weekEnd);
console.log('weekKey:', weekKey);
console.log('Same values?', weekStart.getTime() === weekEnd.getTime());
