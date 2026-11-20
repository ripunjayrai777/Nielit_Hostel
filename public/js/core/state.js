// Shared state. Plain scripts (no build step), so these are globals on purpose.
let S = [];                                   // active students (from /api/students)
let tab = 'dash';                             // current tab id
let F = { batch: '', branch: '', q: '' };     // list filters
let ME = null;                                // logged-in role: { role, label, perms }
const V = {};                                 // views: V.<tab>() renders into #main
const $ = s => document.querySelector(s);
