// ── Constants ──
const ALLOWED_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg',
  'audio/mp4', 'audio/flac', 'audio/x-flac', 'audio/aac', 'audio/webm',
]);
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

// ── State ──
let currentBusiness = null;
let messageHistory  = [];
let pendingFile     = null;

// ── Elements ──
const selectorScreen  = document.getElementById('selector-screen');
const chatScreen      = document.getElementById('chat-screen');
const businessList    = document.getElementById('business-list');
const chatBox         = document.getElementById('chat-box');
const chatForm        = document.getElementById('chat-form');
const userInput       = document.getElementById('user-input');
const statusEl        = document.getElementById('header-status');
const sendBtn         = chatForm.querySelector('.send-btn');
const attachBtn       = document.getElementById('attach-btn');
const fileInput       = document.getElementById('file-input');
const filePreviewBar  = document.getElementById('file-preview-bar');
const filePreviewContent = document.getElementById('file-preview-content');
const fileRemoveBtn   = document.getElementById('file-remove-btn');
const chatAvatar      = document.getElementById('chat-avatar');
const chatHeaderName  = document.getElementById('chat-header-name');
const chatFooterNote  = document.getElementById('chat-footer-note');
const backBtn         = document.getElementById('back-btn');

// ── Boot ──
window.addEventListener('DOMContentLoaded', loadBusinesses);

async function loadBusinesses() {
  try {
    const res  = await fetch('/widget/businesses');
    const list = await res.json();
    renderBusinessList(list);
  } catch {
    businessList.innerHTML = '<p class="selector-error">Gagal memuat daftar usaha. Coba refresh halaman.</p>';
  }
}

function renderBusinessList(list) {
  businessList.innerHTML = '';
  for (const biz of list) {
    const card = document.createElement('button');
    card.className = 'biz-card';
    card.style.setProperty('--biz-color', biz.primaryColor || '#4F46E5');
    card.innerHTML = `
      <span class="biz-avatar">${biz.agentAvatar}</span>
      <span class="biz-info">
        <span class="biz-name">${biz.businessName}</span>
        <span class="biz-agent">Dibantu oleh ${biz.agentName}</span>
      </span>
      <svg class="biz-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
        <polyline points="9 18 15 12 9 6"/>
      </svg>`;
    card.addEventListener('click', () => startChat(biz));
    businessList.appendChild(card);
  }
}

function startChat(biz) {
  currentBusiness = biz;
  messageHistory  = [];

  chatAvatar.textContent      = biz.agentAvatar;
  chatAvatar.style.fontSize   = '22px';
  chatAvatar.style.background = hexToAlpha(biz.primaryColor, 0.12);
  chatHeaderName.textContent  = `${biz.agentName} · ${biz.businessName}`;
  chatFooterNote.textContent  = biz.footerText || `${biz.businessName} · Powered by AI`;

  document.documentElement.style.setProperty('--primary', biz.primaryColor || '#4F46E5');
  document.documentElement.style.setProperty('--primary-dark', darken(biz.primaryColor, 20));
  document.documentElement.style.setProperty('--primary-light', hexToAlpha(biz.primaryColor, 0.1));

  selectorScreen.style.display = 'none';
  chatScreen.style.display     = 'flex';

  chatBox.innerHTML = '';
  clearPendingFile();
  appendMessage('bot', biz.welcomeMessage);
  userInput.focus();
}

backBtn.addEventListener('click', () => {
  chatScreen.style.display     = 'none';
  selectorScreen.style.display = 'flex';
  currentBusiness = null;
  messageHistory  = [];
  clearPendingFile();
});

// ── File attachment ──
attachBtn.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', () => {
  const file = fileInput.files[0];
  fileInput.value = ''; // reset so same file can be re-selected

  if (!file) return;

  if (!ALLOWED_TYPES.has(file.type)) {
    showFileError('Tipe file tidak didukung. Gunakan gambar, PDF, atau audio.');
    return;
  }
  if (file.size > MAX_FILE_SIZE) {
    showFileError('Ukuran file terlalu besar. Maksimum 10 MB.');
    return;
  }

  setPendingFile(file);
});

fileRemoveBtn.addEventListener('click', clearPendingFile);

function setPendingFile(file) {
  pendingFile = file;
  renderFilePreview(file);
  filePreviewBar.style.display = 'flex';
  attachBtn.classList.add('attach-btn--active');
}

function clearPendingFile() {
  pendingFile = null;
  filePreviewContent.innerHTML = '';
  filePreviewBar.style.display = 'none';
  attachBtn.classList.remove('attach-btn--active');
}

function renderFilePreview(file) {
  filePreviewContent.innerHTML = '';

  if (file.type.startsWith('image/')) {
    const img = document.createElement('img');
    img.classList.add('preview-thumb');
    img.src = URL.createObjectURL(file);
    img.alt = file.name;
    filePreviewContent.appendChild(img);
  }

  const nameEl = document.createElement('span');
  nameEl.classList.add('preview-name');
  nameEl.textContent = file.name.length > 32 ? file.name.slice(0, 29) + '…' : file.name;
  filePreviewContent.appendChild(nameEl);

  const sizeEl = document.createElement('span');
  sizeEl.classList.add('preview-size');
  sizeEl.textContent = formatBytes(file.size);
  filePreviewContent.appendChild(sizeEl);
}

function showFileError(msg) {
  const el = document.createElement('p');
  el.classList.add('file-error-toast');
  el.textContent = msg;
  chatBox.appendChild(el);
  chatBox.scrollTop = chatBox.scrollHeight;
  setTimeout(() => el.remove(), 4000);
}

// ── Chat ──
chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = userInput.value.trim();
  const file = pendingFile;

  if ((!text && !file) || !currentBusiness) return;

  setInputLocked(true);
  appendMessage('user', text, file);
  userInput.value = '';
  clearPendingFile();

  messageHistory.push({ role: 'user', content: text || '[Berkas dikirim]' });

  setStatus('Sedang membalas…');
  const typingRow = showTyping();

  try {
    let data;

    if (file) {
      const fd = new FormData();
      fd.append('businessId', currentBusiness.businessId);
      fd.append('messages', JSON.stringify(messageHistory));
      fd.append('file', file);

      const res = await fetch('/widget/chat/file', { method: 'POST', body: fd });
      data = await res.json();
    } else {
      const res = await fetch('/widget/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ businessId: currentBusiness.businessId, messages: messageHistory }),
      });
      data = await res.json();
    }

    typingRow.remove();
    const reply = data.response || data.message || 'Maaf, tidak ada respons.';
    appendMessage('bot', reply);
    messageHistory.push({ role: 'model', content: reply });
  } catch {
    typingRow.remove();
    appendMessage('bot', 'Maaf, terjadi gangguan koneksi. Silakan coba lagi.');
    messageHistory.pop();
  } finally {
    setStatus('Siap membantu');
    setInputLocked(false);
    userInput.focus();
  }
});

// ── Helpers ──
function appendMessage(sender, text, attachment = null) {
  const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const row  = document.createElement('div');
  row.classList.add('msg-row', sender);

  if (sender === 'bot') {
    const icon = document.createElement('div');
    icon.classList.add('msg-icon');
    if (currentBusiness) {
      icon.textContent      = currentBusiness.agentAvatar;
      icon.style.fontSize   = '14px';
      icon.style.background = hexToAlpha(currentBusiness.primaryColor, 0.12);
    } else {
      icon.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
           stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
        <circle cx="12" cy="12" r="10"/>
        <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
        <line x1="9" y1="9" x2="9.01" y2="9"/>
        <line x1="15" y1="9" x2="15.01" y2="9"/>
      </svg>`;
    }
    row.appendChild(icon);
  }

  const bubble = document.createElement('div');
  bubble.classList.add('bubble');

  // Attachment preview (user side only)
  if (attachment && sender === 'user') {
    const attachEl = createAttachmentPreview(attachment);
    if (attachEl) bubble.appendChild(attachEl);
  }

  if (text) {
    const textEl = document.createElement('span');
    textEl.classList.add('bubble-text');
    textEl.textContent = text;
    bubble.appendChild(textEl);
  }

  const meta   = document.createElement('div');
  meta.classList.add('bubble-meta');
  const timeEl = document.createElement('span');
  timeEl.classList.add('bubble-time');
  timeEl.textContent = time;
  meta.appendChild(timeEl);

  bubble.appendChild(meta);
  row.appendChild(bubble);
  chatBox.appendChild(row);
  chatBox.scrollTop = chatBox.scrollHeight;
  return row;
}

function createAttachmentPreview(file) {
  if (file.type.startsWith('image/')) {
    const img = document.createElement('img');
    img.classList.add('bubble-img');
    img.src = URL.createObjectURL(file);
    img.alt = file.name;
    return img;
  }

  const chip = document.createElement('div');
  chip.classList.add('bubble-file-chip');

  const icon = document.createElement('span');
  icon.classList.add('chip-icon');
  icon.textContent = file.type.startsWith('audio/') ? '🎵' : '📄';

  const name = document.createElement('span');
  name.classList.add('chip-name');
  name.textContent = file.name.length > 28 ? file.name.slice(0, 25) + '…' : file.name;

  chip.appendChild(icon);
  chip.appendChild(name);
  return chip;
}

function showTyping() {
  const row  = document.createElement('div');
  row.classList.add('msg-row', 'bot');

  const icon = document.createElement('div');
  icon.classList.add('msg-icon');
  if (currentBusiness) {
    icon.textContent      = currentBusiness.agentAvatar;
    icon.style.fontSize   = '14px';
    icon.style.background = hexToAlpha(currentBusiness.primaryColor, 0.12);
  }

  const bubble = document.createElement('div');
  bubble.classList.add('typing-bubble');
  for (let i = 0; i < 3; i++) {
    const dot = document.createElement('div');
    dot.classList.add('typing-dot');
    bubble.appendChild(dot);
  }

  row.appendChild(icon);
  row.appendChild(bubble);
  chatBox.appendChild(row);
  chatBox.scrollTop = chatBox.scrollHeight;
  return row;
}

function setStatus(text)        { statusEl.textContent = text; }
function setInputLocked(locked) { userInput.disabled = sendBtn.disabled = attachBtn.disabled = locked; }

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function hexToAlpha(hex, alpha) {
  const r = parseInt((hex || '#4F46E5').slice(1, 3), 16);
  const g = parseInt((hex || '#4F46E5').slice(3, 5), 16);
  const b = parseInt((hex || '#4F46E5').slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function darken(hex, amount) {
  const num = parseInt((hex || '#4F46E5').replace('#', ''), 16);
  const r   = Math.max(0, (num >> 16) - amount);
  const g   = Math.max(0, ((num >> 8) & 0xff) - amount);
  const b   = Math.max(0, (num & 0xff) - amount);
  return `#${[r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')}`;
}
