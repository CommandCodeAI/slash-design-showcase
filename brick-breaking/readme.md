# Brick Breaking: one prompt, ten models

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

> Create a complete single HTML file for a neon breakout / brick breaker game using Canvas. Neon cyberpunk aesthetic with glowing bricks, mouse or touch to move paddle, ball with trail effect, particle explosions on brick break, score, lives, start and game over screens. Make it visually striking with glow effects and smooth gameplay. Output only the full code.

## Models

| Model | Dir | Cost/gen | LOC |
|---|---|---:|---:|
| **Opus 5 (Anthropic)** | `opus-5/` | est. $0.26 (floor)‡ | 1243 |
| DeepSeek V4 Pro | `DeepSeek-V4-Pro/` | est. $0.0017 | 575 |
| DeepSeek V4 Pro | `DeepSeek-V4-Pro 0813/` | est. $0.00109 | 575 |
| Fable 5 (Claude) | `Fable-5/` | est. $0.60 | 546 |
| GLM 5.2 | `GLM-5.2/` | est. $0.03 | 592 |
| GPT-5.5 | `GPT-5.5/` | est. $0.35 | 400 |
| Kimi K3 | `Kimi-K3/` | est. $0.10 | 953 |
| GPT-5.6 Sol (OpenAI) | `GPT-5.6-sol/` | est. $0.52 | 768 |
| Gemini 3.6 Flash | `gemini-3.6-flash/` | est. $0.45 (~5 prompts) | 1311 |
| Gemini 3.6 Flash | `gemini-3.7-flash/` | est. $0.0063  | 1311 |
| Qwen3.8-27B | `Qwen3.8-27B` | est. $0.00492 | 1311 |
| Laguna S 2.1 | `laguna-s-2.1/` | not estimated§ | 931 |
| Ling 3.0 Flash | `ling-3.0-flash/` | not estimated§ | 669 |

‡ **Opus 5 cost, from the published rate card:** `claude-opus-5` bills **$5.00 / 1M input** and **$25.00 / 1M output** tokens. Using this table's existing convention (kept-file bytes ÷ 4 = output tokens, the same formula applied to Kimi K3 above): 41,395 bytes ÷ 4 = 10,349 tokens × $25/MTok = **$0.2587**. Like every other non-Gemini figure here this is a **one-shot floor** — output tokens for the kept file only, no input and no reasoning tokens, and Opus 5 runs adaptive thinking by default whose tokens bill as output but are invisible in the saved file. Real metered cost is higher.

## Method

Same benchmark harness as the other game benchmarks: one prompt, one shot per model, static read + playtest comparison.

**Scope of this revision (Opus 5 pass).** `opus-5/index.html` was read in full, all 1,243 lines, and every claim about it below is cited by line number. The other nine builds were **not** re-read line-by-line this round — their entries in the feature matrix come from mechanical greps across all files (external URLs, `localStorage`, `devicePixelRatio`, delta-time, mute/pause, substepping, `shadowBlur` vs. `filter`+`lighter`), which is factual but shallower than a full read. That asymmetry is why only Opus 5 carries a per-axis scorecard here: assigning 1–5 craft scores to builds I did not read would be inventing precision.

## Verified feature matrix

Mechanically checked across every build in this directory — presence/absence, not quality judgment.

| Build | Offline-safe | Best score saved | DPR | Delta-time | Substepped collision | Mute | Pause |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| **opus-5** | ✗ fonts | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ |
| DeepSeek-V4-Pro | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Fable-5 | ✓ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ |
| GLM-5.2 | ✓ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ |
| GPT-5.5 | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| GPT-5.6-sol | ✓ | ✗ | ✓ | ✓ | ✓ | ✗ | ✗ |
| Kimi-K3 | ✗ fonts | ✓ | ✓ | ✓ | ✗ | ✗ | ✓ |
| gemini-3.6-flash | ✗ fonts | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| laguna-s-2.1 | ✓ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ |
| ling-3.0-flash | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |

## Findings — Opus 5

- **It is the only build that renders real bloom instead of faking glow with `shadowBlur`.** Every other entry leans on canvas `shadowBlur` (6–25 call sites each). Opus 5 uses `shadowBlur` exactly twice, both for crisp overlay text (`opus-5/index.html:1153, 1167`). The actual glow comes from a **two-pass bloom pipeline**: the emissive scene is drawn a second time into an offscreen buffer at 0.34× resolution with fattened strokes and radii (`:296-299, 995-1143`), then composited back over the main canvas under `globalCompositeOperation='lighter'` at two blur radii — 7px and 22px — for a soft/tight halo pair (`:1188-1200`). This is the difference between a light that *bleeds* and a shape with a fuzzy outline, and on a prompt that asked to "make it visually striking with glow effects" it is the single biggest separator in the set.
- **The bloom degrades instead of breaking.** `ctx.filter` is feature-detected at boot by assigning `blur(2px)` and reading it back (`:301`); if the browser rejects it, the composite falls back to three offset `drawImage` passes at increasing scale and decreasing alpha (`:1195-1199`) — a cheaper approximation that still reads as glow. No other build has a fallback path for its visual effects.
- **Only Opus 5 and GPT-5.6 Sol substep the ball; the other eight can tunnel.** `stepBall()` subdivides each frame's motion into up to 10 substeps sized against the ball radius (`:834-836`), so a fast ball cannot skip through a brick between frames. The collision itself is closest-point circle-vs-AABB with a proper reflection normal (`:870-888`), including the degenerate case where the ball center ends up inside a brick — it falls back to minimum-penetration axis selection (`:881-885`) rather than producing a NaN normal. There is also an anti-stall guard forcing `|uy| ≥ 0.24` so the ball can never lock into a near-horizontal loop (`:893`).
- **Input arbitration is unusually careful.** Pointer and keyboard both drive the paddle, and `inputMode` tracks whichever device was used last (`:425, 676-694, 775-785`). A `pointermove` under 1px is ignored so mouse jitter cannot yank control from the keyboard (`:678`), and while under keyboard control `pointer.x` is kept synced to the paddle so the deck does not snap sideways when the mouse wakes up (`:782`). Keyboard movement is accelerated with an exponential-decay stop rather than binary on/off (`:776-780`).
- **Content depth is the widest here:** 8 named procedural brick patterns generated by predicate functions — `CHECKSUM`, `PYRAMID`, `CORE DIAMOND`, `FIREWALL`, `SINE ARRAY` and others (`:432-441`) — with row count and armour ramping by level (`:452-457`), multi-hit bricks that draw visible armour ribs (`:1018-1029`), 4 weighted power-up drops incl. multi-ball and time-dilation (`:526-561`), a chain/combo multiplier to ×8 (`:911-921`), 10 distinct synthesized SFX (`:390-402`), a mute toggle, pause on `P`/`Escape`, and auto-pause on window blur (`:720-723`).
- **It is not offline-safe — and neither are two builds the readme previously claimed were.** Opus 5 pulls Chakra Petch and JetBrains Mono from Google Fonts via three `<link>` tags (`:7-9`), making two external requests before first paint. Kimi K3 (`Kimi-K3/index.html:7-9`) and Gemini 3.6 Flash (`gemini-3.6-flash/index.html:7-9`) do the same with Orbitron/Rajdhani. All three degrade gracefully — each declares a full local fallback stack (Opus 5: `"Chakra Petch","Rajdhani","Segoe UI",system-ui`, `:19-20`) — so they still *run* offline, just not as designed. The other seven builds are genuinely self-contained.
- **It does not save the best score.** `best` is a plain variable (`:409`) written only in `gameOver()` (`:612`); there is no `localStorage` anywhere in the file. Close the tab and the record is gone. Kimi K3, Gemini 3.6 Flash, and Ling 3.0 Flash all persist theirs. This is the same gap Opus 5 has in the `subway-surfers` benchmark — a repeated blind spot across two separate generations, not a one-off. `bestCombo` is likewise tracked (`:409, 858`) but never displayed anywhere.

## Scorecard — Opus 5

1–5 per axis. Only Opus 5 is scored; see the Method note above for why.

| Axis | Score | Basis |
|---|:-:|---|
| Spec fidelity | 5 | Every clause of the prompt is present: neon cyberpunk, glowing bricks, mouse **and** touch paddle, ball trail, particle explosions, score, lives, start + game over screens |
| Glow / visual craft | 5 | Only real two-pass bloom in the set, with a feature-detected fallback |
| Collision | 5 | Substepped swept collision, correct normals, degenerate-case handling, anti-horizontal-lock guard |
| Architecture | 5 | Sectioned modules, delta-time loop with clamp, responsive `layout()` that re-places brick geometry on resize |
| Polish / features | 5 | 8 procedural levels, 4 power-ups, combo system, 10 SFX, mute, pause, blur auto-pause, level banners |
| Offline-safe | 2 | Three Google Fonts `<link>` tags; runs offline but not as designed |
| **Mean** | **4.50** | |

The 2 on offline-safety is the whole story of this build: it is the most technically accomplished entry in the directory on every axis that involves rendering or physics, and it fails the one constraint this repo applies to every demo. Both facts are load-bearing.

## Verdict

Ten implementations of the same neon breakout brief. Same pattern as the other game benchmarks: try the same prompt yourself with [Command Code](https://commandcode.ai) `/design` — [commandcode.ai/docs/slash-commands/design](https://commandcode.ai/docs/slash-commands/design) — and compare.

**Opus 5 is the strongest build in this directory on craft, and the clearest example of why a single constraint can outweigh craft.** It is the only entry that implements real bloom rather than `shadowBlur`, one of only two that substep collision to prevent tunneling, and by some distance the deepest in content — 8 procedural brick patterns, 4 power-ups, a combo multiplier, 10 SFX, mute, pause, and blur auto-pause. Nothing else here is close on rendering or physics. It then ships three Google Fonts `<link>` tags, breaking the one property this repo claims for every demo, and it forgets to persist the best score that three cheaper models remembered. If you want the best-looking breakout in this folder, it is this one — after you inline the fonts and add four lines of `localStorage`.

**Gemini 3.6 Flash** took a different path: the one-shot output from the prompt above wasn't playable, and it took 4-5 follow-up prompts to land a working build — the only model in this set that needed real iteration to get there. What it landed on is genuinely unique, though: falling coin power-ups dropped from broken bricks, including one that widens the paddle and one that boosts ball speed. Opus 5's drop system (wide deck, multi-ball, time-dilate, extra life) is the only comparable one, and it arrived in a single shot.

**On price, Opus 5 is mid-pack and better value than it looks.** Its ~$0.26 floor undercuts GPT-5.6 Sol ($0.52), Fable 5 ($0.60), and GPT-5.5 ($0.35) while shipping more than any of them, though DeepSeek V4 Pro (~$0.0017) and GLM 5.2 (~$0.03) remain in a different cost class entirely for anyone optimizing purely on spend.

## How to Play

- Move mouse to control paddle
- Click to launch ball / start / continue
- Break all bricks to win, don't let the ball fall

All demos are single HTML files. **Seven of the ten are fully offline-safe; three are not** — `opus-5`, `Kimi-K3`, and `gemini-3.6-flash` each load webfonts from Google Fonts (see the feature matrix). All three declare local fallback stacks, so they still run without a network, just with substituted typography. (An earlier revision of this readme claimed all demos were offline-safe; that was incorrect for those three.)

## Limitations

- n=1 per model, no re-rolls, no variance estimate.
- **Only `opus-5/index.html` was read in full this revision.** The other nine builds were checked mechanically (greps for external URLs, `localStorage`, DPR, delta-time, substepping, mute/pause, glow technique). Those results are factual, but no craft judgment was re-derived for them, which is why the scorecard covers Opus 5 only.
- No browser playtest or headless frame simulation was run this round. Claims about bloom, substepped collision, input arbitration, and frame-rate independence are read from source, not observed through play.
- Cost figures are not metered. All non-Gemini figures are one-shot floors from output bytes only; Opus 5's uses this table's bytes÷4 convention against the published $5/$25 per-MTok rate card and excludes billable thinking tokens. Laguna S 2.1 and Ling 3.0 Flash are deliberately unpriced.
