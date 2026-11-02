/* Physical-key shortcuts keep Option combinations consistent on Mac keyboards. */
(() => {
  const modifiers = {ctrl:'Ctrl', alt:'Alt', shift:'Shift', meta:'Meta'};
  const aliases = {control:'Ctrl', ctrl:'Ctrl', alt:'Alt', option:'Alt', opt:'Alt', shift:'Shift', meta:'Meta', command:'Meta', cmd:'Meta', win:'Meta', os:'Meta'};
  const punctuation = {Backquote:'`', Minus:'-', Equal:'=', BracketLeft:'[', BracketRight:']', Backslash:'\\', Semicolon:';', Quote:"'", Comma:',', Period:'.', Slash:'/'};
  const modifierCodes = {Control:'Ctrl', Alt:'Alt', Shift:'Shift', Meta:'Meta', OS:'Meta'};
  const mac = /Mac|iPhone|iPad/i.test(navigator.userAgentData?.platform || navigator.platform || '');

  function keyName(key) {
    if (key === ' ') return 'Space';
    const names = {spacebar:'Space', space:'Space', esc:'Escape', return:'Enter', del:'Delete', left:'ArrowLeft', right:'ArrowRight', up:'ArrowUp', down:'ArrowDown'};
    return aliases[String(key).toLowerCase()] || names[String(key).toLowerCase()] || (String(key).length === 1 ? key.toUpperCase() : key);
  }
  function codeFor(key) {
    if (/^[A-Z]$/.test(key)) return `Key${key}`;
    if (/^[0-9]$/.test(key)) return `Digit${key}`;
    return Object.keys(punctuation).find(code => punctuation[code] === key) || key;
  }
  function normalize(binding) {
    if (binding && typeof binding === 'object') {
      const key = keyName(String(binding.key || ''));
      return {key, code:binding.code || codeFor(key), ...Object.fromEntries(Object.keys(modifiers).map(m => [m, !!binding[m]]))};
    }
    const parts = String(binding || '').split('+');
    const result = {key:'', code:'', ctrl:false, alt:false, shift:false, meta:false};
    // Keep a trailing '+' as a real key, rather than losing it when splitting.
    const rawKey = parts.pop();
    result.key = keyName(rawKey === '' && parts.length ? '+' : rawKey);
    if (result.key === '+' && parts.at(-1) === '') parts.pop();
    for (const part of parts) {
      const name = aliases[part.toLowerCase()];
      const flag = Object.keys(modifiers).find(m => modifiers[m] === name);
      if (flag) result[flag] = true;
    }
    result.code = codeFor(result.key);
    return result;
  }
  function fromEvent(event) {
    let code = event.code || '';
    const modifier = modifierCodes[code.replace(/Left|Right/g, '')] || aliases[String(event.key).toLowerCase()];
    let key;
    if (modifier) { key = modifier; code = modifier; }
    else if (/^Key[A-Z]$/.test(code)) key = code.slice(3);
    else if (/^Digit[0-9]$/.test(code)) key = code.slice(5);
    else if (/^Numpad/.test(code)) key = code;
    else key = punctuation[code] || (code === 'Space' ? 'Space' : keyName(event.key));
    if (!code || code === 'Unidentified') code = codeFor(key);
    const binding = {key, code, ctrl:!!event.ctrlKey, alt:!!event.altKey, shift:!!event.shiftKey, meta:!!event.metaKey};
    if (modifier) binding[Object.keys(modifiers).find(m => modifiers[m] === modifier)] = false;
    return binding;
  }
  function matches(binding, event) {
    const saved = normalize(binding), pressed = fromEvent(event);
    const legacySymbol = saved.code === saved.key && saved.key.toLowerCase() === String(keyName(event.key)).toLowerCase();
    return !!saved.key && (saved.code === pressed.code || legacySymbol || (!event.code && saved.key.toLowerCase() === pressed.key.toLowerCase())) && Object.keys(modifiers).every(m => saved[m] === pressed[m]);
  }
  function same(left, right) {
    const a = normalize(left), b = normalize(right);
    return !!a.key && a.code === b.code && Object.keys(modifiers).every(m => a[m] === b[m]);
  }
  function label(binding) {
    const b = normalize(binding);
    const name = key => mac ? ({Alt:'Option', Meta:'Command', Ctrl:'Control'}[key] || key) : ({Meta:'Windows'}[key] || key);
    const readable = {ArrowUp:'↑', ArrowDown:'↓', ArrowLeft:'←', ArrowRight:'→', Backquote:'`'};
    return [...Object.keys(modifiers).filter(m => b[m]).map(m => name(modifiers[m])), name(readable[b.key] || b.key.replace(/^Numpad/, 'Numpad '))].join('+');
  }
  function isModifier(event) { return !!modifierCodes[String(event.code || '').replace(/Left|Right/g, '')] || ['Alt','Control','Shift','Meta','OS'].includes(event.key); }
  window.GiftShortcuts = {normalize, fromEvent, matches, same, label, isModifier};
})();
