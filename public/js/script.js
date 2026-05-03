const form     = document.getElementById('chat-form');
const input    = document.getElementById('user-input');
const chatBox  = document.getElementById('chat-box');
const statusEl = document.getElementById('header-status');
const sendBtn  = form.querySelector('.send-btn');

// Pesan sambutan saat halaman dimuat
window.addEventListener('DOMContentLoaded', () => {
  appendMessage('bot', 'Hai! Aku Rina dari Kedai Kopi Nusantara ☕\nMau tanya soal kopi, menu, cara seduh, atau tips bisnis UMKM kopi? Langsung tanya aja ya!');
});

form.addEventListener('submit', async function (e) {
  e.preventDefault();

  const userMessage = input.value.trim();
  if (!userMessage) return;

  setInputLocked(true);
  appendMessage('user', userMessage);
  input.value = '';

  setStatus('Sedang membalas…');
  const typingRow = showTyping();

  try {
    const res = await fetch('/generate-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: userMessage }),
    });
    const data = await res.json();
    typingRow.remove();
    appendMessage('bot', data.response || data.message || 'Maaf, tidak ada respons.');
  } catch {
    typingRow.remove();
    appendMessage('bot', 'Maaf, terjadi gangguan koneksi. Silakan coba lagi.');
  } finally {
    setStatus('Siap membantu');
    setInputLocked(false);
    input.focus();
  }
});

function appendMessage(sender, text) {
  const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  const row = document.createElement('div');
  row.classList.add('msg-row', sender);

  if (sender === 'bot') {
    const icon = document.createElement('div');
    icon.classList.add('msg-icon');
    icon.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
           stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
        <circle cx="12" cy="12" r="10"/>
        <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
        <line x1="9" y1="9" x2="9.01" y2="9"/>
        <line x1="15" y1="9" x2="15.01" y2="9"/>
      </svg>`;
    row.appendChild(icon);
  }

  const bubble = document.createElement('div');
  bubble.classList.add('bubble');

  const textEl = document.createElement('span');
  textEl.classList.add('bubble-text');
  textEl.textContent = text;

  const meta = document.createElement('div');
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
  const row = document.createElement('div');
  row.classList.add('msg-row', 'bot');

  const icon = document.createElement('div');
  icon.classList.add('msg-icon');
  icon.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
         stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
      <circle cx="12" cy="12" r="10"/>
      <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
      <line x1="9" y1="9" x2="9.01" y2="9"/>
      <line x1="15" y1="9" x2="15.01" y2="9"/>
    </svg>`;

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

function setStatus(text) {
  statusEl.textContent = text;
}

function setInputLocked(locked) {
  input.disabled  = locked;
  sendBtn.disabled = locked;
}
