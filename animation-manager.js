(() => {
  const THEMES = {
    normal: { 10: ['🏄‍♂️', '✨', '💝'], 100: ['🌊', '💫', '🎊'], 1000: ['🌊', '🏄‍♂️', '🐬'], 5000: ['⚡', '🛡️', '🐉'], 1: ['✨', '💛'] },
    christmas: { 10: ['🎁', '🛷', '🎄'], 100: ['❄️', '🎄', '🌨️'], 1000: ['🧝', '🎅', '🦌'], 5000: ['🎆', '🎅', '🎄'], 1: ['❄️', '⭐'] },
    halloween: { 10: ['🎃', '🦇', '🍬'], 100: ['🎃', '🕸️', '🦇'], 1000: ['👻', '🧙', '🦇'], 5000: ['🎃', '👻', '🌕'], 1: ['🦇', '🕸️'] }
  };
  const LABELS = { 1: 'A little love!', 10: 'Gift received!', 100: 'Big thanks!', 1000: 'Amazing support!', 5000: 'Incredible!' };
  const overlayMode = new URLSearchParams(location.search).has('overlay');
  const layer = document.getElementById(overlayMode ? 'effectLayer' : 'controlEffectLayer');
  const ambient = document.getElementById(overlayMode ? 'ambientLayer' : 'controlAmbientLayer');
  const queue = [];
  let playing = false;
  let ambientTheme = '';
  let audioContext;
  function symbol(theme, coins) {
    const map = THEMES[theme] || THEMES.normal;
    const options = map[coins];
    if (!options || !options.length) { console.warn('No gift animation mapping', theme, coins); return null; }
    return options[Math.floor(Math.random() * options.length)];
  }
  function sound(coins) {
    if (window.counterMuted) return;
    try {
      audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioContext.createOscillator(), gain = audioContext.createGain();
      osc.type = 'sine'; osc.frequency.value = coins >= 1000 ? 760 : coins >= 100 ? 640 : 520;
      gain.gain.setValueAtTime(.045, audioContext.currentTime); gain.gain.exponentialRampToValueAtTime(.001, audioContext.currentTime + .22);
      osc.connect(gain); gain.connect(audioContext.destination); osc.start(); osc.stop(audioContext.currentTime + .23);
    } catch (_) { /* Audio is optional. */ }
  }
  function setTheme(theme) {
    if (!ambient || ambientTheme === theme) return;
    ambientTheme = theme;
    ambient.replaceChildren();
    const glyphs = theme === 'christmas' ? ['❄', '❅', '✦', '❆'] : theme === 'halloween' ? ['🍂', '🍁', '🦇', '🎃', '🍂'] : ['✦', '✧', '·', '✦'];
    const count = theme === 'christmas' ? 58 : theme === 'halloween' ? 42 : 26;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('span');
      p.className = `particle particle-${theme}`;
      p.textContent = glyphs[Math.floor(Math.random() * glyphs.length)];
      p.style.setProperty('--x', `${Math.random() * 100}%`);
      const size = theme === 'normal' ? 12 + Math.random() * 13 : theme === 'christmas' ? 13 + Math.random() * 19 : 16 + Math.random() * 27;
      const duration = theme === 'normal' ? 12 + Math.random() * 14 : theme === 'christmas' ? 7 + Math.random() * 9 : 9 + Math.random() * 12;
      p.style.setProperty('--size', `${size}px`);
      p.style.setProperty('--duration', `${duration}s`);
      p.style.setProperty('--drift', `${Math.random() * 220 - 110}px`);
      p.style.animationDelay = `${Math.random() * -20}s`;
      ambient.append(p);
    }
  }
  function enqueue(event) { if (event && Number.isInteger(Number(event.coins))) { queue.push(event); playNext(); } }
  function playNext() {
    if (playing || !queue.length) return;
    playing = true;
    const item = queue.shift(), coins = Number(item.coins), theme = item.theme || document.body.dataset.theme || 'normal';
    const glyph = symbol(theme, coins);
    if (!glyph) { playing = false; return playNext(); }
    sound(coins);
    layer.closest('.control-preview')?.classList.add('has-gift');
    const effect = document.createElement('div');
    effect.className = 'gift-effect ' + (coins >= 5000 ? 'spectacle' : coins >= 1000 ? 'reveal' : coins >= 100 ? 'sweep' : '');
    effect.textContent = glyph; layer.append(effect);
    if (coins >= 5000) { const flash = document.createElement('div'); flash.className = 'flash'; layer.append(flash); setTimeout(() => flash.remove(), 700); }
    const label = document.createElement('div'); label.className = 'effect-label'; label.textContent = LABELS[coins] || 'Thank you!'; layer.append(label);
    const duration = coins >= 5000 ? 4800 : coins >= 1000 ? 3400 : coins >= 100 ? 2400 : 1350;
    setTimeout(() => { effect.remove(); label.remove(); playing = false; if (!queue.length) layer.closest('.control-preview')?.classList.remove('has-gift'); playNext(); }, duration);
  }
  window.AnimationManager = { enqueue, setTheme };
})();
