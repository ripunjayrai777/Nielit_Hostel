// ROLE-BASED ACCESS. Edit ROLES to change who can do what; nothing else needs to change.
// Permission format: '<resource>:read' or '<resource>:write'. The resource is the first part of the API path (/api/<resource>/...).
//   warden   = Hostel Warden: everything (students, room allotment, attendance, leaves, complaints, fees, exits, accounts, export)
//   resident = Hostel Resident: only his own data under /api/my (apply leave, raise issues, see status)
//   guard    = Guard: only the gate view under /api/gate (approved leaves, search a student)
const RESOURCES = ['students', 'attendance', 'leaves', 'complaints', 'fees', 'exits', 'accounts', 'export', 'gate', 'my'];
const rw = rs => rs.flatMap(r => [r + ':read', r + ':write']);

const ROLES = {
  warden:   { label: 'Hostel Warden',   perms: rw(['students', 'attendance', 'leaves', 'complaints', 'fees', 'exits', 'accounts', 'export']) },
  resident: { label: 'Hostel Resident', perms: rw(['my']) },
  guard:    { label: 'Guard',           perms: ['gate:read'] }
};

const can = (role, perm) => !!ROLES[role] && ROLES[role].perms.includes(perm);
// which permission does this request need? (req.path is relative to /api). Images and /me only need a login.
const required = req => { const r = req.path.split('/')[1]; return RESOURCES.includes(r) ? r + ':' + (req.method === 'GET' ? 'read' : 'write') : null; };
module.exports = { ROLES, RESOURCES, can, required };
