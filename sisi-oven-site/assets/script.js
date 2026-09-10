(() => {
  'use strict';

  /* ===================== Hero scrub ===================== */
  const hero = document.getElementById('hero');
  const stage = document.querySelector('.hero-stage');
  const video = document.getElementById('heroVideo');
  const ring = document.querySelector('.ring');
  const bandsEls = [...document.querySelectorAll('.band')];

  const VIDEO_URL = 'assets/hero-scrub.mp4';
  const VIDEO_BYTES = 6000000; // fallback estimate; replace once the real file is encoded

  /* split visual copy into word spans once, so entrances have something to drive */
  function splitWords(root) {
    if (root.querySelector('.w')) return;
    const walk = node => {
      [...node.childNodes].forEach(child => {
        if (child.nodeType === Node.TEXT_NODE) {
          const parts = child.textContent.split(/(\s+)/);
          if (!parts.some(p => p.trim())) return;
          const frag = document.createDocumentFragment();
          parts.forEach(part => {
            if (!part.trim()) { frag.appendChild(document.createTextNode(part)); return; }
            const span = document.createElement('span');
            span.className = 'w';
            span.textContent = part;
            frag.appendChild(span);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === Node.ELEMENT_NODE && child.tagName !== 'BR') {
          walk(child);
        }
      });
    };
    walk(root);
  }
  document.querySelectorAll('.band .visual').forEach(splitWords);

  const bands = bandsEls.map(el => {
    const [a, b] = el.dataset.range.split(',').map(Number);
    return { el, a, b, op: -1, k: -1, words: [...el.querySelectorAll('.w')] };
  });

  // seed word thresholds so "random" stagger is identical every load
  function rng(seed) {
    let s = seed >>> 0;
    return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
  }
  bands.forEach((band, bi) => {
    const r = rng(bi + 7);
    band.words.forEach((w, i) => {
      const th = (i / Math.max(1, band.words.length)) * 0.5 + r() * 0.08;
      w.style.setProperty('--th', th.toFixed(3));
    });
  });

  function heroProgress() {
    const rect = hero.getBoundingClientRect();
    const total = hero.offsetHeight - window.innerHeight;
    if (total <= 0) return 0;
    const p = -rect.top / total;
    return Math.min(1, Math.max(0, p));
  }

  const smoothstep = (p, e0, e1) => {
    if (e0 === e1) return p >= e1 ? 1 : 0;
    const t = Math.min(1, Math.max(0, (p - e0) / (e1 - e0)));
    return t * t * (3 - 2 * t);
  };

  let loadK = 0;
  const loadStart = performance.now();

  function updateCaptions(p) {
    bands.forEach((band, i) => {
      const { a, b } = band;
      const f = Math.min(0.02, (b - a) / 3);
      let opacity;
      if (i === 0) opacity = 1 - smoothstep(p, b - f, b);
      else if (i === bands.length - 1) opacity = smoothstep(p, a, a + f);
      else opacity = smoothstep(p, a, a + f) * (1 - smoothstep(p, b - f, b));

      const ramp = Math.min(0.025, (b - a) * 0.35);
      let k = Math.min(1, Math.max(0, (p - a) / ramp));
      if (i === 0) k = Math.max(k, loadK); // band one opens settled, then hands over to scroll

      if (Math.abs(opacity - band.op) > 0.004) {
        band.op = opacity;
        band.el.style.opacity = opacity.toFixed(3);
      }
      if (Math.abs(k - band.k) > 0.008) {
        band.k = k;
        band.el.style.setProperty('--k', k.toFixed(3));
      }
    });
    if (p > 0.98) stage.classList.add('at-end');
    else stage.classList.remove('at-end');
  }

  function driveLoadRamp(now) {
    loadK = Math.min(1, (now - loadStart) / 900);
    updateCaptions(heroProgress());
    if (loadK < 1) requestAnimationFrame(driveLoadRamp);
  }
  requestAnimationFrame(driveLoadRamp);

  /* seek gating */
  let seekBusy = false;
  let pendingTime = null;
  function requestSeek(t) {
    if (!video.duration || !isFinite(video.duration)) return;
    if (seekBusy) { pendingTime = t; return; }
    seekBusy = true;
    try { video.currentTime = t; } catch (e) { seekBusy = false; }
  }
  video.addEventListener('seeked', () => {
    seekBusy = false;
    if (pendingTime !== null) {
      const t = pendingTime;
      pendingTime = null;
      requestSeek(t);
    }
  });
  video.addEventListener('error', () => { seekBusy = false; pendingTime = null; });

  /* rAF lerp loop, rests when converged and off-screen */
  let target = 0, shown = 0, rafId = null, lastTick = 0, heroOnScreen = true;
  function tick(now) {
    const dt = Math.min(100, now - (lastTick || now));
    lastTick = now;
    const k = 0.16;
    shown += (target - shown) * (1 - Math.pow(1 - k, dt / 16.667));
    if (Math.abs(target - shown) < 0.0005) {
      shown = target; rafId = null; lastTick = 0;
    } else {
      rafId = requestAnimationFrame(tick);
    }
    if (video.duration) requestSeek(shown * video.duration);
    updateCaptions(shown);
  }
  function onScroll() {
    target = heroProgress();
    updateCaptions(target); // keeps static-hero-less paths responsive even pre-video
    if (rafId === null && heroOnScreen) rafId = requestAnimationFrame(tick);
  }
  new IntersectionObserver(([entry]) => { heroOnScreen = entry.isIntersecting; }, { threshold: 0 }).observe(hero);

  /* streamed blob fetch with loading ring */
  let blobStarted = false;
  function startBlobFetch() {
    if (blobStarted) return;
    blobStarted = true;
    loadHeroBlob().catch(failVideo);
  }
  setTimeout(startBlobFetch, 1200);

  async function loadHeroBlob() {
    const ctrl = new AbortController();
    let watchdog = setTimeout(() => ctrl.abort(), 20000);
    const res = await fetch(VIDEO_URL, { signal: ctrl.signal });
    if (!res.ok) throw new Error('video missing');
    const total = Number(res.headers.get('Content-Length')) || VIDEO_BYTES;
    const reader = res.body.getReader();
    const chunks = [];
    let got = 0, lastRing = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      clearTimeout(watchdog);
      watchdog = setTimeout(() => ctrl.abort(), 20000);
      chunks.push(value);
      got += value.length;
      const frac = Math.min(1, got / total);
      const now = performance.now();
      if (now - lastRing > 100 || frac === 1) {
        lastRing = now;
        if (ring) ring.style.setProperty('--ld', Math.round(126 * (1 - frac)));
      }
    }
    clearTimeout(watchdog);
    if (ring) ring.style.setProperty('--ld', 0);
    video.src = URL.createObjectURL(new Blob(chunks));
    video.load();
    video.addEventListener('canplay', () => {
      requestSeek(heroProgress() * video.duration);
      stage.classList.add('video-ready');
    }, { once: true });
  }

  function failVideo() {
    stage.classList.add('video-failed');
  }

  /* ===================== Static-hero gates (must match CSS exactly) ===================== */
  const GATES = [
    '(max-width: 720px)',
    '(orientation: portrait) and (max-width: 1024px)',
    '(orientation: portrait) and (pointer: coarse)',
    '(orientation: landscape) and (pointer: coarse) and (max-height: 560px)',
    '(prefers-reduced-motion: reduce)'
  ];
  let scrubOn = false;
  function pinToFinalStates() {
    bands.forEach(b => {
      b.el.style.opacity = '1';
      b.el.style.setProperty('--k', '1');
    });
  }
  function unpinFinalStates() {
    bands.forEach(b => { b.op = -1; b.k = -1; });
  }
  function enableScrub() {
    if (scrubOn) return;
    scrubOn = true;
    startBlobFetch();
    addEventListener('scroll', onScroll, { passive: true });
    unpinFinalStates();
    updateCaptions(heroProgress());
    onScroll();
  }
  function disableScrub() {
    if (!scrubOn) return;
    scrubOn = false;
    removeEventListener('scroll', onScroll);
    if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
    pinToFinalStates();
  }
  function applyHeroMode() {
    if (GATES.some(q => matchMedia(q).matches)) disableScrub();
    else enableScrub();
  }
  const MQLS = GATES.map(q => matchMedia(q));
  MQLS.forEach(m => m.addEventListener('change', applyHeroMode));
  applyHeroMode();

  matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', e => {
    if (e.matches) { disableScrub(); pinToFinalStates(); }
    else applyHeroMode();
  });

  /* pause offscreen/hidden-tab loops */
  document.addEventListener('visibilitychange', () => {
    document.body.classList.toggle('paused', document.hidden);
  });

  /* ===================== Scroll reveal entrances ===================== */
  const revealEls = [...document.querySelectorAll('.reveal')];
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  revealEls.forEach(el => revealObserver.observe(el));

  /* ===================== Oven door: press-and-hold interactive moment ===================== */
  const ovenDoor = document.getElementById('ovenDoor');
  const dish = document.querySelector('.today-dish');
  const ARC = 327;
  let holdProgress = 0, holdRaf = null, holdDirection = 0, opened = false;

  function setArc(p) {
    ovenDoor.style.setProperty('--od', String(Math.round(ARC * (1 - p))));
  }

  function holdTick() {
    holdProgress = Math.min(1, Math.max(0, holdProgress + holdDirection * 0.02));
    setArc(holdProgress);
    if (holdProgress >= 1 && !opened) {
      opened = true;
      ovenDoor.classList.add('opened');
      dish.classList.add('revealed');
      ovenDoor.querySelector('.oven-label').textContent = 'התנור פתוח';
    }
    if (holdProgress <= 0 && opened === false) {
      holdRaf = null;
      return;
    }
    if ((holdDirection > 0 && holdProgress < 1) || (holdDirection < 0 && holdProgress > 0)) {
      holdRaf = requestAnimationFrame(holdTick);
    } else {
      holdRaf = null;
    }
  }

  function startHold() {
    if (opened) return;
    holdDirection = 1;
    if (!holdRaf) holdRaf = requestAnimationFrame(holdTick);
  }
  function releaseHold() {
    if (opened) return;
    holdDirection = -1;
    if (!holdRaf) holdRaf = requestAnimationFrame(holdTick);
  }

  const reduceMotionQuery = matchMedia('(prefers-reduced-motion: reduce)');
  function instantOpen() {
    if (opened) return;
    opened = true;
    holdProgress = 1;
    setArc(1);
    ovenDoor.classList.add('opened');
    dish.classList.add('revealed');
    ovenDoor.querySelector('.oven-label').textContent = 'התנור פתוח';
  }

  ovenDoor.addEventListener('pointerdown', e => {
    e.preventDefault();
    if (reduceMotionQuery.matches) { instantOpen(); return; }
    startHold();
  });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev =>
    ovenDoor.addEventListener(ev, releaseHold)
  );
  ovenDoor.addEventListener('click', () => {
    if (reduceMotionQuery.matches) instantOpen();
  });
  ovenDoor.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); instantOpen(); }
  });
  setArc(0);
})();
