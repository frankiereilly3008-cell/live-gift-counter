(() => {
  const params = new URLSearchParams(location.search);
  const overlayMode = params.has('overlay');
  if (overlayMode) document.body.classList.add('overlay-mode');
  const $ = (id) => document.getElementById(id);
  const COIN_VALUE = 0.0048;
  const defaults = { theme: 'normal', title: 'LIVE GIFT COUNTER', subtitle: 'Thanks for the love!', liker: '', gifter: '', goal: 10000, totalCoins: 0, muted: false };
  let state = { ...defaults }, seq = 0, booted = false, busy = false, saveTimer, toastTimer, undoStack = [], queuedPatch = {};
  let bindings = { 1: { key: '1', alt: true }, 10: { key: '2', alt: true }, 100: { key: '3', alt: true }, 1000: { key: '4', alt: true }, 5000: { key: '5', alt: true }, liker: { key: 'l', alt: true }, gifter: { key: 'g', alt: true } };
  try { bindings = { ...bindings, ...JSON.parse(localStorage.getItem('giftCounterBindings') || '{}') }; } catch (_) { /* Use defaults when local storage is unavailable. */ }
  const money = coins => `£${(Number(coins || 0) * COIN_VALUE).toFixed(2)}`;
  function setOnline(ok) { const status = document.querySelector('.server-status'); if (status) status.classList.toggle('online', ok); if ($('statusText')) $('statusText').textContent = ok ? 'Server connected' : 'Server unreachable'; }
  function render() {
    const coins = Number(state.totalCoins) || 0, goal = Math.max(1, Number(state.goal) || 1), pct = Math.min(100, coins / goal * 100);
    document.body.dataset.theme = state.theme;
    document.body.classList.remove('theme-christmas', 'theme-halloween', 'overlay-theme-normal');
    document.body.classList.add(`theme-${state.theme}`);
    if ($('earnings')) $('earnings').textContent = money(coins);
    if ($('coinEstimate')) $('coinEstimate').textContent = `£${COIN_VALUE.toFixed(4)} per coin`;
    document.querySelectorAll('.coin-btn[data-coins]').forEach(button => { const estimate = button.querySelector('small'); if (estimate) estimate.textContent = money(button.dataset.coins); });
    if ($('coinTotal')) $('coinTotal').textContent = coins.toLocaleString('en-GB');
    if ($('goalProgress')) $('goalProgress').textContent = `${Math.floor(pct)}%`;
    if ($('goalAmount')) $('goalAmount').textContent = `of ${goal.toLocaleString('en-GB')} coins`;
    if ($('progressFill')) $('progressFill').style.width = `${pct}%`;
    if ($('overlayEarnings')) $('overlayEarnings').textContent = money(coins);
    if ($('overlayCoins')) $('overlayCoins').textContent = coins.toLocaleString('en-GB');
    if ($('overlayTitle')) $('overlayTitle').textContent = state.title || defaults.title;
    if ($('overlaySubtitle')) $('overlaySubtitle').textContent = state.subtitle || '';
    if ($('overlayLiker')) $('overlayLiker').textContent = state.liker ? `♡ Top liker · ${state.liker}` : '';
    if ($('overlayGifter')) $('overlayGifter').textContent = state.gifter ? `✦ Top gifter · ${state.gifter}` : '';
    if ($('overlayGoalText')) $('overlayGoalText').textContent = `${coins.toLocaleString('en-GB')} / ${goal.toLocaleString('en-GB')}`;
    if ($('overlayGoalFill')) $('overlayGoalFill').style.width = `${pct}%`;
    if ($('titleInput') && document.activeElement !== $('titleInput')) $('titleInput').value = state.title;
    if ($('subtitleInput') && document.activeElement !== $('subtitleInput')) $('subtitleInput').value = state.subtitle;
    if ($('likerInput') && document.activeElement !== $('likerInput')) $('likerInput').value = state.liker;
    if ($('gifterInput') && document.activeElement !== $('gifterInput')) $('gifterInput').value = state.gifter;
    if ($('goalInput') && document.activeElement !== $('goalInput')) $('goalInput').value = state.goal;
    if ($('muteToggle')) $('muteToggle').checked = !state.muted;
    window.counterMuted = !!state.muted;
    document.querySelectorAll('.theme-btn').forEach(b => b.classList.toggle('active', b.dataset.theme === state.theme));
    renderBindingLabels();
    window.AnimationManager?.setTheme(state.theme);
  }
  function renderBindingLabels() {
    if (overlayMode) return;
    const display = binding => {
      if (!binding) return 'Set key';
      const modifiers = [];
      if (binding.ctrl) modifiers.push('Ctrl');
      if (binding.alt) modifiers.push('Alt');
      if (binding.shift) modifiers.push('Shift');
      if (binding.meta) modifiers.push('⌘');
      modifiers.push((binding.key || '?').length === 1 ? binding.key.toUpperCase() : binding.key);
      return modifiers.join(' + ');
    };
    document.querySelectorAll('.keycap[data-bind]').forEach(el => {
      if (window.pendingBinding !== Number(el.dataset.bind)) el.textContent = display(bindings[el.dataset.bind]);
    });
    document.querySelectorAll('.focus-key[data-focus]').forEach(el => {
      if (window.pendingBinding !== el.dataset.focus) el.textContent = display(bindings[el.dataset.focus]);
    });
  }
  async function requestState() {
    const response = await fetch(booted ? `/state?after=${seq}` : '/state', { cache: 'no-store' });
    if (!response.ok) throw new Error('State request failed');
    const data = await response.json();
    if (data.state) state = { ...state, ...data.state };
    if (Number.isFinite(data.latestSeq)) seq = Math.max(seq, data.latestSeq);
    (data.events || []).forEach(e => window.AnimationManager?.enqueue(e));
    booted = true;
    render(); setOnline(true);
  }
  async function save(patch) {
    state = { ...state, ...patch }; render();
    try {
      const response = await fetch('/state', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ state: patch }) });
      if (!response.ok) throw new Error('Save failed');
      setOnline(true); if ($('savedLabel')) $('savedLabel').textContent = 'Saved locally';
    } catch (_) { setOnline(false); if ($('savedLabel')) $('savedLabel').textContent = 'Waiting for server'; }
  }
  function scheduleSave(patch) {
    Object.assign(state, patch); Object.assign(queuedPatch, patch); render(); if ($('savedLabel')) $('savedLabel').textContent = 'Saving…';
    clearTimeout(saveTimer); saveTimer = setTimeout(() => { const pending = queuedPatch; queuedPatch = {}; save(pending); }, 160);
  }
  function toast(message) { const el = $('toast'); el.textContent = message; el.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 1900); }
  async function gift(coins, external = false) {
    if (busy) return;
    busy = true;
    if (!external) undoStack.push(Number(state.totalCoins) || 0);
    const eventId = `manual-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    try {
      const response = await fetch('/gift-event', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ eventId, coins }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Gift could not be counted');
      if (data.state) state = { ...state, ...data.state };
      (data.events || []).forEach(e => { window.AnimationManager?.enqueue(e); seq = Math.max(seq, Number(e.seq) || 0); });
      seq = Math.max(seq, Number(data.latestSeq) || 0); render(); setOnline(true);
      if (!external) toast(`+${coins.toLocaleString('en-GB')} coins added`);
    } catch (e) { if (!external) undoStack.pop(); setOnline(false); toast(e.message || 'Could not reach the server'); }
    finally { busy = false; }
  }
  async function setTotal(coins) {
    const patch = { totalCoins: Math.max(0, Number(coins) || 0) };
    state = { ...state, ...patch }; render();
    try { const r = await fetch('/state', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ state: patch }) }); if (!r.ok) throw 0; const d = await r.json(); state = { ...state, ...d.state }; render(); }
    catch (_) { setOnline(false); toast('Could not update total'); }
  }
  if (!overlayMode) {
    document.querySelectorAll('.coin-btn').forEach(btn => btn.addEventListener('click', () => gift(Number(btn.dataset.coins))));
    document.querySelectorAll('.theme-btn').forEach(btn => btn.addEventListener('click', () => save({ theme: btn.dataset.theme })));
    const bindInputs = [['titleInput','title'],['subtitleInput','subtitle'],['likerInput','liker'],['gifterInput','gifter']];
    bindInputs.forEach(([id,key]) => $(id).addEventListener('input', e => scheduleSave({ [key]: e.target.value })));
    $('goalInput').addEventListener('input', e => { const val = Math.max(1, Math.min(99999999, Number(e.target.value) || 1)); scheduleSave({ goal: val }); });
    $('muteToggle').addEventListener('change', e => save({ muted: !e.target.checked }));
    $('undoBtn').addEventListener('click', () => { if (!undoStack.length) return toast('Nothing to undo'); setTotal(undoStack.pop()); toast('Last count undone'); });
    $('resetBtn').addEventListener('click', () => { if (!state.totalCoins) return toast('Total is already zero'); undoStack.push(Number(state.totalCoins)); setTotal(0); toast('Total reset'); });
    $('mockBtn').addEventListener('click', () => gift(100, true));
    document.querySelectorAll('.keycap').forEach(el => el.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); el.classList.add('listening'); el.textContent = 'Press shortcut…'; window.pendingBinding = Number(el.dataset.bind); }));
    document.querySelectorAll('.focus-key').forEach(el => el.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); el.classList.add('listening'); el.textContent = 'Press shortcut…'; window.pendingBinding = el.dataset.focus; }));
    window.addEventListener('keydown', e => {
      if (e.key === 'Alt' && e.altKey) e.preventDefault();
      if (window.pendingBinding) {
        if (['alt', 'control', 'shift', 'meta'].includes(e.key.toLowerCase())) { e.preventDefault(); return; }
        if (!e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey) { e.preventDefault(); toast('Choose a shortcut with a modifier key'); return; }
        e.preventDefault(); e.stopPropagation(); const id = window.pendingBinding; bindings[id] = { key: e.key.toLowerCase(), alt: e.altKey, ctrl: e.ctrlKey, shift: e.shiftKey, meta: e.metaKey }; window.pendingBinding = null;
        try { localStorage.setItem('giftCounterBindings', JSON.stringify(bindings)); } catch (_) { /* Shortcut still works for this tab. */ }
        const target = typeof id === 'number' ? document.querySelector(`[data-bind="${id}"]`) : document.querySelector(`[data-focus="${id}"]`);
        if (target) target.classList.remove('listening');
        renderBindingLabels();
        return;
      }
      const tag = document.activeElement?.tagName; if (['INPUT','TEXTAREA'].includes(tag) || e.repeat) return;
      const hit = Object.entries(bindings).find(([, b]) => b && e.key.toLowerCase() === (b.key || '').toLowerCase() && !!e.altKey === !!b.alt && !!e.ctrlKey === !!b.ctrl && !!e.shiftKey === !!b.shift && !!e.metaKey === !!b.meta);
      if (!hit) return;
      e.preventDefault(); e.stopPropagation();
      const id = hit[0];
      if (id === 'liker' || id === 'gifter') $(id + 'Input').focus({ preventScroll: true });
      else gift(Number(id));
    }, true);
  }
  async function poll() { try { await requestState(); } catch (_) { setOnline(false); } }
  render();
  poll(); setInterval(poll, 900);
})();
