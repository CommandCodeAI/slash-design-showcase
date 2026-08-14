# Smell Report — NeuraFlux

**Mode:** smell
**Date:** 2026-08-13
**Surface:** `index.html` — NeuraFlux landing page (hero + product panel)

---

## Score: 5/10 — PRESENT

Four catalog tells detected. The page avoids the worst AI reflexes (no blue-violet gradient, no center stack, no feature tile grid), but several default patterns remain unchosen: an accent rail, default type, generic social proof, and a domain-default dark-terminal aesthetic.

---

## TL;DR

The composition is competent and non-generic in structure (two-column split, not center stack), but the surface still reads as assembled from dev-tool defaults. The orange-on-black palette dodges the blue-violet reflex but the dark + terminal-mockup + grid-overlay combo is guessable from the "AI reasoning API" industry alone. Type has no voice. The accent rail on the result callout is decoration pretending to be structure. Social proof is a placeholder.

**Primary recommendation:** Run `/design deslop` to replace each tell with a deliberate choice, then `/design typeset` to build a real type system.

---

## Heuristic Scores

| # | Odor | Score | Finding |
|---|---|---|---|
| 1 | Tech gradient | 1/1 | Absent. No blue-violet or indigo-cyan gradient. Background uses a subtle orange radial tint. |
| 2 | Generic tech hue | 1/1 | Absent. Orange is not the blue-purple default. A non-default hue was chosen. |
| 3 | Feature tile grid | 1/1 | Absent. No equal-card feature section. The product panel is a single authored artifact. |
| 4 | Accent rail | 0/1 | **Detected.** `border-l-4 border-l-orange-500` on the result callout (line 69). Colored stripe simulating structure where type weight or border treatment would do the real job. |
| 5 | Unearned blur | 1/1 | Absent. No frosted glass panels. |
| 6 | Stat monument | 0/1 | **Detected (faint).** "Trusted by 1,200+ developers" with five stars and three empty colored avatar circles. The avatars are placeholders — colored circles, not people. The stat has no story behind it. |
| 7 | Icon topper | 1/1 | Absent. No rounded-square icons above section headings. |
| 8 | Bounce everywhere | 1/1 | Absent. Only simple `hover:-translate-y-0.5` lifts. No elastic or bounce easing. |
| 9 | Default type | 0/1 | **Detected.** Tailwind `font-sans` (system stack) and `font-mono` with no scale rationale, no weight contrast system, no voice. The headline tracking is tuned but the body and UI text are on autopilot. |
| 10 | Center stack | 1/1 | Absent. Two-column `lg:grid-cols-[0.9fr_1.2fr]` split with text left and product panel right. A composition decision was made. |

---

## Domain Default Trap

**Present.** An AI reasoning API product rendered as dark theme + terminal-style mockup + grid-line background overlay + orange accent. The dark + terminal + grid-overlay combination is the median generated dev-tool landing page. Orange is a mild surprise (many go blue or purple), which keeps this from being a full identity failure, but the overall visual direction is largely guessable from the industry before opening the page.

**Break needed in at least one dimension:** composition texture, type voice, or the terminal-mockup artifact itself needs to feel specific to NeuraFlux rather than to any AI API product.

---

## Additional Tells (non-catalog)

### Grid background overlay
Line 12: a grid-line pattern (`linear-gradient` crosshatch) with a `radial-gradient` mask fading to transparent. This is one of the most common AI/dev-tool background reflexes. It signals "technical" without saying anything specific.

### Traffic-light terminal dots
Line 52: macOS-style red/amber/green window dots on the product panel header. A cliché terminal-mockup signal. The panel could convey "live reasoning session" without borrowing macOS window chrome.

### Glowing dot on badge
Line 30: the "PUBLIC BETA · NOW OPEN" pill has a pulsing-glow orange dot. Badge-with-glowing-dot is a standard generated-landing reflex.

---

## Severity Assessment

- **Accent rail** and **default type** are the strongest catalog tells. Both are clear, pointable, and fixable with real decisions.
- **Stat monument / social proof** is faint but clustered with the domain default trap — together they read as "generated social proof."
- **Domain default trap** is the structural concern. Individual fixes won't resolve it; the surface needs at least one dimension broken from the dev-tool median.
- Grid overlay, traffic-light dots, and glowing badge dot are faint isolates that reinforce the domain default.

---

## Fix Routing

| Tell | Fix mode |
|---|---|
| Accent rail | deslop — remove rail, use type weight or border treatment |
| Default type | typeset — build a real scale and voice |
| Stat monument / social proof | deslop — replace placeholder avatars with real proof language |
| Domain default trap | deslop + voice — break at least one dimension from the dev-tool median |
| Grid overlay / terminal dots / badge dot | deslop — replace or remove generic decoration |

---

## What's Working

- **Composition decision made.** Two-column split with a real product artifact on the right. Not a center stack.
- **Color choice is non-default.** Orange-on-black avoids the blue-violet reflex. The radial gradient background adds atmosphere without being a tech gradient.
- **Product panel tells a story.** The reasoning-session mockup walks through Context → Reasoning → Tool call → Result with a real code snippet and a real result sentence. This is proof, not ornament.
- **Headline is tuned.** Tight tracking, bold weight, three-line break with color emphasis on the last word. Intentional.

---

## What I Refuse

- Calling the page clean because it avoids blue-violet. Avoiding one reflex is not the same as making a choice.
- Treating the orange palette as enough identity. The hue is chosen; the type and texture are not.
- Patching the accent rail with a different decoration. The rail goes, replaced by real structure.
