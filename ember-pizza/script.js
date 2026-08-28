(function(){
"use strict";

/* ============ shared helpers ============ */
const clamp = (v,lo,hi)=>Math.min(hi,Math.max(lo,v));
const smoothstep = (p,e0,e1)=>{ const t=clamp((p-e0)/(e1-e0),0,1); return t*t*(3-2*t); };
function rng(seed){ let s=seed>>>0; return ()=> (s=(s*1664525+1013904223)>>>0)/4294967296; }

/* ============ tab-hidden pause ============ */
document.addEventListener('visibilitychange',()=>{
  document.body.classList.toggle('paused', document.hidden);
});

/* ============ text splitting (done once at load) ============ */
function splitChars(host, seed){
  const hidden = host.querySelector('.visually-hidden');
  const text = hidden.textContent;
  const visual = document.createElement('span');
  visual.setAttribute('aria-hidden','true');
  visual.className='visual-split';
  const words = text.split(' ');
  const gen = rng(seed);
  let ci = 0;
  words.forEach((word,wi)=>{
    const w = document.createElement('span'); w.className='w';
    [...word].forEach(ch=>{
      const c = document.createElement('span'); c.className='c';
      c.textContent = ch;
      c.style.setProperty('--th', Math.min(0.55, ci*0.018 + gen()*0.08).toFixed(3));
      c.style.setProperty('--jx', (gen()*24-12).toFixed(1)+'px');
      c.style.setProperty('--jy', (gen()*20-16).toFixed(1)+'px');
      c.style.setProperty('--jr', (gen()*16-8).toFixed(1)+'deg');
      w.appendChild(c);
      ci++;
    });
    visual.appendChild(w);
    if(wi < words.length-1) visual.appendChild(document.createTextNode(' '));
  });
  host.appendChild(visual);
}

function splitWords(host, seed){
  const hidden = host.querySelector('.visually-hidden');
  const text = hidden.textContent;
  const visual = document.createElement('span');
  visual.setAttribute('aria-hidden','true');
  visual.className='visual-split';
  const lines = text.split('. ').filter(Boolean);
  const gen = rng(seed);
  let wi = 0;
  const totalWords = text.split(' ').length;
  lines.forEach((line,li)=>{
    line.split(' ').forEach(word=>{
      const w = document.createElement('span'); w.className='w';
      w.textContent = word + ' ';
      w.style.setProperty('--th', (wi/totalWords*0.5 + gen()*0.05).toFixed(3));
      visual.appendChild(w);
      wi++;
    });
    if(li < lines.length-1) visual.appendChild(document.createElement('br'));
  });
  host.appendChild(visual);
}

document.querySelectorAll('.band-1 h2.split').forEach(h=>splitChars(h, 1001));
document.querySelectorAll('.band-3 h2.split').forEach(h=>splitWords(h, 2002));

/* ============ hero elements ============ */
const stage = document.getElementById('stage');
const video = document.getElementById('heroVideo');
const poster = document.getElementById('poster');
const ring = document.querySelector('.ring');
const heroPin = document.querySelector('.hero-pin');
const bands = [...document.querySelectorAll('.band')].map(el=>({
  el,
  a: parseFloat(getComputedStyle(el).getPropertyValue('--a')),
  b: parseFloat(getComputedStyle(el).getPropertyValue('--b')),
  opCache: -1,
  kCache: -1
}));

const VIDEO_URL = 'assets/hero-scrub.mp4';
const VIDEO_BYTES = 6000000; // fallback if Content-Length missing; update after real encode
const POSTER_URL = 'assets/hero-poster.jpg';

/* ============ progress ============ */
function heroProgress(){
  const rect = heroPin.getBoundingClientRect();
  const total = heroPin.offsetHeight - window.innerHeight;
  if (total <= 0) return 0;
  const scrolled = -rect.top;
  return clamp(scrolled/total, 0, 1);
}

/* ============ band one's one-time load ramp ============ */
/* At scroll zero band one's scroll-driven --k is 0, so its characters would sit
   unassembled with nothing above to scroll back to. Hand the opening beat a
   time-based ramp that eases in on load, then let scroll take over: k = max(scrollK, loadK). */
let loadK = 0, loadStart = null;
const reducedAtLoad = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (reducedAtLoad){
  loadK = 1;
} else {
  function loadRampTick(now){
    if (loadStart === null) loadStart = now;
    loadK = clamp((now - loadStart) / 900, 0, 1);
    if (loadK < 1){
      requestAnimationFrame(loadRampTick);
      if (rafId === null) rafId = requestAnimationFrame(tick);
    }
  }
  requestAnimationFrame(loadRampTick);
}

/* ============ caption bands ============ */
function updateCaptions(p){
  bands.forEach((band,i)=>{
    const {a,b} = band;
    const f = Math.min(0.02, (b-a)/3);
    const isFirst = a <= 0.001;
    const isLast = b >= 0.999;
    const opIn = isFirst ? 1 : smoothstep(p, a, a+f);
    const opOut = isLast ? 1 : (1 - smoothstep(p, b-f, b));
    const op = clamp(opIn*opOut, 0, 1);
    if (Math.abs(op - band.opCache) > 0.004){
      band.opCache = op;
      band.el.style.opacity = op.toFixed(3);
    }
    const ramp = Math.min(0.025, (b-a)*0.35);
    let k = clamp((p-a)/ramp, 0, 1);
    if (isFirst) k = Math.max(k, loadK);
    if (Math.abs(k - band.kCache) > 0.008){
      band.kCache = k;
      band.el.style.setProperty('--k', k.toFixed(3));
    }
  });
}

/* ============ ember dividers (signature self-drawing lines) ============ */
const dividers = document.querySelectorAll('.divider-flame');
if ('IntersectionObserver' in window){
  const dividerIO = new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if (entry.isIntersecting){
        entry.target.classList.add('in');
        dividerIO.unobserve(entry.target);
      }
    });
  }, { threshold:0.4 });
  dividers.forEach(d=>dividerIO.observe(d));
} else {
  dividers.forEach(d=>d.classList.add('in'));
}

/* ============ seek gating ============ */
let seekBusy = false, pendingTime = null;
function requestSeek(t){
  if (!video.duration || !isFinite(video.duration)) return;
  if (seekBusy){ pendingTime = t; return; }
  seekBusy = true;
  try { video.currentTime = t; } catch(e){ seekBusy = false; }
}
video.addEventListener('seeked', ()=>{
  seekBusy = false;
  if (pendingTime !== null){ const t=pendingTime; pendingTime=null; requestSeek(t); }
});
video.addEventListener('error', ()=>{ seekBusy = false; pendingTime = null; failVideo(); });

/* ============ lerp drive loop (rests) ============ */
let target = 0, shown = 0, rafId = null, lastTick = 0;
let heroOnScreen = false;

function tick(now){
  const dt = Math.min(100, now - (lastTick || now));
  lastTick = now;
  const k = 0.16;
  shown += (target - shown) * (1 - Math.pow(1-k, dt/16.667));
  if (Math.abs(target - shown) < 0.0005){
    shown = target; rafId = null; lastTick = 0;
  } else {
    rafId = requestAnimationFrame(tick);
  }
  if (video.duration && isFinite(video.duration)) requestSeek(shown*video.duration);
  updateCaptions(shown);
}

function onScroll(){
  target = heroProgress();
  if (target > 0.002) stage.classList.add('scrolled');
  if (rafId === null) rafId = requestAnimationFrame(tick);
}

/* ============ blob loader (streamed, with ring) ============ */
/* poster + video blob are only requested once the scrub is actually armed
   (see initHeroOnce below), so static-hero visitors never fetch either */
let started = false;
function startBlobFetch(){
  if (started) return;
  started = true;
  loadHeroBlob().catch(failVideo);
}
function loadPosterThenVideo(){
  const posterImg = new Image();
  posterImg.onload = ()=>{ poster.style.backgroundImage = `url('${POSTER_URL}')`; startBlobFetch(); };
  posterImg.onerror = ()=>{ startBlobFetch(); };
  posterImg.src = POSTER_URL;
  setTimeout(startBlobFetch, 4000);
}

async function loadHeroBlob(){
  const ctrl = new AbortController();
  let watchdog = setTimeout(()=>ctrl.abort(), 20000);
  const res = await fetch(VIDEO_URL, { signal: ctrl.signal });
  if (!res.ok) throw new Error('video fetch failed');
  const total = Number(res.headers.get('Content-Length')) || VIDEO_BYTES;
  const reader = res.body.getReader();
  const chunks = [];
  let got = 0, lastRing = 0;
  for(;;){
    const {done, value} = await reader.read();
    if (done) break;
    clearTimeout(watchdog);
    watchdog = setTimeout(()=>ctrl.abort(), 20000);
    chunks.push(value);
    got += value.length;
    const frac = Math.min(1, got/total);
    const now = performance.now();
    if (now - lastRing > 100 || frac === 1){
      lastRing = now;
      if (ring) ring.style.setProperty('--ld', Math.round(126*(1-frac)));
    }
  }
  clearTimeout(watchdog);
  if (ring) ring.style.setProperty('--ld', 0);
  video.src = URL.createObjectURL(new Blob(chunks));
  video.load();
  video.addEventListener('canplay', ()=>{
    requestSeek(heroProgress()*video.duration);
    stage.classList.add('video-ready');
  }, { once:true });
}

function failVideo(){
  if (ring) ring.style.opacity = '0';
  stage.classList.add('video-failed');
}

/* ============ static-hero gates (must match CSS media queries exactly) ============ */
const GATES = [
  '(max-width: 720px)',
  '(orientation: portrait) and (max-width: 1024px)',
  '(orientation: portrait) and (pointer: coarse)',
  '(orientation: landscape) and (pointer: coarse) and (max-height: 560px)',
  '(prefers-reduced-motion: reduce)'
];
let scrubOn = false;
let heroInited = false;
function initHeroOnce(){
  if (heroInited) return;
  heroInited = true;
  loadPosterThenVideo();
}
function enableScrub(){
  if (scrubOn) return; scrubOn = true;
  initHeroOnce();
  addEventListener('scroll', onScroll, { passive:true });
  bands.forEach(b=>{ b.opCache=-1; b.kCache=-1; });
  updateCaptions(heroProgress());
  onScroll();
}
function disableScrub(){
  if (!scrubOn) return; scrubOn = false;
  removeEventListener('scroll', onScroll);
  if (rafId !== null){ cancelAnimationFrame(rafId); rafId = null; }
}
function applyHeroMode(){
  if (GATES.some(q => matchMedia(q).matches)) disableScrub();
  else enableScrub();
}
const MQLS = GATES.map(q => matchMedia(q));
MQLS.forEach(m => m.addEventListener('change', applyHeroMode));
applyHeroMode();

if ('IntersectionObserver' in window){
  const io = new IntersectionObserver(entries=>{
    entries.forEach(e=>{ heroOnScreen = e.isIntersecting; });
  }, { threshold:0 });
  io.observe(heroPin);
}

/* ============ below-fold entrance choreography ============ */
const revealEls = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window){
  const revealIO = new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if (entry.isIntersecting){
        entry.target.classList.add('in');
        setTimeout(()=>entry.target.classList.add('settled'), 900);
        revealIO.unobserve(entry.target);
      }
    });
  }, { threshold:0.15 });
  revealEls.forEach(el=>revealIO.observe(el));
} else {
  revealEls.forEach(el=>el.classList.add('in','settled'));
}

/* wrap direct children of grids for the stagger, marking them .in-item */
document.querySelectorAll('.fact-list li, .menu-grid > *, .quote-grid > *').forEach(el=>{
  el.classList.add('in-item');
});

/* ============ the one interactive moment: hold to feel the heat ============ */
(function heatHold(){
  const wrap = document.getElementById('heatHold');
  const fillRing = document.getElementById('heatFill');
  const numEl = document.getElementById('heatNum');
  const labelEl = document.getElementById('heatLabel');
  const reveal = document.getElementById('heatReveal');
  if (!wrap) return;

  const CIRC = 553; // 2*PI*88
  const MIN_T = 70, MAX_T = 900;
  let progress = 0, holding = false, raf = null, lastT = 0, lit = false;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function paint(){
    fillRing.style.strokeDashoffset = (CIRC*(1-progress)).toFixed(1);
    const temp = Math.round(MIN_T + (MAX_T-MIN_T)*progress);
    numEl.textContent = temp;
    if (progress >= 0.999 && !lit){
      lit = true;
      reveal.classList.add('lit');
      labelEl.textContent = 'Full heat.';
    } else if (progress < 0.999 && lit){
      lit = false;
      reveal.classList.remove('lit');
      labelEl.textContent = 'Hold to feel the heat';
    }
  }

  function loop(now){
    const dt = Math.min(50, now-(lastT||now));
    lastT = now;
    const dir = holding ? 1 : -1;
    const rate = holding ? 1/1400 : 1/650; // ms to full / to empty
    progress = clamp(progress + dir*rate*dt, 0, 1);
    paint();
    if ((holding && progress < 1) || (!holding && progress > 0)){
      raf = requestAnimationFrame(loop);
    } else {
      raf = null; lastT = 0;
    }
  }
  function start(){
    if (reduced){ progress = 1; paint(); return; }
    holding = true;
    wrap.classList.add('active');
    if (raf === null) raf = requestAnimationFrame(loop);
  }
  function end(){
    if (reduced) return;
    holding = false;
    wrap.classList.remove('active');
    if (raf === null) raf = requestAnimationFrame(loop);
  }
  wrap.addEventListener('pointerdown', e=>{ e.preventDefault(); start(); });
  addEventListener('pointerup', end);
  addEventListener('pointercancel', end);
  wrap.addEventListener('keydown', e=>{
    if (e.key===' '||e.key==='Enter'){ e.preventDefault(); start(); }
  });
  wrap.addEventListener('keyup', e=>{
    if (e.key===' '||e.key==='Enter'){ e.preventDefault(); end(); }
  });
  if (reduced) start();
})();

/* ============ order form (JS-only success state, static site) ============ */
(function orderForm(){
  const form = document.getElementById('orderForm');
  const note = document.getElementById('formNote');
  if (!form) return;
  form.addEventListener('submit', e=>{
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    if (!email || !email.includes('@')){
      note.textContent = 'That email doesn’t look right. Try again.';
      return;
    }
    form.classList.add('sent');
    const msg = document.createElement('p');
    msg.className = 'success-msg';
    msg.textContent = 'You’re on the list. We’ll email you the moment Ember lights the oven near you.';
    form.appendChild(msg);
    note.style.display = 'none';
  });
})();

/* ============ reduced motion, live, both directions ============ */
function pinToFinalStates(){
  bands.forEach(b=>{ b.el.style.opacity = 1; b.el.style.setProperty('--k', 1); });
  dividers.forEach(d=>d.classList.add('in'));
}
matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', e=>{
  if (e.matches) pinToFinalStates();
  else applyHeroMode();
});

})();
