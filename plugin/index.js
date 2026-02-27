const STORAGE_KEYS = {
  SERVER_URL: 'indesigntex_server_url',
  API_KEY: 'indesigntex_api_key',
  HISTORY: 'indesigntex_history',
};

const MAX_HISTORY = 20;

let lastEpsData = null;
let lastLatex = null;

function getSettings() {
  return {
    serverUrl: localStorage.getItem(STORAGE_KEYS.SERVER_URL) || 'http://localhost:3000',
    apiKey: localStorage.getItem(STORAGE_KEYS.API_KEY) || 'dev-api-key-indesigntex-2026',
  };
}

function saveSettings(serverUrl, apiKey) {
  localStorage.setItem(STORAGE_KEYS.SERVER_URL, serverUrl);
  localStorage.setItem(STORAGE_KEYS.API_KEY, apiKey);
}

function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.HISTORY) || '[]');
  } catch {
    return [];
  }
}

function addToHistory(latex) {
  const history = getHistory();
  const existing = history.findIndex(h => h.latex === latex);
  if (existing !== -1) history.splice(existing, 1);
  history.unshift({ latex, timestamp: Date.now() });
  if (history.length > MAX_HISTORY) history.pop();
  localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
  renderHistory();
}

function setStatus(type, message) {
  const bar = document.getElementById('status-bar');
  const icon = document.getElementById('status-icon');
  const msg = document.getElementById('status-message');

  bar.className = `status-bar status-${type}`;
  msg.textContent = message;

  if (type === 'loading') {
    icon.parentElement.classList.add('loading');
  } else {
    icon.parentElement.classList.remove('loading');
  }
}

async function callApi(endpoint, body) {
  const { serverUrl, apiKey } = getSettings();
  const url = `${serverUrl.replace(/\/+$/, '')}${endpoint}`;

  const headers = { 'Content-Type': 'application/json' };
  if (apiKey) headers['X-API-Key'] = apiKey;

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  return response;
}

async function validateLatex() {
  const latex = document.getElementById('latex-input').value.trim();
  if (!latex) {
    setStatus('error', 'Digite uma equação LaTeX.');
    return;
  }

  setStatus('loading', 'Validando...');

  try {
    const response = await callApi('/api/latex/validate', { latex });
    const data = await response.json();

    if (!response.ok) {
      setStatus('error', data.error || `Erro HTTP ${response.status}`);
      return;
    }

    if (data.valid) {
      setStatus('success', 'LaTeX válido ✓');
    } else {
      setStatus('error', `Inválido: ${data.message}`);
    }
  } catch (err) {
    setStatus('error', `Erro de conexão: ${err.message}`);
  }
}

async function renderEquation() {
  const latex = document.getElementById('latex-input').value.trim();
  if (!latex) {
    setStatus('error', 'Digite uma equação LaTeX.');
    return;
  }

  setStatus('loading', 'Renderizando EPS...');
  document.getElementById('btn-render').disabled = true;

  try {
    const response = await callApi('/api/latex/render', { latex });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Falha na renderização');
    }

    const arrayBuffer = await response.arrayBuffer();
    lastEpsData = new Uint8Array(arrayBuffer);
    lastLatex = latex;

    document.getElementById('btn-insert').disabled = false;
    addToHistory(latex);
    setStatus('success', `EPS gerado (${lastEpsData.length} bytes) — pronto para inserir`);
  } catch (err) {
    setStatus('error', `Erro: ${err.message}`);
    lastEpsData = null;
    document.getElementById('btn-insert').disabled = true;
  } finally {
    document.getElementById('btn-render').disabled = false;
  }
}

async function insertIntoDocument() {
  if (!lastEpsData) {
    setStatus('error', 'Renderize uma equação primeiro.');
    return;
  }

  setStatus('loading', 'Inserindo no documento...');

  try {
    const app = require('indesign').app;
    const doc = app.activeDocument;

    if (!doc) {
      setStatus('error', 'Nenhum documento aberto no InDesign.');
      return;
    }

    const fs = require('uxp').storage.localFileSystem;
    const tempFolder = await fs.getTemporaryFolder();
    const fileName = `equation_${Date.now()}.eps`;
    const tempFile = await tempFolder.createFile(fileName, { overwrite: true });

    await tempFile.write(lastEpsData, { format: require('uxp').storage.formats.binary });

    const page = doc.layoutWindows[0].activePage || doc.pages[0];
    const frame = page.rectangles.add();
    frame.geometricBounds = [50, 50, 150, 250];

    frame.place(tempFile);
    frame.fit(require('indesign').FitOptions.CONTENT_TO_FRAME);

    frame.label = 'inDesignTeX';
    frame.extractLabel('indesigntex_latex', lastLatex);

    setStatus('success', 'Equação inserida no documento ✓');
  } catch (err) {
    setStatus('error', `Erro ao inserir: ${err.message}`);
  }
}

function renderHistory() {
  const container = document.getElementById('history-list');
  const history = getHistory();

  if (history.length === 0) {
    container.innerHTML = '<p class="empty-state">Nenhuma equação renderizada ainda.</p>';
    return;
  }

  container.innerHTML = history.map((item, idx) => `
    <div class="history-item" data-index="${idx}">
      <span class="latex-preview">${escapeHtml(item.latex)}</span>
      <button class="re-insert-btn" data-latex="${escapeAttr(item.latex)}">usar</button>
    </div>
  `).join('');

  container.querySelectorAll('.re-insert-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      document.getElementById('latex-input').value = btn.dataset.latex;
    });
  });

  container.querySelectorAll('.history-item').forEach(item => {
    item.addEventListener('click', () => {
      const idx = parseInt(item.dataset.index, 10);
      document.getElementById('latex-input').value = history[idx].latex;
    });
  });
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeAttr(str) {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function initUI() {
  const settings = getSettings();
  document.getElementById('server-url').value = settings.serverUrl;
  document.getElementById('api-key').value = settings.apiKey;

  document.getElementById('btn-save-settings').addEventListener('click', () => {
    const url = document.getElementById('server-url').value.trim();
    const key = document.getElementById('api-key').value.trim();
    saveSettings(url, key);
    document.getElementById('settings-status').textContent = 'Salvo ✓';
    setTimeout(() => { document.getElementById('settings-status').textContent = ''; }, 2000);
  });

  document.getElementById('btn-validate').addEventListener('click', validateLatex);
  document.getElementById('btn-render').addEventListener('click', renderEquation);
  document.getElementById('btn-insert').addEventListener('click', insertIntoDocument);

  document.getElementById('btn-templates').addEventListener('click', () => {
    const dropdown = document.getElementById('templates-dropdown');
    dropdown.classList.toggle('hidden');
  });

  document.querySelectorAll('.dropdown-item').forEach(item => {
    item.addEventListener('click', () => {
      document.getElementById('latex-input').value = item.dataset.template;
      document.getElementById('templates-dropdown').classList.add('hidden');
    });
  });

  document.getElementById('latex-input').addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      renderEquation();
    }
  });

  renderHistory();
  setStatus('ready', 'Pronto');
}

initUI();
