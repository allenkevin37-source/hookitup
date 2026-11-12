/* Hook It Up — preview build (v1)
   Runs entirely in the browser with localStorage so it works online for free.
   Next step: swap DB.* calls for Supabase (auth, profiles, likes, messages). */

const KEY = 'hookitup_v1';
const MIN_AGE = 18;
const PRICE = '$5 every 6 months';

const seedProfiles = [
  { id:'p1', name:'Alex', age:29, city:'Mesquite', bio:'Runs sound for a church. Coffee snob. Looking for something real, not a pen pal.', tag:'Music', hue:340 },
  { id:'p2', name:'Jordan', age:34, city:'Forney', bio:'Nurse, three nights a week. The other four I want to be out doing something.', tag:'Outdoors', hue:280 },
  { id:'p3', name:'Casey', age:27, city:'Rockwall', bio:'Dog mom, pho addict, will beat you at putt putt. Say hi.', tag:'Dogs', hue:200 },
  { id:'p4', name:'Riley', age:31, city:'Terrell', bio:'Electrician by day, BBQ by weekend. I cook better than I text.', tag:'Food', hue:20 },
  { id:'p5', name:'Morgan', age:36, city:'Garland', bio:'Teacher. Two kids, one ex, zero drama. Honest about all of it up front.', tag:'Family', hue:160 },
  { id:'p6', name:'Dani', age:28, city:'Dallas', bio:'Bartender downtown. I know every good late spot in the city.', tag:'Nightlife', hue:310 },
  { id:'p7', name:'Sam', age:39, city:'Kaufman', bio:'Fence builder, ranch kid, tired of games. Let’s get tacos and see.', tag:'Country', hue:95 },
  { id:'p8', name:'Taylor', age:26, city:'Rowlett', bio:'Vet tech, foster dogs, laugh at my own jokes. Bonus points if you do too.', tag:'Dogs', hue:250 }
];

let db = load();
let route = 'landing';

function load(){
  try{
    const raw = JSON.parse(localStorage.getItem(KEY));
    if (raw && raw.users) return raw;
  }catch(e){}
  return { users:[], me:null, profiles:seedProfiles.slice(), likes:[], matches:[], msgs:{}, seenIntro:false };
}
function save(){ localStorage.setItem(KEY, JSON.stringify(db)); }
function uid(){ return 'u' + Math.random().toString(36).slice(2,9); }
function esc(s){ return String(s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function age(dob){
  const b = new Date(dob); if (isNaN(b)) return 0;
  const t = new Date(); let a = t.getFullYear() - b.getFullYear();
  const m = t.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && t.getDate() < b.getDate())) a--;
  return a;
}
function toast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('on');
  clearTimeout(t._h); t._h = setTimeout(()=>t.classList.remove('on'), 2200);
}
function go(r){
  window.scrollTo(0,0);
  if (('#'+r) === location.hash){ route = r; render(); }
  else { location.hash = r; }
}

/* ---------- shared bits ---------- */
function photoStyle(p){
  if (p.photo) return `background-image:url('${p.photo}')`;
  return `background:linear-gradient(150deg,hsl(${p.hue||340} 55% 34%),hsl(${(p.hue||340)+40} 60% 16%))`;
}
function initials(n){ return (n||'?').trim().charAt(0).toUpperCase(); }
const demoNote = `<p class="fine" style="text-align:left;border:1px solid var(--line);border-radius:12px;padding:10px 12px;margin-top:18px">Preview build. The people here are sample profiles so you can test the flow. Real accounts switch on when the database is connected.</p>`;

function navBar(active){
  const items = [
    ['feed','Browse','◍'],['matches','Matches','♥'],['profile','Me','☺'],['safety','Safety','⛨']
  ];
  return `<nav class="nav">` + items.map(([r,label,ic]) =>
    `<a href="#${r}" class="${active===r?'on':''}"><span class="ic">${ic}</span>${label}</a>`).join('') + `</nav>`;
}

/* ---------- screens ---------- */
function sLanding(){
  return `<div class="screen center">
    <div class="logo"><i></i>Hook It Up</div>
    <h1 class="brand" style="margin-top:14px">Real people.<br><span>Real connections.</span></h1>
    <p class="lede">No bots. No catfish. No creeps. Built for the Metroplex, run by somebody who answers his own phone.</p>
    <div style="margin:18px 0 4px">
      <span class="badge">18+ only</span>
      <span class="badge">Report &amp; block on every profile</span>
    </div>
    <button class="btn" id="join">Join free</button>
    <button class="btn ghost" id="signin" style="margin-top:10px">I already have an account</button>
    <p class="fine">One plan: ${PRICE}. Cancel any time. <a class="link" href="#upgrade">What you get</a></p>
    <p class="legal">By joining you agree to our <a href="#terms">Terms</a> and <a href="#privacy">Privacy Policy</a>. Must be 18 or older.</p>
  </div>`;
}

function sSignup(){
  return `<div class="screen">
    <div class="headrow"><div class="logo"><i></i>Hook It Up</div><a class="link" href="#landing">Back</a></div>
    <h1 style="font-size:1.6rem;margin-top:8px">Make an account</h1>
    <p class="lede">Takes about a minute. Use a real email, we send your password reset there.</p>
    <label for="fn">First name</label>
    <input id="fn" autocomplete="given-name" placeholder="Kevin">
    <label for="em">Email</label>
    <input id="em" type="email" autocomplete="email" placeholder="you@email.com">
    <label for="pw">Password</label>
    <input id="pw" type="password" autocomplete="new-password" placeholder="At least 8 characters">
    <label for="dob">Date of birth (must be 18+)</label>
    <input id="dob" type="date">
    <label for="ct">City</label>
    <input id="ct" autocomplete="address-level2" placeholder="Forney">
    <p class="err" id="err"></p>
    <button class="btn" id="create">Create account</button>
    <p class="fine">No card needed to look around.</p>
  </div>`;
}

function sLogin(){
  return `<div class="screen">
    <div class="headrow"><div class="logo"><i></i>Hook It Up</div><a class="link" href="#landing">Back</a></div>
    <h1 style="font-size:1.6rem;margin-top:8px">Welcome back</h1>
    <label for="em">Email</label>
    <input id="em" type="email" autocomplete="email">
    <label for="pw">Password</label>
    <input id="pw" type="password" autocomplete="current-password">
    <p class="err" id="err"></p>
    <button class="btn" id="login">Sign in</button>
    <button class="btn ghost" id="forgot" style="margin-top:10px">Reset my password</button>
  </div>`;
}

function sOnboard(){
  const me = db.me;
  return `<div class="screen">
    <div class="headrow"><div class="logo"><i></i>Step 2 of 2</div><a class="link" id="signout" href="#landing">Sign out</a></div>
    <h1 style="font-size:1.6rem;margin-top:8px">Build your profile</h1>
    <p class="lede">A clear face photo and one honest sentence gets you more replies than anything else.</p>
    <label>Photo</label>
    <div class="upload">
      <div class="prev" id="prev" style="${me.photo?`background-image:url('${me.photo}')`:''}"></div>
      <div style="flex:1">
        <input id="pic" type="file" accept="image/*" style="padding:10px;font-size:.85rem">
        <p class="fine" style="text-align:left;margin:6px 0 0">Stored on this device for now.</p>
      </div>
    </div>
    <label for="bio">About you</label>
    <textarea id="bio" maxlength="240" placeholder="What you do, what you're into, what you're actually looking for.">${esc(me.bio||'')}</textarea>
    <label>What are you open to? Pick as many as you want</label>
    <div id="tags">
      ${['Serious relationship','Dating','Friends with benefits','One night stand','New friends','Just seeing what happens'].map(t=>`<span class="pill ${(me.intents||[]).includes(t)?'on':''}" data-t="${t}">${t}</span>`).join('')}
    </div>
    <p class="fine" style="text-align:left;margin:8px 0 0">Nobody sees your answers as a promise. Being honest up front saves everybody a wasted night.</p>
    <p class="err" id="err"></p>
    <button class="btn" id="done">Go to my feed</button>
  </div>`;
}

function sFeed(){
  const me = db.me;
  const pool = db.profiles.filter(p => !db.likes.includes(p.id) && !db.passes.includes(p.id));
  if (!pool.length){
    return `<div class="screen">${navBar('feed')}
      <div class="empty"><h2>That's everybody for now</h2>
      <p>New profiles show up here as more people join. Check back tonight.</p></div></div>`;
  }
  const p = pool[0];
  return `<div class="screen">
    <div class="headrow"><div class="logo"><i></i>Hook It Up</div><a class="link" href="#profile">${esc(me.name)}</a></div>
    <div class="card">
      <div class="photo" style="${photoStyle(p)}">
        <div class="grad"></div>
      </div>
      <div class="info">
        <h2>${esc(p.name)}, ${p.age}</h2>
        <div class="meta">${esc(p.city)} · ${esc(p.tag)}</div>
        <p class="bio">${esc(p.bio)}</p>
      </div>
      <div class="acts">
        <button class="pass" data-pass="${p.id}">Pass</button>
        <button class="like" data-like="${p.id}">Like</button>
      </div>
    </div>
    <p class="fine" style="text-align:left">See something wrong? <a class="link" href="#safety">Report or block</a>. Nobody here can message you until you both like each other.</p>
  </div>${navBar('feed')}`;
}

function sMatches(){
  const list = db.matches.map(id => db.profiles.find(p=>p.id===id)).filter(Boolean);
  return `<div class="screen">
    <div class="headrow"><div class="logo"><i></i>Matches</div></div>
    ${list.length ? `<div class="list">${list.map(p=>`
      <div class="row">
        <div class="pic" style="${photoStyle(p)}"></div>
        <div><b>${esc(p.name)}, ${p.age}</b><small>${esc(p.city)} · likes you back</small></div>
      </div>`).join('')}</div>
      <button class="btn" id="sayhi">Send a first message</button>
      <p class="fine">Messaging turns on with the live build.</p>`
    : `<div class="empty"><h2>No matches yet</h2><p>Keep browsing. When someone likes you back, they land here.</p></div>`}
  </div>${navBar('matches')}`;
}

function sProfile(){
  const me = db.me;
  return `<div class="screen">
    <div class="headrow"><div class="logo"><i></i>Me</div><a class="link" id="signout" href="#landing">Sign out</a></div>
    <div class="card" style="margin-top:12px">
      <div class="photo" style="aspect-ratio:1/1;${photoStyle(me)}"><div class="grad"></div></div>
      <div class="info"><h2>${esc(me.name)}, ${me.age}</h2>
      <div class="meta">${esc(me.city)} · ${esc((me.intents&&me.intents.length?me.intents.join(', '):'Just seeing what happens'))}</div>
      <p class="bio">${esc(me.bio||'No bio yet. Add one so people have something to reply to.')}</p></div>
    </div>
    <div class="stat"><div><b>${db.likes.length}</b><span>liked</span></div><div><b>${db.matches.length}</b><span>matches</span></div><div><b>0</b><span>reports</span></div></div>
    <button class="btn ghost" id="edit">Edit profile</button>
    <button class="btn" id="upgradeBtn">Upgrade · ${PRICE}</button>
    <button class="btn ghost" id="wipe" style="margin-top:10px;color:#ff9aa7;border-color:#5a3b47">Delete my account</button>
  </div>${navBar('profile')}`;
}

function sUpgrade(){
  return `<div class="screen">
    <div class="headrow"><div class="logo"><i></i>Membership</div><a class="link" href="#feed">Back</a></div>
    <h1 style="font-size:1.7rem;margin-top:8px">One plan. No tiers, no coins.</h1>
    <div class="price"><b>$5</b><span>every 6 months</span></div>
    <p class="lede">That's it. One price, all the features, cancel whenever you want.</p>
    <ul class="checks">
      <li>Unlimited likes and messages</li>
      <li>See who liked you first</li>
      <li>Photo verification badge once your selfie check clears</li>
      <li>Report and block on every profile, answered personally</li>
      <li>No ads, ever. Your data isn't sold.</li>
    </ul>
    <button class="btn" id="pay">Pay ${PRICE}</button>
    <p class="fine">Card payments switch on with the Stripe connection. Nothing is charged today.</p>
    <p class="legal">Price and terms are set by Hook It Up. Cancelling stops the next charge; it doesn't refund the current period.</p>
  </div>`;
}

function sSafety(){
  return `<div class="screen">
    <div class="headrow"><div class="logo"><i></i>Safety</div></div>
    <h1 style="font-size:1.6rem;margin-top:8px">How we keep this clean</h1>
    <ul class="checks">
      <li>Every photo is checked against a live selfie before a profile goes live</li>
      <li>One account per phone number</li>
      <li>Report a profile and it's reviewed within 24 hours</li>
      <li>Block anyone and they disappear for good</li>
      <li>Meet in public, tell a friend, drive yourself</li>
    </ul>
    <p class="lede">Being honest about where we are: photo verification is built into the flow but the check service isn't connected yet. Until it is, this page is a promise, not a badge.</p>
    <button class="btn ghost" id="report">Report a profile</button>
  </div>${navBar('safety')}`;
}

function sLegal(which){
  const terms = `<h1 style="font-size:1.6rem">Terms of Service</h1>
  <p class="lede">Draft, effective November 2026.</p>
  <ul class="checks">
    <li>You must be 18 or older to use Hook It Up.</li>
    <li>One account per person. Impersonation gets you removed.</li>
    <li>Membership is ${PRICE}, billed every six months, cancel any time.</li>
    <li>Cancelling stops the next charge. It does not refund the current period.</li>
    <li>We can remove any profile that harasses, scams or misrepresents itself.</li>
    <li>Meet people at your own risk. We verify photos, not intentions.</li>
  </ul>`;
  const privacy = `<h1 style="font-size:1.6rem">Privacy Policy</h1>
  <p class="lede">Draft, effective November 2026.</p>
  <ul class="checks">
    <li>We collect what you type in: name, email, city, birthdate, photos, messages.</li>
    <li>We use it to run the app. We don't sell it and we don't run ads against it.</li>
    <li>Your exact location is never shown. City only.</li>
    <li>Delete your account and your profile, photos and messages are removed.</li>
    <li>Email us to request a copy of your data or a deletion.</li>
  </ul>`;
  return `<div class="screen">
    <div class="headrow"><div class="logo"><i></i>Hook It Up</div><a class="link" href="#landing">Back</a></div>
    ${which==='terms'?terms:privacy}
    <p class="legal">This is a plain-language draft, not legal advice. Have it reviewed before you take payments.</p>
  </div>`;
}

/* ---------- render ---------- */
function render(){
  const app = document.getElementById('app');
  const loggedIn = !!db.me;
  const r = (loggedIn && ['landing','login','signup'].includes(route)) ? 'feed' : route;

  let html = '';
  if (r === 'landing') html = sLanding();
  else if (r === 'signup') html = sSignup();
  else if (r === 'login') html = sLogin();
  else if (r === 'onboard') html = sOnboard();
  else if (r === 'feed') html = sFeed();
  else if (r === 'matches') html = sMatches();
  else if (r === 'profile') html = sProfile();
  else if (r === 'upgrade') html = sUpgrade();
  else if (r === 'safety') html = sSafety();
  else if (r === 'terms' || r === 'privacy') html = sLegal(r);
  else html = sLanding();

  app.innerHTML = html;
  bind(r);
}

function bind(r){
  const $ = s => document.querySelector(s);
  const on = (s, ev, fn) => { const el = $(s); if (el) el.addEventListener(ev, fn); };

  on('#join','click',()=>go('signup'));
  on('#signin','click',()=>go('login'));
  on('#signout','click',e=>{ e.preventDefault(); db.me = null; save(); toast('Signed out'); go('landing'); });

  // signup
  on('#create','click',()=>{
    const name=$('#fn').value.trim(), email=$('#em').value.trim().toLowerCase(),
          pw=$('#pw').value, dob=$('#dob').value, city=$('#ct').value.trim(), err=$('#err');
    if (name.length < 2) return err.textContent = 'Put your first name in.';
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return err.textContent = 'That email doesn\'t look right.';
    if (pw.length < 8) return err.textContent = 'Password needs at least 8 characters.';
    if (!dob) return err.textContent = 'Put your date of birth in.';
    const a = age(dob);
    if (a < MIN_AGE) return err.textContent = `You have to be ${MIN_AGE} or older to use Hook It Up.`;
    if (a > 100) return err.textContent = 'Check that date of birth.';
    if (db.users.some(u=>u.email===email)) return err.textContent = 'That email already has an account. Sign in instead.';
    const u = { id:uid(), name, email, pw, dob, age:a, city:city||'DFW', bio:'', tag:'Dating', intents:[], photo:'', joined:Date.now() };
    db.users.push(u); db.me = u; save();
    go('onboard');
  });

  // login
  on('#login','click',()=>{
    const email=$('#em').value.trim().toLowerCase(), pw=$('#pw').value, err=$('#err');
    const u = db.users.find(x=>x.email===email);
    if (!u) return err.textContent = 'No account with that email. Tap create account.';
    if (u.pw !== pw) return err.textContent = 'Wrong password. Tap reset if you forgot it.';
    db.me = u; save(); toast(`Welcome back, ${u.name}`); go(u.bio ? 'feed' : 'onboard');
  });
  on('#forgot','click',()=>{
    const email=$('#em').value.trim().toLowerCase();
    if (!email) return $('#err').textContent = 'Type your email first, then tap reset.';
    $('#err').textContent = 'Password reset needs the email service connected. For now, tell Kevin at 214-862-6442 and he\'ll fix it manually.';
  });

  // onboard
  on('#pic','change',e=>{
    const f = e.target.files[0]; if (!f) return;
    if (f.size > 3*1024*1024) return toast('That photo is over 3MB. Pick a smaller one.');
    const rd = new FileReader();
    rd.onload = () => {
      db.me.photo = rd.result; save();
      document.getElementById('prev').style.cssText += `;background-image:url('${rd.result}')`;
      toast('Photo added');
    };
    rd.readAsDataURL(f);
  });
  document.querySelectorAll('#tags .pill').forEach(p=>p.addEventListener('click',()=>{
    const t = p.dataset.t;
    db.me.intents = db.me.intents || [];
    if (db.me.intents.includes(t)) db.me.intents = db.me.intents.filter(x=>x!==t);
    else db.me.intents.push(t);
    save();
    p.classList.toggle('on');
  }));
  on('#done','click',()=>{
    db.me.bio = $('#bio').value.trim();
    if (!db.me.intents || !db.me.intents.length) db.me.intents = ['Just seeing what happens'];
    save(); toast('Profile saved'); go('feed');
  });

  // feed
  const like = id => {
    if (!db.likes.includes(id)) db.likes.push(id);
    const target = db.profiles.find(p=>p.id===id);
    const likedBack = Math.random() > 0.4;
    if (likedBack && !db.matches.includes(id)) { db.matches.push(id); save(); toast(`It's a match with ${target.name}`); }
    else { save(); toast('Like sent'); }
    render();
  };
  document.querySelectorAll('[data-like]').forEach(b=>b.addEventListener('click',()=>like(b.dataset.like)));
  document.querySelectorAll('[data-pass]').forEach(b=>b.addEventListener('click',()=>{
    db.passes.push(b.dataset.pass); save(); render();
  }));

  // matches / profile / misc
  on('#sayhi','click',()=>toast('Messaging turns on with the live build'));
  on('#edit','click',()=>go('onboard'));
  on('#upgradeBtn','click',()=>go('upgrade'));
  on('#pay','click',()=>toast('Card payments switch on with Stripe. Nothing charged.'));
  on('#report','click',()=>toast('Reporting opens with the live build'));
  on('#wipe','click',()=>{
    if (!confirm('Delete your account and profile? This clears everything on this device.')) return;
    db.users = db.users.filter(u=>u.id!==db.me.id); db.me=null; db.likes=[]; db.matches=[]; db.passes=[];
    save(); toast('Account deleted'); go('landing');
  });
}

/* ---------- boot ---------- */
function routeFromHash(){
  const h = (location.hash || '').replace('#','');
  return ['landing','signup','login','onboard','feed','matches','profile','upgrade','safety','terms','privacy'].includes(h) ? h : (db.me ? 'feed' : 'landing');
}
window.addEventListener('hashchange', ()=>{
  route = routeFromHash();
  if (route === 'onboard' && !db.me) route = 'landing';
  if (['feed','matches','profile'].includes(route) && !db.me && !db.users.length) route = 'landing';
  render();
});
route = routeFromHash();
if ((route==='feed'||route==='matches'||route==='profile') && !db.me) route = 'landing';
render();
