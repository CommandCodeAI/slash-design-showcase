# Car Racing Game: one prompt, one model

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

Create a complete single HTML file for a fun modern car racing game using HTML5 Canvas with a wide canvas (700x700). The game should have modern clean graphics with a bright blue detailed player car that has glowing headlights and taillights, red and yellow enemy cars, realistic road perspective with white dashed lines, textured asphalt, road borders, and scrolling scenery like grass, trees and city elements. Add particle tire smoke during drifting, sparks on collisions, dust, and glowing collectible coins. Implement realistic car physics including acceleration, deceleration, braking, smooth steering with momentum and realistic drifting when turning at high speed. The player controls the car using arrow keys or WASD with up to accelerate, down to brake or reverse, and left/right to steer. The road scrolls forward continuously, the player collects glowing coins for points and power-ups for temporary speed boost or shield, while avoiding or overtaking enemy cars coming from the front. Increase difficulty by adding more enemies and higher speed as the score rises. Show score at the top, a speedometer, and lives system. Include a nice start screen with title and press space to start, pause with P key, and game over screen with final score and restart option. Use requestAnimationFrame for smooth 60fps gameplay, add simple Web Audio API sound effects for engine, coin collect, and crash. Make the entire game polished, responsive, addictive, and visually satisfying. Forza Horizon style third-person view behind the car. make it as realistic as you can, like a real car game from every aspect


https://commandcode.ai/share/cc9422de

## Benchmark

| Metric | Kimi K3 |
|---|---|
| Prompts sent | 6 (build → continue → Forza chase-cam fix → car/road scale fix → 16:9 aspect ratio → off-track projection bug fix) |
| Output size (final) | 42,730 bytes / 1,061 LOC |
| Est. cost, floor (final file only) | ~$0.16 |
| **Est. cost, full session** | **~$0.97** |

Two numbers on purpose. The **floor** is the same formula used for kimi's cost elsewhere in this repo (final kept file's output bytes ÷ 4 × Kimi K3's $15/MTok output price) — it only counts the last file you'd actually keep, plus it ignores the 6 reference images attached to the first prompt entirely.

The **full-session estimate** reflects what this build actually involved, read back from the real conversation: this was the most rewrite-heavy session of the batch — the ~1,000-line file was fully regenerated with `write_file` at least three separate times beyond the initial build (the Forza chase-cam pass, the car/road scale-proportion fix, and the 16:9 aspect-ratio conversion), because a round of parallel `edit_file` calls silently raced and reverted each other, which then took a further debugging detour (grepping the file to diagnose which edits actually landed) before the fix was to just rewrite the whole file atomically each time. On top of that, nearly every turn from the Forza-view fix onward was verified with a real `agent-browser` session — open, dispatch key events, wait, screenshot, read the image back — often two rounds per turn. Modeling total output at ~5.8× the final code's size (reasoning + repeated full-file rewrites + heavy verification tooling) and input mostly at Kimi K3's cached rate ($0.30/MTok, with the first turn's images and long prompt at the cache-miss rate) gives ~$0.97 — a modeled estimate, not a metered bill, but by far the closest read of what this one actually cost.