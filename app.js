(() => {
  const params = new URLSearchParams(location.search);
  const overlayMode = params.has('overlay');
  const hostedMode = location.protocol === 'file:' || !['127.0.0.1', 'localhost'].includes(location.hostname);
  if (overlayMode) {
    const overlay = document.getElementById('overlay');
    if (overlay) document.body.appendChild(overlay);
    document.body.classList.add('overlay-mode');
  }
  const $ = (id) => document.getElementById(id);
  const COIN_VALUE = 0.0048;
  const defaults = { theme: 'christmas', title: 'Do you love Christmas?', subtitle: 'Share and like the live ✨', liker: '', gifter: '', savingsLabel: 'Savings goal', goal: 500, totalCoins: 0, muted: true, currency: 'USD', showScenery: true, animations: true, liveTimer: false, studioVersion: 2 };
  let state = { ...defaults }, seq = 0, booted = false, busy = false, saveTimer, toastTimer, undoStack = [], queuedPatch = {};
  if (hostedMode) { try { const old = JSON.parse(localStorage.getItem('giftCounterState') || '{}'); state = old.studioVersion === 2 ? { ...state, ...old } : { ...state, totalCoins: Number(old.totalCoins) || 0 }; } catch (_) { /* Start fresh if browser storage is unavailable. */ } }
  let bindings = { 1: { key: '1', alt: true }, 10: { key: '2', alt: true }, 100: { key: '3', alt: true }, 1000: { key: '4', alt: true }, 5000: { key: '5', alt: true }, 10000: { key: '6', alt: true }, liker: { key: 'l', alt: true }, gifter: { key: 'g', alt: true } };
  try { bindings = { ...bindings, ...JSON.parse(localStorage.getItem('giftCounterBindings') || '{}') }; } catch (_) { /* Use defaults when local storage is unavailable. */ }
  const currencySymbol = () => state.currency === 'USD' ? '$' : '£';
  const money = coins => `${currencySymbol()}${(Number(coins || 0) * COIN_VALUE).toFixed(2)}`;
  function setOnline(ok) { const status = document.querySelector('.server-status'); if (status) status.classList.toggle('online', ok); if ($('statusText')) $('statusText').textContent = hostedMode ? 'Saved in this browser' : ok ? 'Server connected' : 'Server unreachable'; }
  function render() {
    const coins = Number(state.totalCoins) || 0, earned = coins * COIN_VALUE, goal = Math.max(1, Number(state.goal) || 1), pct = Math.min(100, earned / goal * 100);
    document.body.dataset.theme = state.theme;
    document.body.classList.remove('theme-christmas', 'theme-halloween', 'overlay-theme-normal');
    document.body.classList.add(`theme-${state.theme}`);
    if ($('earnings')) $('earnings').textContent = money(coins);
    if ($('estimateText')) $('estimateText').textContent = `Estimate · ${currencySymbol()}12.00 / 1,000 coins · 40% creator share`;
    if ($('coinEstimate')) $('coinEstimate').textContent = `${currencySymbol()}${COIN_VALUE.toFixed(4)} per coin`;
    document.querySelectorAll('.coin-btn[data-coins]').forEach(button => { const estimate = button.querySelector('small'); if (estimate) estimate.textContent = `+${money(button.dataset.coins)}`; });
    if ($('coinTotal')) $('coinTotal').textContent = coins.toLocaleString('en-GB');
    if ($('goalProgress')) $('goalProgress').textContent = `${Math.floor(pct)}%`;
    if ($('goalAmount')) $('goalAmount').textContent = `of ${money(goal)}`;
    if ($('progressFill')) $('progressFill').style.width = `${pct}%`;
    if ($('overlayEarnings')) $('overlayEarnings').textContent = money(coins);
    if ($('overlayCoins')) $('overlayCoins').textContent = '✨ All gifts are appreciated ✨';
    if ($('overlayTitle')) $('overlayTitle').textContent = state.title || defaults.title;
    if ($('overlaySubtitle')) $('overlaySubtitle').textContent = state.subtitle || '';
    if ($('overlayLiker')) $('overlayLiker').textContent = state.liker ? `💜 TOP LIKER: ${state.liker}` : '';
    if ($('overlayGifter')) $('overlayGifter').textContent = state.gifter ? `🎁 TOP GIFTER: ${state.gifter}` : '';
    if ($('overlayGoalLabel')) $('overlayGoalLabel').textContent = state.savingsLabel || 'Savings goal';
    if ($('overlayGoalText')) $('overlayGoalText').textContent = `${money(earned)} / ${money(goal)}`;
    if ($('overlayGoalFill')) $('overlayGoalFill').style.width = `${pct}%`;
    if ($('titleInput') && document.activeElement !== $('titleInput')) $('titleInput').value = state.title;
    if ($('subtitleInput') && document.activeElement !== $('subtitleInput')) $('subtitleInput').value = state.subtitle;
    if ($('likerInput') && document.activeElement !== $('likerInput')) $('likerInput').value = state.liker;
    if ($('gifterInput') && document.activeElement !== $('gifterInput')) $('gifterInput').value = state.gifter;
    if ($('goalInput') && document.activeElement !== $('goalInput')) $('goalInput').value = state.goal;
    if ($('savingsLabelInput') && document.activeElement !== $('savingsLabelInput')) $('savingsLabelInput').value = state.savingsLabel;
    if ($('muteToggle')) $('muteToggle').checked = !!state.muted;
    if ($('sceneryToggle')) $('sceneryToggle').checked = !!state.showScenery;
    if ($('liveScenery')) $('liveScenery').classList.toggle('no-scenery', !state.showScenery);
    if ($('currencyToggle')) $('currencyToggle').textContent = `Currency: ${currencySymbol()} ${state.currency}`;
    if ($('animationToggle')) $('animationToggle').textContent = `Coin animations: ${state.animations ? 'on' : 'off'}`;
    if ($('timerBtn')) $('timerBtn').textContent = state.liveTimer ? 'Live timer: on' : 'Add live timer';
    if ($('overlayTimer')) {
      $('overlayTimer').hidden = !state.liveTimer;
      const seconds = Math.max(0, Math.floor((Date.now() - (Number(state.liveTimerAt) || Date.now())) / 1000));
      $('overlayTimer').textContent = `${String(Math.floor(seconds / 60)).padStart(2,'0')}:${String(seconds % 60).padStart(2,'0')}`;
    }
    window.counterMuted = !!state.muted;
    window.counterAnimations = !!state.animations;
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
    if (hostedMode) return;
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
    if (hostedMode) {
      try { localStorage.setItem('giftCounterState', JSON.stringify(state)); setOnline(true); if ($('savedLabel')) $('savedLabel').textContent = 'Saved in this browser'; }
      catch (_) { setOnline(false); if ($('savedLabel')) $('savedLabel').textContent = 'Browser storage unavailable'; }
      return;
    }
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
    if (hostedMode) {
      state.totalCoins = (Number(state.totalCoins) || 0) + coins;
      try { localStorage.setItem('giftCounterState', JSON.stringify(state)); } catch (_) { /* Keep this session's count in memory. */ }
      window.AnimationManager?.enqueue({ eventId: `browser-${Date.now()}-${Math.random()}`, coins, theme: state.theme, seq: ++seq });
      render(); setOnline(true); if (!external) toast(`+${coins.toLocaleString('en-GB')} coins added`);
      busy = false;
      return;
    }
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
    if (hostedMode) { try { localStorage.setItem('giftCounterState', JSON.stringify(state)); } catch (_) { /* Keep this session's count in memory. */ } return; }
    try { const r = await fetch('/state', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ state: patch }) }); if (!r.ok) throw 0; const d = await r.json(); state = { ...state, ...d.state }; render(); }
    catch (_) { setOnline(false); toast('Could not update total'); }
  }
  if (!overlayMode) {
    document.querySelectorAll('.coin-btn').forEach(btn => btn.addEventListener('click', () => gift(Number(btn.dataset.coins))));
    document.querySelectorAll('.theme-btn').forEach(btn => btn.addEventListener('click', () => save({ theme: btn.dataset.theme })));
    const bindInputs = [['titleInput','title'],['subtitleInput','subtitle'],['likerInput','liker'],['gifterInput','gifter'],['savingsLabelInput','savingsLabel']];
    bindInputs.forEach(([id,key]) => $(id).addEventListener('input', e => scheduleSave({ [key]: e.target.value })));
    $('goalInput').addEventListener('input', e => { const val = Math.max(1, Math.min(99999999, Number(e.target.value) || 1)); scheduleSave({ goal: val }); });
    $('muteToggle').addEventListener('change', e => save({ muted: e.target.checked }));
    $('sceneryToggle').addEventListener('change', e => save({ showScenery: e.target.checked }));
    $('currencyToggle').addEventListener('click', () => save({ currency: state.currency === 'USD' ? 'GBP' : 'USD' }));
    $('animationToggle').addEventListener('click', () => save({ animations: !state.animations }));
    $('timerBtn').addEventListener('click', () => save({ liveTimer: !state.liveTimer, liveTimerAt: state.liveTimer ? state.liveTimerAt : Date.now() }));
    $('previewTenK').addEventListener('click', () => {
      window.AnimationManager?.enqueue({ eventId: `preview-${Date.now()}`, coins: 10000, theme: 'christmas', previewOnly: true });
      toast('Preview only · total unchanged');
    });
    document.querySelectorAll('.overlay-title,.overlay-caption').forEach(el => el.addEventListener('click', () => {
      const input = el.id === 'overlayTitle' ? $('titleInput') : $('subtitleInput');
      input.focus({ preventScroll: true }); input.select();
    }));
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
  async function poll() { if (hostedMode) return; try { await requestState(); } catch (_) { setOnline(false); } }
  render();
  if (!hostedMode) { poll(); setInterval(poll, 900); }
  setInterval(() => { if (state.liveTimer) render(); }, 1000);
})();
