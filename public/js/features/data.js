// Data: the warden can download everything (one JSON file, or each part as an Excel-friendly CSV).
(() => {
  const SETS = [['students', 'Students (all, including those who left)'], ['attendance', 'Attendance marks (Leave and Absent days)'], ['leaves', 'Leaves and student applications'], ['complaints', 'Issues and complaints'], ['fees', 'Hostel fee records'], ['exits', 'Students who left the hostel'], ['accounts', 'Resident and guard accounts']];
  V.data = async function () {
    $('#main').innerHTML = `<div class="card"><b>Download all data</b><p class="mu" style="margin:6px 0 12px">Keep a copy safe, for example once a month.</p>
<div class="row"><button class="btn" onclick="dlAllData()">Everything in one file (JSON)</button></div>
<div class="tbl"><table><tr><th>Part</th><th></th></tr>${SETS.map(([k, t]) => `<tr><td>${t}</td><td><button class="btn ghost sm" onclick="dlSet('${k}')">Download CSV</button></td></tr>`).join('')}</table></div>
<p class="mu" style="margin-top:12px">CSV files open in Excel. Photos (students, ID cards, applications) stay in the database; the files only contain their ids. Passwords are never included.</p></div>`;
  };
  window.dlAllData = async () => { const j = await api('/api/export'); download('nielit-hostel-all-data-' + today() + '.json', JSON.stringify(j, null, 2), 'application/json'); toast('Downloaded'); };
  window.dlSet = async n => {
    const rows = (await api('/api/export?set=' + n))[n]; if (!rows.length) return alert('There are no records in this part yet');
    const keys = [...new Set(rows.flatMap(r => Object.keys(r)))];
    csv(n + '-' + today() + '.csv', [keys, ...rows.map(r => keys.map(k => (r[k] !== null && typeof r[k] === 'object') ? JSON.stringify(r[k]) : r[k]))]);
  };
})();
