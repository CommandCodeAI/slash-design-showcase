# Subway Surfers: one prompt, seven models

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

## Prompt

> Create a fun endless runner game like Subway Surfers as a single HTML file using Canvas. Vertical canvas (400x700 or similar portrait mode), character runs automatically forward, swipe or space to jump, down arrow to slide. Collect coins, avoid obstacles like barriers and trains. Nice colorful city visuals with scrolling background, score based on distance, game over screen with restart. Keep it simple but visually appealing. Output only the full code.

## Models

| Model | Dir | Cost/gen | LOC |
|---|---|---:|---:|
| **Opus 5 (Anthropic)** | `opus-5/` | ~$0.37 (floor)‡ | 1360 |
| Fable 5 (Claude) | `Fable-5/` | $0.6000 | 672 |
| GPT-5.5 (ChatGPT) | `GPT-5.5/` | $0.7000 | 1423 |
| GPT-5.6 Sol (OpenAI) | `GPT-5.6-sol/` | $0.3265† | 1501 |
| Grok 4.5 (xAI) | `Grok-4.5/` | $0.4000 | 1326 |
| Gemini 3.6 Flash (Google) | `gemini-3.6-falsh/` | not estimated§ | 1465 |
| Kimi K3 (Moonshot AI) | `Kimi-K3/` | ~$0.12 (floor)* | 862 |


## Method

**Static read:** all 7,847 lines read directly, no skimming. Every claim below is cited by file and line number.

**No browser or `vm` playtest this round.** Unlike the flappy-bird benchmark (manual playtest + Node `vm` frame sim) and the pixel-art-space-shooter benchmark (`vm` smoke test), these were not run in a real browser or a headless shim. Findings on collision, resize, audio, and persistence are read directly from source, not observed through play. Treat them as static-analysis findings, not gameplay reports.

## Findings

- **Opus 5 ships the only true 3D pipeline.** Every other entry layers 2D sprites or projects points ad hoc. Opus 5 defines a real camera (`FOV`, `CAMY`, `CAMBACK`, `opus-5/index.html:61-79`), projects world→screen through `px()`/`py()`, renders solid geometry via a `box()`/`q3()` quad layer with per-face shading and camera-facing side selection (`opus-5/index.html:110-144`), and composites the whole world through a **painter's-algorithm depth sort** each frame (`opus-5/index.html:1300-1312`). It is also the only entry with **distance fog** (`fogAmt`/`fmix`, `opus-5/index.html:95-106`), which is what makes its horizon read as depth rather than as a flat gradient.
- **Opus 5 is the only frame-rate-independent build.** It runs a fixed 120 Hz physics accumulator with a spiral-of-death guard (`opus-5/index.html:1336-1350`), so gameplay speed is identical on 60 Hz and 144 Hz. Gemini 3.6 Flash is the opposite extreme: its `gameLoop()` calls `update()` with no delta time at all (`gemini-3.6-falsh/index.html:1421-1425`) and every duration is counted in frames — `gameSpeed += 0.003` per frame, `slideTimer = 35`, powerups at `300`/`400` (`:939, 826, 1019-1027`). On a 144 Hz display that game runs ~2.4× too fast.
- **Opus 5 is the only entry with game-feel affordances from the platformer canon:** a 0.16 s jump buffer and 0.12 s coyote window (`opus-5/index.html:562-570`), so a jump pressed slightly early or slightly late still fires. No other build has either. It also adds an air-dive (slide while airborne slams `vy` down, `:402`), landing squash, lean-into-turn tilt, camera lateral follow, screen shake, radial speed lines, and a vignette.
- **Collision: Opus 5 has the most complete hit model; Gemini has the loosest.** Opus 5 tests each obstacle across its **full z-span** (`o.z > 22 || o.z + o.len < -22`, `opus-5/index.html:602-615`), gives barriers, slide-gates, and trains separate rules, shrinks the player hitbox to `PL_SH` while sliding, and — uniquely — resolves **train roofs as standing surfaces** so you can ride a train and collect the coin line along its top (`:577-597`). Gemini tests only `Math.abs(obj.z - PLAYER_Z) < 50` (`gemini-3.6-falsh/index.html:1001`) — a fixed ~100-unit window at the object's **front edge** — while its trains are 400–500 units long (`:735, 752`), so the body behind that window is not evaluated. The original four remain correct: lane-snap + height-threshold (Fable 5 `Fable-5/index.html:251`, Grok 4.5 `Grok-4.5/index.html:404`) and box/depth-window AABB (GPT-5.5 `GPT-5.5/index.html:556-557`, GPT-5.6 Sol `GPT-5.6-sol/index.html:489`).
- **Opus 5 does *not* persist the best score — the one axis where it loses.** `best` and `bestCoins` live in plain variables (`opus-5/index.html:221, 646`) with no `localStorage` anywhere in the file, so the best score resets on reload. GPT-5.6 Sol (`GPT-5.6-sol/index.html:118,316`), Gemini (`gemini-3.6-falsh/index.html:590, 1090`), and Kimi K3 all persist. Fable 5 (`Fable-5/index.html:206`) and Grok 4.5 (`Grok-4.5/index.html:282`) also keep `best` in memory only; GPT-5.5 tracks no best score at all. This is a genuine regression against the three that got it right, and it is the first thing to fix in this build.
- **Opus 5 and Gemini are the only two with a mute toggle; Opus 5 is the only one with pause.** Opus 5 synthesizes 8 SFX including filtered-noise slide and crash (`opus-5/index.html:190-199`), and draws its own canvas sound/pause buttons with vector icons (`icoBtn`, `:1110-1133`) wired to `M`/`P`/`Escape` plus hit-testing (`:417-429, 436-443`). It also **auto-pauses on window blur** (`:461`) — no other entry does. Gemini ships 5 SFX and a DOM mute button (`gemini-3.6-falsh/index.html:388, 1446-1451`). Fable 5 has 3 SFX (`Fable-5/index.html:47`), Grok 4.5 has 5 (`Grok-4.5/index.html:77`), neither GPT constructs an `AudioContext`.
- **Resize: Opus 5 is now the strongest, Gemini the weakest.** Opus 5 caps DPR at 3 for crisp text on phones without over-allocating on 4× panels, listens to both `resize` **and** `orientationchange`, and preserves 400:700 by scaling with `Math.min(innerWidth/W, innerHeight/H)` (`opus-5/index.html:41-55`). GPT-5.6 Sol has a real aspect-preserving resize listener (`GPT-5.6-sol/index.html:1494`) but no DPR cap. Gemini pins a fixed 1200×900 backing store with **no DPR handling and no resize listener at all** (`gemini-3.6-falsh/index.html:583-587`), relying purely on CSS `max-width/max-height`. Fable 5 and Grok 4.5 are CSS-only; GPT-5.5 stretches its backing store off-aspect.
- **Gemini is the only entry that ignores the prompt's canvas orientation.** The prompt asks for a "Vertical canvas (400x700 or similar portrait mode)". Gemini ships **1200×900 landscape, 4:3** (`gemini-3.6-falsh/index.html:580-581, 30-32`) — not portrait, not close to it. Its build is otherwise the most feature-rich of the non-Opus entries: magnet / jetpack / 2× multiplier power-ups with live progress bars (`:915-933`), magnet coin-attraction (`:995-998`), ramps onto train roofs (`:1031-1035`), and a genuinely handsome glassmorphism DOM UI. But it answers a different question than the one asked.
- **Grok 4.5 still has the best character animation:** variable gravity (`Grok-4.5/index.html:107,331`), jointed limbs with bending knees/elbows across three poses (`drawLimb`, `:866`), landing squash, camera bob, speed lines, plus a `roundRect` polyfill (`:42-43`). Opus 5's runner is close behind — per-leg hip/knee/foot IK with far-leg-first draw order, phase-offset arm swing, backpack strap geometry, and a distinct slide pose (`opus-5/index.html:939-1055`) — and unlike Grok's it is drawn under a perspective scale so it shrinks correctly with depth.
- **GPT-5.6 Sol keeps the cleanest of the original four** via a `STATE` enum, a full helper layer, and a `worldToScreen()` that bends the track with a sine of distance. GPT-5.5 is the only one with on-screen touch buttons, but at 1,423 LOC ships the fewest features and no DPR handling. **All seven are fully offline-safe** — system fonts only, zero network requests, verified by grep for `http(s)://`, `fetch(`, `XMLHttpRequest`, `@import`, and `cdn` across every file.

## Scorecard

1–5 per axis, single sample per model (no re-rolls).

| Model | Spec fidelity | Collision | Architecture | Resize robustness | Polish | Offline-safe | **Mean** | Cost | **Quality/$** |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|---:|---:|
| **Opus 5** | 5 | 5 | 5 | 5 | 5 | 5 | **5.00** | ~$0.37‡ | ~13.7 |
| GPT-5.6 Sol | 5 | 4 | 5 | 5 | 4.5 | 5 | **4.75** | $0.3265 | ~14.5 |
| Grok 4.5 | 5 | 4 | 4.5 | 3.5 | 5 | 5 | **4.50** | $0.4000 | ~11.3 |
| Fable 5 | 5 | 4 | 4.5 | 3.5 | 4 | 5 | **4.33** | $0.6000 | ~7.2 |
| GPT-5.5 | 5 | 4 | 3.5 | 3 | 4 | 5 | **4.08** | $0.7000 | ~5.8 |
| Gemini 3.6 Flash | 2.5 | 3 | 4 | 2 | 4.5 | 5 | **3.50** | not estimated§ | — |

> **A 5.00 mean is not "flawless" — it means Opus 5 topped these six axes, and persistence is not one of them.** This scorecard was defined before Opus 5 was added and has no persistence axis; adding one would score Opus 5 a 2 (in-memory best only) against GPT-5.6 Sol's and Gemini's 5, and on a 7-axis mean **GPT-5.6 Sol would edge ahead, 4.79 to 4.57**. The axes are left unchanged so scores stay comparable to the original four-model run, but the gap is real — see Findings and Limitations. Kimi K3 is still not scored on these axes (carried over from the previous revision).

## Verdict

On quality: **Opus 5 > GPT-5.6 Sol > Grok 4.5 > Fable 5 > GPT-5.5 > Gemini 3.6 Flash**.

**Opus 5 wins outright, and the margin is a category difference rather than a points difference.** It is the only entry that renders a real projected 3D world with depth-sorted geometry and distance fog instead of layered 2D; the only one whose physics are frame-rate independent; the only one with jump-buffer and coyote-time forgiveness; the only one that resolves train roofs as standing surfaces; the only one with pause, blur-auto-pause, and a canvas-drawn control bar; and it has both the widest resize coverage (DPR cap + `orientationchange`) and the largest SFX set. On UI and UX specifically — the thing the eye actually lands on — nothing else here is close: the fog-graded skyline, the vignette, the speed lines that fade in with velocity, the squash-and-stretch on landing, the pulsing menu, and the eased game-over panel are a coherent art direction rather than a pile of effects.

**The caveat, stated plainly: Opus 5 does not save your best score.** No `localStorage` anywhere in the file — close the tab and the record is gone. GPT-5.6 Sol, Gemini, and Kimi K3 all got this right, and it is a handful of lines to fix. If you ship this build, fix that first. It is the only axis on which Opus 5 is beaten by anything in this table.

**On price, Opus 5 is competitive but not the cheapest.** `claude-opus-5` bills $5.00/$25.00 per 1M input/output tokens, putting the 51,282-byte artifact at a **~$0.37 floor** — slightly above GPT-5.6 Sol's exactly-computed $0.3265 and below Grok 4.5's $0.40, Fable 5's $0.60, and GPT-5.5's $0.70. That yields ~13.7 quality-per-dollar against Sol's ~14.5, so **GPT-5.6 Sol still edges out the best value while Opus 5 takes the best game** — and Opus 5's figure is a *floor*, since adaptive thinking bills as output tokens that the saved file cannot reveal. Kimi K3's ~$0.12 floor remains the cheapest number on the page but sits outside the six-axis scorecard.

The rest hold their previous positions. Grok 4.5 is still the pick for a different *feel* — variable gravity, jointed-limb animation, richest atmosphere. Fable 5 stays the efficient middle at 672 LOC for anyone who wants the least code to audit. GPT-5.5 is dominated on every axis except its on-screen touch buttons. **Gemini 3.6 Flash lands last on the scorecard despite being the most feature-rich non-Opus entry** — power-ups, magnet attraction, ramps, and a polished glassmorphism UI — because it shipped 1200×900 landscape against a prompt that explicitly asked for portrait, has the loosest collision window, no resize or DPR handling, and frame-counted physics that run ~2.4× fast on a 144 Hz display. Judged as a game it is fun; judged against *this* prompt it answered a different one.

## Limitations

- n=1 per model, no re-rolls, no variance estimate. A single regeneration could move any score.
- No real browser playtest or Node `vm` frame simulation was run this round, only a static code read. Nothing here confirms actual frame pacing, touch/swipe feel, that the audio truly plays, or how the seven games feel to play. Collision, resize, and frame-rate findings are read from source, not observed through play — including the claim that Opus 5's fixed-step loop is frame-rate independent and Gemini's is not.
- **Opus 5 tops the scorecard while failing an axis the scorecard does not contain.** The six axes predate this revision and omit persistence; Opus 5 has no `localStorage` and would score a 2 there. On a 7-axis mean GPT-5.6 Sol would lead 4.79 to 4.57. The 5.00 means "best on these six", not "no defects" — see the note under the scorecard.
- Cost figures are not metered. Fable 5 reuses a user-reported cost from a prior benchmark; GPT-5.5 and Grok 4.5 are rough estimates from published per-token API pricing applied to output length; GPT-5.6 Sol's is computed exactly from its real rate card against the actual kept file size; Kimi K3's is a formula-derived floor; **Opus 5's is derived from the published $5/$25 per-MTok rate card applied to the kept file's byte count at an assumed ~3.5 chars/token, and is a floor that excludes billable thinking tokens** (see notes above each). Gemini 3.6 Flash is deliberately unpriced. The Quality/$ column inherits whichever precision its cost has — GPT-5.6 Sol's ratio remains the most reliable; treat Opus 5's, GPT-5.5's, and Grok 4.5's as approximate.
- "Spec fidelity" and "Polish" are disclosed aesthetic/completeness judgment, not measurements, unlike the collision, persistence, resize, frame-timing, and offline-safety findings, which are read directly from source. Gemini's low spec-fidelity score rests on one objective fact (landscape 1200×900 vs. a prompt asking for portrait); the rest of that axis is judgment.
