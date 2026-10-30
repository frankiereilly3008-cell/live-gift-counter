/* Theme-aware, sequential overlay animation playback. Kept separate from the controller. */
(() => {
  const layer = document.getElementById('giftFx');
  const queue = [];
  const coinTiers = [1,10,100,1000,5000,10000];
  const played = new Set();
  let busy = false;
  let initialized = false;
  let muted = !!document.getElementById('mute')?.checked;
  let audioContext = null;
  let audioOutput = null;
  let enabled = window.__giftAnimationsEnabled !== false;
  let activeScene = null, activeTimer = null;
  const audioSources = new Set();
  const themes = {
    christmas: ['✨', '🎁', '🌨️', '🧝🧝', '🎅'],
    halloween: ['✨', '🎃', '🎃', '👻👻', '🎃'],
    normal: ['✨', '🏄', '🌊', '🌊', '🛡️⚔️']
  };
  function setMuted(value) {
    muted = !!value;
    if (audioOutput && audioContext) audioOutput.gain.setTargetAtTime(muted || !enabled ? 0 : .42,audioContext.currentTime,.015);
  }
  function setEnabled(value) {
    const next=value!==false;if(next===enabled)return;enabled=next;window.__giftAnimationsEnabled=enabled;
    if(!enabled){queue.forEach(event=>played.add(event.id));queue.length=0;if(activeTimer!==null)clearTimeout(activeTimer);activeTimer=null;activeScene?.remove();activeScene=null;busy=false;audioSources.forEach(source=>{try{source.stop()}catch{}try{source.disconnect()}catch{}});audioSources.clear()}
    setMuted(muted);
  }
  function sound(theme,tier) {
    if (!enabled || muted || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    try {
      const Ctx=window.AudioContext||window.webkitAudioContext;
      if(!Ctx)return;
      if(!audioContext){audioContext=new Ctx();audioOutput=audioContext.createGain();audioOutput.gain.value=.42;audioOutput.connect(audioContext.destination);}
      if(audioContext.state==='suspended')audioContext.resume().catch(()=>{});
      const start=audioContext.currentTime;
      function note(frequency,at,length=.3,volume=.12,type='sine',end=frequency){
        const osc=audioContext.createOscillator(),gain=audioContext.createGain();
        osc.type=type;osc.frequency.setValueAtTime(frequency,start+at);osc.frequency.exponentialRampToValueAtTime(Math.max(20,end),start+at+length);
        gain.gain.setValueAtTime(.001,start+at);gain.gain.linearRampToValueAtTime(volume,start+at+.015);gain.gain.exponentialRampToValueAtTime(.001,start+at+length);
        osc.connect(gain);gain.connect(audioOutput);audioSources.add(osc);osc.start(start+at);osc.stop(start+at+length+.02);osc.onended=()=>{audioSources.delete(osc);osc.disconnect();gain.disconnect();};
      }
      function wind(at,length=.5,volume=.08){
        const buffer=audioContext.createBuffer(1,Math.ceil(audioContext.sampleRate*length),audioContext.sampleRate),data=buffer.getChannelData(0);
        for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1);
        const source=audioContext.createBufferSource(),filter=audioContext.createBiquadFilter(),gain=audioContext.createGain();source.buffer=buffer;filter.type='lowpass';filter.frequency.value=1400;
        gain.gain.setValueAtTime(.001,start+at);gain.gain.exponentialRampToValueAtTime(volume,start+at+length*.45);gain.gain.exponentialRampToValueAtTime(.001,start+at+length);
        source.connect(filter);filter.connect(gain);gain.connect(audioOutput);audioSources.add(source);source.start(start+at);source.onended=()=>{audioSources.delete(source);source.disconnect();filter.disconnect();gain.disconnect();};
      }
      if(theme==='christmas'){
        const melody=[1046.5,1318.5,1568,2093];
        melody.slice(0,tier===0?1:4).forEach((f,i)=>note(f,.1+i*.17,.55,.11));
        if(tier===1)note(2093,1.1,.7,.1);
        if(tier===2)wind(.25,1.9,.1);
        if(tier===3){[4.15,4.6,5].forEach(at=>wind(at,.55,.14));note(659,1.3,.4,.09);note(784,2,.4,.09);}
        if(tier===4){wind(1.9,1.2,.1);melody.forEach((f,i)=>note(f,2.3+i*.24,1.3,.11));note(261.6,2.2,1.5,.1);}
        if(tier===5){[.8,1.25,1.8,2.4].forEach((at,i)=>note(melody[i],at,1.2,.07));wind(1.7,1.6,.07);[523.3,659.3,784,1046.5].forEach((f,i)=>note(f,3.5+i*.23,2.1,.07));wind(6.3,2,.13);note(2093,6.5,1.8,.08);wind(8.3,1.2,.04);}
      }else if(theme==='halloween'){
        if(tier===0){note(700,.04,.25,.07,'sine',350);wind(.12,.2,.04);}
        if(tier===1){[196,293.7,220].forEach((f,i)=>note(f,.12+i*.28,.35,.08,'triangle'));}
        if(tier===2){note(90,.08,.9,.09,'triangle',45);wind(.25,2.2,.11);}
        if(tier===5){note(55,.05,2.2,.09,'triangle',40);wind(.15,2.6,.065);note(146.8,1.8,2.4,.065,'sine',196);note(155.6,2.1,2,.045,'sine',207.7);[3.2,3.7,4.25].forEach(at=>wind(at,.48,.065));note(98,4.6,1.6,.07,'triangle',196);wind(5.6,1.8,.15);note(65,6.4,.9,.17,'triangle',30);wind(7.2,1.8,.065);}
        else if(tier>=3){note(110,.05,.8,.1,'triangle',70);wind(.3,2,.1);note(146.8,1.6,1.2,.1,'sine',220);wind(tier===4?4.5:3.8,1,.16);note(65,4.4,.8,.17,'triangle',32);}
      }else{
        if(tier===0){note(1200,.05,.28,.09,'sine',600);}
        if(tier===1){wind(.15,.8,.07);note(660,.1,.5,.08,'sine',880);}
        if(tier===2){wind(.15,2.4,.11);note(165,.2,.9,.08,'sine',110);}
        if(tier===5){wind(.1,2.5,.05);[261.6,329.6,392,523.3].forEach((f,i)=>note(f,.4+i*.22,1.7,.045));wind(2.4,2.4,.09);wind(5.9,1.8,.17);note(82.4,6.6,1.1,.1,'sine',41.2);wind(7.6,1.2,.045);}
        else if(tier>=3){wind(.1,.8,.08);note(440,.1,.6,.1,'sine',880);wind(2,.8,.1);note(165,1.8,1.1,.12,'triangle',330);wind(4.7,.7,.16);note(65,4.7,.6,.14,'triangle',30);}
      }
    }catch(error){report('Sound unavailable',error);}
  }
  function visual(theme, tier) {
    if (tier === 1) return theme === 'christmas'
      ? '<div class="gift-prop present"><i class="lid"></i><i class="ribbon-v"></i><i class="ribbon-h"></i><i class="bow">✦</i></div>'
      : theme === 'halloween' ? '<div class="gift-prop mini-pumpkin"><i class="eyes"></i><i class="mouth"></i><i class="stem"></i></div>'
      : '<div class="gift-prop surfboard"><i class="stripe"></i><i class="fin"></i></div>';
    if (tier === 2) return `<div class="weather-sweep ${theme}">${Array.from({length:34},(_,i)=>`<i style="--x:${(i*37)%100}%;--delay:${(i%11)*-.17}s;--drift:${(i%2?1:-1)*(20+(i*19)%150)}px">${theme==='christmas'?'❄':theme==='halloween'?'🎃':'●'}</i>`).join('')}</div>`;
    if (tier === 3 && theme === 'halloween') return '<div class="ghost-duo"><i class="ghost left"></i><i class="ghost right"></i><b>THE SPIRITS ARE HERE</b></div>';
    if (tier === 3 && theme === 'christmas') return '<div class="elf-scene"><i class="elf left">🧝</i><i class="cane">🍭</i><i class="elf right">🧝</i><b>CANDY CANE CHAOS</b><div class="snowburst"></div></div>';
    if (tier === 3) return '<div class="wave-scene"><i class="wave-crest">🌊</i><b>MAKE A SPLASH</b></div>';
    if (tier === 4 && theme === 'halloween') return '<div class="giant-pumpkin"><i class="pumpkin-stem"></i><i class="pumpkin-eyes"></i><i class="pumpkin-mouth"></i><i class="crack"></i></div>';
    if (tier === 4 && theme === 'christmas') return '<div class="holiday-finale"><i>🎁</i><i>🎄</i><i>🎁</i><b>HOLIDAY MAGIC</b><div class="snowburst"></div></div>';
    if (tier === 4) return '<div class="warrior-scene"><i class="portal"></i><i class="warrior">🛡️</i><i class="energy-sword">⚔️</i><i class="slash"></i><b>THE LIGHTNING WARRIOR</b></div>';
    return `<div class="spark-icon">${themes[theme][tier]}</div>`;
  }
  function report(message, detail) { console.info(`[Gift animation] ${message}`, detail || ''); }
  function enqueue(event) {
    if (!event || typeof event.id !== 'string' || !Number.isInteger(event.tier) || event.tier < 0 || event.tier >= coinTiers.length) {
      console.warn('[Gift animation] Ignored invalid animation event', event); return;
    }
    if (played.has(event.id) || queue.some(item => item.id === event.id)) return;
    if (!enabled) {played.add(event.id);if(played.size>100)played.delete(played.values().next().value);return;}
    queue.push(event);
    if (queue.length > 40) queue.shift();
    playNext();
  }
  function playNext() {
    if (!enabled || busy || !queue.length) return;
    busy = true;
    const event = queue.shift();
    played.add(event.id);
    if (played.size > 100) played.delete(played.values().next().value);
    const theme = themes[event.theme];
    if (!theme) {
      report('No animation configured; skipping gracefully', event);
      busy = false; playNext(); return;
    }
    let scene;
    try {
    let premiumHtml=null;
    let duration=[900,1700,2800,4900,6400,9600][event.tier];
    for(const module of [window.PremiumChristmasScenes,window.PremiumOtherScenes,window.NormalFinaleScenes,window.HalloweenFinaleScenes,window.ChristmasFinaleScenes]){
      if(!module)continue;
      const markup=module.markup(event.theme,event.tier);
      if(markup!==null&&markup!==undefined){premiumHtml=markup;const timing=module.duration(event.theme,event.tier);if(Number.isFinite(timing)&&timing>0&&timing<15000)duration=timing;break;}
    }
    if(premiumHtml===null&&!theme[event.tier]){report('No animation configured; skipping gracefully',event);busy=false;playNext();return;}
    const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if(reduced)duration=450;
    scene = document.createElement('div');
    scene.className = `cinema ${event.theme} tier-${coinTiers[event.tier]}`;
    if(event.tier<2){
      const counter=document.getElementById(new URLSearchParams(location.search).has('overlay')?'oTotal':'total');
      if(counter?.getBoundingClientRect){const rect=counter.getBoundingClientRect();const x=Math.max(90,Math.min(window.innerWidth-100,rect.left+rect.width*.5+120));const y=Math.max(120,Math.min(window.innerHeight-120,rect.top+rect.height*.5));scene.style.setProperty('--counter-x',`${x}px`);scene.style.setProperty('--counter-y',`${y}px`);}
    }
    if(premiumHtml!==null)scene.classList.add('premium-scene');
    const art = document.createElement('div'); art.className = `scene-art art-${event.theme}-${event.tier}`; art.innerHTML = premiumHtml??visual(event.theme,event.tier);
    const mist = document.createElement('div'); mist.className = 'mist';
    const caption = document.createElement('div'); caption.className = 'caption';
    caption.textContent = event.theme === 'halloween' ? (event.tier===3?'The spirits are here':'The pumpkin awakens') : event.theme === 'christmas' ? (event.tier===3?'Candy cane chaos':'Holiday magic') : (event.tier===4?'Lightning warrior':'Make a splash');
    scene.appendChild(art);
    if(premiumHtml===null){scene.append(mist,caption);
    for(let i=0;i<(event.tier>=2?24:10);i++){const shard=document.createElement('i');shard.className='shard';shard.style.setProperty('--x',`${(i*47+11)%100}%`);shard.style.setProperty('--y',`${(i*31+17)%100}%`);shard.style.setProperty('--dx',`${(i%2?1:-1)*(60+(i*29)%400)}px`);shard.style.setProperty('--dy',`${(i%2?1:-1)*(60+(i*17)%400)}px`);scene.appendChild(shard)}
    }
    layer.appendChild(scene);
    activeScene=scene;
    report(`Playing ${event.theme} tier ${event.tier + 1}`, event);
    sound(event.theme,event.tier);
    activeTimer=setTimeout(() => {scene.remove();activeScene=null;activeTimer=null;busy=false;playNext()},duration);
    }catch(error){scene?.remove();busy=false;console.error('[Gift animation] Scene failed',error);setTimeout(playNext,0);}
  }
  async function poll() {
    try {
      const response = await fetch('/state', {cache:'no-store'});
      if (!response.ok) throw new Error(`State request failed (${response.status})`);
      const state = await response.json();
      window.__giftMuted = !!state.mute;
      setMuted(state.mute);
      setEnabled(state.animationsEnabled);
      const events = Array.isArray(state.animationQueue) ? state.animationQueue : [];
      if (!initialized) {
        initialized=true;
        events.forEach(event=>{if(Number.isFinite(event.at)&&Date.now()-event.at<10000)enqueue(event);else played.add(event.id);});
      } else {
        events.forEach(enqueue);
      }
    } catch (error) { console.warn('[Gift animation] Could not read overlay state', error); }
  }
  window.GiftAnimationManager = { enqueue, setMuted, setEnabled, getQueueLength: () => queue.length };
  if (location.protocol !== 'file:') { poll(); setInterval(poll, 350); }
})();
