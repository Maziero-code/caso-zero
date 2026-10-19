/* ============================================================
   ESTADO GLOBAL E VARIÁVEIS
============================================================ */
let audioCtx;
let timerInterval;
let timeLeft = 15 * 60; // 15 minutos
let CASE = null; 
let typingInterval = null;

const state = { 
  viewed: new Set(), 
  marked: new Set(), 
  suspect: null, 
  confidence: 50, 
  currentId: null 
};

const TIPO_TAG = { 
  log: "SYS.LOG", 
  email: "MAIL.SRV", 
  file: "FILE.DOC", 
  chat: "CHAT.LOG" 
};

/* ============================================================
   SISTEMA DE ÁUDIO (Web Audio API)
============================================================ */
function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function playSound(type) {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  const now = audioCtx.currentTime;

  if (type === 'click') {
    osc.type = 'sine'; osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.1);
    gain.gain.setValueAtTime(0.1, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.start(now); osc.stop(now + 0.1);
  } else if (type === 'success') {
    osc.type = 'triangle'; osc.frequency.setValueAtTime(600, now);
    osc.frequency.setValueAtTime(900, now + 0.1);
    gain.gain.setValueAtTime(0.1, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.start(now); osc.stop(now + 0.3);
  } else if (type === 'error') {
    osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.2);
    gain.gain.setValueAtTime(0.1, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.start(now); osc.stop(now + 0.2);
  }
}

function playBootSound() {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;

  // 1. Zumbido grave subindo
  const osc1 = audioCtx.createOscillator();
  const gain1 = audioCtx.createGain();
  osc1.type = 'sawtooth';
  osc1.frequency.setValueAtTime(50, now);
  osc1.frequency.exponentialRampToValueAtTime(150, now + 2);
  gain1.gain.setValueAtTime(0.01, now);
  gain1.gain.linearRampToValueAtTime(0.08, now + 0.5);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 2);
  osc1.connect(gain1); gain1.connect(audioCtx.destination);
  osc1.start(now); osc1.stop(now + 2);

  // 2. Sweep agudo
  const osc2 = audioCtx.createOscillator();
  const gain2 = audioCtx.createGain();
  osc2.type = 'square';
  osc2.frequency.setValueAtTime(200, now);
  osc2.frequency.exponentialRampToValueAtTime(1200, now + 2);
  gain2.gain.setValueAtTime(0.001, now);
  gain2.gain.linearRampToValueAtTime(0.03, now + 0.5);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 2);
  osc2.connect(gain2); gain2.connect(audioCtx.destination);
  osc2.start(now); osc2.stop(now + 2);

  // 3. Acorde final (Sistema Pronto)
  const osc3 = audioCtx.createOscillator();
  const gain3 = audioCtx.createGain();
  osc3.type = 'triangle';
  osc3.frequency.setValueAtTime(440, now + 1.8);
  osc3.frequency.setValueAtTime(554, now + 1.9);
  osc3.frequency.setValueAtTime(659, now + 2.0);
  gain3.gain.setValueAtTime(0.1, now + 1.8);
  gain3.gain.exponentialRampToValueAtTime(0.001, now + 3.5);
  osc3.connect(gain3); gain3.connect(audioCtx.destination);
  osc3.start(now + 1.8); osc3.stop(now + 3.5);
}

function playBeep() {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain); gain.connect(audioCtx.destination);
  const now = audioCtx.currentTime;
  
  osc.type = 'sine'; osc.frequency.setValueAtTime(1200, now);
  gain.gain.setValueAtTime(0.05, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
  osc.start(now); osc.stop(now + 0.05);
}

/* ============================================================
   INICIALIZAÇÃO E BOOT
============================================================ */
async function loadCase() {
  if (CASE) return CASE;
  const res = await fetch("data/caso-001.json");
  if (!res.ok) throw new Error("Erro HTTP " + res.status);
  CASE = await res.json();
  return CASE;
}

function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

function runBootSequence() {
  const bootScreen = document.getElementById("boot-screen");
  const bootText = document.getElementById("boot-text");
  bootScreen.style.display = "flex";
  bootText.innerHTML = "";
  
  playBootSound();

  const lines = [
    "> INICIANDO SISTEMA FORENSE AURORA V2.4...",
    "> VERIFICANDO INTEGRIDADE DOS LOGS... [OK]",
    "> MONTANDO COFRE DE EVIDÊNCIAS... [OK]",
    "> ACESSO CONCEDIDO. BEM-VINDO, INVESTIGADOR."
  ];

  let i = 0;
  function printLine() {
    if (i < lines.length) {
      bootText.innerHTML += lines[i] + "<br>";
      playBeep();
      i++;
      setTimeout(printLine, 500); 
    } else {
      setTimeout(() => {
        bootScreen.style.display = "none";
        showScreen("screen-investigation");
        renderAll();
        startTimer();
      }, 1000);
    }
  }
  printLine();
}

function startTimer() {
  const display = document.getElementById("timer-display");
  clearInterval(timerInterval);
  
  timerInterval = setInterval(() => {
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      display.textContent = "00:00";
      display.style.color = "var(--red)";
      playSound('error');
      alert("O TEMPO ACABOU! O atacante vazou os dados.");
      conclude(); 
    } else {
      timeLeft--;
      const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
      const s = (timeLeft % 60).toString().padStart(2, '0');
      display.textContent = `${m}:${s}`;
      if (timeLeft < 60) display.style.color = "var(--red)";
    }
  }, 1000);
}

/* ============================================================
   RENDERIZAÇÃO DO JOGO
============================================================ */
function renderAll() {
  document.getElementById("case-title").textContent = `[CASO_001] ${CASE.titulo}`;
  document.getElementById("stat-total").textContent = CASE.evidencias.length;
  renderEvidenceList();
  renderSuspects();
  renderMarked();
  updateStats();
  updateConcludeButton();
}

function renderEvidenceList() {
  const ul = document.getElementById("evidence-list");
  ul.innerHTML = "";
  CASE.evidencias.forEach(ev => {
    const li = document.createElement("li");
    li.className = "ev-item";
    if (ev.id === state.currentId) li.classList.add("active");
    if (state.viewed.has(ev.id)) li.classList.add("seen");
    
    const tag = TIPO_TAG[ev.tipo] || "UNKNOWN";
    li.onclick = () => selectEvidence(ev.id);
    
    li.innerHTML = `
      <span class="ev-tag">${tag}</span>
      <div class="ev-info">
        <div class="ev-name">${ev.nome}</div>
        <div class="ev-resumo">${ev.resumo}</div>
      </div>
    `;
    ul.appendChild(li);
  });
}

function selectEvidence(id) {
  if (state.currentId === id && state.viewed.has(id)) return;
  state.currentId = id;
  state.viewed.add(id);
  playSound('click');
  renderEvidenceList();
  renderViewer(true);
  updateStats();
}

function renderViewer(animate = false) {
  const ev = CASE.evidencias.find(e => e.id === state.currentId);
  const empty = document.getElementById("viewer-empty");
  const content = document.getElementById("viewer-content");
  if (!ev) { empty.style.display = "flex"; content.style.display = "none"; return; }

  empty.style.display = "none";
  content.style.display = "block";
  
  const meta = Object.entries(ev.metadados).map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("");
  const tag = TIPO_TAG[ev.tipo] || "UNKNOWN";

  content.innerHTML = `
    <div class="viewer-header">
      <span class="viewer-tipo">${tag}</span>
      <h2>${ev.nome}</h2>
    </div>
    <div class="terminal-text" id="term-output"></div>
    <dl class="viewer-meta">${meta}</dl>
    <button class="btn-mark ${state.marked.has(ev.id) ? "marked" : ""}" onclick="toggleMark('${ev.id}')">
      ${state.marked.has(ev.id) ? "[PISTA MARCADA]" : "[MARCAR COMO PISTA-CHAVE]"}
    </button>
  `;

  const termOutput = document.getElementById("term-output");
  
  if (animate) {
    let i = 0;
    termOutput.textContent = "> Iniciando leitura de dados...\n> \n";
    clearInterval(typingInterval);
    setTimeout(() => {
      termOutput.textContent = "> ";
      typingInterval = setInterval(() => {
        termOutput.textContent += ev.conteudo.charAt(i);
        i++;
        if (i >= ev.conteudo.length) clearInterval(typingInterval);
      }, 5); 
    }, 300); 
  } else {
    termOutput.textContent = ev.conteudo;
  }
}

function toggleMark(id) {
  const isMarking = !state.marked.has(id);
  isMarking ? state.marked.add(id) : state.marked.delete(id);
  
  if (isMarking) playSound('success'); else playSound('click');
  
  renderEvidenceList();
  renderViewer(false);
  renderMarked();
  updateStats();
}

function renderSuspects() {
  const box = document.getElementById("suspects-list");
  box.innerHTML = "";
  CASE.suspeitos.forEach(s => {
    const div = document.createElement("div");
    div.className = "suspeito" + (state.suspect === s.id ? " selected" : "");
    div.onclick = () => { 
      state.suspect = s.id; 
      playSound('click'); 
      renderSuspects(); 
      updateConcludeButton(); 
    };
    div.innerHTML = `
      <div class="suspeito-avatar">${s.inicial}</div>
      <div class="suspeito-info">
        <div class="suspeito-nome">${s.nome}</div>
        <div class="suspeito-cargo">${s.cargo}</div>
      </div>`;
    box.appendChild(div);
  });
}

function renderMarked() {
  const ul = document.getElementById("marked-list");
  const empty = document.getElementById("marked-empty");
  ul.innerHTML = "";
  if (state.marked.size === 0) { empty.style.display = "block"; return; }
  empty.style.display = "none";
  state.marked.forEach(id => {
    const ev = CASE.evidencias.find(e => e.id === id);
    if (!ev) return;
    const li = document.createElement("li");
    li.textContent = "> " + ev.nome;
    ul.appendChild(li);
  });
}

function updateStats() {
  document.getElementById("stat-viewed").textContent = state.viewed.size;
  document.getElementById("stat-marked").textContent = state.marked.size;
}

function updateConcludeButton() {
  document.getElementById("conclude-btn").disabled = !state.suspect;
}

/* ============================================================
   CONVERSOR DE FUSO
============================================================ */
function setupTimezoneConverter() {
  const btn = document.getElementById("tz-btn");
  const input = document.getElementById("tz-input");
  const output = document.getElementById("tz-output");

  btn.addEventListener("click", () => {
    const val = input.value.trim().toUpperCase();
    const match = val.match(/^(\d{2}):(\d{2})Z?$/);
    if (match) {
      let h = parseInt(match[1], 10) - 3;
      if (h < 0) h += 24;
      output.textContent = `${String(h).padStart(2, '0')}:${match[2]} (Local)`;
      playSound('success');
    } else {
      output.textContent = "FORMATO INVÁLIDO";
      playSound('error');
    }
  });
}

/* ============================================================
   CONCLUSÃO E RESULTADO
============================================================ */
function conclude() {
  clearInterval(timerInterval);
  playSound('success');
  const r = calcularPontuacao(state, CASE);
  renderResult(r);
  showScreen("screen-result");
}

function renderResult(r) {
  const card = document.getElementById("result-card");
  const culpado = CASE.suspeitos.find(s => s.id === CASE.gabarito.culpado);
  const escolhido = CASE.suspeitos.find(s => s.id === state.suspect);

  const bdHtml = r.breakdown.map(b => `
    <div class="bd-item ${b.status}">
      <span>${b.label}</span>
      <span class="pts">${b.pts > 0 ? "+" : ""}${b.pts}</span>
    </div>`).join("");

  const missedHtml = r.faltou.length ? `
    <div class="missed"><h4>[!] Evidências-chave ignoradas</h4>
      ${r.faltou.map(f => `<li>${f}</li>`).join("")}
    </div>` : "";

  const trapHtml = r.traps.length ? `
    <div class="missed"><h4>[!] Armadilhas classificadas erroneamente</h4>
      ${r.traps.map(id => {
        const ev = CASE.evidencias.find(e => e.id === id);
        return `<li>${ev.nome}</li>`;
      }).join("")}
    </div>` : "";

  const narrativaHtml = CASE.gabarito.narrativa.split("\n\n").map(p => `<p>${p}</p>`).join("");

  card.innerHTML = `
    <div class="result-rank">
      <div class="result-score" id="score-counter" style="color:${r.rank.cor}">0<small>/100</small></div>
      <div class="result-rank-name" style="color:${r.rank.cor}">${r.rank.nome}</div>
      <div class="result-verdict">
        ${r.suspeitoOk
          ? `Alvo identificado corretamente: <strong>${culpado.nome}</strong>.`
          : `Alvo incorreto: <strong>${escolhido ? escolhido.nome : "Nenhum"}</strong> — O responsável era <strong>${culpado.nome}</strong>.`}
      </div>
    </div>
    <div class="breakdown">
      <h3>[ RELATÓRIO DE PONTUAÇÃO ]</h3>
      ${bdHtml}
    </div>
    ${missedHtml}
    ${trapHtml}
    <div class="narrative">
      <h3>[ NARRATIVA DO INCIDENTE ]</h3>
      ${narrativaHtml}
    </div>
    
    <div style="text-align: center; margin-bottom: 20px; font-family: var(--font-mono); color: var(--text-dim); font-size: 12px;">
      GERADO POR <strong style="color: var(--accent);">CASO ZERO</strong> // SIMULADOR DFIR
    </div>

    <button class="btn-download" id="btn-download">BAIXAR RELATÓRIO (LINKEDIN)</button>
    
    <div class="result-actions">
      <button class="primary" id="btn-restart">REINICIAR INVESTIGAÇÃO</button>
      <button id="btn-back-intro">VOLTAR AO BRIEFING</button>
    </div>
  `;

  document.getElementById("btn-restart").addEventListener("click", restart);
  document.getElementById("btn-back-intro").addEventListener("click", () => showScreen("screen-intro"));
  document.getElementById("btn-download").addEventListener("click", downloadReport);

  const scoreEl = document.getElementById("score-counter");
  let currentScore = 0;
  const animInterval = setInterval(() => {
    if (currentScore >= r.total) {
      scoreEl.innerHTML = `${r.total}<small>/100</small>`;
      clearInterval(animInterval);
    } else {
      currentScore += Math.ceil(r.total / 20);
      if (currentScore > r.total) currentScore = r.total;
      scoreEl.innerHTML = `${currentScore}<small>/100</small>`;
    }
  }, 30);
}

function downloadReport() {
  playSound('click');
  const card = document.getElementById("result-card");
  const actions = card.querySelector('.result-actions');
  const downloadBtn = document.getElementById("btn-download");
  
  actions.style.display = 'none';
  downloadBtn.style.display = 'none';

  html2canvas(card, { backgroundColor: '#0a0f1a', scale: 2 }).then(canvas => {
    actions.style.display = 'flex';
    downloadBtn.style.display = 'block';
    const link = document.createElement('a');
    link.download = 'relatorio-caso-zero.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  });
}

function restart() {
  state.viewed.clear();
  state.marked.clear();
  state.suspect = null;
  state.confidence = 50;
  state.currentId = null;
  timeLeft = 15 * 60;
  
  document.getElementById("conf-slider").value = 50;
  document.getElementById("conf-value").textContent = "50%";
  document.getElementById("viewer-empty").style.display = "flex";
  document.getElementById("viewer-content").style.display = "none";
  document.getElementById("timer-display").textContent = "15:00";
  document.getElementById("timer-display").style.color = "var(--yellow)";
  
  clearInterval(typingInterval);
  renderAll();
  showScreen("screen-investigation");
  startTimer();
  playSound('success');
}

/* ============================================================
   BOOTSTRAP
============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.getElementById("start-btn");
  const errorEl  = document.getElementById("load-error");

  startBtn.addEventListener("click", async () => {
    initAudio();
    playSound('success');
    
    startBtn.disabled = true;
    startBtn.textContent = "CONECTANDO AO SERVIDOR...";
    errorEl.style.display = "none";
    
    try {
      await loadCase();
      setupTimezoneConverter();
      startBtn.style.display = "none";
      runBootSequence();
    } catch (err) {
      console.error(err);
      errorEl.style.display = "block";
      errorEl.textContent = "> ERRO FATAL: Verifique se o arquivo JSON está na pasta correta.";
      startBtn.disabled = false;
      startBtn.textContent = "> INICIAR INVESTIGAÇÃO";
    }
  });

  document.getElementById("conf-slider").addEventListener("input", e => {
    state.confidence = parseInt(e.target.value, 10);
    document.getElementById("conf-value").textContent = state.confidence + "%";
  });

  document.getElementById("conclude-btn").addEventListener("click", conclude);
});
