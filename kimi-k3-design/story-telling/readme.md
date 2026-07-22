# Storytelling Landing Page: one prompt, two models

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

Both builds below are treated as a single **one-shot** generation from the prompt above — one call, no re-rolls, no follow-up prompts, no iteration.

| Model | Dir | $/MTok in/out | LOC | Output size | Est. cost (one-shot) |
|---|---|---:|---:|---:|---:|
| Fable 5 (Claude) | `fable-5/` | $10 / $50 | 548 | 28,032 bytes | **~$0.35** |
| Kimi K3 (Moonshot) | `kimi-k3/` | $3 / $15 | 583 | 28,986 bytes | **~$0.11** |

Cost uses the same floor formula as the rest of this repo's one-shot builds (chrome-dino, third-view-car-game, etc.): kept file's output bytes ÷ 4 (a rough byte→token approximation) × the model's published output price per MTok. Input is just the ~180-token prompt above plus `/design` overhead — at $10/MTok (Fable 5) and $3/MTok (Kimi K3) that's well under a cent either way, so it doesn't move the total:

- **Fable 5:** 28,032 bytes ÷ 4 ≈ 7,008 output tokens × $50/MTok = **$0.35**
- **Kimi K3:** 28,986 bytes ÷ 4 ≈ 7,247 output tokens × $15/MTok = **$0.11**

### Why the ~3.2× cost gap, despite near-identical output size

The two files are within 3% of each other in raw size — 548 vs. 583 LOC, 28,032 vs. 28,986 bytes. Kimi K3 actually wrote slightly *more* code. The entire cost gap is priced in, not written in: Fable 5's output rate ($50/MTok) is 3.33× Kimi K3's ($15/MTok), almost exactly matching the ~3.2× gap in estimated cost. Input pricing tells the same story in miniature — Fable 5 is $10/MTok vs. Kimi K3's $3/MTok, a 3.33× spread again — but at a ~180-token prompt, that difference is under $0.002 either way and rounds away against the output cost.

**Caveats on this estimate (read before treating it as a bill):**
- It's a **floor**, not a metered figure — it only counts the tokens in the final file you'd keep. Any hidden reasoning/thinking tokens the model billed on the way to that output aren't visible here and aren't counted.
- **Bytes ÷ 4 is an approximation**, not a real tokenizer count — actual token counts for dense HTML/CSS/JS (lots of punctuation, short attribute names, repeated class strings) can differ from plain prose at the same byte count. A `client.messages.count_tokens()` call against the real prompt + output would be the accurate version of this number; this estimate is a stand-in for when that isn't available.
- If either build in practice took more than one prompt to reach the kept file, the real cost is higher than shown here — this section assumes the one-shot premise holds for both.

## What the code shows

Both builds independently converged on the same overall structure — Tailwind (CDN) + GSAP/ScrollTrigger (CDN) + Three.js r128 (CDN) for a persistent scroll-linked moon/earth, five chapters (Hero → Problem → Journey → Solution → Impact/CTA), IntersectionObserver-driven text reveals, and animated stat counters — despite the prompt not dictating any of that specific stack pairing.

- **Three.js scene complexity:** Fable 5 keeps it minimal — a single displaced-vertex moon sphere, a small flat-shaded earth, and a 400-point starfield, all solid-color `MeshStandardMaterial` (`fable-5/index.html:452-479`). Kimi K3 goes further, hand-painting canvas textures for both bodies via a `makeTexture()` helper (continent blobs and cloud wisps for earth, crater speckling for the moon) plus additive-blending sprite glows behind each (`kimi-k3/index.html:469-527`) — more visual fidelity per body, at the cost of more code.
- **Scroll-to-3D binding:** Fable 5 samples a hand-authored 6-waypoint path keyed to overall scroll progress with a smoothstep interpolant (`fable-5/index.html:492-513`), driving position/scale/color every animation frame. Kimi K3 instead builds a single GSAP timeline (`cosmos = gsap.timeline(...)`) with `scrollTrigger: {scrub: 0.45}` and explicit `.to()` keyframes for earth/moon position, scale, and color (`kimi-k3/index.html:539-560`) — same intent (moon/earth position mapped to scroll), different mechanism (manual sampling function vs. GSAP-owned timeline scrubbing).
- **Reduced-motion handling:** both respect `prefers-reduced-motion`, but Fable 5 hides the Three.js canvas outright (`#cosmos{display:none}`, `fable-5/index.html:96`) while Kimi K3 keeps the canvas and cosmos timeline running, just with `scrub: true` instead of a scrubbed float and static counter values (`kimi-k3/index.html:389-392, 545`) — Fable 5's approach is the safer one for genuinely motion-sensitive users.
- **Accessibility/nav extras:** Kimi K3 adds a fixed side dot-nav tied to active chapter (`kimi-k3/index.html:171-178`), `aria-label`s on decorative SVGs/canvas, and a `focus-visible` outline style (`kimi-k3/index.html:58-61`) — none of which Fable 5 includes. Fable 5's markup is comparatively leaner (no dot-nav, no focus-visible styling, no `aria-hidden` on decorative layers).
- Neither ships a Content Security Policy or subresource integrity hashes on the three CDN `<script>` tags (Tailwind, GSAP ×2, Three.js) — expected for a single-file demo, but worth flagging if either were promoted past a showcase.

Net: Kimi K3 wrote ~6% more code and spent it on extra visual/accessibility polish (textured 3D bodies, dot-nav, focus states); Fable 5 is leaner and slightly more conservative under reduced-motion. Neither is a strictly better implementation of the brief — the extra Kimi K3 code doesn't change the estimated cost story above, which is driven by per-token pricing, not code volume.