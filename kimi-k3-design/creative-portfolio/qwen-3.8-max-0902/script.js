/* ============================================================
   LEO VOSS — motion & interaction engine
   Single rAF loop · lerp smooth scroll · cursor · reveals
   ============================================================ */
(() => {
  'use strict';

  const doc = document;
  const html = doc.documentElement;
  const $ = (s, c = doc) => c.querySelector(s);
  const $$ = (s, c = doc) => Array.from(c.querySelectorAll(s));

  const reduceMQ = matchMedia('(prefers-reduced-motion: reduce)');
  const fineMQ = matchMedia('(pointer: fine)');
  const hoverMQ = matchMedia('(hover: hover)');
  const REDUCED = reduceMQ.matches;
  const FINE = fineMQ.matches;
  const SMOOTH_ON = FINE && !REDUCED;

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const clamp01 = (v) => clamp(v, 0, 1);
  const lerp = (a, b, t) => a + (b - a) * t;

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);

  /* ░░ State ░░ */
  const state = {
    scrollY: window.scrollY,
    lastY: window.scrollY,
    velocity: 0,
    maxScroll: 1,
    vh: innerHeight,
    vw: innerWidth,
    navDirLocked: false,
    menuOpen: false,
    heroVisible: true,
    aboutVisible: false,
    stackVisible: false,
    wordsActive: false,
    litCount: -1,
  };

  const measure = () => {
    state.vh = innerHeight;
    state.vw = innerWidth;
    state.maxScroll = Math.max(1, doc.documentElement.scrollHeight - innerHeight);
    marquees.forEach((m) => m.measure());
    stack.measure();
  };

  /* ░░ Clock + year ░░ */
  const clockEls = $$('[data-clock]');
  const zoneEls = $$('[data-clock-zone]');
  const timeFmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Lisbon', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });
  const zoneFmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Lisbon', timeZoneName: 'short' });
  const tickClock = () => {
    const now = new Date();
    const t = timeFmt.format(now);
    clockEls.forEach((el) => (el.textContent = t));
    const zone = zoneFmt.formatToParts(now).find((p) => p.type === 'timeZoneName')?.value || '';
    zoneEls.forEach((el) => (el.textContent = zone));
  };
  tickClock();
  setInterval(tickClock, 1000);
  $$('[data-year]').forEach((el) => (el.textContent = String(new Date().getFullYear())));

  /* ░░ Smooth scroll (lerp on native scroll — sticky keeps working) ░░ */
  let target = window.scrollY;
  let current = window.scrollY;

  const wheelDelta = (e) => {
    if (e.deltaMode === 1) return e.deltaY * 18;
    if (e.deltaMode === 2) return e.deltaY * state.vh;
    return e.deltaY;
  };

  if (SMOOTH_ON) {
    addEventListener('wheel', (e) => {
      if (e.ctrlKey) return; // never hijack pinch-zoom
      if (html.classList.contains('is-loading')) return;
      if (state.menuOpen) { e.preventDefault(); return; }
      e.preventDefault();
      target = clamp(target + wheelDelta(e), 0, state.maxScroll);
    }, { passive: false });

    addEventListener('keydown', (e) => {
      if (state.menuOpen || html.classList.contains('is-loading')) return;
      if (e.target.closest('input, textarea, select')) return;
      const onControl = e.target.closest('a, button');
      const step = { ArrowUp: -90, ArrowDown: 90 }[e.key];
      const page = { PageUp: -1, PageDown: 1 }[e.key] ?? (e.key === ' ' && !onControl ? 1 : null);
      if (step !== undefined) { e.preventDefault(); target = clamp(target + step, 0, state.maxScroll); }
      else if (page !== null) { e.preventDefault(); target = clamp(target + page * state.vh * 0.9, 0, state.maxScroll); }
      else if (e.key === 'Home') { e.preventDefault(); target = 0; }
      else if (e.key === 'End') { e.preventDefault(); target = state.maxScroll; }
    });

    addEventListener('scroll', () => {
      // Native scroll events fire asynchronously, so a same-tick "self scroll"
      // flag can't reliably tell our own window.scrollTo() apart from a real
      // user scroll (scrollbar drag, keyboard, touch). Compare against the
      // lerp target instead: our own scrolls always land on `current`.
      if (Math.abs(window.scrollY - current) > 1.5) { target = current = window.scrollY; }
    }, { passive: true });
  }

  const scrollToY = (y, instant = false) => {
    const dest = clamp(y, 0, state.maxScroll);
    if (SMOOTH_ON && !instant) { target = dest; return; }
    window.scrollTo({ top: dest, behavior: REDUCED ? 'auto' : 'smooth' });
    if (SMOOTH_ON) target = current = dest;
  };

  /* Anchor delegation */
  doc.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || a.classList.contains('skip-link')) return;
    const id = a.getAttribute('href');
    if (id === '#' || id === '') return;
    const el = $(id);
    if (!el) return;
    e.preventDefault();
    const wasOpen = state.menuOpen;
    if (wasOpen) closeMenu();
    const go = () => {
      const y = id === '#top' ? 0 : el.getBoundingClientRect().top + window.scrollY - 72;
      scrollToY(y, wasOpen);
      history.pushState(null, '', id);
    };
    wasOpen ? setTimeout(go, 340) : go();
  });

  $('#toTop')?.addEventListener('click', () => scrollToY(0));

  /* ░░ Preloader ░░ */
  const loader = $('#loader');
  const loaderCount = $('#loaderCount');
  const loaderBar = $('#loaderBar');

  const finishLoader = () => {
    loader.classList.add('is-done');
    html.classList.remove('is-loading');
    doc.body.classList.add('is-loaded');
    setTimeout(() => loader.classList.add('is-gone'), REDUCED ? 100 : 1500);
    if (location.hash && $(location.hash)) {
      setTimeout(() => scrollToY($(location.hash).getBoundingClientRect().top + window.scrollY - 72, true), 60);
    }
  };

  const runLoader = () => {
    if (!loader) { finishLoader(); return; }
    const dur = REDUCED ? 260 : 1250;
    const start = performance.now();
    const tick = (now) => {
      const p = clamp01((now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 2.4);
      loaderCount.textContent = String(Math.round(eased * 100)).padStart(3, '0');
      loaderBar.style.transform = `scaleX(${eased})`;
      if (p < 1) requestAnimationFrame(tick);
      else finishLoader();
    };
    requestAnimationFrame(tick);
  };

  Promise.race([
    doc.fonts ? doc.fonts.ready : Promise.resolve(),
    new Promise((r) => setTimeout(r, 2400)),
  ]).then(runLoader);

  /* ░░ Reveals ░░ */
  const hasIO = 'IntersectionObserver' in window;

  const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/\\<>[]{}()*#%&$@!?+=';
  function scrambleTo(el, text, dur = 640) {
    if (REDUCED) { el.textContent = text; return; }
    const start = performance.now();
    const q = Array.from(text).map((ch, i) => ({
      ch,
      from: (i / text.length) * dur * 0.5,
      to: (i / text.length) * dur * 0.5 + dur * 0.5 + Math.random() * 120,
    }));
    const tick = (now) => {
      let out = '';
      let done = 0;
      for (const item of q) {
        if (item.ch === ' ') { out += ' '; done++; continue; }
        if (now - start >= item.to) { out += item.ch; done++; }
        else out += CHARS[(Math.random() * CHARS.length) | 0];
      }
      el.textContent = out;
      if (done < q.length) requestAnimationFrame(tick);
      else el.textContent = text;
    };
    requestAnimationFrame(tick);
  }

  if (hasIO) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const el = en.target;
        el.classList.add('is-in');
        io.unobserve(el);
        if (el.hasAttribute('data-scramble')) scrambleTo(el, el.textContent);
        if (el.hasAttribute('data-words')) state.wordsActive = true;
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -6% 0px' });

    $$('[data-reveal], .contact__title').forEach((el) => io.observe(el));

    /* Section visibility flags for rAF work */
    const flagIO = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.target.matches('.hero')) state.heroVisible = en.isIntersecting;
        if (en.target.matches('.about')) state.aboutVisible = en.isIntersecting;
        if (en.target.matches('.stack')) state.stackVisible = en.isIntersecting;
      });
    }, { threshold: 0 });
    ['.hero', '.about', '.stack'].forEach((s) => { const el = $(s); if (el) flagIO.observe(el); });

    /* Stats count-up */
    const statsEl = $('.stats');
    if (statsEl) {
      const statIO = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          statIO.disconnect();
          $$('[data-count]', statsEl).forEach((el) => {
            const val = parseInt(el.dataset.count, 10);
            const pad = parseInt(el.dataset.pad || '0', 10);
            if (REDUCED) { el.textContent = pad ? String(val).padStart(pad, '0') : String(val); return; }
            const start = performance.now();
            const dur = 1500;
            const tick = (now) => {
              const p = clamp01((now - start) / dur);
              const eased = 1 - Math.pow(1 - p, 3.2);
              const n = Math.round(eased * val);
              el.textContent = pad ? String(n).padStart(pad, '0') : String(n);
              if (p < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
          });
        });
      }, { threshold: 0.4 });
      statIO.observe(statsEl);
    }
  } else {
    $$('[data-reveal], .contact__title').forEach((el) => el.classList.add('is-in'));
    state.wordsActive = true;
  }

  /* ░░ Word-by-word highlight (about statement) ░░ */
  const wordsEl = $('[data-words]');
  let words = [];
  if (wordsEl) {
    const walk = (node) => {
      Array.from(node.childNodes).forEach((child) => {
        if (child.nodeType === 3) {
          const frag = doc.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (!part.trim()) { frag.appendChild(doc.createTextNode(part)); return; }
            const s = doc.createElement('span');
            s.className = 'w';
            s.textContent = part;
            frag.appendChild(s);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === 1) walk(child);
      });
    };
    walk(wordsEl);
    words = $$('.w', wordsEl);
    if (REDUCED) words.forEach((w) => w.classList.add('is-lit'));
  }

  const updateWords = () => {
    if (!words.length || !state.wordsActive || REDUCED) return;
    const r = wordsEl.getBoundingClientRect();
    const startAt = state.vh * 0.82;
    const dist = r.height + state.vh * 0.3;
    const p = clamp01((startAt - r.top) / dist);
    const lit = Math.floor(p * words.length * 1.08);
    if (lit === state.litCount) return;
    for (let i = 0; i < words.length; i++) {
      words[i].classList.toggle('is-lit', i < lit);
    }
    state.litCount = lit;
  };

  /* ░░ Hero role rotator ░░ */
  const rotator = $('[data-rotator]');
  if (rotator && rotator.dataset.rotateItems) {
    const items = rotator.dataset.rotateItems.split(',').map((s) => s.trim()).filter(Boolean);
    let idx = 0;
    if (!REDUCED && items.length > 1) {
      setInterval(() => {
        if (!state.heroVisible || state.menuOpen || doc.hidden) return;
        idx = (idx + 1) % items.length;
        scrambleTo(rotator, items[idx], 560);
      }, 3400);
    }
  }

  /* ░░ Custom cursor ░░ */
  const cursor = $('#cursor');
  const cursorLabel = $('#cursorLabel');
  let mouseX = state.vw / 2, mouseY = state.vh / 2;
  let ringX = mouseX, ringY = mouseY, dotX = mouseX, dotY = mouseY;
  const CURSOR_ON = FINE && !REDUCED && !!cursor;

  if (CURSOR_ON) {
    html.classList.add('has-cursor');
    addEventListener('mousemove', (e) => {
      mouseX = e.clientX; mouseY = e.clientY;
      cursor.classList.add('is-ready');
    });
    doc.addEventListener('mouseleave', () => cursor.classList.remove('is-ready'));
    doc.addEventListener('mouseenter', () => cursor.classList.add('is-ready'));
    addEventListener('mousedown', () => cursor.classList.add('is-down'));
    addEventListener('mouseup', () => cursor.classList.remove('is-down'));

    doc.addEventListener('mouseover', (e) => {
      const t = e.target;
      const special = t.closest?.('[data-cursor]');
      if (special) {
        const mode = special.dataset.cursor;
        cursor.classList.toggle('is-view', mode === 'view');
        cursor.classList.toggle('is-hidden', mode === 'hide');
        if (mode !== 'view' && mode !== 'hide') cursor.classList.add('is-hover');
        return;
      }
      if (t.closest?.('a, button')) { cursor.classList.add('is-hover'); return; }
      cursor.classList.remove('is-view', 'is-hidden', 'is-hover');
    });
  }

  /* ░░ Floating work follower ░░ */
  const follower = $('#follower');
  const FOLLOW_ON = CURSOR_ON && hoverMQ.matches && !!follower;
  let folX = mouseX, folY = mouseY, folTargetX = 0, folTargetY = 0;
  let folScale = 0.85, folActive = false, folVelX = 0, folLastX = 0;

  if (FOLLOW_ON) {
    follower.classList.add('can-show');
    const list = $('.work__list');
    list?.addEventListener('mouseover', (e) => {
      const item = e.target.closest('.work-item');
      if (!item || item === list.querySelector('.work-item.is-hovered')) return;
      $$('.work-item.is-hovered', list).forEach((i) => i.classList.remove('is-hovered'));
      item.classList.add('is-hovered');
      const variant = item.dataset.variant;
      $$('.follower__art', follower).forEach((art) => {
        art.classList.toggle('is-active', art.classList.contains(`art--${variant}`));
      });
      follower.classList.add('is-visible');
      folActive = true;
    });
    list?.addEventListener('mouseleave', () => {
      follower.classList.remove('is-visible');
      folActive = false;
      $$('.work-item.is-hovered', list).forEach((i) => i.classList.remove('is-hovered'));
    });
    addEventListener('mousemove', (e) => { folTargetX = e.clientX; folTargetY = e.clientY; });
  }

  /* ░░ Work rows: expand ░░ */
  $$('.work-row').forEach((row) => {
    row.addEventListener('click', () => {
      const item = row.closest('.work-item');
      const open = item.classList.contains('is-open');
      $$('.work-item.is-open').forEach((i) => {
        i.classList.remove('is-open');
        $('.work-row', i)?.setAttribute('aria-expanded', 'false');
      });
      if (!open) {
        item.classList.add('is-open');
        row.setAttribute('aria-expanded', 'true');
      }
      if (SMOOTH_ON) setTimeout(measure, 700);
    });
  });

  /* ░░ Menu ░░ */
  const menu = $('#menu');
  const menuBtn = $('#menuBtn');
  const menuLabel = $('.menu-btn__label', menuBtn);
  let lastFocused = null;

  const menuFocusables = () => [menuBtn, ...$$('a[href]', menu)];

  function openMenu() {
    const r = menuBtn.getBoundingClientRect();
    menu.style.setProperty('--mx', `${r.left + r.width / 2}px`);
    menu.style.setProperty('--my', `${r.top + r.height / 2}px`);
    state.menuOpen = true;
    menu.classList.add('is-open');
    menu.inert = false;
    menuBtn.setAttribute('aria-expanded', 'true');
    menuLabel.textContent = 'Close';
    doc.body.classList.add('menu-open');
    lastFocused = doc.activeElement;
    setTimeout(() => $('a[href]', menu)?.focus(), 420);
  }
  function closeMenu() {
    if (!state.menuOpen) return;
    state.menuOpen = false;
    menu.classList.remove('is-open');
    menu.inert = true;
    menuBtn.setAttribute('aria-expanded', 'false');
    menuLabel.textContent = 'Menu';
    doc.body.classList.remove('menu-open');
    if (SMOOTH_ON) target = current = window.scrollY;
    (lastFocused || menuBtn).focus?.({ preventScroll: true });
  }
  menuBtn?.addEventListener('click', () => (state.menuOpen ? closeMenu() : openMenu()));
  addEventListener('keydown', (e) => {
    if (!state.menuOpen) return;
    if (e.key === 'Escape') { closeMenu(); return; }
    if (e.key !== 'Tab') return;
    const f = menuFocusables().filter((el) => el.offsetParent !== null || el === menuBtn);
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && doc.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && doc.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  menu?.addEventListener('touchmove', (e) => {
    const inner = $('.menu__inner', menu);
    if (inner && inner.scrollHeight > inner.clientHeight + 4) return; // allow inner scroll
    e.preventDefault();
  }, { passive: false });

  /* ░░ Magnetic controls ░░ */
  if (FINE && !REDUCED) {
    $$('[data-magnetic]').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.32;
        const y = (e.clientY - r.top - r.height / 2) * 0.32;
        el.style.transition = 'transform 0.12s linear';
        el.style.transform = `translate(${x}px, ${y}px)`;
      });
      el.addEventListener('pointerleave', () => {
        el.style.transition = 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
        el.style.transform = '';
      });
    });
  }

  /* ░░ Marquee engine ░░ */
  const marquees = $$('[data-marquee]').map((el) => {
    const track = el.firstElementChild;
    const m = {
      el, track,
      speed: parseFloat(el.dataset.speed || '0.5'),
      pos: 0, half: 0,
      measure() {
        const kids = track.children;
        const halfIdx = Math.floor(kids.length / 2);
        m.half = kids[halfIdx] ? kids[halfIdx].offsetLeft - kids[0].offsetLeft : track.scrollWidth / 2;
      },
    };
    return m;
  });

  /* ░░ Stacked cards engine ░░ */
  const stack = (() => {
    const cards = $$('.stack__card');
    let stickTops = [];
    return {
      measure() {
        stickTops = cards.map((c) => parseFloat(getComputedStyle(c).top) || 0);
      },
      update() {
        if (!state.stackVisible || REDUCED || !cards.length) return;
        for (let i = 0; i < cards.length - 1; i++) {
          const card = cards[i];
          const next = cards[i + 1];
          const nextTop = next.getBoundingClientRect().top;
          const cardH = card.offsetHeight || 1;
          const dist = nextTop - stickTops[i];
          const p = 1 - clamp01(dist / (cardH * 1.15));
          if (p <= 0.002) { if (card.dataset.stacked) { card.style.transform = ''; delete card.dataset.stacked; } continue; }
          card.dataset.stacked = '1';
          card.style.transform = `scale(${(1 - 0.055 * p).toFixed(4)})`;
          card.style.transformOrigin = '50% 0%';
        }
      },
    };
  })();

  /* ░░ Nav / progress ░░ */
  const nav = $('#nav');
  const progressBar = $('#progressBar');
  let navHidden = false;
  let dirAccum = 0;

  /* ░░ Hero parallax refs ░░ */
  const heroTitle = $('.hero__title');
  const heroBottom = $('.hero__bottom');
  const heroTop = $('.hero__top');

  /* ░░ Main loop ░░ */
  const frame = () => {
    /* 1 — smooth scroll */
    if (SMOOTH_ON && Math.abs(target - current) > 0.08) {
      current = lerp(current, target, 0.085);
      if (Math.abs(target - current) < 0.08) current = target;
      window.scrollTo(0, current);
    } else if (SMOOTH_ON) {
      current = target;
    }

    const y = SMOOTH_ON ? current : window.scrollY;
    const delta = y - state.lastY;
    state.velocity = lerp(state.velocity, delta, 0.14);
    state.lastY = y;
    const scrolled = Math.abs(state.velocity) > 0.4;

    /* 2 — progress bar */
    if (progressBar) progressBar.style.transform = `scaleX(${clamp01(y / state.maxScroll)})`;

    /* 3 — nav behavior */
    if (nav && !state.menuOpen) {
      nav.classList.toggle('is-stuck', y > 48);
      dirAccum = Math.sign(delta) === Math.sign(dirAccum) ? dirAccum + delta : delta;
      if (dirAccum > 260 && y > state.vh * 0.85 && !navHidden) { nav.classList.add('is-hidden'); navHidden = true; }
      else if (dirAccum < -120 && navHidden) { nav.classList.remove('is-hidden'); navHidden = false; }
    }

    /* 4 — marquees */
    if (!REDUCED) {
      const boost = clamp(state.velocity * 0.9, -34, 34);
      marquees.forEach((m) => {
        if (!m.half) return;
        m.pos += -(m.speed * 0.9 + boost * 0.06);
        if (m.speed > 0 && m.pos <= -m.half) m.pos += m.half;
        if (m.speed < 0 && m.pos >= 0) m.pos -= m.half;
        m.track.style.transform = `translate3d(${m.pos.toFixed(2)}px, 0, 0)`;
      });
    }

    /* 5 — cursor */
    if (CURSOR_ON) {
      ringX = lerp(ringX, mouseX, 0.16);
      ringY = lerp(ringY, mouseY, 0.16);
      dotX = lerp(dotX, mouseX, 0.55);
      dotY = lerp(dotY, mouseY, 0.55);
      $('.cursor__ring', cursor).style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
      $('.cursor__dot', cursor).style.transform = `translate3d(${dotX}px, ${dotY}px, 0)`;
      cursorLabel.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
    }

    /* 6 — follower */
    if (FOLLOW_ON && folActive) {
      folX = lerp(folX, folTargetX, 0.11);
      folY = lerp(folY, folTargetY, 0.11);
      folVelX = folX - folLastX;
      folLastX = folX;
      folScale = lerp(folScale, 1, 0.14);
      const rot = clamp(folVelX * 0.45, -13, 13);
      follower.style.transform =
        `translate3d(${folX}px, ${folY}px, 0) translate(-50%, -50%) rotate(${rot.toFixed(2)}deg) scale(${folScale.toFixed(3)})`;
    } else if (FOLLOW_ON) {
      folScale = lerp(folScale, 0.85, 0.2);
      folX = lerp(folX, folTargetX, 0.11);
      folY = lerp(folY, folTargetY, 0.11);
      follower.style.transform =
        `translate3d(${folX}px, ${folY}px, 0) translate(-50%, -50%) scale(${folScale.toFixed(3)})`;
    }

    /* 7 — hero parallax */
    if (!REDUCED && state.heroVisible) {
      const p = clamp01(y / (state.vh * 0.85));
      if (heroTitle) heroTitle.style.transform = p > 0 ? `translate3d(0, ${(p * 74).toFixed(1)}px, 0)` : '';
      if (heroBottom) {
        heroBottom.style.transform = p > 0 ? `translate3d(0, ${(p * 36).toFixed(1)}px, 0)` : '';
        heroBottom.style.opacity = String(clamp(1 - p * 1.35, 0, 1));
      }
      if (heroTop) heroTop.style.opacity = String(clamp(1 - p * 1.8, 0, 1));
    }

    /* 8 — scroll-linked readers */
    if (scrolled || !SMOOTH_ON) {
      if (state.aboutVisible) updateWords();
      stack.update();
    }

    requestAnimationFrame(frame);
  };

  /* ░░ Boot ░░ */
  measure();
  stack.measure();
  addEventListener('resize', () => {
    clearTimeout(stack._rt);
    stack._rt = setTimeout(() => {
      measure();
      if (SMOOTH_ON) { target = clamp(target, 0, state.maxScroll); current = window.scrollY; target = current; }
    }, 140);
  });

  requestAnimationFrame(frame);
})();
