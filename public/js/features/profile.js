// Profile (resident and guard): profile photo with the live camera only; name, ID number and ID card photo are locked.
(() => {
  const row = (k, v) => `<div><span>${k}</span><b>${E(v || '-')}</b></div>`;
  V.profile = async function () {
    const p = await api('/api/profile'), g = p.role === 'guard';
    $('#main').innerHTML = `<div class="card"><div class="me">${p.photo ? `<img src="${up(p.photo)}" alt="Profile photo">` : `<div class="avt">${E(initials(p.name))}</div>`}<div><h2>${E(p.name)}</h2><p>${E(p.id)}</p><span class="stat-banner in">Approved${p.approvedOn ? ' on ' + fdate(p.approvedOn) : ''}</span></div></div>
<div class="kv">${g ? row('Guard ID', p.id) + row('Mobile', p.mobile) : row('NDU roll number', p.id) + row('Room', p.room) + row('Batch', p.batch) + row('Branch', p.branch)}</div>
<div class="note">Your name, ${g ? 'guard ID' : 'roll number'} and ID card photo are locked after the warden's approval and cannot be changed here. If something is wrong, please ask the warden.</div></div>
<div class="card"><b>Profile photo</b><p class="mu" style="margin:6px 0 10px">Take a clear photo of your face with the camera. Photos from the gallery are not allowed.</p><div id="pf_cap"></div><div class="row" style="margin:12px 0 0"><button class="btn" id="pf_save" disabled onclick="saveProfilePhoto()">Save profile photo</button></div></div>
<div class="card"><b>ID card on record</b>${p.idImage ? `<div style="margin-top:10px"><img class="cimg" loading="lazy" src="${up(p.idImage)}" alt="ID card"></div>` : '<p class="mu">Not available.</p>'}<p class="mu" style="margin:8px 0 0">Photo taken when you created the account. It cannot be changed.</p></div>
<div class="card"><b>Change password</b><div class="row" style="margin-top:10px"><input id="pw_o" type="password" placeholder="Current password" autocomplete="current-password"><input id="pw_n" type="password" placeholder="New password (6+ characters)" autocomplete="new-password"><button class="btn" onclick="changePw()">Change</button></div></div>`;
    liveBox('#pf_cap', 'PFPHOTO', 'user', 'Take profile photo', 'Look at the camera and keep your face in the frame.');
    const host = $('#pf_cap'); host.onCaptured = d => { const b = $('#pf_save'); if (b) b.disabled = !d; };
  };
  window.saveProfilePhoto = async () => {
    if (!window.PFPHOTO) return alert('Please take your photo with the camera first');
    await api('/api/profile/photo', { method: 'POST', body: { image: window.PFPHOTO } }); toast('Profile photo saved'); await V.profile();
  };
  window.changePw = async () => { await api('/api/profile/password', { method: 'POST', body: { oldPassword: $('#pw_o').value, newPassword: $('#pw_n').value } }); $('#pw_o').value = $('#pw_n').value = ''; toast('Password changed'); };
})();
