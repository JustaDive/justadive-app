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

document.getElementById('f-date').valueAsDate = new Date();

// ─── Quiz Data (placeholder — szwagier dostarczy pytania) ───
const quizData = {
  ow: { name:'Open Water Diver', icon:'🤿', questions:[
    {q:'Jaka jest najważniejsza zasada nurkowania?',a:['Nigdy nie wstrzymuj oddechu','Nurkuj jak najgłębiej','Nurkuj sam','Ignoruj dekompresję'],c:0},
    {q:'Co oznacza skrót BCD?',a:['Buoyancy Control Device','Basic Compression Diver','Bottom Current Detector','Breathing Control Device'],c:0},
    {q:'Jaki gaz oddychamy najczęściej podczas nurkowania rekreacyjnego?',a:['Czysty tlen','Nitrox 50%','Sprężone powietrze','Heliox'],c:2},
    {q:'Co się dzieje z objętością gazu gdy schodzimy głębiej?',a:['Zwiększa się','Nie zmienia się','Zmniejsza się','Zależy od temperatury'],c:2},
    {q:'Co to jest "safety stop"?',a:['Zatrzymanie na 5m na 3 min','Zatrzymanie na dnie','Zatrzymanie na powierzchni','Zatrzymanie na 15m'],c:0},
    {q:'Jaki jest maksymalny limit głębokości dla nurka OWD?',a:['12m','18m','30m','40m'],c:1},
    {q:'Co powoduje choroba dekompresyjna?',a:['Zbyt szybkie wynurzanie — pęcherzyki azotu','Zbyt wolne zanurzanie','Zimna woda','Zbyt dużo tlenu'],c:0},
    {q:'Jak wyrównujemy ciśnienie w uszach?',a:['Przełykanie lub manewr Valsalvy','Krzyczenie pod wodą','Szybkie wynurzanie','Nie trzeba wyrównywać'],c:0},
    {q:'Co to jest "buddy system"?',a:['Nurkowanie w parach','System nawigacji','Typ komputera nurkowego','Metoda dekompresji'],c:0},
    {q:'Jakie prawo opisuje zależność ciśnienia i objętości gazu?',a:['Prawo Dalton','Prawo Boyle-Mariotte','Prawo Henry','Prawo Archimedesa'],c:1}
  ]},
  aowd: { name:'Advanced OWD', icon:'🌊', questions:[
    {q:'Na jakiej głębokości ciśnienie wynosi 2 ATA?',a:['5m','10m','20m','30m'],c:1},
    {q:'Prawo Henry\'ego dotyczy:',a:['Rozpuszczalności gazów w cieczach','Pływalności','Objętości gazów','Temperatury'],c:0},
    {q:'Światło traci kolor czerwony na głębokości ok.:',a:['1m','5m','15m','30m'],c:1},
    {q:'Dźwięk pod wodą rozchodzi się:',a:['Wolniej niż w powietrzu','Tak samo','Szybciej niż w powietrzu','Nie rozchodzi się'],c:2},
    {q:'Ile wynosi ciśnienie na głębokości 30m?',a:['2 ATA','3 ATA','4 ATA','5 ATA'],c:2},
    {q:'Prawo Archimedesa opisuje:',a:['Ciśnienie gazów','Siłę wyporu','Rozpuszczalność gazów','Prędkość dźwięku'],c:1},
    {q:'Azot pod ciśnieniem może powodować:',a:['Narkozę azotową','Lepszy wzrok','Szybsze pływanie','Nic'],c:0},
    {q:'Jaka jest prędkość bezpiecznego wynurzania?',a:['3m/min','9-18m/min','30m/min','Jak najszybciej'],c:1}
  ]},
  rescue: { name:'Rescue Diver', icon:'🆘', questions:[
    {q:'Co robisz gdy skończy ci się powietrze?',a:['Sygnalizujesz buddy i dzielisz powietrze','Wynurzasz się jak najszybciej','Zdejmujesz sprzęt','Czekasz na dnie'],c:0},
    {q:'Objawy narkozy azotowej to:',a:['Euforia, dezorientacja, spowolnienie','Ból głowy','Zimno','Głód'],c:0},
    {q:'Po nurkowaniu nie powinno się latać samolotem przez:',a:['2 godziny','12-24 godziny','3 dni','Tydzień'],c:1},
    {q:'Sygnał "OK" pod wodą to:',a:['Kciuk w górę','Kółko z palców nad głową','Machanie ręką','Dwie ręce w górę'],c:1},
    {q:'Sygnał "coś nie tak" pod wodą to:',a:['Kciuk w dół','Płaska dłoń kołysana na boki','Pięść','Dwie ręce skrzyżowane'],c:1},
    {q:'Pierwsza pomoc przy chorobie dekompresyjnej:',a:['Tlen 100% i transport do komory hiperbarycznej','Zimny prysznic','Ponowne zanurzenie','Aspiryna'],c:0},
    {q:'Kiedy NIE powinieneś nurkować?',a:['Gdy jesteś przeziębiony lub po alkoholu','Gdy jest pochmurno','Gdy woda jest ciepła','Gdy jest weekend'],c:0},
    {q:'Plan nurkowania powinien zawierać:',a:['Tylko głębokość','Głębokość, czas, gaz, buddy, plan awaryjny','Tylko lokalizację','Tylko typ nurkowania'],c:1}
  ]},
  equipment: { name:'Sprzęt nurkowy', icon:'⚙️', questions:[
    {q:'Do czego służy automat oddechowy (regulator)?',a:['Redukuje ciśnienie powietrza z butli','Mierzy głębokość','Kontroluje pływalność','Oświetla drogę'],c:0},
    {q:'Co to jest octopus?',a:['Zapasowy automat oddechowy','Typ maski','Komputer nurkowy','Rodzaj płetw'],c:0},
    {q:'Butla nurkowa najczęściej ma pojemność:',a:['5 litrów','10-12 litrów','20 litrów','50 litrów'],c:1},
    {q:'Manometr (SPG) pokazuje:',a:['Głębokość','Ciśnienie w butli','Temperaturę wody','Czas nurkowania'],c:1},
    {q:'Pianka nurkowa chroni przed:',a:['Tylko zimnem','Zimnem i otarciami','Rekinami','Prądem morskim'],c:1},
    {q:'Komputer nurkowy monitoruje:',a:['Tylko głębokość','Głębokość, czas, limity dekompresji','Tylko czas','Temperaturę powietrza'],c:1},
    {q:'Jak często należy serwisować automat oddechowy?',a:['Co 5 lat','Co rok lub wg producenta','Nigdy','Tylko po awarii'],c:1},
    {q:'Do czego służy SMB (Surface Marker Buoy)?',a:['Sygnalizacja pozycji na powierzchni','Oświetlenie','Nawigacja podwodna','Kontrola pływalności'],c:0}
  ]},
  nitrox: { name:'Nitrox', icon:'🔬', questions:[
    {q:'Co to jest Nitrox?',a:['Mieszanka azotu i tlenu z wyższym % O2','Czysty tlen','Hel z tlenem','Sprężone powietrze'],c:0},
    {q:'Jaki jest typowy procent tlenu w EANx32?',a:['21%','32%','36%','40%'],c:1},
    {q:'Główna zaleta nurkowania na Nitrox to:',a:['Dłuższe czasy bezdekompresyjne','Większa głębokość','Tańszy gaz','Lepsza widoczność'],c:0},
    {q:'Jakie jest główne ryzyko przy nurkowaniu na Nitrox?',a:['Toksyczność tlenowa','Narkoza','Hipotermia','Brak ryzyka'],c:0},
    {q:'MOD dla EANx32 przy ppO2 1.4 to ok.:',a:['20m','33m','40m','56m'],c:1},
    {q:'Co oznacza skrót MOD?',a:['Maximum Operating Depth','Minimum Oxygen Dose','Mixed Oxygen Delivery','Maximum Oxygen Depth'],c:0},
    {q:'Przed nurkowaniem na Nitrox należy:',a:['Sprawdzić analizę gazu w butli','Nic specjalnego','Wypić kawę','Zanurkować najpierw na powietrzu'],c:0},
    {q:'ppO2 oznacza:',a:['Ciśnienie parcjalne tlenu','Procent tlenu','Ciśnienie w butli','Prędkość przepływu'],c:0}
  ]}
};

// ─── Auth ───
let isRegisterMode = false;
function signInGoogle() {
  auth.signInWithPopup(googleProvider).catch(e => {
    document.getElementById('login-error').textContent = e.message;
    document.getElementById('login-error').style.display = 'block';
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
    .catch(err => { errEl.textContent = err.message; errEl.style.display = 'block'; });
  return false;
}
function logOut() { auth.signOut(); }

auth.onAuthStateChanged(async user => {
  if (user) { currentUser = user; await loadUserProfile(user); showApp(user); }
  else hideApp();
});

async function loadUserProfile(user) {
  userDocRef = db.collection('users').doc(user.uid);
  const snap = await userDocRef.get();
  const email = (user.email||'').toLowerCase();
  const instructorEmails = ['szkuni@gmail.com','biuro@justadive.pl','damianbiniarz@gmail.com'];
  const isInstructor = instructorEmails.includes(email);

  if (!snap.exists) {
    const schoolData = getSchoolForEmail(email);
    await userDocRef.set({
      email: user.email,
      name: user.displayName || user.email,
      role: isInstructor ? 'instructor' : 'student',
      enabledQuizzes: [],
      schoolName: isInstructor ? schoolData.name : '',
      schoolLogo: isInstructor ? schoolData.logo : '',
      instructorUid: '',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    userRole = isInstructor ? 'instructor' : 'student';
    myEnabledQuizzes = [];
    currentSchoolName = isInstructor ? schoolData.name : '';
    currentSchoolLogo = isInstructor ? schoolData.logo : '';
  } else {
    const d = snap.data();
    if (isInstructor && d.role !== 'instructor') {
      const schoolData = getSchoolForEmail(email);
      await userDocRef.update({ role:'instructor', schoolName:schoolData.name, schoolLogo:schoolData.logo });
      d.role = 'instructor'; d.schoolName = schoolData.name; d.schoolLogo = schoolData.logo;
    }
    userRole = d.role || 'student';
    myEnabledQuizzes = d.enabledQuizzes || [];
    currentSchoolName = d.schoolName || '';
    currentSchoolLogo = d.schoolLogo || '';
    // Kursant: pobierz logo szkoły instruktora
    if (userRole === 'student' && d.instructorUid) {
      const instrSnap = await db.collection('users').doc(d.instructorUid).get();
      if (instrSnap.exists) {
        currentSchoolName = instrSnap.data().schoolName || '';
        currentSchoolLogo = instrSnap.data().schoolLogo || '';
      }
    }
  }
}

function getSchoolForEmail(email) {
  if (email === 'damianbiniarz@gmail.com') return { name:'Dive App', logo:'dive-app' };
  return { name:'Just a Dive', logo:'justadive' };
}

function showApp(user) {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app-header').style.display = '';
  document.getElementById('app-container').style.display = '';
  document.getElementById('user-menu').style.display = 'flex';
  const av = document.getElementById('user-avatar');
  av.src = user.photoURL||''; av.title = user.displayName||user.email||'';

  // Logo szkoły w headerze
  const brandLogo = document.getElementById('brand-logo');
  const brandName = document.getElementById('brand-name');
  const brandSub = document.getElementById('brand-sub');
  if (currentSchoolLogo === 'justadive') {
    brandLogo.src = 'JustaDive/logotyp negatyw.png';
    brandName.innerHTML = '<span class="just">Just</span> <span class="a">a</span> <span class="dive">dive</span>';
    brandSub.textContent = 'Twoja Szkoła Nurkowania';
  } else if (currentSchoolLogo === 'dive-app') {
    brandLogo.src = 'JustaDive/logotyp negatyw.png';
    brandName.textContent = 'Dive App';
    brandSub.textContent = 'Dive Logbook';
  } else if (currentSchoolLogo) {
    brandLogo.src = currentSchoolLogo;
    brandName.textContent = currentSchoolName || 'Szkoła Nurkowa';
    brandSub.textContent = '';
  }  const badge = document.getElementById('role-badge');
  if (userRole==='instructor') {
    badge.textContent='🏅 Instruktor'; badge.className='role-badge instructor';
    document.getElementById('tabs-student').style.display='none';
    document.getElementById('tabs-instructor').style.display='flex';
    document.getElementById('btn-add-cert').style.display='';
    loadStudents();
  } else {
    badge.textContent='🎓 Kursant'; badge.className='role-badge student';
    document.getElementById('tabs-student').style.display='flex';
    document.getElementById('tabs-instructor').style.display='none';
    document.getElementById('btn-add-cert').style.display='none';
  }
  divesCol = userDocRef.collection('dives');
  certsCol = userDocRef.collection('certs');
  if (unsubDives) unsubDives();
  unsubDives = divesCol.orderBy('createdAt','desc').onSnapshot(snap => {
    dives = snap.docs.map(doc=>({id:doc.id,...doc.data()}));
    dives.forEach((d,i)=>d.num=dives.length-i);
    updateStats();
    if (document.getElementById('panel-history').classList.contains('active')) renderDives();
  });
  if (unsubCerts) unsubCerts();
  unsubCerts = certsCol.orderBy('date','desc').onSnapshot(snap => {
    certs = snap.docs.map(doc=>({id:doc.id,...doc.data()}));
    if (document.getElementById('panel-certs').classList.contains('active')) renderCerts();
  });
  renderQuizCategories();
  switchTab('certs');

  // Dodaj demo certyfikat jeśli brak
  certsCol.get().then(snap => {
    if (snap.empty) {
      certsCol.add({
        agency:'PSAI', level:'Open Water Diver',
        number:'OW-12345', date:'2026-04-20',
        name:'Damian Biniarz',
        instructor:'Piotr Urbański #I-3095',
        photo:''
      });
    }
  });
}

function hideApp() {
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('app-header').style.display = 'none';
  document.getElementById('app-container').style.display = 'none';
  if (unsubDives){unsubDives();unsubDives=null;}
  if (unsubCerts){unsubCerts();unsubCerts=null;}
  currentUser=null; dives=[]; certs=[]; students=[];
}

// ─── Tabs ───
function switchTab(tab) {
  const names = {
    '📋 Loguj':'log','🌊 Nurki':'history','🎓 Certyfikaty':'certs',
    '🧠 Quiz':'quiz','🛒 Sklep':'shop','👥 Kursanci':'manage'
  };
  document.querySelectorAll('.tab').forEach(t => {
    const n = names[t.textContent.trim()]; t.classList.toggle('active', n===tab);
  });
  document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
  document.getElementById('panel-'+tab).classList.add('active');
  if (tab==='history') renderDives();
  if (tab==='certs') renderCerts();
  if (tab==='manage') renderStudents();
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
function renderQuizCategories() {
  document.getElementById('quiz-categories').innerHTML = Object.entries(quizData).map(([k,cat])=>{
    const ok = userRole==='instructor'||myEnabledQuizzes.includes(k);
    return '<div class="quiz-cat '+(ok?'':'disabled')+'" '+(ok?'onclick="startQuiz(\''+k+'\')"':'')+'><span class="quiz-cat-icon">'+cat.icon+'</span><div class="quiz-cat-name">'+cat.name+'</div>'+(ok?'':'<div class="quiz-locked">🔒 Zablokowany</div>')+'</div>';
  }).join('');
}
function startQuiz(k) {
  const cat=quizData[k], qs=[...cat.questions].sort(()=>Math.random()-0.5);
  quizState={catKey:k,catName:cat.name,questions:qs,current:0,score:0,total:qs.length};
  renderQuizQuestion();
}
function renderQuizQuestion() {
  const s=quizState, c=document.getElementById('quiz-container');
  if (s.current>=s.total) {
    const pct=Math.round((s.score/s.total)*100);
    const msg=pct>=80?'🎉 Świetny wynik!':pct>=50?'👍 Nieźle, ale powtórz materiał!':'📚 Musisz jeszcze poćwiczyć!';
    c.innerHTML='<div class="quiz-result"><div class="quiz-result-title">'+s.catName+'</div><div class="quiz-result-score">'+pct+'%</div><div class="quiz-result-text">'+s.score+'/'+s.total+' poprawnych — '+msg+'</div><button class="btn-primary" onclick="resetQuiz()">🔄 Wróć do kategorii</button></div>';
    return;
  }
  const q=s.questions[s.current];
  c.innerHTML='<div class="quiz-progress"><div class="quiz-progress-bar"><div class="quiz-progress-fill" style="width:'+(s.current/s.total*100)+'%"></div></div><div class="quiz-progress-text">'+(s.current+1)+'/'+s.total+'</div></div><div class="quiz-question">'+q.q+'</div><div class="quiz-answers" id="quiz-answers">'+q.a.map((a,i)=>'<button class="quiz-answer" onclick="answerQuiz('+i+')">'+a+'</button>').join('')+'</div>';
}
function answerQuiz(idx) {
  const s=quizState, q=s.questions[s.current];
  document.querySelectorAll('#quiz-answers .quiz-answer').forEach((btn,i)=>{
    btn.classList.add('disabled');
    if(i===q.c)btn.classList.add('correct');
    if(i===idx&&idx!==q.c)btn.classList.add('wrong');
  });
  if(idx===q.c)s.score++;
  s.current++;
  setTimeout(renderQuizQuestion,1200);
}
function resetQuiz() {
  quizState=null;
  document.getElementById('quiz-container').innerHTML='<div class="card-title">🧠 Test <span class="accent">wiedzy nurkowej</span></div><p style="font-size:0.76rem;color:var(--text-dim);margin-bottom:16px;">Wybierz kurs i sprawdź swoją wiedzę!</p><div id="quiz-categories"></div>';
  renderQuizCategories();
}

// ─── Toast ───
function showToast(msg) {
  const el=document.getElementById('toast');
  el.textContent=msg; el.classList.add('show');
  setTimeout(()=>el.classList.remove('show'),3000);
}
