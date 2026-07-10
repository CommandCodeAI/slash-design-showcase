Create a vertical Galaxy Shooter game as a single HTML file using Canvas. Portrait mobile style canvas (400x700). Player controls a cool blue futuristic spaceship at the bottom that moves left and right with arrow keys or on-screen touch buttons. The ship shoots lasers upward automatically or with tap/space. Enemies (colorful alien ships) come down from the top in formations. Destroy enemies and avoid their shots. Add glowing effects, particle explosions, and starfield background that scrolls down. Collect power-ups. Show score at the top, lives (hearts), and level. Include start screen and game over screen with restart. Make it fun, smooth, and visually vibrant like classic vertical shooters. Output only the full code.

## Models

| Model | Dir | Context | $/MTok in/out | LOC | Est. cost |
|---|---|---:|---:|---:|---:|
| Grok 4.5 | `grok/` | 500K | $2 / $6 | 1983 | ~$0.09 |
| GPT-5.5 | `chatgpt/` | 1.05M | $5 / $30 | 734 | ~$0.11 |
| Fable 5 (Claude) | `claude/` | 1M | $10 / $50 | 982 | ~$0.38 |

One prompt per model, no re-rolls. Cost is estimated from output size using published pricing, not a metered figure.

## Verdict

**Grok 4.5 wins, no contest.** It's the best game, the cheapest, and the only one I actually played end to end. It felt great. That tracks: Grok 4.5 is xAI's first model built specifically for coding and agentic work, trained alongside Cursor on real developer session data ([announcement](https://x.ai/news/grok-4-5)). This game is a small proof of that positioning.

**Grok 4.5.** Stayed on theme (dark space, alien ships, not a reskin). Five enemy archetypes, five formation patterns, scripted boss fights every fifth level. Real generative background music plus SFX. Saves high score across reloads. Uses a fixed-timestep loop, so it runs correctly on 90Hz and 120Hz phones instead of speeding up. Manual fire (tap/space) actually shortens the cooldown, so the "or" in the prompt means something.

**Fable 5 (Claude).** Reskinned the whole game into a daytime biplane game called "Sky Striker." Blue sky, clouds, a propeller plane instead of a futuristic ship, still not what was asked for. On the plus side it has the most mathematically exact collision detection of the three (true circle-circle checks) and the most robust touch controls (real DOM buttons plus drag-anywhere). But there's no working manual-fire path during play. It only auto-fires.

**GPT-5.5.** Stayed on theme but is the thinnest build. One enemy archetype reused for every wave, one fixed grid formation, no audio at all, and no score persistence. It also has a function called `circleRectHit` that never actually reads the circle's radius, so the name is a lie even though the collision still works fine as a padded box check.

## Scorecard

| Model | Spec fidelity | Collision | Polish | Mobile/touch | Mean | Cost | Quality/$ |
|---|:-:|:-:|:-:|:-:|:-:|---:|---:|
| Grok 4.5 | 5 | 4.5 | 5 | 4.5 | **4.75** | $0.09 | **~53** |
| Fable 5 | 3 | 5 | 4 | 5 | **4.25** | $0.38 | ~11 |
| GPT-5.5 | 4 | 3.5 | 2 | 3.5 | **3.25** | $0.11 | ~30 |

## Notes

- n=1 per model, no re-rolls. A regeneration could move any of this.
- Only Grok's build was actually played by hand. Claude's and GPT-5.5's builds were checked by reading the code and running a headless smoke test, not by playing them.
- Cost is a rough estimate (output bytes divided by 4, times the published output price per token), not billed usage.
