/* Existing counter controls, shared state and direct editing of the live preview. */
(() => {
  const KEY='liveGiftCounter.v1', amounts=[1,10,100,1000,5000,10000];
  const defaults={total:0,history:[],title:'Do you love Christmas?',message:'Share and like the live ✨',liker:'',gifter:'',goalLabel:'Saving for my controller',goal:50,keys:['Alt+1','Alt+2','Alt+3','Alt+4','Alt+5','Alt+6'],likerKey:'Alt+L',gifterKey:'Alt+G',theme:'christmas',mute:false,scenicOverlay:false,animationQueue:[],currency:'GBP',animationsEnabled:true,timerEnabled:false,liveStartedAt:null,timerLabel:'LIVE FOR',moneyLabel:'MONEY MADE FROM THIS LIVE',note:'✨ All gifts are appreciated ✨',likerLabel:'💜 TOP LIKER:',gifterLabel:'🎁 TOP GIFTER:',themeText:{}};
  const themeCopy={christmas:['Do you love Christmas?','Share and like the live ✨'],halloween:['Do you like Halloween?','Share and like the live 🎃'],normal:['Welcome to my live','Share and like the live']};
  const finales={normal:{name:'The Perfect Wave',preview:'Preview 10K wave'},halloween:{name:'The Haunted Moon',preview:'Preview 10K moon'},christmas:{name:'The Village Lights Up',preview:'Preview 10K Christmas'}};
  const overlayMode=new URLSearchParams(location.search).has('overlay');
  const el=id=>document.getElementById(id);
  let state=load(),listening=-1,particleTheme='',pendingWrite=null,writing=false;

  function normalize(saved){
    const merged={...defaults,...saved};
    const modified=k=>/^(Alt|Ctrl|Shift|Meta)\+/i.test(String(k))?String(k):`Alt+${k}`;
    merged.keys=(Array.isArray(merged.keys)?merged.keys:defaults.keys).slice(0,amounts.length).map(modified);
    merged.likerKey=modified(merged.likerKey);merged.gifterKey=modified(merged.gifterKey);
    while(merged.keys.length<amounts.length){const used=[...merged.keys,merged.likerKey,merged.gifterKey].map(k=>k.toLowerCase());let candidate=defaults.keys[merged.keys.length];for(let i=0;used.includes(candidate.toLowerCase());i++)candidate=i===0?'Alt+0':`Alt+F${i+1}`;merged.keys.push(candidate)}
    merged.currency=merged.currency==='USD'?'USD':'GBP';merged.animationsEnabled=merged.animationsEnabled!==false;
    merged.theme=Object.hasOwn(themeCopy,merged.theme)?merged.theme:'christmas';
    merged.themeText=merged.themeText&&typeof merged.themeText==='object'?{...merged.themeText}:{};
    merged.history=Array.isArray(merged.history)?merged.history:[];
    merged.liveStartedAt=Number.isFinite(merged.liveStartedAt)&&merged.liveStartedAt>0?merged.liveStartedAt:null;
    merged.timerEnabled=!!merged.timerEnabled&&!!merged.liveStartedAt;
    return merged;
  }
  function load(){try{return normalize(JSON.parse(localStorage.getItem(KEY)||'{}'))}catch{return normalize({})}}
  async function flush(){
    if(writing)return;writing=true;
    try{while(pendingWrite!==null){const body=pendingWrite;pendingWrite=null;const r=await fetch('/state',{method:'POST',headers:{'Content-Type':'application/json'},body});if(!r.ok)throw new Error(`State sync failed (${r.status})`)}}
    catch(error){console.error('[Overlay sync]',error);status('Could not sync with OBS. Check that the local server is running.')}
    finally{writing=false}
  }
  function save(){const body=JSON.stringify(state);localStorage.setItem(KEY,body);if(location.protocol!=='file:'){pendingWrite=body;flush()}render()}
  function money(n){return new Intl.NumberFormat(state.currency==='USD'?'en-US':'en-GB',{style:'currency',currency:state.currency}).format(Math.round((Number(n)||0)*100)/100)}
  function status(message){el('editStatus').textContent=message}
  function text(id,value){const node=el(id);if(document.activeElement!==node&&node.textContent!==String(value))node.textContent=value}
  function queueAnimation(n,source){const event={id:crypto.randomUUID(),coins:n,theme:state.theme,tier:amounts.indexOf(n),source,at:Date.now()};state.animationQueue=[...(state.animationQueue||[]),event].slice(-40);save();window.GiftAnimationManager?.enqueue(event)}
  function addCoins(n,source='manual'){state.history.push(n);state.total+=(n*12/1000*.4);queueAnimation(n,source);const total=el('total');total.classList.remove('flash');if(state.animationsEnabled){void total.offsetWidth;total.classList.add('flash')}}
  function particles(){
    if(particleTheme===state.theme)return;particleTheme=state.theme;
    document.body.classList.remove('theme-christmas','theme-halloween','theme-normal');document.body.classList.add(`theme-${state.theme}`);
    el('particles').innerHTML=Array.from({length:state.theme==='normal'?0:state.theme==='christmas'?42:20},(_,i)=>{const size=state.theme==='christmas'?3+(i*7)%9:7+(i*3)%9;return `<span class="particle ${state.theme==='christmas'?'ambient-snow':'ambient-leaf'}" style="--x:${(i*37+3)%100}vw;--size:${size}px;width:${size}px;height:${size}px;--duration:${9+(i%9)}s;--delay:-${(i*3)%15}s;--drift:${(i%2?1:-1)*(18+(i*11)%110)}px"></span>`}).join('');
  }
  function localDateTime(ms){const date=new Date(ms);return new Date(ms-date.getTimezoneOffset()*60000).toISOString().slice(0,19)}
  function tickTimer(){
    el('oTimer').hidden=!state.timerEnabled;
    if(!state.timerEnabled)return;
    const seconds=Math.max(0,Math.floor((Date.now()-state.liveStartedAt)/1000));
    const hours=Math.floor(seconds/3600),minutes=Math.floor(seconds/60)%60;
    text('oTimerValue',[hours,minutes,seconds%60].map(n=>String(n).padStart(2,'0')).join(':'));
  }
  function switchTheme(theme){state.themeText[state.theme]={title:state.title,message:state.message};state.theme=theme;const copy=state.themeText[theme];state.title=copy?.title??themeCopy[theme][0];state.message=copy?.message??themeCopy[theme][1];save()}
  function render(){
    document.body.classList.toggle('overlay-mode',overlayMode);document.body.classList.toggle('scenic-overlay',!!state.scenicOverlay);
    el('controller').hidden=overlayMode;el('previewHeading').hidden=overlayMode;particles();
    document.querySelectorAll('[data-theme]').forEach(b=>{b.classList.toggle('active',b.dataset.theme===state.theme);b.onclick=()=>switchTheme(b.dataset.theme)});
    text('total',money(state.total));text('estimateTag',`Estimate · ${money(12)} / 1,000 coins · 40% creator share`);text('goalInputLabel',`Goal (${state.currency==='USD'?'$':'£'})`);
    el('coins').innerHTML=amounts.map(n=>`<button class="coin" data-amount="${n}"><b>${n.toLocaleString('en-GB')} coin${n===1?'':'s'}</b><small>+${money(n*12/1000*.4)}</small></button>`).join('');
    document.querySelectorAll('[data-amount]').forEach(b=>b.onclick=()=>addCoins(Number(b.dataset.amount)));
    const finale=finales[state.theme];text('previewFinale',finale.preview);el('previewFinale').hidden=false;el('previewFinale').disabled=!state.animationsEnabled;
    el('previewFinale').onclick=()=>{if(state.animationsEnabled)queueAnimation(10000,'preview')};text('finaleHint',state.animationsEnabled?`10,000 coins: ${finale.name}. Preview plays without changing your total.`:'Coin animations are off. Gifts still add to your total.');
    document.querySelectorAll('[data-field]').forEach(input=>{if(document.activeElement!==input)input.value=state[input.dataset.field]??'';input.oninput=()=>{const value=input.type==='number'?Number(input.value):input.value.slice(0,300);if(input.type==='number'&&(!Number.isFinite(value)||value<0))return;state[input.dataset.field]=value;save()}});
    const keyRows=amounts.map((n,i)=>`<div class="keyrow"><span>${n.toLocaleString('en-GB')} coins</span><button class="key ${listening===i?'listening':''}" data-key="${i}">${listening===i?'Press a key…':escapeHtml(state.keys[i]||'')}</button></div>`).join('');
    const special=[['liker','Edit top liker',state.likerKey],['gifter','Edit top gifter',state.gifterKey]].map(([id,label,key])=>`<div class="keyrow"><span>${label}</span><button class="key ${listening===id?'listening':''}" data-special="${id}">${listening===id?'Press a key…':escapeHtml(key||'')}</button></div>`).join('');
    el('keylist').innerHTML=keyRows+special;
    document.querySelectorAll('[data-key]').forEach(b=>b.onclick=()=>{listening=Number(b.dataset.key);el('hint').textContent='Press a shortcut to assign it. Escape cancels.';render()});
    document.querySelectorAll('[data-special]').forEach(b=>b.onclick=()=>{listening=b.dataset.special;el('hint').textContent='Press a shortcut to assign it. Escape cancels.';render()});
    el('undo').onclick=()=>{const n=state.history.pop();if(n)state.total=Math.max(0,state.total-n*12/1000*.4);save()};
    el('reset').onclick=()=>{if(confirm('Reset the total and undo history for this live?')){state.total=0;state.history=[];save()}};
    window.__giftAnimationsEnabled=state.animationsEnabled;window.GiftAnimationManager?.setMuted(state.mute);window.GiftAnimationManager?.setEnabled(state.animationsEnabled);
    el('mute').checked=!!state.mute;el('mute').onchange=e=>{state.mute=e.target.checked;save()};
    el('scenicOverlay').checked=!!state.scenicOverlay;el('scenicOverlay').onchange=e=>{state.scenicOverlay=e.target.checked;save()};
    text('currencyToggle',`Currency: ${state.currency==='USD'?'$ USD':'£ GBP'}`);el('currencyToggle').onclick=()=>{state.currency=state.currency==='GBP'?'USD':'GBP';save()};
    text('animationToggle',`Coin animations: ${state.animationsEnabled?'on':'off'}`);el('animationToggle').setAttribute('aria-pressed',String(state.animationsEnabled));el('animationToggle').onclick=()=>{state.animationsEnabled=!state.animationsEnabled;save()};
    text('timerToggle',state.timerEnabled?'Hide live timer':'Add live timer');el('timerToggle').setAttribute('aria-pressed',String(state.timerEnabled));el('timerToggle').onclick=()=>{state.timerEnabled=!state.timerEnabled;if(state.timerEnabled&&!state.liveStartedAt)state.liveStartedAt=Date.now();save()};
    el('timerRestart').hidden=!state.timerEnabled;el('timerSetting').hidden=!state.timerEnabled;el('timerRestart').onclick=()=>{state.liveStartedAt=Date.now();save()};
    if(document.activeElement!==el('timerStart'))el('timerStart').value=state.liveStartedAt?localDateTime(state.liveStartedAt):'';
    el('timerStart').max=localDateTime(Date.now());el('timerStart').onchange=e=>{const date=new Date(e.target.value).getTime();if(!Number.isFinite(date)||date<=0||date>Date.now()){status('Choose a valid start time that is not in the future.');render();return}state.liveStartedAt=date;save()};
    el('mockGift').onclick=async()=>{if(location.protocol==='file:'){addCoins(100,'mock');return}try{const r=await fetch('/gift-event',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({eventId:`mock-${crypto.randomUUID()}`,coins:100})});if(!r.ok)throw new Error(`Server returned ${r.status}: ${await r.text()}`)}catch(error){console.error('[Gift event] Mock event failed',error);alert(`Could not send the mock gift event. ${error.message.includes('Failed to fetch')?'The local server is not reachable. Run Start-Overlay.ps1 and use the page it opens.':error.message}`)}};
    const labels={oTitle:state.title,oMoneyLabel:state.moneyLabel,oTotal:money(state.total),oNote:state.note,oLikerLabel:state.likerLabel,oGifterLabel:state.gifterLabel,oLiker:state.liker||'—',oGifter:state.gifter||'—',oGoalLabel:state.goalLabel,oGoalTotal:money(state.total),oGoalTarget:money(state.goal),oMessage:state.message,oTimerLabel:state.timerLabel};
    Object.entries(labels).forEach(([id,value])=>text(id,value));el('oBar').style.width=`${state.goal>0?Math.min(100,state.total/state.goal*100):0}%`;tickTimer();
  }
  function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function isEditing(){const active=document.activeElement;return active?.isContentEditable||active?.matches('input,textarea,select')}
  document.querySelectorAll('[data-edit]').forEach(node=>{
    const field=node.dataset.edit;node.contentEditable='plaintext-only';node.setAttribute('role','textbox');node.setAttribute('aria-label',`Edit ${field.replace(/([A-Z])/g,' $1').toLowerCase()}`);node.title='Click to edit. Enter saves; Escape cancels.';
    let original,cancelled=false,dirty=false;
    node.onfocus=()=>{original=node.dataset.time?node.textContent:state[field];cancelled=false;dirty=false;node.textContent=String(original??'')};
    node.oninput=()=>{dirty=true;if(node.dataset.number||node.dataset.time)return;state[field]=node.textContent.slice(0,300);save()};
    node.onblur=()=>{if(cancelled||!dirty){cancelled=false;render();return}if(node.dataset.time){const match=node.textContent.trim().match(/^(\d{1,4}):([0-5]\d):([0-5]\d)$/);if(!match){status('Use hours:minutes:seconds, for example 01:25:00.')}else{const seconds=Number(match[1])*3600+Number(match[2])*60+Number(match[3]);state.liveStartedAt=Date.now()-seconds*1000;save()}}else if(node.dataset.number){const raw=node.textContent.trim().replace(/[£$,\s]/g,'');const value=raw===''?NaN:Number(raw);if(!Number.isFinite(value)||value<0){status('Enter a number of zero or more. Your previous amount was kept.')}else if(value!==state[field]){state[field]=value;if(field==='total'){state.history=[];status('Total updated. Undo history cleared for the new starting amount.')}save()}}render()};
    node.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();e.stopPropagation();node.blur()}else if(e.key==='Escape'){e.preventDefault();e.stopPropagation();cancelled=true;if(!node.dataset.number&&!node.dataset.time){state[field]=original;save()}node.textContent=String(original??'');node.blur()}};
  });
  window.addEventListener('storage',e=>{if(e.key===KEY){state=load();render()}});
  async function readState(){if(writing||pendingWrite!==null||isEditing())return;try{const r=await fetch('/state',{cache:'no-store'});if(!r.ok)throw new Error(`State read failed (${r.status})`);const saved=await r.json();if(saved&&Object.keys(saved).length&&!writing&&pendingWrite===null&&!isEditing()){state=normalize(saved);localStorage.setItem(KEY,JSON.stringify(state));render()}}catch(error){console.info('[Overlay sync] Waiting for local server',error)}}
  if(location.protocol!=='file:'){readState();setInterval(readState,700)}
  function combo(e){const key=e.key.length===1?e.key.toUpperCase():e.key;return [...(e.ctrlKey?['Ctrl']:[]),...(e.altKey?['Alt']:[]),...(e.shiftKey?['Shift']:[]),...(e.metaKey?['Meta']:[]),key].join('+')}
  window.addEventListener('keydown',e=>{
    if(overlayMode)return;
    if(listening!==-1){e.preventDefault();if(e.key==='Escape'){listening=-1;el('hint').textContent='Keybind unchanged.';render();return}if(['Alt','Control','Shift','Meta'].includes(e.key))return;if(!e.altKey&&!e.ctrlKey&&!e.metaKey){el('hint').textContent='Use Alt, Ctrl, or another modifier with this key.';return}const key=combo(e);if(typeof listening==='number')state.keys[listening]=key;else state[`${listening}Key`]=key;listening=-1;el('hint').textContent='Keybind saved.';save();return}
    const key=combo(e);
    if(key===state.likerKey||key===state.gifterKey){e.preventDefault();const y=scrollY;el(key===state.likerKey?'liker':'gifter').focus({preventScroll:true});scrollTo(scrollX,y);return}
    if(isEditing()||(!e.altKey&&!e.ctrlKey&&!e.metaKey))return;
    const i=state.keys.findIndex(x=>x.toLowerCase()===key.toLowerCase());if(i>=0){e.preventDefault();addCoins(amounts[i])}
  });
  render();setInterval(tickTimer,1000);
  window.addEventListener('gift-event',e=>{const event=e.detail;if(event&&Number.isInteger(event.coins)&&amounts.includes(event.coins))addCoins(event.coins,'backend')});
})();
