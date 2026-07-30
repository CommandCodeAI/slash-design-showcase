/* ============================================
   PRELOADER SEQUENCE
   ============================================ */
(function initPreloader() {
  const preloader = document.getElementById('preloader');
  if (!preloader) return;

  // Wait for fonts to load, then trigger exit
  document.fonts.ready.then(() => {
    setTimeout(() => {
      preloader.classList.add('loaded');
      // Remove from DOM after transition
      setTimeout(() => preloader.remove(), 900);
    }, 2200);
  });

  // Fallback: always remove after max time regardless
  setTimeout(() => {
    preloader.classList.add('loaded');
    setTimeout(() => preloader.remove(), 900);
  }, 4000);
})();

/* ============================================
   SCROLL PROGRESS BAR
   ============================================ */
(function initScrollProgress() {
  const fill = document.querySelector('.scroll-progress-fill');
  if (!fill) return;

  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    fill.style.width = `${Math.min(scrollPercent, 100)}%`;
  }, { passive: true });
})();

/* ============================================
   CUSTOM CURSOR
   ============================================ */
(function initCursor() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (prefersReducedMotion.matches) return;

  const cursor = document.getElementById('cursor');
  const follower = document.getElementById('cursorFollower');
  if (!cursor || !follower) return;

  let mouseX = -100, mouseY = -100;
  let followerX = -100, followerY = -100;

  function animate() {
    cursor.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;

    // Follower trails with spring-like lag
    followerX += (mouseX - followerX) * 0.15;
    followerY += (mouseY - followerY) * 0.15;
    follower.style.transform = `translate(${followerX}px, ${followerY}px) translate(-50%, -50%)`;

    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  function setCursorState(state) {
    cursor.classList.remove('is-pointer', 'is-link');
    follower.classList.remove('is-pointer');
    if (state === 'pointer') {
      cursor.classList.add('is-pointer');
      follower.classList.add('is-pointer');
    } else if (state === 'link') {
      cursor.classList.add('is-link');
    }
  }

  // Interactive elements
  document.querySelectorAll('[data-cursor-pointer]').forEach((el) => {
    el.addEventListener('mouseenter', () => setCursorState('pointer'));
    el.addEventListener('mouseleave', () => setCursorState());
  });

  // Links get special state
  document.querySelectorAll('a:not([data-cursor-pointer])').forEach((el) => {
    el.addEventListener('mouseenter', () => setCursorState('link'));
    el.addEventListener('mouseleave', () => setCursorState());
  });

  // Large text gets link-like cursor
  document.querySelectorAll('.hero-title, .contact-email').forEach((el) => {
    el.addEventListener('mouseenter', () => setCursorState('link'));
    el.addEventListener('mouseleave', () => setCursorState());
  });
})();

/* ============================================
   HERO ENTRANCE ANIMATIONS
   ============================================ */
(function initHeroAnimations() {
  const animateElements = document.querySelectorAll('[data-animate]:not(.hero-title)');
  const title = document.querySelector('.hero-title');

  if (title) {
    // Split each char-split span into individual characters
    title.querySelectorAll('.char-split').forEach((split) => {
      const text = split.textContent;
      split.innerHTML = '';
      text.split('').forEach((char, i) => {
        const span = document.createElement('span');
        span.className = 'char';
        span.style.animationDelay = `${0.6 + i * 0.04}s`;
        if (char === ' ') {
          span.innerHTML = '&nbsp;';
        } else {
          span.textContent = char;
        }
        split.appendChild(span);
      });
    });

    // Trigger hero title animation after a delay
    setTimeout(() => {
      title.classList.add('animate-in');
    }, 300);
  }

  // Animate other elements with staggered delays
  animateElements.forEach((el, i) => {
    setTimeout(() => {
      el.classList.add('animate-in');
    }, 800 + (i * 200));
  });
})();

/* ============================================
   SCROLL REVEAL (Intersection Observer)
   ============================================ */
(function initScrollReveal() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -60px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, observerOptions);

  // Reveal-up elements
  document.querySelectorAll('.reveal-up').forEach((el) => {
    observer.observe(el);
  });

  // Stagger children
  document.querySelectorAll('.stagger').forEach((el) => {
    observer.observe(el);
  });

  // Skill bars with animated fill
  const skillObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const bar = entry.target;
        const fill = bar.querySelector('.skill-fill');
        if (fill) {
          const width = fill.dataset.skillWidth;
          fill.style.setProperty('--target-width', `${width}%`);
          fill.classList.add('animated');
        }
        bar.classList.add('animated');
        skillObserver.unobserve(bar);
      }
    });
  }, { threshold: 0.3 });

  document.querySelectorAll('.skill-bar').forEach((bar) => {
    skillObserver.observe(bar);
  });
})();

/* ============================================
   NAVIGATION STATE + HIDE ON SCROLL DOWN
   ============================================ */
(function initNav() {
  const nav = document.getElementById('nav');
  if (!nav) return;

  let lastScroll = 0;
  let ticking = false;

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const currentScroll = window.scrollY;

        // Add scrolled state
        if (currentScroll > 50) {
          nav.classList.add('scrolled');
        } else {
          nav.classList.remove('scrolled');
        }

        // Hide on scroll down, show on scroll up
        if (currentScroll > lastScroll && currentScroll > 100) {
          nav.classList.add('hidden');
        } else {
          nav.classList.remove('hidden');
        }

        lastScroll = currentScroll;
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
})();

/* ============================================
   MOBILE MENU TOGGLE
   ============================================ */
(function initMobileMenu() {
  const menuBtn = document.getElementById('menuBtn');
  const navLinks = document.getElementById('navLinks');
  if (!menuBtn || !navLinks) return;

  menuBtn.addEventListener('click', () => {
    menuBtn.classList.toggle('active');
    navLinks.classList.toggle('open');
    document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
  });

  // Close menu when a link is clicked
  navLinks.querySelectorAll('.nav-link').forEach((link) => {
    link.addEventListener('click', () => {
      menuBtn.classList.remove('active');
      navLinks.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
})();

/* ============================================
   HORIZONTAL PROJECTS DRAG SCROLL
   ============================================ */
(function initDragScroll() {
  const container = document.getElementById('projectsHorizontal');
  if (!container) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (prefersReducedMotion.matches) return;

  let isDown = false;
  let startX;
  let scrollLeft;
  let velocity = 0;
  let lastPosition = 0;
  let lastTime = 0;
  let momentumID;

  container.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    isDown = true;
    container.classList.add('dragging');
    startX = e.pageX - container.offsetLeft;
    scrollLeft = container.scrollLeft;
    lastPosition = e.pageX;
    lastTime = Date.now();
    cancelMomentum();
  });

  container.addEventListener('mouseleave', () => {
    isDown = false;
    container.classList.remove('dragging');
    startMomentum();
  });

  container.addEventListener('mouseup', () => {
    isDown = false;
    container.classList.remove('dragging');
    startMomentum();
  });

  container.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - container.offsetLeft;
    const walk = (x - startX) * 1.5;
    container.scrollLeft = scrollLeft - walk;

    // Track velocity for momentum
    const now = Date.now();
    const dt = now - lastTime;
    if (dt > 0) {
      velocity = (e.pageX - lastPosition) / dt;
      lastPosition = e.pageX;
      lastTime = now;
    }
  });

  function startMomentum() {
    cancelMomentum();
    momentumID = requestAnimationFrame(momentumLoop);
  }

  function momentumLoop() {
    if (Math.abs(velocity) < 0.1) return;
    container.scrollLeft += velocity * 16;
    velocity *= 0.95;
    momentumID = requestAnimationFrame(momentumLoop);
  }

  function cancelMomentum() {
    if (momentumID) {
      cancelAnimationFrame(momentumID);
      momentumID = null;
    }
  }
})();

/* ============================================
   MAGNETIC EFFECT ON BUTTONS
   ============================================ */
(function initMagneticButtons() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (prefersReducedMotion.matches) return;

  const buttons = document.querySelectorAll('.btn[data-cursor-pointer]');

  buttons.forEach((btn) => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      btn.style.transform = `translate(${x * 0.25}px, ${y * 0.25}px)`;
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  });
})();

/* ============================================
   SMOOTH SCROLL FOR ANCHOR LINKS
   ============================================ */
(function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (href === '#') return;

      const target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();
      const navHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-height')) || 64;

      const top = target.getBoundingClientRect().top + window.scrollY - navHeight;

      window.scrollTo({
        top,
        behavior: 'smooth'
      });
    });
  });
})();

/* ============================================
   PARALLAX HERO SHAPES ON SCROLL
   ============================================ */
(function initParallax() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (prefersReducedMotion.matches) return;

  const heroShapes = document.querySelector('.hero-shapes');
  const hero = document.getElementById('hero');
  if (!hero || !heroShapes) return;

  let ticking = false;

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const scrolled = window.scrollY;
        const heroHeight = hero.offsetHeight;

        if (scrolled < heroHeight) {
          const ratio = scrolled / heroHeight;
          heroShapes.style.transform = `translateY(${scrolled * 0.15}px)`;
          hero.querySelector('.hero-content')?.style.setProperty('transform', `translateY(${scrolled * 0.2}px)`);
          hero.querySelector('.hero-content')?.style.setProperty('opacity', String(1 - ratio * 0.6));
        }

        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
})();

/* ============================================
   PERFORMANCE: REDUCE WHEN TAB IS INVISIBLE
   ============================================ */
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    document.querySelectorAll('[data-animate], .skill-fill, .char .char').forEach((el) => {
      el.style.transition = 'none';
    });
  } else {
    document.querySelectorAll('[data-animate], .skill-fill, .char .char').forEach((el) => {
      el.style.transition = '';
    });
  }
});
