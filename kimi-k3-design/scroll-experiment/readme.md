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

## Models

| Model | Dir | LOC | Est. cost |
|---|---|---:|---:|
| Kimi K3 | `kimi-k3/` | 960 | ~$0.24* |
| Opus 5 | `opus-5/` | 1,277 | ~$0.37 |
| qwen3.8-max | `qwen3.8-max/` | 1,205 | ~$0.065 |

One prompt-thread per model, no re-rolls. Kimi K3 sent 3 prompts (build → continue → "scroll feels jumpy, make it smooth"); Opus 5 and qwen3.8-max were each a single `/design` invocation.

\* Kimi K3's ~$0.24 is a full-session estimate, not just the final file (the floor alone is ~$0.15). It's modeled from what actually happened in the conversation — a long upfront reasoning pass on the `--continue` turn, then a later turn that diagnosed and fixed the jumpy scroll — at Kimi K3's $15/MTok output / $0.30/MTok cached-input rates. Modeled, not metered.

Opus 5's ~$0.37 is a straight floor from its single one-shot generation (59,494 bytes ÷ 4 × $25/MTok) — no follow-up turns, so floor and full-session are the same number.

† qwen3.8-max's ~$0.04 is a floor only (56,230 bytes ÷ 4 × the repo-implied ~$2.91/MTok output rate) and isn't comparable to the two figures above. This repo's one actually-metered qwen3.8-max `/design` run, `creative-portfolio/qwen3.8-max`, billed a real $6.70 for a similarly-sized file — driven by call count and accumulated input context (35 API calls, 2.7M input tokens, mostly cache reads), not by output size. This build's own call count wasn't logged, so treat ~$0.04 as a lower bound, not the real cost.

**On the numbers that are actually comparable, Kimi K3 wins on cost**: ~$0.24 vs Opus 5's ~$0.37, while shipping a leaner file (960 LOC / 40.7KB vs 1,277 LOC / 59.5KB) at a lower per-byte output rate ($15/MTok vs $25/MTok) for the same brief.