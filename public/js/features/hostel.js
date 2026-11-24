// Hostel tab: photo, director's message, staff, fees, rules, refund SOP and mess menu. Edit ABOUT below.
(() => {
  // ---- Edit these values whenever something changes ----
  const ABOUT = {
    title: 'NIELIT Boys Hostel',
    subtitle: 'Gorakhpur Campus',
    image: '/assets/hostel.jpg',            // put the hostel photo in public/assets/hostel.jpg
    rules: '/assets/hostel-rules.pdf',      // put the rules PDF in public/assets/hostel-rules.pdf
    sop: '/assets/hostel-refund-sop.pdf',   // put the refund SOP in public/assets/hostel-refund-sop.pdf
    menu: '/assets/mess-menu.jpg',          // mess menu image in public/assets/mess-menu.jpg
    menuTitle: 'Mess menu 2026',
    fees: [{ label: 'Triple Sharing', amount: 12000 }, { label: 'Transit Room with Triple sharing', amount: 15000 }],   // label example: 'Double sharing'
    messAmount: 3200,
    contacts: [{label:'For Any Query', value:'9554613467'}],                    // example: [{ label: 'Office', value: '0551-xxxxxxx' }]
    director: {
      name: 'Dr. Anurag Gupta', role: 'Director-in-Charge', photo: '/assets/director.jpg',   // photo: public/assets/director.jpg
      draft: false,   // set to false after the Director-in-Charge approves the message below
      message: 'Welcome to the NIELIT Gorakhpur Boys Hostel. The hostel is a home away from home for our students, and our aim is to give every resident a safe, disciplined and supportive environment in which to learn and grow. I encourage all residents to follow the hostel rules, respect one another and make full use of the opportunities the campus offers.'
    },
    staff: [
      { title: 'Hostel Warden', name: 'Ritesh Pratap Rao', role: "Sc 'C'", photo: '/assets/warden.jpg', phone: '' },          // photo: public/assets/warden.jpg
      { title: 'Assistant Hostel Warden', name: 'Neeraj Kumar', role: 'STA', photo: '/assets/asst-warden.jpg', phone: '' },   // photo: public/assets/asst-warden.jpg
      { title: 'Residence Hostel Warden', name: 'Ripunjay Rai', role: 'RP', photo: '/assets/ripunjay-rai.jpg', phone: '' },
      { title: 'Residence Hostel Warden', name: 'Prashant Pandey', role: 'RP', photo: '/assets/prashant-pandey.jpg', phone: '' }
    
    ]
  };
  const q = s => document.querySelector(s);
  const inr = n => '\u20B9' + Number(n).toLocaleString('en-IN');
  const ini = n => n.replace(/^(dr|mr|mrs|ms)\.?\s+/i, '').split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  const pic = (p, lg) => `<img class="pimg ${lg ? 'lg' : ''}" src="${E(p.photo)}" alt="${E(p.name)}" onerror="this.outerHTML='<div class=&quot;avt ${lg ? 'lg' : ''}&quot;>${ini(p.name)}</div>'">`;
  V.about = async function () {
    const rooms = new Set(S.map(s => s.room).filter(Boolean)).size, batches = [...new Set(S.map(s => s.batch).filter(Boolean))].sort();
    const A = ABOUT, D = A.director;
    const desk = `<div class="card"><b>From the desk of the Director-in-Charge</b><div class="pcard" style="margin-top:12px"><div class="pt"><p class="msg">${E(D.message)}</p><div style="margin-top:14px"><div class="pname">${E(D.name)}</div><div class="prole">${E(D.role)}</div></div>${D.draft ? '<p class="mu" style="margin:10px 0 0">Draft message, to be confirmed by the Director-in-Charge.</p>' : ''}</div>${pic(D, 1)}</div></div>`;
    const staff = `<div class="card"><b>Hostel administration</b><div class="pg" style="margin-top:12px">${A.staff.map(p => `<div class="pcard"><div class="pt"><div class="prole">${E(p.title)}</div><div class="pname">${E(p.name)}</div><div class="prole">${E(p.role)}</div>${p.phone ? `<p style="margin:8px 0 0"><a href="tel:${E(p.phone)}">${E(p.phone)}</a></p>` : ''}</div>${pic(p)}</div>`).join('')}</div></div>`;
    q('#main').innerHTML = `<div class="ah"><img src="${A.image}" alt="${E(A.title)}" onerror="this.remove()"><div class="ahc"><h2>${E(A.title)}</h2><p>${E(A.subtitle)}</p></div></div>
${desk}${staff}
${ME.role === 'warden' ? `<div class="card"><b>At a glance</b><div class="tiles" style="margin-top:10px"><div class="tile"><b>${S.length}</b><span>Residents</span></div><div class="tile"><b>${rooms}</b><span>Rooms occupied</span></div>${batches.length ? `<div class="tile"><b>${batches.length}</b><span>Batches (${E(batches.join(', '))})</span></div>` : ''}</div></div>` : ''}
<div class="card"><b>Fee structure</b><div class="tiles" style="margin-top:10px">${A.fees.map(f => `<div class="tile"><b>${inr(f.amount)}</b><span>per semester${f.label ? ', ' + E(f.label) : ''}</span></div>`).join('')}<div class="tile"><b>${inr(A.messAmount)}</b><span>mess charges per month</span></div></div></div>
${A.contacts.length ? `<div class="card"><b>Contact</b>${A.contacts.map(c => `<p style="margin:8px 0 0"><span class="mu">${E(c.label)}</span><br>${E(c.value)}</p>`).join('')}</div>` : ''}
<div class="card"><b>Rules and regulations</b><p class="mu" style="margin:6px 0 0">Official hostel rules for residents.</p><div class="acts" id="rulesActs"></div></div>
<div class="card"><b>Hostel fee refund SOP</b><p class="mu" style="margin:6px 0 10px">Refund of hostel fee when a student vacates the hostel before the semester ends. The date of hostel allotment decides the category.</p>
<div class="tbl"><table><tr><th>Category</th><th>Withdrawal</th><th>Hostel fee refund</th></tr><tr><td>I</td><td>Within 10 days of allotment</td><td>Fee paid minus ₹1,000 processing fee</td></tr><tr><td>II</td><td>After 10 days, up to 45 days</td><td>Fee paid minus ₹1,000 processing fee and two months' hostel charge</td></tr><tr><td>III</td><td>After 45 days</td><td>No refund of hostel fee</td></tr></table></div>
<ul class="sopl"><li>Security deposit / caution money is refunded in every category, only after a valid No Dues Certificate and clearing any dues or damages.</li><li>Claim with: withdrawal application, fee receipt, No Dues Certificate and bank account details.</li><li>The Hostel Warden verifies occupancy and dues, Accounts calculates the refund, and it is paid by bank transfer after approval of the Competent Authority.</li><li>Days are counted from the allotment date to the date the Institute receives the application.</li></ul><div class="acts" id="sopActs"></div></div>
<div class="card"><b>${E(A.menuTitle)}</b><div style="margin-top:10px"><a href="${A.menu}" target="_blank" rel="noopener"><img class="mnu" src="${A.menu}" alt="${E(A.menuTitle)}" loading="lazy"></a></div><div class="acts"><a class="abtn p" href="${A.menu}" target="_blank" rel="noopener">Open full size</a><a class="abtn g" href="${A.menu}" download="NIELIT-Mess-Menu-2026.jpg">Download</a></div></div>`;
    let ok = false; try { ok = (await fetch(A.rules, { method: 'HEAD' })).ok; } catch (e) {}
    const box = q('#rulesActs'); if (!box) return;
    const head = async u => { try { return (await fetch(u, { method: 'HEAD' })).ok; } catch (e) { return false; } };
    box.innerHTML = ok ? `<a class="abtn p" href="${A.rules}" target="_blank" rel="noopener">View PDF</a><a class="abtn g" href="${A.rules}" download="NIELIT-Hostel-Rules.pdf">Download PDF</a>` : `<span class="mu">The rules PDF is not added yet. Save it as public/assets/hostel-rules.pdf and deploy.</span>`;
    const ok2 = await head(A.sop), b2 = q('#sopActs');
    if (b2) b2.innerHTML = ok2 ? `<a class="abtn p" href="${A.sop}" target="_blank" rel="noopener">View SOP (PDF)</a><a class="abtn g" href="${A.sop}" download="NIELIT-Hostel-Fee-Refund-SOP.pdf">Download SOP</a>` : '<span class="mu">The SOP PDF is not added yet. Save it as public/assets/hostel-refund-sop.pdf and deploy.</span>';
  };
})();
