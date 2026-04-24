// ─── Firebase ───
firebase.initializeApp({
  apiKey: "AIzaSyDx5bRW7_rxOBEYcEXUeIXmHOKh0_TKuEU",
  authDomain: "justadive-8e746.firebaseapp.com",
  projectId: "justadive-8e746",
  storageBucket: "justadive-8e746.firebasestorage.app",
  messagingSenderId: "432478055788",
  appId: "1:432478055788:web:3c172ee7e1137d7f415749",
  measurementId: "G-4M35ZP3KEF"
});
const db = firebase.firestore();
const auth = firebase.auth();
const googleProvider = new firebase.auth.GoogleAuthProvider();

let currentUser = null, userRole = 'student', userDocRef = null;
let currentSchoolName = '', currentSchoolLogo = '';
let divesCol, certsCol;
let dives = [], certs = [], students = [];
let currentRating = 0, myEnabledQuizzes = [];
let unsubDives = null, unsubCerts = null;
let editingStudentId = null;

document.addEventListener('DOMContentLoaded', function() {
  var fd = document.getElementById('f-date');
  if (fd) fd.valueAsDate = new Date();
});

// ─── Quiz Data — loaded from Firestore, seeded from JS files ───
const defaultQuizCategories = {
  owsd: { name:'Open Water Sport Diver', icon:'🤿', questions: typeof OWSD_QUESTIONS!=='undefined' ? OWSD_QUESTIONS : [] },
  nav: { name:'Underwater Navigation Diver', icon:'🧭', questions:[] },
  night: { name:'Night Diving & Limited Visibility Diver', icon:'🌙', questions:[] },
  narc1: { name:'Narcosis Management Diver Level I', icon:'💨', questions:[] },
  narc2: { name:'Narcosis Management Diver Level II', icon:'💨', questions:[] },
  narc3: { name:'Narcosis Management Diver Level III', icon:'💨', questions:[] },
  drysuit: { name:'Drysuit Diver', icon:'🧥', questions:[] },
  wreck: { name:'Wreck Diver Cold Water', icon:'🚢', questions:[] },
  ice: { name:'Ice Diver', icon:'🧊', questions:[] },
  twinset: { name:'Twinset Diver', icon:'🔧', questions:[] },
  nitrox: { name:'Nitrox Diver', icon:'🔬', questions:[] },
  dpv: { name:'DPV Diver', icon:'🚀', questions:[] },
  ffm: { name:'Full Face Mask Diver', icon:'😷', questions:[] },
  sm_basic: { name:'Basic OW Sidemount Diver', icon:'🔩', questions:[] },
  abc_rec: { name:'ABC Rec Diver', icon:'🅰️', questions:[] },
  aowd: { name:'Advanced OW Diver SILVER', icon:'🥈', questions:[] },
  firstaid: { name:'First AID', icon:'🩹', questions:[] },
  rescue: { name:'Rescue Diver RAPID Program', icon:'🆘', questions:[] },
  master: { name:'Master Diver', icon:'🏆', questions:[] },
  ai: { name:'Assistant Instructor', icon:'👨‍🏫', questions:[] },
  abc_tec: { name:'ABC Tec Diver', icon:'🅱️', questions:[] },
  cave_intro: { name:'Intro To Cave Diver', icon:'🕳️', questions:[] },
  cave_full: { name:'Full Cave Diver', icon:'🦇', questions:[] },
  cave_multi: { name:'Multistage Cave Diver', icon:'🗺️', questions:[] },
  cave_dpv: { name:'DPV Cave Diver', icon:'🚀', questions:[] },
  adv_nitrox: { name:'Advanced Nitrox Diver', icon:'⚗️', questions:[] },
  ext_nitrox: { name:'Extended Range Nitrox', icon:'🧪', questions:[] },
  trimix1: { name:'Trimix Fundamental Diver Level I', icon:'🔷', questions:[] },
  trimix2: { name:'Trimix Expedition Diver Level II', icon:'🔶', questions:[] },
  trimix3: { name:'Trimix Explorer Diver Level III', icon:'💎', questions:[] },
  narc4: { name:'Narcosis Management Diver Level IV', icon:'💨', questions:[] },
  narc5: { name:'Narcosis Management Diver Level V', icon:'💨', questions:[] },
  ccr_air: { name:'CCR Air Diluent Diver', icon:'♻️', questions:[] },
  ccr_tri1: { name:'CCR Trimix Fundamental Level I', icon:'♻️', questions:[] },
  ccr_tri2: { name:'CCR Trimix Expedition Level II', icon:'♻️', questions:[] },
  ccr_tri3: { name:'CCR Trimix Explorer Level III', icon:'♻️', questions:[] },
  sm_adv: { name:'Advanced OW Sidemount Diver', icon:'🔩', questions:[] },
  sm_oh: { name:'Overhead Sidemount Diver', icon:'🔩', questions:[] },
  gas_blend: { name:'Advanced Gas Blender', icon:'⛽', questions:[] },
  o2_tech: { name:'Oxygen Service Technician', icon:'🔧', questions:[] }
};
let quizData = {};
const QUIZ_QUESTIONS_PER_TEST = 20;

// ─── Auth ───
let isRegisterMode = false;
function signInGoogle() {
  var errEl = document.getElementById('login-error');
  errEl.style.display = 'none';
  auth.signInWithPopup(googleProvider).then(function(result) {
    // Success - onAuthStateChanged will handle it
  }).catch(function(e) {
    if (e.code === 'auth/popup-blocked') {
      auth.signInWithRedirect(googleProvider);
      return;
    }
    errEl.textContent = e.code + ': ' + e.message;
    errEl.style.display = 'block';
  });
}
function toggleAuthMode() {
  isRegisterMode = !isRegisterMode;
  document.getElementById('btn-email-submit').textContent = isRegisterMode ? 'Utwórz konto' : 'Zaloguj się';
  document.getElementById('toggle-mode-text').textContent = isRegisterMode ? 'Masz konto? Zaloguj się' : 'Nie masz konta? Zarejestruj się';
  document.getElementById('login-error').style.display = 'none';
}
function handleEmailAuth(e) {
  e.preventDefault();
  const email = document.getElementById('f-email').value;
  const pass = document.getElementById('f-password').value;
  const errEl = document.getElementById('login-error');
  errEl.style.display = 'none';
  (isRegisterMode ? auth.createUserWithEmailAndPassword(email, pass) : auth.signInWithEmailAndPassword(email, pass))
    .catch(err => {
      var msg = 'Zły login lub hasło';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') msg = 'Nie znaleziono konta z tym emailem';
      else if (err.code === 'auth/wrong-password') msg = 'Nieprawidłowe hasło';
      else if (err.code === 'auth/email-already-in-use') msg = 'Konto z tym emailem już istnieje';
      else if (err.code === 'auth/weak-password') msg = 'Hasło za słabe (min. 6 znaków)';
      else if (err.code === 'auth/invalid-email') msg = 'Nieprawidłowy adres email';
      errEl.textContent = msg;
      errEl.style.display = 'block';
    });
  return false;
}
function logOut() { auth.signOut(); }

let pendingNewUser = null;

auth.onAuthStateChanged(async user => {
  if (user) {
    currentUser = user;
    var ready = await loadUserProfile(user);
    if (ready) showApp(user);
  } else hideApp();
});

async function loadUserProfile(user) {
  userDocRef = db.collection('users').doc(user.uid);
  const snap = await userDocRef.get();

  if (!snap.exists) {
    pendingNewUser = user;
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('role-modal').classList.add('open');
    return false;
  } else {
    const d = snap.data();
    // biuro@justadive.pl = admin
    const email = (user.email||'').toLowerCase();
    if (email === 'biuro@justadive.pl' && d.role !== 'admin') {
      await userDocRef.update({ role: 'admin' });
      d.role = 'admin';
    }
    userRole = d.role || 'student';
    myEnabledQuizzes = d.enabledQuizzes || [];
    currentSchoolName = d.schoolName || '';
    currentSchoolLogo = d.schoolLogo || '';
    currentLang = d.lang || 'pl';
    if (userRole === 'student' && d.instructorUid) {
      const instrSnap = await db.collection('users').doc(d.instructorUid).get();
      if (instrSnap.exists) {
        currentSchoolName = instrSnap.data().schoolName || '';
        currentSchoolLogo = instrSnap.data().schoolLogo || '';
      }
    }
    return true;
  }
}

async function chooseRole(role) {
  document.getElementById('role-modal').classList.remove('open');
  var user = pendingNewUser;
  pendingNewUser = null;
  userRole = role;
  myEnabledQuizzes = [];
  currentSchoolName = '';
  currentSchoolLogo = '';
  currentLang = 'pl';
  await userDocRef.set({
    email: user.email,
    name: user.displayName || user.email,
    role: role,
    enabledQuizzes: [],
    schoolName: '',
    schoolLogo: '',
    instructorUid: '',
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  showApp(user);
}

async function showApp(user) {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app-header').style.display = '';
  document.getElementById('app-container').style.display = '';
  document.getElementById('user-menu').style.display = 'flex';
  const av = document.getElementById('user-avatar');
  // Avatar: najpierw z Firestore, potem Google, potem placeholder
  const userData = (await userDocRef.get()).data();
  if (userData && userData.avatar) {
    av.src = userData.avatar;
  } else {
    av.src = user.photoURL || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><circle cx="20" cy="20" r="20" fill="%23264060"/><text x="20" y="26" text-anchor="middle" fill="%2329abe2" font-size="18" font-weight="bold">' + (user.displayName||user.email||'?')[0].toUpperCase() + '</text></svg>';
  }
  av.title = 'Kliknij aby zmienić zdjęcie';

  // Logo szkoły w headerze
  const brandLogo = document.getElementById('brand-logo');
  const brandName = document.getElementById('brand-name');
  const brandSub = document.getElementById('brand-sub');
  if (currentSchoolLogo === 'justadive') {
    brandLogo.src = 'JustaDive/logotyp negatyw.png';
    brandName.innerHTML = '<span class="just">Just</span> <span class="a">a</span> <span class="dive">dive</span>';
    brandSub.textContent = 'Twoja Szkoła Nurkowania';
  } else if (currentSchoolLogo === 'dive-app') {
    brandLogo.src = 'austronaut_logo.jpg';
    brandName.textContent = 'Dive App';
    brandSub.textContent = 'Dive Logbook';
  } else if (currentSchoolLogo) {
    brandLogo.src = currentSchoolLogo;
    brandName.textContent = currentSchoolName || 'Szkoła Nurkowa';
    brandSub.textContent = '';
  }
  const badge = document.getElementById('role-badge');
  if (userRole==='admin') {
    badge.textContent='⚡ Admin'; badge.className='role-badge admin';
    document.getElementById('tabs-student').style.display='none';
    document.getElementById('tabs-instructor').style.display='none';
    document.getElementById('tabs-admin').style.display='flex';
    document.getElementById('btn-add-cert').style.display='';
    document.getElementById('btn-add-pdf').style.display='';
    document.getElementById('admin-role-section').style.display='';
    loadAllUsers();
  } else if (userRole==='instructor') {
    badge.textContent='🏅 Instruktor'; badge.className='role-badge instructor';
    document.getElementById('tabs-student').style.display='none';
    document.getElementById('tabs-instructor').style.display='flex';
    document.getElementById('tabs-admin').style.display='none';
    document.getElementById('btn-add-cert').style.display='none';
    document.getElementById('btn-add-pdf').style.display='none';
    document.getElementById('admin-role-section').style.display='none';
    loadStudents();
  } else {
    badge.textContent='🎓 Kursant'; badge.className='role-badge student';
    document.getElementById('tabs-student').style.display='flex';
    document.getElementById('tabs-instructor').style.display='none';
    document.getElementById('tabs-admin').style.display='none';
    document.getElementById('btn-add-cert').style.display='none';
    document.getElementById('btn-add-pdf').style.display='none';
    document.getElementById('admin-role-section').style.display='none';
  }
  divesCol = userDocRef.collection('dives');
  certsCol = userDocRef.collection('certs');
  if (unsubDives) unsubDives();
  unsubDives = divesCol.orderBy('createdAt','desc').onSnapshot(snap => {
    dives = snap.docs.map(doc=>({id:doc.id,...doc.data()}));
    dives.forEach((d,i)=>d.num=dives.length-i);
    updateStats();
    if (document.getElementById('panel-log').classList.contains('active')) renderDives();
  });
  if (unsubCerts) unsubCerts();
  unsubCerts = certsCol.orderBy('date','desc').onSnapshot(snap => {
    certs = snap.docs.map(doc=>({id:doc.id,...doc.data()}));
    if (document.getElementById('panel-certs').classList.contains('active')) renderCerts();
  });
  await loadQuizData();
  renderQuizCategories();
  listenLibrary();
  switchTab('certs');
  if (currentLang !== 'pl') switchLang(currentLang);
}

function hideApp() {
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('app-header').style.display = 'none';
  document.getElementById('app-container').style.display = 'none';
  if (unsubDives){unsubDives();unsubDives=null;}
  if (unsubCerts){unsubCerts();unsubCerts=null;}
  if (unsubLibrary){unsubLibrary();unsubLibrary=null;}
  currentUser=null; dives=[]; certs=[]; students=[];
}

// ─── Tabs ───
function switchTab(tab) {
  const names = {
    '🎓 Certyfikaty':'certs','🧠 Egzaminy':'quiz','📚 Biblioteka':'library',
    '📋 Logbook':'log','🛒 Sklep':'shop','👥 Kursanci':'manage','👥 Zarządzanie':'manage'
  };
  document.querySelectorAll('.tab').forEach(t => {
    const n = names[t.textContent.trim()]; t.classList.toggle('active', n===tab);
  });
  document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
  document.getElementById('panel-'+tab).classList.add('active');
  if (tab==='log') renderDives();
  if (tab==='certs') renderCerts();
  if (tab==='manage') renderStudents();
  if (tab==='library') renderLibrary();
}

// ─── Stats ───
function updateStats() {
  document.getElementById('total-dives').textContent = dives.length;
  const maxD = dives.length ? Math.max(...dives.map(d=>d.depth||0)) : 0;
  document.getElementById('max-depth-stat').textContent = maxD+'m';
  const totalMin = dives.reduce((a,d)=>a+(d.duration||0),0);
  document.getElementById('total-time-stat').textContent = totalMin>=60?(totalMin/60).toFixed(1)+'h':totalMin+'m';
}

// ─── Dive Log ───
function updateDepthBar(val) {
  const pct = Math.min((val/60)*100,100);
  document.getElementById('depth-fill').style.width = pct+'%';
  document.getElementById('depth-val').textContent = (val||0)+' m';
}
function setRating(n) {
  currentRating = n;
  document.querySelectorAll('.star').forEach((s,i)=>s.classList.toggle('active',i<n));
}
async function saveDive() {
  const site = document.getElementById('f-site').value.trim();
  if (!site) { showToast('⚠️ Podaj nazwę miejsca nurkowania'); return; }
  await divesCol.add({
    site, location:document.getElementById('f-location').value.trim(),
    date:document.getElementById('f-date').value, type:document.getElementById('f-type').value,
    depth:parseFloat(document.getElementById('f-depth').value)||0,
    duration:parseInt(document.getElementById('f-duration').value)||0,
    temp:document.getElementById('f-temp').value, visibility:document.getElementById('f-visibility').value,
    buddy:document.getElementById('f-buddy').value.trim(), cert:document.getElementById('f-cert').value.trim(),
    rating:currentRating, notes:document.getElementById('f-notes').value.trim(),
    createdAt:firebase.firestore.FieldValue.serverTimestamp()
  });
  ['f-site','f-location','f-depth','f-duration','f-temp','f-visibility','f-buddy','f-cert','f-notes'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('f-date').valueAsDate=new Date();
  document.getElementById('f-type').value='Recreational';
  updateDepthBar(0); setRating(0); currentRating=0;
  showToast('✅ Nurkowanie zapisane!');
}

// ─── Import from dive computers ───
async function importDives(event) {
  const file = event.target.files[0];
  if (!file) return;
  const text = await file.text();
  const ext = file.name.split('.').pop().toLowerCase();
  let imported = [];
  try {
    if (ext==='xml'||ext==='uddf') imported = parseXML(text);
    else if (ext==='csv') imported = parseCSV(text);
    else { showToast('⚠️ Nieobsługiwany format'); return; }
  } catch(e) { showToast('⚠️ Błąd parsowania: '+e.message); return; }
  if (!imported.length) { showToast('⚠️ Nie znaleziono nurkowań w pliku'); return; }
  const batch = db.batch();
  imported.forEach(d => {
    const ref = divesCol.doc();
    batch.set(ref, { ...d, createdAt:firebase.firestore.FieldValue.serverTimestamp() });
  });
  await batch.commit();
  showToast('✅ Zaimportowano '+imported.length+' nurkowań!');
  event.target.value = '';
}

function parseXML(text) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(text,'text/xml');
  const imported = [];
  // Subsurface XML
  const ssDives = doc.querySelectorAll('dive');
  if (ssDives.length) {
    ssDives.forEach(d => {
      const depthStr = d.getAttribute('duration')||'';
      const maxDepth = d.querySelector('depth')?.getAttribute('max')||d.getAttribute('depth')||'0';
      const durStr = d.getAttribute('duration')||'0';
      imported.push({
        site: d.querySelector('location')?.textContent || d.getAttribute('divesiteid') || 'Import',
        location: '', date: d.getAttribute('date')||'',
        type: 'Recreational',
        depth: parseFloat(maxDepth.replace(/[^\d.]/g,''))||0,
        duration: parseDuration(durStr),
        temp: d.querySelector('temperature')?.getAttribute('water')?.replace(/[^\d.]/g,'')||'',
        visibility: d.querySelector('visibility')?.textContent?.replace(/[^\d.]/g,'')||'',
        buddy: d.getAttribute('buddy')||'', cert:'', rating:0,
        notes: d.querySelector('notes')?.textContent||'', source:'import'
      });
    });
    return imported;
  }
  // UDDF
  const uddfDives = doc.querySelectorAll('repetitiongroup dive, dive');
  uddfDives.forEach(d => {
    const wp = d.querySelectorAll('waypoint');
    let maxD=0;
    wp.forEach(w => { const dep=parseFloat(w.querySelector('depth')?.textContent||0); if(dep>maxD)maxD=dep; });
    const startStr = d.querySelector('informationbeforedive datetime, datetime')?.textContent||'';
    const dateOnly = startStr.substring(0,10);
    let dur = 0;
    if (wp.length>=2) {
      const times = Array.from(wp).map(w=>parseFloat(w.querySelector('divetime')?.textContent||0));
      dur = Math.round(Math.max(...times)/60);
    }
    imported.push({
      site: d.querySelector('informationbeforedive link')?.textContent||'Import UDDF',
      location:'', date:dateOnly, type:'Recreational',
      depth:Math.round(maxD*10)/10, duration:dur,
      temp:'', visibility:'', buddy:'', cert:'', rating:0, notes:'', source:'import'
    });
  });
  return imported;
}

function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length<2) return [];
  const headers = lines[0].toLowerCase().split(/[,;\t]/);
  const findCol = (...names) => headers.findIndex(h => names.some(n=>h.includes(n)));
  const iSite=findCol('site','location','miejsce','spot');
  const iDate=findCol('date','data');
  const iDepth=findCol('depth','głęb','max');
  const iDur=findCol('duration','czas','time','min');
  const iTemp=findCol('temp');
  const imported = [];
  for (let i=1;i<lines.length;i++) {
    const cols = lines[i].split(/[,;\t]/);
    if (cols.length<2) continue;
    imported.push({
      site:cols[iSite]?.trim()||'Import CSV', location:'',
      date:cols[iDate]?.trim()||'', type:'Recreational',
      depth:parseFloat(cols[iDepth])||0, duration:parseInt(cols[iDur])||0,
      temp:iTemp>=0?cols[iTemp]?.trim():'', visibility:'',
      buddy:'', cert:'', rating:0, notes:'', source:'import'
    });
  }
  return imported;
}

function parseDuration(s) {
  if (!s) return 0;
  const m = s.match(/(\d+):(\d+)/);
  if (m) return parseInt(m[1])*60+parseInt(m[2]) > 300 ? parseInt(m[1]) : parseInt(m[1])*60+parseInt(m[2]);
  return parseInt(s.replace(/[^\d]/g,''))||0;
}

// ─── Dive List ───
function renderDives() {
  const q = document.getElementById('search-input').value.toLowerCase();
  const type = document.getElementById('filter-type').value;
  const grid = document.getElementById('dives-grid');
  const filtered = dives.filter(d => {
    const mq = !q||(d.site||'').toLowerCase().includes(q)||(d.location||'').toLowerCase().includes(q);
    return mq && (!type||d.type===type);
  });
  if (!filtered.length) {
    grid.innerHTML = '<div class="empty-state"><span class="empty-icon">🌊</span><h3>'+(dives.length?'Brak wyników':'Brak zapisanych nurkowań')+'</h3><p>'+(dives.length?'Spróbuj innego wyszukiwania':'Zaloguj swoje pierwsze nurkowanie!')+'</p></div>';
    return;
  }
  grid.innerHTML = filtered.map(d=>`
    <div class="dive-card" onclick="openDiveModal('${d.id}')">
      <div class="dive-num">#${d.num}</div>
      <div class="dive-info">
        <h3>${d.site}${d.location?' <span style="color:var(--text-dim);font-weight:400">· '+d.location+'</span>':''}</h3>
        <div class="dive-meta">
          ${d.date?'<div class="chip">📅 <span>'+fmtDate(d.date)+'</span></div>':''}
          <div class="chip">🤿 <span>${d.type}</span></div>
          ${d.duration?'<div class="chip">⏱ <span>'+d.duration+' min</span></div>':''}
        </div>
        ${d.rating?'<div style="margin-top:4px;font-size:0.75rem">'+'⭐'.repeat(d.rating)+'</div>':''}
      </div>
      <div class="dive-depth-col"><div class="depth-big">${d.depth}</div><div class="depth-unit">meters</div></div>
    </div>`).join('');
}
function fmtDate(s) { if(!s)return''; return new Date(s+'T00:00:00').toLocaleDateString('pl-PL',{day:'numeric',month:'short',year:'numeric'}); }

function openDiveModal(id) {
  const d = dives.find(x=>x.id===id); if(!d) return;
  document.getElementById('m-num').textContent='DIVE #'+d.num;
  document.getElementById('m-site').textContent=d.site+(d.location?' — '+d.location:'');
  document.getElementById('m-meta').innerHTML=(d.date?'📅 '+fmtDate(d.date)+' · ':'')+'🤿 '+d.type+(d.rating?' '+'⭐'.repeat(d.rating):'');
  document.getElementById('m-stats').innerHTML=[
    {v:d.depth+'m',l:'Maks. głęb.'},{v:d.duration+' min',l:'Czas dna'},
    {v:d.temp?d.temp+'°C':'—',l:'Temp. wody'},{v:d.visibility?d.visibility+'m':'—',l:'Widoczność'},
    {v:d.buddy||'—',l:'Buddy'},{v:d.cert||'—',l:'Certyfikat'}
  ].map(s=>'<div class="m-stat"><div class="m-stat-val">'+s.v+'</div><div class="m-stat-label">'+s.l+'</div></div>').join('');
  document.getElementById('m-notes-wrap').innerHTML=d.notes?'<div class="modal-section-title">Notatki</div><div class="modal-notes">'+d.notes+'</div>':'';
  document.getElementById('m-delete').onclick=()=>deleteDive(id);
  document.getElementById('modal').classList.add('open');
}
async function deleteDive(id) { if(!confirm('Usunąć ten log nurkowania?'))return; await divesCol.doc(id).delete(); closeModalDirect(); showToast('🗑 Log usunięty'); }
function closeModal(e){if(e.target===document.getElementById('modal'))closeModalDirect();}
function closeModalDirect(){document.getElementById('modal').classList.remove('open');}

// ─── Certifications ───
function renderCerts() {
  const grid = document.getElementById('certs-grid');
  if (!certs.length) {
    grid.innerHTML = '<div class="empty-state"><span class="empty-icon">🎓</span><h3>Brak certyfikatów</h3><p>'+(userRole==='instructor'?'Dodaj certyfikat kursantowi.':'Twój instruktor doda Ci certyfikat.')+'</p></div>';
    return;
  }
  grid.innerHTML = certs.map(c => {
    const agency = (c.agency||'PSAI').toUpperCase();
    return `<div>
      <div class="cert-card">
        <div class="cert-front">
          <div class="cert-front-level">${c.level||'Diver'}</div>
          <div class="cert-front-logo-wrap"><img src="JustaDive/PSAI logo bez tła.png" alt="PSAI" class="cert-front-logo"></div>
          <div class="cert-front-bottom">Professional Scuba Association International</div>
        </div>
      </div>
      <div class="cert-card" style="margin-top:8px;">
        <div class="cert-back">
          <div class="cert-back-header">${agency} ${c.level||'Certyfikat'}</div>
          <div class="cert-back-body">
            <img src="JustaDive/PSAI logo bez tła.png" alt="PSAI" class="cert-back-logo">
            <div class="cert-back-info">
              <div class="cert-back-name">${c.name||'—'}</div>
              <div class="cert-back-detail">
                ${c.number?'Certification # <strong>'+c.number+'</strong><br>':''}
                ${c.date?fmtDate(c.date)+'<br>':''}
                ${c.instructor?'Instructor: <strong>'+c.instructor+'</strong>':''}
              </div>
            </div>
            ${c.photo?'<img src="'+c.photo+'" class="cert-back-photo">':''}
          </div>
          <div class="cert-back-footer">PSA INTERNATIONAL</div>
          <div class="cert-back-iso">ISO 49001 Certified / www.psai.pl</div>
        </div>
      </div>
      ${userRole==='instructor'?'<div class="cert-actions"><button class="btn-delete" onclick="deleteCert(\''+c.id+'\')">🗑 Usuń</button></div>':''}
    </div>`;
  }).join('');
}

let certPhotoBase64 = '';

function previewCertPhoto(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      const canvas = document.createElement('canvas');
      const max = 200;
      let w = img.width, h = img.height;
      if (w > h) { h = Math.round(h * max / w); w = max; }
      else { w = Math.round(w * max / h); h = max; }
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      certPhotoBase64 = canvas.toDataURL('image/jpeg', 0.7);
      const preview = document.getElementById('cf-photo-preview');
      preview.src = certPhotoBase64;
      preview.style.display = 'block';
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function openCertModal() {
  ['cf-level','cf-number','cf-name','cf-instructor'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('cf-agency').value='PSAI';
  document.getElementById('cf-date').value='';
  document.getElementById('cf-photo').value='';
  document.getElementById('cf-photo-preview').style.display='none';
  certPhotoBase64 = '';
  const sel = document.getElementById('cf-student');
  sel.innerHTML = students.map(s=>'<option value="'+s.uid+'">'+(s.name||s.email)+'</option>').join('');
  document.getElementById('cert-modal').classList.add('open');
}
function closeCertModal(e){if(e.target===document.getElementById('cert-modal'))closeCertModalDirect();}
function closeCertModalDirect(){document.getElementById('cert-modal').classList.remove('open');}

async function saveCert() {
  const level = document.getElementById('cf-level').value.trim();
  if (!level){showToast('⚠️ Podaj poziom/kurs');return;}
  const studentUid = document.getElementById('cf-student').value;
  if (!studentUid){showToast('⚠️ Wybierz kursanta');return;}
  await db.collection('users').doc(studentUid).collection('certs').add({
    agency:document.getElementById('cf-agency').value, level,
    number:document.getElementById('cf-number').value.trim(),
    date:document.getElementById('cf-date').value,
    name:document.getElementById('cf-name').value.trim(),
    instructor:document.getElementById('cf-instructor').value.trim(),
    photo: certPhotoBase64 || '',
    studentUid
  });
  closeCertModalDirect(); showToast('✅ Certyfikat dodany!');
}
async function deleteCert(id) {
  if(!confirm('Usunąć ten certyfikat?'))return;
  await certsCol.doc(id).delete();
  showToast('🗑 Certyfikat usunięty');
}

// ─── Instructor: students ───
async function loadStudents() {
  const snap = await db.collection('users').where('instructorUid','==',currentUser.uid).get();
  students = snap.docs.map(doc=>({uid:doc.id,...doc.data()}));
}
async function addStudent() {
  const email = document.getElementById('add-student-email').value.trim();
  if (!email){showToast('⚠️ Podaj email kursanta');return;}
  const snap = await db.collection('users').where('email','==',email).get();
  if (snap.empty){showToast('⚠️ Nie znaleziono — kursant musi się najpierw zarejestrować.');return;}
  const studentDoc = snap.docs[0];
  // Przypisz kursanta do tego instruktora
  await db.collection('users').doc(studentDoc.id).update({ instructorUid: currentUser.uid });
  document.getElementById('add-student-email').value='';
  await loadStudents(); renderStudents();
  showToast('✅ Kursant przypisany!');
}
function renderStudents() {
  const el = document.getElementById('students-list');
  if (!students.length){el.innerHTML='<div class="empty-state"><span class="empty-icon">👥</span><h3>Brak kursantów</h3><p>Kursanci pojawią się po rejestracji.</p></div>';return;}
  el.innerHTML = students.map(s=>{
    const en=(s.enabledQuizzes||[]).length, tot=Object.keys(quizData).length;
    return '<div class="student-card" onclick="openStudentModal(\''+s.uid+'\')"><div class="student-info"><div class="student-name">'+(s.name||s.email)+'</div><div class="student-email">'+s.email+'</div></div><div class="student-quizzes">'+en+'/'+tot+' quizów</div></div>';
  }).join('');
}
function openStudentModal(uid) {
  editingStudentId=uid;
  const s=students.find(x=>x.uid===uid); if(!s)return;
  document.getElementById('sm-title').textContent='🎓 '+(s.name||s.email);
  const en=s.enabledQuizzes||[];
  document.getElementById('sm-quizzes').innerHTML=Object.entries(quizData).map(([k,cat])=>
    '<label class="quiz-toggle"><input type="checkbox" value="'+k+'" '+(en.includes(k)?'checked':'')+'><span>'+cat.icon+' '+cat.name+'</span></label>'
  ).join('');
  document.getElementById('student-modal').classList.add('open');
}
function closeStudentModal(e){if(e.target===document.getElementById('student-modal'))closeStudentModalDirect();}
function closeStudentModalDirect(){document.getElementById('student-modal').classList.remove('open');editingStudentId=null;}
async function saveStudentQuizzes() {
  if(!editingStudentId)return;
  const enabled=[];
  document.querySelectorAll('#sm-quizzes input[type=checkbox]').forEach(ch=>{if(ch.checked)enabled.push(ch.value);});
  await db.collection('users').doc(editingStudentId).update({enabledQuizzes:enabled});
  const s=students.find(x=>x.uid===editingStudentId); if(s)s.enabledQuizzes=enabled;
  closeStudentModalDirect(); renderStudents();
  showToast('✅ Quizy zaktualizowane!');
}

// ─── Quiz ───
let quizState = null;

async function loadQuizData() {
  quizData = {};
  if (typeof OWSD_QUESTIONS !== 'undefined' && OWSD_QUESTIONS.length) {
    await db.collection('quizCategories').doc('owsd').set({
      name:'Open Water Sport Diver', icon:'🤿', questions: OWSD_QUESTIONS
    });
  }
  var snap = await db.collection('quizCategories').get();
  snap.forEach(function(doc) { quizData[doc.id] = doc.data(); });
  for (var key in defaultQuizCategories) {
    if (!quizData[key]) quizData[key] = { name:defaultQuizCategories[key].name, icon:defaultQuizCategories[key].icon, questions:[] };
  }
}

function renderQuizCategories() {
  var el = document.getElementById('quiz-categories');
  var isPriv = userRole==='admin'||userRole==='instructor';
  var isAdmin = userRole==='admin';
  var html = Object.entries(quizData).map(function(entry){
    var k=entry[0], cat=entry[1];
    var ok = isPriv || (myEnabledQuizzes||[]).includes(k);
    var cnt = (cat.questions||[]).length;
    return '<div class="quiz-cat '+(ok&&cnt?'':'disabled')+'" '+(ok&&cnt?'onclick="startQuiz(\''+k+'\')"':'')+'>'+
      '<span class="quiz-cat-icon">'+cat.icon+'</span>'+
      '<div class="quiz-cat-name">'+cat.name+'</div>'+
      '<div style="font-size:0.55rem;color:var(--text-muted);margin-top:2px;">'+cnt+' pytań</div>'+
      (ok?'':'<div class="quiz-locked">🔒</div>')+
      (isAdmin&&cnt?'<div style="font-size:0.5rem;color:var(--text-muted);margin-top:2px;cursor:pointer;" onclick="event.stopPropagation();deleteQuizCategory(\'"''+k+'\'"'')">🗑 usuń pytania</div>':'')+
      '</div>';
  }).join('');
  if (isAdmin) {
    html += '<div class="quiz-cat" onclick="openUploadQuiz()" style="cursor:pointer;"><span class="quiz-cat-icon">📂</span><div class="quiz-cat-name">Załaduj pytania (TXT)</div></div>';
  }
  if (isPriv) {
    html += '<div class="quiz-cat" onclick="showQuizResults()" style="cursor:pointer;"><span class="quiz-cat-icon">📊</span><div class="quiz-cat-name">Wyniki kursantów</div></div>';
  }
  el.innerHTML = html;
}

async function deleteQuizCategory(key) {
  if (!confirm('Usunąć pytania z kategorii '+(quizData[key]||{}).name+'?')) return;
  await db.collection('quizCategories').doc(key).delete();
  quizData[key] = defaultQuizCategories[key] || {name:key,icon:'📝',questions:[]};
  renderQuizCategories();
  showToast('🗑 Pytania usunięte');
}

function openUploadQuiz() {
  var sel = document.getElementById('quiz-upload-cat');
  sel.innerHTML = Object.entries(quizData).map(function(e){ return '<option value="'+e[0]+'">'+e[1].name+'</option>'; }).join('');
  document.getElementById('quiz-upload-file').value = '';
  document.getElementById('quiz-upload-filename').textContent = '';
  document.getElementById('quiz-upload-file').onchange = function(){ document.getElementById('quiz-upload-filename').textContent = this.files[0]?this.files[0].name:''; };
  document.getElementById('quiz-upload-modal').classList.add('open');
}

async function doUploadQuiz() {
  var catKey = document.getElementById('quiz-upload-cat').value;
  var file = document.getElementById('quiz-upload-file').files[0];
  if (!file) { showToast('⚠️ Wybierz plik TXT'); return; }
  var text = await file.text();
  var questions = parseTxtQuestions(text);
  if (!questions.length) { showToast('⚠️ Nie znaleziono pytań w pliku'); return; }
  var cat = quizData[catKey] || defaultQuizCategories[catKey] || {name:catKey,icon:'📝'};
  await db.collection('quizCategories').doc(catKey).set({ name:cat.name, icon:cat.icon, questions:questions });
  quizData[catKey] = { name:cat.name, icon:cat.icon, questions:questions };
  document.getElementById('quiz-upload-modal').classList.remove('open');
  renderQuizCategories();
  showToast('✅ Załadowano '+questions.length+' pytań do '+cat.name);
}

async function uploadQuizTxt(event) {
  var file = event.target.files[0]; if (!file) return;
  var text = await file.text();
  var catKey = file.name.replace(/\.txt$/i,'').toLowerCase().replace(/\s+/g,'_');
  var questions = parseTxtQuestions(text);
  if (!questions.length) { showToast('⚠️ Nie znaleziono pytań'); return; }
  var catName = catKey.toUpperCase().replace(/_/g,' ');
  var icon = '📝';
  if (defaultQuizCategories[catKey]) { catName = defaultQuizCategories[catKey].name; icon = defaultQuizCategories[catKey].icon; }
  await db.collection('quizCategories').doc(catKey).set({ name:catName, icon:icon, questions:questions });
  quizData[catKey] = { name:catName, icon:icon, questions:questions };
  renderQuizCategories();
  showToast('✅ Załadowano '+questions.length+' pytań do '+catName);
  event.target.value = '';
}

function parseTxtQuestions(text) {
  var questions = [];
  var lines = text.split('\n').map(function(l){return l.trim();}).filter(function(l){return l;});
  var i = 0;
  while (i < lines.length) {
    var qMatch = lines[i].match(/^\d+[\.\)\t]\s*(.+)/);
    if (!qMatch) { i++; continue; }
    var qText = qMatch[1];
    var answers = [];
    var correct = 0;
    i++;
    while (i < lines.length) {
      var multiMatch = lines[i].match(/^\*?a[\.\)\t]\s*(.+?)\s+\*?b[\.\)\t]\s*(.+)$/i);
      if (multiMatch) {
        var bStarred = lines[i].match(/\s+\*b[\.\)]/i);
        answers.push(multiMatch[1].trim(), multiMatch[2].trim());
        if (bStarred) correct = 1;
        i++;
        break;
      }
      var aMatch = lines[i].match(/^(\*?)([a-d])[\.\)\t]\s*(.+)/i);
      if (!aMatch) break;
      if (aMatch[1] === '*') correct = answers.length;
      answers.push(aMatch[3].trim());
      i++;
    }
    if (answers.length >= 2) {
      questions.push({ q:qText, a:answers, c:correct });
    }
  }
  return questions;
}

function startQuiz(k) {
  var cat = quizData[k];
  if (!cat||!cat.questions||!cat.questions.length) { showToast('⚠️ Brak pytań'); return; }
  var pool = cat.questions.slice().sort(function(){return Math.random()-0.5;});
  var qs = pool.slice(0, Math.min(QUIZ_QUESTIONS_PER_TEST, pool.length));
  quizState = { catKey:k, catName:cat.name, questions:qs, current:0, score:0, total:qs.length, errors:[] };
  renderQuizQuestion();
}

function renderQuizQuestion() {
  var s = quizState, c = document.getElementById('quiz-container');
  if (s.current >= s.total) { finishQuiz(); return; }
  var q = s.questions[s.current];
  c.innerHTML = '<div class="quiz-progress"><div class="quiz-progress-bar"><div class="quiz-progress-fill" style="width:'+(s.current/s.total*100)+'%"></div></div><div class="quiz-progress-text">'+(s.current+1)+'/'+s.total+'</div></div>'+
    '<div class="quiz-question">'+q.q+'</div>'+
    '<div class="quiz-answers" id="quiz-answers">'+q.a.map(function(a,i){return '<button class="quiz-answer" onclick="answerQuiz('+i+')">'+a+'</button>';}).join('')+'</div>'+
    '<button class="btn-quit" onclick="quitQuiz()">✕ Przerwij egzamin</button>';
}

function answerQuiz(idx) {
  var s = quizState, q = s.questions[s.current];
  document.querySelectorAll('#quiz-answers .quiz-answer').forEach(function(btn,i){
    btn.classList.add('disabled');
    if(i===q.c) btn.classList.add('correct');
    if(i===idx&&idx!==q.c) btn.classList.add('wrong');
  });
  if(idx===q.c) s.score++;
  else s.errors.push({ q:q.q, given:q.a[idx]||'', correct:q.a[q.c]||'' });
  s.current++;
  setTimeout(renderQuizQuestion, 1200);
}

async function finishQuiz() {
  var s = quizState;
  var pct = Math.round((s.score/s.total)*100);
  var msg = pct>=80?'🎉 Świetny wynik!':pct>=50?'👍 Nieźle, powtórz materiał!':'📚 Musisz poćwiczyć!';
  await db.collection('quizResults').add({
    userId:currentUser.uid, userName:currentUser.displayName||currentUser.email,
    userEmail:currentUser.email, category:s.catKey, categoryName:s.catName,
    score:s.score, total:s.total, percent:pct, errors:s.errors, date:new Date().toISOString()
  });
  var errHtml = s.errors.length ? '<div style="margin-top:16px;text-align:left;"><div style="font-size:0.68rem;font-weight:700;color:var(--text-dim);margin-bottom:8px;">Błędy:</div>'+
    s.errors.map(function(e){return '<div style="background:var(--bg-input);border:1px solid var(--border);border-radius:8px;padding:8px 10px;margin-bottom:4px;font-size:0.72rem;"><div style="color:var(--white);font-weight:700;">'+e.q+'</div><div style="color:var(--danger);">Twoja: '+e.given+'</div><div style="color:#22c55e;">Poprawna: '+e.correct+'</div></div>';}).join('')+'</div>' : '';
  document.getElementById('quiz-container').innerHTML = '<div class="quiz-result"><div class="quiz-result-title">'+s.catName+'</div><div class="quiz-result-score">'+pct+'%</div><div class="quiz-result-text">'+s.score+'/'+s.total+' — '+msg+'</div>'+errHtml+'<button class="btn-primary" onclick="resetQuiz()" style="margin-top:16px;">🔄 Wróć</button></div>';
}

function quitQuiz() { if(confirm('Przerwać egzamin?')) resetQuiz(); }

function resetQuiz() {
  quizState = null;
  document.getElementById('quiz-container').innerHTML = '<div class="card-title">🧠 <span class="accent">Egzaminy</span></div><p style="font-size:0.76rem;color:var(--text-dim);margin-bottom:16px;">Wybierz kurs i sprawdź swoją wiedzę!</p><div id="quiz-categories"></div>';
  renderQuizCategories();
}

async function showQuizResults() {
  var c = document.getElementById('quiz-container');
  var snap = await db.collection('quizResults').orderBy('date','desc').limit(50).get();
  if (snap.empty) { c.innerHTML = '<div class="card-title">📊 <span class="accent">Wyniki</span></div><div class="empty-state"><h3>Brak wyników</h3></div><button class="btn-primary" onclick="resetQuiz()">🔄 Wróć</button>'; return; }
  var html = '<div class="card-title">📊 <span class="accent">Wyniki kursantów</span></div><div style="max-height:60vh;overflow-y:auto;">';
  snap.forEach(function(doc){
    var r = doc.data();
    var color = r.percent>=80?'#22c55e':r.percent>=50?'#f59e0b':'var(--danger)';
    html += '<div class="student-card" style="cursor:default;margin-bottom:6px;"><div class="student-info"><div class="student-name">'+r.userName+'</div><div class="student-email">'+r.categoryName+' · '+(r.date||'').substring(0,10)+'</div>';
    if (r.errors&&r.errors.length) html += '<div style="font-size:0.6rem;color:var(--danger);margin-top:2px;">Błędy: '+r.errors.map(function(e){return e.q.substring(0,40)+'...';}).join(', ')+'</div>';
    html += '</div><div style="font-size:1.1rem;font-weight:800;color:'+color+';">'+r.percent+'%</div></div>';
  });
  html += '</div><button class="btn-primary" onclick="resetQuiz()" style="margin-top:12px;">🔄 Wróć</button>';
  c.innerHTML = html;
}



// ─── Admin: load all users & change roles ───
async function loadAllUsers() {
  const snap = await db.collection('users').get();
  students = snap.docs.map(doc=>({uid:doc.id,...doc.data()}));
}

async function changeUserRole() {
  var email = document.getElementById('change-role-email').value.trim().toLowerCase();
  var newRole = document.getElementById('change-role-select').value;
  if (!email) { showToast('⚠️ Podaj email'); return; }
  var snap = await db.collection('users').where('email','==',email).get();
  if (snap.empty) { showToast('⚠️ Nie znaleziono użytkownika'); return; }
  await db.collection('users').doc(snap.docs[0].id).update({ role: newRole });
  document.getElementById('change-role-email').value = '';
  await loadAllUsers(); renderStudents();
  showToast('✅ Rola zmieniona na: ' + newRole);
}

// ─── Biblioteka ───
let libraryItems = [];
let unsubLibrary = null;

function listenLibrary() {
  if (unsubLibrary) unsubLibrary();
  unsubLibrary = db.collection('library').orderBy('title').onSnapshot(snap => {
    libraryItems = snap.docs.map(doc=>({id:doc.id,...doc.data()}));
    if (document.getElementById('panel-library').classList.contains('active')) renderLibrary();
  });
}

function renderLibrary() {
  var grid = document.getElementById('library-grid');
  var enabledLib = myEnabledQuizzes; // reuse enabledQuizzes for library access too
  if (!libraryItems.length) {
    grid.innerHTML = '<div class="empty-state"><span class="empty-icon">📚</span><h3>Brak materiałów</h3><p>Materiały pojawią się gdy admin je doda.</p></div>';
    return;
  }
  var isPrivileged = userRole==='admin'||userRole==='instructor';
  grid.innerHTML = libraryItems.map(item => {
    var unlocked = isPrivileged || (item.unlockedFor||[]).includes(currentUser.uid);
    return '<div class="library-item">' +
      '<div class="library-icon">📄</div>' +
      '<div class="library-info"><div class="library-title">' + item.title + '</div><div class="library-cat">' + (item.category||'') + '</div></div>' +
      (unlocked
        ? '<a href="' + item.url + '" target="_blank" class="library-btn">📥 Pobierz</a>'
        : '<div class="library-locked">🔒 Zablokowany</div>') +
      (isPrivileged ? ' <button class="btn-delete" onclick="deleteLibItem(\'' + item.id + '\')" style="margin-left:6px;">🗑</button>' : '') +
      '</div>';
  }).join('');
}

function openPdfModal() {
  ['pdf-title','pdf-category','pdf-url'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('pdf-modal').classList.add('open');
}
function closePdfModal(e) { if(e.target===document.getElementById('pdf-modal')) closePdfModalDirect(); }
function closePdfModalDirect() { document.getElementById('pdf-modal').classList.remove('open'); }

async function savePdf() {
  var title = document.getElementById('pdf-title').value.trim();
  var url = document.getElementById('pdf-url').value.trim();
  if (!title||!url) { showToast('⚠️ Podaj tytuł i link'); return; }
  await db.collection('library').add({
    title: title,
    category: document.getElementById('pdf-category').value.trim(),
    url: url,
    unlockedFor: []
  });
  closePdfModalDirect();
  showToast('✅ Materiał dodany!');
}

async function deleteLibItem(id) {
  if (!confirm('Usunąć ten materiał?')) return;
  await db.collection('library').doc(id).delete();
  showToast('🗑 Materiał usunięty');
}

// ─── Profil ───
let currentLang = 'pl';

async function openProfile() {
  var snap = await userDocRef.get();
  var d = snap.data() || {};
  document.getElementById('pf-role').value = userRole === 'instructor' ? (currentLang==='pl'?'Instruktor':'Instructor') : (currentLang==='pl'?'Kursant':'Student');
  document.getElementById('pf-name').value = d.name || '';
  document.getElementById('pf-email').value = d.email || '';
  document.getElementById('pf-phone').value = d.phone || '';
  document.getElementById('pf-certlevel').value = d.certLevel || '';
  document.getElementById('pf-street').value = d.street || '';
  document.getElementById('pf-city').value = d.city || '';
  document.getElementById('pf-country').value = d.country || '';
  document.getElementById('pf-lang').value = d.lang || currentLang;
  document.getElementById('pf-avatar').src = d.avatar || document.getElementById('user-avatar').src;
  document.getElementById('profile-modal').classList.add('open');
}
function closeProfileModal(e) { if (e.target === document.getElementById('profile-modal')) closeProfileModalDirect(); }
function closeProfileModalDirect() { document.getElementById('profile-modal').classList.remove('open'); }

async function saveProfile() {
  await userDocRef.update({
    name: document.getElementById('pf-name').value.trim(),
    phone: document.getElementById('pf-phone').value.trim(),
    certLevel: document.getElementById('pf-certlevel').value.trim(),
    street: document.getElementById('pf-street').value.trim(),
    city: document.getElementById('pf-city').value.trim(),
    country: document.getElementById('pf-country').value.trim(),
    lang: document.getElementById('pf-lang').value
  });
  closeProfileModalDirect();
  showToast(currentLang==='pl'?'✅ Profil zapisany!':'✅ Profile saved!');
}

// ─── Język / Language ───
const translations = {
  // Tabs
  '🎓 Certyfikaty':{ en:'🎓 Certificates' },
  '🧠 Quiz':{ en:'🧠 Quiz' },
  '📋 Loguj':{ en:'📋 Log Dive' },
  '🌊 Nurki':{ en:'🌊 My Dives' },
  '🛒 Sklep':{ en:'🛒 Shop' },
  '👥 Kursanci':{ en:'👥 Students' },
};

function switchLang(lang) {
  currentLang = lang;
  // Tabs
  document.querySelectorAll('.tab').forEach(t => {
    var pl = t.textContent.trim();
    if (lang === 'en' && translations[pl]) t.textContent = translations[pl].en;
    // Restore PL from data attribute
    if (!t.dataset.pl) t.dataset.pl = pl;
    if (lang === 'pl' && t.dataset.pl) t.textContent = t.dataset.pl;
  });
  // Profile labels
  var labels = {
    'lbl-pf-role':{pl:'Rola',en:'Role'},
    'lbl-pf-name':{pl:'Imię i nazwisko',en:'Full name'},
    'lbl-pf-phone':{pl:'Telefon',en:'Phone'},
    'lbl-pf-street':{pl:'Ulica',en:'Street'},
    'lbl-pf-city':{pl:'Miasto',en:'City'},
    'lbl-pf-country':{pl:'Kraj',en:'Country'},
    'lbl-pf-agency':{pl:'Agencja',en:'Agency'},
    'lbl-pf-certlevel':{pl:'Poziom certyfikatu',en:'Certification level'},
    'lbl-pf-lang':{pl:'Język / Language',en:'Language / Język'}
  };
  for (var id in labels) {
    var el = document.getElementById(id);
    if (el) el.textContent = labels[id][lang] || labels[id].pl;
  }
  // Role badge
  var badge = document.getElementById('role-badge');
  if (badge) {
    if (userRole==='instructor') badge.textContent = lang==='pl'?'🏅 Instruktor':'🏅 Instructor';
    else badge.textContent = lang==='pl'?'🎓 Kursant':'🎓 Student';
  }
}

// ─── Avatar ───
function uploadAvatar(event) {
  var file = event.target.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function(e) {
    var img = new Image();
    img.onload = function() {
      var canvas = document.createElement('canvas');
      var size = 120;
      canvas.width = size; canvas.height = size;
      var ctx = canvas.getContext('2d');
      var min = Math.min(img.width, img.height);
      var sx = (img.width - min) / 2, sy = (img.height - min) / 2;
      ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
      var base64 = canvas.toDataURL('image/jpeg', 0.7);
      userDocRef.update({ avatar: base64 }).then(function() {
        document.getElementById('user-avatar').src = base64;
        var pfAv = document.getElementById('pf-avatar');
        if (pfAv) pfAv.src = base64;
        showToast('✅ Avatar zaktualizowany!');
      });
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// ─── Toast ───
function showToast(msg) {
  const el=document.getElementById('toast');
  el.textContent=msg; el.classList.add('show');
  setTimeout(()=>el.classList.remove('show'),3000);
}
