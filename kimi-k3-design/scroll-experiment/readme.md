# Scroll-Driven Experimental Portfolio: one prompt, two models

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

Create the most creative experimental single-file HTML landing page for a multidisciplinary artist "Kael Thorn". Tailwind + Three.js. Full-page scroll journey where each section is a different "dimension": - 2D → 3D transition on scroll - Hero with massive 3D text that breaks apart into particles on scroll - Interactive timeline where scrolling warps space - Portfolio pieces as floating 3D cubes you can spin - Philosophy section with text that assembles from fragments - Final portal-like contact Push creativity to the maximum. Surreal, immersive, mind-bending design. Dark cosmic theme. Output the full HTML file.

https://commandcode.ai/share/15f62a1d

## Benchmark

| Metric | Kimi K3 | Opus 5 |
|---|---|---|
| Dir | `kimi-k3/` | `opus-5/` |
| $/MTok in/out | n/a (user-reported) | $5 / $25 |
| Prompts sent | 3 (build → continue → "scroll feels jumpy, make it smooth") | 1 (one-shot) |
| Output size (final) | 40,734 bytes / 960 LOC | 59,494 bytes / 1,277 LOC |
| Est. cost, floor (final file only) | ~$0.15 | ~$0.37 |
| **Est. cost, full session** | **~$0.24** | **~$0.37** |

Two numbers on purpose for Kimi K3. The **floor** is the same formula used for kimi's cost elsewhere in this repo (final kept file's output bytes ÷ 4 × Kimi K3's $15/MTok output price) — it only counts the last file you'd actually keep. Opus 5's build was a single one-shot generation with no follow-up turns, so its floor and full-session cost are the same figure: final output bytes ÷ 4 × Opus 5's $25/MTok output price (~$0.37) — a modeled estimate from output size, not a metered bill.

The Kimi K3 **full-session estimate** reflects what actually happened, read back from the real conversation: the `--continue` turn carried an unusually long upfront reasoning pass working out the six-"dimension" camera-depth math, custom GLSL shaders for the particle text and the portal, and procedural cube-face textures, before the single large `write_file` (the JS alone ran to ~27,500 characters) and a `node --check` syntax verification. No full-file rewrites and no browser-screenshot verification loop were needed here (unlike some of the other builds) — the fix turn diagnosed the jumpy scroll as a mismatch between stepped native wheel input and the lerped 3D camera, then applied 3 small targeted edits (adding Lenis smooth-scroll and retuning the lerp) with another syntax check. Modeling total output at ~1.5× the final code's size and input mostly at Kimi K3's cached rate ($0.30/MTok) gives ~$0.24 — a modeled estimate, not a metered bill, but a much closer read than the floor above.

**Kimi K3 wins on cost**: even counting the full three-prompt session — build, continue, and the jumpy-scroll fix pass — Kimi K3 lands at ~$0.24, about a third less than Opus 5's single one-shot cost of ~$0.37. On the apples-to-apples "final file" floor the gap is wider still (~$0.15 vs ~$0.37, under half the price), and Kimi K3 ships a leaner file (960 LOC / 40.7KB vs 1,277 LOC / 59.5KB) at a lower per-byte output rate ($15/MTok vs $25/MTok) for the same brief.