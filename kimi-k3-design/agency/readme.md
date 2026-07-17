# Digital Design Agency: one prompt, one model

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

Design a wildly creative single-file HTML landing page for a digital design studio called "NEON VOID". Tailwind CSS. Hero: Text that distorts and reacts to mouse like liquid metal, with floating 3D abstract shapes (Three.js). Navigation: Creative hamburger that turns into orbiting menu. Sections: - Manifesto with typewriter + scroll reveal - Works grid with magnetic hover + 3D tilt + image distortion on hover - The Process – isometric 3D step illustrations that animate on scroll - Team with creative portrait hover effects - Contact form that feels like a portal Make it bold, experimental, and artistically excellent. Dark mode with vibrant accents. Full self-contained HTML.



https://commandcode.ai/share/c0a67195

## Benchmark

| Metric | Kimi K3 |
|---|---|
| Prompts sent | 3 (build → continue → "remove the neon color") |
| Output size (final) | 60,661 bytes / 1,168 LOC |
| Est. cost, floor (final file only) | ~$0.23 |
| **Est. cost, full session** | **~$0.77** |

Two numbers on purpose. The **floor** is the same formula used for kimi's cost elsewhere in this repo (final kept file's output bytes ÷ 4 × Kimi K3's $15/MTok output price) — it only counts the last file you'd actually keep.

The **full-session estimate** reflects what this build actually involved, read back from the real conversation: the initial `--continue` turn carried an unusually long upfront reasoning pass before any code was written — full GLSL shader derivations for the liquid-metal text displacement, trigonometric proofs for the isometric cube-face geometry, and a full plan for every section — plus two rounds of self-verification (extracting the inline JS and running `node --check`, then an HTMLParser tag-balance check). The recolor turn added another long reasoning pass (enumerating every neon color site across CSS/JS/HTML into a 66-rule palette swap) followed by a bulk Python replacement script, a grep-based verification pass that caught 3 missed spots, and 3 small follow-up edits to patch them. No full-file rewrites were needed at any point — the build succeeded first-try and the recolor was a targeted script rather than model-regenerated output — so the multiplier lands well below minecraft's, but the sheer reasoning volume pushes it above 3d-portfolio's. Modeling total output at ~3.3× the final code's size and input mostly at Kimi K3's cached rate ($0.30/MTok) gives ~$0.77 — a modeled estimate, not a metered bill, but a much closer read than the floor above.