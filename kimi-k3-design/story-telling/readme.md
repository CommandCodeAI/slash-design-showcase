# Storytelling Landing Page: one prompt, one model

> ### Try this benchmark yourself — with Command Code
> This benchmark was built in one-shot with [`/design`](https://commandcode.ai/docs/slash-commands/design) in [Command Code](https://commandcode.ai).
>
> **How to run this exact benchmark:**
> 1. Install Command Code:
>    ```bash
>    npm i -g command-code
>    ```
>    Quickstart: [commandcode.ai/docs/quickstart](https://commandcode.ai/docs/quickstart) · npm: [command-code](https://www.npmjs.com/package/command-code) · [`/design` command](https://commandcode.ai/docs/slash-commands/design)
> 2. Start Command Code (`cmd` on mac/linux, `cmdc` on windows, or `commandcode` anywhere), then run `/design` and paste the prompt below
> 3. Use Command Code to generate and compare - same prompt, one shot per model
>
> Built with [Command Code](https://x.com/CommandCodeAI)
> Showcase: [CommandCodeAI/slash-design-showcase](https://github.com/CommandCodeAI/slash-design-showcase)
> Docs: [commandcode.ai/docs/slash-commands/design](https://commandcode.ai/docs/slash-commands/design)

## Prompt

Create a cinematic scroll-driven storytelling single-file HTML landing page for an eco-luxury brand "LUNAR". Tailwind CSS.

Full vertical scroll experience:
- Hero: Dramatic full-screen with parallax forest-to-moon transition
- As user scrolls, use Intersection Observer + GSAP (via CDN) for immersive chapter reveals:
  1. The Problem (dark polluted world)
  2. The Journey (transforming scroll sections)
  3. The Solution (3D animated product ecosystem)
  4. Impact (numbers flying in with scroll)

Include subtle 3D elements (Three.js spheres representing earth/moon) that move with scroll. Beautiful typography, nature color palette, very emotional and creative. End with strong CTA. Output full self-contained HTML.

> ⚠️ **Note:** this readme previously had product's (NEXUS Audio) prompt and link pasted in by mistake. The prompt above is the correct one for this build (verified against the actual `index.html`, titled "LUNAR — Luxury in Harmony with the Earth"); the real share link for this conversation wasn't recovered, so none is listed here rather than guessing one.

## Benchmark

| Metric | Kimi K3 |
|---|---|
| Prompts sent | 2 (build + "animation in the back could be more precise while scrolling") |
| Output size (final) | 28,986 bytes / 583 LOC |
| Est. cost, floor (final file only) | ~$0.11 |
| **Est. cost, full session** | **~$0.25** |

Two numbers on purpose. The **floor** is the same formula used for kimi's cost elsewhere in this repo (final kept file's output bytes ÷ 4 × Kimi K3's $15/MTok output price) — it only counts the last file you'd actually keep.

The **full-session estimate** accounts for the second turn: diagnosing why the Three.js earth/moon background felt imprecise while scrolling (a smoothing lerp plus an accumulating spin value that drifted and wasn't reversible), then replacing it with a single large edit — a GSAP-scrubbed timeline mapping sphere position, scale, color, and rotation directly to scroll progress — plus a `node --check` syntax re-verification. No full-file rewrites and no browser-screenshot verification loop were needed, which keeps this one of the lighter full-session premiums in the batch. Modeling total output at ~2.2× the final code's size and input mostly at Kimi K3's cached rate ($0.30/MTok) gives ~$0.25 — a modeled estimate, not a metered bill, but a closer read than the floor above.