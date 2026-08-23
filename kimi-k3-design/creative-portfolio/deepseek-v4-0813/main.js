/* Elias Marlow — Portfolio interactions */
(() => {
  "use strict";

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch = window.matchMedia("(hover: none)").matches;

  /* ---------- Reveal on scroll ---------- */
  const revealEls = document.querySelectorAll("[data-reveal]");

  // Stagger hero title lines and elements
  revealEls.forEach((el) => {
    const parent = el.closest(".hero");
    const delay = parent ? 0.1 + Math.random() * 0.05 : 0;
    el.style.setProperty("--reveal-delay", delay + "s");
  });

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
  );

  revealEls.forEach((el) => revealObserver.observe(el));

  if (prefersReducedMotion) {
    revealEls.forEach((el) => el.classList.add("is-visible"));
    document.querySelectorAll(".line__inner").forEach((el) => el.classList.add("is-visible"));
  }

  /* ---------- Scroll progress ---------- */
  const progressBar = document.querySelector(".scroll-progress");
  const pctEl = document.getElementById("scrollPct");

  function updateScroll() {
    const scrollTop = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const pct = max > 0 ? scrollTop / max : 0;
    if (progressBar) progressBar.style.transform = `scaleX(${pct})`;
    if (pctEl) pctEl.textContent = String(Math.round(pct * 100)).padStart(2, "0");
  }

  window.addEventListener("scroll", updateScroll, { passive: true });
  updateScroll();

  /* ---------- Custom cursor ---------- */
  if (!isTouch && !prefersReducedMotion) {
    const cursor = document.querySelector(".cursor");
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let tx = x;
    let ty = y;

    window.addEventListener("mousemove", (e) => {
      tx = e.clientX;
      ty = e.clientY;
      cursor.style.opacity = "1";
    });

    (function animateCursor() {
      x += (tx - x) * 0.18;
      y += (ty - y) * 0.18;
      cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      requestAnimationFrame(animateCursor);
    })();

    const textTargets = "a, button, .project__name, .contact__cta, input, textarea, [data-cursor]";
    document.addEventListener("mouseover", (e) => {
      const target = e.target.closest(textTargets);
      if (target) {
        cursor.classList.add(target.hasAttribute("data-cursor") ? "is-active" : "is-text");
      }
    });
    document.addEventListener("mouseout", (e) => {
      const target = e.target.closest(textTargets);
      if (target) {
        cursor.classList.remove("is-active", "is-text");
      }
    });
  }

  /* ---------- Project hover preview ---------- */
  if (!isTouch && !prefersReducedMotion) {
    const preview = document.createElement("div");
    const projects = document.querySelectorAll(".project");
    projects.forEach((project) => {
      project.addEventListener("mouseenter", (e) => {
        const img = project.querySelector(".project__preview-img");
        if (!img) return;
        const clone = img.cloneNode(true);
        preview.className = "project__preview";
        preview.innerHTML = "";
        preview.appendChild(clone);
        preview.classList.add("is-visible");
        document.body.appendChild(preview);
        positionPreview(e);
      });
      project.addEventListener("mousemove", positionPreview);
      project.addEventListener("mouseleave", () => {
        preview.classList.remove("is-visible");
      });
    });

    function positionPreview(e) {
      const rect = preview.getBoundingClientRect();
      const pad = 24;
      let left = e.clientX + pad;
      let top = e.clientY - rect.height / 2;
      if (left + rect.width > window.innerWidth) left = e.clientX - rect.width - pad;
      if (top < pad) top = pad;
      if (top + rect.height > window.innerHeight - pad) top = window.innerHeight - rect.height - pad;
      preview.style.left = `${left}px`;
      preview.style.top = `${top}px`;
    }
  }

  /* ---------- Magnetic buttons (nav CTA) ---------- */
  if (!isTouch && !prefersReducedMotion) {
    const magnetic = document.querySelectorAll(".nav__link--cta, .brand, .contact__cta");
    magnetic.forEach((el) => {
      el.addEventListener("mousemove", (e) => {
        const rect = el.getBoundingClientRect();
        const mx = e.clientX - rect.left - rect.width / 2;
        const my = e.clientY - rect.top - rect.height / 2;
        el.style.transform = `translate(${mx * 0.12}px, ${my * 0.2}px)`;
      });
      el.addEventListener("mouseleave", () => {
        el.style.transform = "translate(0,0)";
        el.style.transition = "transform 0.5s cubic-bezier(0.22,1,0.36,1)";
        setTimeout(() => (el.style.transition = ""), 500);
      });
    });
  }

  /* ---------- Mobile menu ---------- */
  const toggle = document.querySelector(".menu-toggle");
  const menu = document.getElementById("mobile-menu");

  if (toggle && menu) {
    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      menu.hidden = open;
      document.body.style.overflow = open ? "" : "hidden";
    });

    menu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        toggle.setAttribute("aria-expanded", "false");
        menu.hidden = true;
        document.body.style.overflow = "";
      });
    });
  }

  /* ---------- Smooth scroll offset for fixed header ---------- */
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (e) => {
      const id = anchor.getAttribute("href");
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (target) {
        e.preventDefault();
        const top = target.getBoundingClientRect().top + window.scrollY - 0;
        window.scrollTo({ top, behavior: prefersReducedMotion ? "auto" : "smooth" });
      }
    });
  });
})();
