(function () {
    'use strict';

    const script = document.currentScript;
    const BUSINESS_ID = script?.getAttribute('data-business-id') || '';
    const API_URL = (script?.getAttribute('data-api-url') || '').replace(/\/$/, '');

    if (!BUSINESS_ID) {
        console.warn('[UMKMWidget] data-business-id attribute is required.');
        return;
    }

    const ALLOWED_TYPES = new Set([
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf',
        'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg',
        'audio/mp4', 'audio/flac', 'audio/x-flac', 'audio/aac', 'audio/webm',
    ]);
    const MAX_FILE_SIZE = 10 * 1024 * 1024;

    const WIDGET_CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:host{position:fixed;bottom:24px;right:24px;z-index:2147483647;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:14px}

/* FAB */
.fab-wrap{position:relative;display:inline-block}
.fab{width:56px;height:56px;border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(0,0,0,.25);transition:transform .2s,box-shadow .2s;background:var(--wp,#4F46E5)}
.fab:hover{transform:scale(1.08);box-shadow:0 6px 20px rgba(0,0,0,.3)}
.fab:active{transform:scale(.96)}
.fab svg{transition:transform .25s,opacity .25s}
.fab .icon-chat{position:absolute}
.fab .icon-close{position:absolute;opacity:0;transform:rotate(-90deg) scale(.6)}
.fab.open .icon-chat{opacity:0;transform:rotate(90deg) scale(.6)}
.fab.open .icon-close{opacity:1;transform:rotate(0) scale(1)}
.badge{position:absolute;top:-3px;right:-3px;min-width:18px;height:18px;border-radius:9px;background:#EF4444;color:#fff;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;padding:0 4px;pointer-events:none;transition:transform .2s;transform:scale(1)}
.badge.hidden{transform:scale(0)}

/* Chat window */
.window{position:absolute;bottom:68px;right:0;width:360px;background:#fff;border-radius:16px;box-shadow:0 8px 40px rgba(0,0,0,.18),0 2px 8px rgba(0,0,0,.08);display:flex;flex-direction:column;overflow:hidden;border:1px solid rgba(0,0,0,.08);transform-origin:bottom right;transition:transform .25s cubic-bezier(.34,1.56,.64,1),opacity .2s;transform:scale(.85) translateY(12px);opacity:0;pointer-events:none;max-height:520px}
.window.open{transform:scale(1) translateY(0);opacity:1;pointer-events:auto}

/* Header */
.header{display:flex;align-items:center;gap:10px;padding:12px 14px;background:var(--wp,#4F46E5);flex-shrink:0}
.avatar{width:38px;height:38px;border-radius:50%;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0}
.agent-info{flex:1;min-width:0}
.agent-name{display:block;font-size:14px;font-weight:600;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.agent-status{display:flex;align-items:center;gap:4px;font-size:11px;color:rgba(255,255,255,.75)}
.status-dot{width:6px;height:6px;border-radius:50%;background:#4ADE80;flex-shrink:0;animation:pulse-dot 2.5s ease-in-out infinite}
@keyframes pulse-dot{0%,100%{opacity:1}50%{opacity:.45}}
.header-close{width:28px;height:28px;border-radius:7px;border:none;background:rgba(255,255,255,.15);cursor:pointer;color:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:background .15s}
.header-close:hover{background:rgba(255,255,255,.28)}

/* Messages */
.messages{flex:1;overflow-y:auto;padding:14px 12px 8px;display:flex;flex-direction:column;gap:8px;background:#F9FAFB;scroll-behavior:smooth}
.messages::-webkit-scrollbar{width:3px}
.messages::-webkit-scrollbar-thumb{background:#D1D5DB;border-radius:3px}

/* Row */
.row{display:flex;align-items:flex-end;gap:6px;max-width:88%}
.row.bot{align-self:flex-start}
.row.user{align-self:flex-end;flex-direction:row-reverse}
.row-icon{width:24px;height:24px;border-radius:7px;background:rgba(var(--wpr,79,70,229),.12);display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0;margin-bottom:2px}

/* Bubble */
.bubble{padding:9px 12px;border-radius:14px;font-size:13.5px;line-height:1.55;word-break:break-word;position:relative}
.row.bot .bubble{background:#fff;color:#111827;border:1px solid #E5E7EB;border-bottom-left-radius:4px}
.row.user .bubble{background:var(--wp,#4F46E5);color:#fff;border-bottom-right-radius:4px}
.bubble-text{display:block;white-space:pre-wrap;margin-bottom:3px}
.bubble-text strong{font-weight:600}
.bubble-time{font-size:10px;color:#9CA3AF;display:flex;justify-content:flex-end}
.row.user .bubble-time{color:rgba(255,255,255,.55)}

/* Typing */
.typing-bubble{display:flex;align-items:center;gap:4px;padding:10px 14px;background:#fff;border:1px solid #E5E7EB;border-radius:14px;border-bottom-left-radius:4px}
.dot{width:6px;height:6px;background:#9CA3AF;border-radius:50%;animation:bounce .9s ease-in-out infinite}
.dot:nth-child(2){animation-delay:.15s}
.dot:nth-child(3){animation-delay:.3s}
@keyframes bounce{0%,60%,100%{transform:translateY(0);opacity:.5}30%{transform:translateY(-5px);opacity:1}}

/* Footer */
.footer{border-top:1px solid #E5E7EB;background:#fff;padding:10px 12px 8px;flex-shrink:0}
.input-row{display:flex;align-items:center;gap:6px;background:#F3F4F6;border:1.5px solid #E5E7EB;border-radius:10px;padding:6px 6px 6px 8px;transition:border-color .2s}
.input-row:focus-within{border-color:var(--wp,#4F46E5);box-shadow:0 0 0 3px rgba(var(--wpr,79,70,229),.1)}
.msg-input{flex:1;border:none;outline:none;background:transparent;font-family:inherit;font-size:13.5px;color:#111827;min-width:0}
.msg-input::placeholder{color:#9CA3AF}
.send-btn{width:32px;height:32px;border-radius:8px;border:none;background:var(--wp,#4F46E5);color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:background .15s,transform .1s}
.send-btn:hover{filter:brightness(1.1)}
.send-btn:active{transform:scale(.92)}
.send-btn:disabled{background:#D1D5DB;cursor:not-allowed;transform:none}
.brand{margin-top:5px;text-align:center;font-size:10px;color:#9CA3AF}

/* Attach button */
.attach-btn{width:26px;height:26px;border-radius:6px;border:none;background:transparent;color:#9CA3AF;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;transition:color .15s,background .15s;padding:0}
.attach-btn:hover{color:var(--wp,#4F46E5);background:rgba(var(--wpr,79,70,229),.08)}
.attach-btn:disabled{opacity:.4;cursor:not-allowed}
.attach-btn--active{color:var(--wp,#4F46E5)}

/* File preview bar */
.file-prev{display:flex;align-items:center;gap:6px;padding:6px 8px;margin-bottom:6px;background:#F3F4F6;border:1.5px solid #E5E7EB;border-radius:8px}
.file-prev-content{display:flex;align-items:center;gap:6px;flex:1;min-width:0}
.prev-thumb{width:30px;height:30px;border-radius:5px;object-fit:cover;flex-shrink:0}
.prev-name{font-size:11.5px;font-weight:500;color:#1F2937;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1;min-width:0}
.prev-size{font-size:10.5px;color:#9CA3AF;flex-shrink:0;white-space:nowrap}
.prev-remove{width:20px;height:20px;border-radius:5px;border:none;background:transparent;color:#9CA3AF;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;padding:0;transition:color .15s}
.prev-remove:hover{color:#EF4444}

/* Attachment in bubble */
.bubble-img{display:block;max-width:180px;max-height:150px;border-radius:8px;object-fit:cover;margin-bottom:4px}
.file-chip{display:flex;align-items:center;gap:5px;padding:5px 8px;background:rgba(255,255,255,.18);border-radius:7px;margin-bottom:4px;max-width:180px}
.row.bot .file-chip{background:#F3F4F6}
.chip-icon{font-size:13px;flex-shrink:0}
.chip-name{font-size:11.5px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

/* Error toast */
.file-toast{align-self:center;padding:5px 12px;background:#FEF2F2;border:1px solid #FECACA;border-radius:8px;font-size:11.5px;color:#B91C1C;text-align:center;animation:fadein .2s ease}
@keyframes fadein{from{opacity:0;transform:translateY(3px)}to{opacity:1;transform:translateY(0)}}
`;

    const ICON_CHAT   = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;
    const ICON_CLOSE  = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
    const ICON_SEND   = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`;
    const ICON_BOT    = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>`;
    const ICON_ATTACH = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.41 17.41a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>`;
    const ICON_X_SM   = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;

    let config        = null;
    let messages      = [];
    let welcomeMsg    = '';
    let isOpen        = false;
    let isWaiting     = false;
    let unreadCount   = 0;
    let sessionTtlMs  = 60 * 60 * 1000;
    let pendingFile   = null;

    const SESSION_KEY = `umkm_widget_${BUSINESS_ID}`;

    function loadSession() {
        try {
            const raw = sessionStorage.getItem(SESSION_KEY);
            if (!raw) return;
            const { messages: saved, savedAt } = JSON.parse(raw);
            if (Date.now() - savedAt > sessionTtlMs) {
                sessionStorage.removeItem(SESSION_KEY);
                return;
            }
            messages = Array.isArray(saved) ? saved : [];
        } catch { /* ignore */ }
    }

    function saveSession() {
        try {
            sessionStorage.setItem(SESSION_KEY, JSON.stringify({
                messages: messages.slice(-40),
                savedAt: Date.now(),
            }));
        } catch { /* ignore */ }
    }

    const host = document.createElement('div');
    host.id = 'umkm-chat-widget';
    const shadow = host.attachShadow({ mode: 'open' });

    const styleEl = document.createElement('style');
    styleEl.textContent = WIDGET_CSS;
    shadow.appendChild(styleEl);

    const root = document.createElement('div');
    root.innerHTML = `
<div class="fab-wrap">
  <button class="fab" aria-label="Buka chat">
    <span class="icon-chat">${ICON_CHAT}</span>
    <span class="icon-close">${ICON_CLOSE}</span>
  </button>
  <span class="badge hidden" id="badge"></span>
</div>

<div class="window" role="dialog" aria-label="Chat widget">
  <div class="header">
    <div class="avatar" id="agent-avatar">🤖</div>
    <div class="agent-info">
      <span class="agent-name" id="agent-name">AI Assistant</span>
      <span class="agent-status">
        <span class="status-dot"></span>
        <span id="agent-status">Online</span>
      </span>
    </div>
    <button class="header-close" aria-label="Tutup chat">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
  </div>
  <div class="messages" id="messages"></div>
  <div class="footer">
    <input type="file" id="file-input" accept="image/jpeg,image/png,image/gif,image/webp,application/pdf,audio/*" style="display:none"/>
    <div class="file-prev" id="file-prev" style="display:none">
      <div class="file-prev-content" id="file-prev-content"></div>
      <button type="button" class="prev-remove" id="file-remove" aria-label="Hapus berkas">${ICON_X_SM}</button>
    </div>
    <div class="input-row">
      <button type="button" class="attach-btn" id="attach-btn" aria-label="Lampirkan berkas">${ICON_ATTACH}</button>
      <input class="msg-input" id="msg-input" type="text" placeholder="Ketik pesan…" maxlength="500" autocomplete="off"/>
      <button class="send-btn" id="send-btn" aria-label="Kirim">${ICON_SEND}</button>
    </div>
    <p class="brand" id="brand-text">Powered by Karsa Wave</p>
  </div>
</div>
`;
    shadow.appendChild(root);
    document.body.appendChild(host);

    const fab            = shadow.querySelector('.fab');
    const badge          = shadow.getElementById('badge');
    const chatWindow     = shadow.querySelector('.window');
    const messagesEl     = shadow.getElementById('messages');
    const inputEl        = shadow.getElementById('msg-input');
    const sendBtn        = shadow.getElementById('send-btn');
    const attachBtn      = shadow.getElementById('attach-btn');
    const fileInput      = shadow.getElementById('file-input');
    const filePrev       = shadow.getElementById('file-prev');
    const filePrevContent= shadow.getElementById('file-prev-content');
    const fileRemoveBtn  = shadow.getElementById('file-remove');
    const agentAvatar    = shadow.getElementById('agent-avatar');
    const agentName      = shadow.getElementById('agent-name');
    const agentStatus    = shadow.getElementById('agent-status');
    const brandText      = shadow.getElementById('brand-text');
    const headerClose    = shadow.querySelector('.header-close');

    function applyTheme(color) {
        const hex = color || '#4F46E5';
        root.style.setProperty('--wp', hex);
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        root.style.setProperty('--wpr', `${r},${g},${b}`);
    }

    function renderText(raw) {
        const el = document.createElement('span');
        el.className = 'bubble-text';
        let text = raw
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');
        text = text.replace(/\n/g, '<br>');
        el.innerHTML = text;
        return el;
    }

    function createAttachmentEl(file) {
        if (file.type.startsWith('image/')) {
            const img = document.createElement('img');
            img.className = 'bubble-img';
            img.src = URL.createObjectURL(file);
            img.alt = file.name;
            return img;
        }
        const chip = document.createElement('div');
        chip.className = 'file-chip';
        const icon = document.createElement('span');
        icon.className = 'chip-icon';
        icon.textContent = file.type.startsWith('audio/') ? '🎵' : '📄';
        const name = document.createElement('span');
        name.className = 'chip-name';
        name.textContent = file.name.length > 26 ? file.name.slice(0, 23) + '…' : file.name;
        chip.appendChild(icon);
        chip.appendChild(name);
        return chip;
    }

    function appendMessage(role, content, attachment = null) {
        const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        const row = document.createElement('div');
        row.className = `row ${role === 'model' ? 'bot' : 'user'}`;

        if (role === 'model') {
            const icon = document.createElement('div');
            icon.className = 'row-icon';
            icon.innerHTML = agentAvatar.textContent
                ? `<span style="font-size:13px">${agentAvatar.textContent}</span>`
                : ICON_BOT;
            row.appendChild(icon);
        }

        const bubble = document.createElement('div');
        bubble.className = 'bubble';

        if (attachment && role === 'user') {
            bubble.appendChild(createAttachmentEl(attachment));
        }

        if (content) bubble.appendChild(renderText(content));

        const meta = document.createElement('div');
        meta.className = 'bubble-time';
        meta.textContent = time;
        bubble.appendChild(meta);

        row.appendChild(bubble);
        messagesEl.appendChild(row);
        scrollToBottom();
        return row;
    }

    function showTyping() {
        const row = document.createElement('div');
        row.className = 'row bot';
        const icon = document.createElement('div');
        icon.className = 'row-icon';
        icon.innerHTML = `<span style="font-size:13px">${agentAvatar.textContent || '🤖'}</span>`;
        const bubble = document.createElement('div');
        bubble.className = 'typing-bubble';
        for (let i = 0; i < 3; i++) {
            const d = document.createElement('div');
            d.className = 'dot';
            bubble.appendChild(d);
        }
        row.appendChild(icon);
        row.appendChild(bubble);
        messagesEl.appendChild(row);
        scrollToBottom();
        return row;
    }

    function showFileError(msg) {
        const el = document.createElement('div');
        el.className = 'file-toast';
        el.textContent = msg;
        messagesEl.appendChild(el);
        scrollToBottom();
        setTimeout(() => el.remove(), 4000);
    }

    function scrollToBottom() {
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function formatBytes(bytes) {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    // ── File attachment ──
    attachBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', () => {
        const file = fileInput.files[0];
        fileInput.value = '';
        if (!file) return;

        if (!ALLOWED_TYPES.has(file.type)) {
            showFileError('Tipe file tidak didukung. Gunakan gambar, PDF, atau audio.');
            return;
        }
        if (file.size > MAX_FILE_SIZE) {
            showFileError('File terlalu besar. Maksimum 10 MB.');
            return;
        }
        setPendingFile(file);
    });

    fileRemoveBtn.addEventListener('click', clearPendingFile);

    function setPendingFile(file) {
        pendingFile = file;
        filePrevContent.innerHTML = '';

        if (file.type.startsWith('image/')) {
            const img = document.createElement('img');
            img.className = 'prev-thumb';
            img.src = URL.createObjectURL(file);
            img.alt = file.name;
            filePrevContent.appendChild(img);
        }

        const nameEl = document.createElement('span');
        nameEl.className = 'prev-name';
        nameEl.textContent = file.name.length > 30 ? file.name.slice(0, 27) + '…' : file.name;
        filePrevContent.appendChild(nameEl);

        const sizeEl = document.createElement('span');
        sizeEl.className = 'prev-size';
        sizeEl.textContent = formatBytes(file.size);
        filePrevContent.appendChild(sizeEl);

        filePrev.style.display = 'flex';
        attachBtn.classList.add('attach-btn--active');
    }

    function clearPendingFile() {
        pendingFile = null;
        filePrevContent.innerHTML = '';
        filePrev.style.display = 'none';
        attachBtn.classList.remove('attach-btn--active');
    }

    function setUnread(n) {
        unreadCount = n;
        badge.textContent = n > 9 ? '9+' : n;
        badge.classList.toggle('hidden', n === 0);
    }

    function setStatus(text) {
        agentStatus.textContent = text;
    }

    function setLocked(locked) {
        isWaiting = locked;
        inputEl.disabled = locked;
        sendBtn.disabled = locked;
        attachBtn.disabled = locked;
        setStatus(locked ? 'Sedang mengetik…' : 'Online');
    }

    function openWidget() {
        isOpen = true;
        chatWindow.classList.add('open');
        fab.classList.add('open');
        setUnread(0);
        setTimeout(() => inputEl.focus(), 250);
        if (messagesEl.children.length === 0) {
            if (messages.length > 0) {
                for (const m of messages) appendMessage(m.role, m.content);
            } else if (welcomeMsg) {
                appendMessage('model', welcomeMsg);
            }
        }
    }

    function closeWidget() {
        isOpen = false;
        chatWindow.classList.remove('open');
        fab.classList.remove('open');
    }

    fab.addEventListener('click', () => isOpen ? closeWidget() : openWidget());
    headerClose.addEventListener('click', closeWidget);

    async function sendMessage() {
        const text = inputEl.value.trim();
        const file = pendingFile;

        if ((!text && !file) || isWaiting) return;

        inputEl.value = '';
        clearPendingFile();

        messages.push({ role: 'user', content: text || '[Berkas dikirim]' });
        appendMessage('user', text, file);
        saveSession();

        setLocked(true);
        const typingRow = showTyping();

        try {
            let res;

            if (file) {
                const fd = new FormData();
                fd.append('businessId', BUSINESS_ID);
                fd.append('messages', JSON.stringify(messages));
                fd.append('file', file);
                res = await fetch(`${API_URL}/widget/chat/file`, { method: 'POST', body: fd });
            } else {
                res = await fetch(`${API_URL}/widget/chat`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ businessId: BUSINESS_ID, messages }),
                });
            }

            const data = await res.json();
            typingRow.remove();

            if (!res.ok) {
                messages.pop();
                saveSession();
                appendMessage('model', data.message || 'Maaf, terjadi kesalahan. Silakan coba lagi.');
                if (!isOpen) setUnread(unreadCount + 1);
                return;
            }

            const reply = data.response || 'Maaf, tidak ada respons.';
            messages.push({ role: 'model', content: reply });
            appendMessage('model', reply);
            saveSession();

            if (!isOpen) setUnread(unreadCount + 1);
        } catch {
            typingRow.remove();
            messages.pop();
            saveSession();
            appendMessage('model', 'Maaf, terjadi gangguan koneksi. Silakan coba lagi.');
            if (!isOpen) setUnread(unreadCount + 1);
        } finally {
            setLocked(false);
            if (isOpen) inputEl.focus();
        }
    }

    sendBtn.addEventListener('click', sendMessage);
    inputEl.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    });

    async function init() {
        try {
            const res = await fetch(`${API_URL}/widget/config/${BUSINESS_ID}`);
            if (!res.ok) throw new Error('config not found');
            config = await res.json();

            if (config.sessionTtlMinutes) {
                sessionTtlMs = config.sessionTtlMinutes * 60 * 1000;
            }

            agentAvatar.textContent = config.agentAvatar || '🤖';
            agentName.textContent   = config.agentName   || 'AI Assistant';
            brandText.textContent   = config.footerText  || 'Powered by Karsa Wave';
            if (config.primaryColor) applyTheme(config.primaryColor);
        } catch (err) {
            console.warn('[UMKMWidget] Failed to load config:', err.message);
            agentName.textContent = 'AI Assistant';
        }

        loadSession();

        // welcomeMsg tidak masuk messages[] supaya tidak ikut dikirim ke API
        if (messages.length === 0 && config?.welcomeMessage) {
            welcomeMsg = config.welcomeMessage;
            setTimeout(() => setUnread(1), 1500);
        }
    }

    init();
})();
