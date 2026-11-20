// Leave rules. A leave covers the dates from..to (inclusive). Returned leaves end the day before the return date.
// approval: 'Pending' (student applied) | 'Approved' | 'Rejected' | 'Cancelled'. Records without it (made by the warden, or older) count as Approved.
const { today, prevDay } = require('./dates');
const approved = l => !l.approval || l.approval === 'Approved';
const covers = (l, d) => approved(l) && l.from <= d && (l.returned ? d < l.returned : (!l.to || d <= l.to));
const findClash = (list, from, to) => list.find(l => { if (!['Approved', 'Pending'].includes(l.approval || 'Approved')) return false; const e = l.returned ? prevDay(l.returned) : (l.to || '9999-12-31'); return e >= l.from && from <= e && l.from <= (to || '9999-12-31'); });
const leaveStatus = l => !approved(l) ? l.approval : l.returned ? 'Returned' : l.from > today() ? 'Upcoming' : covers(l, today()) ? 'On Leave' : 'Completed';
module.exports = { approved, covers, findClash, leaveStatus };
