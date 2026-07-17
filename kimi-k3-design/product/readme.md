# Product Landing Page: one prompt, one model

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

Generate a jaw-dropping 3D-focused single-file HTML landing page for a wireless earbuds product "NEXUS Audio". Tailwind + Three.js (CDN).   
                                                                                                                                                      
  Hero: Large interactive 3D model of the earbuds in the center that users can rotate, zoom, and change colors in real-time.                          
                                                                                                                                                      
  Sections:                                                                                                                                           
  - Feature highlights with cards that lift into 3D on hover                                                                                          
  - Sound visualization demo (canvas particles reacting to fake audio)                                                                                
  - Comparison table with smooth animations                                                                                                           
  - User testimonials with 3D avatar spheres                                                                                                          
  - Buy section with urgency elements                                                                                                                 
                                                                                                                                                      
Ultra-modern dark theme, glassmorphism, high-end product photography mixed with 3D. Extremely detailed 3D interactions. Provide complete HTML file. 


https://commandcode.ai/share/1f7f6345

## Benchmark

| Metric | Kimi K3 |
|---|---|
| Prompts sent | 2 (build + verification/continue) |
| Output size (final) | 51,002 bytes / 961 LOC |
| Est. cost, floor (final file only) | ~$0.19 |
| **Est. cost, full session** | **~$0.78** |

Two numbers on purpose. The **floor** is the same formula used for kimi's cost elsewhere in this repo (final kept file's output bytes ÷ 4 × Kimi K3's $15/MTok output price) — it only counts the last file you'd actually keep.

The **full-session estimate** reflects what actually happened inside that single "continue" turn, which hid far more work than the 2-prompt count suggests: the largest upfront design-reasoning pass of any build in this repo, then a real `agent-browser` verification pass — a local HTTP server, roughly ten screenshot round trips across every section, discovering that a *different, unrelated* process had hijacked the shared browser tab mid-verification (fixed by isolating an `--session`), and discovering a parallel `edit_file` race condition that silently clobbered two of three simultaneous edits (re-diagnosed with `grep`, then reapplied sequentially). No full-file rewrites were needed — just one big initial write plus several small targeted edits — but the verification tooling alone was substantial. Modeling total output at ~4.0× the final code's size and input mostly at Kimi K3's cached rate ($0.30/MTok) gives ~$0.78 — a modeled estimate, not a metered bill, but a much closer read of what this one actually cost than the floor above.