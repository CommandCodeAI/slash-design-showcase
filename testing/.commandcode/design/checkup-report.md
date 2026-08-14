# Checkup Report — NeuraFlux

**Mode:** checkup
**Date:** 2026-08-13
**Surface:** `index.html` — NeuraFlux landing page

---

## Score: 30/60

| Vital | Status | Points |
|---|---|---|
| Intentionality | Watch | 5 |
| Readability | Healthy | 10 |
| Usability | Watch | 5 |
| Responsiveness | Critical | 0 |
| Speed | Watch | 5 |
| Accessibility | Watch | 5 |

---

## TL;DR

The page is readable and the composition is intentional, but it is not safe to ship. Navigation links are completely inaccessible on mobile — hidden below the `lg` breakpoint with no hamburger menu or alternative. Focus states are undefined for keyboard users. Tailwind CDN blocks render. These are fixable but one is a hard blocker.

**Primary recommendation:** Add a mobile navigation pattern before anything else. Then add focus-visible styles and `prefers-reduced-motion` handling.

---

## Vitals

### Intentionality — Watch (5/10)
The composition shows real decisions (two-column split, product panel as proof), but several elements look assembled from defaults: the accent rail on the result callout, Tailwind default type with no scale system, placeholder avatar circles, and a grid-line background overlay. The page is half-authored, half-defaulted.

### Readability — Healthy (10/10)
Dark theme with zinc-100 body text on black. Contrast is strong throughout. Hero headline is large (up to 88px) with tight tracking. Body text is 16-18px with comfortable line-height (1.75). The code block uses monospace with syntax highlighting. No readability concerns.

### Usability — Watch (5/10)
Primary task (get access / start building) is clear with visible CTAs. But all links point to `#` anchors — no real destinations. Nav links, sign-in, and CTAs are non-functional placeholders. For a landing page demo this is expected, but it means the primary task cannot actually be completed.

### Responsiveness — Critical (0/10)
**Nav links (Product, Developers, Docs, Security, Pricing) are `hidden lg:flex` — completely inaccessible on mobile and tablet.** There is no hamburger menu, no disclosure button, no alternative navigation path. On screens below 1024px, the user can only see the logo and "Get access" button. This blocks navigation for the majority of mobile visitors.

No form inputs exist on the page, so iOS Safari input zoom is not a concern here. The hero grid stacks correctly on mobile (`lg:grid-cols` without a base `grid-cols` means single column below `lg`). But the missing mobile nav is a hard blocker.

### Speed — Watch (5/10)
Tailwind is loaded via CDN `<script src="https://cdn.tailwindcss.com">` — a render-blocking, ~400KB script that compiles classes in the browser. This causes a flash of unstyled content and delays first meaningful paint. No images are used (all visual effects are CSS-based), so there is no image load jank. But the CDN dependency is a performance liability for production.

### Accessibility — Watch (5/10)
- **Focus states: undefined.** No `focus-visible` or `focus:` styles anywhere. Keyboard users get only the browser default outline, which on dark backgrounds may be invisible or inconsistent. Links and buttons are focusable but the focus ring is not designed.
- **Screen reader: mostly OK.** Star rating has `aria-label="5 out of 5 stars"`. Decorative elements (grid background, avatar stack) have `aria-hidden="true"`. The logo mark is `aria-hidden`. Good.
- **Reduced motion: not handled.** No `prefers-reduced-motion` media query. Hover translate transitions still apply. Motion is minimal so impact is low, but the preference is not respected.
- **Color contrast: adequate.** zinc-400 (#a1a1aa) on black passes WCAG AA for normal text. orange-400 on black passes. No contrast failures detected.

---

## Prescriptions

### P0 — Mobile navigation missing (Critical)
**What is broken:** Nav links are `hidden lg:flex`. Below 1024px width, five navigation destinations vanish with no replacement.
**Why it matters:** Mobile users cannot reach Product, Developers, Docs, Security, or Pricing. They can only hit "Get access." This blocks wayfinding for the majority of traffic.
**Fix:** Add a mobile menu toggle (hamburger or disclosure button) that reveals the nav links on small screens. All nav destinations must be reachable at 320px.

### P1 — Focus states undefined (Watch)
**What is broken:** No `focus-visible` styles. Keyboard users have no reliable focus indicator.
**Why it matters:** Keyboard-only and switch-device users cannot see where they are on the page.
**Fix:** Add `focus-visible` styles to all interactive elements — 2-3px ring with offset, 3:1 contrast against background.

### P2 — Tailwind CDN render-blocking (Watch)
**What is broken:** Tailwind loaded via CDN script, causing FOUC and render delay.
**Why it matters:** First paint is delayed; content shifts during style compilation.
**Fix:** For production, use a precompiled Tailwind build. For a demo, accept the tradeoff but be aware.

---

## What's Working

- **Readability is solid.** Strong contrast, good type sizing, comfortable line-height.
- **Composition matches the work pattern.** This is a "decide" surface — focused pitch, proof artifact, dominant action. The two-column layout supports that.
- **Semantic HTML.** Uses `<nav>`, `<main>`, `<section>`, `<article>`, `<header>`, `<ol>`, `<pre><code>`. Structure is accessible to screen readers even if interaction states are not.
- **ARIA where needed.** Decorative elements are hidden from AT. Star rating is labeled.

---

## Next Modes

- `/design responsive` — fix mobile navigation, test viewport gauntlet
- `/design interaction` — add focus states, reduced-motion, hover/active/disabled states
- `/design deslop` — remove accent rail, default type, placeholder social proof
