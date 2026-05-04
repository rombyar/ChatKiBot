// ── State ──
let currentBusiness = null;
let messageHistory  = [];

// ── Elements ──
const selectorScreen  = document.getElementById('selector-screen');
const chatScreen      = document.getElementById('chat-screen');
const businessList    = document.getElementById('business-list');
const chatBox         = document.getElementById('chat-box');
const chatForm        = document.getElementById('chat-form');
const userInput       = document.getElementById('user-input');
const statusEl        = document.getElementById('header-status');
const sendBtn         = chatForm.querySelector('.send-btn');
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

  // Update chat header
  chatAvatar.textContent      = biz.agentAvatar;
  chatAvatar.style.fontSize   = '22px';
  chatAvatar.style.background = hexToAlpha(biz.primaryColor, 0.12);
  chatHeaderName.textContent  = `${biz.agentName} · ${biz.businessName}`;
  chatFooterNote.textContent  = biz.footerText || `${biz.businessName} · Powered by AI`;

  // Set primary color CSS var
  document.documentElement.style.setProperty('--primary', biz.primaryColor || '#4F46E5');
  document.documentElement.style.setProperty('--primary-dark', darken(biz.primaryColor, 20));
  document.documentElement.style.setProperty('--primary-light', hexToAlpha(biz.primaryColor, 0.1));

  // Switch screens
  selectorScreen.style.display = 'none';
  chatScreen.style.display     = 'flex';

  // Clear old messages and show welcome
  chatBox.innerHTML = '';
  appendMessage('bot', biz.welcomeMessage);
  userInput.focus();
}

backBtn.addEventListener('click', () => {
  chatScreen.style.display     = 'none';
  selectorScreen.style.display = 'flex';
  currentBusiness = null;
  messageHistory  = [];
});

// ── Chat ──
chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = userInput.value.trim();
  if (!text || !currentBusiness) return;

  setInputLocked(true);
  appendMessage('user', text);
  userInput.value = '';

  messageHistory.push({ role: 'user', content: text });

  setStatus('Sedang membalas…');
  const typingRow = showTyping();

  try {
    const res  = await fetch('/widget/chat', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ businessId: currentBusiness.businessId, messages: messageHistory }),
    });
    const data = await res.json();
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
function appendMessage(sender, text) {
  const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const row  = document.createElement('div');
  row.classList.add('msg-row', sender);

  if (sender === 'bot') {
    const icon = document.createElement('div');
    icon.classList.add('msg-icon');
    if (currentBusiness) {
      icon.textContent  = currentBusiness.agentAvatar;
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

  const bubble  = document.createElement('div');
  bubble.classList.add('bubble');

  const textEl = document.createElement('span');
  textEl.classList.add('bubble-text');
  textEl.textContent = text;

  const meta   = document.createElement('div');
  meta.classList.add('bubble-meta');
  const timeEl = document.createElement('span');
  timeEl.classList.add('bubble-time');
  timeEl.textContent = time;
  meta.appendChild(timeEl);

  bubble.appendChild(textEl);
  bubble.appendChild(meta);
  row.appendChild(bubble);
  chatBox.appendChild(row);
  chatBox.scrollTop = chatBox.scrollHeight;
  return row;
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

function setStatus(text)         { statusEl.textContent = text; }
function setInputLocked(locked)  { userInput.disabled = sendBtn.disabled = locked; }

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
