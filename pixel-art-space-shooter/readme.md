# Pixel Art Space Shooter: one prompt, five models

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

> Create a retro pixel art horizontal space shooter game like Emberwing as a single HTML file using Canvas. Vertical or wide canvas, small orange spaceship that can move up, down, left, right. Smooth movement with slight inertia. Shoot with spacebar, collect glowing blue gems for points, avoid obstacles. Starry black background with scrolling cave walls (top and bottom). Simple enemies or obstacles, score display, lives, game over screen. Classic 8-bit/16-bit pixel style with nice glow effects on gems and ship thrusters. Output only the full code.

## Models

| Model | Dir | Cost/gen | LOC |
|---|---|---:|---:|
| Grok 4.5 | `Grok-4.5/` | $0.2000 | 2,087 |
| Fable 5 (Claude) | `claude/` | $0.6500 | 724 |
| GPT-5.6 Sol (OpenAI) | `GPT-5.6-sol/` | $0.4500 | 860 |
| GPT-5.5 (ChatGPT) | `chatgpt/` | $0.3500 | 468 |
| GLM 5.2 | `glm/` | $0.0300 | 514 |
| DeepSeek V4 Pro | `deepseek/` | $0.00017 | 961 |
| Kimi K3 | `Kimi-K3/` | $0.1500 | 776 |

Single generation per model, one prompt, no re-rolls. Cost is per generation, as reported by the user; not independently metered.

**GPT-5.6 Sol's $0.4500 is user-reported**, same basis as the other reported figures in this table. For reference, the computed floor (kept file's output bytes ÷ 4 × its published $30.00/MTok output rate) is $0.2075 — `GPT-5.6-sol/index.html` is 860 LOC / 27,670 bytes → 6,918 tokens × $30/MTok. The real figure landing at roughly 2.2x the floor is in line with GPT-5.5, the one other model in this table where both numbers exist for the same build: its floor is $0.1020 (468 LOC / 13,596 bytes) against a real reported $0.3500, a 3.4x gap. Floors only count the kept file's output tokens and skip reasoning and input tokens entirely, so real bills consistently landing above them is expected, not a red flag.20
## Method

**Static read:** all 4,754 lines read directly, no skimming. Every claim below is cited by file and line number.

**Automated smoke test:** headless-browser testing wasn't available in this sandbox, so each file's `<script>` was extracted and run through a Node `vm` shim (stubbed `window`/`document`/`canvas` 2D context/`localStorage`/`AudioContext`/`requestAnimationFrame`) for 600 simulated frames, toggling simulated arrow-key/space/enter input to exercise movement, shooting, and restart paths. All five loaded and ran with 0 exceptions. Canvas draw calls were counted per file as a rendering-cost proxy.

**No manual browser playtest this round** — unlike the flappy-bird benchmark, these five were not actually played in a real browser. Findings on collision correctness and missing hazards below are read directly from the collision code, not observed through play; treat them as static-analysis findings, not gameplay reports.

## Findings

- **New winner, Grok 4.5 — the most complete game in the set.** Grok 4.5 ships features no other model here attempted: a player **health bar** (the prompt's "lives" fulfilled as a regenerable-value meter rather than discrete lives), **increasing bullet count** that scales with progression, a **boss fight** with a **cinematic intro view** when the boss appears, and **leveling-up mechanics** that gate the bullet/power progression. At 2,087 lines it's the largest file by far, and it folds in audio, persistence, and enemy return-fire that only GLM otherwise had. For $0.20 it's the clear quality standout: "everything a space-shooter game should have."
- **Confirmed gameplay-breaking gap, DeepSeek:** the cave walls are purely decorative. `caveSegments` (`deepseek/index.html:121-154`) drive rendering and gem/enemy/obstacle spawn placement only — nowhere in `update()` is the player checked against `seg.topH`/`seg.botY`. The player's vertical position is clamped only to the screen (`deepseek/index.html:611-612`, `H - player.h/2 - 30`), not to the cave geometry. A player can fly straight through the scrolling walls that the prompt explicitly calls out ("scrolling cave walls... avoid obstacles"), and that all three other models treat as a lethal hazard. This is a bigger defect than a cosmetic bug: it removes the core cave-navigation mechanic the reference game (Emberwing) is built around. DeepSeek does still have separately-collidable floating asteroids (`spawnObstacle`, `deepseek/index.html:184-204`, circle-rect tested at `233-239`), so "avoid obstacles" isn't 100% unmet, just the cave-wall half of it.
- **Confirmed bug, DeepSeek — zero resize handling.** Canvas is fixed at 960×540 with explicit pixel-sized CSS (`canvas.style.width = W + 'px'`, `deepseek/index.html:59-60`) and no `resize` listener anywhere in the file. On any viewport narrower than 960px the canvas will overflow/clip since the body only does flex-centering with `overflow: hidden`. GLM and Fable5 both actively rescale on `resize` (`glm/index.html:504-508`, `claude/index.html:69-78`); ChatGPT sidesteps the problem entirely with a CSS-only `width: min(96vw, 900px); height: auto` (`chatgpt/index.html:28-29`), which rescales without any JS.
- **Confirmed double-friction quirk, DeepSeek.** `player.vx/vy *= player.friction` (0.92) runs unconditionally every frame (`deepseek/index.html:602-603`), then a second block multiplies by an extra 0.96 on any axis with no key held (`615-620`). An axis under active input decelerates at 0.92/frame; the same axis idle decelerates at 0.92×0.96≈0.88/frame — an asymmetry with no comment explaining it, reading like leftover/duplicated logic rather than a deliberate tuning choice.
- **Cave collision, ranked by sophistication:** GLM (`glm/index.html:255-261`) samples three x-points ahead of the ship, computes max-ceiling/min-floor, and does positional correction (`player.y += maxCeil - top`) plus velocity zeroing — the ship visibly can't clip into rock. Fable5 (`claude/index.html:404-412`) samples two points and triggers a hit but doesn't push the ship back out. ChatGPT (`chatgpt/index.html:267-269`) checks a single nearest-terrain-point lookup (`getCaveHeight`, `159-164`) rather than interpolating between the two neighboring cave points, so there's a small approximation error at segment boundaries. DeepSeek has no cave collision at all (see above).
- **Entity-vs-entity collision, ranked by exactness:** GLM does true circle-circle distance-squared math for bullets-vs-asteroids (`glm/index.html:281-282`, `(b.x-a.x)**2+(b.y-a.y)**2<(a.r+4)**2`) and DeepSeek does an exact clamped circle-vs-rect test for bullets/player-vs-obstacles (`circleRect`, `deepseek/index.html:233-239`) — both textbook-correct. Everyone's enemy/gem/bullet-vs-ship checks otherwise fall back to `Math.abs(dx) < r` box approximations (all five files), which is standard and fine for arcade-feel hitboxes.
- **Only GLM (of the original four) shipped audio, persistence, and enemies that shoot back; Grok 4.5 now matches and extends this.** `blip()` synthesizes square/sine/sawtooth oscillator SFX via `AudioContext` for shooting, hits, and gem pickups (`glm/index.html:154-165`), with a mute toggle (`M` key) and pause (`P` key, `glm/index.html:143`). It's also the only file among the original four that actually persists a high score across reloads via `localStorage.setItem('emberwing_hi', ...)` (`glm/index.html:117, 275`) — Fable5 tracks a `best` variable (`claude/index.html:126, 452`) but never writes it to storage, so it resets on every reload. GLM's `spawnEnemy`/`enemyShoot` (`glm/index.html:185-189, 218-222`) is the only enemy AI among the original four that fires projectiles back at the player; the other three models' enemies are movement-only hazards. Grok 4.5 ships the same trio (audio, persistence, return-fire) plus the progression/boss layer noted above.
- **Perf smell, GLM.** The draw-call proxy shows GLM at ~3,613 `fillRect` calls/frame vs. ChatGPT's ~143, DeepSeek's ~501, and Fable5's ~883. The bulk comes from `drawCave()` (`glm/index.html:341-351`), which recomputes the entire visible cave wall from scratch every frame via a 2px-step loop across the full canvas width (≈400 iterations × 6 `fillRect` calls each) instead of caching/recycling terrain like Fable5's column-array approach or ChatGPT's. GLM's `caveAt()` is the most elegant *math* (a closed-form sum of sines plus a deterministic hash-based spike profile, `glm/index.html:91-113`, no array bookkeeping needed) but that elegance is currently paired with the least cached *rendering* of the four.
- **Offline-safety flipped from the flappy-bird benchmark.** There, DeepSeek was the only fully offline-safe file. Here, DeepSeek (`@import` Google Fonts, `deepseek/index.html:8`) and GLM (`<link>` Google Fonts, `glm/index.html:7-9`) both pull "Press Start 2P" over the network, while ChatGPT (system "Courier New") and Fable5 (generic monospace + a hand-rolled 3×5 bitmap font, `claude/index.html:601-627`) are fully offline-safe.
- **Fable5 and GLM both independently named their game "EMBERWING"** — the same title the prompt used as a style reference — despite the prompt asking for original output, not a literal reference to the named game. Worth noting as a mild spec-literalism artifact, not a defect.

## Scorecard

1–5 per axis, single sample per model (no re-rolls).

| Model | Spec fidelity | Collision | Architecture | Resize robustness | Polish | Offline-safe | **Mean** | Cost | **Quality/$** |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|---:|---:|
| Grok 4.5 | 5 | 5 | 5 | 4 | 5 | 5 | **4.83** | $0.2000 | ~24.2 |
| GPT-5.6 Sol | 5 | 4 | 5 | 5 | 5 | 5 | **4.83** | $0.4500 | ~10.7 |
| Fable 5 | 5 | 3.5 | 5 | 5 | 4.5 | 5 | **4.67** | $0.6500 | ~7.2 |
| GPT-5.5 | 5 | 4 | 4 | 5 | 3 | 5 | **4.33** | $0.3500 | ~12.4 |
| GLM 5.2 | 5 | 4.5 | 5 | 4.5 | 5 | 2 | **4.33** | $0.0300 | ~144.3 |
| DeepSeek V4 Pro | 3.5 | 2 | 3.5 | 1 | 3.5 | 2 | **2.58** | $0.00017 | ~15176 |

**GPT-5.6 Sol ties Grok 4.5 on quality (4.83) reading the code directly:** true delta-time physics with clamped frame timing and diagonal-input normalization (`GPT-5.6-sol/index.html:305-319,832-834`) — GPT-5.5 has neither, so its diagonal movement is ~41% faster than cardinal, a real bug (`chatgpt/index.html:203-211`); an O(1) modulo-indexed cave lookup (`GPT-5.6-sol/index.html:265-271`) versus GPT-5.5's O(n) linear nearest-point scan, the same approximation-prone function flagged elsewhere in this readme's Findings (`chatgpt/index.html:159-164`); `localStorage` high-score persistence (`:61,463-464`, absent in GPT-5.5); time-based difficulty scaling driving enemy speed, spawn rate, and cave gap (`:480` feeding `:208,223,235,283`, absent in GPT-5.5); three enemy types (`:197-241`) versus GPT-5.5's two (`chatgpt/index.html:137-151`); scanlines, hit-flash, and gradient-shaded cave walls (`:796-802,451,824-827,542-563`, none present in GPT-5.5); and a `blur` handler that clears stuck keys on alt-tab (`:851-853`, missing in GPT-5.5). Collision scores 4, not 5, because like GPT-5.5 it resets the player to a checkpoint on hit rather than pushing them out of the wall (GLM and Fable5's approach) — fine for a discrete-lives game, just not best-in-class.

At its real reported cost of $0.4500, Quality/$ comes out to ~10.7 — below Grok 4.5's ~24.2 despite the tied quality score, so Grok remains the better value between the two even though they play at the same level.

## Verdict

On quality alone: **Grok 4.5** and **GPT-5.6 Sol** now tie for the best game in the set, both edging out **Fable 5**, which previously led a **GPT-5.5 / GLM 5.2 tie**, with **DeepSeek V4 Pro** trailing clearly. Grok 4.5 wins by shipping the only full progression loop in the set — health, scaling bullet count, leveling-up mechanics, and a boss fight with a cinematic intro view. GPT-5.6 Sol doesn't have a progression/boss layer, but it's the only build here with true frame-rate-independent physics, the only one that fixes GPT-5.5's diagonal-speed bug, and it pairs high-score persistence with a genuinely more polished presentation (scanlines, hit-flash, gradient cave walls) than any model except Grok. It combines the feature breadth GLM brought (persistence, enemies with real progression-driven behavior) with a clean architecture and none of GLM's network-font leak, making it a co-best game here with no real weakness beyond checkpoint-reset collision (not push-out). Fable5 remains the runner-up on the strength of its cleanest architecture (virtual-resolution rendering, smoothed procedural cave, custom bitmap font) with no real weaknesses, just unremarkable box-approximation collision. GPT-5.5 and GLM land at the same mean quality through opposite tradeoffs: GPT-5.5 is fully offline-safe but shipped no audio, no persistence, a diagonal-speed bug, and only approximate cave collision; GLM has the most sophisticated collision response, the only audio, the only score persistence (among the original four), and the only enemies that shoot back, but leaks a Google Fonts dependency and redraws its entire cave every frame instead of caching it.

Price reshuffles that ordering hard. GLM's $0.03 buys 93% of Fable5's quality score at 4.6% of the cost — quality-per-dollar of ~144 vs ~7.2, making it the clear pick for anyone not chasing the absolute ceiling. DeepSeek is another ~176x cheaper than GLM and lands at 55% of GLM's quality, but its defect this round is more serious than the flappy-bird benchmark's DeepSeek finding: last time it was a five-minute CSS fix, this time the cave walls being non-lethal is a core-mechanic gap that requires writing real collision code, not a patch. Grok 4.5 sits in a sweet spot: at $0.20 it costs less than Fable5, GPT-5.5, or GPT-5.6 Sol while tying the best quality in the set, and unlike GLM/DeepSeek it ships a complete, polished, offline-safe game with no fatal mechanic gaps — making it the strongest overall pick this round on both quality and price. GPT-5.6 Sol matches Grok on quality but costs more than double for it (~$0.45 vs ~$0.20), landing it closer to GPT-5.5's value tier than Grok's despite the better code. If the axis is pure quality-per-dollar and the buyer can tolerate re-adding cave collision, DeepSeek still wins on raw economics; if the axis is "best game that's complete out of the box" at the best price, Grok 4.5 is the answer.

## Limitations

- n=1 per model, no re-rolls, no variance estimate. A single regeneration could move any score, especially DeepSeek's, since its main defect (missing cave collision) is a discrete miss rather than a graded quality difference.
- No real browser or manual playtest was performed for this benchmark — only a static code read and a Node `vm` frame-simulation smoke test. Nothing here confirms actual frame pacing, touch/gamepad input, how GLM's audio truly sounds, or how the games feel to play.
- "Spec fidelity" and "Polish" are disclosed aesthetic/completeness judgment, not measurements, unlike the collision-code and resize findings, which are read directly from source.
- The draw-call proxy counts raw canvas API calls, not GPU/CPU time; it's a rough relative signal, not a real profiling result.
