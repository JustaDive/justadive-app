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
  if (forgotMode) {
    if (!email) { showToast('⚠️ Wpisz email'); return false; }
    auth.sendPasswordResetEmail(email).then(function() {
      showToast('✅ Link wysłany na ' + email);
      exitForgotMode();
    }).catch(function() {
      errEl.textContent = 'Nie znaleziono konta z tym emailem';
      errEl.style.display = 'block';
    });
    return false;
  }
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

function resetPassword() {
  var email = document.getElementById('f-email').value.trim();
  if (!email) { showToast('⚠️ Wpisz email powyżej'); return; }
  auth.sendPasswordResetEmail(email).then(function() {
    showToast('✅ Link do resetu hasła wysłany na ' + email);
  }).catch(function(e) {
    document.getElementById('login-error').textContent = 'Nie znaleziono konta z tym emailem';
    document.getElementById('login-error').style.display = 'block';
  });
}

let forgotMode = false;
function showForgotPassword() {
  forgotMode = true;
  document.getElementById('f-password').style.display = 'none';
  document.getElementById('btn-email-submit').textContent = 'Wyślij link resetujący';
  document.getElementById('btn-forgot').style.display = 'none';
  document.getElementById('f-email').placeholder = 'Podaj swój email';
  document.getElementById('f-email').focus();
}

function exitForgotMode() {
  forgotMode = false;
  document.getElementById('f-password').style.display = '';
  document.getElementById('btn-email-submit').textContent = isRegisterMode ? 'Utwórz konto' : 'Zaloguj się';
  document.getElementById('btn-forgot').style.display = '';
  document.getElementById('f-email').placeholder = 'Email';
}

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
    // Nowy użytkownik = kursant
    pendingNewUser = user;
    document.getElementById('login-screen').style.display = 'none';
    await chooseRole('student');
    return true;
  } else {
    const d = snap.data();
    // biuro@justadive.pl = admin
    const email = (user.email||'').toLowerCase();
    if ((email === 'biuro@justadive.pl' || email === 'damianbiniarz@gmail.com') && d.role !== 'admin') {
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
        var instrData = instrSnap.data();
        currentSchoolName = instrData.schoolName || '';
        currentSchoolLogo = instrData.schoolLogo || 'justadive';
      }
    }
    return true;
  }
}

async function chooseRole(role) {
  document.getElementById('role-modal').classList.remove('open');
  var user = pendingNewUser;
  pendingNewUser = null;
  // Wyślij email weryfikacyjny
  if (user.emailVerified === false) {
    user.sendEmailVerification().catch(function(){});
    showToast('📧 Email weryfikacyjny wysłany na ' + user.email);
  }
  userRole = role;
  myEnabledQuizzes = [];
  currentSchoolName = '';
  currentSchoolLogo = '';
  currentLang = 'pl';
  // Sprawdź zaproszenie
  var inviteCode = new URLSearchParams(window.location.search).get('invite');
  var instructorUid = '';
  var invFirstName = '', invLastName = '';
  if (inviteCode) {
    var invSnap = await db.collection('invites').doc(inviteCode).get();
    if (invSnap.exists) {
      instructorUid = invSnap.data().instructorUid || '';
      invFirstName = invSnap.data().firstName || '';
      invLastName = invSnap.data().lastName || '';
      await db.collection('invites').doc(inviteCode).delete();
    }
  }
  await userDocRef.set({
    email: user.email,
    name: (invFirstName + ' ' + invLastName).trim() || user.displayName || user.email,
    firstName: invFirstName, lastName: invLastName,
    role: role,
    enabledQuizzes: [],
    schoolName: '',
    schoolLogo: '',
    instructorUid: instructorUid,
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
  av.title = 'Kliknij aby otworzyć profil';
  av.onclick = openProfile;

  // Logo szkoły w headerze
  const brandLogo = document.getElementById('brand-logo');
  if (userRole === 'admin') {
    brandLogo.src = 'JustaDive/PSAI logo bez tła.png';
  } else if (currentSchoolLogo && currentSchoolLogo.startsWith('data:')) {
    brandLogo.src = currentSchoolLogo;
  } else if (currentSchoolLogo === 'justadive') {
    brandLogo.src = 'JustaDive/logotyp negatyw.png';
  } else if (currentSchoolLogo === 'dive-app') {
    brandLogo.src = 'austronaut_logo.jpg';
  } else {
    brandLogo.src = 'JustaDive/PSAI logo bez tła.png';
  }
  const badge = document.getElementById('role-badge');
  if (userRole==='admin') {
    badge.textContent='⚡ Admin'; badge.className='role-badge admin';
    document.getElementById('tabs-student').style.display='none';
    document.getElementById('tabs-instructor').style.display='none';
    document.getElementById('tabs-admin').style.display='flex';
    document.getElementById('btn-add-cert').style.display='';
    document.getElementById('admin-role-section').style.display='';
    loadAllUsers();
  } else if (userRole==='instructor') {
    badge.textContent='🏅 Instruktor'; badge.className='role-badge instructor';
    document.getElementById('tabs-student').style.display='none';
    document.getElementById('tabs-instructor').style.display='flex';
    document.getElementById('tabs-admin').style.display='none';
    document.getElementById('btn-add-cert').style.display='none';
    document.getElementById('admin-role-section').style.display='none';
    loadStudents();  } else {
    badge.textContent='🎓 Kursant'; badge.className='role-badge student';
    document.getElementById('tabs-student').style.display='flex';
    document.getElementById('tabs-instructor').style.display='none';
    document.getElementById('tabs-admin').style.display='none';
    document.getElementById('btn-add-cert').style.display='none';
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
  if (userRole === 'admin' || userRole === 'instructor') {
    // Certyfikaty ładowane po załadowaniu studentów
    setTimeout(function(){ loadCertsForView().then(function(){ renderCerts(); }); }, 500);
  } else {
    unsubCerts = certsCol.orderBy('date','desc').onSnapshot(snap => {
      certs = snap.docs.map(doc=>({id:doc.id,...doc.data()}));
      if (document.getElementById('panel-certs').classList.contains('active')) renderCerts();
    });
  }
  await loadQuizData();
  renderQuizCategories();
  listenLibrary();
  await loadShopUrl();
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
    'Certyfikaty':'certs','Kursy':'library',
    'Logbook':'log','Sklep':'shop','Kursanci':'manage'
  };
  document.querySelectorAll('.tab').forEach(t => {
    const n = names[t.textContent.trim()]; t.classList.toggle('active', n===tab);
  });
  document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
  document.getElementById('panel-'+tab).classList.add('active');
  if (tab==='log') renderDives();
  if (tab==='certs') renderCerts();
  if (tab==='manage') renderStudents();
  if (tab==='library') renderCourses();
  if (tab==='shop') renderShop();
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
let certsViewStudent = null;
let certSortAsc = true;

function renderCerts() {
  const grid = document.getElementById('certs-grid');
  const isPriv = userRole === 'admin' || userRole === 'instructor';

  // Kursant — widzi swoje certyfikaty
  if (!isPriv) {
    if (!certs.length) {
      grid.innerHTML = '<div class="empty-state"><span class="empty-icon">🎓</span><h3>Brak certyfikatów</h3><p>Twój instruktor doda Ci certyfikat.</p></div>';
      return;
    }
    grid.innerHTML = '<div class="certs-cards-grid">' + renderCertCards(certs) + '</div>';
    return;
  }

  // Admin/Instruktor — lista kursantów lub certyfikaty wybranego
  if (!certsViewStudent) {
    // Pokaż listę kursantów
    if (!students.length) {
      grid.innerHTML = '<div class="empty-state"><span class="empty-icon">🎓</span><h3>Brak kursantów</h3><p>Dodaj kursanta w zakładce Kursanci.</p></div>';
      return;
    }
    // Sortuj alfabetycznie
    var sorted = students.slice().sort(function(a,b){
      var na = ((a.firstName||'')+' '+(a.lastName||'')).trim() || a.name || a.email;
      var nb = ((b.firstName||'')+' '+(b.lastName||'')).trim() || b.name || b.email;
      return certSortAsc ? na.localeCompare(nb) : nb.localeCompare(na);
    });
    // Filtruj po wyszukiwaniu
    var searchVal = (document.getElementById('cert-search')||{}).value || '';
    if (searchVal) {
      var q = searchVal.toLowerCase();
      sorted = sorted.filter(function(s){
        var name = ((s.firstName||'')+' '+(s.lastName||'')+' '+s.email+' '+(s.name||'')).toLowerCase();
        return name.indexOf(q) >= 0;
      });
    }
    var html = '<div style="display:flex;gap:8px;margin-bottom:10px;align-items:center;"><input type="text" id="cert-search" class="search-input" placeholder="Szukaj kursanta..." oninput="renderCertsFiltered()" value="'+searchVal+'" style="flex:1;"><button class="library-btn" onclick="certSortAsc=!certSortAsc;renderCertsFiltered();">A-Z ↕</button></div>';
    html += '<div id="cert-student-list">' + sorted.map(function(s) {
      var name = ((s.firstName||'')+ ' '+(s.lastName||'')).trim() || s.name || s.email;
      var rc = s.role==='admin' ? 'rgba(255,180,0,0.12)' : s.role==='instructor' ? 'rgba(228,57,70,0.12)' : 'rgba(41,171,226,0.12)';
      var rb = s.role==='admin' ? 'rgba(255,180,0,0.4)' : s.role==='instructor' ? 'rgba(228,57,70,0.4)' : 'rgba(41,171,226,0.4)';
      return '<div class="student-card" style="background:'+rc+';border-color:'+rb+';" onclick="viewStudentCerts(\''+s.uid+'\')"><div class="student-info"><div class="student-name">'+name+'</div><div class="student-email">'+s.email+'</div></div><div style="color:var(--blue);font-size:0.8rem;">→</div></div>';
    }).join('') + '</div>';
    grid.innerHTML = html;
    return;
  }

  // Certyfikaty wybranego kursanta
  var studentCerts = certs.filter(function(c){ return c.studentUid === certsViewStudent || (!c.studentUid && certsViewStudent === currentUser.uid); });
  var studentData = students.find(function(s){ return s.uid === certsViewStudent; });
  var studentName = studentData ? (((studentData.firstName||'')+' '+(studentData.lastName||'')).trim() || studentData.name || studentData.email) : '';

  var html = '<div style="margin-bottom:12px;"><button class="library-btn" onclick="certsViewStudent=null;renderCerts();">← Wróć do listy</button> <span style="font-weight:700;margin-left:8px;">'+studentName+'</span></div>';
  if (!studentCerts.length) {
    html += '<div class="empty-state"><h3>Brak certyfikatów</h3></div>';
  } else {
    html += '<div class="certs-cards-grid">' + renderCertCards(studentCerts) + '</div>';
  }
  grid.innerHTML = html;
}

function viewStudentCerts(uid) {
  certsViewStudent = uid;
  renderCerts();
}

function renderCertsFiltered() {
  var searchVal = (document.getElementById('cert-search')||{}).value || '';
  var sorted = students.slice().sort(function(a,b){
    var na = ((a.firstName||'')+' '+(a.lastName||'')).trim() || a.name || a.email;
    var nb = ((b.firstName||'')+' '+(b.lastName||'')).trim() || b.name || b.email;
    return certSortAsc ? na.localeCompare(nb) : nb.localeCompare(na);
  });
  if (searchVal) {
    var q = searchVal.toLowerCase();
    sorted = sorted.filter(function(s){
      var name = ((s.firstName||'')+' '+(s.lastName||'')+' '+s.email+' '+(s.name||'')).toLowerCase();
      return name.indexOf(q) >= 0;
    });
  }
  var listEl = document.getElementById('cert-student-list');
  if (listEl) {
    listEl.innerHTML = sorted.map(function(s) {
      var name = ((s.firstName||'')+ ' '+(s.lastName||'')).trim() || s.name || s.email;
      var rc = s.role==='admin' ? 'rgba(255,180,0,0.12)' : s.role==='instructor' ? 'rgba(228,57,70,0.12)' : 'rgba(41,171,226,0.12)';
      var rb = s.role==='admin' ? 'rgba(255,180,0,0.4)' : s.role==='instructor' ? 'rgba(228,57,70,0.4)' : 'rgba(41,171,226,0.4)';
      return '<div class="student-card" style="background:'+rc+';border-color:'+rb+';" onclick="viewStudentCerts(\''+s.uid+'\')"><div class="student-info"><div class="student-name">'+name+'</div><div class="student-email">'+s.email+'</div></div><div style="color:var(--blue);font-size:0.8rem;">→</div></div>';
    }).join('');
  }
}

function renderCertCards(certsList) {
  return certsList.map(function(c) {
    var agency = (c.agency||'PSAI').toUpperCase();
    return '<div>'+
      '<div class="cert-card"><div class="cert-back">'+
        '<div class="cert-back-header">'+((c.level||'').toUpperCase().indexOf('PSAI')>=0 ? (c.level||'Certyfikat') : 'PSAI '+(c.level||'Certyfikat'))+'</div>'+
        '<div class="cert-back-body">'+
          '<div class="cert-back-row">'+
            '<img src="JustaDive/PSAI logo bez tła.png" alt="PSAI" class="cert-back-logo">'+
            '<div class="cert-back-name">'+(c.name||'—')+'</div>'+
            (c.photo?'<img src="'+c.photo+'" class="cert-back-photo">':'')+
          '</div>'+
          '<div class="cert-back-detail">'+
            (c.number?'Certification # '+c.number+'<br>':'')+
            (c.date?fmtDate(c.date)+'<br>':'')+
            (c.instructor?'Instructor: '+c.instructor+'<br>':'')+
          '</div>'+
          (c.notes?'<div class="cert-back-qual">'+c.notes+'</div>':'')+
        '</div>'+
        '<div class="cert-back-footer">PSA International</div>'+
        '<div class="cert-back-iso">ISO #9001 certified / www.psai.pl</div>'+
      '</div></div>'+
      (userRole==='admin'?'<div class="cert-actions"><button class="library-btn" onclick="editCert(\''+c.id+'\',\''+( c.studentUid||'')+'\')">✏️ Edytuj</button> <button class="btn-delete" onclick="deleteCert(\''+c.id+'\')">🗑 Usuń</button></div>':'')+
    '</div>';
  }).join('');
}

let allInstructors = [];

function openCertModal() {
  editingCertId = null; editingCertStudentUid = null;
  document.getElementById('cf-number').value = '';
  document.getElementById('cf-date').value = '';
  document.getElementById('cf-notes').value = '';
  // Wypełnij listę kursantów
  var sel = document.getElementById('cf-student');
  sel.innerHTML = students.map(function(s){
    var name = ((s.firstName||'')+' '+(s.lastName||'')).trim() || s.name || s.email;
    return '<option value="'+s.uid+'" data-fname="'+(s.firstName||'')+'" data-lname="'+(s.lastName||'')+'" data-name="'+(s.name||'')+'">'+name+' ('+s.email+')</option>';
  }).join('');
  fillCertStudent();
  // Wypełnij listę kursów
  var levelSel = document.getElementById('cf-level');
  levelSel.innerHTML = '<option value="">— Wybierz kurs —</option><option value="__other__">— Inny kurs (wpisz ręcznie) —</option>' + Object.values(quizData).map(function(c){ return '<option value="'+c.name+'">'+c.name+'</option>'; }).join('');
  levelSel.onchange = function(){ if(levelSel.value==='__other__'){ var v=prompt('Wpisz nazwę kursu:'); if(v){levelSel.innerHTML+='<option value="'+v+'" selected>'+v+'</option>';} else {levelSel.value='';} } };
  // Wypełnij listę instruktorów
  loadInstructorsForCert();
  document.getElementById('cert-modal').classList.add('open');
}

async function loadInstructorsForCert() {
  try {
  var snap = await db.collection('users').get();
  allInstructors = snap.docs.map(function(doc){ return {uid:doc.id, ...doc.data()}; }).filter(function(u){ return u.role==='instructor'||u.role==='admin'; });
  var sel = document.getElementById('cf-instructor-sel');
  sel.innerHTML = allInstructors.map(function(inst){
    var name = ((inst.firstName||'')+' '+(inst.lastName||'')).trim() || inst.name || inst.email;
    return '<option value="'+inst.uid+'" data-num="'+(inst.certNumber||'')+'">'+name+'</option>';
  }).join('') + '<option value="__other__">— Inny instruktor (wpisz ręcznie) —</option>';
  sel.onchange = onInstructorChange;
  onInstructorChange();
  } catch(e) { showToast('⚠️ Błąd: '+e.message); }
}

function onInstructorChange() {
  var sel = document.getElementById('cf-instructor-sel');
  var numField = document.getElementById('cf-instructor-num');
  if (sel.value === '__other__') {
    numField.value = '';
    numField.placeholder = 'Imię Nazwisko #numer';
  } else {
    var opt = sel.options[sel.selectedIndex];
    numField.value = opt ? opt.dataset.num || '' : '';
    numField.placeholder = '';
  }
}

function fillCertStudent() {
  var sel = document.getElementById('cf-student');
  var opt = sel.options[sel.selectedIndex];
  if (opt) {
    var fname = opt.dataset.fname || '';
    var lname = opt.dataset.lname || '';
    if (!fname && !lname && opt.dataset.name && !opt.dataset.name.includes('@')) {
      var parts = opt.dataset.name.split(' ');
      fname = parts[0] || '';
      lname = parts.slice(1).join(' ') || '';
    }
    document.getElementById('cf-fname').value = fname;
    document.getElementById('cf-lname').value = lname;
  }
}

function closeCertModal(e){if(e.target===document.getElementById('cert-modal'))closeCertModalDirect();}
function closeCertModalDirect(){document.getElementById('cert-modal').classList.remove('open');}

async function saveCert() {
  var level = document.getElementById('cf-level').value;
  if (!level){showToast('⚠️ Wybierz kurs');return;}
  var studentUid = document.getElementById('cf-student').value;
  if (!studentUid){showToast('⚠️ Wybierz kursanta');return;}
  var instSel = document.getElementById('cf-instructor-sel');
  var instOpt = instSel.options[instSel.selectedIndex];
  var instNum = document.getElementById('cf-instructor-num').value.trim();
  var instName;
  if (instSel.value === '__other__') {
    instName = instNum;
    instNum = '';
  } else if (instSel.value && instSel.value !== '') {
    instName = instOpt ? instOpt.textContent : '';
  } else {
    instName = '';
  }
  var instructorField = instName ? instName + (instNum ? ' #'+instNum : '') : '';
  // Pobierz zdjęcie kursanta z profilu
  var studentSnap = await db.collection('users').doc(studentUid).get();
  var studentData = studentSnap.data() || {};
  var photo = studentData.avatar || '';
  var certData = {
    agency: 'PSAI',
    level: level,
    number: document.getElementById('cf-number').value.trim(),
    date: document.getElementById('cf-date').value,
    name: (document.getElementById('cf-fname').value + ' ' + document.getElementById('cf-lname').value).trim(),
    instructor: instructorField,
    notes: document.getElementById('cf-notes').value.trim(),
    photo: photo,
    studentUid: studentUid
  };
  if (editingCertId) {
    // Edycja
    var ref = editingCertStudentUid ? db.collection('users').doc(editingCertStudentUid).collection('certs').doc(editingCertId) : certsCol.doc(editingCertId);
    await ref.update(certData);
    editingCertId = null; editingCertStudentUid = null;
    closeCertModalDirect(); showToast('✅ Certyfikat zaktualizowany!');
  } else {
    // Nowy
    await db.collection('users').doc(studentUid).collection('certs').add(certData);
    closeCertModalDirect(); showToast('✅ Certyfikat dodany!');
  }
  // Odśwież listę certyfikatów
  certsViewStudent = studentUid;
  await loadCertsForView();
  renderCerts();
}

async function loadCertsForView() {
  if (userRole === 'admin' || userRole === 'instructor') {
    certs = [];
    for (var s of students) {
      var sSnap = await db.collection('users').doc(s.uid).collection('certs').get();
      sSnap.forEach(function(doc) { certs.push({id:doc.id, studentUid:s.uid, ...doc.data()}); });
    }
    // Własne certyfikaty
    var mySnap = await certsCol.get();
    mySnap.forEach(function(doc) { certs.push({id:doc.id, ...doc.data()}); });
  }
}

let editingCertId = null, editingCertStudentUid = null;
async function editCert(id, studentUid) {
  editingCertId = id;
  editingCertStudentUid = studentUid;
  var certRef = studentUid ? db.collection('users').doc(studentUid).collection('certs').doc(id) : certsCol.doc(id);
  var snap = await certRef.get();
  var c = snap.data() || {};
  document.getElementById('cf-number').value = c.number || '';
  document.getElementById('cf-date').value = c.date || '';
  document.getElementById('cf-notes').value = c.notes || '';
  document.getElementById('cf-fname').value = (c.name||'').split(' ')[0] || '';
  document.getElementById('cf-lname').value = (c.name||'').split(' ').slice(1).join(' ') || '';
  // Otwórz modal
  var sel = document.getElementById('cf-student');
  sel.innerHTML = '<option value="'+(studentUid||'')+'">'+( c.name||'')+'</option>';
  var levelSel = document.getElementById('cf-level');
  levelSel.innerHTML = '<option value="">— Wybierz kurs —</option><option value="__other__">— Inny kurs (wpisz ręcznie) —</option>' + Object.values(quizData).map(function(cat){ return '<option value="'+cat.name+'"'+(cat.name===c.level?' selected':'')+'>'+cat.name+'</option>'; }).join('');
  if (c.level && !Object.values(quizData).some(function(cat){return cat.name===c.level;})) {
    levelSel.innerHTML += '<option value="'+c.level+'" selected>'+c.level+'</option>';
  }
  levelSel.onchange = function(){ if(levelSel.value==='__other__'){ var v=prompt('Wpisz nazwę kursu:'); if(v){levelSel.innerHTML+='<option value="'+v+'" selected>'+v+'</option>';} else {levelSel.value='';} } };
  await loadInstructorsForCert();
  // Ustaw instruktora z certyfikatu
  var instSel = document.getElementById('cf-instructor-sel');
  var instNumField = document.getElementById('cf-instructor-num');
  if (c.instructor) {
    // Spróbuj dopasować do instruktora z listy
    var matched = false;
    for (var i=0; i<instSel.options.length; i++) {
      if (instSel.options[i].value !== '__other__' && c.instructor.indexOf(instSel.options[i].textContent)>=0) {
        instSel.selectedIndex = i;
        // Wyciągnij sam numer
        var numMatch = c.instructor.match(/#(.+)/);
        instNumField.value = numMatch ? numMatch[1].trim() : '';
        matched = true;
        break;
      }
    }
    if (!matched) {
      instSel.value = '__other__';
      instNumField.value = c.instructor;
    }
  } else {
    instNumField.value = '';
  }
  document.getElementById('cert-modal').classList.add('open');
}

async function deleteCert(id) {
  if(!confirm('Usunąć ten certyfikat?'))return;
  var cert = certs.find(function(c){ return c.id === id; });
  if (cert && cert.ref) {
    await cert.ref.delete();
  } else if (cert && cert.studentUid) {
    await db.collection('users').doc(cert.studentUid).collection('certs').doc(id).delete();
  } else {
    await certsCol.doc(id).delete();
  }
  // Usuń z lokalnej listy i odśwież
  certs = certs.filter(function(c){ return c.id !== id; });
  renderCerts();
  showToast('🗑 Certyfikat usunięty');
}

// ─── Instructor: students ───
async function loadStudents() {
  const snap = await db.collection('users').where('instructorUid','==',currentUser.uid).get();
  students = snap.docs.map(doc=>({uid:doc.id,...doc.data()}));
}
async function inviteStudent() {
  var email = document.getElementById('add-student-email').value.trim();
  var fname = document.getElementById('add-student-fname').value.trim();
  var lname = document.getElementById('add-student-lname').value.trim();
  if (!email) { showToast('⚠️ Podaj email kursanta'); return; }
  var snap = await db.collection('users').where('email','==',email).get();
  if (!snap.empty) {
    // Już istnieje — przypisz + zaktualizuj imię jeśli podane
    var updates = { instructorUid: currentUser.uid };
    if (fname) updates.firstName = fname;
    if (lname) updates.lastName = lname;
    if (fname || lname) updates.name = (fname + ' ' + lname).trim();
    await db.collection('users').doc(snap.docs[0].id).update(updates);
    document.getElementById('add-student-email').value = '';
    document.getElementById('add-student-fname').value = '';
    document.getElementById('add-student-lname').value = '';
    await loadStudents(); renderStudents();
    showToast('✅ Kursant przypisany!');
    return;
  }
  var inviteCode = Math.random().toString(36).substring(2, 10);
  await db.collection('invites').doc(inviteCode).set({
    email: email, firstName: fname, lastName: lname,
    instructorUid: currentUser.uid, createdAt: new Date().toISOString()
  });
  var link = window.location.origin + window.location.pathname + '?invite=' + inviteCode;
  document.getElementById('invite-link-url').value = link;
  document.getElementById('invite-link-box').style.display = 'block';
  showToast('✅ Link zaproszenia wygenerowany');
}
function copyInviteLink() {
  var input = document.getElementById('invite-link-url');
  input.select(); document.execCommand('copy');
  showToast('📋 Link skopiowany!');
}
function renderStudents() {
  const el = document.getElementById('students-list');
  if (!students.length){el.innerHTML='<div class="empty-state"><span class="empty-icon">👥</span><h3>Brak kursantów</h3><p>Dodaj kursanta po emailu.</p></div>';return;}
  el.innerHTML = students.map(s=>{
    const en=(s.enabledQuizzes||[]).length, tot=Object.keys(quizData).length;
    const fullName = ((s.firstName||'') + ' ' + (s.lastName||'')).trim() || s.name || '';
    var roleColor = s.role==='admin' ? 'rgba(255,180,0,0.12)' : s.role==='instructor' ? 'rgba(228,57,70,0.12)' : 'rgba(41,171,226,0.12)';
    var roleBorder = s.role==='admin' ? 'rgba(255,180,0,0.4)' : s.role==='instructor' ? 'rgba(228,57,70,0.4)' : 'rgba(41,171,226,0.4)';
    var roleLabel = s.role==='admin' ? 'Admin' : s.role==='instructor' ? 'Instruktor' : 'Kursant';
    return '<div class="student-card" style="background:'+roleColor+';border-color:'+roleBorder+';" onclick="openStudentModal(\''+s.uid+'\')"><div class="student-info"><div class="student-name">'+fullName+'</div><div class="student-email">'+s.email+' · <strong>'+roleLabel+'</strong></div></div><div style="display:flex;gap:6px;align-items:center;"><div class="student-quizzes">'+en+'/'+tot+' egz.</div>'+(userRole==='admin'?'<button class="btn-delete" onclick="event.stopPropagation();deleteUser(\''+s.uid+'\',\''+s.email+'\')" style="padding:4px 8px;font-size:0.6rem;">🗑</button>':'')+'</div></div>';
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
  var html = '';
  // Przyciski funkcyjne — kafelki jak testy
  if (isAdmin || isPriv || userRole === 'student') {
    if (isAdmin) {
      html += '<div class="quiz-cat quiz-cat-action" onclick="addQuizCategory()" style="cursor:pointer;"><div class="quiz-cat-name">Dodaj kategorię</div></div>';
      html += '<div class="quiz-cat quiz-cat-action" onclick="openUploadQuiz()" style="cursor:pointer;"><div class="quiz-cat-name">Załaduj pytania</div></div>';
      html += '<div class="quiz-cat quiz-cat-action" onclick="downloadQuizTxt()" style="cursor:pointer;"><div class="quiz-cat-name">Pobierz pytania</div></div>';
    }
    if (isPriv) {
      html += '<div class="quiz-cat quiz-cat-action" onclick="showQuizResults()" style="cursor:pointer;"><div class="quiz-cat-name">Wyniki kursantów</div></div>';
    }
    if (userRole === 'student') {
      html += '<div class="quiz-cat quiz-cat-action" onclick="showMyResults()" style="cursor:pointer;"><div class="quiz-cat-name">Moje wyniki</div></div>';
    }
  }
  // Lista egzaminów — bez ikon
  html += Object.entries(quizData).map(function(entry){
    var k=entry[0], cat=entry[1];
    var ok = isPriv || (myEnabledQuizzes||[]).includes(k);
    var cnt = (cat.questions||[]).length;
    return '<div class="quiz-cat '+(ok&&cnt?'':'disabled')+'" '+(ok&&cnt?'onclick="startQuiz(\''+k+'\')"':'')+'>'+
      '<div class="quiz-cat-name">'+cat.name+'</div>'+
      '<div style="font-size:0.55rem;color:var(--text-muted);margin-top:2px;">'+cnt+' pytań</div>'+
      (ok?'':'<div class="quiz-locked">🔒</div>')+
      (isAdmin&&cnt?'<div style="font-size:0.5rem;color:var(--text-muted);margin-top:2px;cursor:pointer;" onclick="event.stopPropagation();deleteQuizCategory(\''+k+'\')">🗑 usuń</div>':'')+
      '</div>';
  }).join('');
  el.innerHTML = html;
}

async function addQuizCategory() {
  var name = prompt('Nazwa nowej kategorii szkolenia:');
  if (!name) return;
  var key = name.toLowerCase().replace(/\s+/g,'_').replace(/[^a-z0-9_]/g,'');
  if (!key) { showToast('⚠️ Nieprawidłowa nazwa'); return; }
  await db.collection('quizCategories').doc(key).set({ name:name, icon:'📝', questions:[] });
  quizData[key] = { name:name, icon:'📝', questions:[] };
  renderQuizCategories();
  showToast('✅ Kategoria "'+name+'" dodana!');
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

function downloadQuizTxt() {
  var catKey = prompt('Podaj klucz kategorii (np. owsd):');
  if (!catKey || !quizData[catKey]) { showToast('⚠️ Nie znaleziono kategorii'); return; }
  var cat = quizData[catKey];
  var letters = ['a','b','c','d'];
  var txt = cat.name + '\n\n';
  (cat.questions||[]).forEach(function(q, i){
    txt += (i+1) + '. ' + q.q + '\n';
    q.a.forEach(function(a, j){
      txt += (j===q.c?'*':'') + letters[j] + '. ' + a + '\n';
    });
    txt += '\n';
  });
  var blob = new Blob([txt], {type:'text/plain'});
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = catKey + '.txt';
  a.click();
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

var quizTimer = null;
var quizTimeLeft = 0;

function startQuiz(k) {
  var cat = quizData[k];
  if (!cat||!cat.questions||!cat.questions.length) { showToast('⚠️ Brak pytań'); return; }
  var pool = cat.questions.slice().sort(function(){return Math.random()-0.5;});
  var qs = pool.slice(0, Math.min(QUIZ_QUESTIONS_PER_TEST, pool.length));
  quizState = { catKey:k, catName:cat.name, questions:qs, current:0, score:0, total:qs.length, errors:[] };
  // Timer 60 minut
  quizTimeLeft = 60 * 60;
  if (quizTimer) clearInterval(quizTimer);
  quizTimer = setInterval(function(){
    quizTimeLeft--;
    var el = document.getElementById('quiz-timer');
    if (el) {
      var m = Math.floor(quizTimeLeft/60);
      var s = quizTimeLeft%60;
      el.textContent = m+':'+(s<10?'0':'')+s;
      if (quizTimeLeft <= 300) el.style.color = 'var(--danger)';
    }
    if (quizTimeLeft <= 0) {
      clearInterval(quizTimer); quizTimer = null;
      showToast('⏰ Czas minął!');
      finishQuiz();
    }
  }, 1000);
  renderQuizQuestion();
}

function renderQuizQuestion() {
  var s = quizState, c = document.getElementById('quiz-container');
  if (s.current >= s.total) { finishQuiz(); return; }
  var q = s.questions[s.current];
  var m=Math.floor(quizTimeLeft/60), sec=quizTimeLeft%60;
  c.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;"><div class="quiz-progress" style="flex:1;margin-bottom:0;"><div class="quiz-progress-bar"><div class="quiz-progress-fill" style="width:'+(s.current/s.total*100)+'%"></div></div><div class="quiz-progress-text">'+(s.current+1)+'/'+s.total+'</div></div><div id="quiz-timer" style="font-size:0.82rem;font-weight:800;color:var(--blue);margin-left:12px;">'+m+':'+(sec<10?'0':'')+sec+'</div></div>'+
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
  if (quizTimer) { clearInterval(quizTimer); quizTimer = null; }
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

function quitQuiz() { if(confirm('Przerwać egzamin?')){ if(quizTimer){clearInterval(quizTimer);quizTimer=null;} resetQuiz(); } }

function resetQuiz() {
  quizState = null;
  document.getElementById('quiz-container').innerHTML = '<div class="card-title">🧠 <span class="accent">Egzaminy</span></div><p style="font-size:0.76rem;color:var(--text-dim);margin-bottom:16px;">Wybierz kurs i sprawdź swoją wiedzę!</p><div id="quiz-categories"></div>';
  renderQuizCategories();
}

async function showMyResults() {
  var c = document.getElementById('quiz-container');
  var snap = await db.collection('quizResults').where('userId','==',currentUser.uid).limit(20).get();
  if (snap.empty) { c.innerHTML = '<div class="card-title">📊 <span class="accent">Moje wyniki</span></div><div class="empty-state"><h3>Brak wyników</h3><p>Rozwiąż egzamin żeby zobaczyć wyniki.</p></div><button class="btn-primary" onclick="resetQuiz()">🔄 Wróć</button>'; return; }
  var results = [];
  snap.forEach(function(doc){ results.push(doc.data()); });
  window._myResults = results;
  var html = '<div class="card-title">📊 <span class="accent">Moje wyniki</span></div><button class="library-btn" onclick="resetQuiz()" style="margin-bottom:12px;">← Egzaminy</button><div style="max-height:60vh;overflow-y:auto;">';
  results.forEach(function(r, idx){
    var color = r.percent>=80?'#22c55e':r.percent>=50?'#f59e0b':'var(--danger)';
    html += '<div class="student-card" style="cursor:pointer;margin-bottom:6px;" onclick="showMyResultDetail('+idx+')"><div class="student-info"><div class="student-name">'+r.categoryName+'</div><div class="student-email">'+(r.date||'').substring(0,10)+' · '+r.score+'/'+r.total+'</div>';
    if (r.errors&&r.errors.length) html += '<div style="font-size:0.6rem;color:var(--danger);margin-top:2px;">'+r.errors.length+' błędów</div>';
    html += '</div><div style="font-size:1.1rem;font-weight:800;color:'+color+';">'+r.percent+'%</div></div>';
  });
  html += '</div>';
  c.innerHTML = html;
}

function showMyResultDetail(idx) {
  var r = window._myResults[idx];
  if (!r) return;
  var c = document.getElementById('quiz-container');
  var color = r.percent>=80?'#22c55e':r.percent>=50?'#f59e0b':'var(--danger)';
  var html = '<div style="margin-bottom:12px;"><button class="library-btn" onclick="showMyResults()">← Wróć do wyników</button></div>';
  html += '<div style="text-align:center;margin-bottom:16px;">';
  html += '<div style="font-size:0.72rem;color:var(--text-dim);">'+r.categoryName+' · '+(r.date||'').substring(0,10)+'</div>';
  html += '<div style="font-size:2rem;font-weight:900;color:'+color+';margin-top:4px;">'+r.percent+'%</div>';
  html += '<div style="font-size:0.78rem;color:var(--text-dim);">'+r.score+'/'+r.total+' poprawnych</div></div>';
  if (r.errors && r.errors.length) {
    html += '<div style="font-size:0.72rem;font-weight:700;color:var(--danger);margin-bottom:8px;">Błędy ('+r.errors.length+'):</div>';
    r.errors.forEach(function(e){
      html += '<div style="background:var(--bg-input);border:1px solid var(--border);border-radius:8px;padding:10px;margin-bottom:6px;font-size:0.75rem;">';
      html += '<div style="color:var(--white);font-weight:700;margin-bottom:4px;">'+e.q+'</div>';
      html += '<div style="color:var(--danger);">✗ '+e.given+'</div>';
      html += '<div style="color:#22c55e;">✓ '+e.correct+'</div>';
      html += '</div>';
    });
  } else {
    html += '<div style="text-align:center;color:#22c55e;font-weight:700;">Brak błędów!</div>';
  }
  c.innerHTML = html;
}

async function showQuizResults() {
  var c = document.getElementById('quiz-container');
  var snap = await db.collection('quizResults').orderBy('date','desc').limit(50).get();
  if (snap.empty) {
    // Spróbuj bez orderBy (może brak indexu)
    snap = await db.collection('quizResults').limit(50).get();
  }
  if (snap.empty) { c.innerHTML = '<div class="card-title">📊 <span class="accent">Wyniki</span></div><div class="empty-state"><h3>Brak wyników</h3></div><button class="btn-primary" onclick="resetQuiz()">🔄 Wróć</button>'; return; }
  var results = [];
  snap.forEach(function(doc){ results.push({id:doc.id, ...doc.data()}); });
  window._quizResults = results;
  var html = '<div class="card-title">📊 <span class="accent">Wyniki kursantów</span></div><button class="library-btn" onclick="resetQuiz()" style="margin-bottom:12px;">← Egzaminy</button><div style="max-height:60vh;overflow-y:auto;">';
  results.forEach(function(r, idx){
    var color = r.percent>=80?'#22c55e':r.percent>=50?'#f59e0b':'var(--danger)';
    html += '<div class="student-card" style="cursor:pointer;margin-bottom:6px;" onclick="showResultDetail('+idx+')"><div class="student-info"><div class="student-name">'+(r.userName||r.userEmail||'')+'</div><div class="student-email">'+r.categoryName+' · '+(r.date||'').substring(0,10)+'</div>';
    if (r.errors&&r.errors.length) html += '<div style="font-size:0.6rem;color:var(--danger);margin-top:2px;">'+r.errors.length+' błędów</div>';
    html += '</div><div style="font-size:1.1rem;font-weight:800;color:'+color+';">'+r.percent+'%</div></div>';
  });
  html += '</div><button class="btn-primary" onclick="resetQuiz()" style="margin-top:12px;">🔄 Wróć</button>';
  c.innerHTML = html;
}

function showResultDetail(idx) {
  var r = window._quizResults[idx];
  if (!r) return;
  var c = document.getElementById('quiz-container');
  var color = r.percent>=80?'#22c55e':r.percent>=50?'#f59e0b':'var(--danger)';
  var html = '<div style="margin-bottom:12px;"><button class="library-btn" onclick="showQuizResults()">← Wróć do listy</button></div>';
  html += '<div style="text-align:center;margin-bottom:16px;">';
  html += '<div style="font-size:0.72rem;color:var(--text-dim);">'+r.categoryName+' · '+(r.date||'').substring(0,10)+'</div>';
  html += '<div style="font-size:1.4rem;font-weight:900;">'+(r.userName||r.userEmail||'')+'</div>';
  html += '<div style="font-size:2rem;font-weight:900;color:'+color+';margin-top:4px;">'+r.percent+'%</div>';
  html += '<div style="font-size:0.78rem;color:var(--text-dim);">'+r.score+'/'+r.total+' poprawnych</div></div>';
  if (r.errors && r.errors.length) {
    html += '<div style="font-size:0.72rem;font-weight:700;color:var(--danger);margin-bottom:8px;">Błędy ('+r.errors.length+'):</div>';
    r.errors.forEach(function(e){
      html += '<div style="background:var(--bg-input);border:1px solid var(--border);border-radius:8px;padding:10px;margin-bottom:6px;font-size:0.75rem;">';
      html += '<div style="color:var(--white);font-weight:700;margin-bottom:4px;">'+e.q+'</div>';
      html += '<div style="color:var(--danger);">✗ '+e.given+'</div>';
      html += '<div style="color:#22c55e;">✓ '+e.correct+'</div>';
      html += '</div>';
    });
  } else {
    html += '<div style="text-align:center;color:#22c55e;font-weight:700;">Brak błędów!</div>';
  }
  var subject = encodeURIComponent('Wynik egzaminu: ' + r.categoryName + ' - ' + r.percent + '%');
  var body = encodeURIComponent('Czesc ' + (r.userName||'') + ',\n\nTwoj wynik egzaminu:\nKategoria: ' + r.categoryName + '\nWynik: ' + r.score + '/' + r.total + ' (' + r.percent + '%)\nData: ' + (r.date||'').substring(0,10) + (r.errors&&r.errors.length ? '\n\nBledy:\n' + r.errors.map(function(e){return '- ' + e.q + '\n  Twoja: ' + e.given + '\n  Poprawna: ' + e.correct;}).join('\n') : '') + '\n\nPozdrawiam');
  var mailto = 'mailto:' + encodeURIComponent(r.userEmail||'') + '?subject=' + subject + '&body=' + body;
  html += '<a href="'+mailto+'" class="btn-primary" style="display:block;text-align:center;margin-top:16px;text-decoration:none;">✉️ Wyślij wynik emailem</a>';
  c.innerHTML = html;
}



// ─── Admin: load all users & change roles ───
async function deleteUser(uid, email) {
  var user = students.find(function(s){ return s.uid === uid; });
  if (user && user.role === 'admin') {
    var code = prompt('Aby usunąć admina '+email+' wpisz USUN:');
    if (code !== 'USUN') { showToast('⚠️ Anulowano'); return; }
  } else {
    if (!confirm('Usunąć użytkownika '+email+'?')) return;
  }
  var certsSnap = await db.collection('users').doc(uid).collection('certs').get();
  certsSnap.forEach(function(doc){ doc.ref.delete(); });
  await db.collection('users').doc(uid).delete();
  students = students.filter(function(s){ return s.uid !== uid; });
  renderStudents();
  showToast('🗑 Użytkownik usunięty');
}

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

let courseViewKey = null;

function renderLibrary() { renderCourses(); }

function renderCourses() {
  var grid = document.getElementById('courses-grid');
  if (!grid) return;
  var isAdmin = userRole==='admin';
  var isPriv = userRole==='admin'||userRole==='instructor';

  if (!courseViewKey) {
    var searchVal = (document.getElementById('course-search')||{}).value || '';
    var courses = Object.entries(quizData).filter(function(e){ return e[1].name; });
    if (searchVal) {
      var q = searchVal.toLowerCase();
      courses = courses.filter(function(e){ return e[1].name.toLowerCase().indexOf(q)>=0; });
    }
    var html = '';
    if (isAdmin) { html += '<div id="course-requests" style="margin-bottom:10px;"></div>'; }
    html += courses.map(function(e){
      var k=e[0], cat=e[1];
      var unlocked = isAdmin || (myEnabledQuizzes||[]).includes(k);
      return '<div class="student-card" style="'+(unlocked?'':'opacity:0.6;cursor:default;')+'" '+(unlocked?'onclick="openCourse(\''+k+'\')"':'')+'>'+
        '<div class="student-info"><div class="student-name">'+cat.name+'</div>'+
        '<div class="student-email">'+(unlocked?'Odblokowany':'🔒 Zablokowany')+'</div></div>'+
        '<div style="display:flex;gap:6px;align-items:center;">'+
        (isPriv&&!unlocked?'<button class="library-btn" onclick="event.stopPropagation();requestCourse(\''+k+'\',\''+cat.name+'\')">Poproś</button>':'')+
        (isAdmin&&!unlocked?'<button class="library-btn" onclick="event.stopPropagation();unlockCourseForUser(\''+k+'\')">Odblokuj</button>':'')+
        (unlocked?'<div style="color:var(--blue);font-size:0.8rem;">→</div>':'')+
        '</div></div>';
    }).join('');
    grid.innerHTML = html;
    if (isAdmin) loadCourseRequests();
    return;
  }

  var cat = quizData[courseViewKey]||{};
  var courseItems = libraryItems.filter(function(item){ return item.courseKey===courseViewKey; });
  var html = '<div style="margin-bottom:12px;"><button class="library-btn" onclick="courseViewKey=null;renderCourses();">← Wróć do listy</button> <span style="font-weight:700;margin-left:8px;">'+cat.name+'</span></div>';
  html += '<div class="certs-cards-grid">';
  var docs=courseItems.filter(function(i){return i.type==='dokumenty';});
  html += '<div class="cert-card" style="padding:16px;cursor:pointer;" onclick="openCourseMaterial(\''+courseViewKey+'\',\'dokumenty\')"><div style="text-align:center;font-weight:700;font-size:0.78rem;">Dokumenty</div><div style="text-align:center;font-size:0.6rem;color:var(--text-dim);margin-top:4px;">'+docs.length+' plików</div></div>';
  var books=courseItems.filter(function(i){return i.type==='podręcznik';});
  html += '<div class="cert-card" style="padding:16px;cursor:pointer;" onclick="openCourseMaterial(\''+courseViewKey+'\',\'podręcznik\')"><div style="text-align:center;font-weight:700;font-size:0.78rem;">Podręcznik</div><div style="text-align:center;font-size:0.6rem;color:var(--text-dim);margin-top:4px;">'+books.length+' plików</div></div>';
  var pres=courseItems.filter(function(i){return i.type==='prezentacja';});
  html += '<div class="cert-card" style="padding:16px;cursor:pointer;" onclick="openCourseMaterial(\''+courseViewKey+'\',\'prezentacja\')"><div style="text-align:center;font-weight:700;font-size:0.78rem;">Prezentacja</div><div style="text-align:center;font-size:0.6rem;color:var(--text-dim);margin-top:4px;">'+pres.length+' plików</div></div>';
  var hasQ=(cat.questions||[]).length>0;
  html += '<div class="cert-card" style="padding:16px;cursor:pointer;" onclick="startCourseTest(\''+courseViewKey+'\')"><div style="text-align:center;font-weight:700;font-size:0.78rem;">Test</div><div style="text-align:center;font-size:0.6rem;color:var(--text-dim);margin-top:4px;">'+(hasQ?(cat.questions.length+' pytań'):'Brak pytań')+'</div></div>';
  html += '</div><div id="course-test-result" style="margin-top:12px;"></div>';
  if (isAdmin) html += '<button class="btn-add-cert" onclick="openPdfModalForCourse(\''+courseViewKey+'\')" style="margin-top:8px;width:100%;">+ Dodaj materiał</button>';
  grid.innerHTML = html;
  loadCourseTestResult(courseViewKey);
}

function openCourse(key){courseViewKey=key;renderCourses();}

function openCourseMaterial(courseKey,type){
  var items=libraryItems.filter(function(i){return i.courseKey===courseKey&&i.type===type;});
  var grid=document.getElementById('courses-grid');
  var cat=quizData[courseKey]||{};
  var isAdmin=userRole==='admin';
  var html='<div style="margin-bottom:12px;"><button class="library-btn" onclick="openCourse(\''+courseKey+'\')">← Wróć</button> <span style="font-weight:700;margin-left:8px;">'+cat.name+' — '+type+'</span></div>';
  if(!items.length){html+='<div class="empty-state"><h3>Brak materiałów</h3></div>';}
  else{items.forEach(function(item){
    html+='<div class="library-item"><div class="library-icon">📄</div><div class="library-info"><div class="library-title">'+item.title+'</div></div>';
    html+='<a href="'+item.url+'" target="_blank" class="library-btn">Otwórz</a>';
    if(type==='dokumenty')html+='<div style="font-size:0.55rem;color:var(--text-dim);margin-left:6px;">Odeślij po podpisaniu</div>';
    if(isAdmin)html+=' <button class="btn-delete" onclick="deleteLibItem(\''+item.id+'\')" style="margin-left:4px;">🗑</button>';
    html+='</div>';
  });}
  if(isAdmin)html+='<button class="btn-add-cert" onclick="openPdfModalForCourse(\''+courseKey+'\',\''+type+'\')" style="margin-top:8px;width:100%;">+ Dodaj</button>';
  grid.innerHTML=html;
}

function startCourseTest(key){startQuiz(key);}

async function loadCourseTestResult(key){
  var el=document.getElementById('course-test-result');if(!el)return;
  try{var snap=await db.collection('quizResults').where('userId','==',currentUser.uid).where('category','==',key).limit(5).get();
  if(snap.empty){el.innerHTML='<div style="font-size:0.72rem;color:var(--text-dim);">Brak wyników testu</div>';return;}
  var html='<div style="font-size:0.72rem;font-weight:700;color:var(--text-dim);margin-bottom:6px;">Wyniki testu:</div>';
  snap.forEach(function(doc){var r=doc.data();var color=r.percent>=80?'#22c55e':r.percent>=50?'#f59e0b':'var(--danger)';
    html+='<div style="display:flex;justify-content:space-between;padding:4px 0;font-size:0.72rem;"><span>'+(r.date||'').substring(0,10)+'</span><span style="font-weight:800;color:'+color+';">'+r.percent+'%</span></div>';});
  el.innerHTML=html;}catch(e){el.innerHTML='';}
}

async function requestCourse(key,name){
  await db.collection('courseRequests').add({courseKey:key,courseName:name,userId:currentUser.uid,userName:currentUser.displayName||currentUser.email,userEmail:currentUser.email,date:new Date().toISOString(),status:'pending'});
  showToast('✅ Prośba wysłana!');
}

async function loadCourseRequests(){
  var el=document.getElementById('course-requests');if(!el)return;
  var snap=await db.collection('courseRequests').where('status','==','pending').get();
  if(snap.empty){el.innerHTML='';return;}
  var html='<div style="font-size:0.68rem;font-weight:700;color:var(--text-dim);margin-bottom:4px;">Prośby o otwarcie:</div>';
  snap.forEach(function(doc){var r=doc.data();
    html+='<div class="library-item" style="margin-bottom:4px;background:rgba(255,180,0,0.08);"><div class="library-info"><div class="library-title">'+r.userName+'</div><div style="font-size:0.6rem;color:var(--text-dim);">'+r.courseName+'</div></div><button class="library-btn" onclick="approveCourseRequest(\''+doc.id+'\',\''+r.courseKey+'\',\''+r.userId+'\')">Odblokuj</button></div>';});
  el.innerHTML=html;
}

async function approveCourseRequest(reqId,courseKey,userId){
  await db.collection('users').doc(userId).update({enabledQuizzes:firebase.firestore.FieldValue.arrayUnion(courseKey)});
  await db.collection('courseRequests').doc(reqId).update({status:'approved'});
  loadCourseRequests();showToast('✅ Kurs odblokowany!');
}

async function unlockCourseForUser(courseKey){
  var html = '<div style="padding:20px;"><h3 style="margin-bottom:12px;">Odblokuj kurs dla:</h3><select id="unlock-user-sel" style="width:100%;margin-bottom:12px;">';
  students.forEach(function(s){
    var name = ((s.firstName||'')+' '+(s.lastName||'')).trim() || s.name || s.email;
    html += '<option value="'+s.uid+'">'+name+' ('+s.email+')</option>';
  });
  html += '</select><button class="btn-primary" onclick="doUnlockCourse(\''+courseKey+'\')">Odblokuj</button> <button class="library-btn" onclick="document.getElementById(\'unlock-modal\').classList.remove(\'open\')">Anuluj</button></div>';
  var modal = document.getElementById('unlock-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'unlock-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = '<div class="modal"></div>';
    document.body.appendChild(modal);
  }
  modal.querySelector('.modal').innerHTML = html;
  modal.classList.add('open');
}

async function doUnlockCourse(courseKey){
  var uid = document.getElementById('unlock-user-sel').value;
  if (!uid) return;
  await db.collection('users').doc(uid).update({enabledQuizzes:firebase.firestore.FieldValue.arrayUnion(courseKey)});
  document.getElementById('unlock-modal').classList.remove('open');
  showToast('✅ Kurs odblokowany!');
}

function openPdfModalForCourse(courseKey,type){
  document.getElementById('pdf-title').value='';
  document.getElementById('pdf-url').value='';
  document.getElementById('pdf-category').value=type||'Podręcznik';
  document.getElementById('pdf-modal').dataset.courseKey=courseKey;
  document.getElementById('pdf-modal').classList.add('open');
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
  var modal = document.getElementById('pdf-modal');
  await db.collection('library').add({
    title: title,
    category: document.getElementById('pdf-category').value.trim(),
    type: document.getElementById('pdf-category').value.trim().toLowerCase(),
    courseKey: modal.dataset.courseKey || '',
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

async function unlockLibItem(id) {
  var email = prompt('Podaj email kursanta któremu chcesz udostępnić:');
  if (!email) return;
  var snap = await db.collection('users').where('email','==',email.trim().toLowerCase()).get();
  if (snap.empty) { showToast('⚠️ Nie znaleziono kursanta'); return; }
  var uid = snap.docs[0].id;
  await db.collection('library').doc(id).update({
    unlockedFor: firebase.firestore.FieldValue.arrayUnion(uid)
  });
  showToast('✅ Materiał udostępniony!');
}

async function renameLibItem(id) {
  var newName = prompt('Nowa nazwa materiału:');
  if (!newName) return;
  await db.collection('library').doc(id).update({ title: newName.trim() });
  showToast('✅ Nazwa zmieniona');
}

// ─── Sklep ───
let currentShopUrl = 'https://justadive.pl/home/sklep/';

async function loadShopUrl() {
  // Kursant: pobierz URL sklepu od instruktora
  if (userRole === 'student') {
    var snap = await userDocRef.get();
    var d = snap.data() || {};
    if (d.instructorUid) {
      var instrSnap = await db.collection('users').doc(d.instructorUid).get();
      if (instrSnap.exists) {
        currentShopUrl = instrSnap.data().shopUrl || 'https://justadive.pl/home/sklep/';
      }
    }
  } else {
    var snap = await userDocRef.get();
    currentShopUrl = (snap.data()||{}).shopUrl || 'https://justadive.pl/home/sklep/';
  }
}

function renderShop() {
  var el = document.getElementById('shop-content');
  el.innerHTML = '<div style="margin-top:12px;"><a href="'+currentShopUrl+'" target="_blank" class="shop-go">Przejdź do sklepu</a></div>' +
    '<div class="shop-contact" style="margin-top:12px;">'+currentShopUrl+'</div>';
}

// ─── Profil ───
let currentLang = 'pl';

async function openProfile() {
  if (!userDocRef) { showToast('⚠️ Zaloguj się ponownie'); return; }
  try {
  var snap = await userDocRef.get();
  var d = snap.data() || {};
  document.getElementById('pf-role').value = userRole === 'admin' ? 'Admin' : userRole === 'instructor' ? 'Instruktor' : 'Kursant';
  document.getElementById('pf-fname').value = d.firstName || d.name || '';
  document.getElementById('pf-lname').value = d.lastName || '';
  document.getElementById('pf-email').value = d.email || '';
  document.getElementById('pf-phone').value = d.phone || '';
  var instNumSection = document.getElementById('pf-instnum-section');
  if (userRole === 'instructor' || userRole === 'admin') {
    instNumSection.style.display = '';
    document.getElementById('pf-instnum').value = d.certNumber || '';
  } else {
    instNumSection.style.display = 'none';
  }
  document.getElementById('pf-street').value = d.street || '';
  document.getElementById('pf-city').value = d.city || '';
  document.getElementById('pf-country').value = d.country || '';
  document.getElementById('pf-lang').value = d.lang || currentLang;
  document.getElementById('pf-avatar').src = d.avatar || document.getElementById('user-avatar').src;
  // Logo szkoły — tylko instruktor/admin
  var logoSection = document.getElementById('pf-logo-section');
  var shopSection = document.getElementById('pf-shop-section');
  if (userRole === 'instructor' || userRole === 'admin') {
    logoSection.style.display = '';
    shopSection.style.display = '';
    document.getElementById('pf-school-logo').src = d.schoolLogo || 'JustaDive/PSAI logo bez tła.png';
    document.getElementById('pf-shop-url').value = d.shopUrl || 'https://justadive.pl/home/sklep/';
  } else {
    logoSection.style.display = 'none';
    shopSection.style.display = 'none';
  }
  document.getElementById('profile-modal').classList.add('open');
  } catch(err) { showToast('⚠️ Błąd: ' + err.message); }
}
function closeProfileModal(e) { if (e.target === document.getElementById('profile-modal')) closeProfileModalDirect(); }
function closeProfileModalDirect() { document.getElementById('profile-modal').classList.remove('open'); }

async function saveProfile() {
  await userDocRef.update({
    firstName: document.getElementById('pf-fname').value.trim(),
    lastName: document.getElementById('pf-lname').value.trim(),
    name: document.getElementById('pf-fname').value.trim() + ' ' + document.getElementById('pf-lname').value.trim(),
    phone: document.getElementById('pf-phone').value.trim(),
    certNumber: document.getElementById('pf-instnum') ? document.getElementById('pf-instnum').value.trim() : '',
    shopUrl: document.getElementById('pf-shop-url') ? document.getElementById('pf-shop-url').value.trim() : '',
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

function uploadSchoolLogo(event) {
  var file = event.target.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function(e) {
    var img = new Image();
    img.onload = function() {
      var canvas = document.createElement('canvas');
      var size = 150;
      canvas.width = size; canvas.height = size;
      var ctx = canvas.getContext('2d');
      var scale = Math.min(size/img.width, size/img.height);
      var w = img.width*scale, h = img.height*scale;
      ctx.drawImage(img, (size-w)/2, (size-h)/2, w, h);
      var base64 = canvas.toDataURL('image/png', 0.9);
      userDocRef.update({ schoolLogo: base64 }).then(function() {
        document.getElementById('pf-school-logo').src = base64;
        document.getElementById('brand-logo').src = base64;
        showToast('✅ Logo zaktualizowane!');
      });
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function changePassword() {
  auth.sendPasswordResetEmail(currentUser.email).then(function() {
    showToast('✅ Link do zmiany hasła wysłany na ' + currentUser.email);
  }).catch(function() {
    showToast('⚠️ Nie udało się wysłać linku');
  });
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
