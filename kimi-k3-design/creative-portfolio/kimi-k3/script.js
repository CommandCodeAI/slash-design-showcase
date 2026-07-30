/* ============================================================
   MARA VOSS — PORTFOLIO 2026
   Lenis smooth scroll + GSAP motion system
   ============================================================ */

document.documentElement.classList.add('js');

(function () {
  'use strict';

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var hasGsap = typeof gsap !== 'undefined';
  var hasST = typeof ScrollTrigger !== 'undefined';
  var hasLenis = typeof Lenis !== 'undefined';

  if (hasGsap && hasST) gsap.registerPlugin(ScrollTrigger);

  /* ---------- Live clock (Copenhagen) ---------- */
  function initClock() {
    var els = document.querySelectorAll('.js-clock');
    if (!els.length) return;
    var fmt = new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      timeZone: 'Europe/Copenhagen'
    });
    function tick() {
      var t = fmt.format(new Date());
      els.forEach(function (el) { el.textContent = t + ' CET'; });
    }
    tick();
    setInterval(tick, 1000);
  }

  /* ---------- Smooth scroll ---------- */
  var lenis = null;
  if (!reducedMotion && hasLenis && hasGsap) {
    lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1 });
    if (hasST) lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  function scrollToTarget(target) {
    var el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el && target !== 0) return;
    if (lenis) {
      lenis.scrollTo(target === 0 ? 0 : el, { duration: 1.5, easing: function (t) { return 1 - Math.pow(1 - t, 4); } });
    } else if (target === 0) {
      window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
    } else {
      el.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
    }
  }

  document.querySelectorAll('[data-scroll]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var href = link.getAttribute('href');
      if (href && href.charAt(0) === '#') {
        e.preventDefault();
        scrollToTarget(href === '#top' ? 0 : href);
      }
    });
  });

  var toTop = document.querySelector('[data-scroll-to-top]');
  if (toTop) toTop.addEventListener('click', function () { scrollToTarget(0); });

  /* ---------- Preloader + hero intro ---------- */
  var preloader = document.querySelector('.preloader');
  var countEl = document.getElementById('count');

  function heroIntro() {
    if (!hasGsap) return;
    var tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.to('.hero-title .line-inner', { yPercent: 0, duration: 1.3, stagger: 0.09 }, 0)
      .to('.hero-eyebrow .line-inner', { yPercent: 0, duration: 1, ease: 'expo.out' }, 0.15)
      .from('.hero-bio', { y: 26, opacity: 0, duration: 1 }, 0.5)
      .from('.hero-meta-item', { y: 20, opacity: 0, duration: 0.9, stagger: 0.08 }, 0.6)
      .from('.hero-badge', { scale: 0.6, opacity: 0, duration: 1, ease: 'back.out(1.6)' }, 0.7)
      .from('.marquee', { opacity: 0, duration: 0.8 }, 0.8)
      .from('.nav', { yPercent: -100, opacity: 0, duration: 0.9 }, 0.6);
  }

  function finishLoading() {
    document.body.removeAttribute('data-loading');
    if (preloader) preloader.style.display = 'none';
    if (hasST) ScrollTrigger.refresh();
  }

  if (reducedMotion || !hasGsap) {
    finishLoading();
  } else {
    if (lenis) lenis.stop();
    gsap.set('.hero-title .line-inner, .hero-eyebrow .line-inner', { yPercent: 110 });
    var counter = { v: 0 };
    var loadTl = gsap.timeline();
    loadTl
      .to(counter, {
        v: 100, duration: 1.15, ease: 'power2.inOut',
        onUpdate: function () { countEl.textContent = Math.round(counter.v); }
      })
      .to('.preloader-inner', { yPercent: -30, opacity: 0, duration: 0.45, ease: 'power2.in' }, '+=0.1')
      .to('.preloader-curtain', { yPercent: -100, duration: 0.85, ease: 'expo.inOut' }, '-=0.15')
      .add(function () {
        document.body.removeAttribute('data-loading');
        if (lenis) lenis.start();
        heroIntro();
      }, '-=0.55')
      .set(preloader, { display: 'none' })
      .add(function () { if (hasST) ScrollTrigger.refresh(); });
  }

  /* ---------- Scroll reveals ---------- */
  if (hasGsap && hasST && !reducedMotion) {
    document.querySelectorAll('.section-title, .about-lede, .contact-title').forEach(function (el) {
      var inners = el.querySelectorAll('.line-inner');
      if (!inners.length) return;
      gsap.from(inners, {
        yPercent: 110,
        duration: 1.15,
        ease: 'expo.out',
        stagger: 0.08,
        scrollTrigger: { trigger: el, start: 'top 82%', once: true }
      });
    });

    document.querySelectorAll('.reveal-line').forEach(function (el) {
      if (el.classList.contains('hero-eyebrow')) return;
      var inner = el.querySelector('.line-inner');
      gsap.from(inner, {
        yPercent: 110, duration: 0.9, ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true }
      });
    });

    gsap.utils.toArray('.filters, .about-cols p, .about-lists, .contact-email, .contact-cta').forEach(function (el) {
      gsap.from(el, {
        y: 32, opacity: 0, duration: 0.9, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true }
      });
    });

    gsap.utils.toArray('.work').forEach(function (w) {
      gsap.from(w, {
        y: 40, opacity: 0, duration: 0.85, ease: 'power3.out',
        scrollTrigger: { trigger: w, start: 'top 92%', once: true }
      });
    });

    gsap.from('.about-portrait', {
      clipPath: 'inset(100% 0 0 0)', duration: 1.2, ease: 'expo.out',
      scrollTrigger: { trigger: '.about-portrait', start: 'top 85%', once: true }
    });

    /* Hero parallax on scroll-out */
    gsap.to('.hero-title', {
      yPercent: -14, opacity: 0.25, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
    });

    /* Stat counters */
    gsap.utils.toArray('.stat-num').forEach(function (el) {
      var target = parseInt(el.getAttribute('data-count'), 10) || 0;
      var obj = { v: 0 };
      ScrollTrigger.create({
        trigger: el, start: 'top 88%', once: true,
        onEnter: function () {
          gsap.to(obj, {
            v: target, duration: 1.6, ease: 'power2.out',
            onUpdate: function () { el.textContent = Math.round(obj.v); }
          });
        }
      });
    });
  }

  /* ---------- Process: pinned horizontal scroll ---------- */
  if (hasGsap && hasST && !reducedMotion) {
    var mm = gsap.matchMedia();
    mm.add('(min-width: 768px)', function () {
      var track = document.querySelector('.process-track');
      var pinEl = document.querySelector('.process-pin');
      if (!track || !pinEl) return;

      var getDistance = function () { return Math.max(0, track.scrollWidth - window.innerWidth); };

      gsap.to(track, {
        x: function () { return -getDistance(); },
        ease: 'none',
        scrollTrigger: {
          trigger: '.process',
          start: 'top top',
          end: function () { return '+=' + (getDistance() + window.innerHeight * 0.25); },
          pin: pinEl,
          scrub: 1,
          invalidateOnRefresh: true,
          onUpdate: function (self) {
            var bar = document.querySelector('.progress-bar');
            if (bar) bar.style.transform = 'scaleX(' + self.progress + ')';
          }
        }
      });
    });
  }

  /* ---------- Works: filters ---------- */
  var filterBtns = document.querySelectorAll('.filter');
  var works = Array.prototype.slice.call(document.querySelectorAll('.work'));

  function closeWork(w) {
    w.classList.remove('is-open');
    w.querySelector('.work-head').setAttribute('aria-expanded', 'false');
  }

  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      filterBtns.forEach(function (b) { b.classList.remove('is-active'); });
      btn.classList.add('is-active');
      var cat = btn.getAttribute('data-filter');

      works.forEach(function (w, i) {
        var show = cat === 'all' || w.getAttribute('data-category') === cat;
        if (show) {
          if (w.classList.contains('is-hidden')) {
            w.classList.remove('is-hidden');
            if (hasGsap && !reducedMotion) {
              gsap.fromTo(w, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.5, delay: i * 0.05, ease: 'power3.out' });
            }
          }
        } else {
          closeWork(w);
          w.classList.add('is-hidden');
        }
      });
      if (hasST) ScrollTrigger.refresh();
    });
  });

  /* ---------- Works: expandable case drawers ---------- */
  works.forEach(function (w) {
    var head = w.querySelector('.work-head');
    head.addEventListener('click', function () {
      var isOpen = w.classList.contains('is-open');
      works.forEach(function (other) { if (other !== w) closeWork(other); });
      if (isOpen) {
        closeWork(w);
      } else {
        w.classList.add('is-open');
        head.setAttribute('aria-expanded', 'true');
      }
      if (hasST) gsap.delayedCall(0.7, function () { ScrollTrigger.refresh(); });
    });
  });

  /* ---------- Works: floating hover preview ---------- */
  var preview = document.querySelector('.work-preview');
  var previewArt = preview ? preview.querySelector('.work-preview-art') : null;

  if (preview && finePointer && hasGsap && !reducedMotion && window.innerWidth >= 768) {
    var pxTo = gsap.quickTo(preview, 'x', { duration: 0.55, ease: 'power3' });
    var pyTo = gsap.quickTo(preview, 'y', { duration: 0.55, ease: 'power3' });
    var currentArt = '';

    works.forEach(function (w) {
      var head = w.querySelector('.work-head');
      head.addEventListener('mouseenter', function () {
        var art = w.getAttribute('data-art');
        if (art !== currentArt) {
          previewArt.className = 'work-preview-art ' + art;
          currentArt = art;
        }
        gsap.to(preview, { opacity: 1, scale: 1, duration: 0.45, ease: 'power3.out' });
      });
      head.addEventListener('mouseleave', function () {
        gsap.to(preview, { opacity: 0, scale: 0.85, duration: 0.35, ease: 'power3.out' });
      });
    });

    document.querySelector('.works').addEventListener('mousemove', function (e) {
      pxTo(e.clientX);
      pyTo(e.clientY);
    });
    gsap.set(preview, { xPercent: -50, yPercent: -50, scale: 0.85 });
  }

  /* ---------- Custom cursor ---------- */
  var cursor = document.querySelector('.cursor');
  if (cursor && finePointer && hasGsap && !reducedMotion) {
    var dot = cursor.querySelector('.cursor-dot');
    var ring = cursor.querySelector('.cursor-ring');
    var label = cursor.querySelector('.cursor-label');

    var dotX = gsap.quickTo(dot, 'x', { duration: 0.12, ease: 'power2' });
    var dotY = gsap.quickTo(dot, 'y', { duration: 0.12, ease: 'power2' });
    var ringX = gsap.quickTo(ring, 'x', { duration: 0.4, ease: 'power3' });
    var ringY = gsap.quickTo(ring, 'y', { duration: 0.4, ease: 'power3' });

    window.addEventListener('mousemove', function (e) {
      dotX(e.clientX); dotY(e.clientY);
      ringX(e.clientX); ringY(e.clientY);
    });

    document.addEventListener('mouseover', function (e) {
      var workHead = e.target.closest ? e.target.closest('.work-head') : null;
      var interactive = e.target.closest ? e.target.closest('a, button') : null;
      if (workHead) {
        cursor.classList.add('is-work');
        cursor.classList.remove('is-link');
        label.textContent = workHead.parentNode.classList.contains('is-open') ? 'Close' : 'View';
      } else if (interactive) {
        cursor.classList.add('is-link');
        cursor.classList.remove('is-work');
      } else {
        cursor.classList.remove('is-link', 'is-work');
      }
    });
  }

  /* ---------- Magnetic button ---------- */
  var magnet = document.querySelector('.btn-magnetic');
  if (magnet && finePointer && hasGsap && !reducedMotion) {
    var mxTo = gsap.quickTo(magnet, 'x', { duration: 0.4, ease: 'power3' });
    var myTo = gsap.quickTo(magnet, 'y', { duration: 0.4, ease: 'power3' });

    magnet.addEventListener('mousemove', function (e) {
      var r = magnet.getBoundingClientRect();
      mxTo((e.clientX - (r.left + r.width / 2)) * 0.35);
      myTo((e.clientY - (r.top + r.height / 2)) * 0.35);
    });
    magnet.addEventListener('mouseleave', function () {
      gsap.to(magnet, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.4)' });
    });
  }

  /* ---------- Nav hide/show on scroll direction ---------- */
  if (hasGsap && !reducedMotion) {
    var nav = document.querySelector('.nav');
    var lastY = 0;
    var navHidden = false;
    function onScrollPos(y) {
      if (y > 140 && y > lastY + 4 && !navHidden) {
        navHidden = true;
        gsap.to(nav, { yPercent: -110, duration: 0.5, ease: 'power3.out' });
      } else if ((y < lastY - 4 || y <= 140) && navHidden) {
        navHidden = false;
        gsap.to(nav, { yPercent: 0, duration: 0.5, ease: 'power3.out' });
      }
      lastY = y;
    }
    if (lenis) {
      lenis.on('scroll', function (e) { onScrollPos(e.scroll); });
    } else {
      window.addEventListener('scroll', function () { onScrollPos(window.scrollY); }, { passive: true });
    }
  }

  initClock();

  window.addEventListener('load', function () {
    if (hasST) ScrollTrigger.refresh();
  });
})();
