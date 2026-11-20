// Talking to the server: token, image links, fetch wrapper
const tok=()=>localStorage.getItem('tok')||'',up=f=>f?'/api/img/'+f+'?t='+encodeURIComponent(tok()):'';
async function api(u,o={}){o.headers={Authorization:'Bearer '+tok()};if(o.body&&!(o.body instanceof FormData)){o.headers['Content-Type']='application/json';o.body=JSON.stringify(o.body)}let r;try{r=await fetch(u,o)}catch(e){alert('Server not reachable');throw 0}if(r.status===401){showLogin();throw 0}const j=await r.json().catch(()=>({}));if(!r.ok){alert(j.error||'Error');throw 0}return j}
