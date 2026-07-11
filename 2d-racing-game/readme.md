# 2D Racing Game: one prompt, three models

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

> Create a complete single HTML file for a fun top-down car racing game using HTML5 Canvas with a 700x700 canvas size. The game should have modern clean graphics with a bright blue player car that has glowing headlights and smooth detailed look, red and yellow enemy cars, a detailed scrolling road with white dashed lines and textured borders, grass or city background on the sides, particle tire smoke when drifting, sparks on collisions, and glowing collectible coins. Implement realistic car physics including acceleration, deceleration, braking, turning with momentum and slight drifting when turning at high speed. The player controls the car using arrow keys or WASD with up to accelerate, down to brake or reverse, and left/right to steer. The road scrolls forward continuously, the player collects glowing coins for points and power-ups for temporary speed boost or shield, while avoiding or overtaking enemy cars coming from the front. Increase difficulty by adding more enemies and higher speed as the score rises. Show score at the top, a speedometer, and lives system. Include a nice start screen with title and press space to start, pause with P key, and game over screen with final score and restart option. Use requestAnimationFrame for smooth 60fps gameplay, add simple Web Audio API sound effects for engine, coin collect, and crash. Make the entire game polished, responsive, addictive, and visually satisfying. Output only the full working HTML code with everything inline.

## Models

| Model | Dir | Cost/gen | LOC |
|---|---|---:|---:|
| Grok 4.5 (xAI) | `Grok-4.5/` | $0.4000 | 1055 |
| Fable 5 (Claude) | `Fable-5/` | $0.6500 | 872 |
| GPT-5.6 Sol (OpenAI) | `GPT-5.6-sol/` | $0.5000 | 658 |

Single generation per model, one prompt, no re-rolls. Costs are **not metered**: Fable 5 reuses the user-reported cost from the pixel-art-space-shooter benchmark (a similar-sized file); GPT-5.6 Sol and Grok 4.5 are rough estimates from published API pricing (GPT-5.6 Sol $5/$30, Grok 4.5 $2/$6 per 1M tokens) applied to each file's output length, plus `/design` overhead. Treat the two new-model costs as approximate.

## Method

**Static read:** all 2,585 lines read directly, no skimming. Every claim below is cited by file and line number.

**Manual playtest:** all three were actually played by the user, not just read. Car speed, crash behavior, scoring, smoothness, and overall feel were evaluated through real gameplay with keyboard controls. The gameplay ranking below comes directly from that playtest.

## Findings

- **Gameplay feel, ranked by actual playtest: Grok 4.5 (9/10) > Fable 5 (8/10) > GPT-5.6 Sol (6/10).** Grok wins on smoothness. Its steering ramps progressively via `player.steer += (rawSteer - player.steer) * 0.16` (`Grok-4.5/index.html:306`) instead of snapping instantly, acceleration tapers near top speed via a `speedHeadroom` clamp, and crashes trigger a directional spin (`crashSpin`, `Grok-4.5/index.html:392`), lateral kick (`crashKick`, `:393`), and screen flash. Fable 5 is close but simpler: instant steering application (`Fable-5/index.html:286`), no crash spin or kick, and a higher drift threshold so the car grips more. GPT-5.6 Sol nailed the UI but the gameplay was poor: unnecessary drifting and too much friction.
- **GPT-5.6 Sol has the best UI in the set, by a wide margin.** It's the most feature-dense file per line (658 LOC) and the only one genuinely playable on phones. It ships a combo/overtake system with score multipliers and a live on-screen counter, persistent skid marks rendered on the road, radial-gradient coins with an embossed glyph, eight-pointed rotating star powerups, an arc-gauge speedometer, hearts for lives, pause-on-window-blur, gradient-filled car bodies with a `lighten()` helper, and a boost flame trail. Its responsive game shell (rounded corners, inset glow, backdrop-filter blur) and auto-appearing touch buttons on coarse-pointer devices (`GPT-5.6-sol/index.html:651`) are the only implementation of the prompt's "responsive" requirement. On pure visual and UX polish, GPT-5.6 Sol is the clear champion.
- **GPT-5.6 Sol's gameplay problem is in the math, and it directly contradicts the prompt's "slight drifting."** It stacks two lateral forces at speed: base steering `steer * 440 * (.32 + n*.9)` (`GPT-5.6-sol/index.html:296`) plus an extra `drift * 105` above 52% of max speed (`:300`). The double-dose over-shoots "slight," then `Math.pow(.0018, dt)` (`:306`) yanks the car back, creating a jerk-slide-jerk oscillation instead of smooth momentum. Combined with a larger car hitbox (58x108 vs Fable's 40x72) and tight 13px collision padding, crashes feel frequent and unfair.
- **All three ship audio; none persists best score.** Each synthesizes engine, coin, powerup, and crash SFX via Web Audio API with a continuous engine oscillator that pitches up with speed. Grok's crash is the most elaborate: a bandpass-filtered noise buffer for metallic impact plus a dual-tone thump (`Grok-4.5/index.html:140-148`). Fable 5 and Grok 4.5 track `best` in memory only (`Fable-5/index.html:264`, `Grok-4.5/index.html:280`), so it resets on reload. GPT-5.6 Sol doesn't track a best score at all.
- **All three are offline-safe and CSS-resize-only.** System font stacks, no network requests. All use `aspect-ratio: 9/16` CSS for responsive sizing with no JS resize listener and no DPR handling, so all render slightly soft on retina screens. All three deviated from the spec's 700x700 square canvas in favor of portrait, which is the better choice for a top-down racer.
- **Grok 4.5 has the richest atmosphere: a winter elevated-bridge theme** with falling snow, parallax skyline, a river visible below the deck, overhead gantries with route signs, and glowing guard-rail posts. Fable 5 goes grass-and-rumble-stripe highway with scattered bushes. GPT-5.6 Sol is a green grass scene with trees, lamps, and buildings. Grok is the longest file (1,055 LOC) and spends it on environmental detail; GPT is the shortest but the most feature-dense per line.

## Scorecard

1-5 per axis, single sample per model (no re-rolls). Gameplay/physics axis weighted by the user's manual playtest.

| Model | Spec fidelity | Physics/feel | Collision | Architecture | Polish/UI | Offline-safe | **Mean** | Cost | **Quality/$** |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|---:|---:|
| Grok 4.5 | 5 | 5 | 4 | 4.5 | 4.5 | 5 | **4.67** | $0.4000 | ~11.7 |
| Fable 5 | 5 | 4 | 4 | 4 | 4 | 5 | **4.33** | $0.6500 | ~6.7 |
| GPT-5.6 Sol | 4 | 2 | 2.5 | 3.5 | 5 | 5 | **3.67** | $0.5000 | ~7.3 |

## Verdict

On gameplay feel, the user's playtest was decisive: **Grok 4.5 (9/10) > Fable 5 (8/10) > GPT-5.6 Sol (6/10)**. Grok 4.5 wins on the strength of its progressive steering, tapered acceleration, and satisfying crash response (spin, kick, flash). Fable 5 is close behind with solid momentum physics but a simpler feel (no progressive input, no crash spin). GPT-5.6 Sol has hands-down the best UI in the set, a combo system, skid marks, mobile touch controls, and the most polished shell, but its physics are genuinely poor: the double lateral force at speed creates excessive drift and the aggressive friction creates a twitchy, unfair feel that directly contradicts the prompt's "slight drifting" requirement.

On quality-per-dollar, Grok 4.5's ~$0.40 buys the best gameplay at a low cost (~11.7 quality/$). GPT-5.6 Sol (~$0.50) and Fable 5 (~$0.65) land closer on raw quality/$ (~7.3 and ~6.7), but GPT's number is misleading: its excellent UI inflates the mean while its gameplay, the axis that matters most for a racing game, scores just 2/5. Gameplay feel is what makes a racing game addictive, and on that axis GPT is last by a wide margin despite leading on polish. If the axis is quality-per-dollar, **Grok 4.5** wins; if it's best gameplay, **Grok 4.5** still wins; if it's best UI polish specifically, **GPT-5.6 Sol** wins that single axis but loses the game.

## Limitations

- n=1 per model, no re-rolls, no variance estimate. A single regeneration could move any score, especially GPT-5.6 Sol's physics, since its defect is a tuning problem (wrong constants) rather than a structural gap.
- The gameplay ranking comes from a real manual playtest by the user, which is stronger evidence than the static-only reads in the subway-surfers and pixel-art-space-shooter benchmarks. However, it's still one player's subjective feel, not a controlled study.
- Cost figures are not metered. Fable 5 reuses a user-reported cost from a prior benchmark; GPT-5.6 Sol and Grok 4.5 are estimates from published per-token API pricing. The Quality/$ column inherits this uncertainty.
- "Spec fidelity," "Physics/feel," and "Polish/UI" are disclosed judgment, not measurements, unlike the touch-input, persistence, and offline-safety findings, which are read directly from source.
