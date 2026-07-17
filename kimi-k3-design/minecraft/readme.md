# Minecraft-Style Voxel Game: one prompt, one model

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

Build a playable Minecraft-style voxel sandbox game as a browser-based web app using JavaScript + Three.js (WebGL). Focus on a fun, performant core experience that captures the essence of Minecraft. Prioritize playability and core loop first. Must-Have Core Features (Implement These Completely): Chunk-based procedural world (16x16x128 chunks) using Perlin/Simplex noise for terrain. Dynamic loading/unloading around the player (render distance 6-8 chunks). Basic biomes (plains, forest, hills) with trees and surface variation. Seed-based generation. Voxel block system with 15-25 core blocks (grass, dirt, stone, wood, planks, leaves, sand, water, ores, crafting table, torch, etc.). Properties: solid/transparent, break time (tool-dependent), gravity for sand/gravel. Use texture atlas and face culling for efficient chunk meshes. First-person player: WASD + mouse look (Pointer Lock), jumping, gravity, block collision. Break blocks (left click) and place blocks (right click) with raycasting. Hotbar (1-9 keys) + basic inventory screen (E key). Survival mode basics: Health/hunger, day/night cycle with sky lighting, simple mob spawning at night. Creative mode toggle: Flying, instant break/place, unlimited blocks. Crafting: 2x2 inventory + 3x3 crafting table with 15+ basic recipes (tools, planks, sticks, torches, basic pickaxes/axes/swords). Tools: Wooden/stone versions with durability. Different mining speeds. Saving: Local storage for player position, inventory, and modified chunks. UI: Crosshair, hotbar, health/hunger bars, debug info (coords/FPS). Technical Priorities: Smooth 60 FPS performance with chunk mesh updates only on changes. Basic lighting (sky + block lights like torches). Block highlighting on hover. Modular code structure (World, Chunk, Player, Renderer, Input, etc.). Nice-to-Have (Add After Core Works Well): More biomes, caves, better trees. 4-5 simple mobs (passive animals + 1-2 hostile with basic AI). Furnace smelting, chests, basic redstone (levers/doors). Hand animation, particles for breaking, simple sounds. Make it fully runnable from a single index.html (or small set of files). Include texture descriptions or free asset URLs. Provide complete code with comments, controls list, and extension notes. Start minimal and build up — ensure breaking/placing blocks and movement feel satisfying first.


https://commandcode.ai/share/eec73097

## Benchmark

| Metric | Kimi K3 |
|---|---|
| Prompts sent | 9 (build, continues, rename, and debugging follow-ups) |
| Output size (final) | 146,580 bytes / 3,527 LOC (`index.html` + `js/*.js` + `serve.js`; excludes the vendored `three.min.js`) |
| Est. cost, floor (final file only) | ~$0.55 |
| **Est. cost, full session** | **~$2.90** |

Two different numbers on purpose. The **floor** is the same formula used for kimi's cost elsewhere in this repo (final kept file's output bytes ÷ 4 × Kimi K3's $15/MTok output price) — it only counts the last file you'd actually keep, ignoring everything it took to get there.

The **full-session estimate** accounts for what this build actually involved, read back from the real conversation: several files were fully rewritten 2–3 times each (a parallel-edit race destroyed an earlier round of fixes and forced a full rewrite of `index.html`, `world.js`, and `main.js`; `textures.js` was corrupted and repaired twice), the reasoning/planning text alone ran several thousand words before the first file was even written, and there was a long debugging chain (a terrain-generation bug traced through hypotheses, greps, live `eval`s, and screenshot comparisons) plus an `agent-browser` test session. Modeling total output at ~4.2× the final code's size (reasoning + rewrites + tool-call text) and input mostly at Kimi K3's cached rate ($0.30/MTok, since most of it was re-sent prior context) gives ~$2.90 — still a modeled estimate, not a metered bill, but a much closer read of what this one actually cost than the floor above.