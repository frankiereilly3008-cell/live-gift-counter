/* The Haunted Moon — original SVG/CSS artwork, rendered live without external assets. */
(() => {
  const DURATION = 9600;
  const craters = Array.from({length: 34}, (_, i) => {
    const angle = i * 2.399963, radius = 42 + Math.sqrt(i / 34) * 230;
    const x = 300 + Math.cos(angle) * radius, y = 300 + Math.sin(angle) * radius;
    const size = 7 + (i * 13) % 27;
    return `<g opacity="${.16 + (i % 4) * .045}"><ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${size}" ry="${(size * .81).toFixed(1)}" fill="#6b172b" stroke="#ffd294" stroke-opacity=".48" stroke-width="2"/><path d="M${(x-size*.7).toFixed(1)} ${(y+size*.3).toFixed(1)}Q${x.toFixed(1)} ${(y+size*.8).toFixed(1)} ${(x+size*.65).toFixed(1)} ${(y+size*.18).toFixed(1)}" fill="none" stroke="#ffc18c" stroke-width="2"/></g>`;
  }).join('');
  const fissures = 'M300 0L280 75L316 138L293 202L327 251L300 300L352 292L398 268L452 290L518 244L600 250M300 300L354 343L420 350L446 412L526 435L600 510M300 300L285 365L310 420L280 482L311 533L300 600M300 300L245 337L182 321L138 379L66 391L0 460M300 300L248 269L184 285L150 230L79 231L0 165M316 138L370 103L376 54M452 290L468 341M138 379L135 430M184 285L174 341M310 420L354 463';
  const sectors = [
    '300,300 327,251 293,202 316,138 280,75 300,0 0,0 0,165 79,231 150,230 184,285 248,269',
    '300,300 352,292 398,268 452,290 518,244 600,250 600,0 300,0 280,75 316,138 293,202 327,251',
    '300,300 354,343 420,350 446,412 526,435 600,510 600,250 518,244 452,290 398,268 352,292',
    '300,300 285,365 310,420 280,482 311,533 300,600 600,600 600,510 526,435 446,412 420,350 354,343',
    '300,300 245,337 182,321 138,379 66,391 0,460 0,600 300,600 311,533 280,482 310,420 285,365',
    '300,300 248,269 184,285 150,230 79,231 0,165 0,460 66,391 138,379 182,321 245,337'
  ];
  const pieces = sectors.map((_, i) => {
    const angle = (-135 + i * 60) * Math.PI / 180;
    return `<g class="h10-moon-piece" style="--dx:${(Math.cos(angle)*500).toFixed(0)}px;--dy:${(Math.sin(angle)*500).toFixed(0)}px;--turn:${i%2?-28:28}deg"><g clip-path="url(#h10-sector-${i})"><use href="#h10-surface"/></g></g>`;
  }).join('');
  const moon = `<svg class="h10-moon-art" viewBox="-100 -100 800 800" aria-hidden="true"><defs><radialGradient id="h10-moon-fill" cx=".32" cy=".26" r=".76"><stop stop-color="#ffd08e"/><stop offset=".28" stop-color="#dd8758"/><stop offset=".62" stop-color="#a7443c"/><stop offset=".85" stop-color="#5c2135"/><stop offset="1" stop-color="#271a32"/></radialGradient><radialGradient id="h10-moon-shade" cx=".29" cy=".22" r=".81"><stop offset=".45" stop-color="#17112b" stop-opacity="0"/><stop offset=".82" stop-color="#17112b" stop-opacity=".24"/><stop offset="1" stop-color="#090d25" stop-opacity=".85"/></radialGradient><radialGradient id="h10-eye-fill"><stop stop-color="#e7ffd0"/><stop offset=".3" stop-color="#b5ff65"/><stop offset="1" stop-color="#466942"/></radialGradient><clipPath id="h10-sphere-clip"><circle cx="300" cy="300" r="287"/></clipPath>${sectors.map((polygon,i)=>`<clipPath id="h10-sector-${i}"><polygon points="${polygon}"/></clipPath>`).join('')}<g id="h10-surface"><circle cx="300" cy="300" r="287" fill="url(#h10-moon-fill)"/><g clip-path="url(#h10-sphere-clip)"><path d="M94 89Q202 119 180 203T215 353Q155 421 175 501L67 470L13 270ZM366 24Q355 168 428 204T492 404L574 469L605 244L538 65ZM271 454Q337 398 389 464T392 603L196 596Z" fill="#672d3d" opacity=".2"/><path d="M72 158Q178 33 331 45M89 191Q59 248 65 299" stroke="#ffe6b4" stroke-opacity=".3" stroke-width="5" fill="none" stroke-linecap="round"/>${craters}<circle cx="300" cy="300" r="287" fill="url(#h10-moon-shade)"/></g><circle cx="300" cy="300" r="287" fill="none" stroke="#ffd6a7" stroke-opacity=".24" stroke-width="2"/></g></defs><g class="h10-moon-pieces">${pieces}</g><g class="h10-spectral-face"><path d="M121 241Q169 207 237 261L218 326Q165 345 125 294Z M479 241Q431 207 363 261L382 326Q435 345 475 294Z" fill="#1a1830" stroke="#eea37a" stroke-opacity=".45" stroke-width="5"/><g class="h10-face-eyes" fill="url(#h10-eye-fill)"><path d="M133 253Q177 232 224 272L208 305Q166 318 136 283Z"/><path d="M467 253Q423 232 376 272L392 305Q434 318 464 283Z"/></g><path d="M295 295L276 354L303 369L329 349L307 291Z" fill="#391d31" opacity=".8"/><path d="M159 381Q223 420 300 397Q377 420 441 381Q416 473 350 493Q301 518 249 493Q181 473 159 381Z" fill="#17182b" stroke="#ed976d" stroke-opacity=".5" stroke-width="4"/><path d="M183 399L203 443L224 416L249 455L272 422L300 460L328 422L351 455L376 416L397 443L417 399M231 482L255 455L278 490L300 462L324 490L346 455L371 481" fill="none" stroke="#a9d77f" stroke-opacity=".62" stroke-width="7" stroke-linejoin="round"/><path d="M113 218Q170 169 244 227M487 218Q430 169 356 227" fill="none" stroke="#522439" stroke-width="12" stroke-linecap="round"/></g><g class="h10-fissures" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="${fissures}" stroke="#84ff5d" stroke-opacity=".28" stroke-width="16"/><path d="${fissures}" stroke="#c8ff99" stroke-width="4"/><path d="${fissures}" stroke="#f2ffd6" stroke-width="1.3"/></g></svg>`;
  const bat = `<svg viewBox="0 0 150 82" aria-hidden="true"><path class="h10-wing-left" d="M74 37Q51 2 4 7Q17 22 6 51Q24 36 32 65Q47 49 59 76L77 48Z" fill="#21172e" stroke="#bc8c9c" stroke-width="1.4"/><path class="h10-wing-right" d="M76 37Q99 2 146 7Q133 22 144 51Q126 36 118 65Q103 49 91 76L73 48Z" fill="#21172e" stroke="#bc8c9c" stroke-width="1.4"/><path d="M66 28L65 8L76 20L87 8L86 30Q100 53 76 74Q51 55 66 28Z" fill="#110f21" stroke="#8b687e" stroke-width="1.5"/><path d="M67 36L73 39L68 43ZM85 36L79 39L84 43Z" fill="#c2ff92"/></svg>`;
  const bats = Array.from({length:14},(_,i)=>{
    const points = [i*.91,i*.91+1.8,i*.91+3.5,i*.91+5.7].map((a,j)=>`--x${j}:${(Math.cos(a)*(18+j*7)).toFixed(1)}vmin;--y${j}:${(Math.sin(a)*(12+j*5)).toFixed(1)}vmin`).join(';');
    return `<div class="h10-bat-flight" style="${points};--delay:${(i%7)*.09}s;--fly-x:${(i%2?1:-1)*(65+i*3)}vw;--fly-y:${(i%3-1)*(50+i*2)}vh;--scale:${.6+(i%4)*.15}"><div class="h10-bat">${bat}</div></div>`;
  }).join('');
  const leaves = Array.from({length:24},(_,i)=>`<i class="h10-leaf" style="--dx:${(i%2?1:-1)*(22+(i*13)%60)}vw;--dy:${((i*29)%100)-48}vh;--delay:${(i%6)*.065}s;--turn:${(i%2?1:-1)*(240+i*27)}deg;--size:${9+(i*7)%15}px"></i>`).join('');
  const embers = Array.from({length:18},(_,i)=>`<i class="h10-ember" style="--dx:${(i%2?1:-1)*(20+(i*19)%65)}vw;--dy:${((i*37)%100)-58}vh;--delay:${(i%5)*.05}s"></i>`).join('');
  window.HalloweenFinaleScenes = {
    markup(theme,tier) {
      if(theme!=='halloween'||tier!==5)return null;
      return `<div class="halloween-finale" aria-label="10,000 coins — The Haunted Moon"><div class="h10-dusk"></div><div class="h10-fog h10-fog-back"></div><div class="h10-corona"></div><div class="h10-moon-travel">${moon}</div><div class="h10-bat-swarm">${bats}</div><div class="h10-spirit-beam"></div><i class="h10-shockwave"></i><div class="h10-burst-light"></div><div class="h10-debris">${leaves}${embers}</div><div class="h10-fog h10-fog-front"></div><div class="h10-title"><small>10,000 COINS</small><strong>THE HAUNTED MOON</strong><span>Something is waking in the dark</span></div><div class="h10-reduced"><small>10,000 COINS</small><strong>THE HAUNTED MOON</strong></div></div>`;
    },
    duration(theme,tier) { return theme==='halloween'&&tier===5?DURATION:null; }
  };
})();
