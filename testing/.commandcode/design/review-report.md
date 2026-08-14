# Review Report — NeuraFlux

**Mode:** review
**Date:** 2026-08-13
**Surface:** `index.html` — NeuraFlux landing page (hero + product panel)

---

## Score: 29/50

| Lens | Score |
|---|---|
| First impression | 6/10 |
| Hierarchy | 7/10 |
| Color voice | 6/10 |
| Type voice | 5/10 |
| Interaction feel | 5/10 |

---

## TL;DR

The page has a genuine structural idea — a two-column hero with a live reasoning-session panel as proof — and it avoids the worst generated reflexes. But it doesn't commit hard enough. The type has no voice, the social proof is placeholder decoration, the accent rail is structure-faking, and the dark-terminal-grid aesthetic is the median dev-tool landing page. A designer would approve the composition but would not approve the texture. The page needs deslop and typeset before it is ready.

**Primary recommendation:** Run `/design deslop` to replace the accent rail, generic social proof, and domain-default texture with deliberate choices, then `/design typeset` to build a real type system.

---

## First Impression — 6/10

The page arrives with a clear point of view: orange-on-black, bold headline, a product panel showing a reasoning session in progress. The two-column split is the right call for a "decide" surface — it pairs the pitch with proof immediately.

What weakens the first impression: the grid-line background overlay with radial mask is a reflex, not a choice. The traffic-light terminal dots on the product panel borrow macOS chrome to signal "this is a terminal." The glowing dot on the beta badge is a standard generated reflex. Together these say "AI startup landing page" before they say "NeuraFlux."

The headline "Build products that think smarter." is direct and well-tuned. The orange emphasis on "smarter." is the strongest typographic moment on the page. But nothing else in the type system lives up to it.

**What would move the score:** Strip the grid overlay and terminal chrome. Let the product panel earn its own authority through type and layout, not borrowed window metaphors. Make the first viewport feel like it could only belong to NeuraFlux.

---

## Hierarchy — 7/10

The eye lands correctly. Headline first (88px, bold, tight tracking), then the product panel on the right, then CTAs, then trust signals. The badge sits above the headline as an entry point. The flow is: badge → headline → subhead → CTA → trust. That is sound.

The product panel has its own internal hierarchy: window header → task title → process timeline → code → result. The process timeline uses icon circles with connecting lines, which creates a visual scan path. The active "Reasoning" step is highlighted in orange with a glow — good state differentiation.

What holds it back: the two CTA buttons are nearly equal in visual weight. "Start building" is orange-filled; "See how it works" is zinc-bordered. The hierarchy is correct but the gap could be wider — the secondary CTA should clearly recede. The trust-signal row (stars + avatars + "1,200+ developers") competes with the CTA row for attention because the avatar circles are visually busy despite being empty.

**What would move the score:** Widen the CTA hierarchy gap. Simplify the social proof so it doesn't compete with the primary action.

---

## Color Voice — 6/10

Orange-on-black is a committed choice and it is not the blue-violet default. That earns credit. The radial gradient background (`circle_at_72%_45%`, orange at 14% opacity) creates atmosphere without being a tech gradient. The accent is used consistently: CTA buttons, badge, headline emphasis, active process step, result highlight, nav hover.

But the color doesn't carry much meaning beyond "orange = active/important, zinc = everything else." There is no state color system — no distinct treatment for success vs. in-progress vs. error. The "Live" badge is orange; the "Completed in 1.8s" badge is also orange. Live and completed should feel different. The traffic-light dots (red/amber/green) are decorative, not functional — they don't map to any real state.

The neutral palette is pure zinc (no chroma tint toward orange). A whisper of warm chroma in the grays would make the surface feel authored instead of sampled from Tailwind's default zinc ramp.

**What would move the score:** Tint the neutrals toward the brand hue. Give live and completed distinct color treatments. Remove the decorative traffic-light dots or make them functional.

---

## Type Voice — 5/10

This is the weakest lens. The page uses Tailwind's `font-sans` (system font stack) and `font-mono` with no type system behind them. The headline is tuned (tracking -0.055em, 88px, bold) but everything else is on autopilot: body text at 16-18px with default weight, UI labels at `text-sm`, the badge at `text-xs font-mono`. There is no scale rationale, no weight contrast system, no measure discipline.

The `font-mono` on the badge and code block is the only type "voice" — and it's the default monospace reflex for anything code-adjacent. The body copy ("Add production-ready reasoning to your product with one API...") is readable but has no personality. It could be on any SaaS landing page.

The hierarchy works at the headline level but flattens below it. The subhead, CTA labels, trust signals, and panel body text are all in a narrow weight/size band with no clear step-down.

**What would move the score:** Build a real type scale with at least three distinct levels. Choose a typeface (or commit to the system stack with a stated reason). Use weight contrast and size ratio (1.3+) to create steps. Give the body copy a measure (max-width in ch units) and a voice.

---

## Interaction Feel — 5/10

Hover states exist: buttons lift (`-translate-y-0.5`) and change background. Nav links change to orange-400 on hover. These are basic but functional.

What is missing:
- **Focus states:** undefined. No `focus-visible` styles. Keyboard users have no reliable focus indicator. This is the biggest interaction gap.
- **Active/pressed states:** none defined. Buttons have no `:active` treatment.
- **Reduced motion:** no `prefers-reduced-motion` handling. The hover translate still applies for users who request reduced motion.
- **Loading state:** the "Live" badge on the product panel says "Generating insights" but there is no actual loading animation or progress indicator — it is a static mockup pretending to be live.
- **The play button** on "See how it works" is a Unicode triangle (▶) in a circle. It looks like a video play button but the link goes to `#demo`. The affordance promises video; the destination is an anchor.

**What would move the score:** Add `focus-visible` rings. Add `:active` pressed states. Respect `prefers-reduced-motion`. Either make the "Live" panel actually animate or stop calling it live.

---

## Smell Lens

The design does not scream "AI made that" the way a blue-violet-gradient center-stack page would. But it has enough tells to be noticeable: grid overlay, terminal dots, glowing badge dot, placeholder avatars, accent rail, default type. A stranger shown the page for two seconds would likely guess "AI startup" — not because of one tell, but because the texture is the median dev-tool landing page. The composition saves it from identity failure; the texture keeps it from being clean.

---

## Top Issues (by impact)

1. **Default type with no voice** → `/design typeset`
2. **Accent rail on result callout** → `/design deslop`
3. **Placeholder social proof (empty avatars + generic stat)** → `/design deslop`
4. **Domain default texture (grid overlay + terminal dots + dark-zinc neutrals)** → `/design deslop` + `/design voice`
5. **Missing focus states and reduced-motion** → `/design interaction`
6. **Missing mobile navigation** → `/design responsive`

---

## What's Working

- **Composition is the right shape.** Two-column hero with proof artifact. Not a center stack. The product panel shows the product working — a real code snippet, a real result sentence, a process timeline. This is the strongest part of the page.
- **Headline is tuned.** Three-line break, tight tracking, color emphasis. Intentional.
- **Color choice is non-default.** Orange-on-black avoids the blue-violet reflex. The radial gradient adds depth.
- **Process timeline has state.** The active "Reasoning" step is highlighted with orange and glow; inactive steps are zinc. Good state differentiation within the mockup.
- **Semantic HTML throughout.** Proper landmarks and ARIA where needed.

---

## Recommendations

| Priority | Issue | Mode |
|---|---|---|
| 1 | Build a real type system with scale, weight contrast, and voice | `/design typeset` |
| 2 | Remove accent rail; replace with type weight or border treatment | `/design deslop` |
| 3 | Replace placeholder avatars and generic stat with real proof language | `/design deslop` |
| 4 | Break domain-default texture: strip grid overlay, rethink terminal chrome, tint neutrals warm | `/design deslop` + `/design voice` |
| 5 | Add focus-visible states, active states, reduced-motion support | `/design interaction` |
| 6 | Add mobile navigation pattern | `/design responsive` |
