# Design System: Noor Elian Portfolio

## Visual Theme

Nocturnal theater. A black-box stage: indigo-black field, bone type, a single vermillion cue light. Kinetic grotesque typography (variable width) is the hero object. Imagery is cinematic stills that bloom on hover, never a card grid.

Physical scene: a creative director at 11:40pm, dim apartment, laptop glow, deciding whether this person can make a brand feel expensive in the browser.

## Color

Strategy: **Committed**. Vermillion carries the energy (cursor, active filters, punctuation, CTA, process progress). Neutrals are indigo-tinted, never pure gray.

| Token | OKLCH | Role |
|---|---|---|
| `--bg` | `oklch(0.125 0.028 285)` | Page field |
| `--bg-elev` | `oklch(0.165 0.030 285)` | Raised surfaces |
| `--bg-soft` | `oklch(0.20 0.032 285)` | Hover fills |
| `--text` | `oklch(0.93 0.018 95)` | Bone primary type |
| `--text-soft` | `oklch(0.72 0.028 280)` | Secondary |
| `--muted` | `oklch(0.58 0.030 280)` | Meta, captions |
| `--line` | `oklch(0.30 0.028 285)` | Hairlines |
| `--accent` | `oklch(0.64 0.21 28)` | Vermillion |
| `--accent-hot` | `oklch(0.72 0.19 35)` | Hover/active |
| `--accent-ink` | `oklch(0.16 0.04 28)` | Text on vermillion |

## Typography

- Display: **Anybody** (variable width + weight). Signature move: width axis as motion material.
- Body: **Schibsted Grotesk**. Nordic news grotesque, sharp, not Inter.
- Scale: fluid display via `clamp()`, ≥1.333 between heading steps. Body 1.05rem / 1.65. Light-on-dark: +0.08 line-height, +0.01em tracking on body.
- All-caps labels: 0.08–0.12em tracking, never for body.

## Layout

Asymmetric, left-weighted. Full-bleed works list (title as row, not cards). Fluid padding `clamp(1.25rem, 4.5vw, 5rem)`. Rhythm: tight clusters, then a large breath before the next idea.

## Elevation

Depth from surface lightness, not drop shadows. Hairline rules. Occasional vermillion fill. Grain overlay at 4% for analog quiet.

## Motion

- Ease: `--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1)`
- Load: 600–900ms staggered type reveal
- UI: 200–300ms
- Press: 100ms
- Scroll-tied hero width; clip-path image bloom; magnetic CTAs; filter FLIP
- `prefers-reduced-motion`: fades only, static width, no cursor, no lerp scroll

## Components

- Nav: transparent, name + four links + availability pill
- Work row: index, title, discipline, year; hover blooms still
- Filters: text buttons, vermillion underline morph
- Process: numbered score, scroll-activated current step
- Form: underlined fields, no boxes, vermillion submit
- Cursor: dot + ring, label "View" on work rows (fine pointer only)
