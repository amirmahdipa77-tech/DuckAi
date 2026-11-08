/* DuckAi — full browser chat client.
   Talks to any OpenAI-compatible /chat/completions endpoint (default: text.pollinations.ai,
   free + CORS-enabled). Nothing leaves the browser except the model requests themselves. */
(() => {
  'use strict';

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));

  const LS_CHATS = 'duckai.chats.v2';
  const LS_SET = 'duckai.settings.v2';
  const MAX_CTX = 24; // messages sent as context

  const DEFAULTS = {
    baseUrl: 'https://text.pollinations.ai/openai',
    apiKey: '',
    model: 'openai-fast',
    system: '',
    temperature: 0.7,
    stream: true,
    lang: 'fa',
    theme: 'dark',
    tts: false,
    models: [{ id: 'openai-fast', desc: 'GPT-OSS 20B · reasoning' }]
  };

  const I18N = {
    fa: {
      dir: 'rtl', title: 'DuckAi — چت', brand: 'DuckAi',
      newChat: 'گفتگوی جدید', settings: 'تنظیمات', theme: 'تغییر تم', lang: 'English',
      placeholder: 'پیامت را بنویس… (Shift+Enter برای خط جدید)',
      hint: 'Enter ارسال · Shift+Enter خط جدید · /draw برای ساخت تصویر',
      welcomeTitle: 'با <span class="grad">DuckAi</span> چت کن',
      welcomeSub: 'بدون کلید API، بدون حساب، بدون اشتراک — مستقیم در مرورگر. مدلها، تاریخچه و همهچیز سمت خودت میماند.',
      chips: [
        ['💡', 'یک مفهوم را ساده توضیح بده', 'مثلاً: وکتور دیتابیس چیست؟'],
        ['🧑‍💻', 'کد بنویس یا دیباگ کن', 'مثلاً: یک تابع پایتون برای خواندن CSV'],
        ['✍️', 'متن بنویس و بازنویسی کن', 'مثلاً: یک ایمیل رسمی برای درخواست مرخصی'],
        ['🎨', 'تصویر بساز', 'مثلاً: /draw یک اردک فضانورد']
      ],
      you: 'تو', ai: 'DuckAi', thinking: 'در حال فکر کردن…', reasoning: 'مراحل فکر کردن',
      copy: 'کپی', copied: 'کپی شد', speak: 'خواندن', stop: 'توقف',
      regen: 'تولید دوباره', del: 'حذف', exportBtn: 'خروجی',
      emptyConvs: 'هنوز گفتگویی نداری', untitled: 'گفتگوی بدون عنوان',
      settingsTitle: 'تنظیمات', settingsSub: 'همهچیز فقط در همین مرورگر ذخیره میشود.',
      baseUrl: 'آدرس API (سازگار با OpenAI)', apiKey: 'کلید API (اختیاری)', model: 'مدل',
      temperature: 'خلاقیت (temperature)', system: 'دستور سیستمی',
      stream: 'پاسخ جریانی (streaming)', ttsAuto: 'خواندن خودکار پاسخها',
      language: 'زبان رابط', themeLabel: 'تم', clearAll: 'پاک کردن همهٔ گفتگوها',
      save: 'ذخیره', close: 'بستن', chooseModel: 'انتخاب مدل', refresh: 'بهروزرسانی فهرست',
      clearConfirm: 'همهٔ گفتگوها پاک شوند؟ این کار برگشتپذیر نیست.',
      sendFail: 'ارسال نشد', imgFail: 'ساخت تصویر ناموفق بود',
      emptyMsg: 'پیام خالی است', noMic: 'مرورگر از دیکته پشتیبانی نمیکند',
      listening: 'در حال شنیدن…', stopListen: 'پایان دیکته',
      imgMode: 'حالت تصویر', imgModeOn: 'حالت تصویر روشن است — هر پیام یک تصویر میسازد',
      genImg: 'در حال ساخت تصویر…', modelBadge: 'مدل'
    },
    en: {
      dir: 'ltr', title: 'DuckAi — Chat', brand: 'DuckAi',
      newChat: 'New chat', settings: 'Settings', theme: 'Toggle theme', lang: 'فارسی',
      placeholder: 'Type a message… (Shift+Enter for a new line)',
      hint: 'Enter to send · Shift+Enter for newline · /draw to make an image',
      welcomeTitle: 'Chat with <span class="grad">DuckAi</span>',
      welcomeSub: 'No API key, no account, no subscription — right in your browser. Models and history stay on your device.',
      chips: [
        ['💡', 'Explain a concept simply', 'e.g. what is a vector database?'],
        ['🧑‍💻', 'Write or debug code', 'e.g. a Python function that reads CSV'],
        ['✍️', 'Draft and rewrite text', 'e.g. a formal leave-request email'],
        ['🎨', 'Generate an image', 'e.g. /draw an astronaut duck']
      ],
      you: 'You', ai: 'DuckAi', thinking: 'Thinking…', reasoning: 'Reasoning',
      copy: 'Copy', copied: 'Copied', speak: 'Read aloud', stop: 'Stop',
      regen: 'Regenerate', del: 'Delete', exportBtn: 'Export',
      emptyConvs: 'No conversations yet', untitled: 'Untitled chat',
      settingsTitle: 'Settings', settingsSub: 'Everything is stored in this browser only.',
      baseUrl: 'API endpoint (OpenAI-compatible)', apiKey: 'API key (optional)', model: 'Model',
      temperature: 'Creativity (temperature)', system: 'System prompt',
      stream: 'Stream responses', ttsAuto: 'Read answers aloud automatically',
      language: 'Interface language', themeLabel: 'Theme', clearAll: 'Delete all conversations',
      save: 'Save', close: 'Close', chooseModel: 'Choose a model', refresh: 'Refresh list',
      clearConfirm: 'Delete all conversations? This cannot be undone.',
      sendFail: 'Send failed', imgFail: 'Image generation failed',
      emptyMsg: 'Message is empty', noMic: 'This browser has no speech recognition',
      listening: 'Listening…', stopListen: 'Stop dictation',
      imgMode: 'Image mode', imgModeOn: 'Image mode is on — every message becomes an image',
      genImg: 'Generating image…', modelBadge: 'model'
    }
  };
  let t = I18N[DEFAULTS.lang];

  /* ---------------- state ---------------- */
  let S = load(LS_SET, DEFAULTS);
  S = Object.assign({}, DEFAULTS, S);
  if (!S.models || !S.models.length) S.models = DEFAULTS.models.slice();
  let chats = load(LS_CHATS, []);
  let activeId = chats.length ? chats[0].id : null;
  let controller = null;
  let busy = false;
  let imgMode = false;
  let codeStore = [];
  let recognizer = null;

  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  function load(key, fallback) {
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
    catch (e) { return fallback; }
  }
  function save() {
    try {
      localStorage.setItem(LS_SET, JSON.stringify(S));
      localStorage.setItem(LS_CHATS, JSON.stringify(chats));
    } catch (e) { toast('Storage full or blocked', true); }
  }
  function activeChat() { return chats.find((c) => c.id === activeId) || null; }

  /* ---------------- markdown ---------------- */
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function inlineMd(s) {
    return s
      .replace(/`([^`\n]+)`/g, (m, c) => `<code>${c}</code>`)
      .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[\s(])\*([^*\n]+)\*/g, '$1<em>$2</em>')
      .replace(/(^|[\s(])_([^_\n]+)_/g, '$1<em>$2</em>')
      .replace(/~~([^~\n]+)~~/g, '<del>$1</del>')
      .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
      .replace(/(^|\s)(https?:\/\/[^\s<]+)/g, '$1<a href="$2" target="_blank" rel="noopener noreferrer">$2</a>');
  }

  function renderMd(src) {
    codeStore = [];
    const blocks = [];
    let text = String(src == null ? '' : src).replace(/```([a-zA-Z0-9+#.-]*)\n?([\s\S]*?)```/g, (m, lang, code) => {
      blocks.push({ lang: lang || 'text', code });
      return `\u0000CB${blocks.length - 1}\u0000`;
    });
    text = esc(text);

    const lines = text.split('\n');
    const out = [];
    let i = 0;
    const ulRe = /^\s*[-*+]\s+/;
    const olRe = /^\s*\d+[.)]\s+/;

    while (i < lines.length) {
      const line = lines[i];

      if (/^\u0000CB\d+\u0000$/.test(line.trim())) { out.push(line.trim()); i++; continue; }
      if (!line.trim()) { i++; continue; }
      if (/^#{1,6}\s/.test(line)) {
        const m = line.match(/^(#{1,6})\s+(.*)$/);
        const lv = Math.min(m[1].length, 4);
        out.push(`<h${lv}>${inlineMd(m[2])}</h${lv}>`); i++; continue;
      }
      if (/^\s*(?:---+|\*\*\*+|___+)\s*$/.test(line)) { out.push('<hr>'); i++; continue; }
      if (/^&gt;\s?/.test(line) || /^>\s?/.test(line)) {
        const buf = [];
        while (i < lines.length && (/^&gt;\s?/.test(lines[i]) || /^>\s?/.test(lines[i]))) {
          buf.push(lines[i].replace(/^&gt;\s?/, '').replace(/^>\s?/, '')); i++;
        }
        out.push(`<blockquote>${inlineMd(buf.join(' '))}</blockquote>`); continue;
      }
      if (line.includes('|') && lines[i + 1] && /^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(lines[i + 1])) {
        const cells = (r) => r.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map((c) => inlineMd(c.trim()));
        const head = cells(line); i += 2;
        const rows = [];
        while (i < lines.length && lines[i].includes('|') && lines[i].trim()) { rows.push(cells(lines[i])); i++; }
        out.push(`<div class="tbl"><table><thead><tr>${head.map((c) => `<th>${c}</th>`).join('')}</tr></thead><tbody>${
          rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);
        continue;
      }
      if (ulRe.test(line) || olRe.test(line)) {
        const ordered = olRe.test(line);
        const items = [];
        while (i < lines.length && (ulRe.test(lines[i]) || olRe.test(lines[i]))) {
          items.push(`<li>${inlineMd(lines[i].replace(ulRe, '').replace(olRe, ''))}</li>`); i++;
        }
        out.push(ordered ? `<ol>${items.join('')}</ol>` : `<ul>${items.join('')}</ul>`);
        continue;
      }
      const buf = [];
      while (i < lines.length && lines[i].trim() && !/^(#{1,6}\s|&gt;|>|\s*[-*+]\s|\s*\d+[.)]\s)/.test(lines[i]) && !/^\u0000CB\d+\u0000$/.test(lines[i].trim())) {
        buf.push(lines[i]); i++;
      }
      if (buf.length) out.push(`<p>${inlineMd(buf.join('\n')).replace(/\n/g, '<br>')}</p>`);
    }

    let html = out.join('');
    html = html.replace(/\u0000CB(\d+)\u0000/g, (m, idx) => {
      const b = blocks[Number(idx)];
      if (!b) return '';
      const ci = codeStore.push(b.code) - 1;
      return `<div class="code"><div class="code-hd"><span>${esc(b.lang)}</span>`
        + `<button data-ci="${ci}" class="copybtn">${esc(t.copy)}</button></div>`
        + `<pre><code>${esc(b.code.replace(/\n$/, ''))}</code></pre></div>`;
    });
    return html;
  }

  /* ---------------- rendering ---------------- */
  function applyLang() {
    t = I18N[S.lang] || I18N.fa;
    document.documentElement.lang = S.lang;
    document.documentElement.dir = t.dir;
    document.title = t.title;
    $('#newChat').textContent = '+ ' + t.newChat;
    $('#input').placeholder = t.placeholder;
    $('#hint').innerHTML = t.hint.replace(/Enter/g, '<kbd>Enter</kbd>').replace(/Shift\+Enter/g, '<kbd>Shift</kbd>+<kbd>Enter</kbd>');
    $('#modelName').textContent = S.model;
    $('#welcomeTitle').innerHTML = t.welcomeTitle;
    $('#welcomeSub').textContent = t.welcomeSub;
    $('#chips').innerHTML = t.chips.map((c, n) =>
      `<button class="chip" data-chip="${n}"><span class="ico">${c[0]}</span><span>${esc(c[1])}<small>${esc(c[2])}</small></span></button>`).join('');
    $$('#settingsModal .i18n').forEach((el) => { const k = el.dataset.k; if (t[k]) el.textContent = t[k]; });
    $('#btnSettings').title = t.settings;
    $('#btnTheme').title = t.theme;
    $('#btnLang').title = t.lang;
    $('#btnExport').title = t.exportBtn;
    $('#btnNewTop').title = t.newChat;
    $('#btnMic').title = t.listening;
    $('#imgToggle').textContent = '🎨 ' + t.imgMode;
    $('#modelModalTitle').textContent = t.chooseModel;
    $('#btnRefreshModels').textContent = t.refresh;
    $('#saveSettings').textContent = t.save;
    $('#closeSettings').textContent = t.close;
    $('#clearChats').textContent = t.clearAll;
    renderConvs();
    renderMessages();
  }

  function applyTheme() {
    document.documentElement.dataset.theme = S.theme;
    $('#btnTheme').textContent = S.theme === 'dark' ? '🌙' : '☀️';
  }

  function renderConvs() {
    const list = $('#convList');
    if (!chats.length) { list.innerHTML = `<div class="empty-convs">${esc(t.emptyConvs)}</div>`; return; }
    list.innerHTML = chats.map((c) => `
      <div class="conv ${c.id === activeId ? 'active' : ''}" data-id="${c.id}">
        <span class="t">${esc(c.title || t.untitled)}</span>
        <button class="del" data-del="${c.id}" title="${esc(t.del)}">✕</button>
      </div>`).join('');
  }

  function msgActions(chat, index, msg) {
    const isLastAi = index === chat.messages.length - 1 && msg.role === 'assistant';
    return `<div class="acts">
      <button data-act="copy" data-i="${index}">⧉ ${esc(t.copy)}</button>
      ${msg.role === 'assistant' ? `<button data-act="speak" data-i="${index}">🔊 ${esc(t.speak)}</button>` : ''}
      ${isLastAi ? `<button data-act="regen" data-i="${index}">↻ ${esc(t.regen)}</button>` : ''}
      <button data-act="del" data-i="${index}">✕ ${esc(t.del)}</button>
    </div>`;
  }

  function bubbleHtml(msg) {
    if (msg.type === 'image') {
      return `<div class="imgwrap"><div class="skeleton">${esc(t.genImg)}</div>
        <img alt="${esc(msg.prompt || '')}" src="${esc(msg.src)}" loading="lazy"
             onload="this.previousElementSibling.remove()" onerror="this.parentNode.querySelector('.skeleton').textContent='${esc(t.imgFail)}';this.remove()">
        <div class="cap">${esc(msg.prompt || '')}</div></div>`;
    }
    const isAi = msg.role === 'assistant';
    const reasoning = msg.reasoning
      ? `<details class="reason"><summary>🧠 ${esc(t.reasoning)}</summary><div class="rtxt">${esc(msg.reasoning)}</div></details>` : '';
    return `${reasoning}<div class="content">${renderMd(msg.content || '')}</div>`;
  }

  function renderMessages() {
    const chat = activeChat();
    const wrap = $('#messages');
    const welcome = $('#welcome');
    if (!chat || !chat.messages.length) {
      welcome.style.display = '';
      wrap.innerHTML = '';
      return;
    }
    welcome.style.display = 'none';
    wrap.innerHTML = chat.messages.map((m, i) => {
      const isAi = m.role === 'assistant';
      const who = isAi
        ? `<span>${esc(t.ai)}</span>${m.model ? `<span class="badge">${esc(m.model)}</span>` : ''}`
        : `<span>${esc(t.you)}</span>`;
      return `<div class="msg ${isAi ? 'ai' : 'user'}" data-i="${i}">
        <div class="av">${isAi ? '🦆' : '🧑'}</div>
        <div class="body">
          <div class="who">${who}</div>
          <div class="msg-body" id="mb-${i}">${bubbleHtml(m)}</div>
          ${msgActions(chat, i, m)}
        </div>
      </div>`;
    }).join('');
    scrollBottom();
  }

  function scrollBottom(force) {
    const el = $('#chat');
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < 220;
    if (force || near) requestAnimationFrame(() => { el.scrollTop = el.scrollHeight; });
  }

  function toast(msg, isErr) {
    const el = $('#toast');
    el.textContent = msg;
    el.className = 'toast show' + (isErr ? ' err' : '');
    clearTimeout(el._t);
    el._t = setTimeout(() => { el.className = 'toast'; }, 3200);
  }

  /* ---------------- chat plumbing ---------------- */
  function ensureChat() {
    let chat = activeChat();
    if (!chat) {
      chat = { id: uid(), title: '', created: Date.now(), messages: [] };
      chats.unshift(chat);
      activeId = chat.id;
      renderConvs();
    }
    return chat;
  }

  function headers() {
    const h = { 'Content-Type': 'application/json' };
    if (S.apiKey) h.Authorization = 'Bearer ' + S.apiKey;
    return h;
  }

  function buildContext(chat) {
    const msgs = [];
    if (S.system.trim()) msgs.push({ role: 'system', content: S.system.trim() });
    const slice = chat.messages.filter((m) => m.type !== 'image').slice(-MAX_CTX);
    slice.forEach((m) => msgs.push({ role: m.role, content: m.content || '' }));
    return msgs;
  }

  async function streamCompletion(messages, onDelta, onReason, signal) {
    const body = { model: S.model, messages, stream: true, temperature: Number(S.temperature) };
    const res = await fetch(S.baseUrl, { method: 'POST', headers: headers(), body: JSON.stringify(body), signal });
    if (!res.ok) {
      let detail = '';
      try { detail = (await res.text()).slice(0, 300); } catch (e) {}
      throw new Error('HTTP ' + res.status + (detail ? ' — ' + detail : ''));
    }
    if (!res.body) throw new Error('Empty response body');

    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let nl;
      while ((nl = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, nl).trim();
        buf = buf.slice(nl + 1);
        if (!line || !line.startsWith('data:')) continue;
        const payload = line.slice(5).trim();
        if (payload === '[DONE]') return;
        let j;
        try { j = JSON.parse(payload); } catch (e) { continue; }
        const d = (j.choices && j.choices[0] && (j.choices[0].delta || j.choices[0].message)) || {};
        if (d.reasoning) onReason(d.reasoning);
        if (d.content) onDelta(d.content);
      }
    }
  }

  async function nonStreamCompletion(messages, signal) {
    const body = { model: S.model, messages, stream: false, temperature: Number(S.temperature) };
    const res = await fetch(S.baseUrl, { method: 'POST', headers: headers(), body: JSON.stringify(body), signal });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const j = await res.json();
    const m = (j.choices && j.choices[0] && j.choices[0].message) || {};
    return { content: m.content || '', reasoning: m.reasoning || '' };
  }

  function setBusy(state) {
    busy = state;
    const btn = $('#btnSend');
    btn.classList.toggle('stop', state);
    btn.textContent = state ? '■' : '➤';
    btn.title = state ? t.stop : '';
    $('#input').disabled = false;
  }

  async function send(text) {
    const value = (text != null ? text : $('#input').value).trim();
    if (!value) { toast(t.emptyMsg, true); return; }
    if (busy) return;

    const chat = ensureChat();
    const isImage = imgMode || /^\/draw\s+/i.test(value);
    const prompt = value.replace(/^\/draw\s+/i, '');

    if (!chat.title) { chat.title = prompt.slice(0, 48) || t.untitled; renderConvs(); }

    if (isImage) {
      chat.messages.push({ role: 'user', content: '/draw ' + prompt, ts: Date.now() });
      const src = 'https://image.pollinations.ai/prompt/' + encodeURIComponent(prompt)
        + '?width=1024&height=1024&nologo=true&seed=' + Math.floor(Math.random() * 1e9);
      chat.messages.push({ role: 'assistant', type: 'image', prompt, src, ts: Date.now() });
      $('#input').value = '';
      autoGrow();
      renderMessages(); scrollBottom(true); save();
      return;
    }

    chat.messages.push({ role: 'user', content: value, ts: Date.now() });
    $('#input').value = '';
    autoGrow();
    renderMessages(); scrollBottom(true); save();

    // placeholder assistant bubble
    const idx = chat.messages.push({ role: 'assistant', content: '', reasoning: '', model: S.model, ts: Date.now() }) - 1;
    renderMessages(); scrollBottom(true);

    const bubble = () => document.getElementById('mb-' + idx);
    const paint = () => {
      const el = bubble();
      if (!el) return;
      const m = chat.messages[idx];
      const reason = m.reasoning
        ? `<details class="reason" open><summary>🧠 ${esc(t.reasoning)}</summary><div class="rtxt">${esc(m.reasoning)}</div></details>` : '';
      const body = m.content
        ? renderMd(m.content) + '<span class="cursor"></span>'
        : `<span class="thinking"><i></i><i></i><i></i></span>`;
      el.innerHTML = reason + `<div class="content">${body}</div>`;
      scrollBottom();
    };

    controller = new AbortController();
    setBusy(true);
    let raf = 0;
    const schedulePaint = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; paint(); }); };
    paint();

    try {
      const messages = buildContext(chat).filter((m) => m.content !== '');
      if (S.stream) {
        await streamCompletion(messages,
          (d) => { chat.messages[idx].content += d; schedulePaint(); },
          (d) => { chat.messages[idx].reasoning += d; schedulePaint(); },
          controller.signal);
      } else {
        const r = await nonStreamCompletion(messages, controller.signal);
        chat.messages[idx].content = r.content;
        chat.messages[idx].reasoning = r.reasoning;
      }
      if (!chat.messages[idx].content && !chat.messages[idx].reasoning) {
        chat.messages[idx].content = '(empty response)';
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        if (!chat.messages[idx].content) chat.messages[idx].content = '— ' + t.stop + ' —';
      } else {
        chat.messages[idx].content = `**${t.sendFail}:** \`${String(err.message || err).slice(0, 240)}\``;
        toast(t.sendFail + ': ' + String(err.message || err).slice(0, 120), true);
      }
    } finally {
      controller = null;
      setBusy(false);
      chat.messages[idx].reasoning = chat.messages[idx].reasoning || '';
      save();
      renderMessages(); scrollBottom(true);
      if (S.tts && chat.messages[idx].content) speak(chat.messages[idx].content);
    }
  }

  function speak(text) {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const plain = text.replace(/```[\s\S]*?```/g, ' ').replace(/[#*_>`]/g, '').slice(0, 4000);
      const u = new SpeechSynthesisUtterance(plain);
      u.lang = S.lang === 'fa' ? 'fa-IR' : 'en-US';
      window.speechSynthesis.speak(u);
    } catch (e) {}
  }

  function autoGrow() {
    const el = $('#input');
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 190) + 'px';
  }

  /* ---------------- models ---------------- */
  async function loadModels() {
    const list = [];
    const base = S.baseUrl.replace(/\/+$/, '');
    const cands = [];
    if (/pollinations/.test(base)) cands.push('https://text.pollinations.ai/models');
    cands.push(base.replace(/\/chat\/completions$/, '') + '/models');
    cands.push(base + '/models');
    for (const url of cands) {
      try {
        const r = await fetch(url, { headers: headers() });
        if (!r.ok) continue;
        const j = await r.json();
        const arr = Array.isArray(j) ? j : (j.data || []);
        arr.forEach((m) => {
          const id = m.name || m.id;
          if (id && !list.some((x) => x.id === id)) list.push({ id, desc: m.description || '' });
        });
        if (list.length) break;
      } catch (e) {}
    }
    if (list.length) { S.models = list; save(); }
    return S.models;
  }

  function openModels() {
    const box = $('#modelList');
    box.innerHTML = S.models.map((m) => `
      <button class="mrow ${m.id === S.model ? 'sel' : ''}" data-model="${esc(m.id)}">
        <span class="nm">${esc(m.id)}${m.desc ? `<span class="desc"> — ${esc(m.desc)}</span>` : ''}</span>
        <span class="tick">✓</span>
      </button>`).join('');
    $('#modelModal').hidden = false;
  }

  /* ---------------- settings modal ---------------- */
  function openSettings() {
    $('#setBase').value = S.baseUrl;
    $('#setKey').value = S.apiKey;
    $('#setModel').value = S.model;
    $('#setTemp').value = S.temperature;
    $('#setSystem').value = S.system;
    $('#setStream').classList.toggle('on', !!S.stream);
    $('#setTts').classList.toggle('on', !!S.tts);
    $('#setLang').value = S.lang;
    $('#setTheme').value = S.theme;
    $('#settingsModal').hidden = false;
  }

  function saveSettings() {
    S.baseUrl = $('#setBase').value.trim() || DEFAULTS.baseUrl;
    S.apiKey = $('#setKey').value.trim();
    S.model = $('#setModel').value.trim() || 'openai-fast';
    S.temperature = Math.max(0, Math.min(2, Number($('#setTemp').value) || 0.7));
    S.system = $('#setSystem').value;
    S.stream = $('#setStream').classList.contains('on');
    S.tts = $('#setTts').classList.contains('on');
    S.lang = $('#setLang').value;
    S.theme = $('#setTheme').value;
    save();
    applyTheme(); applyLang();
    $('#settingsModal').hidden = true;
    toast(t.save + ' ✓');
  }

  /* ---------------- export ---------------- */
  function exportChat() {
    const chat = activeChat();
    if (!chat || !chat.messages.length) { toast(t.emptyMsg, true); return; }
    const md = [`# ${chat.title || t.untitled}`, ''].concat(chat.messages.map((m) =>
      `**${m.role === 'user' ? t.you : t.ai}:**\n\n${m.type === 'image' ? `![${m.prompt}](${m.src})` : (m.content || '')}\n`)).join('\n');
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (chat.title || 'duckai-chat').replace(/[^\w\u0600-\u06FF -]+/g, '').slice(0, 40) + '.md';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 3000);
  }

  /* ---------------- events ---------------- */
  function wire() {
    $('#newChat').onclick = () => {
      const chat = { id: uid(), title: '', created: Date.now(), messages: [] };
      chats.unshift(chat); activeId = chat.id; save(); renderConvs(); renderMessages(); $('#input').focus();
      closeSidebar();
    };
    $('#btnNewTop').onclick = () => $('#newChat').click();
    $('#btnExport').onclick = exportChat;
    $('#btnSettings').onclick = openSettings;
    $('#btnTheme').onclick = () => { S.theme = S.theme === 'dark' ? 'light' : 'dark'; save(); applyTheme(); };
    $('#btnLang').onclick = () => { S.lang = S.lang === 'fa' ? 'en' : 'fa'; save(); applyLang(); };

    $('#convList').addEventListener('click', (e) => {
      const del = e.target.closest('[data-del]');
      if (del) {
        const id = del.dataset.del;
        chats = chats.filter((c) => c.id !== id);
        if (activeId === id) activeId = chats.length ? chats[0].id : null;
        save(); renderConvs(); renderMessages();
        return;
      }
      const row = e.target.closest('.conv');
      if (row) { activeId = row.dataset.id; save(); renderConvs(); renderMessages(); closeSidebar(); }
    });

    $('#modelBtn').onclick = openModels;
    $('#modelList').addEventListener('click', (e) => {
      const b = e.target.closest('[data-model]');
      if (!b) return;
      S.model = b.dataset.model; save();
      $('#modelName').textContent = S.model;
      $('#modelModal').hidden = true;
      toast(t.modelBadge + ': ' + S.model);
    });
    $('#btnRefreshModels').onclick = async () => {
      toast('…');
      await loadModels();
      openModels();
    };
    $$('.modal').forEach((m) => m.addEventListener('click', (e) => { if (e.target === m) m.hidden = true; }));

    $('#saveSettings').onclick = saveSettings;
    $('#closeSettings').onclick = () => { $('#settingsModal').hidden = true; };
    $('#setStream').onclick = () => $('#setStream').classList.toggle('on');
    $('#setTts').onclick = () => $('#setTts').classList.toggle('on');
    $('#clearChats').onclick = () => {
      if (!confirm(t.clearConfirm)) return;
      chats = []; activeId = null; save(); renderConvs(); renderMessages(); $('#settingsModal').hidden = true;
    };

    const input = $('#input');
    input.addEventListener('input', autoGrow);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
    });
    $('#btnSend').onclick = () => {
      if (busy && controller) { controller.abort(); return; }
      send();
    };

    $('#imgToggle').onclick = () => {
      imgMode = !imgMode;
      $('#imgToggle').classList.toggle('on', imgMode);
      toast(imgMode ? t.imgModeOn : t.imgMode + ' off');
    };

    $('#chips').addEventListener('click', (e) => {
      const c = e.target.closest('[data-chip]');
      if (!c) return;
      const n = Number(c.dataset.chip);
      const sample = t.chips[n][2].replace(/^(مثلاً:|e\.g\.)\s*/i, '');
      $('#input').value = sample; autoGrow(); $('#input').focus();
    });

    $('#messages').addEventListener('click', async (e) => {
      const copyBtn = e.target.closest('.copybtn');
      if (copyBtn) {
        const code = codeStore[Number(copyBtn.dataset.ci)] || '';
        try { await navigator.clipboard.writeText(code); copyBtn.textContent = t.copied; }
        catch (err) { toast('Clipboard blocked', true); }
        setTimeout(() => { copyBtn.textContent = t.copy; }, 1400);
        return;
      }
      const act = e.target.closest('[data-act]');
      if (!act) return;
      const chat = activeChat(); if (!chat) return;
      const i = Number(act.dataset.i);
      const msg = chat.messages[i];
      if (!msg) return;
      const kind = act.dataset.act;
      if (kind === 'copy') {
        try { await navigator.clipboard.writeText(msg.content || msg.src || ''); toast(t.copied); }
        catch (err) { toast('Clipboard blocked', true); }
      } else if (kind === 'speak') {
        speak(msg.content || '');
      } else if (kind === 'del') {
        chat.messages.splice(i, 1); save(); renderMessages();
      } else if (kind === 'regen') {
        if (busy) return;
        // drop this answer and the user turn stays; resend
        chat.messages.splice(i, 1);
        const lastUser = [...chat.messages].reverse().find((m) => m.role === 'user');
        save(); renderMessages();
        if (lastUser) send(lastUser.content);
      }
    });

    // dictation
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    $('#btnMic').onclick = () => {
      if (!SR) { toast(t.noMic, true); return; }
      if (recognizer) { recognizer.stop(); return; }
      recognizer = new SR();
      recognizer.lang = S.lang === 'fa' ? 'fa-IR' : 'en-US';
      recognizer.continuous = true;
      recognizer.interimResults = true;
      let baseText = $('#input').value;
      recognizer.onresult = (ev) => {
        let txt = '';
        for (let k = ev.resultIndex; k < ev.results.length; k++) txt += ev.results[k][0].transcript;
        $('#input').value = (baseText ? baseText + ' ' : '') + txt;
        autoGrow();
      };
      recognizer.onend = () => { recognizer = null; $('#btnMic').classList.remove('on'); };
      recognizer.onerror = () => { recognizer = null; $('#btnMic').classList.remove('on'); };
      recognizer.start();
      $('#btnMic').classList.add('on');
      toast(t.listening);
    };

    // mobile sidebar
    $('#openSidebar').onclick = () => { $('#sidebar').classList.add('open'); $('#scrim').classList.add('show'); };
    $('#closeSidebar').onclick = closeSidebar;
    $('#scrim').onclick = closeSidebar;

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { $$('.modal').forEach((m) => { m.hidden = true; }); closeSidebar(); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); $('#newChat').click(); }
    });
  }

  function closeSidebar() {
    $('#sidebar').classList.remove('open');
    $('#scrim').classList.remove('show');
  }

  /* ---------------- boot ---------------- */
  function init() {
    applyTheme();
    applyLang();
    wire();
    autoGrow();
    renderMessages();
    if (!S.models.length || S.models.length === 1) loadModels().then(() => { $('#modelName').textContent = S.model; });
    setTimeout(() => $('#input').focus(), 120);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
