/* ============================================================
   Arden Vale — Portfolio interactions
   ============================================================ */
(() => {
  "use strict";

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isFinePointer = window.matchMedia("(pointer: fine)").matches;

  /* ---------- Smooth scroll (Lenis) ---------- */
  let lenis = null;
  if (window.Lenis && !prefersReduced) {
    lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.4,
    });

    lenis.on("scroll", () => {
      onScroll();
    });

    const raf = (time) => {
      lenis.raf(time);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  } else {
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- Scroll progress + nav state ---------- */
  const progressBar = document.getElementById("scrollProgressBar");
  const nav = document.getElementById("nav");
  const footerClock = document.getElementById("footerClock");
  const heroClock = document.getElementById("heroClock");

  function onScroll() {
    const doc = document.documentElement;
    const max = doc.scrollHeight - window.innerHeight;
    const p = max > 0 ? window.scrollY / max : 0;
    if (progressBar) progressBar.style.transform = `scaleX(${p})`;
    if (nav) nav.classList.toggle("scrolled", window.scrollY > 40);
  }

  /* ---------- Preloader counter ---------- */
  const preloader = document.getElementById("preloader");
  const preloaderCount = document.getElementById("preloaderCount");
  let bodyLoaded = false;

  function animateCounter() {
    const dur = 1600;
    const start = performance.now();

    function tick(now) {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      if (preloaderCount) {
        preloaderCount.textContent = String(Math.round(eased * 100)).padStart(2, "0");
      }
      if (t < 1) requestAnimationFrame(tick);
      else if (!bodyLoaded) finishLoad();
    }
    requestAnimationFrame(tick);
  }

  function finishLoad() {
    if (bodyLoaded) return;
    bodyLoaded = true;
    document.body.classList.add("loaded");

    // Kick hero word reveal after the preloader lifts
    setTimeout(() => {
      document.querySelectorAll(".hero-line .split-word").forEach((w, i) => {
        w.style.setProperty("--word-delay", `${i * 90}ms`);
      });
    }, 150);

    if (preloader) {
      preloader.addEventListener("transitionend", () => preloader.remove(), { once: true });
      setTimeout(() => preloader.remove(), 1200);
    }
  }

  /* Auto-finish after safety timeout (if fonts are slow) */
  setTimeout(finishLoad, 3200);

  if (prefersReduced) {
    document.body.classList.add("loaded");
    document.body.classList.add("no-preloader");
    if (preloader) preloader.remove();
  } else {
    animateCounter();
  }

  /* ---------- Split text for hero + section titles ---------- */
  function splitWords(el) {
    const words = el.textContent.trim().split(/\s+/);
    el.setAttribute("aria-label", el.textContent.trim());
    el.textContent = "";
    words.forEach((word) => {
      const span = document.createElement("span");
      span.className = "split-word";
      span.textContent = word;
      el.appendChild(span);
      el.appendChild(document.createTextNode(" "));
    });
  }

  document.querySelectorAll("[data-split]").forEach((el) => {
    if (prefersReduced) return;
    splitWords(el);
  });

  /* ---------- Scroll reveal ---------- */
  const revealEls = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("revealed"));
  }

  /* ---------- Custom cursor ---------- */
  const cursorDot = document.querySelector(".cursor-dot");
  const cursorRing = document.querySelector(".cursor-ring");
  const cursorLabel = document.querySelector(".cursor-label");

  if (cursorDot && cursorRing && isFinePointer && !prefersReduced) {
    let mx = -100, my = -100, rx = -100, ry = -100;
    const dotSpeed = 0.5;
    const ringSpeed = 0.16;

    window.addEventListener("mousemove", (e) => {
      mx = e.clientX;
      my = e.clientY;
    });

    (function loop() {
      rx += (mx - rx) * ringSpeed;
      ry += (my - ry) * ringSpeed;
      cursorDot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
      cursorRing.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
      if (cursorLabel) {
        cursorLabel.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
      }
      requestAnimationFrame(loop);
    })();

    document.addEventListener("mouseleave", () => document.body.classList.add("cursor-hidden"));
    document.addEventListener("mouseenter", () => document.body.classList.remove("cursor-hidden"));

    const hoverables = 'a, button, .work-item, .cap-item, input, textarea, [data-cursor]';
    document.addEventListener("mouseover", (e) => {
      const t = e.target.closest(hoverables);
      document.body.classList.toggle("cursor-hover", !!t && !t.hasAttribute("data-cursor-label"));
      const label = t && t.getAttribute("data-cursor");
      if (label) {
        document.body.classList.add("cursor-label");
        if (cursorLabel) cursorLabel.textContent = label;
      } else {
        document.body.classList.remove("cursor-label");
      }
    });
  } else {
    document.body.classList.add("no-cursor");
  }

  /* ---------- Magnetic buttons ---------- */
  if (isFinePointer && !prefersReduced) {
    document.querySelectorAll("[data-magnetic]").forEach((el) => {
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.25;
        const y = (e.clientY - r.top - r.height / 2) * 0.25;
        el.style.transform = `translate(${x}px, ${y}px)`;
      });
      el.addEventListener("mouseleave", () => {
        el.style.transform = "";
        el.style.transition = "transform 0.4s cubic-bezier(0.22,1,0.36,1)";
        setTimeout(() => (el.style.transition = ""), 400);
      });
    });
  }

  /* ---------- Work item previews (desktop only) ---------- */
  const workItems = document.querySelectorAll(".work-item");

  /* ---------- Project overlay ---------- */
  const overlay = document.getElementById("overlay");
  const overlayTitle = document.getElementById("overlayTitle");
  const overlayIndex = document.getElementById("overlayIndex");
  const overlayMeta = document.getElementById("overlayMeta");
  const overlayBody = document.getElementById("overlayBody");
  const overlayFoot = document.getElementById("overlayFoot");
  const lastFocused = {};

  const projectData = {
    monolith: {
      index: "01",
      title: "Monolith",
      meta: [
        ["Category", "Design system"],
        ["Client", "Internal platform"],
        ["Year", "2025"],
        ["Stack", "React, TypeScript, tokens"],
      ],
      body: "A living design system for a multi-product platform. I built the token architecture, the component library, and the documentation site that keeps 40 engineers shipping consistent interfaces.",
      foot: "Design system — 400+ components — 12 teams",
    },
    helio: {
      index: "02",
      title: "Helio",
      meta: [
        ["Category", "Analytics"],
        ["Client", "Fintech scale-up"],
        ["Year", "2025"],
        ["Stack", "Vue, D3, Web Workers"],
      ],
      body: "A real-time analytics dashboard handling 212k nodes of graph data without a stutter. Virtualized rendering, worker-thread aggregation, and a dense but calm interface.",
      foot: "Analytics — 212k nodes — 38ms p95",
    },
    sable: {
      index: "03",
      title: "Sable",
      meta: [
        ["Category", "Commerce"],
        ["Client", "Independent fashion label"],
        ["Year", "2024"],
        ["Stack", "Next.js, edge, ISR"],
      ],
      body: "A commerce experience for a slow-fashion label. Editorial product pages, 60fps hover states, and a checkout flow that converts without shouting.",
      foot: "Commerce — 3.2s to interactive — +28% conversion",
    },
    tide: {
      index: "04",
      title: "Tide",
      meta: [
        ["Category", "Editorial"],
        ["Client", "Literary magazine"],
        ["Year", "2024"],
        ["Stack", "Astro, MDX"],
      ],
      body: "A reading experience built around typography and pace. Variable fonts, a distraction-free reader, and article layouts that respect the words.",
      foot: "Editorial — 11-min read — 100 Lighthouse",
    },
    kite: {
      index: "05",
      title: "Kite",
      meta: [
        ["Category", "Audio"],
        ["Client", "Independent label"],
        ["Year", "2023"],
        ["Stack", "Web Audio API, React"],
      ],
      body: "A browser-based music player for an independent label. Custom audio engine, visualizer, and a queue that feels physical.",
      foot: "Audio — Web Audio — 4.6k monthly listeners",
    },
  };

  function openProject(key) {
    const p = projectData[key];
    if (!p || !overlay) return;
    lastFocused[key] = document.activeElement;
    overlayTitle.textContent = p.title;
    overlayIndex.textContent = `${p.index} — Project`;
    overlayMeta.innerHTML = "";
    p.meta.forEach(([dt, dd]) => {
      const wrap = document.createElement("div");
      const d = document.createElement("dt");
      d.textContent = dt;
      const v = document.createElement("dd");
      v.textContent = dd;
      wrap.append(d, v);
      overlayMeta.appendChild(wrap);
    });
    overlayBody.textContent = p.body;
    overlayFoot.textContent = p.foot;
    overlay.classList.add("open");
    overlay.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    document.body.classList.add("overlay-open");
    if (lenis) lenis.stop();
    overlay.querySelector(".overlay-close").focus();
  }

  function closeProject() {
    if (!overlay) return;
    overlay.classList.remove("open");
    overlay.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    document.body.classList.remove("overlay-open");
    if (lenis) lenis.start();
    const key = Object.keys(projectData).find((k) => lastFocused[k] && lastFocused[k].isConnected);
    if (key && lastFocused[key]) lastFocused[key].focus();
  }

  document.querySelectorAll("[data-open]").forEach((btn) => {
    btn.addEventListener("click", () => openProject(btn.getAttribute("data-open")));
  });
  document.querySelectorAll("[data-close]").forEach((btn) => {
    btn.addEventListener("click", closeProject);
  });
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeProject();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay.classList.contains("open")) closeProject();
    if (e.key === "Tab" && overlay.classList.contains("open")) {
      const focusables = overlay.querySelectorAll('a[href], button:not([disabled])');
      if (focusables.length) {
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  });

  /* ---------- Copy email ---------- */
  const emailBtn = document.getElementById("emailBtn");
  const emailBtnLabel = document.getElementById("emailBtnLabel");
  const emailBtnHint = document.getElementById("emailBtnHint");

  if (emailBtn) {
    emailBtn.addEventListener("click", async () => {
      const text = emailBtn.getAttribute("data-copy");
      try {
        await navigator.clipboard.writeText(text);
        emailBtn.classList.add("copied");
        emailBtnHint.textContent = "Copied";
        setTimeout(() => {
          emailBtn.classList.remove("copied");
          emailBtnHint.textContent = "Click to copy";
        }, 2000);
      } catch {
        emailBtnHint.textContent = "Copy failed";
      }
    });
  }

  /* ---------- Back to top ---------- */
  const backTop = document.querySelector(".back-top");
  if (backTop) {
    backTop.addEventListener("click", () => {
      if (lenis) lenis.scrollTo(0, { duration: 1.4 });
      else window.scrollTo({ top: 0, behavior: prefersReduced ? "auto" : "smooth" });
    });
  }

  /* ---------- Clocks ---------- */
  function pad(n) {
    return String(n).padStart(2, "0");
  }
  function tickClocks() {
    const now = new Date();
    const hh = pad(now.getHours());
    const mm = pad(now.getMinutes());
    const ss = pad(now.getSeconds());
    if (heroClock) heroClock.textContent = `${hh}:${mm}:${ss}`;
    if (footerClock) footerClock.textContent = `Amsterdam — ${hh}:${mm}:${ss}`;
  }
  tickClocks();
  setInterval(tickClocks, 1000);

  /* ---------- Smooth anchor scrolling via Lenis ---------- */
  if (lenis) {
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener("click", (e) => {
        const id = a.getAttribute("href");
        if (id.length > 1) {
          const target = document.querySelector(id);
          if (target) {
            e.preventDefault();
            lenis.scrollTo(target, { offset: -80, duration: 1.3 });
          }
        }
      });
    });
  }

  onScroll();
})();
