# Brick Breaking: one prompt, four models

> ### 🚀 Try this benchmark yourself — with Command Code
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

> Create a complete single HTML file for a neon breakout / brick breaker game using Canvas. Neon cyberpunk aesthetic with glowing bricks, mouse or touch to move paddle, ball with trail effect, particle explosions on brick break, score, lives, start and game over screens. Make it visually striking with glow effects and smooth gameplay. Output only the full code.

## Models

| Model | Dir | Cost/gen | LOC |
|---|---|---:|---:|
| DeepSeek V4 Pro | `DeepSeek-V4-Pro/` | est. $0.0017 | 575 |
| Fable 5 (Claude) | `Fable-5/` | est. $0.60 | 513 |
| GLM 5.2 | `GLM-5.2/` | est. $0.03 | 592 |
| GPT-5.5 | `GPT-5.5/` | est. $0.35 | 400 |

Single generation per model, one prompt, no re-rolls. Cost figures are estimates from published API pricing applied to output length plus `/design` overhead.

## Method

Same benchmark harness as the other game benchmarks: one prompt, one shot per model, static read + playtest comparison.

## Verdict

Four implementations of the same neon breakout brief. Same pattern as the other game benchmarks: try the same prompt yourself with [Command Code](https://commandcode.ai) `/design` — [commandcode.ai/docs/slash-commands/design](https://commandcode.ai/docs/slash-commands/design) — and compare.

## How to Play

- Move mouse to control paddle
- Click to launch ball / start / continue
- Break all bricks to win, don't let the ball fall

All demos are fully offline-safe, single HTML files.
