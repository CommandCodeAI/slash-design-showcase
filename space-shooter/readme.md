# Space Shooter: one prompt, four models

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
> 3. Use Command Code to generate and compare — same prompt, one shot per model
>
> Built with [Command Code](https://x.com/CommandCodeAI)
> Showcase: [CommandCodeAI/slash-design-showcase](https://github.com/CommandCodeAI/slash-design-showcase)
> Docs: [commandcode.ai/docs/slash-commands/design](https://commandcode.ai/docs/slash-commands/design)
>
> **Seen on X — Game UX Tests (from main README):**
> - [DeepSeek V4 Pro vs GLM 5.2 vs Fable 5](https://x.com/MrAhmadAwais/status/2074536879308026031)
> - [DeepSeek V4 Pro vs GLM 5.2 vs Fable 5](https://x.com/naymur_dev/status/2073059979834331206)
> - [Fable 5 vs GPT-5.5 vs GLM 5.2 vs DeepSeek V4 Pro](https://x.com/naymur_dev/status/2074533456709825022)

## Prompt

> Create a vertical Galaxy Shooter game as a single HTML file using Canvas. Portrait mobile style canvas (400x700). Player controls a cool blue futuristic spaceship at the bottom that moves left and right with arrow keys or on-screen touch buttons. The ship shoots lasers upward automatically or with tap/space. Enemies (colorful alien ships) come down from the top in formations. Destroy enemies and avoid their shots. Add glowing effects, particle explosions, and starfield background that scrolls down. Collect power-ups. Show score at the top, lives (hearts), and level. Include start screen and game over screen with restart. Make it fun, smooth, and visually vibrant like classic vertical shooters. Output only the full code.

## Models

| Model | Dir | Context | $/MTok in/out | LOC | Est. cost |
|---|---|---:|---:|---:|---:|---:|
| Grok 4.5 | `Grok-4.5/` | 500K | $2 / $6 | 1983 | ~$0.09 |
| GPT-5.5 | `GPT-5.5/` | 1.05M | $5 / $30 | 734 | ~$0.11 |
| kimi-k3 | `kimi-k3/` | n/a | n/a (user-reported) | 821 | $0.030 |
| Opus 5 (Claude) | `opus-5/` | 1M | $5 / $25 | 990 | ~$0.24 |
| Fable 5 (Claude) | `Fable-5/` | 1M | $10 / $50 | 982 | ~$0.38 |

## Scorecard

| Model | Spec fidelity | Collision | Polish | Mobile/touch | Mean | Cost | Quality/$ |
|---|:-:|:-:|:-:|:-:|:-:|---:|---:|
| kimi-k3 | 5 | 5 | 5 | 5 | **5.00** | $0.030 | **~167** |
| Grok 4.5 | 5 | 4.5 | 5 | 4.5 | **4.75** | $0.09 | ~53 |
| Opus 5 | 5 | 5 | 4.5 | 4.5 | **4.75** | $0.24 | ~20 |
| Fable 5 | 3 | 5 | 4 | 5 | **4.25** | $0.38 | ~11 |
| GPT-5.5 | 4 | 3.5 | 2 | 3.5 | **3.25** | $0.11 | ~30 |

## Notes

- n=1 per model, no re-rolls. A regeneration could move any of this.
- Only Grok's build was actually played by hand. Fable 5's, GPT-5.5's, kimi-k3's, and Opus 5's builds were checked by reading the code and running a headless smoke test, not by playing them — their Scorecard rows are code-read judgments, not played impressions.
- Opus 5 stays fully on theme (blue futuristic "Neon Vanguard" ship, five enemy/boss archetypes, four formation patterns, procedural Web Audio SFX, five weapon tiers) and uses the same true circle-circle collision test as kimi-k3 and Fable 5 (`opus-5/index.html:493,506,532,542`). Two gaps: it never persists best score — `best` is a plain in-memory variable (`opus-5/index.html:116,325`), reset on reload — and the on-screen FIRE button / tap-to-fire never changes fire rate, since `fire()` runs unconditionally every frame in `update()` (`opus-5/index.html:424`) with no check on `padF` or the fire keys. Auto-fire alone satisfies the prompt's "automatically or with tap/space," so this doesn't cost it on spec fidelity, but the touch fire control is cosmetic.
- Cost for Grok 4.5, GPT-5.5, Opus 5, and Fable 5 is a rough estimate (output bytes divided by 4, times the published output price per token), not billed usage. kimi-k3's cost is user-reported directly, on a different basis than that formula.
