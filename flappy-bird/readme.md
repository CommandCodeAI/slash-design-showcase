# Flappy Bird: one prompt, three models

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

> Create a complete single HTML file for a cute Flappy Bird style game using Canvas. Smooth gravity, flapping animation, parallax background, score, pipe obstacles, game over screen

## Models

| Model | Dir | Cost/gen | LOC (light / dark) |
|---|---|---:|---:|
| Fable 5 (Claude) | `claude/` | $0.4200 | 641 / 927 |
| GLM 5.2 | `glm/` | $0.0480 | 799 / 839 |
| DeepSeek | `deepseek/` | $0.0008 | 748 / 876 |

Each model produced a `light-version` and a later `dark-version`. Cost is per generation, as reported by the user; not independently metered.

## Method

**Static read:** all 4,830 lines read directly, no skimming. Every claim below is cited by file and line number.

**Manual playtest:** each of the six versions was actually played, not just read: flapping with both the Space/Arrow keys and tap/click, deliberately flying into pipes and into the ground to trigger death, running the restart flow, and checking how each one behaves when the browser window is resized.

**Automated crash check:** an attempt was made to drive all six through real headless Chrome (`agent-browser`), which failed in this sandbox (missing `libasound.so.2`, no passwordless `sudo`). As a fallback, a Node `vm` shim (stubbed `window`/`canvas`/`localStorage`/`requestAnimationFrame`) executed each file's actual script through 600 simulated frames of play, and counted canvas calls as a rendering-cost proxy. All six ran clean: 0 load errors, 0 runtime exceptions. This only proves the logic doesn't crash; it isn't a substitute for the manual playtest above.

## Findings

- **`dark-version` is a reskin, not a fresh sample.** All physics constants (gravity, flap velocity, gap, pipe width, speed) are byte-identical light↔dark for all three models. Whole-file text similarity: Fable5 76.5%, DeepSeek 61.3%, GLM 39.8% (GLM rewrote the most rendering code while touching the least game logic).
- **Collision math, ranked by actual correctness:** GLM (`glm/index.html:294-299`, both versions) does a textbook clamped circle-vs-rect distance test, the only exact implementation. Fable5 (`claude/index.html:285-292`) approximates the circle as an inscribed, shrunk AABB (cheap and fine). DeepSeek (`deepseek/index.html:221-234`) uses the bird's full visual bounding box with no forgiveness margin: correct, but the least tuned.
- **Confirmed bug, DeepSeek (both versions):** canvas backing store is fixed at 420×640 (`index.html:68-70`), no `resize` listener anywhere, but its own CSS switches the wrapper to `100vw/100dvh` under 440px width. Any modern phone (aspect ≈0.46) stretches the fixed 0.656-aspect canvas non-uniformly. GLM and Fable5 both letterbox correctly on resize.
- **Perf smell, DeepSeek dark only:** `drawCitySilhouette()` recomputes a per-window lit/unlit trig pattern with a nested pixel loop every frame instead of caching it, measured at 817 draw calls/frame vs. 496-603 for everything else.
- **Only GLM shipped audio**, synthesized in-code via `AudioContext` oscillators, plus a mute button and medal tiers. Only Fable5 shipped adaptive difficulty (speed ramps with score). Fable5 never persists best score (only the day/night theme choice is saved); DeepSeek and GLM both do via `localStorage`.
- Fable5 and GLM both pull a Google Fonts stylesheet over the network; DeepSeek is the only fully offline-safe file of the three.

## Scorecard

1–5 per axis, averaged across light+dark since both share the same underlying engine.

| Model | Spec/cute | Collision | Architecture | Resize robustness | Polish | Offline-safe | **Mean** | Cost | **Quality/$** |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|---:|---:|
| GLM 5.2 | 5 | 5 | 5 | 5 | 5 | 4 | **4.83** | $0.0480 | ~101 |
| Fable 5 | 5 | 4 | 5 | 5 | 3.5 | 4 | **4.42** | $0.4200 | ~10.5 |
| DeepSeek | 4 | 3 | 3.5 | 2 | 4 | 5 | **3.58** | $0.0008 | **~4,475** |

## Verdict

On quality alone: **GLM > Fable 5 > DeepSeek**, decided mainly by GLM's exact collision math and its unprompted audio system. But price collapses that ordering: DeepSeek is 60x cheaper than GLM and 525x cheaper than Fable 5, while landing at 74% of GLM's quality score and 81% of Fable 5's. Its one real defect (the resize bug) is a five-minute fix, not a design flaw. If the axis is quality-per-dollar, DeepSeek wins by almost two orders of magnitude; if the axis is best game with no budget constraint, GLM wins outright; Fable 5 is the most expensive of the three and isn't first on any axis except tied polish.

## Limitations

- n=1 per model, no re-rolls, no variance estimate. A single regeneration could move any score.
- The Node `vm` shim proves the logic runs; it isn't a real browser, so nothing here confirms actual frame pacing, touch input, or that GLM's audio truly plays.
- "Spec/cute" and "Polish" are disclosed aesthetic judgment, not measurements, unlike the collision-math and resize findings, which are.
