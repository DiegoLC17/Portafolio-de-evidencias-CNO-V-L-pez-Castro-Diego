(function(){
  const firebaseConfig = {
    apiKey: "AIzaSyAPzm4fsGsbDyTm_xKwwXsaBTXFY4dX6-c",
    authDomain: "phishing-quiz-4c603.firebaseapp.com",
    projectId: "phishing-quiz-4c603",
    storageBucket: "phishing-quiz-4c603.firebasestorage.app",
    messagingSenderId: "446534627558",
    appId: "1:446534627558:web:2feb36cfd136737db70b27",
    measurementId: "G-04S6SMSKS7"
  };

  let db = null;
  let auth = null;
  let firebaseInitialized = false;
  let isAuthenticated = false;

  async function initFirebase() {
    if (firebaseInitialized) return true;
    try {
      const { initializeApp } = await import("https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js");
      const { getFirestore } = await import("https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js");
      const { getAuth, signInAnonymously } = await import("https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js");
      
      const app = initializeApp(firebaseConfig);
      db = getFirestore(app);
      auth = getAuth(app);
      
      await signInAnonymously(auth);
      isAuthenticated = true;
      console.log("Firebase autenticado anónimamente, UID:", auth.currentUser?.uid);
      
      firebaseInitialized = true;
      return true;
    } catch (error) {
      console.error("Error al inicializar Firebase:", error);
      return false;
    }
  }

  async function saveQuizResult(name, score, totalQuestions, totalTimeMs, scenarioTimes) {
    if (!firebaseInitialized) {
      const ok = await initFirebase();
      if (!ok) return false;
    }
    if (!db || !isAuthenticated) {
      console.warn("Firestore no disponible o no autenticado");
      return false;
    }

    try {
      const { collection, addDoc, Timestamp } = await import("https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js");
      
      const result = {
        name: name,
        score: score,
        totalQuestions: totalQuestions,
        percentage: Math.round((score / totalQuestions) * 100),
        totalTimeMs: totalTimeMs,
        totalTimeFormatted: formatDuration(totalTimeMs),
        scenarioTimes: scenarioTimes,
        timestamp: Timestamp.now(),
        createdAt: new Date().toISOString()
      };
      
      await addDoc(collection(db, "quiz_results"), result);
      console.log("Resultado guardado correctamente");
      return true;
    } catch (error) {
      console.error("Error al guardar resultado:", error);
      return false;
    }
  }

  async function getRanking() {
    if (!firebaseInitialized) {
      await initFirebase();
    }
    if (!db) {
      console.warn("Firestore no disponible");
      return [];
    }

    try {
      const { collection, query, orderBy, getDocs, limit } = await import("https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js");
      
      const q = query(
        collection(db, "quiz_results"),
        orderBy("percentage", "desc"),
        orderBy("totalTimeMs", "asc"),
        limit(50)
      );
      
      const querySnapshot = await getDocs(q);
      const rankings = [];
      querySnapshot.forEach((doc) => {
        rankings.push({ id: doc.id, ...doc.data() });
      });
      console.log("Ranking obtenido, entradas:", rankings.length);
      return rankings;
    } catch (error) {
      console.error("Error al obtener ranking:", error);
      return [];
    }
  }

  async function showRanking() {
    const rankings = await getRanking();
    
    let modal = document.getElementById('ranking-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'ranking-modal';
      modal.className = 'ranking-modal';
      document.body.appendChild(modal);
    }
    
    if (!document.getElementById('ranking-modal-styles')) {
      const style = document.createElement('style');
      style.id = 'ranking-modal-styles';
      style.textContent = `
        .ranking-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          opacity: 0;
          visibility: hidden;
          transition: all 0.3s ease;
        }
        .ranking-modal.active {
          opacity: 1;
          visibility: visible;
        }
        .ranking-content {
          background: #ffffff;
          border-radius: 20px;
          max-width: 90%;
          width: 800px;
          max-height: 85vh;
          overflow-y: auto;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
          animation: rankingSlideIn 0.3s ease;
        }
        @keyframes rankingSlideIn {
          from { transform: translateY(-30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .ranking-header {
          background: linear-gradient(135deg, #111111, #2a2a2a);
          color: #ffffff;
          padding: 20px 24px;
          border-radius: 20px 20px 0 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: sticky;
          top: 0;
          z-index: 10;
        }
        .ranking-header h2 {
          margin: 0;
          font-size: 1.5rem;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .ranking-header h2::before {
          content: "🏆";
          font-size: 1.6rem;
        }
        .ranking-close {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: #ffffff;
          font-size: 24px;
          cursor: pointer;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }
        .ranking-close:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: scale(1.05);
        }
        .ranking-stats {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          padding: 16px 24px;
          background: #f8fafc;
          border-bottom: 1px solid #e5e7eb;
          gap: 12px;
        }
        .ranking-stat-item {
          text-align: center;
          flex: 1;
          min-width: 140px;
        }
        .ranking-stat-label {
          font-size: 0.85rem;
          color: #6b7280;
          margin-bottom: 4px;
        }
        .ranking-stat-value {
          font-size: 1rem;
          font-weight: 700;
          color: #111827;
        }
        .ranking-stat-value.small {
          font-size: 0.9rem;
        }
        .ranking-table-container {
          padding: 20px 24px;
          overflow-x: auto;
        }
        .ranking-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.9rem;
        }
        .ranking-table th {
          text-align: left;
          padding: 12px 16px;
          background: #f3f4f6;
          color: #374151;
          font-weight: 700;
          border-bottom: 2px solid #e5e7eb;
        }
        .ranking-table td {
          padding: 12px 16px;
          border-bottom: 1px solid #f0f0f0;
          color: #1f2937;
        }
        .ranking-table tr:hover {
          background: #f9fafb;
        }
        .ranking-rank {
          font-weight: 700;
          width: 60px;
        }
        .rank-1 { color: #f59e0b; font-size: 1.1rem; }
        .rank-2 { color: #6b7280; }
        .rank-3 { color: #b45309; }
        .ranking-name { font-weight: 600; }
        .ranking-score { font-weight: 700; color: #059669; text-align: center; }
        .ranking-time { color: #6b7280; text-align: right; }
        .empty-ranking {
          text-align: center;
          padding: 40px;
          color: #9ca3af;
        }
        .empty-ranking-icon {
          font-size: 3rem;
          margin-bottom: 12px;
        }
        @media (max-width: 640px) {
          .ranking-content { width: 95%; }
          .ranking-table th, .ranking-table td { padding: 8px 10px; font-size: 0.8rem; }
          .ranking-stats { flex-direction: column; }
          .ranking-stat-item { text-align: left; }
        }
      `;
      document.head.appendChild(style);
    }
    
    const totalParticipants = rankings.length;
    const avgScore = rankings.length > 0 
      ? Math.round(rankings.reduce((sum, r) => sum + r.percentage, 0) / rankings.length)
      : 0;
    
    const avgTotalTime = rankings.length > 0
      ? rankings.reduce((sum, r) => sum + r.totalTimeMs, 0) / rankings.length
      : 0;
    const fastestTime = rankings.length > 0
      ? Math.min(...rankings.map(r => r.totalTimeMs))
      : 0;
    const slowestTime = rankings.length > 0
      ? Math.max(...rankings.map(r => r.totalTimeMs))
      : 0;
    
    let scenarioStats = {};
    let scenarioCount = 0;
    
    if (rankings.length > 0) {
      rankings.forEach(r => {
        if (r.scenarioTimes && Array.isArray(r.scenarioTimes)) {
          r.scenarioTimes.forEach(s => {
            if (!scenarioStats[s.title]) {
              scenarioStats[s.title] = { total: 0, correct: 0 };
            }
            scenarioStats[s.title].total++;
            if (s.correct) scenarioStats[s.title].correct++;
          });
          if (r.scenarioTimes.length > scenarioCount) scenarioCount = r.scenarioTimes.length;
        }
      });
    }
    
    let mostFailed = { title: null, percentage: 100 };
    let mostSuccessful = { title: null, percentage: 0 };
    
    for (const [title, stats] of Object.entries(scenarioStats)) {
      const percentCorrect = (stats.correct / stats.total) * 100;
      if (percentCorrect < mostFailed.percentage) {
        mostFailed = { title, percentage: percentCorrect };
      }
      if (percentCorrect > mostSuccessful.percentage) {
        mostSuccessful = { title, percentage: percentCorrect };
      }
    }
    
    let tableHtml = '';
    if (rankings.length === 0) {
      tableHtml = `
        <div class="empty-ranking">
          <div class="empty-ranking-icon">📊</div>
          <p>Aún no hay participantes en el ranking</p>
          <p style="font-size: 0.85rem;">¡Sé el primero en completar el quiz!</p>
        </div>
      `;
    } else {
      tableHtml = `
        <table class="ranking-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Participante</th>
              <th style="text-align: center">Puntaje</th>
              <th style="text-align: right">Tiempo</th>
            </thead>
          <tbody>
            ${rankings.map((r, idx) => `
              <tr>
                <td class="ranking-rank ${idx === 0 ? 'rank-1' : idx === 1 ? 'rank-2' : idx === 2 ? 'rank-3' : ''}">
                  ${idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                </td>
                <td class="ranking-name">${escapeHtml(r.name)}</td>
                <td class="ranking-score">${r.score}/${r.totalQuestions} (${r.percentage}%)</td>
                <td class="ranking-time">${r.totalTimeFormatted || formatDuration(r.totalTimeMs)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }
    
    modal.innerHTML = `
      <div class="ranking-content">
        <div class="ranking-header">
          <h2>Ranking de Participantes</h2>
          <button class="ranking-close" id="ranking-close-btn">✕</button>
        </div>
        <div class="ranking-stats">
          <div class="ranking-stat-item">
            <div class="ranking-stat-label">Participantes</div>
            <div class="ranking-stat-value">${totalParticipants}</div>
          </div>
          <div class="ranking-stat-item">
            <div class="ranking-stat-label">Promedio general</div>
            <div class="ranking-stat-value">${avgScore}%</div>
          </div>
          <div class="ranking-stat-item">
            <div class="ranking-stat-label">Mejor puntaje</div>
            <div class="ranking-stat-value">${rankings[0] ? `${rankings[0].score}/${rankings[0].totalQuestions}` : '--'}</div>
          </div>
          <div class="ranking-stat-item">
            <div class="ranking-stat-label">Tiempo promedio</div>
            <div class="ranking-stat-value">${formatDuration(avgTotalTime)}</div>
          </div>
          <div class="ranking-stat-item">
            <div class="ranking-stat-label">Tiempo más rápido</div>
            <div class="ranking-stat-value">${formatDuration(fastestTime)}</div>
          </div>
          <div class="ranking-stat-item">
            <div class="ranking-stat-label">Tiempo más lento</div>
            <div class="ranking-stat-value">${formatDuration(slowestTime)}</div>
          </div>
          <div class="ranking-stat-item">
            <div class="ranking-stat-label">Escenario más fallado</div>
            <div class="ranking-stat-value small">${mostFailed.title ? `${escapeHtml(mostFailed.title)} (${Math.round(mostFailed.percentage)}% aciertos)` : '---'}</div>
          </div>
          <div class="ranking-stat-item">
            <div class="ranking-stat-label">Escenario mejor acertado</div>
            <div class="ranking-stat-value small">${mostSuccessful.title ? `${escapeHtml(mostSuccessful.title)} (${Math.round(mostSuccessful.percentage)}% aciertos)` : '---'}</div>
          </div>
        </div>
        <div class="ranking-table-container">
          ${tableHtml}
        </div>
      </div>
    `;
    
    modal.classList.add('active');
    
    const closeBtn = modal.querySelector('#ranking-close-btn');
    closeBtn.addEventListener('click', () => {
      modal.classList.remove('active');
    });
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('active');
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
      if (m === '&') return '&amp;';
      if (m === '<') return '&lt;';
      if (m === '>') return '&gt;';
      return m;
    });
  }
  
  const scenarios = [
    { id:'mfa', key:'mfa', title:'Intento de autenticación — MFA', type:'notification', isPhishing:true, tipo:'Bypass de MFA / Push bombing', explicacion:'Se produce una omisión de la autenticación multifactor (MFA) cuando un atacante explota las vulnerabilidades de los controles de seguridad de MFA para obtener acceso no autorizado a una cuenta. En otras palabras, el atacante elude los pasos de verificación diseñados para proteger la identidad de los usuarios. Nunca apruebes si no iniciaste sesión.' },
    { id:'subdominio', key:'subdominio', title:'Correo con subdominio sospechoso', type:'email', isPhishing:true, tipo:'Spoofing de URL / subdominio', explicacion:'El secuestro de subdominios permite a los atacantes tomar el control de subdominios legítimos a través de registros DNS abandonados. Esto puede causar ataques de phishing y robo de credenciales. Para evitarlo, las empresas deben auditar sus registros DNS, eliminar entradas antiguas y reforzar la seguridad en la nube. El dominio principal no es paypal.com; el atacante usa subdominios para parecer legítimo.' , link:{ text:'Acceder a tu cuenta', url:'https://paypal.seguro-verificacion.com/login' } },
    { id:'adjunto', key:'adjunto', title:'Correo con adjunto malicioso', type:'email-attachment', isPhishing:true, tipo:'Adjunto malicioso (macro/ejecutable)', explicacion:'Estos correos electrónicos suelen contener un mensaje que le anima a descargar el archivo adjunto para verlo o imprimirlo. Esto intenta engañarle para que abra el archivo malicioso, infectando su ordenador con malware (como el ransomware). Archivos .xlsm/ejecutables adjuntos pueden contener malware. No abrir sin verificar.' },
    { id:'urgencia', key:'urgencia', title:'Correo que genera urgencia', type:'email', isPhishing:true, tipo:'Phishing por urgencia', explicacion:'Táctica de ingeniería social en la que los ciberdelincuentes crean una falsa sensación de crisis o inmediatez para manipular a la víctima. El objetivo es lograr que actúe rápido sin pensar, haciendo clic en enlaces maliciosos, descargando archivos adjuntos o compartiendo información confidencial. Presión temporal para ocultar análisis. Verifica por canales oficiales.', link:{ text:'actualiza-tu-pass.example.com', url:'https://actualiza-tu-pass.example.com/reset?token=abc123' } },
    { id:'smishing', key:'smishing', title:'Smishing (SMS)', type:'sms', isPhishing:true, tipo:'Smishing', explicacion:'Smishing es un ataque de ingeniería social que utiliza mensajes de texto móviles falsos para engañar a las personas a que descarguen malware, compartan información confidencial o envíen dinero a delincuentes cibernéticos. Revisa el remitente y no sigas enlaces en SMS sospechosos; usa la app/portal oficial.', link:{ text:'http://dhl-envio-reprogramado.com', url:'http://dhl-envio-reprogramado.com' } },
    { id:'vishing', key:'vishing', title:'Llamada (vishing)', type:'call', isPhishing:true, tipo:'Vishing', explicacion:'Es un sistema de robo de datos bancarios realizado por medio de llamadas telefónicas, en donde los ciberdelincuentes utilizan una voz automatizada que simula ser de las empleadas por los bancos. Nunca facilites números de tarjeta o códigos por teléfono; cuelga y llama al número oficial.' },
    { id:'clone', key:'clone', title:'Clone phishing (correo clonado)', type:'email-attachment', isPhishing:true, tipo:'Clone phishing', explicacion:'Los atacantes clonan un mensaje de correo electrónico real con archivos adjuntos y lo reenvían haciéndose pasar por el remitente original. Los archivos adjuntos se sustituyen por malware, pero tienen el mismo aspecto que los documentos originales. Correo clonado con enlace/adjunto reemplazado. Confirma con el remitente por otro canal.', link:{ text:'Descargar documento', url:'https://drive.example.com/descarga/fichero_corregido.exe' } },
    { id:'angler', key:'angler', title:'Angler phishing en redes sociales', type:'social', isPhishing:true, tipo:'Angler phishing', explicacion:'El phishing de tipo "angler" es un ataque de ingeniería social en el que los ciberdelincuentes se hacen pasar por representantes legítimos de atención al cliente en las redes sociales. En lugar de utilizar correos electrónicos de phishing tradicionales, estos atacantes crean cuentas de soporte falsas , monitorean las quejas de los clientes y "responden" ofreciendo ayuda. Busca cuentas verificadas e identifica dominios sospechosos.', link:{ text:'https://netflix-support.verif-center.com', url:'https://netflix-support.verif-center.com' } },
    { id:'pharming', key:'pharming', title:'Pharming (redirección a sitio falso)', type:'browser', isPhishing:true, tipo:'Pharming', explicacion:'Este es un tipo de ciberataque de ingeniería social en el que los delincuentes redirigen a los internautas que intentan acceder a un sitio web específico a un sitio diferente y falso. No ingreses credenciales; usa marcadores o escribe la URL exacta.', link:{ text:'Acceder a mi cuenta', url:'https://tubanco-falso.com/login' } },
    { id:'real', key:'real', title:'Comunicación institucional legítima', type:'email', isPhishing:false, tipo:'Comunicación legítima', explicacion:'Dominio institucional y remitente coinciden. Aun así confirmar si hay duda.', link:{ text:'Descargar calendario', url:'https://universidad.edu.mx/calendario-2026.pdf' } }
  ];

  const startBtn = document.getElementById('start-quiz-btn');
  const container = document.getElementById('quiz-container');
  const quizCounter = document.getElementById('quiz-counter');

  let state = {
    name: 'Participante',
    fakeEmail: 'usuario@falso.test',
    index: 0,
    correct: 0,
    answered: 0,
    scenarioTimes: [],
    scenarioStart: 0,
    totalStart: 0,
    totalEnd: 0,
    timerId: null,
    totalTimeMs: 0
  };

  function esc(s){
    return String(s || '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  }

  function formatDuration(ms){
    const totalSeconds = Math.max(0, ms) / 1000;
    if (totalSeconds < 60) return `${totalSeconds.toFixed(1)} s`;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = (totalSeconds % 60).toFixed(1);
    return `${minutes} min ${seconds} s`;
  }

  function formatClock(ms){
    const totalSeconds = Math.floor(Math.max(0, ms) / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  function clearTimer(){
    if (state.timerId) {
      clearInterval(state.timerId);
      state.timerId = null;
    }
  }

  function startTimer(){
    clearTimer();
    state.scenarioStart = Date.now();

    const tick = () => {
      const timerEl = document.getElementById('scenario-timer');
      if (timerEl) {
        timerEl.textContent = formatClock(Date.now() - state.scenarioStart);
      }
    };

    tick();
    state.timerId = setInterval(tick, 250);
  }

  function stopTimerAndStore(){
    const elapsed = Date.now() - state.scenarioStart;
    clearTimer();
    return elapsed;
  }

  function levenshtein(a,b){
    if(!a || !b) return Math.max((a || '').length, (b || '').length);
    const m = [], al = a.length, bl = b.length;
    for(let i = 0; i <= al; i++){ m[i] = [i]; }
    for(let j = 1; j <= bl; j++) m[0][j] = j;
    for(let i = 1; i <= al; i++){
      for(let j = 1; j <= bl; j++){
        m[i][j] = Math.min(
          m[i - 1][j] + 1,
          m[i][j - 1] + 1,
          m[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
        );
      }
    }
    return m[al][bl];
  }

  function analyseUrl(url){
    const indicators = [];
    let suspicious = false;
    try{
      const u = new URL(url.startsWith('http') ? url : 'https://' + url);
      const hostname = u.hostname.toLowerCase();

      if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)){
        indicators.push('Usa dirección IP en lugar de dominio.');
        suspicious = true;
      }

      if (hostname.includes('xn--')){
        indicators.push('Dominio punycode (posible homograph attack).');
        suspicious = true;
      }

      const parts = hostname.split('.');
      if (parts.length >= 3){
        const main = parts.slice(-2).join('.');
        const sub = parts.slice(0,-2).join('.');
        const brandHints = ['paypal','google','netflix','microsoft','dhl','banco','hsbc','bancomer','apple'];
        for(const b of brandHints){
          if(sub.includes(b) && !main.includes(b)){
            indicators.push(`Nombre conocido incorporado en subdominio ("${b}") en lugar de dominio principal.`);
            suspicious = true;
            break;
          }
        }
        if(sub.length > 25){
          indicators.push('Subdominio excesivamente largo (posible intento de camuflaje).');
        }
      }

      if(/\.(exe|scr|zip|xlsm?)($|\?)/i.test(u.pathname + (u.search || ''))){
        indicators.push('Ruta apunta a archivo ejecutable/adjunto (.exe, .xlsm, .zip).');
        suspicious = true;
      }

      if(/-|_/.test(hostname) && hostname.split('-').length > 2){
        indicators.push('Uso de guiones/segmentos inusuales en el dominio.');
      }

      const known = ['paypal.com','netflix.com','dhl.com','microsoft.com','apple.com','universidad.edu.mx'];
      for(const k of known){
        if(levenshtein(hostname, k) <= 2 && hostname !== k){
          indicators.push(`Dominio parecido a "${k}" (posible typo-squatting).`);
          suspicious = true;
          break;
        }
      }
    }catch(e){
      indicators.push('URL no parseable correctamente.');
      suspicious = true;
    }
    return { indicators, suspicious };
  }

  function buildUserInfoBanner(){
    return `<div class="user-info-banner"><div><strong>Participante:</strong> ${esc(state.name)}</div><div><strong>Correo usado en simulación:</strong> ${esc(state.fakeEmail)}</div></div>`;
  }

  function buildEmailHTML(params){
    const avatarInitial = (params.fromName || params.fromEmail || 'X').trim()[0] || 'X';
    return `
      <div class="email-ui" role="article" aria-label="Mensaje de correo">
        <div class="email-header">
          <div style="display:flex; align-items:center; gap:12px;">
            <div class="sender-avatar">${esc(avatarInitial.toUpperCase())}</div>
            <div>
              <div class="from-line"><span class="from-name">${esc(params.fromName || params.fromEmail)}</span> <span class="from-email">&lt;${esc(params.fromEmail)}&gt;</span></div>
              <div class="reply-to">Responder a: <span>${esc(params.replyTo || params.fromEmail)}</span></div>
            </div>
          </div>
          <div style="text-align:right;">
            <div class="subject">${esc(params.subject || '')}</div>
            <div class="date" style="font-size:0.85rem;color:#666;margin-top:6px;">${esc(params.date || new Date().toLocaleString())}</div>
          </div>
        </div>
        <div class="email-body">
          <div class="email-meta">Para: ${esc(params.to)}</div>
          <div class="email-text">${params.bodyHtml || ''}</div>
          ${params.attachment ? `<div class="attachment">📎 ${esc(params.attachment)}</div>` : ''}
        </div>
      </div>
    `;
  }

  function buildSMSHTML(from, text, linkHTML){
    return `
      <div class="sms-phone" role="region" aria-label="Pantalla de mensaje">
        <div class="sms-top"><div class="sms-from">${esc(from)}</div><div class="sms-time">${(new Date()).toLocaleTimeString()}</div></div>
        <div class="sms-screen"><div class="sms-bubble">${text}${linkHTML ? '<br><br>' + linkHTML : ''}</div></div>
      </div>
    `;
  }

  function buildCallHTML(callerId, transcript){
    return `<div class="call-ui" role="region" aria-label="Llamada falsa"><div class="call-number">${esc(callerId)}</div><div class="call-text">${esc(transcript)}</div></div>`;
  }

  function buildBrowserHTML(visibleUrl, ctaLinkHTML, warning){
    return `
      <div class="browser-ui" role="region" aria-label="Navegador falso">
        <div class="browser-bar"><div class="browser-controls"><span class="dot red"></span><span class="dot amber"></span><span class="dot green"></span></div><div class="browser-url" title="${esc(visibleUrl)}">${highlightUrl(visibleUrl)}</div></div>
        <div class="browser-body">
          ${warning ? `<div class="notification" style="margin-bottom:10px;">${esc(warning)}</div>` : ''}
          <div class="browser-content">La página solicita que inicies sesión para continuar.<div style="margin-top:12px;">${ctaLinkHTML || ''}</div></div>
        </div>
      </div>
    `;
  }

  function buildSocialHTML(account, content, linkHTML){
    return `<div class="social-ui"><div style="display:flex; gap:10px; align-items:center;"><div class="sender-avatar small">${esc(account[0] || 'S')}</div><div style="font-weight:700;">@${esc(account)}</div><div class="social-verified">· Soporte</div></div><div style="margin-top:8px;">${content} ${linkHTML ? '<div style="margin-top:8px;">' + linkHTML + '</div>' : ''}</div></div>`;
  }

  function highlightUrl(url){
    try{
      const u = new URL(url.startsWith('http') ? url : 'https://' + url);
      const host = u.hostname;
      const path = u.pathname + (u.search || '');
      const parts = host.split('.');
      if(parts.length > 2){
        const sub = parts.slice(0, -2).join('.');
        const main = parts.slice(-2).join('.');
        return `<span class="url-sub">${esc(sub)}.</span><span class="url-main">${esc(main)}</span><span class="url-path">${esc(path)}</span>`;
      }
      return `<span class="url-main">${esc(host)}</span><span class="url-path">${esc(path)}</span>`;
    }catch(e){
      return esc(url);
    }
  }

  function createFakeLink(display, href, meta = {}){
    const a = document.createElement('a');
    a.className = 'fake-link quiz-link';
    a.href = '#';
    a.textContent = display;
    a.setAttribute('data-real-href', href);
    a.setAttribute('data-link-reason', meta.reason || '');
    a.setAttribute('data-link-hint', meta.hintLevel || 'medium');
    a.title = href;
    return a;
  }

  function buildLinkAnalysisCard(index, visible, real, analysed){
    const indicatorsHtml = analysed.indicators.length
      ? '<div class="link-indicators">' + analysed.indicators.map(it => `<span class="indicator-chip">${esc(it)}</span>`).join('') + '</div>'
      : '<span class="indicator-chip neutral">Ningún indicador evidente</span>';

    return `
      <div class="link-analysis-card">
        <div class="link-analysis-header">
          <div class="link-analysis-title">Enlace ${index}</div>
          <span class="link-analysis-badge">Revisión rápida</span>
        </div>

        <div class="link-analysis-row"><strong>Texto visible:</strong> ${esc(visible)}</div>
        <div class="link-analysis-row"><strong>URL real:</strong> <code class="url-code">${esc(real)}</code></div>
        <div class="link-analysis-row"><strong>Indicadores:</strong> ${indicatorsHtml}</div>
        <div class="link-analysis-row">
          <strong>Evaluación:</strong> <span class="eval">Probablemente Phishing</span>
        </div>
      </div>
    `;
  }

  function renderScenario(){
    const s = scenarios[state.index];
    container.innerHTML = '';

    const headerHtml = buildUserInfoBanner();

    let contextHtml = '';
    if(s.type === 'notification'){
      contextHtml = `<div class="notification">Intento de acceso: se ha solicitado aprobación de inicio de sesión desde un dispositivo desconocido. Si no fuiste tú, no apruebes.</div>`;
    } else if(s.type === 'email' || s.type === 'email-attachment'){
      if(s.id === 'subdominio'){
        const link = createFakeLink(s.link.text, s.link.url, { reason:'subdominio con nombre de marca', hintLevel:'high' });
        contextHtml = buildEmailHTML({
          fromName: 'Seguridad PayPal',
          fromEmail: 'seguridad@paypal.seguro-verificacion.com',
          replyTo: 'no-reply@paypal.seguro-verificacion.com',
          subject: 'Alerta de seguridad en tu cuenta',
          to: state.fakeEmail,
          date: (new Date()).toLocaleString(),
          bodyHtml: `Hola ${esc(state.name)},<br><br>Hemos detectado actividad inusual. Verifica tu cuenta aquí: ${link.outerHTML}<br><br>Si no realizaste esta acción, ignora este mensaje.`
        });
      } else if(s.id === 'urgencia'){
        const link = createFakeLink(s.link.text, s.link.url, { reason:'dominio genérico y urgencia', hintLevel:'high' });
        contextHtml = buildEmailHTML({
          fromName: 'Departamento TI',
          fromEmail: 'departamento-ti@tuorganizacion.local',
          subject: 'Cambio de contraseña requerido',
          to: state.fakeEmail,
          date: (new Date()).toLocaleString(),
          bodyHtml: `Hola ${esc(state.name)},<br><br>Tu contraseña expirará en <strong>30 minutos</strong>. Actualiza ahora: ${link.outerHTML}`
        });
      } else if(s.id === 'adjunto'){
        contextHtml = buildEmailHTML({
          fromName: 'Facturación Empresa Proveedor',
          fromEmail: 'facturacion@empresa-proveedor.com',
          subject: 'Factura pendiente – Marzo',
          to: state.fakeEmail,
          date: (new Date()).toLocaleString(),
          bodyHtml: `Hola ${esc(state.name)},<br><br>Adjuntamos la factura correspondiente a marzo. Ábrela para ver los detalles.`,
          attachment: 'Factura_23492.xlsm'
        });
      } else if(s.id === 'clone'){
        const link = createFakeLink(s.link.text, s.link.url, { reason:'archivo ejecutable en enlace', hintLevel:'high' });
        contextHtml = buildEmailHTML({
          fromName: 'Tu jefe',
          fromEmail: 'tu.jefe@empresa.local',
          subject: 'Documentos actualizados',
          to: state.fakeEmail,
          date: (new Date()).toLocaleString(),
          bodyHtml: `Hola ${esc(state.name)},<br><br>Te envío la versión corregida del archivo que te mandé ayer.<br>${link.outerHTML}`
        });
      } else if(s.id === 'real'){
        const link = createFakeLink(s.link.text, s.link.url, { reason:'dominio institucional legítimo', hintLevel:'low' });
        contextHtml = buildEmailHTML({
          fromName: 'Soporte Universidad',
          fromEmail: 'soporte@universidad.edu.mx',
          subject: 'Calendario académico 2026',
          to: state.fakeEmail,
          date: (new Date()).toLocaleString(),
          bodyHtml: `Hola ${esc(state.name)},<br><br>Adjuntamos el PDF con las fechas oficiales.<br><br>${link.outerHTML}`
        });
      } else {
        contextHtml = buildEmailHTML({
          fromName: s.title,
          fromEmail: 'no-reply@servicio.example.com',
          subject: s.title,
          to: state.fakeEmail,
          date: (new Date()).toLocaleString(),
          bodyHtml: `<div>${esc(s.title)}</div>`
        });
      }
    } else if(s.type === 'sms'){
      const linkElement = createFakeLink(s.link.text, s.link.url, { reason:'dominio no oficial y sin HTTPS en SMS', hintLevel:'high' });
      contextHtml = buildSMSHTML('+52 55 1234 5678', 'DHL: Tu paquete no pudo ser entregado. Paga el cargo de reenvío aquí:', linkElement.outerHTML);
    } else if(s.type === 'call'){
      contextHtml = buildCallHTML('+52 800 123 4567', '“Hola, soy del banco. Detectamos actividad sospechosa. Para verificar tu identidad necesito tu número de tarjeta y el código que recibirás por SMS.”');
    } else if(s.type === 'social'){
      const linkElement = createFakeLink(s.link.text, s.link.url, { reason:'sitio de soporte falso en redes', hintLevel:'high' });
      contextHtml = buildSocialHTML('netflixayuda', 'Hola, somos soporte de Netflix. Entra aquí para verificar tu cuenta:', linkElement.outerHTML);
    } else if(s.type === 'browser'){
      const linkElement = createFakeLink(s.link.text, s.link.url, { reason:'dominio distinto al banco', hintLevel:'high' });
      contextHtml = buildBrowserHTML('www.tubanco.com/login', linkElement.outerHTML, 'Advertencia del navegador: certificado inválido o URL no coincide con marcador.');
    }

    const card = document.createElement('div');
    card.className = 'quiz-card enhanced';
    card.innerHTML = `
      <div class="quiz-card-inner" style="max-width:980px; margin:0 auto;">
        <h3 class="scenario-title">¿Este escenario será PHISHING o LEGÍTIMO?</h3>
        <div class="scenario-meta">
          <span class="scenario-index">Escenario ${state.index + 1} / ${scenarios.length}</span>
          <span class="scenario-timer" id="scenario-timer">00:00</span>
        </div>
        <div class="user-banner">${headerHtml}</div>
        <div class="quiz-content-area">${contextHtml}</div>
        <div class="quiz-actions" style="margin-top:14px; display:flex; gap:10px; justify-content:center; flex-wrap:wrap;">
          <button id="btn-phishing" class="btn-inline">PHISHING</button>
          <button id="btn-real" class="btn-inline">REAL</button>
        </div>
        <div id="feedback-area" style="margin-top:16px; display:none;"></div>
      </div>
    `;
    container.appendChild(card);

    const fakeLinks = container.querySelectorAll('.fake-link');
    fakeLinks.forEach(a => {
      if(!a.getAttribute('data-real-href') && a.title) a.setAttribute('data-real-href', a.title);
      a.addEventListener('click', function(ev){ ev.preventDefault(); });
      a.style.cursor = 'pointer';
    });

    const btnPh = container.querySelector('#btn-phishing');
    const btnR = container.querySelector('#btn-real');
    if(btnPh) btnPh.addEventListener('click', () => handleChoice(true));
    if(btnR) btnR.addEventListener('click', () => handleChoice(false));

    startTimer();
  }

  function handleChoice(chosenPhishing){
    const s = scenarios[state.index];
    const elapsed = stopTimerAndStore();
    const correct = (chosenPhishing === s.isPhishing);

    state.answered++;
    if(correct) state.correct++;

    state.scenarioTimes.push({
      title: s.title,
      isPhishing: s.isPhishing,
      chosenPhishing,
      correct,
      elapsed
    });

    const card = container.querySelector('.quiz-card.enhanced');
    const links = card ? Array.from(card.querySelectorAll('.fake-link')) : [];

    let linksAnalysisHtml = '';
    if(links.length){
      linksAnalysisHtml += `<div class="analysis-section"><h4>Análisis de enlaces</h4>`;
      links.forEach((a, idx) => {
        const visible = (a.textContent || '').trim();
        const real = a.getAttribute('data-real-href') || a.title || '';
        const analysed = real ? analyseUrl(real) : { indicators:['No se encontró URL real'], suspicious:true };
        linksAnalysisHtml += buildLinkAnalysisCard(idx + 1, visible, real, analysed);
      });
      linksAnalysisHtml += `</div>`;
    }

    const feedback = container.querySelector('#feedback-area');
    feedback.style.display = 'block';
    feedback.innerHTML = `
      <div class="${correct ? 'feedback-correct' : 'feedback-wrong'}">
        <p style="font-weight:800; margin:0 0 6px 0;">${correct ? 'Correcto' : 'Incorrecto'}</p>
        <p style="margin:4px 0;"><strong>Tipo evaluado:</strong> ${esc(s.tipo)}</p>
        <p style="margin-top:8px;">${esc(s.explicacion)}</p>
        <p style="margin-top:8px;"><strong>Tiempo empleado:</strong> ${formatDuration(elapsed)}</p>

        ${linksAnalysisHtml}

        <div style="text-align:right; margin-top:12px;">
          <button id="btn-next" class="btn-inline">SIGUIENTE</button>
        </div>
      </div>
    `;

    const btns = container.querySelectorAll('#btn-phishing, #btn-real');
    btns.forEach(b => {
      b.disabled = true;
      b.style.opacity = '0.6';
      b.style.cursor = 'not-allowed';
    });

    const nextBtn = feedback.querySelector('#btn-next');
    if(nextBtn) nextBtn.addEventListener('click', () => {
      state.index++;
      if(state.index >= scenarios.length) showResults();
      else renderScenario();
    });
  }

  async function showResults(){
    clearTimer();
    state.totalEnd = Date.now();
    const totalTime = state.totalEnd - state.totalStart;
    state.totalTimeMs = totalTime;
    
    if (quizCounter) quizCounter.style.display = 'none';

    const percent = Math.round((state.correct / scenarios.length) * 100);
    const avgTime = totalTime / scenarios.length;

    await saveQuizResult(state.name, state.correct, scenarios.length, totalTime, state.scenarioTimes);

    container.innerHTML = `
      <div class="quiz-results-shell">
        <div class="results-hero">
          <div class="results-hero-copy">
            <span class="results-kicker">Resultados finales</span>
            <h3>¡Has terminado el QUIZ!</h3>
            <p>
              Obtuviste <strong>${state.correct}</strong> respuestas correctas de <strong>${scenarios.length}</strong>.
              Abajo puedes revisar el tiempo por escenario y el tiempo total invertido.
            </p>
          </div>
          <div class="results-hero-score">
            <div class="results-score-number">${state.correct}/${scenarios.length}</div>
            <div class="results-score-label">Respuestas correctas</div>
          </div>
        </div>

        <div class="results-stats-grid">
          <div class="result-stat-card">
            <span>Puntuación</span>
            <strong>${percent}%</strong>
          </div>
          <div class="result-stat-card">
            <span>Tiempo total</span>
            <strong>${formatDuration(totalTime)}</strong>
          </div>
          <div class="result-stat-card">
            <span>Promedio por escenario</span>
            <strong>${formatDuration(avgTime)}</strong>
          </div>
        </div>

        <div class="results-list-card">
          <div class="section-title">Tiempo por escenario</div>
          <div class="scenario-results-list">
            ${state.scenarioTimes.map((item, i) => `
              <div class="scenario-result-item ${item.correct ? 'correct' : 'wrong'}">
                <div class="scenario-result-left">
                  <div class="scenario-result-title">
                    ${i + 1}. ${esc(item.title)}
                    <span class="result-pill ${item.correct ? 'correct' : 'wrong'}">${item.correct ? 'Correcto' : 'Incorrecto'}</span>
                  </div>
                  <div class="scenario-result-meta">
                    Tu respuesta: <strong>${item.chosenPhishing ? 'Phishing' : 'Real'}</strong> · Respuesta correcta: <strong>${item.isPhishing ? 'Phishing' : 'Real'}</strong>
                  </div>
                </div>
                <div class="scenario-result-right">
                  <span>Tiempo</span>
                  <strong>${formatDuration(item.elapsed)}</strong>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="results-actions">
          <button id="btn-restart" class="btn-inline">REINICIAR</button>
          <button id="btn-summary" class="btn-inline" style="background:#e0e0e0; color:#111;">VER EXPLICACIONES</button>
          <button id="btn-ranking" class="btn-inline" style="text-decoration:none;">VER RANKING</button>
          <button id="btn-exit" class="btn-inline" style="background:#a80000; color:#fff;">SALIR</button>
        </div>

        <div id="full-explanations" style="display:none; margin-top:16px;"></div>
      </div>
    `;

    const restart = document.getElementById('btn-restart');
    if(restart) restart.addEventListener('click', () => {
      state.index = 0;
      state.correct = 0;
      state.answered = 0;
      state.scenarioTimes = [];
      state.scenarioStart = 0;
      state.totalStart = Date.now();
      state.totalEnd = 0;
      clearTimer();
      renderScenario();
    });

    const rankingBtn = document.getElementById('btn-ranking');
    if(rankingBtn){
      rankingBtn.addEventListener('click', () => {
        showRanking();
      });
    }

    const summary = document.getElementById('btn-summary');
    if(summary) summary.addEventListener('click', () => {
      const ex = document.getElementById('full-explanations');
      ex.style.display = 'block';
      ex.innerHTML = '<h4>Explicaciones por escenario</h4>' + scenarios.map((s, i) => `
        <div style="background:#fff; padding:12px; border-radius:8px; margin-top:8px; border:1px solid #f0f0f0;">
          <strong>${i + 1}. ${esc(s.title)}</strong>
          <p style="margin-top:6px;"><strong>Tipo:</strong> ${esc(s.tipo)}</p>
          <p style="margin-top:6px;">${esc(s.explicacion)}</p>
        </div>
      `).join('');
    });

    const exitBtn = document.getElementById('btn-exit');
    if (exitBtn) {
        exitBtn.addEventListener('click', () => {
            window.location.reload();
        });
    }
  }

  function showConsentForm(){
    container.style.display = 'block';
    container.innerHTML = `
      <div class="formulario-contacto" style="max-width:760px; margin:0 auto;">
        <h3>Consentimiento informado</h3>
        <p style="margin-top:8px">
          Este ejercicio es una simulación: <strong>NO</strong> se solicitarán ni almacenarán credenciales reales fuera de la sesión del navegador.
          Usa un <em>correo falso</em> (ej. usuario@ejemplo.test). No introduzcas contraseñas reales.
        </p>

        <div style="display:flex; gap:12px; margin-top:10px; flex-wrap:wrap;">
          <div style="flex:1; min-width:200px;">
            <label><b>Nombre</b></label><br><br>
            <input id="quiz-name" placeholder="Tu nombre (ej. Ana Pérez)" style="width:100%; padding:8px; border-radius:8px; border:1px solid #dcdcdc;">
          </div>
          <div style="flex:1; min-width:200px;">
            <label><b>Correo:</b></label><br><br>
            <input id="quiz-email" placeholder="ejemplo@falso.test" style="width:100%; padding:8px; border-radius:8px; border:1px solid #dcdcdc;">
          </div>
        </div>

        <div style="display:flex; gap:10px; align-items:center; margin-top:12px;">
          <input id="quiz-accept" type="checkbox">
          <label for="quiz-accept">Acepto las condiciones y usaré información de simulación</label>
        </div>

        <div style="text-align:center; margin-top:14px;">
          <button id="quiz-init" class="btn-inline" style="border-radius:8px;">INICIAR QUIZ</button>
          <button id="quiz-cancel" class="btn-inline" style="border-radius:8px; margin-left:8px;">CANCELAR</button>
        </div>
      </div>
    `;

    const initBtn = document.getElementById('quiz-init');
    const cancelBtn = document.getElementById('quiz-cancel');

    if(cancelBtn) cancelBtn.addEventListener('click', () => {
      container.style.display = 'none';
      container.innerHTML = '';
      if(startBtn) startBtn.style.display = 'inline-block';
      
      const externalRankingBtn = document.getElementById('ver-ranking-btn');
      if (externalRankingBtn) externalRankingBtn.style.display = '';
    });

    if(initBtn) initBtn.addEventListener('click', () => {
      const nameInput = document.getElementById('quiz-name');
      const emailInput = document.getElementById('quiz-email');
      const accept = document.getElementById('quiz-accept');
      const nameVal = (nameInput && nameInput.value.trim()) || 'Participante';
      const emailVal = (emailInput && emailInput.value.trim()) || 'usuario@falso.test';

      if(!accept || !accept.checked){
        alert('Debes aceptar las condiciones para continuar (usar información simulada).');
        return;
      }

      state.name = nameVal;
      state.fakeEmail = emailVal;
      startSimulation();
    });
  }

  function startSimulation(){
    const externalRankingBtn = document.getElementById('ver-ranking-btn');
    if (externalRankingBtn) externalRankingBtn.style.display = 'none';
    state.index = 0;
    state.correct = 0;
    state.answered = 0;
    state.scenarioTimes = [];
    state.scenarioStart = 0;
    state.totalStart = Date.now();
    state.totalEnd = 0;
    clearTimer();
    if (quizCounter) quizCounter.style.display = 'none';
    renderScenario();
  }

  initFirebase().catch(console.error);

  if(startBtn){
    startBtn.addEventListener('click', function(e){
      e.preventDefault();
      startBtn.style.display = 'none';
      showConsentForm();
    });
  } else {
    showConsentForm();
  }

  const externalRankingBtn = document.getElementById('ver-ranking-btn');
  if (externalRankingBtn) {
    externalRankingBtn.addEventListener('click', () => {
      showRanking();
    });
  }
})();
