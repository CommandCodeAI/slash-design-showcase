# First-Person Shooter: one prompt, one model

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

Create a fun, complete first-person shooter game in the browser using JavaScript and Three.js. Make it playable right away with good gun feel, responsive controls, and satisfying combat.
Main Features:

Smooth first-person movement (WASD, mouse look, jump, sprint) with Pointer Lock.
Shooting system: Multiple weapons (pistol, rifle, shotgun, sniper) with recoil, different fire rates, ammo, and reload. Left click to shoot, R to reload, number keys to switch.
Enemies: Several types that chase, shoot, or attack the player. Include health, death effects, and basic AI.
Levels: 3-4 arenas or waves. Clear enemies to progress. Health pickups and ammo around the map.
Core Mechanics: Player health, score system, hit feedback (screen shake, particles, sounds), crosshair, HUD (health, ammo, score).
Polish: Muzzle flashes, bullet impacts, simple lighting, background music, and sound effects.

Keep the code clean and modular. Focus on making shooting and movement feel great first. Add win/lose screens, high score saving, and pause menu. Provide full code + instructions to run it.

https://commandcode.ai/share/db311126

## Benchmark

| Metric | Kimi K3 |
|---|---|
| Prompts sent | 5 (build → "make it real" texture/lighting overhaul → enemy-AI/mech-model/gun-feel overhaul → gun texture & ADS-zoom fix → hit-registration & ADS-obstruction fix) |
| Output size (final) | 150,497 bytes / 4,059 LOC (`index.html` + `css/style.css` + `js/*.js`; excludes the vendored `three.module.min.js`) |
| Est. cost, floor (final file only) | ~$0.56 |
| **Est. cost, full session** | **~$2.10** |

Kimi K3's real rate card, verified against current published pricing (not assumed): **$3.00/MTok input, $0.30/MTok cached input, $15.00/MTok output**. The **floor** uses the same formula as kimi's other entries in this repo — final kept output bytes ÷ 4 × the $15/MTok output price — so it only counts the code you'd actually keep, ignoring everything it took to get there.

The **full-session estimate** comes from an actual structural audit of the transcript rather than a multiplier borrowed from this repo's other Kimi K3 docs (an earlier pass of this readme guessed ~6.8× by pattern-matching against `car-game`'s 5.8×, which wasn't rigorous and has since been corrected). What the audit actually found, tallied by category:

| Source | Est. bytes | Basis |
|---|---:|---|
| Final kept code | 150,497 | exact, `wc -c` |
| Superseded full-file rewrites | ~36,000 | `world.js`, `enemies.js`, `weapons.js` each fully regenerated via `write_file` twice — once in the initial build, once wholesale for the "make it real" pass / the "stop looking like Roblox" mech-and-gun rebuild — plus one rejected `.commandcode/taste.md` write |
| `edit_file` diffs | ~33,000 | ~70 edits tallied across all 5 turns, including a 7-edit parallel-race redo on `config.js`'s theme table (four simultaneous edits silently clobbered each other, leaving one survivor) and 6 separate live iterations of the ADS sight position before the reticle lined up with the crosshair |
| `shell_command` / `agent-browser` eval payloads | ~50,000 | ~125 calls tallied, heaviest during the cover-AI debugging and the hit-registration bug hunt (a genuine Three.js r168 quirk — `Raycaster` silently skips `visible = false` meshes — found by building raw `THREE.Raycaster` instances by hand and comparing hit counts) |
| `todo_write` payloads | ~7,000 | ~10 calls |
| Reasoning/planning text | ~154,000 | rough word-count reconstruction of the `[REASONING]` blocks across 5 turns — this is the least precise line item since it's not something I can re-tokenize exactly from a pasted transcript |

That totals ~430,000 bytes of assistant output, a **~2.9× multiplier** on the final code — not 6.8×. Rounding up slightly to ~3.0× (manual reconstruction from a huge transcript tends to undercount rather than overcount) gives ~112,900 output tokens × $15/MTok ≈ **$1.69**, plus an estimated $0.35–0.40 of input across the session (mostly cached context at $0.30/MTok, with each turn's genuinely new content at the $3/MTok fresh rate) for a **total of ~$2.10**. Still a modeled estimate, not a metered bill — I don't have access to this session's actual token usage — but it's now grounded in a category-by-category count of the real transcript instead of an eyeballed multiplier.
