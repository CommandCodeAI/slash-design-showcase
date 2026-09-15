(function () {
  'use strict';

  var root = document.documentElement;
  var reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  function qs(sel, ctx) { return (ctx || document).querySelector(sel); }
  function qsa(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function motionMode() { return root.dataset.motion || 'full'; }
  function isFull() { return motionMode() === 'full'; }
  function hasMotion() { return motionMode() !== 'none'; }

  function makeRandom(seed) {
    var t = seed >>> 0;
    return function () {
      t += 0x6d2b79f5;
      var r = Math.imul(t ^ (t >>> 15), 1 | t);
      r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }

  function hashString(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  var BONE = [243, 239, 232];
  var SIGNAL = [226, 138, 76];
  function rgb(c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }
  function mixRgb(a, b, t) {
    return [Math.round(lerp(a[0], b[0], t)), Math.round(lerp(a[1], b[1], t)), Math.round(lerp(a[2], b[2], t))];
  }

  /* Field --------------------------------------------------- */

  function createField(canvas, options) {
    var opts = options || {};
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var points = [];
    var w = 1;
    var h = 1;
    var seed = opts.seed || 1;
    var accent = opts.accent || 'oklch(0.72 0.165 55)';
    var time = 0;
    var reveal = hasMotion() ? 0 : 1;
    var raf = null;
    var last = 0;
    var visible = opts.auto !== false;
    var pointer = { x: -9999, y: -9999, on: false };

    function gapFor() {
      if (typeof opts.gap === 'function') return opts.gap(w, h);
      return opts.gap || 34;
    }

    function build() {
      var rand = makeRandom(seed);
      var gap = gapFor();
      var cols = Math.ceil(w / gap) + 1;
      var rows = Math.ceil(h / gap) + 1;
      points = [];
      for (var y = 0; y < rows; y++) {
        for (var x = 0; x < cols; x++) {
          points.push({
            x: x * gap,
            y: y * gap,
            phase: rand() * 6.2832,
            len: (0.5 + rand() * 0.9) * (opts.len || 11),
            order: rand()
          });
        }
      }
    }

    function layout() {
      var rect = canvas.getBoundingClientRect();
      var nw = Math.max(1, Math.round(rect.width));
      var nh = Math.max(1, Math.round(rect.height));
      if (nw === w && nh === h && points.length) return;
      w = nw;
      h = nh;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
      draw();
    }

    function angleAt(x, y) {
      var f = opts.freq || 0.0034;
      return (
        Math.sin(x * f + time * 0.00021) * 1.55 +
        Math.cos(y * f * 1.34 - time * 0.00017) * 1.55 +
        Math.sin((x + y) * f * 0.62 + time * 0.00013) * 1.15
      );
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      ctx.lineWidth = 1;
      ctx.lineCap = 'round';

      var radius = opts.radius || 190;
      var reach = opts.reach || 1;
      var baseAlpha = opts.alpha == null ? 0.17 : opts.alpha;
      var i, p, ang, dx, dy, dist, infl, px, py;

      ctx.beginPath();
      for (i = 0; i < points.length; i++) {
        p = points[i];
        if (p.order > reveal) continue;
        px = p.x;
        py = p.y;
        if (pointer.on) {
          dx = px - pointer.x;
          dy = py - pointer.y;
          dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < radius) {
            infl = 1 - dist / radius;
            infl *= infl;
            px += (dx / (dist || 1)) * infl * 26 * reach;
            py += (dy / (dist || 1)) * infl * 26 * reach;
          }
        }
        ang = angleAt(p.x, p.y) + Math.sin(p.phase + time * 0.0004) * 0.35;
        ctx.moveTo(px, py);
        ctx.lineTo(px + Math.cos(ang) * p.len, py + Math.sin(ang) * p.len);
      }
      ctx.globalAlpha = baseAlpha;
      ctx.strokeStyle = opts.base || '#f3efe8';
      ctx.stroke();

      if (pointer.on && opts.reactive !== false) {
        var buckets = [[], [], [], [], [], []];
        for (i = 0; i < points.length; i++) {
          p = points[i];
          if (p.order > reveal) continue;
          dx = p.x - pointer.x;
          dy = p.y - pointer.y;
          dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > radius * 0.8) continue;
          infl = 1 - dist / (radius * 0.8);
          infl *= infl;
          ang = angleAt(p.x, p.y) + infl * 2.4;
          var b = clamp(Math.floor(infl * 5.99), 0, 5);
          buckets[b].push(p.x, p.y, ang, p.len * (1 + infl * 0.5));
        }
        ctx.strokeStyle = accent;
        for (var k = 0; k < 6; k++) {
          var arr = buckets[k];
          if (!arr.length) continue;
          ctx.globalAlpha = ((k + 1) / 6) * 0.75;
          ctx.beginPath();
          for (i = 0; i < arr.length; i += 4) {
            ctx.moveTo(arr[i], arr[i + 1]);
            ctx.lineTo(arr[i] + Math.cos(arr[i + 2]) * arr[i + 3], arr[i + 1] + Math.sin(arr[i + 2]) * arr[i + 3]);
          }
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
    }

    function frame(now) {
      raf = null;
      if (!visible) return;
      var delta = last ? Math.min(now - last, 48) : 16;
      last = now;
      time += delta;
      if (reveal < 1) reveal = Math.min(1, reveal + delta / (opts.revealMs || 900));
      draw();
      if (isFull() && visible) raf = requestAnimationFrame(frame);
    }

    function start() {
      if (raf) return;
      if (!isFull()) {
        reveal = 1;
        draw();
        return;
      }
      last = 0;
      raf = requestAnimationFrame(frame);
    }

    function stop() {
      if (raf) cancelAnimationFrame(raf);
      raf = null;
    }

    function setSeed(next) {
      seed = next || (seed + 977);
      reveal = 0;
      build();
      draw();
      start();
    }

    function setAccent(css) {
      accent = css;
    }

    function pointerMove(x, y) {
      pointer.x = x;
      pointer.y = y;
      pointer.on = true;
      if (!isFull()) draw();
    }

    function pointerLeave() {
      pointer.on = false;
      if (!isFull()) draw();
    }

    layout();

    return {
      el: canvas,
      start: start,
      stop: stop,
      layout: layout,
      setSeed: setSeed,
      setAccent: setAccent,
      move: pointerMove,
      leave: pointerLeave,
      show: function () { visible = true; start(); },
      hide: function () { visible = false; stop(); },
      redraw: draw
    };
  }

  function watchSize(el, handler) {
    if ('ResizeObserver' in window) {
      var ro = new ResizeObserver(handler);
      ro.observe(el);
      return ro;
    }
    window.addEventListener('resize', handler);
    return null;
  }

  /* Loader -------------------------------------------------- */

  function initLoader() {
    var loader = qs('[data-loader]');
    var done = function () {
      root.classList.add('is-ready');
      root.classList.remove('is-loading');
      if (loader) {
        loader.classList.add('is-done');
        window.setTimeout(function () { if (loader.parentNode) loader.parentNode.removeChild(loader); }, 1000);
      }
    };

    if (!loader) { done(); return; }

    if (!hasMotion()) {
      root.classList.add('is-ready');
      loader.parentNode.removeChild(loader);
      return;
    }

    root.classList.add('is-loading');

    var count = qs('[data-loader-count]', loader);
    var bar = qs('[data-loader-bar]', loader);
    var duration = motionMode() === 'reduced' ? 420 : 1250;
    var started = performance.now();

    function step(now) {
      var p = clamp((now - started) / duration, 0, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      if (count) count.textContent = String(Math.round(eased * 100)).padStart(2, '0');
      if (bar) bar.style.width = (eased * 100).toFixed(1) + '%';
      if (p < 1) requestAnimationFrame(step);
      else window.setTimeout(done, motionMode() === 'reduced' ? 120 : 320);
    }
    requestAnimationFrame(step);
  }

  /* Clock --------------------------------------------------- */

  function initClocks() {
    var nodes = qsa('[data-clock]');
    if (!nodes.length) return;
    var fmt = null;
    try {
      fmt = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/Copenhagen',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
      });
    } catch (e) {}
    function tick() {
      var now = new Date();
      var text = fmt ? fmt.format(now) : now.toTimeString().slice(0, 8);
      for (var i = 0; i < nodes.length; i++) nodes[i].textContent = text;
    }
    tick();
    window.setInterval(tick, 1000);
  }

  /* Header, nav, ticker, roll ------------------------------- */

  function initHeader() {
    var hdr = qs('[data-header]');
    if (!hdr) return;
    var last = window.scrollY;
    var queued = false;
    function update() {
      queued = false;
      var y = window.scrollY;
      hdr.classList.toggle('is-scrolled', y > 24);
      if (isFull() && y > 480 && y > last + 6 && !hdr.contains(document.activeElement)) {
        hdr.classList.add('is-hidden');
      } else if (y < last - 6 || y < 480) {
        hdr.classList.remove('is-hidden');
      }
      last = y;
    }
    window.addEventListener('scroll', function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(update);
    }, { passive: true });
    update();
  }

  function initNavState() {
    var links = qsa('[data-navlink]');
    if (!links.length || !('IntersectionObserver' in window)) return;
    var map = {};
    links.forEach(function (a) {
      var id = a.getAttribute('href').slice(1);
      var section = document.getElementById(id);
      if (section) map[id] = a;
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var active = map[entry.target.id];
        if (!active) return;
        links.forEach(function (a) { a.classList.remove('is-active'); });
        active.classList.add('is-active');
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    Object.keys(map).forEach(function (id) { io.observe(document.getElementById(id)); });
  }

  function initTicker() {
    var track = qs('[data-ticker]');
    if (!track) return;
    track.innerHTML = track.innerHTML + track.innerHTML;
  }

  function initRoll() {
    var track = qs('[data-roll]');
    if (!track || !isFull()) return;
    var words = qsa('.roll__word', track);
    if (words.length < 2) return;
    var index = 0;
    track.style.transition = 'transform 760ms cubic-bezier(0.16, 1, 0.3, 1)';
    window.setInterval(function () {
      index = (index + 1) % words.length;
      track.style.transform = 'translate3d(0,' + (-index * 1.22) + 'em,0)';
    }, 2600);
  }

  /* Reveals ------------------------------------------------- */

  function initReveals() {
    var groups = qsa('[data-stagger]');
    groups.forEach(function (group) {
      qsa('[data-reveal]', group).forEach(function (el, i) {
        if (!el.style.getPropertyValue('--d')) el.style.setProperty('--d', (i * 90) + 'ms');
      });
    });

    var items = qsa('[data-reveal], [data-lines]');
    items.forEach(function (el) {
      var explicit = el.getAttribute('data-reveal-delay');
      if (explicit && !el.style.getPropertyValue('--d')) el.style.setProperty('--d', explicit + 'ms');
    });

    if (!items.length) return;

    if (!('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0 });

    items.forEach(function (el) { io.observe(el); });
  }

  /* Cursor -------------------------------------------------- */

  function initCursor() {
    var el = qs('[data-cursor]');
    if (!el || !finePointer || !hasMotion()) return;

    var dot = qs('.cursor__dot', el);
    var ring = qs('.cursor__ring', el);
    var label = qs('[data-cursor-label]', el);
    var tx = window.innerWidth / 2;
    var ty = window.innerHeight / 2;
    var x = tx, y = ty, rx = tx, ry = ty;
    var raf = null;
    var live = false;

    function render() {
      var k = isFull() ? 0.16 : 1;
      x = lerp(x, tx, 0.42);
      y = lerp(y, ty, 0.42);
      rx = lerp(rx, tx, k);
      ry = lerp(ry, ty, k);
      el.style.transform = 'translate3d(' + rx.toFixed(2) + 'px,' + ry.toFixed(2) + 'px,0)';
      if (dot) dot.style.transform = 'translate3d(' + (x - rx).toFixed(2) + 'px,' + (y - ry).toFixed(2) + 'px,0) translate(-50%,-50%)';
      var settled = Math.abs(rx - tx) < 0.15 && Math.abs(ry - ty) < 0.15 && Math.abs(x - tx) < 0.15;
      if (settled) { raf = null; return; }
      raf = requestAnimationFrame(render);
    }

    function kick() { if (!raf) raf = requestAnimationFrame(render); }

    window.addEventListener('pointermove', function (e) {
      tx = e.clientX;
      ty = e.clientY;
      if (!live) {
        live = true;
        x = rx = tx;
        y = ry = ty;
        el.classList.add('is-on');
      }
      kick();
    }, { passive: true });

    document.addEventListener('mouseleave', function () {
      el.classList.remove('is-on');
      live = false;
    });

    document.addEventListener('pointerover', function (e) {
      var view = e.target.closest ? e.target.closest('.index__link') : null;
      if (view) {
        var row = view.closest('[data-row]');
        var accent = row ? getComputedStyle(row).getPropertyValue('--accent').trim() : '';
        el.style.setProperty('--peek-accent', accent || 'oklch(0.72 0.165 55)');
        el.classList.add('is-view');
        el.classList.remove('is-link');
        if (label) label.textContent = 'Open';
        return;
      }
      el.classList.remove('is-view');
      var hit = e.target.closest ? e.target.closest('a, button, [role="button"]') : null;
      el.classList.toggle('is-link', !!hit);
    });
  }

  /* Magnetic controls --------------------------------------- */

  function initMagnetic() {
    if (!finePointer) return;
    qsa('[data-magnetic]').forEach(function (el) {
      var strength = 0.3;
      el.addEventListener('pointerenter', function () {
        if (!isFull()) return;
        el.style.transition = 'transform 220ms cubic-bezier(0.16, 1, 0.3, 1)';
      });
      el.addEventListener('pointermove', function (e) {
        if (!isFull()) return;
        var r = el.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2);
        var dy = e.clientY - (r.top + r.height / 2);
        el.style.transform = 'translate3d(' + (dx * strength).toFixed(1) + 'px,' + (dy * strength).toFixed(1) + 'px,0)';
      });
      el.addEventListener('pointerleave', function () {
        el.style.transition = 'transform 620ms cubic-bezier(0.16, 1, 0.3, 1)';
        el.style.transform = 'translate3d(0,0,0)';
      });
    });
  }

  /* Copy address -------------------------------------------- */

  function initCopy() {
    var btn = qs('[data-copy]');
    if (!btn) return;
    var label = qs('[data-copy-label]', btn);
    var status = qs('[data-copy-status]');
    var timer = null;
    var value = btn.getAttribute('data-copy');

    function settle(message) {
      btn.classList.add('is-done');
      if (label) label.textContent = 'Copied';
      if (status) status.textContent = message;
      window.clearTimeout(timer);
      timer = window.setTimeout(function () {
        btn.classList.remove('is-done');
        if (label) label.textContent = 'Copy address';
        if (status) status.textContent = '';
      }, 2800);
    }

    function legacy() {
      var ta = document.createElement('textarea');
      ta.value = value;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.top = '-1000px';
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      if (ok) settle('Address copied to your clipboard.');
      else if (status) status.textContent = 'Copy blocked by the browser. The address is ' + value + '.';
    }

    btn.addEventListener('click', function () {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(value).then(function () {
          settle('Address copied to your clipboard.');
        }, legacy);
      } else {
        legacy();
      }
    });
  }

  /* Motion preference --------------------------------------- */

  function initMotionControl() {
    var opts = qsa('[data-motion-set]');
    if (!opts.length) return;

    function sync() {
      opts.forEach(function (b) {
        b.setAttribute('aria-pressed', String(b.getAttribute('data-motion-set') === motionMode()));
      });
    }

    opts.forEach(function (b) {
      b.addEventListener('click', function () {
        root.dataset.motion = b.getAttribute('data-motion-set');
        try { localStorage.setItem('mv-motion', root.dataset.motion); } catch (e) {}
        sync();
        applyMotionMode();
      });
    });

    function systemChange(e) {
      var saved = null;
      try { saved = localStorage.getItem('mv-motion'); } catch (err) {}
      if (saved) return;
      root.dataset.motion = e.matches ? 'reduced' : 'full';
      sync();
      applyMotionMode();
    }

    if (reduceQuery.addEventListener) reduceQuery.addEventListener('change', systemChange);
    sync();
  }

  var applyMotionMode = function () {};

  /* Menu ---------------------------------------------------- */

  function initMenu() {
    var dialog = qs('[data-menu]');
    var open = qs('[data-menu-open]');
    if (!dialog || !open) return;

    function show() {
      dialog.showModal();
      open.setAttribute('aria-expanded', 'true');
      if (isFull()) requestAnimationFrame(function () { dialog.classList.add('is-open'); });
      else dialog.classList.add('is-open');
    }

    function hide() {
      dialog.classList.remove('is-open');
      if (isFull()) window.setTimeout(function () { dialog.close(); }, 200);
      else dialog.close();
    }

    open.addEventListener('click', show);
    qsa('[data-menu-close]', dialog).forEach(function (b) { b.addEventListener('click', hide); });
    qsa('[data-menu-link]', dialog).forEach(function (a) { a.addEventListener('click', hide); });
    dialog.addEventListener('close', function () { open.setAttribute('aria-expanded', 'false'); });
  }

  /* Case study ---------------------------------------------- */

  var CASES = {
    aperture: {
      slug: 'aperture',
      discipline: 'Immersive report',
      year: '2026',
      lede: 'Thirty years of climate measurements, rebuilt as something you fly through instead of scroll past.',
      specs: [
        ['Client', 'Nordisk Klimatinstitut'],
        ['Role', 'Creative development, interaction design'],
        ['Stack', 'WebGL, GLSL, TypeScript, D3'],
        ['Duration', '14 weeks']
      ],
      sections: [
        {
          h: 'The record',
          p: [
            'The institute holds 1.2 million measurements collected across three decades of Arctic field seasons. It had been published as a 180 page PDF every year since 1994, read by roughly four hundred people, most of them already convinced.',
            'The brief was blunt. Make the same data reach the people who are not convinced, without softening a single number.'
          ],
          list: [
            'Every layer is a real year, not an illustration',
            'No projection, no smoothing, no interpolated gaps',
            'Numbers stay legible at 320px and at 2560px'
          ]
        },
        {
          h: 'What we built',
          p: [
            'A custom WebGL renderer draws forty thousand points per frame without a charting library. Depth is driven by scroll position rather than page height, so a fast scroll moves you quickly through a decade and a slow one lets a single season breathe.',
            'The camera never leaves the data. There is no helicopter shot, because a helicopter shot would be a lie about scale.'
          ]
        },
        {
          h: 'What changed',
          p: [
            'The interactive report replaced the PDF and now sits alongside it. Median session length moved from four minutes to eleven, and the institute used it in two parliamentary briefings.',
            'The PDF is still published. Nobody has asked to remove it.'
          ]
        }
      ],
      outcomes: [
        ['11 min', 'Median session length, against four minutes for the PDF'],
        ['40k', 'Points drawn per frame in the custom renderer'],
        ['2', 'National broadcast citations in the first month']
      ]
    },
    halcyon: {
      slug: 'halcyon',
      discipline: 'Commerce',
      year: '2025',
      lede: 'A perfume cannot be smelled through a screen, so the shop sells it by the way the bottle moves.',
      specs: [
        ['Client', 'Halcyon Parfum'],
        ['Role', 'Interaction design, front-end architecture'],
        ['Stack', 'Astro, Canvas, Shopify, GSAP'],
        ['Duration', '9 weeks']
      ],
      sections: [
        {
          h: 'The problem',
          p: [
            'The house makes six fragrances and refuses to describe them with the usual words. Amber, musk, and bergamot appear nowhere on the bottles. The old theme leaned on stock photography of citrus, which told the customer nothing true.',
            'Scent does not travel through a screen. Motion does.'
          ],
          list: [
            'Product pages open on a slow radial reveal drawn on canvas',
            'Palettes sampled from the maceration photographs, not invented',
            'The configurator writes a real ingredient order to the cart'
          ]
        },
        {
          h: 'The build',
          p: [
            'Each product page opens with a radial reveal painted at thirty frames per second on a canvas, slow enough to read as a pour rather than a load. Colour comes from the actual maceration photographs, sampled offline into a six value palette per fragrance.',
            'The layering tool is real. Choose three notes, and the cart gets a genuine order the atelier can produce.'
          ]
        },
        {
          h: 'The result',
          p: [
            'Conversion rose 34 percent against the old theme over the first full quarter. Return rate fell by half, which the founder attributes to people knowing what they had bought.',
            'Largest contentful paint holds at 1.8 seconds on a throttled 4G connection, canvas and all.'
          ]
        }
      ],
      outcomes: [
        ['+34%', 'Conversion against the previous theme, first full quarter'],
        ['1.8s', 'Largest contentful paint on throttled 4G'],
        ['6', 'Palettes sampled from real maceration photography']
      ]
    },
    cadence: {
      slug: 'cadence',
      discipline: 'Web application',
      year: '2025',
      lede: 'A browser sequencer that stays in time when nine people edit the same bar at once.',
      specs: [
        ['Client', 'Cadence Audio'],
        ['Role', 'Product design, front-end, audio engine'],
        ['Stack', 'React, Web Audio, WebSockets, Rust'],
        ['Duration', '16 weeks']
      ],
      sections: [
        {
          h: 'Locking the grid',
          p: [
            'Shared transport runs on a WebSocket with drift correction applied every eight bars, so two players on different continents hear the same downbeat within three milliseconds. Latency is displayed honestly rather than hidden behind a green dot.',
            'When a player drops, the session keeps their track as a ghost lane until they return.'
          ],
          list: [
            'Drift corrected every eight bars, never mid-phrase',
            'Connection quality shown as a number, not a colour',
            'Dropped players leave a ghost lane for ninety seconds'
          ]
        },
        {
          h: 'Sound in the browser',
          p: [
            'The DSP core is written in Rust and compiled to WebAssembly, which bought twelve voices at three milliseconds of latency without taking the main thread hostage. The editor stays responsive while the audio thread works.'
          ]
        },
        {
          h: 'Editing together',
          p: [
            'Every cursor on the piano roll belongs to a person, labelled and coloured. Undo is per user, not global, which took three attempts to get right and is now the feature people mention first.'
          ]
        }
      ],
      outcomes: [
        ['3ms', 'Audio latency across twelve concurrent voices'],
        ['9', 'Editors in one session without transport drift'],
        ['0', 'Global undo conflicts since launch']
      ]
    },
    terra: {
      slug: 'terra',
      discipline: 'Data story',
      year: '2024',
      lede: 'Ninety satellite passes over one glacier, arranged so the scroll becomes the calendar.',
      specs: [
        ['Client', 'Terra Orbital'],
        ['Role', 'Creative development, cartography'],
        ['Stack', 'MapLibre, Deck.gl, Canvas, Python'],
        ['Duration', '11 weeks']
      ],
      sections: [
        {
          h: 'Ninety days, ninety passes',
          p: [
            'Terra publishes imagery that most people never see because it arrives as sixteen bit GeoTIFFs and a login. We took one glacier, one summer, and ninety real passes, and made the scroll bar the only control.',
            'Scroll down and the ice retreats. Scroll up and it comes back. Nothing is animated that did not happen.'
          ],
          list: [
            'Tile pyramids built offline from real orbital passes',
            'Colour ramps validated against deuteranopia and protanopia',
            'Full data table available behind a disclosure, not hidden'
          ]
        },
        {
          h: 'Drawing at scale',
          p: [
            'The story runs at sixty frames per second on a four year old Android phone. Tiles are pre-rendered on the server into three resolutions; the client composites and never reprojects an image on the fly.',
            'Every frame is derived from a real pass with its timestamp in the corner. Where data is missing, the map says so instead of filling the gap.'
          ]
        }
      ],
      outcomes: [
        ['1.4M', 'Readers in the first three weeks'],
        ['60fps', 'Sustained on a four year old Android device'],
        ['90', 'Real satellite passes, none interpolated']
      ]
    },
    mono: {
      slug: 'mono',
      discipline: 'Design system',
      year: '2024',
      lede: 'Forty years of print typesetting rules, translated into tokens an engineering team would actually use.',
      specs: [
        ['Client', 'Meridian Press'],
        ['Role', 'Design systems, documentation'],
        ['Stack', 'TypeScript, Radix, Style Dictionary'],
        ['Duration', '22 weeks']
      ],
      sections: [
        {
          h: 'Tokens from print',
          p: [
            'The paper has a typographic manual from 1981 that specifies measure, leading, and column rules for every section of the paper. We treated it as a specification rather than a mood board, and encoded it as tokens with the original clause numbers in the comments.',
            'Editors recognise the rules. That mattered more than elegance.'
          ],
          list: [
            'Print clause numbers preserved in the token names',
            'Three densities: broadsheet, tabloid, and reader',
            'Automated contrast checks in continuous integration'
          ]
        },
        {
          h: 'One component, three densities',
          p: [
            'A single article component serves three products by responding to its container rather than the viewport. The same component in a sidebar and in the main column of the app are one file, one test suite, one changelog.',
            'Nothing is duplicated to get a different density.'
          ]
        },
        {
          h: 'Adoption',
          p: [
            'Two hundred and fourteen components are in production across four products. Feature work moved 60 percent faster in the quarter after the second product adopted the system, mostly because design review stopped relitigating spacing.'
          ]
        }
      ],
      outcomes: [
        ['214', 'Components in production across four products'],
        ['60%', 'Faster feature delivery after full adoption'],
        ['1981', 'Year of the print manual that set the rules']
      ]
    }
  };

  var CASE_ORDER = ['aperture', 'halcyon', 'cadence', 'terra', 'mono'];

  var caseState = {
    dialog: null,
    scroll: null,
    content: null,
    wipe: null,
    meter: null,
    slug: null,
    source: null,
    origin: null,
    pushed: false,
    busy: false,
    wasDrag: false
  };

  function slugFromHash() {
    var m = /^#\/work\/([a-z-]+)$/.exec(window.location.hash);
    return m && CASES[m[1]] ? m[1] : null;
  }

  function rowFor(slug) {
    return qs('[data-slug="' + slug + '"]');
  }

  function accentFor(slug) {
    var row = rowFor(slug);
    if (!row) return 'oklch(0.72 0.165 55)';
    return getComputedStyle(row).getPropertyValue('--accent').trim() || 'oklch(0.72 0.165 55)';
  }

  function caseMarkup(slug) {
    var d = CASES[slug];
    var i = CASE_ORDER.indexOf(slug);
    var nextSlug = CASE_ORDER[(i + 1) % CASE_ORDER.length];
    var next = CASES[nextSlug];

    var specs = d.specs.map(function (s) {
      return '<div class="case__spec"><dt>' + s[0] + '</dt><dd>' + s[1] + '</dd></div>';
    }).join('');

    var body = d.sections.map(function (s) {
      var ps = s.p.map(function (t) { return '<p>' + t + '</p>'; }).join('');
      var list = s.list
        ? '<ul class="case__list">' + s.list.map(function (t) { return '<li><span>' + t + '</span></li>'; }).join('') + '</ul>'
        : '';
      return '<section class="case__section"><h3>' + s.h + '</h3><div>' + ps + list + '</div></section>';
    }).join('');

    var outcomes = '<ul class="case__outcomes">' + d.outcomes.map(function (o) {
      return '<li class="case__outcome"><b>' + o[0] + '</b><span>' + o[1] + '</span></li>';
    }).join('') + '</ul>';

    return '' +
      '<div class="case__intro">' +
        '<p class="case__eyebrow"><b>' + ('0' + (i + 1)).slice(-2) + '</b>' + d.discipline + '<span>' + d.year + '</span></p>' +
        '<h2 class="case__title" id="case-title">' + (d.slug.charAt(0).toUpperCase() + d.slug.slice(1)) + '</h2>' +
        '<p class="case__lede">' + d.lede + '</p>' +
        '<dl class="case__specs">' + specs + '</dl>' +
      '</div>' +
      '<div class="case__body">' + body + outcomes + '</div>' +
      '<a class="case__next" href="#/work/' + nextSlug + '" data-case-next="' + nextSlug + '" style="--case-accent:' + accentFor(nextSlug) + '">' +
        '<span class="case__nexteyebrow">Next project</span>' +
        '<span class="case__nexttitle">' + (next.slug.charAt(0).toUpperCase() + next.slug.slice(1)) +
          '<span class="case__nextarrow" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><path d="M5 12h13M13 6l6 6-6 6"/></svg></span>' +
        '</span>' +
      '</a>';
  }

  function rectOf(el) {
    if (!el) return null;
    var r = el.getBoundingClientRect();
    return { left: r.left, top: r.top, width: r.width, height: r.height };
  }

  function wipeTo(rect, duration) {
    var wipe = caseState.wipe;
    if (!wipe) return Promise.resolve();
    var vw = window.innerWidth;
    var vh = window.innerHeight;
    var sx = rect ? clamp(rect.width / vw, 0.02, 1) : 0.08;
    var sy = rect ? clamp(rect.height / vh, 0.01, 1) : 0.02;
    var dx = rect ? rect.left + rect.width / 2 - vw / 2 : 0;
    var dy = rect ? rect.top + rect.height / 2 - vh / 2 : vh * 0.4;
    var anim = wipe.animate([
      { transform: 'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px) scale(' + sx.toFixed(3) + ',' + sy.toFixed(3) + ')', opacity: 1 },
      { transform: 'translate(0,0) scale(1,1)', opacity: 1 }
    ], { duration: duration, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'forwards' });
    return anim.finished.then(function () { return anim; }, function () { return anim; });
  }

  function wipeOut(duration) {
    var wipe = caseState.wipe;
    if (!wipe) return Promise.resolve();
    var anim = wipe.animate([{ opacity: 1 }, { opacity: 0 }], { duration: duration, easing: 'linear', fill: 'forwards' });
    return anim.finished.then(function () { return anim; }, function () { return anim; });
  }

  function wipeBack(rect, duration) {
    var wipe = caseState.wipe;
    if (!wipe) return Promise.resolve();
    var vw = window.innerWidth;
    var vh = window.innerHeight;
    var sx = rect ? clamp(rect.width / vw, 0.02, 1) : 0.08;
    var sy = rect ? clamp(rect.height / vh, 0.01, 1) : 0.02;
    var dx = rect ? rect.left + rect.width / 2 - vw / 2 : 0;
    var dy = rect ? rect.top + rect.height / 2 - vh / 2 : vh * 0.4;
    var anim = wipe.animate([
      { transform: 'translate(0,0) scale(1,1)', opacity: 1 },
      { transform: 'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px) scale(' + sx.toFixed(3) + ',' + sy.toFixed(3) + ')', opacity: 1 }
    ], { duration: duration, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'forwards' });
    return anim.finished.then(function () { return anim; }, function () { return anim; });
  }

  function clearWipe() {
    var wipe = caseState.wipe;
    if (!wipe) return;
    if (wipe.getAnimations) {
      wipe.getAnimations().forEach(function (a) { a.cancel(); });
    }
    wipe.style.opacity = '0';
  }

  function lockScroll(lock) {
    root.classList.toggle('is-locked', !!lock);
  }

  function loadCase(slug, originRect, animate) {
    var d = CASES[slug];
    if (!d) return;
    caseState.slug = slug;
    caseState.origin = originRect || null;
    var dialog = caseState.dialog;
    dialog.style.setProperty('--case-accent', accentFor(slug));
    dialog.style.setProperty('--peek-accent', accentFor(slug));
    caseState.content.innerHTML = caseMarkup(slug);
    caseState.scroll.scrollTop = 0;
    var idx = CASE_ORDER.indexOf(slug);
    var indexEl = qs('[data-case-index]', dialog);
    var totalEl = qs('[data-case-total]', dialog);
    if (indexEl) indexEl.textContent = ('0' + (idx + 1)).slice(-2);
    if (totalEl) totalEl.textContent = ('0' + CASE_ORDER.length).slice(-2);
    updateMeter();

    dialog.classList.remove('is-shown');

    if (!animate || !isFull()) {
      clearWipe();
      dialog.classList.add('is-shown');
      return Promise.resolve();
    }

    return wipeTo(originRect, 560)
      .then(function () {
        dialog.classList.add('is-shown');
        return wipeOut(420);
      })
      .then(clearWipe);
  }

  function openCase(slug, source, viaHistory) {
    if (!caseState.dialog || caseState.busy) return;
    var d = CASES[slug];
    if (!d) return;
    caseState.busy = true;
    caseState.source = source || null;

    var origin = source ? rectOf(source) : null;
    var alreadyOpen = caseState.dialog.open;
    if (!alreadyOpen) {
      caseState.dialog.showModal();
      lockScroll(true);
    }

    if (!viaHistory) {
      history.pushState({ case: slug }, '', '#/work/' + slug);
      caseState.pushed = true;
    } else {
      caseState.pushed = false;
    }

    loadCase(slug, origin, true).then(function () {
      caseState.busy = false;
      var scroll = caseState.scroll;
      scroll.scrollTop = 0;
      if (!alreadyOpen && source) scroll.focus({ preventScroll: true });
      else scroll.focus({ preventScroll: true });
    });
  }

  function closeCase() {
    if (!caseState.dialog || !caseState.dialog.open || caseState.busy) return;
    caseState.busy = true;
    clearWipe();

    if (isFull()) {
      var rect = caseState.origin;
      wipeTo(null, 0);
      caseState.dialog.classList.remove('is-shown');
      wipeBack(rect, 460).then(function () {
        clearWipe();
        finishClose();
      });
    } else {
      caseState.dialog.classList.remove('is-shown');
      finishClose();
    }
  }

  function finishClose() {
    var dialog = caseState.dialog;
    var source = caseState.source;
    if (dialog.open) dialog.close();
    lockScroll(false);
    caseState.busy = false;
    caseState.slug = null;
    caseState.origin = null;
    if (source && document.contains(source)) source.focus({ preventScroll: true });
  }

  function requestClose() {
    if (!caseState.dialog || !caseState.dialog.open) return;
    if (caseState.pushed) {
      history.back();
      return;
    }
    if (window.location.hash.indexOf('#/work/') === 0) {
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
    closeCase();
  }

  function updateMeter() {
    var meter = caseState.meter;
    var scroll = caseState.scroll;
    if (!meter || !scroll) return;
    var max = scroll.scrollHeight - scroll.clientHeight;
    var p = max > 8 ? scroll.scrollTop / max : 0;
    meter.style.transform = 'scaleX(' + clamp(p, 0, 1).toFixed(4) + ')';
  }

  function initCase() {
    var dialog = qs('[data-case]');
    var scroll = qs('[data-case-scroll]');
    var content = qs('[data-case-content]');
    var wipe = qs('[data-case-wipe]');
    var meter = qs('[data-case-meter]');
    if (!dialog || !scroll || !content) return;

    caseState.dialog = dialog;
    caseState.scroll = scroll;
    caseState.content = content;
    caseState.wipe = wipe;
    caseState.meter = meter;

    qsa('[data-row]').forEach(function (row) {
      var link = qs('.index__link', row);
      if (!link) return;
      var slug = row.getAttribute('data-slug');
      link.addEventListener('click', function (e) {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        if (caseState.dialog.open) return;
        openCase(slug, row, false);
      });
    });

    content.addEventListener('click', function (e) {
      var next = e.target.closest ? e.target.closest('[data-case-next]') : null;
      if (!next) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      var slug = next.getAttribute('data-case-next');
      history.pushState({ case: slug }, '', '#/work/' + slug);
      caseState.pushed = true;
      caseState.busy = false;
      caseState.source = next;
      caseState.dialog.classList.remove('is-shown');
      var idx = qs('[data-case-index]', dialog);
      var done = function () {
        caseState.slug = slug;
        caseState.origin = rectOf(next);
        dialog.style.setProperty('--case-accent', accentFor(slug));
        caseState.content.innerHTML = caseMarkup(slug);
        caseState.scroll.scrollTop = 0;
        var i = CASE_ORDER.indexOf(slug);
        if (idx) idx.textContent = ('0' + (i + 1)).slice(-2);
        updateMeter();
        if (isFull()) {
          wipeTo(caseState.origin, 480).then(function () {
            dialog.classList.add('is-shown');
            return wipeOut(400);
          }).then(clearWipe);
        } else {
          clearWipe();
          dialog.classList.add('is-shown');
        }
        caseState.scroll.focus({ preventScroll: true });
      };
      if (isFull()) {
        clearWipe();
        wipeTo(rectOf(next), 420).then(done);
      } else {
        done();
      }
    });

    qsa('[data-case-close]', dialog).forEach(function (b) {
      b.addEventListener('click', requestClose);
    });

    dialog.addEventListener('cancel', function (e) {
      e.preventDefault();
      requestClose();
    });

    dialog.addEventListener('close', function () {
      lockScroll(false);
      clearWipe();
      caseState.dialog.classList.remove('is-shown');
      caseState.slug = null;
    });

    scroll.addEventListener('scroll', function () {
      if (!caseState.meterQueued) {
        caseState.meterQueued = true;
        requestAnimationFrame(function () {
          caseState.meterQueued = false;
          updateMeter();
        });
      }
    }, { passive: true });

    window.addEventListener('resize', updateMeter);

    window.addEventListener('popstate', function () {
      var slug = slugFromHash();
      if (slug && slug !== caseState.slug) {
        caseState.busy = false;
        openCase(slug, null, true);
      } else if (!slug && caseState.dialog.open) {
        caseState.busy = false;
        caseState.pushed = false;
        closeCase();
      }
    });

    var initial = slugFromHash();
    if (initial) {
      window.setTimeout(function () { openCase(initial, null, true); }, 0);
    }
  }

  /* Playground ---------------------------------------------- */

  function initKinetic() {
    var stage = qs('[data-kinetic]');
    if (!stage) return;
    var chars = qsa('.kinetic__ch', stage);
    if (!chars.length) return;

    var rest = chars.map(function () { return { x: 0, y: 0, s: 1, c: 0 }; });
    var goal = chars.map(function () { return { x: 0, y: 0, s: 1, c: 0 }; });
    var raf = null;
    var px = 0;
    var py = 0;
    var active = false;

    function render() {
      var moving = false;
      for (var i = 0; i < chars.length; i++) {
        var a = rest[i];
        var b = goal[i];
        a.x = lerp(a.x, b.x, 0.16);
        a.y = lerp(a.y, b.y, 0.16);
        a.s = lerp(a.s, b.s, 0.16);
        a.c = lerp(a.c, b.c, 0.16);
        if (Math.abs(a.x - b.x) > 0.05 || Math.abs(a.y - b.y) > 0.05 || Math.abs(a.s - b.s) > 0.002 || Math.abs(a.c - b.c) > 0.004) moving = true;
        chars[i].style.transform = 'translate3d(' + a.x.toFixed(2) + 'px,' + a.y.toFixed(2) + 'px,0) scale(' + a.s.toFixed(3) + ')';
        var col = mixRgb(BONE, SIGNAL, a.c);
        chars[i].style.color = 'rgb(' + col[0] + ',' + col[1] + ',' + col[2] + ')';
      }
      raf = moving ? requestAnimationFrame(render) : null;
    }

    function kick() { if (!raf) raf = requestAnimationFrame(render); }

    function evaluate() {
      for (var i = 0; i < chars.length; i++) {
        var r = chars[i].getBoundingClientRect();
        var cx = r.left + r.width / 2;
        var cy = r.top + r.height / 2;
        var dx = px - cx;
        var dy = py - cy;
        var dist = Math.sqrt(dx * dx + dy * dy);
        var reach = 150;
        if (!active || dist > reach) {
          goal[i].x = 0;
          goal[i].y = 0;
          goal[i].s = 1;
          goal[i].c = 0;
          continue;
        }
        var infl = Math.pow(1 - dist / reach, 1.6);
        goal[i].x = -dx * 0.16 * infl;
        goal[i].y = -dy * 0.16 * infl;
        goal[i].s = 1 + infl * 0.22;
        goal[i].c = infl;
      }
      kick();
    }

    if (!isFull()) {
      chars.forEach(function (c) { c.style.color = 'rgb(243,239,232)'; });
      return;
    }

    stage.addEventListener('pointermove', function (e) {
      px = e.clientX;
      py = e.clientY;
      active = true;
      evaluate();
    });
    stage.addEventListener('pointerleave', function () {
      active = false;
      evaluate();
    });
  }

  function initTilt() {
    var stage = qs('[data-tilt]');
    if (!stage) return;
    var stack = qs('.stack', stage);
    if (!stack) return;

    var tx = 0, ty = 0, x = 0, y = 0, raf = null;

    function render() {
      x = lerp(x, tx, 0.1);
      y = lerp(y, ty, 0.1);
      stack.style.transform = 'rotateY(' + (x * 12).toFixed(2) + 'deg) rotateX(' + (-y * 12).toFixed(2) + 'deg)';
      if (Math.abs(x - tx) > 0.002 || Math.abs(y - ty) > 0.002) raf = requestAnimationFrame(render);
      else raf = null;
    }

    function kick() { if (!raf) raf = requestAnimationFrame(render); }

    if (!isFull()) return;

    stage.addEventListener('pointermove', function (e) {
      var r = stage.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
      kick();
    });
    stage.addEventListener('pointerleave', function () {
      tx = 0;
      ty = 0;
      kick();
    });
  }

  /* Canvas wiring ------------------------------------------- */

  var fields = [];

  function initFields() {
    var heroCanvas = qs('[data-field-hero]');
    if (heroCanvas) {
      var hero = createField(heroCanvas, {
        seed: hashString('mira-voss-hero'),
        gap: function (w) { return clamp(w / 34, 26, 44); },
        len: 12,
        alpha: 0.16,
        radius: 220,
        freq: 0.0028,
        revealMs: 1500
      });
      fields.push(hero);
      watchSize(heroCanvas, function () { hero.layout(); });
      window.addEventListener('pointermove', function (e) {
        var r = heroCanvas.getBoundingClientRect();
        if (e.clientY < r.top - 40 || e.clientY > r.bottom + 40) { hero.leave(); return; }
        hero.move(e.clientX - r.left, e.clientY - r.top);
      }, { passive: true });

      if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) hero.start();
            else hero.stop();
          });
        }, { threshold: 0 });
        io.observe(heroCanvas);
      }
      hero.start();
    }

    var studyCanvas = qs('[data-field-study]');
    if (studyCanvas) {
      var study = createField(studyCanvas, {
        seed: hashString('signal-field'),
        gap: 19,
        len: 9,
        alpha: 0.2,
        radius: 150,
        freq: 0.0052,
        revealMs: 800
      });
      fields.push(study);
      watchSize(studyCanvas, function () { study.layout(); });
      window.addEventListener('pointermove', function (e) {
        var r = studyCanvas.getBoundingClientRect();
        if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) {
          study.leave();
          return;
        }
        study.move(e.clientX - r.left, e.clientY - r.top);
      }, { passive: true });

      if ('IntersectionObserver' in window) {
        var io2 = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) study.start();
            else study.stop();
          });
        }, { threshold: 0 });
        io2.observe(studyCanvas);
      }

      var reseed = qs('[data-reseed]');
      if (reseed) {
        reseed.addEventListener('click', function () {
          study.setSeed(Math.floor(Math.random() * 1e9));
        });
      }
    }
  }

  function initPeek() {
    var peek = qs('[data-peek]');
    var canvas = qs('[data-peek-canvas]');
    if (!peek || !canvas || !finePointer) return;
    if (window.matchMedia('(max-width: 799px)').matches) return;

    var field = createField(canvas, {
      seed: 1,
      gap: 15,
      len: 8,
      alpha: 0.28,
      radius: 110,
      freq: 0.006,
      revealMs: 620
    });
    fields.push(field);
    watchSize(canvas, function () { field.layout(); });

    var tx = window.innerWidth / 2;
    var ty = window.innerHeight / 2;
    var x = tx;
    var y = ty;
    var raf = null;
    var on = false;
    var current = null;

    function render() {
      x = lerp(x, tx, 0.14);
      y = lerp(y, ty, 0.14);
      peek.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)';
      if (Math.abs(x - tx) > 0.2 || Math.abs(y - ty) > 0.2) raf = requestAnimationFrame(render);
      else raf = null;
    }

    function kick() { if (!raf) raf = requestAnimationFrame(render); }

    canvas.addEventListener('pointermove', function (e) {
      var r = canvas.getBoundingClientRect();
      field.move(e.clientX - r.left, e.clientY - r.top);
    });
    canvas.addEventListener('pointerleave', function () { field.leave(); });

    qsa('[data-row]').forEach(function (row) {
      var link = qs('.index__link', row);
      if (!link) return;
      var slug = row.getAttribute('data-slug');

      function enter(e, isKeyboard) {
        if (current === slug) return;
        current = slug;
        var accent = getComputedStyle(row).getPropertyValue('--accent').trim();
        peek.style.setProperty('--peek-accent', accent);
        field.setAccent(accent);
        field.setSeed(hashString(slug));
        if (isKeyboard) {
          var r = row.getBoundingClientRect();
          tx = Math.max(180, r.right - 200);
          ty = r.top + r.height / 2;
          x = tx;
          y = ty;
          peek.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
        }
        peek.classList.add('is-on');
        on = true;
        field.show();
      }

      function leave() {
        current = null;
        peek.classList.remove('is-on');
        on = false;
        field.hide();
      }

      link.addEventListener('pointerenter', function (e) { enter(e, false); });
      link.addEventListener('pointerleave', leave);
      link.addEventListener('focus', function () { if (link.matches(':focus-visible')) enter(null, true); });
      link.addEventListener('blur', leave);
    });

    window.addEventListener('pointermove', function (e) {
      if (!on) return;
      tx = e.clientX;
      ty = e.clientY;
      if (isFull()) kick();
      else {
        x = tx;
        y = ty;
        peek.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
      }
    }, { passive: true });
  }

  /* Boot ---------------------------------------------------- */

  function boot() {
    initFields();
    initPeek();
    initLoader();
    initClocks();
    initHeader();
    initNavState();
    initTicker();
    initRoll();
    initReveals();
    initCursor();
    initMagnetic();
    initCopy();
    initMotionControl();
    initMenu();
    initCase();
    initKinetic();
    initTilt();

    applyMotionMode = function () {
      fields.forEach(function (f) {
        if (hasMotion()) f.show();
        else { f.hide(); f.redraw(); }
      });
    };

    root.classList.remove('is-loading');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
