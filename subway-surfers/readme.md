# Subway Surfers: one prompt, four models

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

## Prompt

> Create a fun endless runner game like Subway Surfers as a single HTML file using Canvas. Vertical canvas (400x700 or similar portrait mode), character runs automatically forward, swipe or space to jump, down arrow to slide. Collect coins, avoid obstacles like barriers and trains. Nice colorful city visuals with scrolling background, score based on distance, game over screen with restart. Keep it simple but visually appealing. Output only the full code.

## Models

| Model | Dir | Cost/gen | LOC |
|---|---|---:|---:|
| Fable 5 (Claude) | `Fable-5/` | $0.6000 | 672 |
| GPT-5.5 (ChatGPT) | `GPT-5.5/` | $0.7000 | 1423 |
| GPT-5.6 Sol (OpenAI) | `GPT-5.6-sol/` | $0.9000 | 1501 |
| Grok 4.5 (xAI) | `Grok-4.5/` | $0.4000 | 1326 |

Single generation per model, one prompt, no re-rolls. Cost figures are **not metered**: Fable 5 reuses the user-reported cost from the pixel-art-space-shooter benchmark; the others are rough estimates from published API pricing (GPT-5.5 and GPT-5.6 Sol at OpenAI rates, Grok 4.5 at $2/$6 per 1M tokens) applied to each file's output length plus `/design` overhead. Treat as approximate.

## Method

**Static read:** all 4,922 lines read directly, no skimming. Every claim below is cited by file and line number.

**No browser or `vm` playtest this round.** Unlike the flappy-bird benchmark (manual playtest + Node `vm` frame sim) and the pixel-art-space-shooter benchmark (`vm` smoke test), these four were not run in a real browser or a headless shim. Findings on collision, resize, audio, and persistence are read directly from source, not observed through play. Treat them as static-analysis findings, not gameplay reports.

## Findings

- **All four collision systems are correct; no gameplay-breaking gap.** None ships a broken hit model (unlike the space-shooter benchmark where DeepSeek's cave walls were non-lethal). Two families: lane-snap + height-threshold (Fable 5 `Fable-5/index.html:251`, Grok 4.5 `Grok-4.5/index.html:404`) and box/depth-window AABB (GPT-5.5 `GPT-5.5/index.html:556-557`, GPT-5.6 Sol `GPT-5.6-sol/index.html:489`). All four correctly require jumping barriers, sliding signs, and lane-switching trains.
- **Only GPT-5.6 Sol persists the best score** via `localStorage` (`GPT-5.6-sol/index.html:118,316`). Fable 5 (`Fable-5/index.html:206`) and Grok 4.5 (`Grok-4.5/index.html:282`) only keep `best` in memory, so it resets on reload. GPT-5.5 tracks no best score at all. Notably Grok 4.5 *did* persist (and exposed a mute toggle) in the space-shooter benchmark but dropped both here, a per-generation regression.
- **Audio splits 2-2: the non-GPT models ship it, the GPT models don't.** Fable 5 synthesizes 3 SFX (`Fable-5/index.html:47`); Grok 4.5 ships 5 (`Grok-4.5/index.html:77`). Neither GPT constructs an `AudioContext`. None of the four exposes a mute toggle, a step back from GLM/Grok in prior benchmarks.
- **Only GPT-5.6 Sol runs a real resize listener** (`GPT-5.6-sol/index.html:1494`) that preserves 400:700 aspect. The other three are CSS-only: Fable 5 and Grok 4.5 cap a fixed 400×700 canvas via `max-width/max-height`; GPT-5.5 stretches its backing store on any phone whose aspect drifts from 4:7, the weakest resize of the four.
- **Grok 4.5 has the richest game feel:** variable gravity (`Grok-4.5/index.html:107,331`), a jointed-limb character with bending knees/elbows across three poses (`drawLimb`, `Grok-4.5/index.html:866`), landing squash, camera bob, and speed lines. It also polyfills `roundRect` for older browsers (`Grok-4.5/index.html:42-43`).
- **GPT-5.6 Sol has the cleanest architecture and the only curved road** via a `STATE` enum, full helper layer, and a `worldToScreen()` that bends the track with a sine of distance. GPT-5.5 is the only one with on-screen touch buttons, but at 1,423 LOC it ships the fewest features and no DPR handling. All four are fully offline-safe (system fonts only, no network requests).

## Scorecard

1–5 per axis, single sample per model (no re-rolls).

| Model | Spec fidelity | Collision | Architecture | Resize robustness | Polish | Offline-safe | **Mean** | Cost | **Quality/$** |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|---:|---:|
| GPT-5.6 Sol | 5 | 4 | 5 | 5 | 4.5 | 5 | **4.75** | $0.9000 | ~5.3 |
| Grok 4.5 | 5 | 4 | 4.5 | 3.5 | 5 | 5 | **4.50** | $0.4000 | ~11.3 |
| Fable 5 | 5 | 4 | 4.5 | 3.5 | 4 | 5 | **4.33** | $0.6000 | ~7.2 |
| GPT-5.5 | 5 | 4 | 3.5 | 3 | 4 | 5 | **4.08** | $0.7000 | ~5.8 |

## Verdict

On quality alone: **GPT-5.6 Sol > Grok 4.5 > Fable 5 > GPT-5.5**. GPT-5.6 Sol wins outright: the only file that persists best score, has a real aspect-preserving resize handler, and a genuinely curved road, plus the cleanest structure. Grok 4.5 is a close second on the strength of its *feel* (variable gravity, jointed-limb character, 5 SFX, richest atmosphere) but gives back the persistence and resize advantages. Fable 5 is the concise pick: 672 LOC, correct everywhere, audio included, but a simpler character and no persistence. GPT-5.5 lands last: the most verbose output yet the fewest features (no audio, no best score, no DPR, weakest resize); its one unique plus is on-screen touch buttons.

Price reshuffles the order hard. Grok 4.5's ~$0.40 buys 95% of GPT-5.6 Sol's quality at less than half the cost (quality-per-dollar ~11.3 vs ~5.3), making it the clear value pick. Fable 5 is the efficient middle: solid 4.33 quality at ~$0.60 (~7.2 quality/$) and the least code to audit. GPT-5.6 Sol is the best game with no budget constraint, but at ~$0.90 it's still the most expensive generation here and the worst value. GPT-5.5 (~$0.70, ~5.8 quality/$) is dominated on every axis except its mobile touch buttons. If the axis is quality-per-dollar, **Grok 4.5** wins; if it's best game regardless of cost, **GPT-5.6 Sol** wins; if it's the most efficient correct result, **Fable 5** wins.

## Limitations

- n=1 per model, no re-rolls, no variance estimate. A single regeneration could move any score.
- No real browser playtest or Node `vm` frame simulation was run this round, only a static code read. Nothing here confirms actual frame pacing, touch/swipe feel, that the audio truly plays, or how the four games feel to play. Collision and resize findings are read from source, not observed through play.
- Cost figures are not metered. Fable 5 reuses a user-reported cost from a prior benchmark; the others are estimates from published per-token API pricing applied to output length. The Quality/$ column inherits this uncertainty; treat the value rankings as approximate.
- "Spec fidelity" and "Polish" are disclosed aesthetic/completeness judgment, not measurements, unlike the collision, persistence, resize, and offline-safety findings, which are read directly from source.
