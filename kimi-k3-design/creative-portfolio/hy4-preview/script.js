/* ============================================================
   Ivo Marchetti — interaction layer
   No dependencies. Web Animations API, IntersectionObserver,
   Canvas2D, and one rAF loop shared by every demo.
   ============================================================ */

(() => {
  'use strict';

  const root = document.documentElement;
  const body = document.body;
  const reducedQuery = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const rand = (a, b) => a + Math.random() * (b - a);

  /* ---------- Motion level -------------------------------- */

  const LEVELS = ['none', 'reduced', 'standard', 'enhanced'];
  let motionLevel = reducedQuery.matches ? 'reduced' : 'standard';
  let motionScale = motionLevel === 'none' ? 0 : motionLevel === 'reduced' ? 0.35 : motionLevel === 'enhanced' ? 1.5 : 1;

  const motionToggle = document.getElementById('motion-toggle');
  const motionPanel = document.getElementById('motion-panel');
  const motionValue = document.getElementById('motion-value');

  function setMotion(level, persist = true) {
    motionLevel = level;
    motionScale = level === 'none' ? 0 : level === 'reduced' ? 0.35 : level === 'enhanced' ? 1.5 : 1;
    root.setAttribute('data-motion', level);
    motionValue.textContent = level[0].toUpperCase() + level.slice(1);
    motionPanel.querySelectorAll('button').forEach((b) => {
      b.setAttribute('aria-pressed', String(b.dataset.motion === level));
    });
    if (persist) {
      try { localStorage.setItem('im-motion', level); } catch {}
    }
    // Rail pinning and spring tuning are gated on motion level, so re-measure.
    if (typeof bootLayout === 'function') requestAnimationFrame(bootLayout);
  }

  try {
    const saved = localStorage.getItem('im-motion');
    if (saved && LEVELS.includes(saved)) motionLevel = saved;
  } catch {}
  setMotion(motionLevel, false);

  motionToggle.addEventListener('click', () => {
    const open = motionToggle.getAttribute('aria-expanded') === 'true';
    motionToggle.setAttribute('aria-expanded', String(!open));
    motionPanel.hidden = open;
  });

  motionPanel.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-motion]');
    if (!btn) return;
    setMotion(btn.dataset.motion);
  });

  document.addEventListener('pointerdown', (e) => {
    if (!e.target.closest('#motion')) {
      motionToggle.setAttribute('aria-expanded', 'false');
      motionPanel.hidden = true;
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!motionPanel.hidden) {
      motionPanel.hidden = true;
      motionToggle.setAttribute('aria-expanded', 'false');
      motionToggle.focus();
    }
  });

  /* ---------- Shared rAF loop ----------------------------- */

  const tasks = new Set();
  let last = performance.now();
  let fpsAvg = 60;

  function frame(now) {
    const dt = clamp((now - last) / 1000, 0.001, 0.05);
    last = now;
    fpsAvg = lerp(fpsAvg, 1 / dt, 0.06);
    tasks.forEach((fn) => fn(dt, now));
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  const addTask = (fn) => tasks.add(fn);
  const removeTask = (fn) => tasks.delete(fn);

  /* ---------- Text splitting ------------------------------ */

  function splitText(el) {
    const text = el.textContent;
    const frag = document.createDocumentFragment();
    [...text].forEach((ch, i) => {
      const span = document.createElement('span');
      span.className = ch === ' ' ? 'char char--space' : 'char';
      span.textContent = ch === ' ' ? '\u00A0' : ch;
      span.style.transitionDelay = `${i * 34 * motionScale}ms`;
      frag.appendChild(span);
    });
    el.textContent = '';
    el.appendChild(frag);
  }

  /* ---------- Reveal observer ----------------------------- */

  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      revealIO.unobserve(entry.target);
    });
  }, { threshold: 0.16, rootMargin: '0px 0px -8% 0px' });

  /* ---------- Preloader ----------------------------------- */

  const preloader = document.getElementById('preloader');
  const countEl = document.getElementById('count');
  const fillEl = document.getElementById('preloader-fill');
  const statusEl = document.getElementById('preloader-status');
  const STEPS = ['Requesting fonts', 'Warming shaders', 'Measuring type', 'Ready'];

  function runPreloader() {
    let progress = 0;
    let step = 0;

    const tick = setInterval(() => {
      progress = Math.min(100, progress + rand(6, 17));
      countEl.textContent = String(Math.round(progress)).padStart(2, '0');
      fillEl.style.width = `${progress}%`;

      const nextStep = clamp(Math.floor(progress / 26), 0, STEPS.length - 1);
      if (nextStep !== step) {
        step = nextStep;
        statusEl.textContent = STEPS[step];
      }

      if (progress >= 100) {
        clearInterval(tick);
        setTimeout(finishPreload, 220);
      }
    }, 105);
  }

  function finishPreload() {
    countEl.textContent = '100';
    fillEl.style.width = '100%';
    preloader.classList.add('is-done');
    body.removeAttribute('data-loading');
    preloader.setAttribute('aria-hidden', 'true');
    document.querySelectorAll('[data-split]').forEach((el) => el.classList.add('is-in'));
    setTimeout(() => { preloader.hidden = true; }, 700 * (motionScale || 0.001));
    countStats();
  }

  const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
  let began = false;
  const start = () => {
    if (began) return;
    began = true;
    runPreloader();
  };
  Promise.race([fontsReady, new Promise((r) => setTimeout(r, 1600))]).then(start);
  setTimeout(start, 2600);

  /* ---------- Count up ------------------------------------ */

  function countStats() {
    if (motionScale === 0) {
      document.querySelectorAll('[data-count]').forEach((el) => { el.textContent = el.dataset.count; });
      return;
    }
    document.querySelectorAll('[data-count]').forEach((el, idx) => {
      const target = Number(el.dataset.count);
      const dur = 1100 * motionScale;
      const t0 = performance.now() + idx * 70;
      const step = (now) => {
        const p = clamp((now - t0) / dur, 0, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = String(Math.round(target * eased));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }

  /* ---------- Header: stuck + hide on scroll -------------- */

  const head = document.getElementById('head');
  const meterFill = document.getElementById('meter-fill');
  let lastScroll = 0;

  function onScroll() {
    const y = window.scrollY || 0;
    head.classList.toggle('is-stuck', y > 40);
    head.classList.toggle('is-hidden', y > 420 && y > lastScroll && !document.getElementById('stage').classList.contains('is-open'));
    lastScroll = y;

    const max = document.documentElement.scrollHeight - innerHeight;
    meterFill.style.transform = `scaleX(${max > 0 ? clamp(y / max, 0, 1) : 0})`;
    meterFill.style.width = '100%';
  }
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Section spy --------------------------------- */

  const navLinks = [...document.querySelectorAll('.head__nav a')];
  const sections = navLinks
    .map((a) => document.querySelector(a.getAttribute('href')))
    .filter(Boolean);

  const spyIO = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((a) => {
        a.setAttribute('aria-current', String(a.getAttribute('href') === `#${entry.target.id}`));
      });
    });
  }, { threshold: 0.35, rootMargin: '-15% 0px -45% 0px' });
  sections.forEach((s) => spyIO.observe(s));

  /* ---------- Smooth in-page scroll ----------------------- */

  document.querySelectorAll('[data-scroll]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href');
      if (!id || !id.startsWith('#')) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - (id === '#hero' ? 0 : 8);
      window.scrollTo({ top, behavior: motionScale === 0 ? 'auto' : 'smooth' });
      history.replaceState(null, '', id);
    });
  });

  /* ---------- Custom cursor ------------------------------- */

  const cursor = document.getElementById('cursor');
  if (finePointer.matches && motionScale > 0) {
    let cx = innerWidth / 2;
    let cy = innerHeight / 2;
    let tx = cx;
    let ty = cy;

    addEventListener('pointermove', (e) => {
      tx = e.clientX;
      ty = e.clientY;
      cursor.classList.add('is-on');
    }, { passive: true });

    addEventListener('pointerdown', () => cursor.classList.add('is-down'));
    addEventListener('pointerup', () => cursor.classList.remove('is-down'));

    addTask(() => {
      cx = lerp(cx, tx, 0.22);
      cy = lerp(cy, ty, 0.22);
      cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
    });

    document.querySelectorAll('a, button, summary, input, textarea, [data-cursor]').forEach((el) => {
      const label = el.dataset.cursor;
      el.addEventListener('pointerenter', () => {
        cursor.classList.add('is-wide');
        if (label) cursor.querySelector('.cursor__text').textContent = label;
      });
      el.addEventListener('pointerleave', () => {
        cursor.classList.remove('is-wide');
        cursor.querySelector('.cursor__text').textContent = 'Run';
      });
    });
  }

  /* ---------- Magnetic controls --------------------------- */

  if (finePointer.matches) {
    document.querySelectorAll('[data-magnetic]').forEach((el) => {
      let mx = 0;
      let my = 0;
      let tx = 0;
      let ty = 0;
      let active = false;

      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        tx = ((e.clientX - r.left) / r.width - 0.5) * 14 * motionScale;
        ty = ((e.clientY - r.top) / r.height - 0.5) * 10 * motionScale;
        active = true;
      });
      el.addEventListener('pointerleave', () => { tx = 0; ty = 0; });

      addTask(() => {
        if (!active && Math.abs(mx) < 0.01 && Math.abs(my) < 0.01) return;
        mx = lerp(mx, tx, 0.18);
        my = lerp(my, ty, 0.18);
        el.style.translate = `${mx.toFixed(2)}px ${my.toFixed(2)}px`;
        if (!active && Math.abs(mx) < 0.01 && Math.abs(my) < 0.01) el.style.translate = '';
      });
    });
  }

  /* ---------- Hero slab: tilt + fps readout --------------- */

  const slab = document.getElementById('hero-slab');
  const fpsEl = document.getElementById('slab-fps');
  if (slab && finePointer.matches && motionScale > 0) {
    slab.addEventListener('pointermove', (e) => {
      const r = slab.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      slab.style.transform = `perspective(1400px) rotateY(${(-7 + px * 10).toFixed(2)}deg) rotateX(${(2 - py * 8).toFixed(2)}deg)`;
    });
    slab.addEventListener('pointerleave', () => {
      slab.style.transform = 'perspective(1400px) rotateY(-7deg) rotateX(2deg)';
    });
  }

  let fpsTick = 0;
  addTask(() => {
    if (++fpsTick % 20 === 0 && fpsEl) fpsEl.textContent = `${Math.round(fpsAvg)} fps`;
  });

  /* ---------- Copy button --------------------------------- */

  const copyBtn = document.getElementById('slab-copy');
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      const src = document.querySelector(copyBtn.dataset.copy);
      if (!src) return;
      const text = src.textContent.replace(/\u00A0/g, ' ');
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch {}
        ta.remove();
      }
      copyBtn.classList.add('is-done');
      copyBtn.querySelector('.slab__copytext').textContent = 'Copied';
      setTimeout(() => {
        copyBtn.classList.remove('is-done');
        copyBtn.querySelector('.slab__copytext').textContent = 'Copy';
      }, 1900);
    });
  }

  /* ============================================================
     Canvas demos — six real things, one shared pointer state
     ============================================================ */

  const pointer = { x: 0.5, y: 0.5, vx: 0, vy: 0, speed: 0, inside: false, down: false };

  function fitCanvas(canvas) {
    const dpr = clamp(devicePixelRatio || 1, 1, 2);
    const r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return false;
    const w = Math.round(r.width * dpr);
    const h = Math.round(r.height * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    return true;
  }

  /* -- 1. Moire interference ------------------------------- */

  function makeMoire(canvas) {
    const ctx = canvas.getContext('2d');
    let t = 0;
    let freq = 13;
    let targetFreq = 13;

    return {
      pointer(cx, cy, speed) {
        targetFreq = 9 + cx * 16 + clamp(speed, 0, 40) * 0.16;
      },
      frame(dt) {
        if (!fitCanvas(canvas)) return;
        const { width: W, height: H } = canvas;
        const dpr = W / canvas.getBoundingClientRect().width;
        t += dt * 0.35;
        freq = lerp(freq, targetFreq, 0.08);

        ctx.fillStyle = '#0b0c0e';
        ctx.fillRect(0, 0, W, H);

        ctx.globalCompositeOperation = 'lighter';
        for (let layer = 0; layer < 2; layer += 1) {
          const rot = (layer === 0 ? -1 : 1) * (0.16 + Math.sin(t * 0.22) * 0.03);
          const step = (7 + freq * 0.55) * dpr;
          ctx.save();
          ctx.translate(W / 2, H / 2);
          ctx.rotate(rot);
          ctx.strokeStyle = layer === 0 ? 'rgba(214,72,45,0.55)' : 'rgba(126,183,199,0.5)';
          ctx.lineWidth = 1.05 * dpr;
          ctx.beginPath();
          const span = Math.hypot(W, H);
          for (let x = -span; x <= span; x += step) {
            ctx.moveTo(x, -span);
            ctx.lineTo(x, span);
          }
          ctx.stroke();
          ctx.restore();
        }
        ctx.globalCompositeOperation = 'source-over';

        const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.hypot(W, H) / 2);
        g.addColorStop(0, 'rgba(11,12,14,0)');
        g.addColorStop(1, 'rgba(11,12,14,0.78)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      }
    };
  }

  /* -- 2. Variable glyph ----------------------------------- */

  function makeGlyph(canvas) {
    const ctx = canvas.getContext('2d');
    let wght = 400;
    let opsz = 60;
    let tw = 400;
    let to = 60;
    let phase = 0;

    return {
      pointer(cx, cy) {
        tw = 180 + cx * 720;
        to = 14 + (1 - cy) * 82;
      },
      frame(dt) {
        if (!fitCanvas(canvas)) return;
        const { width: W, height: H } = canvas;
        const dpr = W / canvas.getBoundingClientRect().width;
        phase += dt;
        wght = lerp(wght, tw, 0.12);
        opsz = lerp(opsz, to, 0.12);

        ctx.fillStyle = '#0b0c0e';
        ctx.fillRect(0, 0, W, H);

        // measure grid
        ctx.strokeStyle = 'rgba(255,255,255,0.045)';
        ctx.lineWidth = 1 * dpr;
        const grid = 44 * dpr;
        ctx.beginPath();
        for (let x = grid; x < W; x += grid) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
        for (let y = grid; y < H; y += grid) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
        ctx.stroke();

        // baseline
        const base = H * 0.74;
        ctx.strokeStyle = 'rgba(214,72,45,0.5)';
        ctx.beginPath();
        ctx.moveTo(0, base); ctx.lineTo(W, base);
        ctx.stroke();

        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        ctx.fontVariationSettings = `"wght" ${wght.toFixed(0)}, "opsz" ${opsz.toFixed(0)}`;
        ctx.font = `${(H * 0.92).toFixed(0)}px "Bodoni Moda", serif`;

        ctx.fillStyle = 'rgba(214,72,45,0.16)';
        ctx.fillText('R', W / 2 + 5 * dpr, base + 4 * dpr);
        ctx.fillStyle = '#e9e3d6';
        ctx.fillText('R', W / 2, base);
        ctx.restore();

        // readouts
        ctx.font = `500 ${11 * dpr}px "JetBrains Mono", monospace`;
        ctx.fillStyle = 'rgba(160,164,172,0.9)';
        ctx.textAlign = 'left';
        ctx.fillText(`wght ${wght.toFixed(0)}`, 18 * dpr, 30 * dpr);
        ctx.fillText(`opsz ${opsz.toFixed(0)}`, 18 * dpr, 50 * dpr);
        ctx.textAlign = 'right';
        ctx.fillText('drag inside', W - 18 * dpr, 30 * dpr);
      }
    };
  }

  /* -- 3. Streaming ledger --------------------------------- */

  function makeLedger(canvas) {
    const ctx = canvas.getContext('2d');
    const rows = [];
    let acc = 0;
    let total = 9_100_000;
    let offset = 0;
    const seedNames = ['Nordea Clearing', 'Havenbedrijf', 'Delta Works', 'Rijnmond Trust', 'Maasvlakte II', 'Erasmus MC', 'Port Authority', 'Zuidas Partners'];

    function push() {
      const amount = rand(-48000, 96000);
      rows.unshift({
        id: `TX-${(total).toString(36).toUpperCase().padStart(7, '0')}`,
        name: seedNames[Math.floor(rand(0, seedNames.length))],
        amount,
        age: 0,
        flag: Math.random() < 0.09
      });
      total -= 1;
      if (rows.length > 90) rows.pop();
    }
    for (let i = 0; i < 40; i += 1) push();

    return {
      pointer(cx) { offset = cx; },
      frame(dt) {
        if (!fitCanvas(canvas)) return;
        const { width: W, height: H } = canvas;
        const dpr = W / canvas.getBoundingClientRect().width;
        acc += dt;
        const rate = 0.05 + offset * 0.5;
        while (acc > rate) { acc -= rate; push(); }

        ctx.fillStyle = '#0b0c0e';
        ctx.fillRect(0, 0, W, H);

        const rowH = 26 * dpr;
        const startY = 46 * dpr;

        // header
        ctx.font = `500 ${10 * dpr}px "JetBrains Mono", monospace`;
        ctx.fillStyle = 'rgba(140,144,152,0.85)';
        ctx.textAlign = 'left';
        ctx.fillText('ID', 16 * dpr, 26 * dpr);
        ctx.fillText('COUNTERPARTY', 130 * dpr, 26 * dpr);
        ctx.textAlign = 'right';
        ctx.fillText('AMOUNT', W - 16 * dpr, 26 * dpr);
        ctx.strokeStyle = 'rgba(255,255,255,0.09)';
        ctx.beginPath();
        ctx.moveTo(0, 34 * dpr); ctx.lineTo(W, 34 * dpr);
        ctx.stroke();

        rows.forEach((r, i) => {
          r.age += dt;
          const y = startY + i * rowH;
          if (y > H) return;
          const fade = clamp(1 - i / (Math.floor((H - startY) / rowH) + 1), 0, 1);
          const birth = clamp(r.age * 6, 0, 1);

          ctx.globalAlpha = fade * birth;
          if (i % 2 === 0) {
            ctx.fillStyle = 'rgba(255,255,255,0.018)';
            ctx.fillRect(0, y - rowH + 6 * dpr, W, rowH);
          }
          ctx.font = `400 ${11 * dpr}px "JetBrains Mono", monospace`;
          ctx.fillStyle = r.flag ? 'rgba(214,72,45,0.95)' : 'rgba(190,193,200,0.72)';
          ctx.textAlign = 'left';
          ctx.fillText(r.id, 16 * dpr, y);
          ctx.fillStyle = 'rgba(226,220,208,0.9)';
          ctx.font = `400 ${12 * dpr}px "Schibsted Grotesk", sans-serif`;
          ctx.fillText(r.name, 130 * dpr, y);
          ctx.textAlign = 'right';
          ctx.font = `400 ${11 * dpr}px "JetBrains Mono", monospace`;
          ctx.fillStyle = r.amount >= 0 ? 'rgba(126,183,199,0.95)' : 'rgba(226,220,208,0.75)';
          ctx.fillText(`${r.amount >= 0 ? '+' : ''}${r.amount.toFixed(2)}`, W - 16 * dpr, y);
          ctx.globalAlpha = 1;
        });

        // counter
        ctx.font = `400 ${10 * dpr}px "JetBrains Mono", monospace`;
        ctx.fillStyle = 'rgba(214,72,45,0.9)';
        ctx.textAlign = 'left';
        ctx.fillText(`${total.toLocaleString('en-US')} rows remaining`, 16 * dpr, H - 14 * dpr);
      }
    };
  }

  /* -- 4. Harbour tide ------------------------------------- */

  function makeTide(canvas) {
    const ctx = canvas.getContext('2d');
    const pts = [];
    let t = 0;
    let amp = 0.5;
    let targetAmp = 0.5;

    return {
      pointer(cx, cy) { targetAmp = 0.22 + cy * 0.8; },
      frame(dt) {
        if (!fitCanvas(canvas)) return;
        const { width: W, height: H } = canvas;
        const dpr = W / canvas.getBoundingClientRect().width;
        t += dt * 0.42;
        amp = lerp(amp, targetAmp, 0.06);

        ctx.fillStyle = '#0b0c0e';
        ctx.fillRect(0, 0, W, H);

        // horizon grid
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.lineWidth = 1 * dpr;
        ctx.beginPath();
        for (let i = 1; i < 6; i += 1) {
          const y = (H / 6) * i;
          ctx.moveTo(0, y); ctx.lineTo(W, y);
        }
        ctx.stroke();

        const mid = H * 0.56;
        const N = 140;
        pts.length = 0;
        for (let i = 0; i <= N; i += 1) {
          const x = (i / N) * W;
          const u = i / N;
          const y = mid
            - Math.sin(u * 7.2 + t) * H * 0.13 * amp
            - Math.sin(u * 2.1 - t * 0.6) * H * 0.07 * amp
            - Math.sin(u * 21 + t * 2.2) * H * 0.017 * amp;
          pts.push([x, y]);
        }

        // fill
        const grad = ctx.createLinearGradient(0, mid - H * 0.2, 0, H);
        grad.addColorStop(0, 'rgba(126,183,199,0.24)');
        grad.addColorStop(1, 'rgba(126,183,199,0.02)');
        ctx.beginPath();
        ctx.moveTo(0, H);
        pts.forEach(([x, y]) => ctx.lineTo(x, y));
        ctx.lineTo(W, H);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();

        // line
        ctx.beginPath();
        pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
        ctx.strokeStyle = '#7eb7c7';
        ctx.lineWidth = 1.6 * dpr;
        ctx.stroke();

        // now marker
        const nx = (t * 0.11 % 1) * W;
        const ni = clamp(Math.round((nx / W) * N), 0, N);
        ctx.beginPath();
        ctx.arc(nx, pts[ni][1], 4 * dpr, 0, Math.PI * 2);
        ctx.fillStyle = '#d6482d';
        ctx.fill();
        ctx.strokeStyle = 'rgba(214,72,45,0.35)';
        ctx.beginPath();
        ctx.moveTo(nx, 0); ctx.lineTo(nx, H);
        ctx.stroke();

        ctx.font = `500 ${10 * dpr}px "JetBrains Mono", monospace`;
        ctx.fillStyle = 'rgba(160,164,172,0.9)';
        ctx.textAlign = 'left';
        ctx.fillText('ROTTERDAM · MAASLVKTE', 16 * dpr, 26 * dpr);
        ctx.fillStyle = 'rgba(214,72,45,0.95)';
        ctx.fillText(`+${(1.4 + Math.sin(t) * 0.9 * amp).toFixed(2)} m NAP`, 16 * dpr, 44 * dpr);
        ctx.textAlign = 'right';
        ctx.fillStyle = 'rgba(160,164,172,0.7)';
        ctx.fillText('16 screens · 99.98% uptime', W - 16 * dpr, 26 * dpr);
      }
    };
  }

  /* -- 5. Refraction --------------------------------------- */

  function makeGlass(canvas) {
    const ctx = canvas.getContext('2d');
    let t = 0;
    const blobs = Array.from({ length: 5 }, (_, i) => ({
      bx: 0.18 + i * 0.17,
      by: 0.5,
      r: 0.09 + (i % 3) * 0.035,
      phase: i * 1.3
    }));

    return {
      pointer(cx, cy) {
        blobs.forEach((b, i) => {
          b.tx = clamp(cx + Math.cos(b.phase + t * 0.3) * 0.16, 0.08, 0.92);
          b.ty = clamp(cy + Math.sin(b.phase * 1.7 + t * 0.4) * 0.12, 0.16, 0.84);
        });
      },
      frame(dt) {
        if (!fitCanvas(canvas)) return;
        const { width: W, height: H } = canvas;
        const dpr = W / canvas.getBoundingClientRect().width;
        t += dt * 0.55;

        ctx.fillStyle = '#0b0c0e';
        ctx.fillRect(0, 0, W, H);

        blobs.forEach((b) => {
          b.bx = lerp(b.bx, b.tx ?? 0.5, 0.05);
          b.by = lerp(b.by, b.ty ?? 0.5, 0.05);
        });

        // back grid, bent by each lens
        const grid = 30 * dpr;
        ctx.strokeStyle = 'rgba(126,183,199,0.22)';
        ctx.lineWidth = 1 * dpr;

        ctx.beginPath();
        for (let x = 0; x <= W; x += grid) {
          let started = false;
          for (let y = 0; y <= H; y += 6 * dpr) {
            let px = x;
            let py = y;
            blobs.forEach((b) => {
              const cxp = b.bx * W;
              const cyp = b.by * H;
              const rr = b.r * Math.min(W, H);
              const d = Math.hypot(px - cxp, py - cyp);
              if (d < rr) {
                const k = (1 - d / rr) ** 2 * rr * 0.42;
                px += ((px - cxp) / (d || 1)) * k;
                py += ((py - cyp) / (d || 1)) * k;
              }
            });
            if (!started) { ctx.moveTo(px, py); started = true; } else ctx.lineTo(px, py);
          }
        }
        for (let y = 0; y <= H; y += grid) {
          let started = false;
          for (let x = 0; x <= W; x += 6 * dpr) {
            let px = x;
            let py = y;
            blobs.forEach((b) => {
              const cxp = b.bx * W;
              const cyp = b.by * H;
              const rr = b.r * Math.min(W, H);
              const d = Math.hypot(px - cxp, py - cyp);
              if (d < rr) {
                const k = (1 - d / rr) ** 2 * rr * 0.42;
                px += ((px - cxp) / (d || 1)) * k;
                py += ((py - cyp) / (d || 1)) * k;
              }
            });
            if (!started) { ctx.moveTo(px, py); started = true; } else ctx.lineTo(px, py);
          }
        }
        ctx.stroke();

        // caustic rings
        blobs.forEach((b) => {
          const cxp = b.bx * W;
          const cyp = b.by * H;
          const rr = b.r * Math.min(W, H);
          const g = ctx.createRadialGradient(cxp, cyp - rr * 0.2, rr * 0.1, cxp, cyp, rr);
          g.addColorStop(0, 'rgba(214,72,45,0.14)');
          g.addColorStop(0.7, 'rgba(233,227,214,0.05)');
          g.addColorStop(1, 'rgba(233,227,214,0.10)');
          ctx.beginPath();
          ctx.arc(cxp, cyp, rr, 0, Math.PI * 2);
          ctx.fillStyle = g;
          ctx.fill();
          ctx.strokeStyle = 'rgba(233,227,214,0.28)';
          ctx.lineWidth = 1 * dpr;
          ctx.stroke();
        });

        ctx.font = `500 ${10 * dpr}px "JetBrains Mono", monospace`;
        ctx.fillStyle = 'rgba(160,164,172,0.8)';
        ctx.textAlign = 'left';
        ctx.fillText('1 DRAW CALL · 0 IMAGES · n 1.48', 16 * dpr, 26 * dpr);
      }
    };
  }

  /* -- 6. Generative score --------------------------------- */

  function makeScore(canvas) {
    const ctx = canvas.getContext('2d');
    let t = 0;
    let acc = 0;
    const notes = [];
    const staves = 4;

    function spawn() {
      notes.push({
        staff: Math.floor(rand(0, staves)),
        x: 0,
        y: Math.round(rand(0, 8)) / 8,
        len: rand(0.02, 0.09),
        vel: rand(0.05, 0.14)
      });
      if (notes.length > 160) notes.shift();
    }

    return {
      pointer(cx) { notes.forEach((n) => { n.vel = 0.05 + cx * 0.2; }); },
      frame(dt) {
        if (!fitCanvas(canvas)) return;
        const { width: W, height: H } = canvas;
        const dpr = W / canvas.getBoundingClientRect().width;
        t += dt;
        acc += dt;
        if (acc > 0.14) { acc = 0; spawn(); }

        ctx.fillStyle = '#efe9dd';
        ctx.fillRect(0, 0, W, H);

        const pad = 26 * dpr;
        const gap = (H - pad * 2) / staves;

        // staves
        ctx.strokeStyle = 'rgba(20,20,24,0.55)';
        ctx.lineWidth = 1 * dpr;
        for (let s = 0; s < staves; s += 1) {
          const top = pad + s * gap;
          for (let l = 0; l < 5; l += 1) {
            const y = top + (gap * 0.42 * (l / 4));
            ctx.beginPath();
            ctx.moveTo(pad, y);
            ctx.lineTo(W - pad, y);
            ctx.stroke();
          }
          ctx.beginPath();
          ctx.moveTo(pad, top);
          ctx.lineTo(pad, top + gap * 0.42);
          ctx.stroke();
        }

        // notes
        notes.forEach((n) => {
          n.x += n.vel * dt;
          if (n.x > 1.05) n.x = -0.05;
          const s = n.staff;
          const top = pad + s * gap;
          const y = top + gap * 0.42 * (1 - n.y);
          const x = pad + n.x * (W - pad * 2);

          ctx.fillStyle = '#141418';
          ctx.beginPath();
          ctx.ellipse(x, y, 4.6 * dpr, 3.2 * dpr, -0.32, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#141418';
          ctx.lineWidth = 1.4 * dpr;
          ctx.beginPath();
          ctx.moveTo(x + 4.2 * dpr, y);
          ctx.lineTo(x + 4.2 * dpr, y - 17 * dpr);
          ctx.stroke();
          ctx.fillRect(x, y - n.len * 120 * dpr - 17 * dpr, Math.max(1.6 * dpr, n.len * 60 * dpr), 1.6 * dpr);
        });

        // typeset marks
        ctx.fillStyle = 'rgba(20,20,24,0.5)';
        ctx.font = `500 ${9 * dpr}px "JetBrains Mono", monospace`;
        ctx.textAlign = 'left';
        ctx.fillText('NACHTMUZIEK · EDITION 0412', pad, H - 10 * dpr);
        ctx.textAlign = 'right';
        ctx.fillText('LAYOUT 180 MS', W - pad, H - 10 * dpr);
        ctx.textAlign = 'left';
        ctx.fillStyle = 'rgba(214,72,45,0.9)';
        ctx.fillText('❚', pad + ((t * 0.4) % 1) * (W - pad * 2), H - 10 * dpr + 0);
      }
    };
  }

  const FACTORIES = {
    moire: makeMoire,
    glyph: makeGlyph,
    ledger: makeLedger,
    tide: makeTide,
    glass: makeGlass,
    score: makeScore
  };

  /* -- Wire the inline canvases ---------------------------- */

  const inlineDemos = [];

  document.querySelectorAll('canvas[data-demo]').forEach((canvas) => {
    const make = FACTORIES[canvas.dataset.demo];
    if (!make) return;
    const demo = make(canvas);
    const entry = { canvas, demo, visible: false, pointer: { x: 0.5, y: 0.5 } };

    canvas.addEventListener('pointermove', (e) => {
      const r = canvas.getBoundingClientRect();
      entry.pointer.x = clamp((e.clientX - r.left) / r.width, 0, 1);
      entry.pointer.y = clamp((e.clientY - r.top) / r.height, 0, 1);
      demo.pointer?.(entry.pointer.x, entry.pointer.y, pointer.speed);
    });
    canvas.addEventListener('pointerleave', () => demo.pointer?.(0.5, 0.5, 0));

    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { entry.visible = en.isIntersecting; });
    }, { threshold: 0.02 });
    io.observe(canvas);

    inlineDemos.push(entry);
  });

  // Pointer velocity, shared
  let lastPX = null;
  let lastPY = null;
  addEventListener('pointermove', (e) => {
    if (lastPX !== null) {
      const dx = e.clientX - lastPX;
      const dy = e.clientY - lastPY;
      pointer.speed = lerp(pointer.speed, Math.hypot(dx, dy), 0.35);
    }
    lastPX = e.clientX;
    lastPY = e.clientY;
    pointer.x = e.clientX / innerWidth;
    pointer.y = e.clientY / innerHeight;
  }, { passive: true });

  // One task that paints only the visible canvases.
  // With motion off we still paint, just slowly, so the demos stay readable.
  let demoTick = 0;
  addTask((dt) => {
    demoTick += 1;
    pointer.speed *= 0.9;
    const skip = motionScale === 0 ? 24 : 1;
    if (demoTick % skip !== 0) return;
    const step = dt * skip;

    inlineDemos.forEach((e) => {
      if (!e.visible) return;
      try { e.demo.frame(step); } catch { /* a broken demo must not stop the page */ }
    });

    if (stageDemo && stageOpen && !stagePaused) {
      try { stageDemo.frame(step); } catch { /* a broken demo must not stop the page */ }
    }
  });

  /* ---------- Work rail: pin and translate ---------------- */

  const rail = document.getElementById('work-rail');
  const railWrap = document.getElementById('rail-wrap');
  let railState = null;

  function layoutRail() {
    if (!rail || !railWrap) return null;
    if (innerWidth < 900 || reducedQuery.matches || motionScale === 0) {
      rail.style.transform = '';
      railWrap.style.height = '';
      railState = null;
      return null;
    }
    const overflow = rail.scrollWidth - innerWidth + 40;
    if (overflow <= 0) {
      rail.style.transform = '';
      railWrap.style.height = '';
      railState = null;
      return null;
    }
    const top = railWrap.getBoundingClientRect().top + window.scrollY - 96;
    const state = { top, dist: overflow + innerHeight * 0.4, overflow };
    railWrap.style.height = `${state.dist + innerHeight * 0.6}px`;
    railState = state;
    return state;
  }

  function applyRail() {
    if (!railState) return;
    const y = window.scrollY || 0;
    const p = clamp((y - railState.top) / railState.dist, 0, 1);
    rail.style.transform = `translate3d(${(-p * railState.overflow).toFixed(2)}px, 0, 0)`;
  }

  let railRaf = null;
  function scheduleRail() {
    if (railRaf) return;
    railRaf = requestAnimationFrame(() => {
      railRaf = null;
      applyRail();
    });
  }

  addEventListener('scroll', scheduleRail, { passive: true });
  addEventListener('resize', () => { layoutRail(); applyRail(); });

  /* ---------- Sandbox: pinned spring tuning --------------- */

  const sandboxPin = document.getElementById('sandbox-pin');
  const sbTension = document.getElementById('sb-tension');
  const sbDamping = document.getElementById('sb-damping');
  const sbTensionFill = document.getElementById('sb-tension-fill');
  const sbDampingFill = document.getElementById('sb-damping-fill');
  const sbVerdict = document.getElementById('sb-verdict');
  const pusher = document.getElementById('pusher');
  let sbState = null;

  const VERDICTS = [
    [0.34, 'Dead beat. Arrives and stops, no bounce.'],
    [0.56, 'Slight overshoot. Feels mechanical, in a good way.'],
    [0.78, 'Balanced. One small overshoot, settles fast.'],
    [1.00, 'Springy. It wobbles once and lands.'],
    [1.40, 'Loose. Reads as playful, costs you a beat.']
  ];

  function layoutSandbox() {
    if (!sandboxPin) return null;
    if (innerWidth < 900 || reducedQuery.matches || motionScale === 0) {
      sandboxPin.style.height = '';
      sbState = null;
      return null;
    }
    const top = sandboxPin.getBoundingClientRect().top + window.scrollY - (innerHeight - sandboxPin.offsetHeight) / 2;
    sbState = { top, dist: Math.max(600, innerHeight * 1.6) };
    sandboxPin.style.minHeight = `${sbState.dist}px`;
    return sbState;
  }

  function applySandbox() {
    if (!sbState) return;
    const y = window.scrollY || 0;
    const p = clamp((y - sbState.top) / sbState.dist, 0, 1);
    const tension = Math.round(lerp(90, 320, p));
    const damping = lerp(0.34, 1.25, p);

    sbTension.textContent = String(tension);
    sbDamping.textContent = damping.toFixed(2);
    sbTensionFill.style.width = `${p * 100}%`;
    sbDampingFill.style.width = `${p * 100}%`;

    let verdict = VERDICTS[0][1];
    for (const [limit, text] of VERDICTS) {
      if (damping >= limit) verdict = text;
    }
    sbVerdict.textContent = verdict;
    pusher.dataset.tension = String(tension);
    pusher.dataset.damping = damping.toFixed(3);
  }

  let sbRaf = null;
  function scheduleSandbox() {
    if (sbRaf) return;
    sbRaf = requestAnimationFrame(() => {
      sbRaf = null;
      applySandbox();
    });
  }
  addEventListener('scroll', scheduleSandbox, { passive: true });
  addEventListener('resize', () => { layoutSandbox(); applySandbox(); });

  /* Spring that reads the sandbox values */
  if (pusher) {
    let pos = 1;
    let vel = 0;
    let target = 1;

    pusher.addEventListener('pointerdown', () => { target = 0.86; });
    addEventListener('pointerup', () => { target = 1; });
    pusher.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); target = 0.86; }
    });
    pusher.addEventListener('keyup', () => { target = 1; });
    pusher.addEventListener('blur', () => { target = 1; });

    addTask((dt) => {
      const tension = Number(pusher.dataset.tension) || 170;
      const damping = Number(pusher.dataset.damping) || 0.8;
      if (motionScale === 0) {
        pos = target;
      } else {
        const stiffness = tension * 0.06;
        const critDamp = 2 * Math.sqrt(stiffness);
        const c = damping * critDamp;
        const a = (target - pos) * stiffness - vel * c;
        vel += a * dt;
        pos += vel * dt;
      }
      const scale = pos;
      pusher.style.transform = `scale(${scale.toFixed(4)})`;
    });
  }

  /* ---------- Reveal pass --------------------------------- */

  document.querySelectorAll('[data-split]').forEach(splitText);
  document.querySelectorAll('[data-reveal]').forEach((el, i) => {
    el.style.transitionDelay = `${(i % 4) * 90 * motionScale}ms`;
    revealIO.observe(el);
  });
  document.querySelectorAll('.piece, .essay, .step, .slab').forEach((el) => {
    el.setAttribute('data-reveal', '');
    revealIO.observe(el);
  });

  /* ---------- Writing filters ----------------------------- */

  const filters = [...document.querySelectorAll('.filter')];
  const essays = [...document.querySelectorAll('.essay')];
  const emptyState = document.getElementById('essays-empty');
  const resetBtn = document.getElementById('essays-reset');

  function applyFilter(topic) {
    let shown = 0;
    essays.forEach((el) => {
      const match = topic === 'all' || el.dataset.topic === topic;
      el.classList.toggle('is-out', !match);
      if (match) shown += 1;
    });
    filters.forEach((f) => {
      const on = f.dataset.filter === topic;
      f.classList.toggle('is-on', on);
      f.setAttribute('aria-pressed', String(on));
    });
    const isEmpty = shown === 0;
    emptyState.hidden = !isEmpty;
    document.getElementById('essays').hidden = isEmpty;
  }

  filters.forEach((f) => f.addEventListener('click', () => applyFilter(f.dataset.filter)));
  resetBtn?.addEventListener('click', () => { applyFilter('all'); filters[0]?.focus(); });

  /* ---------- Full screen stage --------------------------- */

  const stage = document.getElementById('stage');
  const stagePanel = document.getElementById('stage-panel');
  const stageTitle = document.getElementById('stage-title');
  const stageKicker = document.getElementById('stage-kicker');
  const stageNote = document.getElementById('stage-note');
  const stageCanvas = document.getElementById('stage-canvas');
  const stageRange = document.getElementById('stage-range');
  const stageRangeOut = document.getElementById('stage-range-out');
  const stagePause = document.getElementById('stage-pause');

  let stageDemo = null;
  let stageOpen = false;
  let stagePaused = false;
  let lastFocused = null;
  let stagePointer = { x: 0.5, y: 0.5 };

  const STAGE_META = {
    tessellate: { kicker: 'Live · WebGL-free tiling', title: 'Tessellate Engine', note: 'Cursor speed sets the interference frequency', demo: 'moire' },
    sigil: { kicker: 'Live · Variable font', title: 'Sigil Type Foundry', note: 'Drag to bend four axes', demo: 'glyph' },
    obsidian: { kicker: 'Live · Streamed window', title: 'Obsidian Ledger', note: 'Cursor position sets the ingest rate', demo: 'ledger' },
    harbour: { kicker: 'Live · Public screen', title: 'Harbour Tide', note: 'Cursor height sets the tidal amplitude', demo: 'tide' },
    verre: { kicker: 'Live · Refraction', title: 'Verre Atelier', note: 'Five lenses follow your cursor', demo: 'glass' },
    nacht: { kicker: 'Live · Generative score', title: 'Nachtmuziek', note: 'Cursor sets the typesetting tempo', demo: 'score' }
  };

  function openStage(key) {
    const meta = STAGE_META[key];
    if (!meta) return;
    lastFocused = document.activeElement;

    stageKicker.textContent = meta.kicker;
    stageTitle.textContent = meta.title;
    stageNote.textContent = meta.note;

    const make = FACTORIES[meta.demo];
    stageDemo = make ? make(stageCanvas) : null;
    stagePointer = { x: 0.5, y: 0.5 };
    stagePaused = false;
    stagePause.setAttribute('aria-pressed', 'false');
    stagePause.querySelector('.btn__text').textContent = 'Pause';
    stageRange.value = '55';
    stageRangeOut.textContent = '55';

    stage.hidden = false;
    document.querySelectorAll('main, .head, .foot').forEach((el) => el.setAttribute('inert', ''));
    body.style.overflow = 'hidden';

    requestAnimationFrame(() => {
      stage.classList.add('is-open');
      stagePanel.focus?.();
      stage.querySelector('.stage__close')?.focus();
    });
    stageOpen = true;
  }

  function closeStage() {
    if (!stageOpen) return;
    stage.classList.remove('is-open');
    stageOpen = false;
    stageDemo = null;
    document.querySelectorAll('main, .head, .foot').forEach((el) => el.removeAttribute('inert'));
    body.style.overflow = '';
    const done = () => { if (!stageOpen) stage.hidden = true; };
    setTimeout(done, 440 * (motionScale || 0.4));
    lastFocused?.focus?.();
  }

  document.querySelectorAll('[data-open]').forEach((btn) => {
    btn.addEventListener('click', () => openStage(btn.dataset.open));
  });

  stage.addEventListener('click', (e) => {
    if (e.target.closest('[data-close]')) closeStage();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeStage();
  });

  // Focus trap
  stage.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab' || !stageOpen) return;
    const focusables = stage.querySelectorAll('button, input, [href], [tabindex]:not([tabindex="-1"])');
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  stageCanvas.addEventListener('pointermove', (e) => {
    const r = stageCanvas.getBoundingClientRect();
    stagePointer.x = clamp((e.clientX - r.left) / r.width, 0, 1);
    stagePointer.y = clamp((e.clientY - r.top) / r.height, 0, 1);
    stageDemo?.pointer?.(stagePointer.x, stagePointer.y, pointer.speed);
  });

  stageRange.addEventListener('input', () => {
    stageRangeOut.textContent = stageRange.value;
    stageDemo?.pointer?.(stagePointer.x, stagePointer.y, Number(stageRange.value) / 2);
  });

  stagePause.addEventListener('click', () => {
    stagePaused = !stagePaused;
    stagePause.setAttribute('aria-pressed', String(stagePaused));
    stagePause.querySelector('.btn__text').textContent = stagePaused ? 'Resume' : 'Pause';
    if (stagePaused) stageDemo?.pointer?.(0.5, 0.5, 0);
  });

  /* ---------- Form ---------------------------------------- */

  const form = document.getElementById('form');
  const submit = document.getElementById('submit');
  const formNote = document.getElementById('form-note');
  const formOk = document.getElementById('form-ok');
  const jobInput = document.getElementById('f-job');
  const jobCount = document.getElementById('job-count');

  const fields = [
    { input: document.getElementById('f-name'), err: document.getElementById('e-name'), test: (v) => v.trim().length >= 2 },
    { input: document.getElementById('f-mail'), err: document.getElementById('e-mail'), test: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) },
    { input: document.getElementById('f-job'), err: document.getElementById('e-job'), test: (v) => v.trim().length >= 12 }
  ];

  function validateField(field, show = true) {
    const ok = field.test(field.input.value);
    if (show) {
      field.err.hidden = ok;
      field.input.closest('.field').classList.toggle('is-bad', !ok);
    }
    return ok;
  }

  fields.forEach((field) => {
    field.input.addEventListener('blur', () => validateField(field));
    field.input.addEventListener('input', () => {
      if (field.input.closest('.field').classList.contains('is-bad')) validateField(field);
    });
  });

  if (jobInput && jobCount) {
    const update = () => {
      const n = jobInput.value.length;
      jobCount.textContent = String(n);
      jobCount.parentElement.classList.toggle('is-near', n > 540);
    };
    jobInput.addEventListener('input', update);
    update();
  }

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    formOk.hidden = true;
    formNote.classList.remove('is-bad');

    const results = fields.map((f) => validateField(f));
    const firstBad = fields[results.indexOf(false)];

    if (results.includes(false)) {
      formNote.textContent = 'Three fields are missing or wrong. Check the marked one.';
      formNote.classList.add('is-bad');
      firstBad?.input.focus();
      return;
    }

    submit.classList.add('is-busy');
    submit.disabled = true;
    submit.querySelector('.btn__text').textContent = 'Sending';

    setTimeout(() => {
      submit.classList.remove('is-busy');
      submit.disabled = false;
      submit.querySelector('.btn__text').textContent = 'Send it';
      form.reset();
      if (jobCount) jobCount.textContent = '0';
      formNote.textContent = 'No newsletter, no tracking, no third parties.';
      formOk.hidden = false;
      formOk.focus?.();
    }, 1250);
  });

  /* ---------- Footer clock -------------------------------- */

  const clock = document.getElementById('clock');
  if (clock) {
    const tick = () => {
      try {
        clock.textContent = new Intl.DateTimeFormat('en-GB', {
          timeZone: 'Europe/Amsterdam',
          hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
        }).format(new Date());
      } catch {
        clock.textContent = new Date().toTimeString().slice(0, 8);
      }
    };
    tick();
    setInterval(tick, 1000);
  }

  /* ---------- Boot layout --------------------------------- */

  function bootLayout() {
    layoutRail();
    applyRail();
    layoutSandbox();
    applySandbox();
  }

  if (document.fonts) document.fonts.ready.then(bootLayout);
  addEventListener('load', bootLayout);
  setTimeout(bootLayout, 400);
  bootLayout();
})();
