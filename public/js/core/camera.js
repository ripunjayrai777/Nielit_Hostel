// Live camera capture (full-screen overlay in index.html) and the shared "Take photo / Upload" box.
(() => {
  const q = s => document.querySelector(s);
  let stream = null, face = 'environment', done = null, shot = '';
  const stop = () => { if (stream) stream.getTracks().forEach(t => t.stop()); stream = null; };
  const close = () => { stop(); q('#cam').classList.add('hide'); document.body.style.overflow = ''; };
  const live = () => { q('#cv').classList.remove('hide'); q('#cp').classList.add('hide'); q('#cb1').classList.remove('hide'); q('#cb2').classList.add('hide'); };
  async function start() {
    stop();
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: face }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false });
      const v = q('#cv'); v.classList.toggle('mir', face === 'user'); v.srcObject = stream;
    } catch (e) { close(); alert('Camera not available (' + (e.name || 'error') + '). Allow camera permission in the browser, or use "Upload from device".'); }
  }
  window.openCam = (f, cb) => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return alert('Live camera is not supported here. Use "Upload from device".');
    face = f; done = cb; shot = ''; live(); q('#cam').classList.remove('hide'); document.body.style.overflow = 'hidden'; start();
  };
  q('#cs').onclick = () => {
    const v = q('#cv'); if (!v.videoWidth) return;
    const k = Math.min(1, 1400 / Math.max(v.videoWidth, v.videoHeight)), c = document.createElement('canvas');
    c.width = v.videoWidth * k; c.height = v.videoHeight * k; c.getContext('2d').drawImage(v, 0, 0, c.width, c.height);
    shot = c.toDataURL('image/jpeg', .72); q('#cp').src = shot;
    q('#cv').classList.add('hide'); q('#cp').classList.remove('hide'); q('#cb1').classList.add('hide'); q('#cb2').classList.remove('hide');
  };
  q('#cr').onclick = live;
  q('#cu').onclick = () => { const s = shot; close(); if (done) done(s); };
  q('#cx').onclick = close;
  q('#cf').onclick = () => { face = face === 'environment' ? 'user' : 'environment'; start(); };
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
})();

// photoBox('#input', 'GLOBALKEY', 'environment'|'user', optional hint text)
// Replaces a plain <input type=file> with [Take photo] [Upload from device] + preview. The compressed photo ends up in window[GLOBALKEY].
function photoBox(sel, key, face, text) {
  const li = document.querySelector(sel); if (!li) return; window[key] = '';
  li.removeAttribute('capture');
  const p = li.previousElementSibling; if (text && p && p.tagName === 'P') p.textContent = text;
  if (typeof openCam !== 'function') { li.onchange = async () => { window[key] = li.files[0] ? await shrink(li.files[0]) : ''; }; return; }
  li.style.display = 'none';
  const w = document.createElement('div'); w.className = 'capbox';
  w.innerHTML = '<div class="row"><button type="button" class="btn">Take photo</button><button type="button" class="btn ghost">Upload from device</button></div><div class="pv"></div>';
  li.after(w);
  const [b1, b2] = w.querySelectorAll('button'), pv = w.querySelector('.pv');
  const set = d => { window[key] = d; pv.innerHTML = d ? '<img src="' + d + '" alt="Selected photo"><button type="button" class="btn ghost sm">Remove</button>' : ''; if (d) pv.querySelector('button').onclick = () => set(''); };
  b1.onclick = () => openCam(face, set); b2.onclick = () => li.click();
  li.onchange = async () => { if (li.files[0]) { set(await shrink(li.files[0])); li.value = ''; } };
}

// liveBox('#container', 'GLOBALKEY', 'environment'|'user'): camera only, no gallery upload (used for ID card photos)
// function liveBox(sel, key, face) {
//   const host = document.querySelector(sel); if (!host) return; window[key] = '';
//   if (typeof openCam !== 'function' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { host.innerHTML = '<p class="red" style="margin:0">This device cannot open the camera. Please use a phone or laptop with a camera.</p>'; return; }
//   host.innerHTML = '<button type="button" class="btn ghost">Capture ID card photo</button><div class="pv"></div><p class="mu" style="margin:8px 0 0">Hold your ID card in front of the camera. Uploading from the gallery is not allowed.</p>';
//   const b = host.querySelector('button'), pv = host.querySelector('.pv');
//   b.onclick = () => openCam(face, d => { window[key] = d; pv.innerHTML = d ? '<img src="' + d + '" alt="ID card photo">' : ''; b.textContent = d ? 'Retake photo' : 'Capture ID card photo'; });
// }

// liveBox('#container', 'GLOBALKEY', 'environment'|'user', label, hint): camera only, NO gallery upload (ID card photo, profile photo)
function liveBox(sel, key, face, label = 'Capture ID card photo', hint = 'Hold your ID card in front of the camera. Uploading from the gallery is not allowed.') {
  const host = document.querySelector(sel); if (!host) return; window[key] = '';
  if (typeof openCam !== 'function' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { host.innerHTML = '<p class="red" style="margin:0">This device cannot open the camera. Please use a phone or laptop with a camera.</p>'; return; }
  host.innerHTML = '<button type="button" class="btn ghost">' + label + '</button><div class="pv"></div><p class="mu" style="margin:8px 0 0">' + hint + '</p>';
  const b = host.querySelector('button'), pv = host.querySelector('.pv');
  b.onclick = () => openCam(face, d => { window[key] = d; pv.innerHTML = d ? '<img src="' + d + '" alt="Captured photo">' : ''; b.textContent = d ? 'Retake photo' : label; if (host.onCaptured) host.onCaptured(d); });
}