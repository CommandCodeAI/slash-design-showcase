(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const doc = document.documentElement;

  const reveal = () => {
    const items = document.querySelectorAll("[data-reveal], [data-rule]");
    if (!("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    items.forEach((el, i) => {
      el.style.setProperty("--jitter", `${(i % 3) * 14 - 7}ms`);
      io.observe(el);
    });
  };

  const heroEntrance = () => {
    const ready = document.fonts && document.fonts.ready
      ? document.fonts.ready
      : Promise.resolve();
    const timeout = new Promise((resolve) => setTimeout(resolve, 900));
    Promise.race([ready, timeout]).then(() => {
      requestAnimationFrame(() => doc.classList.add("loaded"));
    });
  };

  const headerAndProgress = () => {
    const head = document.getElementById("siteHead");
    const fill = document.getElementById("progressFill");
    const toTop = document.getElementById("toTop");
    let ticking = false;

    const update = () => {
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      head.classList.toggle("is-scrolled", y > 24);
      if (toTop) toTop.hidden = y < window.innerHeight * 0.6;
      if (fill) fill.style.transform = `scaleX(${max > 0 ? Math.min(y / max, 1) : 0})`;
      ticking = false;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    update();
  };

  const heroParallax = () => {
    if (reduceMotion.matches) return;
    const inner = document.querySelector(".hero-inner");
    const hero = document.querySelector(".hero");
    if (!inner || !hero) return;
    let ticking = false;

    const update = () => {
      const h = hero.offsetHeight || 1;
      const p = Math.min(Math.max(window.scrollY / h, 0), 1);
      inner.style.transform = `translate3d(0, ${p * -56}px, 0)`;
      inner.style.opacity = String(1 - p * 0.85);
      ticking = false;
    };

    window.addEventListener(
      "scroll",
      () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(update);
      },
      { passive: true }
    );
    update();
  };

  const scrollSpy = () => {
    const links = Array.from(document.querySelectorAll("[data-spy]"));
    if (!links.length || !("IntersectionObserver" in window)) return;
    const sections = links
      .map((link) => document.getElementById(link.dataset.spy))
      .filter(Boolean);
    if (!sections.length) return;

    const setActive = (id) => {
      links.forEach((link) => {
        if (link.dataset.spy === id) link.setAttribute("aria-current", "true");
        else link.removeAttribute("aria-current");
      });
    };

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: "-45% 0px -45% 0px" }
    );
    sections.forEach((section) => io.observe(section));
  };

  const disclosures = () => {
    const rows = document.querySelectorAll(".row[aria-controls]");
    rows.forEach((row) => {
      const panel = document.getElementById(row.getAttribute("aria-controls"));
      if (!panel) return;
      row.addEventListener("click", () => {
        const open = row.getAttribute("aria-expanded") === "true";
        row.setAttribute("aria-expanded", String(!open));
        panel.classList.toggle("is-open", !open);
        panel.inert = open;
      });
    });
  };

  const copyEmail = () => {
    const btn = document.getElementById("copyEmail");
    const label = document.getElementById("copyLabel");
    const status = document.getElementById("copyStatus");
    if (!btn || !status) return;
    const email = "hello@mirasolheim.studio";

    btn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(email);
        status.textContent = "Email copied to clipboard.";
        if (label) label.textContent = "Copied";
        setTimeout(() => {
          status.textContent = "";
          if (label) label.textContent = "Copy email";
        }, 2600);
      } catch {
        status.textContent = "Copying is blocked here. The address is above.";
      }
    });
  };

  const year = () => {
    const el = document.getElementById("year");
    if (el) el.textContent = String(new Date().getFullYear());
  };

  reveal();
  heroEntrance();
  headerAndProgress();
  heroParallax();
  scrollSpy();
  disclosures();
  copyEmail();
  year();
})();
