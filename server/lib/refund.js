// Hostel Fee Refund SOP (NIELIT Gorakhpur): days from hostel allotment to the date the application is received.
//  <= 10 days  -> Category I   : fee minus Rs 1,000 processing fee
//  11-45 days  -> Category II  : fee minus Rs 1,000 and two months' hostel charge
//  > 45 days   -> Category III : no refund of hostel fee
const { dayDiff } = require('./dates');
const refundCalc = (allot, app, fee, monthly) => { const days = dayDiff(allot, app), cat = days <= 10 ? 'I' : days <= 45 ? 'II' : 'III', processing = cat === 'III' ? 0 : 1000, deduction = cat === 'II' ? 2 * monthly : 0; return { days, category: cat, processing, deduction, refund: cat === 'III' ? 0 : Math.max(0, fee - processing - deduction) }; };
const num = v => Math.max(0, Math.round(+v || 0));
module.exports = { refundCalc, num };
